import { test, expect, type Page } from "@playwright/test";

async function open(page: Page, assessment = false) {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 008.*Across the connection/ }).click();
  if (assessment) await page.getByRole("button", { name: "Assessment 20 minutes.", exact: false }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
}
async function run(page: Page, device: string, command: string, target?: string, evidence = false) {
  await page.getByRole("tab", { name: /Investigate/ }).click();
  await page.getByRole("button", { name: device, exact: true }).click();
  if (target) await page.getByLabel("Destination IPv4", { exact: false }).fill(target);
  await page.getByRole("button", { name: command, exact: true }).click();
  if (evidence) await page.getByRole("button", { name: "Select output as evidence", exact: true }).click();
  return page.getByRole("region", { name: "Command output" });
}
async function collect(page: Page) {
  for (const host of ["PC-A", "PC-B"]) await run(page, host, "ipconfig", undefined, true);
  for (const sw of ["SW1", "SW2"])
    for (const cmd of ["show interfaces status", "show lacp internal", "show etherchannel summary"])
      await run(page, sw, cmd, undefined, true);
}
async function change(page: Page, mode: "active" | "passive") {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("Switch to configure").selectOption("SW2");
  await page.getByLabel("Local channel-group number").fill("1");
  await page.getByLabel("LACP mode to apply").selectOption(mode);
  await page.getByRole("button", { name: "Apply configuration change", exact: true }).click();
  await expect(
    page.getByText(
      mode === "active" ? /Current configuration version 1/ : "Initial configuration. No change recorded.",
    ),
  ).toBeVisible();
}
async function verify(page: Page) {
  await expect(await run(page, "SW1", "show etherchannel summary", undefined, true)).toContainText(
    "Bundled members: 2/2",
  );
  await expect(await run(page, "SW2", "show interfaces port-channel 1", undefined, true)).toContainText(
    "Members bundled: 2/2",
  );
  await expect(await run(page, "PC-A", "ping", "172.22.40.20", true)).toContainText("100 percent (5/5)");
  await expect(await run(page, "PC-B", "ping", "172.22.40.10", true)).toContainText("100 percent (5/5)");
}
async function submit(page: Page) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("01 / Root cause").selectOption("lacp-negotiation");
  for (const sw of ["SW1", "SW2"]) await page.getByLabel(sw, { exact: true }).check();
  await page.getByLabel("03 / Proposed remediation").selectOption("lacp-mode");
  await page.getByLabel("Why does the correction work?").selectOption("lacp-initiation");
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
  await expect(page.locator(".score")).toContainText("100");
  const solution = page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: /^Worked repair & verification$/ }) });
  await expect(solution).not.toHaveAttribute("open", "");
  await solution.locator("summary").click();
  await expect(solution.locator("pre")).toBeVisible();
  await page.getByText("Recorded configuration changes", { exact: true }).click();
  await expect(page.getByText("Version 1: SW2, channel-group 1, mode active", { exact: true })).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test("LACP practice: physical versus logical state, wrong trial, minimal repair, fresh verification and journal", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect(await run(page, "PC-A", "ping")).toContainText("0 percent (0/5)");
  await expect(await run(page, "SW1", "show interfaces status")).toContainText("physical carrier up");
  await expect(await run(page, "SW2", "show etherchannel summary")).toContainText("Po1(SD)");
  await noOverflow(page);
  const memberLabels = await Promise.all(
    ["Gi1/0/1", "Gi1/0/2"].map((text) => page.locator(".physical-link-label").filter({ hasText: text }).boundingBox()),
  );
  const [a, b] = memberLabels;
  expect(
    a && b && (a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y),
  ).toBeTruthy();
  const controls = (await page.locator(".topology-bundle .react-flow__controls").boundingBox())!;
  for (const node of await page.locator(".topology-bundle .network-device").all()) {
    const box = (await node.boundingBox())!;
    expect(
      controls.x + controls.width <= box.x ||
        box.x + box.width <= controls.x ||
        controls.y + controls.height <= box.y ||
        box.y + box.height <= controls.y,
    ).toBe(true);
  }
  await page.screenshot({ path: info.outputPath("etherchannel-topology.png"), fullPage: true });
  await collect(page);
  await change(page, "passive");
  await expect(await run(page, "PC-A", "ping")).toContainText("0 percent (0/5)");
  await change(page, "active");
  await noOverflow(page);
  for (const b of await page.locator(".repair-trial button").all())
    expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: info.outputPath("etherchannel-repair.png"), fullPage: true });
  await page.reload();
  await verify(page);
  await submit(page);
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  await expect(page.locator(".preview")).toContainText("Bidirectional communication: successful");
  await noOverflow(page);
  await page.reload();
  await page.getByRole("button", { name: "Your journal" }).click();
  const entry = page.locator(".journal-entry").filter({ hasText: "Across the connection" });
  await expect(entry).toContainText("100/100");
  await entry.getByRole("button", { name: "Open attempt" }).click();
  await page.getByText("Recorded configuration changes", { exact: true }).click();
  await expect(page.getByText("Version 1: SW2, channel-group 1, mode active", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("LACP assessment: timed server repair survives resume and earns verified feedback", async ({ page }) => {
  await open(page, true);
  await expect(page.getByText("remaining", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Next hint|Reveal solution/ })).toHaveCount(0);
  await collect(page);
  await change(page, "active");
  await page.reload();
  await verify(page);
  await submit(page);
});

test("LACP incorrect diagnosis gives guidance without automatically opening the private solution", async ({ page }) => {
  await open(page);
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("01 / Root cause").selectOption("interface-down");
  await page.getByLabel("SW1", { exact: true }).check();
  await page.getByLabel("03 / Proposed remediation").selectOption("lacp-mode");
  await page.getByLabel("Why does the correction work?").selectOption("physical-equals-logical");
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
  await expect(page.locator(".score")).toHaveText(/^0\s*\/\s*100$/);
  await expect(page.locator(".rubric")).toContainText("not established");
  for (const title of ["Explanation — reveal when ready", "Worked repair & verification"]) {
    const details = page.locator("details").filter({ has: page.getByText(title, { exact: true }) });
    await expect(details).not.toHaveAttribute("open", "");
    await expect(details.locator("p, pre")).not.toBeVisible();
  }
});

test("LACP cached practice repairs, verifies and saves offline", async ({ page, context }) => {
  test.skip(!process.env.PW_PRODUCTION, "Requires production worker");
  await open(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  try {
    await page.reload();
    await collect(page);
    await change(page, "active");
    await verify(page);
    await submit(page);
    await page.reload();
    await page.getByRole("button", { name: "Your journal" }).click();
    await expect(page.locator(".journal-entry").filter({ hasText: "Across the connection" })).toContainText("100/100");
  } finally {
    await context.setOffline(false);
  }
});
