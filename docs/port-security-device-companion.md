# Optional switch practice — UNEXECUTED

Original NetFault-created brief; **not an official UM practical sheet**. No `.pkt`, switch console session, device/version execution, observed violations or tested recovery is supplied. External practical competence is separate from simulator scores. Use an isolated, authorized training environment whose switch model/version actually supports static access-port security with protect mode. Record unsupported features honestly rather than substituting screenshots or invented output.

## Record before starting

Record your date, Packet Tracer version or physical switch model/software, chosen interfaces, cabling, endpoint actual NIC addresses, addressing plan and expected local connectivity. Confirm feature support in the applicable device documentation. Use a spare isolated port; do not reset a real switch or alter a production VLAN. Save the original relevant configuration and arrange authorized rollback.

Use unrelated Notebook Q, Notebook T, switch Bench and VLAN 30. Choose valid actual NIC identities from each endpoint and a private /24 addressing plan with distinct hosts. A second endpoint on another ordinary access port provides a local ping target; no routed service is required. First establish carrier, matching VLAN membership, addressing and ordinary bidirectional reachability and save the authentic output.

## Configure, observe, correct

1. On the designated test edge, configure static access mode and the planned VLAN. Configure maximum one, explicit protect mode and the approved endpoint's actual static MAC; enable port security. Verify ordering and support on the selected platform. Example command vocabulary (placeholders must be replaced from your environment):

   ```text
   interface <test-edge>
    switchport mode access
    switchport access vlan 30
    switchport port-security maximum 1
    switchport port-security violation protect
    switchport port-security mac-address <approved-actual-MAC>
    switchport port-security
   ```

2. Save real `show running-config`, `show interfaces status`, `show vlan brief`, `show port-security`, `show port-security interface <test-edge>` and `show port-security address` output, using supported equivalents only. Confirm the one static slot occupies the configured maximum. The guide is not claiming a particular platform's output layout or counter value.
3. Connect the approved endpoint. Record ping in both directions and actual ARP observations. Explain which observation proves carrier, VLAN, registration and delivery respectively.
4. In the isolated lab only, substitute your other owned endpoint with a different actual NIC on the same test edge. Preserve a valid IP plan and avoid duplicate addresses. This is controlled endpoint substitution, not MAC spoofing or an attack requirement. Record what actually happens to traffic and interface state; do not fill in expected output as if observed. Compare against the configured violation mode and platform documentation.
5. Restore the intended endpoint. For a controlled wrong-registration investigation, configure an authorized different static entry, observe the fault and then replace it with the intended actual MAC. Real CLI replacement commonly involves removing the old static address and adding the new one. A temporarily empty slot can allow dynamic learning; control/disconnect endpoint traffic during editing and inspect actual learned/configured state. Follow the platform's documented cleanup if necessary. NetFault's atomic replacement does not simulate this interval. Never solve the exercise by removing the policy or increasing the maximum.
6. Verify and preserve enabled security, maximum one, protect, access VLAN and intended NIC identity. Gather fresh legitimate bidirectional pings and configuration/security evidence. State separately what was observed and what follows from the allowed-set policy. No hostile source is required for NetFault's negative invariant.
7. Record any explicitly authorized startup save separately; simulation does not prove persistence after reload. Restore the isolated environment to its agreed state. Do not erase unrelated device configuration.

## Evidence template

| Item                                       | Learner's actual evidence |
| ------------------------------------------ | ------------------------- |
| Environment/model/software/date            | Not recorded — UNEXECUTED |
| Baseline addressing/cabling/output         | Not recorded              |
| Static full-slot protect configuration     | Not recorded              |
| Approved endpoint delivery                 | Not recorded              |
| Controlled substitution observation        | Not recorded              |
| Corrected registration and retained policy | Not recorded              |
| Fresh reachability/resolution              | Not recorded              |
| Limitations, cleanup and optional save     | Not recorded              |

Explain why a connected/secure-up port alone is insufficient and why a copyable MAC is not authentication. Identify what different behavior would require a separate model (learning, aging, restrict or shutdown). Reference: [Cisco Catalyst 2960 IOS 15.2(1)E guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-2_1_e/configuration/guide/2960_scg/swtrafc.html). Verify applicability to your actual device before using this vocabulary.
