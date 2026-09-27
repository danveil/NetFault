import { sameSubnet, ipNumber, mask, type Device, type Scenario } from "./schema";
import { normalizeMac } from "./port-security";

type Model = Pick<Scenario, "schemaVersion" | "devices" | "links">;
export function natSource(d: Device, ingress: string | undefined, egress: string, source: string) {
  return d.nat && ingress === d.nat.inside && egress === d.nat.outside
    ? (d.nat.mappings.find((m) => m.insideLocal === source)?.insideGlobal ?? source)
    : source;
}
export function natDestination(d: Device, ingress: string | undefined, destination: string) {
  return d.nat && ingress === d.nat.outside
    ? (d.nat.mappings.find((m) => m.insideGlobal === destination)?.insideLocal ?? destination)
    : destination;
}
export function natOutput(d: Device) {
  return [
    "Static address-only educational subset — configured entries, not traffic-created sessions.",
    ...(d.nat?.mappings ?? []).map(
      (m) => `Mapping ${m.id}\nInside local:  ${m.insideLocal}\nInside global: ${m.insideGlobal}\nType: static`,
    ),
  ].join("\n\n");
}
export function validateNat(s: Model, fail: (message: string) => void) {
  const owners = s.devices.filter((d) => d.nat);
  if (s.schemaVersion !== 12) {
    if (owners.length || s.devices.some((d) => d.commands.includes("show ip nat translations")))
      fail("NAT requires schema 12");
    return;
  }
  if (
    owners.length !== 1 ||
    s.devices.length !== 4 ||
    s.links.length !== 3 ||
    s.devices.filter((d) => d.kind === "router").length !== 2 ||
    s.devices.filter((d) => d.kind === "pc").length !== 2
  )
    fail("Static NAT supports one NAT router in a two-router, two-PC chain");
  if (
    s.devices.some(
      (d) =>
        d.kind === "switch" ||
        d.stp ||
        d.acls ||
        d.portChannels ||
        d.ports ||
        d.vlans ||
        d.interfaces.some((i) => i.ospf || i.hsrp || i.accessGroup),
    )
  )
    fail("Mixed NAT protocol scenarios are unsupported");
  const interfaces = s.devices.flatMap((d) => d.interfaces);
  if (
    interfaces.some((i) => normalizeMac(i.mac) !== i.mac) ||
    new Set(interfaces.map((i) => i.mac)).size !== interfaces.length
  )
    fail("NAT interfaces require unique canonical unicast MACs");
  for (const d of s.devices) {
    if (d.interfaces.length !== (d.kind === "pc" ? 1 : 2)) fail("Unsupported NAT interface count");
    if (
      d.commands.some((c) => ["tracert", "traceroute", "arp -a"].includes(c) || (d.kind === "router" && c === "ping"))
    )
      fail("NAT trace, ARP history and router-originated probes are not supported");
    if (d.commands.includes("show ip nat translations") && !d.nat) fail("NAT command requires a NAT router");
  }
  for (const d of owners) {
    const n = d.nat!;
    const inside = d.interfaces.find((i) => i.name === n.inside),
      outside = d.interfaces.find((i) => i.name === n.outside);
    if (d.kind !== "router" || !inside || !outside || inside === outside) {
      fail("Distinct existing NAT inside/outside interfaces required");
      continue;
    }
    const peer = (name: string) => {
      const l = s.links.find((l) => [l.a, l.b].some((e) => e.device === d.id && e.interface === name));
      return s.devices.find((p) => p.id === (l?.a.device === d.id ? l.b.device : l?.a.device));
    };
    if (peer(n.inside)?.kind !== "pc" || peer(n.outside)?.kind !== "router")
      fail("NAT requires direct inside PC and outside router");
    const far = peer(n.outside);
    if (
      far &&
      !s.links.some(
        (l) =>
          [l.a, l.b].some((e) => e.device === far.id) &&
          [l.a, l.b].some((e) =>
            s.devices.some((p) => p.id === e.device && p.kind === "pc" && p.id !== peer(n.inside)?.id),
          ),
      )
    )
      fail("Outside router requires a directly attached outside PC");
    for (const m of n.mappings) {
      const usable = (ip: string) => {
        const first = Number(ip.split(".")[0]);
        return first > 0 && first < 224 && first !== 127;
      };
      const host = ipNumber(m.insideLocal) & ~mask(inside.prefix);
      if (
        !usable(m.insideLocal) ||
        !usable(m.insideGlobal) ||
        !sameSubnet(m.insideLocal, inside.ip, inside.prefix) ||
        host === 0 ||
        host === ~mask(inside.prefix) >>> 0 ||
        m.insideLocal === inside.ip ||
        m.insideLocal === m.insideGlobal ||
        interfaces.some((i) => sameSubnet(i.ip, m.insideGlobal, i.prefix))
      )
        fail("Static mapping requires a usable inside host and a distinct routed global address");
    }
  }
}
