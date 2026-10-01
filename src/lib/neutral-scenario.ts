import { z } from "zod";
import { capabilitySchema, capabilityCommands, deviceIdentity } from "./capabilities";
import type { Scenario } from "./schema";

export const neutralIdSchema = z
  .string()
  .regex(/^n-[0-9a-f]{8}$/)
  .transform((value) => value as `n-${string}`);
const position = z.strictObject({ x: z.number().min(0).max(5000), y: z.number().min(0).max(5000) });
const endpoint = z.strictObject({ device: deviceIdentity, interface: z.string().min(1).max(64) });
export const neutralPublicSchema = z
  .strictObject({
    version: z.literal(1),
    id: neutralIdSchema,
    title: z.string().min(1).max(100),
    incident: z.string().min(1).max(1500),
    design: z.string().min(1).max(2000),
    // Both operations describe the network's editable capabilities, never the selected fault.
    operations: z.tuple([z.literal("access-assignment"), z.literal("policy-order")]),
    devices: z
      .array(
        z.strictObject({
          id: deviceIdentity,
          kind: z.enum(["pc", "router", "switch"]),
          role: z.string().min(1).max(80),
          interfaces: z.array(z.string().min(1).max(64)).min(1).max(8),
          capabilities: z.array(capabilitySchema).min(1).max(10),
          desktop: position,
          mobile: position,
        }),
      )
      .min(2)
      .max(12),
    links: z
      .array(
        z.strictObject({
          id: z.string().min(1).max(64),
          kind: z.enum(["physical", "logical"]),
          a: endpoint,
          b: endpoint,
          label: z.string().min(1).max(100),
          bend: z
            .strictObject({ desktop: z.number().min(-800).max(800), mobile: z.number().min(-800).max(800) })
            .optional(),
        }),
      )
      .min(1)
      .max(20),
  })
  .superRefine((p, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (new Set(p.devices.map((d) => d.id)).size !== p.devices.length) fail("Duplicate graph device");
    if (new Set(p.links.map((l) => l.id)).size !== p.links.length) fail("Duplicate graph link");
    const used = new Set<string>();
    for (const d of p.devices) {
      if (new Set(d.interfaces).size !== d.interfaces.length || new Set(d.capabilities).size !== d.capabilities.length)
        fail("Duplicate interface or capability");
      try {
        capabilityCommands(d.kind, d.capabilities);
      } catch {
        fail("Invalid device capability");
      }
    }
    for (const l of p.links) {
      if (l.a.device === l.b.device) fail("Self links are unsupported");
      for (const e of [l.a, l.b]) {
        const d = p.devices.find((d) => d.id === e.device);
        if (!d?.interfaces.includes(e.interface)) fail("Graph endpoint is not declared by its device");
        if (l.kind === "logical" && !d?.capabilities.includes("logical-transport"))
          fail("Logical endpoint requires transport capability");
        const key = `${e.device}:${e.interface}`;
        if (l.kind === "physical") {
          if (used.has(key)) fail("Physical interface has multiple cables");
          used.add(key);
        }
      }
    }
    // Explicit layouts reserve readable node footprints; this is not an auto-layout generator.
    for (const mode of ["desktop", "mobile"] as const)
      for (let i = 0; i < p.devices.length; i++)
        for (const b of p.devices.slice(i + 1)) {
          const a = p.devices[i];
          if (Math.abs(a[mode].x - b[mode].x) < 220 && Math.abs(a[mode].y - b[mode].y) < 150)
            fail(`Overlapping ${mode} node footprints`);
        }
  });
export type NeutralPublicScenario = z.infer<typeof neutralPublicSchema>;

export function explicitGraph(input: NeutralPublicScenario, mobile: boolean) {
  const p = neutralPublicSchema.parse(input);
  return {
    nodes: p.devices.map((d) => ({
      id: d.id,
      kind: d.kind,
      role: d.role,
      position: mobile ? d.mobile : d.desktop,
      logical: p.links.some((l) => l.kind === "logical" && [l.a.device, l.b.device].includes(d.id)),
    })),
    edges: p.links.map((l) => ({
      id: l.id,
      source: l.a.device,
      target: l.b.device,
      kind: l.kind,
      offset: l.bend?.[mobile ? "mobile" : "desktop"] ?? 0,
      label: `${l.a.interface} — ${l.label} — ${l.b.interface}`,
    })),
  };
}

// Never serialize the private scenario itself as initial Assessment metadata.
export function publicScenario(s: Scenario): NeutralPublicScenario {
  if (!s.foundation) throw Error("Scenario has no neutral public contract");
  const p = s.foundation.public;
  return neutralPublicSchema.parse({
    version: p.version,
    id: p.id,
    title: p.title,
    incident: p.incident,
    design: p.design,
    operations: p.operations,
    devices: p.devices,
    links: p.links,
  });
}
