import { expect, it } from "vitest";
import { passiveScenario } from "../src/server/passive-scenario";
import { scenarioSchema, type Diagnosis } from "../src/lib/schema";
import { grade } from "../src/lib/grading";
import { device, execute, neighbors, repaired } from "../src/lib/engine";
import { labs } from "../src/lib/catalog";
import { getScenario } from "../src/server/scenarios";
import { repairPreview } from "../src/lib/preview";
const answer: Diagnosis = {
  cause: "passive-interface",
  devices: ["R2"],
  interface: "Gi0/1",
  fix: "no-passive",
  reason: "hello-adjacency",
  evidence: [],
  notes: "",
};
it.each(["requirements", "devices", "commands"])(
  "rejects empty evidence %s at schema and grader boundaries",
  (field) => {
    const s = structuredClone(passiveScenario);
    s.evidenceRules = [
      { label: "Malformed", points: 30, requirements: [{ devices: ["R2"], commands: ["show ip route"] }] },
    ];
    if (field === "requirements") s.evidenceRules[0].requirements = [];
    else if (field === "devices") s.evidenceRules[0].requirements[0].devices = [];
    else s.evidenceRules[0].requirements[0].commands = [];
    expect(scenarioSchema.safeParse(s).success).toBe(false);
    expect(grade(s, answer, []).parts.find((p) => p.name === "Supporting evidence")?.earned).toBe(0);
  },
);
it.each([
  [10, 40, "00:00:36"],
  [5, 20, "00:00:18"],
] as const)("neighbor display follows matching %i/%i profile", (hello, dead, display) => {
  const s = repaired(passiveScenario);
  for (const d of s.devices) for (const i of d.interfaces) if (i.ospf) Object.assign(i.ospf, { hello, dead });
  expect(scenarioSchema.safeParse(s).success).toBe(true);
  expect(neighbors(s, "R2")).toHaveLength(2);
  expect(execute(s, "R2", "show ip ospf interface")).toContain(`Hello ${hello}, Dead ${dead}`);
  expect(execute(s, "R2", "show ip ospf neighbor")).toContain(display);
});
it("mismatch removes only the intended neighbor and restoring timers restores it", () => {
  const s = repaired(passiveScenario);
  const o = device(s, "R3").interfaces[0].ospf!;
  Object.assign(o, { hello: 5, dead: 20 });
  expect(neighbors(s, "R2").map((n) => n.routerId)).toEqual(["1.1.1.1"]);
  expect(execute(s, "R3", "show ip ospf neighbor")).toContain("No OSPF neighbors");
  Object.assign(o, { hello: 10, dead: 40 });
  expect(execute(s, "R3", "show ip ospf neighbor")).toContain("00:00:36");
});
it.each(labs.map((l) => [l.id] as const))("public catalog/preview boundary and old pack compatibility: %s", (id) => {
  const s = getScenario(id);
  const publicLab = labs.find((l) => l.id === id)!;
  expect(Object.keys(publicLab).sort()).toEqual(
    ["id", "number", "topic", "target", "title", "subtitle", "incident", "design", "devices", "subnets"].sort(),
  );
  for (const d of publicLab.devices) expect(Object.keys(d).sort()).toEqual(["id", "kind", "role"]);
  const oldPack = scenarioSchema.parse(JSON.parse(JSON.stringify(s)));
  const before = JSON.stringify(oldPack);
  const preview = repairPreview(oldPack);
  expect(preview).toContain("AFTER REPAIR");
  expect(preview).toContain("Bidirectional communication: successful");
  expect(preview).not.toContain("Unsupported");
  expect(JSON.stringify(oldPack)).toBe(before);
});
