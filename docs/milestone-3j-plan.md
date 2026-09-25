# Milestone 3J — proposed Milestone 3K implementation specification

**PLANNED ONLY — NO FHRP ENGINE OR LAB 011 IMPLEMENTED**

25 September 2026; planning baseline `b072a12`. [The feasibility audit](fhrp-feasibility.md) records the exact current-semester sources, visual review, code findings and candidate comparison. This document is an author-facing, implementation-ready contract containing proposed answers. **3K requires separate authorization.** It is not a public lab resource and adds no executable coverage.

## 1. One recommendation and learning objective

Implement, only when authorized, **LAB 011 — The shared exit**, proposed ID `hsrp-01`, revision 1 and schema **10** if still unused at implementation intake. Exactly one fault: R1's HSRP group 11 priority is 90 instead of a value strictly greater than R2's 100. Both routers explicitly enable preemption. The initial gateway and host connectivity work; the Active member violates the approved design.

Learn to distinguish a logical host gateway from physical routers, compare observed Active/Standby roles against intent, explain priority with its preemption condition, apply one justified priority change and prove fresh virtual-gateway service plus routed delivery. This is distinct from LAB 002's wrong host gateway and LAB 010's STP election. Do not claim failover timing, faster traffic, load balancing or lower latency.

**Public incident:** “PC-A can still reach PC-B after maintenance, but the gateway-role check no longer matches the approved design. Inspect the shared LAN and routed paths, make a justified correction, and verify the result while preserving the shared gateway and both participating routers.”

**Public design intent:** PC-A must retain virtual gateway `172.28.10.1`. R1 is the preferred Active member and must have strictly higher HSRP priority than R2; both members use version 2, group 11 and preemption. R2's existing member configuration is the approved fallback baseline and must be retained. All physical links, access VLAN 10, interface addresses and static routes must remain unchanged. R2 must remain an eligible Standby. R3's fixed return route uses R1; symmetric forward/reply paths are not required. This bounded lab shows settled roles, not failure detection or timed takeover.

Publish the goal and cabling, not actual priorities/roles, faulty setting, canonical value or rubric. Neutral link color; no automatic Active/fault overlay. Selecting a device may highlight selection only. No introductory claim that ping fails.

## 2. Exact proposed network

```text
                  R1 ──────────┐
                 /             │
PC-A ── SW1 ────              R3 ── PC-B
                 \             │
                  R2 ──────────┘

SW1: one access LAN. R1/R2 share virtual gateway 172.28.10.1.
R1–R3 and R2–R3: separate routed point-to-point Ethernet links.
```

Six physical devices, six cables. This is the smallest proposed design with a normal client, access switch, independent gateway pair, shared upstream router and remote host. Making one gateway the other's mandatory upstream would blur their roles. A second switch and redundant Layer 2 paths are unnecessary. The VIP is a **logical annotation**, not a seventh device or extra cable/IP hop.

| Device | Interface | IPv4 / prefix     | MAC / gateway                           |
| ------ | --------- | ----------------- | --------------------------------------- |
| PC-A   | Ethernet0 | `172.28.10.10/24` | `0200.0000.00a1`; gateway `172.28.10.1` |
| R1     | Gi0/0     | `172.28.10.2/24`  | `0200.0000.1101`; HSRP member           |
| R1     | Gi0/1     | `10.0.13.1/30`    | `0200.0000.1102`                        |
| R2     | Gi0/0     | `172.28.10.3/24`  | `0200.0000.1201`; HSRP member           |
| R2     | Gi0/1     | `10.0.23.1/30`    | `0200.0000.1202`                        |
| R3     | Gi0/0     | `10.0.13.2/30`    | `0200.0000.1301`                        |
| R3     | Gi0/1     | `10.0.23.2/30`    | `0200.0000.1302`                        |
| R3     | Gi0/2     | `172.28.20.1/24`  | `0200.0000.1303`                        |
| PC-B   | Ethernet0 | `172.28.20.10/24` | `0200.0000.00b1`; gateway `172.28.20.1` |

R1/R2/R3 router IDs `1.1.1.1` / `2.2.2.2` / `3.3.3.3` remain explicit schema metadata; they do not enable OSPF or participate in HSRP selection. SW1 is unnumbered; Gi0/1 connects PC-A, Gi0/2 connects R1 Gi0/0, Gi0/3 connects R2 Gi0/0. All ports are up, full duplex, 1 Gb/s, access VLAN 10; VLAN 10 active. Remaining cables are R1 Gi0/1–R3 Gi0/0, R2 Gi0/1–R3 Gi0/1 and R3 Gi0/2–PC-B Ethernet0. Each physical numbered interface is attached once. No tagged trunks, STP, EtherChannel, ACL, NAT, DHCP, DNS or dynamic routing.

All physical IPv4 and MAC values are unique, usable and distinct from the shared identity. Link subnet metadata follows each table subnet; the three access-LAN cables use `172.28.10.0/24`. Prefer existing implicit-up cable representation; physical interface/port availability is sufficient without expanding unrelated `link.up` schema exceptions.

### Static routing, independent of HSRP

| Router | Configured destination | Physical next hop | Purpose                              |
| ------ | ---------------------- | ----------------- | ------------------------------------ |
| R1     | `172.28.20.0/24`       | `10.0.13.2`       | Remote host LAN                      |
| R1     | `10.0.23.0/30`         | `10.0.13.2`       | Complete transit-address diagnostics |
| R2     | `172.28.20.0/24`       | `10.0.23.2`       | Remote host LAN                      |
| R2     | `10.0.13.0/30`         | `10.0.23.2`       | Complete transit-address diagnostics |
| R3     | `172.28.10.0/24`       | `10.0.13.1`       | Fixed client return route via R1     |

C/L entries derive from up physical interfaces. No default, floating, recursive, ECMP or virtual next-hop static routes. Every configured static next hop is on a **direct router-router cable**, satisfying the existing validator without broadening static-route semantics. Extra transit routes prevent diagnostic source choices from creating an accidental missing route. HSRP must not generate/alter any of these entries or choose R3's return path.

### Group and independently derived expectations

Both R1/R2 Gi0/0: HSRPv2, group **11**, virtual IPv4 **172.28.10.1**, fixed preemption enabled with no modeled delay. Virtual MAC **0000.0c9f.f00b** derives from the v2 group formula. It is shared identity, not a second physical interface or switch bridge MAC.

R1 stores its priority explicitly. R2 omits the priority field/CLI line and therefore has effective priority 100; the default must be visible in operational interpretation without inventing a configured line.

| Property                              | Initial faulted design     | Canonical corrected design |
| ------------------------------------- | -------------------------- | -------------------------- |
| R1 priority                           | **90**                     | **150**                    |
| R2 priority                           | 100                        | 100                        |
| Active / Standby                      | R2 / R1                    | R1 / R2                    |
| PC-A configured gateway / ARP mapping | `.10.1` / `0000.0c9f.f00b` | Unchanged                  |
| PC-A → PC-B request path              | PC-A, SW1, R2, R3, PC-B    | PC-A, SW1, R1, R3, PC-B    |
| PC-B → PC-A routed direction          | PC-B, R3, R1, SW1, PC-A    | Unchanged                  |
| Reciprocal host ping / VIP ping       | Success                    | Success                    |
| Routing tables / cabling / VLAN       | Healthy and intact         | Unchanged                  |

The initial asymmetric path is valid: **HSRP Standby is not a global “do not route” state**. R1 can receive ordinary routed traffic from R3 and deliver it to a connected host while R2 serves client frames for the virtual gateway. This is a required integration test, not a second fault. Construct a healthy fixture first; change only R1 priority to 90 to create the case. All expected roles and paths above are independent test oracles, never authored Active booleans or static command blobs.

The fixed R3 return route deliberately limits this topology's resilience: an actual R1 outage could interrupt return delivery even if R2 still serves the VIP. The lab's approved objective is correct first-hop role selection with all infrastructure up, **not end-to-end survival of a router failure**. Do not label the result “failover verified” or conceal this limitation by synthesizing a return route. A future failure exercise would need its own upstream/return resilience design.

## 3. Minimum reusable settled-state model

### Stored configuration and validation

Propose an optional strict `hsrp` object on a router's participating IPv4 interface: explicit `version: 2`, integer `group: 0..4095`, `virtualIp`, optional integer `priority: 0..255` (effective default 100), and required `preempt: true`. No delay, tracking, authentication, learned VIP, custom MAC or v1 fallback fields. Preserve whether priority was omitted so configuration and operational displays can distinguish default from configured values.

Schema 10 qualifies exactly two member routers on one shared access VLAN through one switch, one client and one separate upstream router/remote host. The pure group-selection helper takes two validated members and their availability; it must not depend on device names, scenario ID, canonical repair or design intent. No model-wide library for arbitrary FHRP topologies is required.

Validate matching version/group/VIP, equal client subnet/prefix, usable VIP inside that subnet, no physical/VIP collision, unique member addresses, active common VLAN and correct physical attachments. Host gateways may reference this validated virtual identity **only in the new schema**; preserve all ordinary physical-owner checks and LAB 002's specific nonexistent-gateway exception. Reject mixed STP/LACP/OSPF/ACL scenarios, secondary interface addresses, extra groups/members, mismatched groups/VIPs, duplicate identities and unsupported config fields. Group separation means mismatched membership is rejected, never merged into one election; multiple-group operational behavior is excluded.

**Equal normalized priorities are outside the operational subset**, including equality caused by an omitted priority defaulting to 100. Both initial authoring and trial application must reject that state with an honest message: “Equal-priority incumbent behavior is outside this lab's model.” Do not call ties invalid HSRP. This guard avoids claiming the higher IP always displaces an incumbent. The actual course's initial-election IP tie-break is explained conceptually, not implemented as an unconditional recomputation rule.

### Derived state and timing boundary

1. Resolve the two configured members on their validated common LAN. Read each LAN interface and attached switch-port operational flag and VLAN availability. Routing success is **not** eligibility; no tracking exists.
2. For two eligible members with distinct effective priorities and preemption enabled, Active is the higher priority; the other is Standby. The supported settled result is independent of arrival order. Both can continue ordinary IP routing.
3. For one eligible member, it alone serves the virtual identity; no eligible Standby exists. For none, there is no owner. Mark unavailable members as a **simulator availability status**, not a fabricated IOS transient state. These are defensive settled-state/model-test cases, not learner-triggered failover demonstrations.
4. Recompute from current configuration and physical availability after each effective priority trial. No stored elected flag, timestamp, process memory, timer callback, random tie-break, BPDU/Hello/Coup packet or asynchronous negotiation.
5. Initial election and after-edit settling use the same rule only under this strict boundary. **Do not** implement absent/false preemption, delay, equal-priority incumbent changes or router reappearance through an unqualified sort. General initial IP tie-break, nonpreemptive incumbency, missing-preempt diagnosis and failure/recovery events are deferred. Tests reject excluded shapes instead of asserting invented transitions.

A priority change may be shown as “settled result after configuration change”; never animate an instantaneous zero-loss takeover or invent elapsed failover time. Both-preempt-on is a fixed prerequisite, not a second editable concept or fault. No hidden temporal state machine is necessary for LAB 011.

## 4. Virtual identity, forwarding and ARP contract

Extend shared resolution rather than adding a case-specific reachability function. Separate **stored configuration**, **derived owner/role**, **data-plane resolution**, and **displayed observation**.

1. Keep a physical-neighborhood helper independent of HSRP owner computation to avoid recursion (`peers` → HSRP → `peers`). Enumerate actual same-VLAN peers and their physical availability, then resolve a requested next-hop IP to either a physical peer or the eligible virtual owner reachable through the selected outgoing interface.
2. A virtual resolution result carries logical next-hop IP, virtual resolved MAC, physical owner device and physical ingress interface. Do not clone the VIP into both members' `interfaces`, erase unique-address validation, or change the destination packet IP to the VIP when its true destination is PC-B.
3. On a remote PC-A probe, normal subnet/default-route selection chooses `.10.1`; virtual resolution chooses Active; forwarding continues using that router's ordinary route lookup. No owner means resolution fails. An owner without an onward route remains Active but cannot deliver the probe. A working route cannot bypass absent virtual ownership.
4. Physical IPs remain separately usable on both members. A router in Standby forwards traffic addressed to its physical MAC/IP and routes return traffic normally. Only service for the **virtual** destination/next-hop belongs to Active. Never prune the Standby router out of the graph.
5. Extend local-destination and response-owner lookup consistently in `forward`, `connectivity`, ARP replay, trace and packet-journey/preview helpers. Echo to the VIP is delivered only when the packet reaches its currently eligible owner through normal forwarding, and replies retain the VIP as their source. Global lookup must not teleport remote packets to Active. Internal virtual reply-source handling is separate from the existing user-entered router-source validation; do not quietly accept arbitrary spoofed sources.
6. Return routing remains independently computed from the actual destination owner. Preserve original source context, longest-prefix route behavior and response reachability checks. For VIP traces use physical responding-owner identities within the existing explicitly condensed trace abstraction; no invented virtual router hop, switch hop, latency or exact IOS ICMP-source guarantee.
7. `show ip interface brief` continues to list physical interface IPs. HSRP owns the VIP separately. `show ip route` remains the simulator's C/L/S physical-routing subset, not a promise of a platform's full VIP local-route presentation.

**Virtual MAC decision:** including its deterministic v2 value is warranted by C3 6–7 and 25 and costs little compared with the required resolver change. Derive `0000.0c9f.f000 + group`, rendered as dotted hexadecimal (`11 → 0000.0c9f.f00b`); it stays constant when Active changes. A VIP-only abstraction could honestly omit all MAC/ARP output, but returning a physical member MAC while claiming virtual ARP would be misleading. No Ethernet frame queues, switch FDB, ARP broadcast packet exchange, gratuitous ARP, cache aging, MAC move timing or `use-bia` behavior is included.

PC-A `arp -a` reuses probe-derived observation semantics. Start empty; after an appropriate VIP/remote probe, show VIP → virtual MAC, never remote PC-B → that MAC. Direct physical-router probes learn their respective physical MACs. Define a new-lab ARP **configuration epoch**: only valid probe records from the current `repairIndex` contribute; after an actual change the modeled table begins empty until reprobed. Label this reset as a simulator simplification, not real HSRP behavior. Saved prior outputs remain unchanged. A no-op does not reset the epoch. Ensure Practice, server Assessment and preview use identical history/version handling; retain LAB 003's current semantics. Never replay stale events against changed ownership and label them fresh.

## 5. Commands and investigation

Exactly one new command: **`show standby brief`**, available on R1/R2 only. Educational subset fields: physical interface, group, effective priority, preemption marker, derived local Active/Standby or labelled availability status, Active/Standby physical addresses (`local` where appropriate), and VIP. Derive all values from the validated group/current physical state. Include a settled-state limitation banner; omit uptime, state-change counts, timers/countdowns, multicast packet counts, tracking, authentication and unseen features. No full `show standby`, debug output or arbitrary aliases. The full course screenshot is evidence for teaching, not a template to fill with invented values.

Extend existing member `show running-config` with `standby version 2`, `standby 11 ip ...`, explicit priority only when configured, and `standby 11 preempt`. Do not remove the correct `ip` keyword because the revision outline abbreviates it.

| Device | Proposed supported commands                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| PC-A   | `ipconfig`, `ipconfig /all`, `route print`, `arp -a`, `ping`, `tracert`                                       |
| SW1    | `show vlan brief`, `show interfaces status`, `show running-config`                                            |
| R1/R2  | `show ip interface brief`, `show ip route`, `show running-config`, `show standby brief`, `ping`, `traceroute` |
| R3     | The same router set without `show standby brief`                                                              |
| PC-B   | `ipconfig`, `ping`                                                                                            |

Retain destination input/selector for probes and validated optional physical router ping source. Every device is inspectable. API unknown/nonmember requests stay rejected; unsupported commands stay explicit.

| Observation                                | Supports                                                           | Cannot establish alone                                                               |
| ------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| PC-A configuration/default route           | Correct virtual gateway is selected for remote traffic             | Actual Active member or working return route                                         |
| SW1 VLAN/status and member interface brief | Same access LAN and physical service addresses are available       | HSRP agreement/election or end-to-end routing                                        |
| Local physical-router pings                | Ordinary delivery to each physical address                         | Virtual ownership or correct Active                                                  |
| VIP ping then PC-A ARP                     | Shared address service and virtual mapping                         | Which member currently serves it; mapping is identical before/after repair           |
| Both member `show standby brief`           | Actual roles, group/VIP/priority and complementary peer identities | Full configuration, upstream/return reachability or tested failover                  |
| Both member running configs                | Priority/default, preemption, common VIP/group/version             | Actual operational roles without observations                                        |
| All three route tables                     | Next-hop and reply path, no dependence on HSRP route magic         | Successful virtual resolution or correct design role                                 |
| Reciprocal host ping; condensed PC-A trace | Working request/reply paths; physical Active path evidence         | Full redundancy under failure, latency, or correctness of design without role checks |

## 6. Applied correction, evidence and grading

Expose one strict structured action, proposed `{ kind: "hsrp-priority", device, interface, group, priority }`. Select either member, its participating interface/group and integer priority. Use a touch-friendly selector or numeric control with presets, no mandatory IOS typing. Show the proposed equivalent CLI before applying. Permit wrong but valid priority changes for investigation. An equal-priority resulting pair is rejected as an explicit model boundary without changing history. No control for host gateway, group/VIP/preempt, routes, cabling, router power or shutdown.

Canonical correction: R1 Gi0/0 group 11 priority **150**. Accept any integer R1 priority **101–255** if R2 remains 100 and everything else remains unchanged. Lowering R2 below 90 may make R1 Active, but violates the minimal-change/design contract. Recovery must compare the final network, not merely role names or selected remediation. Reverted exploratory changes may be allowed when the final difference is only R1 priority. Preserve 10-effective-change/100-command limits, idempotent no-op behavior and immutable finalization.

Proposed structured diagnosis: cause `hsrp-priority`, exactly R1, Gi0/0, group 11, observed initial priority 90, remediation “change participating-router priority”, and explanation “with preemption enabled, strictly higher priority selects the preferred virtual-gateway forwarder; routing still needs its own paths”. Notes are saved, not interpreted. Default to unselected choices; do not prefill fault details.

| Grade component                  | Points | Required proof                                                                                                                                       |
| -------------------------------- | -----: | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cause and initial observation    |     20 | Correct priority cause 10 + observed initial R1 priority 90 for 10                                                                                   |
| Location                         |     10 | Exact device set R1 for 5 + correct Gi0/0/group 11 for 5                                                                                             |
| Original supporting evidence     |     30 | Both initial member brief views 15; both initial member configurations 10; PC-A initial ipconfig, /all or route print showing the intended gateway 5 |
| Applied correction and mechanism |     20 | Actual recovery predicate and chosen priority remediation 15; structured explanation 5                                                               |
| Fresh verification               |     20 | All fresh observations below selected and valid against the final configuration                                                                      |

Full recovery state requires R1 Active/R2 eligible Standby, common v2/group/VIP, both preempt-on, strict priority preference, unchanged PC gateway/addresses/MACs/routes/VLANs/cables, same virtual MAC, only R1 priority changed, and successful VIP plus reciprocal host delivery. Fresh proof after the latest actual edit: **both member brief views, R1 running-config, PC-A ping VIP, PC-A ARP showing the derived VIP mapping, PC-A ping PC-B, PC-B ping PC-A**. ARP must follow a current-epoch probe. Test actual physical-owner traversal in addition to displayed role strings.

Require selected server/local observation IDs, matching scenario and version, supported device/command/target/source, and authentic deterministic outputs/history. Re-evaluate history-dependent ARP using its proper epoch prefix, not an empty-history `execute` call. Stale observations from an earlier version do not count even if roles later match again. No-op leaves verification valid. Report `unresolved`, `recovered-unverified` and `verified` separately from diagnostic score, following existing conventions. “Verified” means this settled design and selected checks, not failover tested under failure.

Four progressive hints should guide: logical versus physical gateway; compare both observed roles; compare priority plus preemption/configuration; then propose strict preference and fresh complementary proof. No automatic full solution. Private post-feedback teaching must retain seven parts, analogy limits, exact worked configuration, route/asymmetric-return explanation, guided prediction and an independent changed-address/priority exercise with requested solution. Before/after preview must use actual recomputation/forwarding and be labelled non-evidence.

## 7. Primer, UI, privacy and persistence

**Tiny primer only:** explain single-gateway dependency, shared IP/MAC identity, Active versus Standby, higher priority and why this model fixes preemption on. One original logical-identity diagram; short guided evidence-choice and independent unequal-priority example with unrelated router names, subnet and group. Explain initial tie versus incumbent behavior as a boundary, without implementing it. No new Academy module, revision, progress namespace or mastery claim. Hide the primer during active Assessment and retain explicit detailed-answer reveal.

Add one six-device branching topology layout, cabling text alternative and neutral noninteractive VIP annotation. Layout must support desktop, 414px and 360px; labels/controls must not overlap nodes. Do not use a virtual router icon that implies another physical hop. Topology roles/colors must not reveal initial Active/fault automatically. Mobile brief output scrolls inside the terminal with readable headings/identities; repair/evidence controls are at least 44px, keyboard/focus accessible, no drag-only path. Preserve all ten existing layouts and navigation.

Scenario actual configuration, hidden fault/repair, evidence rules, hints and lesson live in a server-only module. Public catalog contains only neutral title/incident, goals, intended topology/VIP and command availability. Generic ranges/options and an unrelated primer may be public. Do not import this plan into the app, expose private design predicates in static assets, or cache assessment APIs. Existing deliberately inspectable Practice packs mean self-assessment cannot be a confidential exam.

Reuse v1 journal, per-ID practice pack (`netfault.practice.hsrp-01.v1`), active-attempt mechanism, selected evidence/history and versioned repairs. Add backward-compatible optional diagnosis/action types, new pack registration and raw recovery export entry without changing old scenario revisions or interpreting old records differently. Preserve corruption/quota warnings. Assessment stays online with server-owned replay/clock, same Blobs/CAS store, no new secrets/auth/database. Repeated or concurrent repair/command/finalize requests must retain existing semantics.

Offline Practice must work after successful online pack download plus complete production shell caching. Assessment, external references and any later actual-device exercise require internet/external tooling. No service-worker architecture, deployment settings, dependencies, account connection or paid service is needed.

## 8. Integration order and tests

The feasibility audit is complete; **do not repeat a broad architecture study** in 3K. Recheck baseline/diff and named integration assumptions only. If a concrete new incompatibility invalidates the specified model, report it before replacing architecture or fabricating evidence.

1. Read AGENTS, this plan and the audit. Read installed Next guides before any future application edits. Preserve baseline application/scenario/Academy files except the explicit integration changes.
2. Build model-first tests with independent router names, addresses and noncanonical groups/priorities. Implement strict schema and pure member/owner/MAC derivation. Only then integrate the shared resolver and return/ARP paths. No UI or LAB-011-only forwarding shortcut to make a test pass.
3. Add canonical/private case from a healthy fixture, one priority mutation, actual-state grader, replay action and current-epoch ARP evidence. Address branch collisions: existing `repaired` treats any `priority` repair as STP and any `group` repair as LACP; dispatch the new explicit kind before those legacy branches. `trialNetwork` currently treats remaining `kind` as ACL; add a separate HSRP branch without changing old variants.
4. Integrate registry/catalog, scoped six-device layout and non-outage copy, inspector target/source inputs, repair/diagnosis controls, primer, preview, journal/export. `src/app/api/lab/route.ts` already knows all six device names; use existing per-scenario ownership rather than expanding API surface. Thread ARP epoch through shared execution so server and Practice agree.
5. Extend authoring tests' version map and initial-connectivity expectations explicitly for the new healthy-connectivity design case. Preserve all old cases' exact expectations. Existing all-pack next-hop/timer offline tests contain PC-A address branches; add `172.28.10.10` for this new case rather than weakening their checks. Extend private-content enumeration and public allowlists narrowly.
6. Update implementation record, schema/authoring/correctness/architecture docs, this plan's status, gap/roadmap pointers, README/AGENTS and actual verification record. Keep original course screenshots out of application assets.

Likely changed modules: `src/lib/schema.ts`, new `hsrp.ts` and `hsrp-grading.ts`, `engine.ts`, `repair-trial.ts`, `grading.ts`, `preview.ts`, `catalog.ts`; new `src/server/hsrp-scenario.ts` and registry; `src/components/netfault.tsx`, `topology.tsx`, new HSRP repair/primer components and scoped CSS; tests and documentation. Session/store/worker architecture should not need redesign. New dependencies are not part of the specification.

### Model and integration tests before scenario-only tests

- Normalize default 100, valid priority endpoints 0/255, invalid fractional/out-of-range values. Selection follows larger priority and is independent of array/device/link order or labels; Standby is complementary. Changed priority changes owner in the fixed preempt-on subset.
- Reject equal effective priorities, preempt false/absent, v1/mismatched versions, wrong/group/VIP membership, extra groups/members and virtual/physical collisions. Group mismatch never silently combines unrelated members. No false claim of preemption-disabled or IP-tie transition support.
- Validate common L2 reachability. Derive one/no eligible owner for settled availability snapshots, with no fake elapsed time. Valid ownership must not depend on route availability or private intended-Active metadata.
- Independently assert virtual v2 MAC arithmetic for group 0, 11 and 4095; MAC is constant across owner changes and distinct from physical MACs. Verify no duplicate physical interfaces are fabricated.
- Host remote traffic resolves the VIP to the actual Active forwarder. Standby's physical IP remains usable and Standby can route an ordinary return packet. Change only Active's remote route in a counterfixture: it remains Active, but remote delivery fails; never fall back through Standby just because it has a route.
- Remove R3's client return route in a counterfixture: forward delivery succeeds, round-trip ping fails. Remove virtual eligibility: physical router delivery can still be tested independently, but virtual resolution must fail. Valid unrelated routes cannot resurrect absent ownership.
- Test local and remotely routed VIP echo/response ownership, retained VIP reply source and no address-owner teleportation. Explicit user sources remain validated physical local addresses. Existing longest-prefix and source-aware rules remain intact.
- ARP begins empty, records VIP → virtual MAC only after a supported current-epoch probe, preserves physical mappings, resets only after effective new-lab edits and never mutates saved outputs. Validate replay across restart/resume and matching server/Practice output. Keep LAB 003 ARP tests unchanged.
- Every diagnostic derives from the same owner/configuration state; no made-up timer/count/FSM output. Unsupported commands remain unsupported. A direct physical trace represents actual routed hops, never SW1 or a synthetic VIP hop.

### Scenario, grading and lifecycle acceptance

- Healthy/faulted fixtures differ only in R1 priority. All subnet endpoints/gateways/MACs/routes are valid, and both initial and repaired reciprocal host/VIP probes succeed. Assert initial/repaired Active/Standby and asymmetric return path independently of the solver.
- Accept representative boundary and intermediate repairs 101, 150, 255; verify all allowed equivalents against the same recovery predicate. Reject no-op/unchanged incorrect state, wrong-router changes, equal-priority trial, unrelated configuration differences and simply selecting a remediation.
- Full original evidence plus correct applied repair without fresh proof cannot earn 100 or verified recovery. Wrong cause/location/observed priority/mechanism loses the specified component. Stale/forged/cross-scenario observations and ARP from the wrong epoch cannot establish fresh verification.
- Preserve 10-change/100-command and no-op rules, deadlines, immutable final grades, independent server invocation replay, concurrent CAS conflicts and session ownership. Round-trip old ten packs/attempts, new pack, repair events, hints, feedback and reopened journal.
- Production privacy scan covers eleven registered cases and unrelated public primer content. Preserve no-store response headers and exclusion of every API response from service-worker caches.

### Browser and release acceptance when 3K is authorized

Complete Practice and online Assessment at desktop, 414px and 360px: inspect every device, run valid destination/source commands, select initial evidence, apply a wrong then correct trial, obtain/select fresh proof, submit, request lesson/solution, inspect actual repaired preview, save/reopen. Test timed no-hint/no-primer guard, resume, stale evidence, current-epoch ARP, offline full Practice after cache initialization, update behavior and all-eleven-pack journal retention. Assert 44px targets, no document overflow, readable/scrolled IDs/roles, keyboard controls and no node/zoom overlap. Visually inspect screenshots. Do not claim physical iPhone/Safari/VoiceOver testing from Chromium emulation.

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, then the **complete** production browser suite with `$env:CI='true'; $env:PW_PRODUCTION='1'; pnpm test:browser`, followed by `git diff --check`. Report exact final counts/failures/skips/build result, separating infrastructure failures from assertions. These are future 3K gates, **not commands to run in documentation-only 3J**. Add an implementation-era physical-iPhone checklist and honest real-network validation limits.

## 9. Exclusions and stopping rule

No VRRP/GLBP/IRDP, IPv6, multiple FHRP groups/client VLANs, v1 execution or version-comparison simulation, equal-priority incumbent/IP-tie transitions, editable/missing preemption, delay, timers/countdowns, packets, authentication, tracking, router power/reappearance/failure injection, measured failover/loss, NAT state, STP/LACP/OSPF/ACL combined faults, arbitrary static/VIP next hops, full IOS parser, broad Academy module, later lab or FlagForge. Up/down flags in defensive settled fixtures are not a new interactive failure framework.

General preemption and failure mechanics may later require explicit server-replayed discrete events and incumbency state. They are not prerequisites for this strictly bounded case and must not be smuggled into LAB 011. Reject unsupported configurations visibly rather than manufacturing an Active role.

Stop after the one authorized implementation and its verification **only if 3K is later requested**. At the end of 3J, stop with these documents. No application changes, commit, push, deployment, Netlify project action or credit use is authorized here.

## 10. Milestone 3J verification record

This section records documentation checks, not implementation acceptance. Source archive and selected entries were hashed; 29 native-text slides and 11 listed visual slides plus the full revision outline were inspected. Code paths and the exact current gateway/route/ARP limitations were checked read-only.

| Check                                                              | Actual 3J result                                                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Local file links / Markdown heading anchors                        | Passed: 148 references across the seven changed Markdown files; source archive link also resolves |
| Installed Prettier on the two new documents                        | Write/check passed; no global formatting of historical documents                                  |
| Scope check                                                        | Passed: seven Markdown files only; five existing pointers updated, two new documents              |
| `git diff --check`                                                 | Passed                                                                                            |
| Application lint, typecheck, unit/browser suites, production build | Not run, as required for documentation-only work                                                  |

The restricted `pnpm exec prettier` could not resolve its installed executable. The installed Prettier entry point ran successfully through an approved local Node invocation; no installation or dependency change was made. Source inspection's separate PowerPoint restriction/resolution is recorded in the audit. Historical 3I test counts are retained as historical. No physical-device test or networking-lab execution was performed. No application files changed, and 3K was not started.
