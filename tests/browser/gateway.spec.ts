import { test, expect, type Page } from "@playwright/test";

async function open(page: Page, assessment = false) {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 002.*Beyond the local network/ }).click();
  if (assessment) await page.getByRole("button", { name: "Assessment 20 minutes.", exact: false }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
  await expect(page.getByRole("heading", { name: "Beyond the local network", exact: true })).toBeVisible();
}
async function run(page: Page, device: string, command: string) {
  await page.getByRole("button", { name: device, exact: true }).click();
  await page.getByRole("button", { name: command, exact: true }).click();
  return page.getByRole("region", { name: "Command output" });
}
async function diagnose(page: Page) {
  await page.getByRole("tab", { name: "Diagnose", exact: false }).click();
  await page.getByLabel("01 / Root cause").selectOption("wrong-gateway");
  await page.getByLabel("PC-A", { exact: true }).check();
  await page.getByLabel("03 / Proposed remediation").selectOption("gateway");
  await page.getByLabel("Correct default gateway", { exact: true }).fill("192.168.10.1");
  if (page.viewportSize()?.width === 414) {
    expect(
      await page
        .getByLabel("Correct default gateway", { exact: true })
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    expect(await page.evaluate(() => window.visualViewport?.scale ?? 1)).toBeCloseTo(1);
  }
  await page.getByLabel("Why does the correction work?").selectOption("on-link-router");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A diagnosis backed by evidence." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2. Analogy — leaving your neighborhood" })).toBeVisible();
}

test("gateway practice: every device, local/remote symptoms, evidence, repair and journal", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect(page.getByRole("heading", { name: "1. Simple explanation" })).toHaveCount(0);
  await expect(await run(page, "PC-A", "ipconfig /all")).toContainText("192.168.10.254");
  await page.getByRole("button", { name: "Select output as evidence", exact: true }).click();
  await expect(await run(page, "PC-A", "route print")).toContainText("On-link");
  await page.getByLabel("Destination IPv4").fill("192.168.10.1");
  await expect(await run(page, "PC-A", "ping")).toContainText("100 percent");
  await page.getByLabel("Destination IPv4").fill("192.168.20.10");
  await expect(await run(page, "PC-A", "ping")).toContainText("0 percent (0/5)");
  await expect(await run(page, "PC-A", "tracert")).toContainText("next-hop resolution failed");
  await expect(await run(page, "SW1", "show vlan brief")).toContainText("Gi0/1, Gi0/2");
  await expect(page.getByLabel("Destination IPv4")).toHaveCount(0);
  await expect(await run(page, "SW1", "show interfaces status")).toContainText("connected");
  await expect(await run(page, "R1", "show ip route")).toContainText("192.168.20.0/24");
  await expect(await run(page, "R2", "show running-config")).toContainText("192.168.20.1");
  await expect(await run(page, "PC-B", "ipconfig")).toContainText("192.168.20.1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  await page.screenshot({ path: info.outputPath("gateway-investigation.png"), fullPage: true });
  await diagnose(page);
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  await expect(page.locator(".preview")).toContainText("3  192.168.20.10");
  await expect(page.locator(".preview")).toContainText("100 percent");
  await expect(page.locator(".preview")).not.toContainText("Unsupported");
  await page.reload();
  await page.getByRole("button", { name: "Your journal" }).click();
  const entry = page.locator(".journal-entry").filter({ hasText: "Beyond the local network" });
  await expect(entry).toContainText("100/100");
  await entry.getByRole("button", { name: "Open attempt" }).click();
  await expect(page.getByRole("heading", { name: "1. Simple explanation" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("gateway assessment resumes server history and grades the structured correction", async ({ page }) => {
  await open(page, true);
  await expect(page.getByText("remaining", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Next hint/ })).toHaveCount(0);
  await run(page, "PC-A", "ipconfig");
  await page.getByRole("button", { name: "Select output as evidence", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("region", { name: "Command output" })).toContainText("192.168.10.254");
  await diagnose(page);
});

test("both offline packs and journals stay separate when changing labs", async ({ page, context }) => {
  test.skip(!process.env.PW_PRODUCTION, "Production offline worker only.");
  await open(page);
  await run(page, "PC-A", "ipconfig");
  await page.getByRole("button", { name: "Select output as evidence", exact: true }).click();
  await page.getByRole("button", { name: "Lab bench (attempt saved)" }).click();
  await page.getByRole("button", { name: /LAB 001.*The silent route/ }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
  await expect(await run(page, "PC-A", "ipconfig")).toContainText("192.168.10.1");
  await expect(page.getByRole("region", { name: "Command output" })).not.toContainText("192.168.10.254");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.getByRole("button", { name: "Your journal" }).click();
  await expect(page.locator(".journal-entry")).toHaveCount(2);
  await page
    .locator(".journal-entry")
    .filter({ hasText: "Beyond the local network" })
    .getByRole("button", { name: "Open attempt" })
    .click();
  await page.reload();
  await expect(await run(page, "PC-A", "route print")).toContainText("192.168.10.254");
  await diagnose(page);
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  await expect(page.locator(".preview")).toContainText("100 percent");
  await context.setOffline(false);
});

test("gateway assessment payload and scripts omit private answers", async ({ page, request }) => {
  const response = await request.post("/api/lab", { data: { action: "start", scenario: "gateway-01" } });
  const { attempt } = await response.json();
  expect(attempt.scenario).toBe("gateway-01");
  expect(attempt).not.toHaveProperty("feedback");
  expect(attempt).not.toHaveProperty("repair");
  expect(attempt).not.toHaveProperty("lesson");
  await page.goto("/");
  expect(await page.content()).not.toContain("192.168.10.254");
  for (const src of await page
    .locator("script[src]")
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLScriptElement).src))) {
    const js = await (await request.get(src)).text();
    expect(js).not.toContain("192.168.10.254");
    expect(js).not.toContain("PC-A is configured with default gateway");
    expect(js).not.toContain("PC-A's configured gateway");
  }
});
