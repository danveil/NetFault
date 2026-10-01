# Transfer foundation — Milestone 3V

1 October 2026. Foundation only: **no new playable lab or transfer challenge**. Read the [milestone record](milestone-3v.md), [compatibility re-audit](integrated-model-compatibility.md) and [verification](verification.md). This implements a bounded path for two future primary fault families without adding a protocol engine.

## Repair capability inventory

Classification describes the published learner workflow, not whether a canonical preview can render a healthy model. Every existing preview is **canonical input with model-derived outputs** (`repairPreview` calls `repaired(original)`); it is never the learner's current trial. All fifteen authored scenarios and revisions remain unchanged.

| Lab | Family              | Published repair classification             | Changes learner state / recomputes | Version / stale recovery evidence | Fresh diagnostics / replay-based grading                                            |
| --- | ------------------- | ------------------------------------------- | ---------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| 001 | OSPF area           | PROPOSED-ANSWER                             | No / preview only                  | No / not applicable               | Original diagnostics / no                                                           |
| 002 | Host gateway        | PROPOSED-ANSWER                             | No / preview only                  | No / not applicable               | Original diagnostics / no                                                           |
| 003 | Access VLAN         | PROPOSED-ANSWER; reusable trial added below | Legacy UI no; foundation yes       | Legacy UI no; foundation epoch    | Legacy grade unchanged; new foundation grade separate                               |
| 004 | Return static route | PROPOSED-ANSWER                             | No / preview only                  | No / not applicable               | Original diagnostics / no                                                           |
| 005 | Passive OSPF        | PROPOSED-ANSWER                             | No / preview only                  | No / not applicable               | Original diagnostics / no                                                           |
| 006 | OSPF timers         | PROPOSED-ANSWER                             | No / preview only                  | No / not applicable               | Original diagnostics / no                                                           |
| 007 | Static next hop     | PROPOSED-ANSWER                             | No / preview only                  | No / not applicable               | Original diagnostics / no                                                           |
| 008 | LACP initiation     | REPLAYABLE                                  | Yes / yes                          | Yes / current epoch required      | Yes / derived bundle and delivery; weaker output authentication than newer families |
| 009 | ACL order           | REPLAYABLE                                  | Yes / yes                          | Yes / current epoch required      | Yes / authentic outputs, policy and bidirectional delivery                          |
| 010 | STP priority        | REPLAYABLE                                  | Yes / yes                          | Yes / current epoch required      | Yes / authentic tree/path and delivery                                              |
| 011 | HSRP priority       | REPLAYABLE                                  | Yes / yes                          | Yes / current epoch required      | Yes / authentic ownership, ARP and delivery                                         |
| 012 | Secure source MAC   | REPLAYABLE                                  | Yes / yes                          | Yes / current epoch required      | Yes / authentic admission and delivery                                              |
| 013 | Static NAT local    | REPLAYABLE                                  | Yes / yes                          | Yes / current epoch required      | Yes / authentic mapping, routing and translated identities                          |
| 014 | GRE destination     | REPLAYABLE                                  | Yes / yes                          | Yes / current epoch required      | Yes / authentic underlay, overlay and actual encapsulated delivery                  |
| 015 | IPv6 forwarding     | REPLAYABLE                                  | Yes / yes                          | Yes / current epoch required      | Yes / authentic original/current state and reciprocal delivery                      |

No family is classified canonical-preview-only: the older labs also grade a structured diagnosis and supporting original evidence. They simply do not grade applied recovery. 3V does not retrofit every old rubric or replace old saved attempts.

## Replayable access assignment

`RepairAction` adds strict `{kind: "access-vlan", device, interface, vlan}`. Only an existing access-switch port and existing active VLAN are accepted in schema 3 or the new schema 15. Targets with STP, port security or a channel group are excluded. No arbitrary CLI, VLAN creation, trunk operation, address edit or protocol change.

`recordRepair` and `trialNetwork` retain the established append/replay architecture. Replay clones the original, changes just the named port membership, validates the resulting network and derives forwarding again. It does not consult the hidden repair to choose a target. Existing ten-change limits, no-op handling and finalized-attempt behavior apply. A no-op adds no version. The server retains its expiry and CAS controls. Applying another fault-free capability is possible during investigation; the grader requires unrelated configuration to remain intact.

LAB003's revision-1 forms, proposed-answer grading, teaching, canonical preview and journal meaning are **not migrated**. Its underlying access assignment now has a genuine reusable transition, with regression proof that the trial matches the modeled canonical repair while preserving the original. ARP history is filtered by current epoch if these trials are used. Leaving its published grading unchanged avoids retroactively making old complete journals depend on missing post-trial evidence. A full learner-facing migration would require an explicit revision and fresh-verification UX, not a hidden rubric change.

## Neutral public metadata and private ownership

New schema 15 requires private profile `access-ospf-policy-v1` and an opaque `n-` plus eight hexadecimal digits identity. Existing enum identities/URLs and exhaustive fifteen-case registry are retained. Opaque syntax alone is not secrecy; do not encode a fault mapping in naming conventions.

`neutralPublicSchema` is a strict version-1 allowlist: identity, neutral title/incident/design, typed devices/roles/interfaces/capabilities, explicit desktop/mobile positions, links/endpoints/labels, and **both** access-assignment and policy-order operations. Neither control list selects the hidden fault. `publicScenario` projects only these fields. API start/resume expose this projection only for neutral scenarios. No new scenario is registered or served in production.

| Data                                                                                          | Classification                        | Treatment                                                       |
| --------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------- |
| Neutral identity, incident, intended design, graph, device interfaces, available capabilities | PUBLIC-SAFE after author review       | Strict projected representation; no configuration snapshot      |
| Existing topic-bearing IDs/titles, catalog choices, case-specific repair panels               | PUBLIC-BUT-LEGACY and TRANSFER-UNSAFE | Keep old UX; do not use it to select future neutral controls    |
| Private state, fault/correct repair, accepted fixes, grading checks, hints, worked solution   | PRIVATE-ONLY for Assessment           | Server scenario; never included in neutral projection           |
| Practice pack with full case and teaching                                                     | Inspectable Practice data             | Explicit existing download; cannot provide exam secrecy offline |
| Diagnostic configuration/output intentionally requested by learner                            | Legitimate observed evidence          | Server executes against the session's current model             |

Schemas cannot detect an answer embedded in natural-language prose or a revealing graph label. Author review, indistinguishability fixtures, response tests and production asset privacy scans remain necessary. The two fixtures share identical public content except opaque ID despite different primary faults. The public design may correctly state intended VLAN/policy requirements; it must not name the misconfigured device or selected repair.

## Scenario-owned diagnostic capabilities

`capabilities.ts` maps a bounded typed vocabulary to existing commands and device kinds. The implemented profile uses host IPv4 configuration/routes, interface state, router routes, OSPF neighbor/state, configuration, access switching, standard policy and reachability. Static-translation and logical-transport descriptors have existing-engine mappings, but **schema 15 rejects them** until a separate validated composition supports them. Their presence in the vocabulary does not enable NAT/GRE transfer.

The API accepts a bounded syntactic device identity, then loads the authoritative session scenario, verifies device membership and its command allowlist, and for neutral cases checks the capability map as well. Cross-scenario names and unsupported commands are rejected before history changes. Existing supported diagnostics are unchanged; an unsupported API command now gets a clear 400 instead of recording an unsupported-output observation. Practice can use the same validator. No all-commands default or arbitrary IOS parser exists.

## Explicit graph contract

The neutral contract has 2–12 typed nodes and 1–20 declared edges. Node interfaces, unique identities, cable endpoints and per-interface physical occupancy are validated. Desktop and mobile coordinates reserve nonoverlapping node footprints. Logical links require logical-transport endpoints; the initial executable profile only accepts physical links and a connected tree matching the private model.

`explicitGraph` and `ExplicitTopology` reuse the existing React Flow node/edge primitives. Rendering is driven by authored coordinates and endpoints, not lab IDs, device names or array indices. Neutral edges carry no fault color. Selection buttons have a 44px minimum and work independently of graph panning; existing zoom/fit controls remain. Existing `Topology` case layouts stay intact. An isolated browser harness exercises a renamed branched graph at desktop, 414px and 360px; it is not a Next route or shipped fixture.

This is bounded authored layout support, not an automatic topology generator or proof that every legal coordinate set is aesthetically usable. Authors must review cable-label placement and viewport readability. Logical schema/render support is not a new GRE composition authorization.

## Existing evidence epochs, formalized

An observation's existing optional `repairIndex` is the configuration version; omission means original epoch zero. History is never rewritten. `evidenceIsCurrent` compares that epoch with replay-event count. Reverting and restoring a setting still creates later epochs; an earlier successful observation is stale for the restored state.

`verifiedEvidence` checks selected identity uniqueness, scenario ownership, valid epoch, supported command and exact output recomputed at that epoch (including source). Forged, duplicate, foreign, future-version or error output is excluded. Foundation capabilities omit history-dependent ARP/MAC commands, so this verifier uses deterministic snapshot diagnostics without inventing cache replay semantics. The older graders retain their tested contracts; this shared helper is adopted by the new profile, not falsely described as universal migration.

Practice data is locally editable and offers learning integrity only. Assessment history/repairs are created on the server; submitted client state is ignored. A client's fabricated evidence ID cannot create an observation in the server store.

## Bounded multi-layer grading

The private verification structure holds original checks, current checks and positive/negative flows. Checks name a layer, owned device, supported command alternatives and optional exact ping target/source. It is not executable code or an arbitrary rule language. Required current layers are configuration, local, routing and policy, plus reciprocal PC flows and at least one retained exclusion. Current diagnostic pings must actually succeed; policy-negative probes live in the explicit flow list.

Grade components total 100: root cause 20, device/interface 10, authentic original evidence 30, actual applied recovery 20, fresh multi-layer verification 20. Recovery replays the learner's events and requires surrounding configuration invariants, independently traversed permitted flows and a real policy drop for each excluded flow. An unrelated down link/no-route failure cannot stand in for policy retention. VLAN recovery changes only the privately bound membership; ACL recovery preserves predicates/actions/attachments and permits alternative valid entry ordering, not just one canonical sequence number.

`verified` requires current authenticated state/routing/policy and flow observations, `recovered-unverified` means model recovery lacks complete current proof, and `unresolved` means recovery/invariants are not established. Correct cause remains a separate score: connectivity alone does not prove the learner identified the cause. Canonical previews never enter this recovery decision. The author still must prove exactly one intended fault and useful healthy controls; layer labels alone cannot establish that.

## Internal demonstrations and mode boundaries

`tests/fixtures/transfer-network.ts` defines two unregistered engineering cases: six renamed devices, a branched access segment, two point-to-point OSPF routers, passive LAN advertisements and outbound remote-LAN standard policy. The VLAN case has one misplaced access port with healthy routing/policy. The ACL case has healthy access/routing and one ordering fault. Original addresses are derived from the existing ACL engineering model; these are **not original learner challenge content**.

Tests execute real diagnostics, change state, retain original evidence, verify fresh switching/routes/neighbors/attachment/policy, reciprocal host delivery and source-aware exclusions. They also test wrong targets, no-op/revert epochs, output fabrication, stale layers, alternative ACL correction and healthy-subsystem preservation. Practice uses the actual pack/journal serializers. Assessment tests invoke the actual POST route and session/grader with a test-only registry resolver and independent `BlobSessionStore` clients sharing an ETag-aware durable-service fake. No production fixture endpoint or process-memory session replacement was introduced. Existing storage tests separately exercise SDK/transport, module reload and Windows write retries.

No transfer UI, transfer caching path or transfer journal presentation is claimed. Future 3W must connect these contracts into a neutral investigation/repair UI and author actual content under separate authorization. Current Practice packs and Academy remain offline after caching; Assessment remains online/server-owned with all three no-store headers. Blobs/CAS, worker architecture, dependencies and deployment settings are unchanged.

## Readiness boundary

The two different primary families are demonstrated through actual model, replay, grading, persistence and server actions, with neutral metadata and an explicit graph renderer. This supports **READY FOR 3W within the tested VLAN + point-to-point OSPF + outbound LAN ACL profile**; see the completed regression record. It is not permission to ship an untested graph or a new mixed protocol.

Remaining work belongs to separately authorized 3W: author two original unfamiliar cases, prove one fault each, assemble capability-driven neutral controls and diagnosis choices (do not fall back to old family panels), add teaching/journal presentation, register/cache the new content and run complete learner workflows. NAT/GRE/STP neutral composition migrations, legacy static/OSPF repairs and broad topology generation remain outside this foundation. The earlier two-VLAN candidate is still a design proposal, not an already proven multi-LAN fixture.

Learning support stays **~89% ±5 percentage points**, a judgment rather than mastery or grade prediction. Infrastructure tests add no executed unfamiliar learner practice or real-device competence.
