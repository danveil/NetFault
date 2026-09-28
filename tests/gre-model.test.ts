import { describe, expect, it } from "vitest";
import { scenarioSchema, type Scenario } from "../src/lib/schema";
import { connectivity, forward, routes, execute, tunnelState, l3Interfaces } from "../src/lib/engine";
import { trialNetwork } from "../src/lib/repair-trial";

// Independent names and addresses; no authored scenario or grader imported.
export function greFixture(): Scenario {
  let n = 0;
  const nic = (name: string, ip: string, prefix: number) => ({
    name,
    ip,
    prefix,
    up: true,
    mac: `0200.0066.${String(++n).padStart(4, "0")}`,
  });
  const commands = ["show ip route", "show ip interface brief", "show running-config", "ping"];
  return scenarioSchema.parse({
    schemaVersion: 13,
    id: "gre-01",
    revision: 1,
    title: "Fixture",
    incident: "Probe",
    design: "One pair",
    devices: [
      {
        id: "A",
        kind: "pc",
        role: "west",
        gateway: "10.66.1.1",
        interfaces: [nic("eth", "10.66.1.10", 24)],
        commands: ["ipconfig", "ping"],
      },
      {
        id: "West",
        kind: "router",
        role: "west",
        routerId: "1.1.1.1",
        interfaces: [nic("lan", "10.66.1.1", 24), nic("wan", "192.0.2.5", 30)],
        commands: [...commands, "show interfaces tunnel 0"],
        gre: {
          name: "Tunnel0",
          mode: "gre-ip",
          sourceInterface: "wan",
          destination: "198.51.100.10",
          ip: "10.66.99.1",
          prefix: 30,
          adminUp: true,
        },
        staticRoutes: [{ network: "198.51.100.8", prefix: 30, nextHop: "192.0.2.6" }],
        tunnelRoutes: [{ network: "10.66.2.0", prefix: 24, interface: "Tunnel0" }],
      },
      {
        id: "Transit",
        kind: "router",
        role: "transport",
        routerId: "2.2.2.2",
        interfaces: [nic("west", "192.0.2.6", 30), nic("east", "198.51.100.9", 30)],
        commands,
      },
      {
        id: "East",
        kind: "router",
        role: "east",
        routerId: "3.3.3.3",
        interfaces: [nic("wan", "198.51.100.10", 30), nic("lan", "10.66.2.1", 24)],
        commands: [...commands, "show interfaces tunnel 0"],
        gre: {
          name: "Tunnel0",
          mode: "gre-ip",
          sourceInterface: "wan",
          destination: "192.0.2.5",
          ip: "10.66.99.2",
          prefix: 30,
          adminUp: true,
        },
        staticRoutes: [{ network: "192.0.2.4", prefix: 30, nextHop: "198.51.100.9" }],
        tunnelRoutes: [{ network: "10.66.1.0", prefix: 24, interface: "Tunnel0" }],
      },
      {
        id: "B",
        kind: "pc",
        role: "east",
        gateway: "10.66.2.1",
        interfaces: [nic("eth", "10.66.2.10", 24)],
        commands: ["ipconfig", "ping"],
      },
    ],
    links: [
      {
        id: "a",
        a: { device: "A", interface: "eth" },
        b: { device: "West", interface: "lan" },
        subnet: "10.66.1.0/24",
      },
      {
        id: "b",
        a: { device: "West", interface: "wan" },
        b: { device: "Transit", interface: "west" },
        subnet: "192.0.2.4/30",
      },
      {
        id: "c",
        a: { device: "Transit", interface: "east" },
        b: { device: "East", interface: "wan" },
        subnet: "198.51.100.8/30",
      },
      {
        id: "d",
        a: { device: "East", interface: "lan" },
        b: { device: "B", interface: "eth" },
        subnet: "10.66.2.0/24",
      },
    ],
    fault: { cause: "incorrect-tunnel-destination", devices: ["West"], interface: "West:Tunnel0" },
    repair: {
      kind: "gre-destination",
      device: "West",
      interface: "Tunnel0",
      destination: "198.51.100.10",
      reason: "gre-endpoint",
    },
    acceptedFixes: ["gre-destination"],
    evidenceRules: [
      { label: "fixture", points: 30, requirements: [{ devices: ["West"], commands: ["show running-config"] }] },
    ],
    hints: ["a", "b", "c"],
    explanation: "fixture",
    solution: "fixture",
  });
}
describe("independent bounded GRE", () => {
  it("derives local identity and state without a MAC or physical peer", () => {
    const s = greFixture();
    expect(tunnelState(s, "West")).toEqual({ adminUp: true, lineUp: true, source: "192.0.2.5" });
    expect(l3Interfaces(s, "West").at(-1)).toEqual({ name: "Tunnel0", ip: "10.66.99.1", prefix: 30, up: true });
    expect(routes(s, "Transit")).toHaveLength(4);
    expect(routes(s, "West")).toHaveLength(8);
    expect(routes(s, "West", true).some((r) => r.interface === "Tunnel0")).toBe(false);
  });
  it.each([
    ["A", "10.66.2.10", "B"],
    ["B", "10.66.1.10", "A"],
  ])("delivers %s through actual outer transport and an independent reply", (id, target, end) => {
    const s = greFixture(),
      before = JSON.stringify(s),
      c = connectivity(s, id, target);
    expect(c.ok).toBe(true);
    expect(c.outward.delivered?.device).toBe(end);
    expect(c.returning?.delivered?.device).toBe(id);
    for (const p of [c.outward, c.returning!]) {
      expect(p.tunnels).toHaveLength(1);
      expect(p.tunnels![0].accepted).toBe(true);
      expect(p.tunnels![0].underlay).toHaveLength(2);
    }
    expect(c.outward.delivered?.source).toBe(s.devices.find((d) => d.id === id)!.interfaces[0].ip);
    expect(JSON.stringify(s)).toBe(before);
  });
  it("does not teleport from a reachable non-GRE destination", () => {
    const s = greFixture();
    s.devices[1].gre!.destination = "198.51.100.9";
    expect(scenarioSchema.safeParse(s).success).toBe(true);
    expect(connectivity(s, "West", "198.51.100.9", "wan").ok).toBe(true);
    expect(connectivity(s, "West", "198.51.100.10", "wan").ok).toBe(true);
    const c = connectivity(s, "A", "10.66.2.10");
    expect(c.ok).toBe(false);
    expect(c.outward.delivered).toBeUndefined();
    expect(c.returning).toBeUndefined();
    expect(c.outward.tunnels?.[0]).toMatchObject({
      outerReceiver: "Transit",
      accepted: false,
      underlay: ["192.0.2.6"],
    });
    // Local delivery on T1 is at its own .9 address, reached through .6, not another hop.
  });
  it("rejects an incompatible receiving pair in the reverse direction", () => {
    const s = greFixture();
    s.devices[1].gre!.destination = "198.51.100.9";
    const c = connectivity(s, "B", "10.66.1.10");
    expect(c.ok).toBe(false);
    expect(c.outward.tunnels?.[0]).toMatchObject({ outerReceiver: "West", accepted: false });
  });
  it("keeps local up/up and routes unchanged when only delivery is corrected", () => {
    const s = greFixture();
    s.devices[1].gre!.destination = "198.51.100.9";
    const fixed = trialNetwork(s, [
      { kind: "gre-destination", device: "West", interface: "Tunnel0", destination: "198.51.100.10" },
    ]);
    expect(routes(fixed, "West")).toEqual(routes(s, "West"));
    expect(tunnelState(fixed, "West")).toEqual(tunnelState(s, "West"));
    expect(execute(s, "West", "show interfaces tunnel 0")).toContain("destination 198.51.100.9");
    expect(execute(fixed, "West", "show interfaces tunnel 0")).toContain("destination 198.51.100.10");
    expect(connectivity(fixed, "A", "10.66.2.10").ok).toBe(true);
  });
  it.each(["West", "East"])("supports %s tunnel-IP probes with explicit name or IP source", (id) => {
    const s = greFixture(),
      d = s.devices.find((d) => d.id === id)!,
      peer = s.devices.find((d) => d.gre && d.id !== id)!;
    for (const source of ["Tunnel0", d.gre!.ip]) expect(connectivity(s, id, peer.gre!.ip, source).ok).toBe(true);
  });
  it("does not create its own missing underlay route", () => {
    const s = greFixture();
    s.devices[1].staticRoutes = [];
    expect(tunnelState(s, "West").lineUp).toBe(false);
    expect(routes(s, "West").some((r) => r.interface === "Tunnel0")).toBe(false);
    expect(connectivity(s, "A", "10.66.2.10").ok).toBe(false);
  });
  it("can be locally up while a downstream transport link is unusable", () => {
    const s = greFixture();
    s.links[2].up = false;
    expect(tunnelState(s, "West").lineUp).toBe(true);
    expect(connectivity(s, "West", "198.51.100.10", "wan").ok).toBe(false);
    expect(connectivity(s, "A", "10.66.2.10").ok).toBe(false);
  });
  it.each(["admin", "source", "local-link"])("withdraws local tunnel routes for %s failure", (kind) => {
    const s = greFixture();
    if (kind === "admin") s.devices[1].gre!.adminUp = false;
    else if (kind === "source") s.devices[1].interfaces[1].up = false;
    else s.links[1].up = false;
    expect(scenarioSchema.safeParse(s).success).toBe(true);
    expect(tunnelState(s, "West").lineUp).toBe(false);
    expect(connectivity(s, "A", "10.66.2.10").ok).toBe(false);
  });
  it("requires overlay routes independently of an operational pair", () => {
    const s = greFixture();
    s.devices[1].tunnelRoutes = [];
    expect(connectivity(s, "West", "10.66.99.2", "Tunnel0").ok).toBe(true);
    expect(connectivity(s, "A", "10.66.2.10").ok).toBe(false);
  });
  it("delivers a request yet rejects exchange without its LAN return route", () => {
    const s = greFixture();
    s.devices[3].tunnelRoutes = [];
    const c = connectivity(s, "A", "10.66.2.10");
    expect(c.outward.ok).toBe(true);
    expect(c.returning?.ok).toBe(false);
    expect(c.ok).toBe(false);
  });
  it("keeps ordinary physical paths independent and excludes trace", () => {
    const s = greFixture();
    s.devices[1].gre!.adminUp = false;
    expect(connectivity(s, "A", "10.66.1.1").ok).toBe(true);
    expect(forward(s, "West", "198.51.100.10", undefined, "192.0.2.5", true).ok).toBe(true);
    expect(execute(s, "West", "traceroute", "10.66.2.10")).toMatch(/^% Unsupported/);
    expect(execute(s, "West", "show ip route")).not.toContain("undefined");
  });
  it("bounds repeated encapsulation and never manufactures a path for an overlay loop", () => {
    const s = greFixture();
    for (const d of s.devices.filter((d) => d.gre))
      d.tunnelRoutes!.push({ network: "10.70.0.0", prefix: 24, interface: "Tunnel0" });
    const path = forward(s, "A", "10.70.0.10");
    expect(path.ok).toBe(false);
    expect(path.reason).toContain("repeated tunnel");
    expect(path.tunnels).toHaveLength(1);
  });
  it("rejects invalid and down explicit sources and resolves normalized command labels", () => {
    const s = greFixture();
    expect(execute(s, "West", "ping", "10.66.99.2", [], "not-owned")).toMatch(/^%/);
    s.devices[1].gre!.adminUp = false;
    expect(execute(s, "West", "ping", "10.66.99.2", [], "Tunnel0")).toMatch(/^%/);
    expect(execute(s, "East", " SHOW  INTERFACES TUNNEL 0 ")).toBe(execute(s, "East", "show interfaces tunnel 0"));
  });
  it("rejects multicast logical addresses and overlapping logical/physical networks", () => {
    for (const [a, b] of [
      ["224.0.0.1", "224.0.0.2"],
      ["192.0.2.5", "192.0.2.6"],
    ]) {
      const s = greFixture();
      s.devices[1].gre!.ip = a;
      s.devices[3].gre!.ip = b;
      expect(scenarioSchema.safeParse(s).success).toBe(false);
    }
  });
  it.each([
    [
      "source reference",
      (s: Scenario) => {
        s.devices[1].gre!.sourceInterface = "missing";
      },
    ],
    [
      "duplicate tunnel IP",
      (s: Scenario) => {
        s.devices[3].gre!.ip = s.devices[1].gre!.ip;
      },
    ],
    [
      "wrong tunnel subnet",
      (s: Scenario) => {
        s.devices[3].gre!.ip = "10.66.98.2";
      },
    ],
    [
      "recursive overlay",
      (s: Scenario) => {
        s.devices[1].tunnelRoutes = [{ network: "198.51.100.8", prefix: 30, interface: "Tunnel0" }];
      },
    ],
    [
      "self destination",
      (s: Scenario) => {
        s.devices[1].gre!.destination = "192.0.2.5";
      },
    ],
    [
      "broadcast",
      (s: Scenario) => {
        s.devices[1].gre!.destination = "198.51.100.11";
      },
    ],
    [
      "unsupported family",
      (s: Scenario) => {
        s.devices[1].gre!.destination = "::1";
      },
    ],
    [
      "old version",
      (s: Scenario) => {
        s.schemaVersion = 12;
      },
    ],
    [
      "no second endpoint",
      (s: Scenario) => {
        delete s.devices[3].gre;
      },
    ],
    [
      "extra tunnel field",
      (s: Scenario) => {
        Object.assign(s.devices[1].gre!, { keepalive: 10 });
      },
    ],
    [
      "overlay route extra field",
      (s: Scenario) => {
        Object.assign(s.devices[1].tunnelRoutes![0], { nextHop: "10.66.99.2" });
      },
    ],
    [
      "trace",
      (s: Scenario) => {
        s.devices[1].commands.push("traceroute");
      },
    ],
    [
      "NAT",
      (s: Scenario) => {
        s.devices[1].nat = { mode: "static-one-to-one", inside: "lan", outside: "wan", mappings: [] };
      },
    ],
  ] as const)("rejects %s", (_, edit) => {
    const s = greFixture();
    edit(s);
    expect(scenarioSchema.safeParse(s).success).toBe(false);
  });
});
