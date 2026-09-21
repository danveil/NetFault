import { expect, it, vi, afterEach } from "vitest";
import { nextHopScenario as s, healthyStaticNetwork } from "../src/server/next-hop-scenario";
import { getScenario } from "../src/server/scenarios";
import { device, connectivity, forward, execute, repaired, routes, packetJourney } from "../src/lib/engine";
import { grade, nextHint } from "../src/lib/grading";
import { scenarioSchema, type Diagnosis } from "../src/lib/schema";
import { startAssessment, assessmentAction } from "../src/server/sessions";
import { assertCase, observations } from "./case-contract";
const evidence = observations(s, [
  ["R2", "show ip route"],
  ["R1", "show ip route"],
  ["R3", "show ip interface brief"],
]);
const correct: Diagnosis = {
  cause: "incorrect-static-next-hop",
  devices: ["R2"],
  destinationNetwork: "192.168.30.0/24",
  observedNextHop: "10.0.12.1",
  nextHop: "10.0.23.2",
  fix: "static-route",
  reason: "forward-route",
  evidence: evidence.map((o) => o.id),
  notes: "",
};
afterEach(() => vi.useRealTimers());
it("validates the isolated wrong-next-hop case and restores exactly the healthy state", () => {
  expect(getScenario("next-hop-01")).toBe(s);
  assertCase(s, healthyStaticNetwork().devices, correct, evidence);
  expect(s.devices.every((d) => d.interfaces.every((i) => i.up && !i.ospf))).toBe(true);
  expect(s.devices.flatMap((d) => d.staticRoutes ?? []).every((r) => r.prefix !== 0)).toBe(true);
});
it("installs the wrong route because R1 is an actual adjacent reachable router", () => {
  expect(routes(s, "R2").find((r) => r.prefix === "192.168.30.0/24")).toMatchObject({
    kind: "S",
    via: "10.0.12.1",
    interface: "Gi0/0",
  });
  expect(connectivity(s, "R2", "10.0.12.1").ok).toBe(true);
  expect(connectivity(s, "PC-A", "192.168.10.1").ok).toBe(true);
  expect(connectivity(s, "PC-B", "192.168.30.1").ok).toBe(true);
  expect(connectivity(s, "PC-A", "10.0.23.2").ok).toBe(true);
});
it("terminates the actual forwarding loop before the request reaches PC-B", () => {
  const path = forward(s, "PC-A", "192.168.30.10");
  expect(path).toMatchObject({ ok: false, reason: "Routing loop" });
  expect(path.hops).toEqual(["192.168.10.1", "10.0.12.2", "10.0.12.1"]);
  expect(packetJourney(s, "PC-A", "192.168.30.10")).toContain("No reply generated: request was not delivered.");
  const reverse = connectivity(s, "PC-B", "192.168.10.10");
  expect(reverse.outward.ok).toBe(true);
  expect(reverse.returning?.reason).toBe("Routing loop");
  expect(reverse.ok).toBe(false);
});
it("all command views derive the installed wrong route and repaired forwarding", () => {
  expect(execute(s, "R2", "show ip route")).toMatch(/192\.168\.30\.0\/24\s+\[1\/0\] via 10\.0\.12\.1/);
  expect(execute(s, "R2", "show running-config")).toContain("ip route 192.168.30.0 255.255.255.0 10.0.12.1");
  expect(execute(s, "R2", "show running-config")).not.toContain("router ospf");
  expect(execute(s, "R2", "show ip ospf neighbor")).toContain("Unsupported");
  expect(execute(s, "PC-A", "ping", "192.168.30.10")).toContain("0 percent (0/5)");
  expect(execute(s, "PC-A", "tracert", "192.168.30.10")).not.toContain("Trace complete.");
  expect(execute(s, "PC-A", "tracert", "192.168.30.10")).toContain("Simulator stopped: Routing loop");
  expect(execute(s, "PC-A", "tracert", "192.168.30.10")).not.toContain("!H");
  expect(execute(repaired(s), "PC-A", "tracert", "192.168.30.10")).toContain("Trace complete.");
  expect(packetJourney(repaired(s), "PC-A", "192.168.30.10")).toContain("Bidirectional communication: successful");
});
it("router probe sources remain explicit and response reachability is independently checked", () => {
  expect(connectivity(s, "R1", "192.168.30.10", "192.168.10.1").ok).toBe(false);
  expect(connectivity(repaired(s), "R1", "192.168.30.10", "Gi0/0").ok).toBe(true);
  const hiddenReturn = structuredClone(s);
  device(hiddenReturn, "R2").staticRoutes = device(hiddenReturn, "R2").staticRoutes!.filter(
    (r) => r.network !== "192.168.10.0",
  );
  const trace = execute(hiddenReturn, "PC-A", "tracert", "192.168.30.10");
  expect(trace).toContain("* * *");
});
it("uses longest-prefix match, not route order, for a competing host route", () => {
  const moreSpecific = structuredClone(s);
  device(moreSpecific, "R2").staticRoutes!.push({ network: "192.168.30.10", prefix: 32, nextHop: "10.0.23.2" });
  expect(scenarioSchema.safeParse(moreSpecific).success).toBe(true);
  expect(connectivity(moreSpecific, "PC-A", "192.168.30.10").ok).toBe(true);
  expect(routes(moreSpecific, "R2").find((r) => r.prefix === "192.168.30.0/24")?.via).toBe("10.0.12.1");
});
it.each(["10.0.12.99", "10.0.23.99", "192.168.30.10"])(
  "rejects nonexistent/off-link/nonrouter next hop %s",
  (nextHop) => {
    const bad = structuredClone(s);
    device(bad, "R2").staticRoutes![1].nextHop = nextHop;
    expect(scenarioSchema.safeParse(bad).success).toBe(false);
  },
);
it.each([
  { cause: "missing-route" },
  { devices: ["R1"] },
  { destinationNetwork: "192.168.10.0/24" },
  { observedNextHop: "10.0.23.2" },
  { nextHop: "10.0.12.1" },
  { fix: "gateway" },
  { reason: "reply-route" },
])("gives partial credit rather than accepting wrong diagnosis %j", (change) => {
  expect(grade(s, { ...correct, ...change } as Diagnosis, evidence).score).toBeLessThan(100);
});
it("uses installed-wrong-route semantics and requires forwarding context beyond ping", () => {
  expect(
    grade(s, correct, evidence)
      .parts.map((p) => p.message)
      .join(" "),
  ).not.toMatch(/Missing-route|missing the route|Reply forwarding/);
  expect(grade(s, { ...correct, evidence: ["0"] }, evidence).score).toBe(85);
  expect(
    grade(
      s,
      correct,
      evidence.map((o) => ({ ...o, scenario: "return-01" })),
    ).score,
  ).toBe(70);
  expect(grade(s, correct, observations(s, [["PC-A", "ping"]])).score).toBe(70);
  const alternate = observations(s, [
    ["R2", "show running-config"],
    ["R1", "show running-config"],
    ["R3", "show running-config"],
  ]);
  expect(grade(s, correct, alternate).score).toBe(100);
});
it("teaches all seven parts and has four progressive hints", () => {
  expect(Array.from({ length: 4 }, (_, n) => nextHint(s, n))).toEqual(s.hints);
  expect(s.lesson).toHaveLength(7);
  expect(s.lesson![6].revealOnRequest).toBe(true);
  expect(s.lesson![5].text).toContain("172.20.10.0/24");
});
it("assessment reload preserves source history, grades server evidence and finalization is immutable", async () => {
  const a = await startAssessment(undefined, s.id);
  await assessmentAction(a.id, "command", { device: "R1", command: "ping", target: "192.168.30.10", source: "Gi0/0" });
  for (const o of evidence)
    await assessmentAction(a.id, "command", { device: o.device, command: o.command, target: "" });
  vi.resetModules();
  const server = await import("../src/server/sessions");
  const resumed = await server.assessmentAction(a.id, "resume");
  expect(resumed.history[0]).toMatchObject({ source: "Gi0/0" });
  expect(resumed.history[0].output).toContain("0 percent (0/5)");
  const done = await server.assessmentAction(a.id, "submit", {
    ...correct,
    evidence: resumed.history.map((o) => o.id),
  });
  expect(done.feedback?.score).toBe(100);
  expect(await server.assessmentAction(a.id, "submit", { ...correct, evidence: [] })).toEqual(done);
});
it("deadline wins over a late otherwise-correct submission", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  const a = await startAssessment(undefined, s.id);
  vi.setSystemTime(a.expiresAt! + 1);
  expect((await assessmentAction(a.id, "submit", correct)).feedback).toMatchObject({ score: 0, timedOut: true });
});
