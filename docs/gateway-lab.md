# Milestone 2A — Incorrect Default Gateway

Playable title: **Beyond the local network**, lab 002, ID `gateway-01`. The neutral title and link colors do not give away the diagnosis. Scope is exactly this one new lab; the existing OSPF lab remains lab 001.

## Implementation plan and decisions

1. Audit single-scenario assumptions in schema, engine, server actions, topology, grading and persistence. Read the existing correctness/authoring documents and installed Next route-handler guide.
2. Add backward-compatible schema v2 features for unnumbered access-switch ports and gateway repairs. Keep schema v1 OSPF data and the journal version readable.
3. Derive Layer 2 reachability through active same-VLAN ports before resolving a Layer 3 next hop. Reuse existing OSPF, route and return-path calculations. Add two switch commands and a condensed PC routing-table view.
4. Route every mode and saved attempt through its selected/persisted scenario. Keep the file/Blobs storage provider unchanged. Cache practice packs separately.
5. Add a structured gateway address and forwarding explanation, seven-part post-submission teaching, repaired-state verification, and automated regressions for both labs and mobile/offline use.

## Configuration and sole fault

| Device | Interface / port | Address or VLAN  | Configuration                                                    |
| ------ | ---------------- | ---------------- | ---------------------------------------------------------------- |
| PC-A   | Ethernet0        | 192.168.10.10/24 | **Wrong gateway 192.168.10.254**, an unused on-link host address |
| SW1    | Gi0/1 → PC-A     | Access VLAN 10   | Up, full duplex, 1000 Mb/s                                       |
| SW1    | Gi0/2 → R1       | Access VLAN 10   | Up, full duplex, 1000 Mb/s                                       |
| R1     | Gi0/0            | 192.168.10.1/24  | Area 0 passive LAN                                               |
| R1     | Gi0/1            | 10.0.12.1/30     | Area 0 point-to-point transit                                    |
| R2     | Gi0/0            | 10.0.12.2/30     | Area 0 point-to-point transit                                    |
| R2     | Gi0/1            | 192.168.20.1/24  | Area 0 passive LAN                                               |
| PC-B   | Ethernet0        | 192.168.20.10/24 | Gateway 192.168.20.1                                             |

SW1's modeled VLAN 10 is active. An access port has no routed IP address; SW1 deliberately has no management SVI, which is not a forwarding fault. R1/R2 have explicit unique router IDs 1.1.1.1 and 2.2.2.2. OSPF cost 1, Hello 10, Dead 40, MTU 1500, all interfaces up. They form a healthy FULL/- adjacency. R1 learns the remote /24 through 10.0.12.2 at cost 2; R2 learns the west /24 through 10.0.12.1 at cost 2. No ACL, NAT, DHCP, DNS or second fault is introduced.

The schema still rejects off-link, network/broadcast and missing ordinary gateways. A nonexistent on-link gateway is permitted only for the explicitly identified schema-v2 wrong-gateway PC, with a repair pointing to an existing on-link router. It does not globally relax OSPF/PC addressing validation.

## Derived observations

- PC-A → 192.168.10.1 succeeds through SW1 because the destination is on-link. Its wrong default route is not selected.
- PC-A → 192.168.20.10 fails before R1: next-hop resolution for .10.254 fails. The trace contains no router hop.
- PC-B → PC-A can deliver the outgoing packet, but PC-A cannot return the echo reply to the remote source. Ping therefore fails in that direction too.
- R1 → PC-B succeeds using the healthy routed path; PC-B → its own gateway succeeds.
- Changing only PC-A's gateway to 192.168.10.1 restores both-direction end-to-end ping. Repaired PC-A trace shows R1 .10.1, R2 10.0.12.2, PC-B .20.10. SW1 forwards frames without consuming an IP hop.

Every IP configuration/route/probe output comes from the same scenario state. The switch traversal honors both access-port state and VLAN membership; disabling a port or VLAN in a test breaks the local path, demonstrating that SW1 is not just decorative.

## Commands and diagnosis

PC-A: `ipconfig`, `ipconfig /all`, `route print`, `ping`, `tracert`. SW1: `show vlan brief`, `show interfaces status`. R1/R2: `show ip interface brief`, `show ip route`, `show running-config`, `ping`. PC-B: `ipconfig`, `ping`. Unsupported commands are reported honestly. The existing OSPF lab retains its original command set.

The routing-table view displays modeled connected, host and default routes, explicitly omitting loopback/multicast routes. Switch output lists only modeled access VLANs/ports. Probes retain the existing deterministic five-probe summary and hop-level trace abstraction. ARP timing/retries, MAC learning, STP, trunks, VLAN tagging and real IOS/Windows byte-for-byte output are not simulated. This is not a general switch emulator.

Root cause: 30 points; exactly PC-A: 20; at least one server-recorded PC-A `ipconfig`, `/all` or `route print` observation: 30; gateway repair to 192.168.10.1: 10; selected on-link-router forwarding explanation: 10. Incorrect/absent addresses or explanations cannot earn full credit. Other observations help rule out alternatives but do not manufacture credit. Notes are stored without interpretation. The seven-part lesson and worked configuration are returned after submission/expiry or explicit practice solution-review finalization, never in the initial assessment payload.

## Persistence and compatibility

Scenario selection travels only with start/practice-pack requests. Subsequent commands and grades use the immutable scenario ID in the stored attempt; a client-supplied later scenario field cannot switch the rubric. The same file/Blobs provider, ETag checks and deadline/finalization behavior remain in place.

The original `netfault.practice.v1` key remains OSPF's cache. Gateway packs use `netfault.practice.gateway-01.v1`. The version-1 journal accepts both known IDs and optional new diagnosis/feedback fields; old OSPF records still parse unchanged. Both labs can be cached and played offline. Assessment still needs the server. Unknown/corrupt data is preserved rather than silently overwritten. Export remains journal-only; no import/sync is added.

Older app releases cannot read new gateway attempts. A code rollback to 1.5 is therefore not a compatible rollback for a journal/site containing lab-002 data. Export first; do not delete records or clear browser storage as a routine workaround. No deployment or data migration is performed by this milestone.

## How to test

Run `pnpm dev`, open localhost:3100, select **LAB 002 — Beyond the local network**, choose Practice or Assessment and start. Compare PC-A's `ipconfig`/`route print`, local/remote pings and trace; inspect both SW1 commands and router addresses/routes. Select configuration evidence and submit the structured diagnosis. Review the seven sections, click **Verify repaired network**, then reopen the saved journal. Repeat the existing OSPF lab. Production/offline setup remains `pnpm build` then `pnpm start` with trusted HTTPS or localhost.

On an actual iPhone 11, follow [the existing checklist](iphone-testing.md), additionally checking the SW1 controls, gateway input/keyboard, explanation selector, both saved lab titles, both cached packs and repaired trace. Automated 414px Chromium tests do not substitute for Safari/physical-device tests. Actual results are in [verification](verification.md).

## Trusted references reviewed

- [RFC 1122 §3.3.1.1–2](https://www.rfc-editor.org/rfc/rfc1122#section-3.3.1.1): local/remote next-hop decisions and gateway selection.
- [Microsoft: TCP/IP addressing and subnetting](https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/tcpip-addressing-and-subnetting): masks, local delivery and default gateways.
- [Microsoft: route](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/route_ws2008): routing-table destination/netmask/gateway concepts.
- [Cisco: show vlan](https://www.cisco.com/c/en/us/td/docs/ios/lanswitch/command/reference/lsw_book/lsw_s2.html): VLAN/port/status fields.

Reviewed 2026-09-20. These references support the model's mechanisms; **no physical IOS, CML, GNS3 or Packet Tracer execution was performed**.
