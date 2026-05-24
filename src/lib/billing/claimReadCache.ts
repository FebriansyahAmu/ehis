/**
 * Claim Read-Cache (BL2.4-lite).
 *
 * Source of truth `ClaimRecord` ada di modul `/ehis-eklaim` (belum dibangun).
 * Billing hanya **read-only cache** untuk cross-modul awareness — chip status,
 * INA-CBG preview, SEP info, berkas progress, deep link.
 *
 * Saat backend ready: ganti `MOCK` lookup → `await prisma.claim.findFirst(...)`
 * atau API call ke `/api/eklaim/claim?invoiceId=...` (zero refactor UI).
 *
 * Schema 1:1 dengan target `ClaimRecord` (TODO-BILLING.md fase BL0.2).
 */

import type { LucideIcon } from "lucide-react";
import {
  FileSignature, Hourglass, ShieldCheck, XCircle, BadgeCheck, AlertTriangle,
} from "lucide-react";

// ── Status mapping ──────────────────────────────────────

export type ClaimStatus =
  | "Belum Submit"        // claim record ada tapi belum di-kirim ke V-Claim
  | "Pending Verifikasi"  // sudah dikirim, menunggu approval verifikator BPJS
  | "Approved"            // diterima, siap transfer
  | "Rejected"            // ditolak — perlu revisi atau banding
  | "Paid"                // dana sudah ditransfer ke RS
  | "Banding";            // sedang dalam proses banding

export interface ClaimStatusCfg {
  label: string;
  icon: LucideIcon;
  bg: string;
  text: string;
  ring: string;
  dot: string;
  hint: string;       // micro-help di kanan chip
}

export const CLAIM_STATUS_CFG: Record<ClaimStatus, ClaimStatusCfg> = {
  "Belum Submit": {
    label: "Belum Submit",
    icon: FileSignature,
    bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-300", dot: "bg-slate-500",
    hint: "Draft klaim — lengkapi berkas",
  },
  "Pending Verifikasi": {
    label: "Pending Verifikasi",
    icon: Hourglass,
    bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-300", dot: "bg-sky-500",
    hint: "Menunggu approval BPJS",
  },
  "Approved": {
    label: "Approved",
    icon: ShieldCheck,
    bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-300", dot: "bg-emerald-500",
    hint: "Diterima — menunggu transfer",
  },
  "Rejected": {
    label: "Rejected",
    icon: XCircle,
    bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-300", dot: "bg-rose-500",
    hint: "Ditolak — perlu revisi / banding",
  },
  "Paid": {
    label: "Paid",
    icon: BadgeCheck,
    bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-400", dot: "bg-emerald-600",
    hint: "Dana sudah ditransfer",
  },
  "Banding": {
    label: "Banding",
    icon: AlertTriangle,
    bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-300", dot: "bg-amber-500",
    hint: "Proses banding aktif",
  },
};

// ── Berkas checklist ────────────────────────────────────

export interface ClaimBerkas {
  kode: string;
  nama: string;
  required: boolean;
  ready: boolean;
}

// ── INA-CBG preview ────────────────────────────────────

export interface ClaimInaCbg {
  kode: string;          // e.g. I-4-10-I
  nama: string;          // e.g. Gagal Jantung Kongestif (Severity 1)
  tarif: number;         // bundle tarif INA-CBG
  totalRs: number;       // sum charge di invoice (real-cost RS)
  los?: number;          // length of stay
}

// ── Read-only claim record ─────────────────────────────

export interface ClaimRecordRead {
  id: string;
  noKlaim: string | null;     // null untuk "Belum Submit"
  billingId: string;          // invoice id reference
  invoiceNo: string;
  penjaminTipe: "bpjs" | "asuransi" | "jamkesda";
  penjaminNama: string;
  status: ClaimStatus;
  lastUpdate?: {
    at: string;               // ISO
    by: string;
    note?: string;
  };
  // SEP info
  noSEP?: string;
  sepValidUntil?: string;     // ISO date
  kelasDijamin?: string;      // "Kelas 2 Hak"
  // INA-CBG (jika sudah dihitung di /ehis-eklaim/calculator)
  inaCbg?: ClaimInaCbg;
  // Berkas
  berkas: ClaimBerkas[];
  // Status-specific fields
  alasanRejection?: string;
  nominalDisetujui?: number;
  bandingDeadline?: string;
}

// ── Mock data ──────────────────────────────────────────

const DEFAULT_BERKAS_SET: ClaimBerkas[] = [
  { kode: "SEP",       nama: "Surat Eligibilitas Pasien (SEP)",       required: true,  ready: true  },
  { kode: "RESUME",    nama: "Resume Medis",                          required: true,  ready: true  },
  { kode: "ICD",       nama: "Coding ICD-10 & ICD-9 CM",              required: true,  ready: true  },
  { kode: "LAB",       nama: "Hasil Pemeriksaan Penunjang (Lab/Rad)", required: true,  ready: true  },
  { kode: "RINCIAN",   nama: "Rincian Tagihan",                       required: true,  ready: true  },
  { kode: "INFORMED",  nama: "Informed Consent Tindakan",             required: false, ready: true  },
  { kode: "RUJUKAN",   nama: "Surat Rujukan / Kontrol",               required: false, ready: false },
];

const MOCK_CLAIMS: Record<string, ClaimRecordRead> = {
  // INV-009 · Sutrisno Bagus · ICU BPJS — Pending Verifikasi (referensi timeline mock)
  "INV-009": {
    id: "CLM-2026-0524-019",
    noKlaim: "KLM/BPJS/2026/05/00142",
    billingId: "INV-009",
    invoiceNo: "INV/2026/05/00239",
    penjaminTipe: "bpjs",
    penjaminNama: "BPJS Non-PBI",
    status: "Pending Verifikasi",
    lastUpdate: {
      at: "2026-05-24T08:45",
      by: "Susi (Tim Klaim)",
      note: "Berkas lengkap, dikirim ke V-Claim — menunggu approval verifikator",
    },
    noSEP: "SEP-2026-0520-00060",
    sepValidUntil: "2026-06-20",
    kelasDijamin: "Kelas 1 Hak (Non-PBI)",
    inaCbg: {
      kode: "I-4-10-III",
      nama: "Gagal Jantung Kongestif & Edema Paru (Severity 3, dengan komorbid)",
      tarif: 14_850_000,
      totalRs: 16_265_000,  // total RS lebih besar → selisih rugi
      los: 4,
    },
    berkas: DEFAULT_BERKAS_SET.map((b) =>
      // Sutrisno: rujukan tidak diperlukan (admisi via IGD)
      b.kode === "RUJUKAN" ? { ...b, required: false, ready: false } : { ...b, ready: true },
    ),
  },
};

/**
 * Lookup claim status untuk invoice tertentu.
 *
 * @returns `ClaimRecordRead` jika sudah ada record di EKLAIM, atau `null` jika
 *          invoice belum di-coding / belum di-buat claim record (UI = empty state CTA).
 */
export function getClaimStatusForInvoice(invoiceId: string): ClaimRecordRead | null {
  return MOCK_CLAIMS[invoiceId] ?? null;
}

// ── Helpers ──────────────────────────────────────────────

export function berkasProgress(berkas: ClaimBerkas[]): {
  ready: number;
  required: number;
  total: number;
  pct: number;        // 0-100 (basis: required only — non-required tidak block)
} {
  const required = berkas.filter((b) => b.required);
  const ready = required.filter((b) => b.ready).length;
  return {
    ready,
    required: required.length,
    total: berkas.length,
    pct: required.length > 0 ? Math.round((ready / required.length) * 100) : 0,
  };
}

/**
 * Selisih INA-CBG: positif = RS untung (CBG > realcost), negatif = rugi.
 */
export function inaCbgMargin(cbg: ClaimInaCbg): {
  selisih: number;
  pct: number;
  isUntung: boolean;
} {
  const selisih = cbg.tarif - cbg.totalRs;
  const pct = cbg.totalRs > 0 ? (selisih / cbg.totalRs) * 100 : 0;
  return { selisih, pct, isUntung: selisih >= 0 };
}

/**
 * URL deep link ke modul E-Klaim (belum dibangun).
 *
 * - existing claim → `/ehis-eklaim/klaim/[claimId]`
 * - new claim from invoice → `/ehis-eklaim/klaim/new?invoiceId=[invoiceId]`
 */
export function eklaimDeepLink(claim: ClaimRecordRead | null, invoiceId: string): string {
  if (claim) return `/ehis-eklaim/klaim/${claim.id}`;
  return `/ehis-eklaim/klaim/new?invoiceId=${encodeURIComponent(invoiceId)}`;
}
