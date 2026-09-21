import { expect } from "vitest";
import { connectivity, execute, repaired } from "../src/lib/engine";
import { grade } from "../src/lib/grading";
import { scenarioSchema, type Diagnosis, type Observation, type Scenario } from "../src/lib/schema";
import { commandsFor, catalog } from "../src/lib/catalog";
export function observations(s: Scenario, commands: [string, string][]): Observation[] {
  return commands.map(([device, command], n) => ({
    id: String(n),
    scenario: s.id,
    device,
    command,
    target: "",
    output: execute(s, device, command),
    at: 1,
  }));
}
export function assertCase(
  s: Scenario,
  healthyDevices: Scenario["devices"],
  answer: Diagnosis,
  history: Observation[],
) {
  expect(scenarioSchema.parse(s)).toEqual(s);
  const before = JSON.stringify(s);
  const fixed = repaired(s);
  expect(fixed.devices).toEqual(healthyDevices);
  expect(fixed.links).toEqual(s.links);
  expect(scenarioSchema.safeParse(fixed).success).toBe(true);
  expect(connectivity(s, "PC-A", catalog(s.id).target).ok).toBe(false);
  for (const d of fixed.devices)
    for (const target of fixed.devices.flatMap((p) => p.interfaces.map((i) => i.ip)))
      expect(connectivity(fixed, d.id, target).ok, `${d.id} -> ${target}`).toBe(true);
  for (const d of s.devices) {
    expect(d.commands).toEqual(commandsFor(s.id, d.id));
    for (const command of d.commands) expect(execute(s, d.id, command, catalog(s.id).target)).not.toMatch(/^%/);
  }
  expect(grade(s, answer, history).score).toBe(100);
  expect(grade(s, { ...answer, evidence: ["forged"] }, history).score).toBe(70);
  expect(JSON.stringify(s)).toBe(before);
}
