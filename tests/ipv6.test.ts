import { expect, it, vi } from "vitest";
import { ipv6Scenario as s } from "../src/server/ipv6-scenario";
import {
  scenarioSchema,
  repairActionSchema,
  type Diagnosis,
  type Observation,
  type RepairAction,
  type Attempt,
} from "../src/lib/schema";
import { execute, connectivity, repaired } from "../src/lib/engine";
import { grade } from "../src/lib/grading";
import { trialNetwork, recordRepair } from "../src/lib/repair-trial";
import { ipv6Recovered } from "../src/lib/ipv6-grading";
import { repairPreview } from "../src/lib/preview";
import { savePack, loadPack, saveAttempt, loadJournal } from "../src/lib/storage";
import { startAssessment, assessmentAction } from "../src/server/sessions";
import { POST } from "../src/app/api/lab/route";
const change = { kind: "ipv6-forwarding", device: "R1", enabled: true } as const;
const answer: Diagnosis = {
  cause: "ipv6-forwarding-disabled",
  devices: ["R1"],
  fix: "ipv6-forwarding",
  reason: "ipv6-transit",
  observedForwarding: false,
  forwarding: true,
  evidence: [],
  notes: "",
};
type Command = [string, string, string?, string?];
const hostCommands: Command[] = [
  ["PC-A", "ipconfig"],
  ["PC-B", "ipconfig"],
  ["PC-A", "route print"],
  ["PC-B", "route print"],
];
const state: Command[] = [
  ["R1", "show running-config"],
  ["R1", "show ipv6 interface brief"],
];
const controls: Command[] = [
  ["PC-A", "ping", "2001:db8:15:10::1"],
  ["PC-B", "ping", "2001:db8:15:20::1"],
];
const remote: Command[] = [
  ["PC-A", "ping", "2001:db8:15:20::20"],
  ["PC-B", "ping", "2001:db8:15:10::10"],
];
const baseline = [...hostCommands, ...state, ...controls, remote[0]],
  verification = [...state, ...hostCommands.slice(2), ...controls, ...remote];
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
    id: "v6-fixture",
    scenario: s.id,
    mode: "practice",
    startedAt: 1,
    history: observations(),
    hints: [],
    revealed: false,
  };
}
it("loads exactly one fault and changes only router forwarding", () => {
  expect(scenarioSchema.parse(s)).toEqual(s);
  expect(s.devices.map((d) => d.id)).toEqual(["PC-A", "R1", "PC-B"]);
  const healthy = structuredClone(s);
  healthy.devices[1].ipv6!.forwarding = true;
  expect(repaired(s)).toEqual(healthy);
  expect(trialNetwork(s, [change])).toEqual(healthy);
  expect(ipv6Recovered(s, healthy)).toBe(true);
});
it("initial local controls and router-originated probes succeed, reciprocal transit fails", () => {
  for (const [d, , t] of controls) expect(connectivity(s, d, t!).ok).toBe(true);
  for (const [d, , t] of remote) expect(connectivity(s, d, t!).ok).toBe(false);
  expect(connectivity(s, "R1", remote[0][2]!).ok).toBe(true);
  expect(connectivity(repaired(s), "PC-B", remote[1][2]!).ok).toBe(true);
});
it("commands show effective state and do not invent protocol operation", () => {
  expect(execute(s, "R1", "show running-config")).toContain("no ipv6 unicast-routing");
  expect(execute(repaired(s), "R1", "show running-config")).not.toContain("no ipv6 unicast-routing");
  expect(execute(s, "R1", "show ipv6 interface brief")).toEqual(
    execute(repaired(s), "R1", "show ipv6 interface brief"),
  );
  expect(execute(s, "PC-A", "route print")).toContain("::/0");
  for (const d of s.devices)
    for (const cmd of d.commands) expect(execute(s, d.id, cmd, remote[0][2])).not.toMatch(/^%/);
  expect(execute(s, "R1", "show ipv6 ospf neighbor")).toMatch(/Unsupported/);
});
it("correct complete evidence earns full credit", () => {
  expect(score()).toMatchObject({ score: 100, recovery: "verified" });
});
it.each(["cause", "device", "observed", "proposed", "mechanism", "fix"])("rejects incorrect %s", (field) => {
  const a = { ...answer };
  if (field === "cause") a.cause = "wrong-gateway";
  if (field === "device") a.devices = ["PC-A"];
  if (field === "observed") a.observedForwarding = true;
  if (field === "proposed") a.forwarding = false;
  if (field === "mechanism") a.reason = "ipv6-local-proves-transit";
  if (field === "fix") a.fix = "gateway";
  expect(score(history(), a).score).toBeLessThan(100);
});
it("selected correction without an applied trial cannot recover", () => {
  expect(score(observations(), answer, [])).toMatchObject({ recovery: "unresolved" });
});
it("repair without fresh verification earns at most 80", () => {
  expect(score(observations())).toMatchObject({ score: 80, recovery: "recovered-unverified" });
});
it.each(["router", "routes", "local", "reciprocal"])("requires fresh %s evidence", (part) => {
  const h = history().filter(
    (o) =>
      !o.repairIndex ||
      (part === "router"
        ? o.device !== "R1"
        : part === "routes"
          ? o.command !== "route print"
          : part === "local"
            ? !controls.some(([d, , t]) => o.device === d && o.target === t)
            : !(o.device === "PC-B" && o.target === remote[1][2])),
  );
  expect(score(h).score).toBeLessThan(100);
  expect(score(h).recovery).toBe("recovered-unverified");
});
it.each(["text", "foreign", "epoch", "target", "device", "duplicate"])("does not accept forged %s evidence", (kind) => {
  const h = history().map((o) => ({ ...o }));
  for (const o of h) {
    if (kind === "text") o.output += "\nForged";
    if (kind === "foreign") o.scenario = "gre-01";
    if (kind === "epoch") o.repairIndex = 99;
    if (kind === "target" && o.command === "ping") o.target = "2001:db8:bad::1";
    if (kind === "device") o.device = "Unknown";
    if (kind === "duplicate") o.id = "same";
  }
  expect(score(h).score).toBeLessThan(100);
});
it("equivalent IPv6 target spelling is accepted by replay and evidence matching", () => {
  const h = history();
  for (const o of h)
    if (o.command === "ping") {
      o.target = o.target.toUpperCase().replace("2001:DB8:", "2001:0DB8:");
      o.output = execute(trialNetwork(s, o.repairIndex ? [change] : []), o.device, o.command, o.target, [], o.source);
    }
  expect(score(h).score).toBe(100);
});
it("changing away and back invalidates earlier verification", () => {
  const repairs: RepairAction[] = [change, { ...change, enabled: false }, change];
  expect(score(history(), answer, repairs).recovery).toBe("recovered-unverified");
  expect(score(observations(repairs, verification, history()), answer, repairs).score).toBe(100);
});
it("rejects addressing or cable bypasses in recovery", () => {
  const t = repaired(s);
  t.devices[0].ipv6!.interfaces[0].address = "2001:db8:15:10::11";
  expect(ipv6Recovered(s, t)).toBe(false);
  const u = repaired(s);
  u.links[0].subnet = "renamed";
  expect(ipv6Recovered(s, u)).toBe(false);
});
it("retains no-op/version/ten-change/finalized semantics", () => {
  const a = attempt();
  expect(recordRepair(s, a, { ...change, enabled: false }, 2)).toEqual(a);
  const b = recordRepair(s, a, change, 2);
  expect(b.repairs).toHaveLength(1);
  expect(recordRepair(s, b, change, 3)).toEqual(b);
  expect(recordRepair(s, { ...b, finishedAt: 3 }, { ...change, enabled: false }, 4).repairs).toHaveLength(1);
  expect(() =>
    recordRepair(
      s,
      { ...a, repairs: Array.from({ length: 10 }, (_, n) => ({ ...change, enabled: n % 2 === 0, at: n + 1 })) },
      change,
      11,
    ),
  ).toThrow(/Ten/);
});
it("strict trials cannot edit addresses or choose a PC", () => {
  expect(repairActionSchema.safeParse({ ...change, address: "2001:db8::9" }).success).toBe(false);
  expect(() => trialNetwork(s, [{ ...change, device: "PC-A" }])).toThrow();
});
it("saves a separate pack and complete journal without replacing earlier keys", () => {
  const data = new Map<string, string>([["netfault.practice.v1", "old"]]);
  const storage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
    removeItem: (k: string) => {
      data.delete(k);
    },
  };
  savePack(storage, s);
  expect(loadPack(storage, s.id)).toEqual(s);
  expect(data.get("netfault.practice.v1")).toBe("old");
  const a = {
    ...attempt(),
    repairs: [{ ...change, at: 2 }],
    history: history(),
    diagnosis: answer,
    feedback: score(),
    finishedAt: 3,
    hints: [s.hints[0]],
  };
  saveAttempt(storage, a);
  expect(loadJournal(storage)).toEqual([a]);
});
it("preview and seven-part teaching retain actual paths and explicit independent reveal", () => {
  const preview = repairPreview(s);
  expect(preview).toContain("BEFORE REPAIR");
  expect(preview).toContain("AFTER REPAIR");
  expect(preview).toContain("PC-A -> R1 -> PC-B");
  expect(preview).toContain("Bidirectional communication: successful");
  expect(s.hints).toHaveLength(4);
  expect(s.lesson).toHaveLength(8);
  expect(s.lesson!.at(-1)?.revealOnRequest).toBe(true);
});
it("assessment reload and concurrent duplicate repair preserve server state", async () => {
  const a = await startAssessment(undefined, s.id);
  for (const [device, command, target = "", source = ""] of baseline)
    await assessmentAction(a.id, "command", { device, command, target, source });
  await Promise.all([assessmentAction(a.id, "repair", change), assessmentAction(a.id, "repair", change)]);
  vi.resetModules();
  const fresh = await import("../src/server/sessions");
  const resumed = await fresh.assessmentAction(a.id, "resume");
  expect(resumed.repairs).toHaveLength(1);
  for (const [device, command, target = "", source = ""] of verification)
    await fresh.assessmentAction(a.id, "command", { device, command, target, source });
  const current = await fresh.assessmentAction(a.id, "resume");
  const final = await fresh.assessmentAction(a.id, "submit", { ...answer, evidence: current.history.map((o) => o.id) });
  expect(final.feedback).toMatchObject({ score: 100, recovery: "verified" });
  expect(await fresh.assessmentAction(a.id, "repair", { ...change, enabled: false })).toEqual(final);
});
it("initial API has no private case and all responses are no-store", async () => {
  const call = (body: unknown) =>
    POST(
      new Request("http://localhost/api/lab", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  const response = await call({ action: "start", scenario: s.id });
  expect(response.status).toBe(200);
  const raw = await response.json();
  const a = raw.attempt ?? raw;
  for (const key of ["fault", "repair", "evidenceRules", "lesson", "solution", "devices"])
    expect(a).not.toHaveProperty(key);
  for (const header of ["cache-control", "cdn-cache-control", "netlify-cdn-cache-control"])
    expect(response.headers.get(header)).toBe("no-store");
  expect((await call({ action: "repair", id: a.id, change: { ...change, address: "::1" } })).status).toBe(400);
});
it("expired assessments cannot mutate or replace the final grade", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  try {
    const a = await startAssessment(undefined, s.id);
    vi.setSystemTime(a.expiresAt! + 1);
    const expired = await assessmentAction(a.id, "repair", change);
    expect(expired.feedback).toMatchObject({ score: 0, timedOut: true });
    expect(expired.repairs).toBeUndefined();
    expect(await assessmentAction(a.id, "submit", answer)).toEqual(expired);
  } finally {
    vi.useRealTimers();
  }
});
