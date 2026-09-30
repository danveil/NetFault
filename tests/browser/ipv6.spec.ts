import { test, expect, type Page } from "@playwright/test";
async function open(page: Page, assessment = false) {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 015.*Between two shores/ }).click();
  if (assessment) await page.getByRole("button", { name: "Assessment 20 minutes.", exact: false }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
  await expect(page.getByRole("heading", { name: "PC-A cannot reach PC-B." })).toBeVisible();
}
async function run(page: Page, device: string, command: string, target = "", select = true) {
  await page.getByRole("tab", { name: /Investigate/ }).click();
  await page.getByRole("button", { name: device, exact: true }).click();
  if (target) await page.getByLabel("Observed IPv6 destination", { exact: true }).selectOption(target);
  await page.getByRole("button", { name: command, exact: true }).click();
  if (select) await page.getByRole("button", { name: "Select output as evidence", exact: true }).click();
  return page.getByRole("region", { name: "Command output" });
}
async function collect(page: Page) {
  for (const d of ["PC-A", "PC-B"]) {
    await run(page, d, "ipconfig");
    await run(page, d, "route print");
  }
  await run(page, "R1", "show ipv6 interface brief");
  await run(page, "R1", "show running-config");
  await expect(await run(page, "PC-A", "ping", "2001:db8:15:10::1")).toContainText("100 percent (5/5)");
  await expect(await run(page, "PC-B", "ping", "2001:db8:15:20::1")).toContainText("100 percent (5/5)");
  await expect(await run(page, "PC-A", "ping", "2001:db8:15:20::20")).toContainText("0 percent (0/5)");
}
async function change(page: Page, enabled: boolean, version: number) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("Observed router", { exact: true }).selectOption("R1");
  await page.getByLabel("Trial IPv6 forwarding setting").selectOption(String(enabled));
  await page.getByRole("button", { name: "Apply configuration change", exact: true }).click();
  await expect(
    page.getByText(
      version
        ? new RegExp(`Current configuration version ${version}\\.`)
        : "Initial configuration. No change recorded.",
      { exact: !version },
    ),
  ).toBeVisible();
}
async function verify(page: Page) {
  await run(page, "R1", "show running-config");
  await run(page, "R1", "show ipv6 interface brief");
  for (const d of ["PC-A", "PC-B"]) await run(page, d, "route print");
  for (const [d, t] of [
    ["PC-A", "2001:db8:15:10::1"],
    ["PC-B", "2001:db8:15:20::1"],
    ["PC-A", "2001:db8:15:20::20"],
    ["PC-B", "2001:db8:15:10::10"],
  ])
    await expect(await run(page, d, "ping", t)).toContainText("100 percent (5/5)");
}
async function submit(page: Page, score = 100) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("Initial observed IPv6 forwarding setting").selectOption("false");
  await page.getByLabel("Proposed IPv6 forwarding setting", { exact: true }).selectOption("true");
  await page.getByLabel("Why does the correction work?").selectOption("ipv6-transit");
  await page.getByLabel("01 / Root cause").selectOption("ipv6-forwarding-disabled");
  await page.getByLabel("R1", { exact: true }).check();
  await page.getByLabel("03 / Proposed remediation").selectOption("ipv6-forwarding");
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
  await expect(page.locator(".score")).toHaveText(new RegExp(`^${score}\\s*/\\s*100$`));
}
test("IPv6 practice completes repair, fresh proof, preview and reopened journal", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect(page.locator(".network-device")).toHaveCount(3);
  await expect
    .poll(async () =>
      page
        .locator(".network-device")
        .first()
        .evaluate((el) => el.getBoundingClientRect().width),
    )
    .toBeGreaterThan(90);
  await page.locator(".topology").screenshot({ path: info.outputPath("ipv6-topology.png") });
  await collect(page);
  await run(page, "PC-A", "route print", "", false);
  const output = page.getByRole("region", { name: "Command output" });
  await expect(output).toContainText("2001:db8:15:10::/64");
  expect(await output.locator("pre").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await output.screenshot({ path: info.outputPath("ipv6-routes.png") });
  await change(page, false, 0);
  await change(page, true, 1);
  await change(page, true, 1);
  for (const c of await page.locator(".repair-trial button, .repair-trial select").all())
    expect((await c.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.getByLabel("Observed router", { exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Trial IPv6 forwarding setting")).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator(".repair-trial").screenshot({ path: info.outputPath("ipv6-repair.png") });
  await page.reload();
  await verify(page);
  await submit(page);
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  await expect(page.locator(".preview")).toContainText("PC-A -> R1 -> PC-B");
  await expect(page.locator(".preview")).toContainText("Bidirectional communication: successful");
  await page.getByText("Explanation — reveal when ready", { exact: true }).click();
  await expect(page.getByText(/^Both manually configured/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Your journal" }).click();
  const entry = page.locator(".journal-entry").filter({ hasText: "Between two shores" });
  await expect(entry).toContainText("100/100");
  await entry.getByRole("button", { name: "Open attempt" }).click();
  await page.getByText("Recorded configuration changes", { exact: true }).click();
  await expect(page.getByText(/Version 1: R1, IPv6 unicast forwarding/)).toBeVisible();
  expect(errors).toEqual([]);
});
test("IPv6 timed assessment resumes and completes with no active primer or hints", async ({ page }) => {
  await open(page, true);
  await expect(page.locator("#ipv6-preparation-v1")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Next hint|Reveal solution/ })).toHaveCount(0);
  await collect(page);
  await change(page, true, 1);
  await page.reload();
  await verify(page);
  await submit(page);
});
test("IPv6 applied repair alone is recovered but unverified", async ({ page }) => {
  await open(page);
  await collect(page);
  await change(page, true, 1);
  await submit(page, 80);
  await expect(
    page.getByText("Recovered configuration; fresh verification is incomplete.", { exact: true }),
  ).toBeVisible();
});
test("IPv6 cached practice completes after offline reload", async ({ page, context }) => {
  test.skip(!process.env.PW_PRODUCTION, "Production worker required");
  await open(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  try {
    await page.reload();
    await collect(page);
    await change(page, true, 1);
    await verify(page);
    await submit(page);
    await page.reload();
    await page.getByRole("button", { name: "Your journal" }).click();
    await expect(page.locator(".journal-entry").filter({ hasText: "Between two shores" })).toContainText("100/100");
  } finally {
    await context.setOffline(false);
  }
});
test("unrelated IPv6 primer has tap choices, meaningful retry and requested reasoning", async ({ page }, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 015.*Between two shores/ }).click();
  await page.getByText("Optional preparation · Reading the next address", { exact: true }).click();
  const primer = page.locator("#ipv6-preparation-v1");
  await expect(primer.locator("figure")).toHaveCount(2);
  for (const marker of ["2001:db8:15:", "R1", "PC-A"]) await expect(primer).not.toContainText(marker);
  for (const name of [
    "2001:db8:44:8::a",
    "Resolve the destination on the same link",
    "The router forwards all transit traffic",
  ])
    await primer.getByRole("radio", { name, exact: true }).check();
  await primer.getByRole("button", { name: "Check IPv6 reasoning" }).click();
  await expect(primer.getByRole("status")).toContainText("Revisit");
  await expect(primer.getByText(/^Removing leading zeros/)).toHaveCount(0);
  for (const name of [
    "2001:db8:44:7::a",
    "Use its configured default next hop",
    "This probe reached the router and its reply returned",
  ])
    await primer.getByRole("radio", { name, exact: true }).check();
  await primer.getByRole("button", { name: "Check IPv6 reasoning" }).click();
  await expect(primer.getByRole("status")).toContainText("All three");
  await primer.getByRole("button", { name: "Reveal preparation reasoning" }).click();
  await expect(primer.getByText(/^Removing leading zeros/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await primer.screenshot({ path: info.outputPath("ipv6-primer.png") });
});
