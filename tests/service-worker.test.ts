import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

type WorkerEvent = {
  request?: Request;
  data?: unknown;
  waitUntil: (p: Promise<unknown>) => void;
  respondWith: (p: Promise<Response>) => void;
};
async function worker(failAsset = false) {
  const handlers: Record<string, (event: WorkerEvent) => void> = {};
  const snapshots = new Map<string, Map<string, Response>>();
  let networkHtml = '<html><script src="/_next/static/first.js"></script></html>';
  let offline = false;
  let skipped = false;
  const key = (r: string | Request) => (typeof r === "string" ? r : new URL(r.url).pathname);
  const caches = {
    keys: async () => [...snapshots.keys()],
    delete: async (name: string) => snapshots.delete(name),
    open: async (name: string) => {
      if (!snapshots.has(name)) snapshots.set(name, new Map());
      const snapshot = snapshots.get(name)!;
      return {
        put: async (r: string | Request, response: Response) => {
          snapshot.set(key(r), response.clone());
        },
        match: async (r: string | Request) => snapshot.get(key(r))?.clone(),
        addAll: async (urls: string[]) => {
          if (failAsset) throw Error("Asset unavailable");
          for (const url of urls) snapshot.set(url, new Response(url));
        },
      };
    },
    match: async (r: Request) =>
      [...snapshots.values()]
        .map((s) => s.get(key(r)))
        .find(Boolean)
        ?.clone(),
  };
  const source = (await readFile("scripts/service-worker.js", "utf8")).replaceAll("__BUILD_ID__", "test-build");
  vm.runInNewContext(source, {
    caches,
    URL,
    Response,
    fetch: async () => {
      if (offline) throw Error("Offline");
      return new Response(networkHtml);
    },
    self: {
      location: { origin: "https://example.test" },
      clients: { claim: async () => {} },
      skipWaiting: async () => {
        skipped = true;
      },
      addEventListener: (name: string, callback: (e: WorkerEvent) => void) => {
        handlers[name] = callback;
      },
    },
  });
  async function dispatch(name: string, input = {}) {
    let work: Promise<unknown> | undefined;
    handlers[name]({
      ...input,
      waitUntil: (p) => {
        work = p;
      },
      respondWith: (p) => {
        work = p;
      },
    });
    return (await work) as Response | undefined;
  }
  return {
    dispatch,
    snapshots,
    setOffline: () => {
      offline = true;
    },
    changeHtml: () => {
      networkHtml = "different deployment";
    },
    skipped: () => skipped,
  };
}
const request = (pathname: string, mode = "navigate", method = "GET", headers = new Headers()) => ({
  url: `https://example.test${pathname}`,
  mode,
  method,
  headers,
});
describe("deployment-safe offline snapshots", () => {
  it("keeps the installed shell paired with its assets after online navigation", async () => {
    const w = await worker();
    await w.dispatch("install");
    w.changeHtml();
    expect(await (await w.dispatch("fetch", { request: request("/") }))?.text()).toBe("different deployment");
    w.setOffline();
    expect(await (await w.dispatch("fetch", { request: request("/") }))?.text()).toContain("first.js");
  });
  it("does not handle API, RSC, other-origin or non-root navigations", async () => {
    const w = await worker();
    for (const r of [
      request("/api/lab"),
      request("/", "cors", "POST"),
      request("/", "cors", "GET", new Headers({ rsc: "1" })),
      request("/unknown"),
      { ...request("/"), url: "https://other.test/" },
    ])
      expect(await w.dispatch("fetch", { request: r })).toBeUndefined();
    expect(w.snapshots.size).toBe(0);
  });
  it("does not commit an incomplete shell or activate updates without consent", async () => {
    const failed = await worker(true);
    await expect(failed.dispatch("install")).rejects.toThrow("Asset unavailable");
    expect(failed.snapshots.get("netfault-shell-test-build")?.has("/")).toBe(false);
    const w = await worker();
    await w.dispatch("install");
    expect(w.skipped()).toBe(false);
    await w.dispatch("message", { data: { type: "ACTIVATE_UPDATE" } });
    expect(w.skipped()).toBe(true);
  });
  it("retains the previous complete cache instead of a failed installation", async () => {
    const w = await worker();
    w.snapshots.set("netfault-shell-old", new Map([["/", new Response("old shell")]]));
    w.snapshots.set("netfault-shell-failed", new Map());
    await w.dispatch("install");
    await w.dispatch("activate");
    expect([...w.snapshots.keys()]).toEqual(["netfault-shell-old", "netfault-shell-test-build"]);
  });
});
