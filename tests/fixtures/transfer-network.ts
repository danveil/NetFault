import { aclScenario } from "../../src/server/acl-scenario";
import { device } from "../../src/lib/engine";
import { scenarioSchema, type Scenario, type RepairAction, type Diagnosis, type Attempt } from "../../src/lib/schema";
import { capabilityCommands, type Capability } from "../../src/lib/capabilities";

// Test-only engineering networks. Never add these to the catalog or registry.
export function transferNetwork(fault: "vlan" | "acl" = "vlan"): Scenario {
  const s = structuredClone(aclScenario);
  s.schemaVersion = 15;
  s.id = fault === "vlan" ? "n-a17b93e2" : "n-4b92d10f";
  s.title = "Operations segment";
  s.incident = "Desk cannot exchange traffic with Archive. Investigate the current network.";
  s.design =
    "Desk and Local use access VLAN 31. Office traffic may reach Archive; transit sources remain excluded. Both router LANs are advertised across the point-to-point backbone.";
  const rename: Record<string, string> = { "PC-A": "Desk", "PC-B": "Archive", R1: "West", R2: "East" };
  for (const d of s.devices) {
    d.id = rename[d.id];
    d.role = d.kind === "pc" ? "Workstation" : "Routing node";
    if (d.kind === "router") {
      delete d.staticRoutes;
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
  }
  for (const link of s.links) for (const end of [link.a, link.b]) end.device = rename[end.device];
  for (const flow of s.policyChecks!) flow.device = rename[flow.device];
  for (const rule of s.evidenceRules)
    for (const req of rule.requirements) req.devices = req.devices.map((d) => rename[d]);
  s.devices.push({
    id: "Access",
    kind: "switch",
    role: "Access node",
    interfaces: [],
    commands: [],
    vlans: [
      { id: 31, name: "OFFICE", active: true },
      { id: 32, name: "SPARE", active: true },
    ],
    ports: ["Fa0/1", "Fa0/2", "Fa0/24"].map((name) => ({ name, vlan: 31, up: true, speed: 100, duplex: "full" })),
  });
  const local = structuredClone(device(s, "Desk"));
  local.id = "Local";
  local.interfaces[0].ip = "172.24.10.11";
  local.interfaces[0].mac = "02:00:00:00:00:07";
  s.devices.push(local);
  s.links[0].b = { device: "Access", interface: "Fa0/1" };
  s.links.push(
    {
      id: "local-edge",
      a: { device: "Access", interface: "Fa0/2" },
      b: { device: "Local", interface: "Ethernet0" },
      subnet: "172.24.10.0/24",
    },
    {
      id: "uplink",
      a: { device: "Access", interface: "Fa0/24" },
      b: { device: "West", interface: "Gi0/0" },
      subnet: "172.24.10.0/24",
    },
  );
  s.fault = {
    cause: fault === "vlan" ? "access-vlan" : "acl-order",
    devices: [fault === "vlan" ? "Access" : "East"],
    interface: fault === "vlan" ? "Access:Fa0/1" : "East:Gi0/1",
  };
  s.acceptedFixes = [fault === "vlan" ? "access-vlan" : "acl-sequence"];
  if (fault === "vlan") {
    device(s, "Access").ports![0].vlan = 32;
    const acl = device(s, "East").acls![0];
    acl.entries[1].sequence = 5;
    acl.entries.sort((a, b) => a.sequence - b.sequence);
    s.repair = { device: "Access", interface: "Fa0/1", vlan: 31 };
  } else
    s.repair = {
      device: "East",
      interface: "Gi0/1",
      acl: "WORKAREA",
      entryId: "entry-b",
      sequence: 20,
      newSequence: 5,
      reason: "first-match-policy",
    };
  s.explanation = "TEST_PRIVATE_EXPLANATION: separate access membership, routing and outbound policy evidence.";
  s.solution = "TEST_PRIVATE_SOLUTION: replay the selected bounded correction and verify each layer.";
  s.hints = ["TEST_PRIVATE_HINT_1", "TEST_PRIVATE_HINT_2", "TEST_PRIVATE_HINT_3"];
  delete s.lesson;
  const layout: Record<string, { desktop: { x: number; y: number }; mobile: { x: number; y: number } }> = {
    Desk: { desktop: { x: 0, y: 0 }, mobile: { x: 0, y: 0 } },
    Access: { desktop: { x: 240, y: 0 }, mobile: { x: 0, y: 200 } },
    Local: { desktop: { x: 240, y: 220 }, mobile: { x: 0, y: 400 } },
    West: { desktop: { x: 480, y: 0 }, mobile: { x: 0, y: 600 } },
    East: { desktop: { x: 720, y: 0 }, mobile: { x: 0, y: 800 } },
    Archive: { desktop: { x: 960, y: 0 }, mobile: { x: 0, y: 1000 } },
  };
  const publicDevices = s.devices.map((d) => {
    const capabilities: Capability[] =
      d.kind === "pc"
        ? ["ipv4-host", "reachability"]
        : d.kind === "switch"
          ? ["access-switching", "configuration"]
          : [
              "interface-state",
              "routing-state",
              "neighbor-state",
              "configuration",
              "reachability",
              ...(d.acls ? ["standard-policy" as const] : []),
            ];
    d.commands = capabilityCommands(d.kind, capabilities) as typeof d.commands;
    return {
      id: d.id,
      kind: d.kind,
      role: d.role,
      interfaces: d.kind === "switch" ? d.ports!.map((p) => p.name) : d.interfaces.map((i) => i.name),
      capabilities,
      ...layout[d.id],
    };
  });
  s.foundation = {
    profile: "access-ospf-policy-v1",
    public: {
      version: 1,
      id: s.id as `n-${string}`,
      title: s.title,
      incident: s.incident,
      design: s.design,
      operations: ["access-assignment", "policy-order"],
      devices: publicDevices,
      links: s.links.map((l) => ({
        id: l.id,
        kind: "physical",
        a: l.a,
        b: l.b,
        label: l.subnet,
        ...(l.id == "uplink" ? { bend: { desktop: 0, mobile: -280 } } : {}),
      })),
    },
    verification: {
      original: [
        { id: "before-switch", layer: "configuration", device: "Access", commands: ["show vlan brief"] },
        { id: "before-policy", layer: "policy", device: "East", commands: ["show access-lists"] },
        { id: "before-service", layer: "delivery", device: "Desk", commands: ["ping"], target: "172.24.20.10" },
      ],
      current: [
        { id: "now-switch", layer: "configuration", device: "Access", commands: ["show vlan brief"] },
        { id: "now-local", layer: "local", device: "Desk", commands: ["ping"], target: "172.24.10.11" },
        { id: "now-route-west", layer: "routing", device: "West", commands: ["show ip route"] },
        { id: "now-route-east", layer: "routing", device: "East", commands: ["show ip route"] },
        { id: "now-neighbor", layer: "routing", device: "West", commands: ["show ip ospf neighbor"] },
        { id: "now-policy", layer: "policy", device: "East", commands: ["show access-lists"] },
        { id: "now-attachment", layer: "policy", device: "East", commands: ["show running-config"] },
      ],
      flows: s.policyChecks!.map(({ device, target, source, permitted }) => ({
        device,
        target,
        ...(source ? { source } : {}),
        permitted,
      })),
    },
  };
  return scenarioSchema.parse(s);
}
export function correction(family: "vlan" | "acl"): RepairAction {
  return family === "vlan"
    ? { kind: "access-vlan", device: "Access", interface: "Fa0/1", vlan: 31 }
    : { kind: "acl-sequence", device: "East", acl: "WORKAREA", sequence: 20, newSequence: 5 };
}
export function diagnosis(s: Scenario, a: Attempt): Diagnosis {
  return {
    cause: s.fault.cause,
    devices: [...s.fault.devices],
    interface: "interface" in s.repair ? s.repair.interface : "",
    fix: s.acceptedFixes[0],
    evidence: a.history.map((o) => o.id),
    notes: "",
  };
}
