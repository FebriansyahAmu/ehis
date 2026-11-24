/**
 * SEP — tipe, helper, peta badge & data uji. Aksen modul: emerald (TONE_PALETTE_BPJS).
 *
 * Warna badge punya ARTI TETAP di seluruh halaman SEP (selalu disertai teks):
 *   emerald = terbit · blue = diperbarui · slate = ditutup/draf/kelas hak · rose = dihapus
 *   cyan = rawat inap · sky = rawat jalan · teal = rujukan
 *   amber = kecelakaan/suplesi (penjamin lain) · indigo = pembiayaan tambahan (eksekutif,
 *   naik kelas, COB)
 *
 * Ekspor lama (statusChipCls, jnsLabel, …) dipertahankan untuk tab yang belum dirombak.
 */
import type { BPJSError, BPJSMetaError, SEPRecordExt, SEPStatusInternal } from "@/lib/bpjs/bpjsShared";

// ── Result shapes ─────────────────────────────────────────

export type SEPResult =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; sep: SEPRecordExt }
  | { status: "error"; error: BPJSError };

// ── Badge bermakna ────────────────────────────────────────

export type BadgeTone = "emerald" | "blue" | "slate" | "rose" | "cyan" | "sky" | "teal" | "amber" | "indigo";

export const BADGE: Record<BadgeTone, string> = {
  emerald: "bg-emerald-50 text-emerald-800",
  blue: "bg-blue-50 text-blue-800",
  slate: "bg-slate-100 text-slate-700",
  rose: "bg-rose-50 text-rose-800",
  cyan: "bg-cyan-50 text-cyan-800",
  sky: "bg-sky-50 text-sky-800",
  teal: "bg-teal-50 text-teal-800",
  amber: "bg-amber-50 text-amber-800",
  indigo: "bg-indigo-50 text-indigo-800",
};

export const DOT: Record<BadgeTone, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  slate: "bg-slate-400",
  rose: "bg-rose-500",
  cyan: "bg-cyan-500",
  sky: "bg-sky-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  indigo: "bg-indigo-500",
};

export const STATUS_META: Record<SEPStatusInternal, { label: string; tone: BadgeTone }> = {
  Draft: { label: "Draf", tone: "slate" },
  Issued: { label: "Terbit", tone: "emerald" },
  Updated: { label: "Diperbarui", tone: "blue" },
  Suplesi: { label: "Suplesi", tone: "amber" },
  Closed: { label: "Ditutup", tone: "slate" },
  Deleted: { label: "Dihapus", tone: "rose" },
};

/** SEP yang masih boleh dihapus / diubah tanggal pulangnya. */
export function sepTerbuka(status: SEPStatusInternal): boolean {
  return status !== "Deleted" && status !== "Closed";
}

export const LAKA_LABEL: Record<"1" | "2" | "3", string> = {
  "1": "Kecelakaan lalu lintas",
  "2": "KLL & kecelakaan kerja",
  "3": "Kecelakaan kerja",
};

export const NAIK_KELAS_LABEL: Record<string, string> = {
  "1": "VVIP",
  "2": "VIP",
  "3": "Kelas 1",
  "4": "Kelas 2",
  "5": "Kelas 3",
  "6": "ICCU",
  "7": "ICU",
  "8": "Di atas kelas 1",
};

export const PEMBIAYAAN_LABEL: Record<string, string> = {
  "1": "Pribadi",
  "2": "Pemberi kerja",
  "3": "Asuransi tambahan",
};

// ── Status chip lama (tab yang belum dirombak) ────────────

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

/** "yyyy-mm-dd" (atau ISO) → Date LOKAL tengah malam; tanggal-saja tidak digeser zona. */
export function parseTgl(s: string | null | undefined): Date | null {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtTgl(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseTgl(iso);
  if (!d) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

/** Tanggal ringkas, mis. "1 Mei 2026". */
export function fmtTglPendek(iso: string | null | undefined): string {
  const d = parseTgl(iso);
  return d ? d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

/** Instan (audit) → tanggal + jam zona lokal browser. */
export function fmtWaktu(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Selisih hari kalender dari hari ini (lokal) ke tanggal `iso`; null bila tak valid. */
export function sisaHari(iso: string | null | undefined): number | null {
  const d = parseTgl(iso);
  if (!d) return null;
  const n = new Date();
  const today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

// ── Error label ────────────────────────────────────────────

export function errorLabel(err: BPJSError): {
  title: string;
  desc: string;
  color: "slate" | "amber" | "rose";
  retryable: boolean;
  kode: string | null;
} {
  if (err.type === "BPJSMetaError") {
    const e = err as BPJSMetaError;
    if (e.code === "201")
      return { title: "SEP tidak ditemukan", desc: "Nomor SEP tidak terdaftar di V-Claim BPJS.", color: "slate", retryable: false, kode: e.code };
    if (e.code === "204")
      return { title: "Validasi gagal", desc: e.message, color: "amber", retryable: false, kode: e.code };
    return { title: "BPJS menolak permintaan", desc: e.message, color: "rose", retryable: e.retryable, kode: e.code };
  }
  return {
    title: "Gagal terhubung ke V-Claim",
    desc: "Sambungan ke server BPJS terputus. Periksa koneksi lalu coba lagi.",
    color: "rose",
    retryable: true,
    kode: null,
  };
}

// ── Validation ─────────────────────────────────────────────

export function validateNoSEP(value: string): string | null {
  if (!value.trim()) return "Nomor SEP wajib diisi";
  if (value.trim().length < 5) return "Nomor SEP terlalu pendek, periksa lagi";
  return null;
}

// ── Sample data (mock) ─────────────────────────────────────

export const SAMPLE_SEP = [
  { label: "Terbit · rawat inap", value: "SEP-2026-0501-00012" },
  { label: "Terbit · rawat jalan", value: "SEP-2026-0510-00033" },
  { label: "Ditutup", value: "SEP-2026-0411-00990" },
  { label: "Diperbarui", value: "SEP-2026-0428-01015" },
  { label: "Suplesi KLL", value: "SEP-2026-0510-01030" },
  { label: "Dihapus", value: "SEP-2026-0405-00890" },
] as const;
