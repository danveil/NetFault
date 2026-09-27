# Milestone 3M — The quiet desk

Scope: one bounded static port-security model, LAB 012 (`port-security-01`, revision 1, schema 11), small unrelated preparation card and an original **UNEXECUTED** switch companion. No later lab, Academy revision, dependency, storage redesign, commit, push or deployment.

## Feasibility and implementation

Recheck **PASS**. Intake was clean at `74441ac`. Read the [3L audit](lab012-feasibility.md), [approved design](milestone-3l-plan.md), current engine/schema/trials and installed Next client-boundary documentation. Rechecked the extracted current-semester LAN deck hash (`68244E49FBB26FCC38B7C5BC3FEF2F8243688943329CB934809AF0771FA6F4BC`) and Cisco's documented full-slot protect semantics. No new device execution is implied.

The existing next-hop seam supports directed ingress admission before successful resolution; no broad rewrite was needed. `peers()` stays topology discovery. New `port-security.ts` handles normalization, strict topology bounds, source equality, directed segment delivery and diagnostic formatting. Shared `forward()` checks request, reverse resolution and data delivery with segment-local Ethernet MACs. Old protocols remain unchanged.

The four-device topology and authored values follow 3L. Initial public title, card and incident are neutral; intended restrictions appear in the separately opened design brief. The sole fault occupies the PC-A edge's static slot with the wrong MAC. Initial PC-A local/remote probes fail but carrier/VLAN and the independent remote control remain valid. Correcting only that slot restores real modeled service. Detailed [model, outputs and grading](port-security-model.md) describe the boundaries.

Repair/grading reuse versioned events, server-owned replay, existing Netlify Blobs/CAS, immutable finalization and limits. Candidates come from recorded outputs, with no hidden answer preselection. Grading authenticates original and current-version evidence and rejects bypasses/stale observations. Retained exclusive admission is a configuration invariant, not an executed attacker probe. New ARP epochs mirror LAB 011 while retaining LAB 003 behavior.

The small preparation card uses different identities and VLAN 30, touch choices, corrective guidance and explicitly requested reasoning. It is hidden during active Assessment and adds no Academy content revision or progress namespace. The [external companion](port-security-device-companion.md) contains instructions and blank evidence fields only, marked UNEXECUTED.

## Privacy, persistence and deployment

The scenario module remains server-only. Initial assessment data contains no configuration key, private rubric or teaching; diagnostics disclose requested observations normally. Production static scans enumerate all private text and explicitly exclude both authored secure-MAC values. Public primer and catalog do not import the private case.

Practice packs remain intentionally inspectable; this personal learning app does not claim secure examinations against a user who downloads the same case in Practice. Assessment requires online server access. Cached production Practice and primer remain offline-capable using the existing worker generation architecture. New pack key: `netfault.practice.port-security-01.v1`; raw export includes it. v1 journals retain old entries and optional repair fields. Rolling back to a build that predates schema 11 can reject a journal containing LAB 012; export before downgrade, retain that export, and return to a compatible build instead of clearing older progress.

No dependency, lockfile, environment variable, Netlify configuration, route handler, storage format/backend architecture or service-worker architecture was changed. One demonstrated local Windows file-contention issue received a bounded atomic-rename retry; hosted Blobs/CAS is unchanged. No deployment or credit use occurred.

## Verification

Final verification passed: lint, typecheck, production build, 641 unit/integration tests in 25 files, and 176 production browser checks with zero failures, skips or flaky results. The final build is `3OgknbvmY-UYbNxsgRZbv`. Full evidence and intermediate corrections are recorded in [verification](verification.md). During development, the new catalog entry required a schema-version expectation and concrete gateway probes in the authoring contract; the strengthened evidence rubric was preserved. ESLint caught an unescaped apostrophe in primer JSX, corrected before final verification. Two full runs hit Windows `EPERM` replacing local session files, once in the new lab and once in the older next-hop lab; intervening full runs passed. The existing atomic write now retries only Windows EPERM/EACCES/EBUSY, at most four retries over 250 ms, without acknowledging failed writes. Five regression tests cover transient contention, bounded permanent failure, retained committed state and immediate failure for other errors. This is a local filesystem fix, not a demonstrated Netlify issue. The first focused browser run passed 12 and failed three overlap assertions; LAB-012-only topology control placement corrected the issue, then all 15 focused checks passed. Lab-specific evidence wording and the long security command button were also corrected before the final full production run.

The new model tests use unrelated identities, port numbers, VLAN and addresses. Case tests cover exact addressing, sole fault, actual forwarding/ARP, complete/wrong/stale/forged grading, minimal-repair invariants, normalization, limits, pack/journal round trips, reloaded assessments, expiry, API validation and cache controls. CAS tests use independent clients of a controlled remote-store contract fake; they are not live Netlify execution. Browser tests exercise Practice, Assessment resume, missing fresh evidence, offline completion and primer across desktop, 414px and 360px. Existing suites continue covering all earlier labs and Academy.

## Local use and manual device check

From the repository, run `pnpm dev`; open `http://localhost:3100`, then **Troubleshooting labs → LAB 012 — The quiet desk → Practice or Assessment → Start investigation**. Inspect PC and switch configuration, retain original evidence, apply a static-slot trial under Diagnose, return to Investigate for fresh verification and submit. Feedback, requested explanations, repaired preview and journal reuse the existing flow.

For offline verification use `pnpm build` then `pnpm start`, allow the production shell/Practice pack to cache, reload and then disconnect. LAN HTTP can be used for ordinary phone browsing while the laptop is running; installable/offline iPhone use needs a trusted HTTPS deployment as described in [Netlify setup](NETLIFY_DEPLOYMENT.md). This task does not deploy it.

Physical iPhone checklist: test portrait at default text size and enlarged text; tap every device; read MAC/interface/maximum/mode columns using console scrolling; operate repairs without a keyboard; verify focus, selected evidence and fresh-version labels; finish both modes online; reopen journal; cache and reload Practice offline; confirm Assessment requires connectivity; check update/reload preserves progress. Also check VoiceOver labels and orientation changes. No physical iPhone, Safari, VoiceOver, Packet Tracer, Cisco switch or live Netlify result is claimed.

## Changed-file inventory

37 files added or edited. No dependencies or lockfile changes. Earlier private scenario modules and Academy content are unchanged.

```text
AGENTS.md
README.md
docs/lab012-feasibility.md
docs/milestone-3l-plan.md
docs/milestone-3m.md
docs/network-correctness.md
docs/port-security-device-companion.md
docs/port-security-model.md
docs/semester-2627-gap-analysis.md
docs/verification.md
docs/wia2008-engine-feasibility.md
docs/wia2008-roadmap.md
playwright.config.ts
src/app/globals.css
src/components/netfault.tsx
src/components/port-security-primer.tsx
src/components/port-security-repair.tsx
src/components/topology.tsx
src/lib/catalog.ts
src/lib/engine.ts
src/lib/grading.ts
src/lib/port-security-grading.ts
src/lib/port-security.ts
src/lib/repair-trial.ts
src/lib/schema.ts
src/server/port-security-scenario.ts
src/server/scenarios.ts
src/server/session-store.ts
tests/authoring.test.ts
tests/browser/next-hop.spec.ts
tests/browser/port-security.spec.ts
tests/browser/privacy.spec.ts
tests/browser/timer.spec.ts
tests/local-session-write.test.ts
tests/port-security-model.test.ts
tests/port-security.test.ts
tests/serverless.test.ts
```
