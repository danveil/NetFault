# Network correctness: OSPF lab 001

Milestone 2C adds [static routing and return-path correctness](return-path-lab.md), including source-sensitive router pings and independently routed trace replies. All four labs use the shared engine; the OSPF configuration below remains unchanged.

Milestone 2A adds one separate lab, documented in [gateway lab correctness](gateway-lab.md). The OSPF configuration and expected behavior below remain unchanged.

Milestone 2B adds [VLAN membership correctness and ARP assumptions](vlan-lab.md). Those labs share this deterministic forwarding engine; the original OSPF scenario is unchanged.

## Addressing

| Device           | Interface | IPv4             | OSPF / gateway                                            |
| ---------------- | --------- | ---------------- | --------------------------------------------------------- |
| PC-A             | Ethernet0 | 192.168.10.10/24 | Gateway 192.168.10.1                                      |
| R1 (RID 1.1.1.1) | Gi0/0     | 192.168.10.1/24  | Area 0, passive broadcast LAN                             |
| R1               | Gi0/1     | 10.0.12.1/30     | Area 0, point-to-point                                    |
| R2 (RID 2.2.2.2) | Gi0/0     | 10.0.12.2/30     | Area 0, point-to-point                                    |
| R2               | Gi0/1     | 10.0.23.1/30     | Area 0, point-to-point                                    |
| R3 (RID 3.3.3.3) | Gi0/0     | 10.0.23.2/30     | **Area 1**, point-to-point (the one incorrect assignment) |
| R3               | Gi0/1     | 192.168.30.1/24  | Area 0, passive broadcast LAN                             |
| PC-B             | Ethernet0 | 192.168.30.10/24 | Gateway 192.168.30.1                                      |

All interfaces are up. All OSPF costs are 1, Hello 10 seconds, Dead 40 seconds, IP MTU 1500. There is no authentication or packet filtering. Process ID is 1 on each router for clarity; process IDs need not match between neighbors. LANs are passive but advertised. All intended OSPF interfaces belong to area 0; the R3 transit assignment is the only intended configuration defect.

## Faulted state

R1 and R2 are symmetric FULL/- neighbors. Neither end of the R2–R3 link has an adjacency to the other. Both links explicitly use `ip ospf network point-to-point`; no transit DR or BDR is elected. Broadcast Ethernet defaults must not be inferred from the /30 subnet length.

Every router installs C subnet routes and L /32 routes for its up interfaces. R1 learns 10.0.23.0/30 via 10.0.12.2 at metric 2. R2 learns 192.168.10.0/24 via 10.0.12.1 at metric 2. R3 has no O routes. R1/R2 do not learn 192.168.30.0/24; R3 has no return route to 192.168.10.0/24. No default route conceals the failure.

The numbered point-to-point subnet can be advertised as a stub link even without full adjacency (RFC 2328 §12.4.1.1, option 2). Therefore R1 learning 10.0.23.0/30 is deliberate and does not mean R2 has learned PC-B's LAN. R3's area-0 LAN has no backbone connection through the misconfigured transit; this isolation follows from the single fault.

| Probe               | Expected | Reason                                                             |
| ------------------- | -------- | ------------------------------------------------------------------ |
| PC-A → 192.168.10.1 | Success  | Same LAN                                                           |
| PC-B → 192.168.30.1 | Success  | Same LAN                                                           |
| R2 → 10.0.23.2      | Success  | Connected subnet, return to source 10.0.23.1 also connected        |
| R1 → 10.0.23.1      | Success  | Learned transit; R2 returns to source 10.0.12.1                    |
| R1 → 10.0.23.2      | Failure  | Forward delivery works; R3 has no return route to source 10.0.12.1 |
| PC-A → PC-B         | Failure  | R1 lacks remote LAN route                                          |
| PC-B → PC-A         | Failure  | R3 lacks remote LAN route                                          |

## Repair and checks

Set R3 Gi0/0 to `ip ospf 1 area 0`. This replaces its interface-level area assignment. After modeled convergence, R2 and R3 become FULL/- neighbors. R1 learns 192.168.30.0/24 via R2 at metric 3; R3 learns 192.168.10.0/24 via R2 at metric 3. End-to-end ping works in both directions. Do not fix the mismatch by moving R2 to area 1: it violates the explicit all-area-0 design. A process restart is unnecessary.

## References actually consulted

- [RFC 2328 §8.2](https://www.rfc-editor.org/rfc/rfc2328#section-8.2): receiving-interface area checks.
- [RFC 2328 §12.4.1.1](https://www.rfc-editor.org/rfc/rfc2328#section-12.4.1.1): numbered point-to-point links and subnet advertisement without full adjacency.
- [Cisco: Troubleshoot OSPF Neighbor Problems](https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13699-29.html): neighbor diagnosis, area/timer checks, unique router IDs.
- [Cisco IOS OSPF command reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/command/iro-cr-book/ospf-s1.html): show-command concepts and fields.

These references were reviewed during implementation on 2026-09-19. They ground the model's rules; they do not constitute a packet capture or an execution of this exact configuration. **No physical routers, Packet Tracer, GNS3, CML or other IOS lab were run.** Outputs intentionally omit changing uptimes, live latency, retransmissions and detailed LSDB state. Neighbor dead-time is a fixed representative snapshot. Ping uses a common five-probe summary for PCs and routers; trace uses a documented hop-level abstraction. Do not present the simulator's output formatting as exact IOS/Windows output.
