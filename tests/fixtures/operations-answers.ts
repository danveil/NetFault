// Independently stated outcomes for the authored learning problems.
export const operationsCases = [
  {
    id: "management-visibility",
    module: "Network Management",
    number: 1,
    answers: [
      ["LLDP neighbor inspection", "Repeated authorized SNMP reads with timestamps", "The OID"],
      [
        "Only that no notification was observed",
        "Choose data, devices/ports and a representative duration",
        "Read an allowed object",
      ],
    ],
  },
  {
    id: "management-events",
    module: "Network Management",
    number: 2,
    answers: [
      ["Severity 3 error", "The configured time-source intent", "Unsynchronized state"],
      [
        "Clock source, synchronization and timezone",
        "Impact assessment, backup and rollback",
        "Fresh service checks and documented cause/fix",
      ],
    ],
  },
  {
    id: "qos-experience",
    module: "Quality of Service",
    number: 1,
    answers: [
      ["Delay variation", "2%", "Added waiting time for smoother playback"],
      [
        "Offered load, egress capacity and queue/drop evidence over time",
        "LLQ",
        "Preferential treatment, not added physical capacity",
      ],
    ],
  },
  {
    id: "qos-treatment",
    module: "Quality of Service",
    number: 2,
    answers: [
      ["Marking", "IntServ", "DSCP 6 + ECN 2 bits in IP; CoS 3 bits in an 802.1Q tag"],
      [
        "Classify and apply the approved marking policy",
        "Shaping",
        "Applied class/counter evidence and measured service under load",
      ],
    ],
  },
  {
    id: "virtual-platforms",
    module: "Network Virtualization and Automation",
    number: 1,
    answers: [
      ["PaaS", "Type 1", "Cloud deployment arrangement"],
      ["The shared hardware and recovery design", "VRF", "Tested redundancy and recovery evidence"],
    ],
  },
  {
    id: "sdn-control",
    module: "Network Virtualization and Automation",
    number: 2,
    answers: [
      ["Northbound relationship", "Southbound interface", "Data plane"],
      [
        "Assurance",
        "Permitted and prohibited path checks plus installed policy",
        "Defines/programs policy for the fabric",
      ],
    ],
  },
  {
    id: "automation-requests",
    module: "Network Virtualization and Automation",
    number: 3,
    answers: [
      ["GET", "A Boolean value", "The resource path"],
      [
        "Review a scoped diff, test a small approved subset and plan rollback",
        "Acceptance only; inspect state and service next",
        "Orchestration",
      ],
    ],
  },
];
