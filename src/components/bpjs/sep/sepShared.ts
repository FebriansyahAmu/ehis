/**
 * SEP — shared types, helpers, sample data.
 * Accent: emerald (sep per TONE_PALETTE_BPJS).
 */
import type { BPJSError, BPJSMetaError, SEPRecordExt } from "@/lib/bpjs/bpjsShared";

// ── Result shapes ─────────────────────────────────────────

export type SEPResult =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; sep: SEPRecordExt }
  | { status: "error"; error: BPJSError };

// ── Status chip ────────────────────────────────────────────

export function statusChipCls(status: SEPRecordExt["statusInternal"]): string {
  const map: Record<SEPRecordExt["statusInternal"], string> = {
    Issued:  "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    Closed:  "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    Updated: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
    Suplesi: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    Deleted: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
    Draft:   "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
  };
  return map[status];
}

// ── Display helpers ────────────────────────────────────────

export function jnsLabel(kode: "1" | "2"): string {
  return kode === "1" ? "Rawat Inap" : "Rawat Jalan";
}

export function klsLabel(kode: "1" | "2" | "3"): string {
  return `Kelas ${kode}`;
}

export function asalLabel(kode: "1" | "2"): string {
  return kode === "1" ? "FKTP" : "FKRTL";
}

export function fmtTgl(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

// ── Error label ────────────────────────────────────────────

export function errorLabel(err: BPJSError): {
  title: string;
  desc: string;
  color: "slate" | "amber" | "rose";
  retryable: boolean;
} {
  if (err.type === "BPJSMetaError") {
    const e = err as BPJSMetaError;
    if (e.code === "201")
      return { title: "SEP Tidak Ditemukan", desc: "Nomor SEP tidak terdaftar di V-Claim BPJS.", color: "slate", retryable: false };
    if (e.code === "204")
      return { title: "Validasi Gagal", desc: e.message, color: "amber", retryable: false };
    return { title: `Error BPJS ${e.code}`, desc: e.message, color: "rose", retryable: e.retryable };
  }
  return {
    title: "Gagal Terhubung ke V-Claim",
    desc: "Sambungan ke server BPJS terputus. Periksa koneksi dan coba lagi.",
    color: "rose",
    retryable: true,
  };
}

// ── Validation ─────────────────────────────────────────────

export function validateNoSEP(value: string): string | null {
  if (!value.trim()) return "Wajib diisi";
  if (value.trim().length < 5) return "No. SEP terlalu pendek";
  return null;
}

// ── Sample data ────────────────────────────────────────────

export const SAMPLE_SEP = [
  { label: "Issued RI (I21.0)",   value: "SEP-2026-0501-00012" },
  { label: "Issued RJ (I10)",     value: "SEP-2026-0510-00033" },
  { label: "Closed (I20.9)",      value: "SEP-2026-0411-00990" },
  { label: "Updated (K80.2)",     value: "SEP-2026-0428-01015" },
  { label: "Suplesi KLL (S06.0)", value: "SEP-2026-0510-01030" },
  { label: "Deleted (R51)",       value: "SEP-2026-0405-00890" },
] as const;
