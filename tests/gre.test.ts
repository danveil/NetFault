import { expect, it, vi } from "vitest";
import { greScenario as s } from "../src/server/gre-scenario";
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
import { greRecovered } from "../src/lib/gre-grading";
import { repairPreview } from "../src/lib/preview";
import { savePack, loadPack, saveAttempt, loadJournal } from "../src/lib/storage";
import { startAssessment, assessmentAction } from "../src/server/sessions";
import { POST } from "../src/app/api/lab/route";
const change = { kind: "gre-destination", device: "R1", interface: "Tunnel0", destination: "198.51.100.2" } as const;
const answer: Diagnosis = {
  cause: "incorrect-tunnel-destination",
  devices: ["R1"],
  interface: "Tunnel0",
  observedDestination: "198.51.100.1",
  tunnelDestination: "198.51.100.2",
  fix: "gre-destination",
  reason: "gre-endpoint",
  evidence: [],
  notes: "",
};
type Command = [string, string, string?, string?];
const baseline: Command[] = [
  ["R1", "ping", "198.51.100.1", "Gi0/1"],
  ["R1", "ping", "198.51.100.2", "Gi0/1"],
  ["R1", "show running-config"],
  ["R2", "show running-config"],
  ["R1", "show interfaces tunnel 0"],
  ["R1", "show ip route"],
  ["R2", "show ip route"],
  ["PC-A", "ping", "172.31.20.10"],
];
const verification: Command[] = [
  ["R1", "show interfaces tunnel 0"],
  ["R1", "show ip route"],
  ["R2", "show ip route"],
  ["R1", "ping", "10.14.0.2", "Tunnel0"],
  ["R2", "ping", "10.14.0.1", "Tunnel0"],
  ["PC-A", "ping", "172.31.20.10"],
  ["PC-B", "ping", "172.31.10.10"],
];
function observations(repairs: RepairAction[] = [], commands = baseline, prefix: Observation[] = []) {
  const h = [...prefix];
  for (const [device, command, target = "", source = ""] of commands)
    h.push({
      id: String(h.length),
      scenario: s.id,
      device,
      command,
      target,
      source,
      at: h.length + 1,
      ...(repairs.length ? { repairIndex: repairs.length } : {}),
      output: execute(trialNetwork(s, repairs), device, command, target, h, source, repairs.length),
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
it("loads the exact five-device case and preserves everything except one destination", () => {
  expect(scenarioSchema.parse(s)).toEqual(s);
  expect(s.devices.map((d) => d.id)).toEqual(["PC-A", "R1", "T1", "R2", "PC-B"]);
  const expected = structuredClone(s);
  expected.devices[1].gre!.destination = change.destination;
  expect(repaired(s)).toEqual(expected);
  expect(trialNetwork(s, [change])).toEqual(expected);
  expect(scenarioSchema.parse(expected)).toEqual(expected);
});
it("initial physical controls work while logical delivery fails at the actual T1 receiver", () => {
  for (const [d, t, source] of [
    ["PC-A", "172.31.10.1", ""],
    ["PC-B", "172.31.20.1", ""],
    ["R1", "198.51.100.1", "Gi0/1"],
    ["R1", "198.51.100.2", "192.0.2.1"],
    ["R2", "192.0.2.1", "Gi0/0"],
  ])
    expect(connectivity(s, d, t, source).ok).toBe(true);
  const c = connectivity(s, "PC-A", "172.31.20.10");
  expect(c.ok).toBe(false);
  expect(c.outward.tunnels?.[0]).toMatchObject({ outerReceiver: "T1", accepted: false, underlay: ["192.0.2.2"] });
  expect(c.outward.delivered).toBeUndefined();
  expect(connectivity(s, "PC-B", "172.31.10.10").ok).toBe(false);
  expect(greRecovered(s, repaired(s))).toBe(true);
});
it("commands show unchanged local state/RIB and changed destination without fabricated peer state", () => {
  for (const n of [s, repaired(s)])
    for (const d of n.devices)
      for (const c of d.commands) expect(execute(n, d.id, c, "172.31.20.10")).not.toMatch(/^%/);
  expect(execute(s, "R1", "show interfaces tunnel 0")).toContain("Tunnel0 is up, line protocol is up");
  expect(execute(repaired(s), "R1", "show interfaces tunnel 0")).toContain("destination 198.51.100.2");
  expect(execute(s, "R1", "show ip route")).toBe(execute(repaired(s), "R1", "show ip route"));
  expect(execute(s, "R1", "show ip route")).not.toContain("undefined");
  expect(runningConfig(s, "T1")).not.toContain("Tunnel0");
  expect(execute(s, "R1", "traceroute", "172.31.20.10")).toMatch(/^%/);
});
it("requires all evidence layers and actual minimal recovery for 100", () => {
  expect(score()).toMatchObject({ score: 100, recovery: "verified" });
  expect(score(observations()).score).toBe(80);
  expect(score(observations(), answer, []).recovery).toBe("unresolved");
});
it.each([...baseline, ...verification].map((v, n) => [v.join(" "), n] as const))(
  "rejects incomplete selected proof %s at index %s",
  (_, index) => {
    const h = history();
    h.splice(index, 1);
    expect(score(h).score).toBeLessThan(100);
    if (index >= baseline.length) expect(score(h).recovery).toBe("recovered-unverified");
  },
);
it.each(["cause", "observedDestination", "interface", "devices", "tunnelDestination", "fix", "reason"])(
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
it("authenticates source, epoch, case, text and duplicate IDs", () => {
  for (const mutate of [
    (o: Observation) => (o.scenario = "ospf-01"),
    (o: Observation) => (o.output += " forged"),
    (o: Observation) => (o.repairIndex = 99),
    (o: Observation) => (o.id = "duplicate"),
    (o: Observation) => (o.source = "Gi0/0"),
  ]) {
    const h = history();
    h.forEach(mutate);
    expect(score(h).score).toBeLessThan(100);
  }
  expect(score(history(), answer, [change, { ...change, destination: "198.51.100.1" }, change]).recovery).toBe(
    "recovered-unverified",
  );
  const equivalent = observations(
    [change],
    verification.map(([d, c, t, source]) => [
      d,
      c,
      t,
      source === "Tunnel0" ? (d === "R1" ? "10.14.0.1" : "10.14.0.2") : source,
    ]),
    observations(
      [],
      baseline.map(([d, c, t, source]) => [d, c, t, source === "Gi0/1" ? "192.0.2.1" : source]),
    ),
  );
  expect(score(equivalent).score).toBe(100);
  expect(score(history().map((o) => ({ ...o, source: o.source?.toLowerCase() }))).score).toBe(100);
});
it("valid wrong destination and wrong endpoint edits remain unresolved", () => {
  for (const edit of [
    { ...change, destination: "192.0.2.2" },
    { ...change, device: "R2", destination: "192.0.2.2" },
  ]) {
    const n = trialNetwork(s, [edit]);
    expect(greRecovered(s, n)).toBe(false);
  }
  expect(repairActionSchema.parse({ ...change, destination: " 198.51.100.2 " })).toEqual(change);
  for (const bad of [
    { ...change, device: "T1" },
    { ...change, destination: "203.0.113.99" },
    { ...change, destination: "198.51.100.0" },
  ])
    expect(() => trialNetwork(s, [bad])).toThrow();
});
it.each(["sourceInterface", "ip", "staticRoutes", "gateway", "adminUp"])("rejects extra bypass field %s", (key) =>
  expect(repairActionSchema.safeParse({ ...change, [key]: "bypass" }).success).toBe(false),
);
it("recovery rejects direct-route bypass, deleted tunnel and changed identities", () => {
  for (const mutate of [
    (n: typeof s) => (n.devices[1].tunnelRoutes = []),
    (n: typeof s) => n.devices[1].staticRoutes!.push({ network: "172.31.20.0", prefix: 24, nextHop: "192.0.2.2" }),
    (n: typeof s) => delete n.devices[1].gre,
    (n: typeof s) => (n.devices[0].interfaces[0].ip = "172.31.10.99"),
    (n: typeof s) => (n.devices[1].gre!.sourceInterface = "Gi0/0"),
  ]) {
    const n = repaired(s);
    mutate(n);
    expect(greRecovered(s, n)).toBe(false);
  }
});
it("no-op, limits and finalized attempts preserve version contracts", () => {
  let a = recordRepair(s, attempt(), change, 2);
  expect(recordRepair(s, a, change, 3)).toEqual(a);
  for (let n = 1; n < 10; n++)
    a = recordRepair(s, a, { ...change, destination: n % 2 ? "198.51.100.1" : change.destination }, n + 3);
  expect(() => recordRepair(s, a, change, 20)).toThrow("Ten configuration");
  expect(recordRepair(s, { ...a, finishedAt: 18 }, change, 20).repairs).toHaveLength(10);
});
it("preview is derived, separated from evidence and includes both GRE journeys", () => {
  const p = repairPreview(s);
  expect(p).toContain("PC-B> ping 172.31.10.10");
  expect(p).toContain("not part of your evidence");
  expect(p).toContain("198.51.100.2");
  expect(p).not.toContain("T1> ping 172.31");
  expect(packetJourney(repaired(s), "PC-A", "172.31.20.10")).toContain("GRE");
  expect(s.hints).toHaveLength(4);
  expect(s.lesson).toHaveLength(8);
  expect(s.lesson?.at(-1)?.revealOnRequest).toBe(true);
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
  expect(map.has("netfault.practice.gre-01.v1")).toBe(true);
});
it("server replays across invocations, concurrent duplicate repairs and immutable finalization", async () => {
  const a = await startAssessment(undefined, s.id);
  for (const [device, command, target = "", source = ""] of baseline)
    await assessmentAction(a.id, "command", { device, command, target, source });
  await Promise.all([assessmentAction(a.id, "repair", change), assessmentAction(a.id, "repair", change)]);
  vi.resetModules();
  const reloaded = await import("../src/server/sessions");
  for (const [device, command, target = "", source = ""] of verification)
    await reloaded.assessmentAction(a.id, "command", { device, command, target, source });
  const resumed = await reloaded.assessmentAction(a.id, "resume");
  expect(resumed.repairs).toHaveLength(1);
  const final = await reloaded.assessmentAction(a.id, "submit", {
    ...answer,
    evidence: resumed.history.map((o) => o.id),
  });
  expect(final.feedback).toMatchObject({ score: 100, recovery: "verified" });
  expect(await reloaded.assessmentAction(a.id, "repair", { ...change, destination: "198.51.100.1" })).toEqual(final);
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
  expect((await call({ action: "repair", id: a.id, change: { ...change, sourceInterface: "Gi0/0" } })).status).toBe(
    400,
  );
  const r = await call({ action: "command", id: a.id, device: "R1", command: "show interfaces tunnel 0", target: "" });
  expect(r.status).toBe(200);
  for (const h of ["cache-control", "cdn-cache-control", "netlify-cdn-cache-control"])
    expect(r.headers.get(h)).toBe("no-store");
  const transport = await call({
    action: "command",
    id: a.id,
    device: "T1",
    command: "show ip interface brief",
    target: "",
  });
  expect(transport.status).toBe(200);
  expect((await transport.json()).attempt.history.at(-1)).toMatchObject({
    device: "T1",
    command: "show ip interface brief",
  });
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
