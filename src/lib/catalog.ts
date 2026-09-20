import type { ScenarioId } from "./schema";
// Only public incident and choices. No answer key, config, hints or grading rules.
export const lab = {
  id: "ospf-01",
  number: "001",
  topic: "OSPF investigation",
  target: "192.168.30.10",
  title: "The silent route",
  subtitle: "A campus connection has gone quiet.",
  incident:
    "PC-A in the student lab cannot reach PC-B in the research lab. Both users report that their local gateway responds. Investigate the path, identify the cause, and propose the smallest correct repair.",
  design:
    "Design intent: every router interface participating in OSPF belongs to area 0. Transit Ethernet interfaces use OSPF point-to-point. LAN interfaces are passive. No ACLs, NAT, static routes or default routes are intended.",
  devices: [
    { id: "PC-A", kind: "pc", role: "Student lab" },
    { id: "R1", kind: "router", role: "West gateway" },
    { id: "R2", kind: "router", role: "Campus core" },
    { id: "R3", kind: "router", role: "East gateway" },
    { id: "PC-B", kind: "pc", role: "Research lab" },
  ],
  subnets: ["192.168.10.0/24", "10.0.12.0/30", "10.0.23.0/30", "192.168.30.0/24"],
} as const;
export const causes = [
  ["area-mismatch", "OSPF area mismatch"],
  ["interface-down", "An interface is down"],
  ["wrong-gateway", "Incorrect PC gateway"],
  ["missing-advertisement", "LAN missing from OSPF"],
  ["timer-mismatch", "OSPF timer mismatch"],
] as const;
export const fixes = [
  ["r3-area0", "Set R3 Gi0/0 to OSPF area 0"],
  ["r2-area1", "Set R2 Gi0/1 to OSPF area 1"],
  ["restart", "Restart the OSPF processes"],
  ["gateway", "Change the PC default gateway"],
  ["no-shutdown", "Enable the transit interface"],
] as const;
export const routerCommands = [
  "show ip interface brief",
  "show ip route",
  "show ip ospf neighbor",
  "show ip ospf interface",
  "show ip protocols",
  "show running-config",
  "ping",
  "traceroute",
];
export const pcCommands = ["ipconfig", "ipconfig /all", "ping", "tracert"];

export const gatewayRouterCommands = ["show ip interface brief", "show ip route", "show running-config", "ping"];
export const switchCommands = ["show vlan brief", "show interfaces status"];
export const gatewayPcCommands = ["ipconfig", "ipconfig /all", "route print", "ping", "tracert"];
export const gatewayLab = {
  id: "gateway-01",
  number: "002",
  topic: "IPv4 host connectivity",
  target: "192.168.20.10",
  title: "Beyond the local network",
  subtitle: "Local services respond. A remote workstation does not.",
  incident:
    "PC-A can reach a service on its own LAN but cannot reach PC-B at 192.168.20.10. Investigate the host configuration, switching and routed path. Identify the single incorrect setting and explain a minimal repair.",
  design:
    "PC-A and R1 share 192.168.10.0/24 through SW1's access VLAN 10. R1–R2 uses 10.0.12.0/30; PC-B is on 192.168.20.0/24. Routers exchange both LAN routes through OSPF area 0 with a point-to-point transit and passive LANs. Hosts use static IPv4 settings. No ACLs, NAT or DNS dependency are intended. SW1 forwards Ethernet frames; it has no management IP and does not route.",
  devices: [
    { id: "PC-A", kind: "pc", role: "Student lab" },
    { id: "SW1", kind: "switch", role: "Access switch" },
    { id: "R1", kind: "router", role: "West gateway" },
    { id: "R2", kind: "router", role: "East gateway" },
    { id: "PC-B", kind: "pc", role: "Remote lab" },
  ],
  subnets: ["192.168.10.0/24", "192.168.10.0/24", "10.0.12.0/30", "192.168.20.0/24"],
} as const;
export const vlanLab = {
  id: "vlan-01",
  number: "003",
  topic: "Ethernet investigation",
  target: "192.168.20.10",
  title: "The Wrong Network",
  subtitle: "The cable is connected. The destination is silent.",
  incident:
    "PC-A cannot communicate with PC-B at 192.168.20.10. The user reports that the Ethernet cable is connected and the computer has an IP address. Investigate the network and identify the cause.",
  design:
    "Design intent: PC-A connects to SW1 FastEthernet0/1; SW1 FastEthernet0/24 connects to R1 Gi0/0. These access ports should share VLAN 10 for 192.168.10.0/24. R1–R2 uses 10.0.12.0/30 and PC-B uses 192.168.20.0/24. Hosts have static IPv4 settings. Routers advertise both LANs using the existing area-0 point-to-point OSPF design with passive LANs. SW1 has no SVI or IP routing. No ACL, NAT or DNS dependency is intended. Subnet labels describe IP design, not proof of Layer 2 reachability.",
  devices: gatewayLab.devices,
  subnets: gatewayLab.subnets,
} as const;
export const vlanSwitchCommands = [
  ...switchCommands,
  "show interfaces fastethernet0/1 switchport",
  "show interfaces fastethernet0/24 switchport",
  "show running-config",
];
export const vlanCauses = [...causes, ["access-vlan", "Incorrect access VLAN membership"]] as const;
export const vlanFixes = [
  ["access-vlan", "Assign the affected access port to the intended VLAN"],
  fixes[3],
  fixes[2],
  fixes[4],
] as const;
export const labs = [lab, gatewayLab, vlanLab] as const;
export type PublicLab = (typeof labs)[number];
export function catalog(id: ScenarioId): PublicLab {
  return labs.find((l) => l.id === id)!;
}
export function commandsFor(id: ScenarioId, deviceId: string): string[] {
  const d = catalog(id).devices.find((d) => d.id === deviceId);
  if (!d) return [];
  if (id === "ospf-01") return d.kind === "router" ? routerCommands : pcCommands;
  if (id === "vlan-01" && d.kind === "switch") return vlanSwitchCommands;
  if (id === "vlan-01" && d.id === "PC-A") return [...pcCommands, "arp -a"];
  if (d.kind === "switch") return switchCommands;
  if (d.kind === "router") return gatewayRouterCommands;
  return d.id === "PC-A" ? gatewayPcCommands : ["ipconfig", "ping"];
}
export const gatewayFixes = [
  fixes[3],
  ["restart", "Restart the router processes"],
  ["no-shutdown", "Enable an interface"],
] as const;
export const gatewayReasons = [
  ["dns-resolution", "The gateway translates names into destination IP addresses."],
  [
    "on-link-router",
    "An on-link router can receive off-subnet packets and forward them; local destinations remain direct.",
  ],
  ["switch-routing", "An access switch chooses a new IP route for every remote packet."],
  ["same-address", "Giving the PC its router's own address makes all destinations local."],
] as const;
