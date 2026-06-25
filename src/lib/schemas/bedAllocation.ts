// Zod schema + DTO BedAllocation (okupansi/reservasi bed). Sumber kebenaran okupansi:
// 1 baris = 1 bed dipakai 1 kunjungan. "Tersedia" dihitung (bed aktif − alokasi aktif).
// Vocab = kanonik (mirror enum Prisma encounter.AllocStatus).

import { z } from "zod";
import { LocationType } from "@/lib/schemas/ruangan";

export const AllocStatus = z.enum(["Reserved", "Occupied", "Released"]);
export type AllocStatus = z.infer<typeof AllocStatus>;

/** Status yang "memakai" bed (keluar dari hitungan tersedia & masuk partial unique index). */
export const ACTIVE_ALLOC_STATUS = ["Reserved", "Occupied"] as const;

// ── Query alokasi aktif (GET /bed-allocations) ─────────────────────────────────
export const ActiveAllocationQuery = z.object({
  /** Filter bed milik Location tipe ini (mis. IGD) — join bed→location di Service. */
  locationType: LocationType.optional(),
});
export type ActiveAllocationQuery = z.infer<typeof ActiveAllocationQuery>;

// ── DTO ────────────────────────────────────────────────────────────────────────
export interface BedAllocationDTO {
  id: string;
  bedId: string;
  kunjunganId: string;
  status: AllocStatus;
  reservedAt: string; // ISO
  occupiedAt: string | null;
  releasedAt: string | null;
  // ── Okupansi (enrichment read: bed-map visual "siapa mengisi") — opsional ──
  /** No. kunjungan pemakai bed (audit/tooltip). */
  kunjunganNo?: string | null;
  /** Nama pasien yang memakai bed (tampilan bed-map). */
  pasienNama?: string | null;
  /** No. RM pasien pemakai bed. */
  pasienNoRm?: string | null;
}
