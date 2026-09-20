import "server-only";
import type { ScenarioId } from "@/lib/schema";
import { scenario } from "./scenario";
import { gatewayScenario } from "./gateway-scenario";
import { vlanScenario } from "./vlan-scenario";
import { returnScenario } from "./return-scenario";
export function getScenario(id: ScenarioId) {
  return id === "ospf-01"
    ? scenario
    : id === "gateway-01"
      ? gatewayScenario
      : id === "vlan-01"
        ? vlanScenario
        : returnScenario;
}
