import { describe, expect, it } from "vitest";
import { evaluateAcl } from "../src/lib/acl";
import { aclScenario as original } from "../src/server/acl-scenario";
import { connectivity, device, execute, repaired, routes } from "../src/lib/engine";
import { grade } from "../src/lib/grading";
import { recordRepair, trialNetwork } from "../src/lib/repair-trial";
import {
  scenarioSchema,
  standardAclSchema,
  repairActionSchema,
  attemptSchema,
  type Attempt,
  type Diagnosis,
  type Observation,
  type RepairAction,
  type StandardAcl,
} from "../src/lib/schema";
import { saveAttempt, loadJournal, savePack, loadPack } from "../src/lib/storage";
import { startAssessment, assessmentAction } from "../src/server/sessions";
import { POST } from "../src/app/api/lab/route";

const independent: StandardAcl = {
  name: "TEST",
  entries: [
    { id: "a", sequence: 10, action: "deny", source: "any" },
    { id: "b", sequence: 20, action: "permit", source: { network: "172.18.8.0", prefix: 24 } },
  ],
};
const change: RepairAction = { kind: "acl-sequence", device: "R2", acl: "WORKAREA", sequence: 20, newSequence: 5 };
const answer: Diagnosis = {
  cause: "acl-order",
  devices: ["R2"],
  interface: "Gi0/1",
  aclName: "WORKAREA",
  observedSequence: 10,
  fix: "acl-sequence",
  reason: "first-match-policy",
  evidence: [],
  notes: "A route is not permission.",
};
type Command = [string, string, string?, string?];
const baseline: Command[] = [
  ["PC-A", "ipconfig"],
  ["PC-A", "ping", "172.24.20.10"],
  ["R1", "show ip route"],
  ["R2", "show ip route"],
  ["R2", "show access-lists"],
  ["R2", "show running-config"],
];
const verify: Command[] = [
  ["R2", "show access-lists"],
  ["R2", "show running-config"],
  ["PC-A", "ping", "172.24.20.10"],
  ["PC-B", "ping", "172.24.10.10"],
  ["R1", "ping", "172.24.20.10", "10.49.0.1"],
];
function observations(repairs: RepairAction[] = [], commands = baseline): Observation[] {
  const s = trialNetwork(original, repairs);
  return commands.map(([device, command, target = "", source], n) => ({
    id: `${repairs.length}:${n}`,
    scenario: original.id,
    device,
    command,
    target,
    ...(source ? { source } : {}),
    at: 1,
    ...(repairs.length ? { repairIndex: repairs.length } : {}),
    output: execute(s, device, command, target, [], source),
  }));
}
function score(
  repairs: RepairAction[] = [change],
  history = [...observations(), ...observations(repairs, verify)],
  patch: Partial<Diagnosis> = {},
) {
  return grade(original, { ...answer, evidence: history.map((o) => o.id), ...patch }, history, false, repairs);
}
function newAttempt(): Attempt {
  return {
    version: 1,
    id: "acl-practice",
    scenario: "acl-01",
    mode: "practice",
    startedAt: 1,
    history: [],
    hints: [],
    revealed: false,
  };
}

describe("independent bounded standard ACL semantics", () => {
  it("stops at the earlier deny and does not mutate configured order", () => {
    const before = JSON.stringify(independent);
    expect(evaluateAcl(independent, "172.18.8.25")).toEqual({
      permitted: false,
      entryId: "a",
      sequence: 10,
      implicit: false,
    });
    expect(JSON.stringify(independent)).toBe(before);
  });
  it("reordered permit wins for its source while other sources stay denied", () => {
    const acl = { ...independent, entries: [{ ...independent.entries[1], sequence: 5 }, independent.entries[0]] };
    expect(evaluateAcl(acl, "172.18.8.25").permitted).toBe(true);
    expect(evaluateAcl(acl, "10.8.0.1").permitted).toBe(false);
    expect(evaluateAcl(acl, "172.18.9.25").permitted).toBe(false);
  });
  it("uses implicit deny only when no rule matches", () => {
    const acl = { ...independent, entries: [independent.entries[1]] };
    expect(evaluateAcl(acl, "10.8.0.1")).toMatchObject({ permitted: false, implicit: true });
    for (const source of ["172.18.8.0", "172.18.8.255"]) expect(evaluateAcl(acl, source).permitted).toBe(true);
  });
  it.each([
    { ...independent, entries: [...independent.entries].reverse() },
    { ...independent, entries: [] },
    { ...independent, entries: [independent.entries[0], independent.entries[0]] },
    { ...independent, entries: [{ ...independent.entries[1], source: { network: "172.18.8.1", prefix: 24 } }] },
    { ...independent, entries: [{ ...independent.entries[1], port: 443 }] },
    { ...independent, entries: [{ ...independent.entries[1], source: { network: "172.18.8.0", prefix: 32 } }] },
  ])("rejects unsupported/ambiguous authored ACL shape %# instead of normalizing it", (acl) =>
    expect(standardAclSchema.safeParse(acl).success).toBe(false),
  );
});

describe("source-aware forwarding and coherent commands", () => {
  it("loads the one new scenario with valid addressing and independent healthy state", () => {
    expect(scenarioSchema.parse(original)).toEqual(original);
    const healthy = structuredClone(original);
    device(healthy, "R2").acls![0].entries = [
      { id: "entry-b", sequence: 5, action: "permit", source: { network: "172.24.10.0", prefix: 24 } },
      { id: "entry-a", sequence: 10, action: "deny", source: "any" },
    ];
    expect(repaired(original)).toEqual(healthy);
    expect(scenarioSchema.safeParse(healthy).success).toBe(true);
    expect(routes(healthy, "R1")).toEqual(routes(original, "R1"));
    expect(routes(healthy, "R2")).toEqual(routes(original, "R2"));
  });
  it.each([
    ["PC-A", "172.24.10.1", "", true, true],
    ["PC-B", "172.24.20.1", "", true, true],
    ["R1", "10.49.0.2", "", true, true],
    ["PC-A", "172.24.20.10", "", false, true],
    ["PC-B", "172.24.10.10", "", false, true],
    ["R1", "172.24.20.10", "172.24.10.1", false, true],
    ["R1", "172.24.20.10", "Gi0/1", false, false],
    ["R1", "172.24.20.10", "", false, false],
    ["PC-A", "172.24.20.1", "", true, true],
    ["R2", "172.24.20.10", "", true, true],
  ] as const)("oracle %s to %s source '%s'", (d, t, source, before, after) => {
    expect(connectivity(original, d, t, source).ok).toBe(before);
    expect(connectivity(repaired(original), d, t, source).ok).toBe(after);
  });
  it("separates request and reply policy evaluation, and creates no reply for an undelivered request", () => {
    const a = connectivity(original, "PC-A", "172.24.20.10");
    expect(a.outward.policyDrop).toMatchObject({ device: "R2", interface: "Gi0/1", sequence: 10 });
    expect(a.returning).toBeUndefined();
    const b = connectivity(original, "PC-B", "172.24.10.10");
    expect(b.outward.ok).toBe(true);
    expect(b.returning?.policyDrop?.sequence).toBe(10);
  });
  it("unattached policy has no effect and attachment to another interface affects only that exit", () => {
    const s = structuredClone(original),
      r = device(s, "R2");
    const binding = r.interfaces[1].accessGroup;
    delete r.interfaces[1].accessGroup;
    expect(connectivity(s, "PC-A", "172.24.20.10").ok).toBe(true);
    r.interfaces[0].accessGroup = binding;
    expect(connectivity(s, "PC-A", "172.24.20.10").outward.ok).toBe(true);
    expect(connectivity(s, "PC-A", "172.24.20.10").returning?.policyDrop?.interface).toBe("Gi0/0");
  });
  it("rejects inbound or dangling attachment rather than treating it as outbound", () => {
    for (const binding of [
      { name: "WORKAREA", direction: "in" },
      { name: "MISSING", direction: "out" },
    ]) {
      const s = structuredClone(original);
      Object.assign(device(s, "R2").interfaces[1], { accessGroup: binding });
      expect(scenarioSchema.safeParse(s).success).toBe(false);
    }
  });
  it("a permit does not supply a missing route, and ACL-free forwarding still uses routes", () => {
    const s = repaired(original);
    device(s, "R1").staticRoutes = [];
    expect(connectivity(s, "PC-A", "172.24.20.10").outward.reason).toContain("no route");
    delete device(s, "R2").acls;
    delete device(s, "R2").interfaces[1].accessGroup;
    expect(connectivity(s, "PC-A", "172.24.20.10").ok).toBe(false);
  });
  it("renders observed order and attachment from the same state without exposing a verdict in ping", () => {
    expect(execute(original, "R2", "show access-lists")).toMatch(/10 deny any[\s\S]*20 permit 172.24.10.0/);
    expect(execute(repaired(original), "R2", "show access-lists")).toMatch(/5 permit[\s\S]*10 deny/);
    expect(execute(original, "R2", "show running-config")).toContain("ip access-group WORKAREA out");
    expect(execute(original, "R1", "show access-lists")).toContain("No IP access lists");
    expect(execute(original, "PC-A", "ping", "172.24.20.10")).not.toMatch(/WORKAREA|sequence 10|policyDrop/);
    expect(execute(original, "PC-A", "tracert", "172.24.20.10")).toMatch(/^% Unsupported/);
    expect(execute(original, "R1", "ping", "172.24.20.10", [], "203.0.113.1")).toMatch(/^% Source/);
  });
});

describe("trials, grading and local persistence", () => {
  it("accepts equivalent valid orders, not a memorized sequence, and saves immutable history", () => {
    for (const repair of [change, { ...change, sequence: 10, newSequence: 30 }])
      expect(score([repair])).toMatchObject({ score: 100, recovery: "verified" });
    const changed = recordRepair(original, newAttempt(), change, 2);
    expect(recordRepair(original, changed, { ...change, sequence: 5 }, 3)).toBe(changed);
    expect(original.devices[2].acls![0].entries[0].sequence).toBe(10);
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
    savePack(storage, original);
    saveAttempt(storage, changed);
    expect(loadJournal(storage)[0]).toEqual(changed);
    expect(loadPack(storage, "acl-01")).toEqual(original);
    expect(attemptSchema.parse(changed)).toEqual(changed);
  });
  it("ineffective legal change, no trial and stale verification never count as verified", () => {
    expect(score([{ ...change, newSequence: 30 }]).recovery).toBe("unresolved");
    expect(score([]).recovery).toBe("unresolved");
    const old = [...observations(), ...observations([change], verify)];
    const changes = [change, { ...change, sequence: 5, newSequence: 20 }, change];
    expect(score(changes, old).recovery).toBe("recovered-unverified");
  });
  it.each([0, 1, 2, 3, 4])("requires fresh verification item %i including the negative control", (n) => {
    const history = [...observations(), ...observations([change], verify).filter((_, i) => n !== i)];
    expect(score([change], history)).toMatchObject({ score: 80, recovery: "recovered-unverified" });
  });
  it("requires a deliberately explicit excluded source, accepting its interface name", () => {
    const commands = structuredClone(verify);
    commands[4][3] = "Gi0/1";
    expect(score([change], [...observations(), ...observations([change], commands)]).score).toBe(100);
    commands[4][3] = "";
    expect(score([change], [...observations(), ...observations([change], commands)]).score).toBe(80);
  });
  it("does not accept wrong or post-change baseline evidence", () => {
    const base = observations();
    base[1] = { ...base[1], target: "172.24.10.1", output: execute(original, "PC-A", "ping", "172.24.10.1") };
    expect(score([change], [...base, ...observations([change], verify)]).score).toBe(90);
    expect(
      score([change], [...observations([change], baseline), ...observations([change], verify)]).parts.find(
        (p) => p.name === "Supporting evidence",
      )?.earned,
    ).toBe(0);
  });
  it.each([
    { cause: "wrong-gateway" },
    { devices: ["R1"] },
    { observedSequence: 20 },
    { aclName: "OTHER" },
    { reason: "same-address" },
  ] as Partial<Diagnosis>[])("rejects incorrect structured diagnosis component %#", (patch) =>
    expect(score(undefined, undefined, patch).score).toBeLessThan(100),
  );
  it("rejects unsupported removal, permit-any, unrelated edits and invalid sequences", () => {
    for (const invalid of [
      { ...change, action: "permit", source: "any" },
      { ...change, remove: true },
      { device: "R1", route: "default" },
      { ...change, newSequence: 0 },
    ])
      expect(repairActionSchema.safeParse(invalid).success).toBe(false);
    for (const invalid of [
      { ...change, newSequence: 10 },
      { ...change, device: "R1" },
      { ...change, acl: "OTHER" },
    ])
      expect(() => trialNetwork(original, [invalid])).toThrow();
    expect(() => trialNetwork(original, [{ device: "SW1", group: 1, mode: "active" }])).toThrow();
  });
  it("bounds actual trial count, keeps no-op version and forbids finalized mutation", () => {
    const initial = newAttempt();
    expect(recordRepair(original, initial, { ...change, newSequence: 20 }, 2)).toBe(initial);
    let current = initial;
    for (let n = 0; n < 10; n++)
      current = recordRepair(original, current, n % 2 ? { ...change, sequence: 5, newSequence: 20 } : change, n + 2);
    expect(() => recordRepair(original, current, change, 20)).toThrow("Ten");
    const final = { ...current, finishedAt: 30 };
    expect(recordRepair(original, final, change, 40)).toBe(final);
  });
});

describe("server-owned assessments", () => {
  it("persists across invocations, resumes trials and grades only server-recorded history", async () => {
    const a = await startAssessment(undefined, "acl-01");
    for (const [device, command, target = "", source] of baseline)
      await assessmentAction(a.id, "command", { device, command, target, source });
    await assessmentAction(a.id, "repair", change);
    const resumed = await assessmentAction(a.id, "resume");
    expect(resumed.repairs).toHaveLength(1);
    expect(resumed.feedback).toBeUndefined();
    for (const [device, command, target = "", source] of verify)
      await assessmentAction(a.id, "command", { device, command, target, source });
    const ready = await assessmentAction(a.id, "resume");
    const final = await assessmentAction(a.id, "submit", { ...answer, evidence: ready.history.map((o) => o.id) });
    expect(final.feedback).toMatchObject({ score: 100, recovery: "verified" });
    expect(await assessmentAction(a.id, "repair", { ...change, sequence: 5, newSequence: 20 })).toEqual(final);
  });
  it("serializes concurrent command/change requests with coherent versions", async () => {
    const a = await startAssessment(undefined, "acl-01");
    await Promise.all([
      assessmentAction(a.id, "repair", change),
      assessmentAction(a.id, "command", { device: "R2", command: "show access-lists", target: "" }),
    ]);
    const result = await assessmentAction(a.id, "resume");
    expect(result.repairs).toHaveLength(1);
    const o = result.history[0];
    expect(o.output).toEqual(execute(trialNetwork(original, o.repairIndex ? [change] : []), "R2", "show access-lists"));
  });
  it("rejects insecure repair payloads and keeps API responses uncached", async () => {
    const a = await startAssessment(undefined, "acl-01");
    const response = await POST(
      new Request("http://localhost/api/lab", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "repair", id: a.id, change: { ...change, remove: true } }),
      }),
    );
    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect((await assessmentAction(a.id, "resume")).repairs).toBeUndefined();
  });
});
