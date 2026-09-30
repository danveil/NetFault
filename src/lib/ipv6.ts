import type { Scenario, Device } from "./schema";
import type { Path } from "./engine";
import { equal6, global6, network6, normalize6, samePrefix6 } from "./ipv6-address";

type Nic = NonNullable<Device["ipv6"]>["interfaces"][number];
export type V6Path = Path;
const get = (s: Scenario, id: string) => {
  const d = s.devices.find((d) => d.id === id);
  if (!d?.ipv6) throw Error("IPv6 device required");
  return d;
};
export function ipv6PortUp(s: Scenario, id: string, name: string): boolean {
  const d = get(s, id),
    i = d.ipv6!.interfaces.find((i) => i.name === name);
  if (!i?.up) return false;
  return s.links.some((l) => {
    const e =
      l.a.device === id && l.a.interface === name ? l.b : l.b.device === id && l.b.interface === name ? l.a : undefined;
    return e && l.up !== false && get(s, e.device).ipv6!.interfaces.some((n) => n.name === e.interface && n.up);
  });
}
// Routes are manually configured on-link prefixes. They are not inferred from SLAAC address bits.
export function ipv6Connected(s: Scenario, id: string) {
  return get(s, id)
    .ipv6!.interfaces.filter((i) => ipv6PortUp(s, id, i.name))
    .map((i) => ({
      network: network6(i.address, i.prefix),
      prefix: i.prefix,
      interface: i.name,
      address: normalize6(i.address)!,
    }));
}
function exit6(s: Scenario, d: Device, target: string): Nic | undefined {
  return (
    d
      .ipv6!.interfaces.filter((i) => ipv6PortUp(s, d.id, i.name) && samePrefix6(i.address, target, i.prefix))
      .sort((a, b) => b.prefix - a.prefix)[0] ?? (d.kind === "pc" ? d.ipv6!.interfaces[0] : undefined)
  );
}
// Bounded ND resolution: only the owner on this actual live link can answer.
export function resolveNeighbor6(s: Scenario, id: string, name: string, target: string) {
  if (!ipv6PortUp(s, id, name)) return undefined;
  for (const l of s.links) {
    const e =
      l.a.device === id && l.a.interface === name ? l.b : l.b.device === id && l.b.interface === name ? l.a : undefined;
    if (!e || l.up === false) continue;
    const peer = get(s, e.device),
      nic = peer.ipv6!.interfaces.find((i) => i.name === e.interface);
    if (nic?.up && equal6(nic.address, target)) return peer;
  }
}
export function forward6(s: Scenario, start: string, target: string, source: string): V6Path {
  let current = get(s, start);
  const hops: string[] = [],
    visited = new Set<string>();
  const result = (ok: boolean, reason: string): V6Path => ({
    ok,
    hops,
    reason,
    ...(ok
      ? {
          delivered: {
            device: current.id,
            interface: current.ipv6!.interfaces.find((i) => equal6(i.address, target))!.name,
            source: normalize6(source)!,
            destination: normalize6(target)!,
          },
        }
      : {}),
  });
  if (!global6(target) || !global6(source))
    return result(false, "Only global-unicast hexadecimal IPv6 probes are modeled.");
  if (!current.ipv6!.interfaces.some((i) => equal6(i.address, source) && ipv6PortUp(s, start, i.name)))
    return result(false, "No operational local source address.");
  for (let n = 0; n <= s.devices.length; n++) {
    if (visited.has(current.id)) return result(false, "Forwarding loop; bounded traversal stopped.");
    visited.add(current.id);
    hops.push(current.id);
    if (current.ipv6!.interfaces.some((i) => ipv6PortUp(s, current.id, i.name) && equal6(i.address, target)))
      return result(true, "Delivered to the addressed local interface.");
    if (current.id !== start && (current.kind !== "router" || !current.ipv6!.forwarding))
      return result(false, "Transit forwarding unavailable at the receiving device.");
    const out = exit6(s, current, target);
    if (!out || !ipv6PortUp(s, current.id, out.name))
      return result(false, "No operational on-link route for the destination.");
    const nextHop =
      current.kind === "pc" && !samePrefix6(out.address, target, out.prefix) ? current.ipv6!.gateway : target;
    if (!nextHop) return result(false, "No configured default next hop.");
    if (!samePrefix6(out.address, nextHop, out.prefix))
      return result(false, "Default next hop is not on the configured link.");
    const peer = resolveNeighbor6(s, current.id, out.name, nextHop);
    if (!peer) return result(false, "IPv6 neighbor resolution did not find the next hop on this link.");
    current = peer;
  }
  return result(false, "Bounded forwarding limit reached.");
}
export function connectivity6(s: Scenario, id: string, target: string, requestedSource = "") {
  const d = get(s, id),
    targetIp = normalize6(target);
  if (!targetIp || !global6(targetIp))
    throw Error(
      "Enter a supported global-unicast IPv6 destination; zones, IPv4 and link-local probes are not modeled.",
    );
  const explicit = requestedSource
    ? d.ipv6!.interfaces.find(
        (i) => i.name.toLowerCase() === requestedSource.trim().toLowerCase() || equal6(i.address, requestedSource),
      )
    : undefined;
  if (requestedSource && (d.kind !== "router" || !explicit || !ipv6PortUp(s, id, explicit.name)))
    throw Error("Choose an operational local router IPv6 interface or its address.");
  const nic = explicit ?? exit6(s, d, targetIp) ?? d.ipv6!.interfaces[0];
  const source = normalize6(nic.address)!;
  const outward = forward6(s, id, targetIp, source);
  const end = outward.delivered;
  const returning = end ? forward6(s, end.device, end.source, end.destination) : undefined;
  return {
    source,
    outward,
    returning,
    ok:
      !!returning?.ok &&
      returning.delivered?.device === id &&
      equal6(returning.delivered.destination, source) &&
      equal6(returning.delivered.source, targetIp),
  };
}
export function execute6(s: Scenario, id: string, cmd: string, target: string, source: string): string {
  const d = get(s, id),
    conf = d.ipv6!;
  const footer =
    "Educational IPv6 subset: manually configured addresses/on-link routes; direct-link ND resolution. Link-local, RA, SLAAC, DAD, multicast and timers are omitted. No ARP.";
  if (cmd === "ping") {
    try {
      const c = connectivity6(s, id, target, source);
      return `PING IPv6 ${normalize6(target)}\nSource ${c.source}\n${c.ok ? "!!!!!\nSuccess rate is 100 percent (5/5)." : ".....\nSuccess rate is 0 percent (0/5)."}\nDeterministic echo exchange; no live latency or packet capture.`;
    } catch (e) {
      return `% ${e instanceof Error ? e.message : "Invalid IPv6 probe"}`;
    }
  }
  if (cmd === "show ipv6 interface brief")
    return [
      "IPv6 interfaces — configured global addresses only",
      ...conf.interfaces.map(
        (i) =>
          `${i.name} [${ipv6PortUp(s, id, i.name) ? "up/up" : i.up ? "up/down" : "administratively down/down"}]\n  ${normalize6(i.address)}/${i.prefix}`,
      ),
      footer,
    ].join("\n");
  if (cmd === "show running-config")
    return [
      "! Effective modeled configuration; explicit default state included",
      `hostname ${d.id}`,
      conf.forwarding ? "ipv6 unicast-routing" : "no ipv6 unicast-routing",
      ...conf.interfaces.map(
        (i) =>
          `interface ${i.name}\n ipv6 address ${normalize6(i.address)}/${i.prefix}\n ${i.up ? "no shutdown" : "shutdown"}`,
      ),
      footer,
    ].join("\n");
  if (cmd === "ipconfig" || cmd === "ipconfig /all")
    return [
      "Manual IPv6 configuration — educational host view",
      ...conf.interfaces.map(
        (i) =>
          `${i.name}\nIPv6 Address: ${normalize6(i.address)}\nConfigured on-link prefix: ${network6(i.address, i.prefix)}\nMedia: ${ipv6PortUp(s, id, i.name) ? "connected" : "disconnected"}`,
      ),
      `Default next hop: ${conf.gateway ? normalize6(conf.gateway) : "none"}`,
      footer,
    ].join("\n");
  if (cmd === "route print")
    return [
      "Configured IPv6 host routes — educational subset",
      ...ipv6Connected(s, id).map(
        (r) => `${r.network}\n  On-link, ${r.interface}\n${r.address}/128\n  Local interface`,
      ),
      ...(conf.gateway ? [`::/0\n  via ${normalize6(conf.gateway)}, ${conf.interfaces[0].name}`] : []),
      footer,
    ].join("\n");
  return "% Unsupported IPv6 command in this bounded model.";
}
export function validateIpv6(s: Scenario, fail: (m: string) => void) {
  const ids = new Set<string>(),
    addresses = new Set<string>(),
    macs = new Set<string>(),
    endpoints = new Set<string>();
  if (s.devices.length < 2 || s.devices.length > 6 || s.links.length !== s.devices.length - 1)
    fail("IPv6 requires a bounded direct-link tree");
  for (const d of s.devices) {
    if (ids.has(d.id)) fail("Duplicate IPv6 device ID");
    ids.add(d.id);
    if (
      !d.ipv6 ||
      d.kind === "switch" ||
      d.interfaces.length ||
      d.gateway ||
      d.routerId ||
      d.staticRoutes ||
      d.ports ||
      d.vlans ||
      d.gre ||
      d.nat ||
      d.tunnelRoutes ||
      d.acls ||
      d.stp ||
      d.portChannels
    ) {
      fail("IPv6-only direct-link devices required; mixed protocols are unsupported");
      continue;
    }
    if (
      d.kind === "router"
        ? d.ipv6.forwarding === undefined || !!d.ipv6.gateway
        : d.ipv6.forwarding !== undefined || d.ipv6.interfaces.length !== 1
    )
      fail("Invalid IPv6 forwarding/gateway role");
    const names = new Set<string>();
    for (const i of d.ipv6.interfaces) {
      if (names.has(i.name.toLowerCase())) fail("Duplicate IPv6 interface name");
      names.add(i.name.toLowerCase());
      const a = normalize6(i.address)!;
      if (!global6(a) || addresses.has(a) || macs.has(i.mac)) fail("Unique global IPv6 identities and MACs required");
      addresses.add(a);
      macs.add(i.mac);
    }
    if (d.ipv6.gateway && !global6(d.ipv6.gateway)) fail("Only manual global-unicast next hops supported");
    const allowed =
      d.kind === "router"
        ? ["show ipv6 interface brief", "show running-config", "ping"]
        : ["ipconfig", "ipconfig /all", "route print", "ping"];
    if (d.commands.some((c) => !allowed.includes(c))) fail("Unsupported IPv6 command");
  }
  const linkIds = new Set<string>();
  for (const l of s.links) {
    if (linkIds.has(l.id) || l.a.device === l.b.device) fail("Duplicate or self IPv6 link");
    linkIds.add(l.id);
    for (const e of [l.a, l.b]) {
      const key = `${e.device}:${e.interface}`;
      if (
        endpoints.has(key) ||
        !s.devices.find((d) => d.id === e.device)?.ipv6?.interfaces.some((i) => i.name === e.interface)
      )
        fail("Invalid or reused IPv6 link endpoint");
      endpoints.add(key);
    }
  }
  for (const d of s.devices)
    for (const i of d.ipv6?.interfaces ?? [])
      if (!endpoints.has(`${d.id}:${i.name}`)) fail("Unattached IPv6 interface");
  const reached = new Set(s.devices[0] ? [s.devices[0].id] : []);
  for (let n = 0; n < s.devices.length; n++)
    for (const l of s.links)
      if (reached.has(l.a.device) || reached.has(l.b.device)) {
        reached.add(l.a.device);
        reached.add(l.b.device);
      }
  if (reached.size !== s.devices.length) fail("Disconnected IPv6 topology");
  if (s.policyChecks || s.stpDesign || s.verificationTargets) fail("IPv4 recovery metadata cannot apply to IPv6");
  if (
    !("kind" in s.repair) ||
    s.repair.kind !== "ipv6-forwarding" ||
    !s.devices.some((d) => d.id === s.repair.device && d.kind === "router")
  )
    fail("IPv6 forwarding repair must target a router");
  if (!s.fault.devices.length || s.fault.devices.some((id) => !ids.has(id))) fail("IPv6 fault location must exist");
  if (!s.evidenceRules.length || s.evidenceRules.reduce((n, r) => n + r.points, 0) !== 30)
    fail("Evidence must total 30");
}
