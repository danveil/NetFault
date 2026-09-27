import { validateNat } from "./nat";
import { repairActionSchema, type RepairAction, type Scenario, type Attempt } from "./schema";
import { hsrpPriority, validateHsrp } from "./hsrp";
import { moveAclEntry } from "./acl";
import { validatePortSecurity } from "./port-security";

// Replay learner-owned practice changes or server-owned assessment changes, never a hidden canonical repair.
export function trialNetwork(original: Scenario, repairs: RepairAction[] = []): Scenario {
  if (!repairs.length) return original;
  if (
    original.schemaVersion !== 7 &&
    original.schemaVersion !== 8 &&
    original.schemaVersion !== 9 &&
    original.schemaVersion !== 10 &&
    original.schemaVersion !== 12 &&
    original.schemaVersion !== 11
  )
    throw Error("Configuration trials are not supported by this scenario");
  const result = structuredClone(original);
  for (const raw of repairs) {
    // Persisted events also carry a timestamp; validate only the actual configuration request here.
    const request = { ...raw } as RepairAction & { at?: number };
    delete request.at;
    const change = repairActionSchema.parse(request);
    if ("kind" in change && change.kind === "nat-static-local") {
      const m = result.devices
        .find((d) => d.id === change.device)
        ?.nat?.mappings.find((m) => m.id === change.mappingId);
      if (original.schemaVersion !== 12 || !m) throw Error("Select an existing static mapping");
      m.insideLocal = change.insideLocal;
      validateNat(result, (message) => {
        throw Error(message);
      });
      continue;
    }
    if ("kind" in change && change.kind === "port-security-mac") {
      const policy = result.devices
        .find((d) => d.id === change.device)
        ?.ports?.find((p) => p.name === change.interface)?.portSecurity;
      if (original.schemaVersion !== 11 || !policy?.enabled)
        throw Error("Select an existing enabled secure access port");
      policy.staticMac = change.mac;
      validatePortSecurity(result, (message) => {
        throw Error(message);
      });
      continue;
    }
    if ("kind" in change && change.kind === "hsrp-priority") {
      const intf = result.devices
        .find((d) => d.id === change.device)
        ?.interfaces.find((i) => i.name === change.interface);
      if (original.schemaVersion !== 10 || !intf?.hsrp || intf.hsrp.group !== change.group)
        throw Error("Select an existing HSRP member, interface and group");
      if (hsrpPriority(intf) !== change.priority) {
        const canonical = original.devices
          .find((d) => d.id === change.device)!
          .interfaces.find((i) => i.name === change.interface)!.hsrp!;
        if (change.priority === (canonical.priority ?? 100)) {
          if (canonical.priority === undefined) delete intf.hsrp.priority;
          else intf.hsrp.priority = canonical.priority;
        } else intf.hsrp.priority = change.priority;
      }
      validateHsrp(result, (message) => {
        throw Error(message);
      });
      continue;
    }
    if ("kind" in change && change.kind === "stp-priority") {
      const bridge = result.devices.find((d) => d.id === change.device)?.stp;
      if (original.schemaVersion !== 9 || !bridge || bridge.vlan !== change.vlan)
        throw Error("Select an existing STP bridge and VLAN");
      bridge.priority = change.priority;
      continue;
    }
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
  if ("kind" in change && change.kind === "nat-static-local")
    return `${change.device}, mapping ${change.mappingId}, inside local -> ${change.insideLocal}`;
  if ("kind" in change && change.kind === "port-security-mac")
    return `${change.device}, ${change.interface}, static secure MAC → ${change.mac}`;
  if ("kind" in change && change.kind === "hsrp-priority")
    return `${change.device}, ${change.interface}, HSRPv2 group ${change.group}, priority → ${change.priority}`;
  if ("kind" in change && change.kind === "stp-priority")
    return `${change.device}, VLAN ${change.vlan}, bridge priority → ${change.priority}`;
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
