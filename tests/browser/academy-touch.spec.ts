import { expect, test } from "@playwright/test";
import { activate, answerSteps, lessonPage, openAcademy } from "./academy-helpers";
import { academy as legacy } from "../../src/lib/academy/content-v1";
import { emptyProgress, updateProgress } from "../../src/lib/academy/progress";

const answers = [
  [
    ["Valid", "Invalid", "Invalid"],
    ["172", "16", "5", "90", "No; a mask or prefix is needed"],
  ],
  [
    ["6", "192.168.50.128", "192.168.50.191", "192.168.50.129", "192.168.50.190"],
    ["5", "172.16.4.64", "172.16.4.95", "172.16.4.65", "172.16.4.94"],
  ],
  [
    ["Local", "Remote", "Local"],
    ["172.16.8.0", "Remote", "172.16.8.1", "Compare ipconfig, router LAN addressing, and local versus remote pings"],
  ],
];
test("all six exercises complete by tapping, with readable diagrams, no typing, and no automatic solutions", async ({
  page,
}, info) => {
  const touch = info.project.name.includes("mobile");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await openAcademy(page);
  for (let index = 0; index < 3; index++) {
    await lessonPage(page, index + 1);
    await expect(page.locator('.academy input:not([type="radio"]), .academy textarea, .academy select')).toHaveCount(0);
    const diagrams = page.getByRole("figure");
    await expect(diagrams).toHaveCount(index === 0 ? 1 : 2);
    for (const [diagramIndex, figure] of (await diagrams.all()).entries()) {
      await expect(figure).toHaveAccessibleName(/.+/);
      await figure.scrollIntoViewIfNeeded();
      expect(await figure.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      await figure.screenshot({ path: info.outputPath(`lesson-${index + 1}-diagram-${diagramIndex + 1}.png`) });
    }
    for (let exerciseIndex = 0; exerciseIndex < 2; exerciseIndex++) {
      const exercise = page.locator(".academy-exercise").nth(exerciseIndex);
      await answerSteps(exercise, answers[index][exerciseIndex], touch);
      const submit = exercise.locator('button[type="submit"]');
      await activate(submit, touch);
      // A second real tap on the disabled submit must not record another completion.
      if (touch) await submit.tap({ force: true });
      else await submit.dblclick({ force: true });
      await expect(exercise.getByRole("status")).toContainText("Correct — exercise completed");
      await expect(exercise.getByRole("region", { name: "Detailed solution" })).toHaveCount(0);
      await expect(exercise.getByText("Answer history (1)", { exact: true })).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem("netfault.academy.progress.v1")!).records);
  expect(records).toHaveLength(3);
  for (const record of records) {
    expect(record.lessonRevision).toBe(2);
    expect(record.submissions).toHaveLength(2);
    expect(record.reveals).toHaveLength(0);
    expect(record.completedAt).toBeGreaterThan(0);
    expect(record.readAt).toBeUndefined();
  }
  expect(errors).toEqual([]);
});

test("wrong selections support retry without a solution; partial drafts resume and keyboard focus works", async ({
  page,
}, info) => {
  const touch = info.project.name.includes("mobile");
  await page.goto("/");
  await openAcademy(page);
  await lessonPage(page, 2);
  let exercise = page.locator(".academy-exercise").first();
  await activate(exercise.getByRole("radio", { name: "8", exact: true }).locator(".."), touch);
  await activate(exercise.getByRole("button", { name: "Next step", exact: true }), touch);
  await page.reload();
  await openAcademy(page);
  await page.getByRole("button", { name: "Continue lesson" }).click();
  exercise = page.locator(".academy-exercise").first();
  await expect(exercise.getByRole("group")).toHaveAccessibleName(/Network address/);
  await answerSteps(exercise, answers[1][0].slice(1), touch);
  await activate(exercise.getByRole("button", { name: "Check answers" }), touch);
  await expect(exercise.getByRole("status")).toContainText("Keep practicing");
  await expect(exercise.getByRole("region", { name: "Detailed solution" })).toHaveCount(0);
  await expect(exercise.getByRole("status")).not.toContainText("10001100");
  await exercise.getByRole("button", { name: "Change How many host bits remain?" }).click();
  await expect(exercise.locator("legend")).toBeFocused();
  const radio = exercise.getByRole("radio", { name: "4", exact: true });
  await radio.focus();
  await page.keyboard.press("ArrowRight");
  await expect(exercise.getByRole("radio", { name: "6", exact: true })).toBeChecked();
  expect(
    await exercise
      .getByRole("radio", { name: "6", exact: true })
      .locator("..")
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
  for (let i = 0; i < 5; i++) await exercise.getByRole("button", { name: /^(Next step|Review choices)$/ }).click();
  await expect(exercise.getByRole("heading", { name: "Review your reasoning" })).toBeFocused();
  await exercise.getByRole("button", { name: "Check revised answers" }).click();
  await expect(exercise.getByRole("status")).toContainText("Correct — exercise completed");
  await expect(exercise.getByRole("status")).toContainText("not recorded as unaided");
  await activate(exercise.getByRole("button", { name: "Show detailed solution" }), touch);
  await activate(exercise.getByRole("button", { name: "Show detailed solution" }), touch);
  await expect(exercise.getByRole("region", { name: "Detailed solution" })).toContainText("10001100");
  const record = await page.evaluate(
    () => JSON.parse(localStorage.getItem("netfault.academy.progress.v1")!).records[0],
  );
  expect(record.submissions).toHaveLength(2);
  expect(record.reveals).toHaveLength(1);
});

test("revision-1 drafts remain readable and unchanged when starting the touch revision", async ({ page }) => {
  const lesson = legacy.lessons[1];
  const old = updateProgress(
    emptyProgress(),
    lesson,
    { type: "draft", exercise: lesson.exercises[0], answers: { network: "192.168.50.128" } },
    42,
  );
  await page.goto("/");
  await page.evaluate((value) => localStorage.setItem("netfault.academy.progress.v1", JSON.stringify(value)), old);
  await openAcademy(page);
  await page.getByRole("button", { name: "Continue lesson" }).click();
  await expect(page.getByText(/Your old drafts are preserved, not converted/)).toBeVisible();
  await expect(page.locator(".academy-exercise").first().getByRole("group")).toHaveAccessibleName(
    /How many host bits remain/,
  );
  await expect(page.locator(".academy-exercise input:checked")).toHaveCount(0);
  await page.getByText("Learning history & storage", { exact: true }).click();
  const history = page.locator(".revision-record").filter({ hasText: "revision 1" });
  await history.locator("summary").first().click();
  await expect(history.getByText("192.168.50.128", { exact: true })).toBeVisible();
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("netfault.academy.progress.v1")!).records);
  expect(after[0]).toEqual(old.records[0]);
  expect(after[1].drafts).toEqual({});
});

test("all diagrams and six tap exercises remain functional offline", async ({ page, context }, info) => {
  test.skip(!process.env.PW_PRODUCTION, "Production shell required");
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await openAcademy(page);
  await expect(page.getByText("Available offline · Academy", { exact: true })).toBeVisible();
  await context.setOffline(true);
  try {
    await page.reload();
    await openAcademy(page);
    for (let index = 0; index < 3; index++) {
      await lessonPage(page, index + 1);
      await expect(page.getByRole("figure")).toHaveCount(index === 0 ? 1 : 2);
      for (let e = 0; e < 2; e++) {
        const exercise = page.locator(".academy-exercise").nth(e);
        await answerSteps(exercise, answers[index][e], info.project.name.includes("mobile"));
        await exercise.getByRole("button", { name: "Check answers" }).click();
        await expect(exercise.getByRole("status")).toContainText("Correct — exercise completed");
      }
    }
    await page.reload();
    await openAcademy(page);
    await page.getByRole("button", { name: "Continue lesson" }).click();
    await expect(page.locator(".academy-objectives")).toContainText("2/2 exercises completed");
  } finally {
    await context.setOffline(false);
  }
});

test("touch scrolling over answer cards does not select or submit", async ({ page, context }, info) => {
  // On desktop exercise the equivalent wheel path; mobile uses actual emulated touch events.
  await page.goto("/");
  await openAcademy(page);
  await lessonPage(page, 1);
  const card = page.locator(".academy-exercise").first().locator(".answer-card").first();
  await expect(card).toHaveCSS("touch-action", "manipulation");
  await card.scrollIntoViewIfNeeded();
  const box = (await card.boundingBox())!;
  const before = await page.evaluate(() => scrollY);
  if (info.project.name.includes("mobile")) {
    const cdp = await context.newCDPSession(page),
      x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let offset = 20; offset <= 180; offset += 20)
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - offset }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
  } else {
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.wheel(0, 180);
  }
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 20);
  await expect(page.locator(".academy-exercise input:checked")).toHaveCount(0);
  const record = await page.evaluate(
    () => JSON.parse(localStorage.getItem("netfault.academy.progress.v1")!).records[0],
  );
  expect(record.submissions).toEqual([]);
});
