import { expect, type Locator, type Page } from "@playwright/test";
export async function activate(locator: Locator, touch = false) {
  if (touch) await locator.tap();
  else await locator.click();
}
export async function answerSteps(exercise: Locator, answers: string[], touch = false) {
  for (const answer of answers) {
    const card = exercise.getByRole("radio", { name: answer, exact: true }).locator("..");
    const bounds = await card.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    await activate(card, touch);
    await activate(exercise.getByRole("button", { name: /^(Next step|Review choices)$/ }), touch);
  }
}
export async function openAcademy(page: Page) {
  await page.getByRole("button", { name: "Learn networking / Field guide", exact: true }).click();
}
export async function lessonPage(page: Page, number: number) {
  await page.getByRole("button", { name: "Academy home", exact: true }).click();
  await page
    .locator(".academy-module")
    .filter({ hasText: "MODULE 02" })
    .getByRole("button", { name: "Explore module" })
    .click();
  await page.getByRole("button", { name: `Open lesson ${number}`, exact: true }).click();
}
