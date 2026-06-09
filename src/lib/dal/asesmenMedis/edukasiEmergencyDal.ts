// edukasiEmergencyDal — Prisma MURNI medicalrecord.AsesmenEdukasiEmergency. Append-only +
// soft-delete. Read filter deletedAt: null. Tanpa aturan bisnis. Terima `tx?`.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateEdukasiEmergencyData {
  kunjunganId: string;
  tipe: string;
  instruksi: string;
  instruksiObat?: string | null;
  diet?: string | null;
  aktivitas?: string | null;
  tandaBahaya: string[];
  followUpDate?: string | null;
  followUpLokasi?: string | null;
  kontakEmergency?: string | null;
  catatan?: string | null;
  petugas: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type EdukasiEmergencyEntity = Awaited<ReturnType<typeof listByKunjungan>>[number];

const LIST_LIMIT = 100;

export function create(data: CreateEdukasiEmergencyData, tx?: Tx) {
  return db(tx).asesmenEdukasiEmergency.create({ data });
}

/** Riwayat instruksi emergency kunjungan (terbaru dulu, aktif). */
export function listByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenEdukasiEmergency.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
  });
}

/** 1 catatan (tanpa filter deletedAt → guard kepemilikan sebelum soft-delete). */
export function findById(id: string, tx?: Tx) {
  return db(tx).asesmenEdukasiEmergency.findUnique({ where: { id } });
}

/** Soft-delete (set deletedAt). Idempoten via where deletedAt: null. */
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).asesmenEdukasiEmergency.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}
