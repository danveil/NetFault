# Bounded switch port security

Milestone 3M implements schema 11 and one static-slot access-edge model. It does not implement general LAN security or a full Cisco IOS feature set. See [implementation](milestone-3m.md), [approved design](milestone-3l-plan.md), [source audit](lab012-feasibility.md), and the optional [UNEXECUTED companion](port-security-device-companion.md).

## Configuration and authoring bounds

`Device.ports[].portSecurity` is an optional strict object: `enabled` boolean, `maximum: 1`, `violation: "protect"`, and exactly one canonical nonzero unicast `staticMac`. Absence or explicit disabled state leaves ordinary admission unchanged. LAB 012 always starts enabled, with its one static slot occupied; disabling it is neither an offered repair nor valid recovery. Authored policy MACs use lowercase dotted notation; structured repairs normalize dotted, colon and hyphen input case-insensitively. Other families' legacy MAC parsing is unchanged.

One access switch and VLAN, one or two directly attached single-NIC PCs, one direct router uplink and an optional second router LAN/PC are supported. Secured ports must be PC access edges. Physical interfaces have unique canonical MACs. Duplicate secure registrations in the VLAN, secured uplinks, inter-switch topology, multiple VLANs and mixed OSPF/ACL/STP/HSRP/EtherChannel configuration are rejected. Schema versions 1–10 cannot introduce this capability. Down-link and inactive-VLAN defensive states remain distinguishable from policy rejection.

There is no spare slot or dynamic/sticky learning, aging, maximum greater than one, counters, restrict, shutdown, err-disable, recovery, voice VLAN, trunk policy, FDB, notifications, MAC movement, timers or startup configuration. Security diagnostics are explicit educational subsets, not verbatim device transcripts.

## Actual forwarding

`peers()` remains physical/VLAN topology discovery. It is not pruned according to one endpoint's identity and still serves the older routing models. In schema 11, `forward()` calls the generic `ethernetDelivery()` transaction before accepting a next hop:

1. A request crosses available links and matching active access VLAN ports using the transmitting interface's source MAC. A secured switch ingress compares that source with its occupied static slot.
2. Resolution succeeds only if the candidate's reverse response also crosses the graph using its own source MAC.
3. The data leg uses the same admission predicate. Only then is a successful resolution observation emitted and forwarding advanced to that peer.

Failure never alters carrier, creates a route or fabricates an ICMP security error. An internal structured `admissionDrop` identifies ingress, source MAC and request/response/data phase for tests; learner ping reports no replies and invites layered investigation. Each router hop supplies its own egress Ethernet MAC while the original IPv4 source remains unchanged. Echo replies in this capability are generated only after request delivery. Older schema behavior is preserved.

This is on-demand next-hop resolution, not serialized ARP packets, broadcast replication or a frame/timer simulator. ARP display records successful complete exchanges; it is not an independent cache that bypasses policy on a later probe. Every effective repair creates a new observation epoch, starting empty. Repeating an equivalent value does not. This reset does not claim that real secure-MAC configuration flushes a PC cache. LAB 003 retains its original attempt-level observations; LAB 011 retains virtual-MAC epoch behavior.

## LAB 012 expectations

`PC-A — SW1 — R1 — PC-B`. PC-A is `172.30.10.10/24`, gateway `172.30.10.1`, MAC `0200.0012.000a`. SW1 Fa0/1 and Fa0/24 are connected access VLAN 10. R1 Gi0/0 is `172.30.10.1/24` (`0200.0012.0101`), Gi0/1 is `172.30.20.1/24` (`0200.0012.0102`); PC-B is `172.30.20.10/24`, gateway `.20.1`, MAC `0200.0012.000b`. R1 uses only connected/local routes. Its required metadata router ID does not enable OSPF.

The sole intentional fault is Fa0/1's static slot `0200.0012.009a`. PC-A self-ping works, but its gateway and remote probes fail at ingress resolution. R1/PC-B cannot reach PC-A because PC-A's ARP response is likewise denied. PC-B's own gateway and R1-to-PC-B remain working controls, including R1 source `.10.1`. Secure-up and connected remain true; they do not prove admission. Replacing the slot with PC-A's actual NIC restores local and reciprocal remote delivery. PC-A gateway ping followed by ARP shows `.10.1 → 0200.0012.0101`.

## Commands, repair and grading

Both PCs expose ipconfig/all and ping; PC-A also route print and arp -a. R1 exposes interface brief, routes, running-config and ping with the existing validated source selector. SW1 exposes VLAN, interface status, running-config, security summary, configured secure addresses and the declared Fa0/1 security view. Unsupported commands/ports remain explicit. No trace, MAC-table or counter command is claimed. All outputs derive from current state.

Strict `port-security-mac` replaces an existing enabled port's one slot and preserves every other field. UI candidates are extracted from recorded diagnostic outputs, without a private correct-value list or preselection. PC-B's actual NIC supplies a plausible wrong trial. Ten actual changes and 100 commands remain the attempt limits. Raw export includes `netfault.practice.port-security-01.v1`; v1 journal shape and prior packs are retained.

Grading authenticates each selected observation by re-executing its version against preceding authentic history. Original evidence earns 30 points: NIC plus registration (10), physical/VLAN controls (5), full enabled policy (5), failed PC-A local probe plus router routes and successful PC-B local control (10). Cause/initial MAC earn 20; exact switch/interface 10; actual minimal repair plus chosen remediation/mechanism 20. Fresh verification earns 20 and requires current PC-A NIC, all five switch views (configuration, security address/interface, physical, VLAN), gateway ping then resolved ARP, reciprocal host pings and PC-B gateway control.

Recovery masks only the intended slot when comparing original/final configuration. It independently checks delivery and retained enabled maximum-one protect state. Matching the intended MAC admits it; all different valid MACs lie outside the single allowed value by the equality predicate. Tests exercise another address. This **exclusive-policy invariant is not an executed attacker probe**. MAC matching is not strong authentication. Feedback distinguishes unresolved, recovered but unverified, and verified current service; missing original evidence still prevents full credit.

## Sources and validation limits

The prior current-semester audit identified LAN slides 24–26 and the switch-security practical; 3M rechecked the extracted LAN deck SHA-256 against that record. Its broader learning/aging examples are not part of this model. Protect/full-slot behavior and static configuration were cross-checked against [Cisco's Catalyst 2960 IOS 15.2(1)E port-security guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-2_1_e/configuration/guide/2960_scg/swtrafc.html). Vendor documentation review is not execution. No Cisco switch, Packet Tracer, physical iPhone, Safari, VoiceOver or Netlify deployment was tested. See [verification](verification.md) for actual automated results.
