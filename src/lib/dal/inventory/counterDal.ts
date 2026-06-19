// counterDal — sequence nomor dokumen inventory (GRN/TRF/DST/OPN) via InvCounter (kind, periode).
// Atomik (upsert ON CONFLICT increment). Pola identik master.*Counter.

import { db, type Tx } from "@/lib/db/prisma";

export async function nextDocSeq(kind: string, periode: string, tx?: Tx): Promise<number> {
  const row = await db(tx).invCounter.upsert({
    where: { kind_periode: { kind, periode } },
    create: { kind, periode, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  return row.lastSeq;
}
