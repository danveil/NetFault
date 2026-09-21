# Learning Academy: Milestone 3B

The Academy is a public learning experience alongside the existing seven troubleshooting labs. It adds exactly one module, **MODULE 02 — IPv4 Addressing and Subnetting**, and three revision-1 lessons: Understanding IPv4 Addresses; Subnets, Subnet Masks, and Local Networks; Default Gateways and ARP. Six structured exercises combine selection, decimal-number and IPv4-address fields. There is no new network simulator, lab, authentication system, external AI service or cloud progress store.

## Architecture and content identity

`src/lib/academy/schema.ts` defines strict Zod module, lesson, section, exercise, solution and public lab-link schemas. `content.ts` validates the authored registry at import, including during the production build. `grading.ts` handles deterministic field equality after input validation; its subnet calculator is a pure paper-calculation helper tested against explicit expected boundaries, not an alternate forwarding engine. `progress.ts` owns the separate storage schema and transitions. `offline.ts` checks the current page's actual shell resources. `src/components/academy/academy.tsx` composes catalog, module, lesson, references and progress views; `exercise.tsx` renders exercise forms and feedback. All are eagerly imported into the existing root client shell so the existing service worker captures their resources.

The registry rejects duplicate identities, invalid module membership/order, unresolved prerequisites, prerequisite cycles, missing or unordered teaching sections, duplicate exercise/field IDs, absent answers/solutions, invalid choices, unknown lab IDs and extra/private fields in public descriptors. Executable scope claims are not supported: the only scope declaration is `concepts-and-structured-practice`. This is structural validation, not natural-language fact checking; prose and references still require editorial review. No validator is hardcoded to the three lesson IDs.

The four original objects in `src/lib/lessons.ts` remain unchanged. A reference adapter supplies stable IDs (`addressing-gateway`, `physical-protocol`, `ospf-areas`, `routes-return-path`) and revision 1. Their original explanations, examples and paper exercises remain accessible through Field guide. They are not falsely counted as automatically graded Academy exercises.

## Teaching and correctness

Every lesson moves through simple explanation, mapped analogy with limits, technical mechanism, worked example, guided exercise, a different independent exercise, and detailed solutions after submission or explicit request. Prerequisites are recommendations, not locks. Objectives and source links appear alongside each lesson. Explanations are original and begin with familiar language.

The pilot verifies /24, /26 and /27 calculations using both binary examples and automated arithmetic checks. The usable-host formula is explicitly limited to ordinary /1–/30 subnets; /31 point-to-point and /32 are excluded. Address validity is distinguished from host suitability, network boundaries require a mask, and same-subnet addresses do not guarantee working Layer 2 delivery. Gateway examples distinguish the remote packet destination from the next-hop frame receiver. Ordinary routing does not rewrite the destination IP; NAT is outside this lesson.

Sources consulted during implementation: [RFC 791](https://www.rfc-editor.org/rfc/rfc791) for IPv4 address format; [RFC 950](https://www.rfc-editor.org/rfc/rfc950) for masking; [RFC 1122 §3.3.1](https://www.rfc-editor.org/rfc/rfc1122#section-3.3.1) for local/remote and gateway decisions; [RFC 826](https://www.rfc-editor.org/rfc/rfc826) for ARP; [RFC 3021](https://www.rfc-editor.org/rfc/rfc3021) for the /31 exception. These are reference reviews, not packet captures or external router-lab validation. Historical classful wording in older RFCs does not establish a modern host's configured prefix.

The illustrative Windows `arp -a` output is labeled conceptual. NetFault already offers `arp -a` only on LAB 003's PC-A; LAB 002 does not offer it. Academy teaching does not expand that command capability or simulate ARP packets, cache aging, DHCP, NAT, ACLs or VLSM allocation.

## Exercise feedback and requested solutions

Answers use known select options, whole nonnegative decimal numbers, or strict dotted-decimal IPv4. Outer whitespace is normalized; ambiguous leading-zero IPv4 octets are rejected with guidance. Numbers such as `0172` normalize as decimal numeric answers. Missing, invalid or unrecognized choices do not create graded submissions. There is no prose keyword grading.

Each field returns a concrete rationale, and each exercise includes stepwise reasoning and a common-mistake explanation. Valid submissions expose the solution and save the answers and feedback, whether correct or incorrect. A learner may instead choose **Show detailed solution**, which records an explicit reveal without creating a correct submission. Retries remain available and all submissions are retained within the documented limits. Only a first submission before feedback or a requested solution is labeled unaided; later correct practice is not retroactively unaided. Read, practiced, and completed exercise states are distinct and do not claim mastery.

Public practice answer definitions ship in the client bundle and are inspectable. Solution visibility is a learning aid, not confidentiality. This is not a new Academy assessment system. Existing timed lab grading, history, deadlines and Netlify Blobs compare-and-swap storage remain server-owned and unchanged.

## Progress, revisions and recovery

Storage key: `netfault.academy.progress.v1`. Existing `netfault.journal.v1`, active-attempt and all seven practice-pack keys are untouched. A progress record identifies module, lesson ID and lesson revision, with started/last-viewed/read/completed timestamps, drafts, exercise ID/revision, normalized submissions, feedback and explicit reveal timestamps. Resume selects the most recently visited known lesson. Marking a lesson read is explicit, not inferred from scrolling. Lesson exercise completion means all its exercises have at least one correct submission; it includes assisted practice and is not a mastery score.

Schema version describes the storage/content format. Content revisions identify immutable published teaching. When lesson content or an exercise changes, publish a new lesson revision (and increment the affected exercise revision) instead of rewriting the meaning of existing progress. Records for old revisions remain readable, visible in learning history and exportable; no old score is assigned to the new revision. The UI announces an updated lesson when an earlier revision exists. This pilot stores historical answers/feedback but does not ship a viewer for retired lesson bodies. Retain published source versions in repository history.

Read and parse existing storage before every write. Malformed or unknown-schema data is never overwritten automatically; show recovery guidance and offer **Export raw Academy data**. Quota/unavailable-storage failures show a visible warning and keep bounded new work in memory with **Export Academy progress**. Export before leaving the Academy or closing the page when a save warning is present. There is no destructive reset or import workflow in this milestone.

Limits: 100 lesson revision records; 500 submissions and 100 requested reveals per revision. At capacity saving fails visibly rather than silently deleting old history. Use one active learning tab: storage events refresh other open Academy views, but localStorage is not a multi-tab transactional database. Progress is per browser/origin, with no cross-device synchronization. Clearing site data or iOS storage eviction can remove it; use exports for backup.

## Navigation and offline behavior

Learn networking and Troubleshooting labs remain separate entry points. Public related-lab links contain only stable scenario ID and a neutral relationship, resolving displayed titles from the existing catalog. They open normal mode selection in Practice by default, never fetch a private pack or start an assessment by themselves. LAB 002 is linked from the gateway lesson. Switching from an active practice session preserves its saved commands, selected evidence and diagnosis draft; a different lab's entry leaves the prior attempt available in the journal. Ordinary navigation back to Troubleshooting labs returns to the current workspace without starting a new attempt.

The existing active-assessment navigation guard blocks the entire Academy, including reference guides. Navigation does not pause deadlines, discard histories or finalize attempts. Public learning content is still inspectable elsewhere; the guard is not a secure examination sandbox.

The existing production worker caches the root document and its static dependencies atomically. It is unchanged. Academy content is eagerly bundled with that shell, so an installed complete snapshot includes all three lessons and exercises. **Available offline** is displayed only when a controlling service worker and a complete shell cache containing every current-page static dependency are confirmed. Otherwise **Not yet cached** appears with instructions. Browser eviction can change this status; the view rechecks periodically. Production localhost or trusted HTTPS, successful cache installation and an online reload are required. Development mode and plain LAN HTTP do not guarantee offline use.

Academy reading, grading and browser progress work offline after caching. External source links and lab Assessment Mode require internet. Lab Practice Mode also requires each lab's explicitly downloaded pack. Assessment APIs remain excluded from the worker and retain no-store headers; no private session is added to a cache. No service-worker redesign, new route, environment variable, dependency, or Netlify configuration change is needed.

## Author another lesson after authorization

1. Choose an immutable stable lesson ID, owning module and explicit revision. Use a new revision when changing published material; never repurpose an old ID.
2. Write objectives and recommended prerequisites. Add the ID exactly once to its module's order, after same-module prerequisites.
3. Write the simple explanation, analogy with mapping/limits, detailed mechanism and worked example with intermediate calculations. Review against primary references.
4. Add guided and independent sections with structured exercises. Give each exercise/field a stable ID, revision, validated answer, feedback rationale and requested-or-after-submission detailed solution explaining mistakes.
5. Declare conceptual practice scope, source URLs and neutral public catalog links. Do not import private scenarios or claim unsupported executable behavior.
6. Validate the registry; test correct, wrong and malformed inputs, arithmetic, revisions and preserved old records. Test real lesson navigation, reveal/retry, refresh and offline use at desktop and 414px.
7. Run lint, typecheck, all unit tests, production build and the complete browser suite. Update authoring, verification and device-check documentation. Do not publish or expand the curriculum without authorization.

Recommended next Academy milestone (not implemented): a narrowly scoped Ethernet/local-delivery learning pilot connected to LAB 003, following review of this IPv4 pilot on the user's iPhone. Do not add the remaining eight curriculum modules automatically.
