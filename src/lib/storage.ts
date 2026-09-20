import { z } from "zod";
import { attemptSchema, scenarioSchema, type Attempt, type Scenario, type ScenarioId } from "./schema";
export const JOURNAL_KEY = "netfault.journal.v1";
export const PACK_KEY = "netfault.practice.v1";
export const packKey = (id: ScenarioId) => (id === "ospf-01" ? PACK_KEY : `netfault.practice.${id}.v1`);
export const ACTIVE_KEY = "netfault.active.v1";
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function loadJournal(storage: StorageLike): Attempt[] {
  const raw = storage.getItem(JOURNAL_KEY);
  if (!raw) return [];
  return z.array(attemptSchema).parse(JSON.parse(raw));
}
export function saveAttempt(storage: StorageLike, attempt: Attempt) {
  const list = loadJournal(storage);
  const next = [attemptSchema.parse(attempt), ...list.filter((a) => a.id !== attempt.id)].slice(0, 100);
  storage.setItem(JOURNAL_KEY, JSON.stringify(next));
  return next;
}
export function loadPack(storage: StorageLike, id: ScenarioId = "ospf-01"): Scenario | undefined {
  const raw = storage.getItem(packKey(id));
  if (!raw) return undefined;
  const pack = scenarioSchema.parse(JSON.parse(raw));
  if (pack.id !== id) throw Error("Practice pack belongs to a different lab");
  return pack;
}
export function savePack(storage: StorageLike, pack: Scenario) {
  storage.setItem(packKey(pack.id), JSON.stringify(scenarioSchema.parse(pack)));
}
export function elapsed(a: Attempt, now = Date.now()) {
  return Math.max(0, Math.floor(((a.finishedAt ?? now) - a.startedAt) / 1000));
}
