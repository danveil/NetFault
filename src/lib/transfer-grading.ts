import type { Diagnosis, Feedback, Observation, RepairAction, Scenario } from "./schema";
import type { Foundation } from "./transfer-contract";
import { connectivity } from "./engine";
import { trialNetwork } from "./repair-trial";
import { evidenceIsCurrent, evidenceVersion, verifiedEvidence } from "./evidence";

type Check = Foundation["verification"]["current"][number];
function matches(state: Scenario, o: Observation, check: Pick<Check, "device" | "target" | "source">) {
  if (o.device !== check.device || (check.target !== undefined && o.target !== check.target)) return false;
  if (!check.source) return !o.source;
  return (
    !!o.source &&
    connectivity(state, o.device, o.target, o.source).source ===
      connectivity(state, check.device, check.target!, check.source).source
  );
}
function captured(state: Scenario, observations: Observation[], check: Check) {
  return observations.some((o) => check.commands.includes(o.command) && matches(state, o, check));
}

// Only the privately bound cell/order may differ. Success is computed by real
// forwarding and policy controls, never a canonical preview or a chosen answer.
function preservesSurroundings(original: Scenario, actual: Scenario) {
  const before = structuredClone(original.devices),
    after = structuredClone(actual.devices),
    r = original.repair;
  if ("acl" in r) {
    for (const devices of [before, after]) {
      const acl = devices.find((d) => d.id === r.device)?.acls?.find((a) => a.name === r.acl);
      if (!acl) return false;
      acl.entries.sort((a, b) => a.id.localeCompare(b.id));
      for (const entry of acl.entries) entry.sequence = 1;
    }
  } else if ("vlan" in r && !("priority" in r)) {
    const a = after.find((d) => d.id === r.device)?.ports?.find((p) => p.name === r.interface);
    const b = before.find((d) => d.id === r.device)?.ports?.find((p) => p.name === r.interface);
    if (!a || !b || a.vlan !== r.vlan) return false;
    a.vlan = b.vlan;
  } else return false;
  return JSON.stringify(before) === JSON.stringify(after);
}

export function gradeFoundation(
  s: Scenario,
  answer: Diagnosis,
  history: Observation[],
  timedOut: boolean,
  repairs: RepairAction[],
): Feedback {
  if (s.schemaVersion !== 15 || !s.foundation || !("interface" in s.repair))
    throw Error("Invalid foundation grading contract");
  const v = s.foundation.verification,
    actual = trialNetwork(s, repairs);
  const selected = verifiedEvidence(s, history, answer.evidence, repairs);
  const original = selected.filter((o) => evidenceVersion(o) === 0);
  const fresh = repairs.length ? selected.filter((o) => evidenceIsCurrent(o, repairs)) : [];
  const before = v.original.map((check) => captured(s, original, check));
  const current = v.current.map(
    (check) =>
      captured(actual, fresh, check) &&
      (!check.target || connectivity(actual, check.device, check.target, check.source).ok),
  );
  const flows = v.flows.map((flow) => {
    const result = connectivity(actual, flow.device, flow.target, flow.source);
    // An excluded control must actually hit policy; an unrelated link/route
    // failure is not evidence that a healthy restriction was retained.
    const met =
      result.ok === flow.permitted && (flow.permitted || !!(result.outward.policyDrop ?? result.returning?.policyDrop));
    return { met, captured: fresh.some((o) => o.command === "ping" && matches(actual, o, flow)) };
  });
  const recovered = repairs.length > 0 && preservesSurroundings(s, actual) && flows.every((f) => f.met);
  const verified = recovered && current.every(Boolean) && flows.every((f) => f.captured);
  const exactDevices = [...new Set(answer.devices)].sort().join() === [...s.fault.devices].sort().join();
  const parts = [
    {
      name: "Root cause",
      earned: answer.cause === s.fault.cause ? 20 : 0,
      possible: 20,
      message: "The structured cause is compared with the privately authored fault. Notes are not graded.",
    },
    {
      name: "Fault location",
      earned: exactDevices && answer.interface === s.repair.interface ? 10 : 0,
      possible: 10,
      message: "Identify the device and interface containing the configuration fault.",
    },
    {
      name: "Original supporting evidence",
      earned: Math.floor((30 * before.filter(Boolean).length) / before.length),
      possible: 30,
      message: `${before.filter(Boolean).length}/${before.length} authentic original-state checks selected.`,
    },
    {
      name: "Applied recovery",
      earned: recovered && s.acceptedFixes.includes(answer.fix) ? 20 : 0,
      possible: 20,
      message: recovered
        ? "Replayed changes restore permitted flows and retain exclusions and surrounding configuration."
        : "Actual recovery with unchanged surrounding configuration and retained policy is not established.",
    },
    {
      name: "Fresh multi-layer verification",
      earned: verified ? 20 : 0,
      possible: 20,
      message: verified
        ? "Current configuration, local, routing, policy and reciprocal service checks verified."
        : "Select authentic observations from the latest configuration version for every required layer and flow.",
    },
  ];
  return {
    score: parts.reduce((n, p) => n + p.earned, 0),
    parts,
    recovery: verified ? "verified" : recovered ? "recovered-unverified" : "unresolved",
    explanation: s.explanation,
    solution: s.solution,
    lesson: s.lesson,
    timedOut,
  };
}
