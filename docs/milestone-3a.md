# Milestone 3A execution record

Local-only authorization: readiness fixes, LAB 006, LAB 007, Academy architecture audit/planning. No LAB 008, Academy implementation, randomization, dependency upgrade, commit, push or deployment.

## Baseline and sequence

Started at clean commit `9e4b96b`. Compared against audited `ed95191`: only nine audit/documentation files changed; application source is unchanged. Read the 2E handoff, architecture, authoring, network correctness, persistence/assessment and verification documentation and installed Next route-handler guide.

Fresh baseline: lint/typecheck passed, **200 tests in 9 files**, production build `y5poIEMeRkebWiCl7G42h`, **48 production browser tests passed**, desktop and 414 × 896 Chromium. These are newly executed checks, not copied audit results.

1. Phase A: remove public repair-specific preview narration; reject empty evidence requirements in both schema and grader; derive the representative neighbor Dead Time from the interface configuration. Gate on full existing regressions and fresh asset inspection.
2. Phase B: complete timer mismatch lab and its network, grading, lifecycle, mobile and offline checks before starting LAB 007.
3. Phase C: complete installed wrong-next-hop lab with a real adjacent next hop and bounded forwarding loop, then verify its exact repair and lifecycle.
4. Phase D: inventory the four field-guide records and propose independently versioned Academy content/progress. Documentation only.
5. Phase E: combined lint, types, tests, build, production browser regression and final documentation.

## Phase A design

The preview now derives an exhaustive device-appropriate before/after diagnostic sequence from the explicitly loaded private practice pack. The public module contains no lab-specific branches, repair targets or narration. It uses the existing cloned repair and command engine, including fresh ARP history and request/reply journeys. Existing packs need no new fields; their content and revision remain unchanged. Private explanations still originate in server-only scenarios and finalized feedback. As before, users may separately request inspectable practice packs: this is self-assessment, not examination confidentiality.

Evidence requirement/device/command lists are nonempty at the schema boundary; the grader independently rejects empty alternatives/requirements, protecting even against malformed unvalidated data. Total evidence remains 30 and old rubrics are unchanged.

Dead Time is explicitly labeled a representative snapshot: floor(0.9 × configured Dead), formatted as hours/minutes/seconds. Thus 10/40 shows 36 seconds and 5/20 shows 18 seconds. No live timer or neighbor state machine was added.

The new privacy regression enumerates every production static JS asset and every authored private explanation, solution, hint, evidence label and lesson body across the catalog. It also restricts fresh assessment fields and public catalog/device fields. This improves coverage beyond guessed phrases but is not a formal proof against all semantic clues. Multiple-choice options and documented design intent remain public.

Phase A lint/typecheck passed; **211 unit/integration tests passed**. Production gate results are recorded below when complete.

Phase A gate: production build FGyjJwI7Wm4cewDomjRIW and **50 production browser tests passed**, with no skips/failures. LAB 006 began only after this gate.

## Phase B — LAB 006

Implemented schema-v6 timer profile repair and diagnosis fields, healthy three-router fixture with exactly R3 Gi0/0 changed to 5/20, server-only seven-part teaching, four hints, evidence grading and existing UI/mode integration. No adjacency algorithm change. Added explicit typed registry validation and resolvable fault-interface validation. Existing five scenario definitions are byte-for-byte unchanged.

Initial checks exposed a string-array TypeScript mismatch in the healthy fixture (fixed by parsing devices through the existing schema) and four catalog-size assumptions in historical tests. Legacy identity/version assertions now explicitly check the original five entries; persistence counts use the current catalog length. No network/grade assertions were removed. All **237 unit/integration tests**, lint and typecheck pass; production build `6OGn-QXnB2lUMQcJur7sM` succeeded. Browser gate follows.

The LAB 006 browser gate initially passed 26/28; both failures were the new offline test trying inspector buttons on the journal's deliberately selected Evidence tab. Corrected the test helper to select Investigate. No application/offline behavior was changed to hide the failure. Desktop and 414px inspection screenshots were reviewed: readable stacked mobile topology, accessible device buttons and contained terminal scrolling. Physical iPhone/Safari were not tested.

LAB 006 corrected browser rerun: **6/6 passed** (practice, timed assessment, all-pack offline on both desktop and 414px). The other 22 OSPF/privacy gate tests already passed on the same production build. Phase C began after this gate.

## Phase C — LAB 007

Implemented `next-hop-01` in schema v6 using a healthy static network before changing only R2's 192.168.30.0/24 next hop. Existing static installation, longest-prefix forwarding and loop guard are reused. The static grader adds explicit forward-route semantics and an observed-next-hop field; LAB 004 retains its existing rubric and reply semantics. Lint/typecheck/build passed; **258 unit/integration tests in 12 files passed**. Production build `kOp3U9cd5v9Gu1Ci2BRbP`; **14/14** LAB 007 and LAB 004 browser checks passed (desktop/414px, practice/assessment/offline). No skipped tests or failures at this gate.

## Phase D — Academy audit

Inspected `src/lib/lessons.ts`, the public field-guide renderer, private scenario-feedback lesson schema/rendering, navigation assessment lock and storage. Four inferred TypeScript records are separate content, but not a versioned module/lesson system. `docs/learning-academy-audit.md` documents inventory, nine proposed modules, schema/progress/revision and lab-link boundaries, reusable UI, phased pilot and acceptance criteria. No Academy modules or progress implementation was added.

## Phase E — combined verification and review

The first combined run passed lint/types, **266 tests in 13 files**, build `8NP4eJq9omWINYpLaJUWQ` and **62/62 production browser tests**. Final source review then found a renderer accuracy issue newly exercised by LAB 007: the generic trace formatter labeled a detected loop as `!H Destination unreachable`. A loop is not an inferred ICMP host-unreachable response. The renderer now labels loop/hop-limit stops as simulator diagnostics without inventing an ICMP error packet; hop responses still require a return path. Added assertions to the LAB 007 command test. This does not change forwarding, routes or old fault states. Final checks are repeated for the updated build.

Final corrected build **Y33CRbjf_mYfN4I6Mlcdl** passed production build/type generation; lint, strict typecheck and **266 unit/integration tests** passed. The full production rerun passed **62/62** (31 desktop and 31 at 414 × 896), with no failures/skips, including fresh asset privacy, all old labs, both new labs, offline cached completion, saved journals and worker update behavior. `git diff --check` passed. The original five scenario definitions, four Academy guides, storage/API/providers, service worker, dependencies and Netlify configuration were verified unchanged. No physical iPhone, native Safari, real IOS lab or hosted Netlify deployment was performed. No commits/pushes/deployments or later milestone implementation occurred.

Milestone 3A's implementation and local verification gates are complete. Open LAB 006 / LAB 007 from the local bench; if an older installed client offers Reload to update, use that control. Future hosted acceptance and the manual iPhone checklist remain explicitly unperformed, not blockers hidden behind local test results.
## Changed file inventory

Runtime, tests and documentation changed in this milestone (generated from the working tree; generated build/test/session artifacts are ignored):

- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `docs/engine-audit-probes.md`
- `docs/engine-audit.md`
- `docs/execution-plan.md`
- `docs/iphone-testing.md`
- `docs/multi-lab-plan.md`
- `docs/network-correctness.md`
- `docs/roadmap.md`
- `docs/scenario-authoring.md`
- `docs/verification.md`
- `src/components/netfault.tsx`
- `src/lib/catalog.ts`
- `src/lib/engine.ts`
- `src/lib/grading.ts`
- `src/lib/schema.ts`
- `src/server/scenarios.ts`
- `tests/gateway.test.ts`
- `tests/passive.test.ts`
- `tests/return.test.ts`
- `tests/vlan.test.ts`
- `docs/learning-academy-audit.md`
- `docs/milestone-3a.md`
- `docs/next-hop-lab.md`
- `docs/timer-lab.md`
- `src/lib/preview.ts`
- `src/server/next-hop-scenario.ts`
- `src/server/three-router-network.ts`
- `src/server/timer-scenario.ts`
- `tests/authoring.test.ts`
- `tests/browser/next-hop.spec.ts`
- `tests/browser/privacy.spec.ts`
- `tests/browser/timer.spec.ts`
- `tests/case-contract.ts`
- `tests/next-hop.test.ts`
- `tests/readiness.test.ts`
- `tests/timer.test.ts`
