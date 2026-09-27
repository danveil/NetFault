import { commandSequence, packetJourney, repaired } from "./engine";
import { stpPath } from "./stp";
import type { Scenario } from "./schema";

// No lab IDs, fault locations or authored repair narration belong in this public module.
// It runs only with an explicitly downloaded practice pack, after feedback in the UI.
export function repairPreview(original: Scenario) {
  const commands: [string, string, string?, string?][] = [];
  const hosts = original.devices.filter((d) => d.kind === "pc");
  for (const d of original.devices) {
    for (const c of d.commands.filter((c) => !["ping", "traceroute", "tracert"].includes(c))) commands.push([d.id, c]);
    if (d.kind === "pc" && d.gateway) {
      commands.push([d.id, "ping", d.gateway]);
      if (d.commands.includes("arp -a")) commands.push([d.id, "arp -a"]);
    }
    if (!original.verificationTargets && d.commands.includes("ping"))
      for (const host of hosts.filter((h) => h.id !== d.id)) {
        commands.push([d.id, "ping", host.interfaces[0].ip]);
        const trace = d.kind === "pc" ? "tracert" : "traceroute";
        if (d.commands.includes(trace)) commands.push([d.id, trace, host.interfaces[0].ip]);
      }
  }
  for (const p of original.verificationTargets ?? []) commands.push([p.device, "ping", p.target]);
  for (const p of original.policyChecks ?? []) if (p.source) commands.push([p.device, "ping", p.target, p.source]);
  const render = (s: Scenario) =>
    [
      commandSequence(s, commands),
      ...(s.stpDesign && hosts.length === 2
        ? [`Simulator Layer 2 path (not IP traceroute): ${stpPath(s, hosts[0].id, hosts[1].id).join(" → ")}`]
        : []),
      ...(s.verificationTargets
        ? s.verificationTargets.map((p) => packetJourney(s, p.device, p.target))
        : hosts.flatMap((a) =>
            hosts.filter((b) => b.id !== a.id).map((b) => packetJourney(s, a.id, b.interfaces[0].ip)),
          )),
    ].join("\n\n");
  return [
    "REPAIRED-STATE PREVIEW — not part of your evidence",
    ...(original.policyChecks
      ? [
          "Policy verification: permitted controls should succeed; excluded controls must remain denied after repair. Not every failed ping is a fault.",
        ]
      : []),
    "BEFORE REPAIR",
    render(original),
    "AFTER REPAIR",
    render(repaired(original)),
  ].join("\n\n");
}
