// resumeMedikDal — Prisma murni medicalrecord.ResumeMedik (append-only "latest wins"
// per kunjungan). dataKlinis = JSONB snapshot. TTE = stamp guarded (tteSignedAt IS NULL).
// Tanpa aturan bisnis. Terima `tx?`. Selaras dischargeChecklistDal.

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface CreateResumeMedikData {
  kunjunganId: string;
  asalMasuk: string;
  tanggalMasukIgd: string;
  diagnosisIgd: string;
  kondisiMasuk: string;
  kondisiPulang: string;
  ringkasanKlinis: string;
  dataKlinis?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  pencatat: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type ResumeMedikEntity = NonNullable<Awaited<ReturnType<typeof latest>>>;

/** Revisi terkini (latest-wins) per kunjungan. */
export function latest(kunjunganId: string, tx?: Tx) {
  return db(tx).resumeMedik.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).resumeMedik.findUnique({ where: { id } });
}

export function create(data: CreateResumeMedikData, tx?: Tx) {
  return db(tx).resumeMedik.create({ data });
}

/** Stamp TTE sekali — guard `tteSignedAt IS NULL`. Return count (0 = sudah/berebut). */
export async function signOnce(
  id: string,
  data: { tteToken: string; tteSignedBy: string; tteSignedAt: Date },
  tx?: Tx,
): Promise<number> {
  const res = await db(tx).resumeMedik.updateMany({
    where: { id, tteSignedAt: null },
    data,
  });
  return res.count;
}
