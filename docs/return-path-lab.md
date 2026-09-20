# LAB 004 — The Missing Return Path

Milestone 2C adds exactly one lab, `return-01`, revision 1, schema v4. This authoring guide contains solutions. The initial incident is neutral; learners discover configuration using commands. No prior lab configuration changes.

## Topology and state

`PC-A — SW1 — R1 — R2 — PC-B`

| Device | Interface                  | Address                  | Gateway / routing              |
| ------ | -------------------------- | ------------------------ | ------------------------------ |
| PC-A   | Ethernet0                  | 192.168.10.10/24         | 192.168.10.1                   |
| SW1    | Gi0/1 to PC-A, Gi0/2 to R1 | Unnumbered access switch | Both up, active VLAN 10        |
| R1     | Gi0/0                      | 192.168.10.1/24          | Connected Network A            |
| R1     | Gi0/1                      | 10.0.12.1/30             | Static Network B via 10.0.12.2 |
| R2     | Gi0/0                      | 10.0.12.2/30             | Connected transit              |
| R2     | Gi0/1                      | 192.168.20.1/24          | Connected Network B            |
| PC-B   | Ethernet0                  | 192.168.20.10/24         | 192.168.20.1                   |

All interfaces are up. Router IDs remain unique metadata for schema compatibility but do not enable a protocol. No OSPF, default routes, ACLs, NAT, DNS dependence or VLAN fault exists. SW1 forwards within VLAN 10 and never appears as an IP hop.

R1 has `ip route 192.168.20.0 255.255.255.0 10.0.12.2`. R2 has only connected subnet and local /32 routes. The single defect is R2's missing return route to Network A.

## Expected packet behavior

| Probe                                   | Before repair                               | Why                                                                                                  |
| --------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| PC-A → 192.168.10.1                     | Success                                     | Local LAN, valid switching and addressing                                                            |
| PC-B → 192.168.20.1                     | Success                                     | Correct local gateway                                                                                |
| PC-A → PC-B                             | Request delivered, reply fails at R2        | R1 static + R2 connected routes deliver request; R2 has no match for reply destination 192.168.10.10 |
| PC-B → PC-A                             | Request stops at R2                         | Destination Network A has no route                                                                   |
| R1 → PC-B, default source               | Success                                     | Source 10.0.12.1 is on R2's connected transit                                                        |
| R1 → PC-B, source Gi0/0 or 192.168.10.1 | Request delivered, reply fails              | Source is on Network A                                                                               |
| PC-A tracert PC-B                       | R1 192.168.10.1, then stars for R2 and PC-B | Later responses cannot route back to PC-A                                                            |

The request and reply are separate IP packets. No reverse-path memory exists. The existing `connectivity` result retains `ok`, `source`, `outward` and `returning`. `returning` is a reachability query for the destination's path to the source; if `outward.ok` is false it does not mean a reply was generated. The teaching journey displays a reply only when the request was delivered.

An ICMP error about the failed echo **reply** would be addressed to PC-B (that packet's source), not automatically to PC-A. PC-A sees no echo reply. For outward forwarding failures, the trace renderer also checks whether a modeled unreachable response can return before displaying it. Stars never reveal an unreachable router's private failure reason.

## Commands

| Device | Commands                                                                      |
| ------ | ----------------------------------------------------------------------------- |
| PC-A   | ipconfig, ipconfig /all, ping, tracert                                        |
| SW1    | show vlan brief, show interfaces status, show running-config                  |
| R1, R2 | show ip interface brief, show ip route, show running-config, ping, traceroute |
| PC-B   | ipconfig, ping                                                                |

Router ping has an optional **Ping source** input. Blank selects the outgoing interface; an explicit value must match an active local interface name or IPv4 address. It applies only to ping, resets on device changes, and is included in server/practice history and exported journals. This is a bounded extended-ping facility, not a command-line parser. All commands use the same shared configuration/forwarding model.

Route output includes C, L and S codes; static entries show `[1/0]`. Running-config shows configured static routes and no invented OSPF stanza. Connected interface withdrawal removes dependent installed static routes while leaving their authored configuration visible.

## Diagnosis, evidence and repair

Identify R2, missing destination route, network `192.168.10.0/24`, next hop `10.0.12.1`, the static-route action and the explanation that replies need their own destination lookup.

| Component                                                 | Points  |
| --------------------------------------------------------- | ------- |
| Missing-route cause + exact missing prefix                | 20 + 10 |
| Exact affected-device set R2                              | 20      |
| R1 show ip route                                          | 10      |
| PC-A ipconfig or /all together with R2 show ip route      | 20      |
| Correct static action, target router, prefix and next hop | 10      |
| Structured reply-forwarding explanation                   | 10      |

Evidence order is unrestricted. A failed ping alone earns no evidence points. R2's table needs context about the required reply destination. Forged IDs, other-scenario evidence and command-error outputs do not count. CIDR/address fields are structured exact values with outer whitespace ignored; arbitrary prose is never evaluated. Notes support reflection and are saved verbatim.

```text
R2(config)# ip route 192.168.10.0 255.255.255.0 10.0.12.1
```

The repaired clone adds only that route. R2 forwards the reply to R1; R1's connected LAN delivers it to PC-A. Preview shows before/after R2 routes, source/destination packet journeys, both router configs, bidirectional host pings, the formerly failing LAN-sourced router ping and successful trace. Unit tests compare all other state unchanged and all modeled IP endpoints reachable after repair.

## Learning and modes

Four hints progress through local checks, table comparison, separate request/reply packets and the reply destination lookup. They are recorded in the journal. The seven-part lesson covers simple explanation, parcel analogy and limits, connected/static/next-hop/longest-prefix details, the twelve-step packet journey, guided diagnosis, a different-subnet Cedar/Maple exercise and its explicitly requested solution. It distinguishes observations from proof: many faults can cause failed pings.

Practice downloads its own `netfault.practice.return-01.v1` pack and works offline after the production shell is cached. Previous pack keys and version-1 journals remain valid; raw recovery export now includes the fourth pack. Browser storage is origin-specific and can be evicted. Assessment remains online-only, 20 minutes, with server-owned history/deadlines/grades and unchanged local-file or hosted Blobs/ETag storage. Neither answers nor lessons are in initial assessment data/static assets. Downloaded practice packs are deliberately inspectable; this is personal self-assessment, not secure examination infrastructure.

## Verification procedure and limits

Start locally with `pnpm dev`, or `pnpm build` then `pnpm start` for offline verification, and choose LAB 004. Compare local/remote host pings, inspect all devices, compare R1's default and LAN sources, capture the three sufficient observations, submit the structured diagnosis and open the repaired preview. Reload and reopen the journal. Cache all four packs online, reload once after service-worker readiness, go offline and repeat the fourth lab. Use the existing production browser harness at desktop and 414 × 896 CSS pixels; see [verification](verification.md) and [physical iPhone checklist](iphone-testing.md).

Model boundaries: single active directly linked router next hop per static prefix; no recursive static routing, ECMP, configurable administrative distance, route tracking, ARP aging, TTL probe timing, latency, packet captures or general IOS shell. Prefixes /0 through /32 and longest-prefix selection are supported; LAB 004 itself intentionally has no default route. Connected/local beats static beats OSPF for identical installed prefixes. Static-route schema validation intentionally rejects next hops through a switch or recursive route. Existing OSPF/access-switch behavior is retained.

No physical IOS, CML/GNS3/Packet Tracer, physical iPhone, native Safari or live Netlify deployment was executed for this milestone. Command output is condensed, and ping uses the shared five-probe summary on both PCs and routers. Trace is a hop-reachability abstraction, not exact Windows/Cisco wire behavior. Nothing was committed, pushed, provisioned or deployed.

## Primary references consulted

- [Cisco extended ping and traceroute](https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13730-ext-ping-trace.html): outgoing-interface source by default, optional local source and requirement for a reply path.
- [Cisco route selection](https://www.cisco.com/c/en/us/support/docs/ip/enhanced-interior-gateway-routing-protocol-eigrp/8651-21.html): administrative distance when installing identical prefixes versus longest-prefix forwarding.
- [Cisco basic IP routing](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/ip-routing/b-ip-routing/m_iri-iprouting.html): static route syntax and default distance.
- [RFC 792](https://www.rfc-editor.org/info/rfc792/): echo request/reply addressing and ICMP error destinations.

Reviewed during this implementation, 2026-09-21. Reference review grounds the model; it is not external execution of this configuration.
