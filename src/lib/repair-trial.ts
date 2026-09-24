import { repairActionSchema, type RepairAction, type Scenario, type Attempt } from "./schema";
import { moveAclEntry } from "./acl";

// Replay learner-owned practice changes or server-owned assessment changes, never a hidden canonical repair.
export function trialNetwork(original: Scenario, repairs: RepairAction[] = []): Scenario {
  if (!repairs.length) return original;
  if (original.schemaVersion !== 7 && original.schemaVersion !== 8)
    throw Error("Configuration trials are not supported by this scenario");
  const result = structuredClone(original);
  for (const raw of repairs) {
    // Persisted events also carry a timestamp; validate only the actual configuration request here.
    const request = { ...raw } as RepairAction & { at?: number };
    delete request.at;
    const change = repairActionSchema.parse(request);
    if ("kind" in change) {
      if (original.schemaVersion !== 8) throw Error("ACL changes are not supported by this scenario");
      moveAclEntry(
        result.devices.find((d) => d.id === change.device),
        change.acl,
        change.sequence,
        change.newSequence,
      );
      continue;
    }
    if (original.schemaVersion !== 7) throw Error("LACP changes are not supported by this scenario");
    const channel = result.devices
      .find((d) => d.id === change.device)
      ?.portChannels?.find((c) => c.id === change.group);
    if (!channel) throw Error("Select an existing switch and local channel group");
    channel.mode = change.mode;
  }
  return result;
}
export function repairDescription(change: RepairAction) {
  return "kind" in change
    ? `${change.device}, ACL ${change.acl}, sequence ${change.sequence} → ${change.newSequence}`
    : `${change.device}, channel-group ${change.group}, mode ${change.mode}`;
}
export function recordRepair(original: Scenario, attempt: Attempt, change: RepairAction, now: number): Attempt {
  if (attempt.finishedAt) return attempt;
  if ((attempt.repairs?.length ?? 0) >= 10)
    throw Error("Ten configuration changes reached. Inspect the current state and submit.");
  const repairs = [...(attempt.repairs ?? []), { ...repairActionSchema.parse(change), at: now }];
  trialNetwork(original, repairs);
  // Repeating the identical state is not a new trial; preserves verification for that state.
  if (
    JSON.stringify(trialNetwork(original, attempt.repairs).devices) ===
    JSON.stringify(trialNetwork(original, repairs).devices)
  )
    return attempt;
  return { ...attempt, repairs };
}
