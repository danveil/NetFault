import { describe, expect, it } from "vitest";
import { academy, references } from "../src/lib/academy/content";
import { academySchema } from "../src/lib/academy/schema";
import { gradeExercise, normalizeIPv4, subnet } from "../src/lib/academy/grading";
import {
  ACADEMY_KEY,
  emptyProgress,
  loadProgress,
  recordFor,
  saveProgress,
  updateProgress,
} from "../src/lib/academy/progress";
import { lessons as guides } from "../src/lib/lessons";
const lesson = academy.lessons[0],
  exercise = lesson.exercises[0];
const accepted = (e = exercise) => Object.fromEntries(e.fields.map((f) => [f.id, String(f.answer)]));
const memory = () => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
};
describe("Academy publication validation", () => {
  it("publishes exactly one module and three lessons, with stable IDs/revisions", () => {
    expect(academySchema.parse(academy)).toEqual(academy);
    expect(academy.modules.map((m) => [m.id, m.revision])).toEqual([["ipv4", 1]]);
    expect(academy.lessons.map((l) => l.id)).toEqual(["ipv4-addresses", "ipv4-subnets", "ipv4-gateway-arp"]);
    expect(academy.lessons.flatMap((l) => l.exercises.map((e) => e.id))).toEqual([
      "valid-format",
      "read-octets",
      "guided-subnet",
      "independent-subnet",
      "local-remote",
      "next-hop",
    ]);
  });
  it("adapts the four references without changing any original teaching", () => {
    expect(
      references.map(({ id, revision, ...body }) => {
        expect(id).toBeTruthy();
        expect(revision).toBe(1);
        return body;
      }),
    ).toEqual(guides);
    expect(new Set(references.map((r) => r.id)).size).toBe(4);
  });
  const change = (value: unknown, path: (string | number)[], replacement: unknown) => {
    let target = value as Record<string | number, unknown>;
    for (const key of path.slice(0, -1)) target = target[key] as Record<string | number, unknown>;
    target[path.at(-1)!] = replacement;
  };
  const mutations: [string, (value: typeof academy) => void][] = [
    // Deliberately malformed runtime publication input.
    ["duplicate modules", (v) => v.modules.push(v.modules[0])],
    ["duplicate lessons", (v) => v.lessons.push(v.lessons[0])],
    ["duplicate exercise IDs", (v) => v.lessons[0].exercises.push(v.lessons[0].exercises[0])],
    ["unknown module", (v) => (v.lessons[0].moduleId = "missing")],
    ["unknown ordered lesson", (v) => v.modules[0].orderedLessonIds.push("missing")],
    ["missing lesson in order", (v) => v.modules[0].orderedLessonIds.pop()],
    ["duplicate order", (v) => v.modules[0].orderedLessonIds.push(v.modules[0].orderedLessonIds[0])],
    ["missing prerequisite", (v) => v.lessons[0].prerequisiteLessonIds.push("missing")],
    ["prerequisite cycle", (v) => v.lessons[0].prerequisiteLessonIds.push(v.lessons[1].id)],
    ["invalid order", (v) => v.modules[0].orderedLessonIds.reverse()],
    ["missing teaching", (v) => v.lessons[0].sections.pop()],
    ["missing independent practice", (v) => v.lessons[0].exercises.pop()],
    ["invalid input type", (v) => change(v, ["lessons", 0, "exercises", 0, "fields", 0, "kind"], "prose-keywords")],
    ["missing answer", (v) => change(v, ["lessons", 0, "exercises", 0, "fields", 0, "answer"], undefined)],
    ["unknown choice", (v) => (v.lessons[0].exercises[0].fields[0].answer = "unknown")],
    ["missing solution", (v) => change(v, ["lessons", 0, "exercises", 0, "solution"], undefined)],
    ["invalid lab", (v) => (v.lessons[0].relatedLabs[0].scenarioId = "lab-008")],
    ["private lab metadata", (v) => change(v, ["lessons", 0, "relatedLabs", 0, "acceptedRepair"], "private")],
    ["private descriptor field", (v) => change(v, ["lessons", 0, "hiddenFault"], "private")],
    ["unsupported execution scope", (v) => change(v, ["lessons", 0, "scope"], "arp-simulator")],
  ];
  it.each(mutations)("rejects %s", (_, mutate) => {
    const changed = structuredClone(academy);
    mutate(changed);
    expect(academySchema.safeParse(changed).success).toBe(false);
  });
  it("allows new content identities without changing the validator", () => {
    const changed = structuredClone(academy);
    const extra = { ...structuredClone(lesson), id: "future-lesson", title: "Future lesson" };
    changed.lessons.push(extra);
    changed.modules[0].orderedLessonIds.push(extra.id);
    expect(academySchema.safeParse(changed).success).toBe(true);
  });
});
describe("deterministic practice grading", () => {
  it.each([null, [], 42, { valid: true }, { valid: "a".repeat(501) }])(
    "rejects malformed runtime answers %j",
    (input) => {
      expect(gradeExercise(exercise, input)).toMatchObject({ valid: false });
    },
  );
  it.each(academy.lessons.flatMap((l) => l.exercises).map((e) => [e.id, e] as const))("grades %s", (_, e) => {
    expect(gradeExercise(e, accepted(e))).toMatchObject({ valid: true, correct: true });
    const wrong = accepted(e),
      field = e.fields[0];
    wrong[field.id] =
      field.kind === "choice"
        ? field.choices.find((c) => c !== field.answer)!
        : field.kind === "ipv4"
          ? "1.2.3.4"
          : "999";
    expect(gradeExercise(e, wrong)).toMatchObject({ valid: true, correct: false });
    expect(gradeExercise(e, {})).toMatchObject({ valid: false });
  });
  it("normalizes whitespace and decimal numeric answers, rejects ambiguous IPv4", () => {
    expect(normalizeIPv4(" 192.168.10.1 ")).toBe("192.168.10.1");
    for (const value of ["256.0.0.1", "01.2.3.4", "1.2.3", "1.2.3.-1", "1e2.2.3.4"])
      expect(normalizeIPv4(value)).toBeUndefined();
    const e = lesson.exercises[1];
    expect(gradeExercise(e, { ...accepted(e), "octet-1": "0172" })).toMatchObject({ correct: true });
  });
  it.each([
    ["192.168.10.25", 24, "192.168.10.0", "192.168.10.255", "192.168.10.1", "192.168.10.254", 254],
    ["192.168.10.70", 26, "192.168.10.64", "192.168.10.127", "192.168.10.65", "192.168.10.126", 62],
    ["192.168.50.140", 26, "192.168.50.128", "192.168.50.191", "192.168.50.129", "192.168.50.190", 62],
    ["172.16.4.77", 27, "172.16.4.64", "172.16.4.95", "172.16.4.65", "172.16.4.94", 30],
  ] as const)("calculates %s/%i", (address, prefix, network, broadcast, first, last, hosts) => {
    expect(subnet(address, prefix)).toEqual({ network, broadcast, first, last, hosts });
  });
  it("keeps authored subnet answers consistent with calculated boundaries", () => {
    for (const [e, address, prefix] of [
      [academy.lessons[1].exercises[0], "192.168.50.140", 26],
      [academy.lessons[1].exercises[1], "172.16.4.77", 27],
    ] as const) {
      const result = subnet(address, prefix);
      expect(accepted(e)).toEqual({
        network: result.network,
        broadcast: result.broadcast,
        first: result.first,
        last: result.last,
      });
    }
  });
  it.each([0, 31, 32, -1, 24.5])("does not apply ordinary host-range rules to /%s", (prefix) =>
    expect(() => subnet("192.168.1.1", prefix)).toThrow(),
  );
});
describe("independent revision-aware progress", () => {
  it("separates opened, read, practiced and completed; reveals give no completion", () => {
    let p = updateProgress(emptyProgress(), lesson, { type: "view" }, 1);
    expect(recordFor(p, lesson)?.readAt).toBeUndefined();
    p = updateProgress(p, lesson, { type: "read" }, 2);
    p = updateProgress(p, lesson, { type: "reveal", exercise }, 3);
    expect(recordFor(p, lesson)).toMatchObject({ readAt: 2, submissions: [] });
    expect(recordFor(p, lesson)?.completedAt).toBeUndefined();
    p = updateProgress(p, lesson, { type: "submit", exercise, answers: accepted() }, 4);
    expect(recordFor(p, lesson)?.submissions[0]).toMatchObject({ correct: true, unaided: false });
    expect(recordFor(p, lesson)?.completedAt).toBeUndefined();
    p = updateProgress(
      p,
      lesson,
      { type: "submit", exercise: lesson.exercises[1], answers: accepted(lesson.exercises[1]) },
      5,
    );
    expect(recordFor(p, lesson)?.completedAt).toBe(5);
  });
  it("retains wrong attempts, feedback and requested reveals; retry is not unaided", () => {
    let p = updateProgress(
      emptyProgress(),
      lesson,
      { type: "submit", exercise, answers: { ...accepted(), valid: "Invalid" } },
      1,
    );
    p = updateProgress(p, lesson, { type: "submit", exercise, answers: accepted() }, 2);
    p = updateProgress(p, lesson, { type: "reveal", exercise }, 3);
    p = updateProgress(p, lesson, { type: "reveal", exercise }, 4);
    expect(recordFor(p, lesson)?.submissions.map((s) => [s.correct, s.unaided])).toEqual([
      [false, true],
      [true, false],
    ]);
    expect(recordFor(p, lesson)?.reveals).toHaveLength(1);
  });
  it("roundtrips drafts, submissions and resume timestamps without touching lab saves", () => {
    const storage = memory();
    storage.setItem("netfault.journal.v1", "existing journal");
    storage.setItem("netfault.practice.v1", "existing pack");
    saveProgress(storage, lesson, { type: "draft", exercise, answers: { valid: "Valid" } });
    const saved = saveProgress(storage, lesson, { type: "submit", exercise, answers: accepted() });
    expect(loadProgress(storage)).toEqual(saved);
    expect(recordFor(saved, lesson)?.drafts["valid-format@1"]).toEqual(accepted());
    expect(storage.getItem("netfault.journal.v1")).toBe("existing journal");
    expect(storage.getItem("netfault.practice.v1")).toBe("existing pack");
  });
  it("preserves readable old content and exercise revisions without crediting the new version", () => {
    const old = updateProgress(emptyProgress(), lesson, { type: "submit", exercise, answers: accepted() }, 1);
    const revised = { ...lesson, revision: 2, exercises: lesson.exercises.map((e) => ({ ...e, revision: 2 })) };
    const next = updateProgress(old, revised, { type: "view" }, 2);
    const storage = memory();
    storage.setItem(ACADEMY_KEY, JSON.stringify(next));
    expect(loadProgress(storage).records[0]).toEqual(old.records[0]);
    expect(recordFor(next, revised)?.submissions).toEqual([]);
    expect(next.records).toHaveLength(2);
  });
  it.each(["{broken", '{"schemaVersion":99,"records":[]}', '{"schemaVersion":1,"records":[{}]}'])(
    "preserves damaged/unsupported raw data: %s",
    (raw) => {
      const storage = memory();
      storage.setItem(ACADEMY_KEY, raw);
      expect(() => saveProgress(storage, lesson, { type: "view" })).toThrow();
      expect(storage.getItem(ACADEMY_KEY)).toBe(raw);
    },
  );
  it("surfaces quota failure without replacing existing storage", () => {
    const storage = memory();
    const before = JSON.stringify(emptyProgress());
    storage.setItem(ACADEMY_KEY, before);
    storage.setItem = () => {
      throw Error("QuotaExceededError");
    };
    expect(() => saveProgress(storage, lesson, { type: "view" })).toThrow("Quota");
    expect(storage.getItem(ACADEMY_KEY)).toBe(before);
  });
  it("refuses to silently evict revisions when retention capacity is reached", () => {
    let p = emptyProgress();
    for (let revision = 1; revision <= 100; revision++)
      p = updateProgress(p, { ...lesson, revision }, { type: "view" });
    expect(() => updateProgress(p, { ...lesson, revision: 101 }, { type: "view" })).toThrow();
    expect(p.records).toHaveLength(100);
  });
});
