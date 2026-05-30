"use client";

// ANT-ONSITE — Fullscreen API helper untuk kiosk.
// Catatan: enter() WAJIB dipanggil dari user gesture (browser policy) — kiosk
// memicunya pada tap pertama (pilih jenis pasien) + tombol toggle di header.

import { useCallback, useEffect, useState } from "react";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    onChange();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enter = useCallback(() => {
    if (typeof document === "undefined" || document.fullscreenElement) return;
    document.documentElement.requestFullscreen?.().catch(() => {
      /* diblokir (mis. bukan gesture) — abaikan */
    });
  }, []);

  const exit = useCallback(() => {
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const toggle = useCallback(() => {
    if (typeof document !== "undefined" && document.fullscreenElement) exit();
    else enter();
  }, [enter, exit]);

  return { isFullscreen, enter, exit, toggle };
}
