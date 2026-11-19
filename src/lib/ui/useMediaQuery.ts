"use client";

// Hook media query berbasis useSyncExternalStore — aman SSR (snapshot server = `serverDefault`,
// lalu disinkronkan ke matchMedia sesudah hidrasi) dan tanpa setState di effect.

import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string, serverDefault = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverDefault,
  );
}
