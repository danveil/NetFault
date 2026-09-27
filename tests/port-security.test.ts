import { expect, it, vi } from "vitest";
import { portSecurityScenario as original } from "../src/server/port-security-scenario";
import {
  scenarioSchema,
  repairActionSchema,
  type Diagnosis,
  type Observation,
  type RepairAction,
  type Attempt,
} from "../src/lib/schema";
import { connectivity, execute, repaired, routes, forward } from "../src/lib/engine";
import { admitsSource } from "../src/lib/port-security";
import { grade } from "../src/lib/grading";
import { portSecurityRecovered } from "../src/lib/port-security-grading";
import { trialNetwork, recordRepair } from "../src/lib/repair-trial";
import { repairPreview } from "../src/lib/preview";
import { savePack, loadPack, saveAttempt, loadJournal } from "../src/lib/storage";
import { startAssessment, assessmentAction } from "../src/server/sessions";
import { POST } from "../src/app/api/lab/route";
const change = {
  kind: "port-security-mac",
  device: "SW1",
  interface: "FastEthernet0/1",
  mac: "0200.0012.000a",
} as const;
const answer: Diagnosis = {
  cause: "secure-mac",
  devices: ["SW1"],
  interface: change.interface,
  observedSecureMac: "0200.0012.009a",
  reason: "source-admission",
  fix: "secure-mac",
  evidence: [],
  notes: "",
};
type Command = [string, string, string?];
const control: Command[] = [
  ["PC-A", "ipconfig /all"],
  ["SW1", "show port-security address"],
  ["SW1", "show interfaces status"],
  ["SW1", "show vlan brief"],
  ["SW1", "show port-security interface fastethernet0/1"],
  ["R1", "show ip route"],
  ["PC-A", "ping", "172.30.10.1"],
  ["PC-B", "ping", "172.30.20.1"],
];
const verification: Command[] = [
  ...control,
  ["SW1", "show running-config"],
  ["PC-A", "arp -a"],
  ["PC-A", "ping", "172.30.20.10"],
  ["PC-B", "ping", "172.30.10.10"],
];
function observations(repairs: RepairAction[] = [], commands = control, prefix: Observation[] = []) {
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
const attempt = (): Attempt => ({
  version: 1,
  id: "test",
  scenario: original.id,
  mode: "practice",
  startedAt: 1,
  history: observations(),
  hints: [],
  revealed: false,
});
it.each([{ mode: "trunk" }, { voiceVlan: 20 }])("rejects an unsupported secured interface type %j", (patch) => {
  const s = structuredClone(original);
  Object.assign(s.devices[1].ports![0], patch);
  expect(scenarioSchema.safeParse(s).success).toBe(false);
});
it("loads valid state with exactly one static slot fault and connected/local routes", () => {
  expect(scenarioSchema.parse(original)).toEqual(original);
  const fixed = repaired(original);
  expect(scenarioSchema.parse(fixed)).toEqual(fixed);
  expect(portSecurityRecovered(original, fixed)).toBe(true);
  fixed.devices[1].ports![0].portSecurity!.staticMac = "0200.0012.009a";
  expect(fixed).toEqual(original);
  expect(routes(original, "R1").map((r) => [r.kind, r.prefix])).toEqual([
    ["C", "172.30.10.0/24"],
    ["L", "172.30.10.1/32"],
    ["C", "172.30.20.0/24"],
    ["L", "172.30.20.1/32"],
  ]);
});
it.each([
  ["PC-A", "172.30.10.10", true],
  ["PC-A", "172.30.10.1", false],
  ["PC-A", "172.30.20.10", false],
  ["PC-B", "172.30.10.10", false],
  ["R1", "172.30.10.10", false],
  ["PC-B", "172.30.20.1", true],
  ["R1", "172.30.20.10", true],
] as const)("derived connectivity %s → %s before and after", (d, t, ok) => {
  expect(connectivity(original, d, t).ok).toBe(ok);
  expect(connectivity(repaired(original), d, t).ok).toBe(true);
});
it("rejects both request and response resolution without generating a reply or fake ARP", () => {
  expect(forward(original, "PC-A", "172.30.10.1").admissionDrop).toMatchObject({
    phase: "request",
    device: "SW1",
    interface: change.interface,
    sourceMac: change.mac,
  });
  expect(forward(original, "PC-B", "172.30.10.10").admissionDrop).toMatchObject({
    phase: "response",
    sourceMac: change.mac,
  });
  expect(connectivity(original, "PC-B", "172.30.10.10").returning).toBeUndefined();
  expect(execute(original, "PC-A", "arp -a", "", observations())).toContain("No ARP Entries Found");
  expect(connectivity(original, "R1", "172.30.20.10", "172.30.10.1").ok).toBe(true);
});
it("all advertised commands derive coherent state without fake counters or topology hints", () => {
  for (const d of original.devices)
    for (const c of d.commands) expect(execute(original, d.id, c, "172.30.20.10")).not.toMatch(/^%/);
  expect(execute(original, "SW1", "show interfaces status")).toMatch(/FastEthernet0\/1\s+connected\s+10/);
  expect(execute(original, "SW1", "show port-security interface fastethernet0/1")).toContain("Secure-up");
  expect(execute(original, "SW1", "show port-security address")).toContain("0200.0012.009a    SecureConfigured");
  expect(execute(repaired(original), "SW1", "show running-config")).toContain(
    "switchport port-security mac-address 0200.0012.000a",
  );
  expect(execute(original, "SW1", "show port-security interface fastethernet0/24")).toMatch(/^% Unsupported/);
  expect(execute(original, "PC-A", "ping", "172.30.20.10")).not.toContain("009a");
});
it("requires original evidence and fresh verification, and scores a complete attempt at 100", () => {
  expect(score()).toMatchObject({ score: 100, recovery: "verified" });
  expect(score([change], observations())).toMatchObject({ score: 80, recovery: "recovered-unverified" });
  expect(score([], observations())).toMatchObject({ score: 65, recovery: "unresolved" });
  expect(score([change], observations([change], verification))).toMatchObject({ score: 70, recovery: "verified" });
  expect(score([{ ...change, mac: "0200.0012.000b" }]).recovery).toBe("unresolved");
});
it.each(["cause", "devices", "interface", "observedSecureMac", "fix", "reason"] as const)(
  "rejects incorrect structured %s without pretending to understand notes",
  (field) => {
    const patch = {
      cause: "wrong-gateway",
      devices: ["PC-A"],
      interface: "FastEthernet0/24",
      observedSecureMac: "0200.0012.000b",
      fix: "gateway",
      reason: "switch-routing",
    } as const;
    expect(score([change], undefined, { [field]: patch[field], notes: original.solution }).score).toBeLessThan(100);
  },
);
it.each([
  "show port-security address",
  "show running-config",
  "show interfaces status",
  "show vlan brief",
  "show port-security interface fastethernet0/1",
  "ipconfig /all",
  "arp -a",
])("fresh %s cannot be omitted", (command) => {
  const h = observations([change], verification, observations()).filter((o) => !o.repairIndex || o.command !== command);
  expect(score([change], h).recovery).toBe("recovered-unverified");
});
it("stale, forged and cross-case evidence cannot prove recovery or seed ARP", () => {
  const h = observations([change], verification, observations());
  expect(score([change, { ...change, mac: "0200.0012.000b" }, change], h).recovery).toBe("recovered-unverified");
  for (const patch of [{ scenario: "hsrp-01" as const }, { output: "forged" }, { repairIndex: 99 }])
    expect(
      score(
        [change],
        h.map((o) => (o.repairIndex ? { ...o, ...patch } : o)),
      ).recovery,
    ).toBe("recovered-unverified");
  const forged = h.map((o) =>
    o.repairIndex && o.command === "ping" && o.target === "172.30.10.1" ? { ...o, output: "forged" } : o,
  );
  expect(score([change], forged).recovery).toBe("recovered-unverified");
});
it.each(["enabled", "maximum", "violation", "vlan", "identity", "routing", "link", "removed"])(
  "a %s bypass fails the minimal recovery invariant",
  (field) => {
    const s = repaired(original),
      p = s.devices[1].ports![0];
    if (field === "enabled") p.portSecurity!.enabled = false;
    if (field === "maximum") Object.assign(p.portSecurity!, { maximum: 2 });
    if (field === "violation") Object.assign(p.portSecurity!, { violation: "restrict" });
    if (field === "vlan") p.vlan = 20;
    if (field === "identity") s.devices[0].interfaces[0].mac = "0200.0012.009a";
    if (field === "routing") s.devices[2].interfaces[1].up = false;
    if (field === "link") s.links[0].up = false;
    if (field === "removed") delete p.portSecurity;
    expect(portSecurityRecovered(original, s)).toBe(false);
  },
);
it("normalized replacements, no-ops, limits and epoch resets preserve old observations", () => {
  let a = recordRepair(original, attempt(), { ...change, mac: "02:00:00:12:00:0A" }, 2);
  expect(a.repairs![0]).toMatchObject(change);
  expect(recordRepair(original, a, { ...change, mac: "02-00-00-12-00-0a" }, 3)).toEqual(a);
  const h = observations([change], verification);
  expect(execute(repaired(original), "PC-A", "arp -a", "", h, "", 1)).toContain("0200.0012.0101");
  expect(execute(repaired(original), "PC-A", "arp -a", "", h, "", 2)).toContain("No ARP Entries Found");
  expect(a.history).toEqual(attempt().history);
  for (let n = 1; n < 10; n++)
    a = recordRepair(original, a, { ...change, mac: n % 2 ? "0200.0012.000b" : change.mac }, n + 3);
  expect(() => recordRepair(original, a, change, 20)).toThrow("Ten configuration");
  expect(recordRepair(original, { ...a, finishedAt: 19 }, change, 20).repairs).toHaveLength(10);
  expect(repairActionSchema.safeParse({ ...change, enabled: false }).success).toBe(false);
  expect(() => trialNetwork(original, [{ ...change, interface: "FastEthernet0/24" }])).toThrow();
  expect(admitsSource(repaired(original).devices[1].ports![0], "0200.0012.000b")).toBe(false);
});
it("round-trips the new pack/journal and renders a derived repair preview", () => {
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
  const a = { ...recordRepair(original, attempt(), change, 2), feedback: score() };
  savePack(storage, original);
  saveAttempt(storage, a);
  expect(loadPack(storage, original.id)).toEqual(original);
  expect(loadJournal(storage)).toEqual([a]);
  expect(data.has("netfault.practice.port-security-01.v1")).toBe(true);
  expect(original.hints).toHaveLength(4);
  expect(original.lesson).toHaveLength(8);
  const preview = repairPreview(original);
  expect(preview).toContain("AFTER REPAIR");
  expect(preview).toContain("0200.0012.000a");
  expect(preview).toContain("Bidirectional communication: successful");
  expect(preview).toContain("not part of your evidence");
});
it("server assessment survives reload, concurrent duplicate changes, fresh verification and finalization", async () => {
  const a = await startAssessment(undefined, original.id);
  expect(a).not.toHaveProperty("repair");
  for (const [device, command, target = ""] of control)
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
  expect(await reloaded.assessmentAction(a.id, "repair", { ...change, mac: "0200.0012.000b" })).toEqual(final);
});
it("API rejects policy bypass input and keeps sensitive replies uncacheable", async () => {
  const a = await startAssessment(undefined, original.id);
  const call = (data: unknown) =>
    POST(
      new Request("http://localhost/api/lab", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      }),
    );
  expect((await call({ action: "repair", id: a.id, change: { ...change, enabled: false } })).status).toBe(400);
  const response = await call({
    action: "command",
    id: a.id,
    device: "SW1",
    command: "show port-security address",
    target: "",
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect((await call({ action: "command", id: a.id, device: "R3", command: "show ip route", target: "" })).status).toBe(
    400,
  );
});
it("admission does not create a missing route or gateway and router frames use the local segment", () => {
  const fixed = repaired(original);
  expect(forward(fixed, "PC-B", "172.30.10.10").ok).toBe(true);
  // PC-B's MAC is not the secure registration; it never crosses the routed boundary as an Ethernet source.
  expect(admitsSource(fixed.devices[1].ports![0], fixed.devices[3].interfaces[0].mac)).toBe(false);
  fixed.devices[0].gateway = "172.30.10.254";
  expect(connectivity(fixed, "PC-A", "172.30.20.10").ok).toBe(false);
  fixed.devices[0].gateway = "172.30.10.1";
  fixed.devices[2].interfaces[1].up = false;
  expect(forward(fixed, "PC-A", "172.30.20.10").reason).toContain("no route");
});
it("late repair and diagnosis cannot extend the assessment deadline", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  try {
    const a = await startAssessment(undefined, original.id);
    vi.setSystemTime(a.expiresAt! + 1);
    const expired = await assessmentAction(a.id, "repair", change);
    expect(expired.repairs).toBeUndefined();
    expect(expired.feedback).toMatchObject({ score: 0, timedOut: true, recovery: "unresolved" });
    expect(expired.finishedAt).toBe(a.expiresAt);
    expect(await assessmentAction(a.id, "submit", answer)).toEqual(expired);
  } finally {
    vi.useRealTimers();
  }
});
