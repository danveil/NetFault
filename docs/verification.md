# Milestone 2D verification report

Executed locally on Windows, 2026-09-21, Node 24.15.0, project pnpm 11.19.0 (confirmed by `pnpm --version`), Next.js 16.3.1. Scope: exactly LAB 005. The initial working tree was clean. No dependency, lockfile, deployment configuration, API route, assessment reducer/provider, persistence-format or service-worker source changes were needed. No commits, pushes, account connections, paid services or deployments were performed.

## Baseline and final checks

A fresh baseline before LAB 005 changes passed lint, strict type checking, all 157 existing unit/integration tests, a production build and all 40 production browser tests. Final code checks are below; these are executed results, not inferred from earlier milestones.

| Check | Actual result |
| --- | --- |
| `pnpm lint` | Passed |
| `pnpm typecheck` | Passed |
| `pnpm test` | 200 passed in 9 files: 157 retained + 43 new LAB 005 tests |
| Fresh development `pnpm test:browser` | 36 passed; 12 production-only tests intentionally skipped |
| `pnpm build` | Passed; dynamic `/api/lab` retained; generated worker for build `qPXAreSL-E0dLbk15lP4V` |
| Fresh production browser suite | 48 passed, 0 failed, 0 skipped: 24 desktop + 24 mobile |
| Prettier check on changed application/test TypeScript | Passed |
| `git diff --check` | Passed |
| Physical iPhone / native Safari / external IOS lab | Not performed |
| Live Netlify/CDN/Blobs deployment | Not performed; no hosting changes |

Browser projects use installed Microsoft Edge/Chromium at 1440 × 1000 desktop and 414 × 896 mobile CSS pixels. Fresh servers are enforced with `CI=true`. The production run uses `PW_PRODUCTION=1` after `pnpm build`, so offline checks do not reuse a development server. Existing deployment-update tests remain included. The development run's twelve skips are intentional service-worker/update coverage assigned to production.

All final checks passed. The production suite reopens all five cached labs offline, completes LAB 005 without API access, runs its repaired preview and retains the saved grade after reload on both viewports. LAB 001–004 practice, assessment, repair, persistence and offline regressions pass, together with the existing deployment-update regression. The new scenario added eight production browser cases (four workflows across two viewports).

The production preview was restarted locally on port 3100 after the harness stopped, and `/` returned HTTP 200. Lab cards appear after client hydration; the browser tests verify their rendered presence and complete interactions.

## Behavior covered

- Schema v5 validates exact addressing, unique router IDs, all area 0, compatible timers/MTU, explicit no authentication and correct physical state. Unsupported authentication and invalid/PC/broadcast/old-version passive repairs are rejected. Legacy packs with omitted authentication remain unchanged.
- R1–R2 remains reciprocal FULL/-. Only R2 Gi0/1's passive setting prevents R2–R3 adjacency. Counterexamples move the passive flag to the other endpoint or another scenario; separate area, timer, MTU, enabled, physical and network-type failures still prevent adjacency. The engine has no lab-ID adjacency shortcut.
- R1 learns the passive transit prefix 10.0.23.0/30 via R2 at cost 2; R2 learns the west LAN; R3 initially has only C/L. No OSPF route crosses a nonexistent adjacency. Removing OSPF or taking the interface down withdraws its advertisement as appropriate. Repair adds the expected remote LAN routes at costs 2/3 while leaving C/L unchanged.
- Every advertised command is exercised. Interface/config/protocol/neighbor/route views agree, Hello suppression is explicit and passive interface FSM state is not invented. Host local probes work; remote probes fail. The optional R2 source demonstrates connected-ping success versus a missing reply path. Trace shows only responses that can return to its source.
- Repair is an idempotent clone changing only one passive boolean; both useful LAN settings remain. All modeled IP endpoints become mutually reachable; both host pings and the four-hop PC-A trace to PC-B are verified.
- Deterministic grading tests exact cause/router/interface, alternate evidence sets, failed-ping/missing-neighbor insufficiency, forged/error/foreign evidence, incorrect targets/actions/reasons and partial-credit totals. Four hints and seven lesson sections include an explicit-reveal independent exercise solution with different names, interfaces, addresses and process IDs. Notes remain ungraded.
- Assessment tests cover separate module invocations, server-persisted source observations, server-owned evidence, expiry, immutable final grades, stored-scenario authority, bounded inputs and no-store headers. Existing Blobs ETag/conflict tests pass. This is local/provider-contract evidence, not live cloud execution.
- The new desktop/mobile practice flow inspects all five devices, compares local/remote/source-sensitive probes, selects evidence, consumes hints, submits a 100-point diagnosis, reads feedback, explicitly reveals the independent answer, verifies repair, refreshes and reopens the journal. A separate timed assessment follows an alternative evidence path and resumes its server history across refresh.
- Initial assessment payloads and loaded static scripts are checked for private repair/lesson leakage. Practice materials remain deliberately downloadable and inspectable. All five practice packs and old version-1 journal records coexist without overwriting earlier saved bytes.
- Desktop/mobile inspection screenshots were visually reviewed. Automated width checks constrain the document to the viewport, and command buttons are at least 44 CSS pixels tall. Terminal overflow stays within its panel; all five device buttons remain available. Physical touch, Safari and VoiceOver still require the manual checklist.

## Issues and limitations

One verification launch was prevented by an automatic approval-review usage-limit error before execution. Following the user's instruction to continue, the approved retry ran successfully. A later final verification sequence briefly produced no new output between commands; process inspection confirmed it was at package-manager/type-check startup, and it resumed without killing processes or changing dependencies. No application test failure was found in the completed checks. The pre-existing development React Flow container-size warnings appeared during navigation; the new complete practice flows collect and reject fatal page errors.

Official Cisco passive-interface and OSPF references were consulted; see [the LAB 005 guide](passive-interface-lab.md). No CML, GNS3, Packet Tracer, physical-router or packet-capture run was performed. The model remains a stable snapshot without live LSDB flooding, protocol timers, transient neighbor states, authenticated OSPF, DR/BDR election simulation or general IOS parsing. Source process IDs in this authored lab are 1; independent lesson process IDs illustrate their local significance.

Offline availability requires the production shell and desired practice pack to have loaded online first. Assessment requires connectivity and its server deadline does not pause offline. Browser eviction remains possible; local scores and inspectable practice packs are not tamper-proof exam records. See [physical iPhone/HTTPS acceptance](iphone-testing.md). No new environment variables or manual hosting settings are required. A future Netlify release remains subject to separate authorization and hosted acceptance; older releases cannot parse `passive-01`, so export journals before rollback.

## Files created or modified

Created:

- `src/server/passive-scenario.ts`
- `tests/passive.test.ts`
- `tests/browser/passive.spec.ts`
- `docs/passive-interface-lab.md`

Modified:

- `src/lib/schema.ts`, `engine.ts`, `catalog.ts`, `grading.ts`
- `src/server/scenarios.ts`
- `src/components/netfault.tsx`
- `tests/gateway.test.ts`, `tests/vlan.test.ts`, `tests/return.test.ts` (five-lab catalog/version/journal expectations)
- `README.md`, `AGENTS.md`
- `docs/architecture.md`, `scenario-authoring.md`, `network-correctness.md`, `roadmap.md`, `iphone-testing.md`, `NETLIFY_DEPLOYMENT.md`, `execution-plan.md`, `verification.md`

The four earlier authored scenarios, `sessions.ts`, `session-store.ts`, `storage.ts`, API handler, dependency files, Netlify configuration, styles/topology component and service-worker source are unchanged. Next regenerates its ignored build output/worker and restores its generated type import during production build. Historical verification reports follow with their original scope and counts.

---

# Milestone 2C verification report

Executed locally on Windows, 2026-09-21, Node 24.15.0, pnpm 11.19.0, Next.js 16.3.1. Scope: LAB 004 only. Existing dependencies, lockfile, deployment configuration, Blobs/ETag provider, local persistence format and service-worker strategy are preserved. No commits, pushes, remote project changes or deployments were performed.

## Baseline and final checks

The baseline established during this task passed lint, strict type checking, 123 unit/integration tests, a production build and all 32 existing production browser tests before the new lab was integrated. These are executed baseline results, not merely the previous milestone's reported counts.

| Check                                              | Actual result                                                                             |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm lint`                                        | Passed                                                                                    |
| `pnpm typecheck`                                   | Passed                                                                                    |
| `pnpm test`                                        | 157 passed across 8 files: 123 retained + 34 LAB 004 checks                               |
| Fresh development `pnpm test:browser`              | 30 passed; 10 production-only tests intentionally skipped                                 |
| `pnpm build`                                       | Passed; generated build-versioned offline worker; `/api/lab` remains a dynamic Node route |
| Production browser suite                           | 40 passed, 0 skipped, 0 failed on the final build (20 desktop + 20 mobile)                |
| `git diff --check`                                 | Passed                                                                                    |
| Physical iPhone, native Safari or external IOS lab | Not performed                                                                             |
| Live Netlify/CDN/Blobs deployment                  | Not performed; no hosting changes                                                         |

Browser projects use installed Edge/Chromium at desktop 1440 × 1000 and mobile 414 × 896 CSS pixels. Development and production runs start fresh appropriate servers; no development server is reused for offline tests. Both the first and final production runs passed all 40 tests. The final build includes the edge-case guards preventing unsupported source options from populating ARP replay and empty static-route lists from bypassing device/version validation. No failed checks remain. The production preview was restarted locally on port 3100 after the test harness stopped.

## Verified behavior

- Schema v4 validates canonical static prefixes, directly linked next-hop routers, unique addresses, operational interfaces, correct PC gateways, switch VLANs and valid repair targets. Invalid self, network/broadcast, remote and host next hops are rejected. Earlier packs and journal records remain readable.
- R1 installs its static Network B route; R2 initially has only C/L transit and Network B entries, without a default or OSPF alternative. Longest-prefix counterexamples cover connected/static competition, /32 specificity and /0 fallback. Interface-down state withdraws an installed dependent static route without deleting its configuration.
- PC-A reaches its local gateway. Its request to PC-B traverses R1 and R2 and is delivered; the reply reaches R2 and fails its destination lookup. R1's default transit-sourced ping succeeds, while the LAN-sourced probe fails. Invalid/nonlocal/unsupported source requests are honestly rejected.
- Trace displays R1 then stars where return responses cannot reach PC-A. A separate outward-failure test prevents disclosure of an intermediate unreachable message with no return path. No switch IP hop is fabricated.
- Repair changes only R2's route list, is idempotent, leaves the original untouched, and restores connectivity among all modeled IP endpoints. Route/config/ping/trace outputs and packet-journey explanations derive from the same state.
- Deterministic grading checks cause, missing prefix, exact device, both routing tables with host addressing, next hop, action and structured explanation. Alternate observation order is accepted. Failed ping alone, forged IDs, other-scenario records and command-error outputs earn no evidence credit. Wrong gateway/VLAN/R1 changes do not receive repair credit. Four ordered hints and a seven-part lesson are supplied; the independent solution requires explicit reveal.
- Assessment sessions preserve source observations across independent module reload, enforce server deadlines, keep final results immutable, bound new input fields and retain the stored scenario despite a client override. Existing Blobs conditional-write/concurrency tests pass. This remains local/contract evidence, not a cloud-storage claim.
- Desktop/mobile full practice workflows inspect all five devices, compare source-sensitive probes, select evidence, score 100, read the lesson, explicitly reveal the independent solution, run the repaired preview and reopen a saved journal. Timed assessment persists the source observation across refresh and grades server-owned evidence.
- Production tests reopen all four cached packs offline, complete LAB 004, run its repaired preview and retain the saved grade. Earlier OSPF, gateway and VLAN complete workflows, assessments, repair previews and offline tests pass. API no-store headers and absence of private route/lesson content from initial assessment payloads/static scripts are checked. Existing worker-update regression passes.
- Mobile tests assert document width within 414 CSS pixels and command-button heights of at least 44 pixels. Desktop/mobile inspection screenshots were visually reviewed; all devices have accessible selection buttons, routes scroll in the terminal, and the new source input fits. Automated emulation does not prove physical touch, VoiceOver or Safari behavior.

## Issues encountered and limits

The first new test type-check found a storage mock missing `removeItem`; it was corrected. A sandboxed `pnpm exec prettier` invocation failed executable resolution; the already-installed formatter was run directly using Node. No dependencies were installed or changed. Process inspection initially required outside-sandbox permission; the prior NetFault preview's exact command was verified before stopping it for the baseline. Builds/tests ran with approved local execution permissions where needed.

Development continues to emit the pre-existing transient React Flow container-size warnings during navigation. Complete production flows pass without fatal page errors in the new practice test. The engine remains bounded: no recursive static next hops, configurable distances, ECMP, general IOS shell, real packet timings or complete ICMP error generation. Assessment requires connectivity. Physical iPhone/HTTPS installation and native Safari acceptance remain on the [manual checklist](iphone-testing.md).

Primary Cisco/RFC references were consulted for routing selection, ping sources and ICMP semantics; see [LAB 004 guide](return-path-lab.md). No CML, GNS3, Packet Tracer or physical-router execution is claimed. There are no new environment variables or paid services. The locally verified source is ready for a future Netlify release through the existing configuration, subject to separate authorization and hosted acceptance checks. Older releases cannot parse new scenario IDs, so export journals before rollback across a lab-version boundary.

## Files created or modified

Created:

- `src/server/return-scenario.ts`
- `tests/return.test.ts`
- `tests/browser/return.spec.ts`
- `docs/return-path-lab.md`

Modified:

- `src/lib/schema.ts`, `engine.ts`, `catalog.ts`, `grading.ts`
- `src/server/scenarios.ts`, `sessions.ts`
- `src/app/api/lab/route.ts` (optional bounded probe source only; cache/origin protections retained)
- `src/components/netfault.tsx`, `src/styles/base.css`
- `tests/gateway.test.ts`, `tests/vlan.test.ts` (catalog expectations gain the authorized fourth entry)
- `README.md`, `AGENTS.md`
- `docs/architecture.md`, `scenario-authoring.md`, `network-correctness.md`, `roadmap.md`, `iphone-testing.md`, `NETLIFY_DEPLOYMENT.md`, `verification.md`

Existing scenario files, `session-store.ts`, `storage.ts`, Netlify configuration, dependencies/lockfile and worker source are unchanged. Historical reports below preserve their original counts.

---

# Milestone 2B verification report (historical)

Executed on Windows, 2026-09-20, using the existing Node 24 / pnpm 11.19.0 / Next.js 16.3.1 toolchain. Exactly one new scenario, LAB 003, was added. No dependencies, deployment settings, Blobs provider or service-worker strategy were changed. No commits, pushes, account operations or deployment were performed. The user reports an existing Netlify deployment; that is not verification of this new version.

## Actual baseline and final results

The repository was clean before implementation. The existing lint/type checks and all 93 unit/integration tests passed; a fresh local production-server baseline passed all 24 existing browser tests. Those results were established before source changes.

| Check                                                                | Final result for 2B                                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm lint`                                                          | Pass                                                                                  |
| `pnpm typecheck`                                                     | Pass, strict TypeScript                                                               |
| `pnpm test`                                                          | **123 passed**, 7 files; 30 new VLAN tests                                            |
| Development `pnpm test:browser`, `CI=true`                           | **24 passed**, 8 production-only checks skipped                                       |
| `pnpm build`                                                         | Pass; static root/manifest, dynamic Node `/api/lab`, generated build-versioned worker |
| Production `pnpm test:browser`, `CI=true`, `PW_PRODUCTION=1`         | **32 passed**, no skips, no test failures                                             |
| Desktop / mobile coverage                                            | Chromium/Edge, 1440 × 1000 and 414 × 896 CSS pixels                                   |
| `git diff --check`                                                   | Pass                                                                                  |
| Physical iPhone, native Safari, real IOS/Windows network or emulator | Not performed                                                                         |
| Live Netlify/CDN/Blobs deployment                                    | Not performed for 2B; storage architecture unchanged                                  |

Both browser runs started fresh appropriate local servers. Production offline checks did not reuse a development server. Desktop and mobile switch-inspection screenshots were reviewed: all five devices are available, long command buttons fit, outputs scroll within the terminal, and the document fits its configured viewport. Browser tests also submit the longer diagnosis form and verify the independent answer is hidden until requested.

## New evidence

- Schema v3 validates all devices, links, addressing, active VLANs, switchport-command references and a valid port/VLAN repair. Tests reject absent VLANs/ports, invalid repairs, inappropriate schema versions and an accidental wrong gateway.
- PC-A has correct IP/mask/gateway, both switch ports are operational, and both VLANs exist. Local gateway/remote probes fail at the actual Layer 2 next hop. PC-A's own address, PC-B's local gateway and healthy router-to-remote probes still work. Router routes and adjacency are correct before and after repair.
- Counterexamples prove the engine uses broadcast-domain membership: hosts in the same active VLAN can communicate despite the original gateway's isolation; placing both connected ports in another active VLAN restores reachability but does not satisfy the intended repair. No lab-wide ping failure flag exists.
- Initial ARP cache is empty. Failed resolution cannot create a gateway MAC. Successful exchanges learn actual interface MACs and replay identically after reload; invalid/unsupported/read-only commands and other-scenario history cannot populate entries. Fresh repair preview starts empty and learns only after its own probe.
- VLAN brief, status, both switchport views and running-config agree. Physical/admin/operational state is distinguished from access membership. The accepted repair changes only FastEthernet0/1's VLAN; all host/router configuration remains byte-for-byte equal as scenario data. All modeled host/router paths then succeed.
- New rubric tests cover alternate sufficient evidence combinations, wrong cause/device/interface/observed VLAN/intended VLAN/fix, forged IDs, unrelated scenario evidence and the inadequacy of one failed ping. Old LAB 001/002 grading tests pass unchanged; only the older catalog-count assertion was updated for the authorized third entry.
- Server assessment tests verify scenario ownership, no initial answers, ARP replay across module reload, server expiry, cross-lab device rejection, bounded VLAN input and immutable submission. The existing Blobs/ETag concurrency suite also passes; this is local/mock evidence, not a live hosted-storage claim.
- Complete LAB 003 browser playthroughs cover all devices, commands, evidence, 100-point grading, seven-part teaching, explicit independent-solution reveal, genuine repaired preview, refresh and journal reopening. Timed assessment uses a different investigation order and resumes its recorded ARP context after refresh.
- Production offline coverage caches all three packs, reopens each lab after offline reload, then completes LAB 003 and its repair preview offline. Existing OSPF/gateway full playthroughs, assessments, offline previews, answer-boundary checks, no-store headers and service-worker update regression tests continue passing.

## Execution issues and limits

The initial sandboxed Vitest run could not load its configuration because esbuild was denied parent-directory access. Running the same suite outside the sandbox passed; no dependency changes or test weakening were made. The initial browser-baseline launch found port 3100 occupied by the previously running NetFault production preview. Its exact command was verified, that process was stopped, and the test harness started a fresh server. A sandboxed formatter invocation could not resolve its executable; the normal outside-sandbox invocation succeeded.

Development still emits transient React Flow container-size warnings during navigation, as in prior milestones. The final production workflows pass, and no fatal page errors were recorded in the new practice workflow. ARP cache aging/retries, ambient/passive traffic, switch MAC learning, STP, trunks and exact vendor output timing/formatting remain outside the model. Assessment is online-only. Physical-device checks remain in [the iPhone checklist](iphone-testing.md).

Microsoft/RFC/Cisco documentation was reviewed for ARP and access-port semantics; links and the precise model boundaries are in [LAB 003 documentation](vlan-lab.md). No external networking lab execution is claimed. Locally verified source is ready for a separately authorized Netlify release through the existing configuration; no new environment variables or infrastructure are required. Live deployment and physical iPhone acceptance still need verification after release.

## Files changed

Created:

- `src/server/vlan-scenario.ts`
- `tests/vlan.test.ts`
- `tests/browser/vlan.spec.ts`
- `docs/vlan-lab.md`

Modified:

- `src/lib/schema.ts`, `engine.ts`, `catalog.ts`, `grading.ts`, `storage.ts`
- `src/server/scenarios.ts`, `sessions.ts`
- `src/components/netfault.tsx`, `src/styles/base.css`
- `tests/gateway.test.ts` (third catalog entry)
- `README.md`, `AGENTS.md`
- `docs/architecture.md`, `scenario-authoring.md`, `network-correctness.md`, `roadmap.md`, `iphone-testing.md`, `NETLIFY_DEPLOYMENT.md`, `verification.md`

The existing OSPF/gateway scenario files, API route validation/no-store protections, `session-store.ts`, dependency lockfile, Netlify configuration and service worker source remain unchanged. Historical reports below retain their original counts.

---

# Milestone 2A verification report (historical)

Executed on Windows, 2026-09-20, using the existing Node 24 / pnpm 11.19.0 / Next.js 16.3.1 toolchain and lockfile. Scope: one additional gateway lab. Dependencies, Netlify deployment configuration and the assessment storage provider were not changed. Nothing was committed, pushed or deployed.

| Check                                                            | Actual final result                                                                             |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm lint`                                                      | Pass                                                                                            |
| `pnpm typecheck`                                                 | Pass, strict TypeScript                                                                         |
| `pnpm test`                                                      | **93 passed**, 6 files; includes 24 new gateway tests                                           |
| Development `pnpm test:browser` with `CI=true`                   | **18 passed**, 6 production-only tests skipped                                                  |
| `pnpm build`                                                     | Pass; static root/manifest, dynamic Node `/api/lab`, build-specific offline worker              |
| Production `pnpm test:browser` with `CI=true`, `PW_PRODUCTION=1` | **24 passed**, no skips; desktop and 414 × 896 mobile Chromium emulation                        |
| `git diff --check`                                               | Pass                                                                                            |
| Physical iPhone / Safari / controlled network emulator           | Not performed; manual checklist and reference review documented                                 |
| Netlify adapter packaging / live deployment                      | Not rerun in 2A; no deployment authorized. Historical 1.5 tooling limitations below still apply |

## What the checks demonstrated

- Schema v2 validates the switch ports/VLAN, addressing and narrowly scoped gateway fault. Existing OSPF schema-v1 packs and attempts still load.
- PC-A reaches its local router through SW1 but cannot resolve the configured default next hop for remote traffic. R1/R2 form healthy OSPF adjacency and learn the expected LAN routes. Return-path failure explains reverse ping failure. Changing only PC-A's gateway restores all modeled host/router reachability; SW1 adds no IP trace hop.
- Every advertised command returns deterministic output. The gateway rubric accepts the correct cause, exact device, observed configuration, exact replacement address and structured forwarding explanation. Wrong components lose their corresponding points; free-text notes do not influence grading.
- The gateway assessment survives server-module reload and browser reload, retains its selected scenario, rejects devices from the other lab, expires against its server deadline, and cannot revise a finalized grade. Existing serverless concurrency tests still pass; no storage architecture changes were needed.
- Both complete practice workflows and both timed assessment workflows pass in desktop/mobile production browsers. New coverage includes every device, switch commands, local/remote probes, evidence selection, seven-part feedback, repaired preview, journal reopening and two independently cached practice packs across an offline reload.
- Existing manifest/no-store/answer-boundary checks and simulated service-worker update tests pass. The fresh gateway assessment and fetched scripts do not include the private faulty address or selected explanation/rubric strings. This is a regression check, not proof of a secure exam: practice packs and source remain inspectable.
- The mobile investigation screenshot was inspected: topology and inspector controls render, terminal output remains confined, and the full page fits 414 CSS pixels. See [iPhone manual checks](iphone-testing.md) for physical testing still required.

## Failures found and resolved

Initial development runs reported 17 passes, one mobile assessment submission failure and six intentional skips. The five device choices forced the fieldset wider than the mobile viewport, expanding the layout and disrupting hit testing. Device choices now wrap and the fieldset can shrink. The new gateway input also uses 16px mobile text. Regression assertions compare document width to the configured viewport rather than `innerWidth`, which mobile overflow itself can expand. After the fix, development and production suites passed without forced clicks or weakened assertions.

One browser-run launch exited with Windows code 3221226505 and no diagnostic output; a fresh `CI=true` invocation ran normally. Development still logs transient React Flow container-size warnings during navigation, as in 1.5. Rendered topology checks and complete workflows pass; no fatal page errors occurred in the gateway practice test.

Networking mechanisms were checked against the Microsoft, RFC and Cisco references listed in [gateway correctness and authoring](gateway-lab.md). No real IOS/Windows packet capture, CML, GNS3 or Packet Tracer validation is claimed. The model intentionally abstracts ARP timing, MAC learning and exact vendor output formatting. Assessment remains online-only.

Primary implementation changes: new server-only gateway scenario/registry; additive schema, access-switch traversal, commands and grading; per-lab API/session selection; separate practice caches; lab selector/topology/diagnosis/feedback/journal UI; mobile form sizing. `src/server/session-store.ts`, the lockfile and deployment configuration remain unchanged. Tests, README, AGENTS and architecture/authoring/correctness/roadmap/iPhone/deployment documentation were updated.

The reports below are retained as historical evidence, not current test counts.

---

# Milestone 1.5 verification report (historical)

Executed on Windows, 2026-09-19. Node 24.15.0, pnpm 11.19.0, Next.js 16.3.1, Blobs SDK 11.1.0. The automatically selected Netlify build runtime was 5.16.0 (@netlify/build 37.0.0). Nothing was committed, pushed, linked to a cloud account or deployed.

| Check                                               | Actual final result                                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Frozen install with Netlify hoisting configuration  | Pass, 448 packages; lockfile unchanged by install                                                      |
| `pnpm lint`                                         | Pass                                                                                                   |
| `pnpm typecheck`                                    | Pass                                                                                                   |
| `pnpm test`                                         | **69 passed**, 5 files                                                                                 |
| Development `pnpm test:browser`                     | **12 passed**, 4 production-only tests skipped                                                         |
| `pnpm build`                                        | Pass; root/manifest static, `/api/lab` dynamic Node route, generated build-specific worker             |
| Production `pnpm test:browser`                      | **16 passed**, no skips; desktop and 414 × 896 mobile Chromium emulation                               |
| Netlify CLI `build --offline --dry`                 | Pass; correct child config/base, automatic Next.js Runtime 5.16.0                                      |
| Netlify CLI `build --offline`                       | **Not passed**: application build passed, adapter function packaging failed on Windows symlink `EPERM` |
| Real Netlify deployment/CDN/hosted Blobs            | **Not performed**; user authorization required                                                         |
| Physical iPhone / native Safari / installed iOS PWA | **Not performed**; manual checklist supplied                                                           |

The browser harness started fresh local servers with `CI=true`; production additionally set `PW_PRODUCTION=1`. An existing dev server was not reused for offline checks. One production command exited without diagnostic output; rerunning through the known pnpm executable ran the suite normally.

## Added regression evidence

- Independent hosted-store instances concurrently record commands without loss; competing final submissions converge on one immutable result. Strong reads, bounded compare-and-swap retries, missing cloud context and false SDK write-success responses are covered.
- A full assessment receives 100/100 through the actual Blobs SDK against an ETag-aware **mock transport**. This validates the SDK/storage/engine contract, not a hosted Blobs deployment.
- The actual SDK local emulator writes data and retains it after restart. Its GET responses lack ETags; the test confirms that updates fail closed rather than silently weakening concurrency control. This emulator limitation remains unresolved upstream and prevents claiming a full Netlify-emulator assessment pass.
- API validation covers public HTTPS Host/Origin, malformed origins, unknown operations, JSON content type, bounded streamed bodies, forged evidence and immutable submissions. Error details are sanitized. Browser checks verify browser/CDN/Netlify no-store headers, manifest icons and absence of selected private-answer content in static JS/fresh assessment payloads.
- Worker tests cover immutable shell/asset pairing, excluded API/RSC/cross-origin/other-route requests, incomplete install rejection, explicit update activation and retaining the previous **complete** cache when an attempted install failed.
- Real browser update test changes only the generated local worker artifact, activates it using the UI, preserves existing command history, verifies no API cache entries, and reloads/runs practice offline. It restores the generated artifact afterward. This is a local simulated deployment update, not a Netlify rollout.
- Existing full playthroughs cover incident, PC/router diagnostics, evidence, diagnosis, deterministic feedback, repaired-network preview, reload/journal, timed assessment and offline practice. The repaired preview is also exercised offline.
- Final mobile investigation screenshot inspected: readable topology/device controls, confined terminal scrolling, no document-width overflow. No physical-device claim is made.

## Failures addressed and remaining limits

1. The first production run had 14 passes and two assessment-check failures. Investigation found a first-install worker could leave an incorrect waiting-update banner. The component now checks whether an existing controller is present and clears waiting state on controller changes. Regression asserts no banner after initial install or update completion; the full production rerun passed all 16 tests.
2. The dependency reinstall initially hit a Windows native compiler file lock from the old NetFault server; stopping that server allowed the install to pass. pnpm 11 then tried to switch dependency layouts on script invocation. Persisting the public hoist pattern and disabling its global virtual store in this project's workspace config corrected that mismatch. No sibling dependencies were changed.
3. The shared pnpm cache supplied a corrupt dependency to the ephemeral Netlify CLI. A current CLI installed in ignored `.netfault/netlify-cli` with a project-local npm cache worked. These are verification artifacts, not application dependencies.
4. Netlify's Windows adapter packaging failed creating a symlink even outside the filesystem sandbox. No OS security settings were changed and no application workaround was added to hide the failure. The hosted Linux build and first cloud assessment must still be checked. The source is prepared for that first deployment, **not certified as deployed successfully**.
5. Development logged transient React Flow container-size warnings during navigation; the rendered desktop/mobile topology and full workflows passed. No fatal page errors occurred in the tested practice workflow.

The simulator/scenario/grader and journal format were preserved. Changed implementation areas: `src/server/session-store.ts`, `src/server/sessions.ts`, `src/app/api/lab/route.ts`, `src/components/pwa-update.tsx`, workspace status/expiry retry handling in `netfault.tsx`, `scripts/service-worker.js`, and `scripts/build-sw.mjs`. Build/dependency changes: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.node-version`, `netlify.toml`, ignore files and lint ignores. Regression tests and README/AGENTS/architecture/iPhone/deployment documentation were added or updated. `public/sw.js` is now an ignored build artifact.

See [deployment instructions](NETLIFY_DEPLOYMENT.md) and [audit/plan](deployment-audit.md). The earlier report below is retained as historical Milestone 1 evidence, not a substitute for these new results.

---

# Milestone 1 verification report (historical)

Executed on Windows, 2026-09-19. Node 24.15.0, pnpm 11.19.0, Next.js 16.3.1, React 19.2.8, TypeScript 5.9.3, React Flow 12.11.6, Vitest 3.2.7, Playwright 1.63.0. Dependency versions are locked in `pnpm-lock.yaml`.

## Results

| Check                                       | Actual result                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm lint`                                 | Pass; no warnings/errors in final run                                         |
| `pnpm typecheck`                            | Pass, strict TypeScript                                                       |
| `pnpm test`                                 | **56 passed**, 3 files                                                        |
| `pnpm test:browser` (development)           | **10 passed**, 2 production-only offline tests intentionally skipped          |
| `pnpm build`                                | Pass; optimized Turbopack build, generated root and manifest, dynamic lab API |
| `$env:PW_PRODUCTION='1'; pnpm test:browser` | **12 passed**, no skips; production server and service worker                 |

## Covered behaviors

- Schema version and references; valid /24 and /30 addresses; rejecting duplicate IDs/addresses/router IDs, invalid host addresses, invalid gateway and absent link endpoints.
- All interface states, passive LANs, equal timers/MTU, explicit point-to-point network type, symmetric R1/R2 FULL/- and missing R2/R3 adjacency.
- Exact expected learned routes and costs in the faulted state. Broken and repaired connectivity, including forward delivery with a missing return route. After repair, every assigned interface address is reachable from every device in the model.
- Every advertised command runs deterministically, has state-consistent output, and validates destination inputs. Unsupported commands report their limit.
- Structured grading, partial credit, evidence identity, duplicate/fabricated evidence, incorrect endpoint sets, unacceptable repair, and ungraded notes. Progressive hint ordering.
- Versioned journal round-trip, updates without duplicates, notes/evidence/history retention, 100-attempt limit, corrupt data preservation and surfaced quota errors.
- Assessment persistence across a server module reload, concurrent command serialization, no initial answer keys, immutable final results, late-answer rejection and deadline finalization. Request-origin and input validation.
- Complete browser Practice: launch → PC configuration/ping → hint → four selected observations → diagnosis → 100/100 → repaired-state ping → reload → saved journal.
- Complete browser Assessment: timer → no hints or field guide → server-recorded observations → structured submission → final grade.
- Keyboard device selection, destination error display, partial-score submission, retry with empty evidence, and notebook empty state.
- Browser payload/static-JS scans for private scenario explanation, rubric labels and worked repair. API rejects nonexistent hint operations. Repeated submissions cannot change server feedback.
- **Real offline browser test:** install production service worker, cache pack/shell, disable browser network, reload, run diagnostics, collect evidence, grade the attempt and reopen its journal. Passed on desktop and 414px mobile emulation.

## Browser and visual QA

Microsoft Edge (Chromium) on Windows: desktop **1440 × 1000** and emulated iPhone 11 **414 × 896 CSS pixels**, device scale factor/touch settings from Playwright's iPhone 11 profile, Chromium browser override. Full-page screenshots of the lab bench and investigation were captured and inspected. Neither main page nor investigation had document-level horizontal overflow. The mobile topology was revised from a small horizontal chain to a readable serpentine path; the graph retains the same physical connections and neutral links. Accessible device controls remain available below it. Terminal content scrolls inside its panel.

Screenshots and traces are generated under ignored `test-results/`; the HTML report is under ignored `playwright-report/`. These are local QA artifacts, not checked-in source dependencies.

## Failures found and addressed

1. Shared pnpm store supplied a zero-filled Playwright manifest. A forced install with a project-local store and copy import completed successfully. No sibling project dependencies were changed.
2. Native esbuild was blocked by the filesystem sandbox; unit and browser/build processes were run with approved execution permissions. This was a tooling restriction, not a passing test result.
3. The initial Origin check compared the browser origin to Next's `0.0.0.0` bind URL and blocked valid app API requests. The check now compares Origin host against the actual Host header; a regression test proves both valid-local and denied-cross-origin cases.
4. A test initially searched for the exact standalone text `70`, but the score element also contains `/ 100`. Its assertion now checks the score component. The partial-grade behavior was correct.
5. Mobile visual inspection exposed tiny topology labels and an offscreen skip link appearing above the fixed navigation. Both were corrected, then browser tests reran successfully.

## Limits of these results

- **No physical iPhone, native Safari/WebKit, VoiceOver or installed-home-screen test was performed.** Use [the manual checklist](iphone-testing.md).
- No Windows firewall changes, certificate installation or HTTPS proxy were performed. Localhost's secure-context exception was used for automated offline testing. LAN HTTP is not equivalent to trusted HTTPS for PWA use.
- The network rules were reviewed against the primary references in [network correctness](network-correctness.md). **No actual IOS/Packet Tracer/CML/GNS3/physical lab was run.** Simulator tests verify this implementation, not IOS byte-for-byte output.
- Browser privacy settings/storage eviction and multi-process server writes are not fully tested. Local storage is intentionally inspectable. Self-assessment is not an authenticated or proctored examination system.
- Existing parent/sibling projects were not modified. NetFault is a new untracked directory in the existing parent Git repository; nothing was committed, pushed or deployed.
