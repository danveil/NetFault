import "server-only";
import { scenarioSchema } from "@/lib/schema";
import { returnLab, commandsFor } from "@/lib/catalog";
import { intf } from "./scenario";

export const returnScenario = scenarioSchema.parse({
  schemaVersion: 4,
  id: "return-01",
  revision: 1,
  title: returnLab.title,
  incident: returnLab.incident,
  design: returnLab.design,
  devices: [
    {
      id: "PC-A",
      kind: "pc",
      role: "Student lab",
      gateway: "192.168.10.1",
      commands: commandsFor("return-01", "PC-A"),
      interfaces: [intf("Ethernet0", "192.168.10.10", 24, 1)],
    },
    {
      id: "SW1",
      kind: "switch",
      role: "Access switch",
      commands: commandsFor("return-01", "SW1"),
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
      commands: commandsFor("return-01", "R1"),
      interfaces: [intf("Gi0/0", "192.168.10.1", 24, 2), intf("Gi0/1", "10.0.12.1", 30, 3)],
      staticRoutes: [{ network: "192.168.20.0", prefix: 24, nextHop: "10.0.12.2" }],
    },
    {
      id: "R2",
      kind: "router",
      role: "East gateway",
      routerId: "2.2.2.2",
      commands: commandsFor("return-01", "R2"),
      interfaces: [intf("Gi0/0", "10.0.12.2", 30, 4), intf("Gi0/1", "192.168.20.1", 24, 5)],
      staticRoutes: [],
    },
    {
      id: "PC-B",
      kind: "pc",
      role: "Remote lab",
      gateway: "192.168.20.1",
      commands: commandsFor("return-01", "PC-B"),
      interfaces: [intf("Ethernet0", "192.168.20.10", 24, 6)],
    },
  ],
  links: [
    {
      id: "r1",
      a: { device: "PC-A", interface: "Ethernet0" },
      b: { device: "SW1", interface: "Gi0/1" },
      subnet: "192.168.10.0/24",
    },
    {
      id: "r2",
      a: { device: "SW1", interface: "Gi0/2" },
      b: { device: "R1", interface: "Gi0/0" },
      subnet: "192.168.10.0/24",
    },
    {
      id: "r3",
      a: { device: "R1", interface: "Gi0/1" },
      b: { device: "R2", interface: "Gi0/0" },
      subnet: "10.0.12.0/30",
    },
    {
      id: "r4",
      a: { device: "R2", interface: "Gi0/1" },
      b: { device: "PC-B", interface: "Ethernet0" },
      subnet: "192.168.20.0/24",
    },
  ],
  fault: { cause: "missing-route", devices: ["R2"], interface: "routing-table" },
  acceptedFixes: ["static-route"],
  repair: { device: "R2", route: { network: "192.168.10.0", prefix: 24, nextHop: "10.0.12.1" }, reason: "reply-route" },
  evidenceRules: [
    { label: "Forward route on R1", points: 10, requirements: [{ devices: ["R1"], commands: ["show ip route"] }] },
    {
      label: "Required reply destination and R2 route coverage",
      points: 20,
      requirements: [
        { devices: ["PC-A"], commands: ["ipconfig", "ipconfig /all"] },
        { devices: ["R2"], commands: ["show ip route"] },
      ],
    },
  ],
  hints: [
    "Check PC-A's addressing and compare a ping to its local gateway with a ping to PC-B. A local success helps narrow the investigation, but does not prove the remote path.",
    "Compare show ip route and show running-config on both routers. For each destination, identify the most specific matching route and next hop.",
    "Treat the echo request and echo reply as separate packets. Write their source and destination addresses, then follow each direction independently.",
    "PC-B sends its reply to R2. Does R2 have any route that matches the original source address, including a default route? Compare R2's table with PC-A's configuration and R1's transit address.",
  ],
  explanation:
    "The request reaches PC-B through R1's static route and R2's connected LAN. PC-B sends its reply to its correct gateway, R2. R2 has no route matching 192.168.10.10 and no default route, so the reply stops there. PC-A sees no echo replies. R1's ordinary ping uses source 10.0.12.1, which R2 can reach directly; its success does not prove a return route to PC-A's LAN. Only R2 needs the missing static route. A failed ping alone would not prove this diagnosis.",
  solution:
    "R2(config)# ip route 192.168.10.0 255.255.255.0 10.0.12.1\n\nR2# show ip route\nExpected: S 192.168.10.0/24 [1/0] via 10.0.12.1, Gi0/0\nR2# show running-config\nPC-A> ping 192.168.20.10\nPC-B> ping 192.168.10.10\nR1# ping 192.168.20.10 source 192.168.10.1\nPC-A> tracert 192.168.20.10\n\nAll probes now receive replies. Configure only R2; keep both PC gateways, SW1's VLAN and R1's existing forward route unchanged. Use Verify repaired network to run these checks against a cloned, repaired state.",
  lesson: [
    {
      title: "1. Simple explanation",
      text: "A conversation needs delivery in both directions. A routing table tells a router where to send a packet for a destination. PC-A's message reaches PC-B, but R2 does not know where to send the reply to PC-A. The hosts' gateways are correct. Adding the missing direction restores the conversation.",
    },
    {
      title: "2. Analogy — a parcel and its reply",
      text: "Imagine PC-A at university sending a parcel through dispatch center R1, then hometown center R2, to family at PC-B. The outbound delivery instructions work. Your family's reply reaches R2, whose instructions lack the university's area. Limit: IP routers do not know towns, remember conversations or automatically reverse a request's path. Each packet carries a destination address; every router independently consults its routing table. Valid return paths can differ from outward paths.",
    },
    {
      title: "3. Technical mechanism",
      text: "An up numbered interface installs a connected subnet route (C) and a local address /32 (L). A configured static route (S) names a destination prefix and a next-hop router. Among installed routes matching the destination, longest-prefix matching selects the most specific; a /24 beats a /16, and /0 is the least-specific fallback. For the same prefix, this model prefers connected routes (administrative distance 0), then static (1), then OSPF (110). The next hop is an adjacent forwarding device, not the packet's final destination. Request source 192.168.10.10/destination 192.168.20.10 becomes reply source 192.168.20.10/destination 192.168.10.10. R1 has a static route to Network B; R2 has no match for Network A. This differs from an incorrect host gateway: PC-A reaches its real on-link router. Routers do not always need a separate static route for each network: connected, dynamic, summary or default routes can cover destinations. This lab deliberately has no alternate/default route or OSPF; the intended correction is one specific static route.",
    },
    {
      title: "4. Worked packet journey",
      text: "1) PC-A creates an echo request for 192.168.20.10. 2) Its /24 comparison identifies a remote destination. 3) It resolves gateway 192.168.10.1 and sends the frame through SW1 to R1. 4) R1 looks up 192.168.20.10. 5) Static 192.168.20.0/24 selects next hop 10.0.12.2 via Gi0/1. 6) R2 matches connected 192.168.20.0/24. 7) R2 delivers the request to PC-B. 8) PC-B creates an echo reply to 192.168.10.10. 9) PC-B sends it to gateway 192.168.20.1. 10) R2 looks up 192.168.10.10. 11) No prefix matches and there is no default route. 12) The reply stops; PC-A's ping times out even though the request arrived. After ip route 192.168.10.0 255.255.255.0 10.0.12.1 on R2, the reply crosses to R1, which delivers it on its connected LAN. SW1 switches frames and never appears as an IP hop.",
    },
    {
      title: "5. Guided troubleshooting",
      text: "Use ipconfig and /all to record PC-A's source address, mask and gateway, then compare local and remote pings. PC-B's ipconfig confirms its return gateway. SW1 show vlan brief, show interfaces status and show running-config check the active access path. Router show ip interface brief identifies the real gateways and transit next hops; show ip route proves installed forward and return coverage, including absence of a default; show running-config shows configured static routes and no OSPF. An R1 ping normally uses outgoing 10.0.12.1 and succeeds: R2 has that connected transit route. Select R1 source Gi0/0 or 192.168.10.1 and it fails, isolating source-dependent return reachability. PC-A tracert shows R1 then stars: R2's time-exceeded response and PC-B's destination response cannot return to the source. Stars do not alone prove a failed outward hop. If R2 generated an ICMP error for the dropped echo reply, that error would be addressed to PC-B, the source of that packet, not automatically to PC-A. This simulator abstracts error generation/retries and shows no echo replies at PC-A. Guided task: before each probe, predict both destination lookups; use both tables plus PC-A's address as evidence. Other faults can also cause failed pings; observations must support the conclusion.",
    },
    {
      title: "6. Independent practice",
      text: "Host X is 172.16.4.10/24, gateway Cedar 172.16.4.1. Cedar–Maple transit is 10.4.5.0/30: Cedar .1, Maple .2. Host Y is 172.16.9.10/24, gateway Maple 172.16.9.1. All links, VLANs and host settings are correct. Cedar has C 172.16.4.0/24, C 10.4.5.0/30 and S 172.16.9.0/24 via 10.4.5.2. Maple has C 10.4.5.0/30 and C 172.16.9.0/24, with no other routes or default. X's request reaches Y, but X gets no reply. Determine the affected router, missing prefix, next hop and correction. Predict a Cedar ping sourced from 10.4.5.1 versus 172.16.4.1. Write your reasoning before explicitly revealing part 7.",
    },
    {
      title: "7. Independent exercise solution",
      revealOnRequest: true,
      text: "Maple needs ip route 172.16.4.0 255.255.255.0 10.4.5.1. Y's reply has destination 172.16.4.10; Maple previously had no matching prefix. The new route chooses Cedar's adjacent transit address, and Cedar delivers on its connected LAN. Cedar's transit-sourced ping works before repair, but its LAN-sourced ping does not; both work afterward. Changing X's correct gateway, shutting interfaces or adding another forward route to Cedar would not supply Maple's missing return lookup. Routing is destination-based, not a remembered reversal of the request; ping failure must be explained using both directions.",
    },
  ],
});
