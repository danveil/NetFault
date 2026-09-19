import { describe, expect, it } from "vitest";
import { scenario } from "../src/server/scenario";
import { connectivity, device, execute, neighbors, repaired, routes } from "../src/lib/engine";
import { ipv4, network, scenarioSchema, type Diagnosis, type Observation } from "../src/lib/schema";
import { grade, nextHint } from "../src/lib/grading";

describe("versioned scenario and addressing", () => {
  it("accepts the one authored scenario", () => expect(scenarioSchema.safeParse(scenario).success).toBe(true));
  it("contains exactly five devices and four prescribed subnets", () => {
    expect(scenario.devices.map((d) => d.id)).toEqual(["PC-A", "R1", "R2", "R3", "PC-B"]);
    expect(scenario.links.map((l) => l.subnet)).toEqual([
      "192.168.10.0/24",
      "10.0.12.0/30",
      "10.0.23.0/30",
      "192.168.30.0/24",
    ]);
  });
  it.each(["999.0.0.1", "01.2.3.4", "host.test", "10.0.0", "-1.0.0.0"])("rejects invalid IPv4 %s", (ip) =>
    expect(ipv4.safeParse(ip).success).toBe(false),
  );
  it("rejects duplicate addresses", () => {
    const s = structuredClone(scenario);
    s.devices[1].interfaces[0].ip = s.devices[0].interfaces[0].ip;
    expect(scenarioSchema.safeParse(s).success).toBe(false);
  });
  it.each(["10.0.12.0", "10.0.12.3"])("rejects transit network or broadcast %s", (ip) => {
    const s = structuredClone(scenario);
    s.devices[1].interfaces[1].ip = ip;
    expect(scenarioSchema.safeParse(s).success).toBe(false);
  });
  it("rejects missing endpoints, duplicate IDs and off-link gateways", () => {
    for (const mutate of [
      (s: typeof scenario) => {
        s.links[0].a.device = "missing";
      },
      (s: typeof scenario) => {
        s.devices[1].id = "PC-A";
      },
      (s: typeof scenario) => {
        s.devices[0].gateway = "10.0.12.1";
      },
    ]) {
      const s = structuredClone(scenario);
      mutate(s);
      expect(scenarioSchema.safeParse(s).success).toBe(false);
    }
  });
  it("rejects duplicate router IDs", () => {
    const s = structuredClone(scenario);
    s.devices[2].routerId = "1.1.1.1";
    expect(scenarioSchema.safeParse(s).success).toBe(false);
  });
  it("computes the valid /30 and /24 network boundaries", () => {
    expect(network("10.0.23.2", 30)).toBe("10.0.23.0/30");
    expect(network("192.168.30.10", 24)).toBe("192.168.30.0/24");
  });
  it("all interfaces are up; LANs passive; transit MTU and timers match", () => {
    expect(scenario.devices.flatMap((d) => d.interfaces).every((i) => i.up)).toBe(true);
    for (const id of ["R1", "R3"])
      expect(device(scenario, id).interfaces.find((i) => i.ip.startsWith("192.168."))?.ospf?.passive).toBe(true);
    const a = device(scenario, "R2").interfaces[1].ospf!,
      b = device(scenario, "R3").interfaces[0].ospf!;
    expect({ ...a, area: 0 }).toEqual({ ...b, area: 0 });
  });
});
describe("OSPF and route derivation", () => {
  it("healthy R1-R2 adjacency is bidirectional FULL/-", () => {
    expect(neighbors(scenario, "R1")).toEqual([
      {
        device: "R2",
        routerId: "2.2.2.2",
        address: "10.0.12.2",
        interface: "Gi0/1",
        area: 0,
        state: "FULL/-",
        cost: 1,
      },
    ]);
    expect(neighbors(scenario, "R2").map((n) => n.device)).toEqual(["R1"]);
    expect(neighbors(scenario, "R3")).toEqual([]);
  });
  it("never elects a transit DR/BDR on explicit point-to-point links", () => {
    for (const id of ["R1", "R2", "R3"]) {
      const result = execute(scenario, id, "show ip ospf neighbor");
      expect(result).not.toContain("FULL/DR");
      expect(result).not.toContain("FULL/BDR");
    }
  });
  it("R1 learns transit but not remote LAN; R2 learns west LAN; R3 only connected/local", () => {
    expect(routes(scenario, "R1").filter((r) => r.kind === "O")).toEqual([
      { prefix: "10.0.23.0/30", kind: "O", via: "10.0.12.2", interface: "Gi0/1", cost: 2 },
    ]);
    expect(
      routes(scenario, "R2")
        .filter((r) => r.kind === "O")
        .map((r) => r.prefix),
    ).toEqual(["192.168.10.0/24"]);
    expect(routes(scenario, "R3").every((r) => r.kind !== "O")).toBe(true);
  });
  it("drops adjacency and learned routes if the link is down", () => {
    const s = structuredClone(scenario);
    device(s, "R1").interfaces[1].up = false;
    expect(neighbors(s, "R1")).toEqual([]);
    expect(neighbors(s, "R2")).toEqual([]);
    expect(routes(s, "R1").filter((r) => r.kind === "O")).toEqual([]);
  });
  it("repair yields correct symmetric neighbors and metric-three remote LAN routes", () => {
    const s = repaired(scenario);
    expect(neighbors(s, "R2").map((n) => n.device)).toEqual(["R1", "R3"]);
    expect(neighbors(s, "R3")[0].device).toBe("R2");
    expect(routes(s, "R1").find((r) => r.prefix === "192.168.30.0/24")).toMatchObject({
      kind: "O",
      cost: 3,
      via: "10.0.12.2",
    });
    expect(routes(s, "R3").find((r) => r.prefix === "192.168.10.0/24")).toMatchObject({
      kind: "O",
      cost: 3,
      via: "10.0.23.1",
    });
    expect(device(scenario, "R3").interfaces[0].ospf!.area).toBe(1);
  });
});
describe("forward and return connectivity", () => {
  it.each([
    ["PC-A", "192.168.10.1", true],
    ["PC-B", "192.168.30.1", true],
    ["PC-A", "192.168.30.10", false],
    ["PC-B", "192.168.10.10", false],
    ["R2", "10.0.23.2", true],
    ["R1", "10.0.23.1", true],
    ["R1", "10.0.23.2", false],
    ["PC-A", "10.0.23.2", false],
    ["PC-A", "192.168.10.222", false],
  ])("%s to %s = %s", (id, target, expected) => expect(connectivity(scenario, id, target).ok).toBe(expected));
  it("models asymmetric reachability: R1 packet arrives at R3 but cannot return", () => {
    const c = connectivity(scenario, "R1", "10.0.23.2");
    expect(c.source).toBe("10.0.12.1");
    expect(c.outward.ok).toBe(true);
    expect(c.returning?.ok).toBe(false);
  });
  it("after repair every assigned IP is reachable from every device", () => {
    const s = repaired(scenario);
    for (const d of s.devices)
      for (const i of s.devices.flatMap((d) => d.interfaces))
        expect(connectivity(s, d.id, i.ip).ok, `${d.id} to ${i.ip}`).toBe(true);
  });
});
describe("honest deterministic commands", () => {
  it("all declared commands have stable implemented outputs", () => {
    for (const d of scenario.devices)
      for (const c of d.commands) {
        const out = execute(scenario, d.id, c, "192.168.30.10");
        expect(out).not.toContain("Unsupported");
        expect(out).toBe(execute(scenario, d.id, c, "192.168.30.10"));
        expect(out.length).toBeGreaterThan(20);
      }
  });
  it("rejects unsupported commands and invalid destinations", () => {
    expect(execute(scenario, "R1", "show vlan brief")).toContain("Unsupported");
    expect(execute(scenario, "PC-A", "show ip route")).toContain("Unsupported");
    expect(execute(scenario, "R1", "ping", "google.com")).toContain("dotted IPv4");
  });
  it("configuration and OSPF interface observations expose the same area", () => {
    expect(execute(scenario, "R2", "show ip ospf interface")).toContain("10.0.23.1/30, Area 0");
    expect(execute(scenario, "R3", "show ip ospf interface")).toContain("10.0.23.2/30, Area 1");
    expect(execute(scenario, "R3", "show running-config")).toContain("ip ospf 1 area 1");
    expect(execute(scenario, "R3", "show ip protocols")).toContain("Gi0/0 (1)");
  });
  it("PC configuration derives address, gateway and mask", () => {
    const out = execute(scenario, "PC-A", "ipconfig /all");
    for (const v of ["192.168.10.10", "255.255.255.0", "192.168.10.1", "No"]) expect(out).toContain(v);
  });
  it("failed trace reports the gateway then no route; repaired trace reaches host", () => {
    expect(execute(scenario, "PC-A", "tracert", "192.168.30.10")).toContain("1  192.168.10.1\n2  !H");
    expect(execute(repaired(scenario), "PC-A", "tracert", "192.168.30.10")).toContain(
      "4  192.168.30.10\nTrace complete.",
    );
  });
});
const evidence: Observation[] = [
  ["R2", "show ip ospf interface"],
  ["R3", "show running-config"],
  ["R2", "show ip ospf neighbor"],
  ["R1", "show ip route"],
].map(([device, command], i) => ({
  id: String(i),
  device,
  command,
  target: "",
  output: execute(scenario, device, command),
  at: i,
}));
const answer: Diagnosis = {
  cause: "area-mismatch",
  devices: ["R2", "R3"],
  fix: "r3-area0",
  evidence: evidence.map((e) => e.id),
  notes: "",
};
describe("structured grading and progressive hints", () => {
  it("gives 100 only for correct cause, endpoints, evidence and repair", () =>
    expect(grade(scenario, answer, evidence).score).toBe(100));
  it("without evidence gives 70, never awards fabricated IDs", () => {
    expect(grade(scenario, { ...answer, evidence: [] }, evidence).score).toBe(70);
    expect(grade(scenario, { ...answer, evidence: ["fake"] }, evidence).score).toBe(70);
  });
  it("rejects extra affected devices and the tempting area-1 repair", () =>
    expect(grade(scenario, { ...answer, devices: ["R1", "R2", "R3"], fix: "r2-area1" }, evidence).score).toBe(60));
  it("does not grade keyword stuffing in free text", () =>
    expect(grade(scenario, { ...answer, cause: "wrong-gateway", notes: scenario.explanation }, evidence).score).toBe(
      70,
    ));
  it("duplicate evidence never increases credit", () =>
    expect(grade(scenario, { ...answer, evidence: ["0", "0", "0"] }, evidence).score).toBe(80));
  it("hints progress from symptom to location and do not run out of bounds", () => {
    expect(nextHint(scenario, 0)).toContain("PC-A");
    expect(nextHint(scenario, 1)).toContain("neighbors");
    expect(nextHint(scenario, 2)).toContain("R2 and R3");
    expect(nextHint(scenario, 99)).toBe(scenario.hints[2]);
  });
});
