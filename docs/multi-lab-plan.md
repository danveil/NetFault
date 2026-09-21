# Next authorized milestone — implementation handoff

Planning only, prepared by Milestone 2E on 2026-09-21 against `ed95191`. Read [the audit](engine-audit.md) and its [reproductions](engine-audit-probes.md). This document does **not** authorize fixes, new labs, randomization, commits or deployment.

## Recommended scope and order

Request authorization for a small readiness pass plus LAB 006 OSPF Hello/Dead Timer Mismatch and LAB 007 Incorrect Static Route Next Hop. Complete each lab before starting the next; run the combined release matrix at the end. Reserve LAB 008 Incorrect Subnet Mask for a follow-on milestone by default. Three are feasible in one milestone only if the host-mask/proxy-ARP gate below is explicitly accepted; they are not three data-only additions.

If exactly three closely related labs are preferred, propose LAB 006 timer mismatch, LAB 007 wrong on-link static next hop, and a **missing OSPF LAN advertisement** as the third topic. That reuses the existing absent-OSPF prefix behavior tested in `passive.test.ts` and avoids changing host/link mask validation. It still needs an OSPF-participation repair type, public form choices and teaching, so it is not free. Obtain topic approval before changing the proposed LAB 008 name. Do not reserve these IDs for both alternatives simultaneously.

Keep five-device chain topologies and existing device names for this first batch. Avoid ACL, DHCP, trunks, new accounts/storage providers and general topology/layout work. No package upgrade is needed merely to add these labs.

## Phase 0 — bounded readiness work, before new content

1. Inspect `git status` and current commit; compare changes against this audit instead of repeating every read. Read AGENTS and relevant installed Next.js guides. Preserve all five authored configurations, old journals and pack keys. Confirm the current baseline if code has changed since `ed95191`.
2. **D1 privacy:** in `src/components/netfault.tsx`, remove the LAB 004 repair-target narration from static client source. Prefer a small server-authored post-attempt preview recipe, available in finalized feedback/practice data, interpreted using `commandSequence`; keep the initial public descriptor free of answers. At minimum neutralize the literal and add a fresh-build public-script assertion for it. Verify no new recipe moves private targets into the catalog. Preserve the same network-derived preview results.
3. **D2 evidence:** require nonempty rule lists and nonempty `requirements` in `schema.ts`; keep nonempty alternatives, supported device/command validation and total 30. Convert A2 into a permanent schema/grading regression expecting rejection. Test each shipped pack still validates and current grades remain identical.
4. **D3 output:** replace `00:00:36` in `engine.ts` with a truthful snapshot field derived from configured timers or an explicit non-countdown placeholder. Convert A1 into a regression that checks no remaining time exceeds Dead. Keep established-only FULL/- semantics; no live timer/neighbor FSM implementation.
5. Add a small exhaustive typed server registry in `src/server/scenarios.ts`, with no fallback-to-last-lab behavior. Add a registry contract checking catalog ID/title, public topology identity/links, command lists, expected version and repair/evidence references. The engine must remain independent of scenario IDs.
6. Add a reusable authored-case test helper in `tests/` (suggested `assert-case.ts`) with explicit inputs: case, healthy/repair expectations, allowed changed paths, expected neighbors/routes, failed/successful probes, canonical diagnosis/minimum evidence and wrong-answer cases. Expected outcomes must be hand-authored assertions, not values calculated by the function under test. Check original immutability and that the repaired state validates.
7. Extract only the repeatedly needed **public** UI settings: initial device, command capabilities, hint count, diagnosis-field family and generic option labels. Do not build a form DSL or copy private rubric/repair targets into public metadata. Keep old family branches until a safe incremental replacement has parity tests.

Exit gate: five existing labs' network and grading tests pass; the three defects have regressions; unknown registry IDs cannot silently select another lab; private answers stay behind the existing boundary. If this gate fails, finish the fixes before adding content.

## LAB 006 — OSPF Hello/Dead Timer Mismatch

**Reusable mechanisms:** current point-to-point adjacency equality tests, per-area route calculation, passive LAN advertisement, directional probes, router command set, interface selector, hints, lessons, journal and assessment storage. No new OSPF engine or Hello clock is required.

**Proposed state contract:** PC-A—R1—R2—R3—PC-B with LAB 005 addressing and unique router IDs. All interfaces up, area 0, transit point-to-point, MTU 1500, cost 1, no authentication; only host LANs passive. R1–R2 uses 10/40. On R2 Gi0/1 use Hello 5/Dead 20, while R3 Gi0/0 remains intended 10/40. This is one deliberate timer-profile fault; there must be no area/passive/addressing fault. State explicitly that both configured values belong to the faulty profile.

Before repair: R1–R2 FULL, R2–R3 absent; R1 can learn the transit prefix through R2 but neither side learns the remote host LAN across the failed adjacency. Connected transit pings may succeed. Correct profile is specified as 10/40 in the network's design requirement, rather than assuming either endpoint's values are inherently wrong.

**Needed changes:** new scenario ID/catalog/module, a versioned timer-pair repair `{kind, device, interface, hello, dead}`, bounded integer profile validation, structured proposed Hello/Dead inputs and a reason for compatibility. Existing `timer-mismatch` cause and `timers` action can be reused; repair semantics cannot reuse the passive boolean. New schema version should reflect capability additions, not require a different version number for each new lab. Retain legacy repair decoding.

**Commands:** PC-A `ipconfig`, `/all`, `ping`, `tracert`; PC-B `ipconfig`, `ping`; routers `show ip interface brief`, `show ip ospf interface`, `show ip ospf neighbor`, `show ip protocols`, `show running-config`, `show ip route`, `ping`, and existing `traceroute` where useful. Destinations and optional router sources remain explicit.

**Independent diagnosis:** learner observes both endpoint timers plus up/area/type/passive state, missing adjacency and route impact. A neighbor table or failed ping alone cannot distinguish timers from the already taught faults. Full evidence should require both endpoint timer-bearing outputs and neighbor/routing context, with equivalent configuration views accepted.

**Proposed rubric:** cause 30; faulty router/interface 10+10; evidence 30 (both endpoint timer observations 10 each, neighbor plus route context 10); correctly targeted 10/40 repair 10; compatibility mechanism 10. Wrong interface, swapping to an unauthorized profile, gateway/area/passive/restart actions and absent evidence cannot earn 100. Notes stay ungraded. Keep old rubrics unchanged.

**Repair/invariants:** change only R2 Gi0/1's timer pair on a clone. Verify reciprocal FULL, exact remote LAN routes/costs, both PC pings and trace, while area, network type, passive LANs, MTU and addressing remain unchanged. Include separate single-Hello and single-Dead mismatch tests and a healthy shorter-timer display regression.

**Risks:** fixed timer output (D3), confusing local process IDs with adjacency requirements, misleading missing-advertisement explanations, or reusing the LAB 005 faulted pack without clearing passive state. Build from a healthy validated fixture rather than stacking faults.

## LAB 007 — Incorrect Static Route Next Hop

**Recommended variant:** a wrong **reachable neighboring router**, not a nonexistent/off-link/recursive next hop. The latter are currently rejected by `validateRoute` and would need additional configuration-vs-installed-route semantics. Do not weaken validation simply to admit an arbitrary typo.

**Reusable mechanisms:** connected/static routes, prefix replacement in `repaired`, longest-prefix lookup, exact next-hop resolution, loop detection, independent return paths and source-sensitive probes. Use PC-A—R1—R2—R3—PC-B with the same four subnets, no OSPF, correct hosts and up interfaces. Existing five-node topology UI suffices.

**Proposed route contract:**

| Router | Correct static destinations/next hops except the marked entry                                    |
| ------ | ------------------------------------------------------------------------------------------------ |
| R1     | 10.0.23.0/30 and 192.168.30.0/24 via 10.0.12.2                                                   |
| R2     | 192.168.10.0/24 via 10.0.12.1; **192.168.30.0/24 incorrectly via 10.0.12.1**, intended 10.0.23.2 |
| R3     | 10.0.12.0/30 and 192.168.10.0/24 via 10.0.23.1                                                   |

R2 sends traffic for PC-B back to R1, which sends it toward R2 again. The wrong next hop resolves successfully but the packet loops; this distinguishes an installed wrong route from LAB 004's absent return route. There is no default or OSPF route concealing the fault. Remote-transit routes ensure source-sensitive diagnostics are not accidentally broken for unrelated reasons.

**Needed changes:** new cause `incorrect-static-next-hop`, neutral replacement-action label, a forwarding-direction reason, and static grading/feedback wording that supports this fault family. The existing route repair replaces an identical prefix, so no new forwarding algorithm is needed. If adding a rubric selector, version it and default old LAB 004 records to their original policy. Do not use its “missing route” and “reply route” text unchanged.

**Commands:** routers `show ip route`, `show running-config`, `show ip interface brief`, `ping`, existing bounded `traceroute`; PC-A `ipconfig`, `/all`, `ping`, `tracert`; PC-B `ipconfig`, `ping`. The topology/design and R3 interface output expose the correct neighboring address. Be explicit that trace reports detected path/loop reachability, not real repeated TTL/latency samples.

**Evidence and proposed rubric:** cause 20 plus correct destination prefix 10; exact affected router 20; evidence 30 (R2 wrong route/config 15, R1 route showing the return toward R2 plus R3 interface showing the intended next hop 15); correctly targeted replacement prefix/next hop 10; explanation of forwarding toward the destination rather than back into the loop 10. Alternative equivalent route/config observations should be accepted. Failed ping alone earns no evidence credit. Reject a gateway change, a default-route workaround and changing an unrelated route.

**Repair/invariants:** replace only R2's 192.168.30.0/24 next hop with 10.0.23.2, preserving prefix and every other route/interface. Verify the loop before and its disappearance after, no OSPF output is fabricated, both host directions and all modeled endpoint probes succeed after repair. Test a competing more-specific route and preserve LAB 004's original route-missing behavior.

**Risks:** broadly relaxing on-link validation, substituting a different destination prefix, accidentally adding a second missing return path, or presenting hop-limit detection as packet-accurate traceroute. A5 demonstrates bounded reuse, not an already authored LAB 007.

## LAB 008 — Incorrect Subnet Mask (separate gate)

**Reusable mechanisms:** host local/remote mask comparison, gateway selection, same-VLAN peer resolution, directional routing, IP configuration/route/ARP outputs, existing switch and router command sets.

**Proposed topology:** reuse the healthy LAB 002 five-device access-switch chain: PC-A 192.168.10.10, gateway 192.168.10.1; transit 10.0.12.0/30; PC-B 192.168.20.10/24, gateway 192.168.20.1. All switching/routing/gateways correct. The sole fault is PC-A configured /16 where the intended LAN is /24. It can reach its gateway but incorrectly treats PC-B as on-link and attempts to resolve PC-B locally. Use the existing healthy OSPF design or a fully specified healthy static equivalent, not a mixture of faulted packs.

**Critical addition:** current `Link subnet mismatch` validation intentionally rejects this host mask even though raw forwarding produces the intended failed ARP behavior (A4). Retain link/subnet labels as **intended design**. Add only a typed, explicit host-prefix fault/repair exception: it must target the faulty PC/interface; the repaired prefix must put the address and valid gateway in the declared LAN; all other endpoints/links/VLANs must still satisfy their existing invariants. Reject wrong masks on unrelated devices and invalid address/broadcast/gateway cases. Do not globally remove link/VLAN subnet validation.

**Proxy ARP:** the engine currently resolves only actual peer IPs and has no proxy ARP. On some real Cisco configurations a router can answer for the remote destination, masking the /16 symptom. Make proxy ARP explicitly disabled in the intended healthy design and visible in the router's worked/configuration output. A minimal false-only supported interface setting and `no ip proxy-arp` renderer is sufficient; do not implement a proxy-ARP engine. Preserve legacy omitted-field behavior and do not claim platform defaults are universally disabled. Ground teaching in [Cisco's example](https://www.cisco.com/c/en/us/support/docs/ip/dynamic-address-allocation-resolution/13718-5.html).

**Commands:** PC-A `ipconfig`, `/all`, `route print`, `arp -a`, `ping`, `tracert`; switch `show vlan brief`, `show interfaces status`, `show running-config`; routers `show ip interface brief`, `show ip route`, `show running-config`, `ping`; PC-B `ipconfig`, `ping`. Current command dispatch already supports these capabilities, but this lab must advertise them explicitly.

**Diagnosis and proposed rubric:** cause 20 plus observed /16 mask 10; exact PC/interface 10+10; evidence 30 (PC-A IP/mask or route view 15, correct router LAN prefix plus local/remote probe or ARP-resolution context 15); exact targeted /24 correction 10; explanation that the remote destination then uses the gateway 10. Accept equivalent dotted mask/prefix input through deterministic normalization. Validate proposed correct prefix against design, not keyword-filled notes. Include wrong gateway, wrong router/interface and merely successful local-ping counterexamples.

**Repair/invariants:** change only PC-A's prefix 16→24. IP, gateway, ports, router routes, proxy-ARP policy and other masks remain unchanged. The healthy router route tables are identical before/after. With a fresh ARP preview, remote requests resolve the gateway rather than PC-B's off-link address and both directions succeed. Prove local connectivity before and after, failed remote resolution before, correct IP/mask/route outputs, and no general schema weakening. This exception and its negative tests make the lab materially larger than timer content.

**Exit gate:** no implementation until the intended design/proxy-ARP policy and scoped validation are agreed in the next authorized scope. If these cannot be verified within that milestone, deliver LAB 006/007 completely and report LAB 008 deferred; do not call a raw unvalidated model a playable lab.

## Integration checklist for each authorized lab

1. Author a server-only case module; register an explicit ID and public metadata. Keep schema version (capability), scenario revision (content) and journal version distinct. Freeze the existing five revisions during this batch; additive IDs do not require rewriting old records.
2. Add only necessary typed repair/diagnosis fields and old-record defaults. Use the common `execute`, `grade`, `repaired` paths for practice and server assessment. No client override of stored scenario, no answer-bearing public descriptors.
3. Provide neutral incident, all device commands, destination input, structured diagnosis, progressive hints, full seven-part explanation, independent exercise/reveal and network-derived before/after preview. Specify design intent so the learner can distinguish the intended minimal fix from a connectivity workaround.
4. Connect the existing journal, exports, cached pack key, lab switching and reopened-attempt selection. Update human-facing counts without assuming five remains forever. Keep the diagram within its tested topology bounds.
5. Add per-case tests using shared contracts plus fault-specific assertions. Do not use the engine's own answer as the test oracle. Test all affected/healthy relations and repair minimality before browser polish.
6. Play practice and assessment at desktop and 414 CSS pixels: every device, commands, selected evidence, incorrect then correct grading where applicable, feedback, repair, refresh and saved journal. Verify deadline/no-hint/server ownership, no-store and initial asset privacy.
7. Production offline: load each newly authorized pack online, wait for worker and reload, disconnect, reopen earlier and new packs, finish practice and save feedback. Test upgrade with an older journal/cache fixture. Assessment must still require a connection.

## Final validation and handoff

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and fresh `CI=true`, `PW_PRODUCTION=1` `pnpm test:browser`. Run development browser checks if required by AGENTS or relevant UI debugging; never reuse development for production offline tests. Keep the current 200 tests and 48 production cases unless an explicitly reviewed changed assertion is necessary. New tests add to the suite; do not promise a target count as a quality measure.

Each lab is complete only after broken observations uniquely support its diagnosis, exact repair restores declared routes/connectivity, both modes work, evidence grades deterministically, offline practice and old saves remain usable, and mobile workflows pass. Update lab guides, README/AGENTS, authoring/architecture as needed and actual verification results. Clearly report unperformed physical iPhone, router-lab and hosted acceptance checks. Leave a local preview and stop; no automatic commit, push, deployment, paid service, credit reset or further lab work.

## Prioritized later roadmap

1. Readiness fixes D1–D3 and authoring contracts; two related complete labs.
2. Scoped incorrect-mask lab with explicit proxy-ARP-disabled design, if still desired.
3. Immutable content revision/instance identity before edits to old scenarios or variants. Continue using the existing server-store abstraction; retain old resolvers, exports and pack version policies.
4. A small finite collection of validated variants; rename/address/fault mappings and independent checks before generated instances reach users.
5. Explicit topology edges/layout and larger graph/switch tests only when non-chain labs are authorized.
6. New protocol families one at a time when the curriculum requires them. ACLs, DHCP and trunking are separate engine additions, not cheap variations.
