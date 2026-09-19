# Scenario authoring contract

Milestone 1 supports exactly `ospf-01`, revision 1, schemaVersion 1. Do not add additional scenarios until the user explicitly authorizes a later milestone. The schema intentionally rejects unknown schema versions.

The authoring entry point is `src/server/scenario.ts` and is guarded by `server-only`.

Required fields:

- `schemaVersion`, `id`, `revision`, public title, incident and design intent.
- Devices: stable ID, kind (`router` or `pc`), role, explicit router ID or PC gateway, interfaces, supported command list.
- Interfaces: unique name, valid usable IPv4/prefix, administrative/operational snapshot (`up`), MAC, optional OSPF area, network type, passive flag, cost, hello/dead timers, MTU.
- Links: two resolvable device/interface endpoints, unique physical attachment, subnet agreeing with both addresses.
- Hidden `fault`, expected endpoint IDs, acceptable structured fix IDs, and the exact configuration patch used for repaired-state verification.
- Evidence rules with points and AND requirements; each requirement has OR device/command alternatives. Total evidence points must stay 30 for this rubric.
- Ordered hints, explanation and worked solution with verification steps.

Protocol state, routing tables and connectivity are derived from this configuration through `neighbors`, `routes` and `connectivity`. Never add independently authored command-output strings that can contradict those derived views. Never call an LLM to produce gameplay output. The public catalog must contain only design intent and UI choices, never private field values or evidence-rule answers.

Schema checks reject duplicate device IDs, duplicate interface names and addresses, duplicate/missing router IDs, network/broadcast host addresses, off-link/nonexistent gateways, PC OSPF configuration, unresolved/duplicate link endpoints and inconsistent link subnets. The behavior tests additionally prove the intended adjacency/routing/connectivity matrix and absence of extra faults. A schema-valid model alone is not evidence of correct networking.

Supported network scope: static IPv4 addresses, passive advertised broadcast LANs, explicitly configured point-to-point transit Ethernet, single-area intra-area routing along each adjacency component, no packet loss/ACL/NAT/static/default routes. Do not author active broadcast segments or inter-area routing until their behavior and tests exist. Avoid implying that /30 addressing itself selects OSPF network type.

Every concept group needs a simple explanation, analogy with limitations, technical account, worked command/config examples, observed symptom, guided practice and independent exercise. Use original explanatory text grounded in primary references. Do not invent course assessment requirements or university endorsement.

Before changing a scenario: run lint/typecheck/unit/browser/build checks; review broken and repaired states; verify no answer keys entered the assessment bundle; review 414px presentation and journal reload. Record actual external validation separately from in-process simulation tests.
