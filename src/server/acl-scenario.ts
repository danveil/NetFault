import "server-only";
import { scenarioSchema } from "@/lib/schema";
import { aclLab as lab, commandsFor } from "@/lib/catalog";
import { intf } from "./scenario";

export const aclScenario = scenarioSchema.parse({
  schemaVersion: 8,
  id: lab.id,
  revision: 1,
  title: lab.title,
  incident: lab.incident,
  design: lab.design,
  devices: [
    {
      ...lab.devices[0],
      commands: commandsFor(lab.id, "PC-A"),
      gateway: "172.24.10.1",
      interfaces: [intf("Ethernet0", "172.24.10.10", 24, 1)],
    },
    {
      ...lab.devices[1],
      commands: commandsFor(lab.id, "R1"),
      routerId: "1.1.1.1",
      interfaces: [intf("Gi0/0", "172.24.10.1", 24, 2), intf("Gi0/1", "10.49.0.1", 30, 3)],
      staticRoutes: [{ network: "172.24.20.0", prefix: 24, nextHop: "10.49.0.2" }],
    },
    {
      ...lab.devices[2],
      commands: commandsFor(lab.id, "R2"),
      routerId: "2.2.2.2",
      interfaces: [
        intf("Gi0/0", "10.49.0.2", 30, 4),
        { ...intf("Gi0/1", "172.24.20.1", 24, 5), accessGroup: { name: "WORKAREA", direction: "out" } },
      ],
      staticRoutes: [{ network: "172.24.10.0", prefix: 24, nextHop: "10.49.0.1" }],
      acls: [
        {
          name: "WORKAREA",
          entries: [
            { id: "entry-a", sequence: 10, action: "deny", source: "any" },
            { id: "entry-b", sequence: 20, action: "permit", source: { network: "172.24.10.0", prefix: 24 } },
          ],
        },
      ],
    },
    {
      ...lab.devices[3],
      commands: commandsFor(lab.id, "PC-B"),
      gateway: "172.24.20.1",
      interfaces: [intf("Ethernet0", "172.24.20.10", 24, 6)],
    },
  ],
  links: [
    {
      id: "a1",
      a: { device: "PC-A", interface: "Ethernet0" },
      b: { device: "R1", interface: "Gi0/0" },
      subnet: lab.subnets[0],
    },
    {
      id: "a2",
      a: { device: "R1", interface: "Gi0/1" },
      b: { device: "R2", interface: "Gi0/0" },
      subnet: lab.subnets[1],
    },
    {
      id: "a3",
      a: { device: "R2", interface: "Gi0/1" },
      b: { device: "PC-B", interface: "Ethernet0" },
      subnet: lab.subnets[2],
    },
  ],
  fault: { cause: "acl-order", devices: ["R2"], interface: "R2:Gi0/1" },
  acceptedFixes: ["acl-sequence"],
  policyChecks: [
    { device: "PC-A", target: "172.24.20.10", permitted: true, fresh: true },
    { device: "PC-B", target: "172.24.10.10", permitted: true, fresh: true },
    { device: "R1", target: "172.24.20.10", source: "10.49.0.1", permitted: false, fresh: true },
    { device: "R1", target: "172.24.20.10", source: "172.24.10.1", permitted: true, fresh: false },
  ],
  repair: {
    device: "R2",
    interface: "Gi0/1",
    acl: "WORKAREA",
    entryId: "entry-b",
    sequence: 20,
    newSequence: 5,
    reason: "first-match-policy",
  },
  evidenceRules: [
    {
      label: "Original source configuration and failed remote baseline",
      points: 10,
      requirements: [
        { devices: ["PC-A"], commands: ["ipconfig", "ipconfig /all"] },
        { devices: ["PC-A"], commands: ["ping"] },
      ],
    },
    {
      label: "Original forward and return routes",
      points: 10,
      requirements: [
        { devices: ["R1"], commands: ["show ip route"] },
        { devices: ["R2"], commands: ["show ip route"] },
      ],
    },
    {
      label: "Original ordered policy and actual outbound attachment",
      points: 10,
      requirements: [
        { devices: ["R2"], commands: ["show access-lists"] },
        { devices: ["R2"], commands: ["show running-config"] },
      ],
    },
  ],
  hints: [
    "Compare local and remote probes. Record the exact source and destination; a local success does not prove a remote policy permits the packet.",
    "Follow the destination and return prefixes in both route tables. Then inspect which policy is attached to the outgoing interface.",
    "Read an ACL from the top. For the original source address, which entry matches first? Seeing a permit somewhere in the list is insufficient.",
    "Test a change to the existing entry order without removing restrictions. Recollect current configuration, reciprocal permitted traffic and an explicitly sourced excluded control after your latest change.",
  ],
  explanation:
    "R2 Gi0/1 applies WORKAREA outbound. Its initial sequence 10 denies any source before sequence 20 can permit the office 172.24.10.0/24. The first match ends evaluation. Routes, host gateways and interfaces are correct. Reordering the same entries restores office traffic while the transit source 10.49.0.1 remains denied. A successful ping alone would not prove that policy was preserved.",
  solution:
    "One minimal worked IOS-style edit (the app applies an atomic sequence change):\nR2(config)# ip access-list standard WORKAREA\nR2(config-std-nacl)# no 20\nR2(config-std-nacl)# 5 permit 172.24.10.0 0.0.0.255\nR2(config-std-nacl)# end\n\nAlternatively move the deny after the existing permit. Do not remove the policy or replace it with permit any.\n\nR2# show access-lists\nR2# show running-config\nPC-A> ping 172.24.20.10\nPC-B> ping 172.24.10.10\nR1# ping 172.24.20.10 source 10.49.0.1\n\nThe two host pings must succeed; the explicit transit-source control must still fail. Select all five fresh outputs after the latest change. Real CLI edits are not atomic; this simulator does not model intermediate command windows or saving startup configuration.",
  lesson: [
    {
      title: "1. Simple explanation",
      text: "A route tells a router where a packet could go. An access list decides whether a forwarded packet may leave an interface. A correct route and a later permit do not override an earlier matching deny.",
    },
    {
      title: "2. Analogy and limits",
      text: "A reception desk reads an admission list from top to bottom and follows the first applicable instruction. An earlier 'refuse everyone' prevents a later office exception from being considered. Limits: a standard IPv4 ACL examines source address bits, not a person's identity or intentions. Source addresses are not authentication, and this policy is stateless.",
    },
    {
      title: "3. Technical mechanism",
      text: "Standard IPv4 ACLs match the original source. A wildcard zero means compare a bit; one means ignore it. 172.24.10.0 with 0.0.0.255 matches this office /24. Evaluate entries in configured sequence order; stop at the first match. If none matches a supported nonempty list, implicit deny applies. Outbound policy is applied after route selection, before forwarding out its attached interface. A permit cannot create a route. Echo replies have independent source/destination addresses and undergo their own forwarding checks. Ordinary outbound transit filtering does not filter traffic originating at that same router, and local router delivery does not exit the protected interface. This bounded lab has no inbound ACLs, host-entry hashing, transport fields, counters or traceroute.",
    },
    {
      title: "4. Worked packet and configuration",
      text: "PC-A sends 172.24.10.10 → 172.24.20.10 via R1 and R2. R2's connected route selects Gi0/1; WORKAREA initially matches deny-any at 10. The permit at 20 is never considered. Moving that permit to 5 leaves the deny at 10 for other sources. PC-B's request to PC-A initially arrives, but the office-sourced echo reply is denied on its way back through R2. After the order repair both host directions work. An R1 ping normally uses outgoing 10.49.0.1: it remains denied. Explicit source 172.24.10.1 succeeds after repair. The addresses and routes do not change.",
    },
    {
      title: "5. Guided investigation and verification",
      text: "Record host configuration and the remote failure before editing. Check both routing tables and physical addresses. Read show access-lists together with the outbound ip access-group line in show running-config. Predict the first match for the host source and the transit source. Apply a sequence trial, then return to Inspect. Select current ACL and configuration plus both host pings and an explicit transit-source negative control. An old successful output belongs to its old version. The evidence must show permission and retained restriction, not just connectivity.",
    },
    {
      title: "6. Independent practice",
      text: "An outbound standard ACL has sequence 15 deny any followed by 40 permit 172.18.8.0 0.0.0.255. Intended policy permits that office /24 only; all routes are correct. Predict sources 172.18.8.25 and 10.8.0.1 before and after a minimal sequence edit. Give two different valid resulting orders, explain why changing a route is irrelevant, and design positive and negative verification before revealing the answer.",
    },
    {
      title: "7. Independent solution",
      revealOnRequest: true,
      text: "Initially both sources match deny 15. Give the office permit an unused sequence number less than 15, or give the deny a sequence number greater than 40. Office traffic then matches permit first; 10.8.0.1 reaches the deny. Keep both predicates and the outbound attachment. Verify the current order/attachment, an office-sourced successful round trip and a correctly routed nonoffice source that remains denied. Do not call an untested order or a permissive bypass a verified repair.",
    },
  ],
});
