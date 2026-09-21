import { afterEach, describe, expect, it, vi } from "vitest";
import { vlanScenario as s } from "../src/server/vlan-scenario";
import { scenario as ospf } from "../src/server/scenario";
import { gatewayScenario as gateway } from "../src/server/gateway-scenario";
import {
  arpState,
  commandSequence,
  connectivity,
  device,
  execute,
  forward,
  neighbors,
  repaired,
  routes,
} from "../src/lib/engine";
import { scenarioSchema, type Diagnosis, type Observation } from "../src/lib/schema";
import { grade, nextHint } from "../src/lib/grading";
import { commandsFor, labs, vlanLab } from "../src/lib/catalog";
import { loadJournal, loadPack, saveAttempt, savePack, packKey } from "../src/lib/storage";
import { startAssessment, assessmentAction, ASSESSMENT_MS } from "../src/server/sessions";
import { POST } from "../src/app/api/lab/route";

const observe = (id: string, command: string, target = "", history: Observation[] = [], state = s): Observation => ({
  id: `${id}:${command}:${history.length}`,
  scenario: state.id,
  device: id,
  command,
  target,
  output: execute(state, id, command, target, history),
  at: 1,
});
const evidence = [observe("PC-A", "ipconfig"), observe("SW1", "show vlan brief")];
const correct: Diagnosis = {
  cause: "access-vlan",
  devices: ["SW1"],
  interface: "FastEthernet0/1",
  observedVlan: 20,
  intendedVlan: 10,
  fix: "access-vlan",
  evidence: evidence.map((o) => o.id),
  notes: "",
};
afterEach(() => vi.useRealTimers());

describe("VLAN scenario and sole repair", () => {
  it("validates all three versions and retains valid unique addressing", () => {
    expect([ospf, gateway, s].map((x) => scenarioSchema.parse(x).schemaVersion)).toEqual([1, 2, 3]);
    expect(labs.slice(0, 5).map((l) => l.id)).toEqual(["ospf-01", "gateway-01", "vlan-01", "return-01", "passive-01"]);
    expect(new Set(s.devices.map((d) => d.id)).size).toBe(5);
    expect(s.devices.flatMap((d) => d.interfaces.map((i) => `${i.ip}/${i.prefix}`))).toEqual([
      "192.168.10.10/24",
      "192.168.10.1/24",
      "10.0.12.1/30",
      "10.0.12.2/30",
      "192.168.20.1/24",
      "192.168.20.10/24",
    ]);
    expect(device(s, "PC-A").gateway).toBe("192.168.10.1");
    expect(device(s, "PC-B").gateway).toBe("192.168.20.1");
    expect(device(s, "SW1").ports?.map((p) => [p.name, p.vlan, p.up])).toEqual([
      ["FastEthernet0/1", 20, true],
      ["FastEthernet0/24", 10, true],
    ]);
    expect(device(s, "SW1").vlans?.map((v) => [v.id, v.active])).toEqual([
      [10, true],
      [20, true],
    ]);
    expect(s.devices.flatMap((d) => d.interfaces).every((i) => i.up)).toBe(true);
    expect(device(s, "SW1").interfaces).toEqual([]);
  });
  it("rejects missing VLANs, unknown links, invalid repairs and older version assignment", () => {
    const variants = [
      (x: typeof s) => {
        device(x, "SW1").vlans!.pop();
      },
      (x: typeof s) => {
        x.links[0].b.interface = "absent";
      },
      (x: typeof s) => {
        x.repair = { device: "SW1", interface: "absent", vlan: 10 };
      },
      (x: typeof s) => {
        x.repair = { device: "SW1", interface: "FastEthernet0/1", vlan: 99 };
      },
      (x: typeof s) => {
        x.schemaVersion = 2;
      },
      (x: typeof s) => {
        device(x, "PC-A").gateway = "192.168.10.254";
      },
    ];
    for (const change of variants) {
      const x = structuredClone(s);
      change(x);
      expect(scenarioSchema.safeParse(x).success).toBe(false);
    }
  });
  it("changes only one port membership and leaves all host/router configuration intact", () => {
    const fixed = repaired(s),
      expected = structuredClone(s);
    device(expected, "SW1").ports![0].vlan = 10;
    expect(fixed).toEqual(expected);
    expect(device(s, "SW1").ports![0].vlan).toBe(20);
    expect(scenarioSchema.safeParse(fixed).success).toBe(true);
  });
  it("does not reveal actual membership or faulty port in the incident", () => {
    expect(vlanLab.incident).not.toMatch(/VLAN|FastEthernet0\/1|switchport/);
    expect(vlanLab.design).toContain("should share VLAN 10");
    expect(vlanLab.design).not.toContain("VLAN 20");
  });
});

describe("broadcast domains, routing and ARP", () => {
  it("blocks local and remote PC-A traffic at next-hop resolution, not routing", () => {
    for (const ip of ["192.168.10.1", "192.168.20.10"]) {
      expect(forward(s, "PC-A", ip)).toEqual({ ok: false, hops: [], reason: "PC-A: next-hop resolution failed" });
      expect(connectivity(s, "PC-A", ip).ok).toBe(false);
    }
    expect(connectivity(s, "PC-A", "192.168.10.10").ok).toBe(true);
    expect(connectivity(s, "PC-B", "192.168.20.1").ok).toBe(true);
    expect(connectivity(s, "R1", "192.168.20.10").ok).toBe(true);
    expect(forward(s, "PC-B", "192.168.10.10").reason).toBe("R1: next-hop resolution failed");
  });
  it("retains correct healthy router routes before and after the access repair", () => {
    expect(neighbors(s, "R1")[0].device).toBe("R2");
    expect(neighbors(s, "R2")[0].device).toBe("R1");
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
    for (const id of ["R1", "R2"]) expect(routes(repaired(s), id)).toEqual(routes(s, id));
  });
  it("uses membership rather than a lab-wide failure flag", () => {
    const sameOtherVlan = structuredClone(s);
    device(sameOtherVlan, "SW1").ports![1].vlan = 20;
    expect(connectivity(sameOtherVlan, "PC-A", "192.168.20.10").ok).toBe(true);
    // Connectivity alone does not establish compliance with the intended VLAN 10 design.
    expect(grade(s, { ...correct, interface: "FastEthernet0/24", intendedVlan: 20 }, evidence).score).toBeLessThan(100);
    device(sameOtherVlan, "SW1").vlans![1].active = false;
    expect(connectivity(sameOtherVlan, "PC-A", "192.168.10.1").ok).toBe(false);
  });
  it("does not globally break unrelated hosts that share the original VLAN", () => {
    const x = structuredClone(s);
    device(x, "SW1").ports!.push({ name: "FastEthernet0/2", vlan: 20, up: true, speed: 100, duplex: "full" });
    const neighbor = structuredClone(device(x, "PC-A"));
    neighbor.id = "PC-C";
    neighbor.interfaces[0].ip = "192.168.10.11";
    neighbor.interfaces[0].mac = "02:00:00:00:00:07";
    x.devices.push(neighbor);
    x.links.push({
      id: "test-only",
      a: { device: "PC-C", interface: "Ethernet0" },
      b: { device: "SW1", interface: "FastEthernet0/2" },
      subnet: "192.168.10.0/24",
    });
    expect(scenarioSchema.safeParse(x).success).toBe(true);
    expect(connectivity(x, "PC-A", "192.168.10.11").ok).toBe(true);
    expect(connectivity(x, "PC-A", "192.168.10.1").ok).toBe(false);
  });
  it("starts with an empty cache; a failed gateway probe cannot invent a MAC", () => {
    expect(arpState(s, "PC-A", [])).toEqual({ entries: [], last: undefined });
    const history = [observe("PC-A", "ping", "192.168.10.1")];
    expect(arpState(s, "PC-A", history)).toEqual({ entries: [], last: { ip: "192.168.10.1", resolved: false } });
    const text = execute(s, "PC-A", "arp -a", "", history);
    expect(text).toContain("No ARP Entries Found.");
    expect(text).toContain("failed; no resolved MAC entry");
    expect(text).not.toContain("02-00-00-00-00-02");
  });
  it("learns real next-hop MACs from repaired probes and retains them on replay", () => {
    const fixed = repaired(s),
      history = [observe("PC-A", "ping", "192.168.20.10", [], fixed)];
    expect(arpState(fixed, "PC-A", history).entries).toEqual([
      { ip: "192.168.10.1", mac: device(fixed, "R1").interfaces[0].mac, interface: "Ethernet0" },
    ]);
    const before = execute(fixed, "PC-A", "arp -a", "", history);
    expect(before).toMatch(/192\.168\.10\.1\s+02-00-00-00-00-02\s+dynamic/);
    history.push(observe("PC-A", "arp -a", "", history, fixed));
    expect(execute(fixed, "PC-A", "arp -a", "", history)).toBe(before);
    expect(arpState(fixed, "PC-A", []).entries).toEqual([]);
  });
  it("does not learn from read-only commands, invalid probes, other scenarios or unsupported switch probes", () => {
    const fixed = repaired(s);
    const history = [
      observe("PC-A", "ipconfig"),
      observe("PC-A", "ping", "invalid"),
      { ...observe("PC-A", "ping", "192.168.10.1"), scenario: "gateway-01" as const },
      observe("SW1", "ping", "192.168.10.1"),
    ];
    expect(arpState(fixed, "PC-A", history)).toEqual({ entries: [], last: undefined });
  });
  it("learns a sender when a real ARP exchange reaches the PC, but not across the VLAN boundary", () => {
    const history = [observe("R1", "ping", "192.168.10.10")];
    expect(arpState(s, "PC-A", history).entries).toEqual([]);
    expect(arpState(repaired(s), "PC-A", history).entries[0].ip).toBe("192.168.10.1");
  });
  it("restores all modeled host/router paths without adding a switch IP hop", () => {
    const fixed = repaired(s);
    for (const d of fixed.devices.filter((d) => d.kind !== "switch"))
      for (const i of fixed.devices.flatMap((d) => d.interfaces))
        expect(connectivity(fixed, d.id, i.ip).ok, `${d.id} → ${i.ip}`).toBe(true);
    expect(forward(fixed, "PC-A", "192.168.20.10").hops).toEqual(["192.168.10.1", "10.0.12.2", "192.168.20.10"]);
  });
});

describe("command accuracy and grading", () => {
  it("implements every advertised command and honestly rejects MAC-table emulation", () => {
    for (const d of s.devices) {
      expect(d.commands).toEqual(commandsFor(s.id, d.id));
      for (const c of d.commands) expect(execute(s, d.id, c, "192.168.20.10")).not.toContain("Unsupported");
    }
    expect(execute(s, "SW1", "show mac address-table")).toContain("Unsupported");
    expect(execute(s, "SW1", "show interfaces FastEthernet0/99 switchport")).toContain("Unsupported");
  });
  it("reports correct IP settings, connected ports and actual VLAN assignment", () => {
    expect(execute(s, "PC-A", "ipconfig /all")).toContain("192.168.10.1");
    expect(execute(s, "PC-A", "ipconfig")).toContain("Connected");
    expect(execute(s, "SW1", "show interfaces status")).toMatch(/FastEthernet0\/1\s+connected\s+20/);
    expect(execute(s, "SW1", "show interfaces status")).toMatch(/FastEthernet0\/24\s+connected\s+10/);
    expect(execute(s, "SW1", "show vlan brief")).toMatch(/20\s+OTHER_LAN\s+active\s+FastEthernet0\/1/);
    expect(execute(s, "SW1", "show interfaces FastEthernet0/1 switchport")).toContain(
      "Access Mode VLAN: 20 (OTHER_LAN)",
    );
    expect(execute(s, "SW1", "show interfaces FastEthernet0/24 switchport")).toContain(
      "Access Mode VLAN: 10 (STUDENT_LAN)",
    );
    const config = execute(s, "SW1", "show running-config");
    expect(config).toContain(
      "interface FastEthernet0/1\n switchport mode access\n switchport access vlan 20\n no shutdown",
    );
    expect(config).not.toContain("router ospf");
    expect(config).not.toContain("ip address");
  });
  it("distinguishes administrative shutdown and operational disconnection from VLAN membership", () => {
    const down = structuredClone(s);
    device(down, "SW1").ports![0].up = false;
    expect(execute(down, "SW1", "show interfaces status")).toMatch(/FastEthernet0\/1\s+disabled\s+20/);
    expect(execute(down, "SW1", "show running-config")).toContain(" switchport access vlan 20\n shutdown");
    device(down, "SW1").ports![0].up = true;
    device(down, "PC-A").interfaces[0].up = false;
    expect(execute(down, "SW1", "show interfaces status")).toMatch(/FastEthernet0\/1\s+notconnect\s+20/);
    expect(execute(down, "SW1", "show interfaces FastEthernet0/1 switchport")).toContain("Operational Mode: down");
  });
  it("derives the repaired preview from a fresh state and actual probe sequence", () => {
    const text = commandSequence(repaired(s), [
      ["SW1", "show vlan brief"],
      ["PC-A", "arp -a"],
      ["PC-A", "ping", "192.168.10.1"],
      ["PC-A", "arp -a"],
    ]);
    expect(text).toMatch(/10\s+STUDENT_LAN\s+active\s+FastEthernet0\/1, FastEthernet0\/24/);
    expect(text.indexOf("No ARP Entries Found.")).toBeLessThan(text.indexOf("100 percent"));
    expect(text.indexOf("02-00-00-00-00-02")).toBeGreaterThan(text.indexOf("100 percent"));
  });
  it("accepts a sufficient combination without prescribing command order", () => {
    expect(grade(s, correct, evidence).score).toBe(100);
    const alternate = [
      observe("SW1", "show interfaces fastethernet0/24 switchport"),
      observe("PC-A", "ipconfig /all"),
      observe("SW1", "show interfaces fastethernet0/1 switchport"),
    ];
    expect(grade(s, { ...correct, evidence: alternate.map((o) => o.id) }, alternate).score).toBe(100);
    expect(grade(s, correct, evidence).lesson).toHaveLength(7);
    expect(grade(s, correct, evidence).lesson?.[6].revealOnRequest).toBe(true);
    expect(nextHint(s, 0)).not.toContain("VLAN 20");
  });
  it.each([
    [{ cause: "wrong-gateway" }, 80],
    [{ devices: ["PC-A"] }, 70],
    [{ interface: "FastEthernet0/24" }, 70],
    [{ observedVlan: 10 }, 90],
    [{ intendedVlan: 20 }, 80],
    [{ fix: "gateway" }, 80],
    [{ evidence: ["forged"] }, 70],
  ])("awards meaningful partial credit for %j", (patch, score) => {
    expect(grade(s, { ...correct, ...patch, notes: s.explanation } as Diagnosis, evidence).score).toBe(score);
  });
  it("never treats one failed ping or another scenario as conclusive evidence", () => {
    const ping = observe("PC-A", "ping", "192.168.10.1");
    expect(grade(s, { ...correct, evidence: [ping.id] }, [ping]).parts[2].earned).toBe(0);
    expect(
      grade(
        s,
        correct,
        evidence.map((o) => ({ ...o, scenario: "gateway-01" })),
      ).parts[2].earned,
    ).toBe(0);
  });
});

describe("server ownership and persistence", () => {
  it("keeps answers private and replays ARP after independent module reload", async () => {
    const a = await startAssessment(undefined, "vlan-01");
    expect(a).not.toHaveProperty("repair");
    expect(a).not.toHaveProperty("feedback");
    expect(a.hints).toEqual([]);
    await assessmentAction(a.id, "command", { device: "PC-A", command: "ping", target: "192.168.10.1" });
    vi.resetModules();
    const reloaded = await import("../src/server/sessions");
    const arp = await reloaded.assessmentAction(a.id, "command", { device: "PC-A", command: "arp -a", target: "" });
    expect(arp.history.at(-1)?.output).toContain("failed; no resolved MAC entry");
    expect(arp.history.every((o) => o.scenario === "vlan-01")).toBe(true);
    await reloaded.assessmentAction(a.id, "command", { device: "PC-A", command: "ipconfig", target: "" });
    const observed = await reloaded.assessmentAction(a.id, "command", {
      device: "SW1",
      command: "show vlan brief",
      target: "",
    });
    const done = await reloaded.assessmentAction(a.id, "submit", {
      ...correct,
      evidence: observed.history.map((o) => o.id),
    });
    expect(done.feedback?.score).toBe(100);
    expect(await reloaded.assessmentAction(a.id, "submit", { ...correct, intendedVlan: 20 })).toEqual(done);
  });
  it("expires using the server clock and rejects cross-lab devices", async () => {
    const a = await startAssessment(undefined, "vlan-01");
    await expect(
      assessmentAction(a.id, "command", { device: "R3", command: "show ip route", target: "" }),
    ).rejects.toThrow("not part of this lab");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(a.startedAt + ASSESSMENT_MS + 1);
    const done = await assessmentAction(a.id, "submit", correct);
    expect(done.feedback?.score).toBe(0);
    expect(done.feedback?.timedOut).toBe(true);
    expect(done.feedback?.lesson).toHaveLength(7);
  });
  it("validates API inputs and ignores later attempts to switch scenarios", async () => {
    const post = (body: unknown) =>
      POST(
        new Request("https://example.test/api/lab", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
      );
    const response = await post({ action: "start", scenario: "vlan-01" });
    expect(response.headers.get("Netlify-CDN-Cache-Control")).toBe("no-store");
    const { attempt } = await response.json();
    const observed = await (
      await post({
        action: "command",
        id: attempt.id,
        scenario: "gateway-01",
        device: "PC-A",
        command: "ipconfig",
        target: "",
      })
    ).json();
    expect(observed.attempt.scenario).toBe("vlan-01");
    expect(observed.attempt.history[0].output).not.toContain("192.168.10.254");
    expect(
      (await post({ action: "submit", id: attempt.id, diagnosis: { ...correct, intendedVlan: 4095 } })).status,
    ).toBe(400);
  });
  it("keeps all three packs and old journals intact, including new diagnosis fields", async () => {
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
    for (const state of [ospf, gateway, s]) {
      savePack(storage, state);
      const a = await startAssessment(undefined, state.id);
      saveAttempt(storage, state.id === "vlan-01" ? { ...a, diagnosis: correct } : a);
    }
    for (const state of [ospf, gateway, s]) expect(loadPack(storage, state.id)).toEqual(state);
    expect(loadJournal(storage).map((a) => a.scenario)).toEqual(["vlan-01", "gateway-01", "ospf-01"]);
    expect(loadJournal(storage)[0].diagnosis).toEqual(correct);
    const old = values.get(packKey("gateway-01"));
    values.set(packKey("vlan-01"), "corrupt");
    expect(() => loadPack(storage, "vlan-01")).toThrow();
    expect(values.get(packKey("gateway-01"))).toBe(old);
    expect(values.get(packKey("vlan-01"))).toBe("corrupt");
  });
});
