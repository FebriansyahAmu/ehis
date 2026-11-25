// Galat V-Claim bersama modul BPJS (Rujukan, Monitoring, …): galat koneksi standar dan label
// galat yang ramah petugas. Kode 201 = data tidak ditemukan (untuk endpoint daftar artinya
// daftar kosong, bukan galat), 204 = validasi gagal, kode lain = BPJS menolak permintaan.

import type { BPJSError } from "@/lib/bpjs/bpjsShared";

export const GALAT_KONEKSI: BPJSError = {
  type: "BPJSMetaError",
  code: "503",
  message: "Koneksi ke V-Claim gagal",
  endpoint: "",
  retryable: true,
};

/** Respons sukses tanpa isi diperlakukan sama dengan kode 201. */
export const GALAT_TIDAK_ADA: BPJSError = {
  type: "BPJSMetaError",
  code: "201",
  message: "Data tidak ditemukan di V-Claim",
  endpoint: "",
  retryable: false,
};

export function labelGalat(
  err: BPJSError,
  objek = "Data",
): {
  title: string;
  desc: string;
  kode: string | null;
  retryable: boolean;
} {
  if (err.type === "BPJSMetaError") {
    if (err.code === "201") return { title: `${objek} tidak ditemukan`, desc: err.message, kode: err.code, retryable: false };
    if (err.code === "204") return { title: "Validasi gagal", desc: err.message, kode: err.code, retryable: false };
    return { title: "BPJS menolak permintaan", desc: err.message, kode: err.code, retryable: err.retryable };
  }
  return {
    title: "Gagal terhubung ke V-Claim",
    desc: "Sambungan ke server BPJS terputus. Periksa koneksi lalu coba lagi.",
    kode: null,
    retryable: true,
  };
}

/** Kode 201 ("data tidak ditemukan") pada endpoint daftar = daftar kosong, bukan galat. */
export function tidakDitemukan(err: BPJSError): boolean {
  return err.type === "BPJSMetaError" && err.code === "201";
}
