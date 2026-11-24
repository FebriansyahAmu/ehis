/**
 * SEP — tipe, helper, peta badge & data uji. Aksen modul: emerald (TONE_PALETTE_BPJS).
 *
 * Warna badge punya ARTI TETAP di seluruh halaman SEP (selalu disertai teks):
 *   emerald = terbit · blue = diperbarui · slate = ditutup/draf/kelas hak · rose = dihapus
 *   cyan = rawat inap · sky = rawat jalan · teal = rujukan
 *   amber = kecelakaan/suplesi (penjamin lain) · indigo = pembiayaan tambahan (eksekutif,
 *   naik kelas, COB)
 *
 * jnsLabel/asalLabel juga dipakai lembar cetak SEP (SEPCetakTemplate).
 */
import type { BPJSError, BPJSMetaError, SEPRecordExt, SEPStatusInternal } from "@/lib/bpjs/bpjsShared";
import type { BadgeTone } from "@/components/bpjs/shared/badge";

// Helper tanggal kini bersama modul BPJS (dipakai juga Rujukan) — diekspor ulang agar import lama tetap jalan.
export { fmtTgl, fmtTglPendek, fmtWaktu, hariIniISO, parseTgl, selisihHari, sisaHari } from "@/components/bpjs/shared/tanggal";

// ── Result shapes ─────────────────────────────────────────

export type SEPResult =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; sep: SEPRecordExt }
  | { status: "error"; error: BPJSError };

// ── Badge bermakna (peta warna bersama modul BPJS) ───────

export { BADGE, DOT, type BadgeTone } from "@/components/bpjs/shared/badge";

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
