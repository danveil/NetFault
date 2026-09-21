import { test, expect, type Page } from "@playwright/test";
import { labs } from "../../src/lib/catalog";
async function open(page: Page, assessment = false) {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 007.*The Wrong Next Hop/ }).click();
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
    ["R2", "show ip route"],
    ["R3", "show ip interface brief"],
    ["R1", "show ip route"],
    ["R3", "show ip route"],
  ]) {
    await run(page, device, command);
    await page.getByRole("button", { name: "Select output as evidence", exact: true }).click();
  }
}
async function diagnose(page: Page) {
  await page.getByRole("tab", { name: /Diagnose/ }).click();
  await page.getByLabel("01 / Root cause").selectOption("incorrect-static-next-hop");
  await page.getByLabel("R2", { exact: true }).check();
  await page.getByLabel("Affected destination network (CIDR)").fill("192.168.30.0/24");
  await page.getByLabel("Observed incorrect next-hop IPv4 address").fill("10.0.12.1");
  await page.getByLabel("Proposed next-hop IPv4 address").fill("10.0.23.2");
  await page.getByLabel("03 / Proposed remediation").selectOption("static-route");
  await page.getByLabel("Why does the correction work?").selectOption("forward-route");
  await page
    .getByLabel("Your reasoning", { exact: false })
    .fill("The installed next hop loops back through R1; replace it toward R3.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
  await expect(page.locator(".score")).toContainText("100");
  for (const name of [
    "1. Simple explanation",
    "3. Technical mechanism",
    "4. Worked LAB 007 example",
    "5. Guided troubleshooting",
    "6. Independent practice",
  ])
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const solution = page.getByText(/Core.s western-LAN route is wrong/);
  await expect(solution).not.toBeVisible();
  await page.getByText("7. Independent exercise solution — reveal when ready", { exact: true }).click();
  await expect(solution).toBeVisible();
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  const preview = await page.locator(".preview").innerText();
  expect(preview.split("AFTER REPAIR")[0]).toContain("Routing loop");
  expect(preview.split("AFTER REPAIR")[0]).toContain("No reply generated: request was not delivered.");
  expect(preview.split("AFTER REPAIR")[1]).not.toContain("Routing loop");
  expect(preview.split("AFTER REPAIR")[1]).toContain("ip route 192.168.30.0 255.255.255.0 10.0.23.2");
  expect(preview).toContain("Bidirectional communication: successful");
  expect(preview).not.toContain("Unsupported");
}
test("next-hop practice: every device, evidence, four hints, lessons, repair and saved journal", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect(await run(page, "PC-A", "ipconfig /all")).toContainText("192.168.10.1");
  await expect(await run(page, "PC-B", "ipconfig")).toContainText("192.168.30.1");
  await expect(await run(page, "R1", "show ip route")).toContainText("10.0.12.2");
  await expect(await run(page, "R2", "show ip route")).toContainText("10.0.12.1");
  await expect(await run(page, "R3", "show ip interface brief")).toContainText("10.0.23.2");
  await expect(await run(page, "PC-A", "ping")).toContainText("0 percent (0/5)");
  await collect(page);
  for (let n = 0; n < 4; n++) await page.getByRole("button", { name: `Next hint (${n}/4)`, exact: true }).click();
  await expect(page.getByRole("button", { name: "Next hint (4/4)", exact: true })).toBeDisabled();
  for (const b of await page.locator(".command-button").all())
    expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: info.outputPath("next-hop-inspection.png"), fullPage: true });
  await diagnose(page);
  await page.screenshot({ path: info.outputPath("next-hop-feedback.png"), fullPage: true });
  await page.reload();
  await page.getByRole("button", { name: "Your journal" }).click();
  const entry = page.locator(".journal-entry").filter({ hasText: "The Wrong Next Hop" });
  await expect(entry).toContainText("100/100");
  await expect(entry).toContainText("4 hints");
  await entry.getByRole("button", { name: "Open attempt" }).click();
  await expect(page.getByText(/Observed next hop: 10.0.12.1/)).toBeVisible();
  expect(errors).toEqual([]);
});
test("next-hop assessment retains server history and timed no-hint boundary", async ({ page }) => {
  await open(page, true);
  await expect(page.getByText("remaining", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Next hint/ })).toHaveCount(0);
  await collect(page);
  await page.reload();
  await diagnose(page);
});
test("all cached packs survive offline and next-hop lab completes offline", async ({ page, context }) => {
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
      if (lab.id === "next-hop-01") {
        await collect(page);
        await diagnose(page);
      }
      await page.getByRole("button", { name: "Your journal" }).click();
    }
    await expect(page.locator(".journal-entry").filter({ hasText: "The Wrong Next Hop" })).toContainText("100/100");
  } finally {
    await context.setOffline(false);
  }
});
