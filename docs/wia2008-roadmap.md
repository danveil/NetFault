# NetFault completion roadmap

## Current planning position — Milestone 3L, 26 September 2026

**PLANNED ONLY — NO LAB 012 OR NEW ENGINE CAPABILITY IMPLEMENTED.** Exactly one next proposal: **LAB 012 — The quiet desk**, a wrong static secure MAC with explicit protect mode and a fully occupied one-address limit. The [source-grounded comparison](lab012-feasibility.md) selects a new endpoint-admission mental model over static NAT, GRE and management/IPv6/QoS/automation challengers. The [implementation-ready 3M specification](milestone-3l-plan.md) defines actual forwarding/resolution effects, structured replacement, fresh evidence and retained protection, a tiny unrelated primer and an UNEXECUTED authentic companion brief. Eleven labs/Academy remain accepted and unchanged; separate 3M authorization is required.

This recommendation adds no coverage. NAT/PAT and GRE remain strong later candidates; broader LAN trust/authentication, WAN/IPsec, management, QoS, automation, IPv6 and the unmodeled parts of current protocol families remain substantial gaps. Use the [refreshed inventory](lab012-feasibility.md#2-refreshed-substantial-gap-inventory) for current distinctions rather than interpreting older absent-feature tables as today's implementation. No later branch is automatically selected or executed.

**Milestone 3K update:** [LAB 011 and bounded HSRPv2](milestone-3k.md) provide partial priority/virtual-gateway investigation with explicit preemption and independent routing. The [model](hsrp-model.md) supports one group/two members and settled unequal-priority roles, actual virtual forwarding and fresh design verification. General preemption/incumbency, timers, failure history, tracking, VRRP/GLBP and IPv6 remain deferred. This does not establish full FHRP coverage or failover competence; prior audit statements below retain their dates.

## Historical planning position — Milestone 3J, 25 September 2026

**PLANNED ONLY — NO FHRP ENGINE OR LAB 011 IMPLEMENTED.** [The source-grounded FHRP audit](fhrp-feasibility.md) recommends exactly one next proposal: **LAB 011 — The shared exit**, an incorrect HSRP priority while a correct virtual gateway and remote communication still work. [Milestone 3K specification](milestone-3j-plan.md) defines fixed preemption-on/unequal priorities, one IPv4 group, derived virtual ownership, routing/ARP integration, applied repair and fresh verification, plus a tiny unrelated primer. No full Academy module or failure-history framework is needed for that limited objective. Missing-preempt/reappearance, tested failover, tracking, multiple groups, GLBP/VRRP and IPv6 remain later gaps. FHRP is not marked covered; ten labs and existing Academy remain unchanged. Separate 3K authorization is required; no other roadmap branch is selected or executed.

## Milestone 3I delivered — 25 September 2026

The separately authorized [LAB 010](milestone-3i.md) and narrow STP foundation are implemented with a small preparation card. This closes only the selected priority/design investigation, not the entire STP chapter: timer/convergence, full RSTP, multiple VLAN/trunk trees, same-sender port ties, guards and mixed aggregation remain separate backlog. All nine earlier labs and Academy are preserved. No next lab is automatically selected or authorized. The 3H next-step wording below is historical; [verification](verification.md) records actual current checks.

## Historical planning position — Milestone 3H, 24 September 2026

**PLANNED ONLY — NO STP ENGINE OR LAB 010 IMPLEMENTED.** The [supplied 2026/27 archive](semester-2627-gap-analysis.md) supersedes the historical material-absence assumption below, without confirming current assessment weights/dates. LAB 009 has since delivered [one bounded ACL investigation](milestone-3g.md); neither the ACL chapter nor broader policy work is complete.

The [STP source/engine audit](stp-feasibility.md) recommends exactly one next implementation proposal: **LAB 010 — The unexpected detour**, an incorrect bridge-priority design fault in a three-switch triangle. A minimal single-VLAN steady-state election/role/forwarding model and tiny non-spoiling primer must precede or accompany that case. [Milestone 3I scope](milestone-3h-plan.md) defines exact requirements and tests; separate authorization is required. This is planning progress only, not new coverage or permission to execute other roadmap branches. Port-priority ties, timers/RSTP, trunks, multiple VLAN instances, STP+EtherChannel and edge protection remain outside that proposal. The dated 3D–3F roadmap follows as history.

**Historical-materials-based roadmap — 2026/27 course requirements unconfirmed.**

This replaces the earlier current-materials intake gate and provisional IPv6-first choice. Historical evidence now supports progress. The [coverage matrix](wia2008-coverage.md) and [source inventory](wia2008-sources.md) define what was actually read and what is missing. No target number of labs establishes completion.

## Selected bridge implemented in Milestone 3E

**Milestone 3F update, 23 September 2026:** a separate authorization delivered one bounded EtherChannel investigation, LAB 008. Learners compare physical/logical observations, apply one group-mode trial and verify resulting connectivity; see [model](etherchannel-model.md) and [verification](milestone-3f.md). No public Academy primer was necessary. This provides partial LACP case practice, not complete EtherChannel/STP coverage or real-device qualification. The original 3E rationale below is historical; STP, trunks, broader aggregation and independent device work remain backlog.

**One OSPFv2 configuration-to-verification Academy lesson**, with a guided exercise, a different independent exercise and a clearly labeled external Packet Tracer companion. No new troubleshooting scenario or engine change. See the [bounded specification](wia2008-next-milestone.md) and [3E implementation/verification record](milestone-3e.md). The lesson, two exercises and two diagrams are implemented; the optional external companion is UNEXECUTED. Authentic configuration ability remains to be demonstrated separately.

Why this order:

- `Single Area OSPF.ppt` slides **36–44 and 56–57** supply concrete configuration, verification and error examples. The app already teaches IPv4 prefixes and has area/passive/timer cases, yet does not ask the learner to build a configuration from a new interface table.
- `Network Management.ppt` slides **54–61** support documenting observations, forming/testing a hypothesis and planning rollback. The bridge can use existing investigations while asking for authentic configuration evidence outside the simulator.
- Reusing the accepted Academy interaction and the existing point-to-point model avoids prerequisites needed for a switching simulator. This is a learning/dependency judgment, not evidence of a course deadline or learner weakness.
- IPv6 remains well supported: S5 slides **58–61**, S6 **35–37**, S7 **29–30**, plus H24 O3. Its operational goals require foundations and external practice; the earlier address-only pilot was not wrong in content, but the newly inspected OSPF examples support a more immediate connection from existing knowledge to configuration.
- STP and EtherChannel are substantive missing chapters, not optional names inferred from CCNA. They remain high-priority follow-on work. Their chapter numbers do not establish current teaching order, and a simulator would require new switching state. A conceptual STP pilot could also avoid engine work, but the selected bridge makes immediate use of three current cases and their prerequisites.

This recommendation does **not** claim OSPF matters more academically than switching/IPv6. It chooses a small implementation that can be specified from inspected content today. Separate 3E authorization allowed this bounded implementation; later work still needs authorization. 2026/27 documents are not an entry prerequisite.

## Dependency-based follow-on work

Rows after the implemented bridge are a completion backlog, not multiple selected next milestones. Split each into one bounded lesson/tool task when authorized. No automatic execution and no lab quota.

| Order / outcome | Exact historical evidence | Learning work and dependencies | Engine decision / independent acceptance |
| --- | --- | --- | --- |
| **IMPLEMENTED 3E: OSPFv2 configuration-to-verification** | S5 `Single Area OSPF.ppt` 36–44, 56–57; S10 `Network Management.ppt` 54–61 | One lesson after IPv4 A1–A3; two tap sequences and external configuration handoff. Reuse LAB 001/005/006 with neutral links | No engine/scenario change. Given different addresses/interfaces, select participating interfaces and passive LANs, justify checks, then demonstrate authentic configuration separately |
| **PARTIAL 3F: one LACP investigation; broader switching remains** | S1 `STP.ppt` 3–24, 28–40; S2 `Etherchannel.ppt` 3–8, 10–23 | LAB 008 supplies physical/logical/member reasoning and applied configuration verification. STP root/path/roles, trunk aggregation and broader protocol alternatives remain separate work | Two-switch access-only LACP subset avoids a need for STP elections by excluding alternate paths. Later STP/trunk simulations need their own gate. Require unseen predictions plus authentic show-output and changed-link observations for real-device claims |
| **IPv6 foundation and operational application** | S5 58–61; S6 `Access Control List(ACL).ppt` 35–37; S7 `NAT.ppt` 29–30; H24 O3 | Notation/prefix and link-local reasoning before a separately scoped OSPFv3 or IPv6 ACL companion | No IPv6 simulator by default. Require different-address reasoning and actual configured neighbor/route/traffic evidence for operational claims |
| **Policy and translation: ACL, then NAT/PAT** | S6 3–20, 26–36; S7 6–24 | Reuse IPv4/mask/path knowledge; ordered rule decisions and direction before address/port translation. Resolve documented example conflicts | Tap tables plus PT configuration. Engine only if one distinct diagnostic gap justifies filtering or translation state. Accept both allowed and denied/untranslated control traffic, not one successful ping |
| **Access-layer protection** | S4 `LAN & Switch Security.ppt` 12–26, 27–43 | AAA/802.1X responsibilities or one port-security/DHCP/ARP defense at a time, after relevant VLAN/STP/ARP prerequisites | Authentic controlled configuration is preferred. LAB 002/003 are prerequisites, not security labs. Require policy reasoning and observed legitimate/violating behavior |
| **Management, design and troubleshooting** | S10 3–37, 38–53, 54–68 | One output-reading/configuration objective per increment; document topology, baseline, discriminating evidence and rollback across all later practicals | No packet-engine expansion for conceptual design/log interpretation. Actual discovery/time/log/backup evidence remains external. Require a changed-topology diagnosis and recorded recovery |
| **WAN and tunnels** | S8 `WAN.ppt` 3–9, 14–44; S9 `VPN & IPsec.ppt` 3–31 | WAN boundaries/connectivity decisions, then one GRE or tunnel-type exercise. Routing prerequisite; repair inconsistent source examples | No engine by default. Require distinct underlay and tunnel observations. Historical crypto/vendor claims are not current deployment guidance |
| **QoS** | S11 `QoS.ppt` 3–24, 25–47 | Short delay/queue/marking reasoning tasks; authentic tool work if performance measurement is the objective | Binary ping cannot demonstrate QoS. No queue simulator unless separately justified. Accept correct predictions/calculations and explain limits of supplied data |
| **Virtualization and automation** | S12 `Network Virtualization & Automation.ppt` 3–37, 39–62, 63–72 | One service/plane diagram slice, then structured-data/request interpretation and a small actual local tool exercise. Requires relevant addressing/API basics | No forwarding-engine change for conceptual lessons; no paid cloud requirement. Accept a new response/configuration example and actual script output where execution is claimed |
| **Evidence-limited historical topics** | H24 p.46 EIGRP/PPP; S8 16/44 PPP references; missing Chapter 3 | Retain unresolved scope. No dedicated EIGRP deck or original practical available. Do not assign a subject to missing Chapter 3 | No engine proposal from a topic name alone. Revisit depth when more evidence exists; other work continues |

The order within later branches can change with demonstrated learner needs or future course instructions. The stated dependencies matter more than a linear release number. Detailed OSPF broadcast elections, LSDB exchange, SPF alternatives and default origination remain separate gaps (S5 5–35, 45–56), not silently covered by the 3E lesson.

## Completion and future reconciliation

For each historical topic, distinguish conceptual reasoning, calculation, configuration, diagnostic interpretation and unfamiliar-fault performance. A topic can be covered through a combination of Academy, existing cases and authentic practical work; it need not get its own simulator lab. [Release criteria](wia2008-release-checklist.md) prohibit converting reading or fixed-case repetition into a mastery claim.

Well-supported now: the local chapter identities, named teaching mechanisms/examples, current app gaps, model limits, and the bounded next lesson's dependencies. Unconfirmed until future originals arrive: current CLO wording, Chapter 3 identity, retained/removed topics, weekly/lab order, practical sheet numbers, required versions/equipment, submission formats, weights and marking rubrics. Original historical practicals/workbook are also absent.

When those materials become available, reconcile this same roadmap and retain version provenance. Do not discard useful historical work merely because the final course order changes. No implementation, deployment, commit or push is part of this audit.
