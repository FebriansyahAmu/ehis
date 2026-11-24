// Helper tab Fingerprint (V-Claim): cek status validasi sidik jari peserta (GET /SEP/FingerPrint/
// Peserta/{noKartu}/TglPelayanan/{tgl}), daftar peserta yang sudah validasi per tanggal (GET /SEP/
// FingerPrint/list/tglPelayanan/{tgl}), dan verifikasi alternatif lewat pertanyaan acak (Random
// Question → Random Answer) bila sidik jari peserta tidak terbaca.

import type { BPJSError, FingerPrintResponse } from "@/lib/bpjs/bpjsShared";
import { findPesertaByKartu } from "@/lib/bpjs/mock/pesertaMock";

export type HasilFingerprint =
  | { status: "idle" }
  | { status: "loading"; kartu: string; tgl: string }
  | { status: "done"; kartu: string; tgl: string; data: FingerPrintResponse }
  | { status: "error"; kartu: string; tgl: string; error: BPJSError };

/** Kunci satu pemeriksaan (kartu + tanggal) — dipakai menandai verifikasi alternatif. */
export function kunciCek(kartu: string, tgl: string): string {
  return `${kartu}|${tgl}`;
}

/**
 * Nama peserta untuk menegaskan identitas di hasil & daftar. V-Claim fingerprint hanya
 * mengembalikan No. kartu (+ No. SEP), jadi nama dicari terpisah — sementara dari mock peserta
 * (TECH_DEBT: ganti ke data pasien/SEP lokal saat backend BPJS nyata).
 */
export function namaPeserta(noKartu: string): string | null {
  return findPesertaByKartu(noKartu)?.nama ?? null;
}

export { geserHari } from "@/components/bpjs/shared/tanggal";

/** Pesan galat ringkas (judul errorLabel menyebut "SEP" untuk kode 201 — tak cocok di sini). */
export function pesanGalat(err: BPJSError): string {
  if (err.type === "BPJSMetaError") return err.message;
  return "Koneksi ke V-Claim gagal. Periksa jaringan lalu coba lagi.";
}

// ── Data uji (mock) ───────────────────────────────────────

export const SAMPLE_FINGERPRINT = [
  { label: "Sudah sidik jari", hint: "Joko Prasetyo", value: "0001234567891" },
  { label: "Belum · Siti Rahayu", hint: "Lahir 21 Mar 1992 · FKTP PKM Mawar", value: "0001234567892" },
  { label: "Belum · Dewi Lestari", hint: "Lahir 14 Feb 1990 · FKTP Klinik Sehat Pratama", value: "0001234567898" },
] as const;

/** Tanggal yang punya data di mock List Finger Print. */
export const TGL_UJI = ["2026-05-01", "2026-05-10", "2026-05-17"] as const;
