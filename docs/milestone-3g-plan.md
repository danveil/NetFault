# Milestone 3G plan — LAB 009: The closed passage

**PLANNED ONLY — no production implementation.** Authored 23 September 2026 against `dda7c0b`. Implementation needs a later user instruction. Preserve accepted LAB 001–008, Academy revisions, journals, Netlify storage and existing behavior. No dependency, commit, push or deployment is part of this plan.

The [semester gap analysis](semester-2627-gap-analysis.md) records the actual `26.27_material.zip`, exact filenames, inspection limits, eight implemented labs and five candidates. Source references R6/P6 and R10/P10 below resolve there. This is an original scenario design inferred from the course, not a lecturer-authored LAB 009 or a completed university practical. Author-facing spoilers in this document must never become initial application assets.

## 1. Proposed lab and learning objective

**LAB 009 — The closed passage.** Topic: standard IPv4 ACL order and policy-preserving recovery.

After completing it, the learner should be able to:

1. Establish that host addressing, local delivery and forward/return routes are sound without assuming remote traffic must therefore pass.
2. Map a packet's **source** to a standard ACL, at the correct router/interface/direction, and explain why an earlier matching rule defeats a later permit.
3. Apply a bounded sequence change that restores the intended permission without opening access to all sources.
4. Gather fresh configuration, positive and negative probe evidence after the latest change; distinguish a stated fix from demonstrated recovery.

Prerequisites: current IPv4 local/remote and wildcard understanding; LAB 004/007's independent route lookups. No new Academy content. Existing preparation links remain neutral and unavailable during active Assessment as currently required.

## 2. Semester alignment and model validation

| Explicit supplied teaching                                                              | Design consequence                                                                                 |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| R6; P6 3–8: sequential rules, first match, implicit deny, standard source-only matching | One ordered source filter; no destination/port-based ACL masquerading as standard                  |
| P6 5,15,17,20: direction, attachment and placement                                      | Bind a standard ACL outbound toward the protected LAN; show binding separately from route evidence |
| P6 10–13: wildcard bits and shorthand                                                   | Use only `172.24.10.0 0.0.0.255` and `any` in this authored case                                   |
| P6 24–27: `show access-lists`, sequence numbers and editing                             | Read ordered ACEs; change one existing sequence via a bounded control                              |
| P6 19: test intended policy                                                             | Successful authorized flow plus still-denied control flow                                          |
| R10; P10 60–65: seven-step process, rollback, follow-the-path/comparison                | Baseline evidence → hypothesis → applied change → fresh checks → documented verdict                |

**External correctness cross-check, not a replacement syllabus:** Cisco's [IOS ACL sequence guide](https://www.cisco.com/en/US/docs/ios-xml/ios/sec_data_acl/configuration/15-2mt/sec-acl-seq-num.html) supports first-match processing, sequence editing and implicit denial. Its [IOS XE ACL overview](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/sec-vpn/b-security-vpn/m_sec-access-list-ov-0.html) distinguishes ordinary outbound transit filtering from the optional filtering of device-originated traffic. The proposed subset uses the ordinary transit behavior; it does not enable `match-local-traffic`. These documentation checks were performed during planning; no controlled Cisco/Packet Tracer session was run.

Standard ACL host-entry ordering can have platform-specific presentation/processing details. This case has only two wildcard ACEs (a subnet and `any`), no exact-host ACEs or hash-table ordering. Before publishing worked CLI in implementation, verify the chosen named-ACL sample against its stated Cisco reference/platform; label output condensed and bounded. Do not generalize this small model to every ACL implementation.

## 3. Scenario, topology and initial symptom

Smallest useful topology with a remote filtering router and independent source control:

```text
PC-A ── R1 ── R2 ── PC-B
      office   transit   protected LAN
```

Four devices, three physical links. No access switch is needed for this learning objective. Existing router/PC and chain topology primitives suffice. No fault-colored edge or policy-verdict overlay appears automatically.

| Device | Interface | Address         | Gateway / route     |
| ------ | --------- | --------------- | ------------------- |
| PC-A   | Ethernet0 | 172.24.10.10/24 | Gateway 172.24.10.1 |
| R1     | Gi0/0     | 172.24.10.1/24  | Office LAN          |
| R1     | Gi0/1     | 10.49.0.1/30    | Transit to R2       |
| R2     | Gi0/0     | 10.49.0.2/30    | Transit to R1       |
| R2     | Gi0/1     | 172.24.20.1/24  | Protected LAN       |
| PC-B   | Ethernet0 | 172.24.20.10/24 | Gateway 172.24.20.1 |

R1 has static `172.24.20.0/24 via 10.49.0.2`; R2 has static `172.24.10.0/24 via 10.49.0.1`. All numbered interfaces and links up, unique MACs, valid hosts/prefixes; no OSPF/default route/NAT/DNS dependency. Connected and local routes derive normally. No additional fault.

**Public incident:** “PC-A cannot reach PC-B in the protected work area. Local gateway checks succeed. Investigate the path and the access policy, apply a justified change, then verify the result.”

**Public design intent:** traffic forwarded into `172.24.20.0/24` may come from office subnet `172.24.10.0/24`; other forwarded sources must remain excluded. Router-originated diagnostic traffic at the filtering router follows the separately documented model boundary. The learner sees intended policy and wiring, not the actual ACE order, faulty device, fix or private grading predicates.

## 4. Exactly one root cause

Private initial R2 configuration:

```text
ip access-list standard WORKAREA
 10 deny any
 20 permit 172.24.10.0 0.0.0.255
interface GigabitEthernet0/1
 ip access-group WORKAREA out
```

The broad deny occurs before the office permit. Both rule predicates/actions are otherwise correct, and the binding is correct. Treat this as one **ACL ordering fault**, not a missing route plus a security failure.

One accepted resulting order:

```text
ip access-list standard WORKAREA
 5 permit 172.24.10.0 0.0.0.255
 10 deny any
```

Moving the deny after the existing permit is also semantically valid, for example permit 20 / deny 30. Do not grade a memorized sequence number as the only fix. The learner's applied result must keep exactly the same two ACE identities, actions/predicates and binding, with permit evaluated first. Sequence numbers are ordering identifiers, not priority weights or routing metrics.

## 5. State model and forwarding contract

Propose one new scenario schema version (next available, currently 8), one ID such as `acl-01`, revision 1. Do not modify old scenario versions/revisions.

### Configuration, not canned outcomes

- Router-scoped named **standard IPv4** ACL with two ACEs: stable internal identity, positive unique sequence, permit/deny action, source subnet/wildcard or `any`.
- Interface-scoped outbound reference to an existing ACL. For first implementation, schema permits only this bounded nonempty outbound standard-ACL shape; inbound, empty/missing lists, extra bindings and other types are rejected as unsupported rather than assigned invented behavior.
- Authored sources are one canonical /24 wildcard plus `any`. A bounded predicate can derive subnet membership with existing IPv4 helpers. Do not expose an arbitrary wildcard or extended-ACL editor.
- No stored `broken`, `recovered` or `pingSucceeds` flags. Configurations produce policy decisions; forwarding produces connectivity; grading evaluates that state.
- Private fault, accepted repair semantics, evidence requirements, hints and lesson stay server-only. Public generic action names/types are allowed; private expected values are not.

### Required source-aware extension

Today `forward(s, start, target, observe?)` in [engine.ts](../src/lib/engine.ts) has no packet source. `connectivity` already validates/selects a ping source, but does not pass it into `forward`. A destination-only walk cannot implement a standard ACL correctly.

Add a minimal packet context containing original source IPv4, destination IPv4 and originating device. Keep the source unchanged across ordinary routers. Preserve current no-ACL behavior and call sites through an explicit compatibility path; enumerate `forward` callers including ARP/history, traceroute and packet-journey helpers before changing its contract.

For this **forwarded outbound IPv4 subset**:

1. Validate/choose the source as today: explicit active local router address/interface if supplied, otherwise outgoing interface for routers, host interface for PCs.
2. Do the ordinary local-destination check and longest-prefix lookup.
3. Before a transit packet leaves the selected router interface, evaluate its bound ACL in ascending sequence order using the **original packet source**. Stop at the first match. No match in a supported nonempty list means implicit deny.
4. A deny prevents further delivery; do not ask the next hop to forward that packet. A permit continues through existing interface/neighbor resolution.
5. A packet addressed to the filtering router itself does not exit the protected interface. A packet originating at that router is outside ordinary outbound transit filtering in this documented subset. Do not reclassify either as forwarded PC traffic.
6. Only a delivered echo request produces an echo reply. The reply gets source = target host and destination = request's selected source, and follows a separate route/policy evaluation. Do not reuse request verdicts or reverse the route automatically.
7. A router-originated packet from **R1** is transit traffic by the time it crosses **R2**. Its `10.49.0.1` source must still be filtered there. “Router-originated” is local to the device evaluating the policy, not a global exemption.

Keep a private structured drop reason for deterministic tests/grading. Ordinary ping output reports no replies without naming the guilty ACL/rule automatically. Do not fabricate an ICMP administrative-prohibition response or precise timing. If implementation exposes a simulator explanation after feedback, label it separately from command output.

### Independent behavioral oracle

These are design expectations to prove later, not executed results:

| Probe                                          | Initial | Healthy     | Why                                                                                    |
| ---------------------------------------------- | ------- | ----------- | -------------------------------------------------------------------------------------- |
| PC-A → 172.24.10.1                             | Success | Success     | Local LAN, no protected egress                                                         |
| PC-B → 172.24.20.1                             | Success | Success     | Local gateway; not a forwarded ACL exit                                                |
| R1 → 10.49.0.2                                 | Success | Success     | Connected transit                                                                      |
| PC-A → PC-B                                    | Failure | Success     | Request source office /24; initially denied on R2 Gi0/1                                |
| PC-B → PC-A                                    | Failure | Success     | Request reaches PC-A; its office-sourced reply initially denied on R2 Gi0/1            |
| R1 → PC-B, explicit source Gi0/0 / 172.24.10.1 | Failure | Success     | Office source should pass after repair                                                 |
| R1 → PC-B, explicit source Gi0/1 / 10.49.0.1   | Failure | **Failure** | Required excluded control; not office source                                           |
| R1 → PC-B, default source                      | Failure | **Failure** | Existing default source is outgoing transit interface; a useful diagnostic distinction |
| PC-A → R2 172.24.20.1                          | Success | Success     | R2 owns this address; reachability of gateway itself does not prove passage to PC-B    |
| R2 → PC-B                                      | Success | Success     | Locally originated diagnostic, not forwarded through R2 by another source              |

All router routes stay unchanged before/after. The negative control is deliberately sourced on R1, so it traverses the filtering router. A failed negative probe alone is insufficient evidence: route/config context and private model evaluation must establish intended denial, not another fault.

## 6. Commands and evidence

Proposed command allowlists: both PCs `ipconfig`, `ipconfig /all`, `ping`; both routers `show ip interface brief`, `show ip route`, `show running-config`, `show access-lists`, `ping`. Numeric destination input/quick targets and existing router source selector remain available. Do not list traceroute/tracert for LAB 009: accurately integrating ACLs with TTL probe responses is outside this first lab. Older labs retain their commands.

| Command / devices                   | Output to derive                                                                                                                                                                             | What it establishes                                                                              | Current equivalent                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `ipconfig`, `/all` / PCs            | Actual address, /24 mask, gateway, static adapter/MAC details                                                                                                                                | Exact office source and correct host next hop; PC-B return gateway                               | REUSE existing host renderer                                         |
| `show ip interface brief` / routers | All four configured addresses, up/up                                                                                                                                                         | Real gateways/transit mapping; no physical fault                                                 | REUSE                                                                |
| `show ip route` / routers           | C/L routes and two respective specific static routes; no default                                                                                                                             | Destination lookup in each direction is valid; policy is a separate decision                     | REUSE; ACL must not remove routes                                    |
| `show running-config` / routers     | Existing interfaces/static lines; R2 named ACL entries and Gi0/1 outbound attachment; no ACL on R1                                                                                           | Connect ACE order to the path/interface/direction                                                | EXTEND existing config renderer; print no fabricated protocol lines  |
| `show access-lists` / routers       | R2 `Standard IP access list WORKAREA`, ordered `10 deny any`, `20 permit 172.24.10.0, wildcard bits 0.0.0.255`; after sequence trial reflect actual order/numbers. R1 has no configured ACL. | The first matching rule, including unreachable later permit; absence is a legitimate observation | NEW small renderer; existing command dispatch/history pattern reused |
| `ping` / PCs and routers            | Existing success/no-reply style from actual source-aware request/reply outcome; retain resolved source display                                                                               | Compare local/remote and office/transit sources; verify both permission and exclusion            | EXTEND shared forwarding; reuse target/source UI and output layout   |

ACL output is a **condensed configuration/ordering view**. Do not invent hit counts, logs, packet captures, measured RTTs or live counters. Implicit deny can be explained in private teaching but is not printed as a configured ACE. Requested command observations legitimately expose configuration during Assessment; that is diagnostic evidence, not an answer-key leak.

## 7. Investigation and diagnose/repair flow

An expected investigation, without forcing one exact command order:

1. Read incident and intended policy. Check host addresses and local gateways; establish the failed remote baseline.
2. Follow destination prefixes on R1/R2 and inspect actual interfaces. Check the return route separately; rule out the older missing-route and wrong-next-hop explanations.
3. Inspect running configuration and ACL output. Identify which interface the request exits, which source the ACE sees and which entry matches first. Compare with the intended office permission.
4. Record a hypothesis in notes (saved, not language-graded). Select original-state evidence before a configuration trial.
5. Apply one bounded edit, return to Inspect, run fresh configuration and flow tests. A failed trial is retained and can be reversed through another explicit edit.
6. Submit structured diagnosis plus selected original and latest-version evidence. Submission alone never applies a canonical repair.

**Diagnosis inputs:** cause class (ordered policy, missing route, wrong gateway, interface fault as plausible alternatives), affected router/interface, ACL name, observed first-matching sequence, proposed sequence-change action, structured explanation of first-match source permission plus retained exclusion. Generic options and blank inputs may be public; no default selected correct device/ACL/sequence. Notes are never keyword-scored.

**Configuration trial:** device, ACL name, existing sequence, new sequence. Select the device using existing controls; names/sequences may be entered or selected from configuration the learner has actually inspected. Do not populate correct ACL details from a hidden catalog. Numeric fields need a mobile numeric keyboard; sequences are small, and existing-entry cards plus labeled numeric controls should avoid typing long CLI. Reordering by drag alone is not acceptable.

Apply is an explicit button with a neutral diff summary. It changes that ACE's sequence atomically, preserving predicate/action/identity/binding. For example, sequence 20 → 5 is a valid effective edit; 20 → 30 is a valid but unsuccessful hypothesis. Reject duplicate/noninteger/out-of-range sequences, unknown device/ACL/entry, unsupported fields and cross-scenario actions with useful generic errors. Define bounded sequence range 1–999 for this simulator, not as Cisco's universal range. No-op leaves version unchanged. Ten actual changes and 100 commands preserve existing attempt limits.

## 8. Recovery logic and grading

Recovery must be evaluated from replayed learner changes, **not** `repaired(original)` or a submitted correct-fix string. Require:

- At least one effective trial; correct ACL still attached outbound to R2 Gi0/1.
- Exactly the authored two rule identities, actions and predicates retained; office permit before deny-any, with valid unique sequences.
- Addresses, links, routes and other configuration unchanged. The bounded action makes unrelated edits impossible, with validation guarding forged requests.
- Both host ping directions and the office-sourced R1 probe succeed in the model.
- Transit-sourced R1 → PC-B remains denied by that outbound policy. Model checks must distinguish policy denial from missing route/resolution failure.

Do not require one exact final sequence value or exactly one historical trial: failed hypotheses may precede a correct minimal final configuration. Final changed configuration should differ only in the ordering identifiers needed to put the same permit before deny.

Proposed deterministic 100-point rubric (new branch only; old rubrics unchanged):

| Part                            | Points | Required evidence/condition                                                                                                                                                                             |
| ------------------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cause                           |     20 | Structured first-match/order cause; observed first-matching entry consistent with initial state                                                                                                         |
| Location                        |     10 | R2 and Gi0/1 outbound policy / named ACL identified (split 5 + 5)                                                                                                                                       |
| Initial supporting observations |     30 | 10: PC-A addressing + failed PC-A→PC-B baseline; 10: both router route tables; 10: R2 ordered ACL + config showing binding. Require initial version and valid commands, selected from recorded history. |
| Applied repair and mechanism    |     20 | 15: actual policy-preserving recovered state; 5: structured source/first-match/retained-denial explanation                                                                                              |
| Fresh recovery verification     |     20 | All fresh observations below and actual recovered state; no credit for selected command names alone                                                                                                     |

Correct diagnosis without applied recovery can receive diagnostic partial credit but must not receive a **recovered/verified** verdict. Persist/display a clear recovery status distinct from raw score if the existing UI lacks it; add an optional backward-compatible feedback field only if necessary. Any “passed” label for 009 must require actual recovery and fresh verification, not merely a percentage threshold. Hints/reveals remain visible in journal context; no mastery claim.

## 9. Exact fresh-verification requirement

From the latest configuration version, select all five observations:

1. R2 `show access-lists`: current order.
2. R2 `show running-config`: current ACL and unchanged outbound binding.
3. PC-A `ping 172.24.20.10`: success.
4. PC-B `ping 172.24.10.10`: success.
5. R1 `ping 172.24.20.10`, explicitly sourced from `Gi0/1` or `10.49.0.1`: correctly denied control.

Resolve explicit interface/IP source to the same valid address for grading. Require the negative source to be explicit so it demonstrates deliberate comparison; a default-source failed ping does not satisfy this checklist.

Keep baseline observations marked Initial. `repairIndex` must equal the **number of persisted actual repairs** for all verification evidence. Reverting and reapplying an equivalent healthy order still creates later versions; earlier observations remain historical and must be recollected. A no-op does not invalidate valid evidence. Server-side grade must validate/re-evaluate the matching command/source/target against the replayed state; no grading from arbitrary output text or client-provided histories.

## 10. Practice, feedback and educational explanation

Practice remains untimed and supports retries, progressive hints and explicit solution review under current behavior. Suggested hints progress from local/remote comparison → route and source checks → attachment/order inspection → predict first-match behavior and reverify policy. No hint auto-applies a fix. Do not reveal the specific fault on initial load or in a congratulatory trial message.

After submission/requested review, private teaching follows the existing seven-part form:

1. Simple: a router can know the path while a rule refuses a packet.
2. Analogy: a desk applies the first matching entry on an ordered admission list. Limits: ACLs inspect packet fields, not human identity/intent; the source address alone is not authentication.
3. Technical: source wildcard, ordered match, implicit deny, egress attachment, independent request/reply processing.
4. Worked packet/config example: trace PC-A's source at R2 and show an accepted sequence edit; separately explain the excluded transit source.
5. Symptom and guided investigation: distinguish this from the correct-host gateway, VLAN, absent-return and forwarding-loop faults already learned.
6. Different independent paper exercise: different subnet and order, require a permitted and excluded control; don't merely repeat sequence 5.
7. Explicitly requested independent answer with reasons and verification, not a mastery badge.

Worked IOS-style configuration may show removing/reinserting an ACE at an earlier sequence, clearly labeled as an example. The app performs one atomic bounded edit; it does not emulate intermediate CLI configuration windows, running/startup config or parse arbitrary IOS input. The current repaired preview stays separate from submitted evidence; it must show that an excluded source still fails after the canonical repair rather than describing every failure as unhealthy.

## 11. Assessment and answer privacy

Reuse current 20-minute server deadline, stored attempt ID, command limit, immutable finalization and no active hints/reveal. A repair action returns the applied state version/history event, not a hidden “correct” verdict, expected sequence, solution, rubric or canonical repaired network. Normal configuration outputs can reveal the fault only when requested through inspection.

Replay repairs inside the existing server reducer on every invocation. The persisted scenario selects the engine; client scenario overrides, forged histories, success flags or repairs in a submission never control grading. Resume preserves deadline, initial evidence and versioned trials. Concurrent commands/repairs use existing strong-read/conditional-write conflict re-evaluation. Both serialization orders must remain valid; a late command must not be mislabeled as a different configuration version. Expired/final attempts cannot mutate.

Keep scenario/answers server-only; extend public metadata allowlists and static-build privacy scans for the new private markers. No API caching at browser/CDN/Netlify layers; no service-worker API caching. Active payloads legitimately contain inspected configurations and learner changes, but not private evaluation data.

**Honest boundary:** this is personal self-assessment, not a secure exam. A user with repository access or an explicitly downloaded offline Practice pack can inspect the case answers. Do not claim encryption or a hidden React panel makes offline content confidential. Academy/practice shortcuts stay blocked in the active Assessment UI; this does not erase information previously learned.

## 12. Persistence, offline behavior and mobile design

### Persistence

Keep `netfault.journal.v1`, `netfault.active.v1`, every existing pack key and Academy storage unchanged. Proposed new pack key: `netfault.practice.acl-01.v1`. Attempts retain scenario, timestamps/deadline, command target/source/output, selected evidence, diagnosis draft, hints/reveal, feedback and timestamped repair events. Resume replays events from the immutable case rather than storing a second mutable network blob.

Current `repairActionSchema` is a strict LACP `{device, group, mode}` object, and attempts embed `.extend({at})`. It is **not a generic action union today**. Add a validated ACL action variant with an explicit kind while still accepting unchanged legacy LACP events; update event-schema construction deliberately. Do not bulk-migrate journals or require new discriminators on old records. Reject unknown future events without overwriting raw data. Preserve quota/error/export handling and the existing 100-attempt journal retention semantics.

Netlify Assessment continues using the current site-scoped Blobs store, strong reads and ETag CAS. Local disk store remains local only. No new service, secret, subscription, database or account work is needed.

### Offline

After a successful online app-shell cache and explicit 009 Practice-pack download, inspection, trials, deterministic grading, review and journal reopening should work offline. A missing pack requires a clear download-needed message. Initial download, Assessment/start/resume/commands/submission and external references require connectivity.

Use the existing eager root-shell and build-stamped worker snapshot. If code splitting is introduced accidentally, ensure new renderer/trial assets are cached before promising offline readiness. Do not replace the worker architecture or cache API bodies. Updated deployment must preserve attempts/packs and expose the current safe update/reload behavior. Test old packs/history in the new build.

### Desktop, 414px, 360px and iPhone

Four-node topology should fit the existing responsive positions; maintain a text/device-list alternative. Keep neutral links, tap-sized device controls, visible focus and pinch/zoom controls. ACL rows show sequence/action/source with wrapping or a locally scrollable terminal, never page-wide overflow. Avoid dragging to reorder as the only interaction.

At 360/414px, sequence editing, source selection, five evidence selections and return-to-Inspect must be reachable with the virtual keyboard open. Make Initial versus Version N visually/textually distinct; do not hide required source behind a hover-only affordance. A wrong trial must be easy to inspect and reverse. Physical iPhone Safari/PWA behavior is a separate later manual check, not inferred from viewport tests. Milestone 3F's physical check is user-reported; it does not verify future 009.

## 13. Feasibility against actual code

| Component / inspected code                                                                              | Classification                         | Reuse or required change                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IPv4/device/link/static routes in [schema](../src/lib/schema.ts); registry/catalog                      | EXTEND                                 | One case/version/ID and optional bounded ACL fields; preserve old parsing and exhaustive registration/command contracts                                                                                               |
| Host/router source choice and forward/return connectivity in [engine](../src/lib/engine.ts)             | EXTEND                                 | Pass packet source/origin through both walks; preserve no-ACL results. Existing source selector is not itself an ACL implementation.                                                                                  |
| Ordered source policy evaluator                                                                         | **NEW**                                | Route lookup answers destination reachability; VLAN/LACP answers link usability. Neither can represent first-match source permission without conflating policy with routes. One pure bounded evaluator is sufficient. |
| Outbound interface binding and drop result                                                              | **NEW**                                | Existing interface model has no packet-filter attachment or policy drop reason. Add only supported egress transit semantics; no protocol FSM.                                                                         |
| Command render/dispatch/history in engine + catalog                                                     | EXTEND                                 | Add ACL view and config lines, advertised only on supported devices/case. Existing ping/address/route rendering patterns reused.                                                                                      |
| [Trial replay](../src/lib/repair-trial.ts) and repair action schema                                     | EXTEND                                 | Current code explicitly requires schema 7 and LACP fields. Add case-aware sequence action; keep old actions valid and noop/limit/version semantics. Do not simply remove schema guard for every case.                 |
| Observation `repairIndex`, timestamped attempt repairs                                                  | REUSE mechanism / EXTEND action type   | Versioned evidence already works; new state replays through the same persisted events.                                                                                                                                |
| [Grading](../src/lib/grading.ts)                                                                        | EXTEND                                 | Existing initial-only evidence gate checks `schemaVersion !== 7`; must explicitly include 009 trial semantics, preserving old seven grades. Add policy-state and source-aware fresh-verification branch.              |
| [Repair UI](../src/components/etherchannel-repair.tsx), main [workflow](../src/components/netfault.tsx) | EXTEND                                 | Add separate small ACL control, generic trial/evidence integration; do not relabel LACP controls or widen every lab to trials.                                                                                        |
| [Topology](../src/components/topology.tsx)                                                              | REUSE                                  | Four supported device nodes and three ordinary chain edges; no new graph library or path-coloring behavior                                                                                                            |
| [Preview](../src/lib/preview.ts), `repaired`, packet journey                                            | EXTEND carefully                       | Canonical repair uses shared ACL state; preview probes must retain intended denied control and must not leak answers initially. Existing lab previews unchanged.                                                      |
| [Sessions](../src/server/sessions.ts), [API](../src/app/api/lab/route.ts)                               | REUSE architecture / EXTEND validation | New action union passes through server reducer; same fixed device identifiers are sufficient. No new administrative endpoint.                                                                                         |
| [Session store](../src/server/session-store.ts)                                                         | REUSE unchanged                        | CAS already serializes persisted command/repair reducers across invocations; no process-memory protocol state needed                                                                                                  |
| [Local storage](../src/lib/storage.ts)                                                                  | REUSE keys / EXTEND schemas            | Existing per-case pack key and journal; legacy events must remain loadable                                                                                                                                            |
| [Service worker](../scripts/service-worker.js) + build step                                             | REUSE                                  | Atomic shell assets, two snapshot retention, API/RSC exclusion; verify new content is actually available offline                                                                                                      |
| Authoring/privacy/browser tests in `tests/`                                                             | EXTEND                                 | Add new independent case contract and exact private markers; retain all old expectations                                                                                                                              |

The only genuinely new **network** capabilities are source-policy evaluation and attachment to a forwarding step. A new trial variant/renderer is necessary integration, not a general IOS subsystem. No spanning-tree convergence, virtual gateway, tunnel recursion, session table or transport simulation is required. If implementation starts needing those, scope has drifted and must return to this design boundary.

## 14. Explicit exclusions

- No change to any published 001–008 scenario, grade, supported command or Academy lesson/revision.
- No other new lab, randomization, variants, giant troubleshooting module or curriculum-completion claim.
- No extended ACLs, TCP/UDP ports, `established`, stateful sessions, object groups, time ranges, VTY policy or IPv6 ACLs.
- No arbitrary wildcard editor, exact-host hashing behavior, inbound filtering, multiple policies or interface-binding edits in the first playable case.
- No empty/nonexistent ACL behavior; schema rejects those unsupported authored configurations.
- No NAT/PAT, DHCP/DAI, port security, FHRP, STP, GRE/IPsec or IPv6 engine.
- No ACL counters/logging, packet capture, live clocks, measured throughput/latency, TTL traceroute/ICMP-error emulation for this lab.
- No arbitrary CLI parser, full IOS configuration mode, startup-config persistence or real network configuration.
- No offline Assessment promise, authentication redesign, cloud-storage redesign, paid infrastructure, deploy, push or commit.

## 15. Future automated acceptance plan — not executed

The following tests must be implemented/run **later**, after LAB 009 is authorized and exists.

| Area                               | Required assertions                                                                                                                                                                                                                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Schema and authoring               | Exactly one new registered lab; all addresses usable/unique, links/interfaces up, reciprocal static coverage, one ACL-order deviation from independent healthy fixture. Reject bad references/sequence collisions/unbounded ACL shapes.                                                                                  |
| Policy evaluator                   | First matching rule wins; later permit cannot override earlier deny; permitted /24 vs excluded transit; nonmatch implicit deny for a supported nonempty test fixture; reorder changes evaluation, not predicate/action. Boundary addresses match bits without authorizing invalid assigned host addresses.               |
| Packet context                     | Preserve original source through R1/R2; both default and explicit router source; independent reversed reply addresses; no reply generated for an undelivered request. Router-local versus transit behavior and R1-origin/R2-transit distinction as specified.                                                            |
| Initial symptom / exact correction | Assert every row of the behavioral oracle against broken and independently constructed healthy states. Route tables identical before/after. No lab-ID failure shortcut.                                                                                                                                                  |
| Commands                           | Actual ordered ACL/config/binding agree; PC IP and route outputs agree; correct R1 empty ACL view; unsupported commands rejected; no fake counters or drop-rule giveaway.                                                                                                                                                |
| Trial actions                      | Only existing ACE sequence changes; noop, duplicate, malformed/unknown action, wrong device/ACL/entry, ineffective valid edit, reverse/reapply, ten-change bound. Alternative valid final sequence numbers accepted.                                                                                                     |
| Diagnosis                          | Wrong cause/device/interface/order/explanation gives appropriate partial or zero category credit; failed ping alone insufficient. Correct answer without repairs cannot be recovered; removing/loosening policy through forged fields rejected.                                                                          |
| Initial/fresh evidence             | Original diagnosis evidence cannot be replaced by post-change views. Wrong target/source/device/version and unsupported output rejected. All five selected fresh checks required; old healthy evidence after another edit is stale; noop retains version. Negative control must fail specifically due to correct policy. |
| Practice and journal               | Full baseline→wrong trial→correct trial→fresh checks→submit→reopen flow; hints/reveals recorded; drafts/selections/source/version survive resume; old 001–008 attempts/packs and LACP repair events still parse. Corrupt/quota handling preserves data.                                                                  |
| Server/Assessment                  | Start/commands/trials/resume across independent store instances; no client-injected history/repairs; both concurrent command/change orders valid; CAS conflict retries re-evaluate deadlines; expiry/finalization immutable; wrong scenario/action rejected.                                                             |
| Privacy                            | Fresh page/catalog/static chunks and active start/resume/repair responses contain no fault object, canonical answer, rubric/hints/lesson or hidden success flag. Requested ACL observations allowed. Final feedback allowed. Public generic strings separated from private authored data.                                |
| Offline/PWA                        | Fresh production server, complete shell+pack online, disconnect, reload, investigate/edit/grade/save/reopen. No downloaded pack → honest unavailable state. Assessment offline error retains attempt. API never cached. New build/update preserves journals and prior content.                                           |
| Previous regressions               | Run all 001–008 authoring/engine/grading/session/storage and Academy suites; exact old scenario revisions/content unchanged; source/return/traces/ARP and 008 mode trials unchanged.                                                                                                                                     |
| Browser/mobile                     | Desktop, 414 and 360 CSS px full Practice plus Assessment/resume; evidence selection, target/source, keyboard/focus, trial diff, no page overflow, retry/review; manual device checks separate.                                                                                                                          |

Later commands from the existing package scripts: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:browser`, `pnpm build`. Use the repository's production/offline browser harness as well; inspect its current scripts/config before invoking. Do not reuse a dev server to claim a production service-worker test. Do not force dependency upgrades to run the suite. Record actual counts/results/limitations in implementation documentation at that time; no assumed green results here.

## 16. Manual acceptance checklist for the future lab

- [ ] Fresh desktop session: neutral incident/topology; all four devices inspectable; no preselected correct diagnosis.
- [ ] Check both local gateways, remote failure and both route tables; inspect order and outbound attachment; explain why the later permit is ineffective.
- [ ] Make a valid unsuccessful sequence edit; inspect unchanged failure without answer-revealing feedback. Reverse or correct it and observe a new version.
- [ ] After correct edit, run both host directions and the explicit R1 transit-source denied control. Select fresh ACL/config and all three probe observations; submit.
- [ ] Repeat with correct diagnosis but no edit, and with stale verification: neither is reported as recovered/verified.
- [ ] Reopen saved Practice and online Assessment midway through trials; confirm exact deadline/version/history, then finish and reopen journal.
- [ ] Use a fully cached production app+pack offline, including hard reload and saved attempt; online-only Assessment fails clearly without losing local state.
- [ ] At 414px and 360px use topology/text list, sequence fields, source selector and five evidence selections without hover/drag dependence or page overflow; keyboard focus remains visible.
- [ ] On physical iPhone 11 Safari over HTTPS: portrait/landscape, virtual keyboard, scrolling terminal, tap targets, safe areas, background/resume; install to Home Screen and repeat cached offline Practice. Record tester/date/iOS/build and whether user-reported or directly performed.
- [ ] Recheck old OSPF 001 and EtherChannel 008 through completion; no changed workflows, stale-evidence regression or storage loss.
- [ ] No application test is described as a Cisco/Packet Tracer validation. If an external configuration check is performed, record the actual platform/version/commands/output separately.

## 17. Exact implementation sequence for a later session

1. Obtain the user's implementation instruction; read this plan, the gap analysis, current AGENTS and relevant installed Next.js guides before editing code. Inspect status and preserve unrelated work. Reconfirm accepted 3F baseline; no deployment implied.
2. Recheck the narrow Cisco CLI/example behavior and source conflicts; freeze four-device addressing, initial policy and independent healthy/negative-control oracle. Do not import course images into the app.
3. Add bounded ACL schema/ID/command and backward-compatible repair/event variants, retaining all legacy journals and case revisions. Add invalid-shape and old-event tests first.
4. Implement pure ordered source matching and thread packet context through shared forwarding/replies. Update all callers deliberately; prove the no-ACL path remains unchanged before UI work.
5. Add coherent ACL/config command rendering and the new private scenario/evidence/hints/lesson. Extend registry/case contracts; prove broken/healthy oracle and no extra fault.
6. Extend trial replay and API validation with sequence edits, noop/version/limit semantics. Preserve LACP action parsing and existing durable reducer/store; add cross-invocation/conflict tests.
7. Add the new grading branch: original evidence, applied policy-preserving recovery and latest-version positive/negative verification. Gate recovered verdict independently of score; prove false diagnoses and forged/stale evidence cannot bypass it.
8. Add one mobile-safe ACL trial control plus neutral catalog/diagnosis integration in the existing workflow. Source selectors, explicit apply/diff, version labels and return-to-Inspect must work. Do not expose private configuration through initial UI choices.
9. Integrate preview/persistence/offline pack. Preserve old repair history rendering (currently LACP-specific fields), old journal schema and Academy guards. Ensure denied control is explained correctly in the repaired preview.
10. Add complete browser flows and privacy scans; execute lint/type/unit/server/browser/production build/offline checks and the manual checklist appropriate to available devices. Fix genuine regressions within scope; report unperformed device/cloud checks honestly.
11. Update AGENTS/README and appropriate correctness/authoring/verification docs for the **implemented** lab only after it works. Report files/results/remaining limits. Stop after one authorized lab; no next scenario, commit, push or deployment without authorization.

## 18. Planning verification and remaining uncertainty

This task inspected source files and teaching material and created only two Markdown documents. It did **not** run implementation tests for a nonexistent lab. Document path/link/whitespace and diff-scope checks are recorded in the completion report.

Remaining uncertainties: PKA internals were not inspected; not every lecture embedded image was visually reviewed; supplied Intro dates are old; the proposed condensed ACL sample has documentation support but no executed device transcript. None prevents this bounded plan, and none permits claiming semester completeness, physical iPhone acceptance for LAB 009 or a deployed implementation.

**Milestone 3G has been PLANNED only. No LAB 009 implementation was performed.**
