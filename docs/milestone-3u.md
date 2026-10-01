# Milestone 3U â€” integrated unfamiliar-network feasibility

30 September 2026. **DEFER. Zero new challenges. No LAB016â€“018.** The [compatibility matrix](integrated-model-compatibility.md) records tested supported subsets, rejected combinations and the smallest foundation. The [transfer contract](unfamiliar-network-transfer.md) provides a method-guide draft and two original design candidates, explicitly unimplemented.

## Starting state and execution plan

HEAD remained `7bf24b5c39403dd29bfd7b2f9acc94ad95ce88d7` (`lab 0015`), the external 3R/3S commit preserved by 3T. `git status --short` and the latest ten commits were inspected. Intake had twelve tracked modifications and six untracked files: the completed 3T Academy/tests/docs plus pre-existing 3S finalization. None was reset, overwritten or committed. An ignored intake record hashes 88 source/script/package/lockfile/Playwright files so preservation can be checked independently of Git HEAD.

Plan executed: inspect requirements and prior milestone/source/architecture records; trace all twelve listed model families and the scenario-to-UI/API/repair/grading path; test plausible safe compositions and validator boundaries; choose the gate; document smallest foundation and stop. No subagents, external-account actions or new dependencies.

## Decision

VLAN access + point-to-point OSPF + remote-LAN outbound ACL is a valid **restricted forwarding composition**, proven by new tests. Routing remains independent of ACLs, NAT and GRE. However, this does not give two complete different-fault challenges under the current contracts:

- Only the ACL fault has an existing replayable repair in that composition. Earlier VLAN/OSPF/static repairs are canonical solution previews and proposed-answer grading, not versioned learner trials with fresh verification.
- Schema versions bind fault/repair families to capability sets. The most obvious NAT/ACL, GRE/ACL/NAT, STP/LACP and HSRP/OSPF/ACL extensions are explicitly rejected, not safe combinations waiting for catalog entries.
- Public case-family UI/metadata and the fixed API device-name list would violate neutral investigation or prevent renamed devices. The default topology layout also assumes a bounded old-case index set.

Therefore PARTIAL's requirement for **two** strong end-to-end challenges is not met. Renaming or readdressing an isolated case, revealing the family through a dedicated repair panel, or removing mixed-model guards would not satisfy this request. This decision does not assert that a new protocol or broad forwarding rewrite is needed. A narrow composition contract, neutral capability view and replayable VLAN repair alongside ACL repair are the recommended foundation.

## Delivered and preserved

Delivered three audit/design documents, 23 composition tests, and status updates to README/AGENTS, coverage, engine feasibility, roadmap, gap analysis, correctness and verification. No application, catalog, scenario, API, schema, grader, renderer, Academy, storage, worker, dependency, lockfile or deployment configuration changed from intake. No learner-facing hypothesis UI, transfer score, new repair, new preview or in-app guide is claimed.

All fifteen labs and six-module/fourteen-lesson Academy remain intact. Existing Practice/online Assessment/offline pack/journal behavior is unchanged; [verification](verification.md) distinguishes current unit/integration results from historical production/browser evidence. No new challenge browser or mobile result exists because no challenge was created.

## Estimate and next milestone

The rough ANT learning-support estimate remains **~89% Â±5 percentage points**: the audit increases engineering confidence, not delivered source coverage, integrated transfer practice or authentic device skill. The prior planning rubric remains 34/35 conceptual support, 24/25 structured practice, 22/25 executable breadth and 9/15 practical preparation. These are judgmental planning ratings, not measured mastery, exam probability or official syllabus weights.

Recommend a separately authorized **bounded transfer foundation**, restricted to the proven access-VLAN/point-to-point-OSPF/outbound-LAN-ACL composition and two repair families. Define neutral metadata, replayable VLAN changes, fresh multi-layer verification and graph/device identity handling before re-gating the two proposed original networks. Do not begin another isolated protocol to fill the count.

Major gaps remain integrated unfamiliar-network practice, independently executed device work, broader IPv6/OSPFv3, dynamic NAT/PAT, operational VPN/IPsec, advanced policy/switching/WAN variants and real QoS/management/controller behavior. No follow-up is automatically started. No commit, push, deployment, Netlify account/project change or deployment-credit use.
