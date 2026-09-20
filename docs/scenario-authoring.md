# Scenario authoring contract

Authorized content is exactly `ospf-01` (revision 1, schemaVersion 1) and `gateway-01` (revision 1, schemaVersion 2). No other Milestone 2 scenarios are authorized. The schema intentionally rejects unknown versions/IDs. See [gateway authoring and correctness](gateway-lab.md) for the additive access-port model, specific gateway-validation exception and grading fields.

The server-only registry is `src/server/scenarios.ts`, selecting the existing `scenario.ts` and new `gateway-scenario.ts`. Public metadata/command lists live in `catalog.ts`; private faults, repairs, evidence rules and lessons remain server-only.

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

Supported network scope: static IPv4 host addresses and default gateways, same-VLAN access switching, passive advertised broadcast LANs, explicitly configured point-to-point transit Ethernet and intra-area routing along each adjacency component. Packet loss, ACLs, NAT and router static/default routes are not modeled. Do not author active broadcast OSPF segments or inter-area routing until their behavior and tests exist. Avoid implying that /30 addressing itself selects OSPF network type.

Every concept group needs a simple explanation, analogy with limitations, technical account, worked command/config examples, observed symptom, guided practice and independent exercise. Use original explanatory text grounded in primary references. Do not invent course assessment requirements or university endorsement.

Before changing a scenario: run lint/typecheck/unit/browser/build checks; review broken and repaired states; verify no answer keys entered the assessment bundle; review 414px presentation and journal reload. Record actual external validation separately from in-process simulation tests.
