# Optional OSPFv2 device practice — UNEXECUTED

NetFault-created practice inspired by the historical ANT lecture objectives. **Not a recovered or official UM practical sheet.** No Packet Tracer/IOS environment was used to execute this brief; there is no tested `.pkt` or observed terminal transcript. Keep your own authentic results. Academy taps do not establish independent device configuration skills. This assignment is outside app scoring, uploads and synchronization. The same brief is bundled inside the OSPF Academy lesson for offline reading.

## Original topology and baseline

North host — Elm — Ash — South host. Use an isolated practice network with two routers and two hosts; optional access switches do not route. Record software/version and map differing physical port names before configuring.

| Device / port | Address | Role / gateway |
| --- | --- | --- |
| North host Ethernet | 172.28.8.25/24 | Gateway 172.28.8.1 |
| Elm Gi0/0 | 172.28.8.1/24 | North LAN |
| Elm Gi0/1 | 10.88.0.17/30 | Transit to Ash Gi0/0 |
| Ash Gi0/0 | 10.88.0.18/30 | Transit to Elm Gi0/1 |
| Ash Gi0/1 | 172.28.9.1/24 | South LAN |
| South host Ethernet | 172.28.9.25/24 | Gateway 172.28.9.1 |

1. Derive and enter your own interface commands. Use /24 mask `255.255.255.0`, /30 mask `255.255.255.252`, correct host gateways and enabled router ports. Record port mapping and physical links.
2. Before activation, set Elm process **11**, router ID **10.255.8.11**; Ash process **22**, router ID **10.255.8.22**. Process numbers are local; router IDs must be unique.
3. Activate each router’s LAN and transit in **area 0** using two exact-interface network statements per router. Make user LANs passive, transit interfaces non-passive. Explicitly set `ip ospf network point-to-point` on both transit interfaces. Do not infer type from /30. No static/default route, NAT, filtering or authentication is required.

## Gather evidence and test the hypothesis

Record expectations separately from observations. If something differs, investigate it rather than filling in an expected success.

| Check | Record the actual evidence | What it can establish |
| --- | --- | --- |
| `show ip interface brief`, host settings | Both routers’ port addresses/state; host mask/gateway | Intended addressing and up interfaces |
| `show running-config`, `show ip protocols`, `show ip ospf interface` | Activation, area, passive LAN policy, point-to-point transits | Configured and operational participation |
| `show ip ospf neighbor` on both routers | Peer ID, state, interface | Reciprocal FULL transit adjacency after convergence |
| `show ip route` on both routers | Elm’s 172.28.9.0/24 via 10.88.0.18; Ash’s 172.28.8.0/24 via 10.88.0.17 | Both remote LAN routes installed, not packet delivery |
| North host → `ping 172.28.9.25`; South host → `ping 172.28.8.25` | Source, destination, replies/timeouts in each direction | Request/reply paths for these ICMP probes only |

Router-originated pings can select different sources. A local gateway ping or FULL neighbor alone does not replace host tests. Success does not prove all applications or all traffic policies.

## Save, change one thing and roll back

1. On both routers run `copy running-config startup-config`. Also save the Packet Tracer project, close and reopen it; on devices, reload only the isolated practice environment if appropriate. Recheck addressing, neighbor/route state and both host tests. Retain the known working baseline separately.
2. Predict the effect of removing **only Elm’s North LAN OSPF activation**. Under `router ospf 11`, remove `network 172.28.8.1 0.0.0.0 area 0`. Ensure there is no overlapping network selector or interface-level activation. Keep its IP, link, passive policy and transit configuration unchanged.
3. After convergence, collect the same evidence. Expected mechanism: Elm keeps a connected LAN route and the transit adjacency persists; Ash loses the learned North LAN route. Test both host directions and record actual behavior. Convergence timing is implementation-dependent; no measured times are supplied here.
4. Restore the exact network statement under process 11. Verify Ash’s remote route and both host pings, then save the restored configuration/project. If the result differs, record and investigate it before declaring restoration.
5. Keep a journal with environment/version, port mapping, initial hypothesis, baseline outputs, one-line change, actual post-change evidence, rollback command and final verification. No evidence is uploaded or graded by NetFault.

These objectives follow the historically audited OSPF activation/verification and network-management baseline/rollback topics. See [3E implementation and sources](milestone-3e.md). Current 2026/27 practical requirements remain unconfirmed.
