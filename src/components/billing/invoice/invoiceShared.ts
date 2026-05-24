/**
 * Invoice Detail — types, configs, dan const display untuk modul BL2.
 * Schema 1:1 dengan target Prisma `Charge`/`Invoice` (extend BillingRecord).
 * Saat backend ready, swap query API — UI tidak berubah.
 */

import type { LucideIcon } from "lucide-react";
import {
  BedDouble, Stethoscope, FlaskConical, ScanLine, Pill, UserRound, MoreHorizontal,
  CircleDot, FileText, Send, ShieldCheck, CheckCircle2, XCircle, Ban,
} from "lucide-react";
import type {
  UnitFilter, KelasFilter, StatusFilter,
} from "@/components/billing/tagihan/tagihanShared";
import type { PenjaminTipeRow } from "@/lib/billing/tagihanBoardMock";

// ── Core types ──────────────────────────────────────────

export type Coverage = "Penjamin" | "Pasien" | "Mixed";

export type SourceModul =
  | "IGD" | "RI" | "RJ" | "Farmasi" | "Lab" | "Rad" | "Akomodasi" | "Adjustment";

export type KategoriCharge =
  | "Akomodasi" | "Tindakan" | "Lab" | "Rad" | "Obat & BMHP" | "Jasa Dokter" | "Lain-lain";

export interface ChargeItem {
  id: string;
  tanggalISO: string;       // YYYY-MM-DDTHH:mm
  nama: string;
  sourceModul: SourceModul;
  sourceRef: string;        // orderId / resepItemId / tindakanId
  kategori: KategoriCharge;
  qty: number;
  satuan: string;           // "pcs" | "tab" | "hari" | "kali" | "ml"
  hargaSatuan: number;
  coverage: Coverage;
  diskonItem?: number;      // nominal Rp
  alasanDiskon?: string;
  voided?: boolean;
  voidReason?: string;
}

export interface TimelineEntry {
  step: "Draft" | "Final" | "Klaim" | "Selesai";
  label: string;            // user-facing
  status: "done" | "current" | "pending" | "skipped";
  at?: string;              // ISO
  by?: string;
  detail?: string;          // extra info, e.g. nominal / catatan
}

export interface InvoiceDetail {
  // ── Header (denormalized dari BillingRecord) ──
  id: string;
  noTagihan: string;
  tanggalISO: string;
  noKunjungan: string;
  pasien: {
    nama: string;
    noRM: string;
    gender: "L" | "P";
    age: number;
    verified: boolean;
  };
  unit: UnitFilter;
  kelas: KelasFilter;
  penjamin: {
    tipe: PenjaminTipeRow;
    nama: string;
    noSEP?: string;
  };
  dpjp: string;
  status: StatusFilter;
  // ── Charges ──
  items: ChargeItem[];
  // ── Invoice-level adjustments ──
  diskonInvoice?: number;   // nominal Rp
  alasanDiskonInvoice?: string;
  ppnPct?: number;          // 0 untuk RS pemerintah
  materai?: number;         // nominal Rp
  // ── Pembayaran ──
  dibayar: number;
  // ── Timeline ──
  timeline: TimelineEntry[];
}

// ── Display configs ────────────────────────────────────

interface ChipCfg {
  label: string;
  icon: LucideIcon;
  bg: string;
  text: string;
  ring: string;
  dot: string;
}

export const KATEGORI_CFG: Record<KategoriCharge, ChipCfg> = {
  "Akomodasi":   { label: "Akomodasi",   icon: BedDouble,    bg: "bg-teal-50",    text: "text-teal-700",    ring: "ring-teal-200",    dot: "bg-teal-500" },
  "Tindakan":    { label: "Tindakan",    icon: Stethoscope,  bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200",     dot: "bg-sky-500" },
  "Lab":         { label: "Laboratorium", icon: FlaskConical, bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   dot: "bg-amber-500" },
  "Rad":         { label: "Radiologi",   icon: ScanLine,     bg: "bg-pink-50",    text: "text-pink-700",    ring: "ring-pink-200",    dot: "bg-pink-500" },
  "Obat & BMHP": { label: "Obat & BMHP", icon: Pill,         bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" },
  "Jasa Dokter": { label: "Jasa Dokter", icon: UserRound,    bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200",    dot: "bg-rose-500" },
  "Lain-lain":   { label: "Lain-lain",   icon: MoreHorizontal, bg: "bg-slate-100", text: "text-slate-700",   ring: "ring-slate-200",   dot: "bg-slate-500" },
};

/** Urutan section pada Rincian (akomodasi paling atas, lain-lain paling bawah). */
export const KATEGORI_ORDER: KategoriCharge[] = [
  "Akomodasi", "Tindakan", "Lab", "Rad", "Obat & BMHP", "Jasa Dokter", "Lain-lain",
];

export const COVERAGE_CFG: Record<Coverage, { label: string; bg: string; text: string; ring: string }> = {
  "Penjamin": { label: "Penjamin", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  "Pasien":   { label: "Pasien",   bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200" },
  "Mixed":    { label: "Split",    bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200" },
};

export const SOURCE_BADGE_TONE: Record<SourceModul, { bg: string; text: string }> = {
  IGD:        { bg: "bg-rose-100",     text: "text-rose-700" },
  RI:         { bg: "bg-teal-100",     text: "text-teal-700" },
  RJ:         { bg: "bg-sky-100",      text: "text-sky-700" },
  Farmasi:    { bg: "bg-emerald-100",  text: "text-emerald-700" },
  Lab:        { bg: "bg-amber-100",    text: "text-amber-700" },
  Rad:        { bg: "bg-pink-100",     text: "text-pink-700" },
  Akomodasi:  { bg: "bg-slate-100",    text: "text-slate-600" },
  Adjustment: { bg: "bg-orange-100",   text: "text-orange-700" },
};

// ── Timeline step config ────────────────────────────────

interface StepCfg {
  icon: LucideIcon;
  doneBg: string;       // background saat status=done
  currentBg: string;
  pendingBg: string;
  doneText: string;
  currentText: string;
  pendingText: string;
}

export const TIMELINE_STEP_CFG: Record<TimelineEntry["step"], StepCfg> = {
  Draft: {
    icon: FileText,
    doneBg: "bg-slate-400", currentBg: "bg-slate-500", pendingBg: "bg-slate-200",
    doneText: "text-white", currentText: "text-white", pendingText: "text-slate-400",
  },
  Final: {
    icon: CircleDot,
    doneBg: "bg-amber-500", currentBg: "bg-amber-600", pendingBg: "bg-slate-200",
    doneText: "text-white", currentText: "text-white", pendingText: "text-slate-400",
  },
  Klaim: {
    icon: Send,
    doneBg: "bg-sky-500", currentBg: "bg-sky-600", pendingBg: "bg-slate-200",
    doneText: "text-white", currentText: "text-white", pendingText: "text-slate-400",
  },
  Selesai: {
    icon: CheckCircle2,
    doneBg: "bg-emerald-500", currentBg: "bg-emerald-600", pendingBg: "bg-slate-200",
    doneText: "text-white", currentText: "text-white", pendingText: "text-slate-400",
  },
};

// ── Status (large chip on banner) ───────────────────────

export const STATUS_BANNER_CFG: Record<StatusFilter, { label: string; icon: LucideIcon; bg: string; text: string; ring: string }> = {
  "Draft":           { label: "Draft",           icon: FileText,      bg: "bg-slate-100",  text: "text-slate-700",   ring: "ring-slate-300" },
  "Final":           { label: "Final",           icon: CircleDot,     bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-300" },
  "Lunas":           { label: "Lunas",           icon: CheckCircle2,  bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-300" },
  "Lunas Sebagian":  { label: "Lunas Sebagian",  icon: CircleDot,     bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-300" },
  "Belum Lunas":     { label: "Belum Lunas",     icon: CircleDot,     bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-300" },
  "Proses Klaim":    { label: "Proses Klaim",    icon: Send,          bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-300" },
  "Klaim Disetujui": { label: "Klaim Disetujui", icon: ShieldCheck,   bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-300" },
  "Klaim Ditolak":   { label: "Klaim Ditolak",   icon: XCircle,       bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-300" },
  "Refund":          { label: "Refund",          icon: CircleDot,     bg: "bg-orange-50",  text: "text-orange-700",  ring: "ring-orange-300" },
  "Void":            { label: "Void",            icon: Ban,           bg: "bg-slate-100",  text: "text-slate-500",   ring: "ring-slate-300" },
};

// ── Format helpers (re-export) ──────────────────────────

export { fmtRupiah, fmtRupiahShort } from "@/lib/master/penjaminMock";
