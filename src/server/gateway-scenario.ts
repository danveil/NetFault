import "server-only";
import { scenarioSchema } from "@/lib/schema";
import { gatewayLab, commandsFor } from "@/lib/catalog";
import { intf } from "./scenario";

export const gatewayScenario = scenarioSchema.parse({
  schemaVersion: 2,
  id: "gateway-01",
  revision: 1,
  title: gatewayLab.title,
  incident: gatewayLab.incident,
  design: gatewayLab.design,
  devices: [
    {
      id: "PC-A",
      kind: "pc",
      role: "Student lab",
      gateway: "192.168.10.254",
      commands: commandsFor("gateway-01", "PC-A"),
      interfaces: [intf("Ethernet0", "192.168.10.10", 24, 1)],
    },
    {
      id: "SW1",
      kind: "switch",
      role: "Access switch",
      commands: commandsFor("gateway-01", "SW1"),
      interfaces: [],
      ports: [
        { name: "Gi0/1", vlan: 10, up: true, speed: 1000, duplex: "full" },
        { name: "Gi0/2", vlan: 10, up: true, speed: 1000, duplex: "full" },
      ],
      vlans: [{ id: 10, name: "STUDENT_LAN", active: true }],
    },
    {
      id: "R1",
      kind: "router",
      role: "West gateway",
      routerId: "1.1.1.1",
      commands: commandsFor("gateway-01", "R1"),
      interfaces: [intf("Gi0/0", "192.168.10.1", 24, 2, 0, true), intf("Gi0/1", "10.0.12.1", 30, 3, 0)],
    },
    {
      id: "R2",
      kind: "router",
      role: "East gateway",
      routerId: "2.2.2.2",
      commands: commandsFor("gateway-01", "R2"),
      interfaces: [intf("Gi0/0", "10.0.12.2", 30, 4, 0), intf("Gi0/1", "192.168.20.1", 24, 5, 0, true)],
    },
    {
      id: "PC-B",
      kind: "pc",
      role: "Remote lab",
      gateway: "192.168.20.1",
      commands: commandsFor("gateway-01", "PC-B"),
      interfaces: [intf("Ethernet0", "192.168.20.10", 24, 6)],
    },
  ],
  links: [
    {
      id: "g1",
      a: { device: "PC-A", interface: "Ethernet0" },
      b: { device: "SW1", interface: "Gi0/1" },
      subnet: "192.168.10.0/24",
    },
    {
      id: "g2",
      a: { device: "SW1", interface: "Gi0/2" },
      b: { device: "R1", interface: "Gi0/0" },
      subnet: "192.168.10.0/24",
    },
    {
      id: "g3",
      a: { device: "R1", interface: "Gi0/1" },
      b: { device: "R2", interface: "Gi0/0" },
      subnet: "10.0.12.0/30",
    },
    {
      id: "g4",
      a: { device: "R2", interface: "Gi0/1" },
      b: { device: "PC-B", interface: "Ethernet0" },
      subnet: "192.168.20.0/24",
    },
  ],
  fault: { cause: "wrong-gateway", devices: ["PC-A"], interface: "PC-A:Ethernet0" },
  acceptedFixes: ["gateway"],
  repair: { device: "PC-A", gateway: "192.168.10.1", reason: "on-link-router" },
  evidenceRules: [
    {
      label: "PC-A's configured gateway",
      points: 30,
      requirements: [{ devices: ["PC-A"], commands: ["ipconfig", "ipconfig /all", "route print"] }],
    },
  ],
  hints: [
    "Compare a ping to a device on PC-A's own subnet with a ping to PC-B. Inspect the destination and subnet mask before drawing conclusions.",
    "Use PC-A's ipconfig and route print, then R1's show ip interface brief. Which next hop is selected for a remote destination, and is there a device with that address?",
    "Check whether PC-A's default route points to the router interface on its LAN. Confirm the switch ports and the routers' remote LAN routes before proposing one host setting change.",
  ],
  explanation:
    "PC-A is configured with default gateway 192.168.10.254, but no device owns that address. Its local router is R1 Gi0/0 at 192.168.10.1. PC-A can reach 192.168.10.1 directly through SW1 in VLAN 10; traffic to 192.168.20.10 instead needs the default route and fails next-hop resolution before reaching R1. Both routers have valid routes. Only PC-A's gateway needs to change.",
  solution:
    "PC-A IPv4 settings (worked configuration; no real operating-system changes):\n  Address: 192.168.10.10\n  Mask: 255.255.255.0\n  Default gateway: 192.168.10.1  (replace 192.168.10.254)\n\nPC-A> ipconfig\nPC-A> route print\nPC-A> ping 192.168.10.1\nPC-A> ping 192.168.20.10\nPC-A> tracert 192.168.20.10\nPC-B> ping 192.168.10.10\n\nExpected: local and remote pings succeed. The modeled outward trace shows R1 192.168.10.1, R2 10.0.12.2, then PC-B 192.168.20.10. SW1 does not appear as an IP hop. Router/VLAN configuration, PC addresses and masks remain unchanged.",
  lesson: [
    {
      title: "1. Simple explanation",
      text: "A default gateway is the next router a host uses when it has no more-specific route to a destination. It is a next hop, not the final destination. PC-A should send remote traffic to R1 while keeping PC-B's address as the packet destination.",
    },
    {
      title: "2. Analogy — leaving your neighborhood",
      text: "Imagine delivering a parcel to a neighbor by walking down your street. To reach another town, you first take the neighborhood's exit road. PC-A knows its street but has written down an exit that does not exist. Limit: networks do not recognize geographic neighborhoods. Prefix masks, route selection and Ethernet address resolution make the decision; switches can carry many separate VLANs, and real routers may have multiple paths.",
    },
    {
      title: "3. Technical mechanism",
      text: "PC-A compares the destination against its connected /24 route. For an on-link destination it resolves that destination's MAC address using ARP. Otherwise, its 0.0.0.0/0 route selects the configured gateway and it resolves the gateway's MAC. Here no host answers for 192.168.10.254, so a remote packet cannot leave PC-A's LAN. SW1 forwards frames within VLAN 10 without decrementing IP TTL or selecting IP routes. ARP retries, timing and MAC learning are abstracted in this simulator.",
    },
    {
      title: "4. Addresses and routing",
      text: "PC-A is 192.168.10.10/24. R1 Gi0/0 is 192.168.10.1/24; R1 Gi0/1 is 10.0.12.1/30. R2 Gi0/0 is 10.0.12.2/30 and Gi0/1 is 192.168.20.1/24. PC-B is 192.168.20.10/24 with gateway 192.168.20.1. R1 learns 192.168.20.0/24 through 10.0.12.2; R2 learns 192.168.10.0/24 through 10.0.12.1. The routing infrastructure is healthy.",
    },
    {
      title: "5. Why local works while remote fails",
      text: "192.168.10.1 matches PC-A's connected /24, so ping succeeds without using its bad default route. 192.168.20.10 does not match that /24, so PC-A tries the nonexistent .254 gateway. In the reverse direction, PC-B's packet can reach PC-A, but PC-A cannot return an echo reply to the remote source. Therefore a successful local ping alone does not prove a correct gateway or working end-to-end communication.",
    },
    {
      title: "6. Build a chain of evidence",
      text: "ipconfig shows address, mask and gateway; /all also rules out a DHCP-assigned setting and shows the adapter details. route print makes the connected and default choices explicit. Ping compares local and remote reachability; tracert here stops before any router, with a modeled next-hop resolution failure. On SW1, show vlan brief confirms both ports belong to VLAN 10; show interfaces status confirms both links are connected. R1/R2 show ip interface brief identifies actual interface addresses; show ip route verifies forward/return LAN routes; show running-config ties them to the OSPF configuration. Router pings and PC-B's ipconfig/ping help isolate the symptom to PC-A. No single failed ping alone proves a gateway fault.",
    },
    {
      title: "7. Correct, verify, then practise independently",
      text: "Replace only PC-A's gateway with 192.168.10.1. Its default route now reaches a real on-link router; R1 forwards across R2 and PC-B's return path works. Use Verify repaired network to compare route print, local/remote pings and traceroute without changing your submitted evidence. Guided practice: explain the next-hop choice for 192.168.10.1 and 192.168.20.10 before running each command. Independent exercise: on a host 172.16.8.25/24 with router 172.16.8.1, predict whether 172.16.8.70 and 172.16.9.70 use the gateway, then describe what would fail if its gateway were an unused 172.16.8.254.",
    },
  ],
});
