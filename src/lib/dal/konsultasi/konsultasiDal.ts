// konsultasiDal — Prisma murni medicalrecord.Konsultasi. Read filter deletedAt: null; transisi
// status = updateMany guarded (atomik, count 0 = konflik status). Tanpa aturan bisnis. Terima `tx?`.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateKonsultasiData {
  kunjunganId: string;
  urgency: string;
  smfId: string;
  smfNama: string;
  smfSingkatan: string;
  dokterKonsultan?: string | null;
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  dokterPeminta: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export interface JawabanData {
  konsultanNama: string;
  konsultanUserId?: string | null;
  konsultanPegawaiId?: string | null;
  jawabanAsesmen: string;
  jawabanRekomendasi: string;
  jawabanTindakLanjut: string;
  jawabanFollowUp?: string | null;
}

const withKunjungan = {
  kunjungan: {
    select: {
      unit: true,
      noKunjungan: true,
      pasien: { select: { noRm: true, nama: true } },
    },
  },
};

export type KonsultasiEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function listByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).konsultasi.findMany({
    where: { kunjunganId, deletedAt: null },
    include: withKunjungan,
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).konsultasi.findFirst({
    where: { id, deletedAt: null },
    include: withKunjungan,
  });
}

/** Worklist konsultan lintas kunjungan. statuses absen → semua (non-deleted). */
export function listWorklist(statuses: string[] | undefined, tx?: Tx) {
  return db(tx).konsultasi.findMany({
    where: { deletedAt: null, ...(statuses ? { status: { in: statuses } } : {}) },
    include: withKunjungan,
    orderBy: [{ status: "asc" }, { createdAt: "asc" }], // FIFO per status
  });
}

export function create(data: CreateKonsultasiData, tx?: Tx) {
  return db(tx).konsultasi.create({ data, include: withKunjungan });
}

/** Terima (stamp sekali): Terkirim → Diterima. count 0 = sudah diterima/berubah. */
export async function terima(id: string, oleh: string, tx?: Tx) {
  const r = await db(tx).konsultasi.updateMany({
    where: { id, deletedAt: null, status: "Terkirim" },
    data: { status: "Diterima", diterimaAt: new Date(), diterimaOleh: oleh },
  });
  return r.count;
}

/** Jawab: Diterima → Dijawab (guarded). */
export async function jawab(id: string, data: JawabanData, tx?: Tx) {
  const r = await db(tx).konsultasi.updateMany({
    where: { id, deletedAt: null, status: "Diterima" },
    data: { ...data, status: "Dijawab", dijawabAt: new Date() },
  });
  return r.count;
}

/** Konfirmasi selesai (read-back DPJP peminta): Dijawab → Selesai. */
export async function selesai(id: string, oleh: string, tx?: Tx) {
  const r = await db(tx).konsultasi.updateMany({
    where: { id, deletedAt: null, status: "Dijawab" },
    data: { status: "Selesai", selesaiAt: new Date(), selesaiOleh: oleh },
  });
  return r.count;
}

/** Batalkan permintaan — hanya saat masih Terkirim (belum disentuh konsultan). */
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).konsultasi.updateMany({
    where: { id, deletedAt: null, status: "Terkirim" },
    data: { deletedAt: new Date() },
  });
  return r.count;
}
