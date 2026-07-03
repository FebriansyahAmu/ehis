// dischargeChecklistDal — Prisma murni medicalrecord.DischargeChecklist (append-only "latest
// wins" per kunjungan). items = JSONB snapshot. Tanpa aturan bisnis. Terima `tx?`.
// Selaras dischargeAsesmenDal.

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface CreateDischargeChecklistData {
  kunjunganId: string;
  items: Prisma.InputJsonValue; // [{id,label,sublabel,required,confirmed,catatan}]
  catatanKhusus: string;
  pencatat: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type DischargeChecklistEntity = NonNullable<Awaited<ReturnType<typeof latest>>>;

/** Revisi terkini (latest-wins) per kunjungan. */
export function latest(kunjunganId: string, tx?: Tx) {
  return db(tx).dischargeChecklist.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

export function create(data: CreateDischargeChecklistData, tx?: Tx) {
  return db(tx).dischargeChecklist.create({ data });
}
