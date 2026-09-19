import { dotted, ipv4, mask, network, sameSubnet, type Device, type Interface, type Scenario } from "./schema";

export type Neighbor = {
  device: string;
  routerId: string;
  address: string;
  interface: string;
  area: number;
  state: "FULL/-";
  cost: number;
};
export type Route = { prefix: string; kind: "C" | "L" | "O"; via?: string; interface: string; cost: number };
export function device(s: Scenario, id: string): Device {
  const d = s.devices.find((d) => d.id === id);
  if (!d) throw Error("Unknown device");
  return d;
}
function peers(s: Scenario, id: string) {
  return s.links.flatMap((l) => {
    const local = l.a.device === id ? l.a : l.b.device === id ? l.b : undefined;
    if (!local) return [];
    const remote = local === l.a ? l.b : l.a;
    return [
      {
        local: device(s, id).interfaces.find((i) => i.name === local.interface)!,
        remote: device(s, remote.device).interfaces.find((i) => i.name === remote.interface)!,
        device: device(s, remote.device),
      },
    ];
  });
}
export function neighbors(s: Scenario, id: string): Neighbor[] {
  return peers(s, id).flatMap((p) => {
    const a = p.local.ospf,
      b = p.remote.ospf;
    if (
      !p.local.up ||
      !p.remote.up ||
      !a ||
      !b ||
      a.passive ||
      b.passive ||
      a.area !== b.area ||
      a.hello !== b.hello ||
      a.dead !== b.dead ||
      a.mtu !== b.mtu ||
      a.networkType !== b.networkType ||
      a.networkType !== "point-to-point"
    )
      return [];
    return [
      {
        device: p.device.id,
        routerId: p.device.routerId!,
        address: p.remote.ip,
        interface: p.local.name,
        area: a.area,
        state: "FULL/-",
        cost: a.cost,
      },
    ];
  });
}
export function routes(s: Scenario, id: string): Route[] {
  const d = device(s, id);
  if (d.kind === "pc") return [];
  const result: Route[] = d.interfaces
    .filter((i) => i.up)
    .flatMap((i) => [
      { prefix: network(i.ip, i.prefix), kind: "C" as const, interface: i.name, cost: 0 },
      { prefix: `${i.ip}/32`, kind: "L" as const, interface: i.name, cost: 0 },
    ]);
  // Dijkstra per area; no invented inter-area summaries, ECMP or redistribution.
  for (const area of new Set(d.interfaces.flatMap((i) => (i.ospf ? [i.ospf.area] : [])))) {
    const queue: { id: string; cost: number; first?: Neighbor }[] = [{ id, cost: 0 }];
    const visited = new Set<string>();
    while (queue.length) {
      queue.sort((a, b) => a.cost - b.cost);
      const current = queue.shift()!;
      if (visited.has(current.id)) continue;
      visited.add(current.id);
      if (current.first)
        for (const i of device(s, current.id).interfaces) {
          if (!i.up || i.ospf?.area !== area) continue;
          const prefix = network(i.ip, i.prefix),
            cost = current.cost + i.ospf.cost,
            existing = result.find((r) => r.prefix === prefix);
          if (!existing)
            result.push({ prefix, kind: "O", via: current.first.address, interface: current.first.interface, cost });
          else if (existing.kind === "O" && cost < existing.cost) {
            existing.cost = cost;
            existing.via = current.first.address;
            existing.interface = current.first.interface;
          }
        }
      for (const n of neighbors(s, current.id).filter((n) => n.area === area))
        queue.push({ id: n.device, cost: current.cost + n.cost, first: current.first ?? n });
    }
  }
  return result;
}
function lookup(s: Scenario, id: string, target: string) {
  return routes(s, id)
    .filter((r) => {
      const [ip, p] = r.prefix.split("/");
      return sameSubnet(ip, target, Number(p));
    })
    .sort((a, b) => Number(b.prefix.split("/")[1]) - Number(a.prefix.split("/")[1]))[0];
}
type Path = { ok: boolean; hops: string[]; reason: string };
export function forward(s: Scenario, start: string, target: string): Path {
  let current = device(s, start);
  const seen = new Set<string>();
  const hops: string[] = [];
  for (let ttl = 0; ttl < 16; ttl++) {
    if (current.interfaces.some((i) => i.up && i.ip === target)) return { ok: true, hops, reason: "Delivered" };
    if (seen.has(current.id)) return { ok: false, hops, reason: "Routing loop" };
    seen.add(current.id);
    let out: Interface | undefined, nextHop: string | undefined;
    if (current.kind === "pc") {
      out = current.interfaces[0];
      nextHop = sameSubnet(out.ip, target, out.prefix) ? target : current.gateway;
    } else {
      const route = lookup(s, current.id, target);
      if (!route) return { ok: false, hops, reason: `${current.id}: no route to destination` };
      out = current.interfaces.find((i) => i.name === route.interface);
      nextHop = route.via ?? target;
    }
    if (!out?.up) return { ok: false, hops, reason: `${current.id}: interface down` };
    const peer = peers(s, current.id).find((p) => p.local.name === out.name && p.remote.up && p.remote.ip === nextHop);
    if (!peer) return { ok: false, hops, reason: `${current.id}: next-hop resolution failed` };
    hops.push(peer.remote.ip);
    current = peer.device;
  }
  return { ok: false, hops, reason: "Hop limit exceeded" };
}
export function connectivity(s: Scenario, id: string, target: string) {
  const d = device(s, id),
    route = d.kind === "router" ? lookup(s, id, target) : undefined;
  const source = (d.interfaces.find((i) => i.name === route?.interface) ?? d.interfaces[0]).ip;
  const outward = forward(s, id, target),
    destination = s.devices.find((d) => d.interfaces.some((i) => i.ip === target));
  const returning = destination ? forward(s, destination.id, source) : undefined;
  return { ok: outward.ok && !!returning?.ok, source, outward, returning };
}
export function runningConfig(s: Scenario, id: string) {
  const d = device(s, id);
  return [
    `hostname ${d.id}`,
    ...d.interfaces.flatMap((i) => [
      `interface ${i.name}`,
      ` ip address ${i.ip} ${dotted(mask(i.prefix))}`,
      i.up ? " no shutdown" : " shutdown",
      ...(i.ospf
        ? [
            ` ip ospf 1 area ${i.ospf.area}`,
            ` ip ospf cost ${i.ospf.cost}`,
            ` ip ospf hello-interval ${i.ospf.hello}`,
            ` ip ospf dead-interval ${i.ospf.dead}`,
            ` ip mtu ${i.ospf.mtu}`,
            ...(i.ospf.networkType === "point-to-point" ? [" ip ospf network point-to-point"] : []),
          ]
        : []),
      "!",
    ]),
    `router ospf 1`,
    ` router-id ${d.routerId}`,
    ...d.interfaces.filter((i) => i.ospf?.passive).map((i) => ` passive-interface ${i.name}`),
  ].join("\n");
}
export function execute(s: Scenario, id: string, raw: string, target = ""): string {
  const d = device(s, id),
    cmd = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!d.commands.some((c) => c === cmd))
    return `% Unsupported command on ${id}: ${raw}. Use the supported command buttons. This is a bounded simulator, not an IOS shell.`;
  if (["ping", "traceroute", "tracert"].includes(cmd)) {
    if (!ipv4.safeParse(target.trim()).success)
      return "% Enter a dotted IPv4 destination. DNS names and command flags are not implemented.";
    const t = target.trim(),
      c = connectivity(s, id, t);
    if (cmd === "ping")
      return [
        `PING ${t} (source ${c.source})`,
        c.ok ? "!!!!!\nSuccess rate is 100 percent (5/5)." : ".....\nSuccess rate is 0 percent (0/5).",
        c.ok ? "Echo replies returned." : "No echo replies returned. Inspect routes in both directions.",
      ].join("\n");
    // Only display hops whose ICMP responses can route back to the original source.
    const hops = c.outward.hops.map((ip, index) => {
      const owner = s.devices.find((d) => d.interfaces.some((i) => i.ip === ip))!;
      return `${index + 1}  ${forward(s, owner.id, c.source).ok ? ip : "* * *"}`;
    });
    return [
      `Tracing route to ${t} (source ${c.source})`,
      ...hops,
      ...(!c.outward.ok ? [`${hops.length + 1}  !H  Destination unreachable (${c.outward.reason})`] : []),
      c.ok ? "Trace complete." : "Trace stopped; destination did not return a reply.",
      "Simulator trace: hop reachability only; latency and per-probe TTL timing are not modeled.",
    ].join("\n");
  }
  if (cmd === "ipconfig" || cmd === "ipconfig /all")
    return [
      `${d.id} — static IPv4 configuration`,
      ...d.interfaces.flatMap((i) => [
        `Ethernet adapter ${i.name}`,
        ` IPv4 Address . . . : ${i.ip}`,
        ` Subnet Mask . . . : ${dotted(mask(i.prefix))}`,
        ` Default Gateway . : ${d.gateway}`,
        ` Media State . . . : ${i.up ? "Connected" : "Disconnected"}`,
        ...(cmd.endsWith("/all")
          ? [
              ` Physical Address . : ${i.mac}`,
              " DHCP Enabled . . . : No",
              " DNS Servers . . . : Not configured (numeric diagnostics only)",
            ]
          : []),
      ]),
    ].join("\n");
  if (cmd === "show ip interface brief")
    return [
      "Interface       IP-Address        OK? Method Status  Protocol",
      ...d.interfaces.map(
        (i) =>
          `${i.name.padEnd(15)} ${i.ip.padEnd(17)} YES manual ${i.up ? "up      up" : "administratively down down"}`,
      ),
    ].join("\n");
  if (cmd === "show running-config") return runningConfig(s, id);
  if (cmd === "show ip ospf neighbor")
    return [
      "Neighbor ID     Pri State   Dead Time Address         Interface",
      ...neighbors(s, id).map(
        (n) => `${n.routerId.padEnd(15)} 0   ${n.state}  00:00:36  ${n.address.padEnd(15)} ${n.interface}`,
      ),
      ...(neighbors(s, id).length ? [] : ["(No OSPF neighbors)"]),
    ].join("\n");
  if (cmd === "show ip ospf interface")
    return d.interfaces
      .filter((i) => i.ospf)
      .map((i) => {
        const o = i.ospf!;
        return [
          `${i.name} is ${i.up ? "up, line protocol is up" : "down, line protocol is down"}`,
          ` Internet Address ${i.ip}/${i.prefix}, Area ${o.area}`,
          ` Process ID 1, Router ID ${d.routerId}, Network Type ${o.networkType.toUpperCase()}, Cost: ${o.cost}`,
          ` State ${o.networkType === "point-to-point" ? "POINT_TO_POINT" : "DR"}, MTU ${o.mtu}`,
          ` Timer intervals configured, Hello ${o.hello}, Dead ${o.dead}`,
          o.passive
            ? " No Hellos (Passive interface)"
            : ` Neighbor Count is ${neighbors(s, id).filter((n) => n.interface === i.name).length}, Adjacent neighbor count is ${neighbors(s, id).filter((n) => n.interface === i.name).length}`,
        ].join("\n");
      })
      .join("\n\n");
  if (cmd === "show ip protocols")
    return [
      `Routing Protocol is "ospf 1"`,
      ` Router ID ${d.routerId}`,
      ` Number of areas in this router is ${new Set(d.interfaces.flatMap((i) => (i.ospf ? [i.ospf.area] : []))).size}`,
      ` Routing on Interfaces Configured Explicitly (Area):`,
      ...d.interfaces.filter((i) => i.ospf).map((i) => `  ${i.name} (${i.ospf!.area})`),
      " Passive Interface(s):",
      ...d.interfaces.filter((i) => i.ospf?.passive).map((i) => `  ${i.name}`),
      " Routing Information Sources:",
      ...neighbors(s, id).map((n) => `  ${n.routerId}  Distance 110`),
      " Distance: (default is 110)",
    ].join("\n");
  if (cmd === "show ip route")
    return [
      "Codes: C - connected, L - local, O - OSPF",
      "Gateway of last resort is not set",
      "",
      ...routes(s, id).map(
        (r) =>
          `${r.kind} ${r.prefix.padEnd(20)} ${r.kind === "O" ? `[110/${r.cost}] via ${r.via}, ${r.interface}` : `is directly connected, ${r.interface}`}`,
      ),
    ].join("\n");
  return "% Unsupported command.";
}
export function repaired(s: Scenario): Scenario {
  const next = structuredClone(s);
  device(next, s.repair.device).interfaces.find((i) => i.name === s.repair.interface)!.ospf!.area = s.repair.area;
  return next;
}
