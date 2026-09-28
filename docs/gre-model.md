# Bounded GRE-over-IPv4 model

Implemented by Milestone 3Q for exactly **LAB 014 — The path above**, `gre-01`, revision 1, schema 13. The independently named/addressed model fixtures do not import the case. The [3P plan](milestone-3p-plan.md) remains the design contract; this is a deterministic forwarding abstraction, not IOS or a packet emulator.

## Three separate layers

- **Underlay:** physical numbered interfaces, four real links, C/L routes and directly adjacent static next hops. It uses the existing route lookup and directed Ethernet delivery. Physical state includes both link ends and the link's optional `up` value, limited to schema 13 so older semantics are unchanged.
- **Tunnel:** an optional strict router `gre` object: `name: Tunnel0`, `mode: gre-ip`, a physical `sourceInterface`, canonical IPv4 `destination`, logical `ip`, `/30` prefix and `adminUp`. Exactly two endpoint routers, one transport router and two directly attached PCs are supported. Logical identity never enters physical peer discovery and has no MAC or ARP entry.
- **Overlay:** strict `tunnelRoutes` select exit interface Tunnel0. Connected tunnel /30, local /32 and eligible static exits enter the RIB only when local line state is up. They cannot cover the transport or tunnel subnet. They never supply physical underlay routes. Longest prefix and existing connected/static preference remain independent.

Physical transport sources must be distinct /30 networks, logical addresses distinct usable unicast members of a separate /30, physical subnets nonoverlapping and physical MACs unique/canonical. A destination can identify a reachable transport router: schema validation must not reject the authored fault as an invalid answer. Unsupported fields on GRE, overlay routes and repair actions are rejected. The legacy physical interface and static-route schemas are preserved.

## Local state is not remote liveness

Local line-up requires administrative enablement, an operational numbered physical source and an installed **physical** route covering the configured destination. It does not ping, negotiate, inspect remote availability or wait for a timer. A remote break or a reachable wrong destination can leave the local interface up/up. Missing local routability/source availability withdraws tunnel-connected and overlay static routes. Administrative shutdown is distinguished from an enabled interface whose line protocol is down.

This implements the local routability/source distinction described by [Cisco's GRE state note](https://www.cisco.com/c/en/us/support/docs/ip/generic-routing-encapsulation-gre/118361-technote-gre-00.html), reviewed 28 September 2026. In particular, its detailed point-to-point examples distinguish routability from reachability; the brief introductory up/up description is not used as a remote-delivery guarantee. Reference review is not device execution.

## Forwarding and actual receiver

1. Ordinary inner route selection chooses Tunnel0. Retain the inner source and destination without translation.
2. Resolve the configured physical source and outer destination. Run the same bounded forwarding function with a physical-only RIB/L3 view and a separate loop guard.
3. Traverse the real route and link sequence. Record actual outer receiver identity; no peer is chosen from a lab ID, expected repair, logical arc or global destination shortcut.
4. The delivered router must own an enabled, locally operational GRE endpoint whose physical source equals the outer destination and whose configured destination equals the outer source. A transport router receiving the outer packet cannot resume inner delivery.
5. Resume the original inner packet at the receiving tunnel side, then apply ordinary inner routing/local delivery.
6. Generate the reply at the actual delivered inner endpoint using its received addresses. Independently route/encapsulate/receive the reply. Success requires arrival at the original device and matching original address identities.

Only one encapsulation per direction is supported. Repeated/nested traversal fails explicitly; physical underlay lookup never consults overlay routes. Missing LAN routes, missing return routes, link failure and failed receiver matching remain independent failures. The explanatory journey records outer paths inside each inner direction and is explicitly **not traceroute**.

RFC [2784](https://www.rfc-editor.org/rfc/rfc2784) describes encapsulation and resumption of payload forwarding. The simulator does not construct those headers or implement TTL, checksums, fragmentation or protocol numbers. Fixed receiver matching is the approved bounded pair abstraction, not a claim about every IOS image's demultiplexing behavior.

## LAB 014's sole fault

| Device | Physical interfaces                         | Logical interface / gateway        |
| ------ | ------------------------------------------- | ---------------------------------- |
| PC-A   | Ethernet0 172.31.10.10/24                   | gateway 172.31.10.1                |
| R1     | Gi0/0 172.31.10.1/24; Gi0/1 192.0.2.1/30    | Tunnel0 10.14.0.1/30, source Gi0/1 |
| T1     | Gi0/0 192.0.2.2/30; Gi0/1 198.51.100.1/30   | no tunnel                          |
| R2     | Gi0/0 198.51.100.2/30; Gi0/1 172.31.20.1/24 | Tunnel0 10.14.0.2/30, source Gi0/0 |
| PC-B   | Ethernet0 172.31.20.10/24                   | gateway 172.31.20.1                |

R1/T1/R2 router IDs are 1.1.1.1/2.2.2.2/3.3.3.3 metadata; no OSPF runs. MACs are canonical `0200.0014.0001` through `0200.0014.0008`, equivalent to the plan's colon notation.

R1 physical route: 198.51.100.0/30 via 192.0.2.2; overlay: 172.31.20.0/24 via exit Tunnel0. R2 physical route: 192.0.2.0/30 via 198.51.100.1; overlay: 172.31.10.0/24 via exit Tunnel0. T1 has only C/L transport routes. R2's configured destination is 192.0.2.1.

**Only R1's destination is wrong: 198.51.100.1 instead of 198.51.100.2.** Ordinary source-aware underlay probes to both succeed; local tunnel state and route tables remain up/installed. Actual outer delivery to T1 does not deliver the inner packet. A corrected R1 destination restores both tunnel-IP and PC exchanges without changing any route, source, address, MAC, interface state or cable.

## Commands, trials and grading

All routers support interface brief, routes, running configuration and source-aware ping; only GRE endpoints support `show interfaces tunnel 0`. Both PCs support ipconfig, ipconfig /all and ping. Tunnel output includes supported local state, logical address, physical source/destination and GRE/IP mode with an explicit limitations footer. No synthetic counters, timers, bandwidth, MTU values or peer status. There is no GRE trace or ARP command. Unsupported commands fail honestly.

Strict `gre-destination` trials replace only an existing destination, normalize outer whitespace around IPv4 and allow valid wrong-side/wrong-value attempts. Replay, ten-change limit, no-op version retention, deadlines, 100-command limit and immutable finalization use existing machinery. Any actual new change invalidates prior recovery verification, including changing away and back.

The [exact rubric](milestone-3p-plan.md#7-deterministic-evidence-and-grading) is preserved: cause/observed field 20, exact location 10, original evidence 30, applied minimal recovery/mechanism 20, fresh verification 20. Eight original observations and seven fresh observations are sufficient. Replay authenticates command output with scenario, source and configuration epoch; duplicates, forged text, unsupported commands, foreign cases and stale versions do not satisfy evidence. Minimal recovery also checks invariant device/link state and actual tunnel traversal in both request and reply for both PC and logical-interface directions. A bypass or selected answer alone cannot count as recovery.

## Boundaries and privacy

No IPsec, encryption, authentication, keys, keepalives, remote liveness, timers, counters, MTU/PMTUD, real headers/TTL, recursive routing, mGRE/DMVPN/NHRP, IPv6, dynamic routing over GRE, mixed NAT/ACL/L2 protocols, arbitrary tunnel graphs or additional labs. This is partial GRE troubleshooting coverage, not full WAN/VPN competence.

Exact case configuration, fault, expected repair, hints and lesson live in the server-only scenario. Public metadata shows neutral design and intended logical relationship. Generic model/structured controls are public so explicit downloaded Practice remains playable offline; it is inspectable self-study, not tamper-proof examination. Assessment histories/actions/final grades remain server-owned through unchanged durable storage/CAS. APIs are no-store and never worker-cached. Initial online shell plus explicit pack download is required for offline Practice; Assessment and uncached content require internet.
