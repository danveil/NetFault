import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { academy, lessonRevision } from "../src/lib/academy/content";
import { academy as original } from "../src/lib/academy/content-v1";
import { academySchema, diagramSchema, exerciseSchema, type Exercise } from "../src/lib/academy/schema";
import { gradeExercise, subnet } from "../src/lib/academy/grading";
import { emptyProgress, updateProgress, recordFor, loadProgress, ACADEMY_KEY } from "../src/lib/academy/progress";
const accepted = (exercise: Exercise) =>
  Object.fromEntries(exercise.fields.map((field) => [field.id, String(field.answer)]));

describe("3C published content and visual correctness", () => {
  it("preserves the exact published revision-1 source", () => {
    const hash = createHash("sha256")
      .update(readFileSync("src/lib/academy/content-v1.ts", "utf8").replace(/\r\n/g, "\n"))
      .digest("hex");
    expect(hash).toBe("0469219cf0c5ae7f819fdad1ad3c9d9faacbf57cd242fbfad88b36d8ade814b3");
  });
  it("keeps identities and authored prose while publishing revision 2", () => {
    expect(academySchema.parse(academy)).toEqual(academy);
    expect(academy.lessons).toHaveLength(3);
    expect(academy.modules).toHaveLength(1);
    academy.lessons.forEach((lesson, index) => {
      const old = original.lessons[index];
      expect(lesson.id).toBe(old.id);
      expect(lesson.revision).toBe(2);
      expect(lesson.exercises.map((e) => e.id)).toEqual(old.exercises.map((e) => e.id));
      expect(lesson.sections.map((s) => s.body.replace(/\s+/g, " "))).toEqual(old.sections.map((s) => s.body));
      expect(lesson.relatedLabs).toEqual(old.relatedLabs);
    });
  });
  it("uses five local visuals with valid captioned data", () => {
    const visuals = academy.lessons.flatMap((l) => l.sections.flatMap((s) => (s.diagram ? [s.diagram] : [])));
    expect(visuals.map((d) => d.kind)).toEqual(["octets", "mask", "range", "delivery", "arp"]);
    for (const visual of visuals) expect(diagramSchema.safeParse(visual).success).toBe(true);
    expect(subnet("192.168.10.70", 26)).toEqual({
      network: "192.168.10.64",
      broadcast: "192.168.10.127",
      first: "192.168.10.65",
      last: "192.168.10.126",
      hosts: 62,
    });
    expect((70 & 192).toString(2).padStart(8, "0")).toBe("01000000");
  });
  it("rejects malformed or unsupported diagram data", () => {
    expect(diagramSchema.safeParse({ kind: "mask", address: "192.168.10.999", prefix: 26, caption: "x" }).success).toBe(
      false,
    );
    expect(diagramSchema.safeParse({ kind: "range", address: "192.168.10.70", prefix: 31, caption: "x" }).success).toBe(
      false,
    );
    expect(diagramSchema.safeParse({ kind: "packet-simulator", caption: "x" }).success).toBe(false);
  });
});
describe("tap grading and non-spoiling feedback", () => {
  it.each(academy.lessons.flatMap((l) => l.exercises).map((e) => [e.id, e] as const))(
    "preserves reasoning for %s",
    (_, exercise) => {
      expect(exercise).toMatchObject({ revision: 2, inputKind: "tap-steps", solutionPolicy: "requested-only" });
      expect(exercise.fields.every((f) => f.kind === "choice")).toBe(true);
      expect(gradeExercise(exercise, accepted(exercise))).toMatchObject({ valid: true, correct: true });
      for (const field of exercise.fields) {
        if (field.kind !== "choice") throw Error("Expected tap choices");
        for (const value of field.choices.filter((choice) => choice !== field.answer)) {
          const result = gradeExercise(exercise, { ...accepted(exercise), [field.id]: value });
          expect(result).toMatchObject({ valid: true, correct: false });
          if (result.valid)
            for (const solution of exercise.solution.steps) expect(result.feedback.join(" ")).not.toContain(solution);
        }
      }
      expect(
        gradeExercise(exercise, { ...accepted(exercise), [exercise.fields[0].id]: "injected-value" }),
      ).toMatchObject({ valid: false });
      expect(gradeExercise(exercise, {})).toMatchObject({ valid: false });
    },
  );
  it("requires host-bit reasoning as well as every subnet boundary", () => {
    for (const [exercise, address, prefix] of [
      [academy.lessons[1].exercises[0], "192.168.50.140", 26],
      [academy.lessons[1].exercises[1], "172.16.4.77", 27],
    ] as const) {
      const answers = accepted(exercise),
        result = subnet(address, prefix);
      expect(answers).toEqual({
        "host-bits": String(32 - prefix),
        network: result.network,
        broadcast: result.broadcast,
        first: result.first,
        last: result.last,
      });
      expect(gradeExercise(exercise, { ...answers, "host-bits": "8" })).toMatchObject({ correct: false });
    }
  });
  it("rejects tap exercises that introduce typing or automatic solutions", () => {
    const e = academy.lessons[0].exercises[0];
    expect(exerciseSchema.safeParse({ ...e, solutionPolicy: "after-submit-or-request" }).success).toBe(false);
    expect(
      exerciseSchema.safeParse({
        ...e,
        fields: [{ id: "number", kind: "number", label: "Number", answer: 1, explanation: "x" }],
      }).success,
    ).toBe(false);
  });
});
describe("revision and rapid interaction safety", () => {
  it("keeps revision-1 drafts, results and reveals interpretable without migrating them", () => {
    const old = original.lessons[1],
      current = academy.lessons[1];
    let before = updateProgress(
      emptyProgress(),
      old,
      { type: "draft", exercise: old.exercises[0], answers: { network: "192.168.50.128" } },
      1,
    );
    before = updateProgress(
      before,
      old,
      { type: "submit", exercise: old.exercises[1], answers: accepted(old.exercises[1]) },
      2,
    );
    before = updateProgress(before, old, { type: "reveal", exercise: old.exercises[0] }, 3);
    const after = updateProgress(before, current, { type: "view" }, 4);
    expect(after.records[0]).toEqual(before.records[0]);
    expect(recordFor(after, current)?.drafts).toEqual({});
    expect(lessonRevision(old.id, 1)).toEqual(old);
    expect(lessonRevision(old.id, 2)).toEqual(current);
    expect(lessonRevision(old.id, 99)).toBeUndefined();
    expect(
      loadProgress({ getItem: (key) => (key === ACADEMY_KEY ? JSON.stringify(after) : null), setItem: () => {} }),
    ).toEqual(after);
  });
  it("deduplicates repeated submissions and reveals while recording changed retries", () => {
    const lesson = academy.lessons[0],
      exercise = lesson.exercises[0],
      answers = accepted(exercise);
    let p = emptyProgress();
    for (let i = 0; i < 10; i++) p = updateProgress(p, lesson, { type: "submit", exercise, answers }, i);
    expect(recordFor(p, lesson)?.submissions).toHaveLength(1);
    for (let i = 0; i < 10; i++) p = updateProgress(p, lesson, { type: "reveal", exercise }, i + 10);
    expect(recordFor(p, lesson)?.reveals).toHaveLength(1);
    p = updateProgress(p, lesson, { type: "submit", exercise, answers: { ...answers, valid: "Invalid" } }, 21);
    expect(recordFor(p, lesson)?.submissions).toHaveLength(2);
    expect(recordFor(p, lesson)?.submissions[1].unaided).toBe(false);
  });
  it("preserves partial tap drafts and does not award completion for a reveal", () => {
    const lesson = academy.lessons[2],
      exercise = lesson.exercises[1];
    let p = updateProgress(emptyProgress(), lesson, { type: "draft", exercise, answers: { network: "172.16.8.0" } });
    p = updateProgress(p, lesson, { type: "reveal", exercise });
    expect(recordFor(p, lesson)?.drafts["next-hop@2"]).toEqual({ network: "172.16.8.0" });
    expect(recordFor(p, lesson)?.completedAt).toBeUndefined();
    expect(recordFor(p, lesson)?.submissions).toEqual([]);
  });
});
