import { expect, it } from "vitest";
import { labs, commandsFor } from "../src/lib/catalog";
import { getScenario } from "../src/server/scenarios";
import { connectivity, repaired } from "../src/lib/engine";
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
      "ospf-01": 1,
      "gateway-01": 2,
      "vlan-01": 3,
      "return-01": 4,
      "passive-01": 5,
      "timer-01": 6,
      "next-hop-01": 6,
    };
    expect(s.schemaVersion).toBe(expectedVersions[s.id]);
    expect(s.links.map((l) => l.subnet)).toEqual(lab.subnets);
    for (let n = 0; n < 4; n++)
      expect([s.links[n].a.device, s.links[n].b.device].sort()).toEqual(
        [lab.devices[n].id, lab.devices[n + 1].id].sort(),
      );
    const commands: [string, string][] = s.devices.flatMap((d) =>
      commandsFor(s.id, d.id)
        .filter((c) => !["ping", "traceroute", "tracert"].includes(c))
        .map((c): [string, string] => [d.id, c]),
    );
    const evidence = observations(s, commands);
    const feedback = grade(
      s,
      { cause: "unspecified", devices: [], fix: "unspecified", evidence: evidence.map((o) => o.id), notes: "" },
      evidence,
    );
    expect(feedback.parts.find((p) => p.name === "Supporting evidence")?.earned).toBe(30);
    expect(connectivity(s, "PC-A", lab.target).ok).toBe(false);
    expect(connectivity(repaired(s), "PC-A", lab.target).ok).toBe(true);
    expect(connectivity(repaired(s), "PC-B", "192.168.10.10").ok).toBe(true);
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
