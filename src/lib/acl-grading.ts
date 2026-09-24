import type { Diagnosis, Feedback, Observation, RepairAction, Scenario } from "./schema";
import { connectivity, execute } from "./engine";
import { trialNetwork } from "./repair-trial";
import { evaluateAcl } from "./acl";

export function gradeAcl(
  s: Scenario,
  answer: Diagnosis,
  history: Observation[],
  timedOut: boolean,
  repairs: RepairAction[],
): Feedback {
  if (!("acl" in s.repair) || !s.policyChecks?.length) throw Error("Invalid policy grading contract");
  const repair = s.repair;
  const actual = trialNetwork(s, repairs);
  const selected = history.filter(
    (o) => answer.evidence.includes(o.id) && o.scenario === s.id && !o.output.startsWith("%"),
  );
  const original = selected.filter(
    (o) => !o.repairIndex && o.output === execute(s, o.device, o.command, o.target, [], o.source),
  );
  const controls = s.policyChecks.map((p) => {
    const result = connectivity(actual, p.device, p.target, p.source);
    const drop = result.outward.policyDrop ?? result.returning?.policyDrop;
    return {
      ...p,
      met:
        result.ok === p.permitted &&
        (p.permitted ||
          (drop?.device === repair.device && drop.interface === repair.interface && drop.acl === repair.acl)),
    };
  });
  // Remove ordering identifiers only; no changed address, route, attachment, predicate or action is allowed.
  const policyInvariant = (network: Scenario) =>
    JSON.stringify(
      network.devices.map((d) => ({
        ...d,
        ...(d.acls
          ? {
              acls: d.acls.map((a) => ({
                ...a,
                entries: a.entries
                  .map((e) => ({ id: e.id, action: e.action, source: e.source }))
                  .sort((a, b) => a.id.localeCompare(b.id)),
              })),
            }
          : {}),
      })),
    );
  const recovered =
    repairs.length > 0 && policyInvariant(actual) === policyInvariant(s) && controls.every((p) => p.met);
  const fresh = selected.filter(
    (o) =>
      repairs.length > 0 &&
      o.repairIndex === repairs.length &&
      o.output === execute(actual, o.device, o.command, o.target, [], o.source),
  );
  const verified =
    recovered &&
    ["show access-lists", "show running-config"].every((command) =>
      fresh.some((o) => o.device === repair.device && o.command === command),
    ) &&
    controls
      .filter((p) => p.fresh)
      .every((p) =>
        fresh.some(
          (o) =>
            o.device === p.device &&
            o.command === "ping" &&
            o.target === p.target &&
            (p.source
              ? !!o.source && connectivity(actual, o.device, o.target, o.source).source === p.source
              : !o.source),
        ),
      );
  const baseline = s.policyChecks.find((p) => p.permitted && !p.source)!;
  const checks = s.evidenceRules.map((rule) => ({
    ...rule,
    met:
      rule.requirements.length > 0 &&
      rule.requirements.every(
        (r) =>
          r.devices.length > 0 &&
          r.commands.length > 0 &&
          original.some(
            (o) =>
              r.devices.includes(o.device) &&
              r.commands.includes(o.command) &&
              (o.command !== "ping" ||
                (o.device === baseline.device &&
                  o.target === baseline.target &&
                  !connectivity(s, o.device, o.target, o.source).ok)),
          ),
      ),
  }));
  const exactDevice = [...new Set(answer.devices)].sort().join() === [...s.fault.devices].sort().join();
  const first = evaluateAcl(
    s.devices.find((d) => d.id === repair.device)!.acls!.find((a) => a.name === repair.acl)!,
    connectivity(s, baseline.device, baseline.target).source!,
  );
  const parts = [
    {
      name: "Root cause",
      earned: answer.cause === s.fault.cause && answer.observedSequence === first.sequence ? 20 : 0,
      possible: 20,
      message: "Identify the initial first matching entry, rather than assuming a later permit is effective.",
    },
    {
      name: "Policy location",
      earned:
        (exactDevice ? 5 : 0) +
        (exactDevice &&
        answer.interface?.toLowerCase() === repair.interface.toLowerCase() &&
        answer.aclName === repair.acl
          ? 5
          : 0),
      possible: 10,
      message: "Connect the router, interface and ACL identity using the actual outbound attachment.",
    },
    {
      name: "Supporting evidence",
      earned: checks.reduce((sum, r) => sum + (r.met ? r.points : 0), 0),
      possible: 30,
      message: checks.map((r) => `${r.label}: ${r.met ? "captured" : "missing"}.`).join(" "),
    },
    {
      name: "Applied repair and mechanism",
      earned: (recovered && s.acceptedFixes.includes(answer.fix) ? 15 : 0) + (answer.reason === repair.reason ? 5 : 0),
      possible: 20,
      message: `Policy-preserving applied recovery: ${recovered ? "established" : "not established"}. A permitted flow and a retained restriction must both hold. Notes are not graded.`,
    },
    {
      name: "Fresh recovery verification",
      earned: verified ? 20 : 0,
      possible: 20,
      message: verified
        ? "Current policy views, reciprocal permitted traffic and an explicit excluded-source control are recorded and selected."
        : "Select current ACL and attachment outputs, both permitted host directions and an explicitly sourced excluded control after the latest change. Old versions cannot verify this state.",
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
