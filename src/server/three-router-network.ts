import "server-only";
import { commandsFor } from "@/lib/catalog";
import { deviceSchema, type ScenarioId } from "@/lib/schema";
import { intf } from "./scenario";

// Healthy addressing fixture for the newly authorized three-router cases, not a faulted pack clone.
export function threeRouterNetwork(id: ScenarioId, ospf: boolean) {
  const port = (name: string, ip: string, prefix: number, n: number, lan = false) => {
    const i = intf(name, ip, prefix, n, ospf ? 0 : undefined, lan);
    if (i.ospf) i.ospf.authentication = "none";
    return i;
  };
  const devices = [
    {
      id: "PC-A",
      kind: "pc",
      role: "Student lab",
      gateway: "192.168.10.1",
      interfaces: [intf("Ethernet0", "192.168.10.10", 24, 1)],
      commands: commandsFor(id, "PC-A"),
    },
    {
      id: "R1",
      kind: "router",
      role: "West gateway",
      routerId: "1.1.1.1",
      interfaces: [port("Gi0/0", "192.168.10.1", 24, 2, true), port("Gi0/1", "10.0.12.1", 30, 3)],
      commands: commandsFor(id, "R1"),
    },
    {
      id: "R2",
      kind: "router",
      role: "Campus core",
      routerId: "2.2.2.2",
      interfaces: [port("Gi0/0", "10.0.12.2", 30, 4), port("Gi0/1", "10.0.23.1", 30, 5)],
      commands: commandsFor(id, "R2"),
    },
    {
      id: "R3",
      kind: "router",
      role: "East gateway",
      routerId: "3.3.3.3",
      interfaces: [port("Gi0/0", "10.0.23.2", 30, 6), port("Gi0/1", "192.168.30.1", 24, 7, true)],
      commands: commandsFor(id, "R3"),
    },
    {
      id: "PC-B",
      kind: "pc",
      role: "Research lab",
      gateway: "192.168.30.1",
      interfaces: [intf("Ethernet0", "192.168.30.10", 24, 8)],
      commands: commandsFor(id, "PC-B"),
    },
  ].map((d) => deviceSchema.parse(d));
  const links = [
    {
      id: "l1",
      a: { device: "PC-A", interface: "Ethernet0" },
      b: { device: "R1", interface: "Gi0/0" },
      subnet: "192.168.10.0/24",
    },
    {
      id: "l2",
      a: { device: "R1", interface: "Gi0/1" },
      b: { device: "R2", interface: "Gi0/0" },
      subnet: "10.0.12.0/30",
    },
    {
      id: "l3",
      a: { device: "R2", interface: "Gi0/1" },
      b: { device: "R3", interface: "Gi0/0" },
      subnet: "10.0.23.0/30",
    },
    {
      id: "l4",
      a: { device: "R3", interface: "Gi0/1" },
      b: { device: "PC-B", interface: "Ethernet0" },
      subnet: "192.168.30.0/24",
    },
  ];
  return { devices, links };
}
