import "server-only";
import { scenarioSchema, type Interface } from "@/lib/schema";
import { lab, routerCommands, pcCommands } from "@/lib/catalog";
const intf = (name: string, ip: string, prefix: number, n: number, area?: number, passive = false): Interface => ({
  name,
  ip,
  prefix,
  up: true,
  mac: `02:00:00:00:00:${n.toString(16).padStart(2, "0")}`,
  ...(area === undefined
    ? {}
    : {
        ospf: {
          area,
          passive,
          networkType: passive ? "broadcast" : "point-to-point",
          cost: 1,
          hello: 10,
          dead: 40,
          mtu: 1500,
        },
      }),
});
export const scenario = scenarioSchema.parse({
  schemaVersion: 1,
  id: "ospf-01",
  revision: 1,
  title: lab.title,
  incident: lab.incident,
  design: lab.design,
  devices: [
    {
      id: "PC-A",
      kind: "pc",
      role: "Student lab",
      gateway: "192.168.10.1",
      commands: pcCommands,
      interfaces: [intf("Ethernet0", "192.168.10.10", 24, 1)],
    },
    {
      id: "R1",
      kind: "router",
      role: "West gateway",
      routerId: "1.1.1.1",
      commands: routerCommands,
      interfaces: [intf("Gi0/0", "192.168.10.1", 24, 2, 0, true), intf("Gi0/1", "10.0.12.1", 30, 3, 0)],
    },
    {
      id: "R2",
      kind: "router",
      role: "Campus core",
      routerId: "2.2.2.2",
      commands: routerCommands,
      interfaces: [intf("Gi0/0", "10.0.12.2", 30, 4, 0), intf("Gi0/1", "10.0.23.1", 30, 5, 0)],
    },
    {
      id: "R3",
      kind: "router",
      role: "East gateway",
      routerId: "3.3.3.3",
      commands: routerCommands,
      interfaces: [intf("Gi0/0", "10.0.23.2", 30, 6, 1), intf("Gi0/1", "192.168.30.1", 24, 7, 0, true)],
    },
    {
      id: "PC-B",
      kind: "pc",
      role: "Research lab",
      gateway: "192.168.30.1",
      commands: pcCommands,
      interfaces: [intf("Ethernet0", "192.168.30.10", 24, 8)],
    },
  ],
  links: [
    {
      id: "l1",
      a: { device: "PC-A", interface: "Ethernet0" },
      b: { device: "R1", interface: "Gi0/0" },
      subnet: lab.subnets[0],
    },
    {
      id: "l2",
      a: { device: "R1", interface: "Gi0/1" },
      b: { device: "R2", interface: "Gi0/0" },
      subnet: lab.subnets[1],
    },
    {
      id: "l3",
      a: { device: "R2", interface: "Gi0/1" },
      b: { device: "R3", interface: "Gi0/0" },
      subnet: lab.subnets[2],
    },
    {
      id: "l4",
      a: { device: "R3", interface: "Gi0/1" },
      b: { device: "PC-B", interface: "Ethernet0" },
      subnet: lab.subnets[3],
    },
  ],
  fault: { cause: "area-mismatch", devices: ["R2", "R3"], interface: "R3:Gi0/0" },
  acceptedFixes: ["r3-area0"],
  repair: { device: "R3", interface: "Gi0/0", area: 0 },
  evidenceRules: [
    {
      label: "R2 interface area",
      points: 10,
      requirements: [{ devices: ["R2"], commands: ["show ip ospf interface", "show running-config"] }],
    },
    {
      label: "R3 interface area",
      points: 10,
      requirements: [{ devices: ["R3"], commands: ["show ip ospf interface", "show running-config"] }],
    },
    {
      label: "Neighbor and route impact",
      points: 10,
      requirements: [
        { devices: ["R2", "R3"], commands: ["show ip ospf neighbor"] },
        { devices: ["R1", "R2"], commands: ["show ip route"] },
      ],
    },
  ],
  hints: [
    "Begin at PC-A. Check its address and gateway, then compare a gateway ping with a ping to 192.168.30.10.",
    "Check interface state and OSPF neighbors on each router. Does every physically connected router appear as a FULL neighbor?",
    "Compare show ip ospf interface on R2 and R3 for the 10.0.23.0/30 link. Both ends need the same area; the design requires area 0.",
  ],
  explanation:
    "R2 Gi0/1 uses area 0, but R3 Gi0/0 uses area 1. OSPF packets on this link fail the area check, so no neighbor adjacency forms. R1 and R2 are FULL/- on the explicit point-to-point link. Physical interfaces are up. R1 learns the 10.0.23.0/30 transit subnet from R2, but neither R1 nor R2 learns 192.168.30.0/24. R3 lacks a return route to 192.168.10.0/24. A directly connected R2-to-R3 ping can succeed despite failed OSPF.",
  solution:
    "R3# configure terminal\nR3(config)# interface GigabitEthernet0/0\nR3(config-if)# ip ospf 1 area 0\nR3(config-if)# end\nR3# show ip ospf neighbor\nR3# show ip route\nPC-A> ping 192.168.30.10\n\nThe interface-level area command replaces the old area assignment. After convergence, verify FULL/- between R2 and R3, an O route to the remote LAN on R1 and R3, and successful end-to-end ping in both directions. No process restart is required. Persist the verified configuration with copy running-config startup-config (example only; this simulator does not execute IOS configuration commands).",
});
