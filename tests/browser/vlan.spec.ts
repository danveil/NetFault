import { test, expect, type Page } from "@playwright/test";

async function open(page: Page, assessment = false) {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 003.*The Wrong Network/ }).click();
  if (assessment) await page.getByRole("button", { name: "Assessment 20 minutes.", exact: false }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
  await expect(page.getByRole("heading", { name: "The Wrong Network", exact: true })).toBeVisible();
}
async function run(page: Page, device: string, command: string) {
  await page.getByRole("button", { name: device, exact: true }).click();
  await page.getByRole("button", { name: command, exact: true }).click();
  return page.getByRole("region", { name: "Command output" });
}
async function selectEvidence(page: Page) {
  await page.getByRole("button", { name: "Select output as evidence", exact: true }).click();
}
async function diagnose(page: Page) {
  await page.getByRole("tab", { name: "Diagnose", exact: false }).click();
  await page.getByLabel("01 / Root cause").selectOption("access-vlan");
  await page.getByLabel("SW1", { exact: true }).check();
  await page.getByLabel("Affected interface", { exact: true }).selectOption("FastEthernet0/1");
  await page.getByLabel("Observed access VLAN").selectOption("20");
  await page.getByLabel("Intended access VLAN").selectOption("10");
  await page.getByLabel("03 / Proposed remediation").selectOption("access-vlan");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A diagnosis backed by evidence." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "6. Independent practice", exact: true })).toBeVisible();
  const solution = page.getByText(/The gateway-facing port must move from VLAN 50/);
  await expect(solution).not.toBeVisible();
  await page.getByText("7. Independent exercise solution — reveal when ready", { exact: true }).click();
  await expect(solution).toBeVisible();
}
async function preview(page: Page) {
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  const panel = page.locator(".preview");
  await expect(panel).toContainText("Access Mode VLAN: 20 (OTHER_LAN)");
  await expect(panel).toContainText("Access Mode VLAN: 10 (STUDENT_LAN)");
  await expect(panel).toContainText("No ARP Entries Found.");
  await expect(panel).toContainText("02-00-00-00-00-02");
  await expect(panel).toContainText("100 percent");
  await expect(panel).toContainText("3  192.168.20.10");
  await expect(panel).not.toContainText("Unsupported");
}

test("VLAN practice: all devices, switch evidence, ARP, grading, teaching and saved repair", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect(page.locator(".incident").getByText(/VLAN 20/)).toHaveCount(0);
  await expect(await run(page, "PC-A", "ipconfig /all")).toContainText("192.168.10.1");
  await selectEvidence(page);
  await expect(await run(page, "PC-A", "arp -a")).toContainText("no locally initiated");
  await page.getByLabel("Destination IPv4").fill("192.168.10.1");
  await expect(await run(page, "PC-A", "ping")).toContainText("0 percent (0/5)");
  await expect(await run(page, "PC-A", "arp -a")).toContainText("failed; no resolved MAC entry");
  await page.getByLabel("Destination IPv4").fill("192.168.20.10");
  await expect(await run(page, "PC-A", "tracert")).toContainText("next-hop resolution failed");
  await expect(await run(page, "SW1", "show interfaces status")).toContainText("connected");
  await expect(await run(page, "SW1", "show interfaces fastethernet0/1 switchport")).toContainText(
    "Access Mode VLAN: 20",
  );
  await selectEvidence(page);
  await expect(await run(page, "SW1", "show interfaces fastethernet0/24 switchport")).toContainText(
    "Access Mode VLAN: 10",
  );
  await selectEvidence(page);
  await expect(await run(page, "SW1", "show running-config")).toContainText("switchport access vlan 20");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  await page.screenshot({ path: info.outputPath("vlan-switch-inspection.png"), fullPage: true });
  await expect(await run(page, "R1", "show ip route")).toContainText("192.168.20.0/24");
  await expect(await run(page, "R2", "show ip interface brief")).toContainText("192.168.20.1");
  await expect(await run(page, "PC-B", "ipconfig")).toContainText("192.168.20.10");
  await diagnose(page);
  await preview(page);
  await page.reload();
  await page.getByRole("button", { name: "Your journal" }).click();
  const entry = page.locator(".journal-entry").filter({ hasText: "The Wrong Network" });
  await expect(entry).toContainText("100/100");
  await entry.getByRole("button", { name: "Open attempt" }).click();
  await expect(page.getByRole("heading", { name: "1. Simple explanation", exact: true })).toBeVisible();
  await page.getByText("Your submitted diagnosis & reasoning", { exact: true }).click();
  await expect(page.locator("details").filter({ hasText: "Your submitted diagnosis & reasoning" })).toContainText(
    "FastEthernet0/1",
  );
  expect(errors).toEqual([]);
});

test("VLAN assessment: alternate investigation order, resumed ARP history, server grading", async ({ page }) => {
  await open(page, true);
  await expect(page.getByText("remaining", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Next hint/ })).toHaveCount(0);
  await run(page, "SW1", "show vlan brief");
  await selectEvidence(page);
  await run(page, "PC-A", "ipconfig");
  await selectEvidence(page);
  await page.getByLabel("Destination IPv4").fill("192.168.10.1");
  await run(page, "PC-A", "ping");
  await page.reload();
  await expect(await run(page, "PC-A", "arp -a")).toContainText("failed; no resolved MAC entry");
  await diagnose(page);
});

test("all three cached packs survive offline reload and VLAN practice completes", async ({ page, context }) => {
  test.skip(!process.env.PW_PRODUCTION, "Production offline worker only.");
  await open(page);
  await run(page, "PC-A", "ipconfig");
  await selectEvidence(page);
  await run(page, "SW1", "show vlan brief");
  await selectEvidence(page);
  for (const label of [/LAB 001.*The silent route/, /LAB 002.*Beyond the local network/]) {
    await page.getByRole("button", { name: "Lab bench (attempt saved)" }).click();
    await page.getByRole("button", { name: label }).click();
    await page.getByRole("button", { name: "Start investigation" }).click();
    await run(page, "PC-A", "ipconfig");
  }
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  for (const [title, gateway] of [
    ["The silent route", "192.168.10.1"],
    ["Beyond the local network", "192.168.10.254"],
    ["The Wrong Network", "192.168.10.1"],
  ]) {
    await page.getByRole("button", { name: "Your journal" }).click();
    await expect(page.locator(".journal-entry")).toHaveCount(3);
    await page
      .locator(".journal-entry")
      .filter({ hasText: title })
      .getByRole("button", { name: "Open attempt" })
      .click();
    await page.reload();
    await expect(await run(page, "PC-A", "ipconfig")).toContainText(gateway);
  }
  await page.getByLabel("Destination IPv4").fill("192.168.10.1");
  await run(page, "PC-A", "ping");
  await expect(await run(page, "PC-A", "arp -a")).toContainText("failed; no resolved MAC entry");
  await diagnose(page);
  await preview(page);
  await context.setOffline(false);
});

test("fresh VLAN assessments and client scripts omit fault, rubric and lesson answers", async ({ page, request }) => {
  const response = await request.post("/api/lab", { data: { action: "start", scenario: "vlan-01" } });
  expect(response.headers()["cache-control"]).toBe("no-store");
  const { attempt } = await response.json();
  expect(attempt.scenario).toBe("vlan-01");
  expect(attempt.history).toEqual([]);
  for (const key of ["fault", "repair", "feedback", "lesson", "evidenceRules"]) expect(attempt).not.toHaveProperty(key);
  await page.goto("/");
  const forbidden = [
    "switchport access vlan 20",
    "SW1 FastEthernet0/1 places PC-A",
    "The gateway-facing port must move from VLAN 50",
  ];
  for (const text of forbidden) expect(await page.content()).not.toContain(text);
  for (const src of await page
    .locator("script[src]")
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLScriptElement).src))) {
    const js = await (await request.get(src)).text();
    for (const text of forbidden) expect(js).not.toContain(text);
  }
});
