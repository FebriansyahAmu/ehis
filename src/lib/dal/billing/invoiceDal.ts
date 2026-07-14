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

export type InvoiceEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;
