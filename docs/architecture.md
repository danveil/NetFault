# Architecture and boundaries

Next.js 16 App Router, React 19, strict TypeScript, Zod, React Flow, Lucide icons, CSS, Vitest and Playwright. No AI inference service is required. Netlify configuration uses automatic OpenNext and Blobs for hosted sessions; ordinary local use remains filesystem-backed. No public deployment has been performed.

## One source of network truth

Milestone 2A adds `gateway-01` through a server-only scenario registry, without changing the file/Blobs storage boundary. Schema v1 still reads original OSPF packs; v2 adds separate unnumbered access ports/VLANs and a host-gateway repair. The public catalog selects topology and per-device commands. A stored attempt's scenario chooses its server engine/rubric; later client input cannot switch it.

`scenarioSchema` validates addressing and references before a scenario can load. Authored interface configuration is the source; neighbor tables and routing tables are derived, not independently hardcoded. Every command invokes the same functions used by connectivity and the repaired-state preview. The two configured states are the authored fault and a cloned scenario with the accepted area repair. Simulated time does not change network convergence; outputs show a stable snapshot.

Adjacency requires live interfaces, active OSPF, equal areas, matching timers/MTU and explicit point-to-point type. Dijkstra per area derives intra-area OSPF routes. Connected/local routes take precedence; metrics accumulate outgoing costs. Forwarding uses longest-prefix match. Ping requires forward delivery and a return route to the selected source address. Router source selection uses the outgoing interface; PC source uses its configured interface. Trace shows forward hops only when a corresponding response can return; it does not implement per-probe TTL packets or latency.

This algorithm is intentionally bounded to these two labs. Layer 2 neighbor resolution traverses active access ports within one VLAN without adding an IP hop. The gateway lab's routers still use the existing healthy point-to-point OSPF model. It is not an implementation of LSDB flooding, broadcast adjacency elections, ABR summaries, virtual links, authentication, ECMP, redistribution, ACLs, ARP timing, MAC learning, trunks, STP or packet loss. Scenario validation and authoring requirements must prevent unsupported models from being presented as implemented.

## Client/server split

The initial page sends only a public catalog and option labels. Server-only imports prevent scenario data crossing into the client module graph by accident. The generic engine and generic rubric evaluator contain no private answer key. A learner explicitly starting practice downloads the full scenario from `POST /api/lab`, action `practice-pack`; it is validated again and cached locally.

Assessment `start` returns a UUID, start/deadline and empty history. `command` computes and records one observation on the server. `resume` retrieves the attempt without answers. `submit` accepts a Zod-validated structured diagnosis and grades only server-recorded evidence IDs. Finalization is idempotent; commands and revised submissions cannot change a finished attempt. `resume`, `command` or `submit` after expiry finalizes an unanswered zero-score attempt. Expiry takes priority over a late submission.

`session-store.ts` selects local JSON files for ordinary local runs, using temporary-file rename and a per-session promise queue within one Node process. On Netlify it selects durable site-scoped Blobs. Strong reads and ETag compare-and-swap writes re-evaluate concurrent changes, deadlines and finalization before retrying (up to eight conflicts). Never use several local processes sharing the file backend. Missing hosted credentials or ETags fail closed. The reducer and deterministic grader remain shared across both backends. No authentication is added. Inputs are bounded; same-origin browser requests check Origin against Host. Preserve Host through an extra HTTPS proxy. All API responses explicitly disable browser and CDN caching.

## Grading

For gateway lab 002, root cause/device/evidence still contribute 30/20/30. Repair contributes 10 for an accepted fix with the exact gateway and 10 for a structured on-link-router explanation. One selected PC-A configuration or route observation can establish the evidence requirement; fabricated IDs/other-device evidence cannot. The seven-part worked lesson is returned only at finalization. See [gateway lab](gateway-lab.md).

Root cause 30; exact affected adjacency endpoint set 20; evidence 30; accepted repair 20. Evidence rules live in the scenario, require specific command/device combinations and award each rule once. A configuration output from each endpoint contributes 10 each; neighbor-plus-route impact contributes another 10. Extra selected observations are allowed but do not earn extra credit. Free-text notes are not interpreted. Hints do not subtract score but are recorded. Revealing the solution marks the attempt as assisted.

## Persistence and offline behavior

Browser localStorage stores versioned attempts (including command text/output/time, evidence IDs, draft/final diagnosis, notes, hints, feedback and reveal flag). Updates replace by ID and retain the most recent 100. Parse/quota failures are visible and do not overwrite corrupt existing data; in-memory work can still be exported. No deletions happen automatically beyond the explicitly documented 100-attempt retention.

Pack keys are scenario-specific: the unchanged `netfault.practice.v1` for OSPF and `netfault.practice.gateway-01.v1` for the gateway lab. Both packs can coexist offline. Journal entries display their own lab title and restore that lab on reopen. No migration or new database is required.

The production build stamps the service worker with its Next build ID. Installation caches the shell dependencies and icons/manifest before committing the HTML. Root navigation is network-first with that immutable snapshot as offline fallback; other routes never poison it. Next static assets are cache-first. API and RSC requests are excluded. An update waits for explicit reload or all old tabs to close, retaining one previous generation for open tabs. Practice can run entirely offline with a cached pack. Assessment cannot: an outage does not pause its server deadline. A previous practice pack remains inspectable, so offline answer secrecy is impossible. Local progress is not independently verified proof of a grade.

## UX and accessibility

Neutral topology links never reveal the fault. React Flow supplies pan/zoom; device buttons provide an accessible alternative to nodes and remain full-sized on phones. Evidence consists of actual observed command outputs, not pre-written clues. Mobile navigation stays within the safe area, inputs are 16px on phones, controls have touch-sized targets, and terminal overflow is confined to the output pane. Feedback names rubric components and avoids mastery claims.
