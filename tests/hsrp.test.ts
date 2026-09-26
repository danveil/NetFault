import { expect, it, vi } from "vitest";
import { hsrpScenario as original } from "../src/server/hsrp-scenario";
import {
  scenarioSchema,
  repairActionSchema,
  type RepairAction,
  type Diagnosis,
  type Observation,
  type Attempt,
} from "../src/lib/schema";
import { hsrpState, virtualMac } from "../src/lib/hsrp";
import { connectivity, execute, repaired, forward } from "../src/lib/engine";
import { grade } from "../src/lib/grading";
import { recordRepair, trialNetwork } from "../src/lib/repair-trial";
import { hsrpRecovered } from "../src/lib/hsrp-grading";
import { repairPreview } from "../src/lib/preview";
import { saveAttempt, loadJournal, savePack, loadPack } from "../src/lib/storage";
import { startAssessment, assessmentAction } from "../src/server/sessions";
import { POST } from "../src/app/api/lab/route";
const change = { kind: "hsrp-priority", device: "R1", interface: "Gi0/0", group: 11, priority: 150 } as const;
const answer: Diagnosis = {
  cause: "hsrp-priority",
  devices: ["R1"],
  interface: "Gi0/0",
  observedHsrpPriority: 90,
  observedGroup: 11,
  reason: "virtual-owner",
  fix: "hsrp-priority",
  evidence: [],
  notes: "",
};
type Command = [string, string, string?];
const base: Command[] = [
  ["R1", "show standby brief"],
  ["R2", "show standby brief"],
  ["R1", "show running-config"],
  ["R2", "show running-config"],
  ["PC-A", "ipconfig"],
];
const verification: Command[] = [
  ["R1", "show standby brief"],
  ["R2", "show standby brief"],
  ["R1", "show running-config"],
  ["PC-A", "ping", "172.28.10.1"],
  ["PC-A", "arp -a"],
  ["PC-A", "ping", "172.28.20.10"],
  ["PC-B", "ping", "172.28.10.10"],
];
function observations(repairs: RepairAction[] = [], commands = base, prefix: Observation[] = []): Observation[] {
  const history = [...prefix];
  for (const [device, command, target = ""] of commands)
    history.push({
      id: `${repairs.length}:${history.length}`,
      scenario: original.id,
      device,
      command,
      target,
      at: history.length + 1,
      ...(repairs.length ? { repairIndex: repairs.length } : {}),
      output: execute(trialNetwork(original, repairs), device, command, target, history, "", repairs.length),
    });
  return history;
}
function score(
  repairs: RepairAction[] = [change],
  history = observations(repairs, verification, observations()),
  patch: Partial<Diagnosis> = {},
) {
  return grade(original, { ...answer, evidence: history.map((o) => o.id), ...patch }, history, false, repairs);
}
it("loads validated addressing and only one incorrect priority with successful initial delivery", () => {
  expect(scenarioSchema.parse(original)).toEqual(original);
  expect(original.devices).toHaveLength(6);
  expect(hsrpState(original).active?.device.id).toBe("R2");
  expect(hsrpState(original).standby?.device.id).toBe("R1");
  expect(original.design).toContain("R1 as preferred Active");
  expect(original.design).toContain("R2's existing configuration");
  const fixed = repaired(original);
  expect(scenarioSchema.parse(fixed)).toEqual(fixed);
  expect(hsrpRecovered(original, fixed)).toBe(true);
  const normalized = structuredClone(fixed);
  normalized.devices.find((d) => d.id === "R1")!.interfaces[0].hsrp!.priority = 90;
  expect(normalized).toEqual(original);
  for (const s of [original, fixed]) {
    for (const a of s.devices.filter((d) => d.kind !== "switch"))
      for (const target of [...s.devices.flatMap((d) => d.interfaces.map((i) => i.ip)), "172.28.10.1"])
        expect(connectivity(s, a.id, target).ok, `${a.id} → ${target}`).toBe(true);
  }
  expect(forward(original, "PC-A", "172.28.20.10").hops).toEqual(["172.28.10.3", "10.0.23.2", "172.28.20.10"]);
  expect(forward(fixed, "PC-A", "172.28.20.10").hops).toEqual(["172.28.10.2", "10.0.13.2", "172.28.20.10"]);
  expect(connectivity(original, "PC-A", "172.28.20.10").returning?.hops).toEqual([
    "172.28.20.1",
    "10.0.13.1",
    "172.28.10.10",
  ]);
});
it("every supported command agrees with state and other commands are honestly unsupported", () => {
  for (const d of original.devices)
    for (const c of d.commands) expect(execute(original, d.id, c, "172.28.20.10")).not.toMatch(/^%/);
  expect(execute(original, "R1", "show standby brief")).toMatch(/90\s+P Standby\s+172.28.10.3\s+local\s+172.28.10.1/);
  expect(execute(repaired(original), "R1", "show standby brief")).toMatch(/150\s+P Active\s+local\s+172.28.10.3/);
  expect(execute(original, "R2", "show running-config")).not.toContain(" priority ");
  expect(execute(original, "R1", "show running-config")).toContain("standby 11 priority 90");
  for (const cmd of ["show standby", "debug standby terse", "show ip ospf neighbor"])
    expect(execute(original, "R1", cmd)).toMatch(/^% Unsupported/);
  expect(execute(original, "R3", "show standby brief")).toMatch(/^% Unsupported/);
});
it("ARP uses virtual identity and a new observation epoch after each actual edit", () => {
  const initial = observations(
    [],
    [
      ["PC-A", "ping", "172.28.10.1"],
      ["PC-A", "arp -a"],
    ],
  );
  expect(initial[1].output).toContain(virtualMac(11));
  const changed = trialNetwork(original, [change]);
  expect(execute(changed, "PC-A", "arp -a", "", initial, "", 1)).toContain("No ARP Entries");
  const fresh = observations(
    [change],
    [
      ["PC-A", "ping", "172.28.10.1"],
      ["PC-A", "arp -a"],
    ],
    initial,
  );
  expect(fresh.at(-1)!.output).toContain(virtualMac(11));
  expect(fresh.at(-1)!.output).toContain("172.28.10.1");
  expect(initial[1].output.split("\n").find((line) => line.includes(virtualMac(11)))).toBe(
    fresh
      .at(-1)!
      .output.split("\n")
      .find((line) => line.includes(virtualMac(11))),
  );
  expect(score().score).toBe(100);
});
it.each([101, 120, 150, 254, 255])("accepts equivalent primary priority %i with full fresh proof", (priority) => {
  const r = [{ ...change, priority }];
  expect(score(r)).toMatchObject({ score: 100, recovery: "verified" });
});
it.each([0, 80, 90, 99])("does not recover for insufficient primary priority %i", (priority) => {
  expect(score([{ ...change, priority }]).recovery).toBe("unresolved");
});
it.each([
  { ...change, priority: 100 },
  { ...change, device: "R3" },
  { ...change, interface: "Gi0/1" },
  { ...change, group: 12 },
  { ...change, priority: 256 },
  { ...change, preempt: false },
])("rejects invalid trial %j without changing canonical state", (r) => {
  const before = JSON.stringify(original);
  expect(() => trialNetwork(original, [r as RepairAction])).toThrow();
  expect(JSON.stringify(original)).toBe(before);
});
it("wrong-router lowering can change roles but cannot recover the approved baseline", () => {
  const r = [{ ...change, device: "R2", priority: 80 }];
  expect(hsrpState(trialNetwork(original, r)).active?.device.id).toBe("R1");
  expect(score(r).recovery).toBe("unresolved");
  const revert = [...r, { ...change, device: "R2", priority: 100 }, change];
  expect(score(revert).score).toBe(100);
});
it.each(["gateway", "group", "remove", "route", "physical", "preempt", "standby-priority"])(
  "rejects bypass/unrelated recovery mutation: %s",
  (fault) => {
    const s = repaired(original),
      r1 = s.devices.find((d) => d.id === "R1")!,
      r2 = s.devices.find((d) => d.id === "R2")!;
    if (fault === "gateway") s.devices[0].gateway = "172.28.10.2";
    if (fault === "group") r1.interfaces[0].hsrp!.group = 12;
    if (fault === "remove") delete r2.interfaces[0].hsrp;
    if (fault === "route") r2.staticRoutes = [];
    if (fault === "physical") r1.interfaces[0].ip = "172.28.10.4";
    if (fault === "preempt") Object.assign(r2.interfaces[0].hsrp!, { preempt: false });
    if (fault === "standby-priority") r2.interfaces[0].hsrp!.priority = 99;
    expect(hsrpRecovered(original, s)).toBe(false);
  },
);
it.each([
  { cause: "wrong-gateway" },
  { devices: ["R2"] },
  { interface: "Gi0/1" },
  { observedGroup: 1 },
  { observedHsrpPriority: 100 },
  { reason: "reverse-automatically" },
  { fix: "gateway" },
] as Partial<Diagnosis>[])("does not fully credit incorrect diagnosis %j", (patch) =>
  expect(score(undefined, undefined, patch).score).toBeLessThan(100),
);
it("requires applied recovery and every fresh proof, including authentic prefix-derived ARP", () => {
  expect(score([], observations()).recovery).toBe("unresolved");
  expect(score([change], observations())).toMatchObject({ score: 80, recovery: "recovered-unverified" });
  const complete = observations([change], verification, observations());
  for (const o of complete.filter((o) => o.repairIndex))
    expect(
      score([change], complete, { evidence: complete.filter((p) => p.id !== o.id).map((p) => p.id) }).recovery,
    ).toBe("recovered-unverified");
  expect(score([change, { ...change, priority: 120 }], complete).recovery).toBe("recovered-unverified");
  const forged = structuredClone(complete);
  forged.find((o) => o.command === "arp -a")!.output += " forged";
  expect(score([change], forged).score).toBe(80);
  expect(score([change], complete, { evidence: ["forged"] }).score).toBe(50);
  const arpOnly = observations([change], [["PC-A", "arp -a"]], observations([], [["PC-A", "ping", "172.28.10.1"]]));
  expect(arpOnly.at(-1)!.output).toContain("No ARP Entries");
});
it("no-op/default normalization, immutable finalization and limits retain journal semantics", () => {
  const a: Attempt = {
    version: 1,
    id: "local",
    scenario: original.id,
    mode: "practice",
    startedAt: 1,
    history: [],
    hints: [],
    revealed: false,
  };
  expect(recordRepair(original, a, { ...change, priority: 90 }, 2)).toBe(a);
  expect(recordRepair(original, a, { ...change, device: "R2", priority: 100 }, 2)).toBe(a);
  const applied = recordRepair(original, a, change, 2);
  expect(recordRepair(original, applied, change, 3)).toBe(applied);
  expect(recordRepair(original, { ...applied, finishedAt: 3 }, change, 4).repairs).toEqual(applied.repairs);
  expect(() =>
    recordRepair(original, { ...a, repairs: Array(10).fill({ ...change, at: 2 }) }, { ...change, priority: 120 }, 4),
  ).toThrow(/Ten/);
  expect(repairActionSchema.safeParse({ ...change, gateway: "172.28.10.2" }).success).toBe(false);
});
it("keeps packs and version-1 attempts including history, repairs, hints and feedback", () => {
  const data = new Map<string, string>(),
    storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => data.set(k, v),
      removeItem: (k: string) => data.delete(k),
    };
  const attempt: Attempt = {
    version: 1,
    id: "hsrp-journal",
    scenario: original.id,
    mode: "practice",
    startedAt: 1,
    finishedAt: 4,
    history: observations(),
    hints: [original.hints[0]],
    repairs: [{ ...change, at: 2 }],
    diagnosis: answer,
    feedback: score(),
    revealed: false,
  };
  savePack(storage, original);
  saveAttempt(storage, attempt);
  expect(loadPack(storage, original.id)).toEqual(original);
  expect(loadJournal(storage)).toEqual([attempt]);
  expect(data.has("netfault.practice.hsrp-01.v1")).toBe(true);
  expect(original.hints).toHaveLength(4);
  expect(original.lesson!.filter((l) => !l.revealOnRequest)).toHaveLength(7);
  expect(original.lesson!.at(-1)!.revealOnRequest).toBe(true);
  const preview = repairPreview(original);
  expect(preview).toContain("not part of your evidence");
  expect(preview).toContain("172.28.10.3 -> 10.0.23.2");
  expect(preview).toContain("172.28.10.2 -> 10.0.13.2");
});
it("server-owned assessment survives independent module loads, authentic ARP, concurrent requests and finalization", async () => {
  const a = await startAssessment(undefined, original.id);
  expect(a).not.toHaveProperty("repair");
  for (const [device, command, target = ""] of base)
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
  expect(await reloaded.assessmentAction(a.id, "repair", { ...change, priority: 90 })).toEqual(final);
});
it("concurrent repair/ARP retains the actual observed epoch and API validation/cache boundaries", async () => {
  const a = await startAssessment(undefined, original.id);
  await assessmentAction(a.id, "command", { device: "PC-A", command: "ping", target: "172.28.10.1" });
  await Promise.all([
    assessmentAction(a.id, "repair", change),
    assessmentAction(a.id, "command", { device: "PC-A", command: "arp -a", target: "" }),
  ]);
  const resumed = await assessmentAction(a.id, "resume"),
    o = resumed.history[1];
  expect(o.output).toBe(
    execute(
      trialNetwork(original, resumed.repairs?.slice(0, o.repairIndex ?? 0)),
      o.device,
      o.command,
      "",
      resumed.history.slice(0, 1),
      "",
      o.repairIndex ?? 0,
    ),
  );
  const call = (data: unknown) =>
    POST(
      new Request("http://localhost/api/lab", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      }),
    );
  const res = await call({ action: "command", id: a.id, device: "R3", command: "show ip route", target: "" });
  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toBe("no-store");
  expect((await call({ action: "repair", id: a.id, change: { ...change, preempt: false } })).status).toBe(400);
  expect(
    (await call({ action: "command", id: a.id, device: "SW3", command: "show standby brief", target: "" })).status,
  ).toBe(400);
});
