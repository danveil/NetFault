import { test, expect, type Page } from "@playwright/test";

async function open(page: Page, assessment = false) {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 009.*The closed passage/ }).click();
  if (assessment) await page.getByRole("button", { name: "Assessment 20 minutes.", exact: false }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
}
async function run(page: Page, device: string, command: string, target = "", source = "", evidence = true) {
  await page.getByRole("tab", { name: /Investigate/ }).click();
  await page.getByRole("button", { name: device, exact: true }).click();
  if (target) await page.getByLabel("Destination IPv4", { exact: false }).fill(target);
  if (device.startsWith("R")) await page.getByLabel("Ping source (optional)").fill(source);
  await page.getByRole("button", { name: command, exact: true }).click();
  if (evidence) await page.getByRole("button", { name: "Select output as evidence", exact: true }).click();
  return page.getByRole("region", { name: "Command output" });
}
async function collect(page: Page) {
  await run(page, "PC-A", "ipconfig");
  await expect(await run(page, "PC-A", "ping", "172.24.20.10")).toContainText("0 percent (0/5)");
  for (const router of ["R1", "R2"]) await run(page, router, "show ip route");
  await expect(await run(page, "R2", "show access-lists")).toContainText("10 deny any");
  await expect(await run(page, "R2", "show running-config")).toContainText("ip access-group WORKAREA out");
}
async function change(page: Page, sequence: number, next: number, version: number) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("Router to configure").selectOption("R2");
  await page.getByLabel("ACL name to configure").fill("WORKAREA");
  await page.getByLabel("Existing entry sequence").fill(String(sequence));
  await page.getByLabel("New entry sequence").fill(String(next));
  await page.getByRole("button", { name: "Apply configuration change", exact: true }).click();
  await expect(page.getByText(new RegExp(`Current configuration version ${version}\\.`))).toBeVisible();
}
async function verify(page: Page) {
  await run(page, "R2", "show access-lists");
  await run(page, "R2", "show running-config");
  await expect(await run(page, "PC-A", "ping", "172.24.20.10")).toContainText("100 percent (5/5)");
  await expect(await run(page, "PC-B", "ping", "172.24.10.10")).toContainText("100 percent (5/5)");
  await expect(await run(page, "R1", "ping", "172.24.20.10", "10.49.0.1")).toContainText("0 percent (0/5)");
}
async function submit(page: Page, score = 100, wrong = false) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("01 / Root cause").selectOption(wrong ? "wrong-gateway" : "acl-order");
  await page.getByLabel("R2", { exact: true }).check();
  await page.getByLabel("Affected outbound interface").selectOption("Gi0/1");
  await page.getByLabel("Observed ACL name").fill("WORKAREA");
  await page.getByLabel("Initial first-matching sequence").fill("10");
  await page.getByLabel("03 / Proposed remediation").selectOption("acl-sequence");
  await page.getByLabel("Why does the correction work?").selectOption("first-match-policy");
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
  await expect(page.locator(".score")).toHaveText(new RegExp(`^${score}\\s*/\\s*100$`));
  for (const title of ["Explanation — reveal when ready", "Worked repair & verification"]) {
    const details = page.locator("details").filter({ has: page.getByText(title, { exact: true }) });
    await expect(details).not.toHaveAttribute("open", "");
  }
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test("ACL practice: wrong trial, repair, policy verification and reopened journal", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect(await run(page, "PC-A", "ping", "172.24.10.1", "", false)).toContainText("100 percent (5/5)");
  await collect(page);
  await noOverflow(page);
  const controls = (await page.locator(".topology-policy .react-flow__controls").boundingBox())!;
  for (const node of await page.locator(".topology-policy .network-device").all()) {
    const box = (await node.boundingBox())!;
    expect(
      controls.x + controls.width <= box.x ||
        box.x + box.width <= controls.x ||
        controls.y + controls.height <= box.y ||
        box.y + box.height <= controls.y,
    ).toBe(true);
  }
  await run(page, "R2", "show access-lists", "", "", false);
  await page.screenshot({ path: info.outputPath("acl-investigation.png"), fullPage: true });
  await change(page, 20, 30, 1);
  await expect(await run(page, "PC-A", "ping", "172.24.20.10", "", false)).toContainText("0 percent (0/5)");
  await change(page, 30, 5, 2);
  await noOverflow(page);
  for (const control of await page.locator(".repair-trial button, .repair-trial input, .repair-trial select").all())
    expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: info.outputPath("acl-repair.png"), fullPage: true });
  await page.reload();
  await verify(page);
  await submit(page);
  await expect(page.getByText(/^Policy recovery verified:/)).toBeVisible();
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  await expect(page.locator(".preview")).toContainText("excluded controls must remain denied");
  await expect(page.locator(".preview")).toContainText("0 percent (0/5)");
  await expect(page.locator(".preview")).toContainText("100 percent (5/5)");
  await noOverflow(page);
  await page.reload();
  await page.getByRole("button", { name: "Your journal" }).click();
  const entry = page.locator(".journal-entry").filter({ hasText: "The closed passage" });
  await expect(entry).toContainText("100/100");
  await entry.getByRole("button", { name: "Open attempt" }).click();
  await page.getByText("Recorded configuration changes", { exact: true }).click();
  await expect(page.getByText("Version 2: R2, ACL WORKAREA, sequence 30 → 5", { exact: true })).toBeVisible();
  await page.getByText("Your submitted diagnosis & reasoning", { exact: true }).click();
  await expect(page.getByText("Initial first-matching sequence:", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("ACL assessment: timed server repair persists on resume with fresh policy proof", async ({ page }) => {
  await open(page, true);
  await expect(page.getByText("remaining", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Next hint|Reveal solution/ })).toHaveCount(0);
  await collect(page);
  // An equivalent order is accepted: move deny after permit instead of moving permit first.
  await change(page, 10, 30, 1);
  await page.reload();
  await verify(page);
  await submit(page);
  await expect(page.getByText(/^Policy recovery verified:/)).toBeVisible();
});

test("ACL incorrect diagnosis and unapplied repair do not claim recovery or open the solution", async ({ page }) => {
  await open(page);
  await submit(page, 15, true);
  await expect(page.getByText("Policy recovery not established.", { exact: true })).toBeVisible();
});

test("ACL old verification cannot verify a newer configuration version", async ({ page }) => {
  await open(page);
  await collect(page);
  await change(page, 20, 5, 1);
  await verify(page);
  await change(page, 5, 20, 2);
  await change(page, 20, 5, 3);
  await submit(page, 80);
  await expect(
    page.getByText("Recovered configuration, but fresh policy verification is incomplete.", { exact: true }),
  ).toBeVisible();
});

test("ACL cached practice repairs, verifies and reopens offline", async ({ page, context }) => {
  test.skip(!process.env.PW_PRODUCTION, "Requires production worker");
  await open(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  try {
    await page.reload();
    await collect(page);
    await change(page, 20, 5, 1);
    await verify(page);
    await submit(page);
    await page.reload();
    await page.getByRole("button", { name: "Your journal" }).click();
    await expect(page.locator(".journal-entry").filter({ hasText: "The closed passage" })).toContainText("100/100");
  } finally {
    await context.setOffline(false);
  }
});
