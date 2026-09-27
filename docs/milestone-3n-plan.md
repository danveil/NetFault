# Milestone 3N record and proposed Milestone 3O specification

> Implementation follow-up: separately authorized [Milestone 3O](milestone-3o.md) now implements the bounded static pair and LAB 013 described below. This document retains the historical 3N planning verdict. See the [current model](nat-model.md) and [actual verification](verification.md); PAT/dynamic NAT remain unimplemented.

**PLANNED ONLY — NO NAT ENGINE OR LAB 013 IMPLEMENTED**

27 September 2026. This is an implementation contract for separately authorized future work. The [source and feasibility audit](nat-feasibility.md) returns **PASS** for static one-to-one NAT, with a model-first forwarding gate. Twelve existing labs, Academy, application/tests, storage, dependencies and Netlify configuration remain unchanged in 3N. No automatic 3O, commit, push or deployment is authorized.

## 1. Execution plan and chosen scope

3N execution: inspect repository guidance and prior boundaries; verify current course archive and NAT visuals; inspect actual forwarding/schema/trial/grading/persistence code; compare three models and six fault families; specify one case; check source paths, documentation links, formatting and documentation-only diff. See the verification record below for actual checks.

Proposed 3O delivers exactly **LAB 013 — Beyond the gate**, ID `nat-static-01`, revision 1, schema version 12; one bounded static IPv4 inside-source mapping; one repair action; actual bidirectional forwarding; derived diagnostics; authenticated original/fresh evidence; existing Practice/Assessment/journal/offline workflows; one small unrelated primer; one original **UNEXECUTED** device companion. No new Academy lesson/module/revision or other lab.

Learning outcome: distinguish a host's unchanged private address from its external identity, separate translation from routing, diagnose an incorrect mapping using real observations, correct one configured value and prove both directions. No claim of general NAT, dynamic NAT/PAT, full course coverage or real-device configuration competence.

Public incident: “PC-A cannot exchange traffic with the partner workstation PC-B. The partner also cannot reach PC-A through its assigned external address. Both desks can reach their local gateway. Investigate and restore the agreed service without changing workstation addressing or the routed design.”

Public design brief may state that PC-A must retain its private NIC and use assigned outside identity `203.0.113.10`, while PC-B is reached at `198.51.100.10`. This is an intended service contract, not a disclosure of the configured mapping. The public catalog/initial topology must not contain the actual faulty value, correct local/global pair, hidden repair, hint or rubric. NIC values and actual roles/mappings are discovered through commands. Topic metadata may say static NAT; the title does not name NAT or its defect. Neutral links and no correctness badges or preselected fix.

## 2. Exact network and sole fault

```text
PC-A -- R1 -- R2 -- PC-B
inside    transit    outside workstation LAN
```

| Device | Interface | IPv4 / MAC                           | Purpose                                 |
| ------ | --------- | ------------------------------------ | --------------------------------------- |
| PC-A   | Ethernet0 | `192.168.40.10/24`, `0200.0013.000a` | Gateway `192.168.40.1`                  |
| R1     | Gi0/0     | `192.168.40.1/24`, `0200.0013.0101`  | NAT inside; directly attached PC-A      |
| R1     | Gi0/1     | `192.0.2.1/30`, `0200.0013.0102`     | NAT outside; directly attached R2 Gi0/0 |
| R2     | Gi0/0     | `192.0.2.2/30`, `0200.0013.0201`     | Ordinary routed transit, no NAT role    |
| R2     | Gi0/1     | `198.51.100.1/24`, `0200.0013.0202`  | Directly attached PC-B                  |
| PC-B   | Ethernet0 | `198.51.100.10/24`, `0200.0013.000b` | Gateway `198.51.100.1`                  |

All three links and all interfaces are up. Routers have metadata router IDs `1.1.1.1` and `2.2.2.2`; neither runs OSPF. No switch, filtering ACL, STP, HSRP, port security, secondary address, hidden endpoint or second fault. Documentation address ranges represent the external network; no public Internet access is attempted.

Connected/local routes derive from interfaces. Exactly these static routes are configured:

```text
R1: ip route 198.51.100.0 255.255.255.0 192.0.2.2
R2: ip route 203.0.113.10 255.255.255.255 192.0.2.1
```

R2 intentionally has **no route to `192.168.40.0/24`**. External reachability is through the assigned global /32, not through private addressing. This is healthy NAT design, not LAB 004's missing-return-route defect. R1 has no default/global route that could conceal a reverse-translation miss. Both next hops are real directly attached routers, within current static-route support.

`203.0.113.10` is a routed representation, **not** a R1 interface address or an on-link host. R2 resolves `192.0.2.1`, not the global address; R1 resolves the translated inside-local destination. This deliberately avoids proxy ARP, global address ownership on an Ethernet subnet and secondary interfaces.

Initial R1 static mapping `primary`:

```text
ip nat inside source static 192.168.40.99 203.0.113.10
```

**Only fault:** inside-local `.99` should identify PC-A's actual `.10` address. `.99` is an unused valid host address, not an accidentally disconnected device. Healthy state differs only in that mapping field. Both interface roles, all addresses, gateway values and routes are already correct.

| Probe / observation                | Initially                                            | Corrected                  | Derived reason                                                                                                                        |
| ---------------------------------- | ---------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| PC-A → `192.168.40.1`              | Success                                              | Success                    | Local gateway delivery and reply; no crossing translation                                                                             |
| PC-B → `198.51.100.1`              | Success                                              | Success                    | Local outside gateway control                                                                                                         |
| PC-A → `198.51.100.10`             | Request reaches B; reply fails at R2                 | Success                    | Initially `.10` does not match `.99`, so source stays private and R2 cannot route its reply. Correct mapping changes source to global |
| PC-B → `203.0.113.10`              | R1 translates destination to `.99`; resolution fails | Success                    | Corrected destination becomes `.10`, and PC-A's reply source is translated back to the requested global                               |
| PC-B → `192.168.40.10`             | Failure at R2                                        | Still failure              | Deliberate absence of a private route; optional explanatory control, not a required learner probe                                     |
| R1 static table before any traffic | Global `.10` ↔ local `.99`                           | Global `.10` ↔ local `.10` | Permanent configured mapping; no allocation event                                                                                     |

Unmatched private traffic is **not automatically denied by NAT**. The initial outward request can arrive; the absent external private route prevents its reply. The outside-initiated failure is different: translation happens, but to an unresolvable inside destination. Feedback must preserve that distinction. Ordinary ping output alone must not reveal these hidden failure details before investigation.

## 3. Packet and routing contract

Use a bounded, ephemeral packet context, not a flow database. Suggested fields: original source/destination, current source/destination, current device and ingress interface, hop count/visited states, translation steps and actual delivered endpoint. The delivery result must contain the address pair seen by that endpoint. A NAT-capability branch may reuse existing route/L2 helpers; preserve the old path for absent NAT and schema 1–11 until equivalence is proven.

Let `L = 192.168.40.10`, `G = 203.0.113.10`, `E = 198.51.100.10` in the corrected network. Outside local equals outside global, both `E`; no outside-source translation exists.

| Exchange              | Inside representation   | Outside representation | Required transformations                                                                                  |
| --------------------- | ----------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------- |
| A initiates echo to B | Request `L → E`         | Request `G → E`        | R1 receives on inside, routes toward E, matches local source, substitutes G on outside egress             |
| B replies to A        | Reply becomes `E → L`   | Reply starts `E → G`   | R2 independently routes G /32 to R1; outside ingress substitutes destination L before inside route lookup |
| B initiates echo to G | Request becomes `E → L` | Request starts `E → G` | Same destination transformation, even without earlier inside traffic                                      |
| A replies to B        | Reply starts `L → E`    | Reply becomes `G → E`  | Same source transformation; B receives reply from G, the identity it requested                            |

Per-router processing:

1. Reach the router through a successful actual physical/L2 next-hop exchange. Carry the receiving interface from that peer; do not infer ingress from source subnet. No ingress translation occurs on a packet that never arrived.
2. For outside ingress, if current destination matches a configured inside global, replace destination with its local value before local-delivery/route lookup. Mapping validation excludes local-router-address aliases. An unmatched destination proceeds with ordinary routing unchanged; no invented firewall denial.
3. Resolve local physical delivery or perform longest-prefix lookup on the current destination. Translation creates no C/L/S route. A translated inside destination still needs an inside route and an available next hop.
4. For inside ingress with route-selected outside egress, match current source against the one configured local value and substitute the global value. Otherwise leave source unchanged. Return traffic uses the same rule. No translation for same-side/local-gateway traffic.
5. For inward translation, require the resolved egress to be the declared inside interface in this bounded topology. Reject unsupported authored topologies rather than claiming general multi-interface NAT. Fault-injection tests with wrong/missing role must not silently translate as if correct; they are defensive fixtures, not another learner repair.
6. Resolve/deliver the next Ethernet segment using its interface MACs, not the translated IP as a MAC or physical endpoint. Preserve request/response/data delivery checks. Increment bounded hop state; loop detection must include device, ingress and current address tuple so transformed context is not mistaken for unchanged revisits. Retain a finite 16-hop guard.

Generate an echo reply **only after request delivery**, from the delivered destination address toward the delivered source address at the delivered device. Feed it through the same forwarding rules. Full echo success requires arrival at the original initiating endpoint with reply destination equal to the original source and reply source equal to the original requested target. Do not merely check two booleans, search the original global in physical NICs, or originate the reply at R1.

This is an address-level echo model. No TCP/UDP ports, ICMP identifiers, checksums, payload rewriting, retries/timers, error-message NAT or packet capture are claimed. All five displayed probe outcomes derive from that deterministic exchange. Exclude traceroute/tracert for this case because existing hop replies and quoted-header behavior do not establish honest NAT traces. A post-feedback simulator address journey may show recorded transformation steps, explicitly labeled a model explanation rather than captured packets.

### State, validation and routing independence

Proposed strict configuration: router-only `nat` with literal mode `static-one-to-one`, one inside-interface name, one distinct outside-interface name and exactly one mapping `{ id, insideLocal, insideGlobal }`. Role configuration may be stored here and projected into interface running-config lines; avoid two competing role sources. One mapping ID (`primary` in the authored case) is a selector, not an answer.

Validate new capability only in schema 12: IPv4 unicast host addresses, distinct local/global, global not any physical/VIP address or connected subnet, local a usable address in the directly attached inside subnet and not R1's own address; **do not require local to equal a present PC**, since that would reject the fault. Unique physical addressing/MACs and valid explicit roles; one NAT router, two routed interfaces, two routers/two single-NIC PCs in the declared chain. Reject unsupported fields, ports, pools, overload, overlaps and mixed protocols. Up/down state remains meaningful for defensive tests. Generalize values, not topology scope; no lab-ID-dependent forwarding branch.

The permanent entry is projected from current configuration even before probes. Changing a mapping changes this table immediately. No dynamic entry creation/removal, timers, counters or persistent sessions. No real-time expiration. Missing-map/role negative fixtures can exercise pure translation helpers separately from strict authored-case validation; do not loosen published schema merely to install an unsupported second lab.

Model tests must separately remove R1's external route, R2's global /32, the host gateway, an interface or link. Correct mapping cannot repair any of them. Preserve no-match ordinary forwarding; demonstrate with a test-only additional private return route that untranslated traffic can succeed while violating the intended mapping policy. This is not an offered bypass control in LAB 013.

## 4. Commands and minimal investigation

Only one new executable command: **`show ip nat translations` on R1**. Declare the exact educational subset. Display one permanent configured pair, labeled Inside global / Inside local and static type. Omit protocol/port columns, outside endpoint columns, timeout, age, dynamic counts and hit statistics. A permanent address-only entry has no particular remote peer; do not fill those fields from the last ping. Initial local `.99` changes to the learner's trial value; global remains G. Empty-table behavior is testable at helper level, but initial LAB 013 is not empty.

| Device     | Proposed supported commands                                                                   | Inputs and output contract                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| PC-A, PC-B | `ipconfig`, `ipconfig /all`, `route print`, `ping`                                            | Existing NIC/gateway/static metadata, local/default routes and numeric destination. Ping source is the real NIC. No invented outside NIC alias |
| R1         | `show ip interface brief`, `show ip route`, `show running-config`, `show ip nat translations` | Brief shows physical IPs only; routes C/L/S; config adds role lines and static pair from current state; table as above                         |
| R2         | `show ip interface brief`, `show ip route`, `show running-config`                             | Ordinary physical/routing state, no NAT stanza or NAT command                                                                                  |

No `show ip nat statistics`, debug, clear translation, router-originated ping, extended-source NAT probe, trace or simulated web/SSH service in this first case. Old labs retain all their commands/source-aware probes. Unsupported requests must be rejected honestly on client and server. Router-originated NAT is a distinct boundary; do not accidentally enable it through the shared command executor.

Destination quick choices use public incident targets and values from recorded diagnostics, with an optional dotted-IP field. Include G as a target without inventing a physical “global host” topology node. All four devices remain inspectable.

| Observation                        | What it establishes                                                  | What it cannot establish                                             |
| ---------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| PC-A config or /all                | Actual private NIC and gateway to compare with mapping               | Successful forwarding or correct remote representation               |
| PC-B config or /all                | External destination and its gateway                                 | NAT health or a return route                                         |
| R1 running-config                  | Actual inside/outside interfaces, pair and configured external route | Installed route/L2 reachability or successful translation of a probe |
| R1 route table                     | Installed external route and inside connected prefix                 | Mapping correctness or outside return route                          |
| R2 route table                     | Installed G /32 next hop and absence of private route                | NAT operation on R1                                                  |
| Failed A→E or B→G ping             | Reproduces reported service failure                                  | NAT-specific cause by itself                                         |
| Optional initial translation table | Permanent configured pair, independent of prior traffic              | Successful packet exchange or a dynamic session                      |
| Optional local gateway pings       | Local delivery controls                                              | Remote recovery                                                      |

Minimum full baseline evidence: both PC configurations, R1 running-config, both router route tables, and at least one of the failed cross-boundary pings. Translation table, brief, route print, the opposite failed ping and gateway controls are useful alternatives/supplements, not command roulette. R1 configuration already contains the mapping; do not require redundant initial table output as an extra scoring trap.

## 5. Structured trial and grading

Proposed strict action: `{ kind: "nat-static-local", device, mappingId, insideLocal }`. It replaces only the local value of an existing mapping on the NAT router. Parse canonical dotted IPv4 with outer whitespace normalization; compare semantic addresses, not IOS strings. Reject unknown keys, wrong device/mapping, router/broadcast/network/global address, unsupported role/global/route edits and malformed input. A different valid unused inside address is a legal **wrong trial**, not a validation error revealing the answer.

UI: choose observed router/mapping, then choose or enter a replacement local address. Populate tap candidates from recorded outputs, never a private correct-value array. Show the selected pair for review and offer optional numeric editing so the only visible choice is not necessarily the answer. No correct preselection. Keep mapping/global visible from observations, not undiscovered source data.

Clone/replay changes; preserve unrelated device/link/routing/role/global state. Dispatch before the generic ACL kind fallback. Effective no-op means no version and no loss of fresh evidence. Actual change appends a timestamped event and increments repairIndex; ten-change, 100-command, deadline and immutable-finalization rules remain. Older observations stay readable with version labels. Fresh grading uses the latest version even if an earlier version happened to have the same effective mapping.

Structured diagnosis fields: cause (incorrect static inside-local mapping), affected device R1, observed local value, observed global, proposed local value, remediation (replace local member of existing static pair), and mechanism (outward source representation plus inward destination restoration, with independent routes). Offer meaningful route/gateway/role/no-translation alternatives. Notes are stored but never keyword-graded. Avoid adding arbitrary explanation parsing.

Proposed private 100-point rubric:

| Component                              | Points | Rule                                                                                                                                                                                                 |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cause and observed pair                | 20     | Correct cause 10, observed local/global pair 10; compare actual initial state                                                                                                                        |
| Location                               | 10     | Exactly R1 and its observed mapping, not either PC or R2                                                                                                                                             |
| Original evidence                      | 30     | A configuration + R1 config establishes mismatch (15); B config + both router route tables establishes independent path/identity context (10); one authentic original failed cross-boundary ping (5) |
| Applied minimal recovery and mechanism | 20     | Actual recovered state 10; targeted structured remediation/replacement 5; bidirectional mechanism 5. Selecting a fix without applying it cannot earn recovery points                                 |
| Fresh verification                     | 20     | Latest-version A config, R1 config and translations (10); successful A→E and B→G plus both local-gateway controls (10). These groups require actual recovered state                                  |

Authenticate every selected observation by scenario, command allowlist, unique ID, original/repair version, target/source and recomputed output; use prior authentic history where necessary. Do not trust client success flags, arbitrary translation rows or claimed repairIndex. Server-owned repairs/history remain authoritative. Timeout behavior stays unchanged.

Recovered-state predicate must compare original/current with **only the chosen local slot masked**; require original links, roles, physical IPs/MACs/gateways, routes, global identity and all unrelated fields unchanged. Then require local equals actual intended PC NIC, one-to-one cardinality, both real exchanges succeed, and their recorded transformations/response identity equal the intended L↔G behavior. Do not grade solely by command text or one successful ping.

Fresh table/config proves configured intent; paired pings and model-derived tuple checks substantiate delivery and external identity. The PC retains L. Distinguish unresolved, recovered-but-unverified and verified-current-service; missing original diagnosis evidence still prevents full credit.

Wrong legal `.98`/other unused-local trials stay unresolved. Forged role/global/route/host mutations are invalid API requests and fail invariants; changing PC-A to G, adding a private route, removing NAT or broadening its map are **not offered learner actions**. Test those as tampered-state/engine invariants, not as artificial required “attacker probes”. An unrelated source not matching the static local stays untranslated by the pure predicate; no extra host or negative-probe UI is necessary.

Provide four progressive Practice hints: compare local versus remote results; trace independent request/reply destinations; compare actual NIC and configured pair; inspect source and reverse-destination consequences. Record use; no active Assessment hint/reveal. Worked repair and detailed solution remain explicitly requested after feedback/reveal under existing mode rules.

## 6. Preview and education

Post-feedback preview must derive before/after states from the same engine and identify A→E and B→G as service checks. Existing all-physical-host preview generation is insufficient: B→L is intentionally unrouted even after repair. Use a generic scenario-declared verification-target plan available only with the private pack/final feedback; retain existing default preview behavior for old labs. Do not leak target repair metadata into the initial catalog. Show retained local controls and a clearly labeled modeled address journey, not a capture or traceroute.

Choose **B: tiny NAT primer**, not an Academy expansion. Use unrelated names, `10.77.0.20` and documentation global `203.0.113.70`; no LAB 013 topology/pair, answer or rubric. Short cards teach inside local/global, unchanged outside local/global, interface roles, static bidirectionality and route independence. Use an original two-side diagram with text equivalent and two tap decisions: identify which header field changes outward/inward; decide whether a correct pair repairs a missing route. Wrong feedback gives reasoning; full reasoning/solution is explicitly requested. No new Academy progress namespace/revision; hide primer during active Assessment as existing preparation cards do.

Private post-lab lesson retains seven parts: simple two-address explanation; mailroom external-label analogy; limits (NAT is not encryption/authentication/a route, static and PAT differ); detailed four-address/request-reply mechanism; worked actual role/static/route commands; connection to the two distinct initial failures; guided evidence comparison and independent different-address exercise with requested solution. Keep guided and independent activities distinguishable. “Return translation” does not mean only replies can enter a static mapping.

Worked real CLI correction would remove the old static statement and add the corrected statement. Explain that two real commands can temporarily interrupt service; the simulator trial is atomic. Do not claim startup config persistence or device execution from that example.

## 7. Proposed external companion — UNEXECUTED

Recommend a separate original exercise in future `docs/nat-device-companion.md`, no `.pkt` fabrication or execution claim. It practices actual IOS/Packet Tracer configuration; NetFault reasoning scores cannot certify it. Keep values unrelated to the case/primer. Example four-device chain:

- Inside PC `10.66.0.20/24`, gateway `10.66.0.1`.
- Edge Gi0/0 `10.66.0.1/24`; Edge Gi0/1 `192.0.2.5/30`; upstream Gi0/0 `192.0.2.6/30`.
- Upstream Gi0/1 `198.51.100.129/25`; external PC `198.51.100.140/25`, gateway `.129`.
- Assigned global `203.0.113.70`; Edge route `198.51.100.128/25` via `.6`; upstream global /32 via `.5`; no private route upstream.

Future instructions must include complete host/interface/route setup and `no shutdown`, then:

```text
Edge(config)# interface GigabitEthernet0/0
Edge(config-if)# ip nat inside
Edge(config-if)# interface GigabitEthernet0/1
Edge(config-if)# ip nat outside
Edge(config-if)# exit
Edge(config)# ip nat inside source static 10.66.0.20 203.0.113.70
Edge(config)# end
Edge# show ip nat translations
Edge# show running-config
Edge# show ip route
```

Verify both PCs' local gateways, inside→external and external→global independently, including an external-initiated test before inside traffic. Record actual translation output before/after traffic; real devices may have additional ICMP/session rows beyond NetFault's static-only display. Remove with `no ip nat inside source static 10.66.0.20 203.0.113.70`, observe without guessing failure location, restore and repeat. If a platform refuses removal because translations are in use, record the actual behavior and consult its supported procedure; do not prescribe invented clear commands or declare the exercise passed.

Require environment/version/device models, interface-name adaptations, actual configurations, screenshots/outputs, successes/failures, route/control comparison and rollback evidence. Blank evidence fields, status UNEXECUTED until filled from a real run. Do not copy source-slide graphics. Device-specific support remains an implementation/learner validation task, not a reason to counterfeit results.

## 8. Integration, mobile, privacy and persistence

Likely code changes in separately authorized 3O:

- `src/lib/schema.ts`: schema 12, new scenario ID, strict NAT config/repair/diagnosis and command enum; preserve old versions.
- New `src/lib/nat.ts`: pure role/mapping validation, transformations and static diagnostic formatting; integrate packet context in `src/lib/engine.ts` without old-case semantic changes.
- `src/lib/repair-trial.ts`, `grading.ts`, new `nat-grading.ts`, `preview.ts`: trial dispatch, authenticity/freshness, minimal invariants, correct service targets and address journey.
- New `src/server/nat-scenario.ts`, existing `src/server/scenarios.ts`, `src/lib/catalog.ts`: private case and neutral public registry/allowlist.
- `src/components/netfault.tsx` and a small focused repair/primer component: mode-aware controls, recorded candidates, diagnostics/evidence, preview/journal. `topology.tsx` only if layout requires a small four-node adjustment.
- Existing API action schemas, session reducer and local storage integration: accept new validated variant and preserve replay/versioning. Add pack `netfault.practice.nat-static-01.v1` to raw export enumeration. Do not redesign session-store, Blobs/CAS or journal v1.
- Tests and documentation for the new capability. No dependency, adapter, worker-architecture or infrastructure change.

Desktop may use adjacent inside/outside cards. At 414px and 360px, stack: **Inside local — PC's NIC**, **Inside global — external representation**, **Outside destination**, with interface-role labels on the relevant router panel. Keep these actual values investigation-derived. Never rely on color, infer fault from link decoration or require dragging. Display translation output in a compact two-address card with an accessible text/terminal equivalent; any terminal overflow stays inside its pane, never the page. Use 44px tap targets, keyboard/focus labels, full readable IPs, explicit source-device/target/version labels and a collapsible unchanged-global field in the repair panel. A switchable request/reply diagram must have a linear text equivalent.

Public assets/primer/catalog may contain generic NAT concepts and intended external service identity, never the authored faulty/correct pair or hidden rubric. Private scenario, recovery target, hints and worked solution remain server-only. Assessment commands legitimately reveal requested device configuration; that is observable evidence, not an answer-key payload. Initial/active API responses must not include the entire private scenario or repair key. Keep all three no-store layers and service-worker API exclusion.

Explicit Practice packs remain deliberately inspectable, including offline answers. They must not be silently prefetched with the catalog/primer or represented as confidential Assessment resources. Repository authoring docs also contain spoilers and are not app assets. A user can consult the same case in Practice or public source; do not claim tamper-proof exam security. No practical storage design can make an already downloaded answer secret.

Assessment remains online, server-owned, 20 minutes, with durable repair/command history, limits and immutable final results. Test independent invocations and conflicting commands/repairs/submission using existing strong-read/conditional-write retry semantics. No persistent NAT allocation state, extra secrets, paid infrastructure or authentication is required.

Offline Practice requires a successful production HTTPS shell load, service-worker control and explicit download of this case while online. Then commands, trials, local grading, requested lessons/preview and journal reopening must work offline. Assessment cannot start/continue grading offline. Preserve old pack keys/corrupt-record recovery/export behavior. Export before downgrading to a version that cannot parse schema 12/new repair events; never clear older progress to conceal incompatibility.

## 9. Model-first test and acceptance gates for 3O

These tests are **planned, not executed in 3N**. Do not first add a case whose outputs hardcode the expected answer.

1. **Pure schema/translation model:** valid addresses and roles; permanent table before any probe; local→global source and global→local destination; outside local/global unchanged; external initiation before internal traffic; nonmatching source unchanged; deterministic repeatability; unknown fields/malformed/colliding mappings/unsupported topology rejected; unused valid local accepted. Wrong/missing role never behaves as correct. No real-time state or port fiction.
2. **Packet/reply integration:** assert exact four legs from section 3, receiving interface and endpoint; successful ping requires restored identity; wrong-local outbound delivery with return failure differs from inbound resolution failure; no reply when request was not delivered. R1 must not impersonate PC-A or answer for G. No translated address is a physical next-hop alias.
3. **Independent prerequisites:** correct route + wrong mapping fails as designed; correct mapping + removed external route/global return route/gateway fails; down interface/link prevents arrival/translation; per-segment L2 checks remain authoritative; unrelated source unchanged even when an independent route permits delivery. Test wrong-role/nonmatching direction, finite loops and unsupported router-originated/trace commands honestly.
4. **Diagnostics:** table/config derive solely from current trial; zero traffic still shows static pair; no stale table after change; interface view omits alias; route output does not gain magic routes; source/target-specific ping agrees with actual exchange; no counters/ports/timers or fabricated exact ICMP error.
5. **Repair/grading:** exact schema rejection, canonical no-op, legal wrong address, ten-change limit, immutable originals, latest repairIndex; original evidence authenticity; correct diagnosis plus unapplied repair insufficient; one ping/table insufficient; partial marks; missing/stale/forged/foreign evidence rejected; retained private NIC/global/routes/roles and real translation identity required. Tampered bypass configurations fail invariant checks.
6. **Scenario:** independent expected address/route matrix, exactly one changed local mapping field, local controls work before/after, both requested services fail before/succeed after, private-target outside failure remains intentional. Allow all four devices to be investigated. Hints/reveal/journal contain correct versions and disclose assistance without mastery claims.
7. **Server/persistence:** separate store instances/invocations see the same repair and command versions; concurrent repair/command replays under CAS; race with finalize/deadline fails closed; no-op preserves evidence; APIs no-store; reload/reopen/export/reimport-compatible paths retain diagnosis/evidence/trials and all old entries. Preserve 3M Windows atomic-write fault-injection tests.
8. **Privacy:** inspect production public bundles/root/catalog/primer/initial assessment; no authored pair/key/hints/rubric. Practice pack only explicit; no API caching; active assessment locks help/reveal/journal as before; feedback only at allowed stage. Candidate generation must not inspect hidden case metadata.
9. **Browser:** full Practice and timed Assessment workflows; investigate→select evidence→wrong trial→correct trial→fresh checks→submit→requested explanation/preview→save/reopen. Desktop, 414×896 and 360px; every address label/card/target/repair/evidence control visible and usable, no page-wide overflow, no drag-only action, keyboard/focus checks. Full offline Practice after online preparation, refresh/update and new/old pack coexistence. Distinguish Chromium viewport from physical iPhone/Safari/VoiceOver testing.
10. **Regressions:** all LAB 001–012 and Academy; emphasize LAB 004 delivered-request/missing-return distinction, LAB 007 loop/source/trace, LAB 009 original-source ACL and retained policy, LAB 011 virtual ownership/ARP, LAB 012 Ethernet admission/current epochs. Keep old scenario files/revisions unchanged. Run lint, typecheck, unit/integration, production build, production browser/privacy/offline suites in 3O and report actual failures/retries without hiding them.

After model gate passes, implement one case and integrations, then run the complete verification gates. If bounded NAT cannot coexist with the current pipeline without a broad rewrite, stop and document FOUNDATION REQUIRED rather than weakening old tests or adding fake outputs. Physical iPhone and real device checks remain explicitly manual unless performed.

Future documentation: create NAT model/lab/implementation record and UNEXECUTED companion; update architecture/scenario-authoring/network-correctness/verification/README/AGENTS and course gap pointers only to the actually delivered subset. Retain this dated planning record. Do not mark NAT/PAT or the integrated course practical complete.

## 10. 3N verification record and stop boundary

Intake was clean at `3e4a12d`; registered cases were inspected through LAB 012. The archive and three cited entries were verified as described in [source provenance](nat-feasibility.md#1-source-provenance-and-inspection). Native course text and the listed visual pages were reviewed. Code seams were read, not modified. Cisco documentation was consulted, not executed.

Completed documentation checks:

- Source archive/entry hashes matched; cited source files exist. Relevant actual engine/schema/registry/trial/grading/session/storage/preview paths and existing test patterns were inspected.
- Local Markdown target/heading checker: **7 changed files, 204 local references, including 21 existing line references; zero errors**. Both new external Cisco links were reviewed; historical outbound links were not bulk retested.
- Prettier check passed for both new documents. Existing documents received focused prose/pointer additions without whole-file historical reformatting.
- `git diff --check` passed. Changed-file scope is exactly the two new documents plus README, AGENTS, semester gap analysis, engine feasibility and roadmap; all seven are Markdown. No application/test/runtime file changed.

No application lint/typecheck/unit/browser/build commands are required or run for this documentation-only milestone. Historical 3M results are not fresh verification. No NAT engine, new command, LAB 013, primer, companion application artifact, Academy change, dependency, storage change, commit, push, deployment or Netlify action was performed. Stop here; 3O requires separate authorization.
