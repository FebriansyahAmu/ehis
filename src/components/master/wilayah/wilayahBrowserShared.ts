// Shared types & meta untuk penjelajah Wilayah Kemendagri (Master · Konfigurasi).
// Lazy per-level: kolom hanya memuat anak dari induk terpilih (hindari fetch 91k sekaligus).

import { MapPin, Building2, Signpost, Home, type LucideIcon } from "lucide-react";
import type { WilayahDTO } from "@/lib/api/wilayah";

export type { WilayahDTO };

export const LEVELS = [1, 2, 3, 4] as const;
export type Level = (typeof LEVELS)[number];

export interface LevelMeta {
  /** Label penuh (header kolom). */
  label: string;
  /** Label ringkas (breadcrumb / stat). */
  short: string;
  icon: LucideIcon;
  /** Kelas chip ikon (bg + text + ring) — aksen per level. */
  chip: string;
  /** Kelas dot kecil (badge count). */
  tone: "sky" | "teal" | "amber" | "emerald";
}

export const LEVEL_META: Record<Level, LevelMeta> = {
  1: { label: "Provinsi",           short: "Provinsi",   icon: MapPin,    chip: "bg-sky-50 text-sky-600 ring-sky-100",         tone: "sky" },
  2: { label: "Kabupaten / Kota",   short: "Kab/Kota",   icon: Building2, chip: "bg-teal-50 text-teal-600 ring-teal-100",      tone: "teal" },
  3: { label: "Kecamatan",          short: "Kecamatan",  icon: Signpost,  chip: "bg-amber-50 text-amber-600 ring-amber-100",   tone: "amber" },
  4: { label: "Desa / Kelurahan",   short: "Desa/Kel",   icon: Home,      chip: "bg-emerald-50 text-emerald-600 ring-emerald-100", tone: "emerald" },
};

/** Statistik jumlah per level (dari SSR service.stats). */
export interface WilayahStats {
  byLevel: Record<number, number>;
  total: number;
}

/** Rantai kode leluhur termasuk kode sendiri: "31.71.01.1001" → ["31","31.71","31.71.01","31.71.01.1001"]. */
export function ancestorKodes(kode: string): string[] {
  const seg = kode.split(".");
  return seg.map((_, i) => seg.slice(0, i + 1).join("."));
}

/** Format angka ID (91599 → "91.599"). */
export function fmt(n: number): string {
  return n.toLocaleString("id-ID");
}
