# Bounded HSRPv2 and LAB 011

Milestone 3K implements one original investigation, **The shared exit** (`hsrp-01`, scenario revision 1, schema 10). The [3J design](milestone-3j-plan.md) remains the source of the exact address/cable/route tables. This is partial HSRP practice, not full FHRP coverage or verified failover competence.

## Model boundary

Exactly six devices: one client, one access switch/VLAN, two member routers, one upstream router and one remote host. Each member has one shared-LAN interface and one directly routed uplink. No mixed STP, LACP, ACL or OSPF model. The router interface has a strict optional `hsrp` object: explicit `version: 2`, `group` 0–4095, distinct usable on-link `virtualIp`, optional `priority` 0–255 and required `preempt: true`. Omitted priority means effective 100; configuration output preserves omission. Schema validation rejects mismatched group/VIP/subnet, duplicate physical/VIP addresses, ties, unsupported fields or topology, and nonmember standby diagnostics.

`hsrpState` is pure and derives eligible members from shared-LAN interface, link, access-port and VLAN availability. It sorts unequal effective priorities: highest eligible member is Active, the other eligible member is Standby. With only one eligible member there is no Standby; with none there is no owner. These are defensive static test snapshots, not learner-triggered outages. LAN eligibility does not depend on upstream routes: tracking is absent. No timers, messages, events, incumbent/restart history, equal-priority election, missing-preempt case, authentication, custom MAC, v1, multiple groups/VLANs, VRRP, GLBP or IPv6.

Preemption is a prerequisite to this settled-state result. Higher priority is **not** an unconditional instantaneous-takeover rule for arbitrary real HSRP deployments. Missing preemption and equal-priority incumbency need a different state/history design and are deferred.

## Forwarding and identity

The host gateway remains the VIP; physical member addresses remain distinct. Shared next-hop resolution finds the derived Active owner, then requires that actual member interface to be reachable through the ordinary same-VLAN Layer 2 traversal on the selected egress. The packet's remote IPv4 destination is unchanged. The Active router must perform normal route lookup and forwarding; the Standby cannot silently rescue a route missing on Active. Standby continues ordinary physical-interface routing, including reply traffic. No HSRP-generated routes or route preferences exist.

Local VIP delivery and echo replies use the same ownership helper. A remote VIP probe must first reach the owner through real modeled forwarding: destination lookup does not teleport packets. Explicit router ping sources remain active local physical interfaces only. The condensed trace lists actual physical interface hops, omits access switches, and never inserts a fictitious virtual-router hop. It is not byte-for-byte IOS/Windows traceroute.

HSRPv2 virtual MAC is `0000.0c9f.f000 + group`, giving `0000.0c9f.f00b` for group 11. This is deterministic, not random. ARP observations use resolved logical IP/MAC metadata from actual forwarding. They can also contain learned physical addresses; only the VIP mapping is expected to remain identical after ownership changes. No packet-level ARP, cache aging, gratuitous ARP, switch FDB learning, background traffic or timing is simulated.

For schema 10, `execute` receives the current repair index from both Practice and Assessment. ARP replays only preceding observations in that configuration epoch. An actual edit starts a new empty simulated observation epoch; a no-op does not. This is an explicit simulator rule, **not** a claim that real HSRP flushes host caches. Saved old outputs remain unchanged. LAB 003 keeps its original attempt-level ARP behavior. The HSRP grader authenticates history against the correct version and preceding authentic observations, so fresh ARP cannot be credited from an empty-history stub or stale probe.

## Authored network and sole defect

PC-A `172.28.10.10/24` uses VIP `172.28.10.1`; SW1 has three VLAN-10 access ports. R1/R2 LAN addresses are `.10.2` and `.10.3`. R1–R3 is `10.0.13.0/30`; R2–R3 is `10.0.23.0/30`; R3–PC-B is `172.28.20.0/24`, with PC-B `.20.10` and gateway `.20.1`. Router IDs are explicitly 1.1.1.1, 2.2.2.2 and 3.3.3.3; they do not enable OSPF.

R1 priority **90** is the sole defect against the approved preference; R2 uses default **100**. Both preempt. Initially R2 is Active and R1 Standby, with successful reciprocal pings. Canonical repair sets R1 priority **150**; all integers **101–255** are accepted while preserving R2 and every other configuration field. The public incident describes an audit with working connectivity; legitimate design documentation names R1's primary service path and R2's preserved fallback baseline, without revealing observed roles or the fault value.

Initial request: PC-A → SW1 → R2 → R3 → PC-B. Corrected request: PC-A → SW1 → R1 → R3 → PC-B. Return direction is always PC-B → R3 → R1 → SW1 → PC-A. R3's fixed static route via R1 deliberately bounds this exercise: actual R1 failure could break return delivery despite R2 owning the VIP. This lab verifies all-up role selection, **not end-to-end failure resilience**.

## Diagnostics, trials and grading

The only new command is a derived Cisco-like subset of `show standby brief`, on R1/R2: interface, group, effective priority, preempt indicator, settled role, Active/Standby physical identities or `local`, and VIP. No invented timers, counters or authentication fields. Existing running-config gains derived HSRP statements. PC-A offers ipconfig, /all, route print, ARP, ping and tracert; SW1 offers VLAN/status/configuration; all routers offer interface brief, route/configuration, ping and traceroute; PC-B offers ipconfig/ping. Unsupported commands are explicit.

`hsrp-priority` is a strict structured action with device, interface, group and priority. Its explicit dispatch precedes legacy STP `priority` and LACP `group` branches. It changes only one existing member's priority, rejects ties without recording a version, preserves omitted defaults on restoration, and reuses ten-effective-change, 100-command, deadline, immutable-finalization and CAS semantics. No free-form CLI parser, failure controls, host-gateway bypass or unrelated edits are added.

The rubric is 20 cause/initial priority, 10 exact member/interface/group, 30 original evidence, 20 actual minimal repair/structured mechanism, and 20 fresh verification. Original evidence requires both member brief views, both configurations and PC-A gateway configuration. Full verification requires selected latest-version observations: both member brief views, R1 running-config, PC-A VIP ping then ARP, PC-A remote ping and reciprocal PC-B ping. A valid edit alone yields recovered-unverified, not verified; initial success or stale evidence cannot complete the lab. Notes are saved without interpretation. Recovery compares configuration invariants, complementary eligibility/roles and actual bidirectional delivery. Wrong-router lowering, bypass/removal and unrelated route changes cannot pass.

## UI, learning and persistence

Six neutral physical nodes have a dedicated responsive layout and a text cabling/identity alternative. Controls and device selectors remain tap-accessible; terminal columns scroll within the output pane. A tiny optional card uses Juniper/Maple, group 42 and different priorities, with guided/independent tap predictions and requested reasoning. It is hidden during active Assessment; no Academy module, revision or progress migration is added. Private feedback retains seven lesson parts, analogy limits, worked correction, independent exercise and explicit answer reveal. The actual before/after preview is labeled non-evidence.

Practice pack: `netfault.practice.hsrp-01.v1`; journals remain `netfault.journal.v1`. New optional diagnosis and repair fields do not rewrite old records. Raw recovery export includes the new pack. Older releases cannot necessarily read new schema-10 packs/attempts: export before a code rollback and never clear storage as a routine workaround.

Assessment remains online and server-owned. No storage architecture, Blobs strong-read/ETag CAS, service-worker architecture, dependency, hosting setting or secret is changed. APIs remain no-store. Public catalog/primer contain conceptual data and design intent; exact scenario configuration, fault, accepted repair, hints and rubric data are server-only until the established feedback/Practice-pack flow. Practice is intentionally inspectable, and this remains personal self-assessment rather than a secure proctored exam.

## References and verification boundaries

On 26 September 2026, the existing extracted `3.FHRP.ppt` and original `26.27_material.zip` hashes still matched the [3J audit](fhrp-feasibility.md). The prior native-text extraction (29 slides) and actual `3.FHRPrv.txt` were reread. No fresh PowerPoint visual rendering or device execution occurred in 3K; 3J's explicitly documented visual inspections remain historical. Source slides 6–7 support virtual identity/ARP, 17–18 priority and preemption, and 23–27 configuration/verification. The incomplete state table, v1/v2 screenshot difference and omitted version in one excerpt remain qualifications; tracking was not established by the inspected material.

[Cisco's HSRP configuration guide](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/network-services/network-services/m_fhp-hsrp-0.html) was reopened for virtual ownership, priority/preemption and v2 MAC rules. Documentation/model tests do not constitute Cisco IOS, Packet Tracer, CML or physical network validation. Exact local results and remaining device checks are in [Milestone 3K](milestone-3k.md).
