# LAB 005 — The Silent OSPF Interface

Milestone 2D adds exactly one scenario: `passive-01`, revision 1, schema v5. This authoring guide contains solutions. The public incident and neutral topology do not identify the faulty interface. LAB 001's area mismatch and LAB 002–004 configurations remain unchanged.

## Topology and sole fault

`PC-A — R1 — R2 — R3 — PC-B`

| Device          | Interface | Address          | Gateway / OSPF configuration                    |
| --------------- | --------- | ---------------- | ----------------------------------------------- |
| PC-A            | Ethernet0 | 192.168.10.10/24 | Gateway 192.168.10.1                            |
| R1, RID 1.1.1.1 | Gi0/0     | 192.168.10.1/24  | Area 0, passive broadcast LAN                   |
| R1              | Gi0/1     | 10.0.12.1/30     | Area 0, active point-to-point                   |
| R2, RID 2.2.2.2 | Gi0/0     | 10.0.12.2/30     | Area 0, active point-to-point                   |
| R2              | Gi0/1     | 10.0.23.1/30     | Area 0, point-to-point, **incorrectly passive** |
| R3, RID 3.3.3.3 | Gi0/0     | 10.0.23.2/30     | Area 0, active point-to-point                   |
| R3              | Gi0/1     | 192.168.30.1/24  | Area 0, passive broadcast LAN                   |
| PC-B            | Ethernet0 | 192.168.30.10/24 | Gateway 192.168.30.1                            |

Every interface is up/up. OSPF timers are Hello 10 / Dead 40, MTU 1500, cost 1, no authentication. The simulator renders local process 1 on each router; matching process numbers are not an adjacency requirement. Ethernet /30 addressing does not select point-to-point OSPF automatically: the transit type is explicitly configured and remains point-to-point even when passive. No static or default routes conceal the missing learned routes.

R2 Gi0/1's `passive: true` is the only intentional fault. It suppresses Hellos and prevents the R2–R3 adjacency, while normal connected IP traffic remains possible. R1 Gi0/0 and R3 Gi0/1 are intentionally passive host LAN interfaces.

## Derived behavior

Before repair, R1 and R2 are reciprocal `FULL/-` neighbors; R3 has no established neighbor. All command outputs use the same state. The neighbor command explicitly describes established adjacencies only: it does not invent INIT, 2-WAY, EXSTART or a live dead timer progression. The passive OSPF interface shows its area, point-to-point type, timers, MTU, no authentication, `No Hellos (Passive interface)` and zero neighbors. A vendor-specific passive interface FSM state is omitted.

Passive does **not** necessarily stop advertisement of an OSPF-enabled connected subnet. R2 still advertises 10.0.23.0/30 through its working relationship with R1. The connected network appears as a stub link in OSPF's area information; this does not configure a stub area. The engine derives routes over the established adjacency component and includes its up, OSPF-enabled passive prefixes.

| Router | Additional routes before repair         | Additional routes after repair                                                |
| ------ | --------------------------------------- | ----------------------------------------------------------------------------- |
| R1     | O 10.0.23.0/30 via 10.0.12.2, cost 2    | Also O 192.168.30.0/24 via 10.0.12.2, cost 3                                  |
| R2     | O 192.168.10.0/24 via 10.0.12.1, cost 2 | Also O 192.168.30.0/24 via 10.0.23.2, cost 2                                  |
| R3     | None beyond its C/L routes              | O 10.0.12.0/30 via 10.0.23.1, cost 2; O 192.168.10.0/24 via 10.0.23.1, cost 3 |

Connected/local routes and addresses do not change. Before repair, both PCs can ping their gateways, but neither can ping the other PC. PC-A's remote request stops at R1's missing destination route; R1 can return that unreachable response. A trace toward 10.0.23.2 can reach R2, but R3 cannot return a probe response to PC-A, so R3 is not shown as a responding hop. Connected reachability alone does not establish OSPF adjacency or end-to-end reachability.

R2 pinging 10.0.23.2 with default source 10.0.23.1 succeeds before repair. Selecting Gi0/0 (10.0.12.2) as its source fails because R3 lacks the return route to that subnet. This uses the existing independently calculated return path and persisted source field from LAB 004.

## Investigation and commands

| Device     | Supported commands                                                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PC-A       | `ipconfig`, `ipconfig /all`, `ping`, `tracert`                                                                                                                  |
| R1, R2, R3 | `show ip interface brief`, `show ip route`, `show ip ospf neighbor`, `show ip ospf interface`, `show ip protocols`, `show running-config`, `ping`, `traceroute` |
| PC-B       | `ipconfig`, `ping`                                                                                                                                              |

Ping and trace use the destination IPv4 field; router ping also accepts an optional active local interface name/address as source. These are condensed deterministic outputs, not an arbitrary IOS terminal. Unsupported commands remain explicit errors.

Host configuration and local probes establish the symptom's scope. Interface brief establishes physical/IP status. Neighbor tables identify the missing relationship; route tables show its impact. Comparing OSPF interface and process/configuration output on both endpoints distinguishes explicit Hello suppression from area/timer mismatch. A failed ping or absent neighbor alone cannot identify the root cause.

## Structured grading and repair

| Component        | Points  | Requirement                                                                        |
| ---------------- | ------- | ---------------------------------------------------------------------------------- |
| Root cause       | 30      | Passive OSPF interface                                                             |
| Location         | 10 + 10 | Exact device set R2, plus interface Gi0/1                                          |
| Evidence         | 20      | R2 `show running-config`, `show ip protocols` or `show ip ospf interface`          |
| Evidence context | 10      | R2 up/interface observation **and** R2 neighbor table **and** R2 or R3 route table |
| Correction       | 10      | Remove passive setting on the exact router/interface                               |
| Why              | 10      | Enable Hellos, adjacency and route exchange                                        |

One R2 OSPF-interface observation can satisfy both configuration and up-state requirements. A complete minimum set is R2 OSPF-interface, R2 neighbor, and R3 route output. Alternatively select R2 running configuration or protocols, interface brief, neighbor table, and R2/R3 routes. Forged IDs, another scenario's observations and invalid command outputs do not earn evidence credit. Notes are preserved but not interpreted. Incorrect gateway/static/area/timer/shutdown/restart actions do not receive repair credit. Partial credit is deterministic; failing the exact device/interface also prevents targeted repair credit.

```text
R2# configure terminal
R2(config)# router ospf 1
R2(config-router)# no passive-interface Gi0/1
R2(config-router)# end
```

The preview clones the scenario and changes **only** R2 Gi0/1's passive boolean to false. It retains area, network type, timers, IPs, router IDs and both passive LANs. Verify Hellos enabled and R2–R3 `FULL/-`, remote LAN routes, and both PC pings. PC-A's repaired trace reaches PC-B in four hops. The UI compares before/after output and verifies the preserved LAN passive settings. This is a worked configuration example plus structured repair, not an implemented configuration shell.

## Teaching, persistence and assessment

Four ordered hints move from local/remote scope, through neighbor tables, to compatibility and Hello suppression. The first does not name the faulty router/interface. Feedback supplies a simple explanation, a university-department analogy with explicit limitations, technical OSPF mechanics, an eleven-step worked example, guided commands, and a new independent exercise. Its Cedar/Birch topology uses different interface names, addresses and local process IDs; sufficient observed state is supplied, and the seventh section's solution requires explicit reveal.

The new pack key is `netfault.practice.passive-01.v1`. Existing four keys and version-1 journals are unchanged. Once the production shell and this pack have loaded online, practice investigation, hints, grading, repair preview and saved attempts run offline. Assessment requires internet/server connectivity and preserves the existing durable Blobs/ETag architecture, server deadlines, server-owned evidence and immutable final grades. Initial assessment responses and static client assets exclude private scenario answers. Practice packs are deliberately inspectable; this remains personal self-assessment, not tamper-proof examination software.

Schema v5 adds a validated passive repair and only the `none` authentication value; legacy omitted authentication means none. It does not introduce general authentication support. Repair targets must be router point-to-point OSPF interfaces. Existing pack versions 1–4 remain readable. Older application releases do not understand `passive-01`; export journals before rollback.

## References and model limits

The implementation's passive-interface behavior was checked against these official Cisco references during development:

- [Default Passive Interface](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-routing/b-ip-routing/m_iri-default-passive-interface.html): no Hellos/neighbor discovery and continued stub-network advertisement.
- [Troubleshoot OSPF Neighbor Problems](https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13699-29.html): passive/Hello and adjacency troubleshooting.
- [OSPF Design Guide](https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13689-17.html): local process identifiers and OSPF behavior.

No CML, GNS3, physical IOS or packet-capture validation was performed. The simulator shows stable derived results, without live LSDB flooding, timer progression, transient neighbor state machines, packet timing, authentication modes, broadcast DR/BDR elections, inter-area routing or general IOS command parsing. Test results and desktop/414px browser evidence are in [verification](verification.md); physical iPhone/Safari checks remain [manual](iphone-testing.md). Netlify configuration, API handlers, storage provider and service-worker architecture are unchanged; this work makes no live deployment claim.
