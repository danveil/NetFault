# Milestone 3P record and proposed Milestone 3Q specification

**Historical planning record.** Milestone 3Q was subsequently authorized and implemented this bounded design. See [3Q implementation](milestone-3q.md), [actual model](gre-model.md) and [executed verification](verification.md). The planning-only statements and historical test/source claims below describe 3P, not the current application.

**PLANNED ONLY — NO GRE ENGINE OR LAB 014 IMPLEMENTED**

28 September 2026. The [source/architecture audit](gre-feasibility.md) returns **PASS** for one bounded GRE-over-IPv4 model and LAB 014, **The path above**. This document is an implementation-ready proposal requiring separate authorization. 3P stops at documentation: thirteen labs, Academy, app/tests, storage, dependencies and Netlify configuration remain unchanged.

## 1. Execution plan and future scope

3P work: inspect repository guidance/current code and historical boundaries; verify supplied 26/27 sources and selected visuals; distinguish course evidence from vendor semantics; compare faults and remaining topics; specify one case; check sources, links, formatting and documentation-only diff. Actual validation is recorded in section 12. Historical 3O test counts are not rerun or relabeled.

Proposed 3Q: add schema version **13**, case ID **`gre-01`**, revision **1**; one logical GRE-over-IPv4 pair with two endpoint routers and one transport router; static overlay routes; derived diagnostics; one destination-only trial; deterministic original/fresh evidence grading; preserved Practice/Assessment/journal/offline flows; tiny unrelated primer; original UNEXECUTED companion document. No new Academy module/revision or other scenario.

Learning outcome: distinguish routable/reachable outer addresses, local tunnel state, intended endpoint identity and inner route/delivery. Apply the minimal correction and independently prove the return path. No mastery, full WAN/VPN coverage or real-device configuration claim.

Public incident: “PC-A and PC-B cannot exchange traffic between the two sites. Each workstation can reach its local gateway. Investigate the routed design and restore communication while preserving the addressing and transport network.”

Public design: R1 and R2 must carry intersite LAN traffic through their point-to-point Tunnel0 interfaces across T1. T1 transports outer traffic and is not a tunnel endpoint. Retain workstation, LAN, transport and tunnel-interface addressing and routing. The logical line shows **intended design, not verified delivery**. Catalog metadata may identify GRE as the topic; it must not include the actual faulty destination, correct endpoint address mapping, repair key, hints or rubric. Learners discover addresses/configuration through commands. No red fault link or answer-preselected selector.

## 2. Topology, addresses and sole fault

```text
PC-A ---- R1 ---- T1 ---- R2 ---- PC-B      physical links
           \==== intended Tunnel0 ==== /   logical design, not a cable
```

Exactly five devices, four physical links. All physical interfaces and links start up. Private RFC 1918 ranges describe the isolated LAN/overlay; TEST-NET ranges describe fictional transport. These are not live internet destinations.

| Device | Interface | IPv4            | Role / host gateway                                           |
| ------ | --------- | --------------- | ------------------------------------------------------------- |
| PC-A   | Ethernet0 | 172.31.10.10/24 | Gateway 172.31.10.1                                           |
| R1     | Gi0/0     | 172.31.10.1/24  | Site A LAN                                                    |
| R1     | Gi0/1     | 192.0.2.1/30    | Transport; Tunnel0 source                                     |
| T1     | Gi0/0     | 192.0.2.2/30    | Toward R1                                                     |
| T1     | Gi0/1     | 198.51.100.1/30 | Toward R2; initially misidentified as R1's tunnel destination |
| R2     | Gi0/0     | 198.51.100.2/30 | Transport; Tunnel0 source                                     |
| R2     | Gi0/1     | 172.31.20.1/24  | Site B LAN                                                    |
| PC-B   | Ethernet0 | 172.31.20.10/24 | Gateway 172.31.20.1                                           |
| R1     | Tunnel0   | 10.14.0.1/30    | Logical interface; no Ethernet MAC                            |
| R2     | Tunnel0   | 10.14.0.2/30    | Logical interface; no Ethernet MAC                            |

Assign unique locally administered unicast physical MACs in table order, `02:00:00:14:00:01` through `02:00:00:14:00:08`. Router IDs R1 `1.1.1.1`, T1 `2.2.2.2`, R2 `3.3.3.3` are metadata only; no OSPF process exists. Each link joins consecutive physical rows and uses its matching /24 or /30 subnet. No host, source, gateway or route fault accompanies the selected defect.

| Router | Physical underlay static route         | Static overlay route                                         | Tunnel configuration                                                                                         |
| ------ | -------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| R1     | 198.51.100.0/30 via 192.0.2.2          | 172.31.20.0/24 via exit interface Tunnel0, no next-hop field | source Gi0/1 = 192.0.2.1; **destination 198.51.100.1 initially**, correct 198.51.100.2; mode gre ip; enabled |
| T1     | None: both transport subnets connected | None; no routes to LANs or 10.14.0.0/30                      | None                                                                                                         |
| R2     | 192.0.2.0/30 via 198.51.100.1          | 172.31.10.0/24 via exit interface Tunnel0, no next-hop field | source Gi0/0 = 198.51.100.2; destination 192.0.2.1; mode gre ip; enabled                                     |

Construct the healthy configuration first, then mutate **only R1.gre.destination** to .100.1. Repair restores only that slot. T1's lack of LAN/tunnel routes is intentional transport separation, not a second fault: T1 routes the **outer** packet. No default routes, NAT, ACL, switching protocol, DNS or asymmetric missing return route.

Under local-up conditions R1 has C/L for its two physical interfaces and Tunnel0, S for remote transport /30 and remote LAN /24. R2 has the symmetric six C/L plus two S entries. T1 has four C/L entries only. R1's wrong destination is routable through its intact transport S route, so **initial and repaired route tables are the same**. Do not manufacture route withdrawal/reappearance as the repair symptom.

### Predicted probe contract, not executed output

| Probe                            | Initial | Repaired | Reason                                                                                                 |
| -------------------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------ |
| Each PC to its gateway           | Success | Success  | Ordinary local physical delivery                                                                       |
| R1 to 198.51.100.2, source Gi0/1 | Success | Success  | Intended outer endpoint and independent physical return route                                          |
| R2 to 192.0.2.1, source Gi0/0    | Success | Success  | Reciprocal underlay control                                                                            |
| R1 to 198.51.100.1, source Gi0/1 | Success | Success  | Wrong endpoint is a real T1 address; reachability is not endpoint identity                             |
| R1 to 10.14.0.2, source Tunnel0  | Failure | Success  | Inner packet uses Tunnel0; request and reply both need receiver matching and transport                 |
| R2 to 10.14.0.1, source Tunnel0  | Failure | Success  | Independent opposite initiation through the pair                                                       |
| PC-A to 172.31.20.10             | Failure | Success  | R1 initially sends outer packet to T1, which has no GRE receiver                                       |
| PC-B to 172.31.10.10             | Failure | Success  | In the bounded receiver model, R1 does not match outer source 198.51.100.2 while configured for .100.1 |

Both tunnel interfaces show local up/up before and after the one change. Configured destination and actual delivery change; physical state, routes, other addressing and R2 configuration do not. A packet's exact failure reason belongs in internal test results/post-submission explanation, not a fictional ICMP report returned to a source that received no reply.

Not every source/address pair should become reachable after repair. T1 has no route to inner LAN/tunnel addresses, and transport-to-LAN source probes may lack a return route. Use an explicit source/target matrix, not the older all-device/all-address success contract. Default router source remains the selected outgoing interface; required controls specify their source to avoid ambiguity.

## 3. Smallest supported data model

Keep physical `interfaces`, old `staticRoutes` and versions 1–12 unchanged. Propose optional **strict** router `gre` with exactly these fields: `name: "Tunnel0"`, `mode: "gre-ip"`, `sourceInterface: string`, `destination: IPv4`, `ip: IPv4`, `prefix: 30`, `adminUp: boolean`. There is one object per endpoint and exactly two endpoints; no tunnel object on T1/PCs. No stored derived status, MAC, counters, keepalive, keys, bandwidth or hidden peer ID.

Add optional strict `tunnelRoutes` entries `{ network, prefix, interface: "Tunnel0" }`; these are exit-interface static routes, separate from existing next-hop routes. One remote /24 LAN route per endpoint in the authored case; allow absence in model-negative fixtures so return-route failure is computed. No arbitrary recursive nextHop form, ECMP, distance or dynamic protocol. Merge eligible rows into the existing `Route` shape as S/interface Tunnel0/undefined via/cost 0; extend formatting accordingly. Do not label them OSPF or direct physical adjacency.

Proposed pure module `src/lib/gre.ts` validates configuration and derives local state/receiver identity. A small discriminated L3 interface view in the engine exposes physical versus tunnel identity for route lookup, local delivery and probe-source validation. Physical discovery remains physical. Avoid a wholesale interface-schema migration; a tunnel address is owned by its router but is not a physical/HSRP neighbor or NAT global.

Validator requirements:

- Schema-13 only, exactly two PCs/three routers in the stated physical chain shape, arbitrary device names/valid addresses in independent tests. Two distinct source routers, one intermediate router. Exactly one /30 tunnel subnet with two distinct usable addresses, disjoint from all physical subnets and addresses. Physical links and unique MACs retain existing validation.
- Source reference must name an existing numbered physical interface on that router, facing the transport. A disabled interface is valid configuration with failed operation, not an absent-reference error. Tunnel mode/name fixed; all unknown GRE/route/action fields rejected.
- Destination must be canonical unicast IPv4 (repair input trimmed), not local/self, network, broadcast, multicast, unspecified, loopback, LAN or overlay space. Bound destination choices to usable addresses in the two declared physical transport subnets. It **may** be the wrong router or an unused host address in such a subnet; validity must not certify correctness or require reciprocal endpoint matching. In this /30 case the reachable wrong T1 address is valid.
- Underlay static routes use existing directly linked router-next-hop validation. Underlay routing must be independent of GRE. Overlay route prefixes are disjoint from both transport subnets and tunnel subnet; no default/tunnel route covering any outer destination, nested tunnel or self-resolution. Reject unsupported recursive configuration explicitly, rather than silently using a less-specific physical route to conceal it.
- GRE scenarios reject OSPF, NAT, ACL attachments, HSRP, STP, LACP, port security, switches, keys and other unmodeled combinations. No old-schema loosening to accept them. The bounded validator need not require connectivity, active links, reciprocal destinations or complete return routes; those are modeled outcomes and authored recovery assertions.

## 4. Local state and forwarding algorithm

### Separate local state from delivery

`greLocalState` depends only on local configuration, source operational eligibility and local underlay RIB; **never call end-to-end connectivity or remote receiver matching from it**. Source operational eligibility in schema 13 means authored interface up plus present/up directly connected physical link and peer interface. Implement a router-capable helper; the existing switch-only `physicalPortUp` is insufficient. Use the same schema-13 physical eligibility for its physical C/L and dependent S installation, brief output, source selection and forwarding; preserve old schemas' behavior.

| Condition                                                                                | Bounded local display                          | Tunnel C/L and dependent S routes                           |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| adminUp false                                                                            | administratively down / down                   | Absent                                                      |
| adminUp true; source physically ineligible or no installed physical route to destination | up / down, with separately labeled model scope | Absent                                                      |
| adminUp true; eligible source and destination locally routable                           | up / up                                        | Installed, even if remote transport/receiver/delivery fails |

Missing/invalid fields are schema errors, not invented IOS line states. The above is an explicitly condensed educational state subset, not all IOS platform transitions. A remote endpoint outage or wrong receiver must not turn local line-down if the local source and route remain available. No negotiation, heartbeat, elapsed uptime or remote-liveness status. A physical route being installed is weaker than its entire path delivering.

Dependency order must be acyclic: physical eligibility → physical RIB → local tunnel state → overlay RIB → per-packet traversal. Internal directed transport/receiver results may describe why delivery failed, but are not an unsolicited remote-health observation. Reverse direction is calculated separately.

### Forward an inner packet

1. Retain actual inner source/destination and current ingress. Perform ordinary local delivery/longest-prefix lookup. For an ordinary physical route, use the existing physical forwarding pipeline; GRE does not intercept all traffic.
2. If the selected C or S egress is Tunnel0, require local line-up. Capture the configured physical source IPv4 and destination as the outer pair. Never select the far router using the private canonical repair or public design edge.
3. Forward the **outer** packet through shared physical route lookup and directed L2 request/response/data delivery, with tunneling explicitly disabled in this traversal. T1 looks up the outer destination only. Reuse the existing physical steps; do not replace transport with `sameSubnet`, an IP-exists check or a tunnel-peer shortcut. An ICMP ping is not the GRE transport implementation: directed outer delivery does not require a reverse echo reply first.
4. At the actual outer destination, find a configured locally enabled/line-up GRE interface whose source equals the outer destination and whose configured destination equals the outer source, with supported mode. No match means no inner delivery. This is the defined fixed point-to-point receive contract, not a claim of universal GRE decapsulation modes or authentication.
5. Log one logical encapsulation event with source router/interface, outer pair, actual transport path and receiver outcome. Preserve inner addresses unchanged. If accepted, continue the inner packet at the receiver's Tunnel0 ingress using its ordinary local delivery/routing. No ARP is performed across the logical point-to-point link; ARP/L2 checks still apply on every physical segment.
6. Retain actual delivered endpoint/interface/inner identities for GRE paths. A delivered echo request generates a reply from that endpoint toward the source it actually saw. Route it independently through the same logic and verify it arrives at the initiating device/address with expected source. Never reply merely because the requested IP exists in scenario data.

Keep outer and inner visited sets/budgets separate; at most one encapsulation per request or reply is supported. Attempted re-encapsulation/nesting terminates with a labeled unsupported/loop result, never recursion. Retain the finite physical hop guard. Packet journey returns structured inner steps plus nested transport steps; do not flatten T1 into an inner traceroute hop.

No real GRE header serialization, packet scheduling, GRE protocol exchange, TTL propagation, fragmentation or packet counter increment is claimed. The ordinary underlay path is real model forwarding, while encapsulation is a logical abstraction. Existing ACL/NAT/HSRP/STP/security behavior remains untouched in unrelated cases; reject combinations rather than bypassing their checks. Extend directed Ethernet delivery to schema-13 physical steps; do not disable existing admission checks globally.

## 5. Diagnostics and observation design

All commands are buttons with readable terminal-style output and history/evidence selection. A target selector/input is required for ping; router source supports observed physical interface/IP and Tunnel0/IP, validated against active local L3 interfaces. Persist actual source choice. Preserve old command allowlists.

| Device / command                             | Derived state and displayed fields                                                                                                           | Omitted / valid conclusion                                                                                                                        |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1/R2 `show interfaces tunnel 0`             | Local admin/line state; logical IPv4/prefix; configured source interface/resolved address; configured destination; GRE/IP mode               | No remote liveness, counters, MTU, bandwidth, timers, keepalive status or latency. Footer states omitted mechanisms; up/up is local evidence only |
| All routers `show ip interface brief`        | Physical addresses and schema-13 physical state; local Tunnel0 address/admin/line on endpoints                                               | No guessed peer state; T1 has no Tunnel0 row                                                                                                      |
| All routers `show ip route`                  | Shared C/L/S RIB, /32 ownership, physical next hops and exit-interface Tunnel0 static rows                                                   | No invented O routes; installed overlay route does not prove receiver/delivery                                                                    |
| All routers `show running-config`            | Configured physical addressing/static routes; endpoint Tunnel0 address/source/destination/mode/admin state; configured exit-interface routes | No hidden correct-value annotation, cryptographic stanza or fake timer defaults                                                                   |
| All routers `ping`                           | Actual source-aware request and reply, including tunnel-local targets                                                                        | Existing labeled deterministic summary; no invented response from an unreachable source, GRE counters or packet timings                           |
| Both PCs `ipconfig`, `ipconfig /all`, `ping` | Unchanged NIC/mask/gateway/MAC and shared connectivity                                                                                       | No GRE endpoint on the PC, DNS/lease invention or arbitrary configuration shell                                                                   |

**Exclude `traceroute`, `tracert` and `arp -a` from LAB 014.** Underlay-only trace could be separately feasible, but exposing one command that accepts both outer/inner targets with misleading hop semantics is not worth expanding this first scope. Unsupported commands are honestly reported. Retain all older labs' trace/ARP behavior. A post-submission nested packet journey is an explanatory model, not a trace transcript.

Observed endpoints/addresses supply convenient target and repair candidates; no correct address is preselected or injected from private repair metadata. Canonical command label is `show interfaces tunnel 0`; normalization follows existing trim/case/space handling, not a new IOS parser. Output must be recomputed from the same current trial used by probes.

## 6. Structured repair and recovery invariants

New strict action: `{ kind: "gre-destination", device, interface: "Tunnel0", destination }`. Only replace an existing tunnel's destination on the selected router. Accept outer whitespace around canonical dotted IPv4; UI chips/manual input produce the same action. Hostnames, CIDR, arbitrary CLI, extra fields, another interface and unsupported destinations are rejected with configuration-validity messages, never a revealed expected value.

Allow selecting either observed endpoint router: a syntactically valid wrong-side change is a real unsuccessful trial. Dispatch before legacy kind/ACL guards. Reuse immutable clone/replay, timestamp, ten-change/100-command limits, no-op retention, repairIndex freshness, deadlines, durable CAS and immutable finalization. No new storage backend or process state. A new actual change makes prior verification stale; returning to a previous configuration still requires fresh observations for that latest epoch.

Full recovery requires all physical links/devices/routes/LAN/NIC/tunnel IP/source/mode/admin state unchanged, except R1's one destination slot; that slot must equal R2's configured physical source. Both local tunnels line-up; both directions resolve through actual transport and receiver matching; both remote tunnel-IP exchanges and both PC service exchanges succeed with the intended logical events in request **and** reply. A changed dropdown answer without applied trial is not recovery.

Only destination edits are exposed. Valid wrong addresses, wrong endpoint router edits and undoing the correction remain unresolved. Changing LANs, inserting direct underlay LAN routes, deleting tunnels or changing sources is **not** a offered bypass repair: those actions are unsupported by this form. Invariant tests must still reject altered scenario data so future/generalized changes cannot earn full credit by avoiding GRE. Do not add artificial trap controls or pretend learners can currently issue these route edits.

## 7. Deterministic evidence and grading

Proposed structured diagnosis: cause `incorrect-tunnel-destination`, exact device set `{R1}`, interface `Tunnel0`, observed destination `198.51.100.1`, proposed destination `198.51.100.2`, fix `gre-destination`, reason choice expressing “the outer destination must identify the far tunnel source; local up/up and ordinary IP reachability alone do not establish inner delivery.” Notes remain ungraded. Generic distractors contain no private device/value binding.

Authenticate each selected observation by replaying preceding repairs at its own repairIndex and re-running its normalized command/target/**source**. Reject duplicate IDs, other-case observations, unsupported/error outputs, out-of-range versions and forged text. Do not copy NAT's PC-only/no-source evidence filter. Original evidence means version zero; fresh means the latest actual applied version, not simply a later timestamp.

| Component                        | Points | Exact proposed rule                                                                                                                                                                                |
| -------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cause and observed field         | 20     | 10 correct cause + 10 correct original destination                                                                                                                                                 |
| Location                         | 10     | 5 exact device set + 5 that device's Tunnel0                                                                                                                                                       |
| Original underlay evidence       | 10     | Successful R1 ping to **198.51.100.2** from Gi0/1/192.0.2.1 AND to **198.51.100.1** from the same source; one proves intended reachability, the other shows why reachability alone is insufficient |
| Original endpoint/local evidence | 10     | R1 and R2 running-config AND R1 show interfaces tunnel 0; compare outer identities and local state                                                                                                 |
| Original overlay context         | 10     | R1 and R2 show ip route AND failed PC-A ping to 172.31.20.10; routes present but service fails                                                                                                     |
| Applied correction and mechanism | 20     | 10 actual invariant-preserving recovery + 5 matching selected interface/destination/fix on recovered state + 5 structured mechanism                                                                |
| Fresh configuration/routes       | 10     | Recovered state AND current R1 show interfaces tunnel 0 AND current route tables on both endpoints                                                                                                 |
| Fresh delivery                   | 10     | Recovered state AND current reciprocal tunnel-IP pings with explicit Tunnel0 source AND current PC-A→PC-B and PC-B→PC-A pings                                                                      |

This minimum is **8 original and 7 fresh observations**, well below the existing limit. A reciprocal underlay ping and gateway controls remain useful optional diagnostics; do not award duplicate points for them. One underlay round-trip already tests a return path; two opposite LAN initiations test the independent overlay service contract. Fresh route observations deliberately remain unchanged, teaching that route presence was never the fault. Fresh tunnel output proves the corrected configured destination; fresh running-config is useful but not an additional mandatory duplicate.

Feedback separates diagnosis score from `unresolved`, `recovered-unverified` and `verified`. Full 100 requires all groups, a real applied minimal repair, authentic original evidence and fresh recovery evidence. Practice can retry/hint/reveal through existing rules; Assessment gives no hints/answers during the attempt and finalizes only through server grading. Four progressive private hints move from layer separation, to source-aware underlay checks, to endpoint comparison, to the precise field; record hint use without claiming independent success. Preserve all older rubrics unchanged.

## 8. Primer, feedback and external companion

Decision **B: tiny GRE primer**, proposed ID `gre-preparation-v1`. No new Academy lesson/module/revision. Optional before Practice, hidden during active Assessment. Use unrelated Cedar/Maple sites and different addresses from LAB 014, no private case mapping. Keep short sections with two purposeful original diagrams:

1. Solid physical transport through a middle router, dashed labeled logical path above it. Tap whether an address belongs to the outer transport or inner interface; explain each choice.
2. Inner packet → logical encapsulation → physically routed outer packet → far receiver → inner forwarding. Tap which observation proves local state versus actual end-to-end exchange. Explicit requested solution, retry and useful feedback; no mandatory typing or drag-and-drop.

No padlock, encryption animation or secure-VPN wording. Analogy: an addressed envelope carrying another addressed envelope, with the outer delivery location distinct from the final recipient. Limits: actual GRE uses protocol headers and routers; no confidentiality, person checking contents, negotiated session or guaranteed delivery is implied. Explain route presence, directed transport, receiver matching and independent replies separately.

Post-submission private seven-part lesson: simple purpose; bounded analogy; technical inner/outer/local-state mechanism; worked case configuration and unchanged/changed observations; guided complementary commands; independent different-address reasoning; requested independent solution. The worked correction may show `interface Tunnel0` / `tunnel destination 198.51.100.2`, but only after permitted reveal. Repaired preview compares destination, unchanged local up/up and RIB, nested transport and both service directions. No static fake “success” transcript.

Recommend an optional original `docs/gre-device-companion.md` **in 3Q only**, marked UNEXECUTED until real evidence exists. Specify a separate network, not a reproduction of UM PKA. Learner records platform/image/version and feature availability, builds two LANs and a routed underlay, verifies source-aware outer reachability, configures reciprocal Tunnel0 and static overlay routes, probes remote tunnel IPs and both LAN directions, deliberately changes one destination, records local state versus delivery, restores and saves/reopens. Include blank actual-output fields and rollback steps. Do not invent CLI outputs or claim universal Packet Tracer feature support. No companion file or device session is created in 3P.

## 9. Mobile, privacy, persistence and offline contracts

Desktop: five-device physical path with a reserved arc lane connecting R1/R2; dashed line labeled “Tunnel0 — intended logical path.” Mobile **414px and 360px**: vertical physical chain with logical arc in a reserved side gutter, short arc label and plain text explanation below; source/destination address pairs live in full-width inspector cards, not over cable labels. No complex layer switch, draggable node or color-only distinction. Keep neutral lines in broken/repaired states; diagnostic evidence carries actual state.

Use existing accessible device controls as an equivalent to canvas taps, practical targets at least 44 CSS px, visible focus and named source/target controls. Prevent page-level horizontal overflow; terminal output can scroll within its pane. Do not shrink a five-device canvas until text becomes illegible; reserve sufficient vertical space. Address cards must wrap without splitting into ambiguous unlabeled numbers. Test diagram/device controls, evidence selection, trial apply, fresh-version labels, grading and saved journal at desktop/414/360. Physical iPhone/Safari/VoiceOver remain manual unless actually performed.

Private `src/server/gre-scenario.ts` owns actual config, fault, accepted repair, hints and rubric. Initial assessment responses/public catalog/primer/static chunks/comments must contain no authored wrong/correct value bindings. Requested command observations can legitimately reveal real configuration; secrecy must not prevent diagnosis. Practice pack is explicitly inspectable as in existing design: this is personal self-assessment, not a secure exam against someone opening Practice/source code.

Do not import authoring documents into client code or place them in `public/`; test production asset/HTML/API scans for private case content and expected repair. The worker must not cache APIs or authoring docs. Existing server route validation/no-store/deadline/CAS remains; tests cover separate invocation, concurrent actions and finalized records. No auth service, secrets or environment variables are needed solely for GRE.

New proposed pack key `netfault.practice.gre-01.v1` coexists with thirteen older packs. Extend ID/repair/diagnosis parsing and raw recovery export while retaining v1 journals and accepted revisions. Save command sources, observations, trials, selected evidence, hints, time, feedback and reflection. Unknown/corrupt/quota records remain recoverable; no silent deletion or migration rewrite. Before rolling back to a pre-schema-13 build, export/retain journals because old parsers may reject newer entries.

Offline Practice works only after a complete production shell and explicitly downloaded new pack are available. Test actual offline reload, commands, trials, grading and reopened progress; do not rely on an already mounted page. Assessment, fetching uncached packs and external references require internet. Preserve build-stamped snapshot installation/update behavior and Netlify integration; no live deployment is authorized.

## 10. Implementation order, seams and acceptance gates

Future 3Q order is deliberate; if the independent model gate fails, fix it before connecting a case/UI. No success predicate may branch on lab ID or hidden fault metadata.

1. **Model first:** new pure `src/lib/gre.ts`, strict schema extension in [schema.ts](../src/lib/schema.ts), router physical-operational helper and physical RIB/L3 view seams in [engine.ts](../src/lib/engine.ts). Independently addressed/named fixtures in future `tests/gre-model.test.ts`. Test local-state independence, real directed transport, receiver matching, routing, actual delivery and reply identity before authoring LAB 014.
2. **Shared diagnostics and trial:** new command enum/renderer; source/config/route/brief/journey integration; destination action in [repair-trial.ts](../src/lib/repair-trial.ts); direct runtime guards and no-op/replay checks. Do not generalize old route semantics or physical peer discovery into an overlay graph.
3. **One private case and grading:** future `src/server/gre-scenario.ts`, `src/lib/gre-grading.ts`; register through [scenarios.ts](../src/server/scenarios.ts), [catalog.ts](../src/lib/catalog.ts), [grading.ts](../src/lib/grading.ts), [preview.ts](../src/lib/preview.ts). Keep exact model invariants and evidence groups above. Extend appropriate [authoring tests](../tests/authoring.test.ts) without imposing impossible all-address reachability on GRE.
4. **Existing workflow:** future `gre-repair.tsx` and `gre-primer.tsx`; targeted integration in [netfault.tsx](../src/components/netfault.tsx), [topology.tsx](../src/components/topology.tsx), [base.css](../src/styles/base.css) and [storage.ts](../src/lib/storage.ts). Reuse sessions/API/worker architecture; confirm ID/action dispatch through existing route validation rather than adding alternate endpoints.
5. **Verification and documentation:** future `tests/gre.test.ts`, `tests/browser/gre.spec.ts`, relevant browser project configuration and privacy/offline/all-pack regression updates. Add `docs/gre-model.md`, `docs/milestone-3q.md`, optional companion; update architecture/authoring/correctness/verification/README/AGENTS/current coverage with actual results and bounded claims. Preserve the dated 3P planning record.

### Model tests required before scenario tests

- Strict valid config/source references; canonical unicast destination; duplicate/overlapping tunnel addresses; absent source; unknown fields; unsupported mixed/topology/version cases; wrong reachable destination accepted as config, not pre-rejected as answer error.
- Deterministic derivation and immutable input; admin-disabled/source-link-down/no-physical-route produce defined local state; remote endpoint mismatch/outage does not falsify local up/up while a local physical route remains installed. Tunnel routes cannot supply their own underlay route; recursive configuration rejected rather than masked.
- Both ordinary physical transport directions; failing downstream link/route/L2 resolution; source and actual destination identity; wrong destination to an ordinary router must deliver outer traffic there but **not** inner traffic. Different receiver source/destination/configuration breaks the correct directed receive check without an invented negotiation.
- Correct receiver resumes inner destination routing; local tunnel-IP delivery and explicit source support; no tunnel MAC/ARP entry; no address translation; missing remote LAN route and missing return route fail independently. Successful one-way request does not imply successful ping; reverse outer transport is required for a reply, not for the first one-way packet.
- Distinguish locally installed route, directed outer delivery, receive match and complete inner exchange. No dependency cycles, repeated tunnel nesting or unbounded loops. Ordinary physical routes/probes remain independent. Alter device names/addresses and omit authored repair metadata in independent helper fixtures where the type allows it.
- Derive output from model, including unchanged up/up and route tables after destination correction; only destination/configuration and delivery differ. Explicit source spelling/IP equivalence; invalid/down sources honest errors. No fake liveness, counters/MTU/BW/keepalive fields or hybrid trace.

### Case, mode and regression gates

- Exact healthy fixture versus one-field broken clone; valid physical addressing/gateways; expected source/target matrix in section 2; no accidental second fault; exact minimal recovery, actual logical events both ways and preserved underlay; valid wrong/other-router edit unresolved.
- Rubric full success, every missing evidence group, wrong cause/device/interface/value/reason, missing applied edit, forged/duplicate/cross-lab/source-altered evidence, stale versions after another change, no-op retention, repair count and command limits. Hints, deadline, immutable finalization, save/resume across process/module boundaries and CAS concurrent retry.
- Play complete Practice and timed Assessment workflows: inspect **every** device, choose source/target, collect original evidence, trial, collect fresh evidence, submit, read requested explanations, preview, save/reopen journal. Negative and successful repair paths at desktop/414/360.
- All LAB 001–013, especially LAB 004 source/return, LAB 007 installed loop, LAB 009 original-source ACL and LAB 013 translation/delivered identity. Preserve OSPF adjacency/routes, VLAN/ARP epochs, LACP/STP/HSRP/security, Academy revisions and progress. Existing independent model tests stay unchanged unless a demonstrated generic correction requires explanation.
- Production privacy scans and fresh assessment payloads; malformed requests fail closed; no private docs or answers in bundles/worker. Cached Practice survives an actual offline reload/update and export; Assessment remains online only. All fourteen packs, thirteen legacy journals and new source/trial fields must coexist.
- Run actual lint, typecheck, unit/integration tests, production build, full production browser suite and final-build focused checks if later edits warrant them. Report genuine totals/build identity/failures; don't inherit 3O counts. Manual physical iPhone/device checks are separate; no cloud deploy required.

## 11. Explicit exclusions and stop boundary

No IPsec, encryption/authentication, GRE keys/keepalives, liveness/timers/counters, MTU/fragmentation/PMTUD, real header/TTL simulation, recursive-routing fault, DMVPN/mGRE/NHRP, GRE over IPv6, OSPF over GRE, NAT+GRE, ACL-filtered GRE, combined HSRP/STP/LACP/security, multiple tunnels, arbitrary overlay graphs, dynamic WAN protocol, full IOS parser, extra lab, Academy expansion or FlagForge. Unsupported combinations must be rejected, not partially simulated without disclosure.

3Q is proposed only. The next action requires separate user authorization; this document does not start implementation. No commit, push, live Netlify modification, deployment, account connection or credit use is included in 3P.

## 12. Documentation-only verification

Intake was clean at `7f5ab1e`. Source existence/archive hashes and extracted-byte matches were checked; native and selected visual review boundaries are recorded in the [audit](gre-feasibility.md#1-source-provenance-and-inspection). Referenced source slides support the claim matrix, with uninspected activity internals and the V27/V28 discrepancy explicitly retained. Official reference review is not an execution of the proposed network.

Executed documentation checks:

- Archive: 31 entries, matching archive SHA-256, all **9 cited entry hashes** verified, and **7 extracted documents** byte-identical to archive entries. The two PKA entries were not opened/executed.
- Local links: **251 resolved links**, including **33 heading/line references**, across all seven changed Markdown files; zero missing paths/anchors or out-of-bounds line references. Existing historical line links were checked for resolution, not certified as unchanged semantic line locations after later code growth.
- Document addressing arithmetic: **10 unique usable addresses**, **5 nonoverlapping subnets**, four physical endpoint pairs, one tunnel pair and two on-link gateways passed. This checks the proposed table, not network execution.
- Formatting: Prettier check passed for both new documents and the five inserted sections. Existing historical formatting was preserved instead of reformatting unrelated content. The temporary source-checker's first pass needed its table-spacing expression adjusted after Prettier alignment; the corrected check passed, with no source-hash mismatch.
- Git: exact seven-path allowlist confirmed; only Markdown documentation changed. `git diff --check` passed. No scenario, Academy, app, test, dependency, lockfile, generated worker or Netlify file changed.

Created `docs/gre-feasibility.md` and this document. Updated README, AGENTS, semester gap analysis, engine feasibility and roadmap; the older 3N roadmap heading is now explicitly historical. The new current entries link to this audit without rewriting accepted historical records.

No application test, lint, typecheck, browser suite or production build was run, as required for documentation-only 3P. Historical passing suites remain historical; no external GRE, physical iPhone or real Netlify verification is claimed. Nothing was committed, pushed or deployed; Milestone 3Q was not begun.
