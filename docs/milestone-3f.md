# Milestone 3F — feasibility and execution record

Feasibility gate **passed**, 22 September 2026, before application-code changes. Historical-materials-based roadmap — 2026/27 requirements unconfirmed. LAB 008 is available. One bounded LACP investigation is authorized; no additional Academy lesson is necessary. Existing IPv4 preparation links and neutral command guidance suffice.

## Inspected constraints and implementation plan

- Existing `peers()` traverses access VLAN ports; it currently treats every up member as an independent forwarding port. Replace only the new bundle's inter-switch traversal with one derived logical edge, while leaving all old scenarios on their existing path.
- Scenario v1–v6 require a PC gateway and five-device chain assumptions appear in topology/tests. Introduce schema v7 for a strictly bounded two-switch/two-host, same-subnet network with no gateway, one access port per host and two inter-switch members. Reject unsupported topologies/fallback rather than simulating STP.
- Model per-switch local group identity, two named members, LACP active/passive mode, access VLAN, speed/full duplex, administrative state and explicit standalone-disable policy. Derive physical availability, compatibility, member participation and operational group state. Group IDs are locally significant. One available compatible member may preserve connectivity; no throughput/hashing is claimed.
- Add only supported diagnostics, neutral public catalog/physical links, private scenario and structured diagnosis. Member commands/configuration are observations; initial public assets contain no authored operating mode or repair target.
- Existing repair preview is a canonical post-attempt view, not learner-applied configuration. Add bounded recorded repair actions and observation phases, replayed through pure state derivation. Server reducers own assessment changes and grade only server-recorded verification for the latest state. Reuse the existing durable Blobs/CAS store, expiry/finalization and request limits.
- Add model, schema, wrong-repair, grading, persistence, privacy and browser tests. Run all existing tests and production desktop/414px/360px/offline checks, then update this record with actual results. No deployment/commit/push.

## Source review and important qualification

Read native text from all 23 slides of the original `C:\Users\afiq hakiki\Documents\ant\Etherchannel.ppt` through read-only PowerPoint COM, with macros disabled. Slides 3–8 describe aggregation/compatibility; 14–16 LACP; 17–23 configuration/verification. No source images are copied into the app.

Checked the [Cisco Catalyst 9300 IOS XE 17.6 EtherChannel guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-6/configuration_guide/lyr2/b_176_lyr2_9300_cg/configuring_etherchannels.html), [Cisco EtherChannel troubleshooting](https://www.cisco.com/c/en/us/support/docs/switches/catalyst-9300-series-switches/220367-troubleshoot-etherchannels-on-catalyst-9.html), and vendor command references. The model explicitly requires `port-channel standalone-disable` on the port-channel interface. Without this policy, unbundled members may behave differently by platform; passive/passive failure alone must not be represented as universally implying loss of connectivity.

Lecture qualifications: slide 3's “will not be blocked by STP” is bounded by slide 6, which correctly explains that STP can block a redundant logical bundle. `on` on slide 15 is static aggregation without LACP, not a negotiating LACP mode. Slide 7/16 capacity/group-count limits are platform-specific, not universal. This implementation supports neither static/PAgP nor STP, standby selection, timers, packet exchanges, bandwidth or arbitrary switch topologies. It does not claim IOS/Packet Tracer equivalence or external execution.

## Final delivery and verification

Implemented one revision-1/schema-v7 case, LAB 008 **Across the connection**. The public learning objective is to compare physical members with logical operation, justify and apply a minimal trial, and verify recovery with fresh observations. This record intentionally omits the authored answer key; legitimate diagnostic observations and requested private teaching make it discoverable during play.

The extension uses pure carrier/member/channel derivation and one logical forwarding edge. Explicit standalone-disable prevents accidental independent member forwarding. Schema validation bounds the graph and rejects unsupported channel modes/fields/alternate paths. Same-subnet PCs need no gateway; this exception is restricted to v7. Existing seven authored scenario files and revisions remain unchanged. See [full model and diagnostics](etherchannel-model.md).

The new commands are switch `show etherchannel summary`, `show lacp internal` and `show interfaces port-channel 1`; status/VLAN/configuration and PC IP/route/ping/trace inspections are reused. Outputs are condensed steady-state educational views. Group-mode trials change real modeled state; all subsequent outputs and grades derive from the replayed events. Full credit requires a minimal repaired state and fresh selected verification, not merely the expected answer choice. Earlier observations retain their version. Final feedback/reopened journals expose configuration history, with detailed teaching and repair explicitly opened.

No Academy prerequisite was added. Existing IPv4 preparation and the neutral incident/design guidance suffice. All Academy lessons, exercises, revisions and Field Guides are preserved. No dependency, package/lockfile, Netlify configuration, Blobs store or worker-architecture changes. No commits, pushes, site changes or deployments.

### Changed files

- Engine/schema/grade: `src/lib/schema.ts`, `etherchannel.ts` (new), `repair-trial.ts` (new), `engine.ts`, `grading.ts`, `preview.ts`.
- Content and server integration: `src/lib/catalog.ts`, `src/server/etherchannel-scenario.ts` (new), `scenarios.ts`, `sessions.ts`, `src/app/api/lab/route.ts`.
- UI: `src/components/etherchannel-repair.tsx` (new), `netfault.tsx`, `topology.tsx`, `src/styles/base.css`. Parallel cables have neutral labels and a text equivalent; controls and versioned evidence remain usable on narrow screens.
- Tests: `tests/etherchannel.test.ts` (new), `tests/browser/etherchannel.spec.ts` (new), authoring/readiness contracts, next-hop/timer all-pack browser assertions and `playwright.config.ts` for 360px new-lab coverage.
- Documentation: README, AGENTS, this record, new `etherchannel-model.md`, architecture, scenario-authoring, network-correctness, iPhone checklist, verification, general roadmap and the five affected WIA2008 source/coverage/feasibility/roadmap/specification documents.

### Verification record — 23 September 2026

- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: **387 passed across 17 files**, zero failed/skipped. Includes 27 independent/new-lab tests, API validation/concurrency/finalization, schema rejection, old scenario contracts, grading and journal persistence.
- `pnpm build`: passed, final build `Q-j1MOMn7xgIhyAsTL2Zp`, generated worker and dynamic `/api/lab` retained.
- `$env:CI='true'; $env:PW_PRODUCTION='1'; pnpm test:browser`: final full run **115 passed / 1 failed / 0 skipped**, 116 total in 5.1 minutes. The sole failure was `browserContext.close: UNKNOWN: unknown error, write` during teardown of the existing mobile five-pack offline test, with no application assertion failure reported. All 12 LAB 008 cases passed across desktop, 414px and 360px.
- Same-build targeted rerun: `$env:CI='true'; $env:PW_PRODUCTION='1'; pnpm test:browser passive --project=mobile-chromium --grep 'five cached labs'`: **1 passed, 0 failed/skipped**, 14.5 seconds. Every browser case has a passing result across the final full run plus isolated rerun; this is not represented as one uninterrupted 116-pass run. No outstanding reproducible failure remains.
- `git diff --check`: passed. Desktop and narrow/mobile screenshots were inspected; diagram label/control overlap regressions are asserted. All seven earlier authored scenario modules, Academy content, dependencies/lockfile, deployment settings, Blobs store and worker source are unchanged.

Initial infrastructure: sandboxed Vitest could not read esbuild's parent directory and ran zero tests; the approved normal-access rerun passed. Intermediate type-check issues for registry/version entries and React Flow edge inference were corrected. The initial focused production browser run passed 9/9. The first complete run passed 111/113: two viewport instances of the old next-hop all-pack test assumed every PC-A used the original subnet. Corrected the per-lab expected address; timer's equivalent assertion was also updated. This was an obsolete test assumption, not failed offline forwarding. Visual review caught overlapping member labels at 360px; labels were shortened without losing the full text alternative and new-label separation is now checked automatically. A wrong-diagnosis requested-solution browser regression was added.

The next complete run passed 113/116. Its three failures were the new wrong-diagnosis test using a substring locator that matched three explanation panels. Replaced that locator with an exact label; no solution-visibility application change was needed. Final visual refinement places the new graph's zoom controls horizontally to avoid covering switch nodes, with non-overlap assertions. The displayed milestone now reads 3F.

That new geometry assertion then detected a real desktop control/node overlap: 115/116 passed. Corrected the new diagram only, placing desktop controls in its empty lower-left area while keeping mobile controls above the nodes. All earlier lab and Academy tests passed in this run; final-build results supersede this intermediate failure below.

The final full-run counters and teardown error were recovered from Playwright's saved report after its terminal session had ended. The isolated rerun above passed without application changes. No physical Safari/VoiceOver, iPhone or live Netlify evidence is inferred from Chromium results.

### Local opening and remaining acceptance

From this repository run `pnpm dev`, or `pnpm build` then `pnpm start` for the production worker. Open `http://localhost:3100`, select **LAB 008 → Practice or Assessment → Start investigation**. Collect baseline observations, use **Diagnose → Test a configuration change**, return to Inspect for fresh verification, select supporting outputs, and submit. The journal retains both observations and changes. Offline Practice needs a completed initial production shell and pack download; Assessment needs connectivity.

No Packet Tracer, CML, IOS hardware, physical iPhone, Safari or VoiceOver execution was performed. Vendor documentation review establishes the intended bounded rules, not device equivalence. Follow the new [physical-device checklist](iphone-testing.md) on trusted HTTPS. Live Netlify deployment is untested in this milestone and was not authorized. STP, trunk behavior and the full EtherChannel chapter remain incomplete; current 2026/27 WIA2008 requirements remain unconfirmed.
