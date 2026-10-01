import { describe, expect, it } from "vitest";
import { connectivity, device, execute, neighbors, repaired, routes } from "../src/lib/engine";
import { repairActionSchema, scenarioSchema, type Scenario } from "../src/lib/schema";
import { trialNetwork } from "../src/lib/repair-trial";
import { aclScenario } from "../src/server/acl-scenario";
import { natScenario } from "../src/server/nat-scenario";
import { greScenario } from "../src/server/gre-scenario";
import { hsrpScenario } from "../src/server/hsrp-scenario";
import { stpScenario } from "../src/server/stp-scenario";
import { ipv6Scenario } from "../src/server/ipv6-scenario";
import { returnScenario } from "../src/server/return-scenario";

// Engineering probes derived from existing cases, NOT new learner-facing challenges.
// Keep the existing private metadata solely to exercise schema acceptance. These
// tests do not claim that the old grader verifies every healthy added subsystem.
function campus() {
  const s = structuredClone(aclScenario);
  for (const id of ["R1", "R2"]) {
    const d = device(s, id);
    delete d.staticRoutes;
    d.commands.push("show ip ospf neighbor", "show ip ospf interface");
    for (const i of d.interfaces)
      i.ospf = {
        area: 0,
        networkType: "point-to-point",
        passive: i.prefix === 24,
        cost: 1,
        hello: 10,
        dead: 40,
        mtu: 1500,
      };
  }
  s.devices.push({
    id: "Access",
    kind: "switch",
    role: "Audit access edge",
    interfaces: [],
    vlans: [
      { id: 31, name: "LOCAL", active: true },
      { id: 32, name: "OTHER", active: true },
    ],
    ports: ["FastEthernet0/1", "FastEthernet0/24"].map((name) => ({
      name,
      vlan: 31,
      up: true,
      speed: 100,
      duplex: "full",
    })),
    commands: ["show vlan brief", "show interfaces status", "show running-config"],
  });
  s.links[0].b = { device: "Access", interface: "FastEthernet0/1" };
  s.links.push({
    id: "audit-uplink",
    a: { device: "Access", interface: "FastEthernet0/24" },
    b: { device: "R1", interface: "Gi0/0" },
    subnet: "172.24.10.0/24",
  });
  return scenarioSchema.parse(s);
}
const aclChange = { kind: "acl-sequence", device: "R2", acl: "WORKAREA", sequence: 20, newSequence: 5 } as const;
const target = "172.24.20.10";
function issues(s: Scenario) {
  const parsed = scenarioSchema.safeParse(s);
  expect(parsed.success).toBe(false);
  return parsed.success ? [] : parsed.error.issues.map((i) => i.message);
}

describe("3U composition gate: supported restricted IPv4 forwarding", () => {
  it("validates VLAN + point-to-point OSPF + outbound LAN ACL without declaring a new lab", () => {
    const s = campus();
    expect(neighbors(s, "R1").map((n) => n.device)).toEqual(["R2"]);
    expect(routes(s, "R1")).toContainEqual(expect.objectContaining({ prefix: "172.24.20.0/24", kind: "O" }));
    expect(connectivity(s, "PC-A", "172.24.10.1").ok).toBe(true);
    expect(connectivity(s, "PC-A", target).outward.policyDrop).toMatchObject({ device: "R2", sequence: 10 });
  });
  it("ACL repair restores both directions and preserves learned routes, VLANs and excluded traffic", () => {
    const s = campus(),
      fixed = trialNetwork(s, [aclChange]);
    expect(connectivity(fixed, "PC-A", target).ok).toBe(true);
    expect(connectivity(fixed, "PC-B", "172.24.10.10").ok).toBe(true);
    expect(connectivity(fixed, "R1", target, "10.49.0.1").ok).toBe(false);
    expect(connectivity(fixed, "R1", target, "172.24.10.1").ok).toBe(true);
    for (const id of ["R1", "R2"]) {
      expect(routes(fixed, id)).toEqual(routes(s, id));
      expect(neighbors(fixed, id)).toEqual(neighbors(s, id));
    }
    expect(device(fixed, "Access")).toEqual(device(s, "Access"));
    expect(connectivity(s, "PC-A", target).ok).toBe(false);
  });
  it("a correct route and permitted policy cannot bypass wrong local VLAN membership", () => {
    const s = trialNetwork(campus(), [aclChange]);
    device(s, "Access").ports![0].vlan = 32;
    expect(scenarioSchema.safeParse(s).success).toBe(true);
    expect(routes(s, "R1")).toContainEqual(expect.objectContaining({ prefix: "172.24.20.0/24", kind: "O" }));
    expect(connectivity(s, "PC-A", "172.24.10.1").ok).toBe(false);
    expect(connectivity(s, "PC-A", target).outward.reason).toContain("next-hop resolution failed");
  });
  it("ACL permission does not create a missing OSPF route", () => {
    const s = trialNetwork(campus(), [aclChange]);
    device(s, "R2").interfaces[0].ospf!.passive = true;
    expect(neighbors(s, "R1")).toEqual([]);
    expect(routes(s, "R1").some((r) => r.prefix === "172.24.20.0/24")).toBe(false);
    expect(connectivity(s, "PC-A", target).outward.reason).toContain("no route");
  });
  it("OSPF return advertisements are required independently of the forward path", () => {
    const s = trialNetwork(campus(), [aclChange]);
    delete device(s, "R1").interfaces[0].ospf;
    const result = connectivity(s, "PC-A", target);
    expect(result.outward.ok).toBe(true);
    expect(result.returning?.reason).toContain("no route");
    expect(result.ok).toBe(false);
  });
  it("a same-prefix static route takes ownership without changing OSPF adjacency", () => {
    const s = campus();
    device(s, "R1").staticRoutes = [{ network: "172.24.20.0", prefix: 24, nextHop: "10.49.0.2" }];
    expect(scenarioSchema.safeParse(s).success).toBe(true);
    expect(routes(s, "R1").filter((r) => r.prefix === "172.24.20.0/24")).toEqual([
      expect.objectContaining({ kind: "S", via: "10.49.0.2" }),
    ]);
    expect(neighbors(s, "R1")).toHaveLength(1);
  });
  it("commands reflect derived switching, adjacency, routing and policy state", () => {
    const s = campus();
    expect(execute(s, "Access", "show vlan brief")).toContain("LOCAL");
    expect(execute(s, "R1", "show ip ospf neighbor")).toContain("FULL/-");
    expect(execute(s, "R1", "show ip route")).toContain("172.24.20.0/24");
    expect(execute(s, "R2", "show access-lists")).toContain("deny any");
  });
});

describe("3U composition gate: NAT and GRE retain independent routing", () => {
  it("static translation cannot replace an outward route", () => {
    const s = repaired(natScenario);
    expect(connectivity(s, "PC-A", "198.51.100.10").ok).toBe(true);
    device(s, "R1").staticRoutes = [];
    expect(connectivity(s, "PC-A", "198.51.100.10").outward.reason).toContain("no route");
    expect(device(s, "R1").nat).toEqual(device(repaired(natScenario), "R1").nat);
  });
  it("static translation cannot replace the independent route to its global identity", () => {
    const s = repaired(natScenario);
    device(s, "R2").staticRoutes = [];
    const result = connectivity(s, "PC-A", "198.51.100.10");
    expect(result.outward.ok).toBe(true);
    expect(result.returning?.reason).toContain("no route");
    expect(result.ok).toBe(false);
  });
  it("GRE overlay routes cannot replace outward physical transport", () => {
    const s = repaired(greScenario);
    expect(connectivity(s, "PC-A", "172.31.20.10").ok).toBe(true);
    device(s, "R1").staticRoutes = [];
    expect(device(s, "R1").tunnelRoutes).toHaveLength(1);
    expect(connectivity(s, "PC-A", "172.31.20.10").ok).toBe(false);
  });
  it("GRE cannot create a missing overlay route from working physical transport", () => {
    const s = repaired(greScenario);
    device(s, "R1").tunnelRoutes = [];
    expect(connectivity(s, "R1", "198.51.100.2", "192.0.2.1").ok).toBe(true);
    expect(connectivity(s, "PC-A", "172.31.20.10").ok).toBe(false);
  });
});

describe("3U composition gate: explicit unsupported boundaries", () => {
  it.each(["acl", "ospf"])("rejects NAT plus %s rather than treating helper execution as support", (feature) => {
    const s = repaired(natScenario),
      d = device(s, "R1");
    if (feature === "acl") d.acls = structuredClone(device(aclScenario, "R2").acls);
    else d.interfaces[0].ospf = structuredClone(device(campus(), "R1").interfaces[0].ospf);
    expect(issues(s)).toContain("Mixed NAT protocol scenarios are unsupported");
  });
  it.each(["acl", "nat"])("rejects GRE plus %s", (feature) => {
    const s = repaired(greScenario),
      d = device(s, "R1");
    if (feature === "acl") d.acls = structuredClone(device(aclScenario, "R2").acls);
    else d.nat = structuredClone(device(natScenario, "R1").nat);
    expect(issues(s)).toContain("Mixed GRE protocols are unsupported");
  });
  it.each(["acl", "ospf"])("rejects HSRP plus %s", (feature) => {
    const s = structuredClone(hsrpScenario),
      d = device(s, "R1");
    if (feature === "acl") d.acls = structuredClone(device(aclScenario, "R2").acls);
    else d.interfaces[0].ospf = structuredClone(device(campus(), "R1").interfaces[0].ospf);
    expect(issues(s)).toContain("HSRP cannot be combined with other protocol models");
  });
  it("rejects EtherChannel state on the STP graph", () => {
    const s = structuredClone(stpScenario);
    device(s, "SW1").portChannels = [];
    expect(issues(s)).toContain("Unsupported combined STP configuration");
  });
  it("rejects IPv4 ACL state in the IPv6 model", () => {
    const s = structuredClone(ipv6Scenario);
    device(s, "R1").acls = structuredClone(device(aclScenario, "R2").acls);
    expect(issues(s)).toContain("IPv6-only direct-link devices required; mixed protocols are unsupported");
  });
  it.each([
    { kind: "ospf-passive", device: "R2", interface: "Gi0/0", passive: false },
    { kind: "static-route", device: "R2", network: "172.24.10.0", prefix: 24, nextHop: "10.49.0.1" },
  ])("has no replayable $kind action in the current trial contract", (action) => {
    expect(repairActionSchema.safeParse(action).success).toBe(false);
  });
  it("does not mistake the canonical static repair preview for a learner-owned trial", () => {
    expect(connectivity(returnScenario, "PC-A", "192.168.20.10").ok).toBe(false);
    expect(connectivity(repaired(returnScenario), "PC-A", "192.168.20.10").ok).toBe(true);
    expect(() => trialNetwork(returnScenario, [aclChange])).toThrow("Configuration trials are not supported");
  });
});
