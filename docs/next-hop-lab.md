# LAB 007 — The Wrong Next Hop

`next-hop-01`, revision 1, schema v6. A present-but-wrong static route is distinct from LAB 004's absent return route. No OSPF is configured; no alternative default route hides the fault.

## Topology and configuration

PC-A — R1 — R2 — R3 — PC-B. Use the same eight interface addresses as [LAB 006](timer-lab.md), including correct PC gateways, but without any OSPF interface/process configuration. Router IDs remain stable device identities, not evidence of an enabled protocol. All interfaces are up.

| Router | Destination | Configured next hop | Intended next hop |
| --- | --- | --- | --- |
| R1 | 10.0.23.0/30 | 10.0.12.2 | Same |
| R1 | 192.168.30.0/24 | 10.0.12.2 | Same |
| R2 | 192.168.10.0/24 | 10.0.12.1 | Same |
| R2 | 192.168.30.0/24 | **10.0.12.1** | **10.0.23.2** |
| R3 | 10.0.12.0/30 | 10.0.23.1 | Same |
| R3 | 192.168.10.0/24 | 10.0.23.1 | Same |

The scenario constructs a healthy configuration first, then changes exactly R2's east-LAN nextHop to R1. Connected/local entries derive from interfaces. Transit routes ensure source-sensitive diagnostics do not introduce an unintended missing route.

## Observations and repair

The R2 static entry is installed because 10.0.12.1 resolves to a real directly linked router. PC-A's request follows R1 → R2 → R1; the engine detects the revisit and stops before PC-B. No reply is generated. A PC-B-originated request can reach PC-A but its reply encounters the same loop. These are two manifestations of one route fault, not a separate return-route omission.

Routers support `show ip interface brief`, `show ip route`, `show running-config`, `ping`, `traceroute`; PC-A supports `ipconfig`, `/all`, `ping`, `tracert`; PC-B supports `ipconfig` and `ping`. Optional router ping source behavior is preserved. Unsupported OSPF commands remain unsupported. A reachable adjacent next hop or gateway does not establish destination reachability.

Diagnosis requires R2, incorrect-static-next-hop cause, affected prefix 192.168.30.0/24, observed next hop 10.0.12.1 and replacement 10.0.23.2. Evidence combines R2's route/config with R1's onward route and R3's interface/config address. Grading: cause 10 + prefix 10 + observed next hop 10; router 20; evidence 15+15; correctly targeted static replacement 10; forwarding-loop mechanism 10. Notes remain ungraded. Missing-route/reply-only reasoning is not the accepted diagnosis.

Worked configuration:

```text
R2(config)# no ip route 192.168.30.0 255.255.255.0 10.0.12.1
R2(config)# ip route 192.168.30.0 255.255.255.0 10.0.23.2
```

The existing repair clones the scenario and replaces the single prefix entry. Every other route and interface remains identical. The request then reaches PC-B through R3; independently configured return routes restore both directions. Verify route/config views, both host pings and trace rather than accepting a substituted success string.

## Learning and assumptions

Seven parts cover plain-language routes, a delivery-branch analogy with limits, longest-prefix/next-hop installation and forwarding, actual packet journey, guided diagnostics, an independent opposite-direction loop and its requested-only solution. Four hints progress from local observations to consecutive forwarding decisions.

The simulator supports directly linked router static next hops, not arbitrary recursive resolution, ECMP or configurable distances. Loop detection is a stable path diagnostic, not a packet TTL clock. Traceroute does not fabricate timing or repeated TTL probes and reports responses only when they can return to the selected source. The request/return journey explicitly distinguishes an undelivered request from a delivered one whose reply fails.

## Verification and references

`tests/next-hop.test.ts` checks installation of the wrong route, reachable neighbor, exact loop hops, request/reply distinction, competing more-specific route, source/response reachability, schema bounds, exact healthy restoration and all-address matrix, grading alternatives/negative cases, persisted assessment and deadline priority. Browser tests play all devices, hints/evidence, structured diagnosis, seven-part feedback, requested solution, preview, saved journal and cached offline completion on desktop and 414px. See [verification](verification.md) for executed results.

Primary references checked: [Cisco static next-hop configuration](https://www.cisco.com/c/en/us/support/docs/dial-access/floating-static-route/118263-technote-nexthop-00.html) and [Cisco route selection/administrative distance](https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/15986-admin-distance.html). These support next-hop resolution and most-specific forwarding; the lab's particular loop is independently asserted by tests. No controlled IOS/CML/GNS3 run was performed.

Final renderer review: loop/hop-limit termination is explicitly labeled a simulator diagnostic, without an inferred ICMP host-unreachable packet. Returning hop responses retain their independent reachability check.
