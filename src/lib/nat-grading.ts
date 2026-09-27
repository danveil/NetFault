import type { Scenario, Diagnosis, Observation, RepairAction, Feedback } from "./schema";
import { connectivity, execute } from "./engine";
import { trialNetwork } from "./repair-trial";

function context(s: Scenario) {
  const r = s.repair;
  if (!("kind" in r) || r.kind !== "nat-static-local") throw Error("Expected static mapping repair");
  const router = s.devices.find((d) => d.id === r.device)!;
  const mapping = router.nat!.mappings.find((m) => m.id === r.mappingId)!;
  const client = s.devices.find((d) => d.kind === "pc" && d.interfaces.some((i) => i.ip === r.insideLocal))!;
  const remote = s.devices.find((d) => d.kind === "pc" && d.id !== client.id)!;
  return { r, router, mapping, client, remote };
}
export function natRecovered(original: Scenario, current: Scenario) {
  const { r, client, remote, mapping } = context(original);
  const invariant = (s: Scenario) =>
    JSON.stringify({
      links: s.links,
      devices: s.devices.map((d) => ({
        ...d,
        nat: d.nat && {
          ...d.nat,
          mappings: d.nat.mappings.map((m) =>
            d.id === r.device && m.id === r.mappingId ? { ...m, insideLocal: "slot" } : m,
          ),
        },
      })),
    });
  if (invariant(original) !== invariant(current)) return false;
  const actual = current.devices.find((d) => d.id === r.device)?.nat?.mappings.find((m) => m.id === r.mappingId);
  if (actual?.insideLocal !== client.interfaces[0].ip) return false;
  const outward = connectivity(current, client.id, remote.interfaces[0].ip),
    inward = connectivity(current, remote.id, mapping.insideGlobal);
  return (
    outward.ok &&
    inward.ok &&
    outward.outward.delivered?.source === mapping.insideGlobal &&
    inward.outward.delivered?.device === client.id &&
    inward.returning?.delivered?.source === mapping.insideGlobal &&
    [outward, inward].every((c) => c.outward.translations?.length === 1 && c.returning?.translations?.length === 1)
  );
}
export function gradeNat(
  s: Scenario,
  answer: Diagnosis,
  history: Observation[],
  timedOut: boolean,
  repairs: RepairAction[],
): Feedback {
  const { r, client, remote, mapping } = context(s),
    actual = trialNetwork(s, repairs),
    authentic: Observation[] = [];
  for (const o of history) {
    const version = o.repairIndex ?? 0;
    if (
      !Number.isInteger(version) ||
      version < 0 ||
      version > repairs.length ||
      o.scenario !== s.id ||
      o.source ||
      authentic.some((a) => a.id === o.id) ||
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
  const selected = authentic.filter((o) => answer.evidence.includes(o.id)),
    initial = selected.filter((o) => !o.repairIndex),
    fresh = selected.filter((o) => repairs.length > 0 && o.repairIndex === repairs.length);
  const has = (list: Observation[], device: string, command: string, target?: string) =>
    list.some(
      (o) => o.device === device && o.command === command && (target === undefined || o.target.trim() === target),
    );
  const config = (list: Observation[], id: string) => has(list, id, "ipconfig") || has(list, id, "ipconfig /all");
  const recovered = repairs.length > 0 && natRecovered(s, actual);
  const freshConfig =
    recovered &&
    config(fresh, client.id) &&
    has(fresh, r.device, "show running-config") &&
    has(fresh, r.device, "show ip nat translations");
  const freshDelivery =
    recovered &&
    has(fresh, client.id, "ping", remote.interfaces[0].ip) &&
    has(fresh, remote.id, "ping", mapping.insideGlobal) &&
    [client, remote].every((d) => has(fresh, d.id, "ping", d.gateway));
  const failedOriginal =
    has(initial, client.id, "ping", remote.interfaces[0].ip) || has(initial, remote.id, "ping", mapping.insideGlobal);
  const checks = s.evidenceRules.map((rule, n) => ({
    ...rule,
    met:
      rule.requirements.every((q) =>
        initial.some((o) => q.devices.includes(o.device) && q.commands.includes(o.command)),
      ) &&
      (n !== 2 || failedOriginal),
  }));
  const located = [...new Set(answer.devices)].join() === r.device;
  const parts = [
    {
      name: "Cause and initial observation",
      possible: 20,
      earned:
        (answer.cause === s.fault.cause ? 10 : 0) +
        (answer.observedLocal === mapping.insideLocal && answer.observedGlobal === mapping.insideGlobal ? 10 : 0),
      message:
        "Compare the original inside NIC with the configured local/global pair. A table entry alone does not prove delivery.",
    },
    {
      name: "Configuration location",
      possible: 10,
      earned: (located ? 5 : 0) + (located && answer.mappingId === r.mappingId ? 5 : 0),
      message: "Identify the router and existing mapping from recorded configuration.",
    },
    {
      name: "Supporting evidence",
      possible: 30,
      earned: checks.reduce((n, c) => n + (c.met ? c.points : 0), 0),
      message: checks.map((c) => `${c.label}: ${c.met ? "captured" : "missing"}.`).join(" "),
    },
    {
      name: "Applied correction and mechanism",
      possible: 20,
      earned:
        (recovered ? 10 : 0) +
        (recovered &&
        located &&
        answer.mappingId === r.mappingId &&
        answer.insideLocal === r.insideLocal &&
        s.acceptedFixes.includes(answer.fix)
          ? 5
          : 0) +
        (answer.reason === r.reason ? 5 : 0),
      message: recovered
        ? "Only the local member changed. Private NIC, global identity, roles and routes remain intact; both exchanges use the intended translation."
        : "Apply the minimal mapping correction. A chosen remedy or bypass is not an applied recovery.",
    },
    {
      name: "Fresh verification",
      possible: 20,
      earned: (freshConfig ? 10 : 0) + (freshDelivery ? 10 : 0),
      message:
        freshConfig && freshDelivery
          ? "Current configuration, permanent entry, unchanged NIC and both initiation directions with local controls verify the service."
          : "Select current-version inside PC configuration, boundary configuration and translations; both service directions and both local-gateway pings. Old observations cannot verify a later trial.",
    },
  ];
  return {
    score: parts.reduce((n, p) => n + p.earned, 0),
    parts,
    recovery: freshConfig && freshDelivery ? "verified" : recovered ? "recovered-unverified" : "unresolved",
    explanation: s.explanation,
    solution: s.solution,
    lesson: s.lesson,
    timedOut,
  };
}
