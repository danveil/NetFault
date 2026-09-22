# WIA2008 evidence inventory — Milestone 3D

**Provisional audit, 22 September 2026. Current-retake coverage cannot be certified.** The app was inspected directly. One official **2024/2025** UM handbook entry was inspected, but no current-semester outline, lecture collection, original practical sheets or marking instructions were accessible. This is a repository audit with a historical official course baseline, not a complete syllabus audit.

The learner reports acceptance of 3C's reading and touch experience. This is user-reported product acceptance, not a new physical-iPhone, accessibility or learning-outcome test by this audit. No application code was changed. The working tree already contained the accepted, uncommitted 3C changes; these are not 3D changes.

## Deliverable index

1. **Sources and limitations:** this document.
2. [Coverage matrix and actual app inventory](wia2008-coverage.md).
3. [Engine capabilities, commands and feasibility](wia2008-engine-feasibility.md).
4. [Dependency-based completion roadmap](wia2008-roadmap.md).
5. [Proposed next implementation scope](wia2008-next-milestone.md).
6. [Course-focused release checklist](wia2008-release-checklist.md).

All future work in these documents is a **proposal**, not implemented functionality or authorization. Earlier nine-module plans and suggested LAB 008 topics are not evidence of course requirements.

## Search and inspection method

Repository root: `C:\Users\afiq hakiki\Documents\ChatGPT\cs projects\netfault`.

- Inspected repository documentation, `src/`, relevant tests and file inventory. Searched for PDF/PPTX/DOCX/Packet Tracer/archive materials, excluding dependencies, builds and test reports: none found.
- Enumerated immediate project/course-folder names to locate plausible sources, then searched filenames under `C:\Users\afiq hakiki\Documents\uni`, `C:\Users\afiq hakiki\Documents\uni degree`, and `C:\Users\afiq hakiki\Documents\ant appeal` for WIA2008/2008, ANT, network, EtherChannel, OSPF, workbook/mastery, chapter and lab identifiers. No matching course source was found. This is a bounded negative search, not proof that the files do not exist elsewhere. Personal administrative documents were not opened.
- Did not scan unrelated sibling projects, personal messages, credentials, broad Downloads/Desktop trees or private academic records. Attachments from a separate ChatGPT file library were not assumed mounted or accessible.
- Searched public UM sources. The browser could not fetch the handbook because of its size; a temporary copy was downloaded from the official URL. Text extraction identified the relevant pages as image-based (only printed page numbers extracted). Rendered and visually inspected the cover and the complete WIA2008 entry on PDF pages 59–60. No interpretation from filenames or search snippets alone was used for course requirements.

## Inspected sources and citation keys

All repository paths below are relative to the root above. Cite source key plus precise section/page or code symbol; file line numbers reflect this working snapshot.

| Key / exact file or source | Type / inspected location | Version and authority | Use and limits |
| --- | --- | --- | --- |
| **H24** — `UGHB2024_c.pdf`, [official UM URL](https://fsktm.um.edu.my/fsktm/doc/undergraduate/Handbook/UGHB2024_c.pdf) | Official faculty undergraduate handbook; cover PDF p.1; WIA2008 outcomes printed p.45 / PDF p.59 lower-right; synopsis and assessment printed p.46 / PDF p.60 upper-left | Cover states 2024/2025. Earlier offering; applicability to this learner's current retake is unconfirmed | Three broad outcomes and named synopsis topics only. No chapter numbering, practical-sheet numbers or current practical rubric established |
| H24 temporary accessible copy: `C:\Users\afiq hakiki\AppData\Local\Temp\netfault-3d-sources\UGHB2024_c.pdf` | Same 128-page, 16,716,803-byte PDF; relevant pages visually readable | Not a second source; no PDF copied into repository | Most handbook pages were not substantively reviewed. Cite H24's exact relevant pages, not the entire book |
| **U3D** — `C:\Users\afiq hakiki\.codex\attachments\4d7b11b9-5c92-4d0a-a15b-7ffc91dc9310\Pasted text.txt` | User's milestone request, fully read | Learner statement; current task | Establishes goals, accepted UX and examples of previously supplied materials. Does not establish their contents or current assessment weights |
| **R-A** — [content-v1.ts](../src/lib/academy/content-v1.ts), [content.ts](../src/lib/academy/content.ts), [schema.ts](../src/lib/academy/schema.ts), [diagram.tsx](../src/components/academy/diagram.tsx), [exercise.tsx](../src/components/academy/exercise.tsx) | Authored public learning content, revisions, diagrams and exercises; inspected | App implementation, not official teaching materials | Evidence of what NetFault teaches now |
| **R-F** — [lessons.ts](../src/lib/lessons.ts) | All four original Field Guides read | App teaching, not course outcomes | Paper practice is distinguished from graded exercises |
| **R-L** — [catalog.ts](../src/lib/catalog.ts), [scenarios.ts](../src/server/scenarios.ts), seven private scenario files linked in coverage matrix | Topologies, diagnostics, faults, repairs, hints, rubrics and teaching inspected | All seven scenario revisions are 1; schema versions 1–6 | NetFault numbers are not UM practical-sheet numbers |
| **R-E** — [engine.ts](../src/lib/engine.ts), [schema.ts](../src/lib/schema.ts), [grading.ts](../src/lib/grading.ts) | Network derivation, validation, rendering and structured grading inspected | Deterministic educational model | Implementation evidence, not Cisco/Packet Tracer equivalence |
| **R-P** — [sessions.ts](../src/server/sessions.ts), [session-store.ts](../src/server/session-store.ts), [API route](../src/app/api/lab/route.ts), [storage.ts](../src/lib/storage.ts), [Academy progress](../src/lib/academy/progress.ts), [offline check](../src/lib/academy/offline.ts), [worker](../scripts/service-worker.js) | Assessment ownership, persistence and offline boundaries | Current source inspection | No hosted deployment or runtime certification in 3D |
| **D** — [README](../README.md), [AGENTS](../AGENTS.md), [Academy guide](learning-academy.md), [3B record](milestone-3b-plan.md), [3C record](milestone-3c.md), [architecture](architecture.md), [network correctness](network-correctness.md), lab-specific documents linked in coverage matrix | Project documentation; relevant sections inspected | Mixed historical checkpoints; code takes precedence | 3A fixed earlier 2E findings; 3B/3C supersede the pre-Academy state. Earlier proposed next topics are not a syllabus |
| **T** — [tests](../tests), especially case-specific unit suites, authoring contract, Academy suites and browser workflows | Relevant assertions inspected, not executed in this milestone | Historical 3C record: 335 unit tests, 92 full production browser tests, then 36 final-build checks | Existing test coverage is evidence of tested intent. It is not a new 3D pass or proof of educational mastery |

H24 lists a historical 50/50 continuous-assessment/final-examination split. **Do not use it as the current weighting or infer a lab percentage from it.** U3D's chapter examples cannot be aligned with H24's unnumbered synopsis without the original slides. This is incomplete/version-uncertain evidence, not proof of a contradiction.

## Located but not usable as inspected course evidence

| Exact candidate | Inspection state | Disposition |
| --- | --- | --- |
| `UGKit2526Sem2-v3.pdf`, [UM URL](https://fsktm.um.edu.my/fsktm/doc/undergraduate/UGKit/UGKit2526Sem2-v3.pdf) | Search result located; full browser retrieval timed out. No relevant page visually inspected | Excluded from requirement matrix. Filename/search snippet is not confirmation of retake syllabus or weights |
| [Archived SPeCTRUM 2023/2024 course-info page](https://archive-spectrumnew.um.edu.my/sess2324sem2/course/info.php?id=23937) | Search result only; no teaching files inspected | Locator, not curriculum evidence; no login attempted |
| ANT Mastery Workbook; Chapter 2 EtherChannel; Chapter 5 Single Area OSPF; Chapter 10 Network Management, Design and Troubleshooting; Chapter 12 Network Virtualization and Automation | Titles/descriptions reported in U3D only; exact original filenames, paths, semester, pages and contents unavailable | **Uninspected**, not empty or covered. Workbook would be personal study material unless its provenance establishes otherwise; references within it cannot substitute for original sheets |

## Exact missing-material request

Make the following available as readable local files or accessible attachments, retaining original filenames and page/slide numbers:

1. Current retake **session, semester and group**, official course outline/CLOs, teaching schedule and complete chapter/file list.
2. All current lecture slides/notes, including the four named chapter examples. Do not supply only those four if other chapters exist.
3. Every original practical/lab sheet, appendices, addressing/topology diagrams, starter `.pkt`/`.pka` files and required Packet Tracer/IOS versions. Keep each sheet's original number and title.
4. Current assessment brief and rubric: weights, practical tasks, allowed tools, submission requirements and any updated instructor instructions. Older briefs must be labeled by semester.
5. The ANT Mastery Workbook with its source references and date, plus any permitted sample/revision questions. Treat personal notes separately from official requirements.
6. Any concrete learner difficulty examples or marked feedback the learner chooses to share, with personal data removed. These inform priority but do not redefine official outcomes.

No secret credentials or access to an entire personal account is needed. Until items 1–4 are inspected, a course-wide coverage percentage, completion claim or definitive next-topic priority would be unjustified.

## 3D verification approach

Read-only source/test inspection and rendered-PDF review; document/path/line checks and `git diff --check`. Compare SHA-256 fingerprints of the 79 existing application/test/script/public/configuration files recorded at task entry against task exit. Do not rerun the full build/browser suite for this documentation-only task. Final check results are recorded in the release checklist.
