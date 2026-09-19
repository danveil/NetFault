import { describe, expect, it } from "vitest";
import { ACTIVE_KEY, JOURNAL_KEY, elapsed, loadJournal, loadPack, saveAttempt, savePack } from "../src/lib/storage";
import { scenario } from "../src/server/scenario";
import type { Attempt } from "../src/lib/schema";
const createStorage = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
  };
};
const attempt: Attempt = {
  version: 1,
  id: "a",
  scenario: "ospf-01",
  mode: "practice",
  startedAt: 1000,
  history: [],
  hints: [],
  revealed: false,
};
describe("journal and offline pack persistence", () => {
  it("round-trips attempts and updates without duplicates", () => {
    const s = createStorage();
    expect(loadJournal(s)).toEqual([]);
    saveAttempt(s, attempt);
    saveAttempt(s, { ...attempt, hints: ["Look at the gateway"] });
    expect(loadJournal(s)).toHaveLength(1);
    expect(loadJournal(s)[0].hints).toEqual(["Look at the gateway"]);
  });
  it("round-trips selected evidence, diagnosis, timing and history", () => {
    const s = createStorage();
    const a = {
      ...attempt,
      finishedAt: 31000,
      diagnosis: {
        cause: "area-mismatch" as const,
        devices: ["R2", "R3"],
        fix: "r3-area0" as const,
        evidence: ["e"],
        notes: "My reasoning",
      },
      history: [{ id: "e", device: "R2", command: "show ip ospf interface", target: "", at: 2000, output: "Area 0" }],
    };
    saveAttempt(s, a);
    expect(loadJournal(s)[0]).toEqual(a);
    expect(elapsed(a)).toBe(30);
  });
  it("does not overwrite corrupt/unknown-version data", () => {
    const s = createStorage();
    s.setItem(JOURNAL_KEY, '[{"version":99}]');
    expect(() => saveAttempt(s, attempt)).toThrow();
    expect(s.getItem(JOURNAL_KEY)).toBe('[{"version":99}]');
    s.setItem(JOURNAL_KEY, "broken");
    expect(() => loadJournal(s)).toThrow();
  });
  it("surfaces storage quota failure", () => {
    const s = createStorage();
    s.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    expect(() => saveAttempt(s, attempt)).toThrow("QuotaExceededError");
  });
  it("retains 100 most recent attempts", () => {
    const s = createStorage();
    for (let i = 0; i < 102; i++) saveAttempt(s, { ...attempt, id: String(i) });
    expect(loadJournal(s)).toHaveLength(100);
    expect(loadJournal(s)[0].id).toBe("101");
  });
  it("validates cached practice packs and versions", () => {
    const s = createStorage();
    expect(loadPack(s)).toBeUndefined();
    savePack(s, scenario);
    expect(loadPack(s)).toEqual(scenario);
    expect(ACTIVE_KEY).toBe("netfault.active.v1");
  });
});
