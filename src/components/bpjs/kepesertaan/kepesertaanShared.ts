/**
 * Kepesertaan — tipe, validasi, format & helper bersama halaman Cek Kepesertaan V-Claim.
 * Aksen: sky (TONE_PALETTE_BPJS). Tanggal dihitung dari tanggal LOKAL (bukan UTC) supaya
 * "hari ini" tidak bergeser di zona WIB/WITA/WIT.
 */

import type { BPJSError, BPJSMetaError, PesertaRecord } from "@/lib/bpjs/bpjsShared";

// ── Result & query ────────────────────────────────────────

export type SearchMode = "kartu" | "nik";

export interface Query {
  mode: SearchMode;
  value: string;
  /** yyyy-mm-dd */
  tgl: string;
}

export type KepesertaanResult =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; peserta: PesertaRecord }
  | { status: "error"; error: BPJSError };

/** Riwayat pencarian sesi — hanya di memori (berisi NIK, tidak disimpan ke browser). */
export interface RiwayatItem extends Query {
  id: string;
  at: number;
  nama: string | null;
  aktif: boolean | null;
  pesan: string | null;
}

export const PANJANG: Record<SearchMode, number> = { kartu: 13, nik: 16 };
export const LABEL_MODE: Record<SearchMode, string> = { kartu: "No. kartu", nik: "NIK" };

// ── Tanggal lokal ─────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseYmd(s: string | null | undefined): Date | null {
  if (!s) return null;
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function hariIni(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function geserHari(base: Date, n: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + n);
}

/** Rentang tanggal SEP yang diterima V-Claim untuk cek peserta. */
export const RENTANG_TGL = { mundur: 7, maju: 30 } as const;

const HARI_MS = 86_400_000;

export function selisihHari(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / HARI_MS);
}

// ── Validasi (dipanggil saat blur & submit, bukan saat mengetik) ──

export function validasiNomor(mode: SearchMode, value: string): string | null {
  const label = mode === "kartu" ? "Nomor kartu" : "NIK";
  if (!value) return `${label} wajib diisi`;
  if (!/^\d+$/.test(value)) return `${label} hanya berisi angka`;
  if (value.length !== PANJANG[mode]) return `${label} harus ${PANJANG[mode]} digit, baru ${value.length}`;
  return null;
}

export function validasiTgl(tgl: string): string | null {
  const d = parseYmd(tgl);
  if (!d) return "Tanggal SEP wajib diisi";
  const s = selisihHari(d, hariIni());
  if (s < -RENTANG_TGL.mundur || s > RENTANG_TGL.maju) {
    return `Tanggal SEP harus antara ${RENTANG_TGL.mundur} hari lalu dan ${RENTANG_TGL.maju} hari ke depan`;
  }
  return null;
}

// ── Format ────────────────────────────────────────────────

export function fmtTgl(iso: string | null | undefined): string {
  const d = parseYmd(iso);
  if (!d) return iso ? iso : "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function sexLabel(sex: "L" | "P"): string {
  return sex === "L" ? "Laki-laki" : "Perempuan";
}

export function inisial(nama: string): string {
  return nama.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const SINGKATAN = new Set(["PBI", "APBN", "APBD", "PBPU", "PNS", "TNI", "POLRI", "BUMN", "BUMD", "BP", "PPU", "FKTP", "DM", "HT"]);

/** "PBPU MANDIRI" → "PBPU Mandiri" — data BPJS huruf kapital semua dirapikan, singkatan tetap. */
export function rapikan(s: string | null | undefined): string {
  if (!s) return "—";
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (SINGKATAN.has(w.toUpperCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

// ── Masa berlaku ──────────────────────────────────────────

export interface MasaBerlaku {
  /** Sisa hari sampai TAT (negatif = lewat); null bila TAT kosong. */
  sisaHari: number | null;
  /** Porsi masa tanggungan yang tersisa, 0–1. */
  porsi: number;
}

export function masaBerlaku(tmt: string | null, tat: string | null): MasaBerlaku {
  const mulai = parseYmd(tmt);
  const akhir = parseYmd(tat);
  if (!akhir) return { sisaHari: null, porsi: 1 };
  const now = hariIni();
  const sisaHari = selisihHari(akhir, now);
  if (!mulai || akhir <= mulai) return { sisaHari, porsi: sisaHari > 0 ? 1 : 0 };
  const total = selisihHari(akhir, mulai);
  return { sisaHari, porsi: Math.min(1, Math.max(0, sisaHari / total)) };
}

// ── BPJSError → label tampilan ────────────────────────────

export function errorLabel(err: BPJSError): {
  title: string;
  desc: string;
  tone: "slate" | "amber" | "rose";
  retryable: boolean;
  kode: string | null;
} {
  if (err.type === "BPJSMetaError") {
    const e = err as BPJSMetaError;
    if (e.code === "201")
      return { title: "Peserta tidak ditemukan", desc: "Nomor kartu atau NIK tidak terdaftar di V-Claim BPJS.", tone: "slate", retryable: false, kode: e.code };
    if (e.code === "203")
      return { title: "Kepesertaan tidak aktif", desc: "Status peserta non-aktif. Kemungkinan menunggak iuran atau masa berlaku habis.", tone: "amber", retryable: false, kode: e.code };
    if (e.code === "204")
      return { title: "Validasi gagal", desc: e.message, tone: "rose", retryable: false, kode: e.code };
    return { title: "BPJS menolak permintaan", desc: e.message, tone: "rose", retryable: e.retryable, kode: e.code };
  }
  return {
    title: "Gagal terhubung ke V-Claim",
    desc: "Sambungan ke server BPJS terputus. Periksa koneksi lalu coba lagi.",
    tone: "rose",
    retryable: true,
    kode: null,
  };
}

// ── Data uji (mock) ───────────────────────────────────────

export const SAMPLE: Record<SearchMode, readonly { label: string; value: string }[]> = {
  kartu: [
    { label: "PBI aktif", value: "0001234567891" },
    { label: "Mandiri kelas 1", value: "0001234567895" },
    { label: "PNS kelas 1", value: "0001234567810" },
    { label: "COB swasta", value: "0001234567812" },
    { label: "Non-aktif (203)", value: "0001234567811" },
  ],
  nik: [
    { label: "Joko Prasetyo", value: "3171010103700001" },
    { label: "Sri Mulyani", value: "3174010182090012" },
    { label: "Andi Wijaya", value: "3175010188110007" },
  ],
};
