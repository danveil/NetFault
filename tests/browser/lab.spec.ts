import { test, expect, type Page } from "@playwright/test";
async function command(page: Page, device: string, cmd: string) {
  await page.getByRole("button", { name: device, exact: true }).click();
  await page.getByRole("button", { name: cmd, exact: true }).click();
  await expect(page.getByRole("region", { name: "Command output" })).toContainText(cmd);
}
async function collect(page: Page) {
  for (const [d, c] of [
    ["R2", "show ip ospf interface"],
    ["R3", "show running-config"],
    ["R2", "show ip ospf neighbor"],
    ["R1", "show ip route"],
  ]) {
    await command(page, d, c);
    await page.getByRole("button", { name: "Select output as evidence", exact: true }).click();
  }
}
async function diagnose(page: Page) {
  await page.getByRole("tab", { name: "Diagnose", exact: false }).click();
  await page.getByLabel("01 / Root cause").selectOption("area-mismatch");
  await page.getByLabel("R2", { exact: true }).check();
  await page.getByLabel("R3", { exact: true }).check();
  await page.getByLabel("03 / Proposed remediation").selectOption("r3-area0");
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
}
test("practice: incident → investigation → evidence → grade → saved journal", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Find the fault. Build your instincts." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("lab-bench.png"), fullPage: true });
  await page.getByRole("button", { name: "Start investigation" }).click();
  await expect(page.getByRole("heading", { name: "PC-A cannot reach PC-B." })).toBeVisible();
  await command(page, "PC-A", "ipconfig");
  await expect(page.getByRole("region", { name: "Command output" })).toContainText("192.168.10.1");
  await command(page, "PC-A", "ping");
  await expect(page.getByRole("region", { name: "Command output" })).toContainText("0 percent");
  await page.getByRole("button", { name: "Next hint (0/3)" }).click();
  await expect(page.getByText("Begin at PC-A.", { exact: false })).toBeVisible();
  await collect(page);
  await page.screenshot({ path: testInfo.outputPath("investigation.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("tab", { name: "Evidence (4)" }).click();
  await expect(page.getByRole("heading", { name: "Investigation notebook" })).toBeVisible();
  await diagnose(page);
  await expect(page.getByRole("heading", { name: "A diagnosis backed by evidence." })).toBeVisible();
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  await expect(page.locator(".preview")).toContainText("100 percent");
  await page.reload();
  await page.getByRole("tab", { name: "Feedback" }).click();
  await expect(page.getByRole("heading", { name: "A diagnosis backed by evidence." })).toBeVisible();
  await page.getByRole("button", { name: "Your journal" }).click();
  await expect(page.getByText("100/100", { exact: true })).toBeVisible();
  await expect(page.locator(".journal-entry")).toContainText("1 hints");
  expect(errors).toEqual([]);
});
test("assessment is timed, no hints or guide, server grades recorded commands", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Assessment 20 minutes.", exact: false }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
  await expect(page.getByText("remaining", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Next hint/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Field guide" }).click();
  await expect(page.getByRole("status").filter({ hasText: "available after your assessment" })).toBeVisible();
  await collect(page);
  await diagnose(page);
  await expect(page.getByRole("heading", { name: "A diagnosis backed by evidence." })).toBeVisible();
});
test("retry, keyboard controls, destination validation, history and partial grading", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start investigation" }).click();
  await page.getByLabel("Destination IPv4").fill("invalid");
  await command(page, "PC-A", "ping");
  await expect(page.getByRole("region", { name: "Command output" })).toContainText("dotted IPv4");
  await page.getByRole("button", { name: "R2", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "show ip ospf interface", exact: true }).click();
  await expect(page.getByRole("region", { name: "Command output" })).toContainText("Area 0");
  await diagnose(page);
  await expect(page.locator(".score")).toContainText("70");
  await page.getByRole("button", { name: "Return to lab bench" }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
  await page.getByRole("tab", { name: "Evidence (0)" }).click();
  await expect(page.getByRole("heading", { name: "No observations yet" })).toBeVisible();
});
test("fresh assessment payloads and static JS do not contain private answer content", async ({ page, request }) => {
  const response = await request.post("/api/lab", { data: { action: "start" } });
  expect(response.ok()).toBe(true);
  const { attempt } = await response.json();
  expect(attempt).not.toHaveProperty("feedback");
  expect(attempt).not.toHaveProperty("fault");
  expect(attempt.hints).toEqual([]);
  const invalid = await request.post("/api/lab", { data: { action: "hint", id: attempt.id } });
  expect(invalid.status()).toBe(400);
  await page.goto("/");
  const scripts = await page
    .locator("script[src]")
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLScriptElement).src));
  for (const src of scripts) {
    const text = await (await request.get(src)).text();
    expect(text).not.toContain("R2 Gi0/1 uses area 0, but R3 Gi0/0 uses area 1.");
    expect(text).not.toContain("Neighbor and route impact");
    expect(text).not.toContain("R3# configure terminal");
  }
});
test("assessment API rejects forged evidence and repeat submit cannot revise grade", async ({ request }) => {
  const { attempt } = await (await request.post("/api/lab", { data: { action: "start" } })).json();
  const diagnosis = {
    cause: "area-mismatch",
    devices: ["R2", "R3"],
    fix: "r3-area0",
    evidence: ["invented"],
    notes: "Perfect evidence, trust me",
  };
  const first = await (
    await request.post("/api/lab", { data: { action: "submit", id: attempt.id, diagnosis } })
  ).json();
  expect(first.attempt.feedback.score).toBe(70);
  const again = await (
    await request.post("/api/lab", {
      data: { action: "submit", id: attempt.id, diagnosis: { ...diagnosis, cause: "wrong-gateway" } },
    })
  ).json();
  expect(again.attempt).toEqual(first.attempt);
});
test("offline practice reload and journal work with production service worker", async ({ page, context }) => {
  test.skip(!process.env.PW_PRODUCTION, "Service worker is deliberately disabled in development.");
  await page.goto("/");
  await page.getByRole("button", { name: "Start investigation" }).click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByRole("heading", { name: "PC-A cannot reach PC-B." })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await command(page, "PC-A", "ipconfig");
  await collect(page);
  await diagnose(page);
  await expect(page.getByRole("heading", { name: "A diagnosis backed by evidence." })).toBeVisible();
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  await expect(page.locator(".preview")).toContainText("100 percent");
  await page.getByRole("button", { name: "Your journal" }).click();
  await expect(page.getByText("100/100", { exact: true })).toBeVisible();
  await context.setOffline(false);
});
