import {
  dotted,
  ipv4,
  mask,
  network,
  sameSubnet,
  type Device,
  type Interface,
  type Observation,
  type Scenario,
} from "./schema";

export type Neighbor = {
  device: string;
  routerId: string;
  address: string;
  interface: string;
  area: number;
  state: "FULL/-";
  cost: number;
};
export type Route = { prefix: string; kind: "C" | "L" | "O" | "S"; via?: string; interface: string; cost: number };
export function device(s: Scenario, id: string): Device {
  const d = s.devices.find((d) => d.id === id);
  if (!d) throw Error("Unknown device");
  return d;
}
function peers(s: Scenario, id: string) {
  const result: { local: Interface; remote: Interface; device: Device }[] = [];
  for (const local of device(s, id).interfaces) {
    const visited = new Set<string>();
    const walk = (owner: string, port: string) => {
      const key = `${owner}:${port}`;
      if (visited.has(key)) return;
      visited.add(key);
      for (const link of s.links) {
        const remote =
          link.a.device === owner && link.a.interface === port
            ? link.b
            : link.b.device === owner && link.b.interface === port
              ? link.a
              : undefined;
        if (!remote) continue;
        const d = device(s, remote.device);
        if (d.kind !== "switch") {
          const intf = d.interfaces.find((i) => i.name === remote.interface)!;
          if (d.id !== id) result.push({ local, remote: intf, device: d });
        } else {
          const ingress = d.ports!.find((p) => p.name === remote.interface)!;
          if (!ingress.up || !d.vlans!.some((v) => v.id === ingress.vlan && v.active)) continue;
          for (const p of d.ports!.filter((p) => p.up && p.vlan === ingress.vlan && p.name !== ingress.name))
            walk(d.id, p.name);
        }
      }
    };
    walk(id, local.name);
  }
  return result;
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
  if (d.kind !== "router") return [];
  const result: Route[] = d.interfaces
    .filter((i) => i.up)
    .flatMap((i) => [
      { prefix: network(i.ip, i.prefix), kind: "C" as const, interface: i.name, cost: 0 },
      { prefix: `${i.ip}/32`, kind: "L" as const, interface: i.name, cost: 0 },
    ]);
  // Connected (AD 0), then static (AD 1), then OSPF (AD 110) for the same prefix.
  for (const r of d.staticRoutes ?? []) {
    const out = d.interfaces.find((i) => i.up && sameSubnet(i.ip, r.nextHop, i.prefix));
    const prefix = `${r.network}/${r.prefix}`;
    if (out && !result.some((existing) => existing.prefix === prefix))
      result.push({ prefix, kind: "S", via: r.nextHop, interface: out.name, cost: 0 });
  }
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
type Resolution = { device: string; local: Interface; ip: string; peer?: { device: Device; remote: Interface } };
export function forward(s: Scenario, start: string, target: string, observe?: (r: Resolution) => void): Path {
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
    if (nextHop) observe?.({ device: current.id, local: out, ip: nextHop, peer });
    if (!peer) return { ok: false, hops, reason: `${current.id}: next-hop resolution failed` };
    hops.push(peer.remote.ip);
    current = peer.device;
  }
  return { ok: false, hops, reason: "Hop limit exceeded" };
}
export function connectivity(s: Scenario, id: string, target: string, requestedSource = "") {
  const d = device(s, id),
    route = d.kind === "router" ? lookup(s, id, target) : undefined;
  const explicit = requestedSource
    ? d.interfaces.find(
        (i) => i.up && (i.ip === requestedSource || i.name.toLowerCase() === requestedSource.toLowerCase()),
      )
    : undefined;
  if (requestedSource && (d.kind !== "router" || !explicit))
    throw Error("Source must be an active interface or IPv4 address on this router.");
  const source = (explicit ?? d.interfaces.find((i) => i.name === route?.interface) ?? d.interfaces[0]).ip;
  const outward = forward(s, id, target),
    destination = s.devices.find((d) => d.interfaces.some((i) => i.ip === target));
  const returning = destination ? forward(s, destination.id, source) : undefined;
  return { ok: outward.ok && !!returning?.ok, source, outward, returning };
}
export function runningConfig(s: Scenario, id: string) {
  const d = device(s, id);
  if (d.kind === "switch")
    return [
      `hostname ${d.id}`,
      ...d.vlans!.flatMap((v) => [`vlan ${v.id}`, ` name ${v.name}`, ` state ${v.active ? "active" : "suspend"}`, "!"]),
      ...d.ports!.flatMap((p) => [
        `interface ${p.name}`,
        " switchport mode access",
        ` switchport access vlan ${p.vlan}`,
        p.up ? " no shutdown" : " shutdown",
        "!",
      ]),
      "! Modeled access ports only; no routed interfaces or SVI.",
    ].join("\n");
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
    ...(d.staticRoutes ?? []).map((r) => `ip route ${r.network} ${dotted(mask(r.prefix))} ${r.nextHop}`),
    ...(d.interfaces.some((i) => i.ospf)
      ? [
          `router ospf 1`,
          ` router-id ${d.routerId}`,
          ...d.interfaces.filter((i) => i.ospf?.passive).map((i) => ` passive-interface ${i.name}`),
        ]
      : []),
  ].join("\n");
}
// Replay bounded probe history against the immutable attempt configuration. No wall-clock aging.
export function arpState(s: Scenario, id: string, history: Observation[]) {
  const entries = new Map<string, { ip: string; mac: string; interface: string }>();
  let last: { ip: string; resolved: boolean } | undefined;
  const record = (r: Resolution) => {
    if (r.device === id) {
      last = { ip: r.ip, resolved: !!r.peer };
      if (r.peer) entries.set(`${r.local.name}:${r.ip}`, { ip: r.ip, mac: r.peer.remote.mac, interface: r.local.name });
    }
    // A successful ARP exchange also lets its addressed peer learn the sender.
    if (r.peer?.device.id === id)
      entries.set(`${r.peer.remote.name}:${r.local.ip}`, {
        ip: r.local.ip,
        mac: r.local.mac,
        interface: r.peer.remote.name,
      });
  };
  for (const o of history) {
    if (o.scenario && o.scenario !== s.id) continue;
    const source = s.devices.find((d) => d.id === o.device);
    if (
      !source?.commands.includes(o.command as (typeof source.commands)[number]) ||
      (o.source && o.command !== "ping") ||
      !["ping", "tracert", "traceroute"].includes(o.command) ||
      !ipv4.safeParse(o.target.trim()).success
    )
      continue;
    const target = o.target.trim();
    // Invalid source requests never emitted a probe and cannot create ARP state.
    let probeSource: string;
    try {
      probeSource = connectivity(s, o.device, target, o.source?.trim()).source;
    } catch {
      continue;
    }
    const result = forward(s, o.device, target, record);
    if (result.ok) {
      const destination = s.devices.find((d) => d.interfaces.some((i) => i.ip === target));
      if (destination) forward(s, destination.id, probeSource, record);
    }
  }
  return { entries: [...entries.values()], last };
}
function portStatus(s: Scenario, id: string, name: string) {
  const d = device(s, id),
    p = d.ports!.find((p) => p.name === name)!;
  const link = s.links.find((l) => [l.a, l.b].some((e) => e.device === id && e.interface === name));
  const other = link && (link.a.device === id ? link.b : link.a);
  const peer = other && device(s, other.device);
  const remote =
    peer &&
    (peer.interfaces.find((i) => i.name === other!.interface) ?? peer.ports?.find((i) => i.name === other!.interface));
  return !p.up
    ? "disabled"
    : !remote?.up
      ? "notconnect"
      : !d.vlans!.some((v) => v.id === p.vlan && v.active)
        ? "inactive"
        : "connected";
}
export function execute(
  s: Scenario,
  id: string,
  raw: string,
  target = "",
  history: Observation[] = [],
  source = "",
): string {
  const d = device(s, id),
    cmd = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!d.commands.some((c) => c === cmd))
    return `% Unsupported command on ${id}: ${raw}. Use the supported command buttons. This is a bounded simulator, not an IOS shell.`;
  if (source && cmd !== "ping") return "% Explicit source is supported only for router ping.";
  if (cmd === "arp -a") {
    const state = arpState(s, id, history);
    return [
      ...(state.entries.length
        ? d.interfaces.flatMap((i) => {
            const rows = state.entries.filter((e) => e.interface === i.name);
            return rows.length
              ? [
                  `Interface: ${i.ip}`,
                  "  Internet Address      Physical Address      Type",
                  ...rows.map((e) => `  ${e.ip.padEnd(22)} ${e.mac.replaceAll(":", "-")}     dynamic`),
                ]
              : [];
          })
        : ["No ARP Entries Found."]),
      "",
      state.last
        ? `Simulator observation: last next-hop resolution for ${state.last.ip} ${state.last.resolved ? "succeeded" : "failed; no resolved MAC entry was created"}.`
        : "Simulator observation: no locally initiated next-hop resolution yet.",
      "Simplified Windows-style cache: learned entries only; failed attempts are not dynamic entries. Entries persist for this attempt; no aging/background traffic. New attempts and repair previews start empty.",
    ].join("\n");
  }
  if (cmd.endsWith(" switchport")) {
    const p = d.ports!.find((p) => p.name.toLowerCase() === cmd.split(" ")[2])!;
    const v = d.vlans!.find((v) => v.id === p.vlan)!;
    return [
      `Name: ${p.name}`,
      "Switchport: Enabled",
      "Administrative Mode: static access",
      `Operational Mode: ${portStatus(s, id, p.name) === "connected" ? "static access" : "down"}`,
      `Access Mode VLAN: ${p.vlan} (${v.name})`,
      "(Condensed access-port fields; trunk negotiation is not modeled.)",
    ].join("\n");
  }
  if (cmd === "show vlan brief")
    return [
      "VLAN Name                             Status    Ports",
      ...d.vlans!.map(
        (v) =>
          `${String(v.id).padEnd(4)} ${v.name.padEnd(32)} ${v.active ? "active" : "suspended"}    ${d
            .ports!.filter((p) => p.vlan === v.id)
            .map((p) => p.name)
            .join(", ")}`,
      ),
      "(Modeled access VLANs and ports only.)",
    ].join("\n");
  if (cmd === "show interfaces status")
    return [
      "Port      Status       Vlan  Duplex Speed Type",
      ...d.ports!.map((p) => {
        const status = portStatus(s, id, p.name);
        return `${p.name.padEnd(9)} ${status.padEnd(12)} ${String(p.vlan).padEnd(5)} ${p.duplex}   ${p.speed}  ${p.speed === 100 ? "10/100BaseTX" : "10/100/1000BaseTX"}`;
      }),
    ].join("\n");
  if (cmd === "route print")
    return [
      "IPv4 Route Table — modeled routes (loopback/multicast omitted)",
      "Network Destination  Netmask          Gateway          Interface",
      ...d.interfaces
        .filter((i) => i.up)
        .flatMap((i) => [
          `0.0.0.0              0.0.0.0          ${d.gateway!.padEnd(16)} ${i.ip}`,
          `${network(i.ip, i.prefix).split("/")[0].padEnd(21)} ${dotted(mask(i.prefix)).padEnd(16)} On-link          ${i.ip}`,
          `${i.ip.padEnd(21)} 255.255.255.255  On-link          ${i.ip}`,
        ]),
    ].join("\n");
  if (["ping", "traceroute", "tracert"].includes(cmd)) {
    if (!ipv4.safeParse(target.trim()).success)
      return "% Enter a dotted IPv4 destination. DNS names and command flags are not implemented.";
    const t = target.trim();
    let c: ReturnType<typeof connectivity>;
    try {
      c = connectivity(s, id, t, source.trim());
    } catch {
      return "% Source must be an active interface or IPv4 address on this router.";
    }
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
    const lastHop = c.outward.hops.at(-1);
    const stoppedAt = lastHop ? s.devices.find((d) => d.interfaces.some((i) => i.ip === lastHop))!.id : id;
    const errorCanReturn = forward(s, stoppedAt, c.source).ok;
    return [
      `Tracing route to ${t} (source ${c.source})`,
      ...hops,
      ...(!c.outward.ok
        ? [
            c.outward.reason === "Routing loop" || c.outward.reason === "Hop limit exceeded"
              ? `Simulator stopped: ${c.outward.reason}. No ICMP error packet is inferred; per-probe TTL expiry is not modeled.`
              : errorCanReturn
                ? `${hops.length + 1}  !H  Destination unreachable (${c.outward.reason})`
                : `${hops.length + 1}  * * *`,
          ]
        : []),
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
      ...neighbors(s, id).map((n) => {
        // Representative snapshot, not a running countdown; always bounded by this interface's Dead interval.
        const remaining = Math.floor(d.interfaces.find((i) => i.name === n.interface)!.ospf!.dead * 0.9);
        const time = [Math.floor(remaining / 3600), Math.floor(remaining / 60) % 60, remaining % 60]
          .map((v) => String(v).padStart(2, "0"))
          .join(":");
        return `${n.routerId.padEnd(15)} 0   ${n.state}  ${time}  ${n.address.padEnd(15)} ${n.interface}`;
      }),
      ...(neighbors(s, id).length ? [] : ["(No OSPF neighbors)"]),
      "Simulator snapshot: established adjacencies only; transient neighbor states are not modeled. Dead Time is a representative remaining value, not a live countdown.",
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
          // Passive interface FSM states vary by platform; do not invent a DR or neighbor state.
          ...(o.passive
            ? [` MTU ${o.mtu}`]
            : [
                ` State ${i.up ? (o.networkType === "point-to-point" ? "POINT_TO_POINT" : "DR") : "DOWN"}, MTU ${o.mtu}`,
              ]),
          ` Timer intervals configured, Hello ${o.hello}, Dead ${o.dead}`,
          " Authentication: none (only supported mode)",
          o.passive
            ? " No Hellos (Passive interface)"
            : i.up
              ? " Hellos enabled (timing not simulated)"
              : " No Hellos (interface down)",
          ` Neighbor Count is ${neighbors(s, id).filter((n) => n.interface === i.name).length}, Adjacent neighbor count is ${neighbors(s, id).filter((n) => n.interface === i.name).length}`,
        ].join("\n");
      })
      .join("\n\n");
  if (cmd === "show ip protocols" && !d.interfaces.some((i) => i.ospf))
    return "No dynamic routing protocols configured.";
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
      "Codes: C - connected, L - local, S - static, O - OSPF, * - candidate default",
      routes(s, id).some((r) => r.prefix === "0.0.0.0/0")
        ? `Gateway of last resort is ${routes(s, id).find((r) => r.prefix === "0.0.0.0/0")!.via} to network 0.0.0.0`
        : "Gateway of last resort is not set",
      "",
      ...routes(s, id).map(
        (r) =>
          `${r.kind}${r.prefix === "0.0.0.0/0" ? "*" : ""} ${r.prefix.padEnd(20)} ${r.kind === "O" || r.kind === "S" ? `[${r.kind === "S" ? 1 : 110}/${r.cost}] via ${r.via}, ${r.interface}` : `is directly connected, ${r.interface}`}`,
      ),
    ].join("\n");
  return "% Unsupported command.";
}
export function repaired(s: Scenario): Scenario {
  const next = structuredClone(s);
  const repair = s.repair;
  if ("hello" in repair) {
    Object.assign(device(next, repair.device).interfaces.find((i) => i.name === repair.interface)!.ospf!, {
      hello: repair.hello,
      dead: repair.dead,
    });
  } else if ("passive" in repair) {
    device(next, repair.device).interfaces.find((i) => i.name === repair.interface)!.ospf!.passive = repair.passive;
  } else if ("route" in repair) {
    const d = device(next, repair.device);
    d.staticRoutes = [
      ...(d.staticRoutes ?? []).filter((r) => r.network !== repair.route.network || r.prefix !== repair.route.prefix),
      structuredClone(repair.route),
    ];
  } else if ("gateway" in repair) device(next, repair.device).gateway = repair.gateway;
  else if ("vlan" in repair)
    device(next, repair.device).ports!.find((p) => p.name === repair.interface)!.vlan = repair.vlan;
  else device(next, repair.device).interfaces.find((i) => i.name === repair.interface)!.ospf!.area = repair.area;
  return next;
}
export function commandSequence(s: Scenario, commands: [string, string, string?, string?][]) {
  const history: Observation[] = [];
  return commands
    .map(([id, command, target = "", source = ""]) => {
      const output = execute(s, id, command, target, history, source);
      history.push({ id: String(history.length), scenario: s.id, device: id, command, target, source, output, at: 0 });
      return `${id}> ${command}${target ? ` ${target}` : ""}${source ? ` source ${source}` : ""}\n${output}`;
    })
    .join("\n\n");
}
// Post-attempt teaching view, derived from the same packet forwarding used by commands.
export function packetJourney(s: Scenario, id: string, target: string) {
  const c = connectivity(s, id, target);
  return [
    `Request ${c.source} -> ${target}: ${c.outward.hops.join(" -> ")}; ${c.outward.reason}`,
    c.outward.ok && c.returning
      ? `Reply ${target} -> ${c.source}: ${c.returning.hops.join(" -> ")}; ${c.returning.reason}`
      : "No reply generated: request was not delivered.",
    `Bidirectional communication: ${c.ok ? "successful" : "failed"}`,
  ].join("\n");
}
