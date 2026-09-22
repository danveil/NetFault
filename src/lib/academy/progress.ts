import { z } from "zod";
import { gradeExercise } from "./grading";
import type { Exercise, Lesson } from "./schema";

export const ACADEMY_KEY = "netfault.academy.progress.v1";
const timestamp = z.number().int().nonnegative();
const answerSchema = z.record(z.string(), z.string().max(500));
const submissionSchema = z.strictObject({
  exerciseId: z.string(),
  exerciseRevision: z.number().int().positive(),
  at: timestamp,
  answers: answerSchema,
  correct: z.boolean(),
  feedback: z.array(z.string()),
  unaided: z.boolean(),
});
const recordSchema = z.strictObject({
  moduleId: z.string(),
  lessonId: z.string(),
  lessonRevision: z.number().int().positive(),
  startedAt: timestamp,
  lastViewedAt: timestamp,
  readAt: timestamp.optional(),
  completedAt: timestamp.optional(),
  submissions: z.array(submissionSchema).max(500),
  reveals: z
    .array(z.strictObject({ exerciseId: z.string(), exerciseRevision: z.number().int().positive(), at: timestamp }))
    .max(100),
  drafts: z.record(z.string(), answerSchema),
});
export const progressSchema = z
  .strictObject({ schemaVersion: z.literal(1), records: z.array(recordSchema).max(100) })
  .superRefine((value, ctx) => {
    const keys = value.records.map((r) => `${r.lessonId}@${r.lessonRevision}`);
    if (new Set(keys).size !== keys.length) ctx.addIssue({ code: "custom", message: "Duplicate progress revision" });
  });
export type LearningProgress = z.infer<typeof progressSchema>;
export type LessonProgress = LearningProgress["records"][number];
type StorageLike = Pick<Storage, "getItem" | "setItem">;
export const emptyProgress = (): LearningProgress => ({ schemaVersion: 1, records: [] });
export function loadProgress(storage: StorageLike): LearningProgress {
  const raw = storage.getItem(ACADEMY_KEY);
  return raw === null ? emptyProgress() : progressSchema.parse(JSON.parse(raw));
}
export const exerciseKey = (e: Exercise) => `${e.id}@${e.revision}`;
export const recordFor = (progress: LearningProgress, lesson: Lesson) =>
  progress.records.find((r) => r.lessonId === lesson.id && r.lessonRevision === lesson.revision);
export type ProgressAction =
  | { type: "view" }
  | { type: "read" }
  | { type: "draft" | "submit" | "reveal"; exercise: Exercise; answers?: Record<string, string> };
export function updateProgress(
  progress: LearningProgress,
  lesson: Lesson,
  action: ProgressAction,
  now = Date.now(),
): LearningProgress {
  const next = structuredClone(progress);
  let record = recordFor(next, lesson);
  if (!record) {
    record = {
      moduleId: lesson.moduleId,
      lessonId: lesson.id,
      lessonRevision: lesson.revision,
      startedAt: now,
      lastViewedAt: now,
      submissions: [],
      reveals: [],
      drafts: {},
    };
    next.records.push(record);
  }
  record.lastViewedAt = now;
  if (action.type === "read") record.readAt ??= now;
  if ("exercise" in action) {
    const e = action.exercise;
    if (!lesson.exercises.some((x) => x.id === e.id && x.revision === e.revision))
      throw Error("Unknown exercise revision");
    const revealed = record.reveals.some((r) => r.exerciseId === e.id && r.exerciseRevision === e.revision);
    const practiced = record.submissions.some((s) => s.exerciseId === e.id && s.exerciseRevision === e.revision);
    if (action.type === "draft") record.drafts[exerciseKey(e)] = action.answers ?? {};
    if (action.type === "reveal" && !revealed)
      record.reveals.push({ exerciseId: e.id, exerciseRevision: e.revision, at: now });
    if (action.type === "submit") {
      const result = gradeExercise(e, action.answers ?? {});
      if (!result.valid) throw Error(result.errors.join(" "));
      const last = record.submissions.filter((s) => s.exerciseId === e.id && s.exerciseRevision === e.revision).at(-1);
      // One checked answer set is one event, even across rapid taps or a refresh.
      if (
        e.inputKind === "tap-steps" &&
        last &&
        e.fields.every((field) => last.answers[field.id] === result.answers[field.id])
      )
        return progress;
      record.submissions.push({
        exerciseId: e.id,
        exerciseRevision: e.revision,
        at: now,
        answers: result.answers,
        correct: result.correct,
        feedback: result.feedback,
        unaided: !revealed && !practiced,
      });
      record.drafts[exerciseKey(e)] = result.answers;
      if (
        lesson.exercises.every((x) =>
          record!.submissions.some((s) => s.exerciseId === x.id && s.exerciseRevision === x.revision && s.correct),
        )
      )
        record.completedAt ??= now;
    }
  }
  return progressSchema.parse(next); // At capacity, fail visibly instead of evicting revision history.
}
export function saveProgress(storage: StorageLike, lesson: Lesson, action: ProgressAction): LearningProgress {
  const next = updateProgress(loadProgress(storage), lesson, action);
  storage.setItem(ACADEMY_KEY, JSON.stringify(next));
  return next;
}
