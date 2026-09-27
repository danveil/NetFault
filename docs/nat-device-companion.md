# Original static NAT device companion — UNEXECUTED

Optional independent practice for [Milestone 3O](milestone-3o.md). This is original NetFault material, **not an official UM lab or validated Packet Tracer activity**. No device, IOS image or Packet Tracer version has been executed for this record. Commands below are a proposed controlled exercise; record actual capability/output before claiming success. Use an isolated lab with compatible routers and two endpoints, never a production network.

## Topology and addressing

Inside-PC — Edge — Upstream — Outside-PC. Use direct links (or the emulator's appropriate equivalent), with interface names adapted to the actual device.

| Endpoint       | Address           | Gateway/role                          |
| -------------- | ----------------- | ------------------------------------- |
| Inside-PC      | 10.66.0.20/24     | 10.66.0.1                             |
| Edge Gi0/0     | 10.66.0.1/24      | Inside                                |
| Edge Gi0/1     | 192.0.2.5/30      | Outside                               |
| Upstream Gi0/0 | 192.0.2.6/30      | Toward Edge                           |
| Upstream Gi0/1 | 198.51.100.129/25 | Outside LAN                           |
| Outside-PC     | 198.51.100.140/25 | 198.51.100.129                        |
| Routed global  | 203.0.113.70/32   | Permanent representation of Inside-PC |

Set the PC addresses, masks and gateways in the endpoint's configuration UI or native OS tools. Do not assign the global to a PC or router interface. The routed /32 avoids needing global proxy ARP on the transit segment. Keep the upstream private-LAN route absent intentionally.

## Proposed baseline configuration

Edge (substitute supported interface names):

```text
enable
configure terminal
hostname Edge
interface GigabitEthernet0/0
 ip address 10.66.0.1 255.255.255.0
 ip nat inside
 no shutdown
 exit
interface GigabitEthernet0/1
 ip address 192.0.2.5 255.255.255.252
 ip nat outside
 no shutdown
 exit
ip route 198.51.100.128 255.255.255.128 192.0.2.6
ip nat inside source static 10.66.0.20 203.0.113.70
end
```

Upstream:

```text
enable
configure terminal
hostname Upstream
interface GigabitEthernet0/0
 ip address 192.0.2.6 255.255.255.252
 no shutdown
 exit
interface GigabitEthernet0/1
 ip address 198.51.100.129 255.255.255.128
 no shutdown
 exit
ip route 203.0.113.70 255.255.255.255 192.0.2.5
end
```

Record `show ip interface brief`, `show running-config` and `show ip route` on both routers and `show ip nat translations` on Edge **before traffic**. A permanent address pair is expected; actual IOS may also expose protocol-specific rows after probes. NetFault implements only the permanent address relationship, not those rows. If a command or feature is absent, record it as unsupported rather than inventing output.

## Verify, break one value, and repair

1. Record both PC configurations. Ping each local gateway. Confirm independent routes and physical links.
2. From Inside-PC, ping 198.51.100.140; from Outside-PC, ping 203.0.113.70. Repeat only if initial neighbor resolution warrants it and retain both outputs. Also test outside initiation before inside traffic in a clean controlled session if the environment supports it. Expected results are predictions, not evidence of execution.
3. With traffic stopped, replace the configured local member with unused 10.66.0.29:

```text
configure terminal
no ip nat inside source static 10.66.0.20 203.0.113.70
ip nat inside source static 10.66.0.29 203.0.113.70
end
```

4. Capture config/table/routes again. Repeat both service probes and gateway controls. Predict: Inside-PC's unmatched request may reach Outside-PC but its private-address reply has no route; an outside request to the global translates to unused .29 and cannot deliver. NAT does not itself deny unmatched sources. Real ICMP/ARP output and timing may differ from NetFault's bounded educational output.
5. Correct only the local value:

```text
configure terminal
no ip nat inside source static 10.66.0.29 203.0.113.70
ip nat inside source static 10.66.0.20 203.0.113.70
end
```

6. Record the fresh permanent mapping, unchanged PC addressing/roles/routes, both service directions and gateway controls. Outside-PC → 10.66.0.20 remains unrouted by design. Explain which source/destination each router sees rather than assuming a table entry proves delivery.

If IOS refuses replacement because the mapping is in use, retain the error, stop probes and consult that platform's official procedure. Do not silently add an unverified clear command. Device CLI changes are sequential and may interrupt service; NetFault's single trial is an atomic configuration replacement. Saving startup configuration is a separate deliberate device operation, not simulated by NetFault.

## Evidence record — blank until executed

- Operator/date: __________
- Environment (physical/emulated), platform and exact version/image: __________
- Actual interfaces/cabling and any substitutions: __________
- Supported NAT command/features: __________
- PC configuration outputs: __________
- Initial config, interfaces, routes and permanent table: __________
- Initial both-direction and gateway probe outputs: __________
- Wrong-entry config/table and failing service outputs: __________
- Repair commands and any errors: __________
- Fresh repaired config/table/routes and both-direction/control outputs: __________
- Outside-first clean-session result: __________
- Differences from predicted results and explanation: __________
- Artifact paths/hashes: __________
- Final status: **UNEXECUTED** (change only with real supporting evidence).

No dynamic NAT/PAT, pool, transport timeout, firewall, performance or full IOS competency is assessed by this exercise.
