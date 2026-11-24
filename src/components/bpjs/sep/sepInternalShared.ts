// Helper tab SEP Internal (V-Claim GET /SEP/Internal/{noSEP} + DELETE /SEP/Internal/delete).
// SEP internal = rujukan internal ke poli/SMF lain di RS ini yang tercatat atas SEP induk.

import { SEP_MOCK } from "@/lib/bpjs/mock/sepMock";
import type { BPJSError, SEPInternalItem, SEPRecordExt } from "@/lib/bpjs/bpjsShared";
import { rapikan } from "@/components/bpjs/kepesertaan/kepesertaanShared";

/**
 * Daftar SEP untuk dipilih. MOCK: dibaca langsung dari `SEP_MOCK` — V-Claim tidak punya endpoint
 * "daftar SEP milik RS"; versi nyata membaca tabel SEP lokal (bpjs.SEP) lewat API RS sendiri.
 */
export function daftarSepPilihan(): SEPRecordExt[] {
  return SEP_MOCK.filter((s) => s.statusInternal !== "Deleted").sort((a, b) => b.tglTerbit.localeCompare(a.tglTerbit));
}

export function cocokSep(s: SEPRecordExt, q: string): boolean {
  if (!q) return true;
  const t = q.toLowerCase();
  return (
    s.noSEP.toLowerCase().includes(t) ||
    s.noKartu.includes(t) ||
    s.diagAwal.toLowerCase().includes(t) ||
    (s.diagAwalNama ?? "").toLowerCase().includes(t)
  );
}

/** Nama poli V-Claim (HURUF BESAR) → huruf judul, singkatan tetap. */
export const namaPoli = rapikan;

/** Kunci unik satu rujukan internal (untuk menandai yang sudah dihapus di sesi ini). */
export function kunciRujukan(noSep: string, it: SEPInternalItem): string {
  return `${noSep}|${it.nosurat}|${it.kdpolituj}`;
}

export type HasilInternal =
  | { status: "idle" }
  | { status: "loading"; no: string }
  | { status: "done"; no: string; list: SEPInternalItem[] }
  | { status: "error"; no: string; error: BPJSError };

export const GALAT_KONEKSI: BPJSError = {
  type: "BPJSMetaError",
  code: "503",
  message: "Koneksi ke V-Claim gagal",
  endpoint: "",
  retryable: true,
};
