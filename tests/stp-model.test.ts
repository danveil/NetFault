import { expect, it } from "vitest";
import { deviceSchema, type Scenario } from "../src/lib/schema";
import { stpState, stpLinks, stpOutput, validateStp } from "../src/lib/stp";

export function treeFixture() {
  const devices = [1, 2, 3].map((n) =>
    deviceSchema.parse({
      id: `S${n}`,
      kind: "switch",
      role: "Switch",
      interfaces: [],
      commands: ["show spanning-tree vlan 10"],
      stp: { vlan: 10, priority: n === 1 ? 40960 : 32768, mac: `0200.0000.00${n}0`, costMethod: "short" },
      vlans: [{ id: 10, active: true, name: "LAN" }],
      ports: [1, 2, ...(n !== 2 ? [3] : [])].map((p) => ({
        name: `Gi0/${p}`,
        vlan: 10,
        up: true,
        speed: 1000,
        duplex: "full",
        stp: { number: p, priority: 128, cost: 4 },
      })),
    }),
  );
  devices.push(
    ...[1, 2].map((n) =>
      deviceSchema.parse({
        id: `H${n}`,
        kind: "pc",
        role: "Host",
        commands: ["ping"],
        interfaces: [{ name: "Ethernet0", ip: `172.26.10.${n * 10}`, prefix: 24, mac: `0200.0000.00a${n}`, up: true }],
      }),
    ),
  );
  const links = [
    ["h1", "H1", "Ethernet0", "S1", "Gi0/3"],
    ["12", "S1", "Gi0/1", "S2", "Gi0/1"],
    ["13", "S1", "Gi0/2", "S3", "Gi0/1"],
    ["23", "S2", "Gi0/2", "S3", "Gi0/2"],
    ["h2", "S3", "Gi0/3", "H2", "Ethernet0"],
  ].map(([id, a, ai, b, bi]) => ({
    id,
    a: { device: a, interface: ai },
    b: { device: b, interface: bi },
    subnet: "172.26.10.0/24",
    up: true,
  }));
  return { schemaVersion: 9, devices, links };
}
it("derives the complete initial and changed tree without scenario IDs", () => {
  const s = treeFixture(),
    before = stpState(s);
  expect(Object.values(before).map((b) => [b.root, b.cost])).toEqual([
    ["S2", 4],
    ["S2", 0],
    ["S2", 4],
  ]);
  expect(before.S1.ports["Gi0/2"].state).toBe("Blocking");
  expect(stpLinks(s).map((l) => l.id)).toEqual(["h1", "12", "23", "h2"]);
  s.devices[0].stp!.priority = 24576;
  const after = stpState(s);
  expect(Object.values(after).map((b) => [b.root, b.cost])).toEqual([
    ["S1", 0],
    ["S1", 4],
    ["S1", 4],
  ]);
  expect(after.S3.ports["Gi0/2"].state).toBe("Blocking");
  expect(stpLinks(s).map((l) => l.id)).toEqual(["h1", "12", "13", "h2"]);
  expect(stpOutput(s, s.devices[2])).toContain("24586 (base 24576, sys-id-ext 10)");
  expect(stpOutput(s, s.devices[2])).toContain("Root path cost 4");
});
it("uses local receiving costs, and upstream BID rather than local port number for ties", () => {
  const s = treeFixture();
  s.devices[0].stp!.priority = 0;
  s.devices[2].ports![0].stp!.cost = 12;
  expect(stpState(s).S3).toMatchObject({ cost: 8, rootPort: "Gi0/2" });
  s.devices[2].ports![0].stp!.cost = 8;
  s.devices[2].ports![0].stp!.number = 100;
  expect(stpState(s).S3).toMatchObject({ cost: 8, rootPort: "Gi0/1" });
  s.devices[0].ports![1].stp!.cost = 600;
  expect(stpState(s).S3.cost).toBe(8);
});
it("is independent of device, link, port and endpoint ordering", () => {
  const s = treeFixture(),
    expected = stpState(s);
  s.devices.reverse().forEach((d) => d.ports?.reverse());
  s.links.reverse().forEach((l) => ([l.a, l.b] = [l.b, l.a]));
  expect(stpState(s)).toEqual(expected);
});
it("preserves a forest for all three-edge availability patterns and a finite cost/priority matrix", () => {
  for (let root = 0; root < 3; root++)
    for (let bits = 0; bits < 8; bits++)
      for (let costs = 0; costs < 729; costs++) {
        const s = treeFixture();
        s.devices[root].stp!.priority = 0;
        let code = costs;
        for (let edge = 0; edge < 3; edge++) {
          const l = s.links[edge + 1];
          l.up = !!(bits & (1 << edge));
          for (const e of [l.a, l.b]) {
            s.devices.find((d) => d.id === e.device)!.ports!.find((p) => p.name === e.interface)!.stp!.cost = [
              4, 8, 12,
            ][code % 3];
            code = Math.floor(code / 3);
          }
        }
        const state = stpState(s),
          edges = stpLinks(s).filter((l) => /^[0-9]+$/.test(l.id));
        const components = new Set(Object.values(state).map((b) => b.root)).size;
        if (edges.length !== 3 - components) throw Error(`Not a forest: ${root}/${bits}/${costs}`);
        for (const b of Object.values(state)) if (b.cost && !b.rootPort) throw Error("Missing root port");
      }
}, 30000);
it("rejects mixed aggregation and independent parallel links", () => {
  const s = treeFixture();
  s.links.push({ ...s.links[1], id: "extra" });
  const failures: string[] = [];
  validateStp(s, (m) => failures.push(m));
  expect(failures.join()).toContain("simple point-to-point");
  s.links.pop();
  s.devices[0].portChannels = [];
  expect(() => stpState(s)).toThrow("combined");
});
it("disables data in both directions without removing configured cabling", () => {
  const s = treeFixture();
  expect(stpLinks(s).some((l) => l.id === "13")).toBe(false);
  [s.links[2].a, s.links[2].b] = [s.links[2].b, s.links[2].a];
  expect(stpLinks(s).some((l) => l.id === "13")).toBe(false);
  expect(s.links[2].up).toBe(true);
  s.devices[0].stp!.priority = 0;
  expect(stpLinks(s).some((l) => l.id === "13")).toBe(true);
});
it("keeps legacy networks outside STP", () => {
  expect(
    stpState({ schemaVersion: 3, devices: [], links: [] } as Pick<Scenario, "schemaVersion" | "devices" | "links">),
  ).toEqual({});
});
