import { afterEach, describe, expect, it, vi } from "vitest";
import { passiveScenario as s } from "../src/server/passive-scenario";
import { scenario as areaScenario } from "../src/server/scenario";
import { getScenario } from "../src/server/scenarios";
import { commandsFor, labs, passiveLab } from "../src/lib/catalog";
import { connectivity, device, execute, neighbors, repaired, routes, commandSequence } from "../src/lib/engine";
import { grade, nextHint } from "../src/lib/grading";
import { scenarioSchema, type Diagnosis, type Observation } from "../src/lib/schema";
import { startAssessment, assessmentAction, ASSESSMENT_MS } from "../src/server/sessions";
import { POST } from "../src/app/api/lab/route";
import { loadJournal, loadPack, savePack, saveAttempt, packKey } from "../src/lib/storage";

const observe = (id: string, command: string, target = ""): Observation => ({
  id: `${id}:${command}`,
  scenario: s.id,
  device: id,
  command,
  target,
  output: execute(s, id, command, target),
  at: 1,
});
const evidence = [
  observe("R2", "show ip ospf interface"),
  observe("R2", "show ip ospf neighbor"),
  observe("R3", "show ip route"),
];
const correct: Diagnosis = {
  cause: "passive-interface",
  devices: ["R2"],
  interface: "Gi0/1",
  fix: "no-passive",
  reason: "hello-adjacency",
  evidence: evidence.map((o) => o.id),
  notes: "",
};
const transit = (state = s) => device(state, "R2").interfaces[1];
const block = (state = s) => execute(state, "R2", "show ip ospf interface").split("\n\n")[1];
afterEach(() => vi.useRealTimers());

describe("passive scenario and isolated repair", () => {
  it("loads five versions with the exact addressing and sole transit passive fault", () => {
    expect(labs.slice(0, 5).map((l) => scenarioSchema.parse(getScenario(l.id)).schemaVersion)).toEqual([1, 2, 3, 4, 5]);
    expect(s.devices.flatMap((d) => d.interfaces.map((i) => `${i.ip}/${i.prefix}`))).toEqual([
      "192.168.10.10/24",
      "192.168.10.1/24",
      "10.0.12.1/30",
      "10.0.12.2/30",
      "10.0.23.1/30",
      "10.0.23.2/30",
      "192.168.30.1/24",
      "192.168.30.10/24",
    ]);
    expect(device(s, "PC-A").gateway).toBe("192.168.10.1");
    expect(device(s, "PC-B").gateway).toBe("192.168.30.1");
    expect(s.devices.filter((d) => d.kind === "router").map((d) => d.routerId)).toEqual([
      "1.1.1.1",
      "2.2.2.2",
      "3.3.3.3",
    ]);
    expect(s.devices.every((d) => !d.staticRoutes?.length && d.interfaces.every((i) => i.up))).toBe(true);
    const ints = s.devices.flatMap((d) => d.interfaces);
    for (const i of ints.filter((i) => i.ospf))
      expect(i.ospf).toMatchObject({ area: 0, hello: 10, dead: 40, mtu: 1500, authentication: "none", cost: 1 });
    expect(ints.filter((i) => i.prefix === 30).every((i) => i.ospf?.networkType === "point-to-point")).toBe(true);
    expect(ints.filter((i) => i.prefix === 30 && i.ospf?.passive).map((i) => i.ip)).toEqual(["10.0.23.1"]);
    expect(passiveLab.incident).not.toMatch(/passive|Gi0\/1|R2/);
  });
  it("rejects invalid addressing, interface references and unsupported authentication", () => {
    const badIp = structuredClone(s);
    transit(badIp).ip = "10.0.23.0";
    expect(scenarioSchema.safeParse(badIp).success).toBe(false);
    const badLink = structuredClone(s);
    badLink.links[2].a.interface = "Gi99/0";
    expect(scenarioSchema.safeParse(badLink).success).toBe(false);
    const badAuth = JSON.parse(JSON.stringify(s));
    badAuth.devices[2].interfaces[1].ospf.authentication = "md5";
    expect(scenarioSchema.safeParse(badAuth).success).toBe(false);
  });
  it.each([
    { device: "R2", interface: "Gi9/9", passive: false, reason: "hello-adjacency" },
    { device: "PC-A", interface: "Ethernet0", passive: false, reason: "hello-adjacency" },
    { device: "R1", interface: "Gi0/0", passive: false, reason: "hello-adjacency" },
    { device: "R2", interface: "Gi0/1", passive: true, reason: "hello-adjacency" },
  ])("rejects unsupported passive repair %j", (repair) => {
    expect(scenarioSchema.safeParse({ ...s, repair }).success).toBe(false);
  });
  it("requires schema v5 for passive repairs while preserving omitted legacy auth", () => {
    expect(scenarioSchema.safeParse({ ...s, schemaVersion: 4 }).success).toBe(false);
    expect(scenarioSchema.parse(areaScenario)).toEqual(areaScenario);
    expect(device(areaScenario, "R2").interfaces[1].ospf).not.toHaveProperty("authentication");
  });
  it("changes only one boolean, preserving areas, network types, timers and passive LANs", () => {
    const fixed = repaired(s);
    expect(scenarioSchema.safeParse(fixed).success).toBe(true);
    expect(transit(s).ospf?.passive).toBe(true);
    expect(transit(fixed).ospf?.passive).toBe(false);
    const restored = structuredClone(fixed);
    transit(restored).ospf!.passive = true;
    expect(restored).toEqual(s);
    expect(repaired(fixed)).toEqual(fixed);
    expect(device(fixed, "R1").interfaces[0].ospf?.passive).toBe(true);
    expect(device(fixed, "R3").interfaces[1].ospf?.passive).toBe(true);
  });
});
describe("shared OSPF adjacency and route derivation", () => {
  it("forms symmetric R1-R2 adjacency, with no R2-R3 FULL relationship", () => {
    expect(neighbors(s, "R1").map((n) => [n.device, n.state])).toEqual([["R2", "FULL/-"]]);
    expect(neighbors(s, "R2").map((n) => [n.device, n.interface])).toEqual([["R1", "Gi0/0"]]);
    expect(neighbors(s, "R3")).toEqual([]);
  });
  it("advertises the passive transit through R2's working adjacency, not PC-B's unreachable LAN", () => {
    expect(routes(s, "R1").filter((r) => r.kind === "O")).toEqual([
      { prefix: "10.0.23.0/30", kind: "O", via: "10.0.12.2", interface: "Gi0/1", cost: 2 },
    ]);
    expect(routes(s, "R2").filter((r) => r.kind === "O")).toEqual([
      { prefix: "192.168.10.0/24", kind: "O", via: "10.0.12.1", interface: "Gi0/0", cost: 2 },
    ]);
    expect(routes(s, "R3").map((r) => [r.kind, r.prefix])).toEqual([
      ["C", "10.0.23.0/30"],
      ["L", "10.0.23.2/32"],
      ["C", "192.168.30.0/24"],
      ["L", "192.168.30.1/32"],
    ]);
    expect(routes(s, "R2").some((r) => r.prefix === "192.168.30.0/24" || r.prefix === "0.0.0.0/0")).toBe(false);
  });
  it("uses actual OSPF enabled/up state for advertisement", () => {
    const off = structuredClone(s);
    delete transit(off).ospf;
    expect(routes(off, "R1").some((r) => r.prefix === "10.0.23.0/30")).toBe(false);
    expect(routes(off, "R2").some((r) => r.prefix === "10.0.23.0/30" && r.kind === "C")).toBe(true);
    const down = structuredClone(s);
    transit(down).up = false;
    expect(routes(down, "R1").some((r) => r.prefix === "10.0.23.0/30")).toBe(false);
  });
  it("restores symmetric neighbors and remote LAN routes at the expected costs", () => {
    const fixed = repaired(s);
    expect(neighbors(fixed, "R2").map((n) => n.device)).toEqual(["R1", "R3"]);
    expect(neighbors(fixed, "R3").map((n) => [n.device, n.state])).toEqual([["R2", "FULL/-"]]);
    expect(routes(fixed, "R1")).toContainEqual({
      prefix: "192.168.30.0/24",
      kind: "O",
      via: "10.0.12.2",
      interface: "Gi0/1",
      cost: 3,
    });
    expect(routes(fixed, "R3")).toContainEqual({
      prefix: "192.168.10.0/24",
      kind: "O",
      via: "10.0.23.1",
      interface: "Gi0/0",
      cost: 3,
    });
    for (const id of ["R1", "R2", "R3"])
      expect(routes(fixed, id).filter((r) => r.kind === "C" || r.kind === "L")).toEqual(
        routes(s, id).filter((r) => r.kind === "C" || r.kind === "L"),
      );
  });
  it("blocks adjacency when either side becomes passive, independent of scenario ID", () => {
    const moved = repaired(s);
    device(moved, "R3").interfaces[0].ospf!.passive = true;
    expect(neighbors(moved, "R3")).toEqual([]);
    expect(neighbors(moved, "R2").map((n) => n.device)).toEqual(["R1"]);
    const healthy = repaired(areaScenario);
    device(healthy, "R2").interfaces[1].ospf!.passive = true;
    expect(neighbors(healthy, "R3")).toEqual([]);
  });
  it.each(["area", "hello", "dead", "mtu", "enabled", "up", "type"])(
    "retains the existing %s adjacency guard after passive repair",
    (field) => {
      const modified = repaired(s);
      const i = device(modified, "R3").interfaces[0];
      if (field === "enabled") delete i.ospf;
      else if (field === "up") i.up = false;
      else if (field === "type") i.ospf!.networkType = "broadcast";
      else i.ospf![field as "area" | "hello" | "dead" | "mtu"] += 1;
      expect(neighbors(modified, "R3")).toEqual([]);
    },
  );
});
describe("consistent diagnostic observations", () => {
  it("supports all advertised commands for all five devices", () => {
    for (const d of s.devices) {
      expect(d.commands).toEqual(commandsFor(s.id, d.id));
      for (const cmd of d.commands)
        expect(execute(s, d.id, cmd, passiveLab.target)).not.toMatch(/Unsupported|undefined/);
    }
    expect(execute(s, "PC-B", "show ip ospf neighbor")).toContain("Unsupported");
  });
  it("exposes passive configuration without implying physical shutdown or area mismatch", () => {
    expect(execute(s, "R2", "show ip interface brief")).toMatch(/Gi0\/1\s+10.0.23.1\s+YES manual up\s+up/);
    expect(block()).toContain("Gi0/1 is up, line protocol is up");
    expect(block()).toContain("10.0.23.1/30, Area 0");
    expect(block()).toContain("Network Type POINT-TO-POINT");
    expect(block()).toContain("Hello 10, Dead 40");
    expect(block()).toContain("No Hellos (Passive interface)");
    expect(block()).toContain("Adjacent neighbor count is 0");
    expect(block()).not.toMatch(/State (DR|DOWN|INIT|EXSTART)/);
    expect(execute(s, "R2", "show running-config")).toContain(
      "router ospf 1\n router-id 2.2.2.2\n passive-interface Gi0/1",
    );
    expect(execute(s, "R2", "show ip protocols")).toContain("Passive Interface(s):\n  Gi0/1");
    expect(execute(s, "R3", "show ip ospf neighbor")).not.toContain("FULL");
  });
  it("distinguishes LAB 001's area mismatch observations from passive Hello suppression", () => {
    expect(execute(areaScenario, "R2", "show running-config")).not.toContain("passive-interface Gi0/1");
    expect(execute(areaScenario, "R3", "show ip ospf interface")).toContain("10.0.23.2/30, Area 1");
    expect(execute(s, "R3", "show ip ospf interface")).toContain("10.0.23.2/30, Area 0");
    expect(execute(s, "R3", "show ip ospf interface").split("\n\n")[0]).toContain("Hellos enabled");
    expect(block(repaired(s))).toContain("Hellos enabled");
    expect(block(repaired(s))).not.toContain("No Hellos");
  });
  it("keeps connected data forwarding active and checks probe return paths", () => {
    expect(connectivity(s, "PC-A", "192.168.10.1").ok).toBe(true);
    expect(connectivity(s, "PC-B", "192.168.30.1").ok).toBe(true);
    expect(connectivity(s, "R2", "10.0.23.2")).toMatchObject({ ok: true, source: "10.0.23.1" });
    expect(connectivity(s, "R2", "10.0.23.2", "Gi0/0")).toMatchObject({
      ok: false,
      source: "10.0.12.2",
      outward: { ok: true },
      returning: { ok: false },
    });
    expect(execute(s, "R2", "ping", "10.0.23.2", [], "Gi0/0")).toContain("0 percent (0/5)");
    expect(connectivity(s, "PC-A", passiveLab.target)).toMatchObject({
      ok: false,
      outward: { ok: false, reason: "R1: no route to destination" },
    });
    expect(connectivity(s, "PC-B", "192.168.10.10").outward.reason).toBe("R3: no route to destination");
  });
  it("derives trace responses and the repaired preview from corrected state", () => {
    expect(execute(s, "PC-A", "tracert", passiveLab.target)).toContain("1  192.168.10.1");
    expect(execute(s, "PC-A", "tracert", passiveLab.target)).toContain("!H  Destination unreachable (R1: no route");
    // Request to R3's connected transit arrives, but R3 cannot return a response to PC-A.
    expect(execute(s, "PC-A", "tracert", "10.0.23.2")).toContain("3  * * *");
    const fixed = repaired(s);
    for (const from of fixed.devices)
      for (const to of fixed.devices.flatMap((d) => d.interfaces))
        expect(connectivity(fixed, from.id, to.ip).ok).toBe(true);
    const text = commandSequence(fixed, [
      ["R2", "show ip ospf interface"],
      ["R2", "show ip ospf neighbor"],
      ["PC-A", "tracert", passiveLab.target],
      ["PC-B", "ping", "192.168.10.10"],
    ]);
    expect(text).toContain("3.3.3.3");
    expect(text).toContain("FULL/-");
    expect(text).toContain("4  192.168.30.10");
    expect(text).toContain("100 percent");
  });
});
describe("evidence-based grading, hints and learning", () => {
  it("accepts equivalent inspection combinations in either order", () => {
    expect(grade(s, correct, [...evidence].reverse()).score).toBe(100);
    for (const cmd of ["show ip protocols", "show running-config"]) {
      const alt = [
        observe("R2", cmd),
        observe("R2", "show ip interface brief"),
        observe("R2", "show ip ospf neighbor"),
        observe("R2", "show ip route"),
      ];
      expect(grade(s, { ...correct, interface: " gi0/1 ", evidence: alt.map((o) => o.id) }, alt).score).toBe(100);
    }
  });
  it.each([
    [{ cause: "area-mismatch" }, 70],
    [{ devices: ["R3"] }, 80],
    [{ devices: ["R2", "R3"] }, 80],
    [{ interface: "Gi0/0" }, 80],
    [{ fix: "gateway" }, 90],
    [{ fix: "static-route" }, 90],
    [{ fix: "r2-area1" }, 90],
    [{ fix: "timers" }, 90],
    [{ fix: "no-shutdown" }, 90],
    [{ reason: "passive-stops-advertising" }, 90],
    [{ evidence: ["forged"] }, 70],
  ])("awards defined partial credit for %j", (patch, score) => {
    expect(grade(s, { ...correct, ...patch, notes: s.solution } as Diagnosis, evidence).score).toBe(score);
  });
  it("requires configuration evidence plus operational neighbor/route context", () => {
    const ping = observe("PC-A", "ping", passiveLab.target);
    for (const history of [[ping], [evidence[1]], [evidence[2]]])
      expect(grade(s, { ...correct, evidence: history.map((o) => o.id) }, history).parts[2].earned).toBe(0);
    expect(grade(s, correct, [evidence[0]]).parts[2].earned).toBe(20);
    expect(
      grade(
        s,
        correct,
        evidence.map((o) => ({ ...o, scenario: "ospf-01" })),
      ).parts[2].earned,
    ).toBe(0);
    expect(
      grade(
        s,
        correct,
        evidence.map((o) => ({ ...o, output: "% Unsupported command" })),
      ).parts[2].earned,
    ).toBe(0);
  });
  it("supplies four progressive hints and a gated seven-part lesson", () => {
    expect(s.hints).toHaveLength(4);
    expect(new Set(s.hints).size).toBe(4);
    expect(nextHint(s, 0)).not.toMatch(/passive|Gi0\/1|R2/);
    expect(nextHint(s, 3)).toContain("Hello transmission");
    expect(grade(s, correct, evidence).lesson).toHaveLength(7);
    expect(s.lesson?.[6].revealOnRequest).toBe(true);
    expect(s.lesson?.[5].text).toContain("router ospf 7");
  });
});
describe("assessment ownership and five-lab persistence", () => {
  it("resumes independent invocations with source context and immutable server grading", async () => {
    const attempt = await startAssessment(undefined, s.id);
    for (const key of ["fault", "repair", "feedback", "lesson", "evidenceRules"])
      expect(attempt).not.toHaveProperty(key);
    expect(attempt.hints).toEqual([]);
    await assessmentAction(attempt.id, "command", {
      device: "R2",
      command: "ping",
      target: "10.0.23.2",
      source: "Gi0/0",
    });
    vi.resetModules();
    const reloaded = await import("../src/server/sessions");
    let latest = await reloaded.assessmentAction(attempt.id, "resume");
    expect(latest.history[0]).toMatchObject({ source: "Gi0/0", scenario: s.id });
    expect(latest.history[0].output).toContain("0 percent (0/5)");
    for (const o of evidence)
      latest = await reloaded.assessmentAction(attempt.id, "command", {
        device: o.device,
        command: o.command,
        target: "",
      });
    const done = await reloaded.assessmentAction(attempt.id, "submit", {
      ...correct,
      evidence: latest.history.map((o) => o.id),
    });
    expect(done.feedback?.score).toBe(100);
    expect(await reloaded.assessmentAction(attempt.id, "submit", { ...correct, fix: "gateway" })).toEqual(done);
  });
  it("retains deadline enforcement", async () => {
    const a = await startAssessment(undefined, s.id);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(a.startedAt + ASSESSMENT_MS + 1);
    expect((await assessmentAction(a.id, "submit", correct)).feedback).toMatchObject({ score: 0, timedOut: true });
  });
  it("preserves API validation, no-store and scenario ownership", async () => {
    const post = (body: unknown) =>
      POST(
        new Request("https://example.test/api/lab", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
      );
    const response = await post({ action: "start", scenario: s.id });
    for (const key of ["Cache-Control", "CDN-Cache-Control", "Netlify-CDN-Cache-Control"])
      expect(response.headers.get(key)).toBe("no-store");
    const { attempt } = await response.json();
    const observed = await (
      await post({
        action: "command",
        id: attempt.id,
        scenario: "ospf-01",
        device: "R3",
        command: "show ip ospf interface",
        target: "",
      })
    ).json();
    expect(observed.attempt.scenario).toBe(s.id);
    expect(observed.attempt.history[0].output).toContain("10.0.23.2/30, Area 0");
    expect(
      (await post({ action: "submit", id: attempt.id, diagnosis: { ...correct, interface: "x".repeat(65) } })).status,
    ).toBe(400);
    expect(
      (await post({ action: "command", id: attempt.id, device: "SW1", command: "show vlan brief", target: "" })).status,
    ).toBe(400);
  });
  it("keeps earlier packs and attempt records byte-for-byte intact", async () => {
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
    for (const lab of labs.filter((l) => l.id !== s.id)) {
      savePack(storage, getScenario(lab.id));
      saveAttempt(storage, await startAssessment(undefined, lab.id));
    }
    const oldPacks = labs.filter((l) => l.id !== s.id).map((l) => [packKey(l.id), values.get(packKey(l.id))]);
    const oldJournal = loadJournal(storage);
    savePack(storage, s);
    const latest = await startAssessment(undefined, s.id);
    saveAttempt(storage, {
      ...latest,
      mode: "practice",
      diagnosis: correct,
      history: evidence,
      hints: [...s.hints],
      feedback: grade(s, correct, evidence),
      finishedAt: latest.startedAt + 1000,
    });
    expect(loadJournal(storage)).toHaveLength(labs.length);
    expect(loadJournal(storage).slice(1)).toEqual(oldJournal);
    for (const [key, value] of oldPacks) expect(values.get(key!)).toBe(value);
    for (const lab of labs) expect(loadPack(storage, lab.id)).toEqual(getScenario(lab.id));
    expect(loadJournal(storage)[0].diagnosis).toEqual(correct);
    expect(packKey("ospf-01")).toBe("netfault.practice.v1");
  });
});
