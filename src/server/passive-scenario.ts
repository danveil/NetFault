import "server-only";
import { scenarioSchema, type Interface } from "@/lib/schema";
import { passiveLab, commandsFor } from "@/lib/catalog";
import { intf } from "./scenario";

// Passive is independent of network type: the silent transit remains explicitly point-to-point.
const ospf = (
  name: string,
  ip: string,
  prefix: number,
  n: number,
  passive = false,
  networkType: "point-to-point" | "broadcast" = "point-to-point",
): Interface => {
  const i = intf(name, ip, prefix, n, 0);
  return { ...i, ospf: { ...i.ospf!, passive, networkType, authentication: "none" } };
};
export const passiveScenario = scenarioSchema.parse({
  schemaVersion: 5,
  id: "passive-01",
  revision: 1,
  title: passiveLab.title,
  incident: passiveLab.incident,
  design: passiveLab.design,
  devices: [
    {
      id: "PC-A",
      kind: "pc",
      role: "Student lab",
      gateway: "192.168.10.1",
      commands: commandsFor("passive-01", "PC-A"),
      interfaces: [intf("Ethernet0", "192.168.10.10", 24, 1)],
    },
    {
      id: "R1",
      kind: "router",
      role: "West gateway",
      routerId: "1.1.1.1",
      commands: commandsFor("passive-01", "R1"),
      interfaces: [ospf("Gi0/0", "192.168.10.1", 24, 2, true, "broadcast"), ospf("Gi0/1", "10.0.12.1", 30, 3)],
    },
    {
      id: "R2",
      kind: "router",
      role: "Campus core",
      routerId: "2.2.2.2",
      commands: commandsFor("passive-01", "R2"),
      interfaces: [ospf("Gi0/0", "10.0.12.2", 30, 4), ospf("Gi0/1", "10.0.23.1", 30, 5, true)],
    },
    {
      id: "R3",
      kind: "router",
      role: "East gateway",
      routerId: "3.3.3.3",
      commands: commandsFor("passive-01", "R3"),
      interfaces: [ospf("Gi0/0", "10.0.23.2", 30, 6), ospf("Gi0/1", "192.168.30.1", 24, 7, true, "broadcast")],
    },
    {
      id: "PC-B",
      kind: "pc",
      role: "Research lab",
      gateway: "192.168.30.1",
      commands: commandsFor("passive-01", "PC-B"),
      interfaces: [intf("Ethernet0", "192.168.30.10", 24, 8)],
    },
  ],
  links: [
    {
      id: "p1",
      a: { device: "PC-A", interface: "Ethernet0" },
      b: { device: "R1", interface: "Gi0/0" },
      subnet: "192.168.10.0/24",
    },
    {
      id: "p2",
      a: { device: "R1", interface: "Gi0/1" },
      b: { device: "R2", interface: "Gi0/0" },
      subnet: "10.0.12.0/30",
    },
    {
      id: "p3",
      a: { device: "R2", interface: "Gi0/1" },
      b: { device: "R3", interface: "Gi0/0" },
      subnet: "10.0.23.0/30",
    },
    {
      id: "p4",
      a: { device: "R3", interface: "Gi0/1" },
      b: { device: "PC-B", interface: "Ethernet0" },
      subnet: "192.168.30.0/24",
    },
  ],
  fault: { cause: "passive-interface", devices: ["R2"], interface: "R2:Gi0/1" },
  acceptedFixes: ["no-passive"],
  repair: { device: "R2", interface: "Gi0/1", passive: false, reason: "hello-adjacency" },
  evidenceRules: [
    {
      label: "R2's explicit OSPF passive setting",
      points: 20,
      requirements: [
        { devices: ["R2"], commands: ["show running-config", "show ip protocols", "show ip ospf interface"] },
      ],
    },
    {
      label: "Operational interface with missing adjacency and routing impact",
      points: 10,
      requirements: [
        { devices: ["R2"], commands: ["show ip interface brief", "show ip ospf interface"] },
        { devices: ["R2"], commands: ["show ip ospf neighbor"] },
        { devices: ["R2", "R3"], commands: ["show ip route"] },
      ],
    },
  ],
  hints: [
    "Check both hosts' IP settings, compare local and remote pings, and inspect whether the physical interfaces are up. Separate local delivery from routing information.",
    "Use show ip ospf neighbor on all routers. Which intended relationships are established, and which are missing? Missing neighbors alone do not identify the cause.",
    "Compare both ends of the router-to-router link with show ip ospf interface, show ip protocols and show running-config. Check area, network type, timers and whether Hellos are enabled.",
    "Look for an OSPF setting that suppresses Hello transmission on an intended transit interface. Keep the useful passive settings on user-facing LANs; target only the incorrect transit setting.",
  ],
  explanation:
    "R2 Gi0/1 is physically up and in area 0, but is configured as an OSPF passive interface. It sends no Hellos, so R2 and R3 cannot form their intended adjacency. R1–R2 remains FULL/-. R2 can still advertise 10.0.23.0/30 through R1's working adjacency: passive does not remove this OSPF-enabled connected subnet from the domain. R2 cannot learn PC-B's LAN through R3, and R3 cannot learn PC-A's LAN. Matching areas, timers and addressing distinguish this fault from LAB 001's area mismatch. Only remove R2's transit passive setting; leave the intentional LAN settings intact.",
  solution:
    "R2# configure terminal\nR2(config)# router ospf 1\nR2(config-router)# no passive-interface Gi0/1\nR2(config-router)# end\n\nR2# show ip interface brief\nR2# show ip ospf interface\nR2# show ip ospf neighbor\nR3# show ip ospf neighbor\nR1# show ip route\nR3# show ip route\nPC-A> ping 192.168.30.10\nPC-B> ping 192.168.10.10\n\nExpected after modeled convergence: R2 Gi0/1 remains up/up with Hellos enabled; R2–R3 becomes FULL/-. R1 learns 192.168.30.0/24 via 10.0.12.2 at cost 3; R3 learns 192.168.10.0/24 via 10.0.23.1 at cost 3. Both host pings succeed. R1 Gi0/0 and R3 Gi0/1 remain passive. No area, timer, IP, static/default route or gateway changes are needed. Commands above are worked IOS-style examples; the simulator applies only the structured repair to a cloned state.",
  lesson: [
    {
      title: "1. Simple explanation",
      text: "OSPF lets routers share information about which networks they can reach. Neighboring routers first establish a relationship so they can exchange that information. Hello messages help them discover and maintain neighbors. A passive interface is told not to send those Hellos. Here the cable and IP interface work, but R2 stays silent on its link to R3, so the expected relationship never forms. Ordinary IP traffic can still cross that connected link.",
    },
    {
      title: "2. Analogy — university departments",
      text: "Think of R1, R2 and R3 as departments sharing maps of university facilities. R1 and R2 meet regularly. R2's office and phone line to R3 work, but a rule forbids introductions on that channel. They never start their scheduled map exchange. R2 can still tell R1 that the corridor toward R3 exists, without knowing the facilities beyond R3. Limits: Hello packets are not social invitations; OSPF has a defined neighbor state machine, reliable database exchange and shortest-path calculations. Advertising a corridor is not the same as forming a relationship across it, and routers forward each data packet using its destination address.",
    },
    {
      title: "3. Technical mechanism",
      text: "OSPF is a link-state interior routing protocol. Compatible routers discover neighbors using Hellos, establish required adjacencies and exchange link-state advertisements (LSAs). Each router calculates shortest paths from the information available in its area. This lab uses explicit point-to-point transit interfaces: no DR/BDR election is needed. All areas are 0, timers 10/40, MTUs 1500, authentication absent and router IDs unique. Process 1 is a local identifier; adjacent routers need not use the same process ID. A passive OSPF-enabled interface sends no Hellos and does not form a neighbor relationship there. Its connected network can still appear as a stub link in that router's area advertisements through other working adjacencies. That does not mean a stub area was configured. Passive LAN interfaces avoid unnecessary Hellos and unintended neighbors where only PCs should connect while retaining LAN advertisement. On a transit that needs an adjacency, the same setting prevents route exchange. In an area mismatch, active routers use incompatible area identifiers; here both ends use area 0 and R2's Hello suppression is the observable difference. A physically up interface alone proves neither adjacency nor remote route knowledge. The simulator derives stable FULL adjacencies and routes, not transient neighbor states or packet-by-packet LSA flooding.",
    },
    {
      title: "4. Worked LAB 005 example",
      text: "1) R1 1.1.1.1 and R2 2.2.2.2 form FULL/- across 10.0.12.0/30. 2) R2 Gi0/1 at 10.0.23.1/30 is up/up. 3) Its process configuration marks Gi0/1 passive. 4) No OSPF Hellos leave that interface. 5) R3 3.3.3.3 at 10.0.23.2 cannot establish the intended adjacency. 6) Database exchange across that link is unavailable. 7) R1 learns 10.0.23.0/30 via R2 at cost 2 and R2 learns 192.168.10.0/24 via R1 at cost 2, but neither learns PC-B's 192.168.30.0/24. R3 has only its connected/local routes. 8) PC-A's ping to PC-B stops at R1's missing destination route; the reverse request stops at R3. 9) Under router ospf 1, no passive-interface Gi0/1 on R2 enables Hellos while preserving point-to-point type and area 0. 10) After convergence, R2–R3 becomes FULL and remote LAN routes become available. 11) Both PCs exchange requests and replies. Connected subnets and useful LAN passive settings are unchanged. A successful ping from R2 to 10.0.23.2 before repair shows connected IP reachability, not working OSPF.",
    },
    {
      title: "5. Guided troubleshooting",
      text: "Start with PC ipconfig, gateway ping and a remote probe. show ip interface brief checks addresses and up/up state. show ip ospf neighbor reveals which adjacencies exist: compare R1–R2 with the missing R2–R3 pair, but do not diagnose from absence alone. show ip ospf interface ties each address to its area/type/timers and exposes No Hellos (Passive interface). show ip protocols lists passive interfaces; show running-config identifies the exact process-level setting. Compare R3's active transit configuration to rule out an area or timer mismatch. show ip route shows connected/local reachability and which O routes are absent. R1's route to 10.0.23.0/30 proves that R2's passive transit prefix is still advertised, not that R3's LAN was learned. Probe source matters: R2 ping 10.0.23.2 succeeds using source 10.0.23.1; selecting source Gi0/0 (10.0.12.2) fails because R3 lacks that return route. PC tracert reports only responses that can return; do not infer protocol state from one trace. Guided task: collect R2's passive configuration, physical state, neighbor table and routing impact, predict the result of removing only that setting, then verify both routers and both hosts.",
    },
    {
      title: "6. Independent practice",
      text: "Birch connects to Cedar over 172.20.8.0/30. Birch Gi0/2 is 172.20.8.1/30 and Cedar Gi0/0 is 172.20.8.2/30. Both show up/up, area 0, POINT-TO-POINT, Hello 10/Dead 40, MTU 1500 and no authentication. Birch's router ID is 4.4.4.4 and Cedar's is 5.5.5.5. Both neighbor tables have no established adjacency. Birch show ip ospf interface reports Hellos enabled on Gi0/2; Cedar reports No Hellos (Passive interface) on Gi0/0. Cedar show running-config includes router ospf 7, passive-interface Gi0/0 and passive-interface Gi0/1; Gi0/1 is the user LAN 172.20.9.1/24. Birch uses process 3 and has a user LAN 172.20.4.1/24. Hosts and gateways are correct; no static/default routes exist. Identify the affected router/interface, propose the smallest correction and explain why process IDs 3 and 7 need not be changed. Predict what happens to Cedar's user-facing passive interface. Decide before explicitly revealing part 7.",
    },
    {
      title: "7. Independent exercise solution",
      revealOnRequest: true,
      text: "Cedar Gi0/0 is the incorrect passive transit. In Cedar's existing router ospf 7 process, apply no passive-interface Gi0/0. Keep passive-interface Gi0/1 for its user LAN and retain Birch process 3. The up/up state rules out shutdown, and matching area/type/timers plus explicit Hello suppression support the diagnosis. Local process IDs do not need to match. The corrected transit can exchange Hellos and establish an adjacency, enabling LAN route exchange; verify neighbor tables, learned routes and both host directions. Passive is useful on the user LAN and does not inherently remove that subnet's OSPF advertisement. Changing IPs, areas or a correct gateway would not remove the observed Hello suppression; a static workaround would leave the intended adjacency broken.",
    },
  ],
});
