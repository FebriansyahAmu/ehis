"use client";

// ANT7 — Helper Display antrean: derivasi panggilan + jam live + pengumuman suara (TTS).

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { loketLabel } from "@/lib/antrean/posStore";
import type { PanggilanRef } from "@/lib/antrean/loketStore";
import type { AntreanRecord } from "@/lib/antrean/types";

export interface DisplayCall {
  kodebooking: string;
  nomorAntrean: string;
  nama: string;
  poli: string;
  loket: string;
  calledAt: number;
  recalls: number;
}

/** Tanda tangan panggilan (berubah saat ada panggilan/recall baru) → pemicu flash + TTS. */
export function callSignature(call: DisplayCall | undefined): string {
  return call ? `${call.kodebooking}#${call.recalls}@${call.calledAt}` : "";
}

/**
 * Susun daftar panggilan untuk Display dari status `DipanggilAdmisi`.
 * Loket diambil dari panggilan loket bila ada; fallback "Loket Pendaftaran".
 * Urut terbaru di depan (calls[0] = hero).
 */
export function buildCalls(
  byKode: Record<string, AntreanRecord>,
  panggilan: Record<string, PanggilanRef>,
): DisplayCall[] {
  const out: DisplayCall[] = [];
  for (const rec of Object.values(byKode)) {
    if (rec.status !== "DipanggilAdmisi") continue;
    const p = panggilan[rec.kodebooking];
    const lastTaskWaktu = rec.tasks.reduce((m, t) => Math.max(m, t.waktu), 0);
    out.push({
      kodebooking: rec.kodebooking,
      nomorAntrean: rec.nomorAntrean,
      nama: rec.pasien.nama,
      poli: rec.poli,
      loket: p ? loketLabel(p.pos, p.loket) : "Loket Pendaftaran",
      calledAt: p?.calledAt ?? lastTaskWaktu ?? rec.createdAt,
      recalls: p?.recalls ?? 0,
    });
  }
  return out.sort((a, b) => b.calledAt - a.calledAt);
}

/** Jam live (update tiap detik). Lazy init agar konsisten SSR. */
export function useClock(): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/** Pengumuman suara (Web Speech API, id-ID). Aktif hanya saat `enabled`. */
export function useAnnouncer(enabled: boolean) {
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  return useCallback((text: string) => {
    if (!enabledRef.current) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "id-ID";
    u.rate = 0.95;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, []);
}

/** Hormati prefers-reduced-motion untuk efek flash (pola useSyncExternalStore, SSR-safe). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
