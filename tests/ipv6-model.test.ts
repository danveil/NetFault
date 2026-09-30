import { describe, expect, it } from "vitest";
import { address6, normalize6, equal6, prefix6, samePrefix6, network6 } from "../src/lib/ipv6-address";
import { scenarioSchema, type Scenario } from "../src/lib/schema";
import { connectivity, execute, routes } from "../src/lib/engine";
import { connectivity6, ipv6Connected, resolveNeighbor6, forward6 } from "../src/lib/ipv6";
import { trialNetwork } from "../src/lib/repair-trial";

// Independent fixture: no private scenario, authored answer or grader imported.
export function ipv6Fixture(): Scenario {
  let mac = 0;
  const intf = (name: string, address: string, prefix = 64) => ({
    name,
    address,
    prefix,
    up: true,
    mac: `0200.0067.${String(++mac).padStart(4, "0")}`,
  });
  return scenarioSchema.parse({
    schemaVersion: 14,
    id: "ipv6-01",
    revision: 1,
    title: "Fixture",
    incident: "Probe",
    design: "Manual on-link routes",
    devices: [
      {
        id: "Juniper",
        kind: "pc",
        role: "one",
        interfaces: [],
        ipv6: { interfaces: [intf("eth", "2001:db8:67:1::a")], gateway: "2001:db8:67:1::1" },
        commands: ["ipconfig", "route print", "ping"],
      },
      {
        id: "Bridgewater",
        kind: "router",
        role: "transit",
        interfaces: [],
        ipv6: { forwarding: true, interfaces: [intf("west", "2001:db8:67:1::1"), intf("east", "2001:db8:67:2::1")] },
        commands: ["show ipv6 interface brief", "show running-config", "ping"],
      },
      {
        id: "Cypress",
        kind: "pc",
        role: "two",
        interfaces: [],
        ipv6: { interfaces: [intf("eth", "2001:db8:67:2::b")], gateway: "2001:db8:67:2::1" },
        commands: ["ipconfig", "ping"],
      },
    ],
    links: [
      {
        id: "a",
        a: { device: "Juniper", interface: "eth" },
        b: { device: "Bridgewater", interface: "west" },
        subnet: "2001:db8:67:1::/64",
      },
      {
        id: "b",
        a: { device: "Bridgewater", interface: "east" },
        b: { device: "Cypress", interface: "eth" },
        subnet: "2001:db8:67:2::/64",
      },
    ],
    fault: { cause: "ipv6-forwarding-disabled", devices: ["Bridgewater"], interface: "global" },
    acceptedFixes: ["ipv6-forwarding"],
    repair: { kind: "ipv6-forwarding", device: "Bridgewater", enabled: true, reason: "ipv6-transit" },
    evidenceRules: [
      {
        label: "evidence",
        points: 30,
        requirements: [{ devices: ["Bridgewater"], commands: ["show running-config"] }],
      },
    ],
    hints: ["a", "b", "c"],
    explanation: "Fixture",
    solution: "Fixture",
  });
}
describe("IPv6 identities and prefix arithmetic", () => {
  it.each([
    ["2001:0DB8:0000:0000:0000:0000:0000:0001", "2001:db8::1"],
    ["::", "::"],
    ["0:0:0:0:0:0:0:1", "::1"],
    ["2001:db8:0:1:0:0:0:1", "2001:db8:0:1::1"],
    ["2001:0:0:1:0:0:1:1", "2001::1:0:0:1:1"],
  ])("normalizes %s", (raw, expected) => {
    expect(normalize6(raw)).toBe(expected);
    expect(equal6(raw, expected)).toBe(true);
    expect(address6(raw)).toBe(address6(expected));
  });
  it.each([
    "1:2:3:4:5:6:7",
    "1:2:3:4:5:6:7:8:9",
    "2001:::1",
    "2001::1::2",
    "20001::1",
    "gggg::1",
    "[::1]",
    "fe80::1%eth0",
    "::ffff:192.0.2.1",
    "192.0.2.1",
    "2001::1/64",
    "http://[::1]",
    "",
  ])("rejects %s", (v) => expect(normalize6(v)).toBeUndefined());
  it("uses 128 bits including non-hextet prefix boundaries", () => {
    expect(address6("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff")).toBe((1n << 128n) - 1n);
    expect(prefix6("ffff::1", 0)).toBe(0n);
    expect(network6("2001:db8:abcf::19", 47)).toBe("2001:db8:abce::/47");
    expect(network6("2001:db8::19", 128)).toBe("2001:db8::19/128");
    expect(samePrefix6("2001:db8::1", "2001:db8::ffff", 112)).toBe(true);
    expect(samePrefix6("2001:db8::1", "2001:db8::1:0", 112)).toBe(false);
    expect(() => prefix6("::1", 129)).toThrow();
  });
});
describe("Independent bounded IPv6 delivery", () => {
  const target = "2001:db8:67:2::b";
  it("loads without any IPv4 addresses or invented router IDs", () => {
    const s = ipv6Fixture();
    expect(s.devices.every((d) => !d.interfaces.length && !d.routerId)).toBe(true);
    expect(routes(s, "Bridgewater")).toEqual([]);
  });
  it("delivers local and routed echoes with separately derived reply", () => {
    const s = ipv6Fixture();
    expect(connectivity6(s, "Juniper", "2001:db8:67:1::1").ok).toBe(true);
    const c = connectivity(s, "Juniper", target);
    expect(c.ok).toBe(true);
    expect(c.outward.hops).toEqual(["Juniper", "Bridgewater", "Cypress"]);
    expect(c.returning?.hops).toEqual(["Cypress", "Bridgewater", "Juniper"]);
  });
  it("keeps local receive and originated probes while transit is disabled", () => {
    const s = ipv6Fixture();
    s.devices[1].ipv6!.forwarding = false;
    expect(connectivity6(s, "Juniper", "2001:db8:67:1::1").ok).toBe(true);
    expect(connectivity6(s, "Bridgewater", target).ok).toBe(true);
    expect(connectivity6(s, "Juniper", target).ok).toBe(false);
    expect(connectivity6(s, "Cypress", "2001:db8:67:1::a").ok).toBe(false);
  });
  it("does not turn a remote matching address into a neighbor", () => {
    const s = ipv6Fixture();
    s.devices[0].ipv6!.interfaces[0].prefix = 48;
    expect(resolveNeighbor6(s, "Juniper", "eth", target)).toBeUndefined();
    expect(connectivity6(s, "Juniper", target).outward.reason).toMatch(/neighbor resolution/);
  });
  it("requires independently correct default and return route", () => {
    const s = ipv6Fixture();
    delete s.devices[2].ipv6!.gateway;
    const c = connectivity6(s, "Juniper", target);
    expect(c.outward.ok).toBe(true);
    expect(c.returning?.ok).toBe(false);
    expect(c.ok).toBe(false);
  });
  it.each([
    ["2001:db8:67:1::fe", /neighbor resolution/],
    ["2001:db8:67:2::1", /not on the configured link/],
  ])("rejects an unresolved or off-link manual next hop %s", (gateway, reason) => {
    const s = ipv6Fixture();
    s.devices[0].ipv6!.gateway = gateway;
    const probe = connectivity6(s, "Juniper", target);
    expect(probe.ok).toBe(false);
    expect(probe.outward.reason).toMatch(reason);
    expect(probe.returning).toBeUndefined();
  });
  it("does not create remote router routes", () => {
    const s = ipv6Fixture();
    expect(connectivity6(s, "Bridgewater", "2001:db8:ffff::1").outward.reason).toMatch(/No operational on-link route/);
    expect(ipv6Connected(s, "Bridgewater")).toHaveLength(2);
  });
  it.each(["admin", "peer", "link"])("honors %s state", (kind) => {
    const s = ipv6Fixture();
    if (kind === "admin") s.devices[0].ipv6!.interfaces[0].up = false;
    if (kind === "peer") s.devices[1].ipv6!.interfaces[0].up = false;
    if (kind === "link") s.links[0].up = false;
    expect(connectivity6(s, "Juniper", target).ok).toBe(false);
    expect(execute(s, "Bridgewater", "show ipv6 interface brief")).not.toContain("west [up/up]");
  });
  it("normalizes target and source identities", () => {
    const s = ipv6Fixture();
    expect(connectivity6(s, "Bridgewater", "2001:0DB8:0067:0002:0000:0000:0000:000B", "EAST").ok).toBe(true);
    expect(connectivity6(s, "Bridgewater", target, "2001:0db8:67:2::1").ok).toBe(true);
    expect(() => connectivity6(s, "Bridgewater", target, "2001:db8:67:2::9")).toThrow();
  });
  it("fails unsupported destinations, commands and sources honestly", () => {
    const s = ipv6Fixture();
    for (const target of ["192.0.2.1", "fe80::1", "::1", "ff02::1"])
      expect(execute(s, "Juniper", "ping", target)).toMatch(/^%/);
    expect(execute(s, "Juniper", "arp -a")).toMatch(/Unsupported/);
    expect(execute(s, "Juniper", "tracert", target)).toMatch(/Unsupported/);
    expect(execute(s, "Juniper", "ping", target, [], "eth")).toMatch(/^%/);
  });
  it("uses actual source ownership and no ARP events", () => {
    const s = ipv6Fixture();
    expect(forward6(s, "Juniper", target, "2001:db8:bad::1").ok).toBe(false);
    const c = connectivity6(s, "Juniper", target);
    expect(c.outward.delivered?.destination).toBe(target);
    expect(c.outward).not.toHaveProperty("arp");
  });
  it("changes only forwarding and rejects wrong device/actions", () => {
    const s = ipv6Fixture();
    const changed = trialNetwork(s, [{ kind: "ipv6-forwarding", device: "Bridgewater", enabled: false }]);
    expect(s.devices[1].ipv6!.forwarding).toBe(true);
    expect(connectivity6(changed, "Juniper", target).ok).toBe(false);
    expect(() => trialNetwork(s, [{ kind: "ipv6-forwarding", device: "Juniper", enabled: true }])).toThrow();
  });
  it("rejects mixed IPv4 configuration and unsupported route/ND properties", () => {
    const s = ipv6Fixture();
    expect(scenarioSchema.safeParse({ ...s, schemaVersion: 13 }).success).toBe(false);
    s.devices[1].gateway = "192.0.2.1";
    expect(scenarioSchema.safeParse(s).success).toBe(false);
    const t = ipv6Fixture();
    Object.assign(t.devices[1].ipv6!, { staticRoutes: [], slaac: true });
    expect(scenarioSchema.safeParse(t).success).toBe(false);
  });
  it("rejects equivalent duplicate addresses and invalid links", () => {
    const s = ipv6Fixture();
    s.devices[2].ipv6!.interfaces[0].address = "2001:0DB8:0067:0001:0:0:0:A";
    expect(scenarioSchema.safeParse(s).success).toBe(false);
    const t = ipv6Fixture();
    t.links[1].b.interface = "missing";
    expect(scenarioSchema.safeParse(t).success).toBe(false);
  });
});
