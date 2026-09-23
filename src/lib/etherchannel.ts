import type { Device, Scenario } from "./schema";

type Model = {
  schemaVersion: number;
  devices: Device[];
  links: {
    id: string;
    a: { device: string; interface: string };
    b: { device: string; interface: string };
    subnet: string;
    up?: boolean;
  }[];
};
const endpointKey = (e: { device: string; interface: string }) => `${e.device}:${e.interface}`;
export function validateEtherChannelTopology(s: Model, fail: (message: string) => void) {
  const switches = s.devices.filter((d) => d.kind === "switch");
  const channels = s.devices.flatMap((d) => d.portChannels ?? []);
  const commands = ["show etherchannel summary", "show lacp internal", "show interfaces port-channel 1"];
  if (s.schemaVersion !== 7) {
    if (
      channels.length ||
      s.devices.some((d) => d.portChannels !== undefined) ||
      s.links.some((l) => l.up !== undefined) ||
      s.devices.some((d) => d.commands.some((c) => commands.includes(c)))
    )
      fail("EtherChannel fields and diagnostics require schema v7");
    return;
  }
  const hosts = s.devices.filter((d) => d.kind === "pc");
  if (new Set(channels.map((c) => c.vlan)).size > 1)
    fail(
      "Cross-switch VLAN differences are outside the single-access-VLAN model; LACP does not negotiate remote VLAN IDs",
    );
  if (
    switches.length !== 2 ||
    hosts.length !== 2 ||
    s.devices.length !== 4 ||
    channels.length !== 2 ||
    s.links.length !== 4
  )
    fail("Bounded EtherChannel requires two switches, two hosts and four physical links");
  if (
    hosts.some(
      (d) =>
        d.gateway || d.interfaces.length !== 1 || d.portChannels || d.staticRoutes || d.interfaces.some((i) => i.ospf),
    )
  )
    fail("EtherChannel hosts use one same-subnet interface without a gateway");
  const h = hosts[0]?.interfaces[0];
  if (h && hosts.some((d) => d.interfaces.some((i) => i.prefix !== h.prefix || !sameNetwork(i.ip, h.ip, h.prefix))))
    fail("EtherChannel supports one shared IPv4 subnet");
  const inter = s.links.filter(
    (l) => switches.some((d) => d.id === l.a.device) && switches.some((d) => d.id === l.b.device),
  );
  if (inter.length !== 2 || inter.some((l) => l.a.device === l.b.device))
    fail("Exactly two member links between different switches are required");
  for (const d of switches) {
    const pc = d.portChannels?.[0];
    if (
      !pc ||
      d.portChannels?.length !== 1 ||
      d.ports?.length !== 3 ||
      d.vlans?.length !== 1 ||
      d.gateway ||
      d.staticRoutes
    ) {
      fail("Each switch requires one bundle, two members and one host access port");
      continue;
    }
    if (new Set(pc.members).size !== 2 || pc.members.some((name) => !d.ports?.some((p) => p.name === name)))
      fail("Channel members must name two distinct local physical ports");
    if (!d.vlans?.some((v) => v.id === pc.vlan)) fail("Channel VLAN must exist locally");
    if (d.commands.includes("show interfaces port-channel 1") && pc.id !== 1)
      fail("Port-channel command references an absent group");
    const expected = inter
      .flatMap((l) => [l.a, l.b])
      .filter((e) => e.device === d.id)
      .map((e) => e.interface)
      .sort();
    if (expected.join() !== [...pc.members].sort().join())
      fail("All and only inter-switch links must be channel members; no fallback path");
    const access = d.ports!.filter((p) => !pc.members.includes(p.name));
    for (const p of access) {
      const cable = s.links.find((l) => [l.a, l.b].some((e) => e.device === d.id && e.interface === p.name));
      if (!cable || ![cable.a, cable.b].some((e) => hosts.some((host) => host.id === e.device)))
        fail("Nonmember ports must connect directly to hosts");
    }
  }
}
// Local arithmetic avoids a runtime cycle with schema validation.
function sameNetwork(a: string, b: string, prefix: number) {
  const n = (ip: string) => ip.split(".").reduce((sum, octet) => sum * 256 + Number(octet), 0);
  return Math.floor(n(a) / 2 ** (32 - prefix)) === Math.floor(n(b) / 2 ** (32 - prefix));
}
export function physicalPortUp(s: Model, id: string, name: string) {
  const d = s.devices.find((d) => d.id === id),
    p = d?.ports?.find((p) => p.name === name);
  const link = s.links.find((l) => [l.a, l.b].some((e) => e.device === id && e.interface === name));
  const remote = link && (link.a.device === id ? link.b : link.a);
  const peer = remote && s.devices.find((d) => d.id === remote.device);
  const port =
    peer &&
    (peer.ports?.find((p) => p.name === remote!.interface) ??
      peer.interfaces.find((p) => p.name === remote!.interface));
  return !!(p?.up && link && link.up !== false && port?.up);
}
export function channelState(s: Model, id: string) {
  const local = s.devices.find((d) => d.id === id),
    channel = local?.portChannels?.[0];
  if (!local || !channel) return undefined;
  const members = channel.members.map((name) => {
    const cable = s.links.find((l) => [l.a, l.b].some((e) => e.device === id && e.interface === name));
    const remote = cable && (cable.a.device === id ? cable.b : cable.a);
    const peer = remote && s.devices.find((d) => d.id === remote.device),
      peerChannel = peer?.portChannels?.[0];
    const p = local.ports!.find((p) => p.name === name),
      q = peer?.ports?.find((p) => p.name === remote!.interface);
    const physical = physicalPortUp(s, id, name);
    const compatible = !!(
      p &&
      q &&
      peerChannel?.members.includes(q.name) &&
      channel.up &&
      peerChannel.up &&
      p.speed === channel.speed &&
      q.speed === channel.speed &&
      peerChannel.speed === channel.speed &&
      p.duplex === "full" &&
      q.duplex === "full" &&
      p.vlan === channel.vlan &&
      q.vlan === channel.vlan &&
      peerChannel.vlan === channel.vlan &&
      local.vlans?.some((v) => v.id === channel.vlan && v.active) &&
      peer?.vlans?.some((v) => v.id === channel.vlan && v.active)
    );
    const negotiating = channel.mode === "active" || peerChannel?.mode === "active";
    return {
      name,
      physical,
      compatible,
      bundled: physical && compatible && negotiating,
      peer: peer?.id,
      remote: remote?.interface,
    };
  });
  return {
    channel,
    members,
    up: members.some((m) => m.bundled),
    activeMembers: members.filter((m) => m.bundled).length,
  };
}
export function forwardingPorts(s: Model, d: Device) {
  const state = channelState(s, d.id);
  if (!state) return d.ports ?? [];
  return [
    ...(d.ports ?? []).filter((p) => !state.channel.members.includes(p.name)),
    {
      name: `Port-channel${state.channel.id}`,
      vlan: state.channel.vlan,
      up: state.up,
      speed: state.channel.speed,
      duplex: "full" as const,
    },
  ];
}
export function forwardingLinks(s: Model) {
  const reserved = new Set(
    s.devices.flatMap((d) => d.portChannels?.flatMap((c) => c.members.map((name) => `${d.id}:${name}`)) ?? []),
  );
  const links = s.links.filter(
    (l) => l.up !== false && !reserved.has(endpointKey(l.a)) && !reserved.has(endpointKey(l.b)),
  );
  const local = s.devices.find((d) => d.portChannels?.length),
    state = local && channelState(s, local.id);
  const member = state?.members.find((m) => m.bundled),
    peer = s.devices.find((d) => d.id === member?.peer);
  if (local && state?.up && peer?.portChannels?.[0])
    links.push({
      id: "logical-bundle",
      a: { device: local.id, interface: `Port-channel${state.channel.id}` },
      b: { device: peer.id, interface: `Port-channel${peer.portChannels[0].id}` },
      subnet: s.links[0].subnet,
    });
  return links;
}
export function etherChannelOutput(s: Scenario, d: Device, command: string): string | undefined {
  const state = channelState(s, d.id);
  if (!state) return;
  const c = state.channel;
  const note =
    "Educational steady-state subset: no LACP packets, timers, hashing, STP or throughput measurements. Standalone forwarding is disabled.";
  if (command === "show etherchannel summary")
    return [
      "Flags: D - down, S - Layer2, U - in use, P - bundled, s - suspended",
      "Group  Port-channel  Protocol  Ports",
      `${c.id}      Po${c.id}(${state.up ? "SU" : "SD"})        LACP      ${state.members.map((m) => `${m.name}(${m.bundled ? "P" : m.physical ? "s" : "D"})`).join("  ")}`,
      `Bundled members: ${state.activeMembers}/${c.members.length}`,
      note,
    ].join("\n");
  if (command === "show lacp internal")
    return [
      "LACP local configuration / derived participation (condensed)",
      "Port                 Mode       Carrier    Participation",
      ...state.members.map(
        (m) =>
          `${m.name.padEnd(20)} ${c.mode.padEnd(10)} ${(m.physical ? "up" : "down").padEnd(10)} ${m.bundled ? "bundled" : "not bundled"}`,
      ),
      note,
    ].join("\n");
  if (command === `show interfaces port-channel ${c.id}`)
    return [
      `Port-channel${c.id} is ${state.up ? "up, line protocol is up" : "down, line protocol is down"}`,
      `Layer 2 access VLAN ${c.vlan}`,
      `Members bundled: ${state.activeMembers}/${c.members.length}`,
      "Standalone member forwarding: disabled",
      note,
    ].join("\n");
}
