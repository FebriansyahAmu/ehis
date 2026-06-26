// Kontrak referensi BPJS (V-Claim) — dokter DPJP & spesialistik. Dipakai sync service (BWS3).
// Response BPJS: { metaData, response: { list: [{ kode, nama }] } }. Connector sudah membuka
// envelope → di sini kita parse field `response` (objek { list }).

import { z } from "zod";
import type { KodeNamaItem } from "@/lib/bpjs/bpjsContracts";

/** Item referensi BPJS: { kode, nama } (reuse KodeNamaItem). */
export const RefKodeNamaSchema = z.object({
  kode: z.string(),
  nama: z.string(),
});

/** `response` dari endpoint referensi list: { list: [{kode,nama}] }. */
export const RefListResponseSchema = z.object({
  list: z.array(RefKodeNamaSchema).default([]),
});

export type RefListResponse = z.infer<typeof RefListResponseSchema>;

// Cek statis: item ⊆ KodeNamaItem.
const _typecheck: KodeNamaItem = {} as z.infer<typeof RefKodeNamaSchema>;
void _typecheck;

/** Jenis pelayanan param: 1=Rawat Inap, 2=Rawat Jalan. */
export type JenisPelayananParam = "1" | "2";

/**
 * Path referensi dokter DPJP (pengisian DPJP Layan):
 * `referensi/dokter/pelayanan/{jenisPelayanan}/tglPelayanan/{tgl}/Spesialis/{kodeSpesialis}` (GET).
 */
export function refDokterPelayananPath(
  jenisPelayanan: JenisPelayananParam,
  tglPelayanan: string, // yyyy-MM-dd
  kodeSpesialis: string,
): string {
  return `referensi/dokter/pelayanan/${jenisPelayanan}/tglPelayanan/${tglPelayanan}/Spesialis/${encodeURIComponent(kodeSpesialis)}`;
}

/** Path referensi spesialistik (GET): `referensi/spesialistik`. */
export function refSpesialistikPath(): string {
  return "referensi/spesialistik";
}
