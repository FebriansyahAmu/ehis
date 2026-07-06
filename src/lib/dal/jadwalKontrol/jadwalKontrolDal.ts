// jadwalKontrolDal — Prisma murni medicalrecord.JadwalKontrol (+ counter nomor). Read filter
// deletedAt: null (terbaru dulu). Tanpa aturan bisnis. Terima `tx?`. Selaras dischargeEdukasiDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateJadwalKontrolData {
  kunjunganId: string;
  nomor: string;
  tanggal: string;
  poliNama: string;
  poliKontrol: string;
  dokterNama: string;
  dokterId?: string | null;
  kodeDokter: string;
  catatan: string;
  noSep: string;
  noReferensi?: string | null;
  pencatat: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type JadwalKontrolEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).jadwalKontrol.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).jadwalKontrol.findUnique({ where: { id } });
}

export function create(data: CreateJadwalKontrolData, tx?: Tx) {
  return db(tx).jadwalKontrol.create({ data });
}

export interface UpdateJadwalKontrolData {
  tanggal: string;
  poliNama: string;
  poliKontrol: string;
  dokterNama: string;
  dokterId?: string | null;
  kodeDokter: string;
}

/** Update field editable (identitas nomor/noReferensi/noSep TIDAK diubah). Row sudah dipastikan
 *  ada + tidak terhapus oleh Service (assertMilik) → update by id langsung, kembalikan entity. */
export function update(id: string, data: UpdateJadwalKontrolData, tx?: Tx) {
  return db(tx).jadwalKontrol.update({ where: { id }, data });
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).jadwalKontrol.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}

/** Naikkan counter nomor per-scope ("JK-<YYMM>") atomik, kembalikan seq baru. */
export async function nextSeq(scope: string, tx?: Tx): Promise<number> {
  const r = await db(tx).jadwalKontrolCounter.upsert({
    where: { scope },
    create: { scope, seq: 1 },
    update: { seq: { increment: 1 } },
  });
  return r.seq;
}
