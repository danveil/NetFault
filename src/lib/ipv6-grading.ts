import type { Scenario, Diagnosis, Observation, RepairAction, Feedback } from "./schema";
import { connectivity6 } from "./ipv6";
import { equal6 } from "./ipv6-address";
import { execute } from "./engine";
import { trialNetwork } from "./repair-trial";
export function ipv6Recovered(original: Scenario, current: Scenario) {
  const r = original.repair;
  if (!("kind" in r) || r.kind !== "ipv6-forwarding") return false;
  const invariant = (s: Scenario) =>
    JSON.stringify({
      links: s.links,
      devices: s.devices.map((d) => ({
        ...d,
        ipv6: d.ipv6 && { ...d.ipv6, forwarding: d.id === r.device ? "slot" : d.ipv6.forwarding },
      })),
    });
  if (
    invariant(original) !== invariant(current) ||
    current.devices.find((d) => d.id === r.device)?.ipv6?.forwarding !== r.enabled
  )
    return false;
  const hosts = current.devices.filter((d) => d.kind === "pc");
  return (
    hosts.length === 2 &&
    hosts.every((a) =>
      hosts.filter((b) => b !== a).every((b) => connectivity6(current, a.id, b.ipv6!.interfaces[0].address).ok),
    )
  );
}
export function gradeIpv6(
  s: Scenario,
  answer: Diagnosis,
  history: Observation[],
  timedOut: boolean,
  repairs: RepairAction[],
): Feedback {
  const r = s.repair;
  if (!("kind" in r) || r.kind !== "ipv6-forwarding") throw Error("Expected IPv6 forwarding repair");
  const router = s.devices.find((d) => d.id === r.device)!,
    hosts = s.devices.filter((d) => d.kind === "pc"),
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
  const has = (list: Observation[], id: string, cmd: string, target?: string) =>
    list.some((o) => o.device === id && o.command === cmd && (target === undefined || equal6(o.target, target)));
  const configuration =
    has(initial, router.id, "show running-config") && has(initial, router.id, "show ipv6 interface brief");
  const hostContext =
    hosts.every((d) => has(initial, d.id, "ipconfig") || has(initial, d.id, "ipconfig /all")) &&
    hosts.every((d) => has(initial, d.id, "route print"));
  const probes =
    hosts.every((d) => has(initial, d.id, "ping", d.ipv6!.gateway!)) &&
    has(initial, hosts[0].id, "ping", hosts[1].ipv6!.interfaces[0].address);
  const current = trialNetwork(s, repairs),
    recovered = repairs.length > 0 && ipv6Recovered(s, current);
  const freshState =
    recovered &&
    has(fresh, router.id, "show running-config") &&
    has(fresh, router.id, "show ipv6 interface brief") &&
    hosts.every((d) => has(fresh, d.id, "route print"));
  const freshDelivery =
    recovered &&
    hosts.every(
      (d) =>
        has(fresh, d.id, "ping", d.ipv6!.gateway!) &&
        hosts.filter((b) => b !== d).every((b) => has(fresh, d.id, "ping", b.ipv6!.interfaces[0].address)),
    );
  const located = [...new Set(answer.devices)].join() === r.device;
  const parts = [
    {
      name: "Cause and initial observation",
      possible: 20,
      earned:
        (answer.cause === s.fault.cause ? 10 : 0) + (answer.observedForwarding === router.ipv6!.forwarding ? 10 : 0),
      message: "Separate the initial effective IPv6 forwarding setting from address and link availability.",
    },
    {
      name: "Configuration location",
      possible: 10,
      earned: located ? 10 : 0,
      message: "Identify the device whose global IPv6 forwarding behavior needs correction.",
    },
    {
      name: "Supporting evidence",
      possible: 30,
      earned: 10 * (Number(configuration) + Number(hostContext) + Number(probes)),
      message: `Original router configuration/state: ${configuration ? "captured" : "missing"}; both host configuration/routes: ${hostContext ? "captured" : "missing"}; local controls and failed cross-network service: ${probes ? "captured" : "missing"}.`,
    },
    {
      name: "Applied correction and mechanism",
      possible: 20,
      earned:
        (recovered ? 10 : 0) +
        (recovered && located && answer.forwarding === r.enabled && s.acceptedFixes.includes(answer.fix) ? 5 : 0) +
        (answer.reason === r.reason ? 5 : 0),
      message: recovered
        ? "Minimal change restores actual transit delivery while retaining addresses, configured on-link routes and next hops."
        : "Apply the minimal correction; a selected answer or router-local reply is not transit recovery.",
    },
    {
      name: "Fresh verification",
      possible: 20,
      earned: (freshState ? 10 : 0) + (freshDelivery ? 10 : 0),
      message:
        freshState && freshDelivery
          ? "Current configuration, host routes, local controls and reciprocal cross-network echoes verify recovery."
          : "Select current router configuration/interface summary, both host route views, both local controls and reciprocal PC echoes. Older observations cannot verify a later change.",
    },
  ];
  return {
    score: parts.reduce((n, p) => n + p.earned, 0),
    parts,
    recovery: freshState && freshDelivery ? "verified" : recovered ? "recovered-unverified" : "unresolved",
    explanation: s.explanation,
    solution: s.solution,
    lesson: s.lesson,
    timedOut,
  };
}
