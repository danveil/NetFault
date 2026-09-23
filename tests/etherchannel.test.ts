import { afterEach, describe, expect, it, vi } from "vitest";
import { etherChannelScenario as original } from "../src/server/etherchannel-scenario";
import { channelState, forwardingLinks } from "../src/lib/etherchannel";
import { connectivity, execute, repaired } from "../src/lib/engine";
import {
  scenarioSchema,
  attemptSchema,
  type Attempt,
  type Diagnosis,
  type Observation,
  type RepairAction,
} from "../src/lib/schema";
import { recordRepair, trialNetwork } from "../src/lib/repair-trial";
import { grade } from "../src/lib/grading";
import { startAssessment, assessmentAction } from "../src/server/sessions";
import { loadJournal, saveAttempt, savePack, loadPack } from "../src/lib/storage";
import { POST } from "../src/app/api/lab/route";

const change: RepairAction = { device: "SW1", group: 1, mode: "active" };
const answer: Diagnosis = {
  cause: "lacp-negotiation",
  devices: ["SW1", "SW2"],
  fix: "lacp-mode",
  reason: "lacp-initiation",
  evidence: [],
  notes: "",
};
const baseline: [string, string, string?][] = [
  ["PC-A", "ipconfig"],
  ["PC-B", "ipconfig"],
  ...["SW1", "SW2"].flatMap((d) =>
    ["show interfaces status", "show lacp internal", "show etherchannel summary"].map((c): [string, string] => [d, c]),
  ),
];
const verification: [string, string, string?][] = [
  ["SW1", "show etherchannel summary"],
  ["SW2", "show interfaces port-channel 1"],
  ["PC-A", "ping", "172.22.40.20"],
  ["PC-B", "ping", "172.22.40.10"],
];
function observations(repairs: RepairAction[] = [], commands = baseline): Observation[] {
  const s = trialNetwork(original, repairs);
  return commands.map(([device, command, target = ""], index) => ({
    id: `${repairs.length}:${index}`,
    device,
    command,
    target,
    at: index,
    scenario: original.id,
    ...(repairs.length ? { repairIndex: repairs.length } : {}),
    output: execute(s, device, command, target),
  }));
}
afterEach(() => vi.useRealTimers());
describe("bounded reusable LACP derivation", () => {
  it.each([
    ["passive", "passive", false],
    ["active", "passive", true],
    ["passive", "active", true],
    ["active", "active", true],
  ] as const)("%s / %s forms %s", (a, b, up) => {
    const s = structuredClone(original);
    s.devices[1].portChannels![0].mode = a;
    s.devices[2].portChannels![0].mode = b;
    expect(scenarioSchema.safeParse(s).success).toBe(true);
    for (const id of ["SW1", "SW2"]) {
      const state = channelState(s, id)!;
      expect(state.up).toBe(up);
      expect(state.members.every((m) => m.physical)).toBe(true);
      expect(state.activeMembers).toBe(up ? 2 : 0);
      expect(execute(s, id, "show etherchannel summary")).toContain(up ? "Po1(SU)" : "Po1(SD)");
    }
    expect(connectivity(s, "PC-A", "172.22.40.20").ok).toBe(up);
    expect(connectivity(s, "PC-B", "172.22.40.10").ok).toBe(up);
    expect(forwardingLinks(s)).toHaveLength(up ? 3 : 2);
    expect(forwardingLinks(s).some((l) => l.id.startsWith("ec-member"))).toBe(false);
  });
  it("does not depend on scenario/device names or matching local group IDs", () => {
    const s = repaired(original);
    s.devices[1].id = "Leaf";
    s.devices[2].id = "Spine";
    s.devices[1].portChannels![0].id = 7;
    s.devices[2].portChannels![0].id = 9;
    for (const l of s.links)
      for (const e of [l.a, l.b]) {
        if (e.device === "SW1") e.device = "Leaf";
        if (e.device === "SW2") e.device = "Spine";
      }
    expect(channelState(s, "Leaf")!.up).toBe(true);
    expect(connectivity(s, "PC-A", "172.22.40.20").ok).toBe(true);
  });
  it.each(["cable", "administrative", "speed", "vlan"])(
    "one unavailable/ineligible %s member preserves the other, never a second independent path",
    (kind) => {
      const s = repaired(original);
      if (kind === "cable") s.links[1].up = false;
      if (kind === "administrative") s.devices[1].ports![0].up = false;
      if (kind === "speed") for (const d of s.devices.filter((d) => d.kind === "switch")) d.ports![0].speed = 100;
      if (kind === "vlan") s.devices[1].ports![0].vlan = 41;
      expect(channelState(s, "SW1")!.activeMembers).toBe(1);
      expect(channelState(s, "SW2")!.activeMembers).toBe(1);
      expect(connectivity(s, "PC-A", "172.22.40.20").ok).toBe(true);
      s.links[2].up = false;
      expect(channelState(s, "SW1")!.up).toBe(false);
      expect(connectivity(s, "PC-A", "172.22.40.20").ok).toBe(false);
    },
  );
  it("logical shutdown or inactive VLAN blocks forwarding despite live carriers", () => {
    for (const kind of ["channel", "vlan"] as const) {
      const s = repaired(original);
      if (kind === "channel") s.devices[2].portChannels![0].up = false;
      else s.devices[2].vlans![0].active = false;
      expect(channelState(s, "SW1")!.members.every((m) => m.physical)).toBe(true);
      expect(connectivity(s, "PC-A", "172.22.40.20").ok).toBe(false);
    }
  });
  it("initial diagnostics agree on addresses, carrier, local modes, logical state and reachability", () => {
    expect(execute(original, "PC-A", "ipconfig")).toContain("172.22.40.10");
    expect(execute(original, "PC-B", "ipconfig")).toContain("172.22.40.20");
    expect(execute(original, "PC-A", "route print")).not.toContain("0.0.0.0");
    for (const id of ["SW1", "SW2"]) {
      expect(execute(original, id, "show interfaces status")).toContain("physical carrier up");
      expect(execute(original, id, "show interfaces status")).toContain("suspended");
      expect(execute(original, id, "show lacp internal")).toContain("passive");
      expect(execute(original, id, "show running-config")).toContain("port-channel standalone-disable");
      expect(execute(original, id, "show interfaces port-channel 1")).toContain("down, line protocol is down");
      expect(execute(repaired(original), id, "show etherchannel summary")).toContain("Bundled members: 2/2");
    }
    expect(execute(original, "PC-A", "ping", "172.22.40.20")).toContain("0 percent");
    expect(execute(repaired(original), "PC-A", "tracert", "172.22.40.20")).toContain("1  172.22.40.20");
    expect(execute(original, "SW1", "show spanning-tree")).toMatch(/^% Unsupported/);
  });
  it.each([
    "fallback",
    "duplicate-member",
    "third-switch",
    "alternate-link",
    "old-schema",
    "gateway",
    "remote-subnet",
    "empty-evidence",
    "remote-vlan",
    "unsupported-channel-field",
  ])("rejects unsupported %s model", (kind) => {
    const s = JSON.parse(JSON.stringify(original));
    if (kind === "fallback") s.devices[1].portChannels[0].standaloneDisable = false;
    if (kind === "duplicate-member") s.devices[1].portChannels[0].members[1] = "Gi1/0/1";
    if (kind === "third-switch") s.devices.push({ ...s.devices[1], id: "SW3" });
    if (kind === "alternate-link") s.links.push({ ...s.links[1], id: "extra" });
    if (kind === "old-schema") s.schemaVersion = 6;
    if (kind === "gateway") s.devices[0].gateway = "172.22.40.1";
    if (kind === "remote-subnet") s.devices[3].interfaces[0].ip = "172.22.41.20";
    if (kind === "empty-evidence") s.evidenceRules[0].requirements = [];
    if (kind === "remote-vlan") {
      s.devices[2].portChannels[0].vlan = 41;
      s.devices[2].vlans[0].id = 41;
      for (const p of s.devices[2].ports) p.vlan = 41;
    }
    if (kind === "unsupported-channel-field") s.devices[1].portChannels[0].protocol = "pagp";
    expect(scenarioSchema.safeParse(s).success).toBe(false);
  });
});
describe("applied-state grading and durable attempt contracts", () => {
  it("requires an actual minimal repair and selected fresh verification on both ends", () => {
    for (const device of ["SW1", "SW2"]) {
      const repairs = [{ ...change, device }],
        history = [...observations(), ...observations(repairs, verification)];
      const a = { ...answer, evidence: history.map((o) => o.id) };
      expect(grade(original, a, history, false, repairs).score).toBe(100);
      expect(grade(original, a, history, false, []).score).toBeLessThan(100);
      expect(grade(original, { ...a, evidence: observations().map((o) => o.id) }, history, false, repairs).score).toBe(
        80,
      );
      expect(grade(original, { ...a, evidence: ["forged"] }, history, false, repairs).score).toBe(50);
      const later = [...repairs, { device, group: 1, mode: "passive" as const }];
      expect(grade(original, a, history, false, later).score).toBeLessThan(100);
      const changedAgain = [...later, ...repairs];
      expect(grade(original, a, history, false, changedAgain).parts.at(-1)!.earned).toBe(0);
    }
  });
  it("rejects unnecessary two-sided change for minimal-repair credit even when connected", () => {
    const repairs = [change, { ...change, device: "SW2" }];
    const history = [...observations(), ...observations(repairs, verification)];
    expect(grade(original, { ...answer, evidence: history.map((o) => o.id) }, history, false, repairs).score).toBe(65);
  });
  it("retains journal changes and pack keys; duplicate changes do not invalidate verification", () => {
    const attempt: Attempt = {
      version: 1,
      id: "practice-ec",
      scenario: original.id,
      mode: "practice",
      startedAt: 1,
      history: [],
      hints: [],
      revealed: false,
    };
    expect(recordRepair(original, attempt, { ...change, mode: "passive" }, 2)).toBe(attempt);
    const changed = recordRepair(original, attempt, change, 3);
    expect(recordRepair(original, changed, change, 4)).toBe(changed);
    expect(original.devices[1].portChannels![0].mode).toBe("passive");
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
    saveAttempt(storage, changed);
    savePack(storage, original);
    expect(loadJournal(storage)[0]).toEqual(changed);
    expect(loadPack(storage, original.id)).toEqual(original);
    expect(attemptSchema.parse(changed)).toEqual(changed);
    expect(() => trialNetwork(original, [{ ...change, group: 2 }])).toThrow();
    let current = attempt;
    for (let n = 0; n < 10; n++)
      current = recordRepair(original, current, { ...change, mode: n % 2 ? "passive" : "active" }, n + 2);
    expect(() => recordRepair(original, current, change, 99)).toThrow("Ten");
  });
  it("server persists changes across module reload, deduplicates concurrent repairs and finalizes immutably", async () => {
    const a = await startAssessment(undefined, original.id);
    expect(a).not.toHaveProperty("repairs");
    expect(a).not.toHaveProperty("feedback");
    for (const [device, command] of baseline) await assessmentAction(a.id, "command", { device, command, target: "" });
    await Promise.all([assessmentAction(a.id, "repair", change), assessmentAction(a.id, "repair", change)]);
    vi.resetModules();
    const reloaded = await import("../src/server/sessions");
    expect((await reloaded.assessmentAction(a.id, "resume")).repairs).toHaveLength(1);
    for (const [device, command, target = ""] of verification)
      await reloaded.assessmentAction(a.id, "command", { device, command, target });
    const live = await reloaded.assessmentAction(a.id, "resume");
    expect(live.history.slice(-4).every((o) => o.repairIndex === 1)).toBe(true);
    const final = await reloaded.assessmentAction(a.id, "submit", {
      ...answer,
      evidence: live.history.map((o) => o.id),
    });
    expect(final.feedback?.score).toBe(100);
    expect(await reloaded.assessmentAction(a.id, "repair", { ...change, mode: "passive" })).toEqual(final);
  });
  it("expiry precedes repair; old scenarios reject configuration trials", async () => {
    const old = await startAssessment();
    await expect(assessmentAction(old.id, "repair", change)).rejects.toThrow("not supported");
    const a = await startAssessment(undefined, original.id);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(a.expiresAt! + 1);
    const final = await assessmentAction(a.id, "repair", change);
    expect(final.feedback?.timedOut).toBe(true);
    expect(final.feedback?.score).toBe(0);
    expect(final.repairs).toBeUndefined();
  });
  it("API validates repair actions, ignores forged history and applies no-store", async () => {
    const send = (body: unknown) =>
      POST(
        new Request("http://localhost:3100/api/lab", {
          method: "POST",
          headers: { "content-type": "application/json", host: "localhost:3100", origin: "http://localhost:3100" },
          body: JSON.stringify(body),
        }),
      );
    const start = await send({ action: "start", scenario: original.id }),
      { attempt } = await start.json();
    expect(start.headers.get("Netlify-CDN-Cache-Control")).toBe("no-store");
    expect((await send({ action: "repair", id: attempt.id, change: { ...change, mode: "on" } })).status).toBe(400);
    expect((await send({ action: "repair", id: attempt.id, change: { ...change, device: "PC-A" } })).status).toBe(400);
    const forged = await send({
      action: "submit",
      id: attempt.id,
      diagnosis: { ...answer, evidence: ["invented"] },
      repairs: [change],
      history: observations([change], verification),
    });
    expect((await forged.json()).attempt.feedback.score).toBe(35);
  });
});
