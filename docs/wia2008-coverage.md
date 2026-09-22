# WIA2008-to-NetFault coverage matrix

**Provisional: H24 is an inspected 2024/25 official baseline, not the verified retake syllabus.** See [source inventory](wia2008-sources.md). No official practical sheets or chapter objectives were accessible. Course-level unknowns stay unknown. None of NetFault LAB 001–007 is identified as a same-numbered UM practical.

## Coverage vocabulary

- **N:** not covered by executable or substantive current teaching content.
- **M:** mentioned only; not a lesson or tested skill.
- **C:** explained conceptually, including worked reasoning.
- **G/I:** guided/independent practice. **tap** means graded Academy exercise; **paper** means an ungraded prompt; **case** means a fixed interactive investigation.
- **T:** troubleshot in a working scenario.
- **V-H:** relevant tests inspected; historical 3C passing record exists. No tests rerun in 3D. This does not establish mastery, IOS fidelity or successful transfer to unfamiliar networks.

Levels coexist. Having three related OSPF faults does not mean all OSPF is covered; a paper prompt is not a recorded independent performance. App-only statements below have high source confidence; mapping to the current retake remains unknown.

## Inspected course baseline and gaps

H24's course outcomes (paraphrased here once): **O1** router/switch structure and operation in complex networks; **O2** LAN/WAN infrastructure management concepts and protocols; **O3** solving router/switch faults across IPv4 and IPv6. Location: printed p.45 / PDF p.59, WIA2008 Learning Outcomes 1–3. Its synopsis, printed p.46 / PDF p.60, names OSPF, EIGRP, STP, PPP and VPN, with practical work across IP versions. No chapter or practical numbering is provided there.

| Historical requirement / precise source | Existing evidence and levels | Remaining gap | Proposed learning form / feasibility | Confidence / missing evidence |
| --- | --- | --- | --- | --- |
| O1, H24 p.45 item 1 | Academy A1/A3; guides F2/F4; all seven cases: C, G/I-tap for host foundations, T, V-H | Broader device architecture, switching operation, configuration construction and complex topologies are not comprehensively taught | Academy diagrams/exercises plus actual device/Packet Tracer build work; existing engine serves only current narrow cases | High historical outcome; required device features/topologies unknown |
| O2, H24 p.45 item 2 | A3, F3/F4, case evidence/hypothesis workflows: partial C/T/V-H | No coherent LAN/WAN management/design curriculum or operational management-tool practice | Source-selected conceptual lessons and external practical tasks; do not force all theory into labs | Historical outcome established; exact management tools and design criteria unknown |
| O3 IPv4 component, H24 p.45 item 3 | A1–A3, F1–F4, LAB 001–007: C/G/I/T/V-H within stated scope | Only seven fixed single-fault investigations; no general configuration shell, unseen-topology practical assessment or broad fault coverage | Continue reasoning practice plus course-specific hands-on build/configure/verify tasks; simulator extensions only for a demonstrated gap | Strong evidence for existing subset; current practical task coverage unknown |
| O3 IPv6 component, H24 p.45 item 3 | **N**: no IPv6 Academy exercise or network state; `src/lib/schema.ts` uses IPv4 | Conceptual foundations, address calculations/interpretation, configuration and diagnosis absent | Provisional IPv6 foundation Academy pilot; hands-on IPv6 work separately. No engine work for paper/tap practice; simulation would require a separate address-family model | High absence confidence; current IPv6 depth/tool requirements unknown |
| OSPF, H24 p.46 synopsis | F3, private LAB 001/005/006 teaching and cases: C, G/I-paper, T, V-H | Academy foundation missing; packet/state-machine/database behavior and broadcast elections not modeled; multiarea scope unknown | Conceptual explanation + course-matched Packet Tracer configuration. Current engine supports only steady-state point-to-point intra-area cases | Named historical topic; U3D Chapter 5 title alone does not establish its objectives |
| EIGRP, H24 p.46 synopsis | **N** in app teaching/executable model | Concepts, route behavior, configuration and diagnosis | Confirm current requirement first; external practice and conceptual exercises preferred before any bounded engine proposal | Named historical topic; address-family/mode/details unknown |
| STP, H24 p.46 synopsis | **N** as learning/operation; exclusions in project docs do not count as teaching | Loop prevention, role/state reasoning, topology change and operational verification | Source-selected topology exercises plus real/PT observations; access-VLAN traversal cannot stand in for STP | Historical topic known; protocol variant and required commands unknown |
| PPP and VPN, H24 p.46 synopsis | **N** for both | Link/session/tunnel concepts and practical configuration/verification | Separate bounded teaching/practical tasks once actual sheets identify mechanisms; no existing engine support | Names verified historically; encapsulation/authentication/tunnel variants unknown |
| Practical emphasis, H24 p.46 synopsis | Fixed diagnostic interaction exists; worked configuration text is not executable | Building a network, issuing configuration commands, saving actual configuration and performing coursework are not evaluated | Preserve an external Packet Tracer/real-equipment workstream with required artifacts | Exact practical sheets, numbering and grading unavailable |
| Current chapter list, learning outcomes and assessment requirements | **Unknown** | Cannot establish completeness, priorities or coverage percentage | Evidence intake gate before implementation roadmap is approved | No current-semester originals inspected |

## Reported chapter leads — not verified requirements

| U3D label, preserved verbatim | Current app observation | Evidence needed before a requirement/proposal becomes approved |
| --- | --- | --- |
| Chapter 2: EtherChannel | No aggregation state, negotiation, port-channel commands or Academy lesson | Actual slides and original practical, including protocol/mode and verification tasks |
| Chapter 5: Single Area OSPF | Three narrow OSPF cases and F3; not a complete chapter | Slides, topology, config objectives and practical sheet |
| Chapter 10: Network Management, Design and Troubleshooting | Case investigation/journal helps methodology; no complete management/design lesson | Exact tools, design tasks, assessment criteria and diagrams |
| Chapter 12: Network Virtualization and Automation | No such module or operational model | Original content and required tool/API/programming exercises |
| ANT Mastery Workbook | Not inspected | Original file and its cited primary practical sheets; distinguish notes from requirements |

DHCP, NAT, ACLs, trunks and other familiar networking topics are not automatically added to WIA2008 from general CCNA knowledge. They appear only as capability boundaries or conditional candidates in the [engine audit](wia2008-engine-feasibility.md).

## Actual Academy inventory

One module: `ipv4`, title **MODULE 02 — IPv4 Addressing and Subnetting**, revision 2. The number does not imply that Module 01 exists. Registry: [content-v1.ts:383](../src/lib/academy/content-v1.ts#L383); current revision overlay: [content.ts:113](../src/lib/academy/content.ts#L113). All three lessons are revision 2, public conceptual practice, with recommended (not locked) prerequisites. Original bodies/code survive in the archive; current overlay changes pacing, exercise representation and diagrams.

| ID / lesson | Every authored section, in order | Prerequisite / public lab links | Actual levels |
| --- | --- | --- | --- |
| **A1** `ipv4-addresses` — Understanding IPv4 Addresses; [source:74](../src/lib/academy/content-v1.ts#L74) | An address for a delivery; Like a postal address — with limits; Four numbers, thirty-two bits; Read 192.168.10.25; Check the shape; Read a fresh address | None; `gateway-01` prepare | C, G/I-tap, V-H for address reading/format, not address allocation design |
| **A2** `ipv4-subnets` — Subnets, Subnet Masks, and Local Networks; [source:181](../src/lib/academy/content-v1.ts#L181) | Decide what is nearby; Residential colleges — with limits; Keep the network bits; A /24, then a /26; Calculate a /26; Apply the method to /27 | A1; `gateway-01` prepare and `vlan-01` reflect | C, G/I-tap, V-H for fixed /26-/27 exercises; /31 and /32 exceptions M; no VLSM allocation exercise |
| **A3** `ipv4-gateway-arp` — Default Gateways and ARP; [source:256](../src/lib/academy/content-v1.ts#L256) | Leave the local network; The college delivery desk — with limits; IP destination, Ethernet next hop; Follow one remote packet; Choose the next delivery; Investigate a different network | A2; `gateway-01` apply | C, G/I-tap, T through LAB 002/003, V-H; NAT/firewall references are boundaries, not instruction |

The seventh teaching part is each exercise's detailed solution, shown only on request for revision 2. Sources include RFC references, not UM syllabus citations. The prose preserves analogy limitations. Lab links open normal mode selection; they do not silently start an investigation.

Every current diagram, from [content.ts:69](../src/lib/academy/content.ts#L69), rendered by [diagram.tsx](../src/components/academy/diagram.tsx):

| Lesson / section | Diagram and instructional purpose |
| --- | --- |
| A1 worked | `octets`: 192.168.10.25 as four decimal/binary eight-bit cards; 32-bit total |
| A2 technical | `mask`: 192.168.10.70/26, final-octet AND with 192 produces network .64 |
| A2 worked | `range`: network .64, usable .65–.126, broadcast .127; 62 usable addresses |
| A3 technical | `delivery`: local .10.55 versus remote .20.10; final destination IP versus next-hop frame recipient |
| A3 worked | `arp`: gateway query, local reply and data-frame handoff; conceptual, not packet capture |

Every current exercise uses `tap-steps` and `requested-only`, revision 2, with plausible choices, review/change and deterministic field grading. [Overlay:49](../src/lib/academy/content.ts#L49), [grader](../src/lib/academy/grading.ts), [tests](../tests/academy-touch.test.ts):

| ID / stage | Tested objective / answer shape | Limits of independent evidence |
| --- | --- | --- |
| `valid-format` / guided | Three Valid/Invalid selections; four octets and decimal range | Fixed recognition examples |
| `read-octets` / independent | Four ordered octet choices for 172.16.5.90 and whether a prefix boundary can be known | Different fixed example, not open address planning |
| `guided-subnet` / guided | Host-bit count and four endpoints for 192.168.50.140/26 | Nearby worked method and guided block starts |
| `independent-subnet` / independent | Host-bit count and four endpoints for 172.16.4.77/27 | Genuine different calculation, but fixed choice set and no typed derivation grading |
| `local-remote` / guided | Classify three destinations under the source /24 | Connected/default-route assumption supplied |
| `next-hop` / independent | Source subnet, local/remote decision, next-hop IP and discriminating observations | No arbitrary explanation understanding or executable ARP simulation in the exercise |

## Original Field Guides

[lessons.ts](../src/lib/lessons.ts) contains four unchanged objects; [reference adapter](../src/lib/academy/content-v1.ts#L1) supplies stable IDs/revision 1. All have simple, analogy, technical, example, symptom, guided and exercise sections. Their prompts are **G/I-paper**, not six additional graded exercises or proof of completed study.

| ID / title | Substantive coverage / limits |
| --- | --- |
| **F1** `addressing-gateway` / Addressing & the default gateway | Local/remote /24 choice, next-hop MAC, /30 usable hosts, comparing gateway/remote probes. Does not teach full VLSM design |
| **F2** `physical-protocol` / Physical state & protocol state | up/up versus OSPF adjacency, connected routes and on-link probe evidence. No electrical/duplex fault model |
| **F3** `ospf-areas` / OSPF areas, neighbors & network types | Areas, router/process IDs, explicit point-to-point versus conceptual broadcast DR/BDR, passive LANs and configuration inspection. Broadcast elections only briefly explained; no election exercise |
| **F4** `routes-return-path` / Routes, evidence & the return path | C/L/O entries, AD/metric interpretation, longest prefix, source/return reasoning and repair prediction. General prompts, not separately graded route-table exercises |

## Seven fixed troubleshooting scenarios

All cases expose actual simulated observations, structured diagnosis, evidence selection, before/after repair and journal; no executable IOS configuration terminal. Rubric checks reside in [grading.ts:2](../src/lib/grading.ts#L2); private rules/hints/teaching in the following sources. All current revisions are 1. Available commands are exhaustively mapped in the [engine audit](wia2008-engine-feasibility.md#command-inventory).

Topology **A**: PC-A–R1–R2–R3–PC-B, LANs 192.168.10.0/24 and 192.168.30.0/24, transits 10.0.12.0/30 and 10.0.23.0/30. Topology **B**: PC-A–SW1–R1–R2–PC-B, LANs 192.168.10.0/24 and 192.168.20.0/24, transit 10.0.12.0/30. All are authored chains, not arbitrary user-built networks.

| NetFault case / source | State, fault and minimal repair | Evidence / rubric out of 100 | Teaching and test evidence |
| --- | --- | --- | --- |
| **001 `ospf-01`**, schema 1, A; [scenario.ts:106](../src/server/scenario.ts#L106), [correctness](network-correctness.md) | R3 Gi0/0 area 1 conflicts with R2 area 0. Restore R3 area 0; R1–R2 remains healthy | Cause 30; exact affected endpoints R2+R3 20; endpoint config 10+10 and neighbor/route context 10; accepted fix 20 | Three hints, explanation and worked solution, plus four public guides. No private seven-section `lesson` array. [engine tests](../tests/engine.test.ts), [browser](../tests/browser/lab.spec.ts) |
| **002 `gateway-01`**, schema 2, B; [source:85](../src/server/gateway-scenario.ts#L85), [guide](gateway-lab.md) | PC-A gateway .10.254 is unowned; correct to .10.1. Access VLAN and area-0 router routes healthy | Cause/device/evidence 30/20/30; PC-A config or route observation suffices for evidence; exact gateway and forwarding reason 10+10 | Three hints; seven-part local/remote/return-path teaching with independent paper prompt; [unit](../tests/gateway.test.ts), [browser](../tests/browser/gateway.spec.ts) |
| **003 `vlan-01`**, schema 3, B; [source:90](../src/server/vlan-scenario.ts#L90), [guide](vlan-lab.md) | SW1 Fa0/1 VLAN 20 versus Fa0/24 VLAN 10; change only Fa0/1 to 10. Valid PC gateway cannot resolve through split broadcast domains | Cause/observed VLAN 20+10; switch/interface 10+10; PC config plus both memberships 10+10+10; targeted intended VLAN 20 | Three hints; seven-part VLAN/ARP/evidence teaching, independent paper solution on request; [unit](../tests/vlan.test.ts), [browser](../tests/browser/vlan.spec.ts) |
| **004 `return-01`**, schema 4, B; [source:87](../src/server/return-scenario.ts#L87), [guide](return-path-lab.md) | R1's forward static route works; R2 lacks 192.168.10.0/24. Add via 10.0.12.1; no OSPF/default workaround | Cause/prefix 20+10; R2 20; R1 route 10 plus PC-A config with R2 route 20; route/reply explanation 10+10 | Four hints; seven-part source/return-path teaching, independent paper solution on request; [unit](../tests/return.test.ts), [browser](../tests/browser/return.spec.ts) |
| **005 `passive-01`**, schema 5, A; [source:93](../src/server/passive-scenario.ts#L93), [guide](passive-interface-lab.md) | R2 Gi0/1 is passive. Remove only its passive setting; leave passive LANs and advertisements intact | Cause 30; router/interface 10+10; passive config 20 plus up/neighbor/route context 10; action/Hello reason 10+10 | Four hints; seven-part Hello suppression versus data forwarding, independent paper solution on request; [unit](../tests/passive.test.ts), [browser](../tests/browser/passive.spec.ts) |
| **006 `timer-01`**, schema 6, A; [source:16](../src/server/timer-scenario.ts#L16), [guide](timer-lab.md) | R3 Gi0/0 Hello/Dead 5/20 versus design 10/40; restore R3 10/40 | Cause 30; router/interface 10+10; each endpoint timer 10+10 plus neighbor/routes 10; exact timer profile/reason 10+10 | Four hints; seven-part timer compatibility, independent paper solution on request; [unit](../tests/timer.test.ts), [browser](../tests/browser/timer.spec.ts) |
| **007 `next-hop-01`**, schema 6, A without OSPF; [source:31](../src/server/next-hop-scenario.ts#L31), [guide](next-hop-lab.md) | R2's installed route to 192.168.30.0/24 points back to R1 at 10.0.12.1. Replace next hop with R3 10.0.23.2; resolves forwarding loop | Cause/prefix/observed next hop 10+10+10; R2 20; R2 route/config 15 plus R1 direction AND R3 address evidence 15; route/forwarding reason 10+10 | Four hints; seven-part installed-but-wrong next-hop reasoning, independent paper solution on request; [unit](../tests/next-hop.test.ts), [browser](../tests/browser/next-hop.spec.ts) |

All seven provide T and V-H; hints make guided investigation possible and untimed/timed no-hint replay permits independent **fixed-case** practice. Repeating a known answer is not evidence of transfer. `grade()` checks selected server/local observation IDs, device/command combinations and structured repair fields; it does not interpret notes or prove the learner understood each output. Configuration examples and paper independent prompts require external practice for actual command-entry competence.

## Progress, assessment and offline boundaries

- Academy read/practiced/correct/revealed states are distinct. Revision-1 drafts and feedback remain interpretable; current lesson/exercise revisions are 2. Local key `netfault.academy.progress.v1`; no cross-device sync or secure academic grade. Limits/recovery and immutable history: [progress.ts](../src/lib/academy/progress.ts), [history.tsx](../src/components/academy/history.tsx), [Academy documentation](learning-academy.md#progress-revisions-and-recovery).
- Practice uses an explicitly downloaded, inspectable scenario pack; hints and solution access are recorded. Server-backed assessments own commands, deadline and final grade for 20 minutes; no active hints/Academy. Deadline continues during disconnection; late submission cannot override expiry. See [sessions.ts:9](../src/server/sessions.ts#L9), [API](../src/app/api/lab/route.ts), [assessment tests](../tests/assessment.test.ts).
- Blobs uses durable records and conditional writes; local files require one server process. No redesign proposed. Initial assessment payloads/assets omit private answer content, but public Academy and downloadable practice packs make this self-assessment, not a proctored exam. [Privacy tests](../tests/browser/privacy.spec.ts), [serverless tests](../tests/serverless.test.ts).
- Academy works offline only after its full production shell is cached; each lab additionally needs its pack. APIs are excluded. Assessment and external references require internet. Local data can be evicted; corrupt/quota failures are surfaced. Journal retains the latest 100 attempts; Academy keeps bounded revision records without silently evicting them. [storage.ts](../src/lib/storage.ts), [worker](../scripts/service-worker.js), [offline tests](../tests/browser/academy-touch.spec.ts#L138).

**Largest verified app gaps:** IPv6 and the other historical named protocol families are absent; course-specific build/configure tasks are not assessed; detailed OSPF mechanics exceed the bounded model; learning transfer beyond fixed examples is not established. Their current-semester priority and required depth remain unverified.
