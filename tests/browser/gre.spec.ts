import { test, expect, type Page } from "@playwright/test";
async function open(page: Page, assessment = false) {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 014.*The path above/ }).click();
  if (assessment) await page.getByRole("button", { name: "Assessment 20 minutes.", exact: false }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
  await expect(page.getByRole("heading", { name: "PC-A cannot reach PC-B." })).toBeVisible();
}
async function run(page: Page, device: string, command: string, target = "", source = "", select = true) {
  await page.getByRole("tab", { name: /Investigate/ }).click();
  await page.getByRole("button", { name: device, exact: true }).click();
  if (target) await page.getByLabel("Observed destination", { exact: true }).selectOption(target);
  if (device !== "PC-A" && device !== "PC-B") await page.getByLabel("Source interface choice").selectOption(source);
  await page.getByRole("button", { name: command, exact: true }).click();
  if (select) await page.getByRole("button", { name: "Select output as evidence", exact: true }).click();
  return page.getByRole("region", { name: "Command output" });
}
async function collect(page: Page) {
  for (const d of ["PC-A", "PC-B"]) await run(page, d, "ipconfig", "", "", false);
  for (const d of ["R1", "T1", "R2"]) await run(page, d, "show ip interface brief", "", "", false);
  for (const d of ["R1", "R2"]) await run(page, d, "show running-config");
  await run(page, "R1", "show interfaces tunnel 0");
  for (const d of ["R1", "R2"]) await run(page, d, "show ip route");
  for (const t of ["198.51.100.1", "198.51.100.2"])
    await expect(await run(page, "R1", "ping", t, "Gi0/1")).toContainText("100 percent (5/5)");
  await expect(await run(page, "PC-A", "ping", "172.31.20.10")).toContainText("0 percent (0/5)");
}
async function change(page: Page, ip: string, version: number) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("Router to configure").selectOption("R1");
  await page.getByLabel("Tunnel to configure").selectOption("Tunnel0");
  await page.getByLabel("Replacement tunnel destination", { exact: true }).selectOption(ip);
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
  await expect(await run(page, "R1", "show interfaces tunnel 0")).toContainText("destination 198.51.100.2");
  for (const d of ["R1", "R2"]) await run(page, d, "show ip route");
  for (const [d, t, source] of [
    ["R1", "10.14.0.2", "Tunnel0"],
    ["R2", "10.14.0.1", "Tunnel0"],
    ["PC-A", "172.31.20.10", ""],
    ["PC-B", "172.31.10.10", ""],
  ])
    await expect(await run(page, d, "ping", t, source)).toContainText("100 percent (5/5)");
}
async function submit(page: Page, score = 100) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("Affected logical interface").selectOption("Tunnel0");
  await page.getByLabel("Initial observed tunnel destination", { exact: true }).selectOption("198.51.100.1");
  await page.getByLabel("Proposed tunnel destination", { exact: true }).selectOption("198.51.100.2");
  await page.getByLabel("Why does the correction work?").selectOption("gre-endpoint");
  await page.getByLabel("01 / Root cause").selectOption("incorrect-tunnel-destination");
  await page.getByLabel("R1", { exact: true }).check();
  await page.getByLabel("03 / Proposed remediation").selectOption("gre-destination");
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
  await expect(page.locator(".score")).toHaveText(new RegExp(`^${score}\\s*/\\s*100$`));
}
test("GRE practice: all devices, observed choices, wrong trial, reciprocal verification, preview and journal", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect(page.locator(".react-flow__edge-logical")).toHaveCount(1);
  await expect
    .poll(async () =>
      page
        .locator(".topology-gre .network-device")
        .first()
        .evaluate((el) => el.getBoundingClientRect().width),
    )
    .toBeGreaterThan(100);
  const controls = await page.locator(".topology-gre .react-flow__controls").boundingBox();
  for (const node of await page.locator(".topology-gre .network-device").all()) {
    const box = (await node.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(
      box.x + box.width <= controls!.x ||
        controls!.x + controls!.width <= box.x ||
        box.y + box.height <= controls!.y ||
        controls!.y + controls!.height <= box.y,
    ).toBe(true);
  }
  await page.locator(".topology-gre").screenshot({ path: info.outputPath("gre-topology.png") });
  await collect(page);
  await change(page, "198.51.100.1", 0);
  await change(page, "192.0.2.2", 1);
  await expect(await run(page, "PC-A", "ping", "172.31.20.10", "", false)).toContainText("0 percent (0/5)");
  await change(page, "198.51.100.2", 2);
  await change(page, "198.51.100.2", 2);
  for (const c of await page.locator(".repair-trial button, .repair-trial select").all())
    expect((await c.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.getByLabel("Router to configure").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Tunnel to configure")).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator(".repair-trial").screenshot({ path: info.outputPath("gre-repair.png") });
  await page.reload();
  await verify(page);
  await run(page, "R1", "show interfaces tunnel 0", "", "", false);
  await page
    .getByRole("region", { name: "Command output" })
    .screenshot({ path: info.outputPath("gre-current-tunnel.png") });
  await submit(page);
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  await expect(page.locator(".preview")).toContainText("PC-B> ping 172.31.10.10");
  await expect(page.locator(".preview")).toContainText("GRE");
  await page.getByText("Explanation — reveal when ready", { exact: true }).click();
  await expect(page.getByText(/^R1 Tunnel0 targets/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Your journal" }).click();
  const entry = page.locator(".journal-entry").filter({ hasText: "The path above" });
  await expect(entry).toContainText("100/100");
  await entry.getByRole("button", { name: "Open attempt" }).click();
  await page.getByText("Recorded configuration changes", { exact: true }).click();
  await expect(page.getByText(/Version 2: R1, Tunnel0/)).toBeVisible();
  expect(errors).toEqual([]);
});
test("GRE timed assessment resumes and completes without preparation or hints", async ({ page }) => {
  await open(page, true);
  await expect(page.locator("#gre-preparation-v1")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Next hint|Reveal solution/ })).toHaveCount(0);
  await collect(page);
  await change(page, "198.51.100.2", 1);
  await page.reload();
  await verify(page);
  await submit(page);
});
test("GRE applied correction alone cannot verify recovery", async ({ page }) => {
  await open(page);
  await collect(page);
  await change(page, "198.51.100.2", 1);
  await submit(page, 80);
  await expect(
    page.getByText("Recovered configuration; fresh verification is incomplete.", { exact: true }),
  ).toBeVisible();
});
test("GRE cached practice completes after an offline reload and reopens", async ({ page, context }) => {
  test.skip(!process.env.PW_PRODUCTION, "Production worker required");
  await open(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  try {
    await page.reload();
    await collect(page);
    await change(page, "198.51.100.2", 1);
    await verify(page);
    await submit(page);
    await page.reload();
    await page.getByRole("button", { name: "Your journal" }).click();
    await expect(page.locator(".journal-entry").filter({ hasText: "The path above" })).toContainText("100/100");
  } finally {
    await context.setOffline(false);
  }
});
test("unrelated GRE primer uses touch choices and requested reasoning", async ({ page }, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 014.*The path above/ }).click();
  await page.getByText("Optional preparation · Two layers, one journey", { exact: true }).click();
  const primer = page.locator("#gre-preparation-v1");
  for (const value of ["172.31.", "10.14.0.", "198.51.100.1,", "PC-A", "R1"])
    await expect(primer).not.toContainText(value);
  await page.getByRole("radio", { name: "Inner logical interface", exact: true }).check();
  await page.getByRole("radio", { name: "Tunnel0 is locally up/up", exact: true }).check();
  await page.getByRole("button", { name: "Check layered reasoning" }).click();
  await expect(page.getByText(/Revisit the address's job/)).toBeVisible();
  await page.getByRole("radio", { name: "Physical underlay endpoint", exact: true }).check();
  await page.getByRole("radio", { name: "Successful inner exchanges in both directions", exact: true }).check();
  await page.getByRole("button", { name: "Check layered reasoning" }).click();
  await expect(page.getByText(/Both distinctions are correct/)).toBeVisible();
  await page.getByRole("button", { name: "Reveal preparation reasoning" }).click();
  await expect(page.getByText(/^Cedar's 192.0.2.5/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await primer.screenshot({ path: info.outputPath("gre-primer.png") });
});
