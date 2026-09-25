import { test, expect, type Page } from "@playwright/test";
async function open(page: Page, assessment = false) {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 010.*The unexpected detour/ }).click();
  await expect(page.getByText(/Compare the observed switching tree/)).toBeVisible();
  if (assessment) await page.getByRole("button", { name: "Assessment 20 minutes.", exact: false }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
  await expect(page.getByRole("heading", { name: "Connectivity works. Does the design?" })).toBeVisible();
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
  for (const d of ["SW1", "SW2", "SW3"]) await run(page, d, "show spanning-tree vlan 10");
  await run(page, "SW1", "show running-config");
}
async function change(page: Page, priority: string, version: number) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("Switch to configure").selectOption("SW1");
  await page.getByLabel("New base priority").selectOption(priority);
  await page.getByRole("button", { name: "Apply configuration change", exact: true }).click();
  await expect(page.getByText(new RegExp(`Current configuration version ${version}\\.`))).toBeVisible();
}
async function verify(page: Page) {
  await collect(page);
  await expect(await run(page, "PC-A", "ping", "172.26.10.20")).toContainText("100 percent (5/5)");
  await expect(await run(page, "PC-B", "ping", "172.26.10.10")).toContainText("100 percent (5/5)");
}
async function submit(page: Page, score = 100) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("01 / Root cause").selectOption("bridge-priority");
  await page.getByLabel("SW1", { exact: true }).check();
  await page.getByLabel("Initial observed base priority").selectOption("40960");
  await page.getByLabel("Affected VLAN instance").selectOption("10");
  await page.getByLabel("Why does the correction work?").selectOption("root-election");
  await page.getByLabel("03 / Proposed remediation").selectOption("bridge-priority");
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
  await expect(page.locator(".score")).toHaveText(new RegExp(`^${score}\\s*/\\s*100$`));
}
async function mobileChecks(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const controls = (await page.locator(".topology-stp .react-flow__controls").boundingBox())!;
  for (const n of await page.locator(".topology-stp .network-device").all()) {
    const b = (await n.boundingBox())!;
    expect(
      controls.x + controls.width <= b.x ||
        b.x + b.width <= controls.x ||
        controls.y + controls.height <= b.y ||
        b.y + b.height <= controls.y,
    ).toBe(true);
  }
}
test("STP practice: intact connectivity, wrong trial, verified tree, preview and journal", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await run(page, "PC-A", "ipconfig", "", false);
  await run(page, "PC-B", "ipconfig", "", false);
  await expect(await run(page, "PC-A", "ping", "172.26.10.20", false)).toContainText("100 percent (5/5)");
  for (const d of ["SW1", "SW2", "SW3"]) {
    await run(page, d, "show interfaces status", "", false);
    await run(page, d, "show vlan brief", "", false);
  }
  await collect(page);
  await mobileChecks(page);
  await run(page, "SW3", "show spanning-tree vlan 10", "", false);
  await page.screenshot({ path: info.outputPath("stp-investigation.png"), fullPage: true });
  await change(page, "32768", 1);
  await expect(await run(page, "SW1", "show spanning-tree vlan 10", "", false)).toContainText(
    "This bridge is the root",
  );
  await change(page, "24576", 2);
  for (const c of await page.locator(".repair-trial button, .repair-trial select").all())
    expect((await c.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: info.outputPath("stp-repair.png"), fullPage: true });
  await page.reload();
  await verify(page);
  await submit(page);
  await expect(page.getByText(/^Design recovery verified:/)).toBeVisible();
  await expect(
    page.locator("details").filter({ has: page.getByText("Worked repair & verification", { exact: true }) }),
  ).not.toHaveAttribute("open", "");
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  await expect(page.locator(".preview")).toContainText("PC-A → SW1 → SW2 → SW3 → PC-B");
  await expect(page.locator(".preview")).toContainText("PC-A → SW1 → SW3 → PC-B");
  await page.reload();
  await page.getByRole("button", { name: "Your journal" }).click();
  const entry = page.locator(".journal-entry").filter({ hasText: "The unexpected detour" });
  await expect(entry).toContainText("100/100");
  await entry.getByRole("button", { name: "Open attempt" }).click();
  await page.getByText("Recorded configuration changes", { exact: true }).click();
  await expect(page.getByText("Version 2: SW1, VLAN 10, bridge priority → 24576", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test("STP online assessment completes with fresh evidence and no preparation reveal", async ({ page }) => {
  await open(page, true);
  await expect(page.getByText("Optional preparation · A switching tree", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Next hint|Reveal solution/ })).toHaveCount(0);
  await collect(page);
  await change(page, "8192", 1);
  await page.reload();
  await verify(page);
  await submit(page);
});
test("STP stale verification and unapplied repair cannot establish recovery", async ({ page }) => {
  await open(page);
  await collect(page);
  await change(page, "24576", 1);
  await verify(page);
  await change(page, "8192", 2);
  await submit(page, 80);
  await expect(page.getByText("Design restored; fresh verification is incomplete.", { exact: true })).toBeVisible();
});
test("STP cached practice completes offline", async ({ page, context }) => {
  test.skip(!process.env.PW_PRODUCTION, "Production worker required");
  await open(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  try {
    await page.reload();
    await collect(page);
    await change(page, "24576", 1);
    await verify(page);
    await submit(page);
    await page.reload();
    await page.getByRole("button", { name: "Your journal" }).click();
    await expect(page.locator(".journal-entry").filter({ hasText: "The unexpected detour" })).toContainText("100/100");
  } finally {
    await context.setOffline(false);
  }
});
test("STP small preparation uses tap predictions with requested reasoning", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 010.*The unexpected detour/ }).click();
  await page.getByText("Optional preparation · A switching tree", { exact: true }).click();
  await page.getByLabel("One successful ping", { exact: true }).check();
  await expect(page.getByText(/Delivery can succeed along different trees/)).toBeVisible();
  await page.getByLabel("Root and port-role observations", { exact: true }).check();
  await page.getByRole("radio", { name: "C", exact: true }).check();
  await expect(page.getByText(/previous root is not permanently locked/)).toBeVisible();
  await page.getByRole("radio", { name: "A", exact: true }).check();
  await expect(page.getByText(/A wins because 4096/)).toHaveCount(0);
  await page.getByRole("button", { name: "Show preparation reasoning" }).click();
  await expect(page.getByText(/A wins because 4096/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
