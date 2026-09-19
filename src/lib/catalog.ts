// Only public incident and choices. No answer key, config, hints or grading rules.
export const lab = {
  id: "ospf-01",
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
