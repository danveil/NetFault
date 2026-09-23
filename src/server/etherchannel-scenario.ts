import "server-only";
import { scenarioSchema } from "@/lib/schema";
import { commandsFor, etherChannelLab as lab } from "@/lib/catalog";
export const etherChannelScenario = scenarioSchema.parse({
  schemaVersion: 7,
  id: lab.id,
  revision: 1,
  title: lab.title,
  incident: lab.incident,
  design: lab.design,
  devices: lab.devices.map((d) =>
    d.kind === "pc"
      ? {
          ...d,
          commands: commandsFor(lab.id, d.id),
          interfaces: [
            {
              name: "Ethernet0",
              ip: d.id === "PC-A" ? "172.22.40.10" : "172.22.40.20",
              prefix: 24,
              up: true,
              mac: d.id === "PC-A" ? "02:00:00:08:00:10" : "02:00:00:08:00:20",
            },
          ],
        }
      : {
          ...d,
          commands: commandsFor(lab.id, d.id),
          interfaces: [],
          ports: [1, 2, 3].map((n) => ({ name: `Gi1/0/${n}`, vlan: 40, up: true, speed: 1000, duplex: "full" })),
          vlans: [{ id: 40, name: "WORK_AREAS", active: true }],
          portChannels: [
            {
              id: 1,
              members: ["Gi1/0/1", "Gi1/0/2"],
              mode: "passive",
              vlan: 40,
              speed: 1000,
              up: true,
              standaloneDisable: true,
            },
          ],
        },
  ),
  links: [
    {
      id: "ec-host-west",
      a: { device: "PC-A", interface: "Ethernet0" },
      b: { device: "SW1", interface: "Gi1/0/3" },
      subnet: "172.22.40.0/24",
    },
    {
      id: "ec-member-one",
      a: { device: "SW1", interface: "Gi1/0/1" },
      b: { device: "SW2", interface: "Gi1/0/1" },
      subnet: "172.22.40.0/24",
    },
    {
      id: "ec-member-two",
      a: { device: "SW1", interface: "Gi1/0/2" },
      b: { device: "SW2", interface: "Gi1/0/2" },
      subnet: "172.22.40.0/24",
    },
    {
      id: "ec-host-east",
      a: { device: "SW2", interface: "Gi1/0/3" },
      b: { device: "PC-B", interface: "Ethernet0" },
      subnet: "172.22.40.0/24",
    },
  ],
  fault: { cause: "lacp-negotiation", devices: ["SW1", "SW2"], interface: "SW1:Port-channel1" },
  acceptedFixes: ["lacp-mode"],
  repair: { device: "SW1", group: 1, mode: "active", reason: "lacp-initiation" },
  evidenceRules: [
    {
      label: "Host addressing and compatible physical/VLAN context",
      points: 10,
      requirements: [
        { devices: ["PC-A"], commands: ["ipconfig", "ipconfig /all"] },
        { devices: ["PC-B"], commands: ["ipconfig", "ipconfig /all"] },
        { devices: ["SW1"], commands: ["show interfaces status"] },
        { devices: ["SW2"], commands: ["show interfaces status"] },
      ],
    },
    {
      label: "Both initial local negotiation configurations",
      points: 10,
      requirements: [
        { devices: ["SW1"], commands: ["show running-config", "show lacp internal"] },
        { devices: ["SW2"], commands: ["show running-config", "show lacp internal"] },
      ],
    },
    {
      label: "Initial logical bundle evidence on both switches",
      points: 10,
      requirements: [
        { devices: ["SW1"], commands: ["show etherchannel summary", "show interfaces port-channel 1"] },
        { devices: ["SW2"], commands: ["show etherchannel summary", "show interfaces port-channel 1"] },
      ],
    },
  ],
  hints: [
    "Compare both host addresses and masks before looking for a router. Then distinguish a physical link from a logical connection.",
    "Inspect each switch's physical interfaces, VLAN context and aggregate status. Connected cables do not prove a usable aggregate.",
    "Read the local negotiation mode on both sides, not just one. Decide which participant would initiate an exchange.",
    "An initiating LACP participant can negotiate with a responder. Change only the intended mode on one side, then collect new bundle and host reachability observations.",
  ],
  explanation:
    "Both switches' intended LACP members use passive mode. Passive responds but does not initiate, so no bundle forms. Physical carriers, access VLAN 40, speed/duplex and host addressing are correct. Standalone forwarding is explicitly disabled: unbundled members do not provide a parallel bypass. Changing one switch's group to active allows the compatible peer to respond; both members then form the logical connection. Hosts in 172.22.40.0/24 communicate directly without a gateway. Active/active also negotiates, but changing both sides is unnecessary for this fault.",
  solution:
    "One minimal repair (either switch is acceptable):\nSW1(config)# interface range GigabitEthernet1/0/1 - 2\nSW1(config-if-range)# channel-group 1 mode active\nSW1(config-if-range)# end\n\nLeave VLAN, speed, duplex and standalone-disable policy unchanged. Inspect show etherchannel summary and show interfaces port-channel 1 on both switches: Po1(SU), two (P) members and logical up/up. Test PC-A ping 172.22.40.20 and PC-B ping 172.22.40.10. Record actual observations after the latest change. NetFault applies this as one bounded group-mode change; it does not parse IOS configuration commands.",
  lesson: [
    {
      title: "1. Simple explanation",
      text: "EtherChannel combines compatible physical Ethernet links into one logical port channel. A cable may have carrier while the intended bundle is down. LACP active initiates negotiation; passive responds. With two passive endpoints, nobody starts. In this lab's explicitly disabled standalone mode, those unbundled links cannot carry ordinary host traffic independently.",
    },
    {
      title: "2. Analogy and limits",
      text: "Two dispatch desks have working phones but each waits for the other to make the first call before opening a shared delivery service. One initiator breaks the stalemate. Limits: LACP uses protocol frames, identities and compatibility checks, not spoken agreements. This model does not reproduce packet timing, hashing, STP or a bandwidth measurement.",
    },
    {
      title: "3. Technical explanation",
      text: "Physical carrier, local member eligibility, negotiation and logical forwarding are separate conditions. All modeled members are full-duplex access links with matching declared speed and local VLAN policy. LACP active/passive or active/active can aggregate; passive/passive cannot initiate. Local channel-group numbers need not match across switches. LACP does not exchange the access VLAN number as a cross-switch consistency test; this scenario restricts both switches to one declared VLAN. Standalone-disable prevents failed members forwarding independently. One eligible member may keep a bundle up at reduced membership; two bundled members are the intended healthy state here. STP treats a formed bundle as one logical link and may block a redundant logical path in a larger network. No alternate path exists here; neither STP nor throughput is simulated.",
    },
    {
      title: "4. Worked investigation and symptom",
      text: "The two /24 host configurations put 172.22.40.10 and 172.22.40.20 on-link; no default gateway is needed for their traffic. Switch interface status shows physical carrier up with VLAN 40, full duplex and 1000 Mb/s. The aggregate summary shows Po1(SD) and suspended members. Local LACP/configuration views on each switch show passive. The combined evidence separates this fault from wrong addressing, a missing cable, shutdown or merely a one-member working bundle. Apply one group-mode change, then verify both Po1(SU) summaries and both host-initiated ping directions. A selected command or one successful observation alone does not earn full recovery credit.",
    },
    {
      title: "5. Guided practice",
      text: "Record the symptom, both host configurations, both physical status views, both local negotiation modes and both aggregate summaries before changing anything. State the hypothesis in your journal. Apply one mode change on one switch's existing group. Return to Inspect and collect the logical bundle view on both switches and numeric host ping in both directions. Select those outputs as evidence before submitting. If you change configuration again, earlier verification describes the older state and must be repeated. Ten actual changes and 100 commands bound this attempt; restart as a new attempt if you need more practice.",
    },
    {
      title: "6. Independent exercise",
      text: "On a different two-switch network, Leaf uses group 7 active and Spine group 9 passive, with compatible access members and standalone forwarding disabled. One of two physical member cables becomes unavailable. Predict whether the different group numbers prevent negotiation, whether the remaining member can preserve logical connectivity, and what evidence distinguishes reduced membership from a completely failed bundle. Decide before requesting the final part.",
    },
    {
      title: "7. Independent solution",
      revealOnRequest: true,
      text: "Group IDs are local, so 7 versus 9 does not by itself prevent LACP. Active/passive can negotiate on the remaining compatible live member. With no higher minimum-link requirement in this subset, the bundle stays up with one (P) member and the unavailable member down. Verify physical carrier, bundled-member count, logical up state and host traffic. This proves reduced membership with connectivity, not a measured throughput. Losing both eligible links makes the aggregate down; standalone forwarding remains disabled.",
    },
  ],
});
