import type { Diagram, Exercise, Lesson } from "./schema";

// Public authored learning examples. No private scenarios, protocol state or external requests.
const question = (
  id: string,
  label: string,
  choices: string[],
  answer: string,
  explanation: string,
): Exercise["fields"][number] => ({ id, label, kind: "choice", choices, answer, explanation });
const activity = (
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
const map = (title: string, cards: [string, string][], caption: string): Diagram => ({
  kind: "concept-map",
  title,
  cards: cards.map(([label, detail]) => ({ label, detail })),
  caption,
});
const section = (
  kind: Lesson["sections"][number]["kind"],
  title: string,
  body: string,
  extra: Partial<Lesson["sections"][number]> = {},
): Lesson["sections"][number] => ({ kind, title, body, ...extra });
const base = (
  id: string,
  moduleId: string,
  title: string,
  courseAnchor: string,
  objectives: string[],
  prerequisiteLessonIds: string[] = [],
) => ({
  schemaVersion: 1 as const,
  id,
  moduleId,
  title,
  revision: 1,
  courseAnchor,
  objectives,
  prerequisiteLessonIds,
  scope: "concepts-and-structured-practice" as const,
  relatedLabs: [],
});
const source = (title: string, rfc: number) => ({ title, url: `https://www.rfc-editor.org/rfc/rfc${rfc}.html` });

export const operationsModules = [
  {
    schemaVersion: 1,
    revision: 1,
    id: "network-management",
    title: "Network Management",
    overview:
      "Choose useful evidence, read events and plan a verifiable recovery. Original examples; no management server is running.",
    orderedLessonIds: ["management-visibility", "management-events"],
  },
  {
    schemaVersion: 1,
    revision: 1,
    id: "quality-of-service",
    title: "Quality of Service",
    overview:
      "Reason about traffic needs, congestion and policy choices. Paper observations, not measured packet timing.",
    orderedLessonIds: ["qos-experience", "qos-treatment"],
  },
  {
    schemaVersion: 1,
    revision: 1,
    id: "virtualization-automation",
    title: "Network Virtualization and Automation",
    overview:
      "Connect virtual infrastructure, controllers and structured requests to safe, verified change. No controller or automation runtime.",
    orderedLessonIds: ["virtual-platforms", "sdn-control", "automation-requests"],
  },
];

const visibility: Lesson = {
  ...base(
    "management-visibility",
    "network-management",
    "Choose the evidence, then the tool",
    "26/27: 10.MANAGEMENT.ppt 3–6, 22–31, 54–58, 67–68; 10.MANAGEMENTrv.txt — discovery, SNMP, baseline.",
    [
      "Distinguish neighbor discovery, polling and notifications.",
      "Connect manager, agent, MIB and OID.",
      "Plan a representative baseline instead of trusting one reading.",
    ],
  ),
  sections: [
    section(
      "simple",
      "Start with a question",
      "A healthy ping does not tell you yesterday’s CPU load or which switch port faces a router. Choose a tool for the question, then compare its observation with a documented expectation.",
    ),
    section(
      "analogy",
      "Reception desk and named records",
      "An SNMP manager resembles someone asking a reception desk for a named record. The agent answers; the MIB describes the managed objects and an OID identifies the object. A trap resembles an unsolicited alert from the desk.\n\nLimit: this is a protocol exchange, not a person searching a filing cabinet. A missing alert does not prove that nothing happened.",
    ),
    section(
      "technical",
      "Different tools, different evidence",
      "CDP discovers Cisco neighbors on a local Layer 2 link; LLDP provides vendor-neutral discovery. Neither proves end-to-end application service. Record local and remote port identities, not just device names.\n\nSNMP GET reads an object through an agent; SET requests a permitted change. Polling repeats queries to build a time series. Traps report events without waiting for a poll. MIB object definitions and OIDs give values meaning. Read-only access does not permit SET.\n\nSNMPv1/v2c community strings do not encrypt traffic. SNMPv3 distinguishes noAuthNoPriv, authNoPriv and authPriv; the version alone does not prove encryption. Correction to the source’s port shorthand: command responders normally use UDP 161; notification receivers use UDP 162. Detailed security deployment is external practice.",
      {
        diagram: map(
          "Who asks, who answers?",
          [
            ["Manager → agent", "GET asks for an identified object; SET requests an authorized change."],
            ["Agent ↔ managed objects", "MIB definitions describe objects; an OID identifies what is requested."],
            ["Agent → manager", "A trap reports an event; repeated polling builds a series."],
          ],
          "Directions describe management exchanges, not forwarding paths or a running SNMP simulation.",
        ),
      },
    ),
    section(
      "worked",
      "A trend needs comparable samples",
      "Authored example: a library uplink reports 18%, 22%, 79% and 81% utilization across four equal intervals. This suggests a change worth investigating, not proof of a defective link. Compare the same device, port, interval, units and workload with a representative baseline.\n\nThe course’s baseline sequence is: choose data → identify devices/ports → choose duration. Include busy and quiet periods. Keep physical topology, logical addressing and device records alongside performance history. A protocol analyzer answers packet-content questions; a cable tester answers different physical questions.",
      {
        code: "Discovery inspection examples — not executed\nshow cdp neighbors\nshow lldp neighbors\n\nSNMP request reading\nGET <authorized-device> <documented-OID>\nRecord timestamp, object, units and value.",
      },
    ),
    section(
      "guided",
      "Guided: match question to evidence",
      "A mixed-vendor campus needs neighbor identities and a CPU trend. Decide what each observation can establish.",
    ),
    section(
      "independent",
      "Your turn: a quiet monitoring console",
      "The console has received no traps since lunch. A colleague concludes the entire network is healthy. Evaluate that claim and plan better evidence.",
    ),
  ],
  exercises: [
    activity(
      "visibility-guided",
      "guided",
      "Match the monitoring question",
      [
        question(
          "neighbor",
          "Which tool fits local mixed-vendor neighbor discovery?",
          ["LLDP neighbor inspection", "A syslog severity threshold", "An SNMP SET"],
          "LLDP neighbor inspection",
          "Match the question to Layer 2 discovery; severity filtering and changing a value answer different questions.",
        ),
        question(
          "trend",
          "Which approach supports CPU change over time?",
          ["One successful ping", "Repeated authorized SNMP reads with timestamps", "One CDP neighbor name"],
          "Repeated authorized SNMP reads with timestamps",
          "A trend needs comparable repeated measurements. A reachability probe or neighbor identity is not a CPU series.",
        ),
        question(
          "object",
          "What identifies the managed object being queried?",
          ["The OID", "The syslog collector address", "The VLAN cable label"],
          "The OID",
          "Separate the identity of a managed object from the address of a collector or a physical label.",
        ),
      ],
      [
        "Use LLDP for the mixed-vendor local adjacency question.",
        "Collect timestamped SNMP reads of the documented CPU object, identified by its OID; compare equivalent intervals.",
      ],
      "A reachable device can still be overloaded; a local neighbor does not establish remote service.",
    ),
    activity(
      "visibility-independent",
      "independent",
      "Challenge an unsupported health claim",
      [
        question(
          "silence",
          "No traps arrived. What can you conclude?",
          ["Every service is healthy", "Only that no notification was observed", "The agent has no MIB"],
          "Only that no notification was observed",
          "Separate event occurrence from event delivery and collection. Silence has several explanations.",
        ),
        question(
          "baseline",
          "Which baseline plan is defensible?",
          [
            "Pick one quiet-minute value",
            "Collect any values without units",
            "Choose data, devices/ports and a representative duration",
          ],
          "Choose data, devices/ports and a representative duration",
          "A useful comparison controls what was sampled, where and over which workload period.",
        ),
        question(
          "access",
          "Read-only SNMP access is available. Which operation fits?",
          ["Read an allowed object", "Change any interface with SET", "Assume encrypted transport"],
          "Read an allowed object",
          "Permission to observe, permission to change and confidentiality are different properties.",
        ),
      ],
      [
        "Notification silence is inconclusive; test collection and compare current readings with a representative baseline.",
        "Use only allowed reads with read-only credentials. Inspect version/security mode separately from access rights.",
      ],
      "Do not treat absence of an alarm as proof of an absence of faults.",
    ),
  ],
  sources: [source("SNMP transport roles — RFC 3417 §3.2", 3417)],
};

const events: Lesson = {
  ...base(
    "management-events",
    "network-management",
    "Put events in order and verify recovery",
    "26/27: 10.MANAGEMENT.ppt 7–21, 32–37, 59–68; revision — NTP, syslog, backup and seven-step troubleshooting.",
    [
      "Interpret severity thresholds and time evidence.",
      "Separate configured NTP from confirmed synchronization.",
      "Plan backup, rollback and fresh verification.",
    ],
    [visibility.id],
  ),
  sections: [
    section(
      "simple",
      "An event is evidence, not a diagnosis",
      "Syslog records what a device reported. NTP helps devices share a time reference so their reports can be compared. Neither automatically explains the root cause.",
    ),
    section(
      "analogy",
      "Two diaries with different clocks",
      "If two witnesses set their watches differently, their diary timestamps can suggest the wrong event order. Synchronizing clocks helps comparison.\n\nLimit: real network logs also have transmission delay, buffering, missing entries and clock uncertainty. Matching timestamps is not proof that one event caused another.",
    ),
    section(
      "technical",
      "Read severity and clock state separately",
      "Syslog severity runs from 0 emergency, 1 alert, 2 critical, 3 error, 4 warning, 5 notification, 6 informational to 7 debugging. Smaller numbers are more severe. A logging trap threshold of 4 admits levels 0–4 for that destination, not only level 4. A message’s facility identifies its subsystem.\n\nNTP stratum describes reference-clock hierarchy, not IP router hops or a measured accuracy score. A reference clock is stratum 0; network servers use 1–15; 16 indicates unsynchronized. Configuring ntp server is intent: inspect associations, status and clock detail to check operation. A lower stratum alone does not prove a better clock.\n\nTraditional course syslog uses UDP 514, which does not guarantee delivery. Clock configuration, logging source, destination and threshold are separate checks.",
      {
        diagram: map(
          "Build a defensible event sequence",
          [
            ["Clock evidence", "Check synchronization, source and timezone before comparing timestamps."],
            ["Log evidence", "Read facility, severity and destination filtering; account for missing messages."],
            ["Recovery evidence", "Test the hypothesis, verify the service and document the result."],
          ],
          "Evidence categories, not simulated NTP messages or measured event timing.",
        ),
      },
    ),
    section(
      "worked",
      "A missing notification can be a filter",
      "Authored message: %LINK-5-CHANGED: an interface state changed. A remote threshold of 4 excludes this level-5 example even when collection works. Inspect the threshold before assuming packet loss. Preserve the initial configuration and observations.\n\nCourse workflow: define → gather → analyze → eliminate causes → propose → test → solve/document. Before a change, assess impact and plan rollback. Backup to an authorized TFTP server or USB is different from proving you can restore it; restoring into running configuration may merge settings. Verify and save deliberately. Password recovery and image upgrades need platform-specific external practice.",
      {
        code: "Configuration-reading example — not executed\nntp server 192.0.2.40\nservice timestamps log datetime\nlogging 192.0.2.50\nlogging trap 4\n\nVerification questions\nshow clock detail\nshow ntp associations\nshow ntp status\nshow logging",
      },
    ),
    section(
      "guided",
      "Guided: interpret a collection policy",
      "A collector admits levels 0–4. Its router has an NTP server line in configuration. Separate intended policy from observed behavior.",
    ),
    section(
      "independent",
      "Your turn: conflicting incident times",
      "Two devices report different event times during a service outage. Choose a safe investigation and recovery sequence before changing either device.",
    ),
  ],
  exercises: [
    activity(
      "events-guided",
      "guided",
      "Read policy without inventing a fault",
      [
        question(
          "threshold",
          "Which example passes logging trap 4?",
          ["Severity 6 informational", "Severity 3 error", "Severity 5 notification"],
          "Severity 3 error",
          "The configured threshold includes its number and more severe, numerically smaller levels.",
        ),
        question(
          "time",
          "An ntp server line proves what?",
          ["The configured time-source intent", "The clock is synchronized", "The server is stratum 0"],
          "The configured time-source intent",
          "Configuration and operational status are different observations; inspect associations and synchronization state.",
        ),
        question(
          "stratum",
          "What does stratum 16 indicate?",
          ["Sixteen routed IP hops", "Highest clock precision", "Unsynchronized state"],
          "Unsynchronized state",
          "Stratum belongs to the time-source hierarchy, not the IP path length.",
        ),
      ],
      [
        "Severity 3 falls within 0–4; severity 5 and 6 do not.",
        "The server line declares intent. Operational synchronization evidence is separate; stratum 16 is unsynchronized.",
      ],
      "A configured service is not necessarily an operating service.",
    ),
    activity(
      "events-independent",
      "independent",
      "Build a safe recovery plan",
      [
        question(
          "sequence",
          "First resolve the timestamp disagreement by checking…",
          [
            "Clock source, synchronization and timezone",
            "Only the larger severity number",
            "Only the fastest interface",
          ],
          "Clock source, synchronization and timezone",
          "Do not infer event order from clocks whose reference and offsets are unknown.",
        ),
        question(
          "change",
          "Before testing a configuration hypothesis, prepare…",
          ["A reboot of every device", "Impact assessment, backup and rollback", "Deletion of the original logs"],
          "Impact assessment, backup and rollback",
          "A controlled test must preserve evidence and provide a way back if the hypothesis is wrong.",
        ),
        question(
          "finish",
          "What supports closing the incident?",
          [
            "The change command was accepted",
            "A colleague thinks it looks fixed",
            "Fresh service checks and documented cause/fix",
          ],
          "Fresh service checks and documented cause/fix",
          "Execution is not outcome. Recheck the affected service and preserve the evidence for later operators.",
        ),
      ],
      [
        "Check the clocks before comparing event order; preserve initial observations.",
        "Prepare rollback, test the hypothesis, then verify the affected service and document the actual result.",
      ],
      "Deleting old logs destroys the comparison needed to justify a diagnosis.",
    ),
  ],
  companion: {
    title: "Optional management device practice — UNEXECUTED",
    introduction:
      "Original isolated-lab brief. Record the actual platform/version and outputs. No SNMP, NTP or syslog service was executed by Academy.",
    steps: [
      "Inventory two authorized devices and a collector. Record local/remote ports with supported CDP/LLDP commands; compare with your physical diagram.",
      "Inspect clock detail, NTP associations/status and logging settings. Configure only an approved time source and collector in the isolated lab; retain the original configuration and rollback plan.",
      "Generate a harmless approved event, record its actual severity and compare local versus collector visibility at two thresholds. Do not infer synchronization from the ntp server line alone.",
      "Using authorized read-only access, query one documented SNMP object repeatedly; record OID, units, timestamps and security mode. Do not publish credentials or assume v3 automatically means privacy.",
      "Back up configuration to an authorized destination. Test restoration only on a disposable device/project, account for merge behavior, save/reopen and verify service. Record unsupported commands honestly.",
    ],
  },
  sources: [source("NTP hierarchy and state — RFC 5905", 5905), source("Syslog severity — RFC 5424", 5424)],
};

const experience: Lesson = {
  ...base(
    "qos-experience",
    "quality-of-service",
    "Explain a poor call despite a working network",
    "26/27: 11.QoSrv.ppt 3–16, 17–24; 11.QoSrv.txt — congestion, voice/video and queuing.",
    [
      "Distinguish delay, jitter, loss and capacity.",
      "Compare voice, video and reliable data needs.",
      "Explain why one successful ping cannot validate QoS.",
    ],
  ),
  sections: [
    section(
      "simple",
      "Delivery quality has several dimensions",
      "A packet may arrive too late, arrive at an uneven interval, or never arrive. A successful reachability test does not measure the quality of a conversation under load.",
    ),
    section(
      "analogy",
      "An exit narrower than its entrances",
      "Several entrances feeding one narrow exit resemble traffic aggregating onto a slower egress link. Waiting lines create delay; a full waiting area loses arrivals.\n\nLimit: packets have sizes, classes and configured handling rules. A human queue cannot predict a router’s exact scheduling, jitter or loss.",
    ),
    section(
      "technical",
      "Name the symptom precisely",
      "Bandwidth is capacity; offered traffic can exceed it at an aggregation point or a speed mismatch. Delay is travel time. Jitter is variation in delay. Loss is missing packets. Serialization and propagation contribute delay; queueing varies with load. Larger buffers can absorb bursts but also increase waiting time.\n\nConversational voice is time-sensitive; replaying a very late packet may be useless. Video can be bursty and demand more capacity. TCP data can recover losses but still suffers performance effects. A playout buffer smooths some arrival variation by adding delay; it has limits.\n\nThe revision guide gives voice targets of 150 ms delay, 30 ms jitter and 1% loss; video 400 ms, 50 ms and 1%. Its 30/384 kbps figures are course examples, not universal codec or application requirements. Measure against the actual service objective.",
      {
        diagram: map(
          "Locate the congestion point",
          [
            ["Many inputs", "Several offered traffic streams share resources."],
            ["Slower egress", "Demand above capacity causes queueing; finite buffers can fill."],
            ["Observed experience", "Measure delay variation and loss over a stated interval."],
          ],
          "A conceptual bottleneck, not a scheduler or a packet-timing simulation.",
        ),
      },
    ),
    section(
      "worked",
      "Read a small measurement set",
      "Authored one-way packet delays: 20, 20, 80, 20 ms. Every packet may still arrive, but the delays vary; that is jitter, not necessarily loss. If 2 of 100 sent packets are missing at the receiver, the sample loss is 2%. State the interval and direction before comparing measurements.\n\nFIFO follows arrival order. WFQ separates flows; CBWFQ uses defined traffic classes and bandwidth treatment under congestion. LLQ adds bounded priority service for delay-sensitive traffic. None creates extra physical link capacity.",
      {
        code: "Authored observations — not live measurements\nPacket delays (ms): 20, 20, 80, 20\nSent: 100    Received: 98\nLoss fraction: (100 - 98) / 100 = 2%",
      },
    ),
    section(
      "guided",
      "Guided: distinguish symptoms",
      "Use the supplied observations only. Do not infer measurements from NetFault’s deterministic five-of-five ping result.",
    ),
    section(
      "independent",
      "Your turn: a busy uplink",
      "An evening backup coincides with broken conversation audio. Pings still work. Decide what to observe and what a proposed queue change can achieve.",
    ),
  ],
  exercises: [
    activity(
      "experience-guided",
      "guided",
      "Name the observed quality problem",
      [
        question(
          "variation",
          "20, 20, 80, 20 ms delays show…",
          ["Delay variation", "Proof of packet loss", "Extra link bandwidth"],
          "Delay variation",
          "Uneven travel times and missing packets are separate observations.",
        ),
        question(
          "loss",
          "98 of 100 packets arrived. Sample loss is…",
          ["98%", "2%", "0%"],
          "2%",
          "Count missing packets relative to the number sent; a delay sample alone cannot give this value.",
        ),
        question(
          "buffer",
          "A playout buffer mainly trades…",
          ["Added waiting time for smoother playback", "IP addresses for bandwidth", "All packet loss for zero delay"],
          "Added waiting time for smoother playback",
          "Smoothing arrival variation requires holding data, with a finite tolerance for late arrivals.",
        ),
      ],
      [
        "The delay series varies, so it shows jitter; loss needs sent/received evidence.",
        "Two missing out of 100 is 2%. A playout buffer can smooth some variation by introducing delay.",
      ],
      "Jitter, loss and delay are related but are not interchangeable quantities.",
    ),
    activity(
      "experience-independent",
      "independent",
      "Investigate the busy uplink",
      [
        question(
          "evidence",
          "Which observation helps test congestion?",
          [
            "Only a successful ping",
            "Offered load, egress capacity and queue/drop evidence over time",
            "Only a hostname",
          ],
          "Offered load, egress capacity and queue/drop evidence over time",
          "Compare demand, available service and observed queue behavior at the suspected bottleneck.",
        ),
        question(
          "queue",
          "Which named mechanism adds priority service to class-based queuing?",
          ["FIFO", "LLQ", "A larger subnet mask"],
          "LLQ",
          "Separate arrival-order handling from class-based treatment with a priority class.",
        ),
        question(
          "capacity",
          "What can priority treatment establish by itself?",
          ["Unlimited capacity", "No loss under every workload", "Preferential treatment, not added physical capacity"],
          "Preferential treatment, not added physical capacity",
          "A policy distributes scarce service; load and link capacity still constrain the outcome.",
        ),
      ],
      [
        "Observe demand and egress behavior during the symptom, not just reachability.",
        "LLQ can prioritize suitable traffic, but verify actual service objectives and load; it cannot manufacture bandwidth.",
      ],
      "A five-of-five simulator ping is not a QoS measurement.",
    ),
  ],
  sources: [source("Differentiated services architecture — RFC 2475", 2475)],
};

const treatment: Lesson = {
  ...base(
    "qos-treatment",
    "quality-of-service",
    "From classification to treatment",
    "26/27: 11.QoSrv.ppt 25–47; revision — QoS models, marking, shaping and policing.",
    [
      "Separate classification, marking and forwarding treatment.",
      "Compare best effort, IntServ and DiffServ.",
      "Choose shaping versus policing without inventing timing.",
    ],
    [experience.id],
  ),
  sections: [
    section(
      "simple",
      "A label is not a guarantee",
      "Classification decides which traffic belongs to a class. Marking records a value in a header. A configured policy decides what the device actually does with that class or marking.",
    ),
    section(
      "analogy",
      "Labels and handling instructions",
      "A parcel’s service label helps a sorting office choose handling. The label does not create a faster road or force every other office to honor it.\n\nLimit: network treatment uses explicit classification, trust and scheduling rules; an end-to-end guarantee needs more than a label.",
    ),
    section(
      "technical",
      "Choose a model and know the boundary",
      "Best effort gives no service guarantee. IntServ uses per-flow reservation/admission with RSVP signaling. DiffServ groups traffic into classes and applies per-hop behavior; a DSCP alone cannot enforce an end-to-end guarantee.\n\n802.1Q CoS uses a 3-bit Layer 2 priority field. DSCP uses 6 bits in the IP header; the other 2 bits are ECN. Correction: slide 39 calls ECN Layer 2, but ECN is in the IP header, as slide 40 shows. BE is DSCP 0; EF is 46; AF distinguishes classes and drop precedence, not a universal numeric ranking.\n\nEstablish where endpoint marks are trusted or replaced. Shaping buffers eligible excess traffic for later transmission, adding delay. Policing can drop or remark excess according to policy. WRED is congestion avoidance through early probabilistic dropping; it is not the queue scheduler. Queue limits and policy still matter.",
      {
        diagram: map(
          "Classification is not scheduling",
          [
            ["Identify", "Match traffic to a class using supported attributes."],
            ["Mark / trust", "Set, preserve or replace a header value at a defined boundary."],
            ["Treat", "Apply configured queue, bandwidth, shaping or policing policy."],
            ["Verify", "Compare actual classification, counters and service under load."],
          ],
          "A reasoning sequence; actual platform order and available mechanisms vary. No packets are scheduled here.",
        ),
      },
    ),
    section(
      "worked",
      "Read a policy without promising performance",
      "Authored plan: a switch does not trust laptop markings. It classifies approved voice, marks it for the intended class and applies a bounded priority policy at the busy egress. Setting DSCP 46 everywhere would erase useful distinctions.\n\nFor a burst above a contracted rate, a shaper may hold packets; a policer may discard or remark them. Decide whether extra delay is acceptable, then inspect the applied policy and real counters. The current course deck teaches these relationships but supplies no complete verified MQC configuration for this exercise.",
    ),
    section(
      "guided",
      "Guided: identify each job",
      "Match the task to classification, marking or enforcement. The choice must explain what changes, not just repeat a command name.",
    ),
    section(
      "independent",
      "Your turn: untrusted marks and a burst",
      "A laptop marks its backup as high priority. The edge must enforce the organization’s policy, and a separate burst may wait rather than be discarded.",
    ),
  ],
  exercises: [
    activity(
      "treatment-guided",
      "guided",
      "Separate label from behavior",
      [
        question(
          "mark",
          "Writing DSCP 46 is…",
          ["Marking", "Proof of zero jitter", "A bandwidth upgrade"],
          "Marking",
          "A header value is an input to policy, not evidence that the desired service occurred.",
        ),
        question(
          "model",
          "Which model uses per-flow reservation and admission control?",
          ["Best effort", "IntServ", "DiffServ marking alone"],
          "IntServ",
          "Distinguish per-flow resource commitments from aggregate per-hop treatment.",
        ),
        question(
          "bits",
          "Which statement places the fields correctly?",
          [
            "DSCP 6 + ECN 2 bits in IP; CoS 3 bits in an 802.1Q tag",
            "ECN is a Layer 2-only field",
            "DSCP and CoS are the same field",
          ],
          "DSCP 6 + ECN 2 bits in IP; CoS 3 bits in an 802.1Q tag",
          "Identify the encapsulation layer before comparing a field’s width or meaning.",
        ),
      ],
      [
        "Marking writes the header value; treatment requires an applied policy.",
        "IntServ uses per-flow reservation. DSCP and ECN are IP fields; 802.1Q CoS is a separate Layer 2 field.",
      ],
      "Do not turn a DSCP label into an end-to-end performance guarantee.",
    ),
    activity(
      "treatment-independent",
      "independent",
      "Enforce a policy at its boundary",
      [
        question(
          "trust",
          "An untrusted laptop marks backups as voice. The edge should…",
          ["Trust every received mark", "Classify and apply the approved marking policy", "Remove all queuing"],
          "Classify and apply the approved marking policy",
          "The trust boundary defines whose declarations are accepted; a host label is not authorization.",
        ),
        question(
          "burst",
          "Excess packets should wait for later transmission. Choose…",
          ["Shaping", "Policing that drops excess", "An SNMP trap"],
          "Shaping",
          "Holding traffic for later transmission trades buffering and delay against immediate excess handling.",
        ),
        question(
          "proof",
          "After applying policy, useful proof includes…",
          [
            "Only the policy text",
            "Only the largest DSCP number",
            "Applied class/counter evidence and measured service under load",
          ],
          "Applied class/counter evidence and measured service under load",
          "Check both policy attachment and outcomes; configuration intent is not a performance measurement.",
        ),
      ],
      [
        "Reclassify untrusted markings according to the approved policy. Use shaping where buffering excess is intended.",
        "Verify attachment, class matches and outcomes under a documented workload; do not infer latency from the configuration.",
      ],
      "Shaping and policing have different consequences for excess traffic.",
    ),
  ],
  companion: {
    title: "Optional QoS inspection — UNEXECUTED",
    introduction:
      "Original read/measure brief for an authorized device lab. No scheduler, traffic generator or measured Cisco output is provided.",
    steps: [
      "Record platform/version, interfaces, traffic classes and service objectives. Read the platform’s policy/class-map inspection documentation before using any commands.",
      "Inspect a supplied QoS policy and its attachment. Identify matches, trust/remarking, queue/priority limits and shaping versus policing; record the actual supported command output.",
      "Only in an isolated authorized lab, compare counters and application measurements under the same controlled workload before and after an approved change. Record interval, direction, offered load, delay/loss method and rollback.",
      "Explain which observations show configuration and which measure service. Save/reopen the lab and repeat checks; unsupported QoS features remain untested.",
    ],
  },
  sources: [source("ECN in IP — RFC 3168", 3168), source("DiffServ architecture — RFC 2475", 2475)],
};

const platforms: Lesson = {
  ...base(
    "virtual-platforms",
    "virtualization-automation",
    "Separate the service from the hardware",
    "26/27: 12.NETWORKAUTO.ppt 3–16; revision — cloud services/models and hypervisors.",
    [
      "Distinguish cloud service and deployment models.",
      "Compare Type 1 and Type 2 hypervisors.",
      "Identify shared physical dependencies behind logical separation.",
    ],
  ),
  sections: [
    section(
      "simple",
      "Virtual does not mean hardware-free",
      "Virtualization lets logical systems share physical resources. Cloud computing describes how resources are offered and consumed. A VM on your laptop is virtualized; that alone does not make it a cloud service.",
    ),
    section(
      "analogy",
      "Rooms in one building",
      "Separate rooms resemble virtual machines sharing a building’s structure and utilities. Renting a room, a furnished workspace or a complete service resembles different responsibility boundaries.\n\nLimit: VMs have software-enforced isolation and resource allocation. A room analogy does not guarantee security, performance or failover.",
    ),
    section(
      "technical",
      "Service, deployment and execution are different axes",
      "SaaS offers an application; PaaS offers an application development/runtime platform; IaaS offers infrastructure such as compute and networking. Public, private and hybrid describe deployment arrangements. The deck’s custom cloud is industry-focused wording, not an additional universal service tier. Cloud need not mean exclusively off-premises.\n\nA Type 1 hypervisor runs on hardware; a Type 2 runs on a host OS. Guest operating systems run in VMs. Virtual NICs and switching connect logical systems but still depend on configured networking and physical capacity. VRF separates routing contexts; it is not a hypervisor.\n\nConsolidation can reduce equipment and speed provisioning, but one host can become a shared failure dependency. Availability requires an actual redundancy/recovery design, not simply the presence of a hypervisor.",
      {
        diagram: map(
          "Trace a virtual system’s dependencies",
          [
            ["Guest VMs", "Separate operating-system instances and virtual NICs."],
            ["Hypervisor", "Type 1 on hardware; Type 2 through a host OS."],
            ["Physical resources", "CPU, memory, storage and NIC capacity remain finite."],
          ],
          "A dependency map, not a deployed VM or a promise of automatic high availability.",
        ),
      },
    ),
    section(
      "worked",
      "Classify the responsibility boundary",
      "Authored choices: using hosted email is SaaS; deploying code to a managed app runtime is PaaS; managing an OS on rented virtual compute is IaaS. None tells you whether deployment is public, private or hybrid.\n\nTwo independent VMs on the same failed physical host may both stop. A tested spare-host recovery procedure addresses a different question from logical isolation.",
    ),
    section(
      "guided",
      "Guided: classify the arrangement",
      "Identify the service offered and the layer that hosts the guests. Avoid selecting a product name from memory.",
    ),
    section(
      "independent",
      "Your turn: a consolidation proposal",
      "A team proposes moving two services into two VMs on one host. They claim this guarantees fault tolerance and creates separate routing tables automatically.",
    ),
  ],
  exercises: [
    activity(
      "platforms-guided",
      "guided",
      "Identify service and execution layers",
      [
        question(
          "service",
          "A provider offers a managed runtime for your application code. This is…",
          ["PaaS", "Only a Type 2 hypervisor", "SaaS email"],
          "PaaS",
          "Classify the responsibility boundary: using an application differs from deploying code to a managed platform.",
        ),
        question(
          "host",
          "The hypervisor runs directly on hardware. It is…",
          ["Type 2", "Type 1", "An OID"],
          "Type 1",
          "Look for whether a separate host operating system sits below the hypervisor.",
        ),
        question(
          "deployment",
          "Public/private/hybrid describes…",
          ["Cloud deployment arrangement", "The number of VM CPUs", "A DSCP value"],
          "Cloud deployment arrangement",
          "Service type and deployment arrangement answer different questions.",
        ),
      ],
      [
        "A managed application runtime is PaaS; the deployment may still be public, private or hybrid.",
        "Type 1 runs on hardware; Type 2 uses an existing host OS.",
      ],
      "Virtualization and cloud are related, but they are not synonyms.",
    ),
    activity(
      "platforms-independent",
      "independent",
      "Find the hidden physical dependency",
      [
        question(
          "failure",
          "Two VMs share one failed host. What should you investigate?",
          ["The shared hardware and recovery design", "Only different VM names", "Assume automatic survival"],
          "The shared hardware and recovery design",
          "Logical separation does not remove shared power, storage, NIC or host dependencies.",
        ),
        question(
          "routing",
          "Which concept separates routing contexts?",
          ["VRF", "NTP stratum", "A syslog severity"],
          "VRF",
          "Separate route-table context from operating-system virtualization and monitoring metadata.",
        ),
        question(
          "claim",
          "Before claiming high availability, require…",
          ["A hypervisor screenshot", "Tested redundancy and recovery evidence", "An additional VM icon"],
          "Tested redundancy and recovery evidence",
          "A design claim needs a demonstrated recovery path and known shared dependencies.",
        ),
      ],
      [
        "The host is still a shared dependency; plan and test recovery rather than assuming it.",
        "VRF is a separate routing-context concept. VM count does not establish either routing separation or availability.",
      ],
      "More logical instances do not necessarily mean more independent failure domains.",
    ),
  ],
  sources: [
    {
      title: "NIST cloud definition — service and deployment models",
      url: "https://csrc.nist.gov/pubs/sp/800/145/final",
    },
  ],
};

const control: Lesson = {
  ...base(
    "sdn-control",
    "virtualization-automation",
    "Follow a decision from controller to device",
    "26/27: 12.NETWORKAUTO.ppt 17–37, 63–72; revision — SDN planes/types, APIs and intent.",
    [
      "Distinguish control-plane decisions from data-plane forwarding.",
      "Locate northbound and southbound interactions.",
      "Connect intent translation, activation and assurance.",
    ],
    [platforms.id],
  ),
  sections: [
    section(
      "simple",
      "Decide and forward are different jobs",
      "The control plane builds decisions and state. The data plane forwards traffic using installed information. A controller can coordinate policy without being the path every user packet traverses.",
    ),
    section(
      "analogy",
      "Traffic planning and junction handling",
      "A planning office sets road policy; junction equipment applies local rules. This resembles coordinated control and device forwarding.\n\nLimit: SDN has explicit APIs and installed tables. Controllers may be distributed, and packets do not necessarily ask a central office for permission one by one.",
    ),
    section(
      "technical",
      "Use the course’s layers carefully",
      "Traditional devices keep local control and forwarding functions. In the course’s SDN model, a logically centralized controller coordinates the data plane. Northbound APIs connect applications and controller; southbound interfaces connect controller and network devices. OpenFlow is one southbound protocol, not a synonym for all SDN.\n\nA flow table matches packets to actions; group tables organize action groups; meter tables apply metering. CEF illustrates installed FIB/adjacency information supporting local forwarding. The course’s first-flow controller story is one model, not a rule for every packet or deployment.\n\nDevice-based, controller-based and policy-based describe increasing abstraction in the lecture. ACI uses APIC policy with a Nexus leaf/spine fabric; APIC is not a transit hop. OpenStack orchestrates cloud infrastructure. Course names such as OnePK and APIC-EM are historical examples, not current installation recommendations.\n\nIntent-Based Networking: translation expresses intent as policy; activation installs it; assurance checks whether observed behavior still meets intent. Cisco DNA Center is the course’s named platform example.",
      {
        diagram: map(
          "Applications, controller and forwarding",
          [
            ["Application", "Express desired behavior through a northbound API."],
            ["Controller", "Coordinate policy; use a southbound interface toward devices."],
            ["Device data plane", "Apply installed forwarding information to traffic."],
          ],
          "Logical responsibility, not physical rack placement or a claim that every packet visits the controller.",
        ),
      },
    ),
    section(
      "worked",
      "Installed policy still needs proof",
      "Authored intent: only the approved group should reach a service. Translate this into policy, activate it, then test both permitted and prohibited paths and inspect policy state. A successful controller API response proves neither correct device installation nor the desired user outcome.\n\nA leaf/spine diagram also does not mean every physical endpoint pair is one Ethernet hop apart; count the actual path. The lecture’s abstraction is not a packet trace.",
    ),
    section(
      "guided",
      "Guided: locate the responsibility",
      "Follow an application request down to the controller and device. Distinguish installed policy from packet handling.",
    ),
    section(
      "independent",
      "Your turn: successful activation, wrong outcome",
      "The platform reports that a policy change was accepted. An unauthorized path still works. Decide which part of the intent loop needs evidence.",
    ),
  ],
  exercises: [
    activity(
      "control-guided",
      "guided",
      "Locate the control relationship",
      [
        question(
          "north",
          "An application calls the controller. This is the…",
          ["Northbound relationship", "Southbound relationship", "Physical power plane"],
          "Northbound relationship",
          "Name the relationship by its endpoints, not the direction of a drawing on the page.",
        ),
        question(
          "south",
          "The controller programs forwarding devices through a…",
          ["Southbound interface", "VM guest disk", "Syslog severity"],
          "Southbound interface",
          "Separate application-to-controller requests from controller-to-device interactions.",
        ),
        question(
          "packet",
          "A device uses an installed entry to forward a packet in its…",
          ["Data plane", "Course revision outline", "Cloud billing model"],
          "Data plane",
          "Making or distributing a rule differs from applying installed forwarding information.",
        ),
      ],
      [
        "Applications use the northbound relationship; controllers communicate with devices southbound.",
        "The data plane applies installed forwarding information. The controller need not carry the user packet.",
      ],
      "Northbound/southbound describes API roles, not compass direction or every packet’s route.",
    ),
    activity(
      "control-independent",
      "independent",
      "Verify intent after activation",
      [
        question(
          "loop",
          "Checking whether live behavior matches intent is…",
          ["Assurance", "Only translation", "Only activation"],
          "Assurance",
          "Acceptance and installation are intermediate steps; compare the resulting behavior with the original intent.",
        ),
        question(
          "tests",
          "Which proof fits an access policy?",
          [
            "Only a successful API response",
            "Permitted and prohibited path checks plus installed policy",
            "Only a controller logo",
          ],
          "Permitted and prohibited path checks plus installed policy",
          "A policy has both positive and negative requirements; one permitted probe cannot establish both.",
        ),
        question(
          "aci",
          "In the course’s ACI model, APIC primarily…",
          [
            "Defines/programs policy for the fabric",
            "Forwards every user packet itself",
            "Replaces all physical links",
          ],
          "Defines/programs policy for the fabric",
          "Distinguish policy coordination from the leaf switches’ forwarding work.",
        ),
      ],
      [
        "Assurance checks actual results against intent after activation.",
        "Inspect installed policy and both permitted/prohibited behavior; APIC coordinates policy rather than serving as the user traffic transit path.",
      ],
      "An accepted request is not evidence of the desired end-to-end outcome.",
    ),
  ],
  sources: [source("SDN terminology and architecture — RFC 7426", 7426)],
};

const requests: Lesson = {
  ...base(
    "automation-requests",
    "virtualization-automation",
    "Read a request before automating it",
    "26/27: 12.NETWORKAUTO.ppt 38–62; revision — formats, APIs, URI, requests and configuration tools.",
    [
      "Recognize structured data and request components.",
      "Distinguish read operations from changes.",
      "Plan scoped, verified automation without running arbitrary code.",
    ],
    [control.id],
  ),
  sections: [
    section(
      "simple",
      "Automation repeats instructions, including mistakes",
      "An API defines how software requests data or a service. Structured formats help both sides interpret a request. Automation can make a correct task repeatable, but it can also repeat a wrong target or value very quickly.",
    ),
    section(
      "analogy",
      "A form with named fields",
      "A request resembles a form: its destination, action and fields matter. JSON, XML and YAML offer different ways to structure those fields.\n\nLimit: syntax alone is not authorization or a valid device configuration. The API’s contract determines allowed values, operations and responses.",
    ),
    section(
      "technical",
      "Separate format, operation and workflow",
      'JSON uses objects, arrays and typed values; XML uses elements and attributes; YAML commonly uses indentation and mappings/sequences. They are formats, not protocols that execute commands. A Boolean false is not the string "false".\n\nREST is an architectural style; HTTP APIs use methods and resource URIs. GET requests a representation; POST processes a request, PUT replaces a target representation, PATCH applies a partial change and DELETE requests removal, subject to the API contract. Inspect status and response content. Stateless interactions do not prohibit a server from storing resources; caching must follow response rules, not assume every response is public.\n\nPublic/private/partner APIs describe access arrangements; even public APIs may require authorization and limits. SOAP, XML-RPC and JSON-RPC are other course-listed service styles. NETCONF/RESTCONF are introduced as device-management alternatives; detailed model/path authoring is outside this lesson.\n\nAutomation performs a task; orchestration coordinates tasks. The course lists Ansible, Chef, Puppet and SaltStack. Its push/agentless and pull/agent-based examples are teaching patterns, not universal tool restrictions. Limit targets, review differences, protect credentials, plan rollback and verify outcomes.',
    ),
    section(
      "worked",
      "An original read-only request",
      "Authored example only: a client asks the inventory service for one interface. It must interpret an actual response before claiming success. The example below is request-reading material, not a live API endpoint or captured server response.\n\nThe three local payload examples express the same name and Boolean state. This lets you reason about structure without assuming programming experience. Check the destination and operation before automating a similar request.",
      {
        code: 'Illustrative request — NOT SENT\nGET https://inventory.example/interfaces/edge-a\n\nAuthored equivalent data examples\nJSON: {"name":"edge-a","enabled":false}\nXML: <interface><name>edge-a</name>\n     <enabled>false</enabled></interface>\nYAML:\n  name: edge-a\n  enabled: false',
        diagram: map(
          "A safe automation workflow",
          [
            ["Before", "Confirm target, permissions, intended difference and rollback."],
            ["During", "Apply only the approved scope; inspect actual status and errors."],
            ["After", "Verify device state and service; retain a record of what changed."],
          ],
          "A human-reviewed workflow, not an executing script or a controller backend.",
        ),
      },
    ),
    section(
      "guided",
      "Guided: read the request",
      "Identify the operation, resource and value type. No network call is made by these questions.",
    ),
    section(
      "independent",
      "Your turn: a change across many devices",
      "A team wants to apply one configuration to 40 devices. The first API response says the request was accepted. Decide what is still required.",
    ),
  ],
  exercises: [
    activity(
      "requests-guided",
      "guided",
      "Read structure without running it",
      [
        question(
          "method",
          "Which method is appropriate for requesting the example representation?",
          ["GET", "DELETE", "An SNMP SET"],
          "GET",
          "Identify whether the task observes a representation or asks to change/remove something.",
        ),
        question(
          "value",
          "In JSON, enabled: false represents…",
          ["A Boolean value", 'The string "false"', "An executed shutdown command"],
          "A Boolean value",
          "Value type matters. A structured value is not automatically an executable instruction.",
        ),
        question(
          "resource",
          "In the example URL, /interfaces/edge-a identifies…",
          ["The resource path", "An API password", "The physical cable speed"],
          "The resource path",
          "Separate the server location and requested resource from credentials and payload data.",
        ),
      ],
      [
        "GET requests the resource representation; /interfaces/edge-a is its path.",
        "The unquoted JSON false is Boolean. A payload must still be interpreted under the API’s contract.",
      ],
      "Recognizing JSON syntax does not prove the payload is valid configuration.",
    ),
    activity(
      "requests-independent",
      "independent",
      "Control the scope of automation",
      [
        question(
          "prepare",
          "Before applying to 40 devices, choose…",
          [
            "Run everywhere immediately",
            "Review a scoped diff, test a small approved subset and plan rollback",
            "Store credentials in a public example",
          ],
          "Review a scoped diff, test a small approved subset and plan rollback",
          "Repetition increases the impact of an incorrect target or value; establish a controlled scope first.",
        ),
        question(
          "response",
          "An accepted API request establishes…",
          [
            "Every service is now correct",
            "All changes persist after reload",
            "Acceptance only; inspect state and service next",
          ],
          "Acceptance only; inspect state and service next",
          "Separate request acceptance, completed application, persistence and observed service outcomes.",
        ),
        question(
          "workflow",
          "Coordinating backup, change and verification tasks is…",
          ["Orchestration", "A DSCP marking", "Only JSON serialization"],
          "Orchestration",
          "A coordinated workflow differs from a single automated task or its data encoding.",
        ),
      ],
      [
        "Review the intended difference and test an approved small scope with rollback available.",
        "Inspect actual completion, device state and service. Coordinating these tasks is orchestration; record what really happened.",
      ],
      "A successful response does not erase the need for independent verification.",
    ),
  ],
  companion: {
    title: "Optional API/configuration practice — UNEXECUTED",
    introduction:
      "Original offline-first request-reading brief; no request, controller or automation tool was executed. Use only an explicitly authorized disposable environment for the optional live part.",
    steps: [
      "Read a supplied API contract. Identify server, resource, method, authentication, payload types and expected error/status meanings. Start with a read operation; never paste credentials into this exercise.",
      "Translate one small local object between JSON, XML and YAML. Explain which values are strings versus Booleans. This is data interpretation, not NETCONF/RESTCONF schema competence.",
      "If an authorized test service is available, use its documented read operation and save the actual request/status/body with secrets removed. Otherwise keep the work labeled UNEXECUTED; do not manufacture a response.",
      "For a separately approved disposable change, prepare a diff and rollback, test a limited target set, verify state/service and persistence after save/reopen. Describe how an orchestrated workflow would stop on error rather than blindly continuing.",
    ],
  },
  sources: [source("HTTP method semantics — RFC 9110", 9110), source("JSON data types — RFC 8259", 8259)],
};

export const operationsLessons: Lesson[] = [visibility, events, experience, treatment, platforms, control, requests];
