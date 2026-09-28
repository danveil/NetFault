import type { Scenario, Diagnosis, Observation, RepairAction, Feedback } from "./schema";
import { connectivity, execute } from "./engine";
import { trialNetwork } from "./repair-trial";
function context(s: Scenario) {
  const r = s.repair;
  if (!("kind" in r) || r.kind !== "gre-destination") throw Error("Expected tunnel destination repair");
  const local = s.devices.find((d) => d.id === r.device)!,
    remote = s.devices.find((d) => d.gre && d.id !== r.device)!;
  const client = s.devices.find((d) => d.kind === "pc" && local.interfaces.some((i) => i.ip === d.gateway))!;
  const other = s.devices.find((d) => d.kind === "pc" && d.id !== client.id)!;
  return { r, local, remote, client, other };
}
export function greRecovered(original: Scenario, current: Scenario) {
  const { r, local, remote, client, other } = context(original);
  const invariant = (s: Scenario) =>
    JSON.stringify({
      links: s.links,
      devices: s.devices.map((d) => ({
        ...d,
        gre: d.gre && { ...d.gre, destination: d.id === r.device ? "slot" : d.gre.destination },
      })),
    });
  if (invariant(original) !== invariant(current)) return false;
  const farSource = remote.interfaces.find((i) => i.name === remote.gre!.sourceInterface)!.ip;
  if (current.devices.find((d) => d.id === local.id)?.gre?.destination !== farSource) return false;
  return [
    connectivity(current, client.id, other.interfaces[0].ip),
    connectivity(current, other.id, client.interfaces[0].ip),
    connectivity(current, local.id, remote.gre!.ip, "Tunnel0"),
    connectivity(current, remote.id, local.gre!.ip, "Tunnel0"),
  ].every((c) => c.ok && [c.outward, c.returning].every((p) => p?.tunnels?.length === 1 && p.tunnels[0].accepted));
}
export function gradeGre(
  s: Scenario,
  answer: Diagnosis,
  history: Observation[],
  timedOut: boolean,
  repairs: RepairAction[],
): Feedback {
  const { r, local, remote, client, other } = context(s),
    actual = trialNetwork(s, repairs),
    authentic: Observation[] = [];
  for (const o of history) {
    const v = o.repairIndex ?? 0;
    if (
      !Number.isInteger(v) ||
      v < 0 ||
      v > repairs.length ||
      o.scenario !== s.id ||
      authentic.some((a) => a.id === o.id) ||
      o.output.startsWith("%") ||
      !s.devices.some((d) => d.id === o.device && d.commands.some((c) => c === o.command))
    )
      continue;
    if (
      o.output === execute(trialNetwork(s, repairs.slice(0, v)), o.device, o.command, o.target, authentic, o.source, v)
    )
      authentic.push(o);
  }
  const selected = authentic.filter((o) => answer.evidence.includes(o.id)),
    initial = selected.filter((o) => !o.repairIndex),
    fresh = selected.filter((o) => repairs.length > 0 && o.repairIndex === repairs.length);
  const has = (list: Observation[], device: string, command: string, target?: string, sources?: string[]) =>
    list.some(
      (o) =>
        o.device === device &&
        o.command === command &&
        (target === undefined || o.target.trim() === target) &&
        (!sources || sources.some((source) => source.toLowerCase() === o.source?.trim().toLowerCase())),
    );
  const source = local.interfaces.find((i) => i.name === local.gre!.sourceInterface)!;
  const underlay = [local.gre!.destination, r.destination].every(
    (ip) =>
      has(initial, local.id, "ping", ip, [source.name, source.ip]) && connectivity(s, local.id, ip, source.name).ok,
  );
  const configs =
    [local, remote].every((d) => has(initial, d.id, "show running-config")) &&
    has(initial, local.id, "show interfaces tunnel 0");
  const routeContext =
    [local, remote].every((d) => has(initial, d.id, "show ip route")) &&
    has(initial, client.id, "ping", other.interfaces[0].ip) &&
    !connectivity(s, client.id, other.interfaces[0].ip).ok;
  const recovered = repairs.length > 0 && greRecovered(s, actual);
  const freshConfig =
    recovered &&
    has(fresh, local.id, "show interfaces tunnel 0") &&
    [local, remote].every((d) => has(fresh, d.id, "show ip route"));
  const freshDelivery =
    recovered &&
    has(fresh, local.id, "ping", remote.gre!.ip, ["Tunnel0", local.gre!.ip]) &&
    has(fresh, remote.id, "ping", local.gre!.ip, ["Tunnel0", remote.gre!.ip]) &&
    has(fresh, client.id, "ping", other.interfaces[0].ip) &&
    has(fresh, other.id, "ping", client.interfaces[0].ip);
  const located = [...new Set(answer.devices)].join() === r.device;
  const parts = [
    {
      name: "Cause and initial observation",
      possible: 20,
      earned:
        (answer.cause === s.fault.cause ? 10 : 0) + (answer.observedDestination === local.gre!.destination ? 10 : 0),
      message: "Identify the initial configured outer destination from observations.",
    },
    {
      name: "Configuration location",
      possible: 10,
      earned: (located ? 5 : 0) + (located && answer.interface === r.interface ? 5 : 0),
      message: "Identify the router and logical interface.",
    },
    {
      name: "Supporting evidence",
      possible: 30,
      earned: 10 * (Number(underlay) + Number(configs) + Number(routeContext)),
      message: `Original underlay controls: ${underlay ? "captured" : "missing"}; both endpoint configurations and local tunnel: ${configs ? "captured" : "missing"}; both routes and failed service: ${routeContext ? "captured" : "missing"}.`,
    },
    {
      name: "Applied correction and mechanism",
      possible: 20,
      earned:
        (recovered ? 10 : 0) +
        (recovered &&
        located &&
        answer.interface === r.interface &&
        answer.tunnelDestination === r.destination &&
        s.acceptedFixes.includes(answer.fix)
          ? 5
          : 0) +
        (answer.reason === r.reason ? 5 : 0),
      message: recovered
        ? "Only the intended destination changed. Both inner exchanges use actual reciprocal GRE transport; addressing, sources and routes remain intact."
        : "Apply a minimal destination correction. A chosen remedy, up/up label or ordinary underlay ping is not recovery.",
    },
    {
      name: "Fresh verification",
      possible: 20,
      earned: (freshConfig ? 10 : 0) + (freshDelivery ? 10 : 0),
      message:
        freshConfig && freshDelivery
          ? "Current tunnel configuration, both routes and reciprocal tunnel/PC exchanges verify all three layers."
          : "Select current R1 tunnel output, both endpoint routes, reciprocal remote tunnel pings explicitly sourced from Tunnel0 and both PC service pings. Stale evidence cannot verify a later trial.",
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
