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

export interface FinalizeStamp {
  finalizedBy: string | null;
  finalizedByUserId: string | null;
}

/**
 * Draft → Final (finalize). Guard status='Draft' + versi (optimistic). Return count: 1 = berhasil.
 * Idempoten-aman: invoice yang sudah Final tak akan ke-update (count 0).
 */
export async function setFinal(
  id: string,
  stamp: FinalizeStamp,
  expectedVersion: number | undefined,
  tx?: Tx,
): Promise<number> {
  const where =
    expectedVersion === undefined
      ? { id, status: "Draft" }
      : { id, status: "Draft", version: expectedVersion };
  const r = await db(tx).invoice.updateMany({
    where,
    data: {
      status: "Final",
      finalizedAt: new Date(),
      finalizedBy: stamp.finalizedBy,
      finalizedByUserId: stamp.finalizedByUserId,
      version: { increment: 1 },
    },
  });
  return r.count;
}

/** Final → Draft (reopen). Guard status='Final' + versi. Bersihkan stempel finalize. */
export async function setDraft(
  id: string,
  expectedVersion: number | undefined,
  tx?: Tx,
): Promise<number> {
  const where =
    expectedVersion === undefined
      ? { id, status: "Final" }
      : { id, status: "Final", version: expectedVersion };
  const r = await db(tx).invoice.updateMany({
    where,
    data: {
      status: "Draft",
      finalizedAt: null,
      finalizedBy: null,
      finalizedByUserId: null,
      version: { increment: 1 },
    },
  });
  return r.count;
}

export type InvoiceEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;
