import type { Device, Interface, Scenario } from "./schema";

type Model = { schemaVersion: number; devices: Device[]; links: Scenario["links"] };
const ip = (value: string) => value.split(".").reduce((n, p) => n * 256 + Number(p), 0) >>> 0;
const subnet = (i: Interface, address: string) => ip(i.ip) >>> (32 - i.prefix) === ip(address) >>> (32 - i.prefix);
export const hsrpPriority = (i: Interface) => i.hsrp?.priority ?? 100;
export function virtualMac(group: number) {
  if (!Number.isInteger(group) || group < 0 || group > 4095) throw Error("HSRPv2 group must be 0–4095");
  return `0000.0c9f.${(0xf000 + group).toString(16)}`;
}
export function hsrpMembers(s: Model) {
  return s.devices.flatMap((d) => d.interfaces.filter((i) => i.hsrp).map((i) => ({ device: d, interface: i })));
}
function attachment(s: Model, d: Device, i: Interface) {
  const link = s.links.find((l) => [l.a, l.b].some((e) => e.device === d.id && e.interface === i.name));
  const endpoint = link && (link.a.device === d.id ? link.b : link.a);
  const sw = s.devices.find((p) => p.id === endpoint?.device && p.kind === "switch");
  const port = sw?.ports?.find((p) => p.name === endpoint?.interface);
  return { link, sw, port };
}
export function validateHsrp(s: Model, fail: (message: string) => void) {
  const members = hsrpMembers(s);
  if (s.schemaVersion !== 10) {
    if (members.length || s.devices.some((d) => d.commands.includes("show standby brief")))
      fail("HSRP requires schema v10");
    return;
  }
  if (members.length !== 2 || new Set(members.map((m) => m.device.id)).size !== 2) {
    fail("Bounded HSRP requires exactly two router members");
    return;
  }
  if (
    s.devices.length !== 6 ||
    s.links.length !== 6 ||
    s.devices.filter((d) => d.kind === "router").length !== 3 ||
    s.devices.filter((d) => d.kind === "pc").length !== 2
  )
    fail("HSRP supports two members, one access switch/client and one upstream router/remote host");
  if (s.devices.some((d) => d.stp || d.portChannels || d.acls || d.interfaces.some((i) => i.ospf || i.accessGroup)))
    fail("HSRP cannot be combined with other protocol models");
  const [a, b] = members;
  const h = a.interface.hsrp!;
  if (
    members.some(
      (m) =>
        m.device.kind !== "router" ||
        m.interface.hsrp!.version !== 2 ||
        !m.interface.hsrp!.preempt ||
        m.interface.hsrp!.group !== h.group ||
        m.interface.hsrp!.virtualIp !== h.virtualIp ||
        m.interface.prefix !== a.interface.prefix ||
        !subnet(a.interface, m.interface.ip),
    )
  )
    fail("Members must share one HSRPv2 group, VIP and subnet with preemption enabled");
  if (hsrpPriority(a.interface) === hsrpPriority(b.interface))
    fail("Equal priorities are outside this settled HSRP model");
  const host = ip(h.virtualIp) & (0xffffffff >>> a.interface.prefix);
  if (
    !subnet(a.interface, h.virtualIp) ||
    host === 0 ||
    host === 0xffffffff >>> a.interface.prefix ||
    s.devices.some((d) => d.interfaces.some((i) => i.ip === h.virtualIp))
  )
    fail("Virtual gateway must be a distinct usable on-link address");
  const attachments = members.map((m) => attachment(s, m.device, m.interface));
  if (
    s.devices.filter((d) => d.kind === "switch").length !== 1 ||
    attachments.some((x) => !x.sw || !x.port) ||
    attachments[0].sw?.id !== attachments[1].sw?.id ||
    attachments[0].port?.vlan !== attachments[1].port?.vlan
  )
    fail("HSRP requires one shared access switch and VLAN");
  const sw = attachments[0].sw;
  if (
    sw &&
    (sw.vlans?.length !== 1 || sw.ports?.length !== 3 || sw.ports.some((p) => p.vlan !== attachments[0].port?.vlan))
  )
    fail("Only the two members and one client on a single access VLAN are supported");
  const clients = s.devices.filter((d) => d.kind === "pc" && d.gateway === h.virtualIp);
  if (clients.length !== 1 || clients[0].interfaces.length !== 1)
    fail("The bounded HSRP LAN requires one single-interface client using the virtual gateway");
  const upstream = s.devices.find((d) => d.kind === "router" && !members.some((m) => m.device.id === d.id));
  const remote = s.devices.find((d) => d.kind === "pc" && d.gateway !== h.virtualIp);
  const connected = (a: string | undefined, b: string | undefined) =>
    s.links.some((l) => (l.a.device === a && l.b.device === b) || (l.b.device === a && l.a.device === b));
  if (
    !upstream ||
    upstream.interfaces.length !== 3 ||
    !remote ||
    remote.interfaces.length !== 1 ||
    !connected(upstream.id, remote.id) ||
    !connected(sw?.id, clients[0]?.id) ||
    members.some((m) => m.device.interfaces.length !== 2 || !connected(m.device.id, upstream.id))
  )
    fail("HSRP requires independent directly routed uplinks and a separate remote host");
  for (const d of s.devices) {
    if (d.commands.includes("show standby brief") && !members.some((m) => m.device.id === d.id))
      fail("Standby diagnostics require a member");
    if (d.kind === "pc" && d.gateway === h.virtualIp) {
      const x = attachment(s, d, d.interfaces[0]);
      if (x.sw?.id !== sw?.id || x.port?.vlan !== attachments[0].port?.vlan)
        fail("Virtual gateway client must share the member LAN");
    }
  }
}
// No messages, timers, incumbent history or tracking. Eligibility concerns the shared LAN only.
export function hsrpState(s: Model) {
  const members = hsrpMembers(s).map((m) => {
    const x = attachment(s, m.device, m.interface);
    return {
      ...m,
      eligible: !!(
        m.interface.up &&
        x.link?.up !== false &&
        x.port?.up &&
        x.sw?.vlans?.some((v) => v.id === x.port!.vlan && v.active)
      ),
    };
  });
  const eligible = members
    .filter((m) => m.eligible)
    .sort((a, b) => hsrpPriority(b.interface) - hsrpPriority(a.interface));
  if (eligible.length > 1 && hsrpPriority(eligible[0].interface) === hsrpPriority(eligible[1].interface))
    throw Error("Equal priorities are outside this settled HSRP model");
  return { members, active: eligible[0], standby: eligible[1] };
}
export function virtualOwner(s: Model, address: string) {
  if (!hsrpMembers(s).some((m) => m.interface.hsrp!.virtualIp === address)) return undefined;
  return hsrpState(s).active;
}
export function standbyOutput(s: Model, id: string) {
  const state = hsrpState(s),
    local = state.members.find((m) => m.device.id === id);
  if (!local) return "% No supported HSRP group on this device.";
  const h = local.interface.hsrp!;
  const identity = (m: typeof state.active) => (!m ? "unknown" : m.device.id === id ? "local" : m.interface.ip);
  return [
    "HSRPv2 · settled educational subset; P = preempt enabled. No timers simulated.",
    "Interface  Grp  Pri P State    Active          Standby         Virtual IP",
    `${local.interface.name.padEnd(10)} ${String(h.group).padEnd(4)} ${String(hsrpPriority(local.interface)).padEnd(3)} P ${(!local.eligible ? "Unavailable" : state.active?.device.id === id ? "Active" : "Standby").padEnd(8)} ${identity(state.active).padEnd(15)} ${identity(state.standby).padEnd(15)} ${h.virtualIp}`,
  ].join("\n");
}
