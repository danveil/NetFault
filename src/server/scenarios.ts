import "server-only";
import type { ScenarioId } from "@/lib/schema";
import { scenario } from "./scenario";
import { gatewayScenario } from "./gateway-scenario";
export function getScenario(id: ScenarioId) {
  return id === "ospf-01" ? scenario : gatewayScenario;
}
