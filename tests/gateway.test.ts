import { afterEach, describe, expect, it, vi } from "vitest";
import { gatewayScenario as s } from "../src/server/gateway-scenario";
import { scenario as ospf } from "../src/server/scenario";
import { connectivity, device, execute, forward, neighbors, repaired, routes } from "../src/lib/engine";
import { scenarioSchema, type Diagnosis, type Observation } from "../src/lib/schema";
import { grade, nextHint } from "../src/lib/grading";
import { commandsFor, labs } from "../src/lib/catalog";
import { loadJournal, loadPack, saveAttempt, savePack, packKey } from "../src/lib/storage";
import { startAssessment, assessmentAction, ASSESSMENT_MS } from "../src/server/sessions";
import { POST } from "../src/app/api/lab/route";

const evidence: Observation = {
  id: "observed",
  device: "PC-A",
  command: "ipconfig",
  target: "",
  output: execute(s, "PC-A", "ipconfig"),
  at: 1,
};
const correct: Diagnosis = {
  cause: "wrong-gateway",
  devices: ["PC-A"],
  fix: "gateway",
  gateway: "192.168.10.1",
  reason: "on-link-router",
  evidence: [evidence.id],
  notes: "",
};
afterEach(() => vi.useRealTimers());

describe("one gateway fault and the Layer 2 path", () => {
  it("retains both schema generations alongside the authorized VLAN lab", () => {
    expect(scenarioSchema.parse(s).schemaVersion).toBe(2);
    expect(scenarioSchema.parse(ospf).schemaVersion).toBe(1);
    expect(labs.map((l) => l.id)).toEqual(["ospf-01", "gateway-01", "vlan-01", "return-01"]);
    expect(s.devices.map((d) => d.id)).toEqual(["PC-A", "SW1", "R1", "R2", "PC-B"]);
    expect(s.devices.flatMap((d) => d.interfaces.map((i) => `${i.ip}/${i.prefix}`))).toEqual([
      "192.168.10.10/24",
      "192.168.10.1/24",
      "10.0.12.1/30",
      "10.0.12.2/30",
      "192.168.20.1/24",
      "192.168.20.10/24",
    ]);
    expect(s.devices.flatMap((d) => d.interfaces).every((i) => i.up)).toBe(true);
    expect(device(s, "SW1").ports?.every((p) => p.up && p.vlan === 10)).toBe(true);
  });
  it("permits an absent gateway only for the explicit v2 host fault", () => {
    for (const mutate of [
      (x: typeof s) => {
        device(x, "PC-B").gateway = "192.168.20.254";
      },
      (x: typeof s) => {
        device(x, "PC-A").gateway = "192.168.10.0";
      },
      (x: typeof s) => {
        device(x, "PC-A").gateway = "192.168.10.255";
      },
      (x: typeof s) => {
        device(x, "PC-A").gateway = "192.168.20.1";
      },
      (x: typeof s) => {
        x.schemaVersion = 1;
      },
    ]) {
      const x = structuredClone(s);
      mutate(x);
      expect(scenarioSchema.safeParse(x).success).toBe(false);
    }
  });
  it("validates access ports, VLAN membership, subnet and repair references", () => {
    for (const mutate of [
      (x: typeof s) => {
        device(x, "SW1").ports![0].vlan = 99;
      },
      (x: typeof s) => {
        x.links[0].b.interface = "absent";
      },
      (x: typeof s) => {
        x.links[1].subnet = "192.168.11.0/24";
      },
      (x: typeof s) => {
        x.repair = { device: "PC-A", gateway: "10.0.12.1", reason: "on-link-router" };
      },
    ]) {
      const x = structuredClone(s);
      mutate(x);
      expect(scenarioSchema.safeParse(x).success).toBe(false);
    }
  });
  it("reaches local R1 directly through SW1 despite the bad default route", () => {
    expect(connectivity(s, "PC-A", "192.168.10.1").ok).toBe(true);
    expect(forward(s, "PC-A", "192.168.10.1").hops).toEqual(["192.168.10.1"]);
    expect(connectivity(s, "R1", "192.168.10.10").ok).toBe(true);
    expect(connectivity(s, "PC-A", "192.168.10.254").ok).toBe(false);
  });
  it("fails remote traffic before any router and fails the reverse echo return", () => {
    const out = connectivity(s, "PC-A", "192.168.20.10");
    expect(out.ok).toBe(false);
    expect(out.outward).toEqual({ ok: false, hops: [], reason: "PC-A: next-hop resolution failed" });
    const reverse = connectivity(s, "PC-B", "192.168.10.10");
    expect(reverse.outward.ok).toBe(true);
    expect(reverse.returning?.ok).toBe(false);
  });
  it("has healthy router adjacencies, remote routes and PC-B gateway", () => {
    expect(neighbors(s, "R1").map((n) => n.device)).toEqual(["R2"]);
    expect(neighbors(s, "R2").map((n) => n.device)).toEqual(["R1"]);
    expect(routes(s, "R1")).toContainEqual({
      prefix: "192.168.20.0/24",
      kind: "O",
      via: "10.0.12.2",
      interface: "Gi0/1",
      cost: 2,
    });
    expect(routes(s, "R2")).toContainEqual({
      prefix: "192.168.10.0/24",
      kind: "O",
      via: "10.0.12.1",
      interface: "Gi0/0",
      cost: 2,
    });
    expect(connectivity(s, "R1", "192.168.20.10").ok).toBe(true);
    expect(connectivity(s, "PC-B", "192.168.20.1").ok).toBe(true);
  });
  it("derives switching from live port and VLAN state, not an invisible bypass", () => {
    const x = structuredClone(s);
    device(x, "SW1").ports![1].up = false;
    expect(connectivity(x, "PC-A", "192.168.10.1").ok).toBe(false);
    expect(execute(x, "SW1", "show interfaces status")).toContain("disabled");
    device(x, "SW1").ports![1].up = true;
    device(x, "SW1").vlans![0].active = false;
    expect(connectivity(x, "PC-A", "192.168.10.1").ok).toBe(false);
  });
  it("repairs exactly one setting and restores every modeled IP path", () => {
    const fixed = repaired(s);
    const expected = structuredClone(s);
    device(expected, "PC-A").gateway = "192.168.10.1";
    expect(fixed).toEqual(expected);
    expect(device(s, "PC-A").gateway).toBe("192.168.10.254");
    expect(scenarioSchema.safeParse(fixed).success).toBe(true);
    for (const d of fixed.devices.filter((d) => d.kind !== "switch"))
      for (const i of fixed.devices.flatMap((d) => d.interfaces))
        expect(connectivity(fixed, d.id, i.ip).ok, `${d.id} → ${i.ip}`).toBe(true);
  });
});

describe("observations and deterministic diagnosis", () => {
  it("implements exactly the per-device advertised commands", () => {
    for (const d of s.devices) {
      expect(d.commands).toEqual(commandsFor(s.id, d.id));
      for (const command of d.commands) {
        const output = execute(s, d.id, command, "192.168.20.10");
        expect(output).not.toContain("Unsupported");
        expect(output).toBe(execute(s, d.id, command, "192.168.20.10"));
      }
    }
    expect(execute(s, "SW1", "ping", "192.168.10.1")).toContain("Unsupported");
    expect(execute(s, "PC-B", "ipconfig /all")).toContain("Unsupported");
  });
  it("shows the configured gateway and default route consistently", () => {
    for (const cmd of ["ipconfig", "ipconfig /all", "route print"]) {
      expect(execute(s, "PC-A", cmd)).toContain("192.168.10.254");
      expect(execute(repaired(s), "PC-A", cmd)).not.toContain("192.168.10.254");
    }
    expect(execute(s, "PC-A", "route print")).toMatch(/192\.168\.10\.0\s+255\.255\.255\.0\s+On-link/);
    expect(execute(s, "PC-A", "route print")).toContain("0.0.0.0");
    expect(execute(s, "R1", "show running-config")).toContain("ip address 192.168.10.1 255.255.255.0");
    expect(execute(s, "SW1", "show vlan brief")).toContain("Gi0/1, Gi0/2");
    expect(execute(s, "SW1", "show interfaces status").match(/connected/g)).toHaveLength(2);
  });
  it("shows local success, remote failure, no switch TTL hop and repaired trace", () => {
    expect(execute(s, "PC-A", "ping", "192.168.10.1")).toContain("100 percent");
    expect(execute(s, "PC-A", "ping", "192.168.20.10")).toContain("0 percent (0/5)");
    expect(execute(s, "PC-A", "tracert", "192.168.20.10")).toContain("1  !H");
    expect(execute(repaired(s), "PC-A", "tracert", "192.168.20.10")).toContain(
      "1  192.168.10.1\n2  10.0.12.2\n3  192.168.20.10\nTrace complete.",
    );
  });
  it("accepts full diagnosis with one relevant observation and a structured mechanism", () => {
    const result = grade(s, correct, [evidence]);
    expect(result.score).toBe(100);
    expect(result.lesson).toHaveLength(7);
    expect(result.lesson?.[1].text).toContain("Limit:");
  });
  it.each([
    [{ cause: "area-mismatch" }, 70],
    [{ devices: ["R1"] }, 80],
    [{ gateway: "192.168.10.254" }, 90],
    [{ gateway: "" }, 90],
    [{ reason: "dns-resolution" }, 90],
    [{ evidence: ["forged"] }, 70],
    [{ fix: "restart", gateway: "192.168.10.254", reason: "switch-routing" }, 80],
  ])("rejects an incorrect part without keyword inference: %j", (patch, score) => {
    expect(grade(s, { ...correct, ...patch, notes: s.explanation } as Diagnosis, [evidence]).score).toBe(score);
  });
  it("does not credit another device's configuration as evidence", () => {
    expect(grade(s, correct, [{ ...evidence, device: "PC-B" }]).score).toBe(70);
    expect(nextHint(s, 0)).toContain("subnet");
    expect(nextHint(s, 1)).toContain("route print");
    expect(nextHint(s, 2)).toContain("default route");
  });
});

describe("assessment and saved progress isolation", () => {
  it("uses the stored scenario for commands, grading and reload", async () => {
    const a = await startAssessment(undefined, "gateway-01");
    expect(a).not.toHaveProperty("feedback");
    expect(a.hints).toEqual([]);
    expect(a).not.toHaveProperty("lesson");
    const observed = await assessmentAction(a.id, "command", { device: "PC-A", command: "ipconfig", target: "" });
    expect(observed.history[0].output).toContain("192.168.10.254");
    await expect(
      assessmentAction(a.id, "command", { device: "R3", command: "show ip route", target: "" }),
    ).rejects.toThrow("not part of this lab");
    vi.resetModules();
    const reload = await import("../src/server/sessions");
    const done = await reload.assessmentAction(a.id, "submit", { ...correct, evidence: [observed.history[0].id] });
    expect(done.feedback?.score).toBe(100);
    expect(done.scenario).toBe("gateway-01");
    expect(await reload.assessmentAction(a.id, "submit", { ...correct, gateway: "192.168.10.254" })).toEqual(done);
  });
  it("expires a gateway assessment with the matching explanation", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const a = await startAssessment(undefined, "gateway-01");
    vi.setSystemTime(a.startedAt + ASSESSMENT_MS + 1);
    const done = await assessmentAction(a.id, "submit", correct);
    expect(done.feedback?.score).toBe(0);
    expect(done.feedback?.timedOut).toBe(true);
    expect(done.feedback?.lesson).toHaveLength(7);
  });
  it("routes API requests to the chosen lab and rejects unknown labs", async () => {
    const request = (body: unknown) =>
      new Request("https://example.test/api/lab", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    const response = await POST(request({ action: "start", scenario: "gateway-01" }));
    const { attempt } = await response.json();
    expect(attempt.scenario).toBe("gateway-01");
    const observed = await (
      await POST(
        request({
          action: "command",
          id: attempt.id,
          scenario: "ospf-01",
          device: "PC-A",
          command: "ipconfig",
          target: "",
        }),
      )
    ).json();
    expect(observed.attempt.history[0].output).toContain("192.168.10.254");
    expect((await POST(request({ action: "start", scenario: "third-lab" }))).status).toBe(400);
    const pack = await (await POST(request({ action: "practice-pack", scenario: "gateway-01" }))).json();
    expect(pack.pack.id).toBe("gateway-01");
  });
  it("retains old OSPF saves and both offline packs without cross-lab overwrite", async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    };
    savePack(storage, ospf);
    savePack(storage, s);
    expect(loadPack(storage)).toEqual(ospf);
    expect(loadPack(storage, "gateway-01")).toEqual(s);
    expect(packKey("ospf-01")).toBe("netfault.practice.v1");
    const a = await startAssessment();
    const b = await startAssessment(undefined, "gateway-01");
    saveAttempt(storage, a);
    saveAttempt(storage, { ...b, diagnosis: { ...correct, gateway: "192." } });
    expect(loadJournal(storage).map((a) => a.scenario)).toEqual(["gateway-01", "ospf-01"]);
    values.set(packKey("gateway-01"), "corrupt");
    expect(() => loadPack(storage, "gateway-01")).toThrow();
    expect(values.get(packKey("gateway-01"))).toBe("corrupt");
    expect(loadPack(storage)).toEqual(ospf);
  });
});
