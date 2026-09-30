# Bounded IPv6 model — Milestone 3R

Schema 14, one case `ipv6-01` revision 1. The [source gate](milestone-3r.md) selects connected IPv6 delivery with manually configured host next hops and a router forwarding control. This is a deterministic educational subset, not IOS or a complete host stack. Authoring documentation contains answers and must never be copied into public assets.

## Addresses and topology

```text
PC-A Ethernet0 ---- GigabitEthernet0/0 R1 GigabitEthernet0/1 ---- Ethernet0 PC-B
     2001:db8:15:10::/64                         2001:db8:15:20::/64
```

| Device/interface      | Global address          | Explicit manual host next hop |
| --------------------- | ----------------------- | ----------------------------- |
| PC-A Ethernet0        | `2001:db8:15:10::10/64` | `2001:db8:15:10::1`           |
| R1 GigabitEthernet0/0 | `2001:db8:15:10::1/64`  | —                             |
| R1 GigabitEthernet0/1 | `2001:db8:15:20::1/64`  | —                             |
| PC-B Ethernet0        | `2001:db8:15:20::20/64` | `2001:db8:15:20::1`           |

All ports/links are enabled, addresses are unique, and both host next hops resolve to the attached router interface. The **only fault is R1 IPv6 transit forwarding disabled**. Enabling it changes no addressing, route, cable or unrelated behavior. A router can receive packets for itself and originate traffic without forwarding packets between hosts. Both host-to-local-router pings initially work; inter-host request delivery stops at R1. After repair, request and reply each traverse the real two links.

`ipv6-address.ts` uses the runtime WHATWG IPv6 URL parser for canonical compression, guarded to reject zones, brackets, embedded IPv4, CIDR and other syntax outside this model. Expanded 128-bit BigInt arithmetic handles identity, network derivation and prefix membership; BigInt never enters persisted JSON. Helper tests include zero, full/compressed equivalents, leading zeros and prefix boundaries 0–128. Scenario prefixes are 1–128; the host default route is separately represented. Configured/probed addresses are restricted to the current 2000::/3 global-unicast range, including documentation prefixes. The helper accepting `::` does not mean unspecified/loopback probes are supported.

## Forwarding and resolution

1. Validate the source is an operational local address; normalize the destination. An optional router source may be an interface name or its address.
2. Deliver locally only if this actual device owns the operational destination interface.
3. If received in transit, require a router with forwarding enabled. Locally originated router traffic does not use that transit gate.
4. Select the longest matching **explicitly configured on-link prefix**. A host uses its manually supplied default next hop when off-link; a router has only connected destinations in this model.
5. Resolve that next hop on the selected **actual attached operational link**. Only the peer's interface ownership can satisfy resolution; a matching address elsewhere cannot teleport traffic.
6. Traverse the peer and repeat with bounded loop detection. Generate a reply from the actual delivered endpoint, route it independently, and require the restored source/destination identities and original endpoint.

This is bounded IPv6 Neighbor Discovery resolution, **never ARP**. A configured address/prefix pair expressly includes manual on-link configuration; the model does not infer an advertised on-link prefix from a SLAAC address. There is no shared switch fabric, neighbor cache, NS/NA packet encoding, multicast membership, DAD, NUD, RA/RS, timers or lifetimes. Physical state combines interface enablement and the actual connected peer/link. These abstractions are disclosed in outputs.

Link-local routing is unnecessary here because the host next hops are explicitly configured global addresses on each local link. It is deferred, not treated as globally unique. Router static/default routes, recursive lookup, ECMP, OSPFv3, EIGRPv6, dual-stack interactions, ACLv6, NAT64 and IPv6 tunnels are unsupported. An invalid/unresolved next hop, wrong on-link decision, down link, absent connected route or broken return delivery produces a real modeled failure. No routing decision reads scenario ID, repair answer or evidence rule.

## Commands and trials

| Device | Implemented educational commands                                                           |
| ------ | ------------------------------------------------------------------------------------------ |
| PC     | `ipconfig`, `ipconfig /all`, `route print`, IPv6 `ping`                                    |
| Router | `show ipv6 interface brief`, `show running-config`, IPv6 `ping` with optional local source |

The configuration view includes effective default state (`no ipv6 unicast-routing`) explicitly; real IOS may omit default commands. Host routes show manually configured on-link/local entries and `::/0`. No complete Windows or IOS table is claimed. `show ipv6 route`, traceroute and neighbor tables are deliberately unsupported; displaying a manufactured IOS RIB while routing is disabled would mislead. Ping reports deterministic five-of-five or zero-of-five exchange with no invented latency or capture.

Strict `ipv6-forwarding` actions select an existing router and boolean; extra fields and PC targets are rejected. Only this field changes. No-ops do not advance the configuration version. Existing replay, action limits, deadlines, finalization and storage compare-and-swap remain in force. Evidence authenticates command, device, normalized target/source, exact output and configuration epoch. Duplicate, forged, foreign or stale records cannot earn credit. Source selection is part of evidence identity.

## Grading and privacy

The case-specific evaluator resides behind the existing private case boundary. Full score: 20 root cause/initial state, 10 device, 30 original evidence, 20 correct applied correction/mechanism and 20 fresh verification. Original observations cover both host configurations/routes, router config/brief, both local controls and the failed remote probe. Fresh observations cover router config/brief, both host routes, local controls and reciprocal remote traffic. Recovery also checks invariant addressing/links and actual reciprocal connectivity. Applying the right trial without new observations yields **80 / recovered-unverified**, not full recovery. Reverting and reapplying invalidates the earlier verification epoch.

Public metadata supplies neutral title, incident, intended topology and plausible structured choices. It does not contain the fault value, exact gateway/host source addresses, repair binding, rubric or teaching. The server evaluates Assessment against its own case and persisted attempt. Practice intentionally downloads an inspectable pack through the existing API and can work offline; this is not secure examination isolation. Assessment requires internet, has no hints or answer reveal during the attempt, and uses the unchanged no-store/session persistence architecture.

Pack key `netfault.practice.ipv6-01.v1` coexists with older packs and version-1 journals. Trials/source fields use existing optional journal conventions. Raw recovery export includes the new pack. Export data before rolling back to an application older than schema 14; do not overwrite unreadable future-version data. No service-worker source, session-store, CAS, environment or dependency change is needed.

## Tests and references

Independent tests in `tests/ipv6-model.test.ts` use Juniper/Bridgewater/Cypress and unrelated `2001:db8:67:*` addressing, before the private case is imported. They cover identity, prefix arithmetic, direct-link ownership, wrong-prefix/next-hop/missing-route behavior, independent return, source ownership, disabled transit versus local delivery, link state, schema separation and honest commands. `tests/ipv6.test.ts` adds case, minimal repair, grading forgery/freshness, persistence, API privacy, concurrent repair, module reload, deadline and immutable finalization tests. Browser workflows cover real production offline reload, timed Assessment, journal/preview, all-device inspection and primer at desktop/414/360px. Actual totals: [verification](verification.md).

Primary references read 30 September 2026, separate from the course evidence:

- [Cisco IPv6 command reference — ipv6 unicast-routing](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipv6/command/ipv6-cr-book/ipv6-i5.html): global forwarding control, no form and disabled default. Output here remains explicitly an educational subset.
- [RFC 4291](https://www.rfc-editor.org/rfc/rfc4291): 128-bit identities and address classes.
- [RFC 5952](https://www.rfc-editor.org/rfc/rfc5952): canonical textual representation; runtime parsing plus tested arithmetic avoids string-based equality.
- [RFC 5942](https://www.rfc-editor.org/rfc/rfc5942): IPv6 address assignment and on-link determination are distinct; manual on-link configuration is explicit in this model.
- [RFC 4861](https://www.rfc-editor.org/rfc/rfc4861), especially section 7.2: on-link neighbor address resolution. This implementation models its link-scoped outcome, not the protocol's complete lifecycle.

Reference review is not external device execution. The [optional original companion](ipv6-device-companion.md) remains UNEXECUTED.
