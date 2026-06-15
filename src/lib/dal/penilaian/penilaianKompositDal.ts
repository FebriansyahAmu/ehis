// penilaianKompositDal — Prisma murni medicalrecord.PenilaianKomposit (append-only time-series).
// Tanpa aturan bisnis. Terima `tx?`. Read urut createdAt desc (terbaru dulu), filter `jenis` opsional.
// `data` = JSONB. Selaras penilaianSkalaDal.

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface CreatePenilaianKompositData {
  kunjunganId: string;
  jenis: string;
  ringkasan: string;
  data: Prisma.InputJsonValue;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type PenilaianKompositEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

/** Riwayat penilaian komposit per kunjungan (terbaru dulu); filter `jenis` opsional. */
export function list(kunjunganId: string, jenis: string | undefined, tx?: Tx) {
  return db(tx).penilaianKomposit.findMany({
    where: { kunjunganId, ...(jenis ? { jenis } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).penilaianKomposit.findUnique({ where: { id } });
}

export function create(data: CreatePenilaianKompositData, tx?: Tx) {
  return db(tx).penilaianKomposit.create({ data });
}
