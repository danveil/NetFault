export const lessons = [
  {
    title: "01 / Addressing & the default gateway",
    simple: "A host sends local traffic directly and remote traffic to its gateway.",
    analogy:
      "An internal letter goes straight to a colleague; an external letter goes through the mailroom. The analogy does not model ARP or binary subnet masks.",
    technical:
      "A /24 mask is 255.255.255.0. PC-A 192.168.10.10/24 and gateway 192.168.10.1 share a subnet. For 192.168.30.10, PC-A resolves the gateway MAC using ARP and sends a frame to it while keeping PC-B as the destination IP. A /30 transit has two usable host addresses.",
    example: "PC-A> ipconfig\nIPv4: 192.168.10.10\nMask: 255.255.255.0\nGateway: 192.168.10.1\nPC-A> ping 192.168.10.1",
    symptom: "A gateway ping succeeding rules out some local problems, but does not prove remote routing works.",
    guided: "Inspect PC-A. Calculate whether 192.168.30.10 is local, then compare gateway and remote pings.",
    exercise:
      "Without hints, identify the usable host addresses in 10.0.23.0/30 and explain why .0 and .3 cannot be interface addresses.",
  },
  {
    title: "02 / Physical state & protocol state",
    simple: "An active cable does not guarantee that routers exchange routes.",
    analogy:
      "A telephone line can work even when the people on it speak different languages. This describes compatibility, not how packets are encoded or authenticated.",
    technical:
      "Interface up/up reports an operational interface and line protocol in this model. OSPF adjacency is separate. A connected route is installed for an up interface independently of OSPF. There are no ACLs, NAT, loss or duplex faults in this lab.",
    example: "R2# show ip interface brief\nR2# ping 10.0.23.2\nR2# show ip ospf neighbor",
    symptom: "A transit peer may answer ping while its OSPF neighbor entry is absent.",
    guided: "Compare the R2 transit ping with its neighbor table. Record both observations.",
    exercise: "Explain why replacing a cable is not supported by an up/up interface and a successful on-link ping.",
  },
  {
    title: "03 / OSPF areas, neighbors & network types",
    simple: "OSPF routers must agree on the area of their shared link before sharing their topology.",
    analogy:
      "Two map editors must agree which district they are updating. Real OSPF areas are protocol boundaries, not permissions or geographic limits.",
    technical:
      "OSPFv2 validates the packet area against the receiving interface. A mismatch prevents adjacency on an ordinary link. Router IDs uniquely identify routers; process IDs are locally significant and need not match. Transit Ethernet is explicitly point-to-point here: no DR/BDR election, healthy neighbors are FULL/-. Broadcast Ethernet ordinarily elects a DR and BDR; a /30 alone does not change the network type. Passive LAN interfaces are advertised but send no Hellos.",
    example:
      "interface GigabitEthernet0/1\n ip ospf 1 area 0\n ip ospf network point-to-point\nrouter ospf 1\n router-id 1.1.1.1\n passive-interface GigabitEthernet0/0\n! Inspect with show ip ospf interface",
    symptom:
      "A missing neighbor with working IP connectivity suggests checking area, timers, authentication, and network type; it does not by itself prove which one is wrong.",
    guided:
      "Compare area, network type, timers and MTU at both ends of each transit. Select the observations that establish a difference.",
    exercise:
      "Explain why changing a local OSPF process ID or merely restarting OSPF would not correct a mismatched interface area.",
  },
  {
    title: "04 / Routes, evidence & the return path",
    simple: "A successful ping needs a usable route out and a usable route back.",
    analogy:
      "A delivery and its receipt may need different roads. Unlike a road map, a routing table uses longest-prefix matching for each packet.",
    technical:
      "C denotes a connected subnet; L is the router’s own /32 address; O is an intra-area OSPF route. [110/2] means administrative distance 110 and OSPF metric 2. This lab sets each OSPF interface cost to 1. A router chooses the most specific matching route. Without a route or default, forwarding fails. The reply destination is the ping source, which a router normally chooses from its outgoing interface.",
    example: "R1# show ip route\nO 10.0.23.0/30 [110/2] via 10.0.12.2, Gi0/1\nPC-A> tracert 192.168.30.10",
    symptom:
      "Learning a transit subnet does not imply learning the LAN beyond it. Missing return routes can also prevent echo replies.",
    guided:
      "Check R1’s remote LAN route and R3’s return route. Pair route evidence with interface evidence, then submit a structured diagnosis.",
    exercise:
      "Predict which routes and neighbor entries should change after the repair. Use the repaired-state preview to test your prediction; then repeat this lab without hints.",
  },
] as const;
