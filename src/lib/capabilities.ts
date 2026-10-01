import { z } from "zod";
import type { Device, Scenario } from "./schema";

export const deviceIdentity = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,31}$/);
export const diagnosticCapabilities = [
  "ipv4-host",
  "interface-state",
  "routing-state",
  "neighbor-state",
  "configuration",
  "access-switching",
  "standard-policy",
  "reachability",
  "static-translation",
  "logical-transport",
] as const;
export const capabilitySchema = z.enum(diagnosticCapabilities);
export type Capability = z.infer<typeof capabilitySchema>;
const definitions: Record<Capability, { kinds: Device["kind"][]; commands: string[] }> = {
  "ipv4-host": { kinds: ["pc"], commands: ["ipconfig", "ipconfig /all", "route print"] },
  "interface-state": { kinds: ["router"], commands: ["show ip interface brief"] },
  "routing-state": { kinds: ["router"], commands: ["show ip route"] },
  "neighbor-state": {
    kinds: ["router"],
    commands: ["show ip ospf neighbor", "show ip ospf interface", "show ip protocols"],
  },
  configuration: { kinds: ["router", "switch"], commands: ["show running-config"] },
  "access-switching": { kinds: ["switch"], commands: ["show vlan brief", "show interfaces status"] },
  "standard-policy": { kinds: ["router"], commands: ["show access-lists"] },
  reachability: { kinds: ["pc", "router"], commands: ["ping"] },
  "static-translation": { kinds: ["router"], commands: ["show ip nat translations"] },
  "logical-transport": { kinds: ["router"], commands: ["show interfaces tunnel 0"] },
};
export function capabilityCommands(kind: Device["kind"], capabilities: Capability[]) {
  const commands = new Set<string>();
  for (const capability of capabilities) {
    const definition = definitions[capabilitySchema.parse(capability)];
    if (!definition.kinds.includes(kind)) throw Error("Capability is not supported by this device kind");
    for (const command of definition.commands) commands.add(command);
  }
  return [...commands];
}
export function normalizeCommand(command: string) {
  return command.trim().toLowerCase().replace(/\s+/g, " ");
}
// The session selects the scenario; request input cannot supply another inventory.
export function validateDeviceCommand(s: Scenario, id: string, raw: string) {
  const d = s.devices.find((d) => d.id === id);
  if (!d) throw Error("Device is not part of this lab.");
  const command = normalizeCommand(raw);
  if (!d.commands.some((c) => c === command)) throw Error("Unsupported command on this device.");
  if (s.foundation) {
    const declared = s.foundation.public.devices.find((item) => item.id === id);
    if (!declared || !capabilityCommands(declared.kind, declared.capabilities).includes(command))
      throw Error("Command is not enabled by this scenario.");
  }
  return command;
}
