# LAB 009 — bounded standard IPv4 ACL model

Implemented in Milestone 3G, 24 September 2026. This is an original teaching scenario informed by the supplied semester material, not a completed UM practical or a full IOS emulator. Author-facing details below are spoilers; they are not bundled into the public app. See [implementation and verification](milestone-3g.md) and the historical [approved plan](milestone-3g-plan.md).

## State and forwarding

Schema v8 adds a named, nonempty standard IPv4 ACL on a router, with at most two entries and one list/attachment per router. Entries have stable identity, unique increasing sequence numbers 1–999, permit/deny action and either `any` or a canonical /24 source network. Only outbound attachment to an existing numbered interface is modeled. Unknown predicates, inbound bindings, malformed networks, duplicate sequences and unsupported repair fields are rejected. There is no host-entry hashing or arbitrary wildcard matching.

`acl.ts` evaluates the first matching configured entry, returning implicit deny if no entry matches. It never sorts a broken policy into a healthy one. Only an explicit sequence trial changes order. Route selection and interface availability precede outbound evaluation in `engine.ts`; a permit cannot create a route. A source address remains unchanged across transit hops. An echo reply exists only if the request arrived, then undergoes independent routing and policy evaluation using its own source. Local router delivery does not exit an interface. Ordinary outbound ACLs do not filter traffic originating at that same router; an R1-originated probe still crosses R2's filter.

These semantics follow Cisco's [ACL sequence guide](https://www.cisco.com/en/US/docs/ios-xml/ios/sec_data_acl/configuration/15-2mt/sec-acl-seq-num.html) and [IOS XE ACL overview](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/sec-vpn/b-security-vpn/m_sec-access-list-ov-0.html), reviewed during planning and rechecked during implementation. The latter distinguishes ordinary outbound transit filtering from optional `match-local-traffic`, which this model does not enable. This is documentation-based validation, not an executed Cisco/Packet Tracer experiment.

## Scenario and independent expectations

PC-A — R1 — R2 — PC-B. All interfaces and links are up; gateways and both static routes are correct. No switch, VLAN, OSPF or secondary routing fault is involved.

| Device | Interfaces                               | Gateway or static remote route |
| ------ | ---------------------------------------- | ------------------------------ |
| PC-A   | Ethernet0 172.24.10.10/24                | 172.24.10.1                    |
| R1     | Gi0/0 172.24.10.1/24; Gi0/1 10.49.0.1/30 | 172.24.20.0/24 via 10.49.0.2   |
| R2     | Gi0/0 10.49.0.2/30; Gi0/1 172.24.20.1/24 | 172.24.10.0/24 via 10.49.0.1   |
| PC-B   | Ethernet0 172.24.20.10/24                | 172.24.20.1                    |

Only defect: R2's `WORKAREA`, outbound Gi0/1, has `10 deny any` before `20 permit 172.24.10.0 0.0.0.255`. The public design intent allows forwarded office sources into the protected LAN and excludes other forwarded sources. A valid repair moves the permit earlier (for example 20 → 5), or the deny later (10 → 30), retaining both rules and the binding.

| Probe                         | Initially | Reordered policy | Reason                                                         |
| ----------------------------- | --------- | ---------------- | -------------------------------------------------------------- |
| PC-A → local gateway          | succeeds  | succeeds         | Does not traverse protected egress                             |
| PC-A → PC-B                   | fails     | succeeds         | Office source matches first deny, then repaired permit         |
| PC-B → PC-A                   | fails     | succeeds         | Request arrives; office-sourced reply crosses protected egress |
| R1 → PC-B, source 172.24.10.1 | fails     | succeeds         | Office source                                                  |
| R1 → PC-B, source 10.49.0.1   | fails     | fails            | Excluded source remains denied                                 |
| R2 → PC-B                     | succeeds  | succeeds         | Locally originated at filtering router                         |

The negative control is checked for an actual drop at the intended ACL, not just any failed connectivity. Missing routes cannot masquerade as retained protection.

## Diagnostics, edits and grading

Routers expose `show ip interface brief`, `show ip route`, `show running-config`, `show access-lists` and source-aware `ping`. PCs expose `ipconfig`, `ipconfig /all` and `ping`. Outputs derive from the active state; `show access-lists` shows order/sequence and running-config shows rule order and attachment. Running-config omits sequence numbers, consistent with the cited IOS NVGEN boundary. Failed pings report failure without revealing the exact matching rule. No invented hit counters, logs, ACL traceroute or ARP output is offered.

The existing configuration-trial panel accepts router, observed ACL name, existing sequence and an unused new sequence. The action moves an existing rule atomically, preserving its identity, action, source and attachment. Unsupported deletion, permit-any replacement, routing changes and attachment edits are rejected. Wrong legal order changes remain ineffective. A no-op creates no version; at most ten actual changes and 100 commands are allowed. Real CLI edits are not atomic; the worked IOS-style example explains this difference and does not claim startup configuration was saved.

Grading uses structured inputs and actual replayed state, never prose matching. The 100 points comprise initial cause/first match (20), exact policy location (10), baseline evidence (30), applied policy-preserving recovery and mechanism (20), and fresh verification (20). Baseline evidence must precede changes: PC-A configuration and failed remote ping, both router route tables, R2 ACL and attachment views. Full fresh verification requires selected current R2 ACL/config plus reciprocal successful host pings and an explicitly sourced R1 excluded-source ping. An interface source alias resolving to the same local address is accepted. Checks recompute outputs and require the latest observation version. Older outputs remain readable but cannot verify a later state.

Recovery is reported separately as unresolved, recovered but unverified, or verified. Predicates, actions, interfaces, routes and attachment must remain identical to the original, except sequence/order. Equivalent sequence solutions earn credit. One successful probe, selecting a fix without applying it, or a permissive bypass cannot earn full recovery credit. Detailed teaching and worked solutions remain explicitly opened after feedback.

## Privacy, persistence and limits

`acl-01` revision 1 uses `netfault.practice.acl-01.v1`. Optional ACL repair events/diagnosis fields and observation versions preserve version-1 journal compatibility. Old scenario modules/revisions, Academy and storage keys remain unchanged. Assessment uses the existing server-owned reducer and durable Blobs/ETag conflict handling; no process-memory storage or new route is introduced. Commands/trials/grades are persisted and finalization/deadlines enforced server-side. APIs remain no-store and outside service-worker caches.

As with earlier new-lab releases, an older application cannot parse the new scenario ID/repair event. Export journals before a separately authorized rollback across this boundary. The new release reads older records without migration; rollback is not a reverse migration.

Private authored ACL values, repair, evidence rules, hints and lesson remain in `src/server/acl-scenario.ts`. Active assessment responses and initial static assets do not contain them. As with earlier labs, a deliberately requested Practice pack contains inspectable answers for offline play. This is self-assessment, not an answer-confidential examination: switching to Practice or inspecting a downloaded pack can reveal answers. The pack is app local storage, not service-worker API caching. Assessment requires internet; cached Practice, trials, feedback, journal and preview work offline after a successful production shell/pack load.

Unsupported: inbound ACLs, arbitrary prefixes/wildcards, host entries, extended/IPv6 ACLs, ports/protocol matching, NAT, stateful firewalls, counters/timing, packet capture, arbitrary topology/IOS parsing and all other excluded milestone features. Source matching is not authentication. No claim of complete ACL, security or semester coverage is warranted.
