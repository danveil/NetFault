# Engine capability and course feasibility audit

**Historical-materials-based roadmap — 2026/27 course requirements unconfirmed.**

Milestone 3D follow-up is documentation only. [Sources](wia2008-sources.md) now include 11 historical lecture decks and distinguish them from current requirements. No application behavior or tests changed. Slide rendering was used for source inspection; the simulator was not externally validated or newly tested here.

“Implemented and verified” below means implemented in inspected code with relevant existing test assertions and the historical 3C passing record. It does not mean freshly executed in 3D, general protocol completeness or external IOS validation. Historical [2E audit](engine-audit.md) remains useful context, but its fixed D1–D3 findings and five-lab state must not be copied as current defects. [3A record](milestone-3a.md) documents their resolution.

## Capability matrix

| Category | Capability actually supported / boundary | Code and verification evidence |
| --- | --- | --- |
| Implemented and verified | Static dotted IPv4 validation, unique usable interface addresses, link/gateway references and isolated authored repairs. Interfaces support /1–/30; static destination routes /0–/32 | [schema.ts:29](../src/lib/schema.ts#L29), refinement from :196; [engine tests](../tests/engine.test.ts), [authoring tests](../tests/authoring.test.ts) |
| Implemented and verified | Connected/local routes; directly linked static router next hops; C/L before S before O for an identical prefix; longest-prefix forwarding | [engine.ts:92](../src/lib/engine.ts#L92), `routes`, `lookup`; [return tests:110](../tests/return.test.ts#L110), [next-hop tests:75](../tests/next-hop.test.ts#L75). No recursive static routing or configurable distances |
| Implemented and verified | Separate forward/reply paths and valid local router probe sources; repair is a clone of the same state | [engine.ts:147](../src/lib/engine.ts#L147), `forward`, `connectivity`, `repaired`; [case-contract.ts](../tests/case-contract.ts), return/next-hop tests |
| Implemented and verified | Area, passive, Hello/Dead, MTU, enabled/up and point-to-point compatibility affect adjacency; passive enabled subnets remain advertised through working neighbors | [engine.ts:60](../src/lib/engine.ts#L60), :92; [passive tests:104](../tests/passive.test.ts#L104), [timer tests](../tests/timer.test.ts), [readiness tests:30](../tests/readiness.test.ts#L30). These predicates are verified; the full OSPF protocol is not |
| Partially modeled / simplified | Access VLAN reachability traverses active same-VLAN ports and existing links. Switches add no IP hop | [engine.ts:28](../src/lib/engine.ts#L28), `peers`; [VLAN tests:113](../tests/vlan.test.ts#L113). No frame queues, FDB learning/flooding, tagged trunks, STP or arbitrary switching-topology qualification |
| Partially modeled / simplified | OSPF steady-state FULL/- neighbors and per-area Dijkstra-derived routes/metrics | [engine.ts:60](../src/lib/engine.ts#L60), :92. No Hello packets, neighbor FSM, LSA flooding/aging/retransmission, actual LSDB, election, ABR summaries, redistribution or ECMP. `broadcast` exists for passive LAN description; active broadcast is rejected by [schema.ts:394](../src/lib/schema.ts#L394) |
| Partially modeled / simplified | ARP success/failure observations reconstructed from supported probe history | [engine.ts:234](../src/lib/engine.ts#L234), `arpState`; [VLAN tests:170](../tests/vlan.test.ts#L170). No packet exchange scheduler, aging, gratuitous/proxy ARP, malicious ARP, or universal PC CLI support |
| Partially modeled / simplified | Interface up flag, modeled access-port peer status, five-probe binary ping summary and return-aware trace | [engine.ts:276](../src/lib/engine.ts#L276), :374. No independent physical/line-protocol FSM, measured latency, random loss, DNS lookup or per-probe TTL/ICMP packets. Loop detection is revisited-router/16-step protection, not actual TTL expiry |
| Partially modeled / simplified | Fixed fault-family diagnosis, selected evidence and worked configuration; seven-case assessment | [grading.ts](../src/lib/grading.ts), [preview.ts](../src/lib/preview.ts), [sessions.ts](../src/server/sessions.ts). No arbitrary text understanding or command-entry configuration assessment |
| Not implemented | IPv6 addresses/routes/ND/SLAAC, EIGRP, STP, PPP, VPN | Absent from [schema.ts](../src/lib/schema.ts), [engine.ts](../src/lib/engine.ts), command enum and scenario registry. No positive scenario/tests establishing them |
| Not implemented | EtherChannel, 802.1Q trunks/native/allowed VLANs, SVI/inter-VLAN routing, DHCP leases, DNS service, NAT/PAT translation, ACL filtering | Same sources. Metadata, examples or exclusions do not create operational behavior |
| Not implemented | OSPF authentication beyond `none`, multiarea forwarding, broadcast DR/BDR, virtual links, full packet simulation; SNMP/NTP/syslog services, virtualization/automation workflows | Schema/engine/catalog contain no corresponding operational model. Some general terms appear in documentation/teaching; they are not executable capabilities |
| Not implemented | Network builder, general IOS shell, persistent configuration edits, scenario-content revision migration beyond frozen revision 1 | [schema.ts:152](../src/lib/schema.ts#L152), [topology.tsx](../src/components/topology.tsx), [catalog.ts:223](../src/lib/catalog.ts#L223). Public topology is an authored chain; new branching graphs need explicit UI/authoring support |

The current renderer includes a `DR` string in a generic OSPF interface branch, but schema-valid authored active broadcast networks are rejected. That string is **not** an implemented DR election. Likewise access speed/duplex fields are display/configuration metadata, not a negotiation or duplex-fault simulator. The engine has no traffic queues, scheduling clock, DSCP policy or congestion measurement to support the QoS material in `QoS.ppt` slides 3–47.

## Command inventory

Authority: [command enum](../src/lib/schema.ts#L9), [per-device dispatcher](../src/lib/catalog.ts#L223), [execute](../src/lib/engine.ts#L293). Every command is a bounded renderer, not raw IOS or Windows output. Headings/explanatory sentences are fixed templates; addresses, routes, neighbors and supported observations derive from the same scenario/engine. No runtime LLM fabricates results.

| Supported command | Output provenance / limit |
| --- | --- |
| `ipconfig`, `ipconfig /all` | Authored interface/gateway/MAC plus calculated mask. `/all` explicitly states static addressing and no DNS configuration; not a DHCP/DNS query |
| `route print` | Constructed PC connected/local/default view; loopback/multicast omitted |
| `ping` | Calculated request AND return reachability; uniform 5/5 or 0/5 summary, no latency/partial loss |
| `traceroute`, `tracert` | Derived forward hops filtered by ability to respond to source; simplified stop reasons, not per-probe TTL output |
| `arp -a` | History-derived learned mappings/last resolution observation; starts empty, no clock-based aging |
| `show ip interface brief` | Interface addresses and one authored up flag; status/protocol are not independently modeled |
| `show ip route` | Computed C/L/S/O table, fixed modeled administrative distances; longest-prefix forwarding uses it |
| `show ip ospf neighbor` | Computed established neighbors only; remaining Dead display is floor(0.9 × configured Dead), explicitly not a running clock |
| `show ip ospf interface` | Configured area/type/cost/MTU/timers/passive behavior plus computed neighbor counts; no full FSM |
| `show ip protocols` | Configured OSPF interfaces/areas/passive list, computed information sources; process ID rendered as 1 |
| `show running-config` | Reconstructed supported interface/OSPF/static/access-VLAN config; omits unmodeled IOS features |
| `show vlan brief` | Authored VLAN activity and port membership, not a MAC table |
| `show interfaces status` | Port/peer/VLAN state plus authored speed/full duplex; no live counters |
| `show interfaces fastethernet0/1 switchport`, `show interfaces fastethernet0/24 switchport` | Two exact supported access-port inspections, not arbitrary IOS argument parsing or trunk negotiation |

No `show interfaces trunk`, `show mac address-table`, `show spanning-tree`, `show etherchannel`, `show ipv6 ...`, `show ip ospf database`, config-mode shell or command abbreviations. Unsupported buttons/strings do not imply future support. Ping/trace use a destination field, not an embedded CLI flag parser.

Command-set abbreviations for exact per-case availability:

- **R-OSPF:** six router show commands above + ping/traceroute.
- **R-basic:** interface brief, route, running-config, ping.
- **PC-full:** ipconfig, ipconfig /all, ping, tracert. **PC-basic:** ipconfig, ping.
- **SW-basic:** vlan brief, interfaces status.

| Case | Router(s) | PC-A | PC-B | Switch |
| --- | --- | --- | --- | --- |
| 001 | R-OSPF | PC-full | PC-full | None |
| 002 | R-basic | PC-full + route print | PC-basic | SW-basic |
| 003 | R-basic | PC-full + arp -a | PC-basic | SW-basic + both exact switchport inspections + running-config |
| 004 | R-basic + traceroute | PC-full | PC-basic | SW-basic + running-config |
| 005, 006 | R-OSPF | PC-full | PC-basic | None |
| 007 | R-basic + traceroute | PC-full | PC-basic | None |

Optional router ping source is exposed by the current UI for LAB 004–007 (`supportsPingSource` in [netfault.tsx:115](../src/components/netfault.tsx#L115)); the engine validates active local interfaces/addresses. Do not imply arbitrary command flags or source options on other commands.

## Conditional new-topic feasibility — proposals only

**The selected next Academy lesson requires no engine work.** The [next-milestone brief](wia2008-next-milestone.md) uses public worked examples and existing cases within their actual scope. Every simulator proposal below is a later option, not authorization. Source keys refer to exact files in [sources](wia2008-sources.md).

| Candidate / exact historical evidence | Required behavior and honest smallest approach | Investigation, repair and recovery contract / risk |
| --- | --- | --- |
| **Selected OSPFv2 Academy bridge:** S5 `Single Area OSPF.ppt` 36–44, 56–57 | Reuse public Academy choices/revisions and IPv4 reasoning. Teach interface matching, passive advertisement and complementary checks. **No scenario/engine change**; command examples are conceptual | Independent changed-interface table plus external configuration artifact. Do not claim the app executes `network` or config mode |
| Broader OSPF: S5 5–35, 45–56 | Current predicates cover steady-state point-to-point area/passive/timer cases. No real LSDB, election, external OSPF default route or general branching topology qualification | Use diagrams/calculation and actual PT observations first. Another predicate fault is not automatically a missing learning outcome |
| STP: S1 `STP.ppt` 13–24, 28–40 | Need explicit variant, bridge/port identities, costs, root/role selection and forwarding constrained by blocked state. Access-VLAN traversal alone is insufficient | Compare predicted roles with observed tree, target one priority/cost setting, recompute and verify unaffected traffic. No fabricated convergence/storm timing. PT preferred before engine proposal |
| EtherChannel/trunks: S2 `Etherchannel.ppt` 10–23 | Need selected PAgP/LACP/static rules, member consistency, logical aggregate edges, and access/trunk/native/allowed-VLAN semantics for the depicted trunk example (20) | Inspect both endpoints and members, correct one mismatch, verify bundle and VLAN traffic. Mode labels and plausible strings cannot replace negotiation/forwarding state |
| IPv6/OSPFv3: S5 58–61; IPv6 ACL: S6 `Access Control List(ACL).ppt` 35–37 | Address-family parsing, scoped next hops, neighbor resolution and both forwarding directions; routing/filtering behavior separately specified. IPv4 assumptions cannot be reused silently | Start with Academy foundations and real tool work. A future case needs coherent route/neighbor/probe evidence and a minimal repair with reply-path tests. No ND/RA/SLAAC behavior implied today |
| ACL: S6 3–20, 26–36 | Ordered rule evaluation by address/protocol/ports, direction and interface at specified forwarding stages; respect first match and implicit policy. Separate IPv4 and IPv6 scope | Test both allowed and denied traffic in both directions, with wrong-order/wrong-interface controls. Source slide 21 ID discrepancy must not be copied |
| NAT/PAT: S7 `NAT.ppt` 6–24 | Translation eligibility, address/port mappings, bidirectional/session state and rule/route interactions. No current packet tuple/session model | Distinguish route versus translation failure; repair one setting, verify return mapping and unaffected flows. Resolve slide 23 ACL/host conflict. Prefer PT initially |
| LAN security: S4 `LAN & Switch Security.ppt` 23–43 | Port-security state/violations, DHCP bindings/trust, ARP validation or BPDU guard each needs its own bounded model. Current ARP replay does not model attackers or leases | Investigate legitimate and rejected traffic, change only intended policy, verify protection remains. Avoid converting gateway/VLAN labs into security claims |
| WAN/GRE/IPsec: S8 `WAN.ppt` 14–44; S9 `VPN & IPsec.ppt` 16–31 | No serial/session/MPLS/tunnel/security model. GRE needs inner/outer addressing and route behavior; a secured tunnel requires separately defined policy/session evidence | Compare underlay and tunnel observations, correct endpoint/route and test traffic. A tunnel-up boolean cannot establish confidentiality. Reconcile S9 27–28 before tool reproduction |
| QoS: S11 `QoS.ppt` 3–24, 33–47 | Conceptual queue/marking calculations need no network-engine change. Operational performance requires time, offered load, queues/scheduling/drop behavior and measurable outputs | Existing binary ping/trace cannot demonstrate jitter or throughput. Use bounded paper/tap examples or actual tool measurements; no arbitrary latency values |
| Management/design/automation: S10 `Network Management.ppt` 3–68; S12 `Network Virtualization & Automation.ppt` 17–62 | Most topology, log, JSON or API reasoning needs Academy content and external artifacts, not a new packet engine. Actual CDP/NTP/syslog/SNMP would require protocol/service state | Clearly label example logs/responses. Require genuine tool output if execution is claimed; no fake deployed controller or arbitrary prose grading |
| EIGRP/PPP: H24 p.46; S8 16/44 | No DUAL/metric/session implementation. Detailed EIGRP practical absent; PPP references do not specify a complete task | Retain an evidence-limited backlog. Never relabel OSPF computation as EIGRP or point-to-point network type as PPP |

Any new executable case needs: one source-backed objective; independently specified healthy/faulted state; all diagnostic views derived coherently; exact minimal repair; wrong repair rejection; source/return and unaffected-path tests; honest unsupported responses; server evidence/deadline/privacy tests; version compatibility; desktop/414px/offline practice acceptance. New topology support, scenario identifiers and frozen revisions are explicit engineering work, not an automatic JSON-only content addition.
