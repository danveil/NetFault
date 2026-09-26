import "server-only";
import { scenarioSchema } from "@/lib/schema";
import { hsrpLab as lab, commandsFor } from "@/lib/catalog";

const intf = (name: string, ip: string, prefix: number, mac: string) => ({ name, ip, prefix, mac, up: true });
const route = (network: string, prefix: number, nextHop: string) => ({ network, prefix, nextHop });
const configs = {
  "PC-A": { gateway: "172.28.10.1", interfaces: [intf("Ethernet0", "172.28.10.10", 24, "0200.0000.00a1")] },
  SW1: {
    interfaces: [],
    vlans: [{ id: 10, name: "Clients", active: true }],
    ports: [1, 2, 3].map((n) => ({ name: `Gi0/${n}`, vlan: 10, up: true, speed: 1000, duplex: "full" })),
  },
  R1: {
    routerId: "1.1.1.1",
    interfaces: [
      {
        ...intf("Gi0/0", "172.28.10.2", 24, "0200.0000.1101"),
        hsrp: { version: 2, group: 11, virtualIp: "172.28.10.1", priority: 90, preempt: true },
      },
      intf("Gi0/1", "10.0.13.1", 30, "0200.0000.1102"),
    ],
    staticRoutes: [route("172.28.20.0", 24, "10.0.13.2"), route("10.0.23.0", 30, "10.0.13.2")],
  },
  R2: {
    routerId: "2.2.2.2",
    interfaces: [
      {
        ...intf("Gi0/0", "172.28.10.3", 24, "0200.0000.1201"),
        hsrp: { version: 2, group: 11, virtualIp: "172.28.10.1", preempt: true },
      },
      intf("Gi0/1", "10.0.23.1", 30, "0200.0000.1202"),
    ],
    staticRoutes: [route("172.28.20.0", 24, "10.0.23.2"), route("10.0.13.0", 30, "10.0.23.2")],
  },
  R3: {
    routerId: "3.3.3.3",
    interfaces: [
      intf("Gi0/0", "10.0.13.2", 30, "0200.0000.1301"),
      intf("Gi0/1", "10.0.23.2", 30, "0200.0000.1302"),
      intf("Gi0/2", "172.28.20.1", 24, "0200.0000.1303"),
    ],
    staticRoutes: [route("172.28.10.0", 24, "10.0.13.1")],
  },
  "PC-B": { gateway: "172.28.20.1", interfaces: [intf("Ethernet0", "172.28.20.10", 24, "0200.0000.00b1")] },
};
export const hsrpScenario = scenarioSchema.parse({
  schemaVersion: 10,
  id: lab.id,
  revision: 1,
  title: lab.title,
  incident: lab.incident,
  design: lab.design,
  devices: lab.devices.map((d) => ({ ...d, ...configs[d.id], commands: commandsFor(lab.id, d.id) })),
  links: [
    ["client", "PC-A", "Ethernet0", "SW1", "Gi0/1", "172.28.10.0/24"],
    ["member-a", "SW1", "Gi0/2", "R1", "Gi0/0", "172.28.10.0/24"],
    ["member-b", "SW1", "Gi0/3", "R2", "Gi0/0", "172.28.10.0/24"],
    ["uplink-a", "R1", "Gi0/1", "R3", "Gi0/0", "10.0.13.0/30"],
    ["uplink-b", "R2", "Gi0/1", "R3", "Gi0/1", "10.0.23.0/30"],
    ["remote", "R3", "Gi0/2", "PC-B", "Ethernet0", "172.28.20.0/24"],
  ].map(([id, a, ai, b, bi, subnet]) => ({
    id,
    a: { device: a, interface: ai },
    b: { device: b, interface: bi },
    subnet,
  })),
  fault: { cause: "hsrp-priority", devices: ["R1"], interface: "R1:Gi0/0" },
  acceptedFixes: ["hsrp-priority"],
  repair: {
    kind: "hsrp-priority",
    device: "R1",
    interface: "Gi0/0",
    group: 11,
    priority: 150,
    reason: "virtual-owner",
  },
  evidenceRules: [
    {
      label: "Original complementary member roles",
      points: 15,
      requirements: ["R1", "R2"].map((d) => ({ devices: [d], commands: ["show standby brief"] })),
    },
    {
      label: "Original priority and preemption configuration",
      points: 10,
      requirements: ["R1", "R2"].map((d) => ({ devices: [d], commands: ["show running-config"] })),
    },
    {
      label: "Original client virtual gateway",
      points: 5,
      requirements: [{ devices: ["PC-A"], commands: ["ipconfig", "ipconfig /all", "route print"] }],
    },
  ],
  hints: [
    "Separate the shared gateway identity from the physical router addresses. Compare the client configuration with the approved design.",
    "Inspect both members' roles. Working connectivity does not identify which router serves the virtual gateway.",
    "Compare both priorities and preemption settings. An omitted HSRP priority has a default value; consult the preparation concepts.",
    "Preserve the approved fallback configuration. Test a strict preference on the intended primary, then gather complementary roles, configuration, virtual resolution and reciprocal delivery again.",
  ],
  explanation:
    "R1's configured priority is 90 while R2 uses default 100. Both use HSRPv2 group 11, virtual IP 172.28.10.1 and preemption. R2 therefore owns the virtual gateway in settled state. Connectivity succeeds, but the approved design requires R1 as preferred Active. R1's priority is the sole design defect.",
  solution:
    "On R1 Gi0/0: standby 11 priority 150. Any integer 101–255 works with R2 unchanged at default 100. Keep version 2, group 11, VIP 172.28.10.1, preemption, all routes and host gateways. R1 becomes Active and R2 Standby. Select fresh brief views on both routers, R1 running-config, PC-A ping to 172.28.10.1, PC-A arp -a after that probe, PC-A ping to 172.28.20.10 and PC-B ping to 172.28.10.10. These verify settled design, not failover under failure.",
  lesson: [
    {
      title: "1 · Simple explanation",
      text: "A default gateway accepts packets for remote networks. HSRP lets two routers provide one virtual gateway identity, with one Active forwarder and one Standby. A working gateway can still be served by a different router from the approved design.",
    },
    {
      title: "2 · Analogy and limits",
      text: "Think of one service-desk number staffed by a primary worker or a backup. Customers keep the same number. The analogy stops at identity and responsibility: routers resolve an IPv4 address to a virtual MAC and forward unchanged IP packets using routes. No receptionist rewrites the destination, and successful service does not prove takeover timing.",
    },
    {
      title: "3 · Technical mechanism",
      text: "PC-A keeps 172.28.10.1 as its gateway. R1/R2 retain physical 172.28.10.2/.3. ARP for the VIP maps to group 11's HSRPv2 MAC 0000.0c9f.f00b; the Active router processes those frames. With preemption explicitly enabled and unequal priorities, this settled model selects the higher priority. Real incumbency without preemption and equal-priority history are outside this model. HSRP creates no routes.",
    },
    {
      title: "4 · Worked configuration",
      text: "Initial R1: standby version 2; standby 11 ip 172.28.10.1; standby 11 priority 90; standby 11 preempt. R2 omits priority, so uses 100. On R1: configure terminal → interface Gi0/0 → standby 11 priority 150 → end. Both preempt lines, the shared VIP and physical addresses remain. show standby brief now gives R1 Active and R2 Standby, with a stable virtual MAC.",
    },
    {
      title: "5 · Symptoms and command reasoning",
      text: "ipconfig and route print show the host's correct VIP; switch status/VLAN and interface brief show the physical LAN. Both brief views establish roles, group, priority and VIP; running-config establishes configured priority or default and preemption. Initial PC-A traffic enters R2 then R3. Corrected traffic enters R1 then R3. In both states R3's fixed return route uses R1; Standby R1 can still route ordinary physical-interface traffic. Route tables, reciprocal pings and trace test independent routing. VIP ping plus ARP proves virtual resolution, but the unchanged MAC alone cannot identify Active. Actual R1 failure could break this fixed return path: this is not an end-to-end failover test.",
    },
    {
      title: "6 · Guided practice",
      text: "Predict the result of R1 priority 120 with R2 still 100 and both preempt enabled: settled roles satisfy the preference without changing the host gateway. Applying the edit alone is not verification. Gather both member views, primary configuration, VIP probe and ARP, and reciprocal remote pings after the latest edit. Earlier outputs remain historical evidence, not proof of the new state.",
    },
    {
      title: "7 · Independent exercise",
      text: "In a different network, routers Cedar and Pine share 198.51.100.1 in group 23, with priorities 180 and 130 and preemption enabled. Cedar is intended primary. Which member should own the gateway? If the Active router loses its upstream route while its LAN stays up, does HSRP repair the route? State the observations needed to distinguish roles from end-to-end delivery.",
    },
    {
      title: "Independent exercise solution",
      revealOnRequest: true,
      text: "Cedar is Active and Pine Standby in this unequal-priority preempt-enabled settled case. Losing an upstream route does not change LAN eligibility in this model and HSRP creates no route. Compare both role/configuration views, host gateway and ARP, upstream and return routes, and reciprocal probes. This establishes settled state and delivery, not timed failover competence.",
    },
  ],
});
