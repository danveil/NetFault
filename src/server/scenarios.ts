import "server-only";
import { scenarioIdSchema, type Scenario, type ScenarioId } from "@/lib/schema";
import { scenario } from "./scenario";
import { gatewayScenario } from "./gateway-scenario";
import { vlanScenario } from "./vlan-scenario";
import { returnScenario } from "./return-scenario";
import { passiveScenario } from "./passive-scenario";
import { nextHopScenario } from "./next-hop-scenario";
import { timerScenario } from "./timer-scenario";
import { etherChannelScenario } from "./etherchannel-scenario";
import { catalog, commandsFor } from "@/lib/catalog";
export const scenarios: Record<ScenarioId, Scenario> = {
  "ospf-01": scenario,
  "gateway-01": gatewayScenario,
  "vlan-01": vlanScenario,
  "return-01": returnScenario,
  "passive-01": passiveScenario,
  "timer-01": timerScenario,
  "next-hop-01": nextHopScenario,
  "etherchannel-01": etherChannelScenario,
};
export function validateRegistry(entries: Record<ScenarioId, Scenario>) {
  for (const id of scenarioIdSchema.options) {
    const s = entries[id],
      publicLab = catalog(id);
    if (!s || s.id !== id || s.title !== publicLab.title) throw Error("Scenario registry identity mismatch");
    if (s.devices.map((d) => d.id).join() !== publicLab.devices.map((d) => d.id).join())
      throw Error("Scenario topology mismatch");
    for (const d of s.devices)
      if ([...d.commands].sort().join() !== [...commandsFor(id, d.id)].sort().join())
        throw Error("Scenario command catalog mismatch");
  }
}
validateRegistry(scenarios);
export function getScenario(id: ScenarioId) {
  const result = scenarios[id];
  if (!result) throw Error("Unknown scenario");
  return result;
}
