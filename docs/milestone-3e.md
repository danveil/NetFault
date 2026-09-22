# Milestone 3E — OSPFv2 configuration-to-verification bridge

Implemented and locally verified 22 September 2026. **Historical-materials-based roadmap — 2026/27 course requirements unconfirmed.** One new public Academy lesson; no new lab, engine behavior or deployment.

## Execution plan and delivered scope

1. Inspect the existing Academy, revisions, progress reducer, exercise interaction, assessment guard and source audit. Re-read the relevant historical slides and check primary Cisco references.
2. Add one minimal module and one original lesson, two tap exercises and two local diagrams. Preserve the IPv4 archive and current revision-2 content.
3. Add an optional, explicitly unexecuted device companion. Keep it outside scoring and accessible from the cached lesson.
4. Add content/addressing/wildcard/grading/progress and production browser regressions; run the complete existing checks and inspect narrow-screen screenshots.
5. Update the authoring guide, coverage and roadmap to distinguish implemented reasoning exercises from authentic configuration practice still required. Stop without deployment or later-topic work.

## Content and walkthrough

- Module `ospfv2`, revision **1**: OSPFv2 — Configuration and verification.
- Lesson `ospfv2-configuration`, revision **1**: From interfaces to verified OSPFv2 routes.
- Guided exercise `ospf-interface-guided`, revision **1**, five tap steps.
- Independent exercise `ospf-plan-independent`, revision **1**, five tap steps.
- All are schema version 1; existing IPv4 lessons/exercises remain revision 2, with published revision 1 retained unchanged.

Open **Learn networking / Field guide → OSPFv2 — Configuration and verification → Explore module → Open lesson 1**. Read the short explanation and bounded information-office analogy, then use the IPv4 prerequisite links if needed. Follow local wildcard selection into the Cedar/Birch worked addressing table and annotated configuration plan. The technical section contrasts absent activation, intentionally passive LANs and incorrectly passive transit interfaces. The worked section distinguishes interface, neighbor, route and host observations.

The guided Fern/Moss exercise supplies /24 and /30 selectors and asks which local interfaces match, the exact transit selector, Hello endpoints, process/router identity and verification interpretation. The independent Vale/Ridge table reverses the planned router’s position, uses different addresses and three-part interface names, and changes correct-choice positions. It requires a minimal exact area-0 plan, passive policy, expected neighbor/LAN behavior, reciprocal routes and both host-initiated ping directions. Distractors include subnet masks used as wildcards, a remote interface selector, area 1 and passive transit. Feedback prompts reasoning without displaying the detailed answer; full solutions require an explicit request.

### Diagram inventory

1. `ospf-match`: Cedar’s three local interfaces compared with `10.44.0.0 0.0.0.3`. A bounded pure helper computes textual match/non-match labels; no color-only information.
2. `ospf-evidence`: configuration/interface → neighbor → learned route → host tests. Each step names commands, the question answered and the limits of inference.

Both use bundled HTML/CSS and readable text equivalents. Four responsive address-card tables cover the worked, guided, independent and companion networks. No university images, remote assets, animations or diagram dependencies were added. Existing five IPv4 diagrams and four Field Guides are unchanged.

### Network correctness and source evidence

Re-read native text from `Single Area OSPF.ppt` slides 7, 36–44, 56–57 and `Network Management.ppt` 54–61 using PowerPoint read-only COM. The prior audit's documented visual inspection of embedded examples remains historical, not a new device test. See [source discrepancies](wia2008-sources.md); no election-rule simplification or source addressing error is copied.

Cross-checked local-interface selection, exact wildcards, local process IDs, router identity, passive LAN advertisement and explicit Ethernet point-to-point configuration against the [Cisco IOS OSPF command reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/command/iro-cr-book/ospf-i1.html), [Cisco OSPF configuration guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/lyr3-fwd/ospf/ospf-configuration-guide/ospf.html) and [IOS XE OSPF configuration](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/ip-routing/b-ip-routing/m_iro-cfg-0.html). This is reference validation, not execution on Cisco equipment.

All examples use unique host-suitable addresses, correct host gateways and paired /30 endpoints. Transit OSPF point-to-point type is explicit on both ends; prefix length does not imply type. LANs remain advertised when passive. The tables assume up/up interfaces, compatible timers/MTU, no authentication/filtering/NAT and no competing static/default route source. Router IDs are set before activation and need not be routable addresses. Exact selectors advertise the actual interface subnet, not /32. No DR/BDR, full FSM, LSDB, arbitrary wildcard or IOS-parser capability is added.

## External companion: UNEXECUTED

The optional expandable brief is inside the lesson for offline access. A separate [printable Markdown brief](ospfv2-device-companion.md) provides the same assignment. It uses Elm/Ash, LANs `172.28.8.0/24` and `172.28.9.0/24`, transit `10.88.0.16/30`, and unique explicit router IDs. It asks for independently entered configuration, baseline evidence, reciprocal neighbors/routes/host tests, save/reopen, removal of only Elm’s LAN activation, observation and exact rollback.

This is NetFault-created practice inspired by historical lecture objectives, **not an official/recovered UM practical sheet**. No appropriate external session was used. No tested `.pkt`, command transcript or successful configuration result is claimed. Mobile tap completion cannot establish independent device skills; the learner must perform and document that work separately.

## Architecture, compatibility and changed files

- New `src/lib/academy/ospf-content.ts`: original public lesson/module/exercises/companion.
- New `src/lib/academy/wildcard.ts`: pure validation/comparison for supplied `0.0.0.0`, `0.0.0.3`, `0.0.0.255` only; no network engine integration.
- `schema.ts`: optional strict interface-table/companion descriptors and two diagram kinds. Existing accepted shapes remain valid.
- `content.ts`: append new registry entries; resolve historical content by exact ID **and revision** across current and archived content. The prior revision-number-only branch would not resolve a newly created revision-1 lesson.
- New `src/components/academy/interface-table.tsx`; additive rendering in `academy.tsx`, `diagram.tsx` and `src/styles/academy.css`.
- New `tests/academy-ospf.test.ts` and `tests/browser/academy-ospf.spec.ts`. Existing 3C-specific tests explicitly scope to IPv4; browser helpers scope module selection so the second module is not ambiguous.
- README, AGENTS, Academy authoring, iPhone checklist, verification, coverage, source/engine audit pointers, roadmap and selected-spec status updated. This record and companion added.

No dependencies, package/lockfile/configuration changes. No edits to existing scenario content, network engine, public catalog/Field Guides, lab grading, server/API/Blobs/CAS storage, journal/progress schema or worker implementation. The normal build regenerates ignored worker output. Public Academy answers remain inspectable; related LAB 001/005/006 links use neutral mode selection without starting attempts or fetching packs. Active-assessment guard remains in force.

Progress retains `netfault.academy.progress.v1`, drafts keyed by exercise ID/revision, changed retries, saved feedback, idempotent consecutive submissions and explicit reveals. Historical IPv4 records are not converted or credited to new work. Existing recovery/export behavior is preserved. No mastery or cross-device-sync claim.

## Verification

| Final command | Actual result |
| --- | --- |
| `pnpm lint` | Passed, exit 0 |
| `pnpm typecheck` | Passed, exit 0 |
| `pnpm test` | **358 passed**, 16 files; 23 new OSPF Academy tests, no failures/skips |
| `pnpm build` | Passed; build **Tcxj90xrjHtUbPP4nkSe9**, generated production worker; `/api/lab` remains dynamic |
| `$env:CI='true'; $env:PW_PRODUCTION='1'; pnpm test:browser` | **104 passed**, 4.7 minutes, no failures/skips; desktop 1440px, mobile 414px and Academy 360px in Chromium/Edge |
| `git diff --check` | Passed after removing extra EOF blank lines in documentation |

The first browser command exited before running tests because port 3100 was occupied by an existing NetFault production server. Read-only process inspection confirmed the exact repository/Next start command, then only that listener was stopped. Playwright started a fresh production server with reuse disabled; the complete rerun passed. No application assertion failed. Initial diff checking found extra EOF blank lines in four Markdown files; those were removed and the check rerun. Some intermediate patch attempts did not match complete lines and applied no changes; corrected patches were used. These editing attempts are not test failures. Informational FORCE_COLOR/NO_COLOR warnings did not fail the browser run.

New browser coverage includes both tap-only completions, minimum target sizes, no horizontal overflow, named diagrams, revision-1 history, partial-draft refresh/resume, wrong feedback without automatic reveal, review/change by keyboard arrows, changed retry and reveal deduplication, all three neutral case links without API/pack requests, and both exercises plus the companion after production offline reload. Existing tests cover IPv4 archive preservation, all six prior exercises/diagrams, assessment navigation guards/deadlines/history, corrupt-storage recovery, all seven practice/assessment workflows, repaired previews/journals, private static-asset/API boundaries, worker updates and offline packs.

Visually inspected both new diagram screenshots at 360px and 414px: labels wrap and textual match/evidence explanations remain readable. Captures are in ignored `test-results/academy-ospf-OSPF-original-ed0af-tion-and-revision-1-history-{narrow-mobile-chromium,mobile-chromium}/ospf-diagram-{0,1}.png`. Diagram height intentionally uses normal page scrolling. Automated testing includes keyboard selection/focus; it does not constitute a screen-reader audit.

Protected-file diff inspection returned no changes to `src/server`, `src/app/api`, engine/schema/lab grading/storage/catalog/Field Guides, Academy v1 archive/progress/grading/offline implementation, scripts, package/lockfile, Next or Netlify configuration. The IPv4 content overlay retains the same bodies, diagrams and exercise transformation; only the new entries and exact ID/revision lookup were added. No dependency or deployment change was needed.

## Remaining limits

Physical iPhone/Safari/VoiceOver and external Packet Tracer/IOS configuration remain unperformed. Local Chromium emulation is not physical acceptance. No live Netlify deployment was performed. Internet is required for external references and server-backed assessment; the completed production cache supports all four public lessons, eight exercises and the inline companion offline. Progress remains local to the browser/origin. OSPF coverage is partial; broadcast elections, broader mechanisms and authentic configuration performance remain separate work. No next milestone is automatically authorized.
