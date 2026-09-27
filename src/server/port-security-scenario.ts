import "server-only";
import { scenarioSchema } from "@/lib/schema";
import { portSecurityLab as lab, commandsFor } from "@/lib/catalog";
const intf = (name: string, ip: string, mac: string) => ({ name, ip, prefix: 24, mac, up: true });
const configs = {
  "PC-A": { gateway: "172.30.10.1", interfaces: [intf("Ethernet0", "172.30.10.10", "0200.0012.000a")] },
  SW1: {
    interfaces: [],
    vlans: [{ id: 10, name: "Workstations", active: true }],
    ports: [
      {
        name: "FastEthernet0/1",
        vlan: 10,
        up: true,
        speed: 100,
        duplex: "full",
        portSecurity: { enabled: true, maximum: 1, violation: "protect", staticMac: "0200.0012.009a" },
      },
      { name: "FastEthernet0/24", vlan: 10, up: true, speed: 100, duplex: "full" },
    ],
  },
  R1: {
    routerId: "1.1.1.1",
    interfaces: [intf("Gi0/0", "172.30.10.1", "0200.0012.0101"), intf("Gi0/1", "172.30.20.1", "0200.0012.0102")],
  },
  "PC-B": { gateway: "172.30.20.1", interfaces: [intf("Ethernet0", "172.30.20.10", "0200.0012.000b")] },
};
export const portSecurityScenario = scenarioSchema.parse({
  schemaVersion: 11,
  id: lab.id,
  revision: 1,
  title: lab.title,
  incident: lab.incident,
  design: lab.design,
  devices: lab.devices.map((d) => ({ ...d, ...configs[d.id], commands: commandsFor(lab.id, d.id) })),
  links: [
    ["desk", "PC-A", "Ethernet0", "SW1", "FastEthernet0/1", "172.30.10.0/24"],
    ["uplink", "SW1", "FastEthernet0/24", "R1", "Gi0/0", "172.30.10.0/24"],
    ["remote", "R1", "Gi0/1", "PC-B", "Ethernet0", "172.30.20.0/24"],
  ].map(([id, a, ai, b, bi, subnet]) => ({
    id,
    a: { device: a, interface: ai },
    b: { device: b, interface: bi },
    subnet,
  })),
  fault: { cause: "secure-mac", devices: ["SW1"], interface: "SW1:FastEthernet0/1" },
  acceptedFixes: ["secure-mac"],
  repair: {
    kind: "port-security-mac",
    device: "SW1",
    interface: "FastEthernet0/1",
    mac: "0200.0012.000a",
    reason: "source-admission",
  },
  evidenceRules: [
    {
      label: "Initial endpoint identity and static registration",
      points: 10,
      requirements: [
        { devices: ["PC-A"], commands: ["ipconfig /all"] },
        { devices: ["SW1"], commands: ["show port-security address"] },
      ],
    },
    {
      label: "Initial physical and VLAN controls",
      points: 5,
      requirements: [
        { devices: ["SW1"], commands: ["show interfaces status"] },
        { devices: ["SW1"], commands: ["show vlan brief"] },
      ],
    },
    {
      label: "Initial enabled full-slot protect policy",
      points: 5,
      requirements: [
        { devices: ["SW1"], commands: ["show port-security interface fastethernet0/1", "show running-config"] },
      ],
    },
    {
      label: "Initial failed local probe, routes and remote positive control",
      points: 10,
      requirements: [
        { devices: ["PC-A"], commands: ["ping"] },
        { devices: ["R1"], commands: ["show ip route"] },
        { devices: ["PC-B"], commands: ["ping"] },
      ],
    },
  ],
  hints: [
    "Begin with PC-A's addressing and a local-gateway probe. Use PC-B's local gateway as an independent control.",
    "Check both access ports and VLAN membership. Operational carrier does not prove every source is admitted.",
    "Compare the intended workstation's physical address with the configured secure address. Read the policy mode and capacity together.",
    "Replace only the static registration for the approved NIC. Keep security enabled, maximum one, protect and VLAN membership; gather fresh security, configuration, resolution and reciprocal delivery evidence.",
  ],
  explanation:
    "SW1 FastEthernet0/1 permits static source 0200.0012.009a, but PC-A's unchanged NIC is 0200.0012.000a. With maximum one already occupied and protect configured, PC-A's ingress frames are discarded while carrier stays connected. This blocks modeled ARP requests, and also PC-A's responses when R1 initiates resolution. Correct IPv4, VLAN and routing cannot bypass failed Ethernet admission.",
  solution:
    "Replace SW1 FastEthernet0/1's static secure MAC 0200.0012.009a with 0200.0012.000a. Keep enabled, maximum 1, protect, VLAN 10 and all other state unchanged. Select fresh PC-A ipconfig /all; SW1 running-config, secure address, interface security, status and VLAN; PC-A gateway ping then arp -a; reciprocal PC-A/PC-B pings; and PC-B gateway ping. The model's atomic slot replacement is not an IOS command. Real controlled maintenance uses no switchport port-security mac-address <old> followed by switchport port-security mac-address <approved>; the interval with a free slot can permit learning and must be controlled. No startup-config save is simulated.",
  lesson: [
    {
      title: "1 · Simple explanation",
      text: "An access port can accept only a registered Ethernet source. A working cable tells you the physical connection exists, not that this workstation is admitted. Maximum one plus one static registration fills the permitted set.",
    },
    {
      title: "2 · Analogy and its limits",
      text: "Think of an open building entrance whose attendant checks a vehicle plate. An open door does not put every vehicle on the list. The limit: a MAC address can be copied; it is not a person's identity, a password or strong authentication. A switch compares frame fields, not trustworthiness.",
    },
    {
      title: "3 · Technical mechanism",
      text: "The switch checks the arriving frame's source MAC at ingress. Matching the full static slot admits it; another source in this protect subset is discarded without shutting the interface. The same rule applies to modeled ARP and IPv4 delivery. VLAN forwarding and next-hop resolution are separate prerequisites. A router creates a new Ethernet segment with its own egress MAC; the original IP source continues across routed hops. This is not an IPv4 ACL.",
    },
    {
      title: "4 · Addresses and diagnostic reasoning",
      text: "PC-A is 172.30.10.10/24 with gateway 172.30.10.1 and NIC 0200.0012.000a. ipconfig /all identifies that NIC; route print explains direct versus gateway delivery. SW1 status and VLAN output exclude carrier and VLAN defects. Security address/interface and running-config expose the registered 0200.0012.009a, enabled maximum 1 and protect. R1's connected/local routes cover both LANs. PC-B at 172.30.20.10 can reach 172.30.20.1, isolating the desk path.",
    },
    {
      title: "5 · Guided verification",
      text: "Before repair, compare PC-A self-ping, gateway ping and PC-B gateway ping. Self-ping bypasses the switch. A failed PC-A gateway probe produces no resolved gateway MAC. A reverse probe also fails: PC-A's resolution response enters the same protected port. After slot correction, repeat PC-A gateway ping then arp -a: 172.30.10.1 maps to 0200.0012.0101. Repeat both host directions and the remote control. Show current enabled maximum-one protect configuration. Exclusive admission follows from the configured single-address predicate, not an executed attacker probe.",
    },
    {
      title: "6 · Worked correction and model limits",
      text: "Use the structured static-slot replacement and inspect fresh outputs before submitting. The secure-up label remains in both states; it does not prove a particular source is admitted. The simulator checks a complete resolution transaction on each hop/probe; its ARP view is recorded successful exchanges, not a persistent bypass cache. Every actual edit starts a new empty observation epoch; it does not imply a real PC cache flush. No learning, aging, counters, restrict, err-disable, timing or reload behavior is modeled.",
      revealOnRequest: true,
    },
    {
      title: "7 · Independent exercise",
      text: "A different office has connected carrier, the correct VLAN and a full static protect slot. Its approved NIC and secure registration match, but remote ping fails. Which independent layers must you inspect next? Explain why changing the registration without evidence is unjustified. Check your reasoning only when ready.",
      revealOnRequest: true,
    },
    {
      title: "Independent exercise · Check reasoning",
      text: "Matching admission does not create a usable gateway, routes or return path. Verify local resolution/delivery, host mask/gateway, router interfaces and both directions' route lookups. Keep the approved admission policy intact; successful physical or policy checks alone do not establish end-to-end service.",
      revealOnRequest: true,
    },
  ],
});
