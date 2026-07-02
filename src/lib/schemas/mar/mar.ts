// Zod schema + DTO — MAR (Medication Administration Record per shift, tab MAR RI, SNARS PKPO 6).
// Vocab mirror MAREntry FE (lib/data.ts) → zero-refactor wiring. Entri append-only "latest wins"
// per (resepItemId × tanggal × shift); baris obat diturunkan dari ResepItem order non-batal
// (MarObatDTO). HAM + Diberikan wajib perawat2 — ditegakkan Service (butuh isHAM item DB).

import { z } from "zod";

// ── Vocab terkontrol ──────────────────────────────────────────────────────────
export const MarShift = z.enum(["Pagi", "Siang", "Malam"]);
export type MarShift = z.infer<typeof MarShift>;

// "NA" (Tidak Berlaku) = render-only FE, tidak pernah disimpan.
export const MarStatus = z.enum(["Diberikan", "Ditunda", "Ditolak", "TidakTersedia"]);
export type MarStatus = z.infer<typeof MarStatus>;

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

// ── Entri (POST /kunjungan/:id/mar) ───────────────────────────────────────────
export const MarEntryInput = z.object({
  resepItemId: z.string().uuid("resepItemId harus UUID"),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus YYYY-MM-DD"),
  shift: MarShift,
  status: MarStatus,
  waktuPemberian: z.string().regex(/^\d{2}:\d{2}$/, "Waktu harus HH:mm").optional(),
  perawat: optStr,  // default nama actor di Service (server otoritatif)
  perawat2: optStr, // verifikator ke-2 — wajib saat item HAM + status Diberikan
  catatan: optStr,
});
export type MarEntryInput = z.infer<typeof MarEntryInput>;

export const IdParam = z.object({ id: z.string().uuid() });

// ── DTO ───────────────────────────────────────────────────────────────────────

/** Baris obat MAR — diturunkan dari ResepItem order non-batal kunjungan (bukan tabel sendiri). */
export interface MarObatDTO {
  id: string;       // ResepItem.id (key entri)
  namaObat: string;
  dosis: string;
  rute: string;
  signa: string;
  kategori: string; // Reguler/Narkotika/Psikotropika (snapshot resep)
  isHAM: boolean;
  aktif: boolean;   // order non-batal
}

/** Entri pemberian — mirror MAREntry FE (+ perawat2 double-check HAM). */
export interface MarEntryDTO {
  id: string;
  resepItemId: string;
  tanggal: string; // "YYYY-MM-DD"
  shift: MarShift;
  status: MarStatus;
  waktuPemberian?: string; // "HH:mm"
  perawat?: string;
  perawat2?: string;
  catatan?: string;
}

/** Agregat GET /kunjungan/:id/mar. entries = sudah direduksi latest-wins per slot. */
export interface MarDTO {
  items: MarObatDTO[];
  entries: MarEntryDTO[];
}
