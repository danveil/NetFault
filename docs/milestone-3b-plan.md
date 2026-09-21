# Milestone 3B execution and verification record

1. Inspect the Academy audit, existing workspace, persistence, PWA and installed Next.js guidance. Establish a fresh baseline.
2. Add a separate strict Zod content registry, deterministic structured exercises, and revision-aware local progress. Preserve the four guide bodies through stable reference IDs.
3. Author exactly three IPv4 lessons in Module 02, with seven-part teaching, source links and explicit conceptual scope.
4. Integrate reusable Academy components with the existing navigation. Preserve assessment navigation restrictions and saved practice drafts; lab links open mode selection only.
5. Verify the existing shell cache before claiming offline availability. Keep the worker and server assessment architecture intact.
6. Add validation, grading, persistence, navigation, offline and 414px regressions; run all checks and document actual results and limits.

No scenario changes, new labs, deployment, commits or pushes. Started from clean `6f2fbcc`. Fresh baseline on 2026-09-21: lint/typecheck/build passed, 266 unit tests passed, and all 62 production browser tests passed after stopping the identified old preview occupying port 3100. Implementation and final checks continued on 2026-09-22.

## Delivered

One Academy module, three complete IPv4 lessons and six structured exercises. The seven teaching parts, objectives, recommended prerequisites, primary-reference links, per-field feedback, explicit solution reveals, retries, drafts, resume, revision history and exports are functional. Four original guides retain their source bodies and reference links. Public lab links resolve against the existing catalog and open mode selection without fetching answers or starting an attempt.

Separate strict Zod content/progress schemas and deterministic Academy grading preserve the existing scenario model and lab grader. The existing practice-draft saves and assessment navigation guard are reused. Academy content stays in the eager public shell; offline status checks actual cached dependencies. The worker, API and Netlify storage architecture were not redesigned.

## Files changed

- New `src/lib/academy/schema.ts`, `content.ts`, `grading.ts`, `progress.ts`, `offline.ts`: validated public content, reference adapter, structured grading, revision-aware storage and honest cache availability.
- New `src/components/academy/academy.tsx`, `exercise.tsx`, `src/styles/academy.css`: reusable module/lesson/reference/progress views and touch-friendly exercise forms.
- Updated `src/components/netfault.tsx`, `src/app/globals.css`: integrate Academy navigation and styles, retaining the active-assessment guard and saved lab workspace.
- New `tests/academy.test.ts` and `tests/browser/academy.spec.ts`: schema, calculation, grading, revision, storage, navigation, offline, desktop and 414px coverage.
- New `docs/learning-academy.md` and this execution record; updated `README.md`, `AGENTS.md`, `docs/architecture.md`, `docs/iphone-testing.md`, `docs/NETLIFY_DEPLOYMENT.md`, `docs/roadmap.md`, `docs/verification.md`.

Verified unchanged against HEAD: all seven private scenario files, server registry/session reducer/storage, assessment API, networking engine, scenario schema, lab grading, public lab catalog, original guide bodies, troubleshooting persistence, worker source/build script, dependency manifest/lockfile and deployment configuration. No sibling project changes.

## Issues found and resolved during verification

- Next.js lint reserves the identifier `module`; new local variables were renamed. Strict tests use `unknown` mutations instead of `any` for deliberately malformed content.
- The first new browser run had four test failures: a desktop accessible name also contained the lab count, an alert locator matched Next.js's route announcer, and an assessment assertion raced the command response. Selectors were scoped and checks now wait for observable command output before comparing persisted history. The application assertions were retained.
- Source inspection caught an overly broad initial ARP scope statement. It now correctly distinguishes the conceptual example, LAB 003 PC-A's existing `arp -a`, and its absence from LAB 002.
- Final review preserved the original guide reference links and made retention-limit failures explicitly say when an action was not recorded. Module read counts consider the current revision, not historical completion.
- The local `pnpm exec prettier` shim was unavailable; the installed Prettier CLI was invoked directly without changing dependencies. No lint/type/build failure is waived.

## Final verification results — 2026-09-22

| Check | Actual result |
| --- | --- |
| `pnpm lint` | Passed; final source recheck passed |
| `pnpm typecheck` | Passed; strict TypeScript, final source recheck passed |
| `pnpm test` | **320 passed in 14 files**: 266 existing + 54 Academy tests; no failures/skips |
| `pnpm build` | Passed; build `XYkcOjJdN-KE6WUPqwPoB`; root remains static, `/api/lab` remains dynamic, production worker generated |
| `$env:CI='true'; $env:PW_PRODUCTION='1'; pnpm test:browser` | **72 passed**, 36 desktop + 36 at 414 × 896 CSS pixels; no failures/skips, 3.9 minutes |
| Seven-lab preservation | All 62 existing production browser regressions passed in the combined run, including complete practice/assessment, repair previews, journals, private-content checks and offline packs |
| Academy browser workflows | All 10 new desktop/mobile checks passed: three-lesson workflow, structured feedback/reveal, refresh/resume, neutral LAB 002 link, original guides, practice drafts/evidence, assessment guard/deadline/history, offline exercise/progress, corrupt storage/raw export |
| Responsive/accessibility | Desktop and 414px workflows passed; heading focus, visible keyboard outline and subnet-page overflow asserted; desktop/mobile Academy screenshots inspected |
| Repository checks | `git diff --check` passed; preserved-source diff check passed; no commit/push/deployment |

Initial failures and their corrections are documented above rather than omitted. Physical iPhone, Safari engine and live Netlify checks were not performed. Generated browser traces/screenshots/reports remain in ignored `test-results/` and `playwright-report/`.

## Scope and limits

This is public self-study practice. Answers can be inspected in client files. No Academy exam system or claim of mastery is introduced. Progress is local to this browser/origin; no sync/import UI, transactional multi-tab guarantee or historical lesson-body viewer is provided. Export before clearing site data, changing origins, rolling back or leaving an in-memory recovery session. At retention capacity, saving stops visibly instead of silently evicting revisions.

Offline use requires a completed production shell cache on localhost or trusted HTTPS; each lab additionally requires its downloaded practice pack. External references and assessment require internet. Numerical checks and primary RFC review were performed; no external router emulator, physical iPhone or live Netlify deployment was tested. No network-engine behavior was changed.

## Try it locally

From the `netfault` directory on Windows, run `pnpm build` then `pnpm start` (stop any other server on 3100 first). Open `http://localhost:3100/`, choose **Learn networking → Explore module → Open lesson 1**. Submit/retry, request a solution, mark reading separately, refresh and Continue lesson. Calculate the /26 in Lesson 2; follow Lesson 3's LAB 002 link and return without an unintended new attempt. Wait for **Available offline · Academy**, then disconnect and reload to test cached learning. `pnpm dev` is suitable for development but does not enable the production offline worker.

An iPhone on the same LAN can view the local app through the laptop's LAN address on port 3100 while the laptop is on; offline installation requires trusted HTTPS. Public use with the laptop off requires a separately authorized Netlify deployment. Follow the added [physical-iPhone checklist](iphone-testing.md). Recommended subsequent work is user review of this pilot followed, only if authorized, by a small Ethernet/local-delivery Academy pilot related to LAB 003.
