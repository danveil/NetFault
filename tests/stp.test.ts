import { expect, it } from "vitest";
import { stpScenario as original } from "../src/server/stp-scenario";
import {
  scenarioSchema,
  repairActionSchema,
  type RepairAction,
  type Diagnosis,
  type Observation,
  type Attempt,
} from "../src/lib/schema";
import { stpState, stpPath } from "../src/lib/stp";
import { connectivity, execute, repaired } from "../src/lib/engine";
import { grade } from "../src/lib/grading";
import { recordRepair, trialNetwork } from "../src/lib/repair-trial";
import { stpRecovered } from "../src/lib/stp-grading";
import { saveAttempt, loadJournal, savePack, loadPack } from "../src/lib/storage";
import { startAssessment, assessmentAction } from "../src/server/sessions";
import { POST } from "../src/app/api/lab/route";
const change = { kind: "stp-priority", device: "SW1", vlan: 10, priority: 24576 } as const;
const answer: Diagnosis = {
  cause: "bridge-priority",
  devices: ["SW1"],
  observedPriority: 40960,
  observedVlan: 10,
  reason: "root-election",
  fix: "bridge-priority",
  evidence: [],
  notes: "",
};
const base: [string, string, string?][] = [
  ...["SW1", "SW2", "SW3"].map((d) => [d, "show spanning-tree vlan 10"] as [string, string]),
  ["SW1", "show running-config"],
];
const verification: [string, string, string?][] = [
  ...base,
  ["PC-A", "ping", "172.26.10.20"],
  ["PC-B", "ping", "172.26.10.10"],
];
function observations(repairs: RepairAction[] = [], commands = base): Observation[] {
  return commands.map(([device, command, target = ""], i) => ({
    id: `${repairs.length}:${i}`,
    device,
    command,
    target,
    scenario: original.id,
    at: 1,
    ...(repairs.length ? { repairIndex: repairs.length } : {}),
    output: execute(trialNetwork(original, repairs), device, command, target),
  }));
}
function score(
  repairs: RepairAction[] = [change],
  history = [...observations(), ...observations(repairs, verification)],
  patch: Partial<Diagnosis> = {},
) {
  return grade(original, { ...answer, evidence: history.map((o) => o.id), ...patch }, history, false, repairs);
}
it("validates the sole fault, all addresses, complete role matrix and actual host paths", () => {
  expect(scenarioSchema.parse(original)).toEqual(original);
  const before = stpState(original),
    after = stpState(repaired(original));
  expect(Object.values(before).map((b) => Object.values(b.ports).map((p) => p.role))).toEqual([
    ["Root", "Alternate", "Designated"],
    ["Designated", "Designated"],
    ["Designated", "Root", "Designated"],
  ]);
  expect(Object.values(after).map((b) => Object.values(b.ports).map((p) => p.role))).toEqual([
    ["Designated", "Designated", "Designated"],
    ["Root", "Designated"],
    ["Root", "Alternate", "Designated"],
  ]);
  expect(stpPath(original, "PC-A", "PC-B")).toEqual(["PC-A", "SW1", "SW2", "SW3", "PC-B"]);
  expect(stpPath(repaired(original), "PC-A", "PC-B")).toEqual(["PC-A", "SW1", "SW3", "PC-B"]);
  for (const s of [original, repaired(original)])
    for (const [a, b] of [
      ["PC-A", "172.26.10.20"],
      ["PC-B", "172.26.10.10"],
    ])
      expect(connectivity(s, a, b).ok).toBe(true);
  expect(repaired(original).links).toEqual(original.links);
  expect(stpRecovered(original, original)).toBe(false);
});
it("a blocked direct edge cannot bypass a disabled forwarding path in the shared engine", () => {
  const s = structuredClone(original);
  s.devices.find((d) => d.id === "PC-A")!.interfaces[0].up = false;
  expect(connectivity(s, "PC-B", "172.26.10.10").ok).toBe(false);
  expect(execute(original, "SW1", "show interfaces status")).toMatch(/Gi0\/2\s+connected/);
  expect(execute(original, "SW1", "show spanning-tree vlan 10")).toMatch(/Gi0\/2\s+Alternate\s+Blocking/);
});
it.each([0, 4096, 8192, 12288, 16384, 20480, 24576, 28672])(
  "accepts semantically equivalent priority %s",
  (priority) => {
    expect(score([{ ...change, priority }])).toMatchObject({ score: 100, recovery: "verified" });
  },
);
it.each([32768, 36864, 40960, 61440])("does not equate a ping with recovery at priority %s", (priority) => {
  const repairs = [{ ...change, priority }];
  expect(connectivity(trialNetwork(original, repairs), "PC-A", "172.26.10.20").ok).toBe(true);
  expect(score(repairs).recovery).toBe("unresolved");
});
it("requires real fresh evidence and rejects wrong diagnosis or forged output", () => {
  expect(score([], observations()).score).toBe(65);
  expect(score([change], observations())).toMatchObject({ score: 80, recovery: "recovered-unverified" });
  expect(score([change], undefined, { cause: "wrong-gateway" }).score).toBe(80);
  expect(score([change], undefined, { devices: ["SW2"] }).score).toBe(90);
  expect(score([change], undefined, { evidence: ["forged"] }).score).toBe(50);
  const stale = [...observations(), ...observations([change], verification)];
  expect(score([change, { ...change, priority: 40960 }, change], stale).recovery).toBe("recovered-unverified");
  const forged = stale.map((o) => ({ ...o, output: o.output + " tampered" }));
  expect(score([change], forged).score).toBe(50);
  expect(score([change], [...observations(), ...observations([change], verification.slice(-2))]).recovery).toBe(
    "recovered-unverified",
  );
});
it("validates changes, no-ops, exploration, final minimal diff and limits", () => {
  const initial: Attempt = {
    version: 1,
    id: "stp-local",
    scenario: "stp-01",
    mode: "practice",
    startedAt: 1,
    history: [],
    hints: [],
    revealed: false,
  };
  expect(recordRepair(original, initial, { ...change, priority: 40960 }, 2)).toBe(initial);
  const current = recordRepair(original, initial, change, 2);
  expect(recordRepair(original, current, change, 3)).toBe(current);
  expect(score([{ ...change, device: "SW2", priority: 0 }]).recovery).toBe("unresolved");
  expect(
    score([{ ...change, device: "SW2", priority: 0 }, { ...change, device: "SW2", priority: 32768 }, change]).recovery,
  ).toBe("verified");
  for (const invalid of [
    { ...change, priority: 1 },
    { ...change, priority: -4096 },
    { ...change, priority: 65536 },
    { ...change, shutdown: true },
  ])
    expect(repairActionSchema.safeParse(invalid).success).toBe(false);
  for (const invalid of [
    { ...change, device: "PC-A" },
    { ...change, vlan: 20 },
  ])
    expect(() => trialNetwork(original, [invalid])).toThrow();
  expect(() =>
    recordRepair(original, { ...current, repairs: Array(10).fill({ ...change, at: 2 }) }, change, 3),
  ).toThrow("Ten");
  const final = { ...current, finishedAt: 3 };
  expect(recordRepair(original, final, change, 4)).toBe(final);
});
it.each(["mac", "priority", "port", "cost", "vlan", "gateway", "channel", "duplicate", "large", "extra"])(
  "rejects unsupported STP authoring: %s",
  (kind) => {
    const s = structuredClone(original),
      d = s.devices.find((d) => d.id === "SW1")!;
    if (kind === "mac") d.stp!.mac = "0100.0000.0010";
    if (kind === "priority") d.stp!.priority = 1;
    if (kind === "port") d.ports![1].stp!.number = 1;
    if (kind === "cost") d.ports![0].stp!.cost = 0;
    if (kind === "vlan") d.ports![0].vlan = 20;
    if (kind === "gateway") s.devices[0].gateway = "172.26.10.1";
    if (kind === "channel") d.portChannels = [];
    if (kind === "duplicate") s.devices.find((d) => d.id === "SW2")!.stp!.mac = d.stp!.mac;
    if (kind === "large") s.devices.push({ ...d, id: "SW4" });
    if (kind === "extra") Object.assign(d.stp!, { root: "SW1" });
    expect(scenarioSchema.safeParse(s).success).toBe(false);
  },
);
it("renders configured base priority and derived current roles; unsupported commands stay unsupported", () => {
  expect(execute(original, "SW1", "show running-config")).toContain("spanning-tree vlan 10 priority 40960");
  expect(execute(trialNetwork(original, [change]), "SW1", "show spanning-tree vlan 10")).toContain(
    "This bridge is the root",
  );
  for (const command of ["show spanning-tree", "show spanning-tree vlan 20", "show spanning-tree detail"])
    expect(execute(original, "SW1", command)).toContain("Unsupported");
  expect(original.hints).toHaveLength(4);
});
it("round-trips the new pack, repair history, hints and graded journal without changing v1 keys", () => {
  const data = new Map<string, string>(),
    storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
      removeItem: (k: string) => {
        data.delete(k);
      },
    };
  const attempt: Attempt = {
    version: 1,
    id: "stp-saved",
    scenario: "stp-01",
    mode: "practice",
    startedAt: 1,
    finishedAt: 2,
    repairs: [{ ...change, at: 1 }],
    history: observations(),
    hints: [original.hints[0]],
    revealed: false,
    feedback: score(),
    diagnosis: answer,
  };
  savePack(storage, original);
  saveAttempt(storage, attempt);
  expect(loadPack(storage, "stp-01")).toEqual(original);
  expect(loadJournal(storage)).toEqual([attempt]);
  expect(data.has("netfault.practice.stp-01.v1")).toBe(true);
  expect(data.has("netfault.journal.v1")).toBe(true);
});
it("assessment replays durable trials, authentic observations and immutable final grading", async () => {
  const a = await startAssessment(undefined, "stp-01");
  for (const [device, command, target = ""] of base)
    await assessmentAction(a.id, "command", { device, command, target });
  await assessmentAction(a.id, "repair", change);
  for (const [device, command, target = ""] of verification)
    await assessmentAction(a.id, "command", { device, command, target });
  const ready = await assessmentAction(a.id, "resume");
  const final = await assessmentAction(a.id, "submit", { ...answer, evidence: ready.history.map((o) => o.id) });
  expect(final.feedback).toMatchObject({ score: 100, recovery: "verified" });
  expect(await assessmentAction(a.id, "repair", { ...change, priority: 40960 })).toEqual(final);
});
it("concurrent repair/command requests retain the version actually observed", async () => {
  const a = await startAssessment(undefined, "stp-01");
  await Promise.all([
    assessmentAction(a.id, "repair", change),
    assessmentAction(a.id, "command", { device: "SW3", command: "show spanning-tree vlan 10", target: "" }),
  ]);
  const result = await assessmentAction(a.id, "resume"),
    o = result.history[0];
  expect(result.repairs).toHaveLength(1);
  expect(o.output).toBe(execute(trialNetwork(original, o.repairIndex ? [change] : []), o.device, o.command));
});
it("API supports SW3, rejects extra repair fields and does not cache sensitive responses", async () => {
  const a = await startAssessment(undefined, "stp-01");
  const call = (data: unknown) =>
    POST(
      new Request("http://localhost/api/lab", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      }),
    );
  const res = await call({
    action: "command",
    id: a.id,
    device: "SW3",
    command: "show spanning-tree vlan 10",
    target: "",
  });
  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toBe("no-store");
  expect((await call({ action: "repair", id: a.id, change: { ...change, root: "SW1" } })).status).toBe(400);
});
