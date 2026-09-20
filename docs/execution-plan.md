# Milestone 2D execution plan

Scope: exactly LAB 005, The Silent OSPF Interface. Preserve LAB 001–004, saved journals, practice packs, server-backed assessment and Netlify compatibility. No deployment, account changes, commits, pushes or LAB 006.

1. Inspect AGENTS, existing schemas/engine/catalog/UI, persistence, server boundary and installed Next.js guidance. Establish a fresh baseline before editing: lint/type check, 157 unit/integration tests, production build and 40 production browser tests passed.
2. Verify passive-interface mechanics against official Cisco references. Preserve explicit point-to-point transit types and useful passive LANs; use all area 0 with only R2 Gi0/1 incorrectly passive.
3. Add the server-only v5 scenario and narrow repair. Reuse existing adjacency and passive-prefix routing algorithms; clarify command output without inventing transient protocol state.
4. Integrate the public catalog, structured device/interface/cause/evidence/fix/reason form, four hints, seven-part teaching and cloned repaired preview into the existing workflow.
5. Add scenario, forwarding, output, repair, grading, server-ownership and persistence tests, plus desktop/414px complete browser workflows and five-pack production offline checks. Run all required checks on the final implementation and resolve failures.
6. Update engineering, authoring, network, deployment and manual iPhone documentation. Record actual outcomes and remaining verification limits in [verification](verification.md); leave the result available locally.

The original milestone plan and its historical results follow.

# Milestone 1 execution plan

Scope: exactly one complete PC-A → R1 → R2 → R3 → PC-B OSPF investigation. Existing sibling projects remain untouched.

1. Inspect environment and installed Next.js guides (done: Node 24, pnpm 11, Next 16.3.1).
2. Initialize isolated strict TypeScript Next.js app, React Flow, Zod, Vitest, Playwright.
3. Model validated versioned scenarios. Derive adjacency, shortest-path routes, bidirectional connectivity and deterministic command outputs from configuration. Explicit point-to-point transit interfaces; passive LANs.
4. Implement practice and server-held timed assessment sessions. Structured diagnosis and evidence rubric; no hidden answer keys in assessment payloads. Practice pack downloaded explicitly, supports offline use; disclose inspectability.
5. Build responsive dark investigation workspace, topology and accessible device alternatives, inspector, evidence/history, hints, solution, journal/dashboard.
6. Implement local versioned persistence, export, manifest and production service worker. Cache shell and practice only; never assessment API responses.
7. Test schema, addressing, protocol/routing/connectivity consistency, command dispatch, grading, persistence, hints, API boundaries, full browser flows and mobile layout. Run lint, typecheck, tests and production build.
8. Document architecture, authoring, reference-based network review, security limits, Windows/LAN/HTTPS setup and physical iPhone checklist. No deployment, commits, additional scenarios or later milestones.

Acceptance: a learner can begin, gather observations, submit evidence and a diagnosis, receive deterministic feedback and reopen the saved attempt. Assessment answers are served only after final submission. Review is supported by Cisco documentation and RFC 2328; do not claim IOS/emulator validation unless actually executed.

## Completion record

Steps 1–8 completed on 2026-09-19. The lab passed full practice and assessment playthroughs on desktop and at 414 CSS pixels. Production offline reload, investigation, grading and journal review also passed. Lint, strict typecheck, 56 unit tests and the production build passed. See `verification.md` for the complete result matrix and honest untested-device/network limits. No later milestone was started.
