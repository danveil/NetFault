# Milestone 3Q — bounded GRE and LAB 014

28 September 2026. Separately authorized implementation of the [3P specification](milestone-3p-plan.md), following its feasibility PASS. Intake was clean at `5531b84` (`lab 014`, containing the preceding planning work). Exactly one new case: **The path above**. The thirteen older authored scenarios, Academy revisions, dependencies, worker strategy, Netlify configuration and Blobs/CAS storage architecture remain unchanged.

## Feasibility re-check and engineering decisions

The existing shared route selection, physical peer/L2 traversal, explicit probe sources, actual delivered packet identity (from NAT work), versioned trials and server-owned sessions support a reusable GRE extension. No topology-ID success predicate, fake tunnel transcript, instant remote-peer shortcut or routing-engine replacement was needed. Independent fixtures passed before connecting the private case.

`gre.ts` validates the bounded pair and derives local state. `engine.ts` adds a physical-only RIB/L3 view and recursively reuses physical forwarding for outer transport with a separate bounded loop guard. The receiver is the actual delivered device, then a configured fixed-pair match permits continued inner forwarding. Replies are independent. Logical interfaces are not physical peers or MAC owners. Source/local routability controls local state; remote success is not a local up/up criterion. Details and private case arithmetic are in [gre-model.md](gre-model.md).

Schema 13 adds strict GRE, exit-interface overlay routes and a destination-only repair action. One shared EtherChannel validator's historical link-state guard now also permits schema 13; its switching behavior is unchanged. Show-route output supports an interface-only static route without printing an undefined next hop. Existing C/L/S/O preference and older schemas remain intact.

## Playable case and learning flow

PC-A — R1 — T1 — R2 — PC-B remains the physical path. R1 and R2 have an intended logical Tunnel0 relationship. R1's sole fault points its tunnel at reachable T1 instead of R2. Both physical source-aware destination controls work; actual wrong receiver matching prevents inner delivery. The corrected destination restores remote tunnel-IP and bidirectional PC exchanges without changing up/up or route tables.

Every device is inspectable. Router commands are interface brief, route table, running configuration and source-aware ping; endpoint routers also expose the bounded tunnel view. PCs have both ipconfig views and ping. No GRE trace or ARP command is offered. Output exposes only supported fields and explains omitted remote liveness, keepalives and statistics.

The diagram adds a reusable neutral `logicalLinks` capability: a dashed labeled arc above the desktop physical path and in a reserved mobile side gutter. The solid path, textual equivalent, device selector, zoom controls and inspector remain available. No fault coloring or address/repair binding is public. A transparent layout bound reserves the arc lane without representing another network device.

Target choices come from actual recorded observations; source choices are valid interface names. Repair/diagnosis address candidates also come from observations, without preselecting a correct value. Manual destination entry remains optional. A focused form edits one existing destination; a real edit increments configuration version, a no-op retains it. Wrong valid values and either observed endpoint are selectable.

Grading preserves the exact 3P rubric and separates unresolved, recovered-unverified and verified. Original evidence combines source-aware underlay controls, both endpoint configurations/local state and routes/failed service. Full recovery needs an applied invariant-preserving correction plus fresh current-version tunnel/route and reciprocal logical/PC probes. Source, target, text, scenario and version are authenticated by replay; source interface names accept the same case-insensitive spelling as the engine, alongside their equivalent IPv4 address. Choosing the answer, displaying up/up, applying the repair alone, old evidence or a bypass cannot earn full credit.

Private seven-part feedback connects simple purpose, bounded envelope analogy, mechanics, worked CLI, symptoms, complementary diagnostics and independent reasoning; solutions remain requested. The optional **Two layers, one journey** primer (`gre-preparation-v1`) uses unrelated Cedar/Maple values, two diagrams, tap choices, retries and requested reasoning. It is hidden during active Assessment and changes no Academy revision. The original [device companion](gre-device-companion.md) is **UNEXECUTED**.

## Privacy, persistence and hosting

Case configuration, fault, accepted correction, hint text, evidence parameters and private teaching stay in `src/server/gre-scenario.ts`. Public generic engine/controls permit inspectable downloaded Practice; this is self-assessment, not a secure examination against someone accessing Practice or source code. Initial Assessment sends no case answers. Server commands, history, repairs, deadline, final feedback, durable storage and conditional writes retain the existing architecture. No new endpoint, environment variable, dependency, paid service or hosting setting is introduced.

New pack key: `netfault.practice.gre-01.v1`. Version-1 journals keep source-aware observations, configuration epochs, trials, hints, notes and feedback. Raw recovery export includes the new pack. Legacy packs and Academy storage remain separate and readable. Export journal/Academy data before rollback to a pre-schema-13 release; old parsers cannot read new-case attempts.

Offline Practice requires an initial successful production shell load and explicit LAB 014 pack download. Then reload, diagnostics, repairs, grading, primer and journal work locally offline. Assessment, uncached packs and external sources require internet. Existing build-stamped worker snapshots and no-store API policy remain unchanged. No live Netlify site was modified, and no Netlify credits were used.

## Changed file map

| Area                                 | Files                                                                                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New deterministic model/case/grading | `src/lib/gre.ts`, `src/lib/gre-grading.ts`, `src/server/gre-scenario.ts`                                                                                        |
| Shared integration                   | `src/lib/schema.ts`, `engine.ts`, `etherchannel.ts` (schema guard only), `repair-trial.ts`, `grading.ts`, `catalog.ts`, `preview.ts`; `src/server/scenarios.ts` |
| New touch components                 | `src/components/gre-repair.tsx`, `src/components/gre-primer.tsx`                                                                                                |
| Existing UI integration              | `src/components/netfault.tsx`, `src/components/topology.tsx`, `src/styles/base.css`                                                                             |
| New verification                     | `tests/gre-model.test.ts`, `tests/gre.test.ts`, `tests/browser/gre.spec.ts`                                                                                     |
| Regression integration               | `tests/authoring.test.ts`, `tests/readiness.test.ts`, browser `next-hop.spec.ts`, `timer.spec.ts`, `privacy.spec.ts`, `playwright.config.ts`                    |
| New documentation                    | This record, `gre-model.md`, `gre-device-companion.md`                                                                                                          |
| Updated documentation                | README, AGENTS, architecture, authoring, correctness, verification, iPhone/Netlify notes, 3P history annotations and current coverage/engine/roadmap deltas     |

No package, lockfile, Next/Netlify configuration, session backend, worker source or Academy-content file changed. The production build regenerates the ignored worker as usual.

## Verification

See the dated [verification record](verification.md) for final executed counts, build identity, intermediate failures and screenshot review. Tests cover independent model behavior, exact one-field case recovery, immutable inputs, source/epoch evidence authenticity, bypass rejection, no-op/limits, persistence and separate server invocations, concurrent duplicate repairs, expiry/finalization, production privacy, offline updates and prior lab/Academy regressions.

No physical iPhone, Safari, VoiceOver, Packet Tracer, Cisco device or live Netlify validation is claimed. Vendor reference review and Chromium viewport emulation are separate from those checks. WAN/GRE/VPN remains only partially covered; IPsec, dynamic routing over GRE and all [model exclusions](gre-model.md#boundaries-and-privacy) remain outside this milestone.

## Open and manually verify

From PowerShell in the repository:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3100`, then **Troubleshooting labs → LAB 014 — The path above → Practice or Assessment → Start investigation**. For production/offline verification use `pnpm build` then `pnpm start` instead of the development server. Stop an existing server before starting another on port 3100.

On an iPhone 11, the Windows LAN URL requires a running laptop for local access. HTTP LAN access alone is not an installable/offline PWA secure context. Use a trusted HTTPS development setup or a separately authorized HTTPS deployment; see [hosting instructions](NETLIFY_DEPLOYMENT.md). This milestone does not publish the app.

Manual device checklist:

1. Open the current build online. Download LAB 014 Practice, inspect all five devices and confirm solid physical versus dashed logical paths and readable labels.
2. Use touch-only observation/target/source selectors. Scroll without accidental actions. Check visible focus/VoiceOver labels separately, including zoom and evidence controls.
3. Preserve original evidence, apply a wrong valid trial then the correction, and confirm old/new version labels. Select fresh reciprocal proof and submit.
4. Explicitly open teaching and repaired preview. Save/reload/reopen the journal and check sources, changes and feedback.
5. After complete caching, turn connectivity off and **reload**. Complete another Practice attempt and reopen it offline. Confirm Assessment is unavailable offline.
6. Restore connectivity, complete a timed Assessment with no primer/hints during the attempt, and verify saved final feedback. Test normal update/reload on a separately authorized release without deleting progress.

Stop at Milestone 3Q. No extra lab, module, commit, push or deployment is authorized.
