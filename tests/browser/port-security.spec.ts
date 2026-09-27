import { test, expect, type Page } from "@playwright/test";
async function open(page: Page, assessment = false) {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 012.*The quiet desk/ }).click();
  if (assessment) await page.getByRole("button", { name: "Assessment 20 minutes.", exact: false }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
  await expect(page.getByRole("heading", { name: "PC-A cannot reach PC-B." })).toBeVisible();
}
async function run(page: Page, device: string, command: string, target = "", select = true) {
  await page.getByRole("tab", { name: /Investigate/ }).click();
  await page.getByRole("button", { name: device, exact: true }).click();
  if (target) await page.getByLabel("Destination IPv4", { exact: false }).fill(target);
  await page.getByRole("button", { name: command, exact: true }).click();
  if (select) await page.getByRole("button", { name: "Select output as evidence", exact: true }).click();
  return page.getByRole("region", { name: "Command output" });
}
async function collect(page: Page) {
  await run(page, "PC-A", "ipconfig /all");
  await run(page, "PC-B", "ipconfig /all");
  for (const c of [
    "show port-security address",
    "show interfaces status",
    "show vlan brief",
    "show port-security interface fastethernet0/1",
  ])
    await run(page, "SW1", c);
  await run(page, "R1", "show ip route");
  await run(page, "PC-A", "ping", "172.30.10.1");
  await run(page, "PC-B", "ping", "172.30.20.1");
}
async function change(page: Page, mac: string, version: number) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("Switch to configure").selectOption("SW1");
  await page.getByLabel("Access port to configure").selectOption("FastEthernet0/1");
  await page.getByLabel("Replacement static secure MAC").selectOption(mac);
  await page.getByRole("button", { name: "Apply configuration change", exact: true }).click();
  await expect(page.getByText(new RegExp(`Current configuration version ${version}\\.`))).toBeVisible();
}
async function verify(page: Page) {
  await collect(page);
  await run(page, "SW1", "show running-config");
  await expect(await run(page, "PC-A", "arp -a")).toContainText("0200.0012.0101");
  await expect(await run(page, "PC-A", "ping", "172.30.20.10")).toContainText("100 percent (5/5)");
  await expect(await run(page, "PC-B", "ping", "172.30.10.10")).toContainText("100 percent (5/5)");
}
async function submit(page: Page, score = 100) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("01 / Root cause").selectOption("secure-mac");
  await page.getByLabel("SW1", { exact: true }).check();
  await page.getByLabel("Initial observed static secure MAC").selectOption("0200.0012.009a");
  await page.getByLabel("Affected access interface").selectOption("FastEthernet0/1");
  await page.getByLabel("Why does the correction work?").selectOption("source-admission");
  await page.getByLabel("03 / Proposed remediation").selectOption("secure-mac");
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
  await expect(page.locator(".score")).toHaveText(new RegExp(`^${score}\\s*/\\s*100$`));
}
async function layout(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator(".network-device")).toHaveCount(4);
  const controls = (await page.locator(".react-flow__controls").boundingBox())!;
  for (const node of await page.locator(".network-device").all()) {
    const b = (await node.boundingBox())!;
    expect(
      controls.x + controls.width <= b.x ||
        b.x + b.width <= controls.x ||
        controls.y + controls.height <= b.y ||
        b.y + b.height <= controls.y,
    ).toBe(true);
  }
}
test("desk practice: original controls, wrong trial, fresh verification, preview and reopened journal", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect(await run(page, "PC-A", "ping", "172.30.20.10", false)).toContainText("0 percent (0/5)");
  await expect(await run(page, "PC-A", "arp -a", "", false)).toContainText("No ARP Entries Found");
  await collect(page);
  await layout(page);
  await page.screenshot({ path: info.outputPath("desk-investigation.png"), fullPage: true });
  await change(page, "0200.0012.000b", 1);
  await expect(await run(page, "PC-A", "ping", "172.30.10.1", false)).toContainText("0 percent (0/5)");
  await change(page, "0200.0012.000a", 2);
  await change(page, "0200.0012.000a", 2);
  for (const c of await page.locator(".repair-trial button, .repair-trial select").all())
    expect((await c.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("desk-repair.png"), fullPage: true });
  await expect(await run(page, "PC-A", "arp -a", "", false)).toContainText("No ARP Entries Found");
  await page.reload();
  await verify(page);
  await submit(page);
  await expect(page.getByText(/^Desk service verified/)).toBeVisible();
  await expect(
    page.locator("details").filter({ has: page.getByText("Worked repair & verification", { exact: true }) }),
  ).not.toHaveAttribute("open", "");
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  await expect(page.locator(".preview")).toContainText("Bidirectional communication: successful");
  await page.reload();
  await page.getByRole("button", { name: "Your journal" }).click();
  const entry = page.locator(".journal-entry").filter({ hasText: "The quiet desk" });
  await expect(entry).toContainText("100/100");
  await entry.getByRole("button", { name: "Open attempt" }).click();
  await page.getByText("Recorded configuration changes", { exact: true }).click();
  await expect(
    page.getByText("Version 2: SW1, FastEthernet0/1, static secure MAC → 0200.0012.000a", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("desk timed assessment resumes and finishes without primer or hints", async ({ page }) => {
  await open(page, true);
  await expect(page.getByText("Optional preparation · Carrier and admission", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Next hint|Reveal solution/ })).toHaveCount(0);
  await collect(page);
  await change(page, "0200.0012.000a", 1);
  await page.reload();
  await verify(page);
  await submit(page);
});
test("desk repair without fresh observations remains unverified", async ({ page }) => {
  await open(page);
  await collect(page);
  await change(page, "0200.0012.000a", 1);
  await submit(page, 80);
  await expect(
    page.getByText("Configuration restored; fresh verification is incomplete.", { exact: true }),
  ).toBeVisible();
});
test("desk cached practice completes offline and saves feedback", async ({ page, context }) => {
  test.skip(!process.env.PW_PRODUCTION, "Production worker required");
  await open(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  try {
    await page.reload();
    await collect(page);
    await change(page, "0200.0012.000a", 1);
    await verify(page);
    await submit(page);
    await page.reload();
    await page.getByRole("button", { name: "Your journal" }).click();
    await expect(page.locator(".journal-entry").filter({ hasText: "The quiet desk" })).toContainText("100/100");
  } finally {
    await context.setOffline(false);
  }
});
test("desk preparation is unrelated, touch-first and reveals reasoning only on request", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 012.*The quiet desk/ }).click();
  await page.getByText("Optional preparation · Carrier and admission", { exact: true }).click();
  const primer = page
    .locator("details")
    .filter({ has: page.getByText("Optional preparation · Carrier and admission", { exact: true }) });
  await expect(primer).not.toContainText("172.30.");
  await expect(primer).not.toContainText("0200.0012.");
  await expect(primer).not.toContainText("FastEthernet0/1");
  await page.getByRole("radio", { name: "Carrier proves the source is admitted." }).check();
  await page.getByRole("button", { name: "Check admission reasoning" }).click();
  await expect(page.getByText(/Revisit what each layer proves/)).toBeVisible();
  await expect(page.getByText(/The unregistered source is outside/)).toHaveCount(0);
  await page.getByRole("button", { name: "Reveal preparation reasoning" }).click();
  await expect(page.getByText(/The unregistered source is outside/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
