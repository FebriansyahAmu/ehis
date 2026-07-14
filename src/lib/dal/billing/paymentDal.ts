// paymentDal — Prisma murni billing.Payment. Tanpa aturan bisnis. Terima `tx?`. Void bukan delete.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreatePaymentData {
  invoiceId: string;
  noKwitansi: string;
  metode: string;
  kategori: string;
  nominal: number;
  kasir: string;
  authorUserId?: string | null;
  shiftId?: string | null;
  source?: string | null;
  bank?: string | null;
  noRef?: string | null;
  bukti?: string | null;
  catatan?: string | null;
}

export function create(data: CreatePaymentData, tx?: Tx) {
  return db(tx).payment.create({ data });
}

export function listByInvoice(invoiceId: string, tx?: Tx) {
  return db(tx).payment.findMany({ where: { invoiceId }, orderBy: { createdAt: "desc" } });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).payment.findUnique({ where: { id } });
}

/** Void ter-guard (atomik via where) — hanya bila belum voided. Return count: 1 = berhasil. */
export async function voidGuarded(
  id: string,
  invoiceId: string,
  data: { voidReason: string; voidedBy: string },
  tx?: Tx,
): Promise<number> {
  const r = await db(tx).payment.updateMany({
    where: { id, invoiceId, voided: false },
    data: { voided: true, voidReason: data.voidReason, voidedBy: data.voidedBy, voidedAt: new Date() },
  });
  return r.count;
}

export type PaymentEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;
