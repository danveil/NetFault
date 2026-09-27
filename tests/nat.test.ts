import { expect, it, vi } from "vitest";
import { natScenario as s } from "../src/server/nat-scenario";
import {
  scenarioSchema,
  repairActionSchema,
  type Diagnosis,
  type Observation,
  type RepairAction,
  type Attempt,
} from "../src/lib/schema";
import { connectivity, execute, repaired, runningConfig, packetJourney } from "../src/lib/engine";
import { trialNetwork, recordRepair } from "../src/lib/repair-trial";
import { grade } from "../src/lib/grading";
import { natRecovered } from "../src/lib/nat-grading";
import { repairPreview } from "../src/lib/preview";
import { savePack, loadPack, saveAttempt, loadJournal } from "../src/lib/storage";
import { startAssessment, assessmentAction } from "../src/server/sessions";
import { POST } from "../src/app/api/lab/route";
const change = { kind: "nat-static-local", device: "R1", mappingId: "primary", insideLocal: "192.168.40.10" } as const;
it("journey narrates the addresses at the actual reply-generating endpoint", () => {
  const fixed = repaired(s);
  expect(packetJourney(fixed, "PC-A", "198.51.100.10")).toContain("Reply 198.51.100.10 -> 203.0.113.10:");
  expect(packetJourney(fixed, "PC-B", "203.0.113.10")).toContain("Reply 192.168.40.10 -> 198.51.100.10:");
});
const answer: Diagnosis = {
  cause: "nat-local",
  devices: ["R1"],
  mappingId: "primary",
  observedLocal: "192.168.40.99",
  observedGlobal: "203.0.113.10",
  insideLocal: "192.168.40.10",
  fix: "nat-local",
  reason: "static-translation",
  evidence: [],
  notes: "",
};
type Command = [string, string, string?];
const baseline: Command[] = [
  ["PC-A", "ipconfig"],
  ["PC-B", "ipconfig"],
  ["R1", "show running-config"],
  ["R1", "show ip route"],
  ["R2", "show ip route"],
  ["PC-A", "ping", "198.51.100.10"],
];
const verification: Command[] = [
  ["PC-A", "ipconfig"],
  ["R1", "show running-config"],
  ["R1", "show ip nat translations"],
  ["PC-A", "ping", "198.51.100.10"],
  ["PC-B", "ping", "203.0.113.10"],
  ["PC-A", "ping", "192.168.40.1"],
  ["PC-B", "ping", "198.51.100.1"],
];
function observations(repairs: RepairAction[] = [], commands = baseline, prefix: Observation[] = []) {
  const h = [...prefix];
  for (const [device, command, target = ""] of commands)
    h.push({
      id: String(h.length),
      scenario: s.id,
      device,
      command,
      target,
      at: h.length + 1,
      ...(repairs.length ? { repairIndex: repairs.length } : {}),
      output: execute(trialNetwork(s, repairs), device, command, target, h, "", repairs.length),
    });
  return h;
}
function history() {
  return observations([change], verification, observations());
}
function score(h = history(), a: Diagnosis = answer, repairs: RepairAction[] = [change]) {
  return grade(s, { ...a, evidence: h.map((o) => o.id) }, h, false, repairs);
}
function attempt(): Attempt {
  return {
    version: 1,
    id: "fixture",
    scenario: s.id,
    mode: "practice",
    startedAt: 1,
    history: observations(),
    hints: [],
    revealed: false,
  };
}
it("loads the exact four-device scenario with valid roles, routes and sole differing field", () => {
  expect(scenarioSchema.parse(s)).toEqual(s);
  const healthy = repaired(s),
    changed = structuredClone(s);
  changed.devices[1].nat!.mappings[0].insideLocal = change.insideLocal;
  expect(healthy).toEqual(changed);
  expect(scenarioSchema.parse(healthy)).toEqual(healthy);
  expect(healthy.devices[1].nat).toMatchObject({ inside: "Gi0/0", outside: "Gi0/1" });
});
it.each([false, true])("local controls remain healthy repaired=%s", (fixed) => {
  const n = fixed ? repaired(s) : s;
  expect(connectivity(n, "PC-A", "192.168.40.1").ok).toBe(true);
  expect(connectivity(n, "PC-B", "198.51.100.1").ok).toBe(true);
  expect(connectivity(n, "PC-B", "192.168.40.10").ok).toBe(false);
});
it("reproduces the two distinct initial failures and repairs both", () => {
  const a = connectivity(s, "PC-A", "198.51.100.10"),
    b = connectivity(s, "PC-B", "203.0.113.10");
  expect(a.outward.ok).toBe(true);
  expect(a.returning?.reason).toContain("R2: no route");
  expect(b.outward.packet?.destination).toBe("192.168.40.99");
  expect(b.returning).toBeUndefined();
  expect(natRecovered(s, repaired(s))).toBe(true);
});
it("every offered diagnostic derives from current state", () => {
  for (const n of [s, repaired(s)])
    for (const d of n.devices)
      for (const c of d.commands)
        expect(execute(n, d.id, c, d.id === "PC-B" ? "203.0.113.10" : "198.51.100.10")).not.toMatch(/^%/);
  expect(runningConfig(s, "R1")).toContain(" ip nat inside");
  expect(execute(s, "R1", "show ip nat translations")).toContain("192.168.40.99");
  expect(execute(repaired(s), "R1", "show ip nat translations")).not.toContain("192.168.40.99");
});
it("accepts complete original and fresh proof", () => {
  expect(score()).toMatchObject({ score: 100, recovery: "verified" });
});
it.each(["cause", "observedLocal", "observedGlobal", "insideLocal", "mappingId", "reason", "fix", "devices"])(
  "does not fully accept wrong %s",
  (key) => {
    const wrong = {
      ...answer,
      [key]:
        key === "devices"
          ? ["R2"]
          : key === "cause"
            ? "missing-route"
            : key === "fix"
              ? "static-route"
              : key === "reason"
                ? "reply-route"
                : "wrong",
    };
    expect(score(history(), wrong as Diagnosis).score).toBeLessThan(100);
  },
);
it.each(verification.map((v, n) => [v.join(" "), n] as const))("requires fresh %s", (_, index) => {
  const h = history();
  h.splice(baseline.length + index, 1);
  expect(score(h).score).toBeLessThan(100);
  expect(score(h).recovery).toBe("recovered-unverified");
});
it("repair alone, stale, foreign, forged and duplicate evidence cannot verify", () => {
  expect(score(observations()).recovery).toBe("recovered-unverified");
  expect(score(observations(), answer, []).recovery).toBe("unresolved");
  for (const mutate of [
    (o: Observation) => (o.scenario = "ospf-01"),
    (o: Observation) => (o.output += " forged"),
    (o: Observation) => (o.repairIndex = 99),
    (o: Observation) => (o.id = "duplicate"),
  ]) {
    const h = history();
    h.forEach(mutate);
    expect(score(h).score).toBeLessThan(100);
  }
});
it("new versions invalidate old proof even when returning to a prior value", () => {
  expect(score(history(), answer, [change, { ...change, insideLocal: "192.168.40.98" }, change]).recovery).toBe(
    "recovered-unverified",
  );
});
it("allows wrong valid local trials without leaking correctness and normalizes outer spaces", () => {
  expect(repairActionSchema.parse({ ...change, insideLocal: " 192.168.40.10 " })).toEqual(change);
  const wrong = { ...change, insideLocal: "192.168.40.98" };
  expect(() => trialNetwork(s, [wrong])).not.toThrow();
  expect(natRecovered(s, trialNetwork(s, [wrong]))).toBe(false);
});
it("no-op, limits and finalized attempts preserve existing trial rules", () => {
  let a = recordRepair(s, attempt(), change, 2);
  expect(recordRepair(s, a, change, 3)).toEqual(a);
  for (let n = 1; n < 10; n++)
    a = recordRepair(s, a, { ...change, insideLocal: n % 2 ? "192.168.40.98" : change.insideLocal }, n + 3);
  expect(() => recordRepair(s, a, change, 20)).toThrow("Ten configuration");
  expect(recordRepair(s, { ...a, finishedAt: 18 }, change, 20).repairs).toHaveLength(10);
});
it.each(["insideGlobal", "inside", "staticRoutes", "gateway", "enabled"])("rejects bypass payload %s", (key) => {
  expect(repairActionSchema.safeParse({ ...change, [key]: "bypass" }).success).toBe(false);
});
it("rejects absent mapping/router and unusable local trials", () => {
  expect(() => trialNetwork(s, [{ ...change, device: "R2" }])).toThrow();
  expect(() => trialNetwork(s, [{ ...change, mappingId: "absent" }])).toThrow();
  expect(() => trialNetwork(s, [{ ...change, insideLocal: "192.168.40.1" }])).toThrow();
});
it("recovery rejects tampered addressing, global, roles and routes", () => {
  for (const mutate of [
    (n: typeof s) => (n.devices[0].interfaces[0].ip = "192.168.40.99"),
    (n: typeof s) => (n.devices[1].nat!.mappings[0].insideGlobal = "203.0.113.11"),
    (n: typeof s) => (n.devices[1].nat!.inside = "Gi0/1"),
    (n: typeof s) => n.devices[2].staticRoutes!.push({ network: "192.168.40.0", prefix: 24, nextHop: "192.0.2.1" }),
  ]) {
    const n = repaired(s);
    mutate(n);
    expect(natRecovered(s, n)).toBe(false);
  }
});
it("persists new pack, journal, feedback and versioned history without changing v1", () => {
  const map = new Map<string, string>(),
    storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, v);
      },
      removeItem: (k: string) => {
        map.delete(k);
      },
    };
  const a = { ...recordRepair(s, attempt(), change, 2), history: history(), diagnosis: answer, feedback: score() };
  savePack(storage, s);
  saveAttempt(storage, a);
  expect(loadPack(storage, s.id)).toEqual(s);
  expect(loadJournal(storage)).toEqual([a]);
  expect(map.has("netfault.practice.nat-static-01.v1")).toBe(true);
});
it("preview derives intended global targets and requested learning", () => {
  const p = repairPreview(s);
  expect(p).toContain("PC-B> ping 203.0.113.10");
  expect(p).not.toContain("PC-B> ping 192.168.40.10");
  expect(p).toContain("destination: 203.0.113.10 -> 192.168.40.10");
  expect(p).toContain("not part of your evidence");
  expect(s.hints).toHaveLength(4);
  expect(s.lesson).toHaveLength(8);
  expect(s.lesson?.at(-1)?.revealOnRequest).toBe(true);
});
it("server replays across invocations, concurrent duplicate repairs and immutable finalization", async () => {
  const a = await startAssessment(undefined, s.id);
  for (const [device, command, target = ""] of baseline)
    await assessmentAction(a.id, "command", { device, command, target });
  await Promise.all([assessmentAction(a.id, "repair", change), assessmentAction(a.id, "repair", change)]);
  vi.resetModules();
  const reloaded = await import("../src/server/sessions");
  for (const [device, command, target = ""] of verification)
    await reloaded.assessmentAction(a.id, "command", { device, command, target });
  const resumed = await reloaded.assessmentAction(a.id, "resume");
  expect(resumed.repairs).toHaveLength(1);
  const final = await reloaded.assessmentAction(a.id, "submit", {
    ...answer,
    evidence: resumed.history.map((o) => o.id),
  });
  expect(final.feedback).toMatchObject({ score: 100, recovery: "verified" });
  expect(await reloaded.assessmentAction(a.id, "repair", { ...change, insideLocal: "192.168.40.98" })).toEqual(final);
});
it("API rejects bypass and never caches assessment output", async () => {
  const a = await startAssessment(undefined, s.id),
    call = (data: unknown) =>
      POST(
        new Request("http://localhost/api/lab", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(data),
        }),
      );
  expect((await call({ action: "repair", id: a.id, change: { ...change, insideGlobal: "203.0.113.11" } })).status).toBe(
    400,
  );
  const r = await call({ action: "command", id: a.id, device: "R1", command: "show ip nat translations", target: "" });
  expect(r.status).toBe(200);
  for (const h of ["cache-control", "cdn-cache-control", "netlify-cdn-cache-control"])
    expect(r.headers.get(h)).toBe("no-store");
});
it("late attempts cannot apply repairs or replace expired grades", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  try {
    const a = await startAssessment(undefined, s.id);
    vi.setSystemTime(a.expiresAt! + 1);
    const expired = await assessmentAction(a.id, "repair", change);
    expect(expired.repairs).toBeUndefined();
    expect(expired.feedback).toMatchObject({ score: 0, timedOut: true });
    expect(await assessmentAction(a.id, "submit", answer)).toEqual(expired);
  } finally {
    vi.useRealTimers();
  }
});
