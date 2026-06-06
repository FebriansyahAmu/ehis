// bedAllocationDal — akses Prisma MURNI domain encounter.BedAllocation. Tanpa aturan bisnis.
// Terima `tx?` (transaksi dimiliki Service). Status aktif = Reserved|Occupied (memakai bed).

import { db, type Tx } from "@/lib/db/prisma";

type AllocStatus = "Reserved" | "Occupied" | "Released";
const ACTIVE: AllocStatus[] = ["Reserved", "Occupied"];

export interface CreateAllocationData {
  bedId: string;
  kunjunganId: string;
  status: AllocStatus; // Reserved (RI daftar) | Occupied (IGD terima)
  occupiedAt?: Date;
}

export type BedAllocationEntity = Awaited<ReturnType<typeof findActiveByKunjungan>>;

// ── Create ───────────────────────────────────────────────────────────────────
export function create(data: CreateAllocationData, tx?: Tx) {
  return db(tx).bedAllocation.create({ data });
}

// ── Reads ──────────────────────────────────────────────────────────────────────
/** Alokasi aktif (Reserved/Occupied) — semua, atau dibatasi ke set bed tertentu. */
export function listActive(bedIds?: string[], tx?: Tx) {
  return db(tx).bedAllocation.findMany({
    where: {
      status: { in: ACTIVE },
      ...(bedIds ? { bedId: { in: bedIds } } : {}),
    },
    orderBy: { reservedAt: "desc" },
  });
}

/** Alokasi aktif milik satu kunjungan (untuk flip Occupied / release). */
export function findActiveByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).bedAllocation.findFirst({
    where: { kunjunganId, status: { in: ACTIVE } },
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────--
/** Lepas semua alokasi aktif kunjungan (batal/pulang/transfer). Mengembalikan count. */
export async function releaseByKunjungan(kunjunganId: string, when: Date, tx?: Tx): Promise<number> {
  const res = await db(tx).bedAllocation.updateMany({
    where: { kunjunganId, status: { in: ACTIVE } },
    data: { status: "Released", releasedAt: when, version: { increment: 1 } },
  });
  return res.count;
}

/** Reserved → Occupied (mis. admisi RI). Mengembalikan count (0 = tak ada reservasi aktif). */
export async function occupyByKunjungan(kunjunganId: string, when: Date, tx?: Tx): Promise<number> {
  const res = await db(tx).bedAllocation.updateMany({
    where: { kunjunganId, status: "Reserved" },
    data: { status: "Occupied", occupiedAt: when, version: { increment: 1 } },
  });
  return res.count;
}
