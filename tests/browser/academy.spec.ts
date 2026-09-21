import { expect, test, type Page } from "@playwright/test";
const enter = async (page: Page) =>
  page.getByRole("button", { name: "Learn networking / Field guide", exact: true }).click();
async function openLesson(page: Page, number: number) {
  await page.getByRole("button", { name: "Academy home", exact: true }).click();
  await page.getByRole("button", { name: "Explore module" }).click();
  await page.getByRole("button", { name: `Open lesson ${number}`, exact: true }).click();
}
test("Academy pilot: structured exercises, requested solutions, refresh, resume and neutral lab links", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const actions: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/lab")) actions.push(request.postDataJSON()?.action);
  });
  await page.goto("/");
  await enter(page);
  await expect(page.getByRole("heading", { name: "Your modules" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("academy-home.png"), fullPage: true });
  await openLesson(page, 1);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.getByRole("region", { name: "Detailed solution" })).toHaveCount(0);
  const guided = page.getByRole("article", { name: "Which examples have valid IPv4 dotted-decimal format?" });
  await guided.getByLabel("10.4.8.12", { exact: true }).selectOption("Valid");
  await guided.getByLabel("192.168.1.256", { exact: true }).selectOption("Invalid");
  await guided.getByLabel("172.16.20", { exact: true }).selectOption("Invalid");
  await guided.getByRole("button", { name: "Check answers" }).click();
  await expect(guided.getByRole("status")).toContainText("Correct — exercise completed");
  const independent = page.getByRole("article", { name: "Read 172.16.5.90 and identify the information it contains." });
  await independent.getByRole("button", { name: "Show detailed solution" }).click();
  await expect(independent.getByRole("region", { name: "Detailed solution" })).toContainText("does not complete");
  await page.getByRole("button", { name: "Mark lesson read", exact: true }).click();
  await page.reload();
  await enter(page);
  await page.getByRole("button", { name: "Continue lesson" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Understanding IPv4 Addresses");
  await expect(page.locator(".academy-objectives")).toContainText("Read · Practiced · 1/2");
  await expect(page.getByRole("region", { name: "Detailed solution" })).toHaveCount(2);
  await openLesson(page, 2);
  const subnet = page.getByRole("article", { name: "Find the subnet boundaries for 192.168.50.140/26." });
  for (const [label, value] of [
    ["Network address", "192.168.50.128"],
    ["Broadcast address", "192.168.50.191"],
    ["First usable host", "192.168.50.129"],
    ["Last usable host", "192.168.50.190"],
  ])
    await subnet.getByLabel(label, { exact: true }).fill(value);
  await subnet.getByRole("button", { name: "Check answers" }).click();
  await expect(subnet.getByRole("status")).toContainText("Correct — exercise completed");
  await page.screenshot({ path: info.outputPath("academy-subnet.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await openLesson(page, 3);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Default Gateways and ARP");
  await expect(page.getByText(/LAB 002 does not offer it/)).toBeVisible();
  await page.getByRole("button", { name: /LAB 002/ }).click();
  await expect(page.locator(".lab-card h2")).toHaveText("Beyond the local network");
  await expect(page.getByRole("button", { name: "Start investigation" })).toBeVisible();
  expect(actions).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem("netfault.journal.v1"))).toBeNull();
  await enter(page);
  await page.getByRole("button", { name: "Continue lesson" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Default Gateways and ARP");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle)).not.toBe("none");
  expect(errors).toEqual([]);
});

test("original guides remain accessible; practice draft and evidence survive Academy navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open the field guide" }).click();
  await expect(page.getByRole("heading", { name: "Your Field Guides" })).toBeVisible();
  await expect(page.locator("details.lesson")).toHaveCount(4);
  for (const item of await page.locator("details.lesson summary").all()) {
    await item.click();
  }
  await expect(page.getByText("Explain why changing a local OSPF process ID", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: /Troubleshooting labs/ }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
  await page.getByRole("button", { name: "ipconfig", exact: true }).click();
  await expect(page.getByRole("region", { name: "Command output" })).toContainText("static IPv4 configuration");
  await page.getByRole("button", { name: "Select output as evidence", exact: true }).click();
  await page.getByRole("tab", { name: "Diagnose", exact: false }).click();
  await page.getByLabel("Your reasoning").fill("Keep this practice draft.");
  const before = await page.evaluate(() => localStorage.getItem("netfault.journal.v1"));
  await enter(page);
  await openLesson(page, 3);
  await page.getByRole("button", { name: /Troubleshooting labs/ }).click();
  await expect(page.getByLabel("Your reasoning")).toHaveValue("Keep this practice draft.");
  expect(await page.evaluate(() => localStorage.getItem("netfault.journal.v1"))).toBe(before);
  await enter(page);
  await openLesson(page, 3);
  await page.getByRole("button", { name: /LAB 002/ }).click();
  expect(await page.evaluate(() => localStorage.getItem("netfault.journal.v1"))).toBe(before);
  await page.getByRole("button", { name: "Your journal", exact: true }).click();
  await page.getByRole("button", { name: "Open attempt", exact: false }).click();
  await page.getByRole("tab", { name: "Diagnose", exact: false }).click();
  await expect(page.getByLabel("Your reasoning")).toHaveValue("Keep this practice draft.");
  await expect(page.getByText("04 / 1 evidence items selected")).toBeVisible();
});

test("active assessment blocks Academy without changing server deadline or history", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Assessment 20 minutes/ }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
  await page.getByRole("button", { name: "ipconfig", exact: true }).click();
  await expect(page.getByRole("region", { name: "Command output" })).toContainText("static IPv4 configuration");
  const before = await page.evaluate(() => localStorage.getItem("netfault.journal.v1"));
  await enter(page);
  await expect(page.getByText(/available after your assessment ends/)).toBeVisible();
  await expect(page.locator(".academy")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("netfault.journal.v1"))).toBe(before);
  await page.reload();
  await enter(page);
  await expect(page.locator(".academy")).toHaveCount(0);
  const after = JSON.parse((await page.evaluate(() => localStorage.getItem("netfault.journal.v1")))!)[0];
  expect(after.expiresAt).toBe(JSON.parse(before!)[0].expiresAt);
  expect(after.history).toEqual(JSON.parse(before!)[0].history);
});

test("cached Academy reads, grades and saves offline without caching assessment APIs", async ({ page, context }) => {
  test.skip(!process.env.PW_PRODUCTION, "Production cache only");
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await enter(page);
  await expect(page.getByText("Available offline · Academy", { exact: true })).toBeVisible();
  await context.setOffline(true);
  try {
    await page.reload();
    await enter(page);
    await openLesson(page, 3);
    const exercise = page.getByRole("article", { name: "Classify destinations from 192.168.10.10/24." });
    await exercise.getByLabel("192.168.10.55", { exact: true }).selectOption("Local");
    await exercise.getByLabel("192.168.20.10", { exact: true }).selectOption("Remote");
    await exercise.getByLabel("192.168.10.1", { exact: true }).selectOption("Local");
    await exercise.getByRole("button", { name: "Check answers" }).click();
    await expect(exercise.getByRole("status")).toContainText("Correct — exercise completed");
    await page.reload();
    await enter(page);
    await page.getByRole("button", { name: "Continue lesson" }).click();
    await expect(page.locator(".academy-objectives")).toContainText("1/2 exercises completed");
    const urls = await page.evaluate(async () =>
      (
        await Promise.all(
          (await caches.keys()).map(async (key) => (await (await caches.open(key)).keys()).map((r) => r.url)),
        )
      ).flat(),
    );
    expect(urls.some((url) => url.includes("/api/"))).toBe(false);
  } finally {
    await context.setOffline(false);
  }
});

test("damaged Academy progress is preserved and raw-exportable; lab storage is untouched", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("netfault.academy.progress.v1", "{damaged");
  });
  await enter(page);
  await expect(page.locator(".academy").getByRole("alert")).toContainText("preserved");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export raw Academy data" }).click();
  expect((await download).suggestedFilename()).toBe("netfault-academy-raw.json");
  await openLesson(page, 1);
  await page.getByRole("button", { name: "Mark lesson read", exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem("netfault.academy.progress.v1"))).toBe("{damaged");
  expect(await page.evaluate(() => localStorage.getItem("netfault.journal.v1"))).toBeNull();
});
