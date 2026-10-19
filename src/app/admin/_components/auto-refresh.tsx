"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_INTERVAL_MS = 20000;

function hasOpenOverlay() {
  if (typeof document === "undefined") return false;
  return (
    document.querySelector(
      '[role="dialog"][data-state="open"], [role="menu"][data-state="open"]'
    ) !== null
  );
}

export function AutoRefresh({
  intervalMs = DEFAULT_INTERVAL_MS,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (typeof document === "undefined") return;
      if (document.visibilityState !== "visible") return;
      if (hasOpenOverlay()) return;
      router.refresh();
    };

    const interval = setInterval(refresh, intervalMs);

    const onFocus = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [router, intervalMs]);

  return null;
}
