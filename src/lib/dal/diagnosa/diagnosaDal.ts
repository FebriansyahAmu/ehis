// diagnosaDal — Prisma murni medicalrecord.Diagnosa + DiagnosaProsedur (per-item).
// Read filter deletedAt: null. Tanpa aturan bisnis. Terima `tx?`.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateDiagnosaData {
  kunjunganId: string;
  kodeIcd10: string;
  namaDiagnosis: string;
  tipe: string;
  status: string;
  alasan?: string | null;
  analisa?: string | null;
  kategori?: string | null;
  inaCbg?: string | null;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export interface UpdateDiagnosaData {
  tipe?: string;
  status?: string;
  alasan?: string;
  analisa?: string;
}

export interface CreateProsedurData {
  kunjunganId: string;
  kode: string;
  nama: string;
  kategori: string;
  catatan?: string | null;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type DiagnosaEntity = NonNullable<Awaited<ReturnType<typeof findDiagnosaById>>>;
export type ProsedurEntity = NonNullable<Awaited<ReturnType<typeof findProsedurById>>>;

// ── Diagnosa (ICD-10) ──────────────────────────────────────────────────────---

export function listDiagnosa(kunjunganId: string, tx?: Tx) {
  return db(tx).diagnosa.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

export function findDiagnosaById(id: string, tx?: Tx) {
  return db(tx).diagnosa.findUnique({ where: { id } });
}

export function findDiagnosaAktifByKode(kunjunganId: string, kodeIcd10: string, tx?: Tx) {
  return db(tx).diagnosa.findFirst({
    where: { kunjunganId, kodeIcd10, deletedAt: null },
  });
}

/**
 * Diagnosa UTAMA (tipe="Utama") aktif untuk sekumpulan kunjungan — batched (anti N+1).
 * Dipakai mis. enrich SPRI: diagnosa awal SEP Rawat Inap = diagnosa utama IGD asal.
 * Urut terbaru dulu → konsumen ambil first-per-kunjungan.
 */
export function listUtamaByKunjunganIds(kunjunganIds: string[], tx?: Tx) {
  if (kunjunganIds.length === 0) return Promise.resolve([]);
  return db(tx).diagnosa.findMany({
    where: { kunjunganId: { in: kunjunganIds }, tipe: "Utama", deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { kunjunganId: true, kodeIcd10: true, namaDiagnosis: true },
  });
}

/**
 * Semua diagnosa aktif (segala tipe) untuk sekumpulan kunjungan — batched (anti N+1).
 * Dipakai panel "Diagnosa Sebelumnya" (lintas kunjungan pasien). Terbaru dulu.
 */
export function listByKunjunganIds(kunjunganIds: string[], tx?: Tx) {
  if (kunjunganIds.length === 0) return Promise.resolve([]);
  return db(tx).diagnosa.findMany({
    where: { kunjunganId: { in: kunjunganIds }, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      kunjunganId: true, kodeIcd10: true, namaDiagnosis: true,
      tipe: true, status: true, pemeriksa: true, createdAt: true,
    },
  });
}

export function createDiagnosa(data: CreateDiagnosaData, tx?: Tx) {
  return db(tx).diagnosa.create({ data });
}

export async function updateDiagnosa(id: string, data: UpdateDiagnosaData, tx?: Tx) {
  const r = await db(tx).diagnosa.updateMany({
    where: { id, deletedAt: null },
    data: { ...data, version: { increment: 1 } },
  });
  return r.count;
}

/** Geser semua Utama aktif kunjungan (kecuali `excludeId`) menjadi Sekunder. */
export async function demoteUtama(kunjunganId: string, excludeId: string | null, tx?: Tx) {
  const r = await db(tx).diagnosa.updateMany({
    where: {
      kunjunganId,
      tipe: "Utama",
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    data: { tipe: "Sekunder", version: { increment: 1 } },
  });
  return r.count;
}

export async function softDeleteDiagnosa(id: string, tx?: Tx) {
  const r = await db(tx).diagnosa.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}

// ── Prosedur (ICD-9-CM) ───────────────────────────────────────────────────---

export function listProsedur(kunjunganId: string, tx?: Tx) {
  return db(tx).diagnosaProsedur.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

export function findProsedurById(id: string, tx?: Tx) {
  return db(tx).diagnosaProsedur.findUnique({ where: { id } });
}

export function findProsedurAktifByKode(kunjunganId: string, kode: string, tx?: Tx) {
  return db(tx).diagnosaProsedur.findFirst({
    where: { kunjunganId, kode, deletedAt: null },
  });
}

export function createProsedur(data: CreateProsedurData, tx?: Tx) {
  return db(tx).diagnosaProsedur.create({ data });
}

export async function softDeleteProsedur(id: string, tx?: Tx) {
  const r = await db(tx).diagnosaProsedur.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}
