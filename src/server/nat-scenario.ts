import "server-only";
import { scenarioSchema } from "@/lib/schema";
import { natLab as lab, commandsFor } from "@/lib/catalog";
const intf = (name: string, ip: string, mac: string, prefix = 24) => ({ name, ip, mac, prefix, up: true });
const configs = {
  "PC-A": { gateway: "192.168.40.1", interfaces: [intf("Ethernet0", "192.168.40.10", "0200.0013.000a")] },
  R1: {
    routerId: "1.1.1.1",
    interfaces: [intf("Gi0/0", "192.168.40.1", "0200.0013.0101"), intf("Gi0/1", "192.0.2.1", "0200.0013.0102", 30)],
    staticRoutes: [{ network: "198.51.100.0", prefix: 24, nextHop: "192.0.2.2" }],
    nat: {
      mode: "static-one-to-one",
      inside: "Gi0/0",
      outside: "Gi0/1",
      mappings: [{ id: "primary", insideLocal: "192.168.40.99", insideGlobal: "203.0.113.10" }],
    },
  },
  R2: {
    routerId: "2.2.2.2",
    interfaces: [intf("Gi0/0", "192.0.2.2", "0200.0013.0201", 30), intf("Gi0/1", "198.51.100.1", "0200.0013.0202")],
    staticRoutes: [{ network: "203.0.113.10", prefix: 32, nextHop: "192.0.2.1" }],
  },
  "PC-B": { gateway: "198.51.100.1", interfaces: [intf("Ethernet0", "198.51.100.10", "0200.0013.000b")] },
};
export const natScenario = scenarioSchema.parse({
  schemaVersion: 12,
  id: lab.id,
  revision: 1,
  title: lab.title,
  incident: lab.incident,
  design: lab.design,
  devices: lab.devices.map((d) => ({ ...d, ...configs[d.id], commands: commandsFor(lab.id, d.id) })),
  links: [
    ["inside", "PC-A", "Ethernet0", "R1", "Gi0/0", "192.168.40.0/24"],
    ["transit", "R1", "Gi0/1", "R2", "Gi0/0", "192.0.2.0/30"],
    ["outside", "R2", "Gi0/1", "PC-B", "Ethernet0", "198.51.100.0/24"],
  ].map(([id, a, ai, b, bi, subnet]) => ({
    id,
    a: { device: a, interface: ai },
    b: { device: b, interface: bi },
    subnet,
  })),
  verificationTargets: [
    { device: "PC-A", target: "198.51.100.10" },
    { device: "PC-B", target: "203.0.113.10" },
  ],
  fault: { cause: "nat-local", devices: ["R1"], interface: "R1:Gi0/0" },
  acceptedFixes: ["nat-local"],
  repair: {
    kind: "nat-static-local",
    device: "R1",
    mappingId: "primary",
    insideLocal: "192.168.40.10",
    reason: "static-translation",
  },
  evidenceRules: [
    {
      label: "Original NIC and configured mapping",
      points: 15,
      requirements: [
        { devices: ["PC-A"], commands: ["ipconfig", "ipconfig /all"] },
        { devices: ["R1"], commands: ["show running-config"] },
      ],
    },
    {
      label: "Original external identity and independent routes",
      points: 10,
      requirements: [
        { devices: ["PC-B"], commands: ["ipconfig", "ipconfig /all"] },
        { devices: ["R1"], commands: ["show ip route"] },
        { devices: ["R2"], commands: ["show ip route"] },
      ],
    },
    {
      label: "Original failed service probe",
      points: 5,
      requirements: [{ devices: ["PC-A", "PC-B"], commands: ["ping"] }],
    },
  ],
  hints: [
    "Compare local gateway access with the two reported cross-boundary failures. Record both host configurations.",
    "Inspect the boundary configuration and both installed route tables. Routing and address representation are independent.",
    "Compare the actual inside NIC with the static entry's inside-local value. A configured entry can exist before any traffic and still identify the wrong address.",
    "Replace only the local member of the existing pair. Keep the global identity, roles and routes. Select fresh configuration, translation and unchanged NIC evidence, then test both service directions and local controls.",
  ],
  explanation:
    "R1 maps unused 192.168.40.99 to assigned global 203.0.113.10, but PC-A actually uses 192.168.40.10. Its outward request does not match and reaches PC-B with its private source; R2 has no private return route by design. An outside request to the global is translated to .99, where inside resolution fails. The same wrong local value explains both symptoms. The global /32 route and interface roles are already correct.",
  solution:
    "Replace only mapping primary's inside-local value with PC-A's unchanged 192.168.40.10. Keep 203.0.113.10, Gi0/0 inside, Gi0/1 outside and both static routes. Real controlled CLI: no ip nat inside source static 192.168.40.99 203.0.113.10; then ip nat inside source static 192.168.40.10 203.0.113.10. Real commands may temporarily interrupt service; the simulator trial is atomic and does not save startup configuration. Select current PC-A config, R1 config/translations, PC-A ping 198.51.100.10, PC-B ping 203.0.113.10 and each PC's gateway ping.",
  lesson: [
    {
      title: "1 · Simple explanation",
      text: "Static NAT gives one inside host a fixed external representation. The host keeps its private NIC address. The boundary changes packet addresses, not the workstation configuration.",
    },
    {
      title: "2 · Analogy and limits",
      text: "A mailroom can substitute an external return label for an internal desk number and restore the desk number on incoming mail. The mail still needs roads in both directions. Limits: NAT is not a person making decisions, encryption, authentication or a firewall guarantee; it does not create routes. One static pair is not many-host PAT.",
    },
    {
      title: "3 · Technical mechanism",
      text: "Let L be 192.168.40.10, G be 203.0.113.10 and E be 198.51.100.10. An inside request L→E reaches R1 Gi0/0, routes out Gi0/1 and becomes G→E. The reply E→G follows R2's /32 to R1, becomes E→L before the inside route lookup and reaches PC-A. An outside-initiated E→G works without earlier inside traffic; its L→E reply becomes G→E. Outside local and outside global are both E here. There are no ports, allocation or expiry.",
    },
    {
      title: "4 · Worked configuration and evidence",
      text: "R1 Gi0/0: 192.168.40.1/24, ip nat inside; Gi0/1: 192.0.2.1/30, ip nat outside. Configure ip nat inside source static 192.168.40.10 203.0.113.10. R1's route to 198.51.100.0/24 goes via 192.0.2.2; R2's 203.0.113.10/32 goes via 192.0.2.1. ipconfig proves the NIC; running-config shows roles/pair; route tables establish installed destinations; show ip nat translations shows the configured pair even before a ping. Only the paired service probes demonstrate delivery.",
    },
    {
      title: "5 · Connect the symptom",
      text: "A→B initially reaches B untranslated, then its reply fails at R2. B→G instead reaches R1 and translates to an unused inside address. A failed ping alone cannot distinguish these. The absent private route is intentional because the partner addresses G. Even after repair, B→L is not expected to work. Correct translation cannot fix a failed link, gateway or missing global return route.",
    },
    {
      title: "6 · Guided practice",
      text: "Compare the original host NIC and static pair, then justify each route using the address visible at that router. Apply one local-value replacement. Record fresh NIC, configuration/table, A→E, B→G and both gateway controls. Keep the global unchanged. Explain why a table entry alone does not prove successful forwarding, and why an old successful ping cannot verify a new trial.",
    },
    {
      title: "7 · Independent exercise",
      text: "An unrelated station uses 10.88.0.20; its assigned external identity is 203.0.113.80. A permanent entry instead references 10.88.0.29. All necessary routes and roles work. Which one value should change? For an external request to .80, describe the destination after the boundary. Would the same correction repair a missing upstream route? Reason before opening the solution.",
    },
    {
      title: "Independent exercise · requested solution",
      text: "Replace only 10.88.0.29 with the actual 10.88.0.20. Incoming destination 203.0.113.80 becomes 10.88.0.20; the station's outward source becomes .80. No route is created: a missing upstream route remains a separate problem. Verify configuration and both initiation directions, not just the chosen value.",
      revealOnRequest: true,
    },
  ],
});
