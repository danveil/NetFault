# “NetFault complete for ANT” — proposed release criteria

**Not currently achieved or certifiable.** The [source inventory](wia2008-sources.md) lacks the current retake syllabus and original practicals. H24 provides only a historical baseline. This checklist defines a proposed evidence-based completion standard; it does not promise a grade or certify all university coursework through app usage.

## Evidence and course coverage gate

- [ ] Record the retake session/semester/group and the authoritative current outline, chapter list, original practicals and assessment instructions; reconcile outdated versions explicitly.
- [ ] Map every confirmed current learning outcome and practical task to exact page/slide/sheet evidence, its required depth, and Academy/case/external-practice coverage. Preserve official numbers separately from NetFault IDs.
- [ ] Resolve every unknown in the course matrix or list it as an explicit release exclusion accepted by the learner. No generic CCNA curriculum, arbitrary case quota or unsupported coverage percentage substitutes for this mapping.
- [ ] Check each current practical's topology, addressing, configuration, verification and submission requirements against actual learner/tool artifacts. A source code test or paper solution is not a completed practical.
- [ ] Keep useful extra networking topics in a separate optional backlog, without labeling them WIA2008 requirements.

## Learning and independent performance

- [ ] For each confirmed objective, provide accurate explanation, appropriate analogy limits, worked reasoning and source-reviewed diagrams where useful. Every visual has a readable text equivalent and correct labels.
- [ ] Guided practice leads to a different independent task that tests the same objective. Record hint/solution/feedback use. Reading or repeated recognition alone cannot be labeled mastery.
- [ ] Wrong-answer feedback supports another attempt without revealing the entire answer prematurely. Detailed solutions are explicitly requested where that is the promised interaction.
- [ ] Require reasoning about discriminating evidence and minimal repair, not only matching a familiar symptom to a cause. Independently test changed addresses/topologies in a suitable real tool when generalization is the objective.
- [ ] Configuration skills require learner-entered configuration and verification in Packet Tracer or real equipment. NetFault's structured repair preview does not satisfy command-entry, saving configuration or build-from-blank requirements.
- [ ] Assess unfamiliar fault transfer with a documented rubric and actual observations; do not claim arbitrary natural-language understanding or guarantee an excellent ANT result.

## Model and assessment integrity

- [ ] Every new simulated behavior has an explicit scope, validated state, coherent command outputs, observable fault, exact minimal repair and independently specified recovery checks. Preserve both request and return paths and unaffected traffic.
- [ ] Simulator abstractions remain visible: no claims of full IOS, packet-level OSPF, measured latency, election, NAT or IPv6 behavior unless genuinely implemented and verified.
- [ ] Initial/active assessment payloads and client assets exclude private case answers/rubrics/teaching. Server observations, deadlines and immutable finalization withstand forged IDs and concurrent invocations. APIs remain uncached.
- [ ] Preserve the distinction between server-owned grading and exam security: public practice packs/Academy remain inspectable. Timed self-assessment is not proctoring or proof of an academic grade.
- [ ] Published scenario revisions and legacy packs remain interpretable. Do not overwrite the seven revision-1 cases to disguise new semantics; define scenario revision support before changing published case meaning.

## Progress, mobile, accessibility and offline

- [ ] Academy reading, correct submissions, aid/reveal use and historical revisions stay distinct. Old drafts remain readable without silent reinterpretation; no journal key collisions, corrupt-data overwrite or silent quota/retention loss.
- [ ] Save/reopen/export flows work; browser/origin locality, lack of cross-device sync and eviction risk are documented. Existing concurrency/storage boundaries are preserved.
- [ ] All main learning interactions work by taps at 414px and a narrower width, with readable diagrams, no page overflow, visible focus, accessible names and keyboard equivalents. No drag-only path or scrolling conflict.
- [ ] Test rapid taps, partial-draft refresh, retry, navigation, requested solutions, increased text size and assessment navigation guards.
- [ ] After a complete online production cache, Academy and downloaded practice content work offline. Indicators reflect current cached dependencies. External sources and assessments accurately require connectivity; deployment updates retain progress without indefinitely serving obsolete assets.
- [ ] **Physical iPhone 11:** separately record date, iOS/Safari versions, Safari/Home Screen modes, portrait/landscape, one-handed interaction, VoiceOver, increased text size, scroll/tap behavior, airplane-mode reload and update acceptance. User-reported acceptance and agent-performed tests must be distinguished. Use [existing checklist](iphone-testing.md); current UX acceptance does not prove every item.

## Regression and external practical evidence

- [ ] After authorized application changes, run appropriate lint, strict types, unit/integration, production build and production-browser workflows. Preserve all seven labs, privacy boundaries, 3C exercises, revision history and PWA behavior. Record exact commands, counts, skips/failures and tested build.
- [ ] Validate newly modeled network behavior against relevant primary references and, where needed, a controlled real/PT/IOS lab. Identify precisely what was actually executed; reference review alone is not external simulation validation.
- [ ] Keep an external-practical checklist for each actual course sheet. At minimum retain required building/cabling, real configuration entry, actual show-command interpretation, save/reload verification and course-specific protocol/tool tasks outside NetFault's supported scope. Current sheets will determine whether and how IPv6, STP, EIGRP, PPP/VPN, EtherChannel or management/automation tasks apply.
- [ ] Final review shows each confirmed outcome is supported by the appropriate combination of learning, simulation and external performance. Remaining exclusions and evidence limitations are explicit; no outcome is closed simply because a related word or lab title exists.

## 3D audit verification record

This milestone makes documentation changes only. Existing 3C modifications were already present at task entry and must not be attributed to 3D. The source inspection confirms one current Academy module, three lessons, six tap exercises, five diagrams, four guides and seven scenarios, with the bounded capabilities described in the companion documents.

Historical test evidence only: [3C report](milestone-3c.md) records 335 unit tests, 92 complete production browser tests, and 36 final-build checks. **No lint/type/build/unit/browser suite was rerun for 3D**, as no app behavior changed. The learner's current acceptance is user-reported; no fresh physical-device or deployed-site verification occurred.

Actual checks performed on 22 September 2026:

| Check | Result |
| --- | --- |
| Local Markdown references in six deliverables plus README, AGENTS, roadmap and Academy documentation | Passed: 10 documents, 156 local links, 39 code-line locations; every destination and referenced line exists; local heading links resolve |
| Application preservation | Passed: SHA-256 comparison of the same 79 application/test/script/public/configuration files at entry and exit; zero changed, missing or added files in that set |
| `git diff --check` | Passed; Windows LF/CRLF notices are informational |
| Six newly created documents | Passed separate trailing-whitespace, final-newline, conflict-marker and code-fence checks (untracked files are not covered by ordinary `git diff --check`) |
| Course-source verification | Official H24 cover and WIA2008 entry visually inspected at PDF pages 1, 59 and 60 (printed course pages 45–46); extraction alone was insufficient for the image-based entry |
| Course-source completeness | **Incomplete:** no current retake outline, original practicals, full slides or assessment brief; excluded uninspected candidate PDFs/search results from requirements |
| Application test suites / live site / physical device | Not run in 3D; historical results explicitly labeled, accepted 3C behavior preserved |

Created six `docs/wia2008-*.md` deliverables. Updated only README, AGENTS, `docs/roadmap.md` and the closing future-priority note in `docs/learning-academy.md` to point to this audit and prevent old proposals being mistaken for authorization. No source, lesson, scenario, UI, dependency, worker, Netlify setting or stored learner data was changed; no commit, push or deployment.
