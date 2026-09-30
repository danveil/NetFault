# Milestone 3S — coverage consolidation

30 September 2026. **Three Academy modules; no new engine and no LAB 016.** The current-source [coverage matrix](management-qos-automation-coverage.md) records exact evidence, corrections, delivered skills, exclusions and one future management proposal. Verification is recorded separately in [verification](verification.md).

## Execution plan and outcome

1. Inspect the existing engineering contract, 3R baseline, Academy schema/revisions/progress and current 26/27 archive.
2. Read the three relevant decks/revisions, inspect selected native diagrams/screenshots and check practical/ExtraLab relevance; map concepts before extending content.
3. Reuse the Academy for seven short original lessons, tap-first guided/independent reasoning, seven diagrams and three optional companions. Keep operational simulation out of this milestone.
4. Add independent expected-answer, validation/persistence and production mobile/offline regression checks; run the complete existing lab suite.
5. Record partial coverage, future feasibility, remaining gaps and an explicitly approximate completion estimate; stop without committing or deploying.

The checkout already contained uncommitted, verified 3R work at intake. That work is preserved; the overall Git diff includes 3R and must not be described as wholly authored in 3S.

## Delivered learning package

| Module                                | Revision-1 lesson IDs / titles                                   | Activities and diagram                                                                              |
| ------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Network Management                    | `management-visibility` — Choose the evidence, then the tool     | Tool/object/baseline/notification reasoning; manager/agent/object relationships                     |
| Network Management                    | `management-events` — Put events in order and verify recovery    | Severity, configuration versus state, time, rollback and service proof; event-to-collector workflow |
| Quality of Service                    | `qos-experience` — Explain a poor call despite a working network | Delay/jitter/loss, buffering, congestion evidence and capacity; bottleneck relationships            |
| Quality of Service                    | `qos-treatment` — From classification to treatment               | Marking/models/layers, trust, shaping and proof; policy pipeline                                    |
| Network Virtualization and Automation | `virtual-platforms` — Separate the service from the hardware     | Service/deployment/hypervisor, shared failure and VRF; physical/virtual dependencies                |
| Network Virtualization and Automation | `sdn-control` — Follow a decision from controller to device      | APIs/planes, assurance and APIC responsibility; application/controller/device relationships         |
| Network Virtualization and Automation | `automation-requests` — Read a request before automating it      | HTTP/resource/data interpretation, scoped change and orchestration; review/apply/verify workflow    |

Each lesson contains simple explanation, an analogy with limits, technical detail, an original worked example, guided practice and a different independent activity. **14 exercises / 42 tap choices**, deterministic validation, meaningful feedback, retries and requested-only detailed solutions. No mandatory typing, drag-only action, external AI or actual automation request. Seven accessible local HTML/CSS diagrams illustrate roles and dependencies; they are not running protocol animations.

Three expandable original companions cover management device observations, platform-supported QoS inspection/measurement and authorized API request/verification. All are **UNEXECUTED**, bundled with the lessons for offline reading, and award no device-competence credit. Platform/version/permissions and actual outputs must be recorded if the learner later executes them. No full IOS/NETCONF/RESTCONF/Ansible environment is created.

Academy totals become **5 modules, 11 lessons, 22 exercises and 14 diagrams**. Published IPv4 revisions 1/2 and OSPF revision 1 remain intact. The four older Field Guide entries and all existing case-entry primers remain distinct from these counts.

## Architecture and files

- `src/lib/academy/operations-content.ts`: all new public source-grounded content; no private scenario imports or network calls.
- `schema.ts` / `content.ts`: optional course anchor, bounded `concept-map` descriptor, optional companion address table and registration. Existing schema version/revisions remain compatible; older companions still render their tables.
- `src/components/academy/academy.tsx` / `diagram.tsx`, `src/styles/base.css`: course-anchor display, responsive concept cards, companions without fictitious addressing tables, and no empty related-lab section.
- `tests/fixtures/operations-answers.ts`, `tests/academy-operations.test.ts`, `tests/browser/academy-operations.spec.ts`: independent fixtures, every alternative rejected, old/new progress coexistence, touch/navigation/resume/diagrams/offline coverage. The existing OSPF inventory assertion now scopes to its two pre-existing modules; a new whole-registry assertion protects the complete inventory.
- This record and the source matrix; README, AGENTS, coverage, gap analysis, roadmap, Academy and verification documentation.

**No dependency/lockfile, network engine, case revision, assessment storage, API contract or worker architecture changes in 3S.** Practice and public learning content remain inspectable. Academy stays hidden during an active Assessment; assessment remains online/server-owned/no-store. Existing service-worker build generation includes the eagerly bundled new Academy assets. No manual Netlify setting or environment variable is introduced.

## Try it

Use Node 24 and the repository's pnpm 11.19.0 lockfile, then `pnpm build` and `pnpm start`. Open `http://localhost:3100` → **Learn networking / Field guide → Academy home**. Explore any of the three new modules, open a lesson, choose answers through each step and check them. Reload and use **Continue lesson** to see saved progress. Request a detailed solution separately; inspect the relevant expandable UNEXECUTED companion.

For offline use, load the production app online and wait for **Available offline · Academy** before disconnecting and reloading. New lessons, diagrams, grading and local progress work offline; linked external references, real companion execution and Assessment require connectivity. On iPhone use trusted HTTPS for install/offline behavior; LAN HTTP is only an online UI check. Follow the existing [iPhone checklist](iphone-testing.md), including 414px portrait, touch targets, rotation, reload/resume and offline launch. Browser emulation is not a physical iPhone test.

## Boundaries and next decision

The matrix recommends only a **future bounded syslog severity-admission investigation**, requiring separate design/authorization. There is no real SNMP agent, collector, NTP clock, queue/timing engine, controller, automation runner or LAB 016. Network design/maintenance, advanced protocol variants, authentic device configuration and unfamiliar-topology transfer remain incomplete. The revised **~88% learning-support estimate** is a transparent planning judgment, with a broad uncertainty range and no device-mastery claim; see the matrix's rubric.

No commit, push, deployment, Netlify project change or deployment-credit consumption is part of 3S. Physical iPhone, Safari, VoiceOver, Packet Tracer, Cisco devices and live Netlify remain unverified.
