# Milestone 3K — Bounded HSRP and The shared exit

26 September 2026. Implementation authorized by the supplied 3K request. Intake was clean at `c0daa7c` (commit subject `lab 011`, containing the completed planning baseline). No commit, push, deployment, Netlify connection or deployment-credit use was performed by this work.

## Execution and decisions

1. Read repository/Next guidance, 3J contract, course audit/roadmap, prior gateway/static/STP correctness, Academy authoring, actual schema/forwarding/observation/trial/grading/store/UI/test code. Rechecked accessible course archive/deck hashes and prior native-text extraction plus the revision outline.
2. Feasibility re-check passed: next-hop resolution and local VIP delivery needed a bounded ownership extension, not a forwarding rewrite. Existing same-VLAN traversal, independent request/reply routing and versioned trials were reusable.
3. Added schema 10, a pure HSRPv2 model, virtual next-hop/echo/ARP integration, exactly one private scenario, structured trials, fresh-evidence grading, six-device topology and tiny primer. Kept all earlier scenario files/revisions, Academy content, storage architecture, worker architecture and dependency versions intact.
4. Added independent model and complete lab tests, then production browser workflows at desktop, 414px and 360px. Updated catalog/version and all-pack offline test fixtures while preserving previous assertions.

The [model record](hsrp-model.md) documents exact supported fields, eligibility/election rules, preemption and routing boundaries, virtual MAC/ARP epochs, commands, grading and excluded behavior. [3J's address/route design](milestone-3j-plan.md) was followed. R3's fixed return path remains via R1; no timed or failure-resilience claim is made.

## Files and architecture

New application modules: `src/lib/hsrp.ts`, `src/lib/hsrp-grading.ts`, `src/server/hsrp-scenario.ts`, `src/components/hsrp-repair.tsx`, `src/components/hsrp-primer.tsx`. Shared integration: schema, engine, repair trials, grading dispatch, scenario registry, catalog, session command execution, NetFault UI, topology and scoped CSS. STP's grader guard excludes the newly discriminated HSRP repair without changing its rubric.

New tests: `tests/hsrp-model.test.ts`, `tests/hsrp.test.ts`, `tests/browser/hsrp.spec.ts`. Existing authoring/readiness maps and timer/next-hop all-pack offline address fixtures include the new lab; Playwright includes HSRP in the 360px project. Documentation updates preserve prior milestone records as history.

No new dependencies or environment variables. No changes to `session-store.ts`, Netlify configuration, service-worker source/build architecture, package/lockfile, previous server scenario modules or Academy content. The existing build generates a new worker snapshot automatically. Raw export adds the new separate pack key; journal version stays 1.

## Verification

| Check                                                | Final result                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `pnpm lint`                                          | Passed; zero errors/warnings                                                                      |
| `pnpm typecheck`                                     | Passed                                                                                            |
| `pnpm test`                                          | 558 passed in 22 files; zero failures/skips; 4.38 seconds                                         |
| `pnpm build`                                         | Passed; final build `WQCgv1iDj4hpgR1OM5wLi`, generated worker and dynamic assessment API retained |
| Full production browser suite                        | 161 passed; zero failures/skips; 10.3 minutes                                                     |
| Final production HSRP/deployment/privacy browser run | 21 passed; zero failures/flaky results/skips; 97.25 seconds                                       |
| `git diff --check`                                   | Passed                                                                                            |
| Changed Markdown links/anchors                       | 212 checked; zero errors                                                                          |

The complete browser suite ran on build `gijl90jNZfyQGW568sc_g`. The only subsequent application edit corrected the desktop header's milestone label from 3I to 3K. Lint and production build were rerun, followed by all 15 HSRP workflows, four deployment checks and two privacy checks on the final build. Both browser commands used `CI=true` and `PW_PRODUCTION=1`, preventing reuse of a development server. The final HTML report confirms 21 expected outcomes and zero unexpected, flaky or skipped outcomes.

Practice, resumed timed Assessment, stale-evidence rejection, cached offline Practice and the unrelated primer were tested at desktop 1440px, mobile 414px and narrow mobile 360px. Investigation screenshots at all three widths and the narrow repaired preview were visually inspected; automated assertions also check touch targets, page overflow and topology control overlap. The full suite retains all ten older labs and Academy workflows. No physical-device result is inferred from Chromium.

Initial test corrections included the explicit public catalog allowlist, complete independent-fixture port fields/commands, a test that incorrectly expected physical ARP entries to remain identical when only virtual identity is invariant, and the test storage adapter's required removeItem method. Initial lint found two JSX apostrophes, which were escaped. A sandboxed targeted Vitest start could not read its configuration; the approved local rerun executed normally. These are not silently reported as passing initial runs.

## Open and exercise locally

```powershell
cd "C:\Users\afiq hakiki\Documents\ChatGPT\cs projects\netfault"
pnpm dev
```

Open `http://localhost:3100` → Troubleshooting labs → **LAB 011 — The shared exit** → Practice or Assessment → Start investigation. Read the approved design, inspect all six devices, compare host gateway and both member roles/configuration, apply a justified priority trial, collect new observations, select evidence and submit. Feedback distinguishes verified design from merely restored configuration. Open the worked explanation/independent solution explicitly, run the repaired preview and reopen the journal entry.

For offline testing, stop the development server, run `pnpm build` then `pnpm start`; complete the online production shell/Practice pack load before disconnecting and reloading. HTTPS or localhost is required for the worker; an iPhone using a laptop's plain LAN HTTP address cannot exercise full PWA installation/offline behavior. Follow [Netlify deployment documentation](NETLIFY_DEPLOYMENT.md) for a public HTTPS site independent of the laptop. No deployment was performed here. Assessment and external references require connectivity.

## Physical iPhone / external validation still pending

- On trusted HTTPS, inspect all six devices in portrait/landscape at normal and enlarged text. Distinguish physical `.10.2/.10.3` from virtual `.10.1`; scroll command columns without page overflow.
- Use the device selector and diagram by touch, check zoom controls, native priority menus, 44px targets and VoiceOver focus/labels. No dragging or mandatory typing is needed for priority/diagnosis choices.
- Preserve initial evidence, apply a wrong then valid trial, and check versioned ARP reset and fresh role/configuration/reciprocal delivery. Review feedback, explicit explanations and reopened changes/history.
- Reload a timed online assessment; confirm deadline/history survive with no hints/primer. After caching Practice, enable airplane mode, reload, finish the lab and reopen its saved result.
- Run an independently controlled Cisco/Packet Tracer/CML exercise before claiming authentic HSRP configuration or failover competence. No such device execution occurred here; no physical iPhone, Safari, VoiceOver or live Netlify test is claimed.

Stop after this milestone. No later lab or general FHRP simulator is authorized.
