# WIA2008 evidence inventory — Milestone 3D follow-up

**Historical-materials-based roadmap — 2026/27 course requirements unconfirmed.**

Audit date: 22 September 2026. The historical lecture collection now supports an actionable development order. The learner does not yet have the 2026/27 materials; their absence does not block this roadmap. It prevents certification of current-semester coverage, sequence, weights and rubrics. Implementation still requires separate authorization.

## Deliverable index

1. Sources and limitations: this document.
2. [Coverage matrix and actual app inventory](wia2008-coverage.md).
3. [Engine capabilities, commands and feasibility](wia2008-engine-feasibility.md).
4. [Completion roadmap](wia2008-roadmap.md).
5. [One proposed next implementation](wia2008-next-milestone.md).
6. [Release checklist and verification record](wia2008-release-checklist.md).

## Search and inspection method

This follow-up searched only the NetFault repository and `C:\Users\afiq hakiki\Documents\ant`. The earlier audit's negative search did **not** include this newly supplied ANT directory. Its conclusion that the slides were inaccessible is superseded here.

The ANT directory contains exactly 11 files, all legacy `.ppt` decks, totaling **529 slides**. PowerPoint opened each read-only, with macro execution disabled, extracted native slide text, and exported images into `%TEMP%\netfault-ant-audit`. Extracted text across all slides was reviewed. The **63 slides listed below** were also visually inspected, including every cover and selected diagrams, command screenshots and tables. The restricted PowerPoint attempt failed with COM error `80070520`; an approved local PowerPoint invocation succeeded. No source deck was saved or copied into the repository.

**Inspection is partial at the embedded-image level.** Rendering every slide does not mean every slide image was reviewed. Native-text extraction omits text embedded in pictures and may omit grouped objects, notes, animation stages and linked media. Slides outside the visual lists have text-level review only; image-only slides outside those lists remain visually uninspected. Claims use reviewed text or specifically reviewed images. This establishes topic coverage and the selected next scope, not the correctness of every example.

Slide references are one-based positions including the title slide. Chapter numbers come from inspected covers. No semester/date was established from inspected teaching content; filesystem dates do not establish the offering.

## Exact ANT inventory

All filenames resolve directly under [the supplied ANT directory](<C:/Users/afiq hakiki/Documents/ant>). Every file opened successfully. **Text** means extracted native slide text reviewed; **visual** lists all additional image review. Source keys abbreviate these exact filenames throughout the six documents.

| Key / exact filename | Slides / bytes | Inspected chapter and substantive locations | Read status / visual slides |
| --- | --- | --- | --- |
| **S1 — `STP.ppt`** | 42 / 1,343,488 | Ch.1 Spanning Tree Protocol. 3–12 loops/redundancy; 13–24 root/port selection; 25–36 timers/variants/edge protection; 37–42 configuration | Text; visual **1, 17, 24, 37, 40** |
| **S2 — `Etherchannel.ppt`** | 23 / 476,160 | Ch.2 EtherChannel. 3–8 logical links/constraints; 10–16 PAgP/LACP; 17–23 configuration, verification and mismatches | Text; visual **1, 13, 16, 20, 22** |
| **S4 — `LAN & Switch Security.ppt`** | 43 / 1,097,728 | Ch.4 LAN and Switch Security. 6–11 devices; 12–22 AAA/802.1X; 23–26 port security; 27–43 LAN attacks/mitigations | Text; visual **1, 25, 38** |
| **S5 — `Single Area OSPF.ppt`** | 61 / 1,374,720 | Ch.5 Single Area OSPF. 3–24 packets/databases/SPF; 25–35 adjacency; 36–57 OSPFv2 configuration/verification; 58–61 OSPFv3 | Text; visual **1, 7, 24, 41, 42, 44, 48, 52, 53, 58, 59, 60, 61** |
| **S6 — `Access Control List(ACL).ppt`** | 39 / 1,800,704 | Ch.6 Access Controls Lists. 3–18 IPv4 rules/wildcards/placement; 19–34 configuration; 35–39 IPv6 ACLs | Text; visual **1, 11, 21, 34, 37** |
| **S7 — `NAT.ppt`** | 30 / 1,669,120 | Ch.7 Network Address Translation. 3–19 concepts/PAT; 20–24 configuration; 25–28 port forwarding; 29–30 NAT64 | Text; visual **1, 20, 21, 23, 24** |
| **S8 — `WAN.ppt`** | 53 / 1,704,448 | Ch.8 WAN. 3–13 topology; 14–33 operation/devices; 34–53 access/connectivity, including legacy services | Text; visual **1, 7, 34** |
| **S9 — `VPN & IPsec.ppt`** | 43 / 1,269,760 | Ch.9 VPN and IPsec. 3–23 VPN types; 24–28 GRE configuration/verification; 29–43 IPsec framework | Text; visual **1, 25, 27, 28, 31** |
| **S10 — `Network Management.ppt`** | 76 / 2,901,504 | Ch.10 Network Management, Design and Troubleshooting. 3–21 CDP/LLDP/NTP/syslog; 22–31 SNMP; 32–37 maintenance; 38–53 design; 54–76 troubleshooting | Text; visual **1, 4, 10, 31, 42, 55, 57, 70, 75** |
| **S11 — `QoS.ppt`** | 47 / 1,356,288 | Ch.11 Quality of Service. 3–16 congestion/traffic; 17–24 queues; 25–32 models; 33–47 classification/marking/avoidance/shaping/policing | Text; visual **1, 7, 24, 40, 45** |
| **S12 — `Network Virtualization & Automation.ppt`** | 72 / 2,382,848 | Ch.12 Network Virtualization and Automation. 3–6 cloud; 7–16 virtualization; 17–37 SDN; 38–72 formats/APIs/configuration management/IBN | Text; visual **1, 26, 42, 55, 62** |

## Reliability and absent material

| Source class | Available evidence / authority | Limits |
| --- | --- | --- |
| Official UM course outline | **H24:** `UGHB2024_c.pdf`, [official UM handbook](https://fsktm.um.edu.my/fsktm/doc/undergraduate/Handbook/UGHB2024_c.pdf). Earlier audit visually inspected cover PDF p.1 and WIA2008 printed pp.45–46 / PDF pp.59–60. Cover says 2024/25 | Historical broad outcomes. Its 50/50 continuous/final assessment split is not current weighting and implies no laboratory percentage. Not newly downloaded in this follow-up |
| Course lecture materials | S1–S12, supplied by the learner; covers explicitly identify WIA2008 and chapter titles. Historical course teaching evidence | No independent authentication of lecturer, issue date, completeness or current approval. Stronger than filename inference, but not a current official outline |
| Original practical sheets / starters | **None found** in ANT; no source PDF/Word practical, `.pkt`, `.pka` or additional source deck found in the repository source search | Lecture screenshots are examples, not original practical sheets. No sheet identifier, exact assessed topology, submission requirement or rubric can be mapped |
| Personal workbook / notes | **ANT Mastery Workbook not found** in either searched scope; no learner notes in ANT | Earlier mentions do not establish contents. Do not invent its practical references |
| NetFault implementation/docs | Sources below: accepted 3C application, four guides and LAB 001–007 | App design/tests do not establish course requirements or mastery |
| General networking knowledge | Engineering judgments and proposed learning activities, explicitly labeled | Not evidence that UM requires an extra topic. No controlled networking lab was run here; later technical authoring needs primary-reference review |

Observed chapter set: **1, 2, 4–12**. No Chapter 3 deck was found; its subject is unknown. EIGRP appears in H24's synopsis but has no dedicated deck here. PPP appears in H24 and S8 slides 16/44, without a complete inspected PPP configuration practical. These are evidence gaps, not proof of removal from the course.

Earlier search-only candidates (`UGKit2526Sem2-v3.pdf` and an archived SPeCTRUM listing) remain excluded because their contents were not inspected. No new web or unrelated personal-folder search was performed. When future materials become available, revisit sequence, topic depth, tools, assessment and omissions; there is no renewed request or intake gate blocking the historical recommendation.

## Source disagreements and authoring cautions

These observations preserve discrepancies without silently repairing the source or certifying the rest of a deck.

| Exact location | Observed discrepancy / limitation | Consequence |
| --- | --- | --- |
| `Access Control List(ACL).ppt`, slide 21 image | Defines ACL **10**, then attaches `ip access-group 1 out` | Do not reuse as a verified working configuration; reconcile identifier and intended policy |
| `NAT.ppt`, slide 23 image | Hosts use **192.168.10.10/192.168.11.10**; shown classification ACL permits **10.0.0.0/8** | Do not claim these pictured clients match that ACL; verify a coherent replacement |
| `VPN & IPsec.ppt`, slides 27–28 images | Configured GRE destination **198.133.219.87** differs from output destination **209.165.201.2** | Treat as inconsistent/different examples, not a verified configuration/output pair |
| `Single Area OSPF.ppt`, slides 37 versus 47/49 | Router-ID-only election description precedes priority and non-preemption qualifications | Teach explicit assumptions; highest router ID alone is not a universal election rule |
| `VPN & IPsec.ppt`, slides 16–17 versus 21 | Broad IPsec multicast/routing prohibition followed by VTI multicast/routing support | Preserve tunnel-type distinctions |
| `QoS.ppt`, slide 39 text versus 40 image | Text calls ECN a Layer 2 marking; diagram places it in the IP header | Flag for standards review before authoring corrected teaching |
| H24 versus supplied decks | H24 names EIGRP/PPP; decks add many subjects but contain no EIGRP deck | Keep separate evidence tiers; neither collection establishes complete current requirements |

S9 slides 34/37/42–43 contain historical algorithm/key recommendations, S8 slides 49–51 time-sensitive access claims, and S12 slides 12/33–37/57 product/tool references. This audit records subject coverage, **not current deployment advice**. Relevant primary documentation must be checked before those recommendations are reproduced.

## Repository evidence retained from the initial audit

| Key | Exact inspected sources / use |
| --- | --- |
| **R-A** | [current Academy](../src/lib/academy/content.ts), [original content](../src/lib/academy/content-v1.ts), [schema](../src/lib/academy/schema.ts), [diagrams](../src/components/academy/diagram.tsx), [exercises](../src/components/academy/exercise.tsx): lessons and revision-2 tap interactions |
| **R-F** | [lessons.ts](../src/lib/lessons.ts): four unchanged guides with ungraded paper prompts |
| **R-L** | [catalog](../src/lib/catalog.ts), [registry](../src/server/scenarios.ts), seven scenario files linked in [coverage](wia2008-coverage.md#seven-fixed-troubleshooting-scenarios): actual cases/rubrics |
| **R-E** | [engine](../src/lib/engine.ts), [schema](../src/lib/schema.ts), [grading](../src/lib/grading.ts): implemented behavior. Academy content, engine derivation and command dispatch rechecked in this follow-up |
| **R-P** | [sessions](../src/server/sessions.ts), [session store](../src/server/session-store.ts), [API](../src/app/api/lab/route.ts), [storage](../src/lib/storage.ts), [Academy progress](../src/lib/academy/progress.ts), [offline check](../src/lib/academy/offline.ts), [worker](../scripts/service-worker.js): ownership/persistence/offline boundaries |
| **D/T** | [AGENTS](../AGENTS.md), [README](../README.md), [Academy guide](learning-academy.md), [3C report](milestone-3c.md), [network correctness](network-correctness.md), [tests](../tests): engineering requirements/historical verification, not course authority |

No application suites were run for this documentation-only follow-up. Fingerprints and documentation checks are recorded in the [release checklist](wia2008-release-checklist.md#follow-up-verification-record).
