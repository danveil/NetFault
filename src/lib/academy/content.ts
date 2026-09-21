import { lessons as guides } from "../lessons";
import { academySchema, type Exercise, type Lesson } from "./schema";

// Adapter only: preserve every original Field Guide body, including its paper exercises.
const guideIds = ["addressing-gateway", "physical-protocol", "ospf-areas", "routes-return-path"] as const;
export const references = guides.map((guide, index) => ({ id: guideIds[index], revision: 1, ...guide }));
const sources = [
  { title: "RFC 791 — IPv4 addressing and packet format", url: "https://www.rfc-editor.org/rfc/rfc791" },
  {
    title: "RFC 1122 §3.3.1 — Local/remote and gateway decisions",
    url: "https://www.rfc-editor.org/rfc/rfc1122#section-3.3.1",
  },
  { title: "RFC 950 — Subnet masks and subnet addressing", url: "https://www.rfc-editor.org/rfc/rfc950" },
  { title: "RFC 826 — Address Resolution Protocol", url: "https://www.rfc-editor.org/rfc/rfc826" },
  { title: "RFC 3021 — Why /31 is a special case", url: "https://www.rfc-editor.org/rfc/rfc3021" },
];
const common = {
  schemaVersion: 1 as const,
  revision: 1,
  moduleId: "ipv4",
  scope: "concepts-and-structured-practice" as const,
  sources,
};
const exercise = (value: Omit<Exercise, "revision" | "inputKind" | "solutionPolicy">): Exercise => ({
  revision: 1,
  inputKind: "structured",
  solutionPolicy: "after-submit-or-request",
  ...value,
});
const choice = (id: string, label: string, choices: string[], answer: string, explanation: string) => ({
  id,
  label,
  choices,
  answer,
  explanation,
  kind: "choice" as const,
});
const ip = (id: string, label: string, answer: string, explanation: string) => ({
  id,
  label,
  answer,
  explanation,
  kind: "ipv4" as const,
});
function subnetExercise(
  id: string,
  stage: "guided" | "independent",
  prompt: string,
  answers: [string, string, string, string],
  steps: string[],
  commonMistake: string,
): Exercise {
  return exercise({
    id,
    stage,
    prompt,
    fields: [
      ip("network", "Network address", answers[0], "Set all host bits to zero to identify the subnet."),
      ip("broadcast", "Broadcast address", answers[1], "Set all host bits to one to address this subnet's broadcast."),
      ip(
        "first",
        "First usable host",
        answers[2],
        "For these ordinary subnets, begin one address after the network address.",
      ),
      ip("last", "Last usable host", answers[3], "Stop one address before the broadcast address."),
    ],
    solution: { steps, commonMistake },
  });
}

const addresses: Lesson = {
  ...common,
  id: "ipv4-addresses",
  title: "Understanding IPv4 Addresses",
  prerequisiteLessonIds: [],
  objectives: [
    "Read the four octets of an IPv4 address.",
    "Validate dotted-decimal notation.",
    "Explain why the mask is needed to find the network boundary.",
  ],
  relatedLabs: [{ scenarioId: "gateway-01", relationship: "prepare" }],
  sections: [
    {
      kind: "simple",
      title: "01 / An address for a delivery",
      body: "When your laptop sends a message, the network needs to know where to deliver it. An IP address identifies a destination interface: a connection belonging to a device. A device can have several connections and therefore several addresses. A packet is a small piece of data with delivery information attached. Its destination IP address helps the network decide where to send it.",
    },
    {
      kind: "analogy",
      title: "02 / Like a postal address — with limits",
      body: "Imagine sending a parcel to a student at a residential college. The address tells the delivery system where the parcel should go. An IP destination serves a similar purpose for a packet. The postal district loosely resembles a network prefix, while the room resembles the host part. Limits: an IP address is not a permanent physical home or a person's identity. Addresses can change when you join a different network. You cannot infer a device's location or its subnet boundary just by looking at its four numbers.",
    },
    {
      kind: "technical",
      title: "03 / Four numbers, thirty-two bits",
      body: "Internet Protocol version 4, or IPv4, uses 32 binary digits (bits) for an address. A bit is either 0 or 1. Eight bits form an octet; four octets therefore hold 32 bits. Dotted-decimal notation writes each octet as a decimal number, separated by dots. Eight bits represent values from 0 through 255. A valid address has exactly four such numbers. An address alone does not specify the split between the network portion and host portion: a subnet mask or prefix supplies that boundary. Routers use destination prefixes to forward packets. A syntactically valid address is not automatically suitable for a host: the mask and special-purpose address rules matter too. We use private unicast addresses in these exercises, not Internet allocation or multicast planning.",
    },
    {
      kind: "worked",
      title: "04 / Read 192.168.10.25",
      body: "Separate the dots: the octets are 192, 168, 10 and 25. Each fits in eight bits. Binary positions have weights 128, 64, 32, 16, 8, 4, 2, 1. To represent 25, choose 16 + 8 + 1: 00011001. Leading zeros here are binary padding to eight positions. Four eight-bit groups give the full 32-bit address below. Adding /24 would say that the first 24 bits form the network prefix; the plain address does not tell us that. In troubleshooting, a typo such as 192.168.10.256 cannot be a valid IPv4 address at all.",
      code: "192       168       10        25\n11000000  10101000  00001010  00011001\n8 bits  + 8 bits  + 8 bits  + 8 bits = 32 bits",
    },
    {
      kind: "guided",
      title: "05 / Check the shape",
      body: "Count the octets, then check every value against 0–255. Classify each example below. This checks notation only, not whether an address is usable on a particular network.",
    },
    {
      kind: "independent",
      title: "06 / Read a fresh address",
      body: "Use 172.16.5.90. Identify each octet and decide whether you can determine the network boundary without a mask. Submit your own answers before opening the solution if you want a record of unaided practice.",
    },
  ],
  exercises: [
    exercise({
      id: "valid-format",
      stage: "guided",
      prompt: "Which examples have valid IPv4 dotted-decimal format?",
      fields: [
        choice("valid", "10.4.8.12", ["Valid", "Invalid"], "Valid", "There are four octets and each is within 0–255."),
        choice(
          "range",
          "192.168.1.256",
          ["Valid", "Invalid"],
          "Invalid",
          "256 needs more than eight bits; the maximum octet is 255.",
        ),
        choice(
          "count",
          "172.16.20",
          ["Valid", "Invalid"],
          "Invalid",
          "Only three octets are present; dotted-decimal notation needs four.",
        ),
      ],
      solution: {
        steps: [
          "10.4.8.12 contains exactly four valid decimal values.",
          "192.168.1.256 fails the range rule. 172.16.20 fails the octet-count rule.",
        ],
        commonMistake:
          "Do not judge validity by familiarity: 10.x addresses are valid too. Format alone does not establish reachability.",
      },
    }),
    exercise({
      id: "read-octets",
      stage: "independent",
      prompt: "Read 172.16.5.90 and identify the information it contains.",
      fields: [
        ...[172, 16, 5, 90].map((answer, index) => ({
          kind: "number" as const,
          id: `octet-${index + 1}`,
          label: `Octet ${index + 1}`,
          answer,
          explanation: "Read the decimal groups from left to right, splitting at each dot.",
        })),
        choice(
          "boundary",
          "Can the address alone tell you its network boundary?",
          ["Yes", "No; a mask or prefix is needed"],
          "No; a mask or prefix is needed",
          "The same address can be used with different prefix lengths; do not assume /16 from its first octet.",
        ),
      ],
      solution: {
        steps: [
          "Split 172.16.5.90 into 172, 16, 5 and 90, each between 0 and 255.",
          "Four groups times eight bits gives 32 bits. A mask is still needed to locate the network/host boundary.",
        ],
        commonMistake:
          "Historical address classes do not establish the configured subnet of this host. Neither dots nor familiar private ranges choose its prefix.",
      },
    }),
  ],
};

const subnets: Lesson = {
  ...common,
  id: "ipv4-subnets",
  title: "Subnets, Subnet Masks, and Local Networks",
  prerequisiteLessonIds: ["ipv4-addresses"],
  objectives: [
    "Use a mask to find network and host bits.",
    "Calculate network, broadcast and usable ranges for /24 and /26.",
    "Classify local and remote destinations without assuming connectivity.",
  ],
  relatedLabs: [
    { scenarioId: "gateway-01", relationship: "prepare" },
    { scenarioId: "vlan-01", relationship: "reflect" },
  ],
  sections: [
    {
      kind: "simple",
      title: "01 / Decide what is nearby",
      body: "A subnet is a group of IP addresses treated as belonging to the same local IP network. Dividing a network into subnets helps organize addressing and routing. A subnet mask tells a device which part of an address names that group. Comparing group names helps a host decide whether to deliver locally or send toward a router.",
    },
    {
      kind: "analogy",
      title: "02 / Residential colleges — with limits",
      body: "Think of a university split into residential colleges. Students in the same college use an internal delivery route, while delivery to another college goes through an outside route. The college corresponds loosely to the network prefix and a room to the host portion. Limits: matching IP subnets does not guarantee working Layer 2 connectivity. Layer 2 is the local frame-delivery network, such as Ethernet switches and VLANs. A disconnected cable or different VLAN can isolate hosts whose addresses appear local. An address plan is not a physical map.",
    },
    {
      kind: "technical",
      title: "03 / Keep the network bits",
      body: "A subnet mask has consecutive 1 bits for the network prefix followed by 0 bits for hosts. CIDR notation /n gives the number of prefix bits. /24 means 24 ones and eight zeros: 255.255.255.0. To find the network address, apply bitwise AND to the address and mask: a result bit is 1 only when both input bits are 1. Mask ones keep address bits; mask zeros clear them. Set all host bits to 1 for the subnet-directed broadcast address. For the ordinary /1 through /30 subnets discussed here, reserve the network and broadcast addresses, leaving 2^(host bits) − 2 usable unicast host addresses. /31 point-to-point links have special rules and /32 denotes one address; neither uses this host-range exercise rule. To test whether a destination is on-link, compare its masked network to the host's masked network. This introductory example assumes one connected subnet and no more-specific overriding route.",
    },
    {
      kind: "worked",
      title: "04 / A /24, then a /26",
      body: "192.168.10.25/24 leaves eight host bits. Clear the last octet for network 192.168.10.0; set it to 255 for broadcast 192.168.10.255. Usable hosts are .1 through .254: 2^8 − 2 = 254. Now use 192.168.10.70/26. The mask is 255.255.255.192; its final octet is 11000000. There are six host bits, so blocks contain 64 addresses. AND 70 (01000110) with 192 (11000000): 01000000 = 64. The block runs .64–.127, usable .65–.126, with 62 hosts. Destination .90 shares this block; .130 is in the next block and is remote. A /26 does not mean that the last octet must be zero for a network address.",
      code: "Address 70: 01000110\nMask   192: 11000000\nAND result: 01000000 = 64 (network)\nHost ones : 01111111 = 127 (broadcast)\nHost bits :       6 → 64 addresses → 62 usable",
    },
    {
      kind: "guided",
      title: "05 / Calculate a /26",
      body: "Try 192.168.50.140/26. The mask ends in 192. Blocks start at .0, .64, .128 and .192. Find the block containing 140; its last address is one below the next block. Enter the network, broadcast and usable endpoints below.",
    },
    {
      kind: "independent",
      title: "06 / Apply the method to /27",
      body: "Calculate the subnet containing 172.16.4.77/27. Its mask is 255.255.255.224. Work from the number of host bits rather than copying the /26 answers. This is an interactive paper calculation; it does not configure a simulator interface.",
    },
  ],
  exercises: [
    subnetExercise(
      "guided-subnet",
      "guided",
      "Find the subnet boundaries for 192.168.50.140/26.",
      ["192.168.50.128", "192.168.50.191", "192.168.50.129", "192.168.50.190"],
      [
        "140 is 10001100; AND with 11000000 gives 10000000 = 128.",
        "Six host bits give 64 addresses. Set them to one: 10111111 = 191. The block is .128–.191.",
        "Reserve .128 and .191. The usable range is .129–.190, containing 62 hosts.",
      ],
      "Do not use .0 and .255: those describe /24 boundaries, not this /26 block.",
    ),
    subnetExercise(
      "independent-subnet",
      "independent",
      "Find the subnet boundaries for 172.16.4.77/27.",
      ["172.16.4.64", "172.16.4.95", "172.16.4.65", "172.16.4.94"],
      [
        "77 is 01001101. The mask's last octet is 11100000; AND gives 01000000 = 64.",
        "Five host bits give 32 addresses. Setting those bits to one gives 01011111 = 95.",
        "The subnet is .64–.95, with usable .65–.94 and 30 hosts. 77 lies within that range.",
      ],
      "The given host is not the network address. A prefix counts network bits, not the number of hosts.",
    ),
  ],
};

const gateway: Lesson = {
  ...common,
  id: "ipv4-gateway-arp",
  title: "Default Gateways and ARP",
  prerequisiteLessonIds: ["ipv4-subnets"],
  objectives: [
    "Choose a local destination or gateway as next hop.",
    "Distinguish destination IP from next-hop MAC.",
    "Choose observations that test a gateway hypothesis.",
  ],
  relatedLabs: [{ scenarioId: "gateway-01", relationship: "apply" }],
  sections: [
    {
      kind: "simple",
      title: "01 / Leave the local network",
      body: "Your computer can send directly to appropriate destinations on its local network. To reach a different network, it generally gives the packet to a suitable router. The default gateway is the router used when there is no more-specific route. The computer still needs a way to deliver that first local step. On an Ethernet network, ARP helps find the local delivery address.",
    },
    {
      kind: "analogy",
      title: "02 / The college delivery desk — with limits",
      body: "For a room in your college, a delivery goes straight to that room. For another college, give it to the delivery desk that knows the outside route. The final postal address corresponds to the destination IP, while the person receiving the next handoff resembles the next-hop MAC. Limits: a gateway is not a guarantee that every destination can be reached. Each router makes its own routing decision, replies need a return path, and a physical road does not model ARP broadcasts, caches, or Ethernet frames.",
    },
    {
      kind: "technical",
      title: "03 / IP destination, Ethernet next hop",
      body: "The host consults its routing table. In this simple configuration, comparing destination and host addresses under the subnet mask identifies the connected subnet. For a local unicast destination, the next-hop IP is the destination itself. For a remote destination with no more-specific route, the default route (0.0.0.0/0) points to the gateway's local IP. Ethernet sends frames using MAC addresses, separate from IP addresses. Address Resolution Protocol (ARP) resolves the chosen on-link next-hop IP to a MAC address, using a broadcast request and a reply from the owner in the ordinary case. A cached mapping may avoid a new request. For remote traffic, the frame goes to the gateway's MAC, while the packet's destination IP remains the remote host. The router removes the incoming frame, looks up the destination IP and sends a new frame on its outgoing link. Ordinary forwarding does not change the destination IP; NAT is a separate mechanism outside this lesson. Links, VLANs, routing, firewall policy and return paths can still prevent communication despite plausible IP settings.",
    },
    {
      kind: "worked",
      title: "04 / Follow one remote packet",
      body: "Conceptual example: PC-A is 192.168.10.10/24, gateway 192.168.10.1, and PC-B is 192.168.20.10. AND with /24 gives .10.0 versus .20.0, so PC-B is remote. With no more-specific route, PC-A chooses gateway .10.1. It consults ARP, or asks who owns .10.1. The gateway supplies its local MAC. PC-A then sends an Ethernet frame addressed to that MAC carrying an IP packet addressed to .20.10. Routers forward toward PC-B using their tables; an echo reply must route back to .10.10. The illustrative arp -a output below shows a mapping for the gateway, not a remote PC-B mapping. ipconfig reveals configured values, not proof they are correct. A gateway ping tests part of the local path; a remote ping also depends on onward and return routing. This arp -a output is a conceptual Windows example, not output captured from LAB 002. NetFault currently supports arp -a only on PC-A in LAB 003; LAB 002 does not offer it. A failed ping alone cannot prove a gateway fault.",
      code: "Conceptual Windows example (not captured simulator output)\nC:\\> ipconfig\nIPv4 Address: 192.168.10.10\nSubnet Mask: 255.255.255.0\nDefault Gateway: 192.168.10.1\nC:\\> ping 192.168.10.1\nC:\\> ping 192.168.20.10\nC:\\> arp -a\nInternet Address    Physical Address     Type\n192.168.10.1        02-aa-bb-cc-dd-01    dynamic",
    },
    {
      kind: "guided",
      title: "05 / Choose the next delivery",
      body: "For PC-A 192.168.10.10/24, classify the destinations below. Assume the connected /24 and a default route are its only relevant routes. Being on-link describes the routing decision, not proof the destination is present or responds.",
    },
    {
      kind: "independent",
      title: "06 / Investigate a different network",
      body: "A host is 172.16.8.25/24 with gateway 172.16.8.1. It needs to reach 172.16.9.70. Assume ordinary Ethernet with no proxy ARP and only a connected route and default route. Identify the subnet and next hop, then choose a useful diagnostic comparison. After this exercise, LAB 002 lets you gather real simulated observations yourself; its link supplies no diagnosis.",
    },
  ],
  exercises: [
    exercise({
      id: "local-remote",
      stage: "guided",
      prompt: "Classify destinations from 192.168.10.10/24.",
      fields: [
        choice(
          "peer",
          "192.168.10.55",
          ["Local", "Remote"],
          "Local",
          "Both addresses mask to 192.168.10.0; resolve the peer's MAC for direct delivery.",
        ),
        choice(
          "other",
          "192.168.20.10",
          ["Local", "Remote"],
          "Remote",
          "192.168.20.0 differs from 192.168.10.0; use the default gateway in this routing configuration.",
        ),
        choice(
          "gateway",
          "192.168.10.1",
          ["Local", "Remote"],
          "Local",
          "The gateway interface itself is on the host's local subnet.",
        ),
      ],
      solution: {
        steps: [
          "Keep the first 24 bits. .10.55 and .10.1 share .10.0 with PC-A; .20.10 does not.",
          "ARP targets a local peer for direct delivery, or the gateway for remote delivery. The final IP destination is unchanged.",
        ],
        commonMistake:
          "A gateway's role does not make its own LAN address remote. Local classification also does not prove a working VLAN or cable.",
      },
    }),
    exercise({
      id: "next-hop",
      stage: "independent",
      prompt: "Explain the first hop toward 172.16.9.70 from 172.16.8.25/24.",
      fields: [
        ip("network", "Host's network address", "172.16.8.0", "With /24, clear the last eight bits."),
        choice(
          "location",
          "Destination location",
          ["Local", "Remote"],
          "Remote",
          "The destination belongs to 172.16.9.0/24, a different subnet.",
        ),
        ip(
          "hop",
          "Next-hop IP resolved with ARP",
          "172.16.8.1",
          "The default route chooses the on-link gateway; ARP does not seek a remote host across routers.",
        ),
        choice(
          "evidence",
          "Useful diagnostic observation",
          [
            "Compare ipconfig, router LAN addressing, and local versus remote pings",
            "A remote ping timeout alone proves a bad gateway",
            "Change the destination IP to the gateway in every packet",
          ],
          "Compare ipconfig, router LAN addressing, and local versus remote pings",
          "Correlate configuration with the intended router and path tests. A timeout has several possible causes.",
        ),
      ],
      solution: {
        steps: [
          "Mask 172.16.8.25 and 172.16.9.70 with 255.255.255.0: the results .8.0 and .9.0 differ.",
          "The default route chooses 172.16.8.1. ARP resolves this local router's MAC; the packet still targets 172.16.9.70.",
          "Compare the configured gateway with the router's actual local address and probe both local and remote destinations. Check onward and return routes before concluding the gateway caused a failure.",
        ],
        commonMistake:
          "Do not ARP directly for the remote IP, equate a timeout with one specific fault, or confuse an IP packet's destination with the frame's immediate receiver.",
      },
    }),
  ],
};

export const academy = academySchema.parse({
  modules: [
    {
      schemaVersion: 1,
      id: "ipv4",
      revision: 1,
      title: "MODULE 02 — IPv4 Addressing and Subnetting",
      overview:
        "From reading an address to choosing the next hop. Three lessons with worked examples and structured practice; prerequisites are recommendations, never locks.",
      orderedLessonIds: [addresses.id, subnets.id, gateway.id],
    },
  ],
  lessons: [addresses, subnets, gateway],
});
