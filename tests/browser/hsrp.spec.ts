import { test, expect, type Page } from "@playwright/test";
async function open(page: Page, assessment = false) {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 011.*The shared exit/ }).click();
  await expect(page.getByText(/Audit shared gateway roles/)).toBeVisible();
  if (assessment) await page.getByRole("button", { name: "Assessment 20 minutes.", exact: false }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
  await expect(page.getByRole("heading", { name: "Connectivity works. Check the gateway design." })).toBeVisible();
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
  for (const d of ["R1", "R2"]) {
    await run(page, d, "show standby brief");
    await run(page, d, "show running-config");
  }
  await run(page, "PC-A", "ipconfig");
}
async function change(page: Page, priority: string, version: number, device = "R1") {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("Router to configure").selectOption(device);
  await page.getByLabel("New HSRP priority").selectOption(priority);
  await page.getByRole("button", { name: "Apply configuration change", exact: true }).click();
  await expect(page.getByText(new RegExp(`Current configuration version ${version}\\.`))).toBeVisible();
}
async function verify(page: Page) {
  for (const d of ["R1", "R2"]) await run(page, d, "show standby brief");
  await run(page, "R1", "show running-config");
  await expect(await run(page, "PC-A", "ping", "172.28.10.1")).toContainText("100 percent (5/5)");
  await expect(await run(page, "PC-A", "arp -a")).toContainText("0000.0c9f.f00b");
  await expect(await run(page, "PC-A", "ping", "172.28.20.10")).toContainText("100 percent (5/5)");
  await expect(await run(page, "PC-B", "ping", "172.28.10.10")).toContainText("100 percent (5/5)");
}
async function submit(page: Page, score = 100) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("01 / Root cause").selectOption("hsrp-priority");
  await page.getByLabel("R1", { exact: true }).check();
  await page.getByLabel("Initial observed HSRP priority").selectOption("90");
  await page.getByLabel("Affected participating interface").selectOption("Gi0/0");
  await page.getByLabel("Observed HSRP group").selectOption("11");
  await page.getByLabel("Why does the correction work?").selectOption("virtual-owner");
  await page.getByLabel("03 / Proposed remediation").selectOption("hsrp-priority");
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
  await expect(page.locator(".score")).toHaveText(new RegExp(`^${score}\\s*/\\s*100$`));
}
async function layout(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator(".topology-hsrp .network-device")).toHaveCount(6);
  const controls = (await page.locator(".topology-hsrp .react-flow__controls").boundingBox())!;
  for (const n of await page.locator(".topology-hsrp .network-device").all()) {
    const b = (await n.boundingBox())!;
    expect(
      controls.x + controls.width <= b.x ||
        b.x + b.width <= controls.x ||
        controls.y + controls.height <= b.y ||
        b.y + b.height <= controls.y,
    ).toBe(true);
  }
}
test("HSRP practice: working connectivity, wrong trial, fresh design proof, preview and reopened journal", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect(await run(page, "PC-A", "ping", "172.28.20.10", false)).toContainText("100 percent (5/5)");
  for (const d of ["R1", "R2", "R3"]) {
    await run(page, d, "show ip interface brief", "", false);
    await run(page, d, "show ip route", "", false);
  }
  await run(page, "SW1", "show vlan brief", "", false);
  await run(page, "SW1", "show interfaces status", "", false);
  await run(page, "PC-B", "ipconfig", "", false);
  await collect(page);
  await layout(page);
  await expect(await run(page, "R1", "show standby brief", "", false)).toContainText("Standby");
  await page.screenshot({ path: info.outputPath("hsrp-investigation.png"), fullPage: true });
  await change(page, "80", 1);
  await change(page, "150", 2);
  for (const c of await page.locator(".repair-trial button, .repair-trial select").all())
    expect((await c.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: info.outputPath("hsrp-repair.png"), fullPage: true });
  await expect(await run(page, "PC-A", "arp -a", "", false)).toContainText("No ARP Entries Found");
  await page.reload();
  await verify(page);
  await submit(page);
  await expect(page.getByText(/^Gateway design verified:/)).toBeVisible();
  await expect(
    page.locator("details").filter({ has: page.getByText("Worked repair & verification", { exact: true }) }),
  ).not.toHaveAttribute("open", "");
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  await expect(page.locator(".preview")).toContainText("172.28.10.3 -> 10.0.23.2");
  await expect(page.locator(".preview")).toContainText("172.28.10.2 -> 10.0.13.2");
  await page.reload();
  await page.getByRole("button", { name: "Your journal" }).click();
  const entry = page.locator(".journal-entry").filter({ hasText: "The shared exit" });
  await expect(entry).toContainText("100/100");
  await entry.getByRole("button", { name: "Open attempt" }).click();
  await page.getByText("Recorded configuration changes", { exact: true }).click();
  await expect(page.getByText("Version 2: R1, Gi0/0, HSRPv2 group 11, priority → 150", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test("HSRP online timed assessment completes after resume without preparation or hint access", async ({ page }) => {
  await open(page, true);
  await expect(page.getByText("Optional preparation · One gateway identity", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Next hint|Reveal solution/ })).toHaveCount(0);
  await collect(page);
  await change(page, "120", 1);
  await page.reload();
  await verify(page);
  await submit(page);
});
test("HSRP stale observations do not verify a later valid change", async ({ page }) => {
  await open(page);
  await collect(page);
  await change(page, "150", 1);
  await verify(page);
  await change(page, "120", 2);
  await submit(page, 80);
  await expect(page.getByText("Design restored; fresh verification is incomplete.", { exact: true })).toBeVisible();
});
test("HSRP cached practice completes offline with virtual resolution and saved feedback", async ({ page, context }) => {
  test.skip(!process.env.PW_PRODUCTION, "Production worker required");
  await open(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  try {
    await page.reload();
    await collect(page);
    await change(page, "150", 1);
    await verify(page);
    await submit(page);
    await page.reload();
    await page.getByRole("button", { name: "Your journal" }).click();
    await expect(page.locator(".journal-entry").filter({ hasText: "The shared exit" })).toContainText("100/100");
  } finally {
    await context.setOffline(false);
  }
});
test("HSRP tiny primer has touch predictions and requested reasoning using a separate example", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 011.*The shared exit/ }).click();
  await page.getByText("Optional preparation · One gateway identity", { exact: true }).click();
  await page.getByLabel("A successful gateway ping", { exact: true }).check();
  await expect(page.getByText(/A shared gateway may respond through either member/)).toBeVisible();
  await page.getByLabel("Both member role views", { exact: true }).check();
  await page.getByRole("radio", { name: "Juniper", exact: true }).check();
  await expect(page.getByText(/Router names do not determine roles/)).toBeVisible();
  await page.getByRole("radio", { name: "Maple", exact: true }).check();
  await expect(page.getByText(/Maple's 210 exceeds/)).toHaveCount(0);
  await page.getByRole("button", { name: "Show preparation reasoning" }).click();
  await expect(page.getByText(/Maple's 210 exceeds/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
