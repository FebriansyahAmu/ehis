// edukasiPasienDal — Prisma MURNI medicalrecord.AsesmenEdukasiPasien. Append-only:
// create + read. Tanpa aturan bisnis. Terima `tx?`.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateEdukasiPasienData {
  kunjunganId: string;
  penerima: string;
  namaPenerima?: string | null;
  hubungan?: string | null;
  topik: string[];
  media: string[];
  metode?: string | null;
  hambatan: string[];
  catatanHambatan?: string | null;
  pemahaman: string;
  rencanaTindakLanjut?: string | null;
  catatan?: string | null;
  tanggal?: string | null;
  jam?: string | null;
  petugas: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type EdukasiPasienEntity = Awaited<ReturnType<typeof listByKunjungan>>[number];

const LIST_LIMIT = 100; // cegah response gemuk bila sesi edukasi banyak

export function create(data: CreateEdukasiPasienData, tx?: Tx) {
  return db(tx).asesmenEdukasiPasien.create({ data });
}

/** Riwayat edukasi kunjungan (terbaru dulu, dibatasi LIST_LIMIT). */
export function listByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenEdukasiPasien.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
  });
}

/** 1 catatan (tanpa filter deletedAt → utk guard kepemilikan sebelum soft-delete). */
export function findById(id: string, tx?: Tx) {
  return db(tx).asesmenEdukasiPasien.findUnique({ where: { id } });
}

/** Soft-delete (set deletedAt). Idempoten via where deletedAt: null. Mengembalikan count. */
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).asesmenEdukasiPasien.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}
