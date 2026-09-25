# Milestone 3H — STP audit and proposed Milestone 3I scope

**Historical approved plan, implemented under separate Milestone 3I authorization on 25 September 2026.** See [3I implementation](milestone-3i.md) and [verification](verification.md). The future-tense scope, gates and documentation-only 3H results below retain their original provenance; they are not an outstanding implementation prohibition after that authorization. No later lab or broader STP feature is authorized.

**PLANNED ONLY — NO STP ENGINE OR LAB 010 IMPLEMENTED**

24 September 2026. Documentation-only audit against `c5a9052`. The [feasibility audit](stp-feasibility.md) contains source provenance, course claims, current capabilities, candidate comparison and model boundaries. This document specifies one possible next implementation milestone; **3I requires separate authorization**. Author-facing answers here must not ship as public lab metadata.

## 1. Recommendation and public incident

Propose **LAB 010 — The unexpected detour**, ID `stp-01`, content revision 1, next schema version **9** if still available at implementation intake. Exactly one fault: SW1's VLAN 10 bridge priority is 40960 rather than its intended preferred-root setting. This is an original NetFault case derived from the inspected course, not a university practical number.

Learner objectives: compare bridge IDs; identify the elected root; distinguish physical availability from data forwarding; infer a loop-free path from root/designated/alternate roles; correct one priority; verify the new tree without removing redundancy. Connectivity success is a control observation, not proof that the design is correct.

**Public incident:** “PC-A and PC-B can still communicate after maintenance, but the settled switching path no longer matches the approved design. Investigate the physical and logical topology, make a justified correction, and verify the intended tree while retaining all cables.”

**Public design intent:** one access VLAN 10, all links operational at 1 Gb/s/full duplex, short path costs of 4, no aggregation, router or default gateway. SW1 is the distribution switch and must be root with a **strictly lower configured bridge priority than SW2 and SW3**, avoiding reliance on a MAC-address tie. With the equal link costs, host traffic should use the direct SW1–SW3 link; SW2–SW3 is the redundant data path. Do not publish initial priorities, elected roles, fault location, canonical repair value or answer/evidence keys automatically. Design intent identifies the goal, not the actual deviation.

The incident must be inspectable from the ordinary cabling view and switch observations. No fabricated user complaint about loss, latency, bandwidth or convergence time. No automatic red faulty edge, root badge or blocked-state overlay before the learner obtains relevant observations.

## 2. Exact topology and independent expected state

```text
PC-A ── SW1 ───────── SW3 ── PC-B
          \          /
           \── SW2 ─/
```

Five devices; three independent inter-switch links plus two host attachments. This is the smallest **simple** redundant switch graph; two switches with parallel links would require the port-tie/multigraph behavior intentionally excluded here. Switches are unnumbered Layer 2 devices.

| Device | Relevant identity / addressing | Initial base priority | Canonical repaired priority |
| --- | --- | ---: | ---: |
| SW1 | Bridge MAC `0200.0000.0010` | **40960** | **24576** |
| SW2 | Bridge MAC `0200.0000.0020` | 32768 | 32768 |
| SW3 | Bridge MAC `0200.0000.0030` | 32768 | 32768 |
| PC-A | Ethernet0 `172.26.10.10/24`, MAC `0200.0000.00a1`, no gateway | — | — |
| PC-B | Ethernet0 `172.26.10.20/24`, MAC `0200.0000.00b1`, no gateway | — | — |

All five MACs are distinct, locally administered unicast addresses. Switch bridge MACs are explicit stable configuration, not random values or hashes of scenario IDs. All hosts and link subnet metadata use `172.26.10.0/24`; network/broadcast addresses are not hosts. Host absence of a gateway is correct for same-subnet communication, not a second fault.

| Physical link | Endpoint A | Endpoint B | VLAN / port cost |
| --- | --- | --- | --- |
| host-a | PC-A Ethernet0 | SW1 Gi0/3 | Access 10 / switch cost 4 |
| sw12 | SW1 Gi0/1 | SW2 Gi0/1 | Access 10 / 4 at each end |
| sw13 | SW1 Gi0/2 | SW3 Gi0/1 | Access 10 / 4 at each end |
| sw23 | SW2 Gi0/2 | SW3 Gi0/2 | Access 10 / 4 at each end |
| host-b | SW3 Gi0/3 | PC-B Ethernet0 | Access 10 / switch cost 4 |

All ports, links and VLANs remain up/active in both authored states. VLAN 10 is the sole modeled instance. STP on these consistently configured access links is deliberate; the course's trunk diagrams do not require introducing tagged trunks for this single-VLAN exercise. Host-edge costs do not contribute to switch root paths. Local port numbers 1/2/3 correspond explicitly to Gi0/1–3 and have port priority 128; SW2 has only ports 1 and 2. Display full interface names where useful, without inventing additional ports.

### Hand-derived oracle, not scenario-authored operating flags

Initial effective priority fields include extended system ID 10: SW1 **40970**, SW2 **32778**, SW3 **32778**. SW2 wins the root tie against SW3 by its lower MAC. SW1 and SW3 each reach SW2 directly at cost 4. On SW1–SW3, equal root cost is resolved by SW3's lower BID, so SW1's endpoint blocks.

After the canonical repair SW1's effective priority is **24586**, so SW1 is root. SW2 and SW3 each have direct root cost 4. On SW2–SW3, their equal effective priority/root cost is resolved by SW2's lower MAC, so SW3's endpoint blocks.

| Switch port | Initial role / data state | Repaired role / data state |
| --- | --- | --- |
| SW1 Gi0/1 → SW2 | Root / Forwarding | Designated / Forwarding |
| SW1 Gi0/2 → SW3 | Alternate / Blocking | Designated / Forwarding |
| SW1 Gi0/3 → PC-A | Designated / Forwarding | Designated / Forwarding |
| SW2 Gi0/1 → SW1 | Designated / Forwarding | Root / Forwarding |
| SW2 Gi0/2 → SW3 | Designated / Forwarding | Designated / Forwarding |
| SW3 Gi0/1 → SW1 | Designated / Forwarding | Root / Forwarding |
| SW3 Gi0/2 → SW2 | Root / Forwarding | Alternate / Blocking |
| SW3 Gi0/3 → PC-B | Designated / Forwarding | Designated / Forwarding |

| Property | Initial | Correctly repaired |
| --- | --- | --- |
| Root / root costs SW1, SW2, SW3 | SW2 / 4, 0, 4 | SW1 / 0, 4, 4 |
| Data-forwarding switch edges | sw12 + sw23 | sw12 + sw13 |
| Retained but non-forwarding edge | sw13, blocked at SW1 | sw23, blocked at SW3 |
| PC-A → PC-B Layer 2 path | PC-A, SW1, SW2, SW3, PC-B | PC-A, SW1, SW3, PC-B |
| Reciprocal host ping | Success | Success |
| Approved root preference/tree | Not met | Met |
| Cabling / loop-free data graph | Five cables / tree | Same five cables / tree |

The extra initial inter-switch hop is a modeled path difference, not a measured performance penalty. A spanning tree need not produce shortest paths between every pair of hosts. This lab grades compliance with a stated design, not a universal claim that every nonpreferred root is broken.

## 3. Investigation, commands and applied repair

### Minimal observation surface

Follow the existing exact command enum/button architecture. Add only **`show spanning-tree vlan 10`** for the three switches. The solver takes an explicit VLAN argument internally; this first command does not promise arbitrary CLI parsing, abbreviations, VLAN ranges, bare `show spanning-tree` or other instances. Existing unsupported-command handling remains honest.

| Command / device | Input and source of output | Diagnostic value / intentional omissions |
| --- | --- | --- |
| `show interfaces status` / switches | Selected switch; physical peer/port availability, configured VLAN, speed/full duplex | Confirms connected even when STP blocks data; must not label blocking as link-down. No counters, negotiated timing or errors |
| `show vlan brief` / switches | Configured active VLAN and member ports | Confirms common VLAN, not root or forwarding permission. Blocked ports remain listed |
| `show running-config` / switches | Supported configured fields including mode annotation, base priority, explicit short costs and port membership | Reveals bridge-priority setting after inspection. Do not render effective priority as the configured value. No STP role in configuration, passwords, BPDU counters or unsupported services |
| `show spanning-tree vlan 10` / switches | Pure derived STP snapshot for VLAN 10 | Root ID, local bridge ID (base + extended ID + stable MAC), root-path cost, root port or “this bridge is root,” local port cost and `128.number`, role and state. Omit timers, ages, sent/received counts, convergence claims and topology-change counters |
| `ipconfig` / PCs | Numbered host interface, derived subnet mask, explicitly no default gateway | Confirms same-subnet addressing. No switch management IP or DHCP inference |
| `ping` / PCs | Required destination selector/input; existing source/destination and independent reply reachability on selected tree | Both host directions succeed initially and finally; no invented loss/latency. Same-subnet checks do not prove approved tree |

All outputs are a **Cisco-like / PC educational subset**, clearly labelled as condensed modeled observations. A steady-state banner belongs outside pseudo-IOS fields. Switch show commands need no destination. No switch ping without a management address. Do not add `tracert` as a tree-discovery command: Layer 2 switches are not IP hops. No new simulator path command is needed; cabling plus observed roles supplies the proof. After submission, feedback may show the helper-derived Layer 2 path, explicitly labelled simulator explanation.

Public status/config renderers must use current trial state. No canned output blobs, scenario-ID forwarding shortcuts, authored root/role booleans or special “ping succeeds” flag. The ordinary network is derived even when a wrong but valid trial is applied.

### Evidence path

1. Read the approved design and inspect physical cabling. Host addressing/ping optionally establish the “working connectivity, wrong design” distinction.
2. Inspect all three STP views: identify SW2 as root and SW1's alternate port, then infer the indirect data path. Compare **all** relevant BIDs, not only one priority number.
3. Inspect SW1 configuration: its base priority is 40960, above both access switches. Interface status and VLAN views distinguish this from an intentional shutdown/VLAN split. A connected blocked port is normal STP behavior; the violation is the selected tree relative to design.
4. Record/select initial evidence before trial edits. Choose structured cause, affected switch, VLAN, observed base priority and mechanism. Notes remain saved but ungraded.
5. Apply a bounded priority change, collect fresh observations, select them, then submit. Do not force unrelated commands just to lengthen the exercise.

Propose four explicitly requested Practice hints: distinguish connectivity from the stated design; compare each switch's reported root and BID; separate configured base priority from extended VLAN ID and check the preferred switch; then consider how lowering that switch's base priority changes the election and which fresh checks demonstrate it. Record hints through the existing attempt mechanism. No automatic answer reveal, hint in Assessment, or requirement to use hints; the worked exact repair remains explicitly opened after feedback.

### Configuration control and accepted semantics

Proposed strict repair action: `{ kind: "stp-priority", device, vlan, priority }`. Select a switch (all three available, not a preselected fault target), VLAN 10, and one of the 16 valid base priorities 0–61440 in steps of 4096. Show the proposed equivalent `spanning-tree vlan 10 priority N` before Apply. Reject invalid devices/VLANs/values and extra fields. Do not execute arbitrary IOS or a root-primary macro.

Canonical repair: SW1 base priority **24576**, all other fields unchanged. Accept any valid SW1 value **0 through 28672** that produces the intended roles/tree and strictly lower priority than the unchanged SW2/SW3. A memorized canonical number is not required. SW1 priority **32768** would elect SW1 by its MAC and restore the path, but fails the explicit strict-priority policy; feedback must explain this subtle distinction. Changing cost, deleting a cable, disabling STP, modifying a bridge MAC, or changing other switches as the final fix earns no full recovery.

Reuse current clone/replay, ten-change limit, 100-command limit, no-op behavior and rollback-by-another-trial. Earlier exploratory changes reverted to their original values are allowed; require the **final effective diff** to change only SW1 priority, not exactly one history event. Recompute after every actual change. Canonical state and other attempts remain immutable.

## 4. Proposed deterministic grading and privacy

Keep diagnosis score and recovery status separate, following LAB 009's pattern. Never grade arbitrary prose or trust submitted output text. Recompute observations from original/current state and validate selected server-recorded IDs/scenario/command/target/configuration version; offline Practice remains deliberately inspectable.

| Part | Points | Exact rule |
| --- | ---: | --- |
| Cause and observed setting | 20 | Structured bridge-priority cause + initial SW1 base priority 40960; no credit from “STP is broken” alone |
| Location | 10 | Exact affected-device set `{SW1}` (5) and VLAN 10 (5) |
| Initial supporting evidence | 30 | Selected pre-change STP views for **all three switches** (20 together), plus SW1 running-config (10); outputs must equal recomputation. Status/VLAN/host checks remain useful optional discrimination, not artificial mandatory evidence |
| Applied repair and mechanism | 20 | Final minimal policy-compliant state + selected bridge-priority remediation (15); structured “lower BID selects the root, recomputing port roles” reasoning (5) |
| Fresh verification | 20 | Current-state success predicate plus selected fresh STP views on all three switches, SW1 running-config, and reciprocal PC pings after the latest actual change |

Recovery predicate requires: at least one effective trial, only the allowed final priority difference, SW1 strictly preferred and elected, exact intended root costs/role matrix, all original physical links/ports/VLAN intact, and reciprocal host delivery on the expected tree. Grading must derive these from state; expected answers stay private. Full score also requires diagnosis/evidence/reasoning. Recovery statuses remain `unresolved`, `recovered-unverified`, `verified`; a high diagnosis score is not proof of recovery. A ping alone, selected fix alone, correct role prediction alone, or stale evidence can never earn verified recovery.

Fresh means `repairIndex === repairs.length` after the latest real change and output identical to deterministic execution on that state. Returning to an earlier equivalent state still needs new observations for the current version. Repeating an identical no-op does not invalidate evidence. Initial and current evidence serve different purposes and remain visibly version-labelled in history/journal.

Preserve online-only Assessment, server deadline and finalization, immutable final grade, Blobs strong reads/ETag CAS retries and attempt-bound scenario identity. Add SW3 to validated device handling without allowing devices outside the selected scenario. A client cannot set root/role/recovery or author assessment history. Concurrent repair/command/submit requests must serialize by existing reducer/CAS semantics and produce consistent version attribution. No storage redesign, authentication system, process-only session state or new infrastructure.

Private scenario/fault/accepted repair/evidence rules/hints/lesson stay in server-only modules. Public catalog may expose title, design goal, cabling, commands and generic controls, not actual priority values, current elected tree or worked fix. Preserve existing active-assessment restrictions on guides/Academy/hints/reveals; no sensitive API caching. Practice pack proposed key `netfault.practice.stp-01.v1` is explicitly downloaded and inspectable; installed shell + pack permit offline Practice. Existing journal and Academy keys/revisions must remain readable without migration. The future primer is public conceptual material, not exam confidentiality.

## 5. Academy decision: B, a tiny non-spoiling primer

Existing Academy has IPv4 and OSPFv2, not bridge-ID/role preparation; existing material alone would make this first STP case too close to guessing. A complete STP module is unnecessary for this bounded objective. Recommend **B**, an optional pre-lab primer, without changing existing lessons, exercises, diagrams or progress semantics.

Scope: three short cards and one purposeful local triangle diagram with text equivalent. Cover why physical redundancy needs a selected data tree; lower BID root election; root/designated/alternate roles and local cost versus root cost. Include an analogy of retained roads with selected routes, explaining that switches exchange control information and frames are not human drivers. A blocked port is physically connected; a working ping does not prove the intended root.

Use unrelated device names A/B/C and VLAN 30, different identities and a different root placement. Include one worked comparison, one guided tap prediction and one changed-value independent tap prediction, with meaningful wrong feedback and explicitly requested detailed answers. These are small preparation checks, not a new Academy module, scored exam or mastery measure; do not add a progress storage namespace or count them as existing Academy completion. No case-specific target, priority correction or lab evidence checklist in public answers. Keep requested solutions and all accepted tap/keyboard/accessibility principles. Block access during active Assessment through the existing guard.

After the lab, private seven-part teaching should explain the actual BID arithmetic, two trees, why traffic already worked, configuration correction, diagnostic roles, a guided role calculation and a different independent exercise with requested solution. Do not implement either the primer or lesson in 3H. Real-device configuration, timer behavior, port-priority ties and per-VLAN load sharing remain external/later learning, not completed skills.

## 6. Proposed 3I module changes and implementation order

Paths marked **new** do not exist yet. All linked existing paths were checked in this audit. These are planned seams, not permission to redesign unrelated code.

| Module | Proposed bounded change |
| --- | --- |
| [schema.ts](../src/lib/schema.ts) | v9/`stp-01`; strict switch STP/port identity and cost fields, new repair/diagnosis types. Restrict new fields to STP; reject mixed LACP/ACL/OSPF/router topologies. Extend the no-gateway exception only for validated same-subnet STP hosts; preserve v1–v8 |
| **New** `src/lib/stp.ts` | Pure input validation/graph, BID comparison, root/path/role snapshot and selected-edge/path helpers. No imports of private scenarios, grading keys or browser state |
| [etherchannel.ts](../src/lib/etherchannel.ts) | Only the necessary capability guard accommodation: current non-v7 check rejects `link.up` generally. Permit explicit physical availability for validated v9 without allowing channels or weakening v7 topology/member constraints. No LACP algorithm rewrite |
| [engine.ts](../src/lib/engine.ts) | Filter STP data ports/links in shared peer traversal; render derived STP/config observations; canonical repaired preview uses new repair type. Old scenarios take current behavior unchanged |
| [repair-trial.ts](../src/lib/repair-trial.ts) | Explicit action discrimination for ACL/LACP/STP; typed priority edits and descriptions; reuse state comparison and history limits |
| [grading.ts](../src/lib/grading.ts), **new** `src/lib/stp-grading.ts` | Delegate only STP grading to new branch; preserve older rubrics. Independent expected-state checks plus original/fresh evidence validation |
| **New** `src/server/stp-scenario.ts`; [scenarios.ts](../src/server/scenarios.ts) | One private validated scenario, original hints/lesson, registry entry and canonical repair. Preserve every existing authored module/revision |
| [catalog.ts](../src/lib/catalog.ts) | Neutral metadata, exact commands, public physical links and design intent; no operating state. Add optional incident heading/text descriptor with existing fallback |
| [netfault.tsx](../src/components/netfault.tsx), [topology.tsx](../src/components/topology.tsx) | Replace the unconditional outage heading only through per-lab metadata; triangle layout/text alternative without bundle-specific narration. Device selection, versioned evidence, new structured diagnosis/repair UI. Do not relabel old cases |
| **New** `src/components/stp-repair.tsx`, `src/components/stp-primer.tsx` | Touch-first existing-style controls and narrow preparation component; no CLI editor or external dependency |
| [globals.css](../src/app/globals.css) | Only any necessary scoped triangle/card responsive styling; no theme redesign |
| [API route](../src/app/api/lab/route.ts), [sessions.ts](../src/server/sessions.ts) | SW3 validation and new typed action flow; preserve attempt-scenario checks, command history, limits/deadline and durable reducer architecture |
| [storage.ts](../src/lib/storage.ts), [preview.ts](../src/lib/preview.ts) | Review for compatibility; generic pack naming should need no algorithm change. Extend type/preview support only where required; no key migration or data reset |
| [authoring.test.ts](../tests/authoring.test.ts), [case-contract.ts](../tests/case-contract.ts) | Existing cases assert initial ping failure. Retain that assertion for all nine; add an explicit independently specified design-fault oracle for STP instead of globally removing failure checks. Account for unnumbered switches in endpoint connectivity assertions |
| **New** `tests/stp.test.ts`, `tests/browser/stp.spec.ts`; existing regression suites | Model-first tests below, both modes, offline/mobile/privacy/storage plus all prior cases |

The [service-worker source](../scripts/service-worker.js), dependencies/lockfile, Netlify configuration, [session-store.ts](../src/server/session-store.ts) architecture and published Academy content are not proposed changes. Use existing build-generated offline shell/versioning; verify new eagerly loaded UI and explicitly downloaded pack through production offline tests. If implementation requires a broader architecture change, stop and report the demonstrated reason instead of silently expanding scope.

Order and gates:

1. Reconfirm clean baseline/instructions and current Next guides for actual code work. Freeze old scenario/content revisions; review Cisco subset terminology and this hand-derived oracle.
2. Implement strict model and **model-level tests first**, before the private scenario or UI. No forwarding integration until root, role, tree and ordering invariants pass.
3. Connect derived state to shared forwarding/commands. Run focused LAB 003/008 and route/ACL regressions before content integration.
4. Add only `stp-01`, structured trials, private grading and versioned evidence. Prove initial success plus design violation and corrected design independently of the grader.
5. Add triangle UI, truthful heading, narrow primer, feedback/journal and mode integration. Verify privacy/assessment serialization/offline behavior.
6. Run normal lint/type/unit/browser/build/production-offline acceptance; update documentation with actual results and limits. No commit/push/deploy unless separately authorized. No LAB 011 or broader STP coverage.

## 7. Model-first verification plan for 3I

These are **future tests, not tests run or passed in 3H**.

### Independent solver and graph tests

- Root election: lower configured priority wins even with a higher MAC; equal effective priorities select lowest numeric MAC. Validate 40960 + 10 = 40970 and canonical 24576 + 10 = 24586. Reject duplicate bridge MAC/BID, multicast/malformed MAC, nonmultiple/negative/out-of-range priority and duplicate local port IDs.
- Cost selection: root cost zero, direct 4 beats two-link 8. Change a local direct cost to 12 in a model fixture; two-link 8 wins without changing the elected root. Test asymmetric endpoint costs explicitly, so the local receiving side controls the candidate total. Reject zero/negative/overflow/unsupported cost method.
- In-scope ties: in a triangle make SW3's direct-to-root cost 8 equal its cost-4 link via SW2 whose root cost is 4; the lower sender BID (root) wins even if its local receiving port number is higher. For designated ties test both unequal priorities with equal root costs and equal priorities resolved by MAC; initial and repaired LAB 010 cover these respectively. Input device/link/port array permutations must leave results identical.
- Out-of-scope ties: reject independent parallel links and shared segments, so two ports from the same sender cannot require sender-port-priority/ID resolution. Fixed port IDs are displayed consistently but **not claimed as exercised tie-break functionality**.
- Forest invariant: enumerate all eight up/down combinations of the three triangle switch edges with representative priority orderings, equal-priority MAC permutations, and bounded cost combinations (for example 4/8/12 at each endpoint). Each connected component has one root, non-roots one root port, each operational segment one designated endpoint, no forwarding cycle, and exactly `switches - components` forwarding switch edges. Disconnected components elect locally. This exhausts the selected finite matrix, not all legal integer configurations.
- Filtering: an up/active cable with one blocking endpoint cannot carry data in either direction; it remains present in physical/status/VLAN views. Root calculation must still consider it at the next recomputation. Test both traversal orientations to catch egress-only checks.
- Hosts: the selected tree connects intended same-VLAN hosts in both directions; disabled host attachment disconnects only that host. No default gateway or switch IP is invented. Reject wrong VLAN, unconnected/reused endpoints, router/extra-switch/shared-segment/channel configuration and unauthorized extra fields for the bounded schema.
- Independently assert the complete initial and repaired table in section 2. Do not generate the expected table by calling the same solver being tested. Assert distinct exact L2 paths while reciprocal ping succeeds in **both** states.

### Trial, command, grading and state tests

- Apply each accepted SW1 priority 0–28672; verify intended tree and unchanged other fields. Reject invalid action shape; valid but wrong SW1 36864 remains unresolved; SW1 32768 restores root by MAC but fails strict-priority policy. Altering SW2 instead must not pass minimal-repair grading.
- Replay/undo exploratory edits, unchanged canonical input, separate-attempt isolation, no-op version preservation and ten-change cap. Changing to a different valid repair invalidates old verification even if roles are the same.
- Match every displayed root/cost/role to derived state; configuration shows base priority, operational display shows base plus VLAN ID. Connected blocked port remains connected. Wrong VLAN command/unimplemented aliases return unsupported, not plausible output.
- Correct diagnosis plus applied repair and full selected initial/fresh evidence earns 100/verified. Wrong cause, wrong location, forged/cross-scenario/mutated output IDs, missing initial evidence, stale versions and fix-without-application lose the specified points. Ping-only never verifies recovery.
- Journal/active-attempt/pack round trip including SW3 observations and new repair action; unchanged old v1 records/packs and quota/corrupt-record safeguards. Reload feedback without losing version labels or silently regrading an old case.
- Server repair/command/submit races, separate invocation replay, expired/finalized attempts, immutable final score and no client-authored roles/history. Existing CAS conflict tests remain; do not replace durable storage or weaken guards to satisfy an emulator.
- Public catalog/build chunk and fresh active-assessment privacy scans: no private device-to-initial-priority mappings, accepted repair/evidence keys, hints or worked solution content. The generic 16-value priority selector necessarily contains valid numbers including 40960 and 24576; test private associations/content, not blanket numeric-string bans. Distinguish legitimate observed config from accidental pre-observation answer leakage. API no-store and worker exclusion remain.

### Regression and user workflow gates

- LAB 003: original VLAN mismatch, same-VLAN reachability, repair, ARP replay and unchanged rubric. No STP fields needed on legacy switches.
- LAB 008: failed passive/passive group has no standalone bypass; formed group still one logical edge; one-member continuity and both-member full recovery checks; no STP solver on v7; reject mixed STP/channel schema. Preserve original public cable explanation/layout.
- LAB 001–009: all current schema, addressing, commands, source/return forwarding, ACL control flows, grading, privacy, journal and browser smoke/regression assertions. New STP authoring branch must not weaken their initial-failure or exact-repair contracts. Preserve Academy revision/progress/offline tests.
- LAB 010 Practice: enter incident, inspect every device, select initial evidence, apply wrong and correct trials, select fresh evidence, submit, explicitly open explanation/solution, inspect derived repaired preview, save/reopen journal, retry. Assessment: complete timed attempt online with no hint/primer reveal, resume durably, verify deadline and finalized behavior.
- Production offline: initially load shell/download Practice pack online, then disconnect and repeat inspection/trial/grade/journal/reload. Assessment remains unavailable offline. Test update behavior through existing worker mechanism without changing its architecture.
- Desktop plus **414 CSS pixels** and 360px: five selectable devices/three distinct switch edges, no clipped labels or page overflow, 44px controls, no mandatory drag or typing, readable horizontal terminal scrolling, keyboard focus, text topology alternative, priority selector and evidence controls. Topology itself never silently reveals computed roles. Physical iPhone/IOS/Netlify validation must be labelled performed or unperformed accurately.

## 8. 3H verification and stop condition

3H verification is limited to sources and documents: source-file existence and slide/section support, referenced repository paths, Markdown links/anchors, documentation-only diff, and `git diff --check`. It includes source inspection and hand calculation, **not an executed STP model**. No lint/type/unit/browser/build suite is required or claimed for these documentation changes. Historical 3G results are not relabelled as fresh.

**Actual documentation checks completed 25 September 2026:** all seven named source paths exist; 168 local Markdown links across the seven changed documents resolve, including 23 heading/code-line anchors. Changed-file allowlist confirms exactly the two new planning documents and five existing documentation updates, with no application changes. Whitespace checks include both new untracked documents; `git diff --check` passes for tracked changes. Git reports the repository's normal LF-to-CRLF notices, not whitespace errors. Source claims were checked against native text and the listed visual subset; the two role/path tables were hand-derived independently of application code. Application/browser tests were intentionally not run, as requested for this milestone.

The audit reviewed native text of both 42-slide STP decks and the visual subset/partial clipping documented in [source limits](stp-feasibility.md#1-source-provenance-and-inspection-limits). No packet capture, Packet Tracer, CML/GNS3, physical switch, physical iPhone or deployed Netlify test was performed. Cisco documentation supports the proposed rules, not an execution of this exact network. Further source images and actual platform output remain possible validation work when 3I is authorized; no current assessment weighting was inferred.

**Stop after this plan.** No STP implementation, LAB 010 registration, new Academy content, engine/schema/API/persistence/UI/worker change, dependency change, commit, push or deployment is authorized by 3H.
