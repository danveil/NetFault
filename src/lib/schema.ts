import { z } from "zod";

export const ipv4 = z
  .string()
  .refine(
    (s) => /^(\d{1,3}\.){3}\d{1,3}$/.test(s) && s.split(".").every((p) => Number(p) <= 255 && String(Number(p)) === p),
    "Valid dotted IPv4 required",
  );
export const commandNames = [
  "show vlan brief",
  "show interfaces status",
  "route print",
  "show ip interface brief",
  "show ip route",
  "show ip ospf neighbor",
  "show ip ospf interface",
  "show ip protocols",
  "show running-config",
  "ping",
  "traceroute",
  "ipconfig",
  "ipconfig /all",
  "tracert",
] as const;
export const interfaceSchema = z.object({
  name: z.string(),
  ip: ipv4,
  prefix: z.number().int().min(1).max(30),
  up: z.boolean(),
  mac: z.string(),
  ospf: z
    .object({
      area: z.number().int().min(0),
      networkType: z.enum(["point-to-point", "broadcast"]),
      passive: z.boolean(),
      cost: z.number().int().positive(),
      hello: z.number().positive(),
      dead: z.number().positive(),
      mtu: z.number().positive(),
    })
    .optional(),
});
export const deviceSchema = z.object({
  id: z.string(),
  kind: z.enum(["router", "pc", "switch"]),
  role: z.string(),
  routerId: ipv4.optional(),
  gateway: ipv4.optional(),
  interfaces: z.array(interfaceSchema),
  ports: z
    .array(
      z.object({
        name: z.string(),
        vlan: z.number().int().min(1).max(4094),
        up: z.boolean(),
        speed: z.literal(1000),
        duplex: z.literal("full"),
      }),
    )
    .optional(),
  vlans: z.array(z.object({ id: z.number().int().min(1).max(4094), name: z.string(), active: z.boolean() })).optional(),
  commands: z.array(z.enum(commandNames)).min(1),
});
export const linkSchema = z.object({
  id: z.string(),
  a: z.object({ device: z.string(), interface: z.string() }),
  b: z.object({ device: z.string(), interface: z.string() }),
  subnet: z.string(),
});
export const diagnosisSchema = z.object({
  gateway: z.string().max(64).optional(),
  reason: z.enum(["unspecified", "on-link-router", "dns-resolution", "switch-routing", "same-address"]).optional(),
  cause: z.enum([
    "unspecified",
    "area-mismatch",
    "interface-down",
    "wrong-gateway",
    "missing-advertisement",
    "timer-mismatch",
  ]),
  devices: z.array(z.string()).max(5),
  fix: z.enum(["unspecified", "r3-area0", "r2-area1", "restart", "gateway", "no-shutdown"]),
  evidence: z.array(z.string()).max(100),
  notes: z.string().max(2000).default(""),
});
export type Diagnosis = z.infer<typeof diagnosisSchema>;
export const scenarioIdSchema = z.enum(["ospf-01", "gateway-01"]);
export type ScenarioId = z.infer<typeof scenarioIdSchema>;
export const scenarioSchema = z
  .object({
    schemaVersion: z.union([z.literal(1), z.literal(2)]),
    id: scenarioIdSchema,
    revision: z.literal(1),
    title: z.string(),
    incident: z.string(),
    design: z.string(),
    devices: z.array(deviceSchema),
    links: z.array(linkSchema),
    fault: z.object({ cause: diagnosisSchema.shape.cause, devices: z.array(z.string()), interface: z.string() }),
    acceptedFixes: z.array(diagnosisSchema.shape.fix),
    repair: z.union([
      z.object({ device: z.string(), interface: z.string(), area: z.number().int().min(0) }),
      z.object({ device: z.string(), gateway: ipv4, reason: diagnosisSchema.shape.reason.unwrap() }),
    ]),
    evidenceRules: z.array(
      z.object({
        label: z.string(),
        points: z.number().int().positive(),
        requirements: z.array(z.object({ devices: z.array(z.string()), commands: z.array(z.string()) })),
      }),
    ),
    hints: z.array(z.string()).min(3),
    explanation: z.string(),
    solution: z.string(),
    lesson: z.array(z.object({ title: z.string(), text: z.string() })).optional(),
  })
  .superRefine((s, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    const ids = s.devices.map((d) => d.id);
    if (new Set(ids).size !== ids.length) fail("Duplicate device IDs");
    const ips = s.devices.flatMap((d) => d.interfaces.map((i) => i.ip));
    if (new Set(ips).size !== ips.length) fail("Duplicate addresses");
    const rids = s.devices.filter((d) => d.kind === "router").map((d) => d.routerId);
    if (rids.some((r) => !r) || new Set(rids).size !== rids.length) fail("Unique explicit router IDs required");
    const endpoints = new Set<string>();
    if (s.schemaVersion === 1 && (s.devices.some((d) => d.kind === "switch") || "gateway" in s.repair))
      fail("Layer 2 ports and gateway repair require schema v2");
    for (const d of s.devices) {
      const allowed =
        d.kind === "switch"
          ? ["show vlan brief", "show interfaces status"]
          : d.kind === "pc"
            ? ["ipconfig", "ipconfig /all", "route print", "ping", "tracert"]
            : commandNames.filter(
                (c) =>
                  ![
                    "ipconfig",
                    "ipconfig /all",
                    "route print",
                    "tracert",
                    "show vlan brief",
                    "show interfaces status",
                  ].includes(c),
              );
      if (d.commands.some((c) => !allowed.includes(c))) fail("Unsupported command for device kind");
      if (d.kind !== "switch" && !d.interfaces.length) fail("IP device requires an interface");
      if (d.kind === "switch") {
        if (d.interfaces.length || !d.ports?.length || !d.vlans?.length)
          fail("Access switch requires ports and VLANs, without routed interfaces");
        if (new Set(d.ports?.map((p) => p.name)).size !== d.ports?.length) fail("Duplicate switch ports");
        if (new Set(d.vlans?.map((v) => v.id)).size !== d.vlans?.length) fail("Duplicate VLANs");
        if (d.ports?.some((p) => !d.vlans?.some((v) => v.id === p.vlan))) fail("Port references absent VLAN");
      } else if (d.ports || d.vlans) fail("Only switches have access ports");
      if (new Set(d.interfaces.map((i) => i.name)).size !== d.interfaces.length) fail("Duplicate interface names");
      for (const i of d.interfaces) {
        const host = ipNumber(i.ip) & ~mask(i.prefix);
        if (host === 0 || host === ~mask(i.prefix) >>> 0) fail("Network/broadcast address assigned");
      }
      if (d.kind === "pc" && (!d.gateway || !d.interfaces.some((i) => sameSubnet(i.ip, d.gateway!, i.prefix))))
        fail("PC gateway must be on-link");
      if (d.kind === "pc" && d.interfaces.some((i) => i.ospf)) fail("PC cannot run OSPF");
      if (
        d.gateway &&
        d.interfaces.some((i) => {
          const host = ipNumber(d.gateway!) & ~mask(i.prefix);
          return host === 0 || host === ~mask(i.prefix) >>> 0;
        })
      )
        fail("Gateway must be a usable host address");
    }
    for (const l of s.links) {
      const endpoint = (e: typeof l.a) => {
        const d = s.devices.find((d) => d.id === e.device);
        return d?.interfaces.find((i) => i.name === e.interface) ?? d?.ports?.find((p) => p.name === e.interface);
      };
      const a = endpoint(l.a),
        b = endpoint(l.b);
      if (!a || !b) {
        fail("Unresolved link endpoint");
        continue;
      }
      if (("ip" in a && l.subnet !== network(a.ip, a.prefix)) || ("ip" in b && l.subnet !== network(b.ip, b.prefix)))
        fail("Link subnet mismatch");
      for (const e of [l.a, l.b]) {
        const key = e.device + ":" + e.interface;
        if (endpoints.has(key)) fail("Interface connected twice");
        endpoints.add(key);
      }
    }
    for (const d of s.devices)
      if (
        d.kind === "pc" &&
        !s.devices.some((r) => r.kind === "router" && r.interfaces.some((i) => i.ip === d.gateway)) &&
        !(
          s.schemaVersion === 2 &&
          s.fault.cause === "wrong-gateway" &&
          s.fault.devices.length === 1 &&
          s.fault.devices[0] === d.id &&
          "gateway" in s.repair &&
          s.repair.device === d.id
        )
      )
        fail("Gateway does not exist");
    if (s.fault.devices.some((id) => !ids.includes(id))) fail("Fault references absent device");
    const repair = s.repair;
    const repairedDevice = s.devices.find((d) => d.id === repair.device);
    if ("area" in repair) {
      if (!repairedDevice?.interfaces.find((i) => i.name === repair.interface)?.ospf)
        fail("Repair references absent OSPF interface");
    } else {
      if (
        repairedDevice?.kind !== "pc" ||
        !repairedDevice.interfaces.some((i) => sameSubnet(i.ip, repair.gateway, i.prefix)) ||
        !s.devices.some((d) => d.kind === "router" && d.interfaces.some((i) => i.ip === repair.gateway))
      )
        fail("Repair requires an on-link router gateway");
    }
    for (const d of s.devices.filter((d) => d.kind === "switch")) {
      for (const p of d.ports ?? []) if (!endpoints.has(`${d.id}:${p.name}`)) fail("Unconnected switch port");
      for (const v of d.vlans ?? []) {
        const subnets = s.links
          .filter((l) =>
            [l.a, l.b].some(
              (e) => e.device === d.id && d.ports?.some((p) => p.name === e.interface && p.vlan === v.id),
            ),
          )
          .map((l) => l.subnet);
        if (new Set(subnets).size > 1) fail("Access VLAN subnet mismatch");
      }
    }
    if (new Set(s.links.map((l) => l.id)).size !== s.links.length) fail("Duplicate link IDs");
    if (s.evidenceRules.reduce((n, r) => n + r.points, 0) !== 30) fail("Evidence rubric must sum to 30");
    for (const r of s.evidenceRules)
      for (const requirement of r.requirements) {
        if (!requirement.devices.length || !requirement.commands.length) fail("Empty evidence requirement");
        if (requirement.devices.some((id) => !ids.includes(id))) fail("Evidence references absent device");
        if (
          requirement.commands.some(
            (c) =>
              !s.devices.some(
                (d) => requirement.devices.includes(d.id) && d.commands.some((supported) => supported === c),
              ),
          )
        )
          fail("Evidence requires unsupported command");
      }
    for (const d of s.devices)
      for (const i of d.interfaces) {
        if (!endpoints.has(d.id + ":" + i.name)) fail("Unconnected interface");
        if (i.ospf?.networkType === "broadcast" && !i.ospf.passive)
          fail("Active broadcast OSPF is not implemented in schema v1");
      }
  });
export type Scenario = z.infer<typeof scenarioSchema>;
export type Device = z.infer<typeof deviceSchema>;
export type Interface = z.infer<typeof interfaceSchema>;
export function ipNumber(ip: string) {
  return ip.split(".").reduce((n, p) => (n * 256 + Number(p)) >>> 0, 0);
}
export function mask(prefix: number) {
  return (0xffffffff << (32 - prefix)) >>> 0;
}
export function dotted(n: number) {
  return [24, 16, 8, 0].map((b) => (n >>> b) & 255).join(".");
}
export function network(ip: string, prefix: number) {
  return `${dotted(ipNumber(ip) & mask(prefix))}/${prefix}`;
}
export function sameSubnet(a: string, b: string, p: number) {
  return (ipNumber(a) & mask(p)) === (ipNumber(b) & mask(p));
}

export const observationSchema = z.object({
  id: z.string(),
  device: z.string(),
  command: z.string(),
  target: z.string(),
  output: z.string(),
  at: z.number(),
});
export type Observation = z.infer<typeof observationSchema>;
export const feedbackSchema = z.object({
  lesson: z.array(z.object({ title: z.string(), text: z.string() })).optional(),
  score: z.number(),
  parts: z.array(z.object({ name: z.string(), earned: z.number(), possible: z.number(), message: z.string() })),
  explanation: z.string(),
  solution: z.string(),
  timedOut: z.boolean(),
});
export type Feedback = z.infer<typeof feedbackSchema>;
export const attemptSchema = z.object({
  version: z.literal(1),
  id: z.string(),
  scenario: scenarioIdSchema,
  mode: z.enum(["practice", "assessment"]),
  startedAt: z.number(),
  finishedAt: z.number().optional(),
  expiresAt: z.number().optional(),
  history: z.array(observationSchema),
  hints: z.array(z.string()),
  diagnosis: diagnosisSchema.optional(),
  feedback: feedbackSchema.optional(),
  revealed: z.boolean().default(false),
});
export type Attempt = z.infer<typeof attemptSchema>;
