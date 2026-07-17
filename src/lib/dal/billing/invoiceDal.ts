// invoiceDal — Prisma murni billing.Invoice (1/kunjungan). Tanpa aturan bisnis. Terima `tx?`.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateInvoiceData {
  kunjunganId: string;
  noInvoice: string;
  createdBy?: string | null;
  authorUserId?: string | null;
}

export function findByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).invoice.findUnique({ where: { kunjunganId } });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).invoice.findUnique({ where: { id } });
}

export function create(data: CreateInvoiceData, tx?: Tx) {
  return db(tx).invoice.create({ data });
}

export interface AdjustmentData {
  diskonInvoice: number;
  materai: number;
  ppnPct: number;
  catatan?: string | null;
}

/** Update penyesuaian level-invoice ter-guard versi (optimistic). Return count: 1 = berhasil. */
export async function updateAdjustment(
  id: string,
  data: AdjustmentData,
  expectedVersion: number | undefined,
  tx?: Tx,
): Promise<number> {
  const where = expectedVersion === undefined ? { id } : { id, version: expectedVersion };
  const r = await db(tx).invoice.updateMany({
    where,
    data: {
      diskonInvoice: data.diskonInvoice,
      materai: data.materai,
      ppnPct: data.ppnPct,
      catatan: data.catatan ?? null,
      version: { increment: 1 },
    },
  });
  return r.count;
}

export type InvoiceEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;
