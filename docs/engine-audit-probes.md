# Milestone 2E reproducible audit probes

> Historical 2E record. Milestone 3A now implements D1–D3 and LAB 006/007; see [execution record](milestone-3a.md). Original findings/probe assertions below intentionally describe the pre-fix state and must not be treated as current passing expectations.

Audited commit: `ed95191`, 2026-09-21. These are **observations of existing behavior**, not fixes or new labs. Eight disposable Vitest probes were run successfully. A passing assertion below may demonstrate an authoring gap or incorrect output; it does not mean that behavior is desirable. The normal regression suite remains 200 tests.

To reproduce in a future authorized audit, save the following block as `tests/audit-probes.test.ts` and run `node node_modules/vitest/vitest.mjs run tests/audit-probes.test.ts` from the repository root. Remove only that temporary file afterward. The file was removed after this audit; production source and permanent tests were unchanged.

```ts
import { it, expect } from "vitest";
import { passiveScenario } from "../src/server/passive-scenario";
import { gatewayScenario } from "../src/server/gateway-scenario";
import { returnScenario } from "../src/server/return-scenario";
import { device, repaired, execute, connectivity, routes, forward, neighbors } from "../src/lib/engine";
import { scenarioSchema } from "../src/lib/schema";
import { grade } from "../src/lib/grading";

it("A1: accepted 5/20 timers still print a 36-second neighbor dead snapshot", () => {
  const s = repaired(passiveScenario);
  for (const d of s.devices)
    for (const i of d.interfaces)
      if (i.ospf) {
        i.ospf.hello = 5;
        i.ospf.dead = 20;
      }
  expect(scenarioSchema.safeParse(s).success).toBe(true);
  expect(neighbors(s, "R2")).toHaveLength(2);
  expect(execute(s, "R2", "show ip ospf interface")).toContain("Hello 5, Dead 20");
  expect(execute(s, "R2", "show ip ospf neighbor")).toContain("00:00:36");
});
it("A2: empty evidence rules validate and award full evidence without observations", () => {
  const s = structuredClone(passiveScenario);
  s.evidenceRules = [{ label: "Empty rule", points: 30, requirements: [] }];
  expect(scenarioSchema.safeParse(s).success).toBe(true);
  expect(
    grade(
      s,
      {
        cause: "passive-interface",
        devices: ["R2"],
        interface: "Gi0/1",
        fix: "no-passive",
        reason: "hello-adjacency",
        evidence: [],
        notes: "",
      },
      [],
    ).score,
  ).toBe(100);
});
it("A3: fault metadata can name a nonexistent interface", () => {
  const s = structuredClone(passiveScenario);
  s.fault.interface = "R99:Missing";
  expect(scenarioSchema.safeParse(s).success).toBe(true);
});
it("A4: host wrong-mask mechanics work on a raw model but authored validation rejects it", () => {
  const s = repaired(gatewayScenario);
  expect(connectivity(s, "PC-A", "192.168.20.10").ok).toBe(true);
  device(s, "PC-A").interfaces[0].prefix = 16;
  const parsed = scenarioSchema.safeParse(s);
  expect(parsed.success).toBe(false);
  if (!parsed.success) expect(parsed.error.issues.map((i) => i.message)).toContain("Link subnet mismatch");
  expect(connectivity(s, "PC-A", "192.168.10.1").ok).toBe(true);
  expect(forward(s, "PC-A", "192.168.20.10").reason).toBe("PC-A: next-hop resolution failed");
  device(s, "PC-A").interfaces[0].prefix = 24;
  expect(connectivity(s, "PC-A", "192.168.20.10").ok).toBe(true);
});
it("A5: nonexistent static next hops are rejected; a valid wrong peer can create a loop", () => {
  const s = repaired(returnScenario);
  device(s, "R2").staticRoutes!.push({ network: "192.168.20.10", prefix: 32, nextHop: "10.0.12.1" });
  expect(scenarioSchema.safeParse(s).success).toBe(true);
  expect(forward(s, "PC-A", "192.168.20.10").reason).toBe("Routing loop");
  device(s, "R2").staticRoutes!.at(-1)!.nextHop = "10.0.12.99";
  expect(scenarioSchema.safeParse(s).success).toBe(false);
});
it("A6: weighted alternative OSPF paths choose the lower hand-calculated total", () => {
  const s = repaired(passiveScenario);
  const r1 = device(s, "R1"),
    r3 = device(s, "R3");
  r1.interfaces[1].ospf!.cost = 10;
  const a = structuredClone(r1.interfaces[1]),
    b = structuredClone(r3.interfaces[0]);
  Object.assign(a, { name: "Gi0/2", ip: "172.16.13.1", mac: "02:00:00:00:00:91" });
  Object.assign(b, { name: "Gi0/2", ip: "172.16.13.2", mac: "02:00:00:00:00:92" });
  a.ospf!.cost = 1;
  b.ospf!.cost = 1;
  r1.interfaces.push(a);
  r3.interfaces.push(b);
  s.links.push({
    id: "audit-edge",
    a: { device: "R1", interface: "Gi0/2" },
    b: { device: "R3", interface: "Gi0/2" },
    subnet: "172.16.13.0/30",
  });
  expect(scenarioSchema.safeParse(s).success).toBe(true);
  expect(routes(s, "R1").find((r) => r.prefix === "192.168.30.0/24")).toMatchObject({ via: "172.16.13.2", cost: 2 });
  a.ospf!.cost = 50;
  expect(routes(s, "R1").find((r) => r.prefix === "192.168.30.0/24")).toMatchObject({ via: "10.0.12.2", cost: 12 });
});
it("A7: schema does not enforce the catalog's id/version/content pairing", () => {
  expect(scenarioSchema.safeParse({ ...passiveScenario, id: "ospf-01" }).success).toBe(true);
});
it("A8: a schema-valid repair may be a no-op that leaves the actual fault", () => {
  const s = structuredClone(passiveScenario);
  s.repair = { device: "R2", interface: "Gi0/0", passive: false, reason: "hello-adjacency" };
  expect(scenarioSchema.safeParse(s).success).toBe(true);
  expect(repaired(s)).toEqual(s);
  expect(connectivity(repaired(s), "PC-A", "192.168.30.10").ok).toBe(false);
});
```

A1 confirms the fixed timer display issue. A2 confirms empty evidence rules earn unearned evidence points. A3/A7/A8 demonstrate missing authoring guardrails. A4 isolates a raw forwarding mechanism from the stricter authored schema; it is not a supported new lab. A5 bounds static-next-hop fault choices. A6 supplies one hand-calculated alternative-path check, not exhaustive OSPF validation.
