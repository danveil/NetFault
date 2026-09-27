import { test, expect, type Page } from "@playwright/test";
async function open(page: Page, assessment = false) {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 013.*Beyond the gate/ }).click();
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
  await run(page, "PC-A", "ipconfig");
  await run(page, "PC-B", "ipconfig");
  await run(page, "R1", "show running-config");
  await run(page, "R1", "show ip route");
  await run(page, "R2", "show ip route");
  await expect(await run(page, "PC-A", "ping", "198.51.100.10")).toContainText("0 percent (0/5)");
}
async function change(page: Page, ip: string, version: number) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("Router to configure").selectOption("R1");
  await page.getByLabel("Mapping to configure").selectOption("primary");
  await page.getByLabel("Replacement inside local", { exact: true }).selectOption(ip);
  await page.getByRole("button", { name: "Apply configuration change", exact: true }).click();
  await expect(page.getByText(new RegExp(`Current configuration version ${version}\\.`))).toBeVisible();
}
async function verify(page: Page) {
  await run(page, "PC-A", "ipconfig");
  await run(page, "R1", "show running-config");
  await expect(await run(page, "R1", "show ip nat translations")).toContainText("192.168.40.10");
  for (const [d, t] of [
    ["PC-A", "198.51.100.10"],
    ["PC-B", "203.0.113.10"],
    ["PC-A", "192.168.40.1"],
    ["PC-B", "198.51.100.1"],
  ])
    await expect(await run(page, d, "ping", t)).toContainText("100 percent (5/5)");
}
async function submit(page: Page, score = 100) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("Affected mapping").selectOption("primary");
  await page.getByLabel("Initial observed inside local", { exact: true }).selectOption("192.168.40.99");
  await page.getByLabel("Initial observed inside global").selectOption("203.0.113.10");
  await page.getByLabel("Proposed inside local", { exact: true }).selectOption("192.168.40.10");
  await page.getByLabel("Why does the correction work?").selectOption("static-translation");
  await page.getByLabel("01 / Root cause").selectOption("nat-local");
  await page.getByLabel("R1", { exact: true }).check();
  await page.getByLabel("03 / Proposed remediation").selectOption("nat-local");
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
  await expect(page.locator(".score")).toHaveText(new RegExp(`^${score}\\s*/\\s*100$`));
}
test("static NAT practice: original evidence, wrong trial, two-way verification, preview and journal", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await collect(page);
  await run(page, "R1", "show ip interface brief", "", false);
  await run(page, "R2", "show ip interface brief", "", false);
  await run(page, "PC-A", "route print", "", false);
  await run(page, "PC-B", "ipconfig /all", "", false);
  await expect(await run(page, "PC-B", "ping", "203.0.113.10", false)).toContainText("0 percent (0/5)");
  await page.screenshot({ path: info.outputPath("nat-investigation.png"), fullPage: true });
  const initialTable = await run(page, "R1", "show ip nat translations", "", false);
  await expect(initialTable).toContainText("Inside local:  192.168.40.99");
  await expect(initialTable).toContainText("Inside global: 203.0.113.10");
  await initialTable.screenshot({ path: info.outputPath("nat-initial-table.png") });
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("Router to configure").selectOption("R1");
  await page.getByLabel("Mapping to configure").selectOption("primary");
  await page.getByLabel("Replacement inside local", { exact: true }).selectOption("192.168.40.99");
  await page.getByRole("button", { name: "Apply configuration change", exact: true }).click();
  await expect(page.getByText("Initial configuration. No change recorded.")).toBeVisible();
  await page.getByText("Enter another IPv4 value", { exact: true }).click();
  await page.getByLabel("Custom replacement inside local").fill("192.168.40.98");
  await page.getByRole("button", { name: "Apply configuration change", exact: true }).click();
  await expect(page.getByText(/Current configuration version 1\./)).toBeVisible();
  await expect(await run(page, "PC-A", "ping", "198.51.100.10", false)).toContainText("0 percent (0/5)");
  await change(page, "192.168.40.10", 2);
  await change(page, "192.168.40.10", 2);
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await expect(page.locator(".repair-trial")).toBeVisible();
  const controls = page.locator(".repair-trial button, .repair-trial select");
  expect(await controls.count()).toBeGreaterThanOrEqual(5);
  for (const c of await controls.all()) expect((await c.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.getByLabel("Router to configure").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Mapping to configure")).toBeFocused();
  await page.getByText("Recorded inside global (unchanged)", { exact: true }).click();
  const globalCard = page.locator(".repair-trial details").filter({ hasText: "Recorded inside global (unchanged)" });
  await expect(globalCard).toContainText("203.0.113.10");
  await expect(globalCard.locator("input, select")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator(".repair-trial").screenshot({ path: info.outputPath("nat-repair.png") });
  await page.reload();
  await verify(page);
  const finalTable = await run(page, "R1", "show ip nat translations", "", false);
  await finalTable.screenshot({ path: info.outputPath("nat-repaired-table.png") });
  await submit(page);
  await expect(page.getByText(/^Both service directions verified/)).toBeVisible();
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  await expect(page.locator(".preview")).toContainText("PC-B> ping 203.0.113.10");
  await expect(page.locator(".preview")).toContainText("Simulator address transformations");
  await page.reload();
  await page.getByRole("button", { name: "Your journal" }).click();
  const entry = page.locator(".journal-entry").filter({ hasText: "Beyond the gate" });
  await expect(entry).toContainText("100/100");
  await entry.getByRole("button", { name: "Open attempt" }).click();
  await page.getByText("Recorded configuration changes", { exact: true }).click();
  await expect(page.getByText(/Version 2: R1, mapping primary/)).toBeVisible();
  expect(errors).toEqual([]);
});
test("static NAT timed assessment resumes and completes without help", async ({ page }) => {
  await open(page, true);
  await expect(page.getByText("Optional preparation · One host, two address views", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Next hint|Reveal solution/ })).toHaveCount(0);
  await collect(page);
  await change(page, "192.168.40.10", 1);
  await page.reload();
  await verify(page);
  await submit(page);
});
test("static NAT repair without fresh proof cannot complete verification", async ({ page }) => {
  await open(page);
  await collect(page);
  await change(page, "192.168.40.10", 1);
  await submit(page, 80);
  await expect(
    page.getByText("Recovered configuration; fresh verification is incomplete.", { exact: true }),
  ).toBeVisible();
});
test("static NAT cached practice completes and reopens offline", async ({ page, context }) => {
  test.skip(!process.env.PW_PRODUCTION, "Production worker required");
  await open(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  try {
    await page.reload();
    await collect(page);
    await change(page, "192.168.40.10", 1);
    await verify(page);
    await submit(page);
    await page.reload();
    await page.getByRole("button", { name: "Your journal" }).click();
    await expect(page.locator(".journal-entry").filter({ hasText: "Beyond the gate" })).toContainText("100/100");
  } finally {
    await context.setOffline(false);
  }
});
test("unrelated static NAT primer is touch-first with requested solutions", async ({ page }, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 013.*Beyond the gate/ }).click();
  await page.getByText("Optional preparation · One host, two address views", { exact: true }).click();
  const primer = page.locator("#static-nat-preparation-v1");
  for (const text of ["192.168.40.", "203.0.113.10", "PC-A", "primary"]) await expect(primer).not.toContainText(text);
  await page.getByRole("radio", { name: "The inside host changes its NIC address." }).check();
  await page.getByRole("radio", { name: "The mapping creates that route automatically." }).check();
  await page.getByRole("button", { name: "Check translation reasoning" }).click();
  await expect(page.getByText(/Revisit the address seen/)).toBeVisible();
  await expect(page.getByText(/Outside initiation to 203.0.113.70 becomes/)).toHaveCount(0);
  await page.getByRole("button", { name: "Reveal preparation reasoning" }).click();
  await expect(page.getByText(/Outside initiation to 203.0.113.70 becomes/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("nat-primer.png"), fullPage: true });
});
