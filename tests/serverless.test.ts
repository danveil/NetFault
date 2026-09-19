import { afterEach, describe, expect, it, vi } from "vitest";
import { getStore, type Store } from "@netlify/blobs";
import { BlobsServer } from "@netlify/blobs/server";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { BlobSessionStore, sessionStore } from "../src/server/session-store";
import { assessmentAction, startAssessment } from "../src/server/sessions";
import { POST } from "../src/app/api/lab/route";
import type { Attempt, Diagnosis } from "../src/lib/schema";

const diagnosis: Diagnosis = {
  cause: "area-mismatch",
  devices: ["R2", "R3"],
  fix: "r3-area0",
  evidence: [],
  notes: "",
};
const command = { device: "R3", command: "show ip ospf interface", target: "" };
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// Atomic remote service contract fake: separate store instances share only committed records.
function remote() {
  const records = new Map<string, { data: Attempt; etag: string }>();
  let version = 0;
  const api = {
    getWithMetadata: vi.fn(async (key: string) => {
      const entry = records.get(key);
      return entry ? { ...structuredClone(entry), metadata: {} } : null;
    }),
    setJSON: vi.fn(async (key: string, value: Attempt, options: { onlyIfNew?: boolean; onlyIfMatch?: string }) => {
      const old = records.get(key);
      if ((options.onlyIfNew && old) || (options.onlyIfMatch && options.onlyIfMatch !== old?.etag))
        return { modified: false };
      const etag = String(++version);
      records.set(key, { data: structuredClone(value), etag });
      return { modified: true, etag };
    }),
  };
  return { api, client: () => new BlobSessionStore(api as unknown as Store) };
}

describe("serverless assessment storage", () => {
  it("plays and grades through the actual SDK with an ETag-aware transport contract", async () => {
    const records = new Map<string, { body: string; etag: string }>();
    let revision = 0;
    const transport: typeof fetch = async (input, init) => {
      const key = String(input);
      const headers = new Headers(init?.headers);
      const previous = records.get(key);
      if (init?.method?.toUpperCase() === "PUT") {
        if (
          (headers.get("if-none-match") === "*" && previous) ||
          (headers.has("if-match") && headers.get("if-match") !== previous?.etag)
        )
          return new Response(null, { status: 412 });
        const record = { body: String(init.body), etag: `"revision-${++revision}"` };
        records.set(key, record);
        return new Response(null, { headers: { etag: record.etag } });
      }
      return previous
        ? new Response(previous.body, { headers: { etag: previous.etag } })
        : new Response(null, { status: 404 });
    };
    const client = () =>
      new BlobSessionStore(
        getStore({
          name: "test-sessions",
          siteID: "local",
          token: "test-only",
          edgeURL: "https://blobs.test",
          uncachedEdgeURL: "https://blobs.test",
          consistency: "strong",
          fetch: transport,
        }),
      );
    const a = await startAssessment(client());
    for (const [device, cmd] of [
      ["R2", "show ip ospf interface"],
      ["R3", "show running-config"],
      ["R2", "show ip ospf neighbor"],
      ["R1", "show ip route"],
    ])
      await assessmentAction(a.id, "command", { device, command: cmd, target: "" }, client());
    const saved = await assessmentAction(a.id, "resume", undefined, client());
    const final = await assessmentAction(
      a.id,
      "submit",
      { ...diagnosis, evidence: saved.history.map((o) => o.id) },
      client(),
    );
    expect(final.feedback?.score).toBe(100);
    expect(await assessmentAction(a.id, "resume", undefined, client())).toEqual(final);
  });
  it("preserves concurrent commands across independent invocation instances", async () => {
    const r = remote();
    const a = await startAssessment(r.client());
    await Promise.all(
      ["R1", "R2", "R3"].map((device) => assessmentAction(a.id, "command", { ...command, device }, r.client())),
    );
    const saved = await assessmentAction(a.id, "resume", undefined, r.client());
    expect(saved.history).toHaveLength(3);
    expect(new Set(saved.history.map((o) => o.id)).size).toBe(3);
    expect(r.api.getWithMetadata).toHaveBeenCalledWith(a.id, { type: "json", consistency: "strong" });
  });
  it("serializes competing final submissions and later commands", async () => {
    const r = remote();
    const a = await startAssessment(r.client());
    const [first, second] = await Promise.all([
      assessmentAction(a.id, "submit", diagnosis, r.client()),
      assessmentAction(a.id, "submit", { ...diagnosis, cause: "wrong-gateway" }, r.client()),
    ]);
    expect(second).toEqual(first);
    expect(await assessmentAction(a.id, "command", command, r.client())).toEqual(first);
  });
  it("bounds conflict retries and reports failure instead of dropping changes", async () => {
    const r = remote();
    const a = await startAssessment(r.client());
    r.api.setJSON.mockResolvedValue({ modified: false });
    await expect(assessmentAction(a.id, "command", command, r.client())).rejects.toMatchObject({ status: 409 });
    expect(r.api.setJSON).toHaveBeenCalledTimes(9);
  });
  it("fails closed on SDK false-success responses without an ETag", async () => {
    const r = remote();
    const a = await startAssessment(r.client());
    r.api.setJSON.mockResolvedValue({ modified: true, etag: "" });
    await expect(assessmentAction(a.id, "command", command, r.client())).rejects.toMatchObject({ status: 503 });
    await expect(startAssessment(r.client())).rejects.toMatchObject({ status: 503 });
  });
  it("does not fall back to filesystem when cloud context is missing", async () => {
    vi.stubEnv("NETLIFY", "true");
    expect(() => sessionStore()).toThrow();
    const response = await POST(
      new Request("https://netfault.netlify.app/api/lab", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          host: "netfault.netlify.app",
          origin: "https://netfault.netlify.app",
        },
        body: JSON.stringify({ action: "start" }),
      }),
    );
    expect(response.status).toBe(503);
    expect(await response.text()).not.toMatch(/token|siteID|stack|context/i);
    expect(response.headers.get("netlify-cdn-cache-control")).toBe("no-store");
  });
  it("persists through the SDK emulator restart but fails closed on its missing GET ETag", async () => {
    const directory = path.resolve(".netfault", "test-blobs", randomUUID());
    let server = new BlobsServer({ directory, token: "local-test-only" });
    let address = (await server.start()).address;
    const client = () =>
      getStore({
        name: "test-sessions",
        siteID: "local-test",
        token: "local-test-only",
        apiURL: address + "/api/v1",
        consistency: "strong",
      });
    try {
      const a = await startAssessment(new BlobSessionStore(client()));
      await server.stop();
      server = new BlobsServer({ directory, token: "local-test-only" });
      address = (await server.start()).address;
      const saved = await client().getWithMetadata(a.id, { type: "json", consistency: "strong" });
      expect(saved?.data).toEqual(a);
      // SDK 11.1's local emulator omits GET ETags (production Blobs supplies them).
      expect(saved?.etag).toBeUndefined();
      await expect(assessmentAction(a.id, "command", command, new BlobSessionStore(client()))).rejects.toMatchObject({
        status: 503,
      });
    } finally {
      await server.stop();
    }
  });
});
