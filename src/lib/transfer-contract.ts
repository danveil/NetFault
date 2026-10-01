import { z } from "zod";
import { neutralPublicSchema } from "./neutral-scenario";
import { capabilityCommands } from "./capabilities";
import type { Scenario } from "./schema";

const probe = z.strictObject({ device: z.string().min(1), target: z.string().min(1), source: z.string().optional() });
const evidenceCheck = z.strictObject({
  id: z.string().min(1).max(64),
  layer: z.enum(["configuration", "local", "routing", "policy", "delivery"]),
  device: z.string().min(1),
  commands: z.array(z.string().min(1)).min(1).max(4),
  target: z.string().optional(),
  source: z.string().optional(),
});
export const foundationSchema = z.strictObject({
  profile: z.literal("access-ospf-policy-v1"),
  public: neutralPublicSchema,
  verification: z.strictObject({
    original: z.array(evidenceCheck).min(1).max(20),
    current: z.array(evidenceCheck).min(1).max(20),
    flows: z
      .array(probe.extend({ permitted: z.boolean() }))
      .min(3)
      .max(12),
  }),
});
export type Foundation = z.infer<typeof foundationSchema>;

export function validateFoundation(s: Scenario, fail: (message: string) => void) {
  if (s.schemaVersion !== 15) {
    if (s.foundation || s.id.startsWith("n-")) fail("Neutral foundation requires schema 15");
    return;
  }
  const f = s.foundation;
  if (!f || !s.id.startsWith("n-")) {
    fail("Schema 15 requires a neutral foundation contract");
    return;
  }
  if (
    f.public.id !== s.id ||
    f.public.title !== s.title ||
    f.public.incident !== s.incident ||
    f.public.design !== s.design
  )
    fail("Neutral public identity does not match scenario");
  if (
    !s.devices.some((d) => d.kind === "switch") ||
    !s.devices.some((d) => d.acls?.length) ||
    !s.devices.some((d) => d.interfaces.some((i) => i.ospf && !i.ospf.passive))
  )
    fail("Foundation profile requires access switching, OSPF transit and policy");
  if (s.devices.length !== f.public.devices.length || s.devices.length > 12 || s.links.length !== s.devices.length - 1)
    fail("Foundation requires a bounded connected physical tree");
  const reached = new Set<string>();
  const visit = (id: string) => {
    if (reached.has(id)) return;
    reached.add(id);
    for (const l of s.links) {
      if (l.a.device === id) visit(l.b.device);
      if (l.b.device === id) visit(l.a.device);
    }
  };
  if (s.devices[0]) visit(s.devices[0].id);
  if (reached.size !== s.devices.length) fail("Foundation graph is disconnected");
  if (f.public.links.some((l) => l.kind !== "physical") || f.public.links.length !== s.links.length)
    fail("This composition only supports physical links");
  for (const l of s.links) {
    const p = f.public.links.find((p) => p.id === l.id);
    if (!p || JSON.stringify([p.a, p.b]) !== JSON.stringify([l.a, l.b])) fail("Public cabling differs from model");
  }
  for (const d of s.devices) {
    if (
      d.ipv6 ||
      d.nat ||
      d.gre ||
      d.stp ||
      d.portChannels ||
      d.ports?.some((p) => p.portSecurity || p.stp) ||
      d.interfaces.some((i) => i.hsrp)
    )
      fail("Unsupported foundation protocol composition");
    const p = f.public.devices.find((p) => p.id === d.id);
    if (!p || p.kind !== d.kind) {
      fail("Public device differs from model");
      continue;
    }
    const names = d.kind === "switch" ? (d.ports ?? []).map((p) => p.name) : d.interfaces.map((i) => i.name);
    if ([...names].sort().join() !== [...p.interfaces].sort().join())
      fail("Public interface inventory differs from model");
    try {
      if ([...d.commands].sort().join() !== capabilityCommands(d.kind, p.capabilities).sort().join())
        fail("Commands differ from scenario capabilities");
    } catch {
      fail("Unsupported capability");
    }
    if (p.capabilities.includes("static-translation") || p.capabilities.includes("logical-transport"))
      fail("Unsupported foundation capability");
    if (p.capabilities.includes("standard-policy") && !d.acls?.length)
      fail("Policy capability requires configured policy");
    if (p.capabilities.includes("neighbor-state") && !d.interfaces.some((i) => i.ospf))
      fail("Neighbor capability requires OSPF configuration");
    for (const i of d.interfaces) {
      const l = s.links.find((l) => [l.a, l.b].some((e) => e.device === d.id && e.interface === i.name));
      const remote = l && s.devices.find((p) => p.id === (l.a.device === d.id ? l.b.device : l.a.device));
      if (i.ospf && !i.ospf.passive && (i.ospf.networkType !== "point-to-point" || remote?.kind !== "router"))
        fail("Active OSPF requires a directly linked point-to-point router transit");
      if (i.accessGroup && remote?.kind === "router") fail("Transit ACL control-plane filtering is not modeled");
    }
  }
  if (!("acl" in s.repair) && !("vlan" in s.repair && !("priority" in s.repair)))
    fail("Foundation permits only access assignment or policy ordering repair");
  const checks = [...f.verification.original, ...f.verification.current];
  if (new Set(checks.map((c) => c.id)).size !== checks.length) fail("Duplicate verification check identity");
  for (const c of checks) {
    const d = s.devices.find((d) => d.id === c.device);
    if (!d || c.commands.some((cmd) => !d.commands.some((allowed) => allowed === cmd)))
      fail("Verification references unsupported diagnostic");
    if (
      c.commands.includes("ping")
        ? c.commands.length !== 1 || !c.target
        : c.target !== undefined || c.source !== undefined
    )
      fail("Verification destination/source requires a single ping check");
  }
  for (const c of [...checks.filter((c) => c.target), ...f.verification.flows]) {
    const d = s.devices.find((d) => d.id === c.device);
    if (!d?.commands.includes("ping") || !s.devices.some((p) => p.interfaces.some((i) => i.ip === c.target)))
      fail("Verification probe must reference an actual supported endpoint");
    if (c.source && (d?.kind !== "router" || !d.interfaces.some((i) => i.ip === c.source || i.name === c.source)))
      fail("Verification source is not owned by the probing router");
  }
  for (const layer of ["configuration", "local", "routing", "policy"])
    if (!f.verification.current.some((c) => c.layer === layer))
      fail("Current verification must cover configuration, local, routing and policy layers");
  const flows = f.verification.flows;
  if (!flows.some((p) => !p.permitted)) fail("Retained policy exclusion is required");
  const reciprocal = flows.some((a) => {
    const source = s.devices.find((d) => d.id === a.device && d.kind === "pc")?.interfaces[0].ip;
    return (
      a.permitted &&
      !a.source &&
      source &&
      flows.some(
        (b) =>
          b.permitted &&
          !b.source &&
          b.target === source &&
          s.devices.find((d) => d.id === b.device && d.kind === "pc")?.interfaces[0].ip === a.target,
      )
    );
  });
  if (!reciprocal) fail("Reciprocal endpoint verification is required");
}
