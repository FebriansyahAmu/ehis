// serahTerimaDal — Prisma murni medicalrecord.SerahTerima (daftar hidup per kunjungan).
// Read filter deletedAt: null, urut createdAt asc (kronologis tab tanggal×shift). Tanpa aturan
// bisnis. Terima `tx?`. receive = stamp penerima sekali (guard perawat_masuk='' anti double-terima).
// Selaras asuhanKeperawatanDal (create + update-stamp + soft-delete).

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateSerahTerimaData {
  kunjunganId: string;
  tanggal: string;
  shift: string;
  jamSerahTerima: string;
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  perawatKeluar: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export interface ReceiveData {
  perawatMasuk: string;
  jamTerima: string;
  receivedAt: Date;
  receivedByUserId?: string | null;
  receivedByPegawaiId?: string | null;
}

export type SerahTerimaEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

/** Daftar serah terima aktif per kunjungan (urut buat). */
export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).serahTerima.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).serahTerima.findUnique({ where: { id } });
}

export function create(data: CreateSerahTerimaData, tx?: Tx) {
  return db(tx).serahTerima.create({ data });
}

/** Stamp penerima sekali — guard perawatMasuk='' (idempotensi anti double-terima). */
export async function receive(id: string, data: ReceiveData, tx?: Tx) {
  const r = await db(tx).serahTerima.updateMany({
    where: { id, deletedAt: null, perawatMasuk: "" },
    data: { ...data, version: { increment: 1 } },
  });
  return r.count;
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).serahTerima.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}
