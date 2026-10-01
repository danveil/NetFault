// Independently stated expected outcomes; never read answers from application content.
export const vpnCases = [
  {
    id: "vpn-boundaries",
    module: "VPN and IPsec",
    number: 1,
    answers: [
      ["Site-to-site", "Encapsulation without encryption", "Delivery for that probe, not IPsec protection"],
      [
        "A need to inspect the actual protection design",
        "No; the gateway boundary is distinct from the LAN paths",
        "Some IPsec designs support multicast without GRE",
      ],
    ],
  },
  {
    id: "ipsec-services",
    module: "VPN and IPsec",
    number: 2,
    answers: [
      ["Confidentiality", "Establishing shared key material", "A shared secret key in the construction"],
      [
        "Neither the chosen services nor successful protected delivery",
        "Which trusted PSK or certificate relationship authenticates this peer?",
        "Role-recognition examples with explicit limitations",
      ],
    ],
  },
  {
    id: "vpn-evidence",
    module: "VPN and IPsec",
    number: 3,
    answers: [
      [
        "Reachability for that probe",
        "Current protection evidence tied to the relevant traffic at both gateways",
        "A bypass that violates the requirement",
      ],
      [
        "Fresh observations from the changed configuration",
        "Relevant forward and return behavior",
        "Have different purposes even if both match packet fields",
      ],
    ],
  },
];
