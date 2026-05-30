/**
 * BP7 Aplicares — shared types + UI helpers.
 *
 * Scope: ReferensiKamarPage (BP7.1) + MapKelasPage (BP7.2).
 * No "use client" — pure helper module (no hooks, no JSX).
 */

import type { KelasRawat } from "@/lib/eklaim/eklaimShared";

// ── Local CRUD row type ────────────────────────────────

/** `MapKelasRecord` dengan `id` lokal untuk client-side CRUD state. */
export interface MapRowLocal {
  id: string;
  kdKelasBPJS: string;
  namaKelasBPJS: string;
  kdKelasLokal: KelasRawat;
  namaKelasLokal: string;
  multiplier: number;
}

// ── Cache status ───────────────────────────────────────

export type CacheStatus = "fresh" | "stale" | "expired" | "empty";

export function cacheStatusCls(s: CacheStatus): string {
  switch (s) {
    case "fresh":   return "bg-emerald-100 text-emerald-700";
    case "stale":   return "bg-amber-100 text-amber-700";
    case "expired": return "bg-rose-100 text-rose-700";
    default:        return "bg-slate-100 text-slate-500";
  }
}

export function cacheStatusLabel(s: CacheStatus): string {
  switch (s) {
    case "fresh":   return "Fresh";
    case "stale":   return "Stale";
    case "expired": return "Expired";
    default:        return "Empty";
  }
}

// ── Kelas BPJS helpers ─────────────────────────────────

export function kelasBPJSLabel(kode: string): string {
  const map: Record<string, string> = {
    NON: "Non-Kelas",
    VVP: "VVIP",
    VIP: "VIP",
    "1": "Kelas 1",
    "2": "Kelas 2",
    "3": "Kelas 3",
  };
  return map[kode] ?? kode;
}

export function kelasBPJSChipCls(kode: string): string {
  const map: Record<string, string> = {
    NON:  "bg-slate-100 text-slate-500",
    VVP:  "bg-pink-200 text-pink-800",
    VIP:  "bg-fuchsia-100 text-fuchsia-700",
    "1":  "bg-pink-100 text-pink-700",
    "2":  "bg-pink-50 text-pink-600",
    "3":  "bg-slate-100 text-slate-600",
  };
  return map[kode] ?? "bg-slate-100 text-slate-600";
}

/** Catatan informatif per kode kelas BPJS untuk tabel Referensi Kamar. */
export function kelasBPJSNote(kode: string): string {
  const map: Record<string, string> = {
    NON: "Tidak valid untuk pembuatan SEP",
    VVP: "VVIP — khusus RS kelas tertentu",
    VIP: "VIP standar — admisi kelas atas",
    "1": "Kelas 1 — standar JKN",
    "2": "Kelas 2 — standar JKN",
    "3": "Kelas 3 — standar JKN (PBI APBN/APBD)",
  };
  return map[kode] ?? "—";
}

// ── Kelas lokal helpers ────────────────────────────────

export const KELAS_LOKAL_OPTIONS: KelasRawat[] = [
  "VIP", "Kelas_1", "Kelas_2", "Kelas_3", "ICU", "HCU", "Isolasi", "KRIS",
];

export function kelasLokalLabel(kd: KelasRawat): string {
  const map: Record<KelasRawat, string> = {
    KRIS:    "KRIS",
    VIP:     "VIP",
    Kelas_1: "Kelas 1",
    Kelas_2: "Kelas 2",
    Kelas_3: "Kelas 3",
    ICU:     "ICU",
    HCU:     "HCU",
    Isolasi: "Isolasi",
  };
  return map[kd] ?? kd;
}

export function kelasLokalChipCls(kd: KelasRawat): string {
  const map: Record<KelasRawat, string> = {
    KRIS:    "bg-violet-100 text-violet-700",
    VIP:     "bg-fuchsia-100 text-fuchsia-700",
    Kelas_1: "bg-sky-100 text-sky-700",
    Kelas_2: "bg-sky-50 text-sky-600",
    Kelas_3: "bg-slate-100 text-slate-600",
    ICU:     "bg-rose-100 text-rose-700",
    HCU:     "bg-orange-100 text-orange-700",
    Isolasi: "bg-amber-100 text-amber-700",
  };
  return map[kd] ?? "bg-slate-100 text-slate-600";
}

// ── Multiplier badge ───────────────────────────────────

export function multiplierBadgeCls(m: number): string {
  if (m > 1)  return "bg-emerald-100 text-emerald-700";
  if (m < 1)  return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export function multiplierLabel(m: number): string {
  return m.toFixed(2) + "×";
}

// ── CRUD helpers ───────────────────────────────────────

export function makeRowId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * Guard: no duplicate (kdKelasBPJS, kdKelasLokal) pair.
 * Skip row with matching `id` (edit mode).
 */
export function isDuplicateMapping(
  rows: MapRowLocal[],
  kdBPJS: string,
  kdLokal: KelasRawat,
  skipId?: string,
): boolean {
  return rows.some(
    (r) => r.id !== skipId && r.kdKelasBPJS === kdBPJS && r.kdKelasLokal === kdLokal,
  );
}
