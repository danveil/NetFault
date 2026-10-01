import { describe, expect, it } from "vitest";
import { academy, lessonRevision } from "../src/lib/academy/content";
import { academySchema, diagramSchema } from "../src/lib/academy/schema";
import { gradeExercise } from "../src/lib/academy/grading";
import { emptyProgress, updateProgress, loadProgress, ACADEMY_KEY } from "../src/lib/academy/progress";
import { operationsCases } from "./fixtures/operations-answers";

describe("3S source-grounded public Academy", () => {
  it("adds only three modules/seven revision-1 lessons with bounded diagrams", () => {
    expect(academySchema.parse(academy)).toEqual(academy);
    expect(academy.modules.filter((m) => m.id !== "vpn-ipsec").map((m) => m.id)).toEqual([
      "ipv4",
      "ospfv2",
      "network-management",
      "quality-of-service",
      "virtualization-automation",
    ]);
    expect(academy.lessons.filter((l) => l.moduleId !== "vpn-ipsec")).toHaveLength(11);
    const lessons = operationsCases.map((c) => lessonRevision(c.id, 1)!);
    expect(lessons.flatMap((l) => l.exercises)).toHaveLength(14);
    expect(lessons.flatMap((l) => l.exercises.flatMap((e) => e.fields))).toHaveLength(42);
    expect(lessons.filter((l) => l.companion)).toHaveLength(3);
    for (const lesson of lessons) {
      expect(lesson.courseAnchor).toMatch(/\.ppt/);
      expect(lesson.relatedLabs).toEqual([]);
      expect(lesson.exercises.map((e) => e.stage)).toEqual(["guided", "independent"]);
      expect(lesson.exercises.every((e) => e.inputKind === "tap-steps" && e.solutionPolicy === "requested-only")).toBe(
        true,
      );
      const diagrams = lesson.sections.flatMap((s) => (s.diagram ? [s.diagram] : []));
      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].kind).toBe("concept-map");
      expect(diagramSchema.safeParse({ ...diagrams[0], cards: [] }).success).toBe(false);
      expect(lessonRevision(lesson.id, 2)).toBeUndefined();
    }
  });
  for (const fixture of operationsCases) {
    it(`${fixture.id}: accepts independent outcomes, rejects every alternative and persists both exercises`, () => {
      const lesson = lessonRevision(fixture.id, 1)!;
      const old = lessonRevision("ipv4-addresses", 1)!;
      let progress = updateProgress(emptyProgress(), old, { type: "read" }, 1);
      const oldRecord = structuredClone(progress.records[0]);
      lesson.exercises.forEach((exercise, index) => {
        const answers = Object.fromEntries(exercise.fields.map((f, i) => [f.id, fixture.answers[index][i]]));
        expect(gradeExercise(exercise, answers)).toMatchObject({ valid: true, correct: true });
        expect(gradeExercise(exercise, {})).toMatchObject({ valid: false });
        for (const field of exercise.fields)
          for (const wrong of (field.kind === "choice" ? field.choices : []).filter((c) => c !== answers[field.id])) {
            const input = { ...answers, [field.id]: wrong };
            expect(gradeExercise(exercise, input)).toMatchObject({ valid: true, correct: false });
            expect(gradeExercise(exercise, input)).toEqual(gradeExercise(exercise, input));
          }
        progress = updateProgress(progress, lesson, { type: "draft", exercise, answers }, 2);
        progress = updateProgress(progress, lesson, { type: "submit", exercise, answers }, 3);
      });
      const restored = loadProgress({
        getItem: (key) => (key === ACADEMY_KEY ? JSON.stringify(progress) : null),
        setItem: () => {},
      });
      expect(restored.records[0]).toEqual(oldRecord);
      expect(restored.records[1]).toMatchObject({ lessonRevision: 1, completedAt: 3, reveals: [] });
      expect(restored.records[1].submissions).toHaveLength(2);
    });
  }
});
