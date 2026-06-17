// radCatalogDal — akses Prisma MURNI master.RadCatalog (katalog radiologi). Tanpa aturan
// bisnis. Terima `tx?`. Read filter deletedAt: null. Katalog leaf → tanpa optimistic-version.
// Blok terstruktur (tatTarget/persiapan/kontras/drlReferensi/reportingTemplate) = JSONB,
// di-set/replace utuh oleh Service. Kode `RAD-NNNN` via counter atomik.

import { db, type Tx } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";

type Json = Prisma.InputJsonValue;

/** Kolom Json NULLABLE: null/undefined → SQL NULL (Prisma.DbNull), bukan literal null. */
function jsonOrDbNull(v: Json | null | undefined): Json | typeof Prisma.DbNull {
  return v == null ? Prisma.DbNull : v;
}

export interface RadCatalogData {
  kode: string;
  kodeIcd?: string | null;
  nama: string;
  modalitas: string;
  modalitasSubtype?: string | null;
  region: string;
  kategori: string;
  estimasiWaktuMenit: number;
  tatTarget: Json;
  persiapan: Json;
  kontras: Json;
  drlReferensi?: Json | null;
  reportingTemplate: Json;
  deskripsi?: string | null;
  status: string;
}

/** Patch parsial — `kode` immutable (tak ikut). */
export type RadCatalogPatch = Partial<Omit<RadCatalogData, "kode">>;

export type RadCatalogEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

const ALIVE = { deletedAt: null } as const;
const COUNTER_SCOPE = "RAD";

// Counter kode radiologi (atomik, anti-race). Upsert by PK `scope` → increment.
export async function nextRadSeq(tx?: Tx): Promise<number> {
  const row = await db(tx).radCatalogCounter.upsert({
    where: { scope: COUNTER_SCOPE },
    create: { scope: COUNTER_SCOPE, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  return row.lastSeq;
}

export function create(data: RadCatalogData, tx?: Tx) {
  const { drlReferensi, ...rest } = data;
  return db(tx).radCatalog.create({
    data: { ...rest, drlReferensi: jsonOrDbNull(drlReferensi) },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).radCatalog.findFirst({ where: { id, ...ALIVE } });
}

export function update(id: string, data: RadCatalogPatch, tx?: Tx) {
  const { drlReferensi, ...rest } = data;
  return db(tx).radCatalog.update({
    where: { id },
    data: {
      ...rest,
      ...(drlReferensi !== undefined ? { drlReferensi: jsonOrDbNull(drlReferensi) } : {}),
    },
  });
}

/** Soft-delete (deletedAt + status Non_Aktif). Idempoten via where deletedAt: null. */
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).radCatalog.updateMany({
    where: { id, ...ALIVE },
    data: { deletedAt: new Date(), status: "Non_Aktif" },
  });
  return r.count;
}

export interface ListParams {
  q?: string;
  modalitas?: string;
  kategori?: string;
  status?: string;
  cursorId?: string;
  limit: number;
}

export function list(p: ListParams, tx?: Tx) {
  const where: Record<string, unknown> = { ...ALIVE };
  if (p.modalitas) where.modalitas = p.modalitas;
  if (p.kategori) where.kategori = p.kategori;
  if (p.status) where.status = p.status;
  if (p.q) {
    where.OR = [
      { kode: { contains: p.q, mode: "insensitive" } },
      { nama: { contains: p.q, mode: "insensitive" } },
      { kodeIcd: { contains: p.q, mode: "insensitive" } },
    ];
  }
  return db(tx).radCatalog.findMany({
    where,
    orderBy: [{ kode: "asc" }, { id: "asc" }],
    take: p.limit,
    ...(p.cursorId ? { cursor: { id: p.cursorId }, skip: 1 } : {}),
  });
}
