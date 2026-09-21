import "server-only";
import { scenarioSchema } from "@/lib/schema";
import { nextHopLab } from "@/lib/catalog";
import { threeRouterNetwork } from "./three-router-network";
export function healthyStaticNetwork() {
  const network = threeRouterNetwork("next-hop-01", false);
  network.devices.find((d) => d.id === "R1")!.staticRoutes = [
    { network: "10.0.23.0", prefix: 30, nextHop: "10.0.12.2" },
    { network: "192.168.30.0", prefix: 24, nextHop: "10.0.12.2" },
  ];
  network.devices.find((d) => d.id === "R2")!.staticRoutes = [
    { network: "192.168.10.0", prefix: 24, nextHop: "10.0.12.1" },
    { network: "192.168.30.0", prefix: 24, nextHop: "10.0.23.2" },
  ];
  network.devices.find((d) => d.id === "R3")!.staticRoutes = [
    { network: "10.0.12.0", prefix: 30, nextHop: "10.0.23.1" },
    { network: "192.168.10.0", prefix: 24, nextHop: "10.0.23.1" },
  ];
  return network;
}
const network = healthyStaticNetwork();
network.devices.find((d) => d.id === "R2")!.staticRoutes![1].nextHop = "10.0.12.1";
export const nextHopScenario = scenarioSchema.parse({
  schemaVersion: 6,
  id: "next-hop-01",
  revision: 1,
  title: nextHopLab.title,
  incident: nextHopLab.incident,
  design: nextHopLab.design,
  ...network,
  fault: { cause: "incorrect-static-next-hop", devices: ["R2"], interface: "routing-table" },
  acceptedFixes: ["static-route"],
  repair: {
    device: "R2",
    route: { network: "192.168.30.0", prefix: 24, nextHop: "10.0.23.2" },
    reason: "forward-route",
  },
  evidenceRules: [
    {
      label: "Installed incorrect destination route on R2",
      points: 15,
      requirements: [{ devices: ["R2"], commands: ["show ip route", "show running-config"] }],
    },
    {
      label: "R1 forwards back toward R2; R3 supplies the intended adjacent address",
      points: 15,
      requirements: [
        { devices: ["R1"], commands: ["show ip route", "show running-config"] },
        { devices: ["R3"], commands: ["show ip interface brief", "show running-config"] },
      ],
    },
  ],
  hints: [
    "Verify both hosts and local gateway reachability. Operational interfaces do not prove that remote forwarding decisions are useful.",
    "Follow the destination prefix in each router's route table. An installed route can still send traffic in the wrong direction.",
    "Map each chosen next-hop address to an actual neighbor interface. Compare consecutive routers' decisions for the same destination.",
    "Look for a destination route that points back toward the router that just forwarded the packet. Compare the opposite neighbor's interface address and replace only the incorrect next hop.",
  ],
  explanation:
    "R2 has an installed static route for 192.168.30.0/24 via 10.0.12.1, R1's directly connected interface. That next hop resolves, but R1's correct route points to R2 at 10.0.12.2. Requests loop between R1 and R2 and never reach PC-B. Unlike LAB 004, this is not an absent return route: the forward request itself fails. R3 and the host gateways are correct. Replace only R2's next hop for that prefix with R3's 10.0.23.2. Existing return routes then allow bidirectional communication.",
  solution:
    "R2# configure terminal\nR2(config)# no ip route 192.168.30.0 255.255.255.0 10.0.12.1\nR2(config)# ip route 192.168.30.0 255.255.255.0 10.0.23.2\nR2(config)# end\n\nVerify show ip route and show running-config on R2, then PC-A ping/tracert 192.168.30.10 and PC-B ping 192.168.10.10. R1's destination route remains via 10.0.12.2; R3's return route remains via 10.0.23.1. The modeled correction replaces one entry's nextHop and leaves every interface, prefix and other route unchanged. No OSPF, default-route workaround or host configuration change is required.",
  lesson: [
    {
      title: "1. Simple explanation",
      text: "A static route is a manually configured direction for a destination network. Its next hop is the neighboring router asked to carry the packet onward. A route can exist and name a reachable neighbor while pointing the wrong way. Reachable next hop and reachable final destination are different facts.",
    },
    {
      title: "2. Analogy — delivery branches",
      text: "A delivery branch has written directions for an eastern address but sends parcels back to the western branch. That branch sends them east again, so parcels circulate. Limits: routers select routes using destination bits and prefix lengths, not postal judgment. Real IP packets have a TTL that limits their lifetime. NetFault detects revisited routers and terminates safely rather than simulating repeated TTL probes or parcel movement.",
    },
    {
      title: "3. Technical mechanism",
      text: "A router selects the most specific matching installed prefix for each packet. A static next hop must resolve through a usable route/interface; in this simulator it is restricted to an existing directly linked router. R2 can therefore install a route via R1 even though R1 is the wrong direction for that destination. Administrative distance does not certify end-to-end reachability. Resolving the next-hop MAC supplies a local delivery method, not proof of the neighbor's onward decision. If R1 and R2 select each other for the same destination, forwarding loops. NetFault stops when it revisits a router, with a bounded hop limit as an additional guard. It does not implement packet TTL countdown, recursive static routing, ECMP or live ICMP timing. Echo replies and trace responses still require routes to their respective source addresses.",
    },
    {
      title: "4. Worked LAB 007 example",
      text: "PC-A 192.168.10.10/24 sends a packet for 192.168.30.10 to gateway 192.168.10.1. R1's S 192.168.30.0/24 via 10.0.12.2 selects R2. R2's S route for the same prefix points to 10.0.12.1, selecting R1 again. Both transit interfaces are up, so that wrong next hop is resolvable. The loop is detected before PC-B receives anything: no echo reply is generated. R3 at 10.0.23.2 is the correct eastward neighbor; it directly connects 192.168.30.0/24 and has the necessary westward return routes. Replacing R2's one next hop sends the request R1–R2–R3–PC-B; replies use independently configured R3–R2–R1 routes. LAB 004 instead delivered the request and lacked the return route; do not apply that explanation here.",
    },
    {
      title: "5. Guided troubleshooting",
      text: "Inspect both PCs with ipconfig, ping each local gateway and compare remote ping. show ip interface brief maps router addresses to links and proves up/up state. On R1 and R2, show ip route exposes the installed destination prefix and next hop; show running-config confirms the configured static entry. Map 10.0.12.1 to R1 and 10.0.23.2 to R3 using interface evidence. Follow each forwarding decision rather than counting how many routes exist. Ping to a neighbor tests local resolution only. Router-originated ping may use an outgoing-interface source or an explicit local source, so compare return routes to that exact address. tracert/traceroute shows only modeled hops able to respond to the probe source and stops at the detected loop; it is not a packet-accurate TTL transcript. Record R2's wrong route, R1's reciprocal direction and R3's correct interface before proposing a targeted replacement.",
    },
    {
      title: "6. Independent practice",
      text: "West–Core–East connect two LANs. West–Core is 172.20.12.0/30 (West .1, Core .2); Core–East is 172.20.23.0/30 (Core .1, East .2). The western LAN is 172.20.10.0/24 and eastern LAN 172.20.30.0/24. All hosts, interfaces and other routes are correct. East routes the western LAN via 172.20.23.1. Core mistakenly routes 172.20.10.0/24 via 172.20.23.2. Diagnose the path for a request originating at the eastern host toward the western host. Identify the observed prefix and next hop, the correct next hop and the minimal configuration. Does that request reach the western host? Decide before revealing part 7.",
    },
    {
      title: "7. Independent exercise solution",
      revealOnRequest: true,
      text: "Core's western-LAN route is wrong: 172.20.10.0/24 via 172.20.23.2 sends traffic back to East, whose route selects Core. The east-originated request loops and does not reach the western host. On Core remove ip route 172.20.10.0 255.255.255.0 172.20.23.2 and install ip route 172.20.10.0 255.255.255.0 172.20.12.1. Keep all other routes. The old next hop was installed because it resolved to an adjacent router, not because it led toward the destination. Verify route/config views, both host directions and the disappearance of the loop. A missing-route repair explanation would describe the wrong observed condition.",
    },
  ],
});
