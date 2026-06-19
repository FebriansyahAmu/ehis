/**
 * UI helpers + tab registry untuk halaman master Katalog BMHP/BHP.
 * Data source-of-truth (saat mock-first) di `@/lib/master/bmhpMock.ts`.
 * Mirror `katalog-obat/katalogObatShared.ts` (3 tab: Identitas · Klasifikasi · Harga).
 */

import { Syringe, ShieldPlus, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BmhpRecord } from "@/lib/master/bmhpMock";

// ── Tab Registry ─────────────────────────────────────────

export type TabKey = "identitas" | "klasifikasi" | "harga";

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
    icon: Syringe,
    desc: "Nama, merek, kategori, ukuran, satuan",
    accent: { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200" },
  },
  {
    key: "klasifikasi",
    label: "Klasifikasi",
    short: "Klasifikasi",
    icon: ShieldPlus,
    desc: "Steril, single-use, kelas risiko, izin edar",
    accent: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  },
  {
    key: "harga",
    label: "Harga",
    short: "Harga",
    icon: Wallet,
    desc: "Harga jual, HPP, HET, coverage, status",
    accent: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  },
];

// ── Field Completeness Helpers ───────────────────────────

/** Field wajib di tab Identitas (KODE auto, tidak di-input). */
const REQ_IDENTITAS: (keyof BmhpRecord)[] = ["nama", "kategori", "satuan"];

/** Field penting di tab Harga */
const KEY_HARGA: (keyof BmhpRecord)[] = ["hargaSatuan"];

function hasValue(v: unknown): boolean {
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return v > 0;
  return v !== undefined && v !== null;
}

/** Completeness ratio per tab — untuk progress chips */
export function tabCompleteness(b: BmhpRecord, tab: TabKey): { filled: number; total: number; pct: number } {
  let fields: (keyof BmhpRecord)[] = [];
  switch (tab) {
    case "identitas":   fields = REQ_IDENTITAS; break;
    case "klasifikasi": fields = []; break; // toggles — selalu valid
    case "harga":       fields = KEY_HARGA; break;
  }
  const total = fields.length;
  if (total === 0) return { filled: 1, total: 1, pct: 100 };
  const filled = fields.filter((f) => hasValue(b[f])).length;
  return { filled, total, pct: Math.round((filled / total) * 100) };
}

/** Cek apakah seluruh field wajib (Identitas + Harga) sudah terisi */
export function isBmhpValid(b: BmhpRecord): boolean {
  if (!REQ_IDENTITAS.every((f) => hasValue(b[f]))) return false;
  if (!KEY_HARGA.every((f) => hasValue(b[f]))) return false;
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

export function bmhpInitials(b: BmhpRecord): string {
  const base = (b.nama || "??").trim();
  const parts = base.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
