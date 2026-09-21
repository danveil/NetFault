import { commandSequence, packetJourney, repaired } from "./engine";
import type { Scenario } from "./schema";

// No lab IDs, fault locations or authored repair narration belong in this public module.
// It runs only with an explicitly downloaded practice pack, after feedback in the UI.
export function repairPreview(original: Scenario) {
  const commands: [string, string, string?, string?][] = [];
  const hosts = original.devices.filter((d) => d.kind === "pc");
  for (const d of original.devices) {
    for (const c of d.commands.filter((c) => !["ping", "traceroute", "tracert"].includes(c))) commands.push([d.id, c]);
    if (d.kind === "pc") {
      commands.push([d.id, "ping", d.gateway]);
      if (d.commands.includes("arp -a")) commands.push([d.id, "arp -a"]);
    }
    if (d.commands.includes("ping"))
      for (const host of hosts.filter((h) => h.id !== d.id)) {
        commands.push([d.id, "ping", host.interfaces[0].ip]);
        const trace = d.kind === "pc" ? "tracert" : "traceroute";
        if (d.commands.includes(trace)) commands.push([d.id, trace, host.interfaces[0].ip]);
      }
  }
  const render = (s: Scenario) =>
    [
      commandSequence(s, commands),
      ...hosts.flatMap((a) =>
        hosts.filter((b) => b.id !== a.id).map((b) => packetJourney(s, a.id, b.interfaces[0].ip)),
      ),
    ].join("\n\n");
  return [
    "REPAIRED-STATE PREVIEW — not part of your evidence",
    "BEFORE REPAIR",
    render(original),
    "AFTER REPAIR",
    render(repaired(original)),
  ].join("\n\n");
}
