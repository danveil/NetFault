import { z } from "zod";
import { labs } from "../catalog";

const id = z.string().regex(/^[a-z][a-z0-9-]*$/);
const text = z.string().min(1);
const revision = z.number().int().positive();
export const sectionKinds = ["simple", "analogy", "technical", "worked", "guided", "independent"] as const;
export const interfaceTableSchema = z.strictObject({
  title: text,
  rows: z
    .array(
      z.strictObject({
        device: text,
        port: text,
        address: z.ipv4(),
        prefix: z.number().int().min(1).max(30),
        role: text,
      }),
    )
    .min(1),
});
export const diagramSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("ospf-match"),
    selector: z.ipv4(),
    wildcard: z.enum(["0.0.0.0", "0.0.0.3", "0.0.0.255"]),
    interfaces: interfaceTableSchema,
    caption: text,
  }),
  z.strictObject({ kind: z.literal("ospf-evidence"), caption: text }),
  z.strictObject({ kind: z.literal("octets"), address: z.ipv4(), caption: text }),
  z.strictObject({
    kind: z.enum(["mask", "range"]),
    address: z.ipv4(),
    prefix: z.number().int().min(24).max(30),
    caption: text,
  }),
  z.strictObject({ kind: z.enum(["delivery", "arp"]), caption: text }),
]);
export const sectionSchema = z.strictObject({
  kind: z.enum(sectionKinds),
  title: text,
  body: text,
  code: text.optional(),
  interfaceTable: interfaceTableSchema.optional(),
  diagram: diagramSchema.optional(),
});
export const solutionSchema = z.strictObject({ steps: z.array(text).min(2), commonMistake: text });
const fieldBase = { id, label: text, explanation: text };
export const fieldSchema = z.discriminatedUnion("kind", [
  z.strictObject({ ...fieldBase, kind: z.literal("choice"), choices: z.array(text).min(2), answer: text }),
  z.strictObject({ ...fieldBase, kind: z.literal("ipv4"), answer: z.ipv4() }),
  z.strictObject({ ...fieldBase, kind: z.literal("number"), answer: z.number().int().nonnegative() }),
]);
export const exerciseSchema = z
  .strictObject({
    id,
    revision,
    stage: z.enum(["guided", "independent"]),
    prompt: text,
    inputKind: z.enum(["structured", "tap-steps"]),
    fields: z.array(fieldSchema).min(1),
    solutionPolicy: z.enum(["after-submit-or-request", "requested-only"]),
    solution: solutionSchema,
  })
  .superRefine((exercise, ctx) => {
    if (
      exercise.inputKind === "tap-steps" &&
      (exercise.fields.some((field) => field.kind !== "choice") || exercise.solutionPolicy !== "requested-only")
    )
      ctx.addIssue({ code: "custom", message: "Tap steps require choice fields and requested-only solutions" });
    if (new Set(exercise.fields.map((f) => f.id)).size !== exercise.fields.length)
      ctx.addIssue({ code: "custom", message: "Duplicate field ID" });
    for (const field of exercise.fields)
      if (
        field.kind === "choice" &&
        (!field.choices.includes(field.answer) || new Set(field.choices).size !== field.choices.length)
      )
        ctx.addIssue({ code: "custom", message: "Invalid choice definition" });
  });
export const labLinkSchema = z.strictObject({
  scenarioId: text,
  relationship: z.enum(["prepare", "apply", "reflect"]),
});
export const lessonSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    id,
    revision,
    moduleId: id,
    title: text,
    objectives: z.array(text).min(1),
    prerequisiteLessonIds: z.array(id),
    sections: z.array(sectionSchema),
    exercises: z.array(exerciseSchema).min(2),
    relatedLabs: z.array(labLinkSchema),
    sources: z.array(z.strictObject({ title: text, url: z.url() })).min(1),
    companion: z
      .strictObject({
        title: text,
        introduction: text,
        interfaceTable: interfaceTableSchema,
        steps: z.array(text).min(1),
      })
      .optional(),
    scope: z.literal("concepts-and-structured-practice"),
  })
  .superRefine((lesson, ctx) => {
    const kinds = lesson.sections.map((s) => s.kind);
    if (kinds.length !== sectionKinds.length || sectionKinds.some((kind, index) => kinds[index] !== kind))
      ctx.addIssue({ code: "custom", message: "Required educational sections must appear in teaching order" });
    if (new Set(lesson.exercises.map((e) => e.id)).size !== lesson.exercises.length)
      ctx.addIssue({ code: "custom", message: "Duplicate exercise ID" });
    for (const stage of ["guided", "independent"])
      if (!lesson.exercises.some((e) => e.stage === stage))
        ctx.addIssue({ code: "custom", message: "Guided and independent exercises are required" });
  });
export const moduleSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id,
  revision,
  title: text,
  overview: text,
  orderedLessonIds: z.array(id).min(1),
});
export const academySchema = z
  .strictObject({ modules: z.array(moduleSchema).min(1), lessons: z.array(lessonSchema).min(1) })
  .superRefine((content, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: "custom", message });
    const modules = new Map(content.modules.map((m) => [m.id, m]));
    const lessons = new Map(content.lessons.map((l) => [l.id, l]));
    if (modules.size !== content.modules.length || lessons.size !== content.lessons.length)
      issue("Duplicate content ID");
    for (const learningModule of content.modules) {
      if (new Set(learningModule.orderedLessonIds).size !== learningModule.orderedLessonIds.length)
        issue("Duplicate lesson ordering");
      for (const lessonId of learningModule.orderedLessonIds)
        if (lessons.get(lessonId)?.moduleId !== learningModule.id) issue("Invalid ordered lesson reference");
    }
    for (const lesson of content.lessons) {
      const learningModule = modules.get(lesson.moduleId);
      if (!learningModule?.orderedLessonIds.includes(lesson.id))
        issue("Lesson must belong to an existing module and its order");
      for (const prerequisite of lesson.prerequisiteLessonIds) {
        const parent = lessons.get(prerequisite);
        if (!parent) issue("Missing prerequisite");
        else if (
          parent.moduleId === lesson.moduleId &&
          learningModule &&
          learningModule.orderedLessonIds.indexOf(prerequisite) >= learningModule.orderedLessonIds.indexOf(lesson.id)
        )
          issue("Invalid prerequisite order");
      }
      for (const link of lesson.relatedLabs)
        if (!labs.some((lab) => lab.id === link.scenarioId)) issue("Unknown lab reference");
    }
    const visit = (key: string, path: Set<string>) => {
      if (path.has(key)) {
        issue("Circular prerequisites");
        return;
      }
      for (const parent of lessons.get(key)?.prerequisiteLessonIds ?? []) visit(parent, new Set([...path, key]));
    };
    for (const key of lessons.keys()) visit(key, new Set());
  });
export type Lesson = z.infer<typeof lessonSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Academy = z.infer<typeof academySchema>;
export type Diagram = z.infer<typeof diagramSchema>;
