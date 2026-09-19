import "server-only";
import { getStore, type Store } from "@netlify/blobs";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { attemptSchema, type Attempt } from "@/lib/schema";

export class LabError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}
export interface SessionStore {
  create(attempt: Attempt): Promise<void>;
  update(id: string, mutate: (attempt: Attempt) => boolean): Promise<Attempt>;
}
const unavailable = () =>
  new LabError("Attempt unavailable. Start a new assessment; your local journal is retained.", 404);
const storageFailure = () =>
  new LabError("Assessment storage is unavailable. Please retry; your local journal is retained.", 503);
function validate(id: string, data: unknown) {
  const a = attemptSchema.parse(data);
  if (a.id !== id || a.mode !== "assessment") throw storageFailure();
  return a;
}

/** Durable site-scoped records. Every write is conditional; no process-local lock is authoritative. */
export class BlobSessionStore implements SessionStore {
  constructor(private readonly store: Pick<Store, "getWithMetadata" | "setJSON">) {}
  private checkWrite(result: { modified: boolean; etag?: string }) {
    // SDK 11.1 can report modified=true for an HTTP failure. Never acknowledge an unverified write.
    if (result.modified && !result.etag) throw storageFailure();
    return result.modified;
  }
  async create(a: Attempt) {
    if (!this.checkWrite(await this.store.setJSON(a.id, a, { onlyIfNew: true })))
      throw new LabError("Attempt already exists. Please start again.", 409);
  }
  async update(id: string, mutate: (a: Attempt) => boolean) {
    for (let retry = 0; retry < 8; retry++) {
      const entry = await this.store.getWithMetadata(id, { type: "json", consistency: "strong" });
      if (!entry) throw unavailable();
      if (!entry.etag) throw storageFailure();
      const a = validate(id, entry.data);
      if (!mutate(a)) return a;
      if (this.checkWrite(await this.store.setJSON(id, a, { onlyIfMatch: entry.etag }))) return a;
      // A different invocation won. Re-read and re-evaluate deadline/finalization before retrying.
    }
    throw new LabError("This attempt is busy in another tab. Please retry.", 409);
  }
}

const root = path.join(process.cwd(), ".netfault", "sessions");
const locks = new Map<string, Promise<unknown>>();
async function save(a: Attempt) {
  await mkdir(root, { recursive: true });
  const file = path.join(root, `${a.id}.json`);
  await writeFile(file + ".tmp", JSON.stringify(a), "utf8");
  await rename(file + ".tmp", file);
}
const localStore: SessionStore = {
  create: save,
  async update(id, mutate) {
    const task = (locks.get(id) ?? Promise.resolve())
      .catch(() => {})
      .then(async () => {
        let data: unknown;
        try {
          data = JSON.parse(await readFile(path.join(root, `${id}.json`), "utf8"));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") throw unavailable();
          throw storageFailure();
        }
        const a = validate(id, data);
        if (mutate(a)) await save(a);
        return a;
      });
    locks.set(id, task);
    try {
      return await task;
    } finally {
      if (locks.get(id) === task) locks.delete(id);
    }
  },
};

export function sessionStore(): SessionStore {
  if (process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const namespace = process.env.NETFAULT_STORAGE_NAMESPACE ?? "netfault-assessments-v1";
    if (!/^[a-z0-9-]{1,80}$/.test(namespace)) throw storageFailure();
    // The adapter supplies credentials. Failure MUST NOT fall back to ephemeral filesystem storage.
    return new BlobSessionStore(
      getStore({
        name: namespace,
        consistency: "strong",
        fetch: async (input, init) => {
          const response = await fetch(input, init);
          // Reject HTTP failures before the SDK's conditional-write result handling.
          if (!response.ok && response.status !== 404 && response.status !== 412) throw storageFailure();
          return response;
        },
      }),
    );
  }
  return localStore;
}
