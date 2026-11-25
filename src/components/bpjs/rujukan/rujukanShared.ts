// Helper modul Rujukan (V-Claim): pencarian rujukan masuk (No. rujukan / No. kartu, FKTP + FKRTL
// sekaligus), masa berlaku, label galat, dan data uji. Warna badge mengikuti peta bersama
// (bpjs/shared/badge): teal = rujukan, emerald = berlaku, amber = segera berakhir, rose =
// kedaluwarsa, cyan/sky = rawat inap/jalan, slate = netral (asal faskes, tipe rujukan).

import type { BPJSError, RujukanRecord } from "@/lib/bpjs/bpjsShared";
import type { BadgeTone } from "@/components/bpjs/shared/badge";
import { fmtTglPendek, hariIniISO, selisihHari } from "@/components/bpjs/shared/tanggal";
import { labelGalat as labelGalatVClaim } from "@/components/bpjs/shared/galat";

export type Asal = "FKTP" | "FKRTL";

export const ASAL_LABEL: Record<Asal, string> = {
  FKTP: "FKTP · puskesmas/klinik",
  FKRTL: "FKRTL · rumah sakit",
};

export function jenisPelayanan(kode: string): { label: string; tone: BadgeTone } {
  return kode === "1" ? { label: "Rawat inap", tone: "cyan" } : { label: "Rawat jalan", tone: "sky" };
}

// ── Pencarian rujukan masuk ───────────────────────────────

export const PANJANG_KARTU = 13;

/** 13 digit angka = No. kartu; selain itu dianggap No. rujukan (format V-Claim alfanumerik). */
export type ModeCari = "kartu" | "rujukan";

export function modeDari(q: string): ModeCari {
  return /^\d+$/.test(q) ? "kartu" : "rujukan";
}

export function validasiCari(q: string): string | null {
  if (!q) return "Isi No. rujukan atau No. kartu BPJS";
  if (/^\d+$/.test(q) && q.length !== PANJANG_KARTU) return `No. kartu harus ${PANJANG_KARTU} digit, baru ${q.length}`;
  if (q.length < 5) return "No. rujukan terlalu pendek, periksa lagi";
  return null;
}

export type HasilMasuk =
  | { status: "idle" }
  | { status: "loading"; q: string; mode: ModeCari }
  | {
      status: "done";
      q: string;
      mode: ModeCari;
      list: RujukanRecord[];
      /** Asal yang gagal dimuat (bukan "tidak ditemukan") — hasil asal lain tetap tampil. */
      gagal: { asal: Asal; error: BPJSError }[];
    };

/** Urut terbaru dulu (tanggal rujukan). */
export function urutTerbaru(list: RujukanRecord[]): RujukanRecord[] {
  return [...list].sort((a, b) => b.tglRujukan.localeCompare(a.tglRujukan));
}

// ── Masa berlaku ──────────────────────────────────────────

export interface StatusBerlaku {
  tone: BadgeTone;
  label: string;
  detail: string;
  /** Porsi masa berlaku yang sudah lewat, 0–100 (null bila tak bisa dihitung). */
  persen: number | null;
}

/** Status masa berlaku dari tanggal mulai–akhir terhadap hari ini (lokal). */
export function statusBerlaku(dari: string | null | undefined, sampai: string | null | undefined): StatusBerlaku {
  const hari = hariIniISO();
  const sisa = selisihHari(hari, sampai);
  const lewat = selisihHari(dari, hari);
  const total = selisihHari(dari, sampai);
  const persen = total && total > 0 && lewat !== null ? Math.min(100, Math.max(0, Math.round((lewat / total) * 100))) : null;
  if (sisa === null) return { tone: "slate", label: "Tanpa masa berlaku", detail: "Tanggal akhir tidak tercantum", persen: null };
  if (sisa < 0) return { tone: "rose", label: "Kedaluwarsa", detail: `Berakhir ${fmtTglPendek(sampai)} · ${-sisa} hari lalu`, persen: 100 };
  if (lewat !== null && lewat < 0) return { tone: "sky", label: "Belum berlaku", detail: `Mulai ${fmtTglPendek(dari)}`, persen: 0 };
  if (sisa <= 7) return { tone: "amber", label: "Segera berakhir", detail: sisa === 0 ? "Berakhir hari ini" : `Sisa ${sisa} hari`, persen };
  return { tone: "emerald", label: "Berlaku", detail: `Sisa ${sisa} hari`, persen };
}

// ── Galat ─────────────────────────────────────────────────

// Galat koneksi & label galat kini bersama modul BPJS (bpjs/shared/galat) — diekspor ulang.
export { GALAT_KONEKSI } from "@/components/bpjs/shared/galat";

/** Label galat V-Claim untuk modul Rujukan (errorLabel SEP menyebut "SEP" untuk kode 201). */
export function labelGalat(err: BPJSError, objek = "Rujukan") {
  return labelGalatVClaim(err, objek);
}

// ── Data uji (mock) ───────────────────────────────────────

export const SAMPLE_CARI = [
  { label: "No. kartu · 3 rujukan", hint: "Siti Rahayu · ada yang masih berlaku", value: "0001234567892" },
  { label: "No. kartu · 2 rujukan", hint: "Joko Prasetyo · FKTP + FKRTL", value: "0001234567891" },
  { label: "No. rujukan FKTP", hint: "PKM Mawar · Mei 2026", value: "RUJ/FKTP-Mawar/2026/05/0023" },
  { label: "No. rujukan FKRTL", hint: "RS Citra Husada · Mei 2026", value: "RUJ/FKRTL-Citra/2026/05/0011" },
] as const;

/** Periode yang punya data di mock rujukan keluar & khusus. */
export const PERIODE_UJI = { bulan: 5, tahun: 2026 } as const;
