"use client";
import { useEffect, useState } from "react";

export default function PwaUpdate({ busy }: { busy: boolean }) {
  const [waiting, setWaiting] = useState<ServiceWorker>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator) || !window.isSecureContext) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    const check = () => {
      if (!disposed) setWaiting(navigator.serviceWorker.controller ? (registration?.waiting ?? undefined) : undefined);
    };
    const installing = () => registration?.installing?.addEventListener("statechange", check);
    const refresh = () => {
      if (document.visibilityState === "visible" && navigator.onLine) void registration?.update().catch(() => {});
    };
    void navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((r) => {
        if (disposed) return;
        registration = r;
        check();
        r.addEventListener("updatefound", installing);
        installing();
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    document.addEventListener("visibilitychange", refresh);
    navigator.serviceWorker.addEventListener("controllerchange", check);
    return () => {
      disposed = true;
      registration?.removeEventListener("updatefound", installing);
      document.removeEventListener("visibilitychange", refresh);
      navigator.serviceWorker.removeEventListener("controllerchange", check);
    };
  }, []);
  if (failed)
    return (
      <div role="status" className="notice">
        Offline shell could not be installed. Online play is available.
      </div>
    );
  if (!waiting) return null;
  return (
    <div role="status" className="notice">
      An update is ready. Saved progress is kept; an assessment timer continues during reload.
      <button
        className="button secondary"
        disabled={busy}
        onClick={() => {
          navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
          waiting.postMessage({ type: "ACTIVATE_UPDATE" });
        }}
      >
        Reload to update
      </button>
    </div>
  );
}
