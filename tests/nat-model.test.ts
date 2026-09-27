import { describe, expect, it } from "vitest";
import { scenarioSchema, type Scenario } from "../src/lib/schema";
import { natSource, natDestination, natOutput } from "../src/lib/nat";
import { connectivity, forward, routes, execute, runningConfig } from "../src/lib/engine";

// Independent engineering fixture: no authored lab configuration or grader imported.
export function model(): Scenario {
  const intf = (name: string, ip: string, n: number, prefix = 24) => ({
    name,
    ip,
    prefix,
    up: true,
    mac: `0200.0066.${String(n).padStart(4, "0")}`,
  });
  return scenarioSchema.parse({
    schemaVersion: 12,
    id: "nat-static-01",
    revision: 1,
    title: "Fixture",
    incident: "Probe",
    design: "Static pair",
    devices: [
      {
        id: "A",
        kind: "pc",
        role: "inside",
        gateway: "10.66.0.1",
        interfaces: [intf("eth", "10.66.0.20", 1)],
        commands: ["ping", "ipconfig"],
      },
      {
        id: "Edge",
        kind: "router",
        role: "edge",
        routerId: "1.1.1.1",
        interfaces: [intf("lan", "10.66.0.1", 2), intf("wan", "192.0.2.5", 3, 30)],
        nat: {
          mode: "static-one-to-one",
          inside: "lan",
          outside: "wan",
          mappings: [{ id: "pair", insideLocal: "10.66.0.20", insideGlobal: "203.0.113.70" }],
        },
        staticRoutes: [{ network: "198.51.100.128", prefix: 25, nextHop: "192.0.2.6" }],
        commands: ["show ip route", "show running-config", "show ip nat translations"],
      },
      {
        id: "Up",
        kind: "router",
        role: "upstream",
        routerId: "2.2.2.2",
        interfaces: [intf("wan", "192.0.2.6", 4, 30), intf("lan", "198.51.100.129", 5, 25)],
        staticRoutes: [{ network: "203.0.113.70", prefix: 32, nextHop: "192.0.2.5" }],
        commands: ["show ip route"],
      },
      {
        id: "B",
        kind: "pc",
        role: "outside",
        gateway: "198.51.100.129",
        interfaces: [intf("eth", "198.51.100.140", 6, 25)],
        commands: ["ping", "ipconfig"],
      },
    ],
    links: [
      ["a", "A", "eth", "Edge", "lan", "10.66.0.0/24"],
      ["b", "Edge", "wan", "Up", "wan", "192.0.2.4/30"],
      ["c", "Up", "lan", "B", "eth", "198.51.100.128/25"],
    ].map(([id, a, ai, b, bi, subnet]) => ({
      id,
      a: { device: a, interface: ai },
      b: { device: b, interface: bi },
      subnet,
    })),
    fault: { cause: "nat-local", devices: ["Edge"], interface: "Edge:lan" },
    acceptedFixes: ["nat-local"],
    repair: {
      kind: "nat-static-local",
      device: "Edge",
      mappingId: "pair",
      insideLocal: "10.66.0.20",
      reason: "static-translation",
    },
    evidenceRules: [{ label: "fixture", points: 30, requirements: [{ devices: ["A"], commands: ["ipconfig"] }] }],
    hints: ["a", "b", "c"],
    explanation: "fixture",
    solution: "fixture",
  });
}
describe("independent static NAT model", () => {
  it("validates and shows the permanent pair before traffic", () => {
    const s = model();
    expect(natOutput(s.devices[1])).toContain("Inside local:  10.66.0.20");
    expect(runningConfig(s, "Edge")).toContain("ip nat inside source static 10.66.0.20 203.0.113.70");
  });
  it("uses role and source matching, with no unrelated-source inheritance", () => {
    const d = model().devices[1];
    expect(natSource(d, "lan", "wan", "10.66.0.20")).toBe("203.0.113.70");
    expect(natSource(d, "wan", "lan", "10.66.0.20")).toBe("10.66.0.20");
    expect(natSource(d, "lan", "wan", "10.66.0.21")).toBe("10.66.0.21");
    expect(natDestination(d, "wan", "203.0.113.70")).toBe("10.66.0.20");
    expect(natDestination(d, "lan", "203.0.113.70")).toBe("203.0.113.70");
  });
  it.each([
    ["A", "198.51.100.140", "B", "203.0.113.70", "198.51.100.140"],
    ["B", "203.0.113.70", "A", "198.51.100.140", "10.66.0.20"],
  ])("delivers from %s with transformed endpoint identity", (id, target, destination, source, local) => {
    const s = model(),
      original = structuredClone(s),
      c = connectivity(s, id, target);
    expect(c.ok).toBe(true);
    expect(c.outward.delivered).toMatchObject({ device: destination, source, destination: local });
    expect(c.returning?.delivered).toMatchObject({
      device: id,
      source: target,
      destination: s.devices.find((d) => d.id === id)!.interfaces[0].ip,
    });
    expect(c.outward.translations).toHaveLength(1);
    expect(c.returning?.translations).toHaveLength(1);
    expect(s).toEqual(original);
    expect(connectivity(s, id, target)).toEqual(c);
  });
  it("outside initiation works without any preceding request", () => {
    expect(connectivity(model(), "B", "203.0.113.70").ok).toBe(true);
  });
  it("does not create a route or impersonate the translated endpoint", () => {
    const s = model();
    expect(routes(s, "Edge").some((r) => r.prefix === "203.0.113.70/32")).toBe(false);
    expect(forward(s, "B", "203.0.113.70").delivered?.device).toBe("A");
  });
  it("routes outward before translation", () => {
    const s = model();
    s.devices[1].staticRoutes = [];
    const c = connectivity(s, "A", "198.51.100.140");
    expect(c.ok).toBe(false);
    expect(c.outward.translations).toEqual([]);
    expect(c.returning).toBeUndefined();
  });
  it("translates inward before the connected route lookup", () => {
    const s = model();
    const f = forward(s, "B", "203.0.113.70");
    expect(f.ok).toBe(true);
    expect(f.translations?.[0]).toEqual({
      device: "Edge",
      field: "destination",
      before: "203.0.113.70",
      after: "10.66.0.20",
    });
  });
  it("needs a global return route", () => {
    const s = model();
    s.devices[2].staticRoutes = [];
    const c = connectivity(s, "A", "198.51.100.140");
    expect(c.outward.ok).toBe(true);
    expect(c.returning?.reason).toContain("no route");
    expect(c.ok).toBe(false);
  });
  it("wrong local leaves the request untranslated but breaks its return", () => {
    const s = model();
    s.devices[1].nat!.mappings[0].insideLocal = "10.66.0.99";
    expect(scenarioSchema.safeParse(s).success).toBe(true);
    const c = connectivity(s, "A", "198.51.100.140");
    expect(c.outward.delivered?.source).toBe("10.66.0.20");
    expect(c.outward.translations).toEqual([]);
    expect(c.ok).toBe(false);
    expect(connectivity(s, "B", "203.0.113.70").outward.reason).toContain("resolution failed");
  });
  it("NAT nonmatch is not a firewall deny", () => {
    const s = model();
    s.devices[1].nat!.mappings[0].insideLocal = "10.66.0.99";
    s.devices[2].staticRoutes!.push({ network: "10.66.0.0", prefix: 24, nextHop: "192.0.2.5" });
    expect(connectivity(s, "A", "198.51.100.140").ok).toBe(true);
  });
  it.each([0, 1, 2])("link %s failure cannot be repaired by NAT", (n) => {
    const s = model();
    s.links[n].up = false;
    expect(connectivity(s, "A", "198.51.100.140").ok).toBe(false);
    expect(connectivity(s, "B", "203.0.113.70").ok).toBe(false);
    if (n === 0) expect(forward(s, "A", "198.51.100.140").translations).toEqual([]);
  });
  it("wrong gateway stops before translation", () => {
    const s = model();
    s.devices[0].gateway = "10.66.0.98";
    expect(forward(s, "A", "198.51.100.140").translations).toEqual([]);
    expect(connectivity(s, "A", "198.51.100.140").ok).toBe(false);
  });
  it("local gateways stay ordinary physical destinations", () => {
    expect(connectivity(model(), "A", "10.66.0.1").ok).toBe(true);
    expect(connectivity(model(), "B", "198.51.100.129").ok).toBe(true);
  });
  it.each(["10.66.0.0", "10.66.0.255", "10.66.0.1", "10.67.0.20", "224.0.0.1", "999.0.0.1"])(
    "rejects unusable local %s",
    (ip) => {
      const s = model();
      s.devices[1].nat!.mappings[0].insideLocal = ip;
      expect(scenarioSchema.safeParse(s).success).toBe(false);
    },
  );
  it.each(["192.0.2.5", "10.66.0.20", "198.51.100.140", "127.0.0.1", "0.0.0.0"])(
    "rejects unsupported global %s",
    (ip) => {
      const s = model();
      s.devices[1].nat!.mappings[0].insideGlobal = ip;
      expect(scenarioSchema.safeParse(s).success).toBe(false);
    },
  );
  it("rejects duplicate mappings, same roles, old schema and arbitrary fields", () => {
    for (const mutate of [
      (s: Scenario) => s.devices[1].nat!.mappings.push(s.devices[1].nat!.mappings[0]),
      (s: Scenario) => (s.devices[1].nat!.outside = "lan"),
      (s: Scenario) => (s.schemaVersion = 11),
      (s: Scenario) => Object.assign(s.devices[1].nat!, { overload: true }),
    ]) {
      const s = model();
      mutate(s);
      expect(scenarioSchema.safeParse(s).success).toBe(false);
    }
  });
  it("offers no unsupported router probes or trace", () => {
    const s = model();
    expect(execute(s, "Edge", "ping", "198.51.100.140")).toMatch(/^%/);
    expect(execute(s, "A", "tracert", "203.0.113.70")).toMatch(/^%/);
  });
});
