import { afterEach, describe, expect, it, vi } from "vitest";
import type { Store } from "@netlify/blobs";
import { transferNetwork, correction, diagnosis } from "./fixtures/transfer-network";
import * as registry from "../src/server/scenarios";
import * as storage from "../src/server/session-store";
import { POST } from "../src/app/api/lab/route";
import { ASSESSMENT_MS } from "../src/server/sessions";
import { execute } from "../src/lib/engine";
import { trialNetwork } from "../src/lib/repair-trial";
import { publicScenario } from "../src/lib/neutral-scenario";
import type { Attempt, Scenario } from "../src/lib/schema";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});
function setup(s: Scenario) {
  const get = registry.getScenario;
  vi.spyOn(registry, "getScenario").mockImplementation((id) => (id === s.id ? s : get(id)));
  // Independent invocation clients share only the durable CAS service contract.
  const records = new Map<string, { data: Attempt; etag: string }>();
  let version = 0;
  const api = {
    async getWithMetadata(key: string) {
      const r = records.get(key);
      return r ? { ...structuredClone(r), metadata: {} } : null;
    },
    async setJSON(key: string, value: Attempt, options: { onlyIfNew?: boolean; onlyIfMatch?: string }) {
      const old = records.get(key);
      if ((options.onlyIfNew && old) || (options.onlyIfMatch && options.onlyIfMatch !== old?.etag))
        return { modified: false };
      const etag = String(++version);
      records.set(key, { data: structuredClone(value), etag });
      return { modified: true, etag };
    },
  };
  vi.spyOn(storage, "sessionStore").mockImplementation(() => new storage.BlobSessionStore(api as unknown as Store));
  return records;
}
async function request(body: Record<string, unknown>, status: number | number[] = 200) {
  const res = await POST(
    new Request("http://localhost:3100/api/lab", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  expect(Array.isArray(status) ? status : [status]).toContain(res.status);
  for (const h of ["Cache-Control", "CDN-Cache-Control", "Netlify-CDN-Cache-Control"])
    expect(res.headers.get(h)).toBe("no-store");
  return res.json();
}
async function collect(s: Scenario, a: Attempt, phase: "original" | "current") {
  for (const c of s.foundation!.verification[phase])
    a = (
      await request({
        action: "command",
        id: a.id,
        device: c.device,
        command: c.commands[0],
        target: c.target ?? "",
        source: c.source,
      })
    ).attempt;
  if (phase === "current")
    for (const f of s.foundation!.verification.flows)
      a = (
        await request({
          action: "command",
          id: a.id,
          device: f.device,
          command: "ping",
          target: f.target,
          source: f.source,
        })
      ).attempt;
  return a;
}

describe.each(["vlan", "acl"] as const)("server-owned neutral %s fixture", (family) => {
  it("plays from neutral start to private grading across independent durable invocations", async () => {
    const s = transferNetwork(family);
    setup(s);
    const start = await request({ action: "start", scenario: s.id });
    expect(start.public).toEqual(publicScenario(s));
    expect(Object.keys(start).sort()).toEqual(["attempt", "public"]);
    expect(JSON.stringify(start)).not.toMatch(
      /TEST_PRIVATE|faultFamily|acceptedFixes|verification|repairType|answerCategory/,
    );
    let a: Attempt = start.attempt;
    expect(a.expiresAt! - a.startedAt).toBe(ASSESSMENT_MS);
    a = await collect(s, a, "original");
    a = (await request({ action: "repair", id: a.id, change: correction(family) })).attempt;
    expect(a.repairs).toHaveLength(1);
    expect(JSON.stringify(a)).not.toMatch(/TEST_PRIVATE|verification|acceptedFixes/);
    a = (await request({ action: "resume", id: a.id })).attempt;
    a = await collect(s, a, "current");
    expect(a.history.at(-1)?.repairIndex).toBe(1);
    const final: Attempt = (await request({ action: "submit", id: a.id, diagnosis: diagnosis(s, a) })).attempt;
    expect(final.feedback).toMatchObject({ score: 100, recovery: "verified", timedOut: false });
    expect(final.feedback!.solution).toContain("TEST_PRIVATE_SOLUTION");
    expect((await request({ action: "resume", id: a.id })).attempt).toEqual(final);
    expect((await request({ action: "repair", id: a.id, change: correction(family) })).attempt).toEqual(final);
  });
  it("cannot award recovery using injected client history, trial state or feedback", async () => {
    const s = transferNetwork(family);
    setup(s);
    const a: Attempt = (await request({ action: "start", scenario: s.id })).attempt;
    const response = await request({
      action: "submit",
      id: a.id,
      diagnosis: diagnosis(s, a),
      repairs: [correction(family)],
      history: [{ output: "success" }],
      feedback: { score: 100 },
    });
    expect(response.attempt.feedback).toMatchObject({ recovery: "unresolved", score: 30 });
    expect(response.attempt.repairs).toBeUndefined();
    expect(response.attempt.history).toEqual([]);
  });
  it("rejects a foreign device and unsupported command without appending evidence", async () => {
    const s = transferNetwork(family);
    setup(s);
    const a: Attempt = (await request({ action: "start", scenario: s.id })).attempt;
    await request({ action: "command", id: a.id, device: "R3", command: "show ip route", target: "" }, 400);
    await request({ action: "command", id: a.id, device: "Desk", command: "show ip route", target: "" }, 400);
    await request(
      { action: "repair", id: a.id, change: { kind: "access-vlan", device: "SW1", interface: "Fa0/1", vlan: 31 } },
      400,
    );
    expect((await request({ action: "resume", id: a.id })).attempt.history).toEqual([]);
  });
  it("handles concurrent trials and diagnostics without incoherent epochs", async () => {
    const s = transferNetwork(family);
    setup(s);
    const a: Attempt = (await request({ action: "start", scenario: s.id })).attempt;
    const results = await Promise.all([
      request({ action: "repair", id: a.id, change: correction(family) }, family === "acl" ? [200, 400] : 200),
      request({ action: "repair", id: a.id, change: correction(family) }, family === "acl" ? [200, 400] : 200),
      request({ action: "command", id: a.id, device: "Desk", command: "ping", target: "172.24.20.10" }),
    ]);
    // ACL sequence is an observed identity: after the first move the old
    // sequence is gone. Preserve that existing conflict rejection contract.
    expect(results.filter((r) => r.error)).toHaveLength(family === "acl" ? 1 : 0);
    const resumed: Attempt = (await request({ action: "resume", id: a.id })).attempt;
    expect(resumed.repairs).toHaveLength(1);
    expect(resumed.history).toHaveLength(1);
    const o = resumed.history[0],
      version = o.repairIndex ?? 0;
    expect(o.output).toBe(execute(trialNetwork(s, resumed.repairs?.slice(0, version)), o.device, o.command, o.target));
    expect(resumed.expiresAt).toBe(a.expiresAt);
  });
  it("expires without allowing a late repair and preserves finalization", async () => {
    const s = transferNetwork(family);
    setup(s);
    vi.useFakeTimers();
    const a: Attempt = (await request({ action: "start", scenario: s.id })).attempt;
    vi.setSystemTime(a.expiresAt! + 1);
    const final: Attempt = (await request({ action: "repair", id: a.id, change: correction(family) })).attempt;
    expect(final.repairs).toBeUndefined();
    expect(final.feedback).toMatchObject({ score: 0, recovery: "unresolved", timedOut: true });
  });
});
it("does not register neutral test fixtures or create sessions for unknown identities", async () => {
  const create = vi.fn();
  vi.spyOn(storage, "sessionStore").mockReturnValue({ create, update: vi.fn() });
  await request({ action: "start", scenario: "n-deadbeef" }, 503);
  expect(create).not.toHaveBeenCalled();
});
