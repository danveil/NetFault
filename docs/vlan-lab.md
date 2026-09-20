# LAB 003 — The Wrong Network

Milestone 2B adds exactly one lab, `vlan-01`, schema version 3, revision 1. The incident, topology colors and device roles do not expose the fault. The design brief supplies intended wiring and VLAN membership so the learner can compare observations against a known design.

## Execution plan and baseline

1. Read the full milestone specification, repository contract, engine/schema/catalog/grader, persistence, existing correctness documents and installed Next route-handler guide.
2. Establish the unchanged baseline: lint and type checking passed, 93 unit/integration tests passed, and all 24 production browser tests passed before implementation. Windows sandbox restrictions required running esbuild/browser tools outside the sandbox; no dependency or configuration workaround was added.
3. Reuse existing same-VLAN access-port traversal and healthy point-to-point OSPF routes. Add only a validated VLAN repair, switchport/running-config renderers and deterministic ARP history replay. No second simulator, static-routing subsystem or storage redesign.
4. Integrate the third catalog entry, structured diagnosis, evidence, seven-part teaching with explicit independent-solution reveal, and a sequential repaired-state preview.
5. Preserve old pack keys/journals, add a third pack key, and verify all labs in desktop/mobile production and offline workflows. See [actual results](verification.md).

## Topology, addressing and the single fault

`PC-A — SW1 — R1 — R2 — PC-B`

| Device | Interface              | Address / VLAN                         | State                     |
| ------ | ---------------------- | -------------------------------------- | ------------------------- |
| PC-A   | Ethernet0              | 192.168.10.10/24; gateway 192.168.10.1 | Up, correct               |
| SW1    | FastEthernet0/1 → PC-A | Access VLAN **20**, intended **10**    | Up, full duplex, 100 Mb/s |
| SW1    | FastEthernet0/24 → R1  | Access VLAN 10                         | Up, full duplex, 100 Mb/s |
| R1     | Gi0/0                  | 192.168.10.1/24                        | Up, passive area 0 LAN    |
| R1     | Gi0/1                  | 10.0.12.1/30                           | Up, point-to-point area 0 |
| R2     | Gi0/0                  | 10.0.12.2/30                           | Up, point-to-point area 0 |
| R2     | Gi0/1                  | 192.168.20.1/24                        | Up, passive area 0 LAN    |
| PC-B   | Ethernet0              | 192.168.20.10/24; gateway 192.168.20.1 | Up, correct               |

VLANs 10 (STUDENT_LAN) and 20 (OTHER_LAN) both exist and are active. The switch has no management IP, SVI, proxy ARP or routing. Only the PC-facing access VLAN is wrong; no missing VLAN, shutdown, bad IP/mask/gateway or missing route is added. The diagram's subnet labels express intended IP addressing, not a claim that the isolated ports share a broadcast domain.

R1/R2 retain the existing engine's simplest supported routed design: explicit router IDs 1.1.1.1/2.2.2.2, area-0 point-to-point adjacency, passive LANs and explicit OSPF cost 1. R1 learns 192.168.20.0/24 through 10.0.12.2 at cost 2; R2 learns 192.168.10.0/24 through 10.0.12.1 at cost 2. There is no additional OSPF fault or OSPF-specific diagnosis required. FastEthernet links do not force an automatic cost change because the cost is explicitly configured. Router configuration/routes are identical before and after repair.

## Layer 2 and ARP model

The existing `peers` traversal follows physically up, active same-VLAN access ports. It treats incoming access frames as untagged and never forwards them across an ordinary VLAN boundary. The existing forwarding path then resolves its actual IP next hop through those reachable peers. A switch does not add an IP hop. No check says “LAB 003 always fails.” Tests prove that two reachable hosts in VLAN 20 can communicate even while the original gateway remains isolated, and that moving both endpoints into the same active VLAN restores reachability (though moving the router-facing port to VLAN 20 violates this lab's intended design).

PC-A treats .10.1 as local but cannot resolve its MAC across the VLAN separation. A remote destination selects the correct configured gateway and fails at the same next-hop resolution. PC-A's self-address, PC-B's local gateway and R1-to-PC-B probes still work. Router routes alone cannot deliver a packet whose next-hop Ethernet destination is unresolved.

`arp -a` uses a bounded, deterministic cache model derived from the attempt's ordered diagnostic history:

- Start with no learned entries. Read-only commands do not populate a cache.
- Replay supported numeric ping/trace probes through the same `forward` function. Each successful next-hop exchange records the actual peer MAC; the addressed peer can also learn the sender. Replay return traffic only after outward delivery succeeds.
- Failed resolution records a separate simulator observation and **does not** create a dynamic MAC entry. The Windows-style table contains learned entries only; it is not a Linux-style incomplete-neighbor table.
- Entries are retained for the immutable attempt configuration and survive browser/server reload via history replay. No wall-clock expiry, ARP retry count, ambient broadcasts, passive learning by unrelated listeners, gratuitous ARP or live packet timing is simulated. Trace replay uses the same bounded forward/return model, not every real TTL-expired probe.
- A new attempt and each repaired preview start empty. The preview runs a fresh gateway ping before showing its learned ARP entry. It never reinterprets saved original evidence as if that evidence came from the repaired network.
- The engine remains a stable connectivity snapshot; it does not use cache age to introduce packet loss or changing convergence. Repeated queries are reproducible.

The annotation following the ARP table is explicitly a simulator observation, not invented Windows command text. Real Windows versions and probe tools may report failed resolution differently. ARP cache emptiness alone does not prove a VLAN fault.

## Commands and evidence

| Device | Supported commands                                                                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PC-A   | `ipconfig`, `ipconfig /all`, `ping`, `arp -a`, `tracert`                                                                                                        |
| SW1    | `show vlan brief`, `show interfaces status`, `show interfaces FastEthernet0/1 switchport`, `show interfaces FastEthernet0/24 switchport`, `show running-config` |
| R1/R2  | `show ip interface brief`, `show ip route`, `show running-config`, `ping`                                                                                       |
| PC-B   | `ipconfig`, `ping`                                                                                                                                              |

The two full switchport commands have dedicated touch-friendly buttons. Output comes from the same ports/VLAN definitions used by forwarding: administrative access mode, operational state and access VLAN remain distinct. `show interfaces status` reports physically connected ports despite their different VLANs. Switch running-config contains both VLAN definitions and access-port settings, with no router process or SVI invented.

`show mac address-table`, trunks, STP and general MAC learning remain unsupported. The UI advertises only implemented commands; unsupported calls receive an honest response. Output is condensed Cisco/Windows style, not byte-for-byte vendor emulation.

Every new observation stores scenario ID, device, full command (including interface argument), destination argument, output and timestamp inside its attempt. Old observations without a scenario field inherit their containing attempt's context. Assessment history is server-owned and replayed inside the existing conditional-write reducer. Incoming client history cannot replace it.

## Diagnosis and deterministic rubric

| Component                                                          | Points |
| ------------------------------------------------------------------ | ------ |
| Access VLAN root cause                                             | 20     |
| Observed incorrect VLAN 20                                         | 10     |
| Exactly SW1                                                        | 10     |
| Interface FastEthernet0/1                                          | 10     |
| PC-A `ipconfig` or `/all` selected                                 | 10     |
| PC-facing membership selected                                      | 10     |
| Router-facing membership selected                                  | 10     |
| Access-port repair targeting SW1 FastEthernet0/1, intended VLAN 10 | 20     |

A whole-switch VLAN/status/running-config view supplies both port memberships; alternatively select the two individual switchport views. Thus host configuration plus one complete switch view is sufficient. No prescribed order or mandatory inspection of every router. A lone failed ping, forged evidence ID or observation explicitly belonging to another scenario earns no evidence credit. Wrong device/interface/gateway remediation cannot earn full credit. Notes remain ungraded.

The seven-part lesson progresses through simple explanation, a bounded university-group analogy, technical mechanism, actual gateway-probe walkthrough, guided troubleshooting, an independent exercise and its solution. Part 7 remains collapsed until explicitly requested. The independent exercise changes which endpoint's port is wrong to test reasoning instead of memorization. Active assessments receive no lesson, fault, repair or evidence-rule payload. Completed feedback and inspectable practice packs contain teaching materials; this remains personal self-assessment, not a tamper-proof exam.

## Repair and verification

```text
configure terminal
interface FastEthernet0/1
 switchport mode access
 switchport access vlan 10
end
```

This is a worked real-world configuration example. The app's structured repaired-state preview clones the scenario and changes only that port's VLAN. It shows original/repaired switchport output, corrected VLAN/running configuration, initially empty ARP state, a successful gateway ping, the learned gateway MAC, remote/bidirectional pings, traceroute and unchanged router routes. No arbitrary configuration shell or real network changes are performed.

## Local use, persistence and deployment

Run `pnpm dev` in the NetFault directory, open localhost:3100, choose **LAB 003 — The Wrong Network**, and start Practice or Assessment. Investigate host settings and local probes, compare both access ports with the design brief, select evidence, submit and inspect the repaired preview. Reopen the result from Your journal.

For offline use run `pnpm build`, then `pnpm start` after stopping development. Start each desired practice lab online, allow the worker to install and reload online once. The new key is `netfault.practice.vlan-01.v1`; original OSPF/gateway pack keys and journal version 1 are unchanged. No migration erases old entries. Three-pack offline tests reopen each lab after reload. Assessment requires internet/server connectivity and retains its deadline.

Dependencies, Netlify configuration, API no-store headers, Blobs/ETag storage and worker strategy are unchanged. A deployment still requires the user's explicit authorization. Users need the new version through the existing safe **Reload to update** flow. Older code cannot read the new scenario ID, so export journals before any rollback across scenario-support versions; clearing storage is not a migration strategy.

See [iPhone checks](iphone-testing.md), [Netlify deployment](NETLIFY_DEPLOYMENT.md) and [verification](verification.md). No physical iPhone, live 2B deployment or external network emulator run is claimed.

## References reviewed on 2026-09-20

- [Microsoft arp command](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/arp): cache entries and the meaning of `arp -a`.
- [RFC 826](https://www.rfc-editor.org/rfc/rfc826): address resolution exchanges and sender/target address mapping.
- [Cisco IOS XE Layer 2/3 command reference](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3650/software/release/16-12/command_reference/b_1612_3650_cr/layer_2_3_commands.html): access VLAN configuration, access mode and verification fields.

These references informed the model; they do not constitute execution of this exact network on IOS or Windows.
