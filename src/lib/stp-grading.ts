import type { Scenario, Diagnosis, Observation, RepairAction, Feedback } from "./schema";
import { trialNetwork } from "./repair-trial";
import { connectivity, execute, repaired } from "./engine";
import { stpState, stpLinks } from "./stp";

export function stpRecovered(s: Scenario, current: Scenario) {
  const design = s.stpDesign!;
  const invariant = (n: Scenario) =>
    JSON.stringify({
      links: n.links,
      devices: n.devices.map((d) => (d.id === design.root && d.stp ? { ...d, stp: { ...d.stp, priority: 0 } } : d)),
    });
  const switches = current.devices.filter((d) => d.stp),
    root = switches.find((d) => d.id === design.root)!;
  const state = stpState(current),
    expected = stpState(repaired(s));
  const edges = stpLinks(current)
    .filter((l) => state[l.a.device] && state[l.b.device])
    .map((l) => l.id)
    .sort();
  const hosts = current.devices.filter((d) => d.kind === "pc");
  return (
    invariant(s) === invariant(current) &&
    switches.every((d) => d.id === root.id || root.stp!.priority < d.stp!.priority) &&
    Object.entries(state).every(
      ([id, b]) =>
        b.root === design.root &&
        b.cost === expected[id].cost &&
        b.rootPort === expected[id].rootPort &&
        JSON.stringify(b.ports) === JSON.stringify(expected[id].ports),
    ) &&
    JSON.stringify(edges) === JSON.stringify([...design.edges].sort()) &&
    hosts.every((a) =>
      hosts.filter((b) => b.id !== a.id).every((b) => connectivity(current, a.id, b.interfaces[0].ip).ok),
    )
  );
}
export function gradeStp(
  s: Scenario,
  answer: Diagnosis,
  history: Observation[],
  timedOut: boolean,
  repairs: RepairAction[],
): Feedback {
  if (!("priority" in s.repair)) throw Error("Expected STP repair");
  const actual = trialNetwork(s, repairs),
    selected = history.filter(
      (o) => answer.evidence.includes(o.id) && o.scenario === s.id && !o.output.startsWith("%"),
    );
  const original = selected.filter(
    (o) => !o.repairIndex && o.output === execute(s, o.device, o.command, o.target, [], o.source),
  );
  const fresh = selected.filter(
    (o) =>
      repairs.length &&
      o.repairIndex === repairs.length &&
      o.output === execute(actual, o.device, o.command, o.target, [], o.source),
  );
  const recovered = repairs.length > 0 && stpRecovered(s, actual),
    switches = actual.devices.filter((d) => d.stp),
    hosts = actual.devices.filter((d) => d.kind === "pc");
  const verified =
    recovered &&
    switches.every((d) => fresh.some((o) => o.device === d.id && o.command === "show spanning-tree vlan 10")) &&
    fresh.some((o) => o.device === s.repair.device && o.command === "show running-config") &&
    hosts.every((a) =>
      hosts
        .filter((b) => b.id !== a.id)
        .every((b) =>
          fresh.some((o) => o.device === a.id && o.command === "ping" && o.target === b.interfaces[0].ip && !o.source),
        ),
    );
  const checks = s.evidenceRules.map((r) => ({
    ...r,
    met:
      r.requirements.length > 0 &&
      r.requirements.every(
        (q) =>
          q.devices.length > 0 &&
          q.commands.length > 0 &&
          original.some((o) => q.devices.includes(o.device) && q.commands.includes(o.command)),
      ),
  }));
  const device = [...new Set(answer.devices)].sort().join() === [...s.fault.devices].sort().join();
  const observed = s.devices.find((d) => d.id === s.repair.device)!.stp!.priority;
  const parts = [
    {
      name: "Root cause",
      possible: 20,
      earned: answer.cause === s.fault.cause && answer.observedPriority === observed ? 20 : 0,
      message: "Distinguish the initial configured base priority from the effective bridge ID.",
    },
    {
      name: "Design location",
      possible: 10,
      earned: (device ? 5 : 0) + (device && answer.observedVlan === s.repair.vlan ? 5 : 0),
      message: "Identify the bridge containing the configuration fault and its VLAN instance.",
    },
    {
      name: "Supporting evidence",
      possible: 30,
      earned: checks.reduce((n, r) => n + (r.met ? r.points : 0), 0),
      message: checks.map((r) => `${r.label}: ${r.met ? "captured" : "missing"}.`).join(" "),
    },
    {
      name: "Applied repair and mechanism",
      possible: 20,
      earned:
        (recovered && s.acceptedFixes.includes(answer.fix) ? 15 : 0) + (answer.reason === s.repair.reason ? 5 : 0),
      message: recovered
        ? "The applied priority satisfies the design while retaining all cabling."
        : "The final state must change only the preferred bridge priority and satisfy its strict preference. A MAC tie or a successful ping alone is insufficient.",
    },
    {
      name: "Fresh recovery verification",
      possible: 20,
      earned: verified ? 20 : 0,
      message: verified
        ? "Current root/roles, configuration and reciprocal host delivery verified."
        : "Select fresh STP views on every switch, preferred-bridge configuration and both host pings after the latest change.",
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
