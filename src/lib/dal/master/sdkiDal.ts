// sdkiDal — akses Prisma MURNI master.Sdki (katalog keperawatan). Tanpa aturan
// bisnis. Terima `tx?`. Read filter deletedAt: null. Katalog leaf → tanpa
// optimistic-version. Blok data klinis (dataMayor/dataMinor/intervensi) = JSONB,
// di-set/replace utuh oleh Service.

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

type Json = Prisma.InputJsonValue;

export interface SdkiData {
  kode: string;
  nama: string;
  kategori: string;
  subKategori: string;
  jenis: string;
  penyebabUmum: string;
  faktorResiko?: string | null;
  dataMayor: Json;
  dataMinor: Json;
  kriteriaHasil: string[];
  intervensi: Json;
  status: string;
}

/** Patch parsial — hanya field yang di-set yang ikut. `kode` immutable (tak ikut). */
export type SdkiPatch = Partial<Omit<SdkiData, "kode">>;

export type SdkiEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

const ALIVE = { deletedAt: null } as const;
const COUNTER_SCOPE = "D";

// Counter kode keperawatan (atomik, anti-race). Upsert by PK `scope` →
// increment. Pola identik obatDal.nextObatSeq (tanpa reset periodik).
export async function nextSdkiSeq(tx?: Tx): Promise<number> {
  const row = await db(tx).sdkiCounter.upsert({
    where: { scope: COUNTER_SCOPE },
    create: { scope: COUNTER_SCOPE, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  return row.lastSeq;
}

export function create(data: SdkiData, tx?: Tx) {
  return db(tx).sdki.create({ data });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).sdki.findFirst({ where: { id, ...ALIVE } });
}

export function update(id: string, data: SdkiPatch, tx?: Tx) {
  return db(tx).sdki.update({ where: { id }, data });
}

/** Soft-delete (deletedAt + status Non_Aktif). Idempoten via where deletedAt: null. */
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).sdki.updateMany({
    where: { id, ...ALIVE },
    data: { deletedAt: new Date(), status: "Non_Aktif" },
  });
  return r.count;
}

export interface ListParams {
  q?: string;
  kategori?: string;
  jenis?: string;
  status?: string;
  cursorId?: string;
  limit: number;
}

export function list(p: ListParams, tx?: Tx) {
  const where: Record<string, unknown> = { ...ALIVE };
  if (p.kategori) where.kategori = p.kategori;
  if (p.jenis) where.jenis = p.jenis;
  if (p.status) where.status = p.status;
  if (p.q) {
    where.OR = [
      { kode: { contains: p.q, mode: "insensitive" } },
      { nama: { contains: p.q, mode: "insensitive" } },
      { subKategori: { contains: p.q, mode: "insensitive" } },
    ];
  }
  return db(tx).sdki.findMany({
    where,
    orderBy: [{ kode: "asc" }, { id: "asc" }],
    take: p.limit,
    ...(p.cursorId ? { cursor: { id: p.cursorId }, skip: 1 } : {}),
  });
}
