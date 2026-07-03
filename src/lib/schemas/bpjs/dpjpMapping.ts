// Schema + DTO halaman Mapping Hub "DPJP BPJS" (Dokter RS ↔ kode DPJP BPJS).

import { z } from "zod";

// ── Query/Input/Param ────────────────────────────────────────────────────────
export const RefDpjpQuery = z.object({
  search: z.string().trim().optional(),
  kodeSpesialis: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
export type RefDpjpQuery = z.infer<typeof RefDpjpQuery>;

export const SetDpjpMappingInput = z.object({
  refDpjpKode: z.string().trim().min(1, "Kode DPJP BPJS wajib"),
});
export type SetDpjpMappingInput = z.infer<typeof SetDpjpMappingInput>;

export const DokterIdParam = z.object({ dokterId: z.string().uuid() });

// ── DTO ───────────────────────────────────────────────────────────────────────
/** Baris board: 1 dokter RS + status mapping kode DPJP BPJS. */
export interface DpjpBoardRow {
  dokterId: string;
  pegawaiId: string;
  nama: string;
  spesialisKode: string;
  /** Kode DPJP BPJS yang ter-map (null = belum). */
  mapped: { kode: string; nama: string } | null;
}

/** Opsi picker referensi DPJP BPJS. */
export interface RefDpjpOption {
  kode: string;
  nama: string;
  kodeSpesialis: string | null;
  /** Sudah dipetakan ke dokter lain (dokterId) — null bila bebas. */
  mappedDokterId: string | null;
}

export interface SyncRefResult {
  spesialis: number;
  dpjp: number;
}

/** Konsumsi KLINIS (GET /master/dpjp-tersedia) — picker dokter + kode DPJP BPJS ter-map.
 *  Dipakai form yang butuh kodeDokter payload BPJS (mis. RencanaKontrol/insert Jadwal Kontrol). */
export interface DpjpTersediaDTO {
  dokterId: string;
  pegawaiId: string;
  nama: string;
  spesialisKode: string;
  /** Kode DPJP BPJS dari Mapping Hub DPJP BPJS. null = dokter belum di-map. */
  kodeBpjs: string | null;
}
