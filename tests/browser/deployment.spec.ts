import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

test("manifest and sensitive response headers support HTTPS deployment", async ({ request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.start_url).toBe("/");
  expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
  for (const data of [{ action: "start" }, { action: "practice-pack" }, { action: "hint" }]) {
    const response = await request.post("/api/lab", { data });
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(response.headers()["cdn-cache-control"]).toBe("no-store");
    expect(response.headers()["netlify-cdn-cache-control"]).toBe("no-store");
  }
});

test("an installed deployment updates on request and retains offline practice progress", async ({ page, context }) => {
  test.skip(!process.env.PW_PRODUCTION, "Production service worker only.");
  // Only the generated local build artifact is changed; restore it even on failure.
  const original = await readFile("public/sw.js", "utf8");
  await page.goto("/");
  await page.getByRole("button", { name: "Start investigation" }).click();
  await page.getByRole("button", { name: "ipconfig", exact: true }).click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await expect(page.getByRole("button", { name: "Reload to update" })).toHaveCount(0);
  await page.reload();
  try {
    await writeFile("public/sw.js", original.replace(/netfault-shell-([^"]+)/, "netfault-shell-qa-$1"));
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.update());
    await expect(page.getByRole("button", { name: "Reload to update" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Reload to update" }).click();
    await expect(page.getByRole("heading", { name: "PC-A cannot reach PC-B." })).toBeVisible();
    await expect(page.getByRole("region", { name: "Command output" })).toContainText("192.168.10.1");
    await expect(page.getByRole("button", { name: "Reload to update" })).toHaveCount(0);
    const cached = await page.evaluate(async () => {
      const urls = [];
      for (const name of await caches.keys())
        for (const req of await (await caches.open(name)).keys()) urls.push(req.url);
      return urls;
    });
    expect(cached.some((url) => url.includes("/api/"))).toBe(false);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { name: "PC-A cannot reach PC-B." })).toBeVisible();
    await page.getByRole("button", { name: "ping", exact: true }).click();
    await expect(page.getByRole("region", { name: "Command output" })).toContainText("0 percent");
  } finally {
    await context.setOffline(false);
    await writeFile("public/sw.js", original);
  }
});
