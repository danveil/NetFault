import type { Observation, RepairAction, Scenario } from "./schema";
import { execute } from "./engine";
import { trialNetwork } from "./repair-trial";
import { validateDeviceCommand } from "./capabilities";

// repairIndex is the existing configuration epoch: omission means the original
// state. History stays intact; only the current epoch can prove current recovery.
export function evidenceVersion(o: Observation) {
  return o.repairIndex ?? 0;
}
export function evidenceIsCurrent(o: Observation, repairs: RepairAction[] = []) {
  return evidenceVersion(o) === repairs.length;
}
export function verifiedEvidence(
  scenario: Scenario,
  history: Observation[],
  selected: string[],
  repairs: RepairAction[] = [],
) {
  const counts = new Map<string, number>();
  for (const o of history) counts.set(o.id, (counts.get(o.id) ?? 0) + 1);
  return history.filter((o) => {
    const version = evidenceVersion(o);
    if (
      !selected.includes(o.id) ||
      counts.get(o.id) !== 1 ||
      o.scenario !== scenario.id ||
      !Number.isInteger(version) ||
      version < 0 ||
      version > repairs.length ||
      o.output.startsWith("%")
    )
      return false;
    try {
      const state = trialNetwork(scenario, repairs.slice(0, version));
      if (validateDeviceCommand(state, o.device, o.command) !== o.command) return false;
      return o.output === execute(state, o.device, o.command, o.target, [], o.source, version);
    } catch {
      return false;
    }
  });
}
