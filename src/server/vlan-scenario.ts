import "server-only";
import { scenarioSchema } from "@/lib/schema";
import { commandsFor, vlanLab } from "@/lib/catalog";
import { intf } from "./scenario";

const pcPort = "show interfaces fastethernet0/1 switchport";
const routerPort = "show interfaces fastethernet0/24 switchport";
export const vlanScenario = scenarioSchema.parse({
  schemaVersion: 3,
  id: "vlan-01",
  revision: 1,
  title: vlanLab.title,
  incident: vlanLab.incident,
  design: vlanLab.design,
  devices: [
    {
      id: "PC-A",
      kind: "pc",
      role: "Student lab",
      gateway: "192.168.10.1",
      commands: commandsFor("vlan-01", "PC-A"),
      interfaces: [intf("Ethernet0", "192.168.10.10", 24, 1)],
    },
    {
      id: "SW1",
      kind: "switch",
      role: "Access switch",
      commands: commandsFor("vlan-01", "SW1"),
      interfaces: [],
      ports: [
        { name: "FastEthernet0/1", vlan: 20, up: true, speed: 100, duplex: "full" },
        { name: "FastEthernet0/24", vlan: 10, up: true, speed: 100, duplex: "full" },
      ],
      vlans: [
        { id: 10, name: "STUDENT_LAN", active: true },
        { id: 20, name: "OTHER_LAN", active: true },
      ],
    },
    {
      id: "R1",
      kind: "router",
      role: "West gateway",
      routerId: "1.1.1.1",
      commands: commandsFor("vlan-01", "R1"),
      interfaces: [intf("Gi0/0", "192.168.10.1", 24, 2, 0, true), intf("Gi0/1", "10.0.12.1", 30, 3, 0)],
    },
    {
      id: "R2",
      kind: "router",
      role: "East gateway",
      routerId: "2.2.2.2",
      commands: commandsFor("vlan-01", "R2"),
      interfaces: [intf("Gi0/0", "10.0.12.2", 30, 4, 0), intf("Gi0/1", "192.168.20.1", 24, 5, 0, true)],
    },
    {
      id: "PC-B",
      kind: "pc",
      role: "Remote lab",
      gateway: "192.168.20.1",
      commands: commandsFor("vlan-01", "PC-B"),
      interfaces: [intf("Ethernet0", "192.168.20.10", 24, 6)],
    },
  ],
  links: [
    {
      id: "v1",
      a: { device: "PC-A", interface: "Ethernet0" },
      b: { device: "SW1", interface: "FastEthernet0/1" },
      subnet: "192.168.10.0/24",
    },
    {
      id: "v2",
      a: { device: "SW1", interface: "FastEthernet0/24" },
      b: { device: "R1", interface: "Gi0/0" },
      subnet: "192.168.10.0/24",
    },
    {
      id: "v3",
      a: { device: "R1", interface: "Gi0/1" },
      b: { device: "R2", interface: "Gi0/0" },
      subnet: "10.0.12.0/30",
    },
    {
      id: "v4",
      a: { device: "R2", interface: "Gi0/1" },
      b: { device: "PC-B", interface: "Ethernet0" },
      subnet: "192.168.20.0/24",
    },
  ],
  fault: { cause: "access-vlan", devices: ["SW1"], interface: "SW1:FastEthernet0/1" },
  acceptedFixes: ["access-vlan"],
  repair: { device: "SW1", interface: "FastEthernet0/1", vlan: 10 },
  evidenceRules: [
    {
      label: "Host addressing checked",
      points: 10,
      requirements: [{ devices: ["PC-A"], commands: ["ipconfig", "ipconfig /all"] }],
    },
    {
      label: "PC-facing access membership observed",
      points: 10,
      requirements: [
        { devices: ["SW1"], commands: [pcPort, "show vlan brief", "show running-config", "show interfaces status"] },
      ],
    },
    {
      label: "Router-facing access membership observed",
      points: 10,
      requirements: [
        {
          devices: ["SW1"],
          commands: [routerPort, "show vlan brief", "show running-config", "show interfaces status"],
        },
      ],
    },
  ],
  hints: [
    "Separate what you know from what you suspect. Compare PC-A's address, mask and gateway with R1's LAN interface, then try the local gateway before the remote PC.",
    "Inspect arp -a before and after a gateway probe. A connected cable does not guarantee that its next-hop broadcast reaches the intended router. Check switch status and membership.",
    "Compare the two connected access ports against the design brief. Physical connectivity, access mode and VLAN membership answer different questions. Change only the setting that violates the design.",
  ],
  explanation:
    "SW1 FastEthernet0/1 places PC-A's untagged traffic in VLAN 20, while FastEthernet0/24 connects R1 in VLAN 10. Both VLANs and physical links are active. PC-A's correct gateway 192.168.10.1 is unreachable at Layer 2: its ARP request stays in its access VLAN. The router routes are healthy. Reassign only FastEthernet0/1 to VLAN 10.",
  solution:
    "SW1# configure terminal\nSW1(config)# interface FastEthernet0/1\nSW1(config-if)# switchport mode access\nSW1(config-if)# switchport access vlan 10\nSW1(config-if)# end\nSW1# show vlan brief\nSW1# show interfaces FastEthernet0/1 switchport\n\nPC-A> ping 192.168.10.1\nPC-A> arp -a\nPC-A> ping 192.168.20.10\nPC-A> tracert 192.168.20.10\n\nWorked configuration only; the simulator applies a structured repair in the separate preview. PC-A's IP/mask/gateway, FastEthernet0/24, VLAN definitions and router routes do not change. Verify the saved running configuration before persisting it on real equipment.",
  lesson: [
    {
      title: "1. Simple explanation",
      text: "A VLAN divides a switch into separate local networks. A cable can be connected while the switch places its traffic in the wrong group. Here PC-A and its router are assigned to different groups, so they cannot exchange the local messages needed to communicate. A valid IP address alone does not put a device in the correct group.",
    },
    {
      title: "2. Analogy — university communication groups",
      text: "Imagine two university departments with isolated internal announcement groups. Correct office numbers do not help if a request goes only to the wrong group. The access port assigns an arriving message to its group. Limit: a VLAN is not a physical room or an IP subnet; Ethernet frames, VLAN membership and routing determine delivery. Properly configured Layer 3 routing can connect VLANs. An ordinary switch does not move broadcasts across them just because the addresses look compatible.",
    },
    {
      title: "3. Technical mechanism",
      text: "An access port associates an incoming untagged Ethernet frame with its configured VLAN ID. Switching keeps ordinary broadcasts within that VLAN's active ports. ARP asks which local device owns an IPv4 address; an owner reachable in that broadcast domain can answer with its MAC address. The sender then addresses the Ethernet frame to that next hop while retaining the final destination in the IP packet. Local destinations need their own MAC; remote destinations need the gateway's MAC. Layer 3 route selection therefore still depends on Layer 2 next-hop reachability. This lab has no SVI, proxy ARP or inter-VLAN routing to bridge the separation.",
    },
    {
      title: "4. Worked example — follow the gateway probe",
      text: "PC-A 192.168.10.10/24 compares 192.168.10.1 with its connected /24 and treats it as on-link. It broadcasts an ARP request. SW1 receives that frame on FastEthernet0/1 in VLAN 20, so it does not deliver it to FastEthernet0/24 in VLAN 10. R1 cannot reply to a request it never receives. No resolved gateway MAC is added, so the gateway ping fails. A remote ping to 192.168.20.10 also needs this gateway and fails before R1. After moving only the PC-facing port to VLAN 10, R1 can answer ARP, and packets traverse R1 10.0.12.1, R2 10.0.12.2 and PC-B's LAN. OSPF routes were already correct and remain so.",
    },
    {
      title: "5. Guided troubleshooting — observations before conclusions",
      text: "Start with ipconfig or /all and compare R1's show ip interface brief. A failed gateway ping plus an empty arp -a cache narrows the investigation but cannot by itself distinguish VLAN separation, a cable fault or a silent neighbor. show interfaces status establishes connected ports and their VLANs; show vlan brief compares memberships; each show interfaces … switchport confirms access mode and access VLAN. show running-config supplies the actual configuration. The public wiring/design brief identifies which port serves each device and the intended VLAN. Router routes/pings and PC-B's settings rule out a routing failure. Use the repaired preview to confirm both the membership change and successful probes. Simulator ARP notes describe the modeled attempt separately from Windows-style cache entries; timing and exact OS error wording vary.",
    },
    {
      title: "6. Independent practice",
      text: "A host 172.16.40.25/24 uses gateway 172.16.40.1. Both access links are connected, but the host-facing port is in VLAN 40 and the gateway-facing port is in VLAN 50. The documented design requires both in VLAN 40. Predict the local gateway ping and ARP result. Which port should change, which evidence distinguishes this from a bad gateway address, and would a successful local repair alone prove every remote route works? Think through your answer before opening part 7.",
    },
    {
      title: "7. Independent exercise solution",
      revealOnRequest: true,
      text: "The gateway-facing port must move from VLAN 50 to the intended VLAN 40. Both hosts have compatible IP settings but cannot exchange ARP across the current VLAN boundary. Compare IP configuration, actual router address, connected interface status, both access memberships and design intent. A failed ping alone is not conclusive. After the single port correction, verify ARP and the local gateway, then test the remote destination and return route independently. Do not change an already correct gateway address or assume that an up port proves the right broadcast domain. Here the incorrect port is the router-facing one: memorizing the first lab's port number would give the wrong answer.",
    },
  ],
});
