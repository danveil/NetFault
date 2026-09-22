import { describe, expect, it } from "vitest";
import { academy, lessonRevision, references } from "../src/lib/academy/content";
import { academy as legacy } from "../src/lib/academy/content-v1";
import { ospfLesson as lesson } from "../src/lib/academy/ospf-content";
import { academySchema, diagramSchema } from "../src/lib/academy/schema";
import { gradeExercise, subnet } from "../src/lib/academy/grading";
import { matchesAuthoredWildcard as matches } from "../src/lib/academy/wildcard";
import { emptyProgress, updateProgress, recordFor, saveProgress, loadProgress } from "../src/lib/academy/progress";

// Independently stated expected choices; do not derive successful fixtures from answer keys.
const guided = {
  matches: "Gi0/0 and Gi0/1",
  exact: "network 10.45.0.5 0.0.0.0 area 0",
  hellos: "Fern Gi0/1 and Moss Gi0/0",
  identity: "Fern process 30 / ID 10.255.2.1; Moss process 40 / ID 10.255.2.2",
  observations:
    "Interface brief → address/state; OSPF interface → area/type; neighbor → adjacency; route → installed prefixes; host pings both ways → tested request/reply paths",
};
const independent = {
  plan: "network 10.77.0.10 0.0.0.0 area 0; network 192.168.96.1 0.0.0.0 area 0",
  passive: "Make Gi0/0/0 passive; leave Gi0/2/0 non-passive",
  behavior: "One FULL transit neighbor per router; Studio LAN advertised despite no LAN Hellos",
  routes: "Ridge: 192.168.64.0/24 via 10.77.0.9; Vale: 192.168.96.0/24 via 10.77.0.10",
  proof:
    "Both routers’ interface/OSPF state, reciprocal FULL neighbors and remote routes; correct host gateways; successful Archive-to-Studio and Studio-to-Archive pings",
};
describe("3E bounded content and authored network examples", () => {
  it("adds exactly one revision-1 lesson and two exercises while retaining the IPv4 archive", () => {
    expect(academySchema.parse(academy)).toEqual(academy);
    expect(academy.modules.map((m) => m.id)).toEqual(["ipv4", "ospfv2"]);
    expect(academy.lessons.map((l) => l.id)).toEqual([
      "ipv4-addresses",
      "ipv4-subnets",
      "ipv4-gateway-arp",
      "ospfv2-configuration",
    ]);
    expect(lesson.exercises.map((e) => [e.id, e.revision])).toEqual([
      ["ospf-interface-guided", 1],
      ["ospf-plan-independent", 1],
    ]);
    expect(lessonRevision(lesson.id, 1)).toEqual(lesson);
    expect(lessonRevision(lesson.id, 2)).toBeUndefined();
    for (const old of legacy.lessons) {
      expect(lessonRevision(old.id, 1)).toEqual(old);
      expect(lessonRevision(old.id, 2)?.exercises.every((e) => e.revision === 2)).toBe(true);
    }
    expect(references).toHaveLength(4);
    expect(lesson.relatedLabs.map((l) => l.scenarioId)).toEqual(["ospf-01", "passive-01", "timer-01"]);
    expect(lesson.sections.flatMap((s) => (s.diagram ? [s.diagram.kind] : []))).toEqual([
      "ospf-match",
      "ospf-evidence",
    ]);
  });
  it("uses distinct valid host addresses and paired transits in each original table", () => {
    const tables = [
      ...lesson.sections.flatMap((s) => (s.interfaceTable ? [s.interfaceTable] : [])),
      lesson.companion!.interfaceTable,
    ];
    expect(tables).toHaveLength(4);
    const allAddresses: string[] = [];
    for (const table of tables) {
      expect(new Set(table.rows.map((r) => r.address)).size).toBe(table.rows.length);
      const transit = table.rows.filter((r) => r.prefix === 30);
      expect(transit).toHaveLength(2);
      expect(subnet(transit[0].address, 30).network).toBe(subnet(transit[1].address, 30).network);
      for (const row of table.rows) {
        const range = subnet(row.address, row.prefix);
        expect(row.address).not.toBe(range.network);
        expect(row.address).not.toBe(range.broadcast);
        allAddresses.push(row.address);
        if (row.role.startsWith("Gateway ")) {
          const gateway = table.rows.find((r) => r.address === row.role.slice(8));
          expect(gateway).toBeDefined();
          expect(subnet(gateway!.address, gateway!.prefix).network).toBe(range.network);
        }
      }
    }
    expect(new Set(allAddresses).size).toBe(allAddresses.length);
  });
  it.each([
    ["10.44.0.0", "10.44.0.0", "0.0.0.3", true],
    ["10.44.0.1", "10.44.0.0", "0.0.0.3", true],
    ["10.44.0.2", "10.44.0.0", "0.0.0.3", true],
    ["10.44.0.3", "10.44.0.0", "0.0.0.3", true],
    ["10.44.0.4", "10.44.0.0", "0.0.0.3", false],
    ["10.44.1.1", "10.44.0.0", "0.0.0.3", false],
    ["172.20.10.1", "172.20.10.0", "0.0.0.255", true],
    ["172.20.99.1", "172.20.10.0", "0.0.0.255", false],
    ["10.45.0.5", "10.45.0.4", "0.0.0.3", true],
    ["10.45.0.6", "10.45.0.4", "0.0.0.3", true],
    ["10.45.0.5", "10.45.0.5", "0.0.0.0", true],
    ["10.45.0.5", "10.45.0.6", "0.0.0.0", false],
    ["10.77.0.10", "10.77.0.10", "0.0.0.0", true],
    ["192.168.96.1", "192.168.64.1", "0.0.0.0", false],
    ["10.88.0.17", "10.88.0.16", "0.0.0.3", true],
    ["10.88.0.18", "10.88.0.16", "0.0.0.3", true],
  ])("matches %s against %s / wildcard %s as %s", (ip, selector, wildcard, result) => {
    expect(matches(ip, selector, wildcard)).toBe(result);
  });
  it("computes actual diagram results and rejects out-of-scope wildcards and invalid addresses", () => {
    const diagram = lesson.sections[2].diagram!;
    if (diagram.kind !== "ospf-match") throw Error("Expected match diagram");
    expect(diagram.interfaces.rows.map((r) => matches(r.address, diagram.selector, diagram.wildcard))).toEqual([
      false,
      true,
      false,
    ]);
    for (const wildcard of ["255.255.255.252", "255.255.255.0", "0.0.1.5"])
      expect(() => matches("10.44.0.1", "10.44.0.0", wildcard)).toThrow("Unsupported authored wildcard");
    expect(() => matches("10.44.0.999", "10.44.0.0", "0.0.0.3")).toThrow("Invalid IPv4 example");
    expect(diagramSchema.safeParse({ ...diagram, wildcard: "255.255.255.252" }).success).toBe(false);
  });
  it("keeps external work unexecuted and distinct from mobile scoring", () => {
    expect(lesson.companion!.title).toContain("UNEXECUTED");
    expect(lesson.companion!.introduction).toContain("not a recovered or official UM practical sheet");
    expect(lesson.companion!.steps.join(" ")).toContain("Roll back");
    expect(lesson.companion!.steps.join(" ")).toContain("copy running-config startup-config");
  });
});
describe("OSPF public exercise grading and revision-safe persistence", () => {
  it.each([
    [0, guided],
    [1, independent],
  ] as const)(
    "grades exercise %s with independently specified expected answers and every distractor",
    (index, answers) => {
      const exercise = lesson.exercises[index];
      expect(gradeExercise(exercise, answers)).toMatchObject({ valid: true, correct: true });
      expect(exercise.solutionPolicy).toBe("requested-only");
      for (const field of exercise.fields) {
        if (field.kind !== "choice") throw Error("Expected native choice");
        for (const distractor of field.choices.filter((c) => c !== field.answer)) {
          const result = gradeExercise(exercise, { ...answers, [field.id]: distractor });
          expect(result).toMatchObject({ valid: true, correct: false });
          if (result.valid)
            for (const step of exercise.solution.steps) expect(result.feedback.join(" ")).not.toContain(step);
        }
      }
      expect(gradeExercise(exercise, {})).toMatchObject({ valid: false });
      expect(gradeExercise(exercise, { ...answers, [exercise.fields[0].id]: "injected" })).toMatchObject({
        valid: false,
      });
    },
  );
  it("resumes drafts, records changed retries, suppresses duplicates and preserves both old IPv4 revisions", () => {
    let progress = updateProgress(emptyProgress(), legacy.lessons[0], { type: "read" }, 1);
    progress = updateProgress(progress, academy.lessons[0], { type: "read" }, 2);
    const old = structuredClone(progress.records);
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
    };
    data.set("netfault.academy.progress.v1", JSON.stringify(progress));
    const exercise = lesson.exercises[0];
    saveProgress(storage, lesson, { type: "draft", exercise, answers: { matches: guided.matches } });
    progress = loadProgress(storage);
    expect(recordFor(progress, lesson)!.drafts[`${exercise.id}@1`]).toEqual({ matches: guided.matches });
    progress = updateProgress(
      progress,
      lesson,
      { type: "submit", exercise, answers: { ...guided, matches: "Gi0/1 and Gi0/2" } },
      3,
    );
    progress = updateProgress(progress, lesson, { type: "submit", exercise, answers: guided }, 4);
    expect(updateProgress(progress, lesson, { type: "submit", exercise, answers: guided }, 5)).toBe(progress);
    progress = updateProgress(progress, lesson, { type: "reveal", exercise }, 6);
    progress = updateProgress(progress, lesson, { type: "reveal", exercise }, 7);
    expect(recordFor(progress, lesson)!.reveals).toHaveLength(1);
    expect(recordFor(progress, lesson)!.completedAt).toBeUndefined();
    progress = updateProgress(
      progress,
      lesson,
      { type: "submit", exercise: lesson.exercises[1], answers: independent },
      8,
    );
    expect(recordFor(progress, lesson)!.submissions.map((s) => [s.correct, s.unaided])).toEqual([
      [false, true],
      [true, false],
      [true, true],
    ]);
    expect(recordFor(progress, lesson)!.completedAt).toBe(8);
    expect(progress.records.slice(0, 2)).toEqual(old);
    data.set("netfault.academy.progress.v1", JSON.stringify(progress));
    expect(loadProgress(storage)).toEqual(progress);
  });
});
