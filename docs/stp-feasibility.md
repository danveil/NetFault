# STP feasibility audit — Milestone 3H

**3I implementation update — 25 September 2026:** the separately authorized bounded model and LAB 010 are now implemented; see [implementation details and limits](milestone-3i.md) and [verification](verification.md). The original 3H planning audit below is retained as history; its no-implementation label describes 3H, not the current application. This does not mean full STP support.

**PLANNED ONLY — NO STP ENGINE OR LAB 010 IMPLEMENTED**

24 September 2026; inspected repository baseline `c5a9052`, clean at intake. This is an author-facing engineering audit, with proposed answers. It is not application content or authorization to implement. LAB 001–009, Academy, assessment storage and deployment remain unchanged. The detailed proposed next milestone is [Milestone 3I scope](milestone-3h-plan.md).

## 1. Source provenance and inspection limits

Course evidence, historical evidence, repository behavior and engineering proposals are distinct below. Slide numbers are one-based. Practical section names are authoritative locators; `P` numbers are nonempty extracted paragraphs, not printed page numbers.

| Key | Actual source | Inspection in 3H |
| --- | --- | --- |
| C1 | Current archive entry `1.STP.ppt`, 42 slides | All native slide text freshly extracted read-only; visuals inspected on slides **8, 10, 12, 14, 17–22, 24, 26–27, 31–32, 35, 37, 39–42** |
| C1R | `1.STPrv.txt` | Complete revision outline: concepts, operation, evolution, configuration |
| H1 | Historical `C:\Users\afiq hakiki\Documents\ant\STP.ppt`, 42 slides | All native slide text freshly extracted; visuals cross-checked on **17, 24, 37, 40** |
| E1 | `6.4.2 Lab - Implement Etherchannel.docx` | STP-related native text in Part 3, Configure 802.1Q Trunks, especially the question after `show interfaces trunk` (P92–99); this is not a fresh full-page or topology-image review |
| S1 | `11.6.2 Lab - Switch Security Configuration.docx` | Native text in Part 3, Implement PortFast and BPDU guard (P281–293), plus trunk verification fields (P112–130); no fresh full-page/image review |
| M1 | `10.MANAGEMENT.ppt` | Native text of slides 54, 58–61, 64–65 on baselines, hypothesis, rollback, follow-the-path and comparison; image-only troubleshooting slides not reinterpreted |
| N1 | NetFault documents and implementation | Files linked in sections 3 and 7; historical audits are context, not fresh execution evidence |

Current source archive: `C:\Users\afiq hakiki\OneDrive - Universiti Malaya\Degree year 3\ant(REPEAT)\26.27_material.zip`. SHA-256: `F50841753A0D2AA476061BAADA3CDAB683F2BAB86FB2D8F1D6D083799F15205B`. The existing extraction at `C:\Users\afiq hakiki\AppData\Local\Temp\netfault-2627-F5084175` was used. The archive entry and extracted `1.STP.ppt` were checked against each other: SHA-256 `C713855713DF4AB63EF3679D6116DE3FD61AFBDF25C5928C80ADB200D2AD2B77`. H1 SHA-256: `0C4638F05C866ED06FDACA140D76917F1E3B29B1C72B2595EC0C64FE20880F15`.

C1 and H1 have matching freshly extracted native text by slide; they are **not byte-identical files**, and this is not proof that every embedded image is identical. PowerPoint was opened read-only with macros disabled; temporary text/PNG output stayed outside the repository. Sources were not edited or copied into public assets. Archive provenance and the broader prior review are in [semester inventory](semester-2627-gap-analysis.md); historical provenance is in [source inventory](wia2008-sources.md).

**Partial review:** C1 slide 31's bottom forwarding boxes are clipped at the source slide boundary. Use slide 30's explicit three-state text and slide 32's role diagram; do not reconstruct the missing pixels. Unlisted images/animations/notes were not exhaustively reviewed. Slide screenshots are teaching examples, not observed device execution. No current exam weighting, deadlines, complete practical rubric or learner mastery is established; the supplied Introduction's old dates remain qualified in the semester inventory.

## 2. What the material actually supports

Types: **C** conceptual; **R** calculation/reasoning; **K** configuration; **V** verification; **T** troubleshooting. A source teaching a skill does not mean NetFault implements it or the learner has demonstrated it.

| Concept / skill | Exact course evidence | Type and qualification |
| --- | --- | --- |
| Redundancy, loops and loop prevention | C1 3–12; visual storm on 8, blocked path on 10, tree on 12 | C/R. Ethernet frames do not have IP's TTL protection; distinguish storms, duplicate delivery and MAC instability (5–7). No measured storm experiment supplied here |
| Bridge ID and root election | C1 13–17; 14 bit fields; 17 numerical triangle | C/R. Compare priority plus VLAN extended system ID, then MAC; priority values 0–61440 in steps of 4096 (15). Lower wins |
| Root path cost / root port | C1 18–19 | C/R. Sum receiving-port costs toward root; compare alternative totals. Slide 18 distinguishes short and long cost tables |
| Designated and non-forwarding ports | C1 20–22; 32 | C/R. Compare root paths on each segment; redundant non-root/non-designated port blocks data. Alternate and backup are taught, but shared-segment backup is unnecessary in the proposed topology |
| Equal-cost tie breaking | C1 21, 23–24 | R. Sender bridge ID precedes sender port priority/ID in root-port selection. Slide 24 illustrates different upstream bridges, not a local port-number shortcut |
| VLAN-specific identity and trees | C1 16, 28–29, 41 | C/R/K. Slide 41 assigns opposite primary/secondary preferences for VLANs 10 and 20. This does not require the first simulator to implement multiple simultaneous VLAN instances |
| Classic STP and RSTP/Rapid PVST+/MST | C1 25–32, 42 | C/K. Timers, five classic states, three RSTP states, variant comparison; slide 42 has Rapid PVST+/point-to-point configuration. No complete RSTP handshake/state-machine specification |
| Convergence and recovery | C1 9, 11, 25–27, 30 | C/R. Default Hello/forward-delay/max-age values and transition diagrams. Not enough evidence for a universal recovery-time prediction or measured timing requirement |
| PortFast and BPDU Guard | C1 33–35, 40; S1 Part 3, Implement PortFast and BPDU guard | C/K/V. Actual practical asks for configuration and `show spanning-tree interface f0/6 detail`; displayed mode/guard/role fields support verification. Guard-trigger/recovery behavior is not executed by this audit |
| Manual path cost | C1 38; C1R configuration section | K/R. `spanning-tree cost` and its removal are shown |
| Root primary/secondary and explicit priority | C1 39, 41; C1R configuration section | K/R. Slide 39 shows configuration alternatives. Despite its “Configure and Verify” heading, the image contains no root verification output; do not count the heading as a show-command example |
| STP operational observations | S1 section above, P285–293; E1 Part 3 question, P97–99 | V/R. S1 supplies per-interface STP detail; E1 asks why two trunk ports have different VLAN forwarding sets. The exact `show spanning-tree vlan 10` command proposed below is vendor-supported, not claimed to appear in C1 |
| Troubleshooting process | M1 54, 58–61, 64–65 | T. Define the problem, collect baseline, compare/follow path, test hypothesis with rollback, document recovery. These support the proposed investigation method; no lecturer-authored wrong-priority incident was found in the inspected STP content |
| Unestablished depth | Inspected portions above | No confirmed requirement for arbitrary BPDU decoding, live packet storms, a complete STP protocol implementation, vendor-specific debug traces or a particular assessed STP fault. MLAG/SPB/TRILL are mentioned at C1 36, not deeply configured |

### Technical qualifications and independent references

Preserve course terminology while qualifying simplified illustrations:

- C1 18 labels cost tables by standards/variant eras. Choose an explicit cost method; **RSTP does not inherently imply long costs**. C1 37's PVST+ default is a historical/platform-specific example, not a universal current switch default.
- C1 20 says all ports on the root bridge are designated; qualify this as operational ports in a valid simple topology, and do not confuse it with a non-root switch's **root port**. C1 26 mixes alternate terminology into classic blocking; explicitly separate **role** from **state**.
- C1 39's primary and explicit-priority commands are alternatives, not proof of a single simultaneously verified network. Do not implement `root primary` as a permanent role lock or an unconditional priority constant.
- S1's sample identifies “Port 8 (FastEthernet0/6)” but gives port identifier `128.6`. Preserve this source discrepancy; the proposed model stores its own consistent port number rather than copying that output.

Cisco's [Catalyst 9300 IOS XE 17.3 STP guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-3/configuration_guide/lyr2/b_173_lyr2_9300_cg/configuring_spanning_tree_protocol.html), reviewed 24 September 2026, corroborates root/role principles, explicit priority/cost configuration and the VLAN show command (sections Understanding Spanning-Tree Protocol, Configuring the Root Switch, Configuring the Device Priority of a VLAN, and Monitoring). Its default-mode table differs from C1 37, reinforcing the platform caveat. These references validate concepts, **not this proposed topology on IOS**.

## 3. Current Layer 2 implementation audit

| Layer of capability | What exists at `c5a9052` | What does not follow from it |
| --- | --- | --- |
| Visual | [topology.tsx](../src/components/topology.tsx) renders a five-position device layout; LAB 008 supplies parallel `physicalLinks` through [catalog.ts](../src/lib/catalog.ts) | It can draw extra edges, but does not compute STP. Layout/text/CSS for explicit links currently assume the EtherChannel illustration |
| Stored configuration | [schema.ts](../src/lib/schema.ts): switch ports have access VLAN, up, speed, full duplex; active VLAN list, physical endpoint links; v7 port channels | No bridge MAC/priority, STP cost, port identifier, root ID, role or per-VLAN protocol state. Existing interface MACs are on numbered interfaces, not switch bridge identities |
| Derived LACP state | [etherchannel.ts](../src/lib/etherchannel.ts): `physicalPortUp`, `channelState`, `forwardingPorts`, `forwardingLinks` | Logical LACP formation is real within its bounds; it is not root election or a reusable arbitrary aggregate-graph constructor |
| Actual forwarding | [engine.ts](../src/lib/engine.ts), `peers`: traverse active same-VLAN switch ports through `forwardingLinks`; hide switches from IP next-hop/trace results | The visited owner/port set prevents recursion, **not Ethernet loops**. An arbitrary redundant graph is not qualified; no blocked-port filtering, frame storm, FDB learning or ordered L2 path report exists |
| Connectivity | `forward`, `connectivity`, `execute` share derived peers/routes and independent reply evaluation | Binary reachability and IP trace cannot establish which L2 tree was selected; no switch IP hop should be invented |
| Applied changes | [repair-trial.ts](../src/lib/repair-trial.ts): clone and replay v7 group-mode / v8 ACL-order edits; no-op detection; bounded history | No STP trial yet. Dispatch currently treats any discriminated `kind` repair as ACL, so a new kind requires explicit dispatch |
| Evidence/recovery | [grading.ts](../src/lib/grading.ts), [acl-grading.ts](../src/lib/acl-grading.ts): initial vs `repairIndex` observations, actual-state predicates, fresh verification | No STP rubric. Existing one-successful-ping assumptions in authoring tests are unsuitable for a design fault with working traffic |
| Persistence/server | [storage.ts](../src/lib/storage.ts), [sessions.ts](../src/server/sessions.ts), [session-store.ts](../src/server/session-store.ts): v1 journals, per-lab packs, server-owned replay/deadline and Blobs CAS | Reusable as-is in architecture. New union/schema compatibility and round-trip tests are necessary; no new database or process memory is needed |

**LAB 003:** [VLAN contract](vlan-lab.md) and [scenario](../src/server/vlan-scenario.ts) model one SW1 access-port VLAN mismatch. Same-VLAN traversal, host gateway resolution and replay-derived ARP are foundations. There is no redundant switched loop. Preserve this scenario/revision and its grading.

**LAB 008:** [EtherChannel contract](etherchannel-model.md) and [scenario](../src/server/etherchannel-scenario.ts) constrain v7 to two switches, two hosts and two physical members of one local channel per switch; no alternate path. It already removes members from independent forwarding and introduces one `logical-bundle` edge. Unformed members **do not fall back** to standalone forwarding, because standalone-disable is explicit. One eligible member can sustain the channel, while full recovery verifies intended membership. Logical per-port up state exists; STP per-port forwarding state does not.

### EtherChannel safeguard

A future combined model must aggregate eligible LACP members **before** STP, expose one logical port/edge and apply STP decisions to that aggregate; bundled members cannot compete as separate paths. Cisco's [EtherChannel guide, LACP operation](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/lyr2-fwd/etherchannel/etherchannel-configuration-guide/etherchannels.html) explicitly treats the formed channel as one STP device port. Its broader platform behavior is not a replacement for LAB 008's explicit standalone-disable contract.

**Decision:** LAB 010 contains no channel. The proposed STP schema rejects combined STP/channel scenarios, and v7 retains its current path. This milestone changes neither. Next milestone needs guard/regression tests, not a mixed STP+LACP implementation. The present `forwardingLinks` single-bundle assumptions must never silently be generalized by feeding a triangle into them.

## 4. Candidate comparison and decision

All fault stories below are design inferences, not supplied lecturer exercises. Ratings are qualitative engineering judgments, not course weighting.

| Criterion | A: bridge priority | B: path cost | C: port priority tie | D: PortFast misuse | E: BPDU Guard on an inter-switch port |
| --- | --- | --- | --- | --- | --- |
| Course evidence | C1 13–17, 39, 41 | C1 18–19, 38 | C1 23; limited configuration depth in C1 | C1 33, 35, 40 | C1 34, 40; S1 Part 3 |
| Learning value | Root, BID, roles, design vs reachability | Weighted paths and local vs total cost | Later tie-break after other comparisons | Edge/transit distinction | Protection and legitimate connectivity |
| Engine complexity | Small graph, substantial new bounded solver | Same solver plus cost-trial surface | Needs parallel independent links or richer topology and sender-port semantics | Transient startup can be the actual harm | BPDU receipt, errdisable/latch/reset model |
| Diagnostic clarity | Compare intended root, observed BID and selected tree | Distinguish configured local cost from path total | Easy to misteach local rather than sender priority | Steady state may be entirely normal | Clear only if guard cause/state are modeled |
| Mobile playability | Three switch views, one select edit | More per-interface arithmetic/controls | Denser link/port views | Would need temporal explanation | Extra protection/state controls |
| Repair clarity | One bridge-priority field | One interface cost | Correct sender-side priority in suitable topology | Remove edge treatment, but no honest steady-state proof alone | Correct edge policy and controlled recovery |
| Spoiler risk | Medium: publish intended root, hide actual config until inspected | Medium: publish intended path, hide actual cost | High with only one exposed tie-edit target | High if UI names unsafe PortFast automatically | High if pre-labelled guard failure |
| Unsupported transients | None for settled election/tree | None for settled tree | None if fully bounded | High; do not fake permanent loops from PortFast alone | Requires new event/latching semantics |
| Verify success | Root + all roles + intact cabling + traffic | Intended path/cost + intact traffic | Exact changed role at intended tie | Not sufficient with settled ping | State recovery and retained protection |
| Reusable foundation | Root/path/role solver for later work | Good second use of same solver | Useful later, little benefit before basics | Different timing problem | Separate security extension |

**Recommend exactly A:** LAB 010, **The unexpected detour**, one incorrect bridge priority on the intended root. It directly connects the course's election sequence to an applied design check, with deterministic settled-state recovery. B is feasible later but adds interface-cost editing before root/role reasoning is established. C needs topology/port-tie behavior unnecessary for this first case. D cannot be represented honestly as a persistent outage with this model. E is source-supported but requires event/errdisable semantics, so is not stronger for the first STP increment.

## 5. Smallest technically honest model

**Proposed, not implemented:** a single-VLAN, PVST-style **steady-state selection model**. Use role names Root / Designated / Alternate and data states Forwarding / Blocking; annotate alternate as the redundant non-designated path. It implements neither a full classic 802.1D FSM nor Rapid PVST+. “Point-to-point” here describes a full-duplex two-endpoint link, not an implemented RSTP handshake.

Bound the engine input to **two or three switches**, at most one inter-switch link per switch pair, and one or two singly attached IPv4 hosts. The published lab uses all three switches, both hosts and all three inter-switch links. One active access VLAN shared by every participating port; no trunk or router. Distinct switch bridge MACs; priority multiple of 4096 in 0–61440. Explicit short path-cost method, integer port costs 1–65535, default 4 for the lab's 1 Gb/s ports; reject zero/negative/out-of-range costs. Port IDs use stored unique local numbers and fixed priority 128, not device-name hashes or lexical interface sorting. No user cost or port-priority editor in the first lab.

Separate **configuration** from a pure derived snapshot:

1. Build the operational adjacency graph from physical endpoints, both ports' up state and common active VLAN. Retain original cabling separately. Never use last snapshot's pruned forwarding graph as input to a new election.
2. Within each connected switch component, choose the lowest `(base priority + VLAN ID, numeric 48-bit MAC)` as root. An isolated switch is its own root. Unique BIDs avoid input-order-dependent elections.
3. Root cost is zero. Find minimum additive cost to it; a candidate at switch X through neighbor Y is `local receiving-port cost at X + rootCost(Y)`. Store endpoint costs separately: asymmetric costs must not be accidentally treated as one undirected edge weight.
4. Select each non-root's root port by that total, then upstream sender BID on equality. Simple graphs exclude two candidate ports to the same neighbor; with unique BIDs, sender-port and receiver-port tie breaks are unreachable here. **Do not claim those tie-break skills are implemented.**
5. On each two-switch segment choose the designated endpoint by `(its rootCost, its BID)`; root ID is already common within the component. Compare advertised cost, **not** cost plus the receiving port again. Distinct BIDs resolve ties. Host-facing active ports are designated in this no-host-bridge model. All active root-bridge ports are designated under these restrictions.
6. Root and designated ports forward. Other operational inter-switch ports are Alternate/Blocking; down ports are separately Disabled. An edge carries user data only if **both endpoints** forward in the VLAN. Blocking filters ingress and egress data without setting physical link-down or removing configured VLAN membership.
7. Forwarding, command renderers, grading and explanatory path derivation consume this snapshot. Derived roles are never authored answer fields. Positive costs plus the selection rules must yield a forest, proven by model tests. Recompute immediately after a configuration trial and label the observation **settled state; convergence not simulated**.

This is reusable within a small graph class, not reusable across arbitrary topologies. There is no public network builder. A pure helper may expose the unique host-to-host tree path for tests/feedback; it must not insert switches into `tracert`. The proposed lab needs no new path command: observed roles plus cabling are sufficient to infer that path.

**Excluded:** BPDU serialization/exchange/counters, timers, transient listening/learning, topology-change notifications, packet replication/storms, MAC learning/aging, live latency/bandwidth, complete classic/RSTP FSMs, MST, unrestricted VLAN instances, tags/native VLANs, shared LAN/hub backup roles, independent parallel links, editable port priority, root-primary macro execution, PortFast/BPDU Guard events, mixed STP/LACP, protocol races and arbitrary larger graphs. These exclusions must appear in future learner-facing scope language.

## 6. Feasibility matrix and regression risk

| Behavior | Classification | Required boundary / risk |
| --- | --- | --- |
| Physical endpoints, active ports, VLAN membership | Already supported | Reuse fields; preserve LAB 003 behavior |
| Qualified redundant L2 graph | Substantial extension | Validate simple triangle/path class; visuals alone insufficient |
| Bridge identity/priority | Small extension | Strict new fields, numeric deterministic comparison, old schemas reject new capability |
| Root election | Small extension | Pure per-component minimum; never infer from role labels |
| Local/path costs and root ports | Substantial extension | Positive receiving-port weights; deterministic tie handling |
| Designated/alternate and forwarding state | Substantial extension | Role separate from physical status; one elected tree constrains all delivery |
| Reachability on tree | Small integration, high regression sensitivity | Gate new filtering to explicit STP model; preserve current peers/source/reply behavior elsewhere |
| Config trials and versioned observations | Already supported framework; small extension | New strict repair variant and explicit dispatch; reuse replay/no-op/CAS |
| Derived STP/config diagnostics | Small extension after solver | One exact VLAN command; no invented counters/timing |
| Grading / recovery | Small extension | Design predicate, not “broken ping”; initial and fresh current-state evidence |
| EtherChannel | Existing bounded support; combined behavior excluded | Preserve aggregation/member exclusion; reject mixed scenarios |
| VLAN handling | Existing access membership; small qualification | One common active VLAN; no trunk/per-VLAN generalization |
| Timers, storms, PortFast/guard, full RSTP | Excluded | Cannot be implied by a settled role table |

Feasibility **passes as a bounded proposal**, conditional on model-first tests and forwarding integration. Overall effort is a substantive protocol extension, not a JSON-only scenario addition. No runnable STP prototype was created in 3H.

Risk is **highest** at shared `peers`/forwarding and schema validation; LAB 003 can regress if blocking is conflated with VLAN/down state. LAB 008 is also high-risk if its logical edge is bypassed, duplicated or its strict topology checks are loosened. Other labs have lower direct L2 risk but shared schema/command/grade/UI changes can affect them. Keep all nine authored modules/revisions unchanged, branch only on explicit model capability and preserve old test assertions. [The implementation plan](milestone-3h-plan.md) specifies module seams and gates.

## 7. Repository evidence read

Documentation: [README](../README.md), [AGENTS](../AGENTS.md), [semester gap analysis](semester-2627-gap-analysis.md), [3G plan](milestone-3g-plan.md), [3G record](milestone-3g.md), [source inventory](wia2008-sources.md), [coverage](wia2008-coverage.md), [engine feasibility](wia2008-engine-feasibility.md), [roadmap](wia2008-roadmap.md), [network correctness](network-correctness.md), [Academy](learning-academy.md), [LAB 003](vlan-lab.md), [LAB 008](etherchannel-model.md).

Implementation: the schema/engine/LACP/grading/trial/storage/session modules linked above; [scenario registry](../src/server/scenarios.ts), [catalog](../src/lib/catalog.ts), [UI](../src/components/netfault.tsx), [API route](../src/app/api/lab/route.ts), [authoring tests](../tests/authoring.test.ts), [case contract](../tests/case-contract.ts). Test sources establish existing assertions, not freshly passing execution. Verification of this documentation-only milestone is recorded in the [3H plan](milestone-3h-plan.md#8-3h-verification-and-stop-condition).
