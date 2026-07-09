// suratSehatDal — Prisma murni medicalrecord.SuratKeteranganSehat (+ counter nomor).
// Read filter deletedAt: null (terbaru dulu). Tanpa aturan bisnis. Terima `tx?`.
// Selaras suratSakitDal / jadwalKontrolDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateSuratSehatData {
  kunjunganId: string;
  nomor: string;
  tglPeriksa: string;
  tinggiBadan?: number | null;
  beratBadan?: number | null;
  tekananDarah: string;
  nadi?: number | null;
  golonganDarah: string;
  penglihatan: string;
  butaWarna: string;
  pendengaran: string;
  riwayatPenyakit: string;
  kesimpulan: string;
  keperluan: string;
  instansi: string;
  berlakuHingga: string;
  catatan: string;
  pekerjaan: string;
  dokterNama: string;
  dokterId?: string | null;
  pencatat: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
  tteToken?: string | null;
  tteSignedBy?: string | null;
  tteSignedAt?: Date | null;
}

export type SuratSehatEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).suratKeteranganSehat.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).suratKeteranganSehat.findUnique({ where: { id } });
}

export function create(data: CreateSuratSehatData, tx?: Tx) {
  return db(tx).suratKeteranganSehat.create({ data });
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).suratKeteranganSehat.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}

/** Naikkan counter nomor per-scope ("SKH-<YYMM>") atomik, kembalikan seq baru. */
export async function nextSeq(scope: string, tx?: Tx): Promise<number> {
  const r = await db(tx).suratSehatCounter.upsert({
    where: { scope },
    create: { scope, seq: 1 },
    update: { seq: { increment: 1 } },
  });
  return r.seq;
}
