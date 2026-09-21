// Confirm that the currently loaded build's complete shell is cached, not merely an older worker.
export async function academyAvailableOffline(): Promise<boolean> {
  if (!navigator.serviceWorker?.controller || !globalThis.caches) return false;
  const assets = [...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>("script[src],link[href]")]
    .map((node) => (node instanceof HTMLScriptElement ? node.src : node.href))
    .filter((url) => new URL(url).pathname.startsWith("/_next/static/"));
  if (!assets.length) return false;
  for (const name of (await caches.keys()).filter((name) => name.startsWith("netfault-shell-"))) {
    const cache = await caches.open(name);
    if ((await cache.match("/")) && (await Promise.all(assets.map((url) => cache.match(url)))).every(Boolean))
      return true;
  }
  return false;
}
