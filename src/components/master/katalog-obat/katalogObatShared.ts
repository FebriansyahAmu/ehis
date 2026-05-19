/**
 * UI helpers + tab registry untuk halaman master Katalog Obat.
 * Data source-of-truth ada di `@/lib/master/obatMock.ts`.
 */

import { Pill, Tags, Stethoscope, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ObatRecord } from "@/lib/master/obatMock";

// ── Tab Registry ─────────────────────────────────────────

export type TabKey = "identitas" | "klasifikasi" | "klinis" | "harga";

export interface TabConfig {
  key: TabKey;
  label: string;
  short: string;
  icon: LucideIcon;
  desc: string;
  accent: { bg: string; text: string; ring: string };
}

export const TAB_REGISTRY: TabConfig[] = [
  {
    key: "identitas",
    label: "Identitas",
    short: "Identitas",
    icon: Pill,
    desc: "Kode, nama, sediaan, rute",
    accent: { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
  },
  {
    key: "klasifikasi",
    label: "Klasifikasi",
    short: "Klasifikasi",
    icon: Tags,
    desc: "Formularium, HAM, LASA, golongan",
    accent: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  },
  {
    key: "klinis",
    label: "Klinis",
    short: "Klinis",
    icon: Stethoscope,
    desc: "Indikasi, dosis, ESO, interaksi",
    accent: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  },
  {
    key: "harga",
    label: "Harga & Coverage",
    short: "Harga",
    icon: Wallet,
    desc: "Harga, Fornas, BPJS, batas resep",
    accent: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  },
];

// ── Field Completeness Helpers ───────────────────────────

/** Field wajib di tab Identitas */
const REQ_IDENTITAS: (keyof ObatRecord)[] = [
  "kode", "namaGenerik", "namaDagang", "kategori", "bentuk", "kekuatan",
];

/** Field penting di tab Klinis (info klinis dasar) */
const KEY_KLINIS: (keyof ObatRecord)[] = [
  "indikasi", "dosisDewasa",
];

/** Field penting di tab Harga */
const KEY_HARGA: (keyof ObatRecord)[] = [
  "hargaSatuan",
];

function hasValue(v: unknown): boolean {
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return v > 0;
  return v !== undefined && v !== null;
}

/** Completeness ratio per tab — untuk progress chips */
export function tabCompleteness(obat: ObatRecord, tab: TabKey): { filled: number; total: number; pct: number } {
  let fields: (keyof ObatRecord)[] = [];
  switch (tab) {
    case "identitas":   fields = REQ_IDENTITAS; break;
    case "klasifikasi": fields = []; break; // toggles — selalu valid
    case "klinis":      fields = KEY_KLINIS; break;
    case "harga":       fields = KEY_HARGA; break;
  }
  const total = fields.length;
  if (total === 0) return { filled: 1, total: 1, pct: 100 };
  const filled = fields.filter((f) => hasValue(obat[f])).length;
  return { filled, total, pct: Math.round((filled / total) * 100) };
}

/** Cek apakah seluruh field wajib (Identitas + Harga) sudah terisi */
export function isObatValid(obat: ObatRecord): boolean {
  if (!REQ_IDENTITAS.every((f) => hasValue(obat[f]))) return false;
  if (!KEY_HARGA.every((f) => hasValue(obat[f]))) return false;
  return true;
}

// ── Currency Helpers ─────────────────────────────────────

export function fmtIDR(n: number | undefined | null): string {
  if (!n || n <= 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);
}

export function calcMargin(harga: number, hpp?: number): number | null {
  if (!hpp || hpp <= 0 || harga <= 0) return null;
  return Math.round(((harga - hpp) / harga) * 100);
}

// ── Avatar / Initial helper untuk list ───────────────────

export function obatInitials(o: ObatRecord): string {
  const base = (o.namaGenerik || o.namaDagang || "??").trim();
  const parts = base.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
