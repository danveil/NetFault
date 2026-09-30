# Milestone 3R — IPv6 feasibility and LAB 015

29–30 September 2026. Intake: clean `3286e91` (`lab 014`). The 3Q test counts are historical baseline results, not 3R verification.

## Feasibility gate: PASS

Exactly one selected fault: disabled IPv6 unicast forwarding on the router between two explicitly configured IPv6 LANs. Learner-facing title: **Between two shores**, LAB 015. Course `5.OSPFrv.ppt` slide 59 explicitly requires `ipv6 unicast-routing`; its revision outline repeats that command. This foundational prerequisite can be isolated from OSPFv3 without pretending to implement the routing protocol. The lab is an original exercise, not a reconstruction or completion of ExtraLab Week 4.

The existing schema and network arithmetic are IPv4-specific. Reusing their address strings, ARP or gateway logic would be incorrect. A separate bounded IPv6 model can nevertheless fit the existing scenario, command, versioned repair, evidence replay, journal and server-session architecture. No storage or worker rewrite is required. One router with two directly connected networks needs no static or dynamic route protocol. Explicitly configured host on-link routes and global-unicast next hops avoid inventing RA/SLAAC or interface-scoped link-local forwarding. Neighbor resolution must traverse the actual attached link, never select a globally matching address without a link.

## Execution plan

1. Record current course evidence, candidate comparison and limitations; verify source bytes and selected visuals.
2. Add a pure 128-bit address/prefix helper and separate direct-link IPv6 forwarding model; test independent fixtures before introducing the private case.
3. Add exactly LAB 015, a forwarding-only configuration trial, replay-authenticated original/fresh grading, requested teaching and repaired preview.
4. Integrate touch-first diagnosis/repair and a small unrelated primer, preserving existing Academy revisions and all fourteen prior cases.
5. Verify schema, model, case, persistence, API ownership, privacy, desktop/414px/360px, production offline Practice and timed Assessment. Run lint, typecheck, unit/integration, build, production browser and diff checks; report actual results.

## Scope decisions

- Separate IPv6-only device configuration; existing IPv4 interface schemas, arithmetic, route lookup, ARP, NAT and GRE behavior remain unchanged.
- Explicit manual global addresses, configured on-link prefixes and host default next hops. Router routes are connected/local only; no static IPv6 route syntax or recursive resolution.
- Bounded successful Neighbor Discovery resolution across an operational direct Ethernet link, without message encoding, timers, cache, DAD, RS/RA or multicast state.
- Local reception and router-originated probes remain possible with transit forwarding disabled. Request and reply are independently delivered.
- Interface-scoped link-local probes/routes are deferred; omitted link-local/RA fields are disclosed, not fabricated.
- No OSPFv3, EIGRPv6, DHCPv6, SLAAC lifecycle, ACLv6, translation, tunnels or dual-stack interactions.
- No source slide is copied into the product. No new dependency, deployment, commit, push, account/site change or Netlify credit use is authorized.

## Actual current-source audit

Reviewed 29–30 September 2026. Source: `C:\Users\afiq hakiki\OneDrive - Universiti Malaya\Degree year 3\ant(REPEAT)\26.27_material.zip`, 18,731,093 bytes, 31 entries; SHA-256 `F50841753A0D2AA476061BAADA3CDAB683F2BAB86FB2D8F1D6D083799F15205B`. All 29 non-PKA extracted originals were byte-compared with the archive. Fifteen slide decks were freshly read through native PowerPoint text extraction; twelve revision outlines and both practical DOCX paragraph/table contents were searched for relevance. Relevant OSPF/ACL revision outlines were read in full. The two GRE/IPsec PKA activities were hashed only: their internal tasks were not inspected or executed. Names do not establish their IPv6 content.

The current archive contains 15 decks: Introduction (12 slides), STP (42), Network Management (76), QoS (47), Network Automation (72), Network Security (53), EtherChannel (23), FHRP (29), LAN (43), OSPFrv (61), ACL (39), NAT (30), WAN (53), VPN (43), ExtraLab (2). Fresh visual review supplemented native text for OSPFrv 58–61, ACL 37–39, NAT 29–30 and ExtraLab 1–2. Other image-only details remain partially reviewed; absence from extracted text is not proof of absence from every image. Neither practical DOCX produced substantive IPv6 matches in its text/tables.

This is the user-supplied current 26/27 collection, not independent verification of UM's current teaching schedule or assessment rubric. Its Introduction contains old dates. Historical `Documents/ant` decks, earlier project audits and general networking references are different provenance; they did not substitute for this source review. No deck, screenshot or copied course exercise is shipped in application assets.

Exact slide filenames: `0.Intro.ppt`, `1.STP.ppt`, `2.ETHERCHANNEL.ppt`, `3.FHRP.ppt`, `4.LAN.ppt`, `5.OSPFrv.ppt`, `6.ACL.ppt`, `7.NAT.ppt`, `8.WAN.ppt`, `9.VPN.ppt`, `10.MANAGEMENT.ppt`, `11.QoSrv.ppt`, `12.NETWORKAUTO.ppt`, `13.netsec.ppt`, `ExtraLab.pptx`. Revision outlines: `1.STPrv.txt`, `2.ETHERCHANNELrv.txt`, `3.FHRPrv.txt`, `4.LANrv.txt`, `5.OSPFrv.txt`, `6.ACLrv.txt`, `7.NATrv.txt`, `8.WANrv.txt`, `9.VPNrv.txt`, `10.MANAGEMENTrv.txt`, `11.QoSrv.txt`, `12.NETWORKAUTOrv.txt`. Practical documents: `11.6.2 Lab - Switch Security Configuration.docx` and `6.4.2 Lab - Implement Etherchannel.docx`. Uninspected activity internals: `16.2.1 Packet Tracer - Configure GRE.pka` and `8.4.1.2 Packet Tracer - Configure and Verify a Site-to-Site IPsec VPN using CLI.pka`.

| Concept                                          | Exact current evidence and kind                                              | Finding / boundary                                                                                                                                                           |
| ------------------------------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IPv6 address structure, hexadecimal, compression | OSPFrv 58; ExtraLab 1, visual configuration plans                            | Compressed hex addresses are used; no dedicated 128-bit/compression foundation established. The tiny primer fills a prerequisite, not a claimed course chapter.              |
| Prefix length, global unicast, subnet reasoning  | OSPFrv 58, ExtraLab 1: /64 plans; ACL 36: IPv6 prefix matching               | Explicit configuration examples; sufficient for two manually planned /64 LANs.                                                                                               |
| Link-local                                       | OSPFrv 58–59, 61; FHRP 12                                                    | Interface configuration, displayed routing next hops, conceptual HSRP virtual link-local/RA. Repeated FE80 addresses are scoped, not globally unique. Deferred in the model. |
| Multicast                                        | OSPFrv 16; revision `5.OSPFrv.txt` line 11                                   | FF02::5 OSPF context. No general multicast forwarding exercise established.                                                                                                  |
| Unspecified / loopback                           | No substantive example found in reviewed text/selected visuals               | Helper tests cover `::`; probes/configuration do not claim these address classes.                                                                                            |
| Interface configuration                          | OSPFrv 59–60; ExtraLab 1                                                     | Configuration steps and an actual multi-router exercise.                                                                                                                     |
| IPv6 unicast forwarding                          | **OSPFrv 59 step 1**; revision lines 97–103 (command at 98)                  | Explicit `ipv6 unicast-routing`, strongest direct support for the selected fault.                                                                                            |
| Neighbor Discovery / ICMPv6                      | ACL 35–36 and revision `6.ACLrv.txt` 44–52, especially 48–50                 | Conceptual IPv6 ACL and NS/NA allowances. Supports explaining why resolution differs from ARP, not a complete ND state machine.                                              |
| RS/RA / SLAAC                                    | FHRP 5, 12                                                                   | RA/default-gateway concept and virtual-router advertisement. No full RS/RA/SLAAC lifecycle configuration exercise established in inspected content.                          |
| Static, recursive and default IPv6 routes        | No substantive configuration example found in reviewed text/selected visuals | Do not infer IPv6 static configuration from IPv4 labs. Manual host default next hops in this original exercise are explicitly bounded prerequisites.                         |
| Link-local next hops / route table               | OSPFrv 61                                                                    | Verification: OSPF routes via FE80::2 **and an exit interface**. This is not a static-route example.                                                                         |
| IPv6 ping / traceroute                           | No detailed IPv6 worked output found in reviewed text/selected visuals       | Ping is an original model-derived diagnostic, verified conceptually against standards. No traceroute added.                                                                  |
| OSPFv3                                           | OSPFrv 3, 58–61; revision 97–103; ExtraLab 1                                 | Strong conceptual/configuration/verification support. Deferred until IPv6 foundations exist.                                                                                 |
| EIGRP for IPv6                                   | Introduction 2–3 synopsis/outcomes                                           | Topic mention, not an inspected configuration method.                                                                                                                        |
| Translation / tunnels                            | NAT 29–30 ULA/NAT64; WAN 41 MPLS payloads; VPN review                        | Conceptual translation/carrying IPv6; no verified IPv6 tunnel configuration established. PKA internals uninspected.                                                          |
| Troubleshooting                                  | Introduction outcomes; OSPFrv 61 verification                                | Verification tools support an original bounded investigation; no claim that this exact fault is a supplied course exercise.                                                  |

Additional mentions: Network Management 48 discusses hierarchical IPv4/IPv6 planning; its slide 5 LLDP neighbor discovery is **not IPv6 ND**. Network Automation 17 mentions the IPv6 RIB/control plane. QoS 39 references Traffic Class/ECN; its source layer-label conflict is not reused as authoritative foundation teaching.

Source conflicts remain visible: OSPFrv revision text has malformed interface-activation wording compared with slide 60. ExtraLab 1 uses process 30, three router IDs, five IPv6 networks and host-ID instructions whose prose/transit annotations are not one verified configuration. ACL 38 is partially clipped; slide 39 is not assumed to be the exact verified output of slide 38. None is copied into a purported tested device lab.

## Engine scope comparison

| Candidate                                                                 | Course fit and executable value                                                                      | Cost / decision                                                                                                                |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| A: addresses and prefix reasoning                                         | Useful missing prerequisite; no actual cross-network service investigation                           | Low cost, insufficient alone. Include only as helper/primer.                                                                   |
| B: connected forwarding plus static routes                                | Executable; static IPv6 configuration not established by inspected sources                           | Adds route authoring/selection without need for this topology. Defer.                                                          |
| C: static routing plus bounded ND                                         | Honest next-hop delivery, reusable                                                                   | ND needed; static routes still unnecessary. Take only bounded ND.                                                              |
| D: OSPFv3                                                                 | Strong course examples and future value                                                              | Requires scoped link-local identities, adjacency/control plane and additional diagnostics before foundations are ready. Defer. |
| E: connected IPv6, manual host routes, bounded ND and a forwarding switch | Explicit source prerequisite; distinct receive-versus-transit reasoning, real request/reply delivery | **Selected:** small separate model reuses trials, grading, sessions and journals.                                              |

## Fault comparison

All candidates require actual return verification and authentic observations; none would be graded from answer text alone.

| Fault                                     | Current source / new learning and novelty                                                         | Model, ND and link-local cost                                                             | Mobile diagnostics, repair and verification                                                                                          | Reuse / regression risk                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Incorrect prefix                          | /64 plans strong, exact fault not demonstrated; new IPv6 boundary reasoning, overlaps IPv4 primer | Moderate; 128-bit prefixes and bounded ND, no link-local necessary                        | Long addresses manageable; must distinguish wrong on-link inference from unresolved neighbor; prefix-only repair and both directions | High foundation value, moderate risk from host-route semantics |
| Wrong static next hop                     | Weak actual static-IPv6 example support; substantially repeats LAB 007                            | Higher: route schema/lookup plus ND; global next hop can avoid link-local                 | Clear route/config comparison, next-hop edit and reciprocal traffic                                                                  | Useful later, unnecessary routing surface now                  |
| Missing default route                     | No detailed inspected configuration example; overlaps LAB 002/004                                 | Host or router default semantics plus ND; scoped LL if RA-based                           | Clear route omission but repetitive gateway exercise                                                                                 | Moderate reuse, less new reasoning                             |
| **Disabled unicast forwarding**           | **Explicit OSPFrv 59**; local reception versus transit is new                                     | **Small:** connected delivery, explicit host routes, bounded ND; global next hops suffice | Config + brief + host routes + local/remote controls; one boolean change; fresh reciprocal probes                                    | High reusable foundation, isolated dispatch limits IPv4 risk   |
| Wrong link-local next hop                 | OSPFrv 61 shows next hop plus interface, but learned OSPF routes rather than static syntax        | Higher: scoped address identity, zone/exit handling, ND                                   | Interface context essential; more fields and ambiguity on phone                                                                      | Valuable later, unacceptable shortcut risk now                 |
| OSPFv3 adjacency or ACLv6 NS/NA filtering | Strong adjacent course topics                                                                     | Much higher: new protocol state or ICMPv6 policy/ND interactions                          | Needs substantially more commands and evidence                                                                                       | Broad regression/scope risk; deferred                          |

## Implementation and teaching

One new schema-14/revision-1 case `ipv6-01`; all fourteen older authored revisions unchanged. See [IPv6 model](ipv6-model.md) for addressing, API boundaries, connected lookup, actual-link resolution, limitations and test responsibilities. There is no dual-stack or second fault. All three devices are inspectable; local pings and router-originated probes are useful controls even before transit service works. The topology does not color the faulty device/link automatically.

Files: `src/lib/ipv6-address.ts`, `ipv6.ts`, `ipv6-grading.ts`; private `src/server/ipv6-scenario.ts`; two small IPv6 UI components. Existing schema/engine/preview/grading dispatch, catalog, registry, topology and trial UI receive narrow integration branches. There is no dependency, package/lockfile, worker-source, storage architecture or Academy revision change.

Regression review reproduced one pre-existing LAB 014 defect: `/api/lab`'s command-device allowlist omitted transport router T1. The API returned 400 while the older browser flow clicked the command without asserting its output. The allowlist now includes T1; API and browser tests assert a real T1 observation. No GRE forwarding/grading or assessment storage redesign was required.

Structured trial changes only R1's IPv6 forwarding boolean. No-op, ten-change ceiling, immutable finalized attempts, deadline and existing CAS semantics remain. Scoring requires authentic original evidence, a minimal applied correction, fresh state/route/local controls and **both** remote directions. Selecting the right answer or merely applying a repair is insufficient. All private values, evidence rules and teaching stay server-only until the established explicit Practice or finalized feedback flows.

The tiny optional `ipv6-preparation-v1` uses unrelated Cedar/Maple `2001:db8:44:*` examples, two diagrams and three tap-first questions with useful wrong-answer feedback, retry and requested reasoning. It teaches notation, explicit on-link prefixes and local-versus-transit behavior, not the case answer. It is hidden during active Assessment. No existing Academy lesson, exercise, revision or progress key changes.

After submission, eight teaching sections include simple explanation, analogy and its limits, technical forwarding, worked commands, symptom comparison, guided reasoning, an independent exercise and separately requested independent solution. The [original device companion](ipv6-device-companion.md) is **UNEXECUTED**, with different addresses and no fabricated terminal output.

## Open and manually verify

From the repository on Windows, use Node 24 and pnpm 11.19.0:

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Open `http://localhost:3100`, **Troubleshooting labs → LAB 015 — Between two shores → Practice → Start investigation**. Inspect all three devices. Compare PC configuration/routes, R1 configuration/interfaces, local-gateway pings and remote PC traffic. Select original observations, apply an observed-router forwarding trial, rerun current state and both local/remote directions, select fresh observations, submit the structured diagnosis, review feedback/preview/teaching and reopen the journal. A repair without new verification must remain recovered-but-unverified. Repeat in timed Assessment: no hints/primer/answers during the attempt; refresh to resume server-owned state.

For offline testing, load the production shell and this Practice pack online, confirm the offline-ready indicator, disconnect and reload before completing the investigation. Assessment requires connectivity. A LAN HTTP address on an iPhone can exercise online UI but is not a secure PWA context. Use a separately authorized HTTPS deployment or trusted local HTTPS for install/offline testing; see [iPhone checklist](iphone-testing.md) and [Netlify setup](NETLIFY_DEPLOYMENT.md). No deployment is part of 3R.

## Verification and remaining limits

Actual current results and any intermediate failures are recorded in [verification](verification.md). Primary Cisco/RFC reference access initially failed; a later read succeeded on 30 September. This is technical source review, **not Packet Tracer/IOS execution**. No physical iPhone, Safari, VoiceOver or live Netlify test is claimed. Full IPv6 course coverage remains incomplete; OSPFv3, dynamic host configuration, static/router default routes, scoped link-local delivery, IPv6 ACLs and transition mechanisms remain future work requiring separate authorization.
