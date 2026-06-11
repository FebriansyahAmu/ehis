/**
 * UI helpers + tab registry untuk halaman master Katalog Tindakan.
 * Data source-of-truth ada di `@/lib/master/tindakanMock.ts`.
 */

import { Activity, Network } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TindakanRecord } from "@/lib/master/tindakanMock";
import type { SpesialisCode } from "@/components/master/dokter/dokterShared";

// ── Tab Registry ─────────────────────────────────────────

export type TindakanTabKey = "identitas" | "relasi";

export interface TindakanTabConfig {
  key: TindakanTabKey;
  label: string;
  icon: LucideIcon;
  desc: string;
  accent: { bg: string; text: string; ring: string };
}

export const TINDAKAN_TABS: TindakanTabConfig[] = [
  {
    key: "identitas",
    label: "Identitas",
    icon: Activity,
    desc: "Kode, nama, kategori, kompleksitas",
    accent: { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200" },
  },
  {
    key: "relasi",
    label: "Relasi Default",
    icon: Network,
    desc: "Spesialis & unit layanan default",
    accent: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  },
];

// ── Spesialis Short Labels ───────────────────────────────

export const SPESIALIS_SHORT: Record<SpesialisCode, string> = {
  Umum:  "Umum",
  SpJP:  "Jantung",
  SpPD:  "Penyakit Dalam",
  SpA:   "Anak",
  SpOG:  "OBGYN",
  SpB:   "Bedah",
  SpAn:  "Anestesi",
  SpS:   "Saraf",
  SpM:   "Mata",
  SpEM:  "Emergency",
  SpKK:  "Kulit",
  SpKJ:  "Jiwa",
  SpPK:  "Patologi Klinik",
  SpRad: "Radiologi",
  SpTHT: "THT",
  SpU:   "Urologi",
};

export const SPESIALIS_ORDER: SpesialisCode[] = [
  "Umum", "SpEM", "SpJP", "SpPD", "SpA", "SpOG",
  "SpB", "SpAn", "SpS", "SpM", "SpKK", "SpKJ",
  "SpPK", "SpRad", "SpTHT", "SpU",
];

// ── Validation ───────────────────────────────────────────

// Kode ICD-9-CM opsional → hanya nama yang wajib (baik entry baru maupun edit).
export function isTindakanValid(t: TindakanRecord): boolean {
  return !!t.nama.trim();
}

// ── Avatar Initials ──────────────────────────────────────

export function tindakanInitials(t: TindakanRecord): string {
  const parts = (t.nama || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ── Status Config ────────────────────────────────────────

export function getStatusCfg(status: TindakanRecord["status"]) {
  if (status === "NonAktif") {
    return { label: "Non-Aktif", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  }
  return { label: "Aktif", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
}
