# LAB 006 — The Mismatched Timers

Schema v6, `timer-01`, revision 1. Practice and server-owned 20-minute Assessment reuse the existing engine, grader, journal and storage providers. Private content is in `src/server/timer-scenario.ts`; public design/choices contain no fault location.

## Design and sole fault

PC-A — R1 — R2 — R3 — PC-B. All interfaces up; hosts correctly addressed; no static/default routes. Router IDs are 1.1.1.1, 2.2.2.2, 3.3.3.3.

| Device/interface | Address | OSPF |
| --- | --- | --- |
| PC-A Ethernet0 | 192.168.10.10/24, gateway 192.168.10.1 | None |
| R1 Gi0/0 | 192.168.10.1/24 | Passive broadcast LAN |
| R1 Gi0/1 | 10.0.12.1/30 | Active point-to-point |
| R2 Gi0/0 | 10.0.12.2/30 | Active point-to-point |
| R2 Gi0/1 | 10.0.23.1/30 | Active point-to-point |
| R3 Gi0/0 | 10.0.23.2/30 | Active point-to-point, faulty 5/20 profile |
| R3 Gi0/1 | 192.168.30.1/24 | Passive broadcast LAN |
| PC-B Ethernet0 | 192.168.30.10/24, gateway 192.168.30.1 | None |

Every OSPF interface is area 0, cost 1, MTU 1500, authentication none. The stated site design requires Hello 10 / Dead 40. Only R3 Gi0/0 deviates, using 5/20. This is one incorrect profile with two fields; no second passive/area fault is injected. The new server-only healthy addressing fixture is independent of old faulted scenarios.

Before repair R1–R2 is FULL/-, R2–R3 is absent, connected transit pings work, R1 learns 10.0.23.0/30 at cost 2 but lacks PC-B's LAN. R3 has only C/L. Both PC directions fail. Matching only Hello or only Dead still fails. Missing adjacency alone does not prove the cause.

## Investigation and grading

All three routers support interface brief, routes, OSPF neighbors/interface/protocols, running-config, ping and traceroute. PC-A supports ipconfig, /all, ping, tracert; PC-B supports ipconfig/ping. Destination inputs and optional router source use the existing validation and history.

Compare both endpoints' interface/config timer observations, then neighbors and routing impact. The deterministic rubric is cause 30; exact router/interface 10+10; evidence 30 (R2 timer-bearing view 10, R3 timer-bearing view 10, neighbor plus routing context 10); exact targeted 10/40 repair 10; compatibility explanation 10. Notes are retained, not interpreted. Area/passive/gateway changes, wrong device/interface and a compatible but design-violating profile cannot earn full credit.

## Repair and teaching

On R3 interface Gi0/0, use `ip ospf hello-interval 10` and `ip ospf dead-interval 40`. The simulator clones the state and changes only those fields. Reciprocal R2–R3 FULL, R1's remote LAN route via 10.0.12.2 at cost 3, R3's remote LAN via 10.0.23.1 at cost 3 and bidirectional probes follow from the shared model. All other settings stay unchanged.

Seven sections teach simple timer purpose, a bounded check-in analogy, actual Hello parameter compatibility, the worked case, command-led practice, an independent 2/8-versus-2/10 case and its explicitly requested solution. Four hints progressively guide investigation. The analogy does not imply human scheduling or that a faster sender is automatically compatible. No timer clock, transient FSM or LSA packet exchange is simulated.

## Verification

`tests/timer.test.ts` checks schema/registry, exact healthy fixture restoration, all-address reachability, neighbors/routes, single-field mismatches, command agreement, partial/forged grading and persisted server assessment. `tests/browser/timer.spec.ts` plays practice and assessment, restores journals and completes offline practice at desktop and 414 CSS pixels. Existing OSPF area/passive tests remain required. See the milestone execution record and final verification report for actual run results.

Primary reference checked: [Cisco OSPF neighbor troubleshooting](https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13699-29.html) describes compatible Hello parameters and inspecting both interfaces. [Cisco OSPF command reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/command/iro-cr-book/m_ospf-a1.html) documents interval configuration. These are reference checks, not controlled IOS/CML/GNS3 validation.
