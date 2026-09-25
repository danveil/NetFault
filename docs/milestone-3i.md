# Milestone 3I — bounded STP and LAB 010

25 September 2026. Implements the separately authorized [3H design](milestone-3h-plan.md), starting from clean baseline `4626309`. Exactly one new case: **LAB 010 — The unexpected detour**. All nine previous authored scenario modules/revisions and published Academy content remain unchanged.

## Feasibility re-check

Passed. The existing same-VLAN peer traversal can consume a derived forwarding-link subset. Existing configuration replay, observation versions, deterministic grading and server-owned attempts can accommodate a priority action without replacing Layer 2 or storage architecture. The concrete integration assumptions identified in 3H still applied: SW3 needed API validation, the incident and lab-card text assumed a failed connection, explicit topology text assumed an EtherChannel, and authoring tests assumed all initial pings failed. These received bounded extensions; old cases retain their existing expectations.

The supplied `1.STPrv.txt` was reread. The current/historical lecture provenance, inspected diagrams and clipped-image qualifications remain in [the source audit](stp-feasibility.md). Cisco's [IOS XE STP configuration guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-3/configuration_guide/lyr2/b_173_lyr2_9300_cg/configuring_spanning_tree_protocol.html) was reviewed again for root/role, bridge-ID and short-cost concepts. This is documentation validation, not a captured IOS execution of the topology. No new slide-image inspection or real-device execution is claimed.

## Implemented model

[stp.ts](../src/lib/stp.ts) derives the complete steady-state selection from configuration, without scenario IDs or authored role flags. [schema.ts](../src/lib/schema.ts) adds v9 and `stp-01` while retaining v1–v8.

- Two or three switches, one or two singly attached same-subnet hosts, at most one independent link per switch pair, one common active access VLAN. No routers, gateways, aggregation or tagged links in the STP model. Device/link/interface references and addresses retain the common schema validation.
- Explicit stable unicast bridge MAC, base priority 0–61440 in increments of 4096, and VLAN extended system ID. Compare `(base + VLAN, numeric 48-bit MAC)`. All identities are deterministic, not random or name hashes.
- Explicit short cost method, local receiving-port cost 1–65535, unique local port number and fixed port priority 128. The lab uses cost 4 at each 1 Gb/s port. Cost is a path-selection metric, not simulated bandwidth/latency.
- Each connected operational switch component elects its own lowest BID. Minimum additive receiving-port costs determine root paths. Equal total costs use upstream sender BID, independent of input/port order. The simple graph and unique BIDs exclude the same-sender parallel-port ties; sender/receiver port-priority troubleshooting is not implemented.
- Designated endpoints compare their advertised root cost, then BID. Root and designated ports forward; alternate ports block data. Down ports are Disabled. Host-facing operational ports are designated. A cable forwards only if both switch endpoints permit it; blocking does not remove its physical up state or configured VLAN membership.
- Recompute from all operational physical edges after each effective priority trial, never from the previous pruned tree. `engine.ts` uses the resulting link subset in ordinary `peers` traversal, so all existing host request/reply delivery uses the same tree. `stpPath` provides a separately labelled simulator explanation in the post-feedback preview; switches are never inserted into IP traceroute.

This is a **PVST-style settled selection subset**, not a complete classic STP or Rapid PVST+ implementation. No BPDU exchange/counters, protocol timers, transient Listening/Learning, topology changes, MAC learning/aging, storms, latency, shared-segment backup roles, port-priority editing, root-primary macro execution, PortFast/guards, MST, arbitrary larger graphs or unrestricted per-VLAN instances. The model can calculate one configured VLAN, but the only new exposed command is for VLAN 10; schemas reject that command on another instance.

## LAB 010 and observations

Use the exact addressing, identities and port matrix in [the approved topology](milestone-3h-plan.md#2-exact-topology-and-independent-expected-state). PC-A attaches to SW1, PC-B to SW3; SW1/SW2/SW3 form a physical triangle, all in VLAN 10. Both PCs use `172.26.10.0/24`, with no gateway needed. Every cable remains connected.

Initial SW1 base priority 40960 lets SW2 win (SW2/SW3 both 32768, SW2 lower MAC). SW1 Gi0/2 blocks data. Host path: **PC-A → SW1 → SW2 → SW3 → PC-B**. Both host pings succeed. The design requires SW1 to be explicitly preferred with strictly lower base priority than the other switches; the incident is a design violation, not an invented outage.

New diagnostic: **`show spanning-tree vlan 10`** on all three switches. It derives root/local IDs, base plus extended priority, root path cost/port, local costs, port IDs and Root/Designated/Alternate/Disabled roles and data states. The banner labels settled educational output. No ages, packet counters or timing are fabricated. Existing `show running-config`, `show interfaces status` and `show vlan brief` reveal configured priority, physical carrier and membership; blocked ports remain connected and listed. PCs provide `ipconfig` and destination-based `ping`. Other STP commands/instances/aliases remain unsupported.

Physical topology uses a dedicated triangle layout with a full text cabling alternative, neutral edge color and separate device-selection buttons. There is no automatic root/fault overlay. The lab-card description and incident heading reflect working connectivity; the small lab-card row is a device inventory rather than a false chain. Mobile controls use the existing touch-sized styles. Full bridge/role rows can scroll inside the terminal.

## Applied repair, grading and recovery

[stp-repair.tsx](../src/components/stp-repair.tsx) provides explicit switch and base-priority selects, displays the proposed configuration and applies `{ kind: "stp-priority", device, vlan, priority }`. All three switches are selectable without a preselected fault target. No free-form IOS or cable/shutdown control. Invalid shapes/values, other instances/devices and combined repair types are rejected.

The canonical repair is SW1 priority 24576; any valid SW1 value 0–28672 is accepted with the other configuration unchanged. SW1 then becomes root and SW3 Gi0/2 blocks the redundant SW2–SW3 path. Host path becomes **PC-A → SW1 → SW3 → PC-B**. SW1 priority 32768 would win by MAC and restore the path, but fails the explicit strict-priority preference. Wrong but valid changes remain inspectable.

[stp-grading.ts](../src/lib/stp-grading.ts) grades 20 cause/observed base priority + 10 exact bridge/VLAN + 30 selected initial evidence + 20 applied repair/mechanism + 20 fresh verification. The initial evidence is all three STP views plus SW1 configuration. Fresh verification requires all three current STP views, SW1 configuration and reciprocal host pings after the latest actual change. Outputs are checked against deterministic execution and the selected history/scenario/version; arbitrary notes are saved, not interpreted.

Recovery additionally requires the exact intended tree/roles/root costs, strict preference, intact cabling/VLANs/addresses and a final effective diff limited to the preferred bridge priority. Reverted exploratory changes are allowed. A no-op preserves the version, whereas a later actual change requires new evidence even if it recreates earlier roles. `unresolved`, `recovered-unverified` and `verified` are separate from diagnostic score. Ping alone or a selected remediation never proves recovery.

## Primer, privacy and persistence

The small optional [preparation component](../src/components/stp-primer.tsx) appears on the selected lab bench and in Practice. Three short blocks, one original SVG triangle, an analogy with limits, one worked comparison and guided/independent tap predictions use unrelated A/B/C and VLAN 30. Wrong feedback gives reasoning, detailed preparation answers require an explicit button, and these checks make no progress/mastery claim. No Academy module, content revision, progress migration or new storage key was introduced. The private seven-part lab lesson and worked repair remain explicitly opened after feedback.

Active Assessment hides the primer and retains existing guide/hint/reveal restrictions. Scenario configuration/fault, expected tree, accepted repairs, rubric, hints and case lesson remain in [server-only content](../src/server/stp-scenario.ts). The public catalog supplies design goals and wiring, not actual priorities/roles. Generic priority choices include every valid value; numeric coincidence is not an answer leak. Production privacy tests enumerate private teaching/rubric content for all ten labs and check fresh assessment payloads.

Existing Netlify Blobs strong reads/ETag CAS, attempt-bound scenario selection, server history/deadline/finalization and immutable final grades are unchanged. New events use the same replay and 10-change/100-command limits. SW3 is allowed by API validation but still must belong to the attempt's scenario. Assessment requires connectivity; no API responses enter the worker cache.

Practice pack key: `netfault.practice.stp-01.v1`. Journal remains `netfault.journal.v1`; recorded configuration versions, hints, feedback and observations round-trip through the existing schema. Recovery export includes the new pack. Practice is inspectable and works offline only after downloading the pack and completing the production shell cache. No new authentication, database, dependency, lockfile, runtime/Netlify configuration, service-worker architecture or session-store implementation was needed.

## Verification and known limits

See [the verification record](verification.md) for final results. The model tests preceded scenario integration. They independently assert the complete two role matrices, receiving-cost/tie behavior and 17,496 finite cost/availability/root-priority combinations. That matrix is not an exhaustive proof over all legal integer costs or full IEEE STP. Scenario tests exercise equivalent/wrong repairs, stale/forged evidence, trial limits/no-ops, valid addressing, preserved initial connectivity, schema boundaries, journals, API caching and concurrent assessment replay. Existing LAB 003/008/009 and all older suites remain intact.

During development: sandboxed pnpm/esbuild could not resolve the existing Windows paths; the existing tools succeeded outside that restriction, without reinstalling dependencies. A test fixture initially counted host links as switch edges; its filter was corrected. The public-catalog allowlist needed explicit `heading` and `physicalLinks` entries for STP, and two JSX apostrophes triggered lint before being corrected. Visual review led to a more compact desktop triangle. The first full production browser run had 142 passes and four failures: the existing next-hop/timer offline tests expected an older lab's PC address when iterating over the new STP pack. Both tests now explicitly expect `172.26.10.10` for STP, preserving all older address checks. These initial failures are distinct from final verification.

Physical iPhone, Safari, VoiceOver, real Cisco/Packet Tracer/CML and live Netlify execution were **not performed**. Use the existing [iPhone checklist](iphone-testing.md), additionally inspecting bridge IDs/roles at 414px, the priority selector, zoom/text alternative, requested primer feedback, offline reload and journal recovery. A user-reported earlier iPhone test does not validate this new case. Full switching/STP course coverage and independent real-device competence are not claimed.

## Changed-file inventory

- New model, rubric and private case: `src/lib/stp.ts`, `src/lib/stp-grading.ts`, `src/server/stp-scenario.ts`.
- Existing integration: `src/lib/schema.ts`, `engine.ts`, `etherchannel.ts`, `grading.ts`, `preview.ts`, `repair-trial.ts`, `catalog.ts`; `src/server/scenarios.ts`; `src/app/api/lab/route.ts`. The EtherChannel change only permits physical link-state metadata in v9; it does not change v7 negotiation or member forwarding.
- New UI: `src/components/stp-repair.tsx`, `stp-primer.tsx`. Scoped integration/layout: `src/components/netfault.tsx`, `topology.tsx`, `src/app/globals.css`.
- New tests: `tests/stp-model.test.ts`, `tests/stp.test.ts`, `tests/browser/stp.spec.ts`. Extended existing authoring/catalog/offline expectations: `tests/authoring.test.ts`, `tests/readiness.test.ts`, `tests/browser/next-hop.spec.ts`, `tests/browser/timer.spec.ts`. `playwright.config.ts` includes STP at 360px.
- Documentation: this record, `docs/verification.md`, `README.md`, `AGENTS.md`, `docs/stp-feasibility.md`, `docs/milestone-3h-plan.md`, `docs/semester-2627-gap-analysis.md`, `docs/wia2008-engine-feasibility.md`, `docs/wia2008-roadmap.md`, `docs/network-correctness.md`.

No dependencies were added. The nine earlier scenario files, published Academy files, package manifest/lockfile, deployment configuration, service-worker implementation and assessment session-store architecture are unchanged.

## Open locally

From the NetFault directory, run `pnpm dev`, open `http://localhost:3100`, then **Troubleshooting labs → LAB 010 The unexpected detour → Practice or Assessment → Start investigation**. Inspect devices and preserve initial evidence; use **Diagnose → Test a configuration change**, return to Investigate for fresh observations, then submit. Feedback includes requested explanations, recorded changes and the repaired-network preview; reopen saved work through Your journal.

For offline testing use `pnpm build` and `pnpm start` with no development server running, load/download once online, wait for service-worker readiness and reload before disconnecting. Public iPhone install/offline requires trusted HTTPS, as documented in the existing Netlify/iPhone guides. No commit, push, deployment or Netlify deployment-credit use is part of 3I. No later lab or milestone was started.
