# Milestone 3V — transfer foundation

1 October 2026. **Foundation only, no LAB016+ and no integrated learner challenge.** Architecture/repair inventory: [transfer foundation](transfer-foundation.md). Re-audit: [compatibility](integrated-model-compatibility.md). Exact current checks: [verification](verification.md).

## Starting state and preservation

HEAD was `7bf24b5c39403dd29bfd7b2f9acc94ad95ce88d7` (external “lab 0015”). Status and twelve log entries were inspected before edits. The 220-file intake hash snapshot is retained locally in ignored `.netfault/3v-intake.json`. Existing dirty 3T/3U Academy/content/tests/docs were preserved; aggregate Git diff from HEAD is not the 3V delta. No reset, revert, amend, clean, commit, push or deployment occurred.

Existing fifteen scenario definitions, catalog, client lab workflow, Academy, storage/Blobs/CAS, Windows file retry implementation, worker, package/lockfile and deployment settings remain outside the 3V implementation edits. Shared schema, repair replay, grading dispatch, command/API/session handling and an additional topology renderer are intentionally extended. Existing LAB003/009/013/014/015 regression remains mandatory.

## Delivered decisions

- Access VLAN was selected because its port membership already participates in shared forwarding. A strict learner-owned existing-port/existing-active-VLAN trial reuses the current repair log, model recomputation and version count. No new protocol or parser.
- LAB001–007 remain published proposed-answer workflows; LAB008–015 already replay changes. LAB003's reusable underlying transition is now genuine, but its revision-1 learner form/grader/journals are not silently migrated. Its original diagnostics and canonical preview remain intact; ARP trial histories are epoch-filtered.
- Schema15 defines only the restricted access/OSPF/LAN-policy composition. Neutral IDs, public capability projection, explicit graph endpoints/layout/bends, named selection controls and connection list avoid old lab-name rendering assumptions. Old layouts remain intact.
- API device syntax is bounded and actual membership/commands belong to the stored scenario. A fixture can use Desk/Access/Local/West/East/Archive through real route handling; it cannot inspect a foreign R3. Unsupported commands return 400 without adding history. Unknown unregistered neutral IDs cannot allocate attempts.
- Shared evidence uses the existing `repairIndex`; selected output is checked against replayed state at its own epoch. New grading requires original evidence, invariant-preserving applied recovery and fresh configuration/local/routing/policy/reciprocal/negative-control proof. Canonical previews do not count.
- Two internal six-device branched fixtures differ in primary fault: access membership or ACL ordering. Both complete Practice pack/journal roundtrips and actual POST/session grading with independent CAS clients. Tests cover output/state injection, unknown commands/devices, concurrent operations, deadlines, no-op/revert epochs and alternative valid ACL ordering. No fixture is registered or exposed as a route.
- Neutral Assessment start/resume expose only the sanitized public projection plus server-owned attempt. Private checks/answers appear only in authorized final feedback or explicit inspectable Practice packs. Existing no-store and online/offline boundaries remain.

## Readiness and limits

**READY FOR 3W, within the restricted VLAN + point-to-point OSPF + outbound LAN ACL profile**. See the completed verification record. This is based on executed model, state transitions, authenticated grading, mode persistence, actual server route/CAS tests and graph interaction, not just fixture compilation.

3W still needs separate authorization to author two original unfamiliar cases, prove one intended fault each, assemble neutral capability-driven investigation/repair/diagnosis/journal presentation, register/cache packs and test their complete learner journeys. Reusing the old single-family UI would undermine neutrality. The earlier two-VLAN design candidate is not yet a fully tested authored topology. Test fixtures derived from existing engineering content are not finished challenges.

Routing+NAT, routing+GRE and STP+VLAN remain blocked for neutral transfer migration despite their existing playable bounded labs. No mixed-model guard was removed. Static/OSPF legacy repair modernization, arbitrary topology generation and a universal grading language remain excluded. Long/bent graph labels may require panning; the accessible connection list provides exact endpoints, and new authored layouts still need visual review.

Learning-support estimate stays **~89% ±5 percentage points**. Infrastructure adds no new learner-facing transfer exercise, real-device validation, mastery or predicted grade.

## Changed files

| Area                        | 3V implementation                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Neutral schema/capabilities | New [capabilities.ts](../src/lib/capabilities.ts), [neutral-scenario.ts](../src/lib/neutral-scenario.ts) and [transfer-contract.ts](../src/lib/transfer-contract.ts); extend [schema.ts](../src/lib/schema.ts) with profile 15, opaque IDs and persisted access trials                                                                                                              |
| Evidence/grading            | New [evidence.ts](../src/lib/evidence.ts) and [transfer-grading.ts](../src/lib/transfer-grading.ts); new-profile dispatch in existing grading                                                                                                                                                                                                                                       |
| Replay/model                | [repair-trial.ts](../src/lib/repair-trial.ts) adds bounded access assignment; engine adds epoch-filtered LAB003 ARP and neutral-profile policy probe guidance                                                                                                                                                                                                                       |
| Server ownership            | [API route](../src/app/api/lab/route.ts), sessions and registry typing retain existing storage while validating owned devices/commands and projecting neutral metadata                                                                                                                                                                                                              |
| Graph                       | [topology.tsx](../src/components/topology.tsx) adds explicit neutral rendering beside untouched existing case rendering                                                                                                                                                                                                                                                             |
| Tests                       | New [model/Practice tests](../tests/transfer-foundation.test.ts), [actual-route Assessment tests](../tests/transfer-assessment.test.ts), [internal fixtures](../tests/fixtures/transfer-network.ts), [browser component harness](../tests/browser/transfer-topology.spec.ts); update authoring type indexing, the superseded missing-VLAN characterization and 360px test selection |
| Documentation               | New this record and [foundation reference](transfer-foundation.md); update README, AGENTS, compatibility/transfer proposal, correctness, engine feasibility, roadmap and verification                                                                                                                                                                                               |

## Verification record

See the dated top section of [verification](verification.md) for final command results, counts, warnings and corrected intermediate failures. Chromium viewport checks are not physical iPhone/Safari/VoiceOver tests. Network assertions use the existing bounded engine; no new Cisco/Packet Tracer or live Netlify experiment was performed. No account/project change or Netlify credits were used.

Recommended next milestone is separately authorized **3W: original unfamiliar-network content and neutral learner workflow within the proven profile**. 3V stops at this foundation.
