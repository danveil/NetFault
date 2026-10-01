# Milestone 3T — VPN/IPsec feasibility and learning

30 September 2026. **Gate: ACADEMY_ONLY. No IPsec engine or LAB 016.**

Execution plan: inspect current sources and external commit; compare architectures and candidate faults; add only source-supported public learning; verify all prior labs and Academy, production offline behavior and desktop/414/360; record remaining device skills and stop. The [feasibility audit](ipsec-feasibility.md) explains the gate and source limits. No genuine engine-foundation blocker is asserted: an honest policy model is possible in principle, but the inspected course material does not yet justify its configuration-to-diagnostic contract.

## External work preserved

Commit `7bf24b5c39403dd29bfd7b2f9acc94ad95ce88d7`, `lab 0015`, authored/committed 30 September 2026 at **12:25:23 +08:00**, contains 53 changed files spanning 3R IPv6 and 3S Academy, tests and documentation. It intersects the Academy registry/tests and documentation needed here, but contains no VPN engine or conflicting VPN content. It is the preserved base, not a conflict and not this agent's commit. The pre-existing uncommitted changes in `docs/milestone-3s.md` and `docs/verification.md` are also retained. No reset/revert/amend is needed or authorized.

The commit's changed paths are recorded by `git show --stat 7bf24b5`: root AGENTS/README; architecture/iPhone/IPv6/source/coverage/roadmap/Academy/verification docs; Playwright configuration; lab API; Academy, IPv6, app and topology components; Academy/catalog/engine/grading/preview/repair/schema/IPv6 libraries; private IPv6 scenario/registry; base styles; Academy, authoring, GRE, IPv6, next-hop, privacy, timer tests and operations answer fixtures. This intersection requires preserving prior revisions, not rebuilding those systems.

## Deliverable boundary

One new public Academy module, three revision-1 lessons: VPN/GRE boundaries, IPsec security services, and protection-versus-delivery evidence. Reuse six-section lessons, requested-only solutions, six tap exercises, three local diagrams, deterministic grading and revisioned progress. No cryptographic computation, live commands, invented SA states, counters, timers, selectors, repair controls or server endpoints. A separate optional companion is **UNEXECUTED** and requires actual authorized platform observations.

Fresh results are recorded in [verification](verification.md). Existing network engines, fifteen case revisions, Assessment ownership/CAS, worker, dependencies and Netlify configuration remain outside the edit scope. No commit, push, deployment or credit use.

## Learning, architecture and files

| Lesson ID / title                                         | Practiced skill                                                                        | Local diagram                                                       |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `vpn-boundaries` — A tunnel is not a security promise     | Deployment classification, GRE versus IPsec, provider and gateway boundaries           | LAN → gateway → WAN → gateway → LAN responsibilities                |
| `ipsec-services` — Match the safeguard to the requirement | AH/ESP, confidentiality/integrity/authentication, DH and HMAC role distinctions        | Separate evidence for each security requirement                     |
| `vpn-evidence` — Prove protection as well as delivery     | Underlay versus protection, current two-way evidence and bypass rejection as reasoning | Gateway reachability → security relationship → service verification |

Each uses the existing six educational sections with an analogy and its limits, original worked examples, guided and independent exercises, useful field feedback, retries and requested detailed solutions. Total new content: **3 lessons / 6 exercises / 18 choices / 3 diagrams / 1 UNEXECUTED companion**. Whole Academy: **6 modules / 14 lessons / 28 exercises / 17 diagrams**. Older content/revisions remain unchanged. There is no new Assessment case or diagnosis/repair form: Academy answers are public study data, hidden behind the existing UI guard during active Assessment, not examination secrets.

Code changes are confined to new `src/lib/academy/vpn-content.ts`, registry registration in `content.ts`, independent `tests/fixtures/vpn-answers.ts`, unit `tests/academy-vpn.test.ts`, browser `tests/browser/academy-vpn.spec.ts`, and the historical inventory scope in `tests/academy-operations.test.ts`. The new whole-registry test protects the exact current module/lesson/lab inventory; the historical test still checks every 3S lesson/diagram/exercise. No schema, renderer, engine, command, dependency, lockfile or runtime service change. README/AGENTS plus gap/coverage/feasibility/roadmap/correctness/Academy/verification docs record the boundaries.

The policy concepts are explained only. No real or simulated key negotiation, SA establishment, protection state, cryptographic operation, traffic selector, bypass repair or crypto diagnostic exists. Existing LAB009 ACL filtering, LAB013 NAT translations, LAB014 unprotected GRE and LAB015 separate IPv6 semantics are preserved. The public lessons do not import private scenario values, hints or rubrics. Assessment remains online/server-owned/no-store; durable storage/CAS and Windows retries are unchanged.

## Open and check

With the repository's Node 24/pnpm 11.19.0 setup, use `pnpm build` and `pnpm start`. Open `http://localhost:3100` → **Learn networking / Field guide → Academy home → VPN and IPsec → Explore module**. Complete both exercises in a lesson, request solutions separately, reload and use Continue lesson to inspect persisted progress. The third lesson contains the expandable device companion. It is an original evidence plan, not the uninspected PKA's CLI recipe or answer key.

After an initial production load, wait for **Available offline · Academy**, disconnect and reload. Lesson text, diagrams, choice grading, requested solutions, companion text and local progress remain available. External RFC links, real device activities and Assessment require connectivity/tools. For iPhone install/offline behavior use a separately authorized HTTPS deployment or trusted local HTTPS; LAN HTTP is only an online UI check. Follow [iPhone testing](iphone-testing.md). No live site is modified here.

## Remaining scope and planning estimate

The [source matrix](ipsec-feasibility.md) documents all strategy/fault comparisons, the retained V27/28 discrepancy and corrected security wording. Actual IPsec construction, platform/SA verification and secure operational repair remain unverified. Remote-access clients, VTI/DMVPN, NAT-T, real crypto, lifecycle/rekey/timers and other advanced behavior are not implemented. These learning boundaries do not imply complete VPN/IPsec or ANT coverage.

The rough learning-support estimate is **~89% ±5 points**, using the prior rubric with one conceptual-support adjustment and no increase in executable or independently verified device competence. It is not a student mastery or exam prediction. No automatic next milestone, LAB016, LAB017+, commit, push, deployment or Netlify credit use.

The next recommendation is an **integrated unfamiliar-network transfer** milestone using only combinations that pass a composition audit of existing bounded models. Prioritize investigation strategy, alternative hypotheses, preserved policy and fresh reciprocal proof over another isolated protocol. The [roadmap](wia2008-roadmap.md) records this separately authorized future direction; no such work is begun in 3T.

## External commit exact changed-file inventory

<details>
<summary>53 paths from the inspected external commit</summary>

```text
AGENTS.md
README.md
docs/architecture.md
docs/iphone-testing.md
docs/ipv6-device-companion.md
docs/ipv6-model.md
docs/learning-academy.md
docs/management-qos-automation-coverage.md
docs/milestone-3r.md
docs/milestone-3s.md
docs/network-correctness.md
docs/scenario-authoring.md
docs/semester-2627-gap-analysis.md
docs/verification.md
docs/wia2008-coverage.md
docs/wia2008-engine-feasibility.md
docs/wia2008-roadmap.md
playwright.config.ts
src/app/api/lab/route.ts
src/components/academy/academy.tsx
src/components/academy/diagram.tsx
src/components/ipv6-controls.tsx
src/components/ipv6-primer.tsx
src/components/netfault.tsx
src/components/topology.tsx
src/lib/academy/content.ts
src/lib/academy/operations-content.ts
src/lib/academy/schema.ts
src/lib/catalog.ts
src/lib/engine.ts
src/lib/grading.ts
src/lib/ipv6-address.ts
src/lib/ipv6-grading.ts
src/lib/ipv6.ts
src/lib/preview.ts
src/lib/repair-trial.ts
src/lib/schema.ts
src/server/ipv6-scenario.ts
src/server/scenarios.ts
src/styles/base.css
tests/academy-operations.test.ts
tests/academy-ospf.test.ts
tests/authoring.test.ts
tests/browser/academy-operations.spec.ts
tests/browser/gre.spec.ts
tests/browser/ipv6.spec.ts
tests/browser/next-hop.spec.ts
tests/browser/privacy.spec.ts
tests/browser/timer.spec.ts
tests/fixtures/operations-answers.ts
tests/gre.test.ts
tests/ipv6-model.test.ts
tests/ipv6.test.ts
```

</details>
