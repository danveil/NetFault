import { expect, it } from "vitest";
import { deviceSchema, interfaceSchema, type Scenario } from "../src/lib/schema";
import { hsrpMembers, hsrpState, validateHsrp, virtualMac, virtualOwner, standbyOutput } from "../src/lib/hsrp";
import { connectivity, execute, forward, runningConfig, type Route, routes } from "../src/lib/engine";

// Independent addresses, names, group, priorities and routes; no LAB 011 answer data.
function fixture() {
  const intf = (name: string, ip: string, prefix = 24) => ({ name, ip, prefix, mac: "0200.0000.0001", up: true });
  const member = (n: number) =>
    deviceSchema.parse({
      id: `G${n}`,
      kind: "router",
      role: "Member",
      routerId: `${n}.${n}.${n}.${n}`,
      commands: ["ping", "show standby brief", "show running-config"],
      interfaces: [
        {
          ...intf("lan", `192.0.2.${n + 1}`),
          hsrp: { version: 2, group: 42, virtualIp: "192.0.2.1", priority: n === 1 ? 170 : 210, preempt: true },
        },
        intf("wan", `10.10.${n}.1`, 30),
      ],
      staticRoutes: [{ network: "198.51.100.0", prefix: 24, nextHop: `10.10.${n}.2` }],
    });
  const devices = [
    member(1),
    member(2),
    deviceSchema.parse({
      id: "Core",
      kind: "router",
      role: "Core",
      routerId: "3.3.3.3",
      commands: ["ping"],
      interfaces: [intf("a", "10.10.1.2", 30), intf("b", "10.10.2.2", 30), intf("remote", "198.51.100.1")],
      staticRoutes: [{ network: "192.0.2.0", prefix: 24, nextHop: "10.10.1.1" }],
    }),
    deviceSchema.parse({
      id: "Access",
      kind: "switch",
      role: "Access",
      commands: ["show vlan brief"],
      interfaces: [],
      vlans: [{ id: 40, name: "Clients", active: true }],
      ports: [1, 2, 3].map((n) => ({ name: `p${n}`, vlan: 40, up: true, speed: 1000, duplex: "full" })),
    }),
    ...["Client", "Service"].map((id, n) =>
      deviceSchema.parse({
        id,
        kind: "pc",
        role: "Host",
        commands: ["ping", "arp -a", "tracert"],
        gateway: n ? "198.51.100.1" : "192.0.2.1",
        interfaces: [intf("eth", n ? "198.51.100.10" : "192.0.2.10")],
      }),
    ),
  ];
  const links = [
    ["Client", "eth", "Access", "p1"],
    ["G1", "lan", "Access", "p2"],
    ["G2", "lan", "Access", "p3"],
    ["G1", "wan", "Core", "a"],
    ["G2", "wan", "Core", "b"],
    ["Core", "remote", "Service", "eth"],
  ].map(([a, ai, b, bi], n) => ({
    id: String(n),
    a: { device: a, interface: ai },
    b: { device: b, interface: bi },
    subnet: "",
  }));
  return { schemaVersion: 10, devices, links } as Scenario;
}
function errors(s: Scenario) {
  const e: string[] = [];
  validateHsrp(s, (x) => e.push(x));
  return e;
}
it("derives complementary settled roles and actual forwarding independently of the authored case", () => {
  const s = fixture();
  expect(errors(s)).toEqual([]);
  expect(hsrpState(s).active?.device.id).toBe("G2");
  expect(hsrpState(s).standby?.device.id).toBe("G1");
  expect(forward(s, "Client", "198.51.100.10").hops).toEqual(["192.0.2.3", "10.10.2.2", "198.51.100.10"]);
  expect(connectivity(s, "Client", "198.51.100.10").returning?.hops).toEqual([
    "198.51.100.1",
    "10.10.1.1",
    "192.0.2.10",
  ]);
  const before = s.devices.map((d) => d.staticRoutes);
  hsrpMembers(s)[0].interface.hsrp!.priority = 220;
  expect(hsrpState(s).active?.device.id).toBe("G1");
  expect(hsrpState(s).standby?.device.id).toBe("G2");
  expect(forward(s, "Client", "198.51.100.10").hops[0]).toBe("192.0.2.2");
  expect(s.devices.map((d) => d.staticRoutes)).toEqual(before);
});
it("keeps roles and paths deterministic under reordered devices, interfaces and links", () => {
  const s = fixture(),
    expected = forward(s, "Client", "198.51.100.10");
  s.devices.reverse().forEach((d) => d.interfaces.reverse());
  s.links.reverse().forEach((l) => ([l.a, l.b] = [l.b, l.a]));
  expect(hsrpState(s).active?.device.id).toBe("G2");
  expect(forward(s, "Client", "198.51.100.10")).toEqual(expected);
});
it.each([0, 100, 255])("supports effective priority %i and omitted default", (priority) => {
  const s = fixture(),
    [a, b] = hsrpMembers(s);
  a.interface.hsrp!.priority = priority;
  b.interface.hsrp!.priority = priority === 100 ? 99 : 100;
  expect(errors(s)).toEqual([]);
  expect(hsrpState(s).active?.device.id).toBe(priority >= 100 ? "G1" : "G2");
  delete a.interface.hsrp!.priority;
  b.interface.hsrp!.priority = 99;
  expect(standbyOutput(s, "G1")).toContain("100 P Active");
  expect(runningConfig(s, "G1")).not.toContain(" priority ");
});
it.each([
  [0, "0000.0c9f.f000"],
  [11, "0000.0c9f.f00b"],
  [4095, "0000.0c9f.ffff"],
] as const)("derives v2 MAC for group %i", (g, mac) => expect(virtualMac(g)).toBe(mac));
it.each([-1, 4096, 0.5])("rejects invalid group %s", (n) => expect(() => virtualMac(n)).toThrow());
it.each([
  { version: 1 },
  { preempt: false },
  { group: 4096 },
  { group: 1.2 },
  { priority: 256 },
  { priority: -1 },
  { priority: 2.5 },
  { tracking: "wan" },
  { timers: { hello: 3 } },
  { authentication: "secret" },
])("rejects unsupported member configuration %j", (patch) => {
  const i = fixture().devices[0].interfaces[0];
  expect(interfaceSchema.safeParse({ ...i, hsrp: { ...i.hsrp, ...patch } }).success).toBe(false);
});
it.each([
  "group",
  "vip",
  "tie",
  "missing",
  "third",
  "physical-vip",
  "network-vip",
  "broadcast-vip",
  "offlink-vip",
  "vlan",
  "preempt",
  "ospf",
  "old-version",
])("rejects incoherent model: %s", (fault) => {
  const s = fixture(),
    [a, b] = hsrpMembers(s);
  if (fault === "group") b.interface.hsrp!.group++;
  if (fault === "vip") b.interface.hsrp!.virtualIp = "192.0.2.4";
  if (fault === "tie") a.interface.hsrp!.priority = b.interface.hsrp!.priority;
  if (fault === "missing") delete b.interface.hsrp;
  if (fault === "third") s.devices.find((d) => d.id === "Core")!.interfaces[0].hsrp = { ...a.interface.hsrp! };
  const vips: Record<string, string> = {
    "physical-vip": "192.0.2.2",
    "network-vip": "192.0.2.0",
    "broadcast-vip": "192.0.2.255",
    "offlink-vip": "203.0.113.1",
  };
  if (vips[fault]) {
    a.interface.hsrp!.virtualIp = vips[fault];
    b.interface.hsrp!.virtualIp = vips[fault];
  }
  if (fault === "vlan") s.devices.find((d) => d.id === "Access")!.ports![2].vlan = 50;
  if (fault === "preempt") Object.assign(a.interface.hsrp!, { preempt: false });
  if (fault === "ospf")
    a.interface.ospf = { area: 0, networkType: "broadcast", passive: true, cost: 1, hello: 10, dead: 40, mtu: 1500 };
  if (fault === "old-version") s.schemaVersion = 6;
  expect(errors(s).length).toBeGreaterThan(0);
});
it.each(["none", "first", "second", "both"])(
  "derives static eligibility snapshot %s without failover chronology",
  (down) => {
    const s = fixture(),
      [a, b] = hsrpMembers(s);
    a.interface.up = !["first", "both"].includes(down);
    b.interface.up = !["second", "both"].includes(down);
    expect(hsrpState(s).active?.device.id).toBe(down === "both" ? undefined : down === "second" ? "G1" : "G2");
    expect(hsrpState(s).standby?.device.id).toBe(down === "none" ? "G1" : undefined);
    expect(connectivity(s, "Client", "192.0.2.1").ok).toBe(down !== "both");
  },
);
it.each(["member-port", "vlan", "both-ports"])("honors physical shared LAN eligibility: %s", (fault) => {
  const s = fixture(),
    sw = s.devices.find((d) => d.id === "Access")!;
  if (fault === "vlan") sw.vlans![0].active = false;
  else {
    sw.ports![2].up = false;
    if (fault === "both-ports") sw.ports![1].up = false;
  }
  expect(virtualOwner(s, "192.0.2.1")?.device.id).toBe(fault === "member-port" ? "G1" : undefined);
  expect(connectivity(s, "Client", "192.0.2.1").ok).toBe(fault === "member-port");
});
it("does not synthesize upstream or return routes, or fall back to Standby's route", () => {
  const s = fixture();
  s.devices.find((d) => d.id === "G2")!.staticRoutes = [];
  expect(hsrpState(s).active?.device.id).toBe("G2");
  expect(connectivity(s, "Client", "192.0.2.1").ok).toBe(true);
  expect(connectivity(s, "Client", "198.51.100.10").ok).toBe(false);
  expect(forward(s, "Client", "198.51.100.10").reason).toContain("no route");
  const t = fixture();
  t.devices.find((d) => d.id === "Core")!.staticRoutes = [];
  expect(forward(t, "Client", "198.51.100.10").ok).toBe(true);
  expect(connectivity(t, "Client", "198.51.100.10").ok).toBe(false);
});
it("does not teleport remote VIP traffic or use a missing owner despite intact routes", () => {
  const s = fixture();
  expect(connectivity(s, "Service", "192.0.2.1").ok).toBe(true);
  s.devices.find((d) => d.id === "Core")!.staticRoutes = [];
  expect(connectivity(s, "Service", "192.0.2.1").ok).toBe(false);
  const t = fixture();
  hsrpMembers(t).forEach((m) => (m.interface.up = false));
  expect(routes(t, "G2").some((r: Route) => r.kind === "S")).toBe(true);
  expect(connectivity(t, "Client", "198.51.100.10").ok).toBe(false);
});
it("preserves ordinary Standby delivery and rejects arbitrary virtual explicit source", () => {
  const s = fixture();
  expect(connectivity(s, "Client", "192.0.2.2").ok).toBe(true);
  expect(connectivity(s, "Service", "192.0.2.2").ok).toBe(true);
  expect(() => connectivity(s, "G2", "198.51.100.10", "192.0.2.1")).toThrow(/Source/);
  expect(execute(s, "Client", "tracert", "198.51.100.10")).toContain("192.0.2.3");
  expect(execute(s, "Client", "tracert", "198.51.100.10")).not.toContain("Access");
});
