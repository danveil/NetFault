import { expect, test, type Page } from "@playwright/test";
import { activate, answerSteps, openAcademy } from "./academy-helpers";
import { operationsCases } from "../fixtures/operations-answers";

async function openLesson(page: Page, fixture: (typeof operationsCases)[number]) {
  await page.getByRole("button", { name: "Academy home", exact: true }).click();
  await page
    .locator(".academy-module")
    .filter({ has: page.getByRole("heading", { name: fixture.module, exact: true }) })
    .getByRole("button", { name: "Explore module" })
    .click();
  await page.getByRole("button", { name: `Open lesson ${fixture.number}`, exact: true }).click();
}
for (const fixture of operationsCases)
  test(`${fixture.id}: touch exercises, diagram and saved progress`, async ({ page }, info) => {
    await page.goto("/");
    await openAcademy(page);
    await openLesson(page, fixture);
    await expect(page.locator(".academy-course-anchor")).toContainText(".ppt");
    const figure = page.getByRole("figure");
    await expect(figure).toHaveCount(1);
    await expect(figure).toHaveAccessibleName(/.+/);
    await figure.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`${fixture.id}.png`) });
    for (let i = 0; i < 2; i++) {
      const exercise = page.locator(".academy-exercise").nth(i);
      await answerSteps(exercise, fixture.answers[i], info.project.name.includes("mobile"));
      await activate(
        exercise.getByRole("button", { name: "Check answers", exact: true }),
        info.project.name.includes("mobile"),
      );
      await expect(exercise.getByRole("status")).toContainText("Correct — exercise completed");
    }
    await expect(page.getByRole("region", { name: "Detailed solution" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.reload();
    await openAcademy(page);
    await page.getByRole("button", { name: "Continue lesson" }).click();
    await expect(page.locator(".academy-objectives")).toContainText("2/2 exercises completed");
  });

test("all three new modules remain readable and gradeable after an offline reload", async ({ page, context }, info) => {
  test.skip(!process.env.PW_PRODUCTION, "Requires production service worker");
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await openAcademy(page);
  await expect(page.getByText("Available offline · Academy", { exact: true })).toBeVisible();
  await context.setOffline(true);
  try {
    await page.reload();
    await openAcademy(page);
    for (const fixture of operationsCases) {
      await openLesson(page, fixture);
      await expect(page.getByRole("figure")).toHaveCount(1);
      if (["management-events", "qos-treatment", "automation-requests"].includes(fixture.id)) {
        const companion = page.locator(".academy-companion");
        await companion.locator("summary").click();
        await expect(companion).toContainText("UNEXECUTED");
        await expect(companion.locator("ol")).toBeVisible();
      }
      const exercise = page.locator(".academy-exercise").first();
      await answerSteps(exercise, fixture.answers[0], info.project.name.includes("mobile"));
      await exercise.getByRole("button", { name: "Check answers", exact: true }).click();
      await expect(exercise.getByRole("status")).toContainText("Correct — exercise completed");
      await expect(exercise.getByRole("region", { name: "Detailed solution" })).toHaveCount(0);
      await exercise.getByRole("button", { name: "Show detailed solution" }).click();
      await exercise.getByRole("button", { name: "Show detailed solution" }).click();
      await expect(exercise.getByRole("region", { name: "Detailed solution" })).toBeVisible();
    }
  } finally {
    await context.setOffline(false);
  }
});
