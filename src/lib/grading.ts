import type { Diagnosis, Feedback, Observation, Scenario } from "./schema";
export function grade(s: Scenario, answer: Diagnosis, history: Observation[], timedOut = false): Feedback {
  const selected = history.filter((o) => answer.evidence.includes(o.id) && (!o.scenario || o.scenario === s.id));
  const checks = s.evidenceRules.map((rule) => ({
    ...rule,
    met: rule.requirements.every((r) =>
      selected.some((o) => r.devices.includes(o.device) && r.commands.includes(o.command)),
    ),
  }));
  const exactDevices = [...new Set(answer.devices)].sort().join(",") === [...s.fault.devices].sort().join(",");
  if ("vlan" in s.repair) {
    const repair = s.repair;
    const port = s.devices.find((d) => d.id === repair.device)!.ports!.find((p) => p.name === repair.interface)!;
    const correctCause = answer.cause === s.fault.cause;
    const correctObserved = answer.observedVlan === port.vlan;
    const correctInterface = answer.interface?.toLowerCase() === repair.interface.toLowerCase();
    const correctFix =
      exactDevices && correctInterface && s.acceptedFixes.includes(answer.fix) && answer.intendedVlan === repair.vlan;
    const parts = [
      {
        name: "Root cause and observed VLAN",
        earned: (correctCause ? 20 : 0) + (correctObserved ? 10 : 0),
        possible: 30,
        message: `Cause: ${correctCause ? "correct" : "incorrect"} (20). Observed access VLAN: ${correctObserved ? "correct" : "incorrect or missing"} (10).`,
      },
      {
        name: "Affected device and interface",
        earned: (exactDevices ? 10 : 0) + (correctInterface ? 10 : 0),
        possible: 20,
        message: `Device: ${exactDevices ? "correct" : "incorrect"}. Interface: ${correctInterface ? "correct" : "incorrect or missing"}. Each contributes 10 points.`,
      },
      {
        name: "Supporting evidence",
        earned: checks.reduce((n, c) => n + (c.met ? c.points : 0), 0),
        possible: 30,
        message: checks.map((c) => `${c.label}: ${c.met ? "captured" : "missing"}.`).join(" "),
      },
      {
        name: "Remediation",
        earned: correctFix ? 20 : 0,
        possible: 20,
        message: correctFix
          ? "The intended VLAN is applied to the correct device and access port."
          : "Repair must target the documented device, port and intended VLAN. Changing a host gateway does not fix access membership.",
      },
    ];
    return {
      score: parts.reduce((n, p) => n + p.earned, 0),
      parts,
      explanation: s.explanation,
      solution: s.solution,
      timedOut,
      lesson: s.lesson,
    };
  }
  const hostRepair = "gateway" in s.repair;
  const fixCorrect =
    s.acceptedFixes.includes(answer.fix) &&
    (!hostRepair || ("gateway" in s.repair && answer.gateway?.trim() === s.repair.gateway));
  const reasonCorrect = "gateway" in s.repair && answer.reason === s.repair.reason;
  const parts = [
    {
      name: "Root cause",
      earned: answer.cause === s.fault.cause ? 30 : 0,
      possible: 30,
      message:
        answer.cause === s.fault.cause
          ? "Correct configuration fault identified."
          : "The selected cause does not match the observed fault. Review the explanation below.",
    },
    {
      name: hostRepair ? "Affected device" : "Affected adjacency",
      earned: exactDevices ? 20 : 0,
      possible: 20,
      message: hostRepair
        ? exactDevices
          ? "The device with the incorrect setting is identified."
          : "Identify the device containing the wrong setting, not every affected host."
        : exactDevices
          ? "Both endpoints of the failed adjacency identified."
          : "Select the two routers whose intended adjacency fails, not every downstream host.",
    },
    {
      name: "Supporting evidence",
      earned: checks.reduce((n, c) => n + (c.met ? c.points : 0), 0),
      possible: 30,
      message: checks.map((c) => `${c.label}: ${c.met ? "captured" : "missing"}.`).join(" "),
    },
    {
      name: "Remediation",
      earned: hostRepair ? (fixCorrect ? 10 : 0) + (reasonCorrect ? 10 : 0) : fixCorrect ? 20 : 0,
      possible: 20,
      message: hostRepair
        ? `Gateway correction: ${fixCorrect ? "correct" : "incorrect or missing"}. Forwarding explanation: ${reasonCorrect ? "correct" : "incorrect or missing"}. Each contributes 10 points; free-text notes are not graded.`
        : fixCorrect
          ? "Repair preserves the documented design."
          : "The selected repair does not restore the documented design. Review the worked repair below.",
    },
  ];
  return {
    score: parts.reduce((n, p) => n + p.earned, 0),
    parts,
    explanation: s.explanation,
    solution: s.solution,
    timedOut,
    ...(s.lesson ? { lesson: s.lesson } : {}),
  };
}
export function nextHint(s: Scenario, count: number) {
  return s.hints[Math.min(count, s.hints.length - 1)];
}
