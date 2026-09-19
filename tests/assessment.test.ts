import { afterEach, describe, expect, it, vi } from "vitest";
import { startAssessment, assessmentAction, ASSESSMENT_MS } from "../src/server/sessions";
import { POST } from "../src/app/api/lab/route";
import type { Diagnosis } from "../src/lib/schema";
const correct: Diagnosis = { cause: "area-mismatch", devices: ["R2", "R3"], fix: "r3-area0", evidence: [], notes: "" };
afterEach(() => vi.useRealTimers());
describe("persisted authoritative assessments", () => {
  it("starts without answers and survives a server module reload", async () => {
    const a = await startAssessment();
    expect(a.expiresAt! - a.startedAt).toBe(ASSESSMENT_MS);
    expect(a).not.toHaveProperty("feedback");
    await assessmentAction(a.id, "command", { device: "R3", command: "show ip ospf interface", target: "" });
    vi.resetModules();
    const reloaded = await import("../src/server/sessions");
    const resumed = await reloaded.assessmentAction(a.id, "resume");
    expect(resumed.history).toHaveLength(1);
    expect(resumed.history[0].output).toContain("Area 1");
    expect(resumed.hints).toEqual([]);
  });
  it("serializes concurrent commands without losing observations", async () => {
    const a = await startAssessment();
    await Promise.all(
      ["R1", "R2", "R3"].map((device) =>
        assessmentAction(a.id, "command", { device, command: "show ip route", target: "" }),
      ),
    );
    const r = await assessmentAction(a.id, "resume");
    expect(r.history).toHaveLength(3);
    expect(new Set(r.history.map((o) => o.id)).size).toBe(3);
  });
  it("grades only server-issued evidence and finalization is immutable", async () => {
    const a = await startAssessment();
    const r = await assessmentAction(a.id, "submit", { ...correct, evidence: ["invented"] });
    expect(r.feedback?.score).toBe(70);
    expect(await assessmentAction(a.id, "submit", { ...correct, cause: "wrong-gateway" })).toEqual(r);
    expect(await assessmentAction(a.id, "command", { device: "R2", command: "show ip route", target: "" })).toEqual(r);
  });
  it("rejects a late answer and finalizes expiry even on resume", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-19T01:00:00Z"));
    const a = await startAssessment();
    vi.setSystemTime(a.expiresAt! + 1);
    const r = await assessmentAction(a.id, "submit", correct);
    expect(r.feedback?.timedOut).toBe(true);
    expect(r.feedback?.score).toBe(0);
    expect(r.finishedAt).toBe(a.expiresAt);
    expect(await assessmentAction(a.id, "resume")).toEqual(r);
  });
  it("rejects invalid session paths", async () => {
    await expect(assessmentAction("../../other", "resume")).rejects.toThrow("Invalid attempt ID");
  });
});
describe("API input and browser-origin boundaries", () => {
  function request(body: unknown, origin = "http://localhost:3100") {
    return new Request("http://0.0.0.0:3100/api/lab", {
      method: "POST",
      headers: { "Content-Type": "application/json", host: "localhost:3100", origin },
      body: JSON.stringify(body),
    });
  }
  it("accepts the real browser host despite a different server bind address", async () =>
    expect((await POST(request({ action: "start" }))).status).toBe(200));
  it("rejects cross-origin writes", async () =>
    expect((await POST(request({ action: "start" }, "http://example.com"))).status).toBe(403));
  it("accepts a public HTTPS host and rejects malformed origins", async () => {
    const r = new Request("https://netfault.example/api/lab", {
      method: "POST",
      headers: {
        host: "netfault.example",
        origin: "https://netfault.example",
        "content-type": "application/json",
      },
      body: JSON.stringify({ action: "start" }),
    });
    expect((await POST(r)).status).toBe(200);
    expect((await POST(request({ action: "start" }, "null"))).status).toBe(403);
  });
  it("bounds bodies even without content-length and requires JSON", async () => {
    expect((await POST(request({ action: "start", excess: "x".repeat(30000) }))).status).toBe(413);
    expect((await POST(new Request("https://example.test/api/lab", { method: "POST", body: "{}" }))).status).toBe(415);
  });
  it("rejects unknown hint/reveal operations and malformed IDs", async () => {
    expect((await POST(request({ action: "hint" }))).status).toBe(400);
    expect((await POST(request({ action: "resume", id: "../other" }))).status).toBe(400);
  });
  it("marks all responses no-store, with answers available only in explicit practice pack", async () => {
    const r = await POST(request({ action: "practice-pack" }));
    expect(r.headers.get("cache-control")).toBe("no-store");
    const body = await r.json();
    expect(body.pack.fault.cause).toBe("area-mismatch");
  });
});
