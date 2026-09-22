import { expect, test, type Page } from "@playwright/test";
import { activate, answerSteps, openAcademy } from "./academy-helpers";

const answers = [
  [
    "Gi0/0 and Gi0/1",
    "network 10.45.0.5 0.0.0.0 area 0",
    "Fern Gi0/1 and Moss Gi0/0",
    "Fern process 30 / ID 10.255.2.1; Moss process 40 / ID 10.255.2.2",
    "Interface brief → address/state; OSPF interface → area/type; neighbor → adjacency; route → installed prefixes; host pings both ways → tested request/reply paths",
  ],
  [
    "network 10.77.0.10 0.0.0.0 area 0; network 192.168.96.1 0.0.0.0 area 0",
    "Make Gi0/0/0 passive; leave Gi0/2/0 non-passive",
    "One FULL transit neighbor per router; Studio LAN advertised despite no LAN Hellos",
    "Ridge: 192.168.64.0/24 via 10.77.0.9; Vale: 192.168.96.0/24 via 10.77.0.10",
    "Both routers’ interface/OSPF state, reciprocal FULL neighbors and remote routes; correct host gateways; successful Archive-to-Studio and Studio-to-Archive pings",
  ],
];
async function openOspf(page: Page) {
  await page.getByRole("button", { name: "Academy home", exact: true }).click();
  await page
    .locator(".academy-module")
    .filter({ hasText: "OSPFv2 — Configuration and verification" })
    .getByRole("button", { name: "Explore module" })
    .click();
  await page.getByRole("button", { name: "Open lesson 1", exact: true }).click();
}
const readRecord = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("netfault.academy.progress.v1")!).records.find(
      (r: { lessonId: string }) => r.lessonId === "ospfv2-configuration",
    ),
  );

test("OSPF original tables and two diagrams support tap-only completion and revision-1 history", async ({
  page,
}, info) => {
  const touch = info.project.name.includes("mobile"),
    errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await openAcademy(page);
  await openOspf(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("From interfaces to verified OSPFv2 routes");
  await expect(page.getByRole("figure")).toHaveCount(2);
  for (const [index, figure] of (await page.getByRole("figure").all()).entries()) {
    await expect(figure).toHaveAccessibleName(/.+/);
    await figure.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`ospf-diagram-${index}.png`) });
    expect((await figure.boundingBox())!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  await expect(page.getByRole("region", { name: "Independent addressing table" })).toContainText("Ridge · Gi0/2/0");
  await expect(page.locator('.academy input:not([type="radio"]), .academy textarea, .academy select')).toHaveCount(0);
  for (let index = 0; index < 2; index++) {
    const exercise = page.locator(".academy-exercise").nth(index);
    await answerSteps(exercise, answers[index], touch);
    await activate(exercise.getByRole("button", { name: "Check answers", exact: true }), touch);
    await expect(exercise.getByRole("status")).toContainText("Correct — exercise completed");
    await expect(exercise.getByRole("button", { name: "Check revised answers" })).toBeDisabled();
  }
  await expect(page.getByRole("region", { name: "Detailed solution" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await openAcademy(page);
  await page.getByRole("button", { name: "Continue lesson" }).click();
  await expect(page.locator(".academy-objectives")).toContainText("2/2 exercises completed");
  await page.getByText("Learning history & storage", { exact: true }).click();
  const history = page.locator(".revision-record");
  await history.locator("summary").first().click();
  await expect(history.getByRole("heading", { name: /Use Fern’s local table/ })).toBeVisible();
  const record = await readRecord(page);
  expect(record.lessonRevision).toBe(1);
  expect(record.submissions).toHaveLength(2);
  expect(record.reveals).toHaveLength(0);
  expect(errors).toEqual([]);
});

test("OSPF draft resumes, keyboard changes a reviewed choice, retry and requested reveals remain distinct", async ({
  page,
}) => {
  await page.goto("/");
  await openAcademy(page);
  await openOspf(page);
  let exercise = page.locator(".academy-exercise").first();
  await answerSteps(exercise, ["Gi0/1 and Gi0/2"]);
  await page.reload();
  await openAcademy(page);
  await page.getByRole("button", { name: "Continue lesson" }).click();
  exercise = page.locator(".academy-exercise").first();
  await expect(exercise.getByRole("group")).toHaveAccessibleName(/Which exact selector/);
  await answerSteps(exercise, answers[0].slice(1));
  await exercise.getByRole("button", { name: "Check answers", exact: true }).click();
  await expect(exercise.getByRole("status")).toContainText("Keep practicing");
  await expect(exercise.getByRole("region", { name: "Detailed solution" })).toHaveCount(0);
  await exercise.getByRole("button", { name: "Change Which Fern interfaces match the supplied plan?" }).click();
  const chosen = exercise.getByRole("radio", { name: "Gi0/1 and Gi0/2", exact: true });
  await chosen.focus();
  await page.keyboard.press("ArrowUp");
  await expect(exercise.getByRole("radio", { name: answers[0][0], exact: true })).toBeChecked();
  expect(await page.evaluate(() => getComputedStyle(document.activeElement!.parentElement!).outlineStyle)).not.toBe(
    "none",
  );
  await exercise.getByRole("button", { name: "Next step", exact: true }).click();
  await answerSteps(exercise, answers[0].slice(1));
  await exercise.getByRole("button", { name: "Check revised answers" }).click();
  await expect(exercise.getByRole("status")).toContainText("not recorded as unaided");
  await exercise.getByRole("button", { name: "Show detailed solution" }).click();
  await exercise.getByRole("button", { name: "Show detailed solution" }).click();
  await expect(exercise.getByRole("region", { name: "Detailed solution" })).toContainText("10.45.0.5");
  const record = await readRecord(page);
  expect(record.submissions).toHaveLength(2);
  expect(record.reveals).toHaveLength(1);
  expect(record.completedAt).toBeUndefined();
});

test("OSPF related cases open neutral selection without attempts or private pack downloads", async ({ page }) => {
  const api: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/")) api.push(request.url());
  });
  await page.goto("/");
  for (const lab of ["001", "005", "006"]) {
    await openAcademy(page);
    await openOspf(page);
    await page.getByRole("button", { name: new RegExp(`LAB ${lab}`) }).click();
    await expect(page.getByRole("button", { name: "Start investigation" })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("netfault.journal.v1"))).toBeNull();
  }
  expect(api).toEqual([]);
});

test("OSPF lesson, both exercises and unexecuted companion work from the production offline cache", async ({
  page,
  context,
}, info) => {
  test.skip(!process.env.PW_PRODUCTION, "Requires production cache");
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await openAcademy(page);
  await expect(page.getByText("Available offline · Academy", { exact: true })).toBeVisible();
  await context.setOffline(true);
  try {
    await page.reload();
    await openAcademy(page);
    await openOspf(page);
    await expect(page.getByRole("figure")).toHaveCount(2);
    for (let index = 0; index < 2; index++) {
      const exercise = page.locator(".academy-exercise").nth(index);
      await answerSteps(exercise, answers[index], info.project.name.includes("mobile"));
      await exercise.getByRole("button", { name: "Check answers", exact: true }).click();
      await expect(exercise.getByRole("status")).toContainText("Correct — exercise completed");
    }
    await page.locator(".academy-companion summary").click();
    await expect(page.locator(".academy-companion")).toContainText("UNEXECUTED");
    await expect(page.getByRole("region", { name: "Companion: North host → Elm → Ash → South host" })).toContainText(
      "10.88.0.18/30",
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.reload();
    await openAcademy(page);
    await page.getByRole("button", { name: "Continue lesson" }).click();
    await expect(page.locator(".academy-objectives")).toContainText("2/2 exercises completed");
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
