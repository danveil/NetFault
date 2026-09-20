import { afterEach, describe, expect, it, vi } from "vitest";
import { returnScenario as s } from "../src/server/return-scenario";
import { getScenario } from "../src/server/scenarios";
import { labs, commandsFor } from "../src/lib/catalog";
import {
  connectivity,
  device,
  execute,
  forward,
  neighbors,
  repaired,
  routes,
  packetJourney,
  commandSequence,
  arpState,
} from "../src/lib/engine";
import { grade, nextHint } from "../src/lib/grading";
import { scenarioSchema, type Diagnosis, type Observation } from "../src/lib/schema";
import { startAssessment, assessmentAction, ASSESSMENT_MS } from "../src/server/sessions";
import { POST } from "../src/app/api/lab/route";
import { loadJournal, loadPack, savePack, saveAttempt, packKey } from "../src/lib/storage";

const a = "192.168.10.10",
  b = "192.168.20.10";
const observe = (id: string, command: string, target = ""): Observation => ({
  id: `${id}:${command}`,
  scenario: s.id,
  device: id,
  command,
  target,
  output: execute(s, id, command, target),
  at: 1,
});
const evidence = [observe("R2", "show ip route"), observe("PC-A", "ipconfig"), observe("R1", "show ip route")];
const correct: Diagnosis = {
  cause: "missing-route",
  devices: ["R2"],
  destinationNetwork: "192.168.10.0/24",
  nextHop: "10.0.12.1",
  reason: "reply-route",
  fix: "static-route",
  evidence: evidence.map((o) => o.id),
  notes: "",
};
afterEach(() => vi.useRealTimers());

describe("static route schema and one-fault configuration", () => {
  it("loads four versions with unique usable addresses and validated attachments", () => {
    expect(labs.map((l) => scenarioSchema.parse(getScenario(l.id)).schemaVersion)).toEqual([1, 2, 3, 4, 5]);
    expect(s.devices.flatMap((d) => d.interfaces.map((i) => `${i.ip}/${i.prefix}`))).toEqual([
      "192.168.10.10/24",
      "192.168.10.1/24",
      "10.0.12.1/30",
      "10.0.12.2/30",
      "192.168.20.1/24",
      "192.168.20.10/24",
    ]);
    expect(s.links).toHaveLength(4);
    expect(s.devices.every((d) => d.interfaces.every((i) => i.up && !i.ospf))).toBe(true);
    expect(device(s, "PC-A").gateway).toBe("192.168.10.1");
    expect(device(s, "PC-B").gateway).toBe("192.168.20.1");
    expect(device(s, "SW1").ports?.every((p) => p.up && p.vlan === 10)).toBe(true);
    expect(device(s, "SW1").vlans).toEqual([{ id: 10, name: "STUDENT_LAN", active: true }]);
    expect(neighbors(s, "R1")).toEqual([]);
  });
  it.each(["10.0.12.1", "10.0.12.0", "10.0.12.3", "10.99.0.2", "192.168.20.10"])(
    "rejects invalid R1 next hop %s",
    (nextHop) => {
      const bad = structuredClone(s);
      device(bad, "R1").staticRoutes![0].nextHop = nextHop;
      expect(scenarioSchema.safeParse(bad).success).toBe(false);
    },
  );
  it("rejects noncanonical prefixes, duplicates, old-version static routes and invalid repair", () => {
    const bad = structuredClone(s);
    device(bad, "R1").staticRoutes![0].network = "192.168.20.10";
    expect(scenarioSchema.safeParse(bad).success).toBe(false);
    const duplicate = structuredClone(s);
    device(duplicate, "R1").staticRoutes!.push(device(duplicate, "R1").staticRoutes![0]);
    expect(scenarioSchema.safeParse(duplicate).success).toBe(false);
    expect(scenarioSchema.safeParse({ ...s, schemaVersion: 3 }).success).toBe(false);
    const pcRoutes = structuredClone(s);
    device(pcRoutes, "PC-A").staticRoutes = [];
    expect(scenarioSchema.safeParse(pcRoutes).success).toBe(false);
    expect(
      scenarioSchema.safeParse({
        ...s,
        repair: {
          device: "PC-A",
          route: { network: "192.168.10.0", prefix: 24, nextHop: "10.0.12.1" },
          reason: "reply-route",
        },
      }).success,
    ).toBe(false);
  });
  it("repairs only R2's route list, without mutating the original or adding another fault", () => {
    const fixed = repaired(s);
    expect(scenarioSchema.safeParse(fixed).success).toBe(true);
    expect(device(s, "R2").staticRoutes).toEqual([]);
    expect(device(fixed, "R2").staticRoutes).toEqual([{ network: "192.168.10.0", prefix: 24, nextHop: "10.0.12.1" }]);
    const restored = structuredClone(fixed);
    device(restored, "R2").staticRoutes = [];
    expect(restored).toEqual(s);
    expect(repaired(fixed)).toEqual(fixed);
    for (const from of fixed.devices.filter((d) => d.kind !== "switch"))
      for (const to of fixed.devices.flatMap((d) => d.interfaces))
        expect(connectivity(fixed, from.id, to.ip).ok).toBe(true);
  });
});
describe("routing and directional packet behavior", () => {
  it("installs C/L/S accurately with no alternate route at R2", () => {
    expect(routes(s, "R1").filter((r) => r.kind === "S")).toEqual([
      { prefix: "192.168.20.0/24", kind: "S", via: "10.0.12.2", interface: "Gi0/1", cost: 0 },
    ]);
    expect(routes(s, "R2").map((r) => [r.kind, r.prefix])).toEqual([
      ["C", "10.0.12.0/30"],
      ["L", "10.0.12.2/32"],
      ["C", "192.168.20.0/24"],
      ["L", "192.168.20.1/32"],
    ]);
    expect(execute(s, "R2", "show ip route")).toContain("Gateway of last resort is not set");
  });
  it("prefers the longest prefix before a default, and local/connected for identical prefixes", () => {
    const modified = repaired(s);
    device(modified, "R1").staticRoutes!.push(
      { network: "0.0.0.0", prefix: 0, nextHop: "10.0.12.2" },
      { network: "192.168.10.0", prefix: 24, nextHop: "10.0.12.2" },
    );
    expect(scenarioSchema.safeParse(modified).success).toBe(true);
    expect(forward(modified, "R1", a)).toEqual({ ok: true, hops: [a], reason: "Delivered" });
    expect(
      routes(modified, "R1")
        .filter((r) => r.prefix === "192.168.10.0/24")
        .map((r) => r.kind),
    ).toEqual(["C"]);
    // More specific /32 overrides connected /24; a bad path loops, proving the lookup actually changed.
    device(modified, "R1").staticRoutes!.push({ network: a, prefix: 32, nextHop: "10.0.12.2" });
    expect(forward(modified, "R1", a).reason).toBe("Routing loop");
    expect(execute(modified, "R1", "show ip route")).toContain("S* 0.0.0.0/0");
    expect(execute(modified, "R1", "show ip route")).toContain("Gateway of last resort is 10.0.12.2");
  });
  it("withdraws an installed static route when its connected outgoing interface is down", () => {
    const down = structuredClone(s);
    device(down, "R1").interfaces[1].up = false;
    expect(routes(down, "R1").some((r) => r.kind === "S")).toBe(false);
    expect(execute(down, "R1", "show running-config")).toContain("ip route 192.168.20.0");
    expect(forward(down, "PC-A", b).ok).toBe(false);
  });
  it("delivers the request but stops its reply at R2; local gateways work", () => {
    expect(connectivity(s, "PC-A", "192.168.10.1").ok).toBe(true);
    expect(connectivity(s, "PC-B", "192.168.20.1").ok).toBe(true);
    const c = connectivity(s, "PC-A", b);
    expect(c.source).toBe(a);
    expect(c.outward).toEqual({ ok: true, hops: ["192.168.10.1", "10.0.12.2", b], reason: "Delivered" });
    expect(c.returning).toEqual({ ok: false, hops: ["192.168.20.1"], reason: "R2: no route to destination" });
    expect(c.ok).toBe(false);
    expect(forward(s, "PC-B", a).ok).toBe(false);
  });
  it("distinguishes router outgoing source from explicit LAN source", () => {
    expect(connectivity(s, "R1", b)).toMatchObject({ ok: true, source: "10.0.12.1" });
    for (const source of ["Gi0/0", "192.168.10.1", "gi0/0"])
      expect(connectivity(s, "R1", b, source)).toMatchObject({
        ok: false,
        source: "192.168.10.1",
        outward: { ok: true },
        returning: { ok: false },
      });
    expect(connectivity(repaired(s), "R1", b, "Gi0/0").ok).toBe(true);
  });
  it("restores both directions from the actual static repair", () => {
    const fixed = repaired(s);
    expect(connectivity(fixed, "PC-A", b)).toMatchObject({
      ok: true,
      outward: { ok: true },
      returning: { ok: true, hops: ["192.168.20.1", "10.0.12.1", a] },
    });
    expect(connectivity(fixed, "PC-B", a).ok).toBe(true);
    expect(packetJourney(s, "PC-A", b)).toContain("R2: no route to destination");
    expect(packetJourney(fixed, "PC-A", b)).toContain("Bidirectional communication: successful");
  });
  it("never invents intermediate trace replies or unreachable errors without a return path", () => {
    const trace = execute(s, "PC-A", "tracert", b);
    expect(trace).toContain("1  192.168.10.1\n2  * * *\n3  * * *");
    expect(trace).not.toContain("!H");
    expect(trace).not.toContain("SW1");
    const missing = structuredClone(s);
    device(missing, "R1").staticRoutes!.push({ network: "203.0.113.0", prefix: 24, nextHop: "10.0.12.2" });
    const noErrorReturn = execute(missing, "PC-A", "tracert", "203.0.113.10");
    expect(noErrorReturn).not.toContain("!H");
    expect(noErrorReturn).not.toContain("no route");
    expect(execute(repaired(s), "PC-A", "tracert", b)).toContain("1  192.168.10.1\n2  10.0.12.2\n3  192.168.20.10");
  });
});
describe("commands and deterministic grading", () => {
  it("supports every advertised device command and honest unsupported responses", () => {
    for (const d of s.devices) {
      expect(d.commands).toEqual(commandsFor(s.id, d.id));
      for (const command of d.commands) expect(execute(s, d.id, command, b)).not.toMatch(/Unsupported|undefined/);
    }
    expect(execute(s, "SW1", "ping", b)).toContain("Unsupported");
    expect(execute(s, "R1", "show ip ospf neighbor")).toContain("Unsupported");
    expect(execute(s, "PC-A", "ipconfig /all")).toContain("Default Gateway . : 192.168.10.1");
  });
  it("renders static config and route metrics without invented OSPF", () => {
    expect(execute(s, "R1", "show running-config")).toContain("ip route 192.168.20.0 255.255.255.0 10.0.12.2");
    for (const id of ["R1", "R2"]) expect(execute(s, id, "show running-config")).not.toContain("ospf");
    expect(execute(s, "R1", "show ip route")).toMatch(/S 192.168.20.0\/24\s+\[1\/0\] via 10.0.12.2, Gi0\/1/);
    expect(execute(s, "R2", "show running-config")).not.toContain("ip route");
    expect(execute(repaired(s), "R2", "show running-config")).toContain(
      "ip route 192.168.10.0 255.255.255.0 10.0.12.1",
    );
  });
  it("reports observable ping outcomes with source, not hidden failure reasons", () => {
    expect(execute(s, "R1", "ping", b)).toContain("source 10.0.12.1");
    expect(execute(s, "R1", "ping", b)).toContain("100 percent");
    expect(execute(s, "R1", "ping", b, [], "Gi0/0")).toContain("0 percent (0/5)");
    expect(execute(s, "PC-A", "ping", b)).not.toContain("R2:");
    expect(commandSequence(repaired(s), [["R1", "ping", b, "Gi0/0"]])).toContain("ping 192.168.20.10 source Gi0/0");
  });
  it("rejects invalid source addresses and source flags for other commands", () => {
    expect(execute(s, "R1", "ping", b, [], a)).toContain("Source must be");
    expect(execute(s, "PC-A", "ping", b, [], a)).toContain("Source must be");
    expect(execute(s, "R1", "show ip route", "", [], "Gi0/0")).toContain("Explicit source is supported only");
  });
  it("never replays a rejected source option as ARP traffic", () => {
    const observation = { ...observe("R1", "traceroute", b), source: "Gi0/0" };
    observation.output = execute(s, "R1", "traceroute", b, [], observation.source);
    expect(observation.output).toContain("Explicit source is supported only");
    expect(arpState(s, "R1", [observation])).toEqual({ entries: [], last: undefined });
    const invalid = { ...observe("R1", "ping", b), source: "192.168.99.1" };
    expect(arpState(s, "R1", [invalid])).toEqual({ entries: [], last: undefined });
  });
  it("grades full evidence in arbitrary order and supplies four progressive hints and gated teaching", () => {
    expect(grade(s, correct, [...evidence].reverse()).score).toBe(100);
    expect(s.hints).toHaveLength(4);
    expect(nextHint(s, 0)).not.toMatch(/R2|192.168.10.0|missing route/);
    expect(nextHint(s, 3)).toContain("R2");
    expect(s.lesson).toHaveLength(7);
    expect(s.lesson?.[6].revealOnRequest).toBe(true);
  });
  it.each([
    [{ cause: "wrong-gateway" }, 80],
    [{ devices: ["R1"] }, 70],
    [{ destinationNetwork: "192.168.20.0/24" }, 80],
    [{ nextHop: "10.0.12.2" }, 90],
    [{ reason: "reverse-automatically" }, 90],
    [{ fix: "gateway" }, 90],
    [{ fix: "access-vlan" }, 90],
    [{ evidence: ["forged"] }, 70],
  ])("awards precise partial credit for %j", (patch, score) => {
    expect(grade(s, { ...correct, ...patch, notes: s.solution } as Diagnosis, evidence).score).toBe(score);
  });
  it("requires source addressing with missing-route evidence, never failed ping alone or error output", () => {
    expect(grade(s, correct, [evidence[0]]).parts[2].earned).toBe(0);
    expect(grade(s, correct, [evidence[0], evidence[1]]).parts[2].earned).toBe(20);
    const ping = observe("PC-A", "ping", b);
    expect(grade(s, { ...correct, evidence: [ping.id] }, [ping]).parts[2].earned).toBe(0);
    expect(
      grade(
        s,
        correct,
        evidence.map((o) => ({ ...o, scenario: "vlan-01" })),
      ).parts[2].earned,
    ).toBe(0);
    expect(
      grade(
        s,
        correct,
        evidence.map((o) => ({ ...o, output: "% Explicit source is unsupported" })),
      ).parts[2].earned,
    ).toBe(0);
  });
});
describe("assessment and compatible persistence", () => {
  it("persists source observations across module reload and grades server evidence immutably", async () => {
    const attempt = await startAssessment(undefined, s.id);
    expect(attempt).not.toHaveProperty("repair");
    expect(attempt).not.toHaveProperty("feedback");
    expect(attempt.hints).toEqual([]);
    await assessmentAction(attempt.id, "command", { device: "R1", command: "ping", target: b, source: "Gi0/0" });
    vi.resetModules();
    const reloaded = await import("../src/server/sessions");
    let latest = await reloaded.assessmentAction(attempt.id, "resume");
    expect(latest.history[0]).toMatchObject({ source: "Gi0/0", scenario: s.id });
    expect(latest.history[0].output).toContain("0 percent (0/5)");
    for (const e of evidence)
      latest = await reloaded.assessmentAction(attempt.id, "command", {
        device: e.device,
        command: e.command,
        target: "",
      });
    const final = await reloaded.assessmentAction(attempt.id, "submit", {
      ...correct,
      evidence: latest.history.map((o) => o.id),
    });
    expect(final.feedback?.score).toBe(100);
    expect(await reloaded.assessmentAction(attempt.id, "submit", { ...correct, devices: ["R1"] })).toEqual(final);
  });
  it("enforces server expiry", async () => {
    const attempt = await startAssessment(undefined, s.id);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(attempt.startedAt + ASSESSMENT_MS + 1);
    const final = await assessmentAction(attempt.id, "submit", correct);
    expect(final.feedback).toMatchObject({ score: 0, timedOut: true });
  });
  it("validates source input, protects cache and preserves persisted scenario through API", async () => {
    const post = (body: unknown) =>
      POST(
        new Request("https://example.test/api/lab", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
      );
    const response = await post({ action: "start", scenario: s.id });
    for (const header of ["Cache-Control", "CDN-Cache-Control", "Netlify-CDN-Cache-Control"])
      expect(response.headers.get(header)).toBe("no-store");
    const { attempt } = await response.json();
    const cmd = {
      action: "command",
      id: attempt.id,
      device: "R1",
      command: "ping",
      target: b,
      source: "Gi0/0",
      scenario: "ospf-01",
    };
    const { attempt: observed } = await (await post(cmd)).json();
    expect(observed.scenario).toBe(s.id);
    expect(observed.history[0].output).toContain("source 192.168.10.1");
    expect((await post({ ...cmd, source: "x".repeat(65) })).status).toBe(400);
    expect(
      (await post({ action: "submit", id: attempt.id, diagnosis: { ...correct, nextHop: "x".repeat(65) } })).status,
    ).toBe(400);
  });
  it("keeps four independent packs and legacy journals readable", async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => {
        values.set(k, v);
      },
      removeItem: (k: string) => {
        values.delete(k);
      },
    };
    for (const lab of labs) {
      const pack = getScenario(lab.id);
      savePack(storage, pack);
      const attempt = await startAssessment(undefined, lab.id);
      saveAttempt(storage, {
        ...attempt,
        mode: "practice",
        ...(lab.id === s.id ? { history: [{ ...evidence[0], source: "" }], diagnosis: correct } : {}),
      });
    }
    expect(packKey("ospf-01")).toBe("netfault.practice.v1");
    for (const lab of labs) expect(loadPack(storage, lab.id)).toEqual(getScenario(lab.id));
    const journal = loadJournal(storage);
    expect(journal).toHaveLength(5);
    expect(journal.find((x) => x.scenario === s.id)?.diagnosis).toEqual(correct);
  });
});
