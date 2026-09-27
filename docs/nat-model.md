# Bounded static NAT model

Implemented by [Milestone 3O](milestone-3o.md), following the [approved 3N contract](milestone-3n-plan.md). This is partial NAT coverage, not an IOS emulator or full NAT/PAT curriculum.

## Supported state and forwarding

Schema 12 supports exactly one NAT router, one static mapping, two distinct named inside/outside interfaces, one directly attached inside PC, one outside router and its PC: four devices and three links. MACs are explicit, canonical and unique. `nat.ts` validates these bounds and provides pure source/destination transformations. Unknown NAT fields, overlapping global ownership, unusable local addresses, unsupported topology and mixed protocol configuration are rejected. The local slot may legally refer to an unused inside address: that is a forwarding fault, not invalid schema.

No packet allocations, timers, ports, transport identifiers, dynamic rows, counters or persistent translation sessions exist. An entry exists because it is configured, even before any probe. Each forwarding call carries its own ingress interface, current source/destination, transformations and actual delivered device/interface. The original source/target remain separate. Hosts retain their NIC configuration. A global address is never added to physical/HSRP ownership, connected routes or router-local echo destinations.

The shared forwarding loop still performs routing and directed Ethernet delivery:

1. A PC needs its correct on-link gateway and a working link. Resolution request, response and data delivery must succeed before the router receives the packet.
2. At router ingress, an outside packet whose destination exactly matches the configured global address receives **destination translation before route lookup**.
3. Ordinary longest-prefix routing chooses an active output and independent next hop. For inside ingress and outside egress, an exact local-source match receives **source translation after route selection**.
4. The next segment must still deliver successfully. No mapping creates a route or saves a failed link.
5. A delivered request generates its reply at the actual delivered endpoint, addressed to the source it saw. The reply goes through the same engine. Success requires request and reply delivery plus the restored source/destination identities expected by the original sender.

A nonmatching source is not an implicit deny: it is forwarded unchanged if routing and delivery permit. Combined ACL, port-security, VLAN-switching, STP, HSRP and OSPF NAT scenarios are rejected in schema 12. Older protocol engines and authored cases retain their behavior; this milestone does not claim to model arbitrary NAT/policy ordering. Router-originated NAT probes, NAT traceroute/ICMP-error translation and NAT ARP-history commands are excluded.

## LAB 013 state and one fault

`nat-static-01`, revision 1, title **Beyond the gate**:

| Device/interface | Address          | Role or gateway      |
| ---------------- | ---------------- | -------------------- |
| PC-A Ethernet0   | 192.168.40.10/24 | Gateway 192.168.40.1 |
| R1 Gi0/0         | 192.168.40.1/24  | NAT inside           |
| R1 Gi0/1         | 192.0.2.1/30     | NAT outside          |
| R2 Gi0/0         | 192.0.2.2/30     | Toward R1            |
| R2 Gi0/1         | 198.51.100.1/24  | Outside LAN          |
| PC-B Ethernet0   | 198.51.100.10/24 | Gateway 198.51.100.1 |

Topology: PC-A — R1 — R2 — PC-B. Links/interfaces are up. R1 routes 198.51.100.0/24 via 192.0.2.2. R2 routes 203.0.113.10/32 via 192.0.2.1. The global is a routed documentation address outside connected networks, avoiding proxy ARP. Router IDs are metadata; OSPF is absent.

The only fault is R1 mapping `primary`: inside local **192.168.40.99**, inside global **203.0.113.10**. The correct local value is PC-A's unchanged **192.168.40.10**. The unused .99 does not create another device. The missing R2 route to the private inside LAN is intentional: outside peers use the assigned global identity.

| Probe                       | Initial state                                                 | Corrected local slot                                   |
| --------------------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| PC-A → PC-B                 | Unmatched source reaches B; private-address reply fails at R2 | Source becomes global; reply reverses destination to A |
| PC-B → global               | Destination becomes unused .99; inside delivery fails         | Destination becomes A; A's reply source becomes global |
| Each PC → its gateway       | Works                                                         | Works                                                  |
| PC-B → PC-A private address | No private route; fails                                       | Still fails by design                                  |

Both initiation directions work independently of probe order or earlier traffic. Unit tests use different identities/addresses and verify missing routes, invalid gateways, broken Layer 2, unmatched sources, transformation order and actual endpoints. Recovery preserves every link/device field except the one local mapping member.

## Commands, repair and evidence

PCs support `ipconfig`, `ipconfig /all`, `route print` and destination-bearing `ping`. Both routers support `show ip interface brief`, `show ip route` and `show running-config`; R1 also supports **show ip nat translations**. The latter derives a labeled permanent address-only entry from current configuration: mapping ID, inside local, inside global and static type. It is deliberately not a reproduction of every IOS column. No traffic-created protocol/port/timer/counter output is fabricated. Configuration shows `ip nat inside`, `ip nat outside` and the static pair. Unsupported commands are rejected.

The strict `nat-static-local` action contains device, mapping ID and a trimmed valid IPv4 local value. It changes only that slot. Candidate mappings and addresses come from recorded outputs; a collapsible read-only global-address card uses the selected router’s recorded configuration/table; an optional custom IPv4 input permits other legal trials. Effective no-ops do not advance the version; actual changes use existing trial limits, replay, deadline, finalization and CAS semantics. Invalid roles/globals/host/routes cannot be changed through this action.

Deterministic grading authenticates selected observations by replaying their configuration version and re-executing the command. Notes are saved, not interpreted. Full credit requires:

| Component                    | Points | Required proof                                                                                           |
| ---------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| Cause and original pair      | 20     | Correct cause and observed original local/global                                                         |
| Location                     | 10     | Exact router and mapping                                                                                 |
| Original evidence            | 30     | A NIC and R1 config (15); B NIC and both route tables (10); a reported failed service probe (5)          |
| Applied correction/mechanism | 20     | Real minimal two-way recovery (10), matching proposed repair (5), structured translation explanation (5) |
| Fresh verification           | 20     | Current A NIC + R1 config/translations (10); both service directions + both gateway controls (10)        |

A successful ping alone, selected fix without application, stale/forged evidence, changed host/global/routes or direct-route bypass cannot earn full recovery. Actual configuration recovery with missing fresh proof is labeled **recovered-unverified**. The repaired preview probes B's physical address from A and the global from B, and labels its address transformations as simulator reasoning, not packet capture.

## Privacy, persistence and limits

Private scenario, repair key, hints, worked solution and rubric stay server-only until the relevant submission or explicit Practice pack download. Public metadata is neutral. A fresh Assessment uses server-owned history and state; concurrent modifications retain existing Blobs/ETag guards. No new storage backend or secret is needed.

Practice is intentionally inspectable, including offline packs; this is not a secure examination system against a learner who downloads the same case. Assessment remains online. Pack `netfault.practice.nat-static-01.v1` and optional journal fields preserve earlier packs and v1 progress. Export journals before downgrading to builds without schema 12; retain exports instead of clearing older progress.

Dynamic NAT, PAT/overload, pools, ACL-selected NAT, policy/twice/VRF/IPv6 NAT, transport flows, timeouts, firewall guarantees, proxy ARP and arbitrary topologies remain unsupported. Static address mapping is neither encryption nor authentication.

## External grounding

The current 26/27 NAT deck/revision outline and ExtraLab context are recorded in [3N source evidence](nat-feasibility.md). Cisco describes [translation processing order](https://www.cisco.com/c/en/us/support/docs/ip/network-address-translation-nat/6209-5.html) and [permanent static entries](https://www.cisco.com/c/en/us/support/docs/ip/network-address-translation-nat/13772-12.html). Source review informs the bounded semantics; it is not device execution. The original [device companion](nat-device-companion.md) is **UNEXECUTED**.
