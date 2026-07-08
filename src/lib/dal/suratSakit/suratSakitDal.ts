// suratSakitDal — Prisma murni medicalrecord.SuratKeteranganSakit (+ counter nomor).
// Read filter deletedAt: null (terbaru dulu). Tanpa aturan bisnis. Terima `tx?`.
// Selaras jadwalKontrolDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateSuratSakitData {
  kunjunganId: string;
  nomor: string;
  tglPeriksa: string;
  tglMulai: string;
  tglSelesai: string;
  lamaHari: number;
  keperluan: string;
  diagnosa: string;
  cantumkanDiagnosa: boolean;
  pekerjaan: string;
  instansi: string;
  catatan: string;
  dokterNama: string;
  dokterId?: string | null;
  pencatat: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
  tteToken?: string | null;
  tteSignedBy?: string | null;
  tteSignedAt?: Date | null;
}

export type SuratSakitEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).suratKeteranganSakit.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).suratKeteranganSakit.findUnique({ where: { id } });
}

export function create(data: CreateSuratSakitData, tx?: Tx) {
  return db(tx).suratKeteranganSakit.create({ data });
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).suratKeteranganSakit.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}

/** Naikkan counter nomor per-scope ("SKS-<YYMM>") atomik, kembalikan seq baru. */
export async function nextSeq(scope: string, tx?: Tx): Promise<number> {
  const r = await db(tx).suratSakitCounter.upsert({
    where: { scope },
    create: { scope, seq: 1 },
    update: { seq: { increment: 1 } },
  });
  return r.seq;
}
