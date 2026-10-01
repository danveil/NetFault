import { expect, it } from "vitest";
import { labs, commandsFor } from "../src/lib/catalog";
import { getScenario } from "../src/server/scenarios";
import { connectivity, repaired, execute } from "../src/lib/engine";
import { grade } from "../src/lib/grading";
import { observations, assertCase } from "./case-contract";
import { timerScenario } from "../src/server/timer-scenario";
import { threeRouterNetwork } from "../src/server/three-router-network";
import { scenarioSchema } from "../src/lib/schema";
it.each(labs)(
  "authored case $id has matching identity/topology, achievable evidence and a working exact repair",
  (lab) => {
    const s = getScenario(lab.id);
    expect([s.id, s.title, s.incident, s.design]).toEqual([lab.id, lab.title, lab.incident, lab.design]);
    expect(s.revision).toBe(1);
    const expectedVersions = {
      "ipv6-01": 14,
      "ospf-01": 1,
      "gateway-01": 2,
      "vlan-01": 3,
      "return-01": 4,
      "passive-01": 5,
      "timer-01": 6,
      "next-hop-01": 6,
      "etherchannel-01": 7,
      "acl-01": 8,
      "stp-01": 9,
      "hsrp-01": 10,
      "port-security-01": 11,
      "nat-static-01": 12,
      "gre-01": 13,
    };
    expect(s.schemaVersion).toBe(expectedVersions[lab.id]);
    if (!("logicalLinks" in lab)) expect(s.links.map((l) => l.subnet)).toEqual(lab.subnets);
    if ("physicalLinks" in lab) {
      expect(s.links.map((l) => [l.a.device, l.b.device])).toEqual(lab.physicalLinks.map((l) => [l.source, l.target]));
    } else
      for (let n = 0; n < lab.devices.length - 1; n++)
        expect([s.links[n].a.device, s.links[n].b.device].sort()).toEqual(
          [lab.devices[n].id, lab.devices[n + 1].id].sort(),
        );
    const commands: [string, string][] = s.devices.flatMap((d) =>
      commandsFor(s.id, d.id)
        .filter((c) => !["ping", "traceroute", "tracert"].includes(c))
        .map((c): [string, string] => [d.id, c]),
    );
    const evidence = observations(s, commands);
    if (s.schemaVersion === 14)
      for (const d of s.devices.filter((d) => d.kind === "pc"))
        for (const target of [d.ipv6!.gateway!, lab.target])
          evidence.push({
            id: `ipv6-${d.id}-${target}`,
            scenario: s.id,
            device: d.id,
            command: "ping",
            target,
            output: execute(s, d.id, "ping", target),
            at: 1,
          });
    if (s.policyChecks)
      for (const p of s.policyChecks.filter((p) => p.permitted && !p.source))
        evidence.push({
          id: `probe-${p.device}`,
          scenario: s.id,
          device: p.device,
          command: "ping",
          target: p.target,
          output: execute(s, p.device, "ping", p.target),
          at: 1,
        });
    for (const p of s.verificationTargets ?? [])
      evidence.push({
        id: `service-${p.device}`,
        scenario: s.id,
        device: p.device,
        command: "ping",
        target: p.target,
        output: execute(s, p.device, "ping", p.target),
        at: 1,
      });
    if (s.schemaVersion === 11)
      for (const d of s.devices.filter((d) => d.kind === "pc"))
        evidence.push({
          id: `gateway-${d.id}`,
          scenario: s.id,
          device: d.id,
          command: "ping",
          target: d.gateway!,
          output: execute(s, d.id, "ping", d.gateway!),
          at: 1,
        });
    if (s.schemaVersion === 13)
      for (const [device, target, source] of [
        ["R1", "198.51.100.1", "Gi0/1"],
        ["R1", "198.51.100.2", "Gi0/1"],
        ["PC-A", lab.target, ""],
      ])
        evidence.push({
          id: `gre-${target}`,
          scenario: s.id,
          device,
          command: "ping",
          target,
          source,
          at: 1,
          output: execute(s, device, "ping", target, [], source),
        });
    const feedback = grade(
      s,
      { cause: "unspecified", devices: [], fix: "unspecified", evidence: evidence.map((o) => o.id), notes: "" },
      evidence,
    );
    expect(feedback.parts.find((p) => p.name === "Supporting evidence")?.earned).toBe(30);
    expect(connectivity(s, "PC-A", lab.target).ok).toBe(s.schemaVersion === 9 || s.schemaVersion === 10);
    expect(connectivity(repaired(s), "PC-A", lab.target).ok).toBe(true);
    const firstHost = s.devices.find((d) => d.id === "PC-A")!;
    const insidePhysical = firstHost.ipv6?.interfaces[0].address ?? firstHost.interfaces[0].ip;
    expect(
      connectivity(
        repaired(s),
        "PC-B",
        s.verificationTargets?.find((p) => p.device === "PC-B")?.target ?? insidePhysical,
      ).ok,
    ).toBe(true);
    if (s.verificationTargets) expect(connectivity(repaired(s), "PC-B", insidePhysical).ok).toBe(false);
  },
);
it("behavioral authoring contract catches a structurally plausible but ineffective timer repair", () => {
  const malformed = structuredClone(timerScenario);
  if (!("hello" in malformed.repair)) throw Error("Expected timer repair");
  malformed.repair.device = "R2";
  malformed.repair.interface = "Gi0/0";
  expect(scenarioSchema.safeParse(malformed).success).toBe(true);
  expect(() =>
    assertCase(
      malformed,
      threeRouterNetwork("timer-01", true).devices,
      { cause: "timer-mismatch", devices: ["R3"], fix: "timers", evidence: [], notes: "" },
      [],
    ),
  ).toThrow();
});
