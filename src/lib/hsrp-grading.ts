import type { Scenario, Diagnosis, Observation, RepairAction, Feedback } from "./schema";
import { trialNetwork } from "./repair-trial";
import { connectivity, execute } from "./engine";
import { hsrpState, hsrpPriority } from "./hsrp";

export function hsrpRecovered(original: Scenario, current: Scenario) {
  const repair = original.repair;
  if (!("kind" in repair) || repair.kind !== "hsrp-priority") return false;
  const invariant = (s: Scenario) =>
    JSON.stringify({
      links: s.links,
      devices: s.devices.map((d) => ({
        ...d,
        interfaces: d.interfaces.map((i) =>
          d.id === repair.device && i.name === repair.interface && i.hsrp
            ? { ...i, hsrp: { ...i.hsrp, priority: 0 } }
            : i,
        ),
      })),
    });
  if (invariant(original) !== invariant(current)) return false;
  const state = hsrpState(current);
  if (
    state.active?.device.id !== repair.device ||
    !state.standby ||
    hsrpPriority(state.active.interface) <= hsrpPriority(state.standby.interface)
  )
    return false;
  const hosts = current.devices.filter((d) => d.kind === "pc");
  return hosts.every(
    (a) =>
      (!a.gateway || connectivity(current, a.id, a.gateway).ok) &&
      hosts.filter((b) => b.id !== a.id).every((b) => connectivity(current, a.id, b.interfaces[0].ip).ok),
  );
}
export function gradeHsrp(
  s: Scenario,
  answer: Diagnosis,
  history: Observation[],
  timedOut: boolean,
  repairs: RepairAction[],
): Feedback {
  const repair = s.repair;
  if (!("kind" in repair) || repair.kind !== "hsrp-priority") throw Error("Expected HSRP repair");
  const actual = trialNetwork(s, repairs);
  // Reconstruct each observation using its version and the authentic preceding epoch.
  // Invalid or altered observations cannot seed an ARP result later in the history.
  const authentic: Observation[] = [];
  for (const o of history) {
    const version = o.repairIndex ?? 0;
    if (
      o.scenario !== s.id ||
      version > repairs.length ||
      o.output.startsWith("%") ||
      !s.devices.some((d) => d.id === o.device && d.commands.some((c) => c === o.command))
    )
      continue;
    if (
      o.output ===
      execute(trialNetwork(s, repairs.slice(0, version)), o.device, o.command, o.target, authentic, o.source, version)
    )
      authentic.push(o);
  }
  const selected = authentic.filter((o) => answer.evidence.includes(o.id));
  const initial = selected.filter((o) => !o.repairIndex);
  const fresh = selected.filter((o) => repairs.length > 0 && o.repairIndex === repairs.length);
  const recovered = repairs.length > 0 && hsrpRecovered(s, actual);
  const members = hsrpState(actual).members;
  const client = actual.devices.find(
    (d) => d.kind === "pc" && members.some((m) => m.interface.hsrp!.virtualIp === d.gateway),
  )!;
  const remote = actual.devices.find((d) => d.kind === "pc" && d.id !== client.id)!;
  const has = (device: string, command: string, target?: string) =>
    fresh.some(
      (o) => o.device === device && o.command === command && (target === undefined || o.target === target) && !o.source,
    );
  const verified =
    recovered &&
    members.every((m) => has(m.device.id, "show standby brief")) &&
    has(repair.device, "show running-config") &&
    has(client.id, "ping", client.gateway) &&
    fresh.some(
      (o) =>
        o.device === client.id &&
        o.command === "arp -a" &&
        o.output.includes(client.gateway!) &&
        o.output.includes("0000.0c9f."),
    ) &&
    has(client.id, "ping", remote.interfaces[0].ip) &&
    has(remote.id, "ping", client.interfaces[0].ip);
  const checks = s.evidenceRules.map((r) => ({
    ...r,
    met:
      r.requirements.length > 0 &&
      r.requirements.every(
        (q) =>
          q.devices.length > 0 &&
          q.commands.length > 0 &&
          initial.some((o) => q.devices.includes(o.device) && q.commands.includes(o.command)),
      ),
  }));
  const device = [...new Set(answer.devices)].sort().join() === [...s.fault.devices].sort().join();
  const observed = hsrpPriority(
    s.devices.find((d) => d.id === repair.device)!.interfaces.find((i) => i.name === repair.interface)!,
  );
  const parts = [
    {
      name: "Cause and initial observation",
      possible: 20,
      earned: (answer.cause === s.fault.cause ? 10 : 0) + (answer.observedHsrpPriority === observed ? 10 : 0),
      message: "Compare the initial effective priorities with the approved gateway role, including default settings.",
    },
    {
      name: "Configuration location",
      possible: 10,
      earned:
        (device ? 5 : 0) +
        (device && answer.interface === repair.interface && answer.observedGroup === repair.group ? 5 : 0),
      message: "Identify the affected member, participating interface and group.",
    },
    {
      name: "Supporting evidence",
      possible: 30,
      earned: checks.reduce((n, r) => n + (r.met ? r.points : 0), 0),
      message: checks.map((r) => `${r.label}: ${r.met ? "captured" : "missing"}.`).join(" "),
    },
    {
      name: "Applied correction and mechanism",
      possible: 20,
      earned: (recovered && s.acceptedFixes.includes(answer.fix) ? 15 : 0) + (answer.reason === repair.reason ? 5 : 0),
      message: recovered
        ? "The intended primary now owns the virtual gateway; the fallback and routing configuration remain intact."
        : "Only the intended primary's priority may differ in the final state. A working ping or bypassing the virtual gateway cannot prove the design.",
    },
    {
      name: "Fresh verification",
      possible: 20,
      earned: verified ? 20 : 0,
      message: verified
        ? "Fresh roles, configuration, virtual resolution and reciprocal delivery verify this settled design. Failover was not tested."
        : "Select current-version brief views on both members, primary configuration, client VIP ping then ARP, and reciprocal remote host pings. Configuration alone and stale outputs do not verify recovery.",
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
