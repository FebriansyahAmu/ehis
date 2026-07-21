// setoranDal — setoran kas per shift (1:1, immutable). Tanpa aturan bisnis: guard shift tertutup,
// resolve penyetor, dan penomoran ada di Service.

import { db, type Tx } from "@/lib/db/prisma";

export interface SetoranData {
  noSetor: string;
  tanggalSerah: Date;
  nominal: number;
  penerima: string;
  catatan: string | null;
  penyetor: string;
  authorUserId: string | null;
}

export function create(shiftId: string, data: SetoranData, tx?: Tx) {
  return db(tx).setoran.create({ data: { shiftId, ...data } });
}

export function findByShift(shiftId: string, tx?: Tx) {
  return db(tx).setoran.findUnique({ where: { shiftId } });
}

/** Setoran untuk sekumpulan shift (papan kasir) — dipetakan by shiftId di Service. */
export function listByShiftIds(shiftIds: string[]) {
  if (shiftIds.length === 0) return Promise.resolve([]);
  return db().setoran.findMany({ where: { shiftId: { in: shiftIds } } });
}

export type SetoranEntity = NonNullable<Awaited<ReturnType<typeof findByShift>>>;
