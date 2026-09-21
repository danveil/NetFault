import { expect, it, vi, afterEach } from "vitest";
import { timerScenario as s } from "../src/server/timer-scenario";
import { scenarios, getScenario, validateRegistry } from "../src/server/scenarios";
import { threeRouterNetwork } from "../src/server/three-router-network";
import { connectivity, device, execute, neighbors, repaired, routes } from "../src/lib/engine";
import { grade, nextHint } from "../src/lib/grading";
import { scenarioSchema, type Diagnosis } from "../src/lib/schema";
import { startAssessment, assessmentAction } from "../src/server/sessions";
import { assertCase, observations } from "./case-contract";
const evidence = observations(s, [
  ["R2", "show ip ospf interface"],
  ["R3", "show ip ospf interface"],
  ["R2", "show ip ospf neighbor"],
  ["R3", "show ip route"],
]);
const correct: Diagnosis = {
  cause: "timer-mismatch",
  devices: ["R3"],
  interface: "Gi0/0",
  hello: 10,
  dead: 40,
  fix: "timers",
  reason: "timer-compatibility",
  evidence: evidence.map((o) => o.id),
  notes: "",
};
afterEach(() => vi.useRealTimers());
it("registry, healthy fixture, exact timer-only repair, complete reachability and grading contract", () => {
  expect(getScenario("timer-01")).toBe(s);
  assertCase(s, threeRouterNetwork("timer-01", true).devices, correct, evidence);
  expect(
    s.devices
      .flatMap((d) => d.interfaces)
      .filter((i) => i.ospf?.hello === 5)
      .map((i) => i.ip),
  ).toEqual(["10.0.23.2"]);
  expect(
    s.devices.every(
      (d) =>
        !d.staticRoutes?.length &&
        d.interfaces.every((i) => i.up && (!i.ospf || (i.ospf.area === 0 && i.ospf.mtu === 1500))),
    ),
  ).toBe(true);
});
it("registry rejects aliases, missing entries and catalog command mismatches", () => {
  expect(() => validateRegistry({ ...scenarios, "timer-01": scenarios["passive-01"] })).toThrow("identity");
  const bad = structuredClone(scenarios);
  bad["timer-01"].devices[0].commands = ["ping"];
  expect(() => validateRegistry(bad)).toThrow("command");
  expect(() => getScenario("unknown" as typeof s.id)).toThrow("Unknown");
});
it.each(["R99:Gi0/0", "R3:Gi99/0", "PC-A:Ethernet0"])("rejects invalid fault reference %s", (ref) => {
  expect(scenarioSchema.safeParse({ ...s, fault: { ...s.fault, interface: ref } }).success).toBe(false);
});
it.each([
  { device: "R3", interface: "Gi99/0" },
  { device: "PC-A", interface: "Ethernet0" },
  { device: "R3", interface: "Gi0/1" },
  { hello: 0 },
  { dead: 65536 },
])("rejects invalid timer patch %j", (change) => {
  expect(scenarioSchema.safeParse({ ...s, repair: { ...s.repair, ...change } }).success).toBe(false);
});
it("requires v6 for timer patches and rejects invalid addressing", () => {
  expect(scenarioSchema.safeParse({ ...s, schemaVersion: 5 }).success).toBe(false);
  const invalid = structuredClone(s);
  device(invalid, "R3").interfaces[0].ip = "10.0.23.3";
  expect(scenarioSchema.safeParse(invalid).success).toBe(false);
});
it("keeps R1/R2 FULL with exact missing remote LAN routes, working connected peers and failed host directions", () => {
  expect(neighbors(s, "R1").map((n) => n.routerId)).toEqual(["2.2.2.2"]);
  expect(neighbors(s, "R2").map((n) => n.routerId)).toEqual(["1.1.1.1"]);
  expect(neighbors(s, "R3")).toEqual([]);
  expect(
    routes(s, "R1")
      .filter((r) => r.kind === "O")
      .map((r) => r.prefix),
  ).toEqual(["10.0.23.0/30"]);
  expect(routes(s, "R3").every((r) => ["C", "L"].includes(r.kind))).toBe(true);
  expect(connectivity(s, "R2", "10.0.23.2").ok).toBe(true);
  expect(connectivity(s, "PC-A", "192.168.10.1").ok).toBe(true);
  expect(connectivity(s, "PC-B", "192.168.10.10").ok).toBe(false);
  for (const [id, prefix, via] of [
    ["R1", "192.168.30.0/24", "10.0.12.2"],
    ["R3", "192.168.10.0/24", "10.0.23.1"],
  ])
    expect(routes(repaired(s), id).find((r) => r.prefix === prefix)).toMatchObject({ kind: "O", via, cost: 3 });
});
it.each(["hello", "dead"] as const)("changing only %s leaves an incompatible profile", (field) => {
  const one = repaired(s);
  device(one, "R3").interfaces[0].ospf![field] = field === "hello" ? 5 : 20;
  expect(neighbors(one, "R3")).toEqual([]);
});
it("observations show both timer profiles and configuration agrees with interface output", () => {
  expect(execute(s, "R2", "show ip ospf interface")).toContain("Hello 10, Dead 40");
  expect(execute(s, "R3", "show ip ospf interface")).toContain("Hello 5, Dead 20");
  expect(execute(s, "R3", "show running-config")).toContain("ip ospf hello-interval 5");
  expect(execute(s, "R3", "show running-config")).toContain("ip ospf dead-interval 20");
  expect(execute(s, "PC-A", "tracert", "192.168.30.10")).not.toContain("Trace complete");
});
it.each([
  { devices: ["R2"] },
  { interface: "Gi0/1" },
  { hello: 5, dead: 20 },
  { fix: "no-passive" },
  { fix: "r3-area0" },
  { cause: "area-mismatch" },
  { reason: "hello-adjacency" },
])("rejects full credit for incorrect diagnosis %j", (change) => {
  expect(grade(s, { ...correct, ...change } as Diagnosis, evidence).score).toBeLessThan(100);
});
it("both timer views are necessary; neighbors/ping alone cannot prove timers", () => {
  expect(grade(s, { ...correct, evidence: ["2", "3"] }, evidence).score).toBe(80);
  expect(
    grade(
      s,
      correct,
      evidence.map((o) => ({ ...o, scenario: "passive-01" })),
    ).score,
  ).toBe(70);
  expect(
    grade(
      s,
      correct,
      evidence.map((o) => ({ ...o, output: "% Invalid" })),
    ).score,
  ).toBe(70);
  const alternative = observations(s, [
    ["R2", "show running-config"],
    ["R3", "show running-config"],
    ["R3", "show ip ospf neighbor"],
    ["R2", "show ip route"],
  ]);
  expect(grade(s, correct, alternative).score).toBe(100);
});
it("has four progressive hints and seven ordered lesson sections with requested-only independent answer", () => {
  expect(Array.from({ length: 4 }, (_, n) => nextHint(s, n))).toEqual(s.hints);
  expect(new Set(s.hints).size).toBe(4);
  expect(s.lesson).toHaveLength(7);
  expect(s.lesson![6].revealOnRequest).toBe(true);
  expect(s.lesson![5].text).toContain("2/10");
});
it("server-owned assessment survives reload, rejects forged evidence and finalizes immutably", async () => {
  const a = await startAssessment(undefined, s.id);
  expect(a).not.toHaveProperty("feedback");
  for (const o of evidence)
    await assessmentAction(a.id, "command", { device: o.device, command: o.command, target: "" });
  vi.resetModules();
  const server = await import("../src/server/sessions");
  const resumed = await server.assessmentAction(a.id, "resume");
  const done = await server.assessmentAction(a.id, "submit", {
    ...correct,
    evidence: resumed.history.map((o) => o.id),
  });
  expect(done.feedback?.score).toBe(100);
  expect(await server.assessmentAction(a.id, "submit", { ...correct, devices: [] })).toEqual(done);
  const forged = await startAssessment(undefined, s.id);
  expect((await assessmentAction(forged.id, "submit", correct)).feedback?.score).toBe(70);
});
