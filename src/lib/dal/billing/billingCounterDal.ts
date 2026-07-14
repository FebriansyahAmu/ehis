// billingCounterDal — sequence nomor dokumen billing (INV/KW) via BillingCounter (kind, periode).
// Atomik (upsert increment). Pola identik inv_counter / master.*Counter.

import { db, type Tx } from "@/lib/db/prisma";

export async function nextSeq(kind: string, periode: string, tx?: Tx): Promise<number> {
  const row = await db(tx).billingCounter.upsert({
    where: { kind_periode: { kind, periode } },
    create: { kind, periode, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  return row.lastSeq;
}
