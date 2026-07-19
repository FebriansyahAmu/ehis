// invoiceItemDal — Prisma murni billing.InvoiceItem (snapshot baris charge saat finalize).
// Tanpa aturan bisnis. Terima `tx?`. Draft = tak ada baris; Final = baris beku dari proyeksi.

import { db, type Tx } from "@/lib/db/prisma";

export interface InvoiceItemData {
  tanggal: Date;
  nama: string;
  sourceModul: string;
  sourceRef: string;
  kategori: string;
  qty: number;
  satuan: string;
  hargaSatuan: number;
  coverage: string;
  untariffed: boolean;
}

export function listByInvoice(invoiceId: string, tx?: Tx) {
  return db(tx).invoiceItem.findMany({
    where: { invoiceId },
    orderBy: { createdAt: "asc" },
  });
}

/** Tulis banyak baris snapshot untuk 1 invoice (dipanggil di tx finalize). */
export function createMany(invoiceId: string, rows: InvoiceItemData[], tx?: Tx) {
  if (rows.length === 0) return Promise.resolve({ count: 0 });
  return db(tx).invoiceItem.createMany({
    data: rows.map((r) => ({ ...r, invoiceId })),
  });
}

/** Hapus semua baris snapshot 1 invoice (dipanggil saat reopen). */
export function deleteByInvoice(invoiceId: string, tx?: Tx) {
  return db(tx).invoiceItem.deleteMany({ where: { invoiceId } });
}

export type InvoiceItemEntity = Awaited<ReturnType<typeof listByInvoice>>[number];
