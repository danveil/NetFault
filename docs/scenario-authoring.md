# Scenario authoring contract

## Milestone 3F update

Eight labs are registered; `etherchannel-01` is revision 1/schema v7. Only its bounded two-switch/two-host access-VLAN topology permits gateway-free PCs, parallel physical members and strict port-channel fields. Read [the model contract](etherchannel-model.md) before authoring changes. Validate explicit standalone-disable, no alternate path and locally resolvable members/groups. Unsupported remote VLAN differences are rejected; LACP does not negotiate VLAN identity. Tests must independently derive all mode combinations, partial membership, failed-member isolation, diagnostics and reciprocal forwarding. Public metadata remains neutral; private evidence/fault/teaching stays server-only. Initial evidence plus latest-version verification must support the learner's actual applied repair, not a canonical preview or selected answer alone. Preserve all seven old modules and revisions.

## Milestone 3A update

The 2E audit below/linked is historical. D1–D3 are now corrected; see [execution evidence](milestone-3a.md). Seven labs are supported with the original five configurations/revisions unchanged. Schema v6 adds a timer-profile repair and forward-route diagnosis semantics. The existing adjacency, route derivation, longest-prefix lookup and loop guard are reused; no second engine or server storage change was introduced.

LAB 006 uses [timer mismatch](timer-lab.md); LAB 007 uses [incorrect installed static next hop](next-hop-lab.md). Public preview code now derives device-appropriate commands from an explicitly loaded pack, with neutral before/after labels. No private preview recipe or target is embedded in the catalog. Empty evidence lists are rejected in schema and grading. Neighbor Dead Time follows configured Dead as a labeled representative snapshot. A typed registry and shared authoring tests check identity, topology, commands, evidence, broken symptoms and effective repairs.

New schema fields are additive and optional on diagnoses; v1–v5 packs and v1 attempts remain readable. Practice keys for timer-01 and next-hop-01 coexist with old keys. Seven-part private lessons remain post-feedback/requested practice content. Academy expansion is documentation only; see [its audit](learning-academy-audit.md). The historical milestone sections that follow describe when each original behavior was introduced.

Historical pre-3A content was exactly `ospf-01` (revision 1, schemaVersion 1), `gateway-01` (revision 1, schemaVersion 2), `vlan-01` (revision 1, schemaVersion 3), `return-01` (revision 1, schemaVersion 4) and `passive-01` (revision 1, schemaVersion 5). Milestone 3A separately authorizes timer-01 and next-hop-01 (both schema v6), as described above. The schema intentionally rejects unknown versions/IDs. See [gateway authoring](gateway-lab.md), [VLAN authoring](vlan-lab.md), [static return-path authoring](return-path-lab.md) and [passive OSPF authoring](passive-interface-lab.md). Existing v1/v2/v3/v4 payloads remain readable.

Schema v5 adds `{device, interface, passive: false, reason: "hello-adjacency"}` repair for an existing router point-to-point OSPF interface. It rejects PC, missing interface, passive=true, broadcast LAN and older-version repair targets. OSPF `authentication` accepts only `none`; omitted legacy values mean none. Preserve the network type independently of passive. Prove both missing adjacency and continued passive-subnet advertisement, then verify the cloned repair changes only its target boolean and restores both LAN directions. No schema exception for addressing or adjacency is needed for this lab.

Schema v4 permits `staticRoutes: [{network, prefix, nextHop}]` on routers only. Destination prefixes /0–/32 must be canonical; duplicate static prefixes are rejected. Next hops must belong to an actual directly linked router on an attached subnet; recursive resolution and static next hops through switches are intentionally unsupported. Validate the repair's route using the same rules. A static repair contains `device`, `route` and structured `reason`. LAB 004 has no default or dynamic alternative; tests prove that precisely one static route fixes the fault. Interface prefixes retain their existing /1–/30 constraint. Optional observation `source` preserves old journals; optional diagnosis `destinationNetwork`, `nextHop`, and reply reason permit drafts without arbitrary prose grading.

The server-only registry is `src/server/scenarios.ts`, selecting `scenario.ts`, `gateway-scenario.ts`, `vlan-scenario.ts`, `return-scenario.ts` and `passive-scenario.ts`. Public metadata/command lists live in `catalog.ts`; private faults, repairs, evidence rules and lessons remain server-only. Access ports support 100/1000 Mb/s full duplex. Advertised switchport commands must resolve to authored ports. A lesson part may set `revealOnRequest` to keep an independent exercise answer collapsed until requested.

Required fields:

- `schemaVersion`, `id`, `revision`, public title, incident and design intent.
- Devices: stable ID, kind (`router`, `pc`, or v2 access `switch`), role, explicit router ID or PC gateway, interfaces, supported command list. An unnumbered switch has an empty IP-interface array and separate validated access ports/VLANs.
- Interfaces: unique name, valid usable IPv4/prefix, administrative/operational snapshot (`up`), MAC, optional OSPF area, network type, passive flag, cost, hello/dead timers, MTU.
- Links: two resolvable device/interface endpoints, unique physical attachment, subnet agreeing with both addresses.
- Hidden `fault`, expected endpoint IDs, acceptable structured fix IDs, and the exact configuration patch used for repaired-state verification.
- Evidence rules with points and AND requirements; each requirement has OR device/command alternatives. Total evidence points must stay 30 for this rubric.
- Ordered hints, explanation and worked solution with verification steps.

Protocol state, routing tables and connectivity are derived from this configuration through `neighbors`, `routes` and `connectivity`. Never add independently authored command-output strings that can contradict those derived views. Never call an LLM to produce gameplay output. The public catalog must contain only design intent and UI choices, never private field values or evidence-rule answers.

Schema checks reject duplicate device IDs, duplicate interface names and addresses, duplicate/missing router IDs, network/broadcast host addresses, off-link/nonexistent ordinary gateways, PC OSPF configuration, unresolved/duplicate link endpoints and inconsistent link subnets. The sole nonexistent-gateway exception is the authored schema-v2 fault described above. The behavior tests additionally prove the intended adjacency/routing/connectivity matrix and absence of extra faults. A schema-valid model alone is not evidence of correct networking.

Supported network scope: static IPv4 host addresses and default gateways, same-VLAN access switching, passive advertised broadcast LANs, explicitly configured point-to-point transit Ethernet, intra-area routing along each adjacency component and bounded router static/default routes as described above. Packet loss, ACLs and NAT are not modeled. Do not author active broadcast OSPF segments or inter-area routing until their behavior and tests exist. Avoid implying that /30 addressing itself selects OSPF network type.

Every concept group needs a simple explanation, analogy with limitations, technical account, worked command/config examples, observed symptom, guided practice and independent exercise. Use original explanatory text grounded in primary references. Do not invent course assessment requirements or university endorsement.

Before changing a scenario: run lint/typecheck/unit/browser/build checks; review broken and repaired states; verify no answer keys entered the assessment bundle; review 414px presentation and journal reload. Record actual external validation separately from in-process simulation tests.
