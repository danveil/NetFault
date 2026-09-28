import { network, sameSubnet, ipNumber, mask, type Device, type Scenario } from "./schema";
import { normalizeMac } from "./port-security";

type Model = Pick<Scenario, "schemaVersion" | "devices" | "links">;
export function grePhysicalUp(s: Model, id: string, name: string): boolean {
  const local = s.devices.find((d) => d.id === id)?.interfaces.find((i) => i.name === name);
  const link = s.links.find((l) => [l.a, l.b].some((e) => e.device === id && e.interface === name));
  const other = link && (link.a.device === id ? link.b : link.a);
  const remote =
    other && s.devices.find((d) => d.id === other.device)?.interfaces.find((i) => i.name === other.interface);
  return !!(local?.up && link && link.up !== false && remote?.up);
}
// Receives only the physical RIB. No recursive dependency on overlay routing or a probe.
export function greLocalState(s: Model, d: Device, physicalRoutes: { prefix: string }[]) {
  const g = d.gre;
  const source = g && d.interfaces.find((i) => i.name === g.sourceInterface);
  const routable =
    !!g &&
    physicalRoutes.some((r) => {
      const [ip, prefix] = r.prefix.split("/");
      return sameSubnet(ip, g.destination, Number(prefix));
    });
  return {
    adminUp: !!g?.adminUp,
    source: source?.ip,
    lineUp: !!(g?.adminUp && source && grePhysicalUp(s, d.id, source.name) && routable),
  };
}
export function greOutput(d: Device, state: ReturnType<typeof greLocalState>) {
  const g = d.gre;
  if (!g) return "% No supported tunnel on this device.";
  return [
    `Tunnel0 is ${state.adminUp ? "up" : "administratively down"}, line protocol is ${state.lineUp ? "up" : "down"}`,
    `Internet address is ${g.ip}/${g.prefix}`,
    `Tunnel source ${state.source} (${g.sourceInterface})`,
    `Tunnel destination ${g.destination}`,
    "Tunnel protocol/transport GRE/IP",
    "Bounded local-state subset. Local up/up is not proof of remote delivery. Remote liveness, keepalives, timers, counters, bandwidth and MTU behavior are not modeled.",
  ].join("\n");
}
export function validateGre(s: Model, fail: (message: string) => void) {
  const owners = s.devices.filter((d) => d.gre);
  if (s.schemaVersion !== 13) {
    if (owners.length || s.devices.some((d) => d.tunnelRoutes || d.commands.includes("show interfaces tunnel 0")))
      fail("GRE requires schema 13");
    return;
  }
  if (
    owners.length !== 2 ||
    s.devices.length !== 5 ||
    s.links.length !== 4 ||
    s.devices.filter((d) => d.kind === "pc").length !== 2 ||
    s.devices.filter((d) => d.kind === "router").length !== 3
  ) {
    fail("GRE requires two endpoint routers, one transport router and two PCs");
    return;
  }
  const transport = s.devices.find((d) => d.kind === "router" && !d.gre);
  const interfaces = s.devices.flatMap((d) => d.interfaces);
  const peer = (d: Device, name: string) => {
    const l = s.links.find((l) => [l.a, l.b].some((e) => e.device === d.id && e.interface === name));
    const end = l && (l.a.device === d.id ? l.b : l.a);
    return s.devices.find((p) => p.id === end?.device);
  };
  const sources = owners.flatMap((d) => d.interfaces.filter((i) => i.name === d.gre!.sourceInterface));
  const overlaps = (a: { ip: string; prefix: number }, b: { ip: string; prefix: number }) =>
    sameSubnet(a.ip, b.ip, Math.min(a.prefix, b.prefix));
  if (sources.length !== 2 || sources.some((i) => i.prefix !== 30)) fail("GRE requires numbered /30 transport sources");
  if (!sameSubnet(owners[0].gre!.ip, owners[1].gre!.ip, 30) || owners[0].gre!.ip === owners[1].gre!.ip)
    fail("GRE requires distinct addresses in one tunnel /30");
  for (const d of s.devices) {
    if (
      d.kind === "switch" ||
      d.nat ||
      d.acls ||
      d.stp ||
      d.ports ||
      d.portChannels ||
      d.vlans ||
      d.interfaces.some((i) => i.ospf || i.hsrp || i.accessGroup)
    )
      fail("Mixed GRE protocols are unsupported");
    if (d.interfaces.length !== (d.kind === "pc" ? 1 : 2) || d.interfaces.some((i) => i.name === "Tunnel0"))
      fail("Unsupported physical GRE interface layout");
    if (d.commands.some((c) => ["traceroute", "tracert", "arp -a"].includes(c)))
      fail("GRE trace and ARP history are unsupported");
    if (!d.gre && (d.tunnelRoutes || d.commands.includes("show interfaces tunnel 0")))
      fail("Tunnel commands/routes require a tunnel");
    if (
      d.kind === "pc" &&
      (peer(d, d.interfaces[0]?.name)?.gre === undefined ||
        peer(d, d.interfaces[0]?.name)?.interfaces.every((i) => i.ip !== d.gateway))
    )
      fail("GRE PC needs its directly attached endpoint gateway");
    for (const r of d.staticRoutes ?? []) {
      const route = { ip: r.network, prefix: r.prefix };
      if (
        !sources.some((i) => r.prefix >= i.prefix && sameSubnet(i.ip, r.network, i.prefix)) ||
        overlaps(route, owners[0].gre!)
      )
        fail("GRE physical static routes are limited to transport destinations");
    }
    const g = d.gre;
    if (!g) continue;
    const source = d.interfaces.find((i) => i.name === g.sourceInterface);
    if (
      d.kind !== "router" ||
      !source ||
      peer(d, g.sourceInterface)?.id !== transport?.id ||
      !d.interfaces.some((i) => peer(d, i.name)?.kind === "pc")
    )
      fail("GRE source must face the intermediate transport router");
    const host = ipNumber(g.ip) & ~mask(g.prefix);
    const tunnelFirst = Number(g.ip.split(".")[0]);
    if (
      tunnelFirst === 0 ||
      tunnelFirst === 127 ||
      tunnelFirst >= 224 ||
      host === 0 ||
      host === 3 ||
      interfaces.some((i) => overlaps(g, i))
    )
      fail("Tunnel addresses must be usable and separate from physical subnets");
    const first = Number(g.destination.split(".")[0]);
    if (
      first === 0 ||
      first === 127 ||
      first >= 224 ||
      d.interfaces.some((i) => i.ip === g.destination) ||
      !sources.some(
        (i) =>
          sameSubnet(i.ip, g.destination, i.prefix) &&
          (ipNumber(g.destination) & 3) > 0 &&
          (ipNumber(g.destination) & 3) < 3,
      )
    )
      fail("Destination must be a nonlocal usable transport IPv4 address");
    if (new Set(d.tunnelRoutes?.map((r) => `${r.network}/${r.prefix}`)).size !== (d.tunnelRoutes?.length ?? 0))
      fail("Duplicate tunnel routes");
    for (const r of d.tunnelRoutes ?? []) {
      const route = { ip: r.network, prefix: r.prefix };
      if (
        network(r.network, r.prefix) !== `${r.network}/${r.prefix}` ||
        sources.some((i) => overlaps(i, route)) ||
        overlaps(g, route)
      )
        fail("Overlay routes cannot cover transport or tunnel addresses; recursion is unsupported");
    }
  }
  if (
    interfaces.some((i) => normalizeMac(i.mac) !== i.mac) ||
    new Set(interfaces.map((i) => i.mac)).size !== interfaces.length
  )
    fail("GRE physical interfaces require unique canonical MACs");
  const nets = interfaces.filter(
    (i, n) => interfaces.findIndex((j) => network(j.ip, j.prefix) === network(i.ip, i.prefix)) === n,
  );
  if (nets.some((a, n) => nets.slice(n + 1).some((b) => overlaps(a, b)))) fail("Physical GRE subnets must not overlap");
}
