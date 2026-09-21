# Learning Academy architecture audit and proposed expansion

Milestone 3A, local source inspection on 2026-09-21. **Planning only:** no Academy modules, new learning persistence or unlock system implemented. This plan requires separate authorization. The existing four guides and all saved troubleshooting attempts remain unchanged.

## 1. Existing architecture

The navigation calls this area **Field guide**, with “Understand what you observe” and a hardcoded “Four connected ideas” introduction. `src/lib/lessons.ts` exports an `as const` array of four authored objects. `src/components/netfault.tsx` imports that array and maps it to `<details>` panels with seven fixed sections: simple, analogy, technical, example, symptom, guided, exercise. Keys use display titles. Content is separate from JSX but hardcoded at build time, public in the client bundle and implicitly typed by inference. It is **not** generated from scenarios and is not yet a validated module/lesson system.

There is a second teaching mechanism: private scenario modules contain optional `lesson` arrays of `{title, text, revealOnRequest?}`. The scenario/feedback Zod schema validates their shape. The grader returns them with finalized feedback; practice gets them through the explicitly downloaded pack. The feedback renderer displays ordinary parts as sections and requested solutions as initially closed `<details>`. Their reveal state is presentation, not confidentiality after delivery. New LAB 006/007 use this existing mechanism.

Field-guide navigation and journal viewing are blocked during an active assessment in the current workspace. That is a learning-mode guard, not a security boundary: public guide source and separately obtainable practice packs remain inspectable. Assessment history, deadlines and grading stay server-owned. The guide has no independent saved completion state; `src/lib/storage.ts` stores attempts and practice packs only.

## 2. Current guide inventory

| Guide | Current coverage | Gaps / expansion implications |
| --- | --- | --- |
| 01 Addressing & the default gateway | Local/remote decisions, /24 and /30 examples, ARP next-hop concept, symptom and exercises | No systematic binary/prefix progression, subnet calculations or assessed addressing sequence; guided target is tied to the original OSPF topology |
| 02 Physical state & protocol state | up/up versus adjacency; connected routes and diagnostic comparison | Short concept guide, not media/encapsulation or a physical troubleshooting curriculum; model uses one combined up flag |
| 03 OSPF areas, neighbors & network types | Area agreement, router/process IDs, explicit point-to-point, passive LANs, broadcast election explanation | Mentions concepts beyond executable scope; no LSDB/SPF walkthrough or staged OSPF curriculum |
| 04 Routes, evidence & the return path | C/L/O, distance/metric example, longest prefix, return/source considerations | No full static routing course; examples still describe the original lab and fixed cost 1 rather than all seven labs |

Each has an analogy with limitations and a noninteractive exercise. None has an independent answer record, rubric, stable ID, prerequisite, duration, source metadata, revision or explicit many-to-many lab links. Titles numbered 01–04 are presentation, not a final curriculum contract.

## 3. Content-system limitations

- Two small content shapes serve different purposes: public reusable guides and private case-specific feedback. Combining them blindly would leak assessment answers or duplicate lesson content.
- Four fixed renderer sections and free-text guided instructions do not express nested module navigation, prerequisites, interactive exercise types or requested answer delivery.
- No guide-specific persistence, evidence of completion, revision identity, resume location, export or migration. Existing troubleshooting scores cannot be relabeled as concept mastery.
- Titles as keys are unstable under editing/renaming. The scenario revision is currently fixed at 1 and attempts resolve by scenario ID; freeze published lab content until immutable revision handling is separately implemented.
- The engine is bounded: static IPv4, access VLAN paths, directly linked static next hops and steady-state intra-area point-to-point OSPF. It does not simulate DHCP, DNS, ACLs, NAT, trunks, STP, ABR summaries, DR elections, packet-level LSDB flooding or authentication. Concept lessons may explain these, but must label text exercises versus executable features accurately.

## 4. Proposed curriculum

Two entry points: **Learn networking** (structured concepts independent of incidents) and **Troubleshoot networks** (the existing lab library). Both may suggest the other without interrupting or revealing active assessment answers.

| Module | Proposed lesson progression | Links / executable scope today |
| --- | --- | --- |
| 01 Networking Fundamentals | Hosts/links, packets versus frames, layered communication, encapsulation, protocols and evidence | Preparation for all labs; conceptual packet examples, not packet capture emulation |
| 02 IPv4 Addressing and Subnetting | Binary masks, prefix/host range, subnet calculations, local/remote decision, gateway and ARP | LAB 002; also host observations in all labs. No LAB 008 implementation |
| 03 Ethernet Switching and VLANs | MAC forwarding, broadcast domains, access membership, VLAN design; later trunks/STP | LAB 003 uses access VLANs only; trunk/STP teaching initially conceptual |
| 04 Static Routing | Connected/local/static entries, longest prefix, next-hop resolution, source/return paths, loops | LAB 004 and LAB 007; recursive routes/ECMP beyond simulator scope |
| 05 OSPF Fundamentals | Purpose, Hellos, neighbor/adjacency distinction, LSAs, LSDB, SPF, route selection | LAB 001/005/006 apply a bounded steady-state model; no claim of packet-level database exchange |
| 06 Advanced OSPF | Areas/backbone/ABRs, DR/BDR, passive behavior, Hello/Dead, cost/path choice and troubleshooting | Passive/timers are executable; ABR and election lessons require conceptual exercises or separately authorized engine work |
| 07 Network Services | DHCP, DNS, NTP, management/observability and troubleshooting | Proposed conceptual content; these services are not currently simulated |
| 08 Network Security | Segmentation, ACL reasoning, management access, authentication, NAT distinctions | Access segmentation links to LAB 003; ACL/auth/NAT operation is not implemented |
| 09 Troubleshooting Methodology | Scope symptoms, baselines, hypotheses, choose discriminating observations, minimal change, verify both directions, journal | All labs; recommendations based on practice evidence, not automatic mastery claims |

Prerequisites are transparent recommendations first: fundamentals → IPv4/Ethernet → static routing/OSPF → advanced topics. Methodology should be available early and revisited. Do not force a “completed” click to unlock self-study unless a concrete future requirement supports it.

## 5. Proposed lesson structure

Stable lesson identity and objective; prerequisites and estimated effort labeled editorial, not measured. Then: (1) simple explanation, (2) analogy plus explicit limits, (3) detailed mechanism, (4) worked addressing/configuration/command example, (5) guided hands-on or clearly labeled paper exercise, (6) independent structured exercise, (7) requested solution with rationale and verification. Symptoms and diagnostic choices should be integrated in examples and practice. Include supported-simulator scope, sources and relevant lab links.

Use the existing typography, accessible controls, terminal `<pre>` presentation, collapsible solution pattern and navigation shell. Extract a small reusable lesson renderer from the current guide/feedback presentation only when implementation is authorized. Keep the device inspector/React Flow/engine inside labs instead of duplicating a simulator inside every lesson. Do not make one enormous JSX page or build a general content editor/plugin framework.

## 6. Recommended content schema

Use a separate Zod-validated Academy schema because its identity, revision, prerequisites, objectives and progress differ from a scenario. Suggested authoring model (proposal, not implemented types):

```text
Module: schemaVersion, id, revision, title, overview, orderedLessonIds
Lesson: schemaVersion, id, revision, moduleId, title, objectives,
        prerequisiteLessonIds, sections, exercises, relatedLabs, sources, scope
Section: kind (simple|analogy|technical|worked|guided), body, optional code/example
Exercise: id, revision, prompt, inputKind, choices/ranges, solutionPolicy
PrivateExerciseKey: lessonId, lessonRevision, exerciseId, acceptedAnswer, rationale
LabLink: scenarioId, relationship (prepare|apply|reflect), neutral linkLabel
```

Validation must reject duplicate/unresolved IDs, prerequisite cycles, missing required teaching sections, unknown exercise kinds, absent lab IDs, accidental private fields in public descriptors, and unsupported mechanism claims. Start with structured selection/numeric inputs and deterministic grading. Optional prose is a journal reflection, never an implied LLM assessment. Published records are immutable; new revisions do not overwrite old keys.

Public conceptual materials can be static/offline. Independent practice solutions may be explicitly downloadable and disclosed as inspectable, matching current practice policy. If a future Academy assessment needs server-owned answers, use a separately designed server endpoint/store contract and return feedback only after submission; do not embed its answer key in the lesson bundle. A closed `<details>` alone cannot secure an answer. No new assessment architecture is authorized here.

## 7. Learning progress and revision strategy

Introduce an independent namespace, e.g. `netfault.academy.progress.v1`, leaving `netfault.journal.v1`, active attempt and all practice keys untouched. Progress would reference immutable `{lessonId, revision, exerciseId, exerciseRevision}` plus started/lastViewed/completed timestamps, submitted answers, explicit reveal use and feedback. Track “read”, “practiced” and “completed this exercise” separately. Do not infer mastery from scrolling or one result.

A content revision retains earlier progress under the original revision and can display “new revision available”; do not silently credit or invalidate new work. Store referenced immutable exercise feedback or retain its revision resolver. Schema version indicates format compatibility, content revision indicates changed teaching. Parse records without overwriting corrupt/unknown data; provide raw export and visible recovery states. Bound retention explicitly, test quota errors and do not migrate troubleshooting attempts into Academy records. No cross-device sync/auth service is necessary for the first local progress version.

## 8. Lesson-to-lab links and confidentiality

Many lessons may link to one lab and one lesson may link to several. References use stable scenario IDs and neutral labels; only public catalog metadata resolves card titles. Suggested lessons can appear before practice or after assessment completion. A link opens the lab bench/mode choice, not a private pack or solved attempt. Never place fault devices, accepted repairs or evidence labels in link metadata.

Before implementation, define navigation behavior when an attempt is active: save practice drafts, preserve assessment deadlines/history and retain the existing active-assessment guide restriction. Returning from a lesson must not start a new attempt implicitly. Completed assessment feedback may suggest concepts without unlocking another attempt's solution. Offline navigation should show which lesson/lab packs are actually cached; assessment still requires internet and an outage never pauses its deadline.

## 9. Separately authorized implementation phases

1. Foundation and one small pilot: stable schema/catalog, separate lesson renderer/navigation, migrate the four guide records without rewriting their meaning or pretending the full curriculum exists. Retain the field-guide entry route and labels while introducing Learn/Troubleshoot separation deliberately.
2. One coherent pilot module, preferably IPv4/local-versus-remote/gateway: requested solutions, a few deterministic exercises, independent progress/export, and neutral LAB 002 links. Review teaching before expanding scope.
3. Expand static routing and OSPF using the existing seven labs; extract genuinely shared explanations while preserving case-specific private feedback. Add immutable scenario revision handling **before** changing previously published lab states.
4. Add conceptual services/security/advanced protocol modules only under separate content authorization. Any executable DHCP/ACL/trunk/ABR work needs its own engine design, validation and test gate; it is not an automatic side effect of curriculum approval.

## 10. Acceptance criteria for the first Academy expansion

- Agree one explicit pilot module and bounded lesson count; no automatic nine-module content dump.
- Validate stable module/lesson/exercise IDs, references, prerequisites, all seven parts, source/scope declarations and immutable revisions.
- Learn and Troubleshoot remain independently useful; lab links open neutral entry points without answer leakage or losing an active attempt.
- Reuse accessible responsive presentation; test 414px, keyboard/focus, answer reveal, resume, storage errors and honest progress wording.
- Prove old troubleshooting journals/packs remain readable and byte-preserved; new Academy progress has independent keys and tested revision behavior.
- Cache selected public lessons and explicitly acquired practice content only; verify offline read/practice and continued exclusion of assessment APIs.
- Keep any graded assessment answers server-owned, with fresh production asset/API boundary checks. State practice inspectability honestly.
- Run all seven-lab regressions plus pilot tests, lint/typecheck/build and production browser/offline workflows. No physical-device or hosted-deployment claims without performing them.

This milestone only delivers this audit. `src/lib/lessons.ts` and its four public guide bodies have not been expanded or replaced.
