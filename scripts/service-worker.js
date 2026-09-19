/* Build-stamped offline snapshot. API responses and RSC are never cached. */
const CACHE = "netfault-shell-__BUILD_ID__";
const ICONS = ["/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const response = await fetch("/", { cache: "no-store" });
      if (!response.ok) throw new Error("Offline shell unavailable");
      const html = await response.clone().text();
      const assets = [...html.matchAll(/(?:src|href)="([^" ]*\/_next\/static\/[^" ]+)"/g)].map((match) =>
        match[1].replaceAll("&amp;", "&"),
      );
      if (!assets.length) throw new Error("Offline assets unavailable");
      // Commit the shell only after its complete dependency set has been cached.
      await cache.addAll([...new Set([...assets, ...ICONS])]);
      await cache.put("/", response);
    })(),
  );
  // Updates wait for the user's reload (or for every old tab to close).
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = (await caches.keys()).filter((key) => key.startsWith("netfault-shell-"));
      // Keep the previous snapshot for already-open tabs using the previous chunks.
      const complete = [];
      for (const key of keys) {
        if (key !== CACHE && (await (await caches.open(key)).match("/"))) complete.push(key);
      }
      const previous = complete.at(-1);
      await Promise.all(keys.filter((key) => key !== CACHE && key !== previous).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (
    req.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    req.headers.has("rsc")
  )
    return;
  if (req.mode === "navigate" && url.pathname === "/") {
    // Never overwrite this build's offline HTML with another deployment or route.
    event.respondWith(fetch(req).catch(async () => (await (await caches.open(CACHE)).match("/")) || Response.error()));
  } else if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
  } else if (ICONS.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async (cache) => (await cache.match(req)) || fetch(req)));
  }
});
