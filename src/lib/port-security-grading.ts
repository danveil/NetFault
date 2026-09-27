import type { Scenario, Diagnosis, Observation, RepairAction, Feedback } from "./schema";
import { trialNetwork } from "./repair-trial";
import { connectivity, execute } from "./engine";
import { admitsSource, normalizeMac } from "./port-security";

function endpoints(s: Scenario) {
  const r = s.repair;
  if (!("kind" in r) || r.kind !== "port-security-mac") throw Error("Expected secure MAC repair");
  const link = s.links.find((l) => [l.a, l.b].some((e) => e.device === r.device && e.interface === r.interface))!;
  const endpoint = link.a.device === r.device ? link.b : link.a;
  const client = s.devices.find((d) => d.id === endpoint.device)!;
  const remote = s.devices.find((d) => d.kind === "pc" && d.id !== client.id)!;
  const router = s.devices.find((d) => d.kind === "router")!;
  return { r, client, remote, router };
}
export function portSecurityRecovered(original: Scenario, current: Scenario) {
  const { r, client, remote } = endpoints(original);
  const invariant = (s: Scenario) =>
    JSON.stringify({
      links: s.links,
      devices: s.devices.map((d) => ({
        ...d,
        ports: d.ports?.map((p) =>
          d.id === r.device && p.name === r.interface && p.portSecurity
            ? { ...p, portSecurity: { ...p.portSecurity, staticMac: "slot" } }
            : p,
        ),
      })),
    });
  if (invariant(original) !== invariant(current)) return false;
  const port = current.devices.find((d) => d.id === r.device)?.ports?.find((p) => p.name === r.interface);
  if (
    !port?.portSecurity?.enabled ||
    port.portSecurity.maximum !== 1 ||
    port.portSecurity.violation !== "protect" ||
    !admitsSource(port, client.interfaces[0].mac) ||
    admitsSource(port, remote.interfaces[0].mac)
  )
    return false;
  return current.devices
    .filter((d) => d.kind === "pc")
    .every(
      (a) =>
        connectivity(current, a.id, a.gateway!).ok &&
        current.devices
          .filter((b) => b.kind === "pc" && b.id !== a.id)
          .every((b) => connectivity(current, a.id, b.interfaces[0].ip).ok),
    );
}
export function gradePortSecurity(
  s: Scenario,
  answer: Diagnosis,
  history: Observation[],
  timedOut: boolean,
  repairs: RepairAction[],
): Feedback {
  const { r, client, remote, router } = endpoints(s);
  const actual = trialNetwork(s, repairs);
  const authentic: Observation[] = [];
  for (const o of history) {
    const version = o.repairIndex ?? 0;
    if (
      !Number.isInteger(version) ||
      version < 0 ||
      version > repairs.length ||
      o.scenario !== s.id ||
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
  const has = (observations: Observation[], device: string, command: string, target?: string) =>
    observations.some(
      (o) =>
        o.device === device &&
        o.command === command &&
        (target === undefined || o.target.trim() === target) &&
        !o.source,
    );
  const recovered = repairs.length > 0 && portSecurityRecovered(s, actual);
  const securityCommand = `show port-security interface ${r.interface.toLowerCase()}`;
  const gatewayMac = router.interfaces.find((i) => i.ip === client.gateway)!.mac;
  const verified =
    recovered &&
    has(fresh, client.id, "ipconfig /all") &&
    [
      "show running-config",
      "show port-security address",
      securityCommand,
      "show interfaces status",
      "show vlan brief",
    ].every((c) => has(fresh, r.device, c)) &&
    has(fresh, client.id, "ping", client.gateway) &&
    fresh.some(
      (o) =>
        o.device === client.id &&
        o.command === "arp -a" &&
        o.output.includes(client.gateway!) &&
        o.output.includes(gatewayMac),
    ) &&
    has(fresh, client.id, "ping", remote.interfaces[0].ip) &&
    has(fresh, remote.id, "ping", client.interfaces[0].ip) &&
    has(fresh, remote.id, "ping", remote.gateway);
  const checks = s.evidenceRules.map((rule, n) => ({
    ...rule,
    met:
      rule.requirements.every((q) =>
        initial.some((o) => q.devices.includes(o.device) && q.commands.includes(o.command)),
      ) &&
      (n !== 3 || (has(initial, client.id, "ping", client.gateway) && has(initial, remote.id, "ping", remote.gateway))),
  }));
  const located = [...new Set(answer.devices)].sort().join() === [...s.fault.devices].sort().join();
  const observed = s.devices.find((d) => d.id === r.device)!.ports!.find((p) => p.name === r.interface)!.portSecurity!
    .staticMac;
  const parts = [
    {
      name: "Cause and initial observation",
      possible: 20,
      earned:
        (answer.cause === s.fault.cause ? 10 : 0) +
        (normalizeMac(answer.observedSecureMac ?? "") === observed ? 10 : 0),
      message:
        "Compare the original configured registration with the legitimate NIC identity; connected carrier alone does not establish admission.",
    },
    {
      name: "Configuration location",
      possible: 10,
      earned: (located ? 5 : 0) + (located && answer.interface === r.interface ? 5 : 0),
      message: "Identify the switch and ingress access interface containing the configuration.",
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
      earned: (recovered && s.acceptedFixes.includes(answer.fix) ? 15 : 0) + (answer.reason === r.reason ? 5 : 0),
      message: recovered
        ? "The intended NIC is admitted; only its static slot changed. Enabled maximum-one protect policy remains exclusive by configuration, not an executed attacker probe."
        : "Apply only the approved static-slot replacement. Disabling protection, changing endpoint identity or unrelated state is not recovery.",
    },
    {
      name: "Fresh verification",
      possible: 20,
      earned: verified ? 20 : 0,
      message: verified
        ? "Current NIC, configuration, security, physical/VLAN controls, resolution and reciprocal delivery establish recovery. Exclusive admission is a policy invariant, not an attacker test."
        : "Select current-version PC-A ipconfig /all; switch running-config, secure address, interface security, status and VLAN; PC-A gateway ping then ARP; reciprocal host pings and PC-B gateway ping. Changes alone and stale outputs are insufficient.",
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
