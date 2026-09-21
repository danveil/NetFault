import { test, expect, type Page } from "@playwright/test";
import { labs } from "../../src/lib/catalog";
async function open(page: Page, assessment = false) {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 006.*The Mismatched Timers/ }).click();
  if (assessment) await page.getByRole("button", { name: "Assessment 20 minutes.", exact: false }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
}
async function run(page: Page, device: string, command: string) {
  await page.getByRole("tab", { name: /Investigate/ }).click();
  await page.getByRole("button", { name: device, exact: true }).click();
  await page.getByRole("button", { name: command, exact: true }).click();
  return page.getByRole("region", { name: "Command output" });
}
async function collect(page: Page) {
  for (const [device, command] of [
    ["R2", "show ip ospf interface"],
    ["R3", "show ip ospf interface"],
    ["R2", "show ip ospf neighbor"],
    ["R3", "show ip route"],
  ]) {
    await run(page, device, command);
    await page.getByRole("button", { name: "Select output as evidence", exact: true }).click();
  }
}
async function diagnose(page: Page) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("01 / Root cause").selectOption("timer-mismatch");
  await page.getByLabel("R3", { exact: true }).check();
  await page.getByLabel("Affected interface").selectOption("Gi0/0");
  await page.getByLabel("Proposed Hello interval").fill("10");
  await page.getByLabel("Proposed Dead interval").fill("40");
  await page.getByLabel("03 / Proposed remediation").selectOption("timers");
  await page.getByLabel("Why does the correction work?").selectOption("timer-compatibility");
  await page
    .getByLabel("Your reasoning", { exact: false })
    .fill("Both endpoint profiles must agree; the design is 10/40.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
  await expect(page.locator(".score")).toContainText("100");
  for (const name of [
    "1. Simple explanation",
    "3. Technical mechanism",
    "4. Worked LAB 006 example",
    "5. Guided troubleshooting",
    "6. Independent practice",
  ])
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const solution = page.getByText(/Fir Gi0\/0 has the incorrect Dead interval/);
  await expect(solution).not.toBeVisible();
  await page.getByText("7. Independent exercise solution — reveal when ready", { exact: true }).click();
  await expect(solution).toBeVisible();
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  const preview = await page.locator(".preview").innerText();
  expect(preview.split("AFTER REPAIR")[0]).toContain("Hello 5, Dead 20");
  expect(preview.split("AFTER REPAIR")[1]).not.toContain("Hello 5, Dead 20");
  expect(preview).toContain("FULL/-");
  expect(preview).toContain("Bidirectional communication: successful");
  expect(preview).not.toContain("Unsupported");
}
test("timer practice: every device, evidence, four hints, lessons, repair and saved journal", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect(await run(page, "PC-A", "ipconfig /all")).toContainText("192.168.10.1");
  await expect(await run(page, "PC-B", "ipconfig")).toContainText("192.168.30.1");
  await expect(await run(page, "R1", "show ip ospf neighbor")).toContainText("2.2.2.2");
  await expect(await run(page, "R2", "show ip ospf interface")).toContainText("Hello 10, Dead 40");
  await expect(await run(page, "R3", "show ip ospf interface")).toContainText("Hello 5, Dead 20");
  await expect(await run(page, "PC-A", "ping")).toContainText("0 percent (0/5)");
  await collect(page);
  for (let n = 0; n < 4; n++) await page.getByRole("button", { name: `Next hint (${n}/4)`, exact: true }).click();
  await expect(page.getByRole("button", { name: "Next hint (4/4)", exact: true })).toBeDisabled();
  for (const b of await page.locator(".command-button").all())
    expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: info.outputPath("timer-inspection.png"), fullPage: true });
  await diagnose(page);
  await page.screenshot({ path: info.outputPath("timer-feedback.png"), fullPage: true });
  await page.reload();
  await page.getByRole("button", { name: "Your journal" }).click();
  const entry = page.locator(".journal-entry").filter({ hasText: "The Mismatched Timers" });
  await expect(entry).toContainText("100/100");
  await expect(entry).toContainText("4 hints");
  await entry.getByRole("button", { name: "Open attempt" }).click();
  await expect(page.getByText(/Submitted timer profile: Hello 10/)).toBeVisible();
  expect(errors).toEqual([]);
});
test("timer assessment retains server history and timed no-hint boundary", async ({ page }) => {
  await open(page, true);
  await expect(page.getByText("remaining", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Next hint/ })).toHaveCount(0);
  await collect(page);
  await page.reload();
  await diagnose(page);
});
test("all cached packs survive offline and timer lab completes offline", async ({ page, context }) => {
  test.skip(!process.env.PW_PRODUCTION, "Production worker only");
  await page.goto("/");
  for (const lab of labs) {
    await page.getByRole("button", { name: new RegExp(`LAB ${lab.number}.*${lab.title}`) }).click();
    await page.getByRole("button", { name: "Start investigation" }).click();
    await run(page, "PC-A", "ipconfig");
    await page.getByRole("button", { name: "Lab bench (attempt saved)" }).click();
  }
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  try {
    await page.reload();
    await page.getByRole("button", { name: "Your journal" }).click();
    for (const lab of labs) {
      await page
        .locator(".journal-entry")
        .filter({ hasText: lab.title })
        .getByRole("button", { name: "Open attempt" })
        .click();
      await expect(await run(page, "PC-A", "ipconfig")).toContainText("192.168.10.10");
      if (lab.id === "timer-01") {
        await collect(page);
        await diagnose(page);
      }
      await page.getByRole("button", { name: "Your journal" }).click();
    }
    await expect(page.locator(".journal-entry").filter({ hasText: "The Mismatched Timers" })).toContainText("100/100");
  } finally {
    await context.setOffline(false);
  }
});
