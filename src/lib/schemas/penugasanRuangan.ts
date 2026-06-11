// Zod schema + DTO Penugasan Ruangan (master/SDM Assignment) — FLOWS §5.
// Link Pegawai ⇄ Ruangan(Location). Input = pasangan id (+ peran opsional); identitas &
// nama ruangan dibaca via join (read-only di DTO). Lihat penugasanRuangan.prisma.

import { z } from "zod";

// ── Create (POST /master/penugasan-ruangan) ──────────────────────────────────
export const CreatePenugasanInput = z.object({
  pegawaiId: z.string().uuid("pegawaiId tidak valid"),
  locationId: z.string().uuid("locationId tidak valid"),
  peran: z.string().trim().max(80).optional(),
});
export type CreatePenugasanInput = z.infer<typeof CreatePenugasanInput>;

// ── List/filter (GET /master/penugasan-ruangan) ──────────────────────────────
export const ListQuery = z.object({
  locationId: z.string().uuid().optional(),
  pegawaiId: z.string().uuid().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListQuery = z.infer<typeof ListQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });

// ── Roster petugas kunjungan (GET /kunjungan/:id/petugas) ─────────────────────
// Konsumen klinis (dropdown PJ triase / DPJP): petugas = pegawai aktif yang DITUGASKAN
// ke ruangan kunjungan (SDM Assignment). Gate `registration.kunjungan:read`, BUKAN
// `master.pegawai` (role klinis tak boleh baca master SDM penuh).
export const PetugasQuery = z.object({
  profesi: z.string().trim().min(1).max(60).optional(), // exact, mis. "Perawat"
});
export type PetugasQuery = z.infer<typeof PetugasQuery>;

export interface PetugasDTO {
  pegawaiId: string;
  namaTampil: string;
  profesi: string | null;
  /** Ruangan asal penugasan — null bila fallback lintas-ruangan (kunjungan tanpa ruangan). */
  ruanganKode: string | null;
  ruanganNama: string | null;
}

// ── DTO output (identitas & ruangan dari join; entity Prisma tak bocor) ───────
export interface PenugasanRuanganDTO {
  id: string;
  pegawaiId: string;
  namaTampil: string;   // gelarDepan + nama + gelarBelakang
  nip: string;
  profesi: string | null;
  locationId: string;
  ruanganKode: string;
  ruanganNama: string;
  peran: string | null;
  createdAt: string;    // "ditugaskan sejak"
}
