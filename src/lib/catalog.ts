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
export const returnLab = {
  id: "return-01",
  number: "004",
  topic: "Routing investigation",
  target: "192.168.20.10",
  title: "The Missing Return Path",
  subtitle: "A conversation takes more than delivery in one direction.",
  incident:
    "PC-A cannot communicate with PC-B. Initial checks suggest that the local network is functioning and the routers are operational. Investigate the network and identify why end-to-end communication fails.",
  design:
    "PC-A–SW1–R1–R2–PC-B. Network A is 192.168.10.0/24, the transit is 10.0.12.0/30, and Network B is 192.168.20.0/24. Hosts use static IPv4 settings. SW1 is an unnumbered access switch; Gi0/1 connects PC-A and Gi0/2 connects R1. Routers use connected and static routes, without OSPF, NAT or ACLs. Inspect the actual configuration and compare observations before proposing a repair.",
  devices: gatewayLab.devices,
  subnets: gatewayLab.subnets,
} as const;
export const returnCauses = [
  ["wrong-gateway", "Incorrect PC gateway"],
  ["missing-route", "Missing destination route"],
  ["interface-down", "An interface is down"],
  ["access-vlan", "Incorrect access VLAN membership"],
] as const;
export const returnFixes = [
  ["gateway", "Change the PC default gateway"],
  ["access-vlan", "Change the access VLAN"],
  ["static-route", "Add a static route on the selected device"],
  ["no-shutdown", "Enable an interface"],
] as const;
export const returnReasons = [
  ["reverse-automatically", "A successful request makes routers automatically reverse its path."],
  ["dns-resolution", "The route translates the destination name into an IP address."],
  [
    "reply-route",
    "Replies have their own destination lookup; the route forwards them toward the original source network.",
  ],
  ["same-address", "The route makes both hosts members of the same local subnet."],
] as const;
export const passiveLab = {
  id: "passive-01",
  number: "005",
  topic: "OSPF neighbor investigation",
  target: "192.168.30.10",
  title: "The Silent OSPF Interface",
  subtitle: "Operational interfaces. An incomplete routing picture.",
  incident:
    "PC-A cannot communicate with PC-B. The routers' interfaces are operational, and the network team reports that OSPF has been configured. Investigate the network and determine why end-to-end connectivity is unavailable.",
  design:
    "PC-A–R1–R2–R3–PC-B. Intended design: one OSPF area 0, explicit point-to-point Ethernet transit links, compatible timers and no authentication. User-facing LAN interfaces are intentionally passive but their networks participate in OSPF. R1–R2 and R2–R3 should form adjacencies. R1 Gi0/1 connects R2 Gi0/0; R2 Gi0/1 connects R3 Gi0/0. No static/default routes, ACLs or NAT are intended. Inspect configuration rather than inferring protocol health from physical links.",
  devices: lab.devices,
  subnets: lab.subnets,
} as const;
export const passiveCauses = [
  ...causes,
  ["passive-interface", "An intended OSPF transit interface is passive"],
] as const;
export const passiveFixes = [
  ["gateway", "Change the PC default gateway"],
  ["no-passive", "Remove passive-interface from the selected router interface"],
  ["static-route", "Add a static route"],
  ["r2-area1", "Change the transit OSPF area"],
  ["timers", "Change the OSPF Hello/Dead intervals"],
  ["no-shutdown", "Enable the transit interface"],
  ["restart", "Restart the OSPF processes"],
] as const;
export const passiveReasons = [
  ["passive-stops-advertising", "Passive always removes the connected network from all OSPF advertisements."],
  [
    "hello-adjacency",
    "Hellos can form the intended adjacency, allowing link-state information exchange and remote route learning.",
  ],
  ["same-address", "The change puts both PCs in the same local subnet."],
  ["reverse-automatically", "A successful request automatically creates all return routes."],
] as const;
export const timerLab = {
  ...passiveLab,
  id: "timer-01",
  number: "006",
  title: "The Mismatched Timers",
  subtitle: "A working link, but no agreement on check-ins.",
  incident:
    "PC-A cannot reach PC-B. Local gateways respond and the network team reports operational router interfaces. Investigate the OSPF relationships and routing information, then support a minimal correction with observations.",
  design:
    "PC-A–R1–R2–R3–PC-B. Intended design: OSPF area 0, explicit point-to-point Ethernet transits, Hello 10 seconds and Dead 40 seconds on all OSPF interfaces, MTU 1500 and no authentication. Only the user-facing LANs are passive. R1 Gi0/1 connects R2 Gi0/0; R2 Gi0/1 connects R3 Gi0/0. No static/default routes, ACLs or NAT are intended. Compare actual configuration with this design.",
} as const;
export const timerReasons = [
  ["timer-compatibility", "Both Hello and Dead intervals agree, permitting the intended adjacency and route exchange."],
  ["same-address", "The change makes both PCs members of the same subnet."],
  ["reverse-automatically", "A successful request automatically installs return routes."],
  ["passive-stops-advertising", "Changing timers removes passive LAN advertisements."],
] as const;
export const nextHopLab = {
  ...lab,
  id: "next-hop-01",
  number: "007",
  topic: "Static forwarding investigation",
  title: "The Wrong Next Hop",
  subtitle: "An entry exists. Does it lead toward the destination?",
  incident:
    "PC-A cannot reach PC-B. The routers are operational and static routes have been configured. Local services respond. Trace the forwarding decisions and compare the actual next hops with the topology before proposing a correction.",
  design:
    "PC-A–R1–R2–R3–PC-B. Networks are 192.168.10.0/24, 10.0.12.0/30, 10.0.23.0/30 and 192.168.30.0/24. Hosts use static addresses and on-link gateways. Routers use connected and specific static routes only, with no OSPF or default route. R1 Gi0/1 connects R2 Gi0/0; R2 Gi0/1 connects R3 Gi0/0. Inspect the interfaces to identify adjacent addresses. No ACLs, NAT or DNS dependency are intended.",
} as const;
export const nextHopCauses = [
  ...returnCauses,
  ["incorrect-static-next-hop", "Incorrect static-route next hop"],
] as const;
export const nextHopFixes = [
  returnFixes[0],
  ["static-route", "Replace the selected destination's static next hop"],
  returnFixes[3],
  ["restart", "Restart the routers"],
] as const;
export const nextHopReasons = [
  [
    "forward-route",
    "The corrected next hop forwards toward the destination instead of back into a loop; replies still need their own routes.",
  ],
  ["reverse-automatically", "A successful request automatically creates every return route."],
  ["dns-resolution", "The static next hop translates a name to an address."],
  ["same-address", "The route puts both PCs in the same local subnet."],
] as const;
export const etherChannelLab = {
  id: "etherchannel-01",
  number: "008",
  topic: "Ethernet aggregation investigation",
  title: "Across the connection",
  subtitle: "Two work areas, one intended logical connection.",
  target: "172.22.40.20",
  incident:
    "PC-A cannot reach PC-B in the other work area. Investigate host addressing, physical connections and the intended logical inter-switch link. Apply a justified configuration change, gather fresh verification and submit your diagnosis.",
  design:
    "PC-A and PC-B share 172.22.40.0/24 in access VLAN 40; no router or default gateway is needed. SW1 and SW2 each have local Port-channel1, with Gi1/0/1 and Gi1/0/2 as the intended LACP members. Gi1/0/3 connects each host. All switch ports are access ports; the intended member speed is 1000 Mb/s, full duplex. Standalone forwarding is explicitly disabled on the port channel. No other inter-switch path exists. This bounded model does not simulate STP, LACP timing or throughput.",
  devices: [
    { id: "PC-A", kind: "pc", role: "West workstation" },
    { id: "SW1", kind: "switch", role: "West access" },
    { id: "SW2", kind: "switch", role: "East access" },
    { id: "PC-B", kind: "pc", role: "East workstation" },
  ],
  subnets: ["172.22.40.0/24", "172.22.40.0/24", "172.22.40.0/24", "172.22.40.0/24"],
  physicalLinks: [
    { source: "PC-A", target: "SW1", label: "Host access · VLAN 40", offset: 0 },
    { source: "SW1", target: "SW2", label: "Gi1/0/1", offset: -30 },
    { source: "SW1", target: "SW2", label: "Gi1/0/2", offset: 30 },
    { source: "SW2", target: "PC-B", label: "Host access · VLAN 40", offset: 0 },
  ],
} as const;
export const etherChannelCommands = [
  "show interfaces status",
  "show vlan brief",
  "show etherchannel summary",
  "show lacp internal",
  "show interfaces port-channel 1",
  "show running-config",
] as const;
export const etherChannelCauses = [
  ["interface-down", "Physical or administrative interface failure"],
  ["access-vlan", "Access VLAN configuration mismatch"],
  ["wrong-gateway", "Host IP configuration problem"],
  ["lacp-negotiation", "LACP negotiation configuration prevents aggregation"],
] as const;
export const etherChannelFixes = [
  ["no-shutdown", "Enable an interface"],
  ["lacp-mode", "Change the selected channel group's LACP mode"],
  ["gateway", "Change a host gateway"],
  ["access-vlan", "Change access VLAN membership"],
] as const;
export const etherChannelReasons = [
  ["physical-equals-logical", "Physical carrier alone guarantees that an aggregate is forwarding."],
  [
    "lacp-initiation",
    "A participant initiates negotiation with a compatible responder; the formed logical link can forward frames.",
  ],
  ["same-address", "Aggregation assigns identical IP addresses to both hosts."],
  ["reverse-automatically", "A successful request creates new IP routes automatically."],
] as const;
export const aclLab = {
  id: "acl-01",
  number: "009",
  topic: "IPv4 policy investigation",
  title: "The closed passage",
  subtitle: "A routed path and a protected work area.",
  target: "172.24.20.10",
  incident:
    "PC-A cannot reach PC-B in the protected work area. Local gateway checks succeed. Investigate the path and access policy, apply a justified change, then verify the result.",
  design:
    "PC-A–R1–R2–PC-B. Office LAN: 172.24.10.0/24; transit: 10.49.0.0/30; protected LAN: 172.24.20.0/24. Static routes are intended in both directions. Forwarded traffic into the protected LAN should be permitted from the office /24 and denied from other sources. Use both permitted and excluded source probes to verify policy. Ordinary outbound ACLs filter transit traffic, not traffic addressed to or originating at that same router. No OSPF, NAT or default routes are intended. Inspect configuration to locate the policy. This lab models standard source filtering, without counters or traceroute.",
  devices: [
    { id: "PC-A", kind: "pc", role: "Office workstation" },
    { id: "R1", kind: "router", role: "Office gateway" },
    { id: "R2", kind: "router", role: "Work area gateway" },
    { id: "PC-B", kind: "pc", role: "Protected workstation" },
  ],
  subnets: ["172.24.10.0/24", "10.49.0.0/30", "172.24.20.0/24"],
} as const;
export const aclCauses = [...returnCauses, ["acl-order", "ACL entry order changes the intended policy"]] as const;
export const aclFixes = [
  ["static-route", "Change a static route"],
  ["acl-sequence", "Change an existing ACL entry's sequence"],
  ["gateway", "Change the host gateway"],
  ["no-shutdown", "Enable an interface"],
] as const;
export const aclReasons = [
  [
    "first-match-policy",
    "The first matching source rule permits intended traffic while the restriction remains effective for other sources.",
  ],
  ["reverse-automatically", "A successful request automatically permits every reply and creates its route."],
  ["same-address", "Changing entry order makes the hosts members of the same subnet."],
  ["dns-resolution", "The policy translates the destination name into an IP address."],
] as const;
export const stpLab = {
  id: "stp-01",
  number: "010",
  topic: "Layer 2 design investigation",
  title: "The unexpected detour",
  subtitle: "Connectivity and an approved switching design.",
  target: "172.26.10.20",
  heading: "Connectivity works. Does the design?",
  incident:
    "PC-A and PC-B can still communicate after maintenance, but the settled switching path no longer matches the approved design. Investigate the physical and logical topology, make a justified correction, and verify the intended tree while retaining all cables.",
  design:
    "One access VLAN 10; 172.26.10.0/24. All cables and ports are intended up at 1 Gb/s/full duplex with short path costs of 4. No router, default gateway or aggregation. SW1 is the distribution switch and must be root with a strictly lower configured bridge priority than SW2 and SW3, without relying on a MAC tie. Host traffic should use SW1–SW3 directly; SW2–SW3 provides redundancy. Only settled STP selection is modeled: no BPDU packets, timers, convergence, trunks, PortFast, guards or full RSTP.",
  devices: [
    { id: "PC-A", kind: "pc", role: "Workstation" },
    { id: "SW1", kind: "switch", role: "Distribution" },
    { id: "SW2", kind: "switch", role: "Access" },
    { id: "SW3", kind: "switch", role: "Access" },
    { id: "PC-B", kind: "pc", role: "Workstation" },
  ],
  subnets: Array(5).fill("172.26.10.0/24") as string[],
  physicalLinks: [
    { source: "PC-A", target: "SW1", label: "Ethernet0 — Gi0/3", offset: 0 },
    { source: "SW1", target: "SW2", label: "Gi0/1 — Gi0/1", offset: 0 },
    { source: "SW1", target: "SW3", label: "Gi0/2 — Gi0/1", offset: 0 },
    { source: "SW2", target: "SW3", label: "Gi0/2 — Gi0/2", offset: 0 },
    { source: "SW3", target: "PC-B", label: "Gi0/3 — Ethernet0", offset: 0 },
  ],
} as const;
export const stpCauses = [
  ["bridge-priority", "Bridge priority does not meet the design"],
  ["interface-down", "A physical interface is down"],
  ["access-vlan", "Access VLAN membership differs"],
  ["wrong-gateway", "The host gateway is incorrect"],
] as const;
export const stpFixes = [
  ["bridge-priority", "Change a bridge priority"],
  ["no-shutdown", "Enable an interface"],
  ["access-vlan", "Change access VLAN membership"],
] as const;
export const stpReasons = [
  ["root-election", "A lower bridge ID selects the root and recomputes the port roles."],
  ["physical-equals-logical", "Every physically connected port must forward data."],
  ["same-address", "Priority changes make the hosts share an IP address."],
] as const;
export const labs = [
  lab,
  gatewayLab,
  vlanLab,
  returnLab,
  passiveLab,
  timerLab,
  nextHopLab,
  etherChannelLab,
  aclLab,
  stpLab,
] as const;
export type PublicLab = (typeof labs)[number];
export function catalog(id: ScenarioId): PublicLab {
  return labs.find((l) => l.id === id)!;
}
export function commandsFor(id: ScenarioId, deviceId: string): string[] {
  const d = catalog(id).devices.find((d) => d.id === deviceId);
  if (!d) return [];
  if (id === "stp-01")
    return d.kind === "switch"
      ? ["show interfaces status", "show vlan brief", "show running-config", "show spanning-tree vlan 10"]
      : ["ipconfig", "ping"];
  if (id === "acl-01")
    return d.kind === "router"
      ? [...gatewayRouterCommands, "show access-lists"]
      : ["ipconfig", "ipconfig /all", "ping"];
  if (id === "etherchannel-01")
    return d.kind === "switch"
      ? [...etherChannelCommands]
      : ["ipconfig", "ipconfig /all", "route print", "ping", "tracert"];
  if (id === "ospf-01") return d.kind === "router" ? routerCommands : pcCommands;
  if (id === "passive-01" || id === "timer-01")
    return d.kind === "router" ? routerCommands : d.id === "PC-A" ? pcCommands : ["ipconfig", "ping"];
  if (id === "return-01" || id === "next-hop-01") {
    if (d.kind === "router") return [...gatewayRouterCommands, "traceroute"];
    if (d.kind === "switch") return [...switchCommands, "show running-config"];
    return d.id === "PC-A" ? pcCommands : ["ipconfig", "ping"];
  }
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
