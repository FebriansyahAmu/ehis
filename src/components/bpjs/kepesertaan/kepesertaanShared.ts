/**
 * Kepesertaan — shared types, helpers, tone config.
 * Accent: sky (kepesertaan per TONE_PALETTE_BPJS).
 */

import type { BPJSError, BPJSMetaError, PesertaRecord } from "@/lib/bpjs/bpjsShared";

// ── Result shape ─────────────────────────────────────────

export type SearchMode = "kartu" | "nik";

export type KepesertaanResult =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; peserta: PesertaRecord }
  | { status: "error"; error: BPJSError };

// ── Chip color helpers ────────────────────────────────────

export function kelasChipCls(kode: "1" | "2" | "3"): string {
  const MAP: Record<"1" | "2" | "3", string> = {
    "1": "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    "2": "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
    "3": "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  };
  return MAP[kode];
}

export function jenisChipCls(kode: string): string {
  if (kode === "12") return "bg-amber-100 text-amber-700 ring-1 ring-amber-200"; // PBI APBN
  if (kode === "11") return "bg-teal-100 text-teal-700 ring-1 ring-teal-200";   // PNS
  if (kode === "13") return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"; // Swasta
  if (kode === "14") return "bg-sky-100 text-sky-700 ring-1 ring-sky-200";     // Mandiri
  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}

export function statusChipCls(kode: "0" | "1"): string {
  return kode === "0"
    ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
    : "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
}

// ── Label / format helpers ────────────────────────────────

export function fmtTgl(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

export function sexLabel(sex: "L" | "P"): string {
  return sex === "L" ? "Laki-laki" : "Perempuan";
}

// ── BPJSError → display label ─────────────────────────────

export function errorLabel(err: BPJSError): {
  title: string;
  desc: string;
  color: "slate" | "amber" | "rose";
  retryable: boolean;
} {
  if (err.type === "BPJSMetaError") {
    const e = err as BPJSMetaError;
    if (e.code === "201")
      return { title: "Peserta Tidak Ditemukan", desc: "Nomor kartu atau NIK tidak terdaftar di V-Claim BPJS.", color: "slate", retryable: false };
    if (e.code === "203")
      return { title: "Kepesertaan Tidak Aktif", desc: "Status peserta NON-AKTIF. Peserta mungkin menunggak iuran atau masa berlaku habis.", color: "amber", retryable: false };
    if (e.code === "204")
      return { title: "Validasi Gagal", desc: e.message, color: "rose", retryable: false };
    return { title: `Error BPJS ${e.code}`, desc: e.message, color: "rose", retryable: e.retryable };
  }
  return {
    title: "Gagal Terhubung ke V-Claim",
    desc: "Sambungan ke server BPJS terputus. Periksa koneksi dan coba lagi.",
    color: "rose",
    retryable: true,
  };
}

// ── Dev-helper: sample test values ───────────────────────

export const SAMPLE_KARTU = [
  { label: "PBI Aktif",       value: "0001234567891" },
  { label: "Mandiri K1",      value: "0001234567895" },
  { label: "PNS K1",          value: "0001234567810" },
  { label: "COB Swasta",      value: "0001234567812" },
  { label: "Non-Aktif (203)", value: "0001234567811" },
] as const;

export const SAMPLE_NIK = [
  { label: "Joko Prasetyo", value: "3171010103700001" },
  { label: "Sri Mulyani",   value: "3174010182090012" },
  { label: "Andi Wijaya",   value: "3175010188110007" },
] as const;
