import type { Device, Scenario } from "./schema";

type Model = { schemaVersion: number; devices: Device[]; links: Scenario["links"] };
export const stpCommand = "show spanning-tree vlan 10";
const key = (e: { device: string; interface: string }) => `${e.device}:${e.interface}`;
const macNumber = (mac: string) => Number.parseInt(mac.replaceAll(".", ""), 16);
export function compareBridge(a: Device, b: Device) {
  return a.stp!.priority + a.stp!.vlan - b.stp!.priority - b.stp!.vlan || macNumber(a.stp!.mac) - macNumber(b.stp!.mac);
}
export function validateStp(s: Model, fail: (message: string) => void) {
  const switches = s.devices.filter((d) => d.kind === "switch"),
    hosts = s.devices.filter((d) => d.kind === "pc");
  if (s.schemaVersion !== 9) {
    if (s.devices.some((d) => d.stp || d.ports?.some((p) => p.stp) || d.commands.includes(stpCommand)))
      fail("STP requires schema v9");
    return;
  }
  if (
    switches.length < 2 ||
    switches.length > 3 ||
    hosts.length < 1 ||
    hosts.length > 2 ||
    switches.length + hosts.length !== s.devices.length
  )
    fail("STP supports two or three switches and one or two hosts only");
  const vlan = switches[0]?.stp?.vlan;
  if (vlan !== 10 && s.devices.some((d) => d.commands.includes(stpCommand)))
    fail("The exposed STP command requires VLAN 10");
  const macs = [...switches.map((d) => d.stp?.mac), ...hosts.flatMap((d) => d.interfaces.map((i) => i.mac))];
  if (
    macs.some((m) => !m || !/^[0-9a-f]{4}(\.[0-9a-f]{4}){2}$/.test(m) || (parseInt(m.slice(0, 2), 16) & 1) !== 0) ||
    new Set(macs).size !== macs.length
  )
    fail("STP requires distinct canonical unicast MAC identities");
  for (const d of s.devices) {
    if (
      d.portChannels ||
      d.acls ||
      d.gateway ||
      d.staticRoutes ||
      d.routerId ||
      d.interfaces.some((i) => i.ospf || i.accessGroup)
    )
      fail("Unsupported combined STP configuration");
    if (d.kind === "switch") {
      if (
        !d.stp ||
        d.stp.vlan !== vlan ||
        d.vlans?.length !== 1 ||
        d.vlans[0].id !== vlan ||
        !d.vlans[0].active ||
        !d.ports?.length ||
        d.ports.some((p) => p.vlan !== vlan || !p.stp)
      )
        fail("STP requires one common active access VLAN and explicit port costs/identities");
      if (new Set(d.ports?.map((p) => p.stp?.number)).size !== d.ports?.length) fail("Duplicate STP port identity");
    } else if (d.stp || d.interfaces.length !== 1) fail("STP hosts require one interface and no bridge configuration");
  }
  const first = hosts[0]?.interfaces[0];
  const subnet = (ip: string, prefix: number) =>
    (ip.split(".").reduce((n, p) => n * 256 + Number(p), 0) & (0xffffffff << (32 - prefix))) >>> 0;
  if (
    first &&
    hosts.some((d) =>
      d.interfaces.some((i) => i.prefix !== first.prefix || subnet(i.ip, i.prefix) !== subnet(first.ip, first.prefix)),
    )
  )
    fail("STP hosts must share one IPv4 subnet");
  if (new Set(s.links.map((l) => l.subnet)).size !== 1) fail("STP links describe one subnet");
  const pairs = new Set<string>();
  for (const l of s.links) {
    const a = s.devices.find((d) => d.id === l.a.device),
      b = s.devices.find((d) => d.id === l.b.device);
    const pair = [l.a.device, l.b.device].sort().join(":");
    if (!a || !b || a.id === b.id || pairs.has(pair) || (a.kind !== "switch" && b.kind !== "switch"))
      fail("STP supports simple point-to-point switch graphs only");
    pairs.add(pair);
  }
}
export type StpPort = {
  role: "Root" | "Designated" | "Alternate" | "Disabled";
  state: "Forwarding" | "Blocking" | "Disabled";
  cost: number;
  number: number;
};
export type StpBridge = { root: string; cost: number; rootPort?: string; ports: Record<string, StpPort> };
export function stpState(s: Model): Record<string, StpBridge> {
  if (s.schemaVersion !== 9) return {};
  const errors: string[] = [];
  validateStp(s, (m) => errors.push(m));
  if (errors.length) throw Error(errors.join("; "));
  const switches = s.devices.filter((d) => d.stp);
  const byId = (id: string) => s.devices.find((d) => d.id === id)!;
  const port = (e: { device: string; interface: string }) => byId(e.device).ports?.find((p) => p.name === e.interface);
  const active = s.links.filter(
    (l) =>
      l.up !== false &&
      [l.a, l.b].every((e) => {
        const d = byId(e.device);
        return (port(e) ?? d.interfaces.find((i) => i.name === e.interface))?.up;
      }),
  );
  const inter = active.filter((l) => byId(l.a.device).stp && byId(l.b.device).stp);
  const neighbors = (id: string) =>
    inter.flatMap((l) =>
      l.a.device === id ? [{ local: l.a, remote: l.b }] : l.b.device === id ? [{ local: l.b, remote: l.a }] : [],
    );
  const result: Record<string, StpBridge> = {};
  for (const origin of switches) {
    if (result[origin.id]) continue;
    const component = new Set([origin.id]);
    for (const id of component) for (const n of neighbors(id)) component.add(n.remote.device);
    const members = [...component].map(byId),
      root = [...members].sort(compareBridge)[0];
    const distance = new Map(members.map((d) => [d.id, d.id === root.id ? 0 : Infinity]));
    for (let pass = 0; pass < members.length; pass++)
      for (const d of members)
        for (const n of neighbors(d.id))
          distance.set(d.id, Math.min(distance.get(d.id)!, port(n.local)!.stp!.cost + distance.get(n.remote.device)!));
    for (const d of members) {
      const candidates = neighbors(d.id).sort(
        (a, b) =>
          port(a.local)!.stp!.cost +
            distance.get(a.remote.device)! -
            (port(b.local)!.stp!.cost + distance.get(b.remote.device)!) ||
          compareBridge(byId(a.remote.device), byId(b.remote.device)),
      );
      result[d.id] = {
        root: root.id,
        cost: distance.get(d.id)!,
        ...(d.id !== root.id ? { rootPort: candidates[0].local.interface } : {}),
        ports: {},
      };
    }
  }
  for (const d of switches)
    for (const p of d.ports!) {
      const e = { device: d.id, interface: p.name },
        l = active.find((l) => key(l.a) === key(e) || key(l.b) === key(e));
      let role: StpPort["role"] = "Disabled";
      if (l) {
        const other = byId((key(l.a) === key(e) ? l.b : l.a).device);
        if (!other.stp) role = "Designated";
        else if (result[d.id].rootPort === p.name) role = "Root";
        else
          role =
            (result[d.id].cost - result[other.id].cost || compareBridge(d, other)) < 0 ? "Designated" : "Alternate";
      }
      result[d.id].ports[p.name] = {
        role,
        state: role === "Disabled" ? "Disabled" : role === "Alternate" ? "Blocking" : "Forwarding",
        cost: p.stp!.cost,
        number: p.stp!.number,
      };
    }
  return result;
}
export function stpLinks(s: Model) {
  const state = stpState(s);
  return s.links.filter(
    (l) =>
      l.up !== false &&
      [l.a, l.b].every((e) => !state[e.device] || state[e.device].ports[e.interface]?.state === "Forwarding"),
  );
}
export function stpOutput(s: Model, d: Device) {
  const state = stpState(s)[d.id],
    root = s.devices.find((p) => p.id === state.root)!;
  const bid = (b: Device) =>
    `${b.stp!.priority + b.stp!.vlan} (base ${b.stp!.priority}, sys-id-ext ${b.stp!.vlan})  ${b.stp!.mac}`;
  return [
    `VLAN${String(d.stp!.vlan).padStart(4, "0")}`,
    "Bounded PVST-style settled state; convergence not simulated.",
    `Root ID    ${bid(root)}`,
    `Bridge ID  ${bid(d)}`,
    `Root path cost ${state.cost}`,
    state.rootPort ? `Root port ${state.rootPort}` : "This bridge is the root",
    "Interface  Role        State       Cost  Port ID",
    ...Object.entries(state.ports).map(
      ([name, p]) =>
        `${name.padEnd(10)} ${p.role.padEnd(11)} ${p.state.padEnd(11)} ${String(p.cost).padEnd(5)} 128.${p.number}`,
    ),
  ].join("\n");
}
// A simulator explanation of the selected L2 tree, never an IP traceroute.
export function stpPath(s: Model, source: string, target: string): string[] {
  const links = stpLinks(s),
    queue = [[source]],
    visited = new Set<string>();
  while (queue.length) {
    const path = queue.shift()!,
      last = path.at(-1)!;
    if (last === target) return path;
    if (visited.has(last)) continue;
    visited.add(last);
    for (const l of links) {
      const next = l.a.device === last ? l.b.device : l.b.device === last ? l.a.device : undefined;
      if (next && !visited.has(next)) queue.push([...path, next]);
    }
  }
  return [];
}
