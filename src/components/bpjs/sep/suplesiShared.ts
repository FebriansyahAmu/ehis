// Helper tab Suplesi Jasa Raharja (V-Claim): potensi suplesi (GET /sep/JasaRaharja/Suplesi/
// {noKartu}/tglPelayanan/{tgl}) + data induk kecelakaan (GET /sep/KllInduk/List/{noKartu}).
// Konteks domain → docs/SEP-KLL-JASARAHARJA.md: Jasa Raharja menjamin biaya perawatan KLL
// sampai Rp 20 jt; sisanya dijamin BPJS lewat SEP suplesi (suplesi=1, noSepSuplesi = SEP awal).

import type { BPJSError, DataIndukKecelakaanItem, SuplesiJaminanItem } from "@/lib/bpjs/bpjsShared";
import { hariIniISO } from "./sepShared";

export const PANJANG_KARTU = 13;

export function validasiKartu(v: string): string | null {
  if (!v) return "Isi nomor kartu BPJS";
  if (!/^\d+$/.test(v)) return "Nomor kartu hanya berisi angka";
  if (v.length !== PANJANG_KARTU) return `Nomor kartu harus ${PANJANG_KARTU} digit, baru ${v.length}`;
  return null;
}

export function validasiTglPelayanan(v: string): string | null {
  if (!v) return "Pilih tanggal pelayanan";
  if (v > hariIniISO()) return "Tanggal pelayanan tidak boleh melewati hari ini";
  return null;
}

export const SAMPLE_KARTU = [
  { label: "KLL · gegar otak", value: "0001234567899" },
  { label: "Kecelakaan kerja · fraktur", value: "0001234567812" },
  { label: "Tanpa riwayat kecelakaan", value: "0001234567891" },
];

/** `noSEPSuplesi` dari V-Claim = CSV atau null → daftar nomor. */
export function pisahSuplesi(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Jarak tanggal kejadian ke tanggal pelayanan, mis. "12 hari sebelum pelayanan". */
export function labelJarak(hari: number | null): string | null {
  if (hari === null) return null;
  if (hari === 0) return "Di hari pelayanan";
  return hari > 0 ? `${hari} hari sebelum pelayanan` : `${-hari} hari setelah tanggal pelayanan`;
}

// ── Hasil pemeriksaan (dua panggilan independen) ──────────

export type Bagian<T> = { ok: true; data: T } | { ok: false; error: BPJSError };

export type HasilSuplesi =
  | { status: "idle" }
  | { status: "loading"; kartu: string }
  | {
      status: "done";
      kartu: string;
      tgl: string;
      potensi: Bagian<SuplesiJaminanItem[]>;
      induk: Bagian<DataIndukKecelakaanItem[]>;
    };

export const GALAT_KONEKSI: BPJSError = {
  type: "BPJSMetaError",
  code: "503",
  message: "Koneksi ke V-Claim gagal",
  endpoint: "",
  retryable: true,
};
