import type { Exercise, Lesson } from "./schema";

const field = (
  id: string,
  label: string,
  choices: string[],
  answer: string,
  explanation: string,
): Exercise["fields"][number] => ({ id, label, kind: "choice", choices, answer, explanation });
const exercise = (
  id: string,
  stage: Exercise["stage"],
  prompt: string,
  fields: Exercise["fields"],
  steps: string[],
  commonMistake: string,
): Exercise => ({
  id,
  revision: 1,
  stage,
  prompt,
  fields,
  inputKind: "tap-steps",
  solutionPolicy: "requested-only",
  solution: { steps, commonMistake },
});
const section = (
  kind: Lesson["sections"][number]["kind"],
  title: string,
  body: string,
): Lesson["sections"][number] => ({ kind, title, body });
const diagram = (title: string, cards: [string, string][], caption: string) => ({
  kind: "concept-map" as const,
  title,
  cards: cards.map(([label, detail]) => ({ label, detail })),
  caption,
});
const base = (id: string, title: string, courseAnchor: string, objectives: string[], prerequisites: string[] = []) => ({
  schemaVersion: 1 as const,
  revision: 1,
  id,
  moduleId: "vpn-ipsec",
  title,
  courseAnchor,
  objectives,
  prerequisiteLessonIds: prerequisites,
  relatedLabs: [],
  scope: "concepts-and-structured-practice" as const,
});
const rfc = (title: string, n: number) => ({ title, url: `https://www.rfc-editor.org/rfc/rfc${n}.html` });

export const vpnModule = {
  schemaVersion: 1,
  revision: 1,
  id: "vpn-ipsec",
  title: "VPN and IPsec",
  overview:
    "Separate a working path from a protected path. Course-grounded reasoning, not a running VPN or cryptography simulator.",
  orderedLessonIds: ["vpn-boundaries", "ipsec-services", "vpn-evidence"],
};

const boundaries: Lesson = {
  ...base(
    "vpn-boundaries",
    "A tunnel is not a security promise",
    "26/27: 9.VPN.ppt 3–24; 9.VPNrv.txt — deployment types, GRE and IPsec.",
    [
      "Distinguish site-to-site and remote-access VPNs.",
      "Explain why bare GRE does not encrypt.",
      "Identify where gateway-to-gateway protection begins and ends.",
    ],
  ),
  sections: [
    section(
      "simple",
      "Ask what the connection provides",
      "A VPN connects users or sites across another network. The design may provide isolation, tunneling and security services, but the word VPN alone does not establish encryption. GRE carries traffic inside another packet; IPsec supplies separately configured security services.",
    ),
    section(
      "analogy",
      "An envelope and a protected container",
      "Putting a letter in an addressed envelope resembles encapsulation: it helps carry something across a network. A protected container adds different safeguards.\n\nLimit: an envelope is not cryptography. A tunnel name or an up label tells you neither which security service is applied nor whether the remote application works.",
    ),
    {
      ...section(
        "technical",
        "Keep deployment and mechanism separate",
        "Site-to-site connects gateways serving networks; remote access connects a user/client to a gateway. The course contrasts enterprise-managed and provider-managed VPNs, including Layer 2/Layer 3 MPLS arrangements. Provider separation alone is not cryptographic confidentiality.\n\nBare GRE has no encryption or peer authentication. GRE over IPsec combines encapsulation with a separate protection mechanism. The course also introduces IPsec VTI, which can carry multicast without adding GRE, and DMVPN/mGRE as broader designs. Neither is implemented here.\n\nThe slides’ SSL VPN terminology includes TLS-based access. Their historical IPsec-versus-SSL comparison is not a universal security ranking or a current product recommendation.",
      ),
      diagram: diagram(
        "Where does site-to-site protection apply?",
        [
          ["Local LAN → gateway", "Hosts send ordinary IP traffic toward the site gateway."],
          [
            "Gateway → gateway across WAN",
            "The configured security services apply to selected traffic across this boundary.",
          ],
          [
            "Remote gateway → remote LAN",
            "Traffic continues to the destination; return routing and policy require separate checks.",
          ],
        ],
        "A conceptual boundary, not a packet capture. Site-to-site IPsec alone does not prove host-to-host encryption on both LANs.",
      ),
    },
    section(
      "worked",
      "Two claims about a campus link",
      "Authored example: Cedar and Elm have a working GRE tunnel and can exchange application traffic. This establishes delivery for that test, not encryption. If their design additionally requires IPsec confidentiality between gateways, they need independent evidence that the relevant traffic used that protection.\n\nA remote staff member using a client-to-gateway connection is remote access. The two-campus gateway relationship is site-to-site. Neither topology label selects a cipher for you.",
    ),
    section(
      "guided",
      "Guided: classify the claim",
      "Classify the connection and distinguish encapsulation from protection. Use what the observation actually establishes.",
    ),
    section(
      "independent",
      "Your turn: define the security boundary",
      "A team claims that a provider VPN label and a successful GRE ping prove every segment is encrypted. Assess each part of the claim.",
    ),
  ],
  exercises: [
    exercise(
      "vpn-boundaries-guided",
      "guided",
      "Choose the right relationship",
      [
        field(
          "deployment",
          "Two gateways connect their LANs. This is…",
          ["Site-to-site", "Remote-access client only", "A hash algorithm"],
          "Site-to-site",
          "Classify the endpoints: network gateways differ from a single remote user joining a gateway.",
        ),
        field(
          "gre",
          "Bare GRE supplies…",
          ["Encapsulation without encryption", "Automatic confidentiality", "Certificate validation"],
          "Encapsulation without encryption",
          "Carrying an inner packet is a different function from protecting its contents or authenticating a peer.",
        ),
        field(
          "ping",
          "A successful GRE ping proves…",
          [
            "All application traffic is encrypted",
            "Delivery for that probe, not IPsec protection",
            "Both peers use the same secret",
          ],
          "Delivery for that probe, not IPsec protection",
          "Reachability evidence does not identify the security services used by the path.",
        ),
      ],
      [
        "Gateway-to-gateway connectivity is site-to-site.",
        "GRE encapsulates. A delivered probe needs separate protection evidence before supporting a security claim.",
      ],
      "A working tunnel is not proof of encryption.",
    ),
    exercise(
      "vpn-boundaries-independent",
      "independent",
      "Challenge a protection claim",
      [
        field(
          "provider",
          "A provider VPN label establishes…",
          ["A need to inspect the actual protection design", "Encryption by definition", "The strongest cipher"],
          "A need to inspect the actual protection design",
          "Logical separation and cryptographic confidentiality are different properties.",
        ),
        field(
          "boundary",
          "Gateway-to-gateway IPsec alone proves encryption on both LANs?",
          [
            "Yes, every LAN frame is encrypted",
            "No; the gateway boundary is distinct from the LAN paths",
            "Only if the tunnel name contains secure",
          ],
          "No; the gateway boundary is distinct from the LAN paths",
          "Name exactly where a security service starts and ends before extending the claim to endpoints.",
        ),
        field(
          "vti",
          "The course’s IPsec VTI example means…",
          [
            "Every IPsec design requires GRE",
            "Some IPsec designs support multicast without GRE",
            "GRE is an encryption algorithm",
          ],
          "Some IPsec designs support multicast without GRE",
          "Read the VTI example alongside the earlier conventional-tunnel description; avoid an absolute rule.",
        ),
      ],
      [
        "Inspect the service design; provider separation is not proof of encryption.",
        "Keep LAN and WAN protection boundaries separate. VTI is a different design from GRE over IPsec.",
      ],
      "Do not turn one conventional design into a rule for all VPNs.",
    ),
  ],
  sources: [rfc("IPsec architecture and services", 4301), rfc("GRE encapsulation", 2784)],
};

const services: Lesson = {
  ...base(
    "ipsec-services",
    "Match the safeguard to the requirement",
    "26/27: 9.VPN.ppt 29–43 and revision IPsec framework; 13.netsec.ppt 41, 50–51.",
    [
      "Separate confidentiality, integrity and authentication.",
      "Distinguish AH, ESP, IKE and DH roles.",
      "Recognize historical algorithm examples without treating them as deployment advice.",
    ],
    [boundaries.id],
  ),
  sections: [
    section(
      "simple",
      "Different safeguards answer different questions",
      "Confidentiality asks who can read data. Integrity asks whether it was altered. Authentication asks which peer or source you are trusting. Key agreement helps establish shared key material. These roles cooperate, but none is a synonym for successful routing.",
    ),
    section(
      "analogy",
      "A sealed package and a checked sender",
      "An opaque package hides the contents, a tamper-evident seal helps reveal changes, and a verified sender identity answers who sent it.\n\nLimit: cryptographic mechanisms work through keys, algorithms and protocols, not physical packaging. A visible seal or an ordinary unkeyed checksum is not proof of a trusted source.",
    ),
    {
      ...section(
        "technical",
        "Recognize roles, not a fake negotiation",
        "AH supplies integrity/data-origin authentication without confidentiality. ESP supports confidentiality and integrity/authentication according to the selected services; the ESP name alone does not prove encryption is enabled. IPsec works at the IP layer.\n\nThe course places IKE in peer authentication and key-management context. PSK and certificate/RSA approaches authenticate peers differently. DH establishes shared key material; by itself it does not establish peer identity. Symmetric encryption uses shared secret keys; asymmetric methods use a public/private pair.\n\nHMAC combines a secret key with a hash construction. A plain hash is not interchangeable with keyed authentication. The slides’ MD5/SHA-1 digest lengths are not mandatory HMAC key lengths. Their old DES/3DES/SEAL and DH rankings are historical examples, not recommended settings. Group 24 is MODP, not an elliptic-curve group. No algorithms or key exchange execute in this lesson.",
      ),
      diagram: diagram(
        "Choose evidence for each security requirement",
        [
          ["Confidentiality", "Establish which encryption service protects the relevant traffic."],
          [
            "Integrity and origin",
            "Establish the configured integrity/authentication service and trusted peer relationship.",
          ],
          ["Key agreement", "Distinguish establishing key material from authenticating the participant."],
        ],
        "Separate questions, not successive simulated packets or cryptographic operations.",
      ),
    },
    section(
      "worked",
      "An AH-only proposal",
      "Authored proposal: a team requires unreadable payloads across an untrusted WAN but suggests AH alone. AH’s authentication/integrity role does not fulfill the confidentiality requirement. The team must verify a confidentiality-capable service and its actual use, while retaining authentication and integrity requirements.\n\nA second claim says ‘we use DH, so the other gateway must be authentic.’ Key agreement alone cannot justify that identity claim; inspect how the peer is authenticated.",
    ),
    section(
      "guided",
      "Guided: match mechanism to purpose",
      "Identify the missing property in the AH-only proposal, the role of DH and the difference between a plain hash and HMAC.",
    ),
    section(
      "independent",
      "Your turn: question reassuring labels",
      "A configuration summary says ESP and a key-exchange method are enabled. A colleague calls this proof of confidentiality and authenticated identity. Decide what is still missing.",
    ),
  ],
  exercises: [
    exercise(
      "ipsec-services-guided",
      "guided",
      "Find the missing property",
      [
        field(
          "ah",
          "AH alone does not provide…",
          ["Confidentiality", "Integrity protection", "Data-origin authentication"],
          "Confidentiality",
          "Authentication/integrity and hiding readable content are distinct requirements.",
        ),
        field(
          "dh",
          "DH’s role is…",
          ["Establishing shared key material", "Selecting an IP route", "Proving identity on its own"],
          "Establishing shared key material",
          "An agreement mechanism needs an authenticated context to establish who participated.",
        ),
        field(
          "hmac",
          "HMAC differs from a plain hash because it uses…",
          ["A shared secret key in the construction", "A GRE tunnel name", "An automatic routing update"],
          "A shared secret key in the construction",
          "A publicly recomputable digest alone cannot establish that a trusted key holder produced a message.",
        ),
      ],
      [
        "AH does not hide contents; the confidentiality requirement remains unmet.",
        "DH agrees key material. HMAC is keyed; neither a plain hash nor routing establishes peer identity.",
      ],
      "Do not collapse all security functions into encryption.",
    ),
    exercise(
      "ipsec-services-independent",
      "independent",
      "Demand specific security evidence",
      [
        field(
          "esp",
          "An ESP label by itself proves…",
          [
            "Encryption is always enabled",
            "Neither the chosen services nor successful protected delivery",
            "Every LAN segment is confidential",
          ],
          "Neither the chosen services nor successful protected delivery",
          "Protocol capability, selected service and observed operation are separate evidence categories.",
        ),
        field(
          "identity",
          "Which question addresses peer authentication?",
          [
            "Which trusted PSK or certificate relationship authenticates this peer?",
            "Which subnet has the largest host count?",
            "Which tunnel name is longest?",
          ],
          "Which trusted PSK or certificate relationship authenticates this peer?",
          "Identity depends on a trusted authentication relationship, not a route or an interface label.",
        ),
        field(
          "algorithms",
          "Historical slide algorithm tables should be used as…",
          [
            "A current strongest-to-weakest deployment prescription",
            "Role-recognition examples with explicit limitations",
            "Evidence this application performs encryption",
          ],
          "Role-recognition examples with explicit limitations",
          "Course examples can teach roles without establishing present-day platform policy or measured cryptographic strength.",
        ),
      ],
      [
        "Inspect selected services and actual operation rather than inferring them from ESP.",
        "Check authentication separately; treat historical tables as educational context, not deployment settings.",
      ],
      "A mechanism name does not prove secure configuration or successful execution.",
    ),
  ],
  sources: [
    rfc("ESP security service choices", 4303),
    rfc("Keyed HMAC construction", 2104),
    rfc("DH group definitions; not deployment recommendations", 5114),
  ],
};

const evidence: Lesson = {
  ...base(
    "vpn-evidence",
    "Prove protection as well as delivery",
    "26/27: 9.VPN.ppt 14–17, 26–33, 38–41; GRE verification image 28. The IPsec PKA exists but its internal steps are uninspected.",
    [
      "Separate transport, configured intent, protection and delivery evidence.",
      "Avoid bypasses that violate the security requirement.",
      "Recognize the limits of supplied configuration screenshots.",
    ],
    [services.id],
  ),
  sections: [
    section(
      "simple",
      "An arrival and a protected arrival are different claims",
      "A packet can reach a destination without the intended protection. A reachable gateway can also fail to deliver the protected service. Investigate connectivity, security intent and actual traffic behavior separately.",
    ),
    section(
      "analogy",
      "A parcel arrived, but how?",
      "A delivered parcel proves arrival. It does not prove it used the required guarded transport. Conversely, reaching the depot does not prove the parcel reached its recipient.\n\nLimit: this is evidence reasoning, not a model of encryption. A network requires observations tied to the actual traffic and both endpoints.",
    ),
    {
      ...section(
        "technical",
        "Four distinct observations",
        "Underlay reachability establishes a path to a gateway for the tested source/destination. Configuration establishes intent. Protection observations must show the intended security relationship applies to the relevant traffic. End-to-end tests establish service delivery, including return traffic.\n\nA filtering ACL decides forwarding permission. A crypto traffic selector identifies traffic for protection; its nonmatch is not automatically a packet-filter deny. Actual bypass/discard behavior depends on the security policy. This distinction is supplementary architecture context, not an implemented selector or a configuration procedure proven by the supplied slides.\n\nThe course screenshots show GRE commands, not IPsec SA establishment. This Academy adds no show crypto command, successful SA label, synthetic counter or protected badge to NetFault. LAB 014 remains bare GRE; its successful ping cannot verify IPsec.",
      ),
      diagram: diagram(
        "Build complementary evidence",
        [
          ["Reach the gateway", "Check addressing, interfaces and source-aware routing in both directions."],
          [
            "Check the security relationship",
            "Inspect actual endpoint policy and protection evidence for the intended traffic.",
          ],
          ["Verify the service", "Test delivery and return behavior without removing the required protection."],
        ],
        "An investigation plan, not a running VPN state machine. No arrow represents encryption performed by NetFault.",
      ),
    },
    section(
      "worked",
      "An incomplete evidence bundle",
      "Authored evidence: a gateway ping succeeds; a configuration intends confidentiality for site traffic; a site application works. These observations still do not establish that its traffic received the intended protection. Ask for current, traffic-specific protection evidence at both gateways.\n\nA proposed fix removes protection and makes the ping succeed. That bypass does not satisfy a design requiring protected delivery. After a legitimate change, repeat relevant observations; old evidence does not prove the new configuration.\n\nSource caution: VPN slide 27 uses GRE destination 198.133.219.87, while slide 28 shows 209.165.201.2. They cannot be treated as a verified before/after pair.",
    ),
    section(
      "guided",
      "Guided: assess the evidence",
      "Decide what gateway reachability proves, identify the missing observation and evaluate a bypass against the stated requirement.",
    ),
    section(
      "independent",
      "Your turn: review a claimed recovery",
      "A team changes a security setting and reuses yesterday’s screenshot plus one outgoing ping as recovery evidence. Decide which checks are needed and what a selector means.",
    ),
  ],
  exercises: [
    exercise(
      "vpn-evidence-guided",
      "guided",
      "Find the unsupported conclusion",
      [
        field(
          "underlay",
          "The gateway ping supports…",
          ["Reachability for that probe", "Automatic IPsec confidentiality", "A valid crypto-map attachment"],
          "Reachability for that probe",
          "Keep the scope of an observation tied to what was actually tested.",
        ),
        field(
          "missing",
          "What is missing from the evidence bundle?",
          [
            "A more reassuring tunnel name",
            "Current protection evidence tied to the relevant traffic at both gateways",
            "An unrelated successful LAN ping",
          ],
          "Current protection evidence tied to the relevant traffic at both gateways",
          "Configuration intent and ordinary delivery are not observations of security service use.",
        ),
        field(
          "bypass",
          "Removing required protection to restore a ping is…",
          ["A complete secure recovery", "A bypass that violates the requirement", "Proof that IPsec was unnecessary"],
          "A bypass that violates the requirement",
          "Judge recovery against the original service and security requirements together.",
        ),
      ],
      [
        "Gateway reachability is a useful control, not protection proof.",
        "Require relevant protection and service evidence while preserving the security requirement.",
      ],
      "Do not award secure recovery from a ping alone.",
    ),
    exercise(
      "vpn-evidence-independent",
      "independent",
      "Verify the changed state",
      [
        field(
          "fresh",
          "After a policy change, use…",
          [
            "Fresh observations from the changed configuration",
            "Only yesterday’s screenshot",
            "Only the accepted command",
          ],
          "Fresh observations from the changed configuration",
          "Old observations describe an earlier state; an accepted edit is not an observed outcome.",
        ),
        field(
          "return",
          "For two-way protected service, verify…",
          ["Only one gateway’s configuration", "Relevant forward and return behavior", "Only the tunnel icon"],
          "Relevant forward and return behavior",
          "Directions can have different routing and protection relationships.",
        ),
        field(
          "selector",
          "A crypto traffic selector and a filtering ACL…",
          [
            "Always apply identical permit/deny forwarding semantics",
            "Have different purposes even if both match packet fields",
            "Both encrypt packets by themselves",
          ],
          "Have different purposes even if both match packet fields",
          "Matching a packet is separate from what the policy does with that match.",
        ),
      ],
      [
        "Repeat relevant policy/protection and service observations after the change.",
        "Verify both directions and distinguish protection selection from filtering permission.",
      ],
      "A selected fix, old screenshot or forward-only check cannot prove the complete requirement.",
    ),
  ],
  companion: {
    title: "Optional VPN evidence companion — UNEXECUTED",
    introduction:
      "Original observation plan for an authorized isolated device/Packet Tracer project. The supplied IPsec PKA’s internals were not inspected. This is not its answer key or a verified CLI recipe.",
    steps: [
      "Record the actual platform/version and supported VPN features. Obtain the assigned activity’s readable instructions before assuming IKE version, policy syntax or scoring requirements.",
      "Draw two original LANs and two gateways with a routed WAN between them. State exactly which traffic needs confidentiality, integrity and authenticated peers; record return routes and rollback.",
      "Use platform documentation or the readable assigned activity to configure the supported relationship with synthetic lab credentials. Do not copy the lecture’s historical cipher rankings as current security advice.",
      "Record real interface/routing and relevant protection observations at both gateways while generating the intended traffic. Capture actual outputs with secrets redacted. An unsupported command remains unsupported; do not invent counters or SA state.",
      "Introduce only one approved configuration difference, collect before/fault/repair observations, restore it and verify both service directions and protection. Do not substitute removing protection for a repair.",
      "Save and reopen the isolated project and record what was actually reproduced. Until this is performed, this brief provides preparation only and earns no device-competence credit.",
    ],
  },
  sources: [rfc("Protection, bypass and discard are separate IPsec policy choices", 4301)],
};

export const vpnLessons = [boundaries, services, evidence];
