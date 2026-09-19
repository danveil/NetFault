import { z } from "zod";

export const ipv4 = z
  .string()
  .refine(
    (s) => /^(\d{1,3}\.){3}\d{1,3}$/.test(s) && s.split(".").every((p) => Number(p) <= 255 && String(Number(p)) === p),
    "Valid dotted IPv4 required",
  );
export const commandNames = [
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
  kind: z.enum(["router", "pc"]),
  role: z.string(),
  routerId: ipv4.optional(),
  gateway: ipv4.optional(),
  interfaces: z.array(interfaceSchema).min(1),
  commands: z.array(z.enum(commandNames)).min(1),
});
export const linkSchema = z.object({
  id: z.string(),
  a: z.object({ device: z.string(), interface: z.string() }),
  b: z.object({ device: z.string(), interface: z.string() }),
  subnet: z.string(),
});
export const diagnosisSchema = z.object({
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
export const scenarioSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.literal("ospf-01"),
    revision: z.literal(1),
    title: z.string(),
    incident: z.string(),
    design: z.string(),
    devices: z.array(deviceSchema),
    links: z.array(linkSchema),
    fault: z.object({ cause: diagnosisSchema.shape.cause, devices: z.array(z.string()), interface: z.string() }),
    acceptedFixes: z.array(diagnosisSchema.shape.fix),
    repair: z.object({ device: z.string(), interface: z.string(), area: z.number().int().min(0) }),
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
    for (const d of s.devices) {
      if (new Set(d.interfaces.map((i) => i.name)).size !== d.interfaces.length) fail("Duplicate interface names");
      for (const i of d.interfaces) {
        const host = ipNumber(i.ip) & ~mask(i.prefix);
        if (host === 0 || host === ~mask(i.prefix) >>> 0) fail("Network/broadcast address assigned");
      }
      if (d.kind === "pc" && (!d.gateway || !d.interfaces.some((i) => sameSubnet(i.ip, d.gateway!, i.prefix))))
        fail("PC gateway must be on-link");
      if (d.kind === "pc" && d.interfaces.some((i) => i.ospf)) fail("PC cannot run OSPF");
    }
    for (const l of s.links) {
      const a = s.devices.find((d) => d.id === l.a.device)?.interfaces.find((i) => i.name === l.a.interface);
      const b = s.devices.find((d) => d.id === l.b.device)?.interfaces.find((i) => i.name === l.b.interface);
      if (!a || !b) {
        fail("Unresolved link endpoint");
        continue;
      }
      if (a.prefix !== b.prefix || !sameSubnet(a.ip, b.ip, a.prefix) || l.subnet !== network(a.ip, a.prefix))
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
        !s.devices.some((r) => r.kind === "router" && r.interfaces.some((i) => i.ip === d.gateway))
      )
        fail("Gateway does not exist");
    if (s.fault.devices.some((id) => !ids.includes(id))) fail("Fault references absent device");
    const repairInterface = s.devices
      .find((d) => d.id === s.repair.device)
      ?.interfaces.find((i) => i.name === s.repair.interface);
    if (!repairInterface?.ospf) fail("Repair references absent OSPF interface");
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
  scenario: z.literal("ospf-01"),
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
