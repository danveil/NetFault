import "server-only";
import { scenarioSchema } from "@/lib/schema";
import { ipv6Lab as lab, commandsFor } from "@/lib/catalog";
let index = 0;
const nic = (name: string, address: string) => ({
  name,
  address,
  prefix: 64,
  up: true,
  mac: `0200.0015.${String(++index).padStart(4, "0")}`,
});
const configs = {
  "PC-A": { interfaces: [nic("Ethernet0", "2001:db8:15:10::10")], gateway: "2001:db8:15:10::1" },
  R1: { forwarding: false, interfaces: [nic("Gi0/0", "2001:db8:15:10::1"), nic("Gi0/1", "2001:db8:15:20::1")] },
  "PC-B": { interfaces: [nic("Ethernet0", "2001:db8:15:20::20")], gateway: "2001:db8:15:20::1" },
};
export const ipv6Scenario = scenarioSchema.parse({
  schemaVersion: 14,
  id: lab.id,
  revision: 1,
  title: lab.title,
  incident: lab.incident,
  design: lab.design,
  devices: lab.devices.map((d) => ({ ...d, interfaces: [], ipv6: configs[d.id], commands: commandsFor(lab.id, d.id) })),
  links: [
    {
      id: "west",
      a: { device: "PC-A", interface: "Ethernet0" },
      b: { device: "R1", interface: "Gi0/0" },
      subnet: lab.subnets[0],
    },
    {
      id: "east",
      a: { device: "R1", interface: "Gi0/1" },
      b: { device: "PC-B", interface: "Ethernet0" },
      subnet: lab.subnets[1],
    },
  ],
  fault: { cause: "ipv6-forwarding-disabled", devices: ["R1"], interface: "global" },
  acceptedFixes: ["ipv6-forwarding"],
  repair: { kind: "ipv6-forwarding", device: "R1", enabled: true, reason: "ipv6-transit" },
  evidenceRules: [
    {
      label: "Router configuration and local state",
      points: 10,
      requirements: [
        { devices: ["R1"], commands: ["show running-config"] },
        { devices: ["R1"], commands: ["show ipv6 interface brief"] },
      ],
    },
    {
      label: "Both hosts' explicit configuration and routes",
      points: 10,
      requirements: [
        { devices: ["PC-A"], commands: ["ipconfig", "ipconfig /all"] },
        { devices: ["PC-B"], commands: ["ipconfig", "ipconfig /all"] },
        { devices: ["PC-A"], commands: ["route print"] },
        { devices: ["PC-B"], commands: ["route print"] },
      ],
    },
    {
      label: "Local controls and initial cross-network failure",
      points: 10,
      requirements: [
        { devices: ["PC-A"], commands: ["ping"] },
        { devices: ["PC-B"], commands: ["ping"] },
      ],
    },
  ],
  hints: [
    "Compare each PC's manual address, configured on-link prefix and default next hop. Preserve the initial observations before a trial.",
    "Check both local next hops and the remote PC. Does reaching a router's own interface establish that it forwards transit packets?",
    "Compare the router's interface summary with its effective global configuration. Addresses, carrier and IPv6 transit permission are different facts.",
    "R1 can receive local traffic while IPv6 unicast forwarding is disabled. Change only that global setting, then collect new configuration, host routes, local controls and reciprocal remote echoes.",
  ],
  explanation:
    "Both manually configured /64 LANs and host default next hops are correct. R1 owns both connected interfaces but its IPv6 unicast forwarding is disabled. A ping addressed to R1 is local input, so it can answer; an echo between PCs needs transit forwarding and fails. Enabling the one global setting restores request and reply delivery without changing addresses or routes.",
  solution:
    "R1(config)# ipv6 unicast-routing\nRetain both IPv6 interface addresses and both manually configured host next hops. Reinspect R1 configuration/interfaces and both host route views. From each PC ping its local next hop and the opposite PC. Use only observations recorded after this change to verify recovery.",
  lesson: [
    {
      title: "1. Simple explanation",
      text: "An IPv6 address lets a device be reached. Forwarding is a separate job: carrying someone else's packet from one link to another. R1 has working addresses but was not doing that transit job.",
    },
    {
      title: "2. An analogy, with limits",
      text: "A ferry office can answer its own telephone while the ferry is not carrying passengers between shores. Calling the office is like reaching R1's interface; crossing is like PC-to-PC traffic. Limits: routers forward packets using address and route decisions, not schedules or people. This simulator has no queue, delay or ferry-like session state.",
    },
    {
      title: "3. Technical mechanism",
      text: "IPv6 addresses identify 128-bit values. Eight hexadecimal groups can suppress leading zeros, and one :: compresses omitted zero groups; spelling does not change identity. A /64 marks the first 64 bits. These PCs explicitly configure their on-link prefix and global default next hop; no RA or SLAAC inferred that information. IPv6 resolves neighbors on each actual link using a bounded ND abstraction, never ARP. R1 accepts its own addressed packets even with transit forwarding disabled. Enabling ipv6 unicast-routing permits forwarding between its two connected networks. There is no dynamic routing protocol or missing static route here.",
    },
    {
      title: "4. Addresses and worked configuration",
      text: "PC-A is 2001:db8:15:10::10/64 with manual next hop 2001:db8:15:10::1. PC-B is 2001:db8:15:20::20/64 with next hop 2001:db8:15:20::1. Their /64 prefixes differ, so each uses its configured next hop for the opposite PC. R1 Gi0/0 and Gi0/1 own those next-hop addresses. The only correction is R1(config)# ipv6 unicast-routing. It does not assign either address, learn a route or repair a cable.",
    },
    {
      title: "5. Symptoms and complementary commands",
      text: "ipconfig shows each host's manual global address/on-link prefix/next hop; route print exposes its configured on-link and ::/0 default decisions. show ipv6 interface brief separates link availability from forwarding; show running-config reveals effective configuration including the disabled default. Local ping success rules out a broken local path for that probe, but cannot prove transit. Remote failure alone cannot distinguish this setting from addressing or a return problem. Router-originated probes also do not test transit through that router. All output is an educational subset, not complete IOS or Windows output.",
    },
    {
      title: "6. Guided recovery",
      text: "Preserve original host configuration/routes, router configuration/interface state, both local controls and a failed remote echo. Apply the forwarding-only correction. Gather current router views and both host route views, then ping each local next hop and both remote PC directions. An echo needs both delivery and a return; reciprocal initiation and unchanged configuration provide complementary proof. The repaired preview derives both paths from this same state. Old evidence remains historical, not proof of a later version.",
    },
    {
      title: "7. Independent exercise",
      text: "Elsewhere, host X is 2001:db8:88:4::8/64 and host Y is 2001:db8:88:5::9/64. Both can reach their router interface. The router can ping each host, but X cannot ping Y. Is forwarding definitely disabled? Choose the additional observations needed before deciding. Then explain what would remain unproved by one successful router-originated ping.",
    },
    {
      title: "Independent exercise — requested reasoning",
      revealOnRequest: true,
      text: "Those results do not uniquely identify disabled forwarding. Inspect manual on-link/default routes, both global configurations and interface states; check transit permission and independent return behavior. A router-originated ping exercises the router as an endpoint, not as an intermediate forwarder. A controlled minimal change plus fresh unchanged-route and reciprocal transit evidence supports recovery. This is reasoning practice, not arbitrary-text grading or proof of independent device competence.",
    },
  ],
});
