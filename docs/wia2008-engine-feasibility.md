# Engine capability and course feasibility audit

**Milestone 3D, documentation only. Provisional course alignment.** [Sources](wia2008-sources.md) distinguish current code from the historical official handbook and missing retake materials. No engine, tests, scenarios or rendering were changed or executed for this audit.

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

The current renderer includes a `DR` string in a generic OSPF interface branch, but schema-valid authored active broadcast networks are rejected. That string is **not** a implemented DR election. Likewise access speed/duplex fields are display/configuration metadata, not a negotiation or duplex-fault simulator.

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

No new scenario is selected here. Each row is a decision aid if the current course materials establish a need; none authorizes implementation. The existing tests above support reuse only in their stated scopes.

| Candidate / evidence status | Concrete behavior needed and smallest honest approach | Investigation → hypothesis → repair → recovery | Risks / appropriate alternative |
| --- | --- | --- | --- |
| IPv6 gateway/static-route diagnosis; H24 O3, exact practical unknown | Address-family-aware parsing, interface/route/next-hop model and bounded neighbor resolution; extend both forward and reply paths. Existing IPv4 algorithms are references, not IPv6 support. **First use conceptual Academy exercises; no engine needed** | Observe source/prefix/route/neighbor information; distinguish local resolution from absent route; change one structured setting; verify both directions | IPv4 broadcast/ARP assumptions cannot be reused. Link-local interface scope, ND, RA/SLAAC and address selection must be explicitly included/excluded. Use the actual IPv6 practical first |
| STP fault/role investigation; H24 synopsis | Existing access graph cannot model blocked paths or elections. A separately bounded steady-state tree model would need bridge/port identity, costs, role/state derivation and forwarding constrained by that state | Observe actual roles/tree and redundancy; predict blocked/forwarding path; apply one targeted priority/cost correction if specified; recompute and test reachability | Variant/tie-break/topology-change assumptions are high-risk. Prefer diagram role reasoning and Packet Tracer observation until variant is confirmed; no packet storm theater |
| EtherChannel mismatch; U3D Chapter 2 uninspected | Need member eligibility, chosen negotiation mode, aggregate state and one logical forwarding edge. No current aggregation support. Restrict to the specific course mode if authorized | Inspect both endpoints/member state; explain why bundle fails; repair only incompatible member/mode; verify bundle and required connectivity | LACP/PAgP/static mode, VLAN/MTU/speed constraints and interaction with STP cannot be guessed. Start from original sheet on real/PT equipment |
| OSPF conceptual/configuration coverage; H24, U3D Chapter 5 uninspected | Current point-to-point predicate/routes can support another compatible fault, but do not add one without a distinct outcome. Broadcast/LSDB work requires real additional state or clearly labeled paper examples | Choose observations distinguishing IP reachability, adjacency and route availability; predict a minimal fix and changed routes; verify it independently | Three similar existing cases already cover predicate failures. Extra cases may add repetition rather than learning. Teach/configure missing mechanisms outside the simulator first |
| EIGRP diagnosis; H24 synopsis | No state or algorithm exists. Do not relabel OSPF's Dijkstra result. A bounded steady-state model would require explicit metric/neighbor/route rules for the chosen scope | Inspect course-required neighbors/topology/routes; identify violated compatibility or selection rule; targeted correction; independent routes/probes | DUAL/feasibility and transient behavior exceed a cosmetic renderer. Prefer conceptual questions plus authentic tool practice; defer engine unless simulator value is demonstrated |
| PPP or VPN fault; H24 synopsis | No serial/session/tunnel/security model. Require exact encapsulation, authentication or tunnel type before specifying even a narrow model | Inspect actual endpoint/link/session evidence; discriminate underlay versus session/policy fault; correct one setting; verify required session AND traffic | Avoid treating a boolean “tunnel up” as all VPN behavior. External practice is the default; separate each confirmed technology into a bounded task |
| Trunk/VLAN extension; not established by inspected course source | Need access/trunk types, tagging/native/allowed-VLAN semantics and VLAN-aware traversal/observations. Existing access-port state only supplies a starting graph | Compare both ends and active allowed VLANs; repair one verified mismatch; test intended VLANs and isolation | Native-tag treatment and mixed VLAN paths need paired tests. Do not assume every EtherChannel lesson requires implementing trunks here |
| ACL/NAT/DHCP fault; current-course requirement unknown | Respectively ordered directional filtering, translation with return/session state, or lease/pool/relay/time behavior. No current supporting model | Observations must distinguish policy, translation or lease state from route failure; repair relevant state; test both permitted recovery and forbidden/unaffected traffic | A convincing show-output string is insufficient. Keep outside roadmap priority until sources justify one narrow extension |
| Management/design/virtualization/automation; U3D Chapters 10/12 uninspected | No generic new packet engine needed for many conceptual/design/API-reading objectives. Use source-authored diagrams, structured decisions and external tool exercises | Evidence may be topology constraints, authentic logs or API responses; form/test a hypothesis in the specified tool | Do not invent telemetry, grade unconstrained prose or call a mock API a deployed controller. Confirm tools, artifacts and rubric first |

Any new executable case needs: one source-backed objective; independently specified healthy/faulted state; all diagnostic views derived coherently; exact minimal repair; wrong repair rejection; source/return and unaffected-path tests; honest unsupported responses; server evidence/deadline/privacy tests; version compatibility; desktop/414px/offline practice acceptance. New topology support, scenario identifiers and frozen revisions are explicit engineering work, not an automatic JSON-only content addition.
