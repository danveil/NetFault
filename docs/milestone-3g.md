# Milestone 3G implementation record

24 September 2026 — LAB 009, **The closed passage**. This separately authorized implementation follows the [23 September plan](milestone-3g-plan.md). No other lab or Academy module is added.

## Feasibility gate: passed before implementation

The existing source-aware request/reply traversal could accept a pure outbound source-policy check without replacing routing. LAB 008's bounded change history/replay could accept a second validated repair variant without replacing persistence. The public chain topology/inspector already supported four devices and destination/source inputs. Grading could reuse server history with a separate policy rubric. No dependencies, Netlify settings, session-store architecture or earlier authored scenarios needed changes. The extension was therefore limited to schema v8, ACL evaluation/attachment, one sequence-edit action and LAB 009 content/UI/tests.

## Evidence and scope

The earlier audit found `26.27_material.zip`; its SHA-256 is `F50841753A0D2AA476061BAADA3CDAB683F2BAB86FB2D8F1D6D083799F15205B`. The existing extracted `6.ACLrv.txt` and `10.MANAGEMENTrv.txt` were reread for the approved design. The [semester inventory](semester-2627-gap-analysis.md) retains original filenames, slide references, dates and visual-inspection limits. No additional source-slide rendering is claimed in this implementation. ACL sequential processing/source wildcards/attachment and management's baseline-change-verification process support this narrow investigation; they do not establish full practical completion or assessment requirements.

See [ACL model](acl-model.md) for exact addressing, expected flow matrix, Cisco references, diagnostics, safe sequence edits and recovery grading. The intended outcome is to distinguish a usable route from permitted forwarding, identify first-match order, and demonstrate both restored permission and retained restriction.

## Changes

- Core: `schema.ts`, new `acl.ts`/`acl-grading.ts`, `engine.ts`, `grading.ts`, `repair-trial.ts`, `preview.ts`; preserve all prior schema versions and LACP events.
- Content: new server-only `acl-scenario.ts`, registry and neutral catalog entry. Existing LAB 001–008 modules and Academy content are unchanged.
- UI: new structured ACL repair panel, diagnosis fields, recovery status, observation/history integration and saved diagnosis display. `topology.tsx`/`base.css` place LAB 009's controls clear of its four devices, with an automated overlap assertion. No drag interaction or full CLI editor.
- Tests: standalone model/scenario/grading/persistence tests, separate-store CAS test, five production browser workflows at each of desktop/414px/360px, plus shared all-lab offline address expectations and registry checks.
- Documentation: model/implementation record, plan status, source-gap update, architecture/authoring/correctness/roadmap, README/AGENTS and verification record.

No dependency, lockfile, runtime/deployment configuration, service-worker implementation or session-store changes. No commit, push, public deployment or Netlify credit use.

## Verification

Final results are recorded in [verification.md](verification.md). Production browser testing uses `CI=true` and `PW_PRODUCTION=1`, so the suite starts a production server rather than reusing a development server. Screenshots and automated touch-size/overflow assertions cover 1440px, 414px and 360px. These are local Chromium checks, not physical iPhone, Safari or VoiceOver acceptance.

During implementation, an exhaustive authoring-test version map needed the new ID; it was updated rather than weakening validation. Two unused-variable lint warnings were removed. The first targeted production run passed 15 assertions but its sandboxed server cleanup stalled, causing the next runner to reject the occupied port before running tests. Only the identified test-owned server was stopped; a normal-permission full run then passed all 131 tests. Screenshot review subsequently found LAB 009's zoom controls covering part of R2 on mobile. The scoped position fix and overlap assertion were added before the final rebuilt run recorded in verification.md. No old lab assertion was weakened to hide a regression.

Unperformed: real Cisco/Packet Tracer/CML execution, physical iPhone/Safari/VoiceOver, or live Netlify deployment. Prior user-reported iPhone acceptance remains attributed to the user and does not validate LAB 009.

## Try it

Run `pnpm dev` in the NetFault directory and open `http://localhost:3100`, then **Troubleshooting labs → LAB 009 The closed passage → Practice / Assessment → Start investigation**. Investigate addressing/routes and policy, preserve evidence, use **Diagnose → Test a configuration change**, then return to Inspect for fresh permitted and excluded-source probes. Submit the structured diagnosis and review feedback; open the worked repair only when ready. Reopen the saved attempt from Your journal.

For offline checks, stop development, run `pnpm build` then `pnpm start`, load the lab once online and wait for offline readiness before disconnecting. Assessment always needs the server. HTTPS is required on an iPhone for the production worker; see the existing iPhone and Netlify guides. No later milestone is started.
