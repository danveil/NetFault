import "server-only";
import { scenarioSchema } from "@/lib/schema";
import { stpLab as lab, commandsFor } from "@/lib/catalog";

export const stpScenario = scenarioSchema.parse({
  schemaVersion: 9,
  id: lab.id,
  revision: 1,
  title: lab.title,
  incident: lab.incident,
  design: lab.design,
  devices: lab.devices.map((d) =>
    d.kind === "pc"
      ? {
          ...d,
          commands: commandsFor(lab.id, d.id),
          interfaces: [
            {
              name: "Ethernet0",
              ip: d.id === "PC-A" ? "172.26.10.10" : "172.26.10.20",
              prefix: 24,
              up: true,
              mac: d.id === "PC-A" ? "0200.0000.00a1" : "0200.0000.00b1",
            },
          ],
        }
      : {
          ...d,
          commands: commandsFor(lab.id, d.id),
          interfaces: [],
          stp: {
            vlan: 10,
            priority: d.id === "SW1" ? 40960 : 32768,
            mac: `0200.0000.00${d.id.slice(-1)}0`,
            costMethod: "short",
          },
          vlans: [{ id: 10, name: "Workstations", active: true }],
          ports: [1, 2, ...(d.id !== "SW2" ? [3] : [])].map((n) => ({
            name: `Gi0/${n}`,
            vlan: 10,
            up: true,
            speed: 1000,
            duplex: "full",
            stp: { number: n, cost: 4, priority: 128 },
          })),
        },
  ),
  links: [
    ["host-a", "PC-A", "Ethernet0", "SW1", "Gi0/3"],
    ["sw12", "SW1", "Gi0/1", "SW2", "Gi0/1"],
    ["sw13", "SW1", "Gi0/2", "SW3", "Gi0/1"],
    ["sw23", "SW2", "Gi0/2", "SW3", "Gi0/2"],
    ["host-b", "SW3", "Gi0/3", "PC-B", "Ethernet0"],
  ].map(([id, a, ai, b, bi]) => ({
    id,
    a: { device: a, interface: ai },
    b: { device: b, interface: bi },
    subnet: "172.26.10.0/24",
    up: true,
  })),
  stpDesign: { root: "SW1", vlan: 10, edges: ["sw12", "sw13"] },
  fault: { cause: "bridge-priority", devices: ["SW1"], interface: "SW1:VLAN10" },
  acceptedFixes: ["bridge-priority"],
  repair: { device: "SW1", vlan: 10, priority: 24576, reason: "root-election" },
  evidenceRules: [
    {
      label: "Original root, bridge IDs and port roles on all switches",
      points: 20,
      requirements: ["SW1", "SW2", "SW3"].map((d) => ({ devices: [d], commands: ["show spanning-tree vlan 10"] })),
    },
    {
      label: "Original preferred bridge configuration",
      points: 10,
      requirements: [{ devices: ["SW1"], commands: ["show running-config"] }],
    },
  ],
  hints: [
    "Separate the approved switching design from basic connectivity. A successful ping cannot identify the selected tree.",
    "Compare the root ID and local bridge ID on every switch. Combine port roles with the physical cabling.",
    "Compare configured base priorities, then MAC identities on a tie. The VLAN extended ID is not the configurable base priority.",
    "Consider lowering the preferred bridge's priority while preserving every cable. After applying, inspect all roles and repeat both host probes.",
  ],
  explanation:
    "The tree is loop-free and connectivity works, but SW2 wins the initial election. SW1 has base priority 40960; SW2 and SW3 use 32768, and SW2 wins their MAC tie. SW1's direct port toward SW3 blocks, so host frames go via SW2. The design requires SW1 to have strictly lower base priority than the other switches.",
  solution:
    "On SW1: spanning-tree vlan 10 priority 24576. Any valid base priority from 0 through 28672 meets the strict preference with the other bridges unchanged. SW1 becomes root; SW3 Gi0/2 blocks instead of SW1 Gi0/2. Keep all five cables and all VLAN/port settings. Select fresh STP outputs on SW1, SW2 and SW3, SW1 running-config, and reciprocal host pings. A value of 32768 elects SW1 by MAC but fails the required strict priority preference.",
  lesson: [
    {
      title: "1 · Simple explanation",
      text: "STP selects a loop-free set of Layer 2 paths while leaving spare cables connected. A valid tree can still differ from the network team's intended tree. Priority helps choose the root; it does not assign an IP gateway.",
    },
    {
      title: "2 · Analogy and limits",
      text: "Imagine roads retained for redundancy, with some entrances closed to ordinary traffic. A planning reference determines the open routes. Switches actually compare control information, not road signs; blocked ports can still participate in STP control. This simulator calculates only the settled result, not those exchanges or elapsed convergence.",
    },
    {
      title: "3 · Technical mechanism",
      text: "Compare effective bridge priority (base plus VLAN system ID) then numeric bridge MAC. Each non-root chooses minimum total receiving-port cost toward root, resolving equal costs by upstream bridge ID in this simple graph. Each segment's designated bridge advertises lower root cost, then lower BID. Root and designated ports forward; the redundant alternate port blocks data in both directions.",
    },
    {
      title: "4 · Worked configuration and arithmetic",
      text: "Initially SW1's effective priority is 40970; SW2/SW3 have 32778. SW2's MAC 0200.0000.0020 beats SW3's 0200.0000.0030. SW1 and SW3 both have root cost 4; SW3 wins designation on their shared edge. After SW1 base priority 24576 (effective 24586), SW2 and SW3 have root cost 4 and SW2 wins their shared-edge MAC tie. Equivalent CLI: configure terminal → spanning-tree vlan 10 priority 24576 → end.",
    },
    {
      title: "5 · Symptom and diagnostic reasoning",
      text: "Initial data path: PC-A → SW1 → SW2 → SW3 → PC-B. Corrected path: PC-A → SW1 → SW3 → PC-B. No latency was measured. Interfaces status proves physical carrier; VLAN output proves membership; running-config shows configured base priority; spanning-tree output shows elected identity, cost and roles. Ping verifies request and reply delivery, which succeeds before and after. IP traceroute cannot reveal these Layer 2 switch hops.",
    },
    {
      title: "6 · Guided practice",
      text: "With SW1 root and all switch costs 4, identify the root ports: SW2 Gi0/1 and SW3 Gi0/1. On the SW2–SW3 segment both advertise cost 4. Their priorities match, so compare bridge MACs: SW2 is designated; SW3 Gi0/2 is alternate/blocking. The physical cable remains connected.",
    },
    {
      title: "7 · Independent exercise",
      text: "Different case: bridges A/B/C have base priorities 8192/16384/16384 in one VLAN. A–B costs 4, B–C costs 4, and C's port toward A costs 12. Which bridge is root, and which C port is root? What would changing C's direct cost to 8 do? Explain why a successful ping does not prove the planned tree.",
    },
    {
      title: "Independent exercise solution",
      revealOnRequest: true,
      text: "A is root by priority. C initially chooses B at total cost 8 instead of direct cost 12. At direct cost 8 the tie favors sender A's superior BID, so C chooses the direct A port. Cost changes do not elect a different root. Ping alone confirms delivery, not the design requirement; inspect root/roles and retained cabling.",
    },
  ],
});
