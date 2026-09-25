# NetFault × supplied 2026/27 semester material

## Post-3J planning delta — 25 September 2026

**PLANNED ONLY — NO FHRP ENGINE OR LAB 011 IMPLEMENTED.** The [focused FHRP audit](fhrp-feasibility.md) freshly inspected R3/P3, including all native text and eleven diagram/command slides. Current material explicitly teaches HSRP priorities/default, preemption/incumbency, virtual IP/MAC/ARP, Active/Standby, timers and verification; tracking configuration was not established. The [3K proposal](milestone-3j-plan.md) selects **The shared exit**, one priority design fault with working connectivity. Fixed preemption-on and unequal priorities permit a useful settled model without failure/restart history; virtual ownership must affect forwarding and preserve ordinary Standby return routing. This refines the earlier blanket event-cost assumption for this narrow case only. Ten labs remain playable; FHRP coverage is still absent and broader failover, VRRP/GLBP and tracking remain gaps. No implementation is authorized by this planning update.

## Post-3I coverage delta — 25 September 2026

[LAB 010](milestone-3i.md) now supplies partial executable STP root/BID/path/role reasoning and an applied priority-correction loop, grounded in P1/R1. It tests a design violation while host connectivity still succeeds. A small public preparation card and private seven-part case lesson accompany it; no Academy module/revision changed. Ten labs are playable. Protocol timing, full RSTP, multiple VLANs/trunks, port-priority ties and edge guards remain gaps; no university practical or real-device competence is claimed. The 3H planning-only and earlier coverage snapshots below are historical.

## Post-3H planning delta — 24 September 2026

**PLANNED ONLY — NO STP ENGINE OR LAB 010 IMPLEMENTED.** [The STP feasibility audit](stp-feasibility.md) freshly inspected current `1.STP.ppt`/`1.STPrv.txt`, both STP decks' native text, selected current/historical visuals and relevant supplied practical/management passages. It records exact citations, clipping/source qualifications, current L2 limitations and a candidate comparison. [The proposed 3I plan](milestone-3h-plan.md) selects one incorrect bridge-priority case, **The unexpected detour**, with coherent before/after trees and a narrow prerequisite primer. This adds planning evidence only: STP remains an implementation/learning gap; there are still nine playable labs and no new Academy content. Implementation needs separate authorization. The earlier audit and post-3G coverage below retain their dated provenance.

Audit date: 23 September 2026. **Historical documentation-only baseline; LAB 009 did not exist at that audit.** Baseline: commit `dda7c0b` (`lab 008`), clean working tree at intake. Milestone 3F acceptance, including physical iPhone testing, is **user-reported physical iPhone verification**, not a new test performed in this audit.

Original recommendation: one standard IPv4 ACL ordering investigation. This was separately authorized and implemented on 24 September 2026: [Milestone 3G record](milestone-3g.md), [bounded model](acl-model.md), [verification](verification.md).

## Post-3G coverage delta — 24 September 2026

The inventory, matrix and candidate comparison below retain the eight-lab audit baseline. LAB 009 now adds executable **partial** coverage of R6/P6 source-only standard ACL order, /24 wildcard/any matching, outbound attachment and sequence repair. R10/P10 troubleshooting gains a second applied-change loop, explicitly requiring positive and negative policy proof with fresh observations. No new Academy module or authentic device configuration practical is completed. ACL coverage is not comprehensive: inbound/extended/IPv6 ACLs, arbitrary wildcard/host cases, counters/logging and real deployment remain absent. Security, the entire ACL chapter and the semester syllabus must not be labeled complete. All other matrix gaps remain; no later candidate is authorized by this update.

## 1. Material inventory and provenance

The actual archive was found at:

`C:\Users\afiq hakiki\OneDrive - Universiti Malaya\Degree year 3\ant(REPEAT)\26.27_material.zip`

- Size: 18,731,093 bytes; 31 root entries.
- SHA-256: `F50841753A0D2AA476061BAADA3CDAB683F2BAB86FB2D8F1D6D083799F15205B`.
- The user identifies this as the supplied current-semester teaching material. Its contents, rather than an internet syllabus, are the primary curriculum evidence here.
- **Version caveat:** `0.Intro.ppt` slides 9–10 include May/June **2023** lab-test dates and assessment percentages. They are evidence of what that file says, not confirmed 2026/27 dates or assessment rules. Slides 4–5 give a topic sequence; this audit does not promise exam weighting or deadlines.
- The earlier `wia2008-*` documents record historical intake. Their “current material absent” statements are historical and superseded for this task by this archive. They were consulted, not rewritten. No claim that course completion has been achieved follows from obtaining the archive.

### Exact archive entries and inspection depth

`R1`–`R12` below refer to the exact revision TXT filenames; all twelve were read completely. `P1`–`P13` refer to the paired lecture decks; slide numbers are one-based. Native text, grouped shapes and table text were extracted read-only from all 14 legacy PPTs plus the PPTX. Extraction is not a claim that every embedded image was inspected.

| Key       | Revision file, fully read | Paired lecture file  | Slides |
| --------- | ------------------------- | -------------------- | -----: |
| R1 / P1   | `1.STPrv.txt`             | `1.STP.ppt`          |     42 |
| R2 / P2   | `2.ETHERCHANNELrv.txt`    | `2.ETHERCHANNEL.ppt` |     23 |
| R3 / P3   | `3.FHRPrv.txt`            | `3.FHRP.ppt`         |     29 |
| R4 / P4   | `4.LANrv.txt`             | `4.LAN.ppt`          |     43 |
| R5 / P5   | `5.OSPFrv.txt`            | `5.OSPFrv.ppt`       |     61 |
| R6 / P6   | `6.ACLrv.txt`             | `6.ACL.ppt`          |     39 |
| R7 / P7   | `7.NATrv.txt`             | `7.NAT.ppt`          |     30 |
| R8 / P8   | `8.WANrv.txt`             | `8.WAN.ppt`          |     53 |
| R9 / P9   | `9.VPNrv.txt`             | `9.VPN.ppt`          |     43 |
| R10 / P10 | `10.MANAGEMENTrv.txt`     | `10.MANAGEMENT.ppt`  |     76 |
| R11 / P11 | `11.QoSrv.txt`            | `11.QoSrv.ppt`       |     47 |
| R12 / P12 | `12.NETWORKAUTOrv.txt`    | `12.NETWORKAUTO.ppt` |     72 |
| P13       | No separate revision TXT  | `13.netsec.ppt`      |     53 |
| Intro     | —                         | `0.Intro.ppt`        |     12 |
| Extra     | —                         | `ExtraLab.pptx`      |      2 |

Additional entries:

| Key            | Exact file                                                                            | What was inspected                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| E-Practical    | `6.4.2 Lab - Implement Etherchannel.docx`                                             | All 112 nonempty extracted paragraphs, including table contents; embedded topology image and logo. Parts 1–4 and their commands read. |
| S-Practical    | `11.6.2 Lab - Switch Security Configuration.docx`                                     | All 304 nonempty extracted paragraphs, including tables and command output; embedded topology image and logo.                         |
| GRE-Activity   | `16.2.1 Packet Tracer - Configure GRE.pka`                                            | Filename, ZIP entry and size (832,457 bytes) only. Internal tasks/topology not inspected or executed.                                 |
| IPsec-Activity | `8.4.1.2 Packet Tracer - Configure and Verify a Site-to-Site IPsec VPN using CLI.pka` | Filename, ZIP entry and size (314,129 bytes) only. Internal tasks/topology not inspected or executed.                                 |

Native slide text was read completely for Intro, P6, P13 and Extra; relevant concept/configuration/verification passages were cross-checked in the other decks against the complete revision notes. Additional visual inspection:

- P13: slides **4, 7, 9–12, 15, 17–19, 21, 26–27, 30–31, 35, 38–39, 43, 52–53**. These supply image-based tables on security vocabulary, actor/tool classes, malware, social engineering, IP/DNS attacks, defense in depth and cryptography.
- P6: **11–13, 21, 23–24, 26–27, 31–34, 37–39**. Wildcards, ACL examples, sequence editing and IPv6 examples were visible. Some rightmost text in slide 38 is cropped in the source rendering; no missing command suffix was inferred.
- Extra: **both slides**. Week 4 depicts an IPv6 OSPFv3 exercise; Week 7 depicts VLAN/inter-VLAN/DHCP/dynamic NAT with constrained return routing. These add explicit integration evidence, not completed learner activities.
- DOCX inspection used native paragraphs/tables and embedded images, not a complete page-layout rendering. Remaining lecture embedded images are only partially reviewed. Commands not found in the inspected portions are described as “not established here,” not asserted absent from every slide.

Temporary extraction/rendering stayed outside the repository. Original files were not modified. No Packet Tracer, router or switch session was executed; source screenshots are teaching examples, not independent device validation. No dependencies were installed.

### Evidence conventions and source qualifications

**Course** means explicitly present in the files above. **Implemented** means supported by current source code. **Design inference** means a proposed teaching opportunity derived from those two bodies of evidence. Proposed fault stories are original NetFault designs, not claimed lecturer exercises.

Keep these qualifications visible rather than silently rewriting the lecturer:

- R2's shorthand about trunks and fixed group/member limits needs context: P2 slides 15–17 distinguish static `on` from LACP and allow same-VLAN access members or trunks; E-Practical describes eight active plus eight standby links. LAB 008 deliberately models two access members, not universal platform limits.
- P6 slide 21 creates ACL 10 but its pictured interface binding says ACL 1. The proposed lab will use an internally consistent new name; it will not reproduce that discrepancy as a second fault. P6 slide 24's displayed sequence ordering also warrants authentic device cross-check before treating screenshots as literal output templates.
- R10/P10 slide 23 describe SNMP using UDP 162 generally. Preserve that source statement in the inventory; distinguish request and notification behavior in any future technical lesson after primary-reference verification. No SNMP implementation is proposed here.
- P9 slides 16–17 discuss multicast limitations of conventional IPsec; slide 21 explicitly introduces multicast-capable VTI. Do not generalize the first statement to every IPsec deployment. GRE's lack of inherent security is explicit in P9 slides 16 and 24.
- R9/P13 contain historical algorithms/key lengths. Inventorying DES, 3DES, MD5, RC4 or old RSA/DH examples is not a current deployment recommendation.
- S-Practical's sticky-address section includes a sample reporting zero sticky addresses alongside a later SecureSticky table. Treat samples as potentially different stages; do not invent a device trace that reconciles them.
- Intro mentions EIGRP/PPP and wider CCNAv7 module bundles; that is weaker depth evidence than a revision chapter or practical. It does not authorize adding every CCNA topic.

## 2. Current LAB 001–008 curriculum inventory

Authoritative sources: [public catalog and command dispatch](../src/lib/catalog.ts), [private registry](../src/server/scenarios.ts), the private scenario files linked below, [engine](../src/lib/engine.ts), [grader](../src/lib/grading.ts), [trial replay](../src/lib/repair-trial.ts), [preview](../src/lib/preview.ts), and [application workflow](../src/components/netfault.tsx). Subjects were checked against configured state, faults, repairs and evidence rules, not inferred from filenames.

### Shared behavior and exact command sets

All eight have Practice and Assessment. Practice downloads an inspectable scenario pack, permits progressive hints/reveal and saves attempts locally; offline use requires both that pack and a complete cached application shell. Retry is a new attempt. Assessment uses server-owned commands/history/deadline/grading; no active hints/reveal, online required, durable resume. Final feedback contains explanations/solutions. Notes are recorded, not language-graded.

**Critical distinction:** LAB 001–007 grade diagnosis/evidence/proposed repair. Their separate canonical repaired preview can demonstrate recovery after feedback but **does not require the learner to apply a trial or collect fresh post-change evidence to earn full credit**. LAB 008 adds the actual trial/recovery/fresh-verification loop. Do not retroactively credit that capability to seven older labs.

Command shorthand used below, expanded here to avoid implying unsupported IOS features:

- **OR**: `show ip interface brief`, `show ip route`, `show ip ospf neighbor`, `show ip ospf interface`, `show ip protocols`, `show running-config`, `ping`, `traceroute`.
- **BR**: `show ip interface brief`, `show ip route`, `show running-config`, `ping`.
- **PC**: `ipconfig`, `ipconfig /all`, `ping`, `tracert`.
- **SW**: `show vlan brief`, `show interfaces status`.
- **EC**: SW plus `show etherchannel summary`, `show lacp internal`, `show interfaces port-channel 1`, `show running-config`.
- Targeted probes take a destination; router pings can carry a validated local interface/IP source. `show interfaces trunk`, arbitrary configuration CLI, `show ip ospf database`, and unrestricted MAC-table commands are not current executable commands.

Topology **T3**: PC-A—R1—R2—R3—PC-B; `192.168.10.0/24`, `10.0.12.0/30`, `10.0.23.0/30`, `192.168.30.0/24`. Topology **T2S**: PC-A—SW1—R1—R2—PC-B; `192.168.10.0/24`, `10.0.12.0/30`, `192.168.20.0/24`. SW1 is unnumbered L2, never an IP trace hop.

| Lab / exact title / authoritative definition                                           | Topic, sole fault and topology                                                                                                                                                | Available diagnostics                                                                                                                                                           | Required graded evidence                                                                                                                            | Repair and modeled recovery / verification                                                                                                                                                                                                        | Distinct reasoning and overlap                                                                                                                       |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **001 — The silent route** ([definition](../src/server/scenario.ts))                   | OSPF area mismatch; T3. R3 Gi0/0 area 1 vs R2 Gi0/1 area 0. R1–R2 FULL; transits explicitly point-to-point.                                                                   | All routers OR; both PCs PC.                                                                                                                                                    | R2 and R3 area views (OSPF interface or config), plus neighbor and route impact. Affected set is R2 + R3.                                           | Propose R3 area 0. Preview derives reciprocal FULL, remote LAN routes and host connectivity. No fresh-evidence grading.                                                                                                                           | Compare peer compatibility while distinguishing physical reachability from adjacency. Overlaps 005/006 symptoms, not causal evidence.                |
| **002 — Beyond the local network** ([definition](../src/server/gateway-scenario.ts))   | Host forwarding; T2S. Only PC-A gateway `.10.254` is wrong; actual R1 gateway `.10.1`; OSPF infrastructure healthy.                                                           | Routers BR; SW1 SW; PC-A PC + `route print`; PC-B `ipconfig`, `ping`.                                                                                                           | Grader requires PC-A IP/default-route observation; router/VLAN and local-vs-remote checks improve investigation but are not all mandatory evidence. | Propose gateway `.10.1` plus structured on-link-router explanation. Preview restores request/reply delivery. No applied trial or fresh gate.                                                                                                      | Local/remote next-hop choice and ARP resolution. Foundation for 003/004; not DHCP spoofing.                                                          |
| **003 — The Wrong Network** ([definition](../src/server/vlan-scenario.ts))             | Access VLAN separation; T2S. SW1 FastEthernet0/1 VLAN 20 vs intended 10; FastEthernet0/24 correctly 10, both active/up.                                                       | Routers BR; SW1 SW + per-port `show interfaces fastethernet0/1 switchport`, `show interfaces fastethernet0/24 switchport`, config; PC-A PC + `arp -a`; PC-B `ipconfig`, `ping`. | PC-A addressing plus both access-port membership observations. Failed ping alone earns no evidence credit.                                          | Propose only PC-facing port VLAN 10. Preview restores next-hop resolution/local and remote probes. ARP is history-derived. No fresh gate.                                                                                                         | Broadcast-domain membership despite correct IP/cable; not trunking, VLAN hopping or port security.                                                   |
| **004 — The Missing Return Path** ([definition](../src/server/return-scenario.ts))     | Static reply routing; T2S. R1 forward route correct; R2 lacks `192.168.10.0/24`, no default/OSPF.                                                                             | Routers BR + `traceroute`; SW1 SW + config; PC-A PC; PC-B `ipconfig`, `ping`.                                                                                                   | R1 route table plus PC-A addressing and R2 route table.                                                                                             | Propose R2 static `.10.0/24` via `10.0.12.1` and reply-lookup explanation. Preview proves both directions and source-sensitive probes. No fresh gate.                                                                                             | A delivered request is not a successful ping; transit-sourced router success can hide missing host return route.                                     |
| **005 — The Silent OSPF Interface** ([definition](../src/server/passive-scenario.ts))  | Passive transit; T3. R2 Gi0/1 passive, other parameters healthy. Passive LANs are intentional.                                                                                | Routers OR; PC-A PC; PC-B `ipconfig`, `ping`.                                                                                                                                   | Explicit R2 passive setting plus up/interface, neighbor and route context.                                                                          | Propose no-passive on R2 Gi0/1 and Hello/adjacency explanation. Preview restores FULL and LAN routes while retaining passive LANs. No fresh gate.                                                                                                 | Passive advertisement differs from Hello transmission. Similar missing adjacency to 001/006, different discriminating configuration.                 |
| **006 — The Mismatched Timers** ([definition](../src/server/timer-scenario.ts))        | OSPF compatibility; T3. R3 Gi0/0 5/20 vs intended 10/40.                                                                                                                      | Routers OR; PC-A PC; PC-B `ipconfig`, `ping`.                                                                                                                                   | Both endpoint timer/config views plus missing relationship and route impact.                                                                        | Propose R3 10/40 and compatibility explanation. Preview restores FULL and routes. Matching both sides to an unintended profile is not accepted. No fresh gate.                                                                                    | Compare both fields and design intent; useful differentiation, but a third OSPF adjacency case adds less breadth than a new policy skill.            |
| **007 — The Wrong Next Hop** ([definition](../src/server/next-hop-scenario.ts))        | Installed wrong static next hop; T3. R2 `.30.0/24` via `10.0.12.1` points back at R1 instead of R3 `10.0.23.2`.                                                               | Routers BR + `traceroute`; PC-A PC; PC-B `ipconfig`, `ping`.                                                                                                                    | R2 wrong route, R1 reciprocal forwarding decision, R3 actual adjacent address.                                                                      | Propose targeted next-hop replacement and forward-route explanation. Preview removes loop and preserves returns. No fresh gate.                                                                                                                   | Installed/resolvable route can still be wrong. Unlike 004, request never arrives. Loop handling is bounded, not packet-accurate TTL simulation.      |
| **008 — Across the connection** ([definition](../src/server/etherchannel-scenario.ts)) | LACP initiation; PC-A—SW1—two physical members—SW2—PC-B. Both `.40.10/.20` in `172.22.40.0/24`, access VLAN 40, no gateway. Both groups passive, explicit standalone-disable. | Switches EC; PCs PC + `route print`.                                                                                                                                            | Initial both host configs + physical status; both local modes; both logical bundle views.                                                           | Apply existing switch/group active/passive trial. Actual recovery requires full intended membership, both host paths, and only one switch's mode changed. Select latest-version logical output on both switches and host ping in both directions. | Physical carrier ≠ logical forwarding. First implemented full repair-and-fresh-verification loop; new discipline beyond seven proposal/preview labs. |

LAB 008 permits ten actual changes and 100 commands. No-op changes do not create versions. A second real change invalidates older verification for the current configuration. These are practical bounds, not mastery metrics.

### Academy coverage, separately from private lab teaching

Current sources: [content assembly](../src/lib/academy/content.ts), [preserved IPv4 content](../src/lib/academy/content-v1.ts), [OSPF content](../src/lib/academy/ospf-content.ts), [four Field Guides](../src/lib/lessons.ts).

- **Direct:** three revision-2 IPv4 lessons: _Understanding IPv4 Addresses_, _Subnets, Subnet Masks, and Local Networks_, _Default Gateways and ARP_. Six tap exercises and five diagrams develop address validity, binary/prefix/host ranges, local/remote selection and next-hop reasoning. Archived revision 1 remains readable; it is not additional current curriculum breadth.
- **Direct but bounded:** revision-1 OSPFv2 lesson _From interfaces to verified OSPFv2 routes_, two tap exercises and two diagrams. Local interface activation, /24-/30/exact wildcard selection, process ID versus router ID, passive LAN versus active point-to-point transit, and a chain of verification. Optional external device companion remains UNEXECUTED.
- **Partial/reference:** guides on addressing/default gateway, physical/protocol state, OSPF areas/neighbors/network types, and routes/evidence/return path. Broader route and diagnostic concepts are explained; a guide is not a device configuration exercise.
- **Indirect only:** broadcast DR/BDR, authentication/MTU as possible OSPF checks, and ACL/NAT exclusion statements. Mentioning “no ACL” does not teach ACL processing. General ARP or VLAN prerequisites do not constitute LAN-security coverage. EtherChannel's substantive lesson is private LAB 008 feedback, not an Academy module.
- **Absent as Academy instruction:** STP operations; EtherChannel curriculum; HSRP/VRRP/GLBP; LAN security; ACL policy; NAT/PAT; WAN; GRE/IPsec; CDP/LLDP/NTP/syslog/SNMP administration; QoS; automation; network-security taxonomy; IPv6 operations. Do not modify Academy in this task or count app implementation technologies as learner instruction.

## 3. Semester-topic inventory: A–E

In this section A = explicit concepts; B = explicit configuration; C = explicit verification; D = **design inference** about diagnosis; E = appropriate learning form. Command spellings follow inspected material; abbreviated note syntax is not promised executable CLI.

### STP — R1; P1 slides 3–34, 38–39; S-Practical Part 4

**A.** Redundancy/single points of failure versus L2 loops, MAC instability, broadcast storms and duplicate frames. Four STA decisions: lowest-BID root (priority, MAC, VLAN/extended system ID), least-root-cost root port, designated port, alternate blocked/discarding port. Sum path cost; equal-cost sender BID, port priority and port-ID tie breaks. Default priority 32768; Hello 2, forward delay 15 and Max Age 20 in the notes. PVST+, RSTP's discarding/learning/forwarding, Rapid PVST+, MSTP; PortFast and BPDU Guard/errdisable. **B.** `spanning-tree cost`, VLAN root primary/secondary, `spanning-tree mode rapid-pvst`, PortFast, BPDU Guard enable. **C.** S-Practical explicitly uses `show spanning-tree interface f0/6 detail`; a broader `show spanning-tree vlan …` candidate command would require additional output-reference validation. **D.** Explain a normally blocked redundant link, wrong intended root/cost or an edge protection event. A different root need not break ping. **E.** Topology reasoning and a later bounded switch lab; no full convergence clock needed for a first root-role exercise.

### EtherChannel — R2; P2 slides 3–8, 10–23; E-Practical

**A.** Logical aggregation, bandwidth/load sharing/redundancy, source/destination MAC/IP distribution, consistency of interface type/speed/duplex/access VLAN or trunk allowed/native settings. PAgP proprietary desirable/auto, LACP multivendor active/passive; static `on` does not negotiate. Platform-specific active/standby limits. **B.** Interface range, `channel-group … mode active`, `interface port-channel`, member/trunk consistency. **C.** `show etherchannel summary`, `show interface Port-channel`, `show interfaces etherchannel`, `show etherchannel port-channel`; practical adds `show interfaces trunk`. **D.** Differentiate carrier, negotiation, membership, logical state and traffic. **E.** Already a strong bounded diagnostic slice in 008; full build/configuration still needs the practical.

### FHRP — R3; P3 slides 3–9, 11, 16–21, 27

**A.** Virtual IP/MAC gateway, active/standby forwarding and Hello-based handover; HSRP states; priority/default 100 and IP tie-break; 3-second Hello/10-second hold; preemption and nonpreemptive incumbency. VRRP master/backups; GLBP load balance; IPv6 gateway/failover context. **B.** Standby version/group/virtual IP/priority/preempt. **C.** R3 `show standby`, `show standby brief`, `debug standby terse`, `debug standby packets`. **D.** Distinguish host use of a physical gateway from virtual gateway, healthy redundancy from expected role, and actual failover from steady-state reachability. **E.** Good future interactive topic but needs virtual identity and controlled failure/role events; another wrong-host-gateway case alone would overlap 002.

### LAN and switch security — R4; S-Practical Parts 1–4

**A.** NGFW/IPS/AMP, ESA/WSA, AAA local/server RADIUS/TACACS+, 802.1X roles. MAC flooding, VLAN hopping/double-tagging, DHCP starvation/spoofing, ARP poisoning/IP-MAC spoofing and STP manipulation; port security, DHCP snooping trust and DAI as mitigations. **B.** Practical VLAN 10 management/access, native 333, unused-port VLAN 999/shutdown, forced trunks/DTP off, port-security maximum/restrict/protect/sticky/aging, snooping VLAN/trust/rate limit, PortFast/BPDU Guard, DHCP pool/exclusions. **C.** `show vlan brief`, `show interfaces status`, `show interfaces trunk`, switchport negotiation view; `show port-security interface`, `show port-security address`, `show ip dhcp snooping`, `show ip dhcp snooping binding`, spanning-tree detail; PC release/renew and ping. **D.** Identify an authorized host rejected by a MAC admission rule; later trust/binding faults require DHCP/ARP event state. **E.** Strong practical basis for a bounded future security lab; general threats/AAA need conceptual instruction too.

### OSPF — R5; P5 slides 15, 46, 56; Extra slide 1

**A.** Link-state/AD 110, neighbor/topology/routing databases, Hello/DBD/LSR/LSU/LSAck, LSA/LSDB/SPF, states from Down through Full, area 0/single-area/multiarea/ABR, DR/BDR/DROTHER and election/nonpreemption, timer/network-type behavior, costs/reference bandwidth. **B.** Router/process IDs, wildcard/network-area or interface activation, passive-interface, point-to-point type, priority/cost/reference bandwidth, Hello/Dead intervals, default origination; OSPFv3 in revision and Extra. **C.** `show ip ospf neighbor`, `show ip ospf database`, `show ip route`, `show ip protocols`, `show ip ospf`, `show ip ospf interface`, brief IP interfaces. **D.** Existing mismatch cases address selected adjacency checks; elections, activation omissions, LSDB-to-route interpretation, cost choice, external default and IPv6 remain different skills. **E.** Keep existing strength; broaden through authentic configuration and later targeted teaching rather than another similar mismatch now.

### ACL — R6; P6 slides 3–10, 14–20, 24–30, 35–39

**A.** Ordered permit/deny ACEs, first match stops evaluation, implicit deny, inbound before routing/outbound after routing, standard source-only versus extended source/destination/protocol/ports, named/numbered ACLs, wildcard bits, placement and one per protocol/direction/interface. VTY access-class and IPv6 differences/ND exceptions. **B.** `access-list`, `ip access-list standard/extended`, `ip access-group … in/out`, removal/sequence edits, access-class, IPv6 traffic-filter. **C.** R6 `show access-list`; P6 slides 24/26 explicitly `show access-lists` with sequences, slide 39 IPv6 ACL output. **D.** Correct routes and an apparent permit do not prove passage if an earlier ACE matches; prove intended allows and denials. **E.** Excellent next interactive policy lab; keep TCP/UDP/IPv6 outside the first source-only model.

### NAT/PAT — R7; Extra slide 2

**A.** Private/public addresses, inside/outside local/global, static one-to-one, dynamic pools, PAT ports/many-to-one, port forwarding. **B.** Inside/outside interface designation, static translation, pool/ACL selection, overload and static TCP forwarding examples. **C.** No NAT show command in R7; lecture image-based verification has not been fully inspected, so a future translation-table format needs additional source/device validation. **D.** Distinguish routing, translation eligibility, interface roles and actual mappings; NAT selection ACL is not automatically a security drop ACL. **E.** High-value later lab, after packet policy; needs rewritten source/destination identities and return mappings, especially PAT transport tuples. Extra explicitly combines dynamic NAT with an unavailable R2 return-route change; do not import the whole integrated exercise as one fault.

### WAN — R8; P8 slides 8, 16, 39–44

**A.** Public/private WAN, P2P/hub-spoke/dual-homed/full/partial mesh, SLA, CPE/DCE/DTE/demarc/local loop/CO/backhaul/backbone, circuit versus packet switching, SDH/SONET/DWDM, DSL/cable/wireless/Metro Ethernet/MPLS, PPP/HDLC, legacy Frame Relay/ATM, FTTx. **B.** Revision is predominantly architecture/technology selection, not a detailed configuration recipe. **C.** No particular diagnostic CLI established by R8. **D.** Identify service boundary/topology and distinguish access failure from routed destination failure. **E.** Conceptual comparison and external practical before a new WAN emulator; don't invent a required PPP authentication lab from the synopsis alone.

### VPN/GRE/IPsec — R9; P9 slides 16–28, 34; two PKA entries

**A.** Site-to-site/remote access, IPsec/SSL/client/clientless, enterprise/provider-managed, GRE encapsulation without inherent encryption, mGRE/DMVPN, VTI, MPLS L2/L3 VPN, AH/ESP, confidentiality/integrity/authentication, algorithms/PSK/RSA/DH. **B.** GRE tunnel interface address, source, destination and optional mode. **C.** Revision gives no dedicated show command; future tunnel views need reference validation. PKA names establish GRE and CLI IPsec activities only. **D.** Reachable outer endpoint does not prove correct inner tunnel destination/path; IPsec selector/key/SA diagnosis would be separate. **E.** Good later GRE lab; full cryptographic/IPsec negotiation far exceeds this next increment.

### Network management/design/troubleshooting — R10; P10 slides 9, 20, 22–32, 44–49, 54–68

**A.** CDP/LLDP discovery; NTP strata; syslog severity/message structure; SNMP manager/agent/MIB/OID/get/set/trap/communities; file maintenance/backup/password recovery; hierarchy/modularity/resiliency/flexibility; documentation and baselines. Seven steps: Define the Problem, Gather Information, Analyze Information, Eliminate Possible Causes, Propose Hypothesis, Test Hypothesis, Solve the Problem. Seven approaches: Bottom-Up, Top-Down, Divide-and-Conquer, Follow-the-Path, Substitution, Comparison, Educated Guess. **B.** CDP/LLDP run, NTP master/server, logging levels/timestamps, community permissions, TFTP/USB backup and ROMMON/config-register recovery. **C.** Discovery neighbors, `show clock detail`, `show ntp associations`, `show logging`, `snmpget`, `show file systems`. **D.** Link each observation to a hypothesis, plan rollback, verify and document actual recovery; later diagnose discovery/time/log context. **E.** Embed the seven-step process in lab trials. A giant theory module is unnecessary for 3G; operational management protocols remain unimplemented.

### QoS — R11; P11 slides 3–4, 9, 15, 18–23, 31, 35, 41, 46–47

**A.** Congestion, fixed/variable delay, jitter/playout/loss, voice/video/data characteristics, FIFO/WFQ/CBWFQ/LLQ, best effort/IntServ RSVP/DiffServ, classification/NBAR, L2 priority and DSCP BE/EF/AF, shaping queues versus policing drop/remark. **B.** Policy mechanisms are taught; revision supplies no executable configuration block. **C.** No specific show command established here. **D.** Separate a functioning IP path from unacceptable delay/loss or mistaken classification. **E.** Visual/conceptual or measured-traffic activity first. Boolean ping and invented latency would not teach QoS. Course performance thresholds are examples, not universal SLAs.

### Network virtualization and automation — R12; P12 slides 7–8, 15, 17, 35, 48, 50–61, 66

**A.** Cloud service/deployment models, type-1/type-2 hypervisors, control/data planes, SDN north/southbound APIs/OpenFlow flow-meter-group tables, device/controller/policy approaches, intent translation/activation/assurance; JSON/XML/YAML; API visibility, SOAP/REST/XML-RPC/JSON-RPC, URI/URN/URL; configuration management. **B.** REST resource/query/methods, API keys, Postman/Python use, NETCONF/RESTCONF mention; Ansible/Chef/Puppet/Salt and push/pull orchestration. **C.** Interpret requests/responses and structured data; no Cisco show-command lab specified by the revision. **D.** Detect request/resource/data mismatch or configuration drift. **E.** Separate structured-data/API teaching, not a new packet-forwarding fault now. NetFault being written in TypeScript/JSON does not teach automation to its learner.

### Network security — P13, all native text plus visual pages listed above

**A.** Asset/vulnerability/threat/exploit/mitigation/risk, internal/data-loss vectors, threat actors and security-tool categories; viruses/Trojans/worms/adware/spyware/ransomware/rootkits; reconnaissance/access/DoS/DDoS; social engineering; IP spoofing/MITM/session hijack, SYN/reset/UDP attacks; DNS cache poisoning/amplification/resource abuse/flux/tunneling; CIA, defense in depth, firewalls/IDS/IPS/AAA/ESA/WSA, integrity/authentication/confidentiality/nonrepudiation and crypto classes. **B.** Defensive placement and control principles; no complete deployable security configuration established by this deck audit. **C.** Reconnaissance examples name whois, ping sweeps and Nmap; none was run. These do not become new NetFault commands. **D.** Infer which control/evidence relates to a symptom without equating every outage with attack. **E.** Mostly conceptual threat/control reasoning; ACL is one narrow operational bridge, not completion of network security.

### Additional explicit scope: IPv6 and integration

Intro outcomes explicitly include IPv4 **and IPv6**. R5/Extra slide 1 contain OSPFv3; R6/P6 35–39 IPv6 ACL; P7 is a 30-slide NAT deck with IPv6-related scope requiring fuller visual review before a detailed translation design. Extra slide 2 establishes VLAN/inter-VLAN/DHCP/NAT integration. Existing NetFault is IPv4 only. Intro's EIGRP, WLAN and wider module titles are recorded as mentions, not enough detail to design those labs without further course evidence.

## 4. NetFault × semester gap matrix

Two independent ratings: **C** conceptual instruction; **T** troubleshooting. NONE = absent; LIGHT = incidental/prerequisite mention; PARTIAL = meaningful bounded subset, not the chapter; STRONG = meaningful hands-on reasoning/diagnosis for the **named narrow skill**. A broad chapter is not STRONG merely because one case exists. Ratings describe opportunities, never learner mastery or course percentage.

| Semester topic / skill                                 | Course evidence                                  | Academy coverage                                | Existing lab coverage                            | C / T and reason                                                      | Missing diagnostic skill                                                   | Suitability / recommended action                      |
| ------------------------------------------------------ | ------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| IPv4 local/remote and next-hop foundations             | Intro outcome; E/S-Practical addressing; Extra 2 | Direct IPv4 lessons + F1/F4                     | 002–004,007                                      | STRONG / STRONG for this foundation: tap reasoning and distinct cases | Transfer to unfamiliar real equipment                                      | Preserve; prerequisite to policy                      |
| STP root, cost, roles and ties                         | R1; P1 13–34                                     | None                                            | None; 008 only mentions STP boundary             | LIGHT / NONE                                                          | Explain valid blocking versus wrong intended root/path                     | High, later bounded topology exercise                 |
| PortFast/BPDU Guard                                    | R1; S-Practical Part 4                           | None                                            | None                                             | NONE / NONE                                                           | Distinguish protected errdisable from cable fault                          | Future security/edge lab, no timer emulator           |
| LACP initiation and logical forwarding                 | R2; P2 14–21; E-Practical Part 4                 | No module                                       | 008                                              | STRONG / STRONG for this precise slice                                | Independent changed-topology transfer                                      | Sufficient now; preserve accepted lab                 |
| EtherChannel chapter incl trunks/PAgP/hash/standby     | R2; P2 3–23; E-Practical Parts 2–4               | None                                            | 008 subset only                                  | PARTIAL / PARTIAL                                                     | Native/allowed-VLAN consistency, protocol alternatives, real build/verify  | Use practical later; no 008 expansion now             |
| FHRP/HSRP/VRRP/GLBP                                    | R3; P3                                           | Gateway prerequisite only                       | 002 not redundancy                               | LIGHT / NONE                                                          | Virtual identity, role, preemption and failover evidence                   | High value, higher state cost; defer                  |
| LAN port security                                      | R4; S-Practical Part 4                           | ARP/VLAN prerequisites                          | 003 not MAC admission                            | NONE / NONE                                                           | Secure MAC vs physical/VLAN state; violations                              | Strong runner-up; bounded static-MAC case later       |
| DHCP snooping/DAI/VLAN attacks/802.1X/AAA              | R4; S-Practical                                  | ARP concept only                                | No security faults                               | LIGHT / NONE                                                          | Trust, binding and authentication failure evidence                         | Split concepts from later protocol state; defer       |
| OSPF area/passive/timer compatibility                  | R5; P5 15,46,56                                  | Direct bounded OSPF + guides                    | 001,005,006                                      | STRONG / STRONG for these faults                                      | Authentic configuration and unfamiliar cases                               | Preserve; don't add fourth similar fault next         |
| OSPF activation/wildcard/identity                      | R5; P5 configuration                             | Direct A4 tap plans                             | Config observed, no activation trial             | STRONG / PARTIAL                                                      | Apply/verify original device plan                                          | Execute optional external companion later             |
| OSPF packets/LSDB/SPF/elections/cost/default/multiarea | R5; P5                                           | Partial descriptions; DR/BDR mention            | P2P steady state only                            | PARTIAL / LIGHT                                                       | Broadcast election, branching metric, database/default-route cause         | Separate learning slices; don't claim OSPF complete   |
| Static path / return / installed wrong route           | R10 process; Intro routing scope                 | F4; IPv4 preparation                            | 004,007                                          | STRONG / STRONG for two path faults                                   | Policy versus routing distinction                                          | Reuse as LAB 009 prerequisites                        |
| IPv4 ACL first-match/wildcards/direction               | R6; P6 3–27                                      | Wildcard prerequisite in OSPF; no policy lesson | None                                             | LIGHT / NONE                                                          | Prove rule shadowing despite valid routes; preserve denied control         | **Select one standard ACL lab**                       |
| Extended/VTY/IPv6 ACL                                  | R6; P6 28–39                                     | None                                            | None                                             | NONE / NONE                                                           | Protocol/port/administrative/address-family filtering                      | Defer, not implied by source-only LAB 009             |
| NAT/PAT and translation roles                          | R7; Extra 2                                      | Incidental exclusion only                       | None                                             | NONE / NONE                                                           | Separate routing from translation; verify return mapping                   | High later value, after ACL; no PAT shortcut          |
| WAN service/topology/encapsulation                     | R8; P8                                           | None                                            | Routed campus path is not WAN teaching           | NONE / NONE                                                           | Service boundary/access technology diagnosis                               | Conceptual/external activity first                    |
| GRE and inner/outer reachability                       | R9; P9 24–28; GRE-Activity exists                | None                                            | None                                             | NONE / NONE                                                           | Correct underlay but wrong tunnel endpoint                                 | Candidate; defer overlay state cost                   |
| IPsec/remote VPN/crypto                                | R9; P9; IPsec-Activity exists                    | None                                            | None                                             | NONE / NONE                                                           | SA/selector/identity versus routing                                        | Concepts and authentic activity before engine         |
| CDP/LLDP/NTP/syslog/SNMP/maintenance                   | R10; P10 9–32                                    | None                                            | No protocol telemetry                            | NONE / NONE                                                           | Discovery/time/log/MIB correlation                                         | Later targeted observation lessons/lab                |
| Seven-step troubleshooting / approaches                | R10; P10 54–68                                   | F2/F4 and case guidance partial                 | All gather evidence; only 008 applies/reverifies | PARTIAL / PARTIAL overall; 008 strong bounded loop                    | Rollback, fresh controls, documented result; not every approach executable | Embed in 009, no giant theory module                  |
| Hierarchical design/baselines                          | R10; P10 44–58                                   | Indirect topology reasoning                     | Small fixed graphs                               | LIGHT / LIGHT                                                         | Baseline selection and resiliency reasoning                                | Conceptual planning later                             |
| QoS                                                    | R11; P11                                         | None                                            | No queues/timing/loss model                      | NONE / NONE                                                           | Interpret degraded service with working route                              | Conceptual/measurement first                          |
| Virtualization/SDN/automation/APIs                     | R12; P12                                         | None                                            | None                                             | NONE / NONE                                                           | Controller/policy and request/data reasoning                               | Separate Academy slice later, not IOS simulator       |
| Network security taxonomy/defense/crypto               | P13                                              | None                                            | No security-control fault                        | NONE / NONE                                                           | Evidence-based threat/control distinction                                  | Conceptual later; ACL covers only one control         |
| IPv6 addressing/OSPFv3/filtering                       | Intro 2; R5/R6; Extra 1                          | None                                            | IPv4 only                                        | NONE / NONE                                                           | IPv6 neighbor/prefix/route reasoning                                       | Major future foundation; separate address-family gate |
| Integrated VLAN/inter-VLAN/DHCP/NAT build              | Extra 2; S-Practical                             | IPv4 prerequisites                              | 003 access VLAN only                             | LIGHT / LIGHT                                                         | Build and validate multi-service dependency chain                          | External practical; avoid many new protocols at once  |
| EIGRP/WLAN and synopsis-level additions                | Intro 3,11                                       | None                                            | None                                             | NONE / NONE                                                           | Depth not established from chapter notes                                   | Record mention; inspect more source before scope      |

## 5. EtherChannel / LAB 008 alignment review

The supplied practical is **6.4.2**, not NetFault LAB 008. Its two switches/two PCs and two parallel inter-switch links resemble LAB 008, but the configurations differ.

| Course requirement                                                                                             | Current LAB 008 relationship                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Logical channel from physical members; LACP active/passive initiation (R2; P2 14–16)                           | Directly diagnosed; two passive endpoints are the authored fault. One active endpoint repairs it; active/active also negotiates but changing both is not minimal.                                                     |
| Inspect summary and logical port-channel (R2; P2 21; practical Part 4)                                         | Exact `show etherchannel summary`; corresponding bounded `show interfaces port-channel 1`. Shows operational membership; no invented rate/counter data.                                                               |
| Member speed/duplex/VLAN consistency (P2 17,23)                                                                | Physical/status evidence and declared member validation reinforce compatibility. It does not model all platform eligibility tests or remote VLAN negotiation.                                                         |
| Configure both switches group 1 active (practical Part 4)                                                      | Group-mode trial is executable, but original practical builds a channel; NetFault repairs a preconfigured fault. `show lacp internal` is useful extra app evidence, not listed among R2's four verification commands. |
| Practical VLAN 10 management; VLAN 20 clients; 999 parking; 1000 native; allowed 10,20,1000 trunks (Parts 2–3) | Not modeled: 008 is single access VLAN 40, hosts .40.10/.20, no SVI or gateway. Practical management .10.11/.12 and clients .20.3/.4 must not be confused with NetFault addresses.                                    |
| Practical F0/1–2 trunks; F0/6 and F0/18 client access; pre-bundle STP forwarding/pruning question              | Not modeled: 008 uses Gi1/0/1–2 members and Gi1/0/3 hosts; no STP choice, native VLAN or trunk allowed list.                                                                                                          |
| PAgP/static on, hashing, bandwidth, standby members, configuration/save from blank                             | Out of scope. One-member survivability is explained in the independent lesson and supported by bounded state derivation, but is not a second authored fault or throughput test.                                       |
| Diagnose, change, recheck                                                                                      | 008 adds initial evidence, applied trial, actual healthy state and fresh selected verification. This reinforces P10's process beyond merely reproducing the practical.                                                |

**Decision:** EtherChannel is sufficiently represented **for the current NetFault stage**, through a meaningful LACP diagnostic slice. It is **not the whole chapter or a completed practical**. The best later complement is authentic trunked EtherChannel construction and interpretation of STP/trunk/member evidence. PAgP/static-mode comparison can be conceptual first. Leave accepted LAB 008 unchanged now.

## 6. Major learning gaps and progression

The app is concentrated on IPv4 addressing, route selection and OSPF adjacency. It has only one aggregation fault and no packet policy. Major missing families are STP, FHRP, LAN security/ACL, NAT, WAN/VPN, management protocols, QoS, automation, network security and IPv6. These are different kinds of gaps: some need new forwarding state, others need explanation, structured interpretation or authentic configuration practice.

The most valuable next diagnostic contrast is **a correct path that policy intentionally or accidentally refuses**. It builds on 004/007 without repeating missing routes. Requiring a successful allowed probe and an unsuccessful excluded control also prevents the misconception that “everything pings” is always a successful repair.

Use P10's process in the existing interface: incident defines the problem; history gathers information; compare configurations/routes to eliminate causes; journal a hypothesis; apply a bounded change; gather fresh results; document the final verdict. Undoing a sequence change supplies a small rollback experiment. The lab need not implement device substitution or every troubleshooting approach to support the process honestly.

## 7. LAB 009 candidate comparison

All five are **design inferences**, not newly discovered lecturer-authored fault cases. Complexity is relative to the current engine, not a time estimate.

### Candidate A — Standard IPv4 ACL order (recommended)

1. **Topic:** R6/P6 source-based packet filtering.
2. **Skill:** distinguish installed routes from policy permission; evaluate first match rather than spotting any permit.
3. **Course support:** P6 5–8 direction/order/implicit deny/source-only; 17 placement; 24–27 sequence verification/editing; P10 60–65 hypothesis testing.
4. **Symptom:** local gateways and transit work; authorized PC traffic across the routed path fails.
5. **Evidence:** host source, both route tables, egress binding, ordered ACL, allowed and excluded probes.
6. **Commands:** existing IP/config/route/ping patterns plus one `show access-lists` renderer.
7. **Bounded repair:** change an existing ACE's sequence, preserving its predicate, action and binding.
8. **Recovery:** intended source permitted, other source still denied, reciprocal host pings and fresh policy views.
9. **Engine work:** new ordered IPv4 source filter; carry packet source through forwarding and reply; extend existing trial action/grade branch.
10. **Complexity:** medium; small pure model, important source/return regression surface.
11. **Bloat risk:** manageable if no transport ports, counters, IPv6, NAT, stateful inspection or arbitrary CLI.
12. **New reasoning:** high; correct routing plus incorrect policy, and negative verification, absent in 001–008.

### Candidate B — Port-security admission blocks an authorized host

1. **Topic:** R4 and S-Practical Part 4.
2. **Skill:** distinguish physical/VLAN health from source-MAC admission.
3. **Course support:** port-security maximum, protect/restrict, sticky/aging and secure-address outputs explicitly practiced.
4. **Symptom:** link connected and VLAN correct; intended host cannot reach its gateway.
5. **Evidence:** host MAC, access port, configured permitted MAC, security mode/state and fresh probes.
6. **Commands:** `ipconfig /all`, interface/VLAN/config, `show port-security interface`, `show port-security address`, ping.
7. **Repair:** replace one authorized MAC in an explicit static rule; keep admission enabled.
8. **Recovery:** correct host passes, excluded MAC remains refused, fresh security/output/probe evidence.
9. **Engine work:** carry Ethernet source identity through access traversal; secure-port policy; define event/counter behavior or omit unsupported counters. Actual sticky learning needs a separate replay model.
10. **Complexity:** medium to high, because present L2 walk is reachability, not frame admission/learning.
11. **Bloat risk:** sticky aging, maximum counts, violation modes and errdisable recovery can quickly multiply states.
12. **New reasoning:** high; best runner-up, stronger practical match but a more difficult first security boundary than stateless ACLs.

### Candidate C — STP root/path violates intended design

1. **Topic:** R1 root election and roles.
2. **Skill:** use BID/root cost/port roles to explain the selected tree and a wrong intended root.
3. **Course support:** explicit STA steps, ties, priorities/costs and root primary/secondary.
4. **Symptom:** operational monitoring shows an unexpected tree/path; traffic may still work. Do not manufacture total outage from a merely nonpreferred root.
5. **Evidence:** all bridge IDs, per-VLAN root, port roles/costs and physical triangle.
6. **Commands:** proposed `show spanning-tree vlan …`, config/status and ping; broad show-output template needs further primary validation.
7. **Repair:** one bounded bridge-priority change respecting documented root intent.
8. **Recovery:** intended root and derived roles/path, loop-free reachability; blocked alternate is expected.
9. **Engine work:** triangle topology, per-VLAN BIDs/costs/roles/ties and a derived active tree, new topology presentation.
10. **Complexity:** high compared with one packet predicate; topology changes have wide L2 effects.
11. **Bloat risk:** RSTP/legacy timers, topology events and transient flooding; exclude initially.
12. **New reasoning:** high, but less direct symptom-to-repair payoff for the next small increment; not automatically first because STP is chapter 1.

### Candidate D — HSRP expected active role fails to return

1. **Topic:** R3/P3 preemption and gateway redundancy.
2. **Skill:** distinguish healthy VIP forwarding from intended role restoration after a router returns.
3. **Course support:** P3 17–18 specifically separates higher priority from preemption; 20–21 Hello/hold; 27 troubleshooting.
4. **Symptom:** VIP still reachable, but the documented preferred router does not regain active status after a controlled recovery.
5. **Evidence:** same group/VIP, priority, current roles, preempt setting and event order.
6. **Commands:** `show standby brief`, `show standby`, config, host IP/ping.
7. **Repair:** enable preempt on the intended higher-priority member.
8. **Recovery:** preferred active/other standby, unchanged VIP and working host path; controlled failure demonstrates standby takeover.
9. **Engine work:** virtual IP/MAC ownership, incumbent/election state and scripted fail/return events.
10. **Complexity:** high; not a static “highest priority always wins” calculation.
11. **Bloat risk:** timer/FSM/tracking/VRRP/GLBP/address-family expansion.
12. **New reasoning:** high but requires new identity and time/event concepts; simpler physical-gateway fault would repeat 002 too much.

### Candidate E — GRE remote endpoint mismatch

1. **Topic:** R9/P9 tunnel configuration; GRE-Activity existence corroborates practical relevance.
2. **Skill:** separate underlay reachability from overlay delivery.
3. **Course support:** P9 24–26 tunnel source/destination/address/mode. PKA internals are unknown.
4. **Symptom:** outer peer reachable; inner remote LAN traffic fails after an endpoint typo.
5. **Evidence:** both outer interfaces/routes, tunnel endpoints/inner addresses and remote LAN routes.
6. **Commands:** config/routes/ping; proposed tunnel-interface show needs further reference validation.
7. **Repair:** replace one tunnel destination with the documented peer outer address.
8. **Recovery:** underlay unchanged, correct encapsulated delivery and both inner host directions; fresh views/probes.
9. **Engine work:** logical tunnel edges, outer/inner packet context, bounded recursion and return resolution.
10. **Complexity:** high relative to ACL; avoid falsely marking line protocol down merely because remote GRE configuration differs.
11. **Bloat risk:** keepalives, MTU/fragmentation, IPsec, DMVPN and routing over tunnels.
12. **New reasoning:** high, but larger correctness surface and less inspected practical detail than ACL/port security.

## 8. Recommendation and decision boundary

Choose **LAB 009 — The closed passage**, a standard IPv4 ACL ordering fault. ACL has explicit course semantics, observable configuration and verification commands; the app has no policy diagnostic coverage. It uses existing hosts/routes/source-aware ping UI and LAB 008's trial discipline while adding one meaningful packet-filter decision. It is suitable for offline deterministic Practice and server-owned Assessment without credentials, background simulation, a database redesign or new topology primitives.

The recommendation is not “cheapest topic wins”: source-aware allowed/denied reasoning is a substantial new troubleshooting skill. Port security is a close later candidate; STP/FHRP/GRE each introduce more graph, identity or event machinery for comparable next-step benefit. NAT/PAT, IPv6, QoS and automation remain important, but require different prerequisites/models and must not be smuggled into 3G.

Viability is conditional on the implementation tests in the [plan](milestone-3g-plan.md): source must reach every filter evaluation, replies must be independently filtered, a correct diagnosis alone cannot earn recovery, and old behavior must remain identical for scenarios without ACLs. No implementation tests, deployment tests or physical-device tests were run for this documentation-only task. Inspection and documentation checks do not prove LAB 009 works.
