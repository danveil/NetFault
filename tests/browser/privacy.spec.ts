import { expect, test } from "@playwright/test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { labs } from "../../src/lib/catalog";

test("fresh production assets exclude all authored private teaching and rubric content", async ({ request }) => {
  test.skip(!process.env.PW_PRODUCTION, "Inspect the complete fresh production static directory.");
  async function assets(dir: string): Promise<string[]> {
    const results: string[] = [];
    for (const file of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, file.name);
      if (file.isDirectory()) results.push(...(await assets(p)));
      else if (file.name.endsWith(".js")) results.push(await readFile(p, "utf8"));
    }
    return results;
  }
  const scripts = (await assets(".next/static")).join("\n");
  for (const privateValue of [
    "2001:db8:15:10::10",
    "2001:db8:15:10::1",
    "2001:db8:15:20::1",
    "0200.0015.0001",
    "10.14.0.1",
    "10.14.0.2",
    "0200.0014.0001",
    "tunnel destination 198.51.100.2",
    "tunnel destination 198.51.100.1",
  ])
    expect(scripts).not.toContain(privateValue);
  expect(scripts).not.toContain("192.168.40.99");
  expect(scripts).not.toContain("192.168.40.10");
  expect(scripts).not.toContain("only R2's static routing configuration changes");
  for (const mac of ["0200.0012.009a", "0200.0012.000a"]) expect(scripts).not.toContain(mac);
  for (const lab of labs) {
    const { attempt } = await (await request.post("/api/lab", { data: { action: "start", scenario: lab.id } })).json();
    expect(Object.keys(attempt).sort()).toEqual(
      ["version", "id", "scenario", "mode", "startedAt", "expiresAt", "history", "hints", "revealed"].sort(),
    );
    expect(attempt.scenario).toBe(lab.id);
    const packResponse = await request.post("/api/lab", { data: { action: "practice-pack", scenario: lab.id } });
    const { pack } = await packResponse.json();
    // Enumerate the authoritative private content rather than maintaining a few guessed phrases.
    const privateText: string[] = [
      pack.explanation,
      pack.solution,
      ...pack.hints,
      ...pack.evidenceRules.map((r: { label: string }) => r.label),
      ...(pack.lesson ?? []).map((p: { text: string }) => p.text),
    ];
    for (const text of privateText) {
      expect(scripts).not.toContain(text);
      expect(scripts).not.toContain(JSON.stringify(text).slice(1, -1));
    }
  }
});
