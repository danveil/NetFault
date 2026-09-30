import { normalize6 } from "./ipv6-address";
import { validateIpv6 } from "./ipv6";
import { validateGre } from "./gre";
import { validateNat } from "./nat";
import { validateHsrp } from "./hsrp";
import { normalizeMac, validatePortSecurity } from "./port-security";
import { z } from "zod";
import { validateStp } from "./stp";
import { validateEtherChannelTopology } from "./etherchannel";

export const ipv4 = z
  .string()
  .refine(
    (s) => /^(\d{1,3}\.){3}\d{1,3}$/.test(s) && s.split(".").every((p) => Number(p) <= 255 && String(Number(p)) === p),
    "Valid dotted IPv4 required",
  );
export const ipv6AddressSchema = z
  .string()
  .trim()
  .refine((v) => !!normalize6(v), "Valid hexadecimal IPv6 address required");
export const ipv6RepairActionSchema = z.strictObject({
  kind: z.literal("ipv6-forwarding"),
  device: z.string().min(1).max(64),
  enabled: z.boolean(),
});
export const commandNames = [
  "show ipv6 interface brief",
  "show interfaces tunnel 0",
  "show ip nat translations",
  "show port-security",
  "show port-security address",
  "show port-security interface fastethernet0/1",
  "show standby brief",
  "show spanning-tree vlan 10",
  "show access-lists",
  "show etherchannel summary",
  "show lacp internal",
  "show interfaces port-channel 1",
  "arp -a",
  "show interfaces fastethernet0/1 switchport",
  "show interfaces fastethernet0/24 switchport",
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
export const aclSequence = z.number().int().min(1).max(999);
export const standardAclSchema = z
  .strictObject({
    name: z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,31}$/),
    entries: z
      .array(
        z.strictObject({
          id: z.string().min(1).max(32),
          sequence: aclSequence,
          action: z.enum(["permit", "deny"]),
          source: z.union([z.literal("any"), z.strictObject({ network: ipv4, prefix: z.literal(24) })]),
        }),
      )
      .min(1)
      .max(2),
  })
  .superRefine((acl, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (new Set(acl.entries.map((e) => e.id)).size !== acl.entries.length) fail("Duplicate ACL entry identity");
    if (acl.entries.some((e, n) => n > 0 && e.sequence <= acl.entries[n - 1].sequence))
      fail("ACL entries must retain strictly increasing configured sequence order");
    for (const e of acl.entries)
      if (e.source !== "any" && network(e.source.network, e.source.prefix) !== `${e.source.network}/${e.source.prefix}`)
        fail("ACL source must be a canonical /24 network");
  });
export type StandardAcl = z.infer<typeof standardAclSchema>;
export const hsrpPrioritySchema = z.number().int().min(0).max(255);
export const hsrpGroupSchema = z.number().int().min(0).max(4095);
export const secureMacSchema = z
  .string()
  .transform((v) => normalizeMac(v) ?? v)
  .refine((v) => normalizeMac(v) === v, "Valid unicast MAC required");
export const portSecuritySchema = z.strictObject({
  enabled: z.boolean(),
  maximum: z.literal(1),
  violation: z.literal("protect"),
  staticMac: z.string().refine((v) => normalizeMac(v) === v, "Canonical unicast MAC required"),
});
export const interfaceSchema = z.object({
  portSecurity: z.never().optional(),
  hsrp: z
    .strictObject({
      version: z.literal(2),
      group: hsrpGroupSchema,
      virtualIp: ipv4,
      priority: hsrpPrioritySchema.optional(),
      preempt: z.literal(true),
    })
    .optional(),
  accessGroup: z.strictObject({ name: z.string(), direction: z.literal("out") }).optional(),
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
      // Legacy packs omit this field; all supported OSPF configurations use no authentication.
      authentication: z.literal("none").optional(),
      cost: z.number().int().positive(),
      hello: z.number().positive(),
      dead: z.number().positive(),
      mtu: z.number().positive(),
    })
    .optional(),
});
export const staticRouteSchema = z.object({
  network: ipv4,
  prefix: z.number().int().min(0).max(32),
  nextHop: ipv4,
});
export const bridgePriority = z.number().int().min(0).max(61440).multipleOf(4096);
export const natSchema = z.strictObject({
  mode: z.literal("static-one-to-one"),
  inside: z.string(),
  outside: z.string(),
  mappings: z.array(z.strictObject({ id: z.string().min(1).max(32), insideLocal: ipv4, insideGlobal: ipv4 })).length(1),
});
export const natRepairActionSchema = z.strictObject({
  kind: z.literal("nat-static-local"),
  device: z.string().min(1).max(64),
  mappingId: z.string().min(1).max(32),
  insideLocal: z.string().trim().pipe(ipv4),
});
export const greSchema = z.strictObject({
  name: z.literal("Tunnel0"),
  mode: z.literal("gre-ip"),
  sourceInterface: z.string().min(1),
  destination: ipv4,
  ip: ipv4,
  prefix: z.literal(30),
  adminUp: z.boolean(),
});
export const greRepairActionSchema = z.strictObject({
  kind: z.literal("gre-destination"),
  device: z.string().min(1).max(64),
  interface: z.literal("Tunnel0"),
  destination: z.string().trim().pipe(ipv4),
});
export const deviceSchema = z.object({
  ipv6: z
    .strictObject({
      forwarding: z.boolean().optional(),
      gateway: ipv6AddressSchema.optional(),
      interfaces: z
        .array(
          z.strictObject({
            name: z.string().min(1).max(64),
            address: ipv6AddressSchema,
            prefix: z.number().int().min(1).max(128),
            up: z.boolean(),
            mac: secureMacSchema,
          }),
        )
        .min(1)
        .max(3),
    })
    .optional(),
  gre: greSchema.optional(),
  tunnelRoutes: z
    .array(z.strictObject({ network: ipv4, prefix: z.number().int().min(1).max(32), interface: z.literal("Tunnel0") }))
    .optional(),
  nat: natSchema.optional(),
  stp: z
    .strictObject({
      vlan: z.number().int().min(1).max(4094),
      priority: bridgePriority,
      mac: z.string(),
      costMethod: z.literal("short"),
    })
    .optional(),
  acls: z.array(standardAclSchema).min(1).max(1).optional(),
  portChannels: z
    .array(
      z.strictObject({
        id: z.number().int().min(1).max(128),
        members: z.array(z.string()).length(2),
        mode: z.enum(["active", "passive"]),
        vlan: z.number().int().min(1).max(4094),
        speed: z.union([z.literal(100), z.literal(1000)]),
        up: z.boolean(),
        standaloneDisable: z.literal(true),
      }),
    )
    .max(1)
    .optional(),
  id: z.string(),
  kind: z.enum(["router", "pc", "switch"]),
  role: z.string(),
  routerId: ipv4.optional(),
  gateway: ipv4.optional(),
  staticRoutes: z.array(staticRouteSchema).optional(),
  interfaces: z.array(interfaceSchema),
  ports: z
    .array(
      z.object({
        portSecurity: portSecuritySchema.optional(),
        mode: z.literal("access").optional(),
        voiceVlan: z.never().optional(),
        stp: z
          .strictObject({
            number: z.number().int().min(1).max(4095),
            cost: z.number().int().min(1).max(65535),
            priority: z.literal(128),
          })
          .optional(),
        name: z.string(),
        vlan: z.number().int().min(1).max(4094),
        up: z.boolean(),
        speed: z.union([z.literal(100), z.literal(1000)]),
        duplex: z.literal("full"),
      }),
    )
    .optional(),
  vlans: z.array(z.object({ id: z.number().int().min(1).max(4094), name: z.string(), active: z.boolean() })).optional(),
  commands: z.array(z.enum(commandNames)).min(1),
});
export const linkSchema = z.object({
  up: z.boolean().optional(),
  id: z.string(),
  a: z.object({ device: z.string(), interface: z.string() }),
  b: z.object({ device: z.string(), interface: z.string() }),
  subnet: z.string(),
});
export const diagnosisSchema = z.object({
  observedForwarding: z.boolean().optional(),
  forwarding: z.boolean().optional(),
  observedDestination: z.string().trim().pipe(ipv4).optional(),
  tunnelDestination: z.string().trim().pipe(ipv4).optional(),
  mappingId: z.string().max(32).optional(),
  observedLocal: z.string().trim().pipe(ipv4).optional(),
  observedGlobal: z.string().trim().pipe(ipv4).optional(),
  insideLocal: z.string().trim().pipe(ipv4).optional(),
  observedSecureMac: secureMacSchema.optional(),
  observedHsrpPriority: hsrpPrioritySchema.optional(),
  observedGroup: hsrpGroupSchema.optional(),
  observedPriority: bridgePriority.optional(),
  aclName: z.string().max(32).optional(),
  observedSequence: aclSequence.optional(),
  observedNextHop: z.string().max(64).optional(),
  hello: z.number().int().min(1).max(65535).optional(),
  dead: z.number().int().min(1).max(65535).optional(),
  destinationNetwork: z.string().max(64).optional(),
  nextHop: z.string().max(64).optional(),
  interface: z.string().max(64).optional(),
  observedVlan: z.number().int().min(1).max(4094).optional(),
  intendedVlan: z.number().int().min(1).max(4094).optional(),
  gateway: z.string().max(64).optional(),
  reason: z
    .enum([
      "ipv6-transit",
      "ipv6-local-proves-transit",
      "gre-endpoint",
      "static-translation",
      "source-admission",
      "virtual-owner",
      "root-election",
      "first-match-policy",
      "unspecified",
      "lacp-initiation",
      "physical-equals-logical",
      "on-link-router",
      "dns-resolution",
      "switch-routing",
      "same-address",
      "reply-route",
      "forward-route",
      "reverse-automatically",
      "hello-adjacency",
      "timer-compatibility",
      "passive-stops-advertising",
    ])
    .optional(),
  cause: z.enum([
    "ipv6-forwarding-disabled",
    "incorrect-tunnel-destination",
    "nat-local",
    "secure-mac",
    "hsrp-priority",
    "bridge-priority",
    "acl-order",
    "lacp-negotiation",
    "unspecified",
    "area-mismatch",
    "interface-down",
    "wrong-gateway",
    "missing-advertisement",
    "timer-mismatch",
    "access-vlan",
    "missing-route",
    "incorrect-static-next-hop",
    "passive-interface",
  ]),
  devices: z.array(z.string()).max(6),
  fix: z.enum([
    "ipv6-forwarding",
    "gre-destination",
    "nat-local",
    "secure-mac",
    "hsrp-priority",
    "bridge-priority",
    "acl-sequence",
    "lacp-mode",
    "unspecified",
    "r3-area0",
    "r2-area1",
    "restart",
    "gateway",
    "no-shutdown",
    "access-vlan",
    "static-route",
    "no-passive",
    "timers",
  ]),
  evidence: z.array(z.string()).max(100),
  notes: z.string().max(2000).default(""),
});
export type Diagnosis = z.infer<typeof diagnosisSchema>;
export const scenarioIdSchema = z.enum([
  "ipv6-01",
  "gre-01",
  "nat-static-01",
  "port-security-01",
  "hsrp-01",
  "stp-01",
  "ospf-01",
  "gateway-01",
  "vlan-01",
  "return-01",
  "passive-01",
  "timer-01",
  "next-hop-01",
  "etherchannel-01",
  "acl-01",
]);
export type ScenarioId = z.infer<typeof scenarioIdSchema>;
const lessonSchema = z.array(
  z.object({ title: z.string(), text: z.string(), revealOnRequest: z.boolean().optional() }),
);
export const scenarioSchema = z
  .object({
    schemaVersion: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
      z.literal(7),
      z.literal(8),
      z.literal(9),
      z.literal(10),
      z.literal(11),
      z.literal(12),
      z.literal(13),
      z.literal(14),
    ]),
    id: scenarioIdSchema,
    revision: z.literal(1),
    title: z.string(),
    incident: z.string(),
    design: z.string(),
    verificationTargets: z.array(z.strictObject({ device: z.string(), target: ipv4 })).optional(),
    stpDesign: z
      .strictObject({ root: z.string(), vlan: z.number().int(), edges: z.array(z.string()).min(1) })
      .optional(),
    policyChecks: z
      .array(
        z.strictObject({
          device: z.string(),
          target: ipv4,
          source: z.string().optional(),
          permitted: z.boolean(),
          fresh: z.boolean(),
        }),
      )
      .min(1)
      .optional(),
    devices: z.array(deviceSchema),
    links: z.array(linkSchema),
    fault: z.object({ cause: diagnosisSchema.shape.cause, devices: z.array(z.string()), interface: z.string() }),
    acceptedFixes: z.array(diagnosisSchema.shape.fix),
    repair: z.union([
      ipv6RepairActionSchema.extend({ reason: z.literal("ipv6-transit") }),
      greRepairActionSchema.extend({ reason: z.literal("gre-endpoint") }),
      natRepairActionSchema.extend({ reason: z.literal("static-translation") }),
      z.strictObject({
        kind: z.literal("port-security-mac"),
        device: z.string(),
        interface: z.string(),
        mac: secureMacSchema,
        reason: z.literal("source-admission"),
      }),
      z.strictObject({
        kind: z.literal("hsrp-priority"),
        device: z.string(),
        interface: z.string(),
        group: hsrpGroupSchema,
        priority: hsrpPrioritySchema,
        reason: z.literal("virtual-owner"),
      }),
      z.strictObject({
        device: z.string(),
        priority: bridgePriority,
        vlan: z.number().int().min(1).max(4094),
        reason: z.literal("root-election"),
      }),
      z.object({
        device: z.string(),
        interface: z.string(),
        acl: z.string(),
        entryId: z.string(),
        sequence: aclSequence,
        newSequence: aclSequence,
        reason: z.literal("first-match-policy"),
      }),
      z.object({
        device: z.string(),
        group: z.number().int().min(1).max(128),
        mode: z.literal("active"),
        reason: z.literal("lacp-initiation"),
      }),
      z.object({
        device: z.string(),
        interface: z.string(),
        hello: z.number().int().min(1).max(65535),
        dead: z.number().int().min(1).max(65535),
        reason: z.literal("timer-compatibility"),
      }),
      z.object({
        device: z.string(),
        interface: z.string(),
        passive: z.literal(false),
        reason: z.literal("hello-adjacency"),
      }),
      z.object({ device: z.string(), route: staticRouteSchema, reason: z.enum(["reply-route", "forward-route"]) }),
      z.object({ device: z.string(), interface: z.string(), area: z.number().int().min(0) }),
      z.object({ device: z.string(), gateway: ipv4, reason: diagnosisSchema.shape.reason.unwrap() }),
      z.object({ device: z.string(), interface: z.string(), vlan: z.number().int().min(1).max(4094) }),
    ]),
    evidenceRules: z.array(
      z.object({
        label: z.string(),
        points: z.number().int().positive(),
        requirements: z
          .array(z.object({ devices: z.array(z.string()).min(1), commands: z.array(z.string()).min(1) }))
          .min(1),
      }),
    ),
    hints: z.array(z.string()).min(3),
    explanation: z.string(),
    solution: z.string(),
    lesson: lessonSchema.optional(),
  })
  .superRefine((s, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (s.schemaVersion === 14) {
      validateIpv6(s, fail);
      return;
    }
    if (s.devices.some((d) => d.ipv6) || ("kind" in s.repair && s.repair.kind === "ipv6-forwarding"))
      fail("IPv6 configuration requires schema 14");
    if (
      s.schemaVersion === 8 &&
      (!s.policyChecks?.some((p) => p.permitted) || !s.policyChecks.some((p) => !p.permitted))
    )
      fail("Policy recovery requires both permitted and excluded controls");
    for (const p of s.policyChecks ?? []) {
      const d = s.devices.find((d) => d.id === p.device);
      if (
        s.schemaVersion !== 8 ||
        !d?.commands.includes("ping") ||
        !s.devices.some((d) => d.interfaces.some((i) => i.ip === p.target)) ||
        (p.source && (d.kind !== "router" || !d.interfaces.some((i) => i.ip === p.source)))
      )
        fail("Invalid policy verification probe");
    }
    validateEtherChannelTopology(s, fail);
    validateStp(s, fail);
    validateNat(s, fail);
    validateGre(s, fail);
    if (
      s.verificationTargets &&
      (s.schemaVersion !== 12 ||
        s.verificationTargets.length !== 2 ||
        s.verificationTargets.some(
          (p) =>
            !s.devices.some((d) => d.id === p.device && d.kind === "pc" && d.commands.includes("ping")) ||
            !s.devices.some(
              (d) =>
                d.interfaces.some((i) => i.ip === p.target) || d.nat?.mappings.some((m) => m.insideGlobal === p.target),
            ),
        ))
    )
      fail("Invalid static NAT verification targets");
    validateHsrp(s, fail);
    validatePortSecurity(s, fail);
    if (
      s.schemaVersion === 9
        ? !s.stpDesign ||
          !s.devices.some((d) => d.stp && d.id === s.stpDesign!.root && d.stp.vlan === s.stpDesign!.vlan) ||
          s.stpDesign.edges.some((id) => !s.links.some((l) => l.id === id))
        : !!s.stpDesign
    )
      fail("Invalid STP design contract");
    const ids = s.devices.map((d) => d.id);
    if (new Set(ids).size !== ids.length) fail("Duplicate device IDs");
    const ips = s.devices.flatMap((d) => d.interfaces.map((i) => i.ip));
    if (new Set(ips).size !== ips.length) fail("Duplicate addresses");
    const rids = s.devices.filter((d) => d.kind === "router").map((d) => d.routerId);
    if (rids.some((r) => !r) || new Set(rids).size !== rids.length) fail("Unique explicit router IDs required");
    const endpoints = new Set<string>();
    const validateRoute = (d: z.infer<typeof deviceSchema> | undefined, r: z.infer<typeof staticRouteSchema>) => {
      if (s.schemaVersion < 4 || d?.kind !== "router") fail("Static routes require a router and schema v4");
      if (network(r.network, r.prefix) !== `${r.network}/${r.prefix}`)
        fail("Static destination must be a canonical network");
      const local = d?.interfaces.find((i) => sameSubnet(i.ip, r.nextHop, i.prefix));
      const peer = s.devices.find(
        (p) => p.id !== d?.id && p.kind === "router" && p.interfaces.some((i) => i.ip === r.nextHop),
      );
      if (
        !local ||
        !peer ||
        !s.links.some(
          (l) =>
            [l.a, l.b].some((e) => e.device === d?.id && e.interface === local.name) &&
            [l.a, l.b].some(
              (e) => e.device === peer.id && peer.interfaces.some((i) => i.name === e.interface && i.ip === r.nextHop),
            ),
        )
      )
        fail("Static next hop must be a directly linked on-subnet router; recursive routes are not modeled");
    };
    if (s.schemaVersion !== 3 && "vlan" in s.repair && !("priority" in s.repair))
      fail("Access VLAN repair requires schema v3");
    if (s.schemaVersion === 1 && (s.devices.some((d) => d.kind === "switch") || "gateway" in s.repair))
      fail("Layer 2 ports and gateway repair require schema v2");
    for (const d of s.devices) {
      const attached = d.interfaces.filter((i) => i.accessGroup);
      if ((d.acls || attached.length) && (s.schemaVersion !== 8 || d.kind !== "router"))
        fail("ACLs require a schema v8 router");
      if (attached.length > 1) fail("Only one outbound ACL attachment per router is supported");
      for (const i of attached)
        if (!d.acls?.some((a) => a.name === i.accessGroup!.name)) fail("ACL attachment references absent list");
      if (s.schemaVersion === 8 && d.commands.some((c) => ["traceroute", "tracert", "arp -a"].includes(c)))
        fail("ACL scenarios do not support trace or ARP history commands");
      if (d.staticRoutes) {
        if (s.schemaVersion < 4 || d.kind !== "router") fail("Static routes require a router and schema v4");
        for (const r of d.staticRoutes) validateRoute(d, r);
        if (new Set(d.staticRoutes.map((r) => `${r.network}/${r.prefix}`)).size !== d.staticRoutes.length)
          fail("Duplicate static destinations are not modeled");
      }
      const allowed =
        d.kind === "switch"
          ? [
              ...commandNames.filter((c) => c.startsWith("show port-security")),
              "show spanning-tree vlan 10",
              "show vlan brief",
              "show interfaces status",
              "show running-config",
              "show etherchannel summary",
              "show lacp internal",
              "show interfaces port-channel 1",
              ...commandNames.filter((c) => c.endsWith(" switchport")),
            ]
          : d.kind === "pc"
            ? ["ipconfig", "ipconfig /all", "route print", "ping", "tracert", "arp -a"]
            : commandNames.filter(
                (c) =>
                  !c.startsWith("show port-security") &&
                  !c.endsWith(" switchport") &&
                  ![
                    "show spanning-tree vlan 10",
                    "show etherchannel summary",
                    "show lacp internal",
                    "show interfaces port-channel 1",
                    "arp -a",
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
        for (const command of d.commands.filter((c) => c.endsWith(" switchport")))
          if (!d.ports?.some((p) => p.name.toLowerCase() === command.split(" ")[2]))
            fail("Switchport command references absent port");
      } else if (d.ports || d.vlans) fail("Only switches have access ports");
      if (new Set(d.interfaces.map((i) => i.name)).size !== d.interfaces.length) fail("Duplicate interface names");
      for (const i of d.interfaces) {
        const host = ipNumber(i.ip) & ~mask(i.prefix);
        if (host === 0 || host === ~mask(i.prefix) >>> 0) fail("Network/broadcast address assigned");
      }
      if (
        d.kind === "pc" &&
        !((s.schemaVersion === 7 || s.schemaVersion === 9) && !d.gateway) &&
        (!d.gateway || !d.interfaces.some((i) => sameSubnet(i.ip, d.gateway!, i.prefix)))
      )
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
        !((s.schemaVersion === 7 || s.schemaVersion === 9) && !d.gateway) &&
        !s.devices.some(
          (r) =>
            r.kind === "router" &&
            r.interfaces.some((i) => i.ip === d.gateway || (s.schemaVersion === 10 && i.hsrp?.virtualIp === d.gateway)),
        ) &&
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
    if (s.fault.interface === "routing-table") {
      if (!("route" in s.repair)) fail("Routing-table fault requires a static route repair");
    } else {
      const [id, name, extra] = s.fault.interface.split(":");
      const d = s.devices.find((d) => d.id === id);
      if (
        extra ||
        !s.fault.devices.includes(id) ||
        !(
          (s.schemaVersion === 9 && d?.stp && name === `VLAN${d.stp.vlan}`) ||
          d?.gre?.name === name ||
          d?.interfaces.some((i) => i.name === name) ||
          d?.ports?.some((p) => p.name === name) ||
          d?.portChannels?.some((p) => `Port-channel${p.id}` === name)
        )
      )
        fail("Fault references absent interface");
    }
    const repair = s.repair;
    const repairedDevice = s.devices.find((d) => d.id === repair.device);
    if ("kind" in repair && repair.kind === "gre-destination") {
      if (s.schemaVersion !== 13 || repairedDevice?.gre?.name !== repair.interface)
        fail("GRE repair requires an existing tunnel");
    } else if ("kind" in repair && repair.kind === "nat-static-local") {
      if (s.schemaVersion !== 12 || !repairedDevice?.nat?.mappings.some((m) => m.id === repair.mappingId))
        fail("NAT repair requires an existing static mapping");
    } else if ("kind" in repair && repair.kind === "port-security-mac") {
      if (
        s.schemaVersion !== 11 ||
        !repairedDevice?.ports?.find((p) => p.name === repair.interface)?.portSecurity?.enabled
      )
        fail("Secure MAC repair requires an existing enabled access policy");
    } else if ("kind" in repair && repair.kind === "hsrp-priority") {
      const member = repairedDevice?.interfaces.find((i) => i.name === repair.interface)?.hsrp;
      if (s.schemaVersion !== 10 || member?.group !== repair.group) fail("HSRP repair requires an existing member");
    } else if ("priority" in repair && "vlan" in repair) {
      if (s.schemaVersion !== 9 || repairedDevice?.stp?.vlan !== repair.vlan)
        fail("STP repair requires an existing bridge instance");
    } else if ("acl" in repair) {
      const acl = repairedDevice?.acls?.find((a) => a.name === repair.acl);
      if (
        s.schemaVersion !== 8 ||
        !acl?.entries.some((e) => e.id === repair.entryId) ||
        acl.entries.some((e) => e.sequence === repair.newSequence && e.id !== repair.entryId) ||
        repairedDevice?.interfaces.find((i) => i.name === repair.interface)?.accessGroup?.name !== repair.acl
      )
        fail("ACL repair requires an existing entry and outbound interface attachment");
    } else if ("group" in repair) {
      if (s.schemaVersion !== 7 || !repairedDevice?.portChannels?.some((p) => p.id === repair.group))
        fail("LACP repair requires a supported port channel");
    } else if ("hello" in repair) {
      const target = repairedDevice?.interfaces.find((i) => i.name === repair.interface);
      if (s.schemaVersion < 6 || repairedDevice?.kind !== "router" || target?.ospf?.networkType !== "point-to-point")
        fail("Timer repair requires schema v6 and an existing point-to-point OSPF router interface");
    } else if ("passive" in repair) {
      const target = repairedDevice?.interfaces.find((i) => i.name === repair.interface);
      if (s.schemaVersion < 5 || repairedDevice?.kind !== "router" || target?.ospf?.networkType !== "point-to-point")
        fail("Passive repair requires schema v5 and an existing point-to-point OSPF router interface");
    } else if ("route" in repair) {
      if (repair.reason === "forward-route" && s.schemaVersion < 6) fail("Forwarding repair requires schema v6");
      validateRoute(repairedDevice, repair.route);
    } else if ("area" in repair) {
      if (!repairedDevice?.interfaces.find((i) => i.name === repair.interface)?.ospf)
        fail("Repair references absent OSPF interface");
    } else if ("vlan" in repair) {
      if (
        repairedDevice?.kind !== "switch" ||
        !repairedDevice.ports?.some((p) => p.name === repair.interface) ||
        !repairedDevice.vlans?.some((v) => v.id === repair.vlan && v.active)
      )
        fail("Repair requires an existing access port and active VLAN");
    } else if ("gateway" in repair) {
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
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
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
  repairIndex: z.number().int().positive().optional(),
  source: z.string().max(64).optional(),
  scenario: scenarioIdSchema.optional(),
  id: z.string(),
  device: z.string(),
  command: z.string(),
  target: z.string(),
  output: z.string(),
  at: z.number(),
});
export type Observation = z.infer<typeof observationSchema>;
export const feedbackSchema = z.object({
  recovery: z.enum(["unresolved", "recovered-unverified", "verified"]).optional(),
  lesson: lessonSchema.optional(),
  score: z.number(),
  parts: z.array(z.object({ name: z.string(), earned: z.number(), possible: z.number(), message: z.string() })),
  explanation: z.string(),
  solution: z.string(),
  timedOut: z.boolean(),
});
export type Feedback = z.infer<typeof feedbackSchema>;
export const lacpRepairActionSchema = z.strictObject({
  device: z.string().min(1).max(64),
  group: z.number().int().min(1).max(128),
  mode: z.enum(["active", "passive"]),
});
export const aclRepairActionSchema = z.strictObject({
  kind: z.literal("acl-sequence"),
  device: z.string().min(1).max(64),
  acl: z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,31}$/),
  sequence: aclSequence,
  newSequence: aclSequence,
});
export const stpRepairActionSchema = z.strictObject({
  kind: z.literal("stp-priority"),
  device: z.string().min(1).max(64),
  vlan: z.number().int().min(1).max(4094),
  priority: bridgePriority,
});
export const hsrpRepairActionSchema = z.strictObject({
  kind: z.literal("hsrp-priority"),
  device: z.string().min(1).max(64),
  interface: z.string().min(1).max(64),
  group: hsrpGroupSchema,
  priority: hsrpPrioritySchema,
});
export const portSecurityRepairActionSchema = z.strictObject({
  kind: z.literal("port-security-mac"),
  device: z.string().min(1).max(64),
  interface: z.string().min(1).max(64),
  mac: secureMacSchema,
});
export const repairActionSchema = z.union([
  ipv6RepairActionSchema,
  greRepairActionSchema,
  natRepairActionSchema,
  portSecurityRepairActionSchema,
  hsrpRepairActionSchema,
  lacpRepairActionSchema,
  aclRepairActionSchema,
  stpRepairActionSchema,
]);
export type RepairAction = z.infer<typeof repairActionSchema>;
export const attemptSchema = z.object({
  repairs: z
    .array(
      z.union([
        ipv6RepairActionSchema.extend({ at: z.number() }),
        greRepairActionSchema.extend({ at: z.number() }),
        natRepairActionSchema.extend({ at: z.number() }),
        portSecurityRepairActionSchema.extend({ at: z.number() }),
        lacpRepairActionSchema.extend({ at: z.number() }),
        aclRepairActionSchema.extend({ at: z.number() }),
        stpRepairActionSchema.extend({ at: z.number() }),
        hsrpRepairActionSchema.extend({ at: z.number() }),
      ]),
    )
    .max(10)
    .optional(),
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
