# Selected implementation: OSPFv2 configuration-to-verification Academy bridge

**Historical-materials-based roadmap — 2026/27 course requirements unconfirmed.**

**Implemented under separate Milestone 3E authorization on 22 September 2026.** See the [implementation and verification record](milestone-3e.md). The original bounded specification below is retained as acceptance context; this is not an outstanding NEXT task. It replaced the earlier provisional IPv6 address/prefix pilot. One Academy lesson, one guided and one different independent tap exercise, two diagrams and an **UNEXECUTED** external configuration companion are now available. No LAB 008 or new scenario. This does not complete OSPF or prove real configuration ability; no later milestone is authorized.

## Objective and source evidence

Given a small, newly addressed IPv4 topology and interface table, independently select the intended OSPFv2 interfaces in area 0, distinguish passive LAN advertisement from transit neighbor formation, and choose observations that verify both adjacency and remote reachability.

The supporting file is **`Single Area OSPF.ppt`**:

- **36–39:** local process identity versus router identity and explicit router-ID configuration.
- **40–42:** wildcard matching, a depicted three-router network-statement example and interface-based activation.
- **43–44:** passive interfaces and explicit point-to-point network type.
- **56–57:** interface/route/neighbor/protocol verification and common configuration errors.
- **7:** neighbor, topology and routing table distinction, used only to explain what each observation proves.

**`Network Management.ppt` 54–61** supports documenting the device/address baseline, gathering evidence, proposing/testing a hypothesis and preparing rollback. These are lecture examples and methodological support, **not original practical-sheet requirements**. Review provenance and discrepancies in [sources](wia2008-sources.md).

## Dependencies and precise boundaries

Reuse IPv4 lessons A1–A3, F2–F4, and the supported point-to-point behavior of LAB 001/005/006. Prerequisites are reading interface prefixes and distinguishing local from remote destinations. Include a short check and links back to existing lessons; do not alter them.

Use supplied **contiguous wildcard masks** for ordinary /24 and /30 examples plus exact-interface 0.0.0.0 matching. Teach that an OSPF network statement selects local interfaces; it is not a remote static route. Limit topology to a small explicitly point-to-point transit arrangement with passive LANs. The slide 41 triangle can inform reasoning, but do not reproduce its screenshots or claim it is a playable NetFault topology.

The recommendation closes a specific missing skill between current IPv4 study and current OSPF investigations. It does not cover the whole Chapter 5. IPv6 and STP/EtherChannel remain supported follow-on priorities.

## Content and interaction to add when authorized

**One new lesson**, with stable new IDs and an appropriate new OSPF curriculum container if required by the Academy registry. A container is organizational metadata, not authorization for additional lessons. Preserve every published IPv4 lesson/exercise revision and all original Field Guides.

1. **Simple explanation:** interfaces participate in route learning; working addressing alone does not establish OSPF adjacency.
2. **Bounded analogy:** selecting which meeting rooms exchange maps versus which destinations appear on the map. State explicitly that routers exchange protocol information and compute routes; people, rooms and maps do not model timers or actual packets.
3. **Technical explanation:** local process ID, unique router ID, area/interface selection, contiguous wildcard comparison, passive LAN behavior, and why interface/neighbor/route/probe observations answer different questions.
4. **Worked example:** original, source-reviewed addressing/interface table; show matched and unmatched interfaces, equivalent interface activation, intentional LAN passive setting and explicit transit type. Explain each command's effect and predicted observations. No copy of university slide assets.
5. **Troubleshooting symptom:** a directly reachable router is not sufficient evidence of a remote route. Contrast an inactive OSPF interface with a correctly passive LAN using supplied configuration evidence, without importing private case repairs.
6. **Guided tap exercise:** select matched interfaces, identify which link should exchange Hellos, and pair each verification command with the claim it can establish. Provide actionable reasoning feedback.
7. **Independent tap exercise:** change addresses, interface names and device arrangement. Select a minimal activation plan, a valid passive setting, expected adjacency/advertisement and enough evidence for both directions. Full worked solution only on explicit request.

Two purposeful local diagrams are sufficient if useful: interface-address matching and configuration → neighbor → route → probe evidence. Use short sections, readable labels, text alternatives, 44px targets, keyboard-accessible choices, review/change, deterministic grading and meaningful distractors. No mandatory typing or drag-only interaction. Do not expose complete answers in ordinary wrong feedback.

Public links may lead to existing LAB 001/005/006 mode selection with neutral context. Never import their private evidence rules, faults, hints or repairs into the lesson. No automatic attempt start or practice-pack download.

## External configuration companion

Include an **original optional practice brief** with a newly addressed two-router/two-LAN topology. Label it as a NetFault companion derived from the lecture objectives, not a recovered UM practical. In a suitable Packet Tracer/device environment the learner should enter the configuration, verify interface addresses and reciprocal neighbors, inspect both remote LAN routes, test bidirectional host reachability, save/reopen configuration, and document an intentional single activation change with rollback.

Document the actual tool/version and commands tested during implementation. Do not claim external validation if no environment is available. In that case ship the conceptual lesson only with the companion explicitly marked **unexecuted**, and leave the operational acceptance below open. No invented starter file or fabricated terminal capture.

## Engine and progress decisions

**No network-engine, scenario, assessment API, Blobs/CAS, service-worker, dependency or Netlify architecture change is needed.** Use existing Academy validation, structured choices, explicit reveals, persistence, immutable revisions and offline shell. A small pure wildcard comparison helper is permissible only if needed to verify authored examples; it is not an IOS configuration engine. Worked command snippets are teaching text.

Retain wrong attempts and help use. Record independent tap performance using existing progress semantics without claiming new secure assessment or overall mastery. Actual configuration artifacts remain external; no new upload, account, sync or grading subsystem.

## Independent acceptance and verification

| Acceptance | Required evidence when implemented |
| --- | --- |
| Interface-selection reasoning | On the independent supplied table, correct matched/unmatched interfaces, contiguous wildcard/exact-host reasoning, and a minimal area-0 activation plan; plausible wrong area, subnet-mask-as-wildcard and remote-network distractors rejected |
| Passive/adjacency distinction | Correct LAN passive choice with continued subnet advertisement; reject passive transit where adjacency is required; do not demand equal process IDs or infer point-to-point from /30 |
| Verification reasoning | Distinguish local interface state, neighbor establishment, learned routes and request/reply reachability. A successful on-link ping or FULL alone cannot satisfy all claims |
| Independent tool transfer | Separate learner-entered configuration, saved artifact and authentic bidirectional verification on new addresses; explain one change and rollback. This cannot be awarded by a tap score |
| Content correctness | Independently enumerate intended interface matches and outcomes; validate configurations against primary Cisco references and record whether actually run in PT/IOS. No broadcast/LSDB output invented by the simulator |
| Preservation and mobile quality | Existing three lessons/six exercises/five diagrams/four guides/seven labs unchanged; new draft/retry/reveal/history behavior tested; desktop, 414px and 360px, keyboard and production offline checks. Physical iPhone results separately attributed |
| Engineering checks | Required checks: lint, strict type check, Academy schema/grading/progress and seven-lab regressions, production build and browser/offline/privacy tests. Actual separately executed results are in [Milestone 3E](milestone-3e.md); the original audit did not run them |

Fixed independent choices provide bounded reasoning evidence. Feedback-assisted retries and reveals must not be described as first-attempt unaided performance; external competence remains a separate claim.

## Exclusions and stop conditions

Exclude IPv6/OSPFv3, DR/BDR elections, full neighbor FSM/LSDB, default origination, ECMP, multiarea routing, authentication, new fault packs, IOS parsing/configuration terminal, arbitrary topology builder, randomization, another broad module, and redesign of accepted 3C UX.

If a future exercise needs an excluded mechanism, narrow it or seek a separate scope; do not quietly expand the engine. Future course materials may reorder the backlog, but their current absence is not a blocker. The 3D task stopped at this specification; the separately authorized 3E implementation fulfills this bounded lesson. No later work is automatically authorized.
