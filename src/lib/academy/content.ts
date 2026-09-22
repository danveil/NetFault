import { academy as original, references } from "./content-v1";
import { academySchema, type Exercise, type Lesson, type Diagram } from "./schema";
export { references };

const hints: Record<string, Record<string, string>> = {
  "valid-format": {
    valid: "Check the number of groups and the range of every octet; familiarity is not a format rule.",
    range: "Compare each octet with the range that eight bits can hold.",
    count: "Count the groups separated by dots before checking their values.",
  },
  "read-octets": { boundary: "What information specifies where the network portion ends?" },
  "local-remote": {
    peer: "Apply the configured mask to both the source and this destination, then compare the results.",
    other: "Compare masked network portions rather than just the first two octets.",
    gateway: "Classify the interface address by its prefix, rather than the device's role.",
  },
  "next-hop": {
    network: "Clear host bits in the source address; do not use the destination to name the host's subnet.",
    location: "Compare source and destination after applying the mask.",
    hop: "Separate the final packet destination from the immediate on-link receiver of its frame.",
    evidence: "Choose observations that can distinguish configuration problems from other reasons for a timeout.",
  },
};
// Plausible distractors represent wrong block sizes, copying the host, or using reserved endpoints.
const addressOptions: Record<string, Record<string, string[]>> = {
  "guided-subnet": {
    network: ["192.168.50.140", "192.168.50.64", "192.168.50.128", "192.168.50.0"],
    broadcast: ["192.168.50.190", "192.168.50.255", "192.168.50.192", "192.168.50.191"],
    first: ["192.168.50.129", "192.168.50.128", "192.168.50.140", "192.168.50.1"],
    last: ["192.168.50.191", "192.168.50.254", "192.168.50.190", "192.168.50.192"],
  },
  "independent-subnet": {
    network: ["172.16.4.0", "172.16.4.77", "172.16.4.96", "172.16.4.64"],
    broadcast: ["172.16.4.95", "172.16.4.127", "172.16.4.96", "172.16.4.94"],
    first: ["172.16.4.64", "172.16.4.65", "172.16.4.77", "172.16.4.97"],
    last: ["172.16.4.126", "172.16.4.95", "172.16.4.94", "172.16.4.96"],
  },
  "next-hop": {
    network: ["172.16.9.0", "172.16.8.25", "172.16.8.0", "172.16.8.1"],
    hop: ["172.16.9.70", "172.16.8.25", "172.16.9.1", "172.16.8.1"],
    evidence: [
      "Compare local and remote ping results, then infer a gateway fault without checking configuration",
      "Compare ipconfig, router LAN addressing, and local versus remote pings",
      "Confirm the host address is valid, then investigate only the remote PC",
      "Use only an ARP entry to conclude that onward and return routing work",
    ],
  },
};
function touchExercise(previous: Exercise): Exercise {
  const fields: Exercise["fields"] = previous.fields.map((field) => ({
    ...field,
    kind: "choice",
    answer: String(field.answer),
    choices:
      addressOptions[previous.id]?.[field.id] ?? (field.kind === "choice" ? field.choices : ["16", "90", "172", "5"]),
    explanation: hints[previous.id]?.[field.id] ?? field.explanation,
  }));
  if (previous.id.endsWith("subnet"))
    fields.unshift({
      id: "host-bits",
      kind: "choice",
      label: "How many host bits remain?",
      choices: ["4", "6", "8", "5"],
      answer: previous.id === "guided-subnet" ? "6" : "5",
      explanation: "An IPv4 address has 32 bits. Subtract the prefix length before finding the block size.",
    });
  return { ...previous, revision: 2, inputKind: "tap-steps", solutionPolicy: "requested-only", fields };
}
const diagrams: Record<string, Partial<Record<Lesson["sections"][number]["kind"], Diagram>>> = {
  "ipv4-addresses": {
    worked: {
      kind: "octets",
      address: "192.168.10.25",
      caption: "One address, four equal-sized octets. Decimal values differ; each octet still occupies eight bits.",
    },
  },
  "ipv4-subnets": {
    technical: {
      kind: "mask",
      address: "192.168.10.70",
      prefix: 26,
      caption:
        "The first 24 bits stay unchanged. In the final octet, /26 keeps two network bits and clears six host bits.",
    },
    worked: {
      kind: "range",
      address: "192.168.10.70",
      prefix: 26,
      caption:
        "A /26 spans 64 addresses. The two endpoints are reserved in this ordinary subnet; the 62 middle addresses are usable hosts. Not a distance scale.",
    },
  },
  "ipv4-gateway-arp": {
    technical: {
      kind: "delivery",
      caption:
        "Same final destination IP throughout the journey; the immediate Ethernet receiver depends on the route. Assumes the connected /24 and default route only.",
    },
    worked: {
      kind: "arp",
      caption:
        "Conceptual Ethernet handoff when the gateway mapping is not already cached. ARP resolves the chosen on-link next hop, not the remote host.",
    },
  },
};
// Whitespace-only pacing preserves the authored words, examples and limitations.
function paragraphs(body: string) {
  const sentences = body.split(/(?<=[.!?])\s+(?=[A-Z])/);
  return sentences
    .map((sentence, index) => sentence + (index === sentences.length - 1 ? "" : index % 2 ? "\n\n" : " "))
    .join("");
}
export const academy = academySchema.parse({
  modules: original.modules.map((item) => ({ ...item, revision: 2 })),
  lessons: original.lessons.map((lesson) => ({
    ...lesson,
    revision: 2,
    sections: lesson.sections.map((section) => ({
      ...section,
      body: paragraphs(section.body),
      diagram: diagrams[lesson.id]?.[section.kind],
    })),
    exercises: lesson.exercises.map(touchExercise),
  })),
});
export function lessonRevision(id: string, revision: number): Lesson | undefined {
  return (revision === 1 ? original : academy).lessons.find(
    (lesson) => lesson.id === id && lesson.revision === revision,
  );
}
