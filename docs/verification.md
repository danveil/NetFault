# Milestone 1.5 verification report

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
