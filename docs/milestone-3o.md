# Milestone 3O — Beyond the gate

Scope: exactly one bounded static one-to-one IPv4 NAT model, LAB 013 (`nat-static-01`, revision 1, schema 12), a tiny unrelated primer and an original **UNEXECUTED** device companion. All twelve earlier authored cases and published Academy revisions remain unchanged. No dependency, lockfile, Netlify configuration, environment variable, worker architecture or assessment storage architecture changes; no commit, push or deployment.

## Feasibility re-check and execution plan

**PASS.** Intake HEAD was `3e4a12d`, with the prior 3N documentation changes retained. Read the approved [feasibility](nat-feasibility.md) and [implementation contract](milestone-3n-plan.md), engine/schema/trials/grading/persistence, prior protocol boundaries, source/coverage records and installed Next client/server-boundary documentation. The existing forwarding seam can carry ingress/current addresses and actual delivery identity without a new route engine or transport/session store.

Plan executed: independent model tests and forwarding first; then schema/commands and one authored case; then strict repair/evidence grading and existing UI/persistence integration; then unrelated primer/companion, full regressions, screenshots and documentation. No lab-ID success flag or hardcoded diagnostic output was introduced.

The current-semester source evidence remains the 3N audit of `7.NAT.ppt`, `7.NATrv.txt` and relevant `ExtraLab.pptx` content. Rechecked extracted hashes during 3O: NAT deck `B5997A4BC159B3A6B2FA74B784D4F0CAADFEE53342411162A245D3F11A2EB339`, revision outline `0385FA2FA59683161D253B92629DD3590388A3C5295F2436A97048DAFFF3EB70`, ExtraLab `F1C3AD9F76B92481AB6AB409D8E63587DF6444935B8FDD0A255607C4FEEC4692`. The NAT outline was reread; source/native-slide/visual evidence and qualifications are retained in 3N. Cisco source review grounds transformation ordering and permanent-entry semantics. None of this establishes real device execution.

## Implemented behavior

The [model record](nat-model.md) defines the exact topology, addresses, forwarding pipeline, failure paths, commands, grading and exclusions. A→R1→R2→B uses correct addressing, gateways, roles and routes. Only R1's permanent mapping local member is wrong (.40.99 instead of A's .40.10); global 203.0.113.10 stays correct. An unmatched inside request goes out unchanged and cannot receive a private-address reply; outside initiation to the global translates toward unused .99. Both symptoms derive from the same fault.

`nat.ts` supplies strict bounds and pure transformations. `engine.ts` uses shared route/L2 delivery: outward routing precedes source translation; inward destination translation precedes routing. Original caller identity, mutable packet identity and actual delivered endpoint remain distinct. Reply generation uses the endpoint and addresses observed on delivery, and successful exchange validates the restored reply identity. No route, NIC address or global owner is manufactured by NAT.

`show ip nat translations` renders the configured permanent local/global pair even before traffic. The structured `nat-static-local` action changes only its local slot, preserving version/no-op/limit/replay/deadline/finalization semantics. `nat-grading.ts` authenticates selected original and current-version observations and verifies minimal recovery, retained topology/configuration, both translated initiation directions and positive controls. Repair alone is explicitly unverified without fresh evidence. Preview uses authored service targets, not an invalid private-address reciprocal probe.

The inspector retains command history/evidence, target input and convenient observed/design targets. Separate local/global address cards and selectors derive candidates from recorded observations. No correct value is preselected. A collapsible read-only global card shows the selected router’s recorded external representation while preserving it. The four-device topology uses existing responsive canvas and accessible device controls. The optional `static-nat-preparation-v1` card uses unrelated identities, a small boundary diagram, two tap choices, corrective feedback and requested solution reveal; it is hidden during active Assessment and creates no Academy revision. The [device companion](nat-device-companion.md) uses a separate network and blank evidence fields, marked UNEXECUTED.

## Privacy, persistence and offline behavior

The private scenario stays server-only. Initial catalog/incident are neutral; production static scans exclude authored wrong/correct mapping values and private answers. Requested diagnostics naturally reveal observations. Explicit Practice packs remain inspectable; this personal app does not claim exam secrecy against someone who downloads the same case in Practice.

Assessment remains online, server-owned and durable using existing local/Netlify Blobs/CAS architecture. Tests cover independent module reload, malformed actions, concurrent retries, expiry and immutable finalization. No route handler or storage backend change was needed. APIs retain no-store behavior and remain outside the service-worker cache.

Practice uses `netfault.practice.nat-static-01.v1`; production shell/pack caching supports offline investigation, trials, grading and reopened journal after successful initial online load. Raw exports include the new pack; older packs and v1 journals remain readable. Before rolling back to a build without schema 12, export and retain progress: older parsers can reject newer entries. Do not delete old progress to solve downgrade incompatibility.

## Verification and development findings

Final results: lint, typecheck, production build and diff check passed; **710 unit/integration tests in 27 files** passed; the complete production browser suite passed **191 tests across 18 files**, zero failures/skips/flaky. After the final read-only global-card display addition, a new build passed **17 focused NAT/privacy tests across 2 files**, again zero failures/skips/flaky, covering desktop/414px/360px. The full 191-test suite preceded that display-only addition. Exact builds, timing and intermediate findings are recorded in [verification](verification.md). The new model uses unrelated names/addresses so behavior cannot pass through a LAB-013-specific shortcut. Tests cover translation matching/order, both directions without session state, route/L2/gateway failures, endpoint/global ownership, schema guards, initial fault, minimal repair and bypass rejection, original/fresh/forged/stale evidence, limits, hints, persistence, server reload/CAS/deadlines and all old lab/Academy regressions.

During implementation, the shared authoring contract needed NAT's public service target instead of the private reciprocal address. An initial persistence test encoded version zero as an optional positive field; it now correctly omits that field. These were test/contract integration corrections, not relaxed grading. Final preview review also corrected reply narration to use the actual reply-generating endpoint's addresses and added a regression. The initial full browser attempt exposed an older default PC address assumption in next-hop all-packs coverage and was stopped for correction. The next complete run passed 189/191; desktop/mobile timer all-packs checks had the same assumption. Both tests now explicitly expect LAB 013’s .40.10 value; application output was correct. Repair-control checks were strengthened to require the visible form and a nonempty control set, with keyboard focus and dedicated before/after table screenshots. The desktop milestone label was updated to 3O. Historical intermediate failures are not counted as passing final results.

## Open and manually verify

From this repository run `pnpm dev` and open `http://localhost:3100`. Choose **Troubleshooting labs → LAB 013 — Beyond the gate → Practice or Assessment → Start investigation**. Inspect both PCs and routers, record original evidence, use Diagnose to trial the local mapping member, return to Investigate for fresh configuration/table/probes, then submit. Feedback, requested worked solution, repaired-network preview and journal use the existing flow.

For offline testing, stop the development server, run `pnpm build` then `pnpm start`, open Practice online and allow the shell/pack to cache, reload once, disconnect and reload again. A LAN HTTP phone connection supports ordinary online use while the laptop is running; installable/offline iPhone use needs trusted HTTPS. See [Netlify deployment](NETLIFY_DEPLOYMENT.md) and [iPhone checklist](iphone-testing.md). This milestone does not deploy or modify a hosted site.

Physical-device checklist: portrait and landscape; default and enlarged text; select every topology device; read original and corrected local/global entries; operate mapping/address selectors and optional numeric input; check keyboard focus and VoiceOver labels; select old/fresh evidence and understand version labels; verify both directions; complete and reopen both modes; cache/reopen Practice offline; confirm Assessment needs internet; verify an update preserves progress. No physical iPhone, Safari, VoiceOver, Packet Tracer, Cisco IOS/router or live Netlify execution is claimed.

## Files and limitations

New code: `nat.ts`, `nat-grading.ts`, private `nat-scenario.ts`, `nat-repair.tsx`, `nat-primer.tsx`. Shared changes are limited to schema/catalog/registry, forwarding/config output, trial/grading/preview dispatch, app/topology/CSS and browser-project selection. Tests add `nat-model.test.ts`, `nat.test.ts`, `browser/nat.spec.ts` and extend authoring/privacy coverage. Documentation adds this record, model and companion, updates README/AGENTS/current coverage/correctness/verification, and annotates the preserved 3N planning documents.

One permanent pair on the supported four-device chain is the implemented boundary. Dynamic NAT/PAT, pools, transport/session/timer state, proxy ARP, router-originated probes, NAT trace/error translation and mixed-protocol NAT cases remain excluded. NAT is not encryption or authentication, and a successful exercise does not establish full NAT or WIA2008 mastery.

## Working-tree inventory

The following 37 paths include the preserved seven-file 3N documentation work and this implementation. Generated build/browser artifacts are ignored.

```text
AGENTS.md
README.md
docs/architecture.md
docs/milestone-3n-plan.md
docs/milestone-3o.md
docs/nat-device-companion.md
docs/nat-feasibility.md
docs/nat-model.md
docs/network-correctness.md
docs/scenario-authoring.md
docs/semester-2627-gap-analysis.md
docs/verification.md
docs/wia2008-engine-feasibility.md
docs/wia2008-roadmap.md
playwright.config.ts
src/components/nat-primer.tsx
src/components/nat-repair.tsx
src/components/netfault.tsx
src/components/topology.tsx
src/lib/catalog.ts
src/lib/engine.ts
src/lib/grading.ts
src/lib/nat-grading.ts
src/lib/nat.ts
src/lib/preview.ts
src/lib/repair-trial.ts
src/lib/schema.ts
src/server/nat-scenario.ts
src/server/scenarios.ts
src/styles/base.css
tests/authoring.test.ts
tests/browser/nat.spec.ts
tests/browser/next-hop.spec.ts
tests/browser/privacy.spec.ts
tests/browser/timer.spec.ts
tests/nat-model.test.ts
tests/nat.test.ts
```
