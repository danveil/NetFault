# Original GRE device companion — UNEXECUTED

**UNEXECUTED.** No Packet Tracer file, Cisco terminal output or device verification is supplied. This original exercise uses different addresses from LAB 014; it does not reproduce a UM PKA. Use an isolated lab and record actual platform/image/version and command availability. Packet Tracer support varies; if Tunnel0/GRE/source-aware ping is unavailable, record that limitation rather than inventing results.

## Build and record the intended design

Physical topology: Desk-C — Cedar — Transit — Maple — Desk-M. Logical Tunnel0 connects Cedar and Maple over Transit. No OSPF, NAT, ACL or IPsec. Interface names below are examples; map them explicitly to your platform before configuring.

| Device  | Interface | Address                          | Purpose          |
| ------- | --------- | -------------------------------- | ---------------- |
| Desk-C  | NIC       | 10.88.1.10/24, gateway 10.88.1.1 | Cedar LAN        |
| Cedar   | Gi0/0     | 10.88.1.1/24                     | LAN              |
| Cedar   | Gi0/1     | 192.0.2.9/30                     | transport source |
| Transit | Gi0/0     | 192.0.2.10/30                    | Cedar-facing     |
| Transit | Gi0/1     | 198.51.100.13/30                 | Maple-facing     |
| Maple   | Gi0/0     | 198.51.100.14/30                 | transport source |
| Maple   | Gi0/1     | 10.88.2.1/24                     | LAN              |
| Desk-M  | NIC       | 10.88.2.10/24, gateway 10.88.2.1 | Maple LAN        |
| Cedar   | Tunnel0   | 10.88.99.1/30                    | logical overlay  |
| Maple   | Tunnel0   | 10.88.99.2/30                    | logical overlay  |

Record platform, version, interface mapping and initial configuration backup here: **not recorded**.

## Configure physical routing first

Cedar:

```text
hostname Cedar
interface GigabitEthernet0/0
 ip address 10.88.1.1 255.255.255.0
 no shutdown
interface GigabitEthernet0/1
 ip address 192.0.2.9 255.255.255.252
 no shutdown
ip route 198.51.100.12 255.255.255.252 192.0.2.10
```

Transit:

```text
hostname Transit
interface GigabitEthernet0/0
 ip address 192.0.2.10 255.255.255.252
 no shutdown
interface GigabitEthernet0/1
 ip address 198.51.100.13 255.255.255.252
 no shutdown
```

Maple:

```text
hostname Maple
interface GigabitEthernet0/0
 ip address 198.51.100.14 255.255.255.252
 no shutdown
interface GigabitEthernet0/1
 ip address 10.88.2.1 255.255.255.0
 no shutdown
ip route 192.0.2.8 255.255.255.252 198.51.100.13
```

Set desk NICs and gateways from the table. Verify each local gateway. Inspect router interface brief and routes, then test Cedar→198.51.100.14 sourced from Gi0/1 and Maple→192.0.2.9 sourced from Gi0/0. Use platform-supported extended ping if the one-line source syntax is unavailable. Record actual outputs and explain both directions before adding Tunnel0.

## Add the logical overlay

Cedar:

```text
interface Tunnel0
 ip address 10.88.99.1 255.255.255.252
 tunnel source GigabitEthernet0/1
 tunnel destination 198.51.100.14
 tunnel mode gre ip
 no shutdown
ip route 10.88.2.0 255.255.255.0 Tunnel0
```

Maple:

```text
interface Tunnel0
 ip address 10.88.99.2 255.255.255.252
 tunnel source GigabitEthernet0/0
 tunnel destination 192.0.2.9
 tunnel mode gre ip
 no shutdown
ip route 10.88.1.0 255.255.255.0 Tunnel0
```

Inspect tunnel interfaces, running configuration and both endpoint route tables. Ping the remote tunnel address with local Tunnel0 as source on each endpoint, then test both desk initiation directions. Explain which route carries the inner packet and which carries the outer packet. Record actual output; do not substitute NetFault's bounded display for IOS behavior.

## Controlled wrong-destination experiment

On Cedar only, temporarily set `tunnel destination 198.51.100.13`. This identifies Transit. Compare ordinary underlay reachability, local tunnel state, remote tunnel-IP and desk exchanges. Does your actual platform leave the local tunnel up/up? Record what it does and any configured defaults such as keepalives; do not assume the simulator reproduces every platform.

Restore Cedar's destination with `tunnel destination 198.51.100.14`. Repeat the source-aware transport controls, tunnel views, routes and both service directions. Changing one destination should not add a route or alter any NIC. Inspect unexpected failures layer by layer.

## Evidence and rollback

| Record                                            | Actual result |
| ------------------------------------------------- | ------------- |
| Platform, software and supported commands         | Not executed  |
| Before: physical routes and source-aware controls | Not executed  |
| Healthy: reciprocal tunnel and desk probes        | Not executed  |
| Wrong destination: local state versus delivery    | Not executed  |
| Restored: both routing layers and exchanges       | Not executed  |
| Saved configuration / reopened topology check     | Not executed  |

In this isolated exercise, save the corrected known-good configuration using the platform's supported save command, then reopen/reload and verify it. Before an experiment, retain an export/checkpoint. To roll back the fault, restore the original correct destination; to roll back the entire exercise, restore your isolated lab checkpoint. Do not change production equipment to reproduce this task.

GRE alone is not encrypted. This exercise excludes IPsec, keepalives, timers, keys, counters, MTU/fragmentation and dynamic overlay routing. Read the [bounded model](gre-model.md) and [Cisco local-state reference](https://www.cisco.com/c/en/us/support/docs/ip/generic-routing-encapsulation-gre/118361-technote-gre-00.html) for scope. Completing tap exercises is not proof of having executed these commands independently.
