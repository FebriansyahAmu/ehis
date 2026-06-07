// triaseProtocolDal — akses Prisma MURNI master/Skala Klinis: Triase IGD (FLOWS §2 ·
// docs/BACKEND-MASTER-SKALA-KLINIK §A.4.1). Tak ada aturan bisnis. Terima `tx?` (transaksi
// dimiliki Service). Soft-delete (protokol) difilter default. Matrix child = cascade FK.
// Enum di-ketik string-union lokal (DAL "loose", selaras ruanganDal/kunjunganDal).

import { db, type Tx } from "@/lib/db/prisma";

type TriaseStatus = "Aktif" | "Non_Aktif";

// ── Bentuk data (nilai sudah dinormalisasi Service) ─────────────────────────────
export interface CreateProtocolData {
  kode: string;
  nama: string;
  deskripsi?: string | null;
  protokol?: string | null;
  status: TriaseStatus;
  isDefault: boolean;
}
export type UpdateProtocolData = Partial<CreateProtocolData>;

export interface CreateLevelData {
  protocolId: string;
  kode: string;
  label: string;
  tone: string;
  responsTime?: string | null;
  prioritas: number;
  deskripsi?: string | null;
  urutan: number;
}
export interface CreateParameterData {
  protocolId: string;
  kode: string;
  label: string;
  urutan: number;
}
export interface CreateCriteriaData {
  parameterId: string;
  levelId: string;
  nilai: string;
}

// Read full: protokol + levels (urut) + parameters (urut) + sel matrix (criteria per parameter).
const fullInclude = {
  levels: { orderBy: { urutan: "asc" as const } },
  parameters: {
    orderBy: { urutan: "asc" as const },
    include: { criteria: true },
  },
} as const;

export type ProtocolFullEntity = Awaited<ReturnType<typeof findFull>>;
export type ProtocolListEntity = Awaited<ReturnType<typeof listFull>>[number];

// ── Reads ───────────────────────────────────────────────────────────────────--
export function listFull(tx?: Tx) {
  return db(tx).triaseProtocol.findMany({
    where: { deletedAt: null },
    include: fullInclude,
    orderBy: { createdAt: "asc" },
  });
}

export function findFull(id: string, tx?: Tx) {
  return db(tx).triaseProtocol.findFirst({ where: { id, deletedAt: null }, include: fullInclude });
}

/** Protokol default aktif (dikonsumsi medicalrecord.Triase "Tabel Kriteria Triase"). */
export function findDefaultFull(tx?: Tx) {
  return db(tx).triaseProtocol.findFirst({
    where: { isDefault: true, status: "Aktif", deletedAt: null },
    include: fullInclude,
  });
}

/** Minimal (guard eksistensi + version). */
export function findById(id: string, tx?: Tx) {
  return db(tx).triaseProtocol.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, version: true, isDefault: true, status: true },
  });
}

/** Cek kode unik (abaikan diri sendiri di update). */
export function findByKode(kode: string, tx?: Tx) {
  return db(tx).triaseProtocol.findFirst({ where: { kode, deletedAt: null }, select: { id: true } });
}

// ── Create / Update protokol (version guard) ───────────────────────────────────
export function createProtocol(data: CreateProtocolData, tx?: Tx) {
  return db(tx).triaseProtocol.create({ data });
}

export async function updateProtocolWithVersion(
  id: string,
  expectedVersion: number,
  data: UpdateProtocolData,
  tx?: Tx,
): Promise<number> {
  const res = await db(tx).triaseProtocol.updateMany({
    where: { id, version: expectedVersion, deletedAt: null },
    data: { ...data, version: { increment: 1 } },
  });
  return res.count;
}

export async function softDeleteProtocol(id: string, expectedVersion: number, when: Date, tx?: Tx): Promise<number> {
  const res = await db(tx).triaseProtocol.updateMany({
    where: { id, version: expectedVersion, deletedAt: null },
    data: { deletedAt: when, status: "Non_Aktif", isDefault: false, version: { increment: 1 } },
  });
  return res.count;
}

/** Lepas flag default dari protokol lain (jaga single-default). Bump version. */
export async function unsetOtherDefaults(exceptId: string, tx?: Tx): Promise<number> {
  const res = await db(tx).triaseProtocol.updateMany({
    where: { isDefault: true, deletedAt: null, NOT: { id: exceptId } },
    data: { isDefault: false, version: { increment: 1 } },
  });
  return res.count;
}

// ── Matrix child (replace pattern: delete-all → recreate) ───────────────────────
/** Hapus seluruh level+parameter milik protokol (criteria ikut cascade FK). */
export async function deleteChildren(protocolId: string, tx?: Tx): Promise<void> {
  const c = db(tx);
  await c.triaseProtocolParameter.deleteMany({ where: { protocolId } }); // cascade criteria
  await c.triaseProtocolLevel.deleteMany({ where: { protocolId } });
}

/** Buat level; kembalikan baris (dgn id) untuk pemetaan kode→id (link criteria). */
export function createLevels(rows: CreateLevelData[], tx?: Tx) {
  return db(tx).triaseProtocolLevel.createManyAndReturn({ data: rows });
}
export function createParameters(rows: CreateParameterData[], tx?: Tx) {
  return db(tx).triaseProtocolParameter.createManyAndReturn({ data: rows });
}
export async function createCriteria(rows: CreateCriteriaData[], tx?: Tx): Promise<number> {
  if (rows.length === 0) return 0;
  const res = await db(tx).triaseProtocolCriteria.createMany({ data: rows });
  return res.count;
}
