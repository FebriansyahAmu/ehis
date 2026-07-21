// itemAdjustmentDal — Prisma murni billing.ItemAdjustment (overlay per baris charge). Tanpa aturan
// bisnis. Terima `tx?`. 1 aktif per (invoiceId, sourceRef) → upsert; hapus = kembalikan gross.

import { db, type Tx } from "@/lib/db/prisma";

export interface ItemAdjustmentData {
  jenis: string;            // "diskon" | "void"
  mode: string | null;      // "rp" | "pct" (diskon)
  nilai: number;            // input user (Rp/pct)
  reduksi: number;          // Rp aktual dikurangi (snapshot saat set)
  alasan: string | null;
  actorNama: string | null;
  actorUserId: string | null;
}

export function listByInvoice(invoiceId: string, tx?: Tx) {
  return db(tx).itemAdjustment.findMany({ where: { invoiceId } });
}

export function findBySourceRef(invoiceId: string, sourceRef: string, tx?: Tx) {
  return db(tx).itemAdjustment.findUnique({
    where: { invoiceId_sourceRef: { invoiceId, sourceRef } },
  });
}

/** Upsert 1 penyesuaian per (invoice, sourceRef). */
export function upsert(invoiceId: string, sourceRef: string, data: ItemAdjustmentData, tx?: Tx) {
  return db(tx).itemAdjustment.upsert({
    where: { invoiceId_sourceRef: { invoiceId, sourceRef } },
    create: { invoiceId, sourceRef, ...data },
    update: {
      jenis: data.jenis, mode: data.mode, nilai: data.nilai, reduksi: data.reduksi,
      alasan: data.alasan, actorNama: data.actorNama, actorUserId: data.actorUserId,
    },
  });
}

/** Hapus penyesuaian (kembalikan baris ke gross). Return count. */
export async function deleteBySourceRef(invoiceId: string, sourceRef: string, tx?: Tx): Promise<number> {
  const r = await db(tx).itemAdjustment.deleteMany({ where: { invoiceId, sourceRef } });
  return r.count;
}

export type ItemAdjustmentEntity = Awaited<ReturnType<typeof listByInvoice>>[number];
