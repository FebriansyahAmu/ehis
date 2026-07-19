// Zod input + DTO — Master Tarif Ruang Rawat (schema "master"). Mapping Hub → Tarif (sub-tab Ruang Rawat).
// Edge = (kelas × penjaminKode) → harga/hari. UPSERT by pair (idempoten value). Pola paralel tarifLabTest.
// Lihat tarifKamar.prisma + docs/BACKEND-MAPPING.md §5.

import { z } from "zod";

// Kelas kamar — selaras enum RIKelas. String longgar (bukan enum FK; validasi allow-list di bawah).
export const KELAS_KAMAR = ["VIP", "Kelas_1", "Kelas_2", "Kelas_3", "ICU", "HCU", "Isolasi"] as const;
const kelas = z.enum(KELAS_KAMAR);
// Kode penjamin (UMUM/BPJS/…). Belum FK; FE pakai kode stabil dari TARIF_PENJAMIN.
const penjaminKode = z.string().trim().min(1).max(20);
// Komponen tarif (PMK 85). Opsional: kirim → mode breakdown (harga = jumlah komponen di Service);
// absen → mode total-only (komponen di-null-kan).
const komponen = z.coerce.number().int().min(0, "Komponen tak boleh negatif").max(2_000_000_000).optional();
// Metadata SK penetapan tarif (opsional). tglSk = tanggal saja (YYYY-MM-DD).
const noSk = z.string().trim().max(80).optional();
const tglSk = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD").optional();

// ── Upsert satu tarif kamar (POST /master/tarif-kamar) — idempoten by (kelas, penjamin) ──
export const UpsertTarifKamarInput = z.object({
  kelas,
  penjaminKode,
  harga: z.coerce.number().int().min(0, "Harga tak boleh negatif").max(2_000_000_000),
  jasaSarana: komponen,
  jasaMedis: komponen,
  jasaParamedis: komponen,
  noSk,
  tglSk,
});
export type UpsertTarifKamarInput = z.infer<typeof UpsertTarifKamarInput>;

// ── List/filter (GET /master/tarif-kamar) ─────────────────────────────────────
export const TarifKamarQuery = z.object({
  penjaminKode: penjaminKode.optional(),
  kelas: kelas.optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});
export type TarifKamarQuery = z.infer<typeof TarifKamarQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO output ────────────────────────────────────────────────────────────────
export interface TarifKamarDTO {
  id: string;
  kelas: string;
  penjaminKode: string;
  harga: number;
  /** Komponen tarif (PMK 85). null = belum dirinci (mode total-only). */
  jasaSarana: number | null;
  jasaMedis: number | null;
  jasaParamedis: number | null;
  /** Metadata SK penetapan tarif (opsional). tglSk = "YYYY-MM-DD". */
  noSk: string | null;
  tglSk: string | null;
}
