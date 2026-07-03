// Zod kontrak Rencana Kontrol / SPRI (V-Claim). Validasi request sebelum kirim ke BPJS.
// Wire format BPJS: body = `{ "request": <payload> }`. Lihat docs/BPJS-WS-RULES.md.

import { z } from "zod";
import type { InsertSPRIPayload, UpdateSPRIPayload, DeleteRKPayload } from "@/lib/bpjs/bpjsContracts";

/** yyyy-MM-dd. */
const TGL = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus yyyy-MM-dd");

/**
 * RencanaKontrol/InsertSPRI — request. Output cocok `InsertSPRIPayload` (cek tipe di bawah).
 * `kodeDokter` = kode dokter DPJP **BPJS** (referensi dokter DPJP) — saat ini bisa kosong
 * (mapping internal→BPJS belum ada; lihat TECH_DEBT). `poliKontrol` = kode poli BPJS.
 */
export const InsertSPRIRequestSchema = z.object({
  noKartu: z.string().trim().min(1, "No. Kartu wajib"),
  kodeDokter: z.string().trim().default(""),
  poliKontrol: z.string().trim().default(""),
  tglRencanaKontrol: TGL,
  user: z.string().trim().min(1, "User pembuat wajib"),
});

// Cek statis: output schema ⊆ InsertSPRIPayload (gagal compile bila kontrak menyimpang).
const _typecheck: InsertSPRIPayload = {} as z.infer<typeof InsertSPRIRequestSchema>;
void _typecheck;

export type InsertSPRIRequest = z.infer<typeof InsertSPRIRequestSchema>;

/** Bungkus wire format BPJS: `{ request: <payload> }`. */
export function toSpriWire(payload: InsertSPRIPayload): { request: InsertSPRIPayload } {
  return { request: payload };
}

/**
 * RencanaKontrol/insert — request surat kontrol pasca-pulang (doc resmi; pakai `noSEP`, beda
 * dari SPRI yang pakai noKartu). Semua field WAJIB terisi — BPJS menolak yang kosong; validasi
 * di Service SEBELUM connector dipanggil (mock selalu sukses, tapi kontrak tetap ditegakkan
 * agar swap ke sandbox/prod zero-refactor). formPRB tidak dikirim (non-PRB; PRB = fase later).
 */
export const InsertRencanaKontrolRequestSchema = z.object({
  noSEP: z.string().trim().min(1, "No. SEP wajib"),
  kodeDokter: z.string().trim().min(1, "Kode dokter BPJS wajib"),
  poliKontrol: z.string().trim().min(1, "Kode poli BPJS wajib"),
  tglRencanaKontrol: TGL,
  user: z.string().trim().min(1, "User pembuat wajib"),
});
export type InsertRencanaKontrolRequest = z.infer<typeof InsertRencanaKontrolRequestSchema>;

/** RencanaKontrol/insert wire: `{ request: <payload> }`. */
export function toRencanaKontrolWire(
  payload: InsertRencanaKontrolRequest,
): { request: InsertRencanaKontrolRequest } {
  return { request: payload };
}

/**
 * RencanaKontrol/UpdateSPRI — request (PUT). `noSPRI` = No. Referensi SPRI yang diperbarui.
 * Field editable selaras BPJS: kodeDokter (DPJP) · poliKontrol · tglRencanaKontrol.
 */
export const UpdateSPRIRequestSchema = z.object({
  noSPRI: z.string().trim().min(1, "No. SPRI wajib"),
  kodeDokter: z.string().trim().default(""),
  poliKontrol: z.string().trim().default(""),
  tglRencanaKontrol: TGL,
  user: z.string().trim().min(1, "User wajib"),
});
const _tcUpd: UpdateSPRIPayload = {} as z.infer<typeof UpdateSPRIRequestSchema>;
void _tcUpd;

/** UpdateSPRI wire: `{ request: <payload> }`. */
export function toSpriUpdateWire(payload: UpdateSPRIPayload): { request: UpdateSPRIPayload } {
  return { request: payload };
}

/** Delete RK/SPRI wire: `{ request: { t_suratkontrol: <payload> } }`. */
export function toSpriDeleteWire(payload: DeleteRKPayload): { request: { t_suratkontrol: DeleteRKPayload } } {
  return { request: { t_suratkontrol: payload } };
}
