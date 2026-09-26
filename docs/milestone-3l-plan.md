# Milestone 3L record and proposed Milestone 3M

**PLANNED ONLY — NO LAB 012 OR NEW ENGINE CAPABILITY IMPLEMENTED**

26 September 2026. This document specifies future work; it does not authorize or begin it. The [feasibility audit](lab012-feasibility.md) records course sources, alternatives, code seams and a **PASS** for exactly one static port-security lab. Intake was clean at `acea721`; eleven labs and all published Academy content remain unchanged. No application suites or build were run in this documentation-only milestone.

## 1. Audit execution plan and outcome

1. Read AGENTS, README, historical/current course mappings, ACL/STP/HSRP audits and model records. Check clean Git baseline and actual registry, schema, commands, forwarding, grading, trials, persistence and tests.
2. Verify the actual 26/27 ZIP against extracted sources. Read revision notes, relevant native lecture text and the full security practical; visually inspect image-based candidate commands and both ExtraLab exercises. Keep current supplied evidence, historical audits and engineering assumptions distinct.
3. Refresh major gaps, compare port security/NAT/GRE plus challengers qualitatively, and choose exactly one distinct troubleshooting outcome. Identify a real forwarding seam before declaring feasibility.
4. Produce this implementation contract and the source/feasibility record. Add dated pointers to five project documents. Verify sources, code paths, Markdown links/anchors, formatting and documentation-only diff. Stop without implementation, commit, push, deployment or credit use.

Steps 1–3 are complete. The verification record at the end reports step 4. The proposal is not a completed practical, new course coverage, or a claim of learner mastery.

## 2. Proposed 3M scope

Implement **LAB 012 — The quiet desk**, proposed ID `port-security-01`, revision 1, schema version 11. Teach the learner to distinguish correct carrier/VLAN/IPv4 routing from **source-MAC admission at a switch ingress port**, locate a static secure-address mismatch, make the smallest approved change and verify both service and retained protection.

Deliver one reusable bounded model, one private case, one structured repair, derived diagnostic outputs, authentic versioned grading, preserved modes/journal/offline behavior and a tiny unrelated primer. No later lab or general IOS shell. The design below is an original NetFault case grounded in L24–26 and S's port-security sections from the audit.

### Public incident and design

Suggested incident: “The workstation at Desk A cannot reach its gateway or PC-B after desk maintenance. PC-B can still reach its own gateway. Investigate the physical path, addressing and configured access policy, then restore the approved service.”

Public design: PC-A is the approved single endpoint on SW1 FastEthernet0/1; VLAN 10 and all cables must remain intact. The port must retain enabled port security, maximum one secure MAC, static registration and explicit protect mode. The registered address must identify the approved workstation's unchanged NIC. R1 connects the two IPv4 LANs; routing/addressing and the remote workstation must remain unchanged. The public design may state intended restrictions, but must not contain observed secure MAC, the fault location as an answer, repair value or rubric. The NIC address is discoverable with `ipconfig /all`.

No automatic red link, security-warning badge or correct-value preselection. Physical links remain neutral and connected. The topic label can name port security, as existing labs name their topic, without revealing the incorrect entry.

## 3. Exact topology and independent expectations

```text
PC-A -- SW1 -- R1 -- PC-B
       VLAN 10   routed boundary
```

| Device | Interface / port | Address or membership                    | Physical MAC / configuration                   |
| ------ | ---------------- | ---------------------------------------- | ---------------------------------------------- |
| PC-A   | Ethernet0        | `172.30.10.10/24`, gateway `172.30.10.1` | `0200.0012.000a`, up, static IPv4              |
| SW1    | FastEthernet0/1  | VLAN 10, link to PC-A Ethernet0          | Up, 100 Mb/s, full duplex; secure policy below |
| SW1    | FastEthernet0/24 | VLAN 10, link to R1 Gi0/0                | Up, 100 Mb/s, full duplex; no port security    |
| R1     | Gi0/0            | `172.30.10.1/24`                         | `0200.0012.0101`, up                           |
| R1     | Gi0/1            | `172.30.20.1/24`, link to PC-B Ethernet0 | `0200.0012.0102`, up                           |
| PC-B   | Ethernet0        | `172.30.20.10/24`, gateway `172.30.20.1` | `0200.0012.000b`, up, static IPv4              |

SW1 has one active VLAN, ID 10, name `Workstations`, no SVI and no management IP. R1 has router ID `1.1.1.1` as required metadata; it runs no OSPF. It needs only connected/local routes: C `172.30.10.0/24`, L `172.30.10.1/32`, C `172.30.20.0/24`, L `172.30.20.1/32`. No static/default route, ACL, NAT, trunk, port channel, STP or HSRP. A second router adds no necessary learning value.

Three physical links, all up: PC-A–SW1 and SW1–R1 carry subnet label `172.30.10.0/24`; R1–PC-B carries `172.30.20.0/24`. Host gateways and all addresses are valid. Switch ports have no invented routed MAC/interface entries.

SW1 Fa0/1 always has `enabled: true`, `maximum: 1`, `violation: protect`, exactly one static secure address and no aging/learning. **Sole fault:** that secure address is `0200.0012.009a`, a valid but incorrect unicast MAC. Healthy state differs only by replacing it with `0200.0012.000a`. The erroneous value need not belong to a present device; validity must not reject the intentional fault. An unused address is not an additional disconnected-device fault.

| Observation / probe                               | Initial                                          | Corrected                  | Independent reason                                                               |
| ------------------------------------------------- | ------------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------- |
| SW1 carrier and VLAN membership                   | Both ports connected in VLAN 10                  | Identical                  | Protect does not shut down the port                                              |
| Fa0/1 security                                    | Enabled, protect, secure-up, max 1, configured 1 | Same fields                | Policy remains active; secure-up is not proof the attached PC is admitted        |
| Secure address                                    | `0200.0012.009a`                                 | `0200.0012.000a`           | Actual configured static slot                                                    |
| PC-A → own IPv4                                   | Success                                          | Success                    | Local delivery does not enter SW1 and proves no admission                        |
| PC-A → gateway                                    | Failure                                          | Success                    | Initial source-MAC admission blocks resolution request at Fa0/1                  |
| PC-A → PC-B                                       | Failure                                          | Success                    | Same first-hop problem initially; corrected router uses connected route          |
| PC-B → PC-A                                       | Failure                                          | Success                    | R1's resolution request can reach A, but A's response is rejected at SW1 ingress |
| R1 → PC-A                                         | Failure                                          | Success                    | Same reverse-resolution boundary                                                 |
| PC-B → local gateway                              | Success                                          | Success                    | Does not traverse protected port                                                 |
| R1 → PC-B, including source `172.30.10.1`         | Success                                          | Success                    | Router and remote LAN work; reply reaches local R1 address, without needing A    |
| PC-A ARP after a gateway probe in current epoch   | No successful gateway mapping                    | `.10.1` → `0200.0012.0101` | Derived complete modeled resolution, not a prefilled table                       |
| Nonmatching ingress source-MAC predicate at Fa0/1 | Reject                                           | Reject                     | Full static slot/protect invariant; not an executed attacker probe               |

After correction, no route, host address, gateway, link, VLAN or policy mode changes. A working self-ping or R1-to-PC-B ping alone cannot prove Desk A service.

## 4. Minimum reusable engine contract

### State and supported topology

Proposed strict optional `portSecurity` object on a switch access port: `enabled: true`, `maximum: 1`, `violation: "protect"`, `staticMac: <canonical unicast MAC>`. This name/shape is a proposal, not current code. No independent learned/operating-status fields. Omitted object means the ordinary unsecured port, preserving existing behavior. Validate lowercase dotted 48-bit notation, nonzero unicast addresses, and unique physical interface MACs for the new model; accept equivalent user input formatting by explicit normalization before validation if offered. Do not globally change old MAC parsing.

Bounded family: one access switch, one active VLAN, one or two directly attached single-NIC PCs, one directly attached router with one optional second routed LAN/host; no inter-switch links or cycles. One or two PC-facing secure ports may carry the same static/protect/max-1 mechanism; prohibit duplicate secure registrations within the same VLAN and secure policy on the router uplink. Canonical LAB012 uses only one PC-facing secure port. Pure model tests use different names, port numbers, MACs, VLANs and addresses. Device count and names are authoring limits, never protocol decisions.

No mixed LACP/STP/HSRP/OSPF/ACL state, hubs, phone/voice VLAN, trunks, stacked multi-source segments, multiple VLANs, dynamic/sticky learning, empty/spare secure slots, greater capacity, aging, restrict/shutdown, errdisable, timers, counters, logs, notifications, MAC movement or reload/startup state. Reject unsupported fields and topology explicitly. Interface/link-down or VLAN-inactive defensive fixtures may be tested without adding interactive failure controls. Do not claim general port security from this subset.

### Pure policy and actual forwarding

Proposed new `src/lib/port-security.ts` exposes independently testable validation, normalized static-MAC comparison and diagnostic helpers. The policy predicate consumes the **ingress switch port and frame source MAC**; it never reads a lab ID, private fault or intended repair. For an enabled full static slot, equality admits and inequality rejects. Unsecured ports retain ordinary VLAN behavior. This is not IP filtering and not endpoint/user authentication.

The existing `peers` graph is topology discovery, also used by OSPF. Preserve it; do not prune all links based on one client's admission. Add a capability-scoped Ethernet-segment delivery/resolution helper, in the new module or beside `forward`, that:

1. Uses existing physical link, endpoint-up and same-active-VLAN rules. Carries the transmitting numbered interface's source MAC across this switched segment; a switch does not replace it.
2. Evaluates ingress policy before passing traffic through each switch. Rejection retains a structured internal drop reason/location for model tests and post-feedback explanation. It does not alter link-up or produce a fabricated ICMP error identifying port security.
3. Resolves a next hop only when a directed request from local interface to candidate and a directed response from candidate back to local both pass admission/availability. The request and response use their own source MACs. No actual ARP packet serialization, timers, FDB or broadcast replication is claimed.
4. Sends the modeled data leg through the same admission predicate after resolution. On a routed hop, the new frame source becomes that router's chosen egress interface MAC while the IPv4 packet source remains the original source. A remote PC's MAC must never cross R1 as the next Ethernet segment's source identity.
5. Emits a successful `Resolution` only after the modeled exchange completes. Keep a failed-resolution observation where appropriate. Initially PC-B's request must not magically reach PC-A just because the forward physical walk is possible; R1 cannot complete resolution when A's reply is rejected.
6. Computes the echo reply only after request delivery for the new capability, then repeats ordinary independent routing/resolution/admission. Leave historical behavior in other schemas unchanged, including their reported return-path diagnostics.

These are deterministic transactions at the simulator's existing hop abstraction, not a frame event engine. Every probe assumes this modeled on-demand resolution check; the displayed ARP table is an observation history, not an independently persistent cache that bypasses it. State that limitation in teaching. Local self-delivery needs no switch admission. Numeric unavailable destinations, unrelated physical failures and missing routes must stay distinguishable internally from an admission drop.

Extend current repair-epoch ARP handling to this capability. After an effective edit, new ARP observations begin an explicitly labeled empty epoch; no-op changes preserve it. Old outputs remain unchanged/readable. This simulator reset does not claim that real static-MAC correction flushes a PC's cache. Do not change LAB003's original history behavior or LAB011's virtual-MAC rules.

### Integration paths, without a redesign

| Existing path                                                                                                                         | Proposed bounded edit in 3M                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [schema.ts](../src/lib/schema.ts)                                                                                                     | New ID/schema11, strict policy/repair/optional diagnosis fields, command allowlists and topology checks; preserve versions1–10                         |
| [engine.ts](../src/lib/engine.ts)                                                                                                     | Forward/resolution admission seam, actual probe outcomes, epoch handling, running-config/security diagnostics and explicit canonical repair dispatch   |
| [repair-trial.ts](../src/lib/repair-trial.ts)                                                                                         | New `port-security-mac` kind before legacy catch-all ACL logic; replay/description/no-op rules                                                         |
| [grading.ts](../src/lib/grading.ts)                                                                                                   | Dispatch new dedicated grader; reuse lifecycle and actual-state verification pattern                                                                   |
| [catalog.ts](../src/lib/catalog.ts), [scenarios.ts](../src/server/scenarios.ts)                                                       | One public case definition and one private registry entry; new `src/server/port-security-scenario.ts`                                                  |
| [preview.ts](../src/lib/preview.ts)                                                                                                   | Reuse derived commands/before-after; extend only if necessary for accurate bounded L2 explanation                                                      |
| [netfault.tsx](../src/components/netfault.tsx), [topology.tsx](../src/components/topology.tsx), [globals.css](../src/app/globals.css) | Existing inspector/evidence flow, new focused repair/diagnosis/primer components, four-node mobile layout, journal repair presentation/raw pack export |
| [sessions.ts](../src/server/sessions.ts), [API](../src/app/api/lab/route.ts), [storage.ts](../src/lib/storage.ts)                     | Existing request/replay/epoch plumbing should suffice; verify per-attempt validity. No new endpoint, device ID, storage backend or migrations          |
| Tests / documentation                                                                                                                 | New pure-model, lab and browser suites; narrow exhaustive catalog/version/privacy/offline updates; implementation/model/source/verification documents  |

New files proposed: `src/lib/port-security.ts`, `src/lib/port-security-grading.ts`, `src/server/port-security-scenario.ts`, `src/components/port-security-repair.tsx`, optionally a focused primer component, plus three test files. No dependencies, Netlify config, worker architecture or `session-store.ts` redesign. Read relevant installed Next documentation before future application edits.

## 5. Commands and what their evidence proves

Every command below is an educational Cisco-like or PC-like subset generated from current state. No static output blobs, fabricated traffic counters or LLM output. Unsupported variants/arguments remain explicit. Reuse the destination input for numeric probes with useful on-link and remote suggestions; router ping retains its validated local source selector. Do not overload an IPv4 destination field to mean a port name.

| Device / proposed command                                             | State input and displayed fields                                                                                                   | Proves / does not prove; deliberate omissions                                                                                                                               |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Both PCs: `ipconfig`, `ipconfig /all`                                 | Configured IPv4, prefix/mask, gateway, NIC MAC, media state; static/DHCP-off disclosure                                            | Identifies actual NIC and host addressing; does not prove switch admission. No DNS/lease traffic                                                                            |
| PC-A: `route print`                                                   | Existing local/on-link/default route derivation                                                                                    | Correct local versus gateway choice; not successful ARP or routing                                                                                                          |
| PC-A: `arp -a`                                                        | Authentic earlier supported probes in current epoch                                                                                | Successful gateway mapping or failed/empty resolution; empty table alone is not a security diagnosis. No aging or invented entries                                          |
| SW1: `show vlan brief`                                                | VLAN config/active status and port membership                                                                                      | Same broadcast-domain membership; not authorization or dynamic forwarding database                                                                                          |
| SW1: `show interfaces status`                                         | Physical link/endpoints, VLAN, speed/duplex                                                                                        | Carrier remains connected during rejection; no fictional err-disabled or policy status substituted                                                                          |
| SW1: `show running-config`                                            | VLAN/access/administrative fields plus enabled/max/static-MAC/protect statements                                                   | Exact configuration; alone cannot establish which NIC is attached or traffic delivery                                                                                       |
| SW1: **new `show port-security`**                                     | Enabled secure ports, max1, configured/total1, protect; bounded-state banner                                                       | Policy inventory; omit violation counts, timers, last-source and resource limits                                                                                            |
| SW1: **new `show port-security interface fastethernet0/1`**           | Selected port config plus physical/VLAN availability: enabled, protect, Secure-up when operational, max/total/configured1, sticky0 | Interface security state; Secure-up is compatible with rejecting an unknown source. Down snapshots use an explicitly educational unavailable label, not an invented IOS FSM |
| SW1: **new `show port-security address`**                             | Configured secure MAC, VLAN, port, type SecureConfigured                                                                           | Secure registration, not dynamic FDB learning; omit remaining age/system capacity and every unmodeled address                                                               |
| R1: `show ip interface brief`, `show ip route`, `show running-config` | Actual numbered interfaces, C/L routes, config                                                                                     | Routes are present independently of port policy; no security-created routes or dynamic protocol output                                                                      |
| Both PCs/R1: `ping`                                                   | Actual request, address resolution and independent reply                                                                           | Local/remote service controls; failed output must not reveal private drop location. No measured latency or count-based violation inference                                  |

For minimal integration, only the exact declared Fa0/1 interface command is exposed in the published case, using the repository's existing finite command registry style. Validate that named port exists. Underlying interface-output/policy helpers accept explicit port identities for independent fixtures and future authored cases; no protocol behavior is hardcoded to Fa0/1. Other exact port commands require later catalog support, not a general IOS argument parser. Summary/address views derive any supported secure port in independent model tests.

No `show mac address-table`, trace, debug, clear, config terminal, shutdown/no-shutdown or automatic learned-entry output is required for this case. Existing MAC strings do not implement a learning table. Trace adds little beyond the local gateway/control probes and could invite unmodeled TTL/error claims; keep its absence honest.

### Minimum useful original evidence path

1. PC-A `ipconfig /all` and failed gateway ping: correct candidate next hop and real source MAC, with a local-service failure. This does not locate the rejecting layer by itself.
2. SW1 status and VLAN view: eliminate carrier-down/inactive/wrong access membership. Connected does not mean admitted.
3. SW1 secure-address view plus interface security view or running-config: full static slot contains a different address; explicit protect explains the connected-but-silent symptom. Compare the NIC and configured value rather than guessing from an empty ARP table.
4. R1 route/interface view and successful PC-B gateway ping: rule out an intended missing route/remote outage. The strongest optional control is R1 ping PC-B with source `.10.1`.

These observations are available entirely inside the future app. The teaching must explain what each can and cannot establish. Preserve original version0 evidence before trials.

## 6. Structured configuration trials

Proposed strict action: `{ kind: "port-security-mac", device, interface, mac }`. The target must have an existing supported secure slot; the request replaces only its address. It cannot enable/disable security, alter max/mode/VLAN/MAC of the PC, remove a cable or edit a route. Explicitly dispatch the new kind before existing generic `kind`/legacy field branches in validation, replay, repair and grading.

Tap interaction: choose switch, port and an address from **MAC values present in the learner's recorded command outputs**, without auto-selecting the correct host. Syntactic extraction/normalization of displayed dotted MAC tokens is sufficient; never obtain choices from private healthy state or a hidden answer list. Inspect PC-B/R1/configuration for meaningful alternative values. Optional manual input can be offered, but the complete normal path needs no typing. Blank selections remain blank; do not imply arbitrary explanation understanding.

A wrong but valid unicast replacement must apply and remain diagnosable. Reapplying the same normalized value is a no-op and preserves the configuration version. Effective edits create an immutable repair event, recompute state and require new verification. Reverting to a previous address creates another version. Preserve 10-change/100-command limits, timestamps, deadline checks, immutable finalization and server CAS replay.

Canonical correction replaces `.009a` with the unchanged approved PC-A NIC `.000a`. Equivalent separators/case may normalize to that same 48-bit value; no different MAC is equivalent because the approved physical endpoint is fixed. Requiring this exact identity is technical, not an arbitrary magic value. Restored unrelated exploratory changes may end with a valid final minimal diff, but the latest evidence still must be fresh.

The preview may show the two conceptual CLI lines removing the old static registration and adding the observed approved address. Explain that the simulator performs an **atomic replacement**: it does not model the temporary empty-slot learning window or claim that configuration was saved to startup. The external companion must use an isolated controlled procedure and record actual behavior, not blindly execute these two lines on a live switch.

## 7. Grading and recovery

Use structured cause, affected device/interface, initial observed secure MAC, applied repair class, supporting observation IDs and mechanism choice. Notes are stored without interpretation. Proposed cause/fix `secure-mac-mismatch` / `port-security-mac`; mechanism describes Ethernet source admission to the existing VLAN while retaining protection. Distractors include VLAN membership, missing route, carrier down and gateway error.

Suggested 100-point rubric, preserving the established evidence total of 30:

| Component                       | Points | Exact requirement                                                                                                                                                                 |
| ------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cause and initial configuration | 20     | Correct mismatch cause10 + version0 configured secure MAC10                                                                                                                       |
| Location                        | 10     | SW1 only5 + exact Fa0/1 port5                                                                                                                                                     |
| Original selected evidence      | 30     | PC-A `/all` together with SW1 secure-address table10; SW1 status + VLAN5; SW1 interface security or full config5; failed A→gateway plus R1 route table and successful B→gateway10 |
| Applied recovery and mechanism  | 20     | Actual minimal policy-preserving recovered state plus selected repair class15; correct structured mechanism5                                                                      |
| Fresh selected verification     | 20     | All current-version proof below; initial pings, partial collection and previews cannot earn verified status                                                                       |

Reconstruct each selected observation from the correct repaired version and **preceding authentic history**, including the current ARP epoch. Require scenario/device/command identity, valid source/target, real output and selected IDs. Reject forged/cross-case/unsupported observations and impossible versions. Do not let fabricated earlier probes seed a later ARP row. Initial evidence is version0; fresh evidence is after at least one effective trial and at the latest version. No-op preserves freshness; a later effective edit invalidates previous proof even if the final policy looks identical.

Actual recovered state must meet all of:

- Final diff from original restricted to Fa0/1's static secure MAC; it equals the approved endpoint's unchanged actual MAC. Links, host NIC/address/gateway, routes, VLANs, enabled/max/protect and every other port remain unchanged.
- Intended host admission is true; an arbitrary different valid source MAC is denied by the same full-slot predicate. Because the allowed set is exactly one MAC, exclusion of all unequal values follows directly from that rule, not a fabricated series of attacker pings.
- Local gateway and reciprocal remote connectivity succeed through actual resolution/admission/routing; PC-B gateway and R1 remote control remain healthy. Preserve exact failure location in model-level negative counterfixtures so a down link cannot masquerade as policy enforcement.

Fresh learner-selected proof: PC-A `/all`; SW1 running-config, secure-address and Fa0/1 security views; SW1 status/VLAN views; PC-A gateway ping then ARP with actual gateway MAC; reciprocal PC-A↔PC-B pings; successful PC-B gateway control. Configuration confirms the negative/exclusive invariant; **there is no in-app unauthorized endpoint probe or spoofing control in this scope**. Do not describe the invariant check as observed attack resistance. Authentic endpoint substitution belongs in the optional controlled companion.

Reject disabling/removing protection, increasing max, changing violation mode, assigning the PC the erroneous MAC, moving VLANs/cables, bypass routing or admitting multiple addresses, even if ping could work in a malformed counterfixture. The schema/action should reject most such requests; the recovery predicate must also reject tampered states defensively. Correctly selecting a remediation without applying it is not recovered. Report unresolved, recovered-unverified and verified separately from diagnostic score.

Provide four progressive Practice hints and a seven-part private lesson: simple admission explanation; analogy with limitations; Ethernet/ARP mechanism; worked config/outputs; symptom connection; guided reasoning; a different independent exercise with an explicitly requested solution. Badge/door analogy must state that MACs can be spoofed and protect is silent frame admission, not personal authentication. Detailed worked correction remains explicitly opened after submission/reveal, never in initial public data.

## 8. Academy and external practice decisions

**B — tiny non-spoiling primer, no new Academy module or revision.** Use unrelated named endpoints, MACs and VLAN 30, not LAB012 addresses or a wrong-registration ticket. At most two small original diagrams: physical cable/VLAN versus admission, and one routed packet's changing Ethernet source identity. Concise blocks cover full static slot/protect, MAC versus IP, Secure-up versus admitted traffic, and both sides of resolution. One guided and one independent tap prediction, useful wrong-answer feedback, explicit solution button; no typing, dragging, completion/mastery claim or new Academy persistence namespace. Hide during active Assessment using the existing gate.

Recommend a **separate authentic switch companion**, documented as UNEXECUTED until actual work occurs. Prefer a supported isolated Packet Tracer/Catalyst setup; verify command support/version first. Learning purpose: configure a static secure slot, observe actual host MAC/status/admission, safely substitute a controlled endpoint, distinguish protect/restrict/shutdown, and separately inspect learning, persistence and recovery. Record device/version, commands and raw output; do not infer violations from NetFault's five-probe text or erase a real device's configuration. A short implementation-era brief is sufficient; no PKA authoring, external session, physical test or broad companion implementation is required by this plan.

## 9. Privacy, persistence and mobile/offline acceptance

Private scenario state, original fault/repair, evidence rules, hints and lesson remain in the future server-only scenario module. Public catalog contains intended service/topology, not observed policy or canonical MAC. New shared helpers must not import private scenarios. Active Assessment receives only server-owned requested observations; no hints, primer or solution reveal. Preserve same-origin/input validation, no-store API headers, attempt-bound case ID, deadline/finalization and durable Blobs/ETag conflict handling. No process-memory session authority or new paid infrastructure.

Practice remains intentionally inspectable for offline use. New pack key proposed `netfault.practice.port-security-01.v1`; retain v1 journals and all eleven existing pack keys. Optional diagnosis/repair fields must preserve old records; raw recovery export includes the new key. Code rollback to an older release may not parse new case IDs: document export before rollback, never erase journals as a workaround. No migration or cross-device sync.

Offline full Practice requires successful online pack download and complete production shell cache over localhost/trusted HTTPS. Assessment and external references require connectivity; real companion work needs its own tools. Never cache API responses in the worker. Reuse update/retention architecture; no hosting change or deployment needed for implementation verification.

Desktop, 414px and 360px acceptance: inspect all four devices, readable long MAC/interface columns with internal scrolling, no document overflow, 44px controls, neutral three-link topology with text alternative, no node/zoom overlap, keyboard labels/focus and tap selectors. Show repair versions on saved evidence; selected old output is not a live reading. Apply wrong/correct changes, submit, explicitly open lesson/solution, view actual repaired preview and reopen journal. Browser emulation is not physical iPhone/Safari/VoiceOver verification.

## 10. Model-first implementation gates and test plan

Proceed only after separate 3M authorization. Recheck baseline and named seams, not another broad topic-selection audit. Do not fabricate output to avoid a failed integration gate.

### Gate A: independent model before authored case

1. Use independent names, ports/VLANs, MACs and subnets; validate full static/protect shape and source-MAC normalization. Admit equal values, deny unequal, remain independent of array order and private design metadata.
2. Reject multicast/zero/malformed MACs, empty or extra secure slots, unsupported max/mode/sticky/aging/counter fields, duplicate secure registrations, uplink policy, trunks/mixed models and unsupported topology. An absent physical host with the configured wrong MAC must remain legal as policy.
3. Prove real ingress filtering with carrier still up. Same data MAC on unsecured path is allowed. Down interface/inactive VLAN fails availability separately; a policy permit cannot resurrect missing topology.
4. Prove directed ARP-request rejection and reverse ARP-response rejection. No successful resolution/entry when either leg fails; successful exchange only when both permit. Direct self-delivery does not need admission.
5. Prove correct Ethernet source per routed segment, original IP source preserved, and no global peer-graph poisoning. A denied client must not destroy unrelated R1↔remote delivery. Negative fixtures must distinguish admission from IP ACL semantics and routing failure.
6. Verify actual data forwarding after resolution, independently routed replies and no echo reply without request delivery in this new model. A correct policy with a missing route still fails; a wrong MAC is not excused by a healthy route.
7. Derive all security/config/status outputs from state, including protect Secure-up with rejection. No invented violation counters, learned FDB, last-source events or automatic shutdown. Unsupported commands are honest.
8. Recompute after wrong/correct/revert edits; no-op normalization preserves version. ARP epoch clears only for effective edits, and authenticated replay agrees between Practice/server. Preserve LAB003/LAB011 epoch behavior.

### Gate B: authored case, grading and lifecycle

- Build healthy fixture then mutate exactly one secure MAC. Independently assert the table in section3, all addressing/link endpoints, intended C/L routes, packet paths and repair diff.
- Verify every initial evidence requirement is achievable; score correct/incorrect cause, location, observed address and mechanism independently. Accept address-format equivalents only as the same MAC; reject selecting/applying the remote host's MAC.
- Correct applied state without fresh observations stays recovered-unverified. Partial/stale/forged/cross-case history, invented ARP seed, old output after a later edit and merely selected fix cannot earn full recovery.
- Disabled security, capacity expansion, host-MAC spoofing, extra admitted addresses and routing/cabling changes fail invariant checks. Negative predicate tests assert policy denial rather than arbitrary connectivity failure.
- Preserve 10-change/100-command/deadline/finalization behavior; test independent server invocation reload, concurrent command/repair/submit and CAS retries using unchanged storage contracts.
- Round-trip old eleven packs/journals and new pack, hints, attempted changes, observations, feedback, reveal and raw export. Preserve corrupt-record recovery without destructive resets.
- Enumerate all twelve private cases in production asset/payload checks; no authored answers or policy fault in initial bundles/catalog. No-store/API exclusion and active Assessment primer/hint gating remain intact.

### Gate C: regressions and production browsers

Keep all prior LAB001–011 and Academy tests. Specifically protect LAB003 same-VLAN/ARP behavior, LAB008 aggregate member filtering, LAB010 both-endpoint STP filtering, LAB011 VIP owner/virtual-MAC/epoch/Standby routing, LAB009 source-aware outbound filter/local-origin exceptions, and LAB004/007 request/reply/loop behavior. Ordinary `peers`/OSPF behavior must be unchanged when the new policy is absent.

Add full Practice, resumed timed Assessment, stale verification rejection, cached offline Practice and primer checks on desktop/414px/360px. Extend existing all-pack next-hop/timer address fixtures for new PC-A without removing prior assertions. Cover invalid trial recovery, all command destinations, keyboard/touch controls, repaired preview, saved/reopened attempts and service-worker update/retention. Visually inspect screenshots in addition to assertions.

When implementing 3M, run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, then `$env:CI='true'; $env:PW_PRODUCTION='1'; pnpm test:browser`, and `git diff --check`. Report actual counts/files/failures/skips; distinguish initial infrastructure issues from final results. These commands are **future gates**, not executed in 3L. Keep a physical-iPhone manual checklist and honest unperformed device/Netlify statements.

## 11. Documentation and explicit exclusions for 3M

Add an implementation/model record and actual verification; update scenario authoring/correctness/architecture where needed, README, AGENTS, these planning status pointers, semester gap, engine feasibility and roadmap. Add a short UNEXECUTED companion brief if needed for the learning handoff. Keep original lecture/practical assets out of application bundles. Mark only this bounded admission skill as partial, never all LAN security or full port security.

Exclude every other LAB012 candidate; dynamic/sticky learning, full FDB, protect-with-spare-capacity behavior, restrict/shutdown/recovery, counters/aging/timers/logs, general MAC spoofing UI, DHCP/snooping/DAI/802.1X, voice/trunks, combined STP/LACP/HSRP, packet captures, throughput, NAT/GRE/IPsec/IPv6/QoS/automation, a general IOS parser, full Academy module, scenario randomization, dependency upgrades, persistence/deployment redesign and FlagForge.

Stop after exactly one authorized implementation and verified lab only if the user later requests 3M. **3L ends with planning.** No commit, push, Netlify project change, deployment or credit use is authorized.

## 12. Milestone 3L documentation verification

| Check                                 | Actual 3L result                                                                                                                                                                                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source archive / extracted originals  | ZIP hash matched the prior audit; all 29 non-PKA extracted entries matched their archive bytes. Two PKA entries verified for presence/size/hash only                                                                                                             |
| Source inspection                     | Twelve full revision outlines; candidate native text and specified gap passages; nine fresh candidate slide renders plus two existing ExtraLab renders visually inspected; all 304 freshly extracted practical paragraphs read, zero differences from prior text |
| Referenced files and Markdown anchors | Passed: 201 local references across seven changed Markdown files, including 21 source-line links. Linked code/source files exist; Markdown heading anchors resolve                                                                                               |
| Formatting                            | Installed Prettier write/check passed on both new documents; existing five documents retain targeted edits and historical formatting                                                                                                                             |
| Scope                                 | Passed: exactly seven Markdown files, no application/test/config/dependency changes                                                                                                                                                                              |
| `git diff --check`                    | Passed                                                                                                                                                                                                                                                           |
| Lint/typecheck/unit/browser/build     | Not run, as required for documentation-only scope; 3K results remain historical                                                                                                                                                                                  |

Created `docs/lab012-feasibility.md` and this document. Updated `README.md`, `AGENTS.md`, `docs/semester-2627-gap-analysis.md`, `docs/wia2008-engine-feasibility.md` and `docs/wia2008-roadmap.md`. The README's lab-selection range now correctly says 001–011; older planning positions are labeled historical. No private source assets were added to the repository.

Three linked Cisco technical references were opened; legacy documents' external references were not broadly retested. The initial restricted PowerPoint launch failed and the approved local read-only invocation succeeded, as disclosed in the audit. One multi-file documentation patch was rejected because an expected heading differed; it made no changes and was reapplied with the actual heading. Final documentation checks passed. No application test, physical-device validation or network-lab execution is inferred from those checks.

**3L complete. No LAB 012, engine capability, Academy content, command, persistence change, commit, push or deployment was implemented. 3M was not started; no Netlify credits were used.**
