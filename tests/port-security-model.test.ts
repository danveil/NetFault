import { expect, it } from "vitest";
import {
  admitsSource,
  normalizeMac,
  ethernetDelivery,
  validatePortSecurity,
  portSecurityOutput,
} from "../src/lib/port-security";
import { portSecuritySchema, type Device } from "../src/lib/schema";
import { physicalPortUp } from "../src/lib/etherchannel";
// Independent names, ports, VLAN, addresses and MACs; no case key or answer imported.
const nic = (name: string, ip: string, mac: string) => ({ name, ip, mac, prefix: 24, up: true });
function model() {
  const devices: Device[] = [
    {
      id: "Notebook",
      kind: "pc",
      role: "client",
      gateway: "198.18.0.1",
      interfaces: [nic("eth7", "198.18.0.7", "0200.0040.0007")],
      commands: ["ping"],
    },
    {
      id: "Edge",
      kind: "switch",
      role: "edge",
      interfaces: [],
      vlans: [{ id: 40, name: "Office", active: true }],
      ports: [
        {
          name: "Gi2/7",
          vlan: 40,
          up: true,
          speed: 1000,
          duplex: "full",
          portSecurity: { enabled: true, maximum: 1, violation: "protect", staticMac: "0200.0040.0007" },
        },
        { name: "Gi2/8", vlan: 40, up: true, speed: 1000, duplex: "full" },
      ],
      commands: ["show port-security"],
    },
    {
      id: "Gateway",
      kind: "router",
      role: "gateway",
      routerId: "4.4.4.4",
      interfaces: [nic("lan4", "198.18.0.1", "0200.0040.0001")],
      commands: ["ping"],
    },
  ];
  return {
    schemaVersion: 11,
    devices,
    links: [
      {
        id: "a",
        a: { device: "Notebook", interface: "eth7" },
        b: { device: "Edge", interface: "Gi2/7" },
        subnet: "198.18.0.0/24",
      },
      {
        id: "b",
        a: { device: "Edge", interface: "Gi2/8" },
        b: { device: "Gateway", interface: "lan4" },
        subnet: "198.18.0.0/24",
      },
    ],
  };
}
it.each(["0200.0040.0007", "02:00:00:40:00:07", "02-00-00-40-00-07", " 0200.0040.0007 "])(
  "normalizes and admits equivalent identity %s",
  (mac) => {
    expect(normalizeMac(mac)).toBe("0200.0040.0007");
    expect(admitsSource(model().devices[1].ports![0], mac)).toBe(true);
  },
);
it.each([
  "",
  "0000.0000.0000",
  "ffff.ffff.ffff",
  "0100.0040.0007",
  "0200.0040.000",
  "020000400007",
  "02:00-00:40:00:07",
])("rejects invalid or multicast identity %s", (mac) => expect(normalizeMac(mac)).toBeUndefined());
it("independent model validates and full protect slot rejects other sources without changing carrier", () => {
  const m = model();
  expect(() =>
    validatePortSecurity(m, (msg) => {
      throw Error(msg);
    }),
  ).not.toThrow();
  const before = structuredClone(m),
    p = m.devices[1].ports![0];
  expect(admitsSource(p, "0200.0040.0008")).toBe(false);
  expect(physicalPortUp(m, "Edge", "Gi2/7")).toBe(true);
  expect(m).toEqual(before);
  const out = portSecurityOutput(m.devices[1], "show port-security interface gi2/7", () => true);
  expect(out).toContain("Secure-up");
  expect(out).toContain("Maximum MAC Addresses: 1");
  expect(out).not.toMatch(/Violation Count|SecureSticky|Age Remaining/);
});
it("absent and explicitly disabled policies leave ordinary admission unchanged", () => {
  const p = model().devices[1].ports![0];
  p.portSecurity!.enabled = false;
  expect(admitsSource(p, "0200.0040.0008")).toBe(true);
  delete p.portSecurity;
  expect(admitsSource(p, "0200.0040.0008")).toBe(true);
});
it("same directed segment checks secure ingress, never destination MAC or original IP source", () => {
  const m = model(),
    a = { device: "Notebook", interface: "eth7" },
    r = { device: "Gateway", interface: "lan4" };
  expect(ethernetDelivery(m, a, r, "0200.0040.0007").ok).toBe(true);
  expect(ethernetDelivery(m, a, r, "0200.0040.0008")).toMatchObject({
    ok: false,
    drop: { device: "Edge", interface: "Gi2/7" },
  });
  expect(ethernetDelivery(m, r, a, "0200.0040.0001").ok).toBe(true);
  // The uplink is not subject to the endpoint's registration. Router Ethernet identity is local to this segment.
  expect(ethernetDelivery(m, r, a, "0200.0040.0008").ok).toBe(true);
});
it.each(["vlan", "inactive", "local-down", "remote-down", "link-down"])(
  "valid admission does not repair %s",
  (fault) => {
    const m = model();
    if (fault === "vlan") m.devices[1].ports![1].vlan = 41;
    if (fault === "inactive") m.devices[1].vlans![0].active = false;
    if (fault === "local-down") m.devices[0].interfaces[0].up = false;
    if (fault === "remote-down") m.devices[2].interfaces[0].up = false;
    if (fault === "link-down") Object.assign(m.links[0], { up: false });
    expect(
      ethernetDelivery(
        m,
        { device: "Notebook", interface: "eth7" },
        { device: "Gateway", interface: "lan4" },
        "0200.0040.0007",
      ).ok,
    ).toBe(false);
  },
);
it.each([
  { maximum: 2 },
  { staticMac: "" },
  { staticMac: "02:00:00:40:00:07" },
  { violation: "restrict" },
  { violation: "shutdown" },
  { sticky: true },
  { aging: 30 },
  { learned: [] },
  { counter: 0 },
])("rejects unsupported policy %j", (patch) =>
  expect(portSecuritySchema.safeParse({ ...model().devices[1].ports![0].portSecurity, ...patch }).success).toBe(false),
);
it.each(["uplink", "wrong-version", "extra-vlan", "stp", "channel", "second-router"])(
  "rejects unsupported topology %s",
  (fault) => {
    const m = model(),
      sw = m.devices[1];
    if (fault === "uplink") {
      sw.ports![1].portSecurity = sw.ports![0].portSecurity;
      delete sw.ports![0].portSecurity;
    }
    if (fault === "wrong-version") m.schemaVersion = 3;
    if (fault === "extra-vlan") sw.vlans!.push({ id: 41, name: "Other", active: true });
    if (fault === "stp") Object.assign(sw, { stp: {} });
    if (fault === "channel") sw.portChannels = [];
    if (fault === "second-router") m.devices.push({ ...m.devices[2], id: "Another" });
    expect(() =>
      validatePortSecurity(m, (msg) => {
        throw Error(msg);
      }),
    ).toThrow();
  },
);
