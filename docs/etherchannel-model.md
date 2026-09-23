# Bounded EtherChannel model — Milestone 3F

LAB 008's learning objective is to distinguish physical carrier, member eligibility, logical bundle operation and host reachability, then justify, apply and verify a minimal configuration repair. Public documentation describes the model; the authored starting modes, fault, accepted repair and evidence rubric remain in the private scenario module. Source access and deliberately downloaded practice packs are inspectable; this is educational self-assessment, not a secure examination.

## Feasibility and representation

The feasibility gate passed before application changes. Existing access-VLAN traversal could consume a derived logical edge without replacing routing or the seven earlier scenarios. The only new graph is two switches, two physical inter-switch members, one host access link per switch, one access VLAN and two hosts on one IPv4 subnet. There is no alternate path or router. A missing host gateway is valid only for this schema-v7 same-subnet case; older schemas retain their validation.

`src/lib/etherchannel.ts` provides pure validation, carrier, channel-state and forwarding derivation. Each switch's strict `portChannels` entry declares local identity, two unique physical members, active/passive mode, VLAN, declared speed, administrative state and mandatory `standaloneDisable: true`. Physical links optionally declare availability. Both switches must use the same declared VLAN; cross-switch VLAN differences are rejected as unsupported, not diagnosed as a LACP negotiation check. LACP does not exchange remote access-VLAN numbers. Local group IDs need not match.

Carrier requires the cable and both physical endpoints up. A member additionally requires compatible declared speed/full duplex and locally consistent VLAN/channel policy. Active/passive and active/active can form; passive/passive does not initiate. Operational state requires at least one eligible negotiated member. Loss of one member can leave a working group; the model reports its count and does not measure bandwidth. A down logical interface or inactive VLAN prevents forwarding in this restricted model.

Every physical member is removed from independent traversal, including failed members. Only an operational group supplies a single logical edge to the existing VLAN walk. This behavior is explicitly conditioned on standalone forwarding being disabled, not a universal claim about every Cisco platform's default behavior. The authored design contains only one logical path, so no STP choice is necessary.

Unsupported: STP elections/convergence, trunks/native/allowed VLANs, PAgP or static `on`, arbitrary switch graphs, multiple groups, multi-chassis aggregation, minimum-link thresholds, packet exchanges/timers, hashing, balancing, throughput, unrestricted IOS configuration. Validation rejects unsupported group modes, fields, extra paths and topology shapes. Generic existing switch fields do not imply these capabilities.

## Diagnostics and applied changes

Switches expose `show interfaces status`, `show vlan brief`, `show running-config`, `show etherchannel summary`, `show lacp internal`, and `show interfaces port-channel 1`. PCs expose `ipconfig`, `ipconfig /all`, `route print`, `ping`, `tracert`. Commands outside the advertised list remain unsupported. No switch management IP or router hop is invented.

Summary uses `S` (Layer 2), `D` (down), `U` (in use), `P` (bundled), and `s` (suspended). Interface status adds an explicitly educational carrier column, separating carrier-up from suspended participation. LACP internal is a condensed local-mode/participation view, not a full IOS actor/key/PDU display. No counters, system IDs or timing are fabricated. Host probes and all outputs derive from the same current network state.

`repair-trial.ts` applies only a validated existing switch/group mode change; it does not parse configuration commands. UI selection alone does nothing. Actual changes are timestamped, bounded at ten and replayed into a clone. Reapplying the current state creates no new version. Commands remain bounded at 100. Every subsequent observation stores its configuration version; older observations remain readable and clearly labeled.

Assessment repair actions use the existing durable session reducer and compare-and-swap storage. Each command replays the persisted events; it does not depend on process memory. Submitted client history or repair arrays are ignored. Expired/final attempts cannot change. Grading checks cause, endpoint set, initial observations, resulting minimal repaired state, structured mechanism, and selected fresh verification of both logical endpoints and reciprocal traffic. Notes are recorded, not interpreted. Full credit cannot come from selecting a command or remediation alone.

Version-1 journals gain optional `repairs` and observation `repairIndex`; older journals remain readable. The new pack key is `netfault.practice.etherchannel-01.v1`. The storage implementation, Netlify Blobs/CAS store and worker architecture are unchanged. Practice requires an initial online download plus a completed production shell cache; it can then investigate, apply changes, grade and reopen offline. Assessment and external references require internet.

## Teaching and privacy

No Academy content or dependency was added. Existing IPv4 preparation remains available before assessment. The non-spoiling preparation is to read both host prefixes, separate physical from logical observations, and record baseline evidence before changing configuration. Seven-part private teaching covers a simple explanation, limited analogy, technical mechanism, worked investigation, guided practice, independent exercise and requested answer. For this lab, detailed feedback and worked solutions stay collapsed until requested, including after incorrect submissions. A collapsed panel is not a security boundary; finalized feedback is available to the learner.

Initial catalog/topology contains design intent and physical cabling only. Operating modes, faults, repair targets and private teaching are absent from fresh static assets/active assessment payloads. Mode choices are generic controls. The backend returns legitimate requested observations during assessment, as required to diagnose the fault. Practice packs remain deliberately inspectable.

## Historical and vendor references

Read all 23 native-text slides of historical `C:\Users\afiq hakiki\Documents\ant\Etherchannel.ppt`. Slides 3–8 cover grouping/compatibility, 14–16 LACP, and 17–23 configuration/verification. No slide assets were copied. Historical-materials-based roadmap: 2026/27 requirements remain unconfirmed.

- [Cisco Catalyst 9300 IOS XE 17.6 EtherChannel configuration](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-6/configuration_guide/lyr2/b_176_lyr2_9300_cg/configuring_etherchannels.html) documents mode combinations and `port-channel standalone-disable` on the port-channel interface.
- [Cisco Catalyst 9000 EtherChannel troubleshooting](https://www.cisco.com/c/en/us/support/docs/switches/catalyst-9300-series-switches/220367-troubleshoot-etherchannels-on-catalyst-9.html) supports member/aggregate diagnostics and mode interpretation.
- [Cisco Catalyst 9300 command reference](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/16-5/command_reference/b_165_9300_cr/b_165_9300_cr_chapter_0111.html) supports the summary/status command family and flags.

Lecture qualifications: slide 3's unqualified “not blocked by STP” conflicts with slide 6's correct redundant-logical-path qualification. STP can block a redundant bundle. Slide 15's `on` is static aggregation without LACP, not a negotiating mode. Capacity/group limits on slides 7/16 are platform-specific. This access-only case does not reproduce slide 20's trunk example or claim the chapter is complete. Source review does not replace running real IOS/Packet Tracer. See [execution and tests](milestone-3f.md) and [manual iPhone checks](iphone-testing.md).
