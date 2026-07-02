// marDal — Prisma murni medicalrecord.MarEntry (append-only "latest wins" per slot; reduksi di
// Service). Tanpa aturan bisnis. Terima `tx?`. Selaras intakeOutputDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateMarEntryData {
  kunjunganId: string;
  resepItemId: string;
  namaObat: string;
  dosis: string;
  rute: string;
  tanggal: string;
  shift: string;
  status: string;
  waktuPemberian?: string | null;
  perawat: string;
  perawat2: string;
  catatan: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type MarEntryEntity = NonNullable<Awaited<ReturnType<typeof createEntry>>>;

/** Seluruh entri kunjungan, urut createdAt asc (reduksi latest-wins = Map overwrite di Service). */
export function listEntries(kunjunganId: string, tx?: Tx) {
  return db(tx).marEntry.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
  });
}

export function createEntry(data: CreateMarEntryData, tx?: Tx) {
  return db(tx).marEntry.create({ data });
}
