# Network correctness: OSPF lab 001

**3V foundation boundary (1 October 2026):** [Schema-15 contracts](transfer-foundation.md) add no forwarding protocol. Two unregistered fixtures exercise access VLAN + direct point-to-point OSPF + outbound LAN standard policy with either one VLAN fault or one ACL ordering fault. Trials recompute actual state; current local ping checks must succeed, reciprocal flows must deliver and excluded flows must encounter policy rather than an unrelated failure. Shared evidence authenticates exact replay epochs and source context. All fifteen scenario definitions/revisions remain unchanged. LAB003's published proposed-answer grading remains historical; its reusable access trial and epoch-filtered ARP behavior are tested separately. The remaining mixed-model guards are retained.

**3U audit boundary:** [Restricted composition tests](integrated-model-compatibility.md) verify VLAN/OSPF/outbound-LAN-ACL separation, independent NAT/GRE routes and explicit rejection of unsupported mixes. No forwarding behavior or existing case changes. The pack is DEFERRED because working forwarding is not the same as neutral, versioned, freshly verified multi-family repair. Do not infer mixed-protocol support by bypassing schema guards or count a canonical repaired preview as a learner trial.

**3T boundary:** the [VPN/IPsec gate](ipsec-feasibility.md) selected Academy-only learning. No security attribute, protection result, crypto command, selector, SA, counter or repair is added to any network model. LAB 014 remains bare GRE, LAB 009 retains filtering-ACL semantics, LAB 013 retains static NAT behavior and LAB 015 retains its separate IPv6 model. All fifteen scenarios are unchanged. New Academy observations are explicitly authored reasoning examples, not outputs of a running VPN or evidence that NetFault encrypts packets.

## Milestone 3R IPv6 boundary — 30 September 2026

LAB 015 adds a **separate** IPv6-only forwarding model; all earlier IPv4/OSPF behavior remains under existing regression tests. [The model](ipv6-model.md) documents 128-bit identity, explicit manual on-link prefixes, actual-link ND resolution (not ARP), connected router delivery and independent return paths. R1's only fault is disabled IPv6 transit forwarding; local reception/origination remains possible. No IOS RIB, multicast, RA, DAD, link-local or timing output is fabricated. Every implemented command derives from current configuration and link state. The effective config view includes defaults and is labeled educational.

[Current course evidence and competing designs](milestone-3r.md) are distinct from Cisco/RFC semantic verification and from **unexecuted** external device practice. See [fresh tests](verification.md); no physical device or Netlify execution claim follows from source review.

## Milestone 3Q implementation delta — 28 September 2026

[LAB 014](milestone-3q.md) adds the [bounded GRE model](gre-model.md). Outer traffic follows actual physical route/L2 traversal; the delivered receiver must match the fixed GRE pair before inner routing resumes. Replies originate from the delivered inner endpoint and follow independent routes. Local source/routability controls Tunnel0 line state; remote reachability does not. In the authored sole fault, a reachable transport destination keeps up/up and routes installed but cannot accept inner delivery. Destination correction leaves addresses/sources/routes unchanged and restores reciprocal logical and PC exchanges.

Independent model fixtures, exact case invariants, source-aware evidence replay and all earlier protocol regressions are covered in [verification](verification.md). No GRE headers, liveness, timers, encryption, MTU, trace, mixed NAT/ACL or dynamic overlay routing is modeled. Reference review is not device execution. Earlier scenario revisions remain unchanged.

## Milestone 3O implementation delta — 27 September 2026

[LAB 013 — Beyond the gate](milestone-3o.md) now implements one reusable bounded permanent static NAT pair, explicit inside/outside roles, outward source translation after routing and inward destination translation before routing. Replies use actual delivered endpoint/address identity; routes and directed L2 delivery remain independent. One wrong inside-local slot explains both service failures. Minimal applied correction plus authentic original and fresh bidirectional evidence is required. There are now thirteen playable cases; earlier authored scenarios and Academy revisions are unchanged.

Coverage is **partial static NAT investigation**, not full NAT/PAT competence. An unrelated tiny primer supports identity/routing reasoning; the original [device companion](nat-device-companion.md) is UNEXECUTED. Dynamic NAT, PAT, pools, transport/timer state, policy NAT and mixed protocols remain gaps. See [model bounds](nat-model.md) and [executed checks](verification.md). Historical planning records below describe their own earlier baseline and are superseded only for this explicit scope.

**Milestone 3M update:** [LAB 012 — The quiet desk](milestone-3m.md) adds one static, maximum-one, protect-mode access-edge investigation with real ingress admission/resolution and applied repair verification. See the [bounded model](port-security-model.md). Sticky/dynamic learning, aging, counters, restrict/shutdown/recovery, trunks and broader LAN security remain uncovered. The optional original [switch companion](port-security-device-companion.md) is UNEXECUTED. Earlier planning tables below are historical; no NAT, GRE, later lab or Academy expansion was added.

**Milestone 3K update:** [LAB 011 and bounded HSRPv2](milestone-3k.md) provide partial priority/virtual-gateway investigation with explicit preemption and independent routing. The [model](hsrp-model.md) supports one group/two members and settled unequal-priority roles, actual virtual forwarding and fresh design verification. General preemption/incumbency, timers, failure history, tracking, VRRP/GLBP and IPv6 remain deferred. This does not establish full FHRP coverage or failover competence; prior audit statements below retain their dates.

Milestone 3I adds [LAB 010 bounded STP correctness](milestone-3i.md): deterministic root/receiving-cost/port-role selection on one access-VLAN simple graph, with both-endpoint data filtering in shared Layer 2 traversal. Initial and repaired host pings both succeed; the root/tree must meet the explicit design and be freshly verified after a priority change. This adds no timer, BPDU, storm, trunk or full RSTP simulation. All nine previous authored scenarios, including the OSPF network below, are unchanged.

Milestone 3G adds [LAB 009 standard ACL correctness](acl-model.md): source-only first-match outbound policy after route selection, independent reply evaluation and a policy-preserving repair. Its addressing, expected positive/negative flow matrix, router-local traffic boundary and unsupported features are documented there. The original eight authored scenarios remain unchanged; all are covered by the current [verification](verification.md).

Milestone 3F adds a separate [bounded EtherChannel model](etherchannel-model.md). Physical members, negotiation, logical forwarding and end-to-end reachability derive from common state, with explicit standalone-disable and no alternate path. It does not change this OSPF scenario or the other six existing authored networks. Vendor/source review and automated model validation are documented separately from unperformed physical-device tests in [3F](milestone-3f.md).

Milestone 3A adds [LAB 006 timer compatibility](timer-lab.md) and [LAB 007 incorrect installed static next hop](next-hop-lab.md), reusing the existing adjacency/routing/loop algorithms. The original five authored networks remain unchanged. Neighbor Dead Time now derives from configured Dead as a bounded representative snapshot. Historical milestone notes below retain their original scope.

Milestone 2D adds [passive OSPF interface correctness](passive-interface-lab.md). LAB 005 uses all area 0 and only R2 Gi0/1's passive flag is faulty; this is separate from LAB 001's area mismatch. The same adjacency/routing algorithms drive both. OSPF interface output now explicitly shows Hello behavior and omits a vendor-specific FSM state on passive interfaces. Five labs are supported; the original state below is unchanged.

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
