import { describe, expect, it } from "vitest";
import { academy, lessonRevision } from "../src/lib/academy/content";
import { academySchema } from "../src/lib/academy/schema";
import { gradeExercise } from "../src/lib/academy/grading";
import { emptyProgress, updateProgress, loadProgress } from "../src/lib/academy/progress";
import { labs } from "../src/lib/catalog";
import { vpnCases } from "./fixtures/vpn-answers";

describe("3T VPN Academy without a security simulator", () => {
  it("registers exactly six modules/fourteen lessons and preserves the fifteen-lab boundary", () => {
    expect(academySchema.parse(academy)).toEqual(academy);
    expect(academy.modules.map((m) => m.id)).toEqual([
      "ipv4",
      "ospfv2",
      "network-management",
      "quality-of-service",
      "virtualization-automation",
      "vpn-ipsec",
    ]);
    expect(academy.lessons).toHaveLength(14);
    expect(labs).toHaveLength(15);
    const lessons = academy.lessons.filter((l) => l.moduleId === "vpn-ipsec");
    expect(lessons.map((l) => l.id)).toEqual(vpnCases.map((c) => c.id));
    expect(lessons.flatMap((l) => l.exercises)).toHaveLength(6);
    expect(lessons.flatMap((l) => l.sections.filter((s) => s.diagram))).toHaveLength(3);
    expect(lessons.filter((l) => l.companion)).toHaveLength(1);
    expect(lessons[2].companion!.title).toContain("UNEXECUTED");
    for (const l of lessons) {
      expect(l.revision).toBe(1);
      expect(l.relatedLabs).toEqual([]);
      expect(l.courseAnchor).toContain("9.VPN.ppt");
      expect(l.exercises.every((e) => e.inputKind === "tap-steps" && e.solutionPolicy === "requested-only")).toBe(true);
    }
  });
  for (const fixture of vpnCases)
    it(`${fixture.id}: independent answers, alternatives, retry and revision-safe persistence`, () => {
      const lesson = lessonRevision(fixture.id, 1)!;
      let p = updateProgress(emptyProgress(), lessonRevision("management-visibility", 1)!, { type: "read" }, 1);
      const previous = structuredClone(p.records[0]);
      lesson.exercises.forEach((e, index) => {
        const answers = Object.fromEntries(e.fields.map((f, n) => [f.id, fixture.answers[index][n]]));
        expect(gradeExercise(e, answers)).toMatchObject({ valid: true, correct: true });
        expect(gradeExercise(e, {})).toMatchObject({ valid: false });
        expect(gradeExercise(e, { ...answers, [e.fields[0].id]: "An arbitrary explanation" })).toMatchObject({
          valid: false,
        });
        for (const f of e.fields)
          if (f.kind === "choice")
            for (const wrong of f.choices.filter((c) => c !== answers[f.id])) {
              const input = { ...answers, [f.id]: wrong };
              const result = gradeExercise(e, input);
              expect(result).toMatchObject({ valid: true, correct: false });
              expect(result).toEqual(gradeExercise(e, input));
              expect(result).not.toHaveProperty("solution");
            }
        p = updateProgress(p, lesson, { type: "draft", exercise: e, answers }, 2);
        p = updateProgress(p, lesson, { type: "submit", exercise: e, answers }, 3);
      });
      const restored = loadProgress({ getItem: () => JSON.stringify(p), setItem: () => {} });
      expect(restored.records[0]).toEqual(previous);
      expect(restored.records[1]).toMatchObject({ lessonRevision: 1, completedAt: 3, reveals: [] });
      expect(restored.records[1].submissions).toHaveLength(2);
    });
});
