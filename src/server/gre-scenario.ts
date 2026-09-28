import "server-only";
import { scenarioSchema } from "@/lib/schema";
import { greLab as lab, commandsFor } from "@/lib/catalog";
let nic = 0;
const intf = (name: string, ip: string, prefix: number) => ({
  name,
  ip,
  prefix,
  up: true,
  mac: `0200.0014.${String(++nic).padStart(4, "0")}`,
});
const tunnel = (sourceInterface: string, destination: string, ip: string) => ({
  name: "Tunnel0",
  mode: "gre-ip",
  sourceInterface,
  destination,
  ip,
  prefix: 30,
  adminUp: true,
});
const configs = {
  "PC-A": { gateway: "172.31.10.1", interfaces: [intf("Ethernet0", "172.31.10.10", 24)] },
  R1: {
    routerId: "1.1.1.1",
    interfaces: [intf("Gi0/0", "172.31.10.1", 24), intf("Gi0/1", "192.0.2.1", 30)],
    gre: tunnel("Gi0/1", "198.51.100.1", "10.14.0.1"),
    staticRoutes: [{ network: "198.51.100.0", prefix: 30, nextHop: "192.0.2.2" }],
    tunnelRoutes: [{ network: "172.31.20.0", prefix: 24, interface: "Tunnel0" }],
  },
  T1: { routerId: "2.2.2.2", interfaces: [intf("Gi0/0", "192.0.2.2", 30), intf("Gi0/1", "198.51.100.1", 30)] },
  R2: {
    routerId: "3.3.3.3",
    interfaces: [intf("Gi0/0", "198.51.100.2", 30), intf("Gi0/1", "172.31.20.1", 24)],
    gre: tunnel("Gi0/0", "192.0.2.1", "10.14.0.2"),
    staticRoutes: [{ network: "192.0.2.0", prefix: 30, nextHop: "198.51.100.1" }],
    tunnelRoutes: [{ network: "172.31.10.0", prefix: 24, interface: "Tunnel0" }],
  },
  "PC-B": { gateway: "172.31.20.1", interfaces: [intf("Ethernet0", "172.31.20.10", 24)] },
};
export const greScenario = scenarioSchema.parse({
  schemaVersion: 13,
  id: lab.id,
  revision: 1,
  title: lab.title,
  incident: lab.incident,
  design: lab.design,
  devices: lab.devices.map((d) => ({ ...d, ...configs[d.id], commands: commandsFor(lab.id, d.id) })),
  links: [
    ["lan-a", "PC-A", "Ethernet0", "R1", "Gi0/0", "172.31.10.0/24"],
    ["transport-a", "R1", "Gi0/1", "T1", "Gi0/0", "192.0.2.0/30"],
    ["transport-b", "T1", "Gi0/1", "R2", "Gi0/0", "198.51.100.0/30"],
    ["lan-b", "R2", "Gi0/1", "PC-B", "Ethernet0", "172.31.20.0/24"],
  ].map(([id, a, ai, b, bi, subnet]) => ({
    id,
    a: { device: a, interface: ai },
    b: { device: b, interface: bi },
    subnet,
  })),
  fault: { cause: "incorrect-tunnel-destination", devices: ["R1"], interface: "R1:Tunnel0" },
  acceptedFixes: ["gre-destination"],
  repair: {
    kind: "gre-destination",
    device: "R1",
    interface: "Tunnel0",
    destination: "198.51.100.2",
    reason: "gre-endpoint",
  },
  evidenceRules: [
    {
      label: "Original source-aware underlay controls",
      points: 10,
      requirements: [{ devices: ["R1"], commands: ["ping"] }],
    },
    {
      label: "Original endpoint configuration and local tunnel state",
      points: 10,
      requirements: [
        { devices: ["R1"], commands: ["show running-config"] },
        { devices: ["R2"], commands: ["show running-config"] },
        { devices: ["R1"], commands: ["show interfaces tunnel 0"] },
      ],
    },
    {
      label: "Original overlay routes and failed service",
      points: 10,
      requirements: [
        { devices: ["R1"], commands: ["show ip route"] },
        { devices: ["R2"], commands: ["show ip route"] },
        { devices: ["PC-A"], commands: ["ping"] },
      ],
    },
  ],
  hints: [
    "Separate the physical transport, local logical interface and end-to-end service. Check both PC configurations and router interfaces.",
    "Use R1's physical transport source to test both the configured outer destination and the intended remote router. Successful ordinary pings do not prove inner delivery.",
    "Compare both tunnel configurations with T1's interface addresses. Which actual device owns R1's destination? Local up/up does not identify a remote receiver.",
    "Change only R1 Tunnel0's destination to R2's physical tunnel source. Keep original controls, both endpoint configs, local tunnel output, both routes and the failed PC probe. Then select fresh R1 tunnel output, both routes, reciprocal Tunnel0-sourced tunnel pings and both PC service pings.",
  ],
  explanation:
    "R1 Tunnel0 targets 198.51.100.1, owned by T1, instead of R2's 198.51.100.2. R1 can route to either address; its local Tunnel0 stays up/up and the overlay routes stay installed. Outer delivery to T1 succeeds, but T1 has no matching GRE endpoint, so the inner packet never reaches R2. Reverse initiation also fails the configured receiver pairing at R1. No LAN, gateway or route change is needed.",
  solution:
    "On R1 only: interface Tunnel0; tunnel destination 198.51.100.2. Keep source Gi0/1 (192.0.2.1), tunnel 10.14.0.1/30 and both routing layers unchanged. R2 already sources from Gi0/0 (198.51.100.2), targets 192.0.2.1 and owns 10.14.0.2/30. Verify fresh R1 tunnel output, both endpoint routes, R1 ping 10.14.0.2 source Tunnel0, R2 ping 10.14.0.1 source Tunnel0, and both PC service directions. Up/up alone is insufficient.",
  lesson: [
    {
      title: "1 · Simple explanation",
      text: "GRE carries one IP packet inside another across an ordinary routed network. Tunnel0 is a logical interface, not a cable or a new physical neighbor. GRE alone provides no encryption.",
    },
    {
      title: "2 · Analogy and limits",
      text: "Imagine an addressed envelope carrying another envelope. The outer address gets it to a remote mailroom; the inner address still identifies the final desk. Sending to a reachable but wrong mailroom does not reach the intended desk. Limits: routers use protocol headers, not people; there is no confidentiality, negotiated session, guaranteed delivery or modeled keepalive.",
    },
    {
      title: "3 · Technical mechanism",
      text: "PC-A sends inner 172.31.10.10 → 172.31.20.10 to its gateway. R1's static overlay route selects Tunnel0. Physical routing carries outer 192.0.2.1 → configured destination through T1. Only the actual receiving router with matching source/destination resumes inner forwarding. R2 then routes to PC-B. The reply independently uses its overlay route and reverse physical transport. Local tunnel line state tests source availability and a local physical route, not remote liveness.",
    },
    {
      title: "4 · Worked configuration",
      text: "R1: interface Tunnel0; ip address 10.14.0.1 255.255.255.252; tunnel source Gi0/1; tunnel destination 198.51.100.2; tunnel mode gre ip. Its overlay route is ip route 172.31.20.0 255.255.255.0 Tunnel0. R2 reverses outer endpoints and routes 172.31.10.0/24 through Tunnel0. Underlay routes remain R1 198.51.100.0/30 via 192.0.2.2 and R2 192.0.2.0/30 via 198.51.100.1. T1 needs only its connected transport routes.",
    },
    {
      title: "5 · Symptom and complementary diagnostics",
      text: "ipconfig establishes NIC and gateway. Interface brief identifies physical owners and local state. Route tables distinguish underlay next hops from overlay exits. Source-aware physical pings prove transport to both the wrong and intended addresses. Both running configs plus show interfaces tunnel 0 reveal the mismatch. Failed PC traffic supplies the service symptom. Correcting the destination changes delivery without changing up/up or the installed routes.",
    },
    {
      title: "6 · Guided practice",
      text: "Keep the original eight observations: two R1 underlay pings sourced from Gi0/1, both endpoint configs, R1 tunnel output, both routes and failed PC-A service. Apply the one-field correction. Select seven fresh observations: R1 tunnel output, both routes, reciprocal remote tunnel pings sourced from Tunnel0 and both PC pings. The repaired preview derives outer journeys and inner delivery from this same model; it is not traceroute.",
    },
    {
      title: "7 · Independent exercise",
      text: "Cedar uses outer source 192.0.2.5 and Maple uses 198.51.100.10. Cedar targets reachable transport address 198.51.100.9. Local Tunnel0 is up/up. Which observation distinguishes local state from remote delivery? What field should identify Maple, and would changing it repair a missing return route? Decide before revealing.",
    },
    {
      title: "Independent exercise · requested solution",
      text: "Compare source/destination configurations and actual interface ownership; then test both inner initiation directions. Cedar's destination must identify Maple's 198.51.100.10, while Maple targets 192.0.2.5. A destination correction does not add a missing return route. Recheck independent underlay and overlay routing.",
      revealOnRequest: true,
    },
  ],
});
