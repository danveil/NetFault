import "server-only";
import { scenarioSchema } from "@/lib/schema";
import { timerLab } from "@/lib/catalog";
import { threeRouterNetwork } from "./three-router-network";
const network = threeRouterNetwork("timer-01", true);
// Exactly one incompatible timer profile; all other healthy configuration remains unchanged.
Object.assign(network.devices.find((d) => d.id === "R3")!.interfaces[0].ospf!, { hello: 5, dead: 20 });
export const timerScenario = scenarioSchema.parse({
  schemaVersion: 6,
  id: "timer-01",
  revision: 1,
  title: timerLab.title,
  incident: timerLab.incident,
  design: timerLab.design,
  ...network,
  fault: { cause: "timer-mismatch", devices: ["R3"], interface: "R3:Gi0/0" },
  acceptedFixes: ["timers"],
  repair: { device: "R3", interface: "Gi0/0", hello: 10, dead: 40, reason: "timer-compatibility" },
  evidenceRules: [
    {
      label: "R2 transit timer configuration",
      points: 10,
      requirements: [{ devices: ["R2"], commands: ["show ip ospf interface", "show running-config"] }],
    },
    {
      label: "R3 transit timer configuration",
      points: 10,
      requirements: [{ devices: ["R3"], commands: ["show ip ospf interface", "show running-config"] }],
    },
    {
      label: "Missing relationship and routing impact",
      points: 10,
      requirements: [
        { devices: ["R2", "R3"], commands: ["show ip ospf neighbor"] },
        { devices: ["R2", "R3"], commands: ["show ip route"] },
      ],
    },
  ],
  hints: [
    "Compare local gateway and remote probes, then check router addresses and interface up/up state.",
    "Inspect all neighbor tables and routing tables. Which working relationship provides a useful comparison with the absent one?",
    "Compare both endpoints of the missing relationship: area, network type, passive setting, Hello and Dead intervals. One missing neighbor does not establish the cause.",
    "Compare the complete timer profiles with the design's 10/40 requirement. Repair only the interface that deviates; a matching area alone is insufficient.",
  ],
  explanation:
    "R3 Gi0/0 uses Hello 5 / Dead 20 while R2 Gi0/1 uses 10/40. Both interfaces are up, active point-to-point OSPF in area 0, MTU 1500 with no authentication. The unequal Hello/Dead parameters prevent the intended adjacency. R1–R2 remains FULL, but remote LAN routes cannot be exchanged across R2–R3. The design requires 10/40: correct only R3 Gi0/0. Changing R2 to 5/20 could make those neighbors compatible but violates the specified design and is not this lab's accepted repair.",
  solution:
    "R3# configure terminal\nR3(config)# interface Gi0/0\nR3(config-if)# ip ospf hello-interval 10\nR3(config-if)# ip ospf dead-interval 40\nR3(config-if)# end\n\nCompare show ip ospf interface on R2 and R3. Verify reciprocal FULL/- with show ip ospf neighbor. R1 learns 192.168.30.0/24 via 10.0.12.2 [110/3]; R3 learns 192.168.10.0/24 via 10.0.23.1 [110/3]. Ping both PC directions and use tracert. Only the two fields of R3's one timer profile change; areas, LAN passive settings and routes are otherwise derived from the same configuration.",
  lesson: [
    {
      title: "1. Simple explanation",
      text: "OSPF routers send Hello messages to discover and maintain neighbors. The Hello interval says how often to send; the Dead interval says how long a neighbor may go unheard before it is considered unavailable. Neighbors must agree on these parameters. A working cable and IP address do not establish that agreement.",
    },
    {
      title: "2. Analogy — scheduled check-ins",
      text: "Two teams exchange map updates after agreeing on a check-in schedule and an absence deadline. If their schedules disagree, they do not establish the agreed working relationship. Limits: OSPF does not reason about human punctuality. Routers explicitly compare timer fields in received Hello packets; a faster sender is not automatically acceptable to a slower receiver. Real OSPF also has a neighbor state machine and database exchange; this simulator models stable outcomes.",
    },
    {
      title: "3. Technical mechanism",
      text: "OSPFv2 Hello packets include HelloInterval and RouterDeadInterval. On these ordinary point-to-point interfaces, both values must agree with the receiving interface configuration, along with the other required compatibility parameters. A mismatch prevents establishment; it is not simply a slower convergence choice. If an established neighbor later stops supplying Hellos, its Dead timer expires. Those are distinct situations. The local OSPF process ID need not match; router IDs must be unique. Ethernet transits explicitly use point-to-point, so no DR/BDR election is modeled. Passive LANs remain advertised but do not send Hellos. NetFault derives established adjacency and shortest paths without running a real Hello clock or LSDB flood. Its displayed remaining Dead Time is a bounded representative snapshot, not a measured countdown.",
    },
    {
      title: "4. Worked LAB 006 example",
      text: "PC-A 192.168.10.10/24 uses R1 192.168.10.1. R1 10.0.12.1 and R2 10.0.12.2 agree on area 0 and 10/40 and form FULL/-. R2 Gi0/1 is 10.0.23.1/30 with 10/40; R3 Gi0/0 is 10.0.23.2/30 with 5/20. A directly connected ping works despite missing OSPF adjacency. R1 can learn 10.0.23.0/30 from R2 at cost 2, but cannot learn PC-B's 192.168.30.0/24 across the absent relationship. PC-A's remote request lacks a destination route at R1; R3 also lacks PC-A's LAN. Set R3 Gi0/0 hello-interval 10 and dead-interval 40. After modeled convergence the remote LAN routes have cost 3 and both PC pings succeed. Do not change the correct passive LAN interfaces.",
    },
    {
      title: "5. Guided troubleshooting",
      text: "Use ipconfig on each PC and compare gateway and remote pings. show ip interface brief establishes physical/IP state; show ip ospf neighbor localizes the absent relationship without proving its cause. Compare show ip ospf interface at BOTH ends: it shows address, area, type, passive behavior and timers. show running-config confirms the timer commands; show ip protocols checks participating and passive interfaces. Pair those observations with show ip route to establish the missing remote routes. Select both endpoint timer outputs plus neighbor and routing context as evidence. Router ping source changes the required reply route: a connected peer ping is not proof of remote LAN reachability. tracert reports only returning hop responses in this bounded simulator. Predict the minimal correction, submit, then inspect the actual repaired preview.",
    },
    {
      title: "6. Independent practice",
      text: "Elm Gi0/2 (172.18.6.1/30) and Fir Gi0/0 (172.18.6.2/30) are up, active point-to-point in area 0, MTU 1500, no authentication and unique router IDs. The site design requires Hello 2 / Dead 8. Elm reports 2/8, Fir reports 2/10. Connected pings work, neighbors are absent and remote LAN routes are missing. Identify the mismatched field and interface. Does matching only Hello suffice? Write the minimal configuration and predict neighbors, LAN routes and both host pings before revealing the solution.",
    },
    {
      title: "7. Independent exercise solution",
      revealOnRequest: true,
      text: "Fir Gi0/0 has the incorrect Dead interval. Under interface Gi0/0, set ip ospf dead-interval 8; retain Hello 2. Both Hello and Dead must agree, so matching Hello alone is insufficient. The 2/8 design identifies the intended endpoint and correction. Verify both endpoint timer views, reciprocal FULL, remote LAN routes and bidirectional probes. An area change or removing a correct LAN passive setting would not repair the observed timer mismatch.",
    },
  ],
});
