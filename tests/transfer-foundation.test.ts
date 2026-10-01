import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { transferNetwork, correction, diagnosis } from "./fixtures/transfer-network";
import { connectivity, device, execute, neighbors, routes, repaired } from "../src/lib/engine";
import { recordRepair, trialNetwork } from "../src/lib/repair-trial";
import { grade } from "../src/lib/grading";
import { evidenceIsCurrent, verifiedEvidence } from "../src/lib/evidence";
import { capabilityCommands, validateDeviceCommand } from "../src/lib/capabilities";
import { explicitGraph, neutralPublicSchema, publicScenario } from "../src/lib/neutral-scenario";
import { scenarioSchema, type Attempt, type Scenario } from "../src/lib/schema";
import { loadJournal, loadPack, saveAttempt, savePack } from "../src/lib/storage";
import { vlanScenario } from "../src/server/vlan-scenario";
import { labs } from "../src/lib/catalog";
import { getScenario } from "../src/server/scenarios";

export function attempt(s: Scenario): Attempt {
  return {
    version: 1,
    id: randomUUID(),
    scenario: s.id,
    mode: "practice",
    startedAt: 1,
    history: [],
    hints: [],
    revealed: false,
  };
}
export function observe(s: Scenario, a: Attempt, device: string, command: string, target = "", source?: string) {
  const state = trialNetwork(s, a.repairs),
    repairIndex = a.repairs?.length ?? 0;
  a.history.push({
    id: randomUUID(),
    scenario: s.id,
    device,
    command: validateDeviceCommand(state, device, command),
    target,
    ...(source ? { source } : {}),
    ...(repairIndex ? { repairIndex } : {}),
    output: execute(state, device, command, target, [], source, repairIndex),
    at: 2 + a.history.length,
  });
}
export function collect(s: Scenario, a: Attempt, phase: "original" | "current") {
  for (const c of s.foundation!.verification[phase]) observe(s, a, c.device, c.commands[0], c.target, c.source);
  if (phase === "current")
    for (const f of s.foundation!.verification.flows) observe(s, a, f.device, "ping", f.target, f.source);
}
function complete(family: "vlan" | "acl") {
  const s = transferNetwork(family);
  let a = attempt(s);
  collect(s, a, "original");
  a = recordRepair(s, a, correction(family), 10);
  collect(s, a, "current");
  return { s, a, answer: diagnosis(s, a) };
}

describe.each(["vlan", "acl"] as const)("neutral %s foundation", (family) => {
  it("validates a branched renamed topology with derived OSPF and one blocking fault", () => {
    const s = transferNetwork(family);
    expect(scenarioSchema.safeParse(s).success).toBe(true);
    expect(neighbors(s, "West").map((n) => n.device)).toEqual(["East"]);
    expect(routes(s, "West")).toContainEqual(expect.objectContaining({ kind: "O", prefix: "172.24.20.0/24" }));
    expect(connectivity(s, "Desk", "172.24.20.10").ok).toBe(false);
    expect(connectivity(s, "Local", "172.24.10.1").ok).toBe(true);
    expect(connectivity(s, "Desk", "172.24.10.11").ok).toBe(family === "acl");
    expect(labs).toHaveLength(15);
    expect(() => getScenario(s.id)).toThrow();
  });
  it("replays a minimal real change, preserves history and grades fresh multi-layer recovery", () => {
    const { s, a, answer } = complete(family);
    expect(a.repairs).toHaveLength(1);
    expect(a.history.slice(0, 3).every((o) => !evidenceIsCurrent(o, a.repairs))).toBe(true);
    expect(grade(s, answer, a.history, false, a.repairs)).toMatchObject({ score: 100, recovery: "verified" });
    expect(connectivity(s, "Desk", "172.24.20.10").ok).toBe(false);
    const actual = trialNetwork(s, a.repairs);
    expect(connectivity(actual, "Archive", "172.24.10.10").ok).toBe(true);
    expect(connectivity(actual, "West", "172.24.20.10", "10.49.0.1").outward.policyDrop).toBeDefined();
    expect(neighbors(actual, "West")).toEqual(neighbors(s, "West"));
  });
  it("does not accept a selected answer or canonical preview as applied recovery", () => {
    const s = transferNetwork(family),
      a = attempt(s);
    collect(s, a, "original");
    expect(connectivity(repaired(s), "Desk", "172.24.20.10").ok).toBe(true);
    expect(grade(s, diagnosis(s, a), a.history)).toMatchObject({ recovery: "unresolved" });
  });
  it("requires new evidence even when an output string is unchanged after repair", () => {
    const { s, a, answer } = complete(family);
    answer.evidence = a.history.filter((o) => !o.repairIndex).map((o) => o.id);
    expect(grade(s, answer, a.history, false, a.repairs)).toMatchObject({
      score: 80,
      recovery: "recovered-unverified",
    });
  });
  it.each(["configuration", "local", "routing", "policy"])("requires the fresh %s layer", (layer) => {
    const { s, a, answer } = complete(family);
    const checks = s.foundation!.verification.current.filter((c) => c.layer === layer);
    answer.evidence = a.history
      .filter((o) => !o.repairIndex || !checks.some((c) => c.device === o.device && c.commands.includes(o.command)))
      .map((o) => o.id);
    expect(grade(s, answer, a.history, false, a.repairs).recovery).toBe("recovered-unverified");
  });
  it.each(["forged", "foreign", "duplicate", "future"])("rejects %s evidence", (mutation) => {
    const { s, a, answer } = complete(family);
    const o = a.history.find((o) => o.repairIndex && o.command === "show vlan brief")!;
    if (mutation === "forged") o.output += " forged";
    if (mutation === "foreign") o.scenario = "ospf-01";
    if (mutation === "duplicate") a.history.push({ ...o });
    if (mutation === "future") o.repairIndex = 2;
    expect(verifiedEvidence(s, a.history, answer.evidence, a.repairs).some((e) => e.id === o.id)).toBe(false);
    expect(grade(s, answer, a.history, false, a.repairs).recovery).toBe("recovered-unverified");
  });
  it("rejects wrong source and missing reciprocal delivery evidence", () => {
    const { s, a, answer } = complete(family);
    answer.evidence = a.history.filter((o) => o.device !== "Archive" && !o.source).map((o) => o.id);
    expect(grade(s, answer, a.history, false, a.repairs).recovery).toBe("recovered-unverified");
  });
  it("persists an offline Practice pack, resumed repair history, final feedback and journal", () => {
    const { s, a, answer } = complete(family),
      data = new Map<string, string>();
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
    saveAttempt(storage, a);
    const pack = loadPack(storage, s.id)!,
      resumed = loadJournal(storage)[0];
    expect(resumed).toEqual(a);
    resumed.diagnosis = answer;
    resumed.finishedAt = 100;
    resumed.feedback = grade(pack, answer, resumed.history, false, resumed.repairs);
    saveAttempt(storage, resumed);
    expect(loadJournal(storage)[0].feedback).toMatchObject({ score: 100, recovery: "verified" });
  });
});

describe("foundation contract boundaries", () => {
  it("accepts an alternative valid ACL order through behavior rather than canonical sequence equality", () => {
    const s = transferNetwork("acl");
    let a = attempt(s);
    collect(s, a, "original");
    a = recordRepair(
      s,
      a,
      { kind: "acl-sequence", device: "East", acl: "WORKAREA", sequence: 10, newSequence: 30 },
      10,
    );
    collect(s, a, "current");
    expect(grade(s, diagnosis(s, a), a.history, false, a.repairs)).toMatchObject({ score: 100, recovery: "verified" });
  });
  it("cannot call a failed local control healthy even with authentic fresh output", () => {
    const s = transferNetwork();
    device(s, "Local").interfaces[0].up = false;
    let a = attempt(s);
    collect(s, a, "original");
    a = recordRepair(s, a, correction("vlan"), 10);
    collect(s, a, "current");
    expect(connectivity(trialNetwork(s, a.repairs), "Desk", "172.24.20.10").ok).toBe(true);
    expect(grade(s, diagnosis(s, a), a.history, false, a.repairs).recovery).toBe("recovered-unverified");
  });
  it("rejects unnecessary healthy-policy edits even if permitted and excluded flows still behave correctly", () => {
    const { s, a } = complete("vlan");
    const changed = recordRepair(
      s,
      a,
      { kind: "acl-sequence", device: "East", acl: "WORKAREA", sequence: 5, newSequence: 4 },
      11,
    );
    collect(s, changed, "current");
    expect(connectivity(trialNetwork(s, changed.repairs), "Desk", "172.24.20.10").ok).toBe(true);
    expect(grade(s, diagnosis(s, changed), changed.history, false, changed.repairs).recovery).toBe("unresolved");
  });
  it("isolates LAB003 ARP observations by applied configuration version", () => {
    let a = attempt(vlanScenario);
    a = recordRepair(
      vlanScenario,
      a,
      { kind: "access-vlan", device: "SW1", interface: "FastEthernet0/1", vlan: 10 },
      10,
    );
    observe(vlanScenario, a, "PC-A", "ping", "192.168.10.1");
    expect(execute(trialNetwork(vlanScenario, a.repairs), "PC-A", "arp -a", "", a.history, "", 1)).not.toContain(
      "No ARP Entries Found",
    );
    a = recordRepair(
      vlanScenario,
      a,
      { kind: "access-vlan", device: "SW1", interface: "FastEthernet0/1", vlan: 20 },
      11,
    );
    expect(execute(trialNetwork(vlanScenario, a.repairs), "PC-A", "arp -a", "", a.history, "", 2)).toContain(
      "No ARP Entries Found",
    );
  });
  it("keeps public metadata identical across different faults except opaque identity", () => {
    const a = publicScenario(transferNetwork("vlan")),
      b = publicScenario(transferNetwork("acl"));
    expect({ ...a, id: "opaque" }).toEqual({ ...b, id: "opaque" });
    expect(JSON.stringify(a)).not.toMatch(
      /TEST_PRIVATE|faultFamily|repairType|answerCategory|verification|acceptedFixes|observedVlan/,
    );
    expect(neutralPublicSchema.safeParse({ ...a, faultFamily: "vlan" }).success).toBe(false);
  });
  it("supports explicit endpoints and mobile positions without fixed device names or array order", () => {
    const p = publicScenario(transferNetwork());
    p.devices.reverse();
    for (const mobile of [false, true]) {
      const g = explicitGraph(p, mobile);
      expect(g.nodes.find((n) => n.id === "Access")?.position).toEqual(mobile ? { x: 0, y: 200 } : { x: 240, y: 0 });
      expect(g.edges.filter((e) => e.source === "Access" || e.target === "Access")).toHaveLength(3);
      expect(JSON.stringify(g)).not.toMatch(/red|fault|repair|correct/);
    }
  });
  it.each(["endpoint", "overlap", "duplicate", "logical", "capability", "commands", "transit-policy"])(
    "rejects invalid %s contracts",
    (change) => {
      const s = transferNetwork(),
        p = s.foundation!.public;
      if (change === "endpoint") p.links[0].a.device = "Absent";
      if (change === "overlap") p.devices[1].mobile = { ...p.devices[0].mobile };
      if (change === "duplicate") p.links.push(structuredClone(p.links[0]));
      if (change === "logical") p.links[0].kind = "logical";
      if (change === "capability") p.devices[0].capabilities.push("standard-policy");
      if (change === "commands") device(s, "Desk").commands.push("tracert");
      if (change === "transit-policy") {
        const d = device(s, "East");
        d.interfaces[0].accessGroup = d.interfaces[1].accessGroup;
        delete d.interfaces[1].accessGroup;
      }
      expect(scenarioSchema.safeParse(s).success).toBe(false);
    },
  );
  it("checks device ownership before commands and capability scope", () => {
    const s = transferNetwork();
    expect(validateDeviceCommand(s, "West", " SHOW   IP ROUTE ")).toBe("show ip route");
    expect(() => validateDeviceCommand(s, "R1", "show ip route")).toThrow("not part");
    expect(() => validateDeviceCommand(s, "Desk", "show ip route")).toThrow("Unsupported");
    expect(() => capabilityCommands("pc", ["neighbor-state"])).toThrow();
    s.foundation!.public.devices.find((d) => d.id === "West")!.capabilities = ["interface-state"];
    expect(() => validateDeviceCommand(s, "West", "show ip route")).toThrow("not enabled");
  });
  it.each([{ device: "West" }, { interface: "Missing" }, { vlan: 4094 }, { device: "Absent" }])(
    "rejects invalid VLAN targets %j",
    (edit) => {
      const s = transferNetwork();
      expect(() =>
        recordRepair(
          s,
          attempt(s),
          { kind: "access-vlan", device: "Access", interface: "Fa0/1", vlan: 31, ...edit },
          10,
        ),
      ).toThrow();
    },
  );
  it("keeps no-ops at the same version and rejects recovery using an older successful version", () => {
    const { s, a, answer } = complete("vlan");
    expect(recordRepair(s, a, correction("vlan"), 11)).toEqual(a);
    const reverted = recordRepair(s, a, { kind: "access-vlan", device: "Access", interface: "Fa0/1", vlan: 32 }, 12);
    expect(reverted.repairs).toHaveLength(2);
    expect(grade(s, answer, reverted.history, false, reverted.repairs).recovery).toBe("unresolved");
    const restored = recordRepair(s, reverted, correction("vlan"), 13);
    expect(grade(s, answer, restored.history, false, restored.repairs).recovery).toBe("recovered-unverified");
  });
  it("replays LAB003 access membership without revising its legacy diagnosis contract", () => {
    const before = structuredClone(vlanScenario),
      a = recordRepair(
        vlanScenario,
        attempt(vlanScenario),
        { kind: "access-vlan", device: "SW1", interface: "FastEthernet0/1", vlan: 10 },
        10,
      );
    expect(trialNetwork(vlanScenario, a.repairs).devices).toEqual(repaired(vlanScenario).devices);
    expect(vlanScenario).toEqual(before);
    expect(vlanScenario.revision).toBe(1);
  });
});
