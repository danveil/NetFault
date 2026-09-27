import type { Device, Scenario } from "./schema";

type Model = { schemaVersion: number; devices: Device[]; links: Scenario["links"] };
type Port = NonNullable<Device["ports"]>[number];
export function normalizeMac(value: string): string | undefined {
  const v = value.trim();
  if (!/^(?:[0-9a-f]{4}(?:\.[0-9a-f]{4}){2}|[0-9a-f]{2}(?::[0-9a-f]{2}){5}|[0-9a-f]{2}(?:-[0-9a-f]{2}){5})$/i.test(v))
    return;
  const hex = v.replace(/[.:-]/g, "").toLowerCase();
  if (hex === "000000000000" || parseInt(hex.slice(0, 2), 16) & 1) return;
  return hex.match(/.{4}/g)!.join(".");
}
export function admitsSource(port: Pick<Port, "portSecurity">, mac: string) {
  return !port.portSecurity?.enabled || (!!normalizeMac(mac) && normalizeMac(mac) === port.portSecurity.staticMac);
}
export function validatePortSecurity(s: Model, fail: (message: string) => void) {
  const secured = s.devices.flatMap((d) => (d.ports ?? []).filter((p) => p.portSecurity).map((p) => ({ d, p })));
  if (s.schemaVersion !== 11) {
    if (secured.length || s.devices.some((d) => d.commands.some((c) => c.startsWith("show port-security"))))
      fail("Port security requires schema v11");
    return;
  }
  const switches = s.devices.filter((d) => d.kind === "switch"),
    routers = s.devices.filter((d) => d.kind === "router"),
    pcs = s.devices.filter((d) => d.kind === "pc");
  if (
    switches.length !== 1 ||
    routers.length !== 1 ||
    pcs.length < 1 ||
    pcs.length > 3 ||
    secured.length < 1 ||
    secured.length > 2
  )
    fail("Port security supports one access switch/router, one or two local PCs and optional remote PC");
  if (
    s.links.length !== s.devices.length - 1 ||
    s.devices.some(
      (d) => d.stp || d.portChannels || d.acls || d.interfaces.some((i) => i.ospf || i.hsrp || i.accessGroup),
    )
  )
    fail("Unsupported mixed protocol or port-security topology");
  const macs = s.devices.flatMap((d) => d.interfaces.map((i) => i.mac));
  if (macs.some((m) => normalizeMac(m) !== m) || new Set(macs).size !== macs.length)
    fail("Port-security interfaces require unique canonical unicast MAC addresses");
  const sw = switches[0],
    router = routers[0];
  if (!sw || !router) return;
  if (
    sw.vlans?.length !== 1 ||
    sw.ports?.some((p) => p.vlan !== sw.vlans![0].id) ||
    pcs.some((d) => d.interfaces.length !== 1) ||
    router.interfaces.length < 1 ||
    router.interfaces.length > 2
  )
    fail("Only one access VLAN, single-NIC PCs and at most two router interfaces are supported");
  const connected = (id: string) =>
    s.links.filter((l) => l.a.device === id || l.b.device === id).map((l) => (l.a.device === id ? l.b : l.a));
  const peers = connected(sw.id);
  if (
    peers.filter((e) => e.device === router.id).length !== 1 ||
    peers.filter((e) => pcs.some((p) => p.id === e.device)).length < 1 ||
    peers.filter((e) => pcs.some((p) => p.id === e.device)).length > 2 ||
    peers.some((e) => !pcs.some((p) => p.id === e.device) && e.device !== router.id)
  )
    fail("Switch must connect directly to local PCs and exactly one router uplink");
  if (
    pcs.some((p) => connected(p.id).length !== 1 || ![sw.id, router.id].includes(connected(p.id)[0]?.device)) ||
    connected(router.id).some((e) => e.device !== sw.id && !pcs.some((p) => p.id === e.device))
  )
    fail("Only direct endpoint access links and an optional routed host are supported");
  const registrations = new Set<string>();
  for (const { d, p } of secured) {
    const link = s.links.find((l) => [l.a, l.b].some((e) => e.device === d.id && e.interface === p.name));
    const other = link && (link.a.device === d.id ? link.b : link.a);
    if (d.id !== sw.id || !pcs.some((pc) => pc.id === other?.device))
      fail("Secure policy is supported only on directly attached PC access edges");
    const key = `${p.vlan}:${p.portSecurity!.staticMac}`;
    if (registrations.has(key)) fail("Duplicate secure registration in a VLAN is unsupported");
    registrations.add(key);
  }
  for (const d of s.devices)
    for (const c of d.commands) {
      if (["tracert", "traceroute"].includes(c)) fail("Port-security traces are not modeled");
      if (c.startsWith("show port-security interface ") && !d.ports?.some((p) => p.name.toLowerCase() === c.slice(29)))
        fail("Port-security command references absent interface");
    }
}

export type AdmissionDrop = {
  device: string;
  interface: string;
  sourceMac: string;
  phase: "request" | "response" | "data";
};
type Endpoint = { device: string; interface: string };
// Directed Ethernet segment delivery. A switch preserves source MAC; a router's next call supplies its egress MAC.
export function ethernetDelivery(
  s: Model,
  from: Endpoint,
  to: Endpoint,
  sourceMac: string,
): { ok: boolean; drop?: Omit<AdmissionDrop, "phase"> } {
  const seen = new Set<string>();
  const endpoint = (e: Endpoint) => {
    const d = s.devices.find((d) => d.id === e.device);
    return d?.interfaces.find((i) => i.name === e.interface) ?? d?.ports?.find((p) => p.name === e.interface);
  };
  const walk = (e: Endpoint): { ok: boolean; drop?: Omit<AdmissionDrop, "phase"> } => {
    const key = `${e.device}:${e.interface}`;
    if (seen.has(key) || !endpoint(e)?.up) return { ok: false };
    seen.add(key);
    const l = s.links.find((l) => [l.a, l.b].some((p) => p.device === e.device && p.interface === e.interface));
    if (!l || l.up === false) return { ok: false };
    const r = l.a.device === e.device && l.a.interface === e.interface ? l.b : l.a;
    if (!endpoint(r)?.up) return { ok: false };
    if (r.device === to.device && r.interface === to.interface) return { ok: true };
    const sw = s.devices.find((d) => d.id === r.device && d.kind === "switch");
    const ingress = sw?.ports?.find((p) => p.name === r.interface);
    if (!sw || !ingress || !sw.vlans?.some((v) => v.id === ingress.vlan && v.active)) return { ok: false };
    if (!admitsSource(ingress, sourceMac))
      return { ok: false, drop: { device: sw.id, interface: ingress.name, sourceMac } };
    for (const p of sw.ports!.filter((p) => p.name !== ingress.name && p.up && p.vlan === ingress.vlan)) {
      const result = walk({ device: sw.id, interface: p.name });
      if (result.ok || result.drop) return result;
    }
    return { ok: false };
  };
  return walk(from);
}
export function portSecurityOutput(d: Device, command: string, operational: (name: string) => boolean): string {
  const ports = d.ports ?? [];
  const note = "Educational static/max-one/protect subset; no learning, counters, aging or err-disable model.";
  if (command === "show port-security address")
    return [
      "Vlan  Secure MAC Address  Type              Port",
      ...ports
        .filter((p) => p.portSecurity?.enabled)
        .map((p) => `${p.vlan}    ${p.portSecurity!.staticMac}    SecureConfigured  ${p.name}`),
      note,
    ].join("\n");
  if (command === "show port-security")
    return [
      "Secure Port          Max  Configured  Violation Mode",
      ...ports
        .filter((p) => p.portSecurity?.enabled)
        .map((p) => `${p.name}    ${p.portSecurity!.maximum}    1           ${p.portSecurity!.violation}`),
      note,
    ].join("\n");
  const p = ports.find((p) => p.name.toLowerCase() === command.slice(29));
  if (!p) return "% Unsupported port-security interface.";
  return [
    `Interface: ${p.name}`,
    `Port Security: ${p.portSecurity?.enabled ? "Enabled" : "Disabled"}`,
    ...(p.portSecurity
      ? [
          `Port Status: ${operational(p.name) ? (p.portSecurity.enabled ? "Secure-up" : "Operational") : "Unavailable (modeled link/VLAN state)"}`,
          `Violation Mode: ${p.portSecurity.violation}`,
          `Maximum MAC Addresses: ${p.portSecurity.maximum}`,
          "Configured MAC Addresses: 1",
          `Static Secure MAC: ${p.portSecurity.staticMac}`,
        ]
      : []),
    "Operational status does not establish admission for a particular source.",
    note,
  ].join("\n");
}
