import type { Exercise, Lesson } from "./schema";

const choice = (
  id: string,
  label: string,
  choices: string[],
  answer: string,
  explanation: string,
): Exercise["fields"][number] => ({ id, label, kind: "choice", choices, answer, explanation });
const row = (device: string, port: string, address: string, prefix: number, role: string) => ({
  device,
  port,
  address,
  prefix,
  role,
});

export const ospfModule = {
  schemaVersion: 1,
  id: "ospfv2",
  revision: 1,
  title: "OSPFv2 — Configuration and verification",
  overview:
    "One bridge from IPv4 addressing to an area-0 plan and the evidence needed to verify it. Public learning practice, not a configuration terminal or a complete OSPF course.",
  orderedLessonIds: ["ospfv2-configuration"],
};

export const ospfLesson: Lesson = {
  schemaVersion: 1,
  id: "ospfv2-configuration",
  revision: 1,
  moduleId: "ospfv2",
  title: "From interfaces to verified OSPFv2 routes",
  scope: "concepts-and-structured-practice",
  prerequisiteLessonIds: ["ipv4-addresses", "ipv4-subnets", "ipv4-gateway-arp"],
  objectives: [
    "Read a new interface table and select local OSPF interfaces using supplied wildcards.",
    "Separate process identity, router identity, passive LANs and active point-to-point transit links.",
    "Build a verification chain from interface state to reciprocal host reachability.",
  ],
  sections: [
    {
      kind: "simple",
      title: "Addresses are a starting point",
      body: "An address tells an interface where it belongs. It does not tell OSPF to use that interface, form a neighbor relationship or learn the other LAN’s route. Those are separate steps.\n\nIn this lesson, two routers share routes through one explicitly configured point-to-point OSPF transit. Each router also serves a LAN. Your job is to choose the interfaces that participate, then collect enough evidence to verify the result. These are original teaching examples, not hidden solutions to NetFault labs.",
    },
    {
      kind: "analogy",
      title: "Choose which desks share directions",
      body: "Imagine two local information offices. Each office chooses a desk to exchange directions with the other office. It can also report the neighborhood served by its public desk, even though that desk does not talk to another office. This resembles an active transit and a passive LAN.\n\nThe analogy stops at participation and shared information. Routers exchange protocol packets and calculate routes; they do not telephone or trust a spoken map. This story does not model packets, timers, the neighbor state machine or proof that a traveler can complete a return journey.",
    },
    {
      kind: "technical",
      title: "Match local interfaces, then ask separate questions",
      body: "Prerequisite check: /24 means mask 255.255.255.0; /30 means 255.255.255.252 and four addresses, two ordinarily usable. For example, 10.44.0.1 and 10.44.0.2 share 10.44.0.0/30. Use the IPv4 preparation links above if reading that boundary is uncertain.\n\nThe number in router ospf 10 identifies a process on this router only. A neighbor may use process 20. The router ID is a separate 32-bit identifier, written like an IPv4 address, that must be unique in the OSPF domain. We set it explicitly before enabling interfaces; it need not be a pingable interface address.\n\nInside router ospf, network ADDRESS WILDCARD area 0 selects this router’s interfaces whose local IPv4 addresses match. It is not a static route pointing at a remote network. A wildcard bit of 0 must match; a bit of 1 is ignored. For these supplied contiguous examples, /24 uses 0.0.0.255 and /30 uses 0.0.0.3. An exact-interface selector uses the interface’s own IP and 0.0.0.0. It still advertises the interface’s actual subnet, not a new /32 route.\n\nFor 10.44.0.0 with wildcard 0.0.0.3, the last two bits are ignored: addresses .0 through .3 match. Only configured local interface addresses participate; matching .0 or .3 does not make those subnet endpoints usable hosts. A supplied subnet mask is not interchangeable with a wildcard. Arbitrary noncontiguous wildcard patterns are outside this lesson.\n\nInterface mode ip ospf 10 area 0 is an alternative to a matching network statement for that interface. Choose one consistent activation method here. This lesson does not model precedence between conflicting activation commands.\n\nA passive LAN remains activated: its up subnet is advertised through the working transit adjacency, but it sends no OSPF Hellos and forms no LAN neighbors. A passive transit prevents the required adjacency. An interface not activated at all has no OSPF participation; without another route source, its LAN prefix will not be advertised by OSPF.\n\nUse show running-config and show ip protocols to inspect the activation and passive policy, then show ip ospf interface to check actual area, type and Hello behavior. A missing neighbor alone cannot distinguish a passive transit, missing activation or another mismatch. An intentionally passive LAN with no neighbors is normal.\n\nEthernet does not become OSPF point-to-point because it has a /30 address. Both transit interfaces in every example must explicitly use ip ospf network point-to-point. Assume interfaces up/up, compatible timers, MTU and no authentication, working host gateways, and no filtering, NAT, static or default routes. Broadcast elections and transient convergence are outside this lesson.",
      diagram: {
        kind: "ospf-match",
        selector: "10.44.0.0",
        wildcard: "0.0.0.3",
        interfaces: {
          title: "Cedar’s local interfaces",
          rows: [
            row("Cedar", "Gi0/0", "172.20.10.1", 24, "West LAN"),
            row("Cedar", "Gi0/1", "10.44.0.1", 30, "Transit to Birch"),
            row("Cedar", "Gi0/2", "172.20.99.1", 24, "Maintenance LAN, outside the OSPF plan"),
          ],
        },
        caption:
          "Text comparison: the first three octets and first six bits of the last octet must match. Only Cedar Gi0/1 matches this selector. Birch is not a local interface of Cedar.",
      },
    },
    {
      kind: "worked",
      title: "Build and verify a two-router plan",
      body: "Topology: West host → Cedar → Birch → East host. Cedar’s separate maintenance LAN is deliberately excluded. All listed links are already addressed and up. Activate each user LAN and the transit in area 0; make each user LAN passive.\n\nOn Cedar, the /24 selector matches Gi0/0; the /30 selector matches Gi0/1. On Birch, the exact-address selectors match Gi0/0 and Gi0/1. The matching method differs, but both activate the actual interface subnet in area 0. Process IDs 10 and 20 may differ; router IDs 10.255.0.11 and 10.255.0.22 must differ.\n\nThe configuration below is an authored plan to read, not output from an executed IOS session. router ospf enters the local process; router-id assigns its identity; network selects interfaces; passive-interface suppresses LAN Hellos; interface selects a port; ip ospf network point-to-point sets the transit type. exit leaves the current configuration context. Addressing/no shutdown are prerequisites in the table, not commands executed by Academy.\n\nExpected after convergence: Cedar and Birch each have one FULL neighbor on the transit, displayed without a DR/BDR role for this network type. Cedar learns 172.20.20.0/24 via 10.44.0.2; Birch learns 172.20.10.0/24 via 10.44.0.1. Their own LAN and transit are connected routes. The maintenance LAN remains connected only on Cedar and is not advertised by this plan.\n\nCheck both routers and both hosts. An up interface proves neither an OSPF match nor an installed remote route. FULL verifies adjacency, not host configuration. One O route does not establish the opposite router’s route or successful forwarding. A ping to a local gateway never tests the remote LAN. Even a successful remote ping verifies only that probe’s request and reply, not all services or sources.",
      interfaceTable: {
        title: "Worked addressing table",
        rows: [
          row("West host", "Ethernet", "172.20.10.10", 24, "Gateway 172.20.10.1"),
          row("Cedar", "Gi0/0", "172.20.10.1", 24, "User LAN · passive"),
          row("Cedar", "Gi0/1", "10.44.0.1", 30, "Transit to Birch Gi0/0 · point-to-point"),
          row("Cedar", "Gi0/2", "172.20.99.1", 24, "Maintenance · exclude from OSPF"),
          row("Birch", "Gi0/0", "10.44.0.2", 30, "Transit to Cedar Gi0/1 · point-to-point"),
          row("Birch", "Gi0/1", "172.20.20.1", 24, "User LAN · passive"),
          row("East host", "Ethernet", "172.20.20.10", 24, "Gateway 172.20.20.1"),
        ],
      },
      code: "Cedar — from global configuration mode\nrouter ospf 10\n router-id 10.255.0.11\n network 172.20.10.0 0.0.0.255 area 0\n network 10.44.0.0 0.0.0.3 area 0\n passive-interface GigabitEthernet0/0\n exit\ninterface GigabitEthernet0/1\n ip ospf network point-to-point\n exit\n\nBirch — from global configuration mode\nrouter ospf 20\n router-id 10.255.0.22\n network 10.44.0.2 0.0.0.0 area 0\n network 172.20.20.1 0.0.0.0 area 0\n passive-interface GigabitEthernet0/1\n exit\ninterface GigabitEthernet0/0\n ip ospf network point-to-point\n exit\n\nAlternative activation of Cedar Gi0/1:\ninterface GigabitEthernet0/1\n ip ospf 10 area 0\n(Use instead of its matching network line.)",
      diagram: {
        kind: "ospf-evidence",
        caption:
          "Each step answers a different question. Inspect both sides and compare the observed result with the addressing table. These are expected evidence categories, not fabricated command output.",
      },
    },
    {
      kind: "guided",
      title: "Guided practice: select and explain",
      body: "Topology: Fern host → Fern → Moss → Moss host. Activate only the two user LANs and the transit, all in area 0. Fern’s workshop LAN is excluded. All interfaces are already up/up; both transit interfaces are explicitly OSPF point-to-point. No other route source or filter is present.\n\nStart with Fern’s local addresses. The supplied plan uses network 172.21.40.0 0.0.0.255 area 0 and network 10.45.0.4 0.0.0.3 area 0. Moss will activate its corresponding transit and user LAN. Compare each local address to the selectors, then choose the observations needed to verify the intended network.",
      interfaceTable: {
        title: "Guided addressing table",
        rows: [
          row("Fern host", "Ethernet", "172.21.40.10", 24, "Gateway 172.21.40.1"),
          row("Fern", "Gi0/0", "172.21.40.1", 24, "User LAN"),
          row("Fern", "Gi0/1", "10.45.0.5", 30, "Transit to Moss Gi0/0"),
          row("Fern", "Gi0/2", "172.21.90.1", 24, "Workshop LAN · exclude"),
          row("Moss", "Gi0/0", "10.45.0.6", 30, "Transit to Fern Gi0/1"),
          row("Moss", "Gi0/1", "172.21.50.1", 24, "User LAN"),
          row("Moss host", "Ethernet", "172.21.50.10", 24, "Gateway 172.21.50.1"),
        ],
      },
    },
    {
      kind: "independent",
      title: "Independent practice: plan from a new table",
      body: "Topology: Archive host → Vale → Ridge → Studio host. You are planning Ridge, the router at the right of the transit. Its maintenance interface must stay outside OSPF. The hosts and addresses are already correct, all links are up, and both transit interfaces explicitly use OSPF point-to-point.\n\nRidge uses process 70 and router ID 10.255.1.70. Vale uses process 8 and router ID 10.255.1.8. Vale already activates its transit and passive Archive LAN in area 0. No static/default route or filtering is present. Choose Ridge’s minimal plan using two exact-interface selectors, then choose a passive policy and evidence for communication initiated by either host. No existing lab is needed to solve this.",
      interfaceTable: {
        title: "Independent addressing table",
        rows: [
          row("Archive host", "Ethernet", "192.168.64.20", 24, "Gateway 192.168.64.1"),
          row("Vale", "Gi0/0/0", "192.168.64.1", 24, "Archive LAN · passive"),
          row("Vale", "Gi0/0/2", "10.77.0.9", 30, "Transit to Ridge Gi0/2/0"),
          row("Ridge", "Gi0/2/0", "10.77.0.10", 30, "Transit to Vale Gi0/0/2"),
          row("Ridge", "Gi0/0/0", "192.168.96.1", 24, "Studio LAN"),
          row("Ridge", "Gi0/1/0", "192.168.200.1", 24, "Maintenance · exclude"),
          row("Studio host", "Ethernet", "192.168.96.20", 24, "Gateway 192.168.96.1"),
        ],
      },
    },
  ],
  exercises: [
    {
      id: "ospf-interface-guided",
      revision: 1,
      stage: "guided",
      inputKind: "tap-steps",
      solutionPolicy: "requested-only",
      prompt: "Use Fern’s local table to connect activation, Hellos and verification.",
      fields: [
        choice(
          "matches",
          "Which Fern interfaces match the supplied plan?",
          ["Gi0/0 and Gi0/1", "Gi0/1 and Gi0/2", "Moss Gi0/0 and Gi0/1"],
          "Gi0/0 and Gi0/1",
          "Compare the selectors with addresses on the router receiving the configuration; an excluded interface should not match.",
        ),
        choice(
          "exact",
          "Which exact selector activates Fern’s transit in area 0?",
          [
            "network 10.45.0.6 0.0.0.0 area 0",
            "network 10.45.0.5 0.0.0.0 area 0",
            "network 10.45.0.4 255.255.255.252 area 0",
          ],
          "network 10.45.0.5 0.0.0.0 area 0",
          "An exact wildcard compares every bit of a local interface address. A peer address is not your own interface address.",
        ),
        choice(
          "hellos",
          "Which interfaces must exchange Hellos?",
          ["The two host-facing LAN ports only", "Every port, including the workshop", "Fern Gi0/1 and Moss Gi0/0"],
          "Fern Gi0/1 and Moss Gi0/0",
          "Locate the router-to-router path. Keep LAN advertisement separate from a requirement to form neighbors on that LAN.",
        ),
        choice(
          "identity",
          "Which identity plan is valid for this two-router domain?",
          [
            "Both use router ID 10.255.2.1 because their area matches",
            "Fern process 30 / ID 10.255.2.1; Moss process 40 / ID 10.255.2.2",
            "Different router IDs prevent adjacency",
          ],
          "Fern process 30 / ID 10.255.2.1; Moss process 40 / ID 10.255.2.2",
          "Separate the process number’s local scope from the identifier carried by the router in OSPF.",
        ),
        choice(
          "observations",
          "Which observation-to-conclusion mapping is sound?",
          [
            "Interface brief → address/state; OSPF interface → area/type; neighbor → adjacency; route → installed prefixes; host pings both ways → tested request/reply paths",
            "One FULL neighbor → all hosts and applications work",
            "A ping to the local gateway → the remote LAN route is installed",
          ],
          "Interface brief → address/state; OSPF interface → area/type; neighbor → adjacency; route → installed prefixes; host pings both ways → tested request/reply paths",
          "Ask exactly what each command measures. A narrower observation cannot establish an unrelated property.",
        ),
      ],
      solution: {
        steps: [
          "Fern Gi0/0 is inside 172.21.40.0/24. Gi0/1 at 10.45.0.5 lies in the .4–.7 wildcard interval. Gi0/2 is outside both selectors, so only Gi0/0 and Gi0/1 activate.",
          "For an exact transit match, use network 10.45.0.5 0.0.0.0 area 0 on Fern. The .6 peer address cannot match a local Fern interface. 255.255.255.252 is the subnet mask, not the intended wildcard.",
          "Fern Gi0/1 and Moss Gi0/0 must exchange Hellos. Make Fern Gi0/0 and Moss Gi0/1 passive while keeping their user LANs activated. After convergence, each transit should have one FULL peer; neither passive LAN should have one.",
          "Processes 30 and 40 are local identifiers. Distinct router IDs 10.255.2.1 and 10.255.2.2 identify the routers in this domain.",
          "Check interface addressing and state, actual area/type and passive policy, reciprocal neighbors, Fern’s route to 172.21.50.0/24 via 10.45.0.6 and Moss’s route to 172.21.40.0/24 via 10.45.0.5. Ping 172.21.50.10 from Fern host and 172.21.40.10 from Moss host. Those observations support the tested paths, not every service.",
        ],
        commonMistake:
          "Treating a network statement as a request for a remote route, or taking one successful observation as proof of the whole path.",
      },
    },
    {
      id: "ospf-plan-independent",
      revision: 1,
      stage: "independent",
      inputKind: "tap-steps",
      solutionPolicy: "requested-only",
      prompt: "Plan Ridge’s participation and prove both host directions from the new table.",
      fields: [
        choice(
          "plan",
          "Which two lines are the minimal exact-interface plan inside Ridge’s process 70?",
          [
            "network 10.77.0.8 255.255.255.252 area 0; network 192.168.96.0 255.255.255.0 area 0",
            "network 192.168.64.1 0.0.0.0 area 0; network 192.168.96.1 0.0.0.0 area 0",
            "network 10.77.0.10 0.0.0.0 area 0; network 192.168.96.1 0.0.0.0 area 0",
            "network 10.77.0.10 0.0.0.0 area 1; network 192.168.96.1 0.0.0.0 area 1",
          ],
          "network 10.77.0.10 0.0.0.0 area 0; network 192.168.96.1 0.0.0.0 area 0",
          "Check all three constraints: the router owns each address, exact matching uses zero ignored bits, and participation meets the stated area design.",
        ),
        choice(
          "passive",
          "Which Ridge passive policy meets the design?",
          [
            "Make Gi0/0/0 passive; leave Gi0/2/0 non-passive",
            "Make Gi0/2/0 passive; leave Gi0/0/0 non-passive",
            "Make every activated interface passive",
          ],
          "Make Gi0/0/0 passive; leave Gi0/2/0 non-passive",
          "Use the port roles, not their numbering, to decide where another router must hear Hellos.",
        ),
        choice(
          "behavior",
          "After convergence, what should the intended policy produce?",
          [
            "No neighbor anywhere; passive LANs cannot be advertised",
            "One FULL transit neighbor per router; Studio LAN advertised despite no LAN Hellos",
            "A FULL neighbor with Studio host; the transit needs none",
          ],
          "One FULL transit neighbor per router; Studio LAN advertised despite no LAN Hellos",
          "Advertising an activated LAN prefix and forming a neighbor on that LAN are separate behaviors.",
        ),
        choice(
          "routes",
          "Which reciprocal OSPF route expectation is correct?",
          [
            "Ridge needs only its connected Studio LAN; Vale needs no remote route",
            "Both routers need a route to router ID 10.255.1.70 before OSPF can start",
            "Ridge: 192.168.64.0/24 via 10.77.0.9; Vale: 192.168.96.0/24 via 10.77.0.10",
          ],
          "Ridge: 192.168.64.0/24 via 10.77.0.9; Vale: 192.168.96.0/24 via 10.77.0.10",
          "For each router, identify the other LAN and the directly reachable transit next hop. A router identifier is not a host gateway.",
        ),
        choice(
          "proof",
          "Which evidence is sufficient for the stated reciprocal ICMP reachability goal?",
          [
            "Both routers’ interface/OSPF state, reciprocal FULL neighbors and remote routes; correct host gateways; successful Archive-to-Studio and Studio-to-Archive pings",
            "A successful Studio-to-Ridge LAN ping",
            "A FULL neighbor on Ridge and one remote route on Vale",
          ],
          "Both routers’ interface/OSPF state, reciprocal FULL neighbors and remote routes; correct host gateways; successful Archive-to-Studio and Studio-to-Archive pings",
          "Preserve the source and destination of every probe. Verify the routes and both host-initiated paths, while keeping the conclusion limited to the traffic actually tested.",
        ),
      ],
      solution: {
        steps: [
          "Ridge owns 10.77.0.10 on Gi0/2/0 and 192.168.96.1 on Gi0/0/0. Inside process 70, network 10.77.0.10 0.0.0.0 area 0 and network 192.168.96.1 0.0.0.0 area 0 activate exactly these interfaces. Neither line matches maintenance 192.168.200.1.",
          "192.168.64.1 belongs to Vale, so using it as a local Ridge selector cannot activate Ridge’s transit. Subnet-mask distractors are not exact wildcards; area 1 violates this area-0 design.",
          "Make Ridge Gi0/0/0 passive and keep Gi0/2/0 non-passive. Vale’s transit must also be non-passive and explicitly point-to-point. Ridge and Vale should each see one FULL transit neighbor. Studio’s /24 remains advertised; Studio host does not run OSPF.",
          "Ridge should install 192.168.64.0/24 via 10.77.0.9; Vale should install 192.168.96.0/24 via 10.77.0.10. Different process IDs 70 and 8 are valid; the already distinct router IDs identify the two routers.",
          "Record both interface tables, actual OSPF area/type/passive policy, reciprocal neighbor and remote route entries, and host gateways. From Archive 192.168.64.20 ping Studio 192.168.96.20; then originate the reverse test from Studio. A local gateway ping or FULL state alone cannot replace this evidence. Even successful ICMP tests do not prove every application works.",
        ],
        commonMistake:
          "Following interface numbers from the worked example instead of reading the changed port roles, or overlooking the return path.",
      },
    },
  ],
  relatedLabs: [
    { scenarioId: "ospf-01", relationship: "apply" },
    { scenarioId: "passive-01", relationship: "apply" },
    { scenarioId: "timer-01", relationship: "apply" },
  ],
  sources: [
    {
      title: "Cisco IOS OSPF command reference: network area, router-id and interface network type",
      url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/command/iro-cr-book/ospf-i1.html",
    },
    {
      title: "Cisco OSPF configuration: local process IDs, activation and passive interfaces",
      url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/lyr3-fwd/ospf/ospf-configuration-guide/ospf.html",
    },
    { title: "RFC 2328: OSPFv2 protocol specification", url: "https://www.rfc-editor.org/rfc/rfc2328" },
  ],
  companion: {
    title: "Optional device practice · UNEXECUTED",
    introduction:
      "NetFault-created practice companion inspired by the historical lecture objectives. This is not a recovered or official UM practical sheet. No Packet Tracer/IOS session or tested .pkt file accompanies it. Academy tap results do not prove independent device configuration skills. This brief is separate from scoring and is bundled for offline reading.",
    interfaceTable: {
      title: "Companion: North host → Elm → Ash → South host",
      rows: [
        row("North host", "Ethernet", "172.28.8.25", 24, "Gateway 172.28.8.1"),
        row("Elm", "Gi0/0", "172.28.8.1", 24, "North LAN"),
        row("Elm", "Gi0/1", "10.88.0.17", 30, "Transit to Ash Gi0/0"),
        row("Ash", "Gi0/0", "10.88.0.18", 30, "Transit to Elm Gi0/1"),
        row("Ash", "Gi0/1", "172.28.9.1", 24, "South LAN"),
        row("South host", "Ethernet", "172.28.9.25", 24, "Gateway 172.28.9.1"),
      ],
    },
    steps: [
      "Record the Packet Tracer/device software version and actual interface names. If names differ, write a port-role mapping before configuration. Use two isolated routers and two hosts (access switches are optional). This exercise must not change a production network.",
      "Prepare your own commands from the table. Assign /24 masks 255.255.255.0 and transit /30 mask 255.255.255.252; enable router ports and set host gateways. Use Elm process 11 / router ID 10.255.8.11 and Ash process 22 / router ID 10.255.8.22, set before interface activation. Activate each LAN and transit in area 0 with exact network selectors. Make each LAN passive, each transit non-passive, and explicitly set ip ospf network point-to-point on both transit ports. No other routing source is required.",
      "Collect a baseline: show ip interface brief on both routers, host IP/gateway settings, show running-config, show ip protocols and show ip ospf interface. Compare address, mask, area, passive policy and point-to-point type with your plan. Record expected and actual observations separately.",
      "After convergence, run show ip ospf neighbor on each router. Record the peer router ID, FULL state and transit interface. In show ip route, look for Elm’s remote 172.28.9.0/24 via 10.88.0.18 and Ash’s remote 172.28.8.0/24 via 10.88.0.17. Do not invent a FULL result if the devices disagree; investigate the baseline first.",
      "From North host ping 172.28.9.25; from South host ping 172.28.8.25. Record source, destination and actual replies/timeouts. A router-originated ping may choose a different source and is not a substitute for these host tests.",
      "Save running configuration to startup configuration using copy running-config startup-config on both routers. In Packet Tracer, also save your project, close it and reopen it; on devices, reload only this isolated practice environment if appropriate. Recheck configuration, neighbors, remote routes and both pings. Keep the working baseline as a rollback copy.",
      "Predict the effect of removing only Elm’s LAN OSPF activation. Under router ospf 11 remove network 172.28.8.1 0.0.0.0 area 0; ensure no overlapping selector or interface-level activation is present. Do not change addresses, passive settings or transit activation. Wait for convergence and observe: Elm’s LAN stays connected, the transit adjacency should persist, and Ash’s learned route to the North LAN should disappear. Test both host directions and record actual outcomes; transient timing is implementation-dependent.",
      "Roll back by restoring that exact network statement. Verify the remote route and both host tests again; save the restored baseline. Journal the hypothesis, one changed line, observed evidence, any discrepancy and final restored state. Successful tap choices alone do not satisfy this external exercise.",
    ],
  },
};
