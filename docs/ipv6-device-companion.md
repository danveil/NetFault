# Optional IPv6 device practice — UNEXECUTED

Original exercise accompanying [LAB 015](milestone-3r.md), using different addresses. **UNEXECUTED:** no Packet Tracer file, IOS session, screenshots or measured output are supplied. First record the actual tool/version, device/image and interface names; adapt syntax to that platform's official documentation. Simulator tap completion is not evidence that you completed this exercise.

## Build and configure

Connect host Cedar to router Juniper's first Ethernet interface and host Maple to its second. Use suitable physical media; do not add another routing protocol or unrelated fault.

| Endpoint                 | Manual address/prefix  | Manual default next hop |
| ------------------------ | ---------------------- | ----------------------- |
| Cedar                    | `2001:db8:88:1::10/64` | `2001:db8:88:1::1`      |
| Juniper first interface  | `2001:db8:88:1::1/64`  | —                       |
| Juniper second interface | `2001:db8:88:2::1/64`  | —                       |
| Maple                    | `2001:db8:88:2::20/64` | `2001:db8:88:2::1`      |

Use the platform's manual host addressing/default-route controls; verify installed on-link and default routes. Address assignment alone must not be mistaken for proof of the desired on-link route. Avoid relying on automatic addressing or gateway discovery for this exercise.

Illustrative IOS configuration, with actual interface names substituted:

```text
configure terminal
ipv6 unicast-routing
interface GigabitEthernet0/0
 ipv6 address 2001:db8:88:1::1/64
 no shutdown
interface GigabitEthernet0/1
 ipv6 address 2001:db8:88:2::1/64
 no shutdown
end
show ipv6 interface brief
show running-config
```

Verify each host reaches its own gateway and that each can initiate traffic to the other. Record commands and actual outputs; do not insert the application's deterministic ping output as device evidence. Real hosts/routers may generate link-local addresses, multicast memberships, DAD and RAs; these are real platform behavior outside the bounded application model. Identify which routes came from your manual configuration versus automatic behavior.

## Introduce, diagnose and repair one fault

On the router, disable only IPv6 forwarding:

```text
configure terminal
no ipv6 unicast-routing
end
```

Keep addresses, ports, manual host routes and cables unchanged. Record host addressing/routes, router interface/configuration state, local controls and both remote directions. Compare packets addressed to the router with packets that need it to forward them. Real error messages and timing vary: record discrepancies rather than assuming the application predicts the full device output.

Explain the observed difference before restoring `ipv6 unicast-routing`. Then obtain **fresh** configuration/interface evidence, host route checks, both local controls and both remote directions. Explain why no static routing protocol was needed for this one-router, two-connected-network topology. Compare this with the course's OSPFv3 prerequisite without claiming you configured OSPFv3.

## Save, reopen and evidence record

Save router configuration using the platform's supported command (commonly `copy running-config startup-config`); save the project/host settings separately. Reopen or reload in the controlled lab, confirm what persisted, and repeat the successful probes. Record:

- Date, platform/version, device image and actual interface names.
- Manual addresses, on-link/default routes and any automatically installed state.
- Genuine baseline, broken and repaired outputs with direction/source identified.
- Saved/reopened result, differences from the educational model and unresolved questions.

Keep this document labeled UNEXECUTED until authentic evidence is added. An unsuccessful or unsupported platform step is a finding, not permission to fabricate a successful result.
