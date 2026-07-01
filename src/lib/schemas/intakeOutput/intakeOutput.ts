// Zod schema + DTO — Intake/Output (Balance Cairan). Vocab mirror IOEntry/IOTargetDPJP FE
// (lib/data.ts) → zero-refactor wiring. Entri append-only time-series (waktu timestamptz →
// tanggal/jam di DTO); target latest-wins. Normalisasi/derivasi di Service.

import { z } from "zod";

// ── Vocab terkontrol ──────────────────────────────────────────────────────────
export const IOTipe = z.enum(["intake", "output"]);
export type IOTipe = z.infer<typeof IOTipe>;

export const IOShift = z.enum(["Pagi", "Siang", "Malam"]);
export type IOShift = z.infer<typeof IOShift>;

// Gabungan IntakeKategori + OutputKategori (Lainnya berbagi). Konsistensi dgn tipe = soft (FE).
export const IOKategori = z.enum([
  "Oral", "IV", "NGT", "Transfusi",
  "Urine", "Drainase", "Feses", "Muntah", "Perdarahan",
  "Lainnya",
]);
export type IOKategori = z.infer<typeof IOKategori>;

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

// ── Entri (POST /kunjungan/:id/intake-output) ─────────────────────────────────
export const IOEntryInput = z.object({
  // ISO atau "YYYY-MM-DDTHH:mm" (datetime-local). Kosong → Service pakai now().
  waktu: optStr,
  shift: IOShift.optional(), // absen → diturunkan dari waktu
  tipe: IOTipe,
  kategori: IOKategori,
  subKategori: optStr,
  volume: z.coerce.number().int("Volume harus bilangan bulat").min(1, "Volume minimal 1 mL").max(50000, "Volume tidak wajar"),
  catatan: optStr,
  pencatat: optStr, // default nama actor di Service
});
export type IOEntryInput = z.infer<typeof IOEntryInput>;

// ── Target (PUT /kunjungan/:id/intake-output/target) ──────────────────────────
//  Set penuh: field absen → null (bersihkan). targetBalance boleh negatif (target defisit).
export const IOTargetInput = z.object({
  restriksiIntake: z.coerce.number().int().min(0).max(50000).optional(),
  targetBalance: z.coerce.number().int().min(-50000).max(50000).optional(),
  catatan: optStr,
  updatedBy: optStr, // default nama actor di Service
});
export type IOTargetInput = z.infer<typeof IOTargetInput>;

export const IdParam = z.object({ id: z.string().uuid() });
export const ItemParam = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });
export type ItemParam = z.infer<typeof ItemParam>;

// ── DTO (mirror IOEntry / IOTargetDPJP / IntakeOutputData) ────────────────────
export interface IOEntryDTO {
  id: string;
  waktu: string;   // "HH:MM"
  tanggal: string; // "YYYY-MM-DD"
  shift: IOShift;
  tipe: IOTipe;
  kategori: IOKategori;
  subKategori?: string;
  volume: number;  // mL
  catatan?: string;
}

export interface IOTargetDTO {
  restriksiIntake?: number;
  targetBalance?: number;
  catatan?: string;
  updatedBy?: string;
  updatedAt?: string; // ISO
}

export interface IntakeOutputDTO {
  entries: IOEntryDTO[];
  target: IOTargetDTO | null;
}
