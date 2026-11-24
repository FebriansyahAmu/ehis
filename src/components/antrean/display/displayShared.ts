"use client";

// ANT7 — Helper Display antrean: derivasi panggilan + jam live + pengumuman suara (TTS)
// + deteksi diam (kontrol layar disembunyikan saat tak ada aktivitas).
// Layar ini publik: data panggilan sengaja TIDAK membawa nama pasien.

import { useCallback, useEffect, useRef, useState } from "react";
import { loketLabel } from "@/lib/antrean/posStore";
import type { PanggilanRef } from "@/lib/antrean/loketStore";
import type { AntreanRecord } from "@/lib/antrean/types";

export interface DisplayCall {
  kodebooking: string;
  nomorAntrean: string;
  poli: string;
  loket: string;
  calledAt: number;
  recalls: number;
}

/** Tanda tangan panggilan (berubah saat ada panggilan/recall baru) → pemicu sorot + TTS. */
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
      poli: rec.poli,
      loket: p ? loketLabel(p.pos, p.loket) : "Loket Pendaftaran",
      calledAt: p?.calledAt ?? (lastTaskWaktu || rec.createdAt),
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

/** `true` setelah `ms` tanpa gerakan pointer/sentuhan/keyboard; aktivitas apa pun → `false`. */
export function useIdle(ms: number): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let t = setTimeout(() => setIdle(true), ms);
    const wake = () => {
      setIdle(false);
      clearTimeout(t);
      t = setTimeout(() => setIdle(true), ms);
    };
    const events = ["pointermove", "pointerdown", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => {
      clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, wake));
    };
  }, [ms]);
  return idle;
}
