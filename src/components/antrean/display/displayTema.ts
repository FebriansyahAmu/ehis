"use client";

// ANT7 — Tema Display antrean: token warna terang & gelap + pilihan tersimpan per perangkat.
// Proporsi sama di kedua tema: latar ±70% · panel ±25% · aksen sky ±5% (loket tujuan);
// amber khusus panggilan ulang. Semua pasangan teks lolos kontras 4.5:1 di atas panel.
// `color-scheme: only …` dipasang bersama latar agar scrollbar/kontrol bawaan ikut tema.

import { useCallback, useSyncExternalStore, type CSSProperties } from "react";

export type DisplayTema = "terang" | "gelap";

export const TEMA_TOKENS: Record<DisplayTema, CSSProperties> = {
  terang: {
    colorScheme: "only light",
    "--d-bg": "#f2f4f7",
    "--d-panel": "#ffffff",
    "--d-raised": "#e9edf2",
    "--d-line": "rgb(15 23 42 / 0.08)",
    "--d-text": "#0f172a",
    "--d-text-2": "#475569",
    "--d-muted": "#64748b",
    "--d-accent": "#0369a1",
    "--d-recall": "#b45309",
  } as CSSProperties,
  gelap: {
    colorScheme: "only dark",
    "--d-bg": "#0b0f17",
    "--d-panel": "#111723",
    "--d-raised": "#1a2130",
    "--d-line": "rgb(226 232 240 / 0.08)",
    "--d-text": "#eef2f7",
    "--d-text-2": "#aab4c3",
    "--d-muted": "#7f8a9c",
    "--d-accent": "#7dd3fc",
    "--d-recall": "#fcd34d",
  } as CSSProperties,
};

const KEY = "ehis.display.tema";
const DEFAULT: DisplayTema = "terang";
const listeners = new Set<() => void>();
/** Cadangan di memori bila localStorage diblokir (mode privat / kebijakan perangkat). */
let memTema: DisplayTema | null = null;

function baca(): DisplayTema {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "terang" || v === "gelap") return v;
  } catch {
    /* localStorage tak tersedia */
  }
  return memTema ?? DEFAULT;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function useDisplayTema(): [DisplayTema, (t: DisplayTema) => void] {
  const tema = useSyncExternalStore(subscribe, baca, () => DEFAULT);
  const setTema = useCallback((t: DisplayTema) => {
    memTema = t;
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* tetap berlaku di memori untuk sesi ini */
    }
    listeners.forEach((l) => l());
  }, []);
  return [tema, setTema];
}
