// skalaRisikoDal — akses Prisma MURNI master.SkalaInstrument (skoring, kategori "Risiko").
// Tanpa aturan bisnis. Terima `tx?`. Read filter deletedAt: null + kategori. Katalog leaf →
// tanpa optimistic-version. items[]/interpretasi[] = JSONB (di-set/replace utuh oleh Service).
// Counter kode per-kategori (scope = prefix, mis. "SR") — atomik, anti-race (pola sdkiDal).

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

type Json = Prisma.InputJsonValue;

export interface SkalaData {
  kode: string;
  nama: string;
  singkat: string;
  deskripsi: string;
  referensi: string;
  kategori: string;
  scoringMode: string;
  arah: string;
  totalMax: number;
  items: Json;
  interpretasi: Json;
  konsumenModul: string[];
  status: string;
}

/** Patch parsial — `kode`/`kategori` immutable (tak ikut). */
export type SkalaPatch = Partial<Omit<SkalaData, "kode" | "kategori">>;

export type SkalaEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

const ALIVE = { deletedAt: null } as const;

// Counter kode skala (atomik, anti-race) per scope (prefix kategori, mis. "SR").
export async function nextSkalaSeq(scope: string, tx?: Tx): Promise<number> {
  const row = await db(tx).skalaCounter.upsert({
    where: { scope },
    create: { scope, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  return row.lastSeq;
}

export function create(data: SkalaData, tx?: Tx) {
  return db(tx).skalaInstrument.create({ data });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).skalaInstrument.findFirst({ where: { id, ...ALIVE } });
}

export function update(id: string, data: SkalaPatch, tx?: Tx) {
  return db(tx).skalaInstrument.update({ where: { id }, data });
}

/** Soft-delete (deletedAt + status Non_Aktif). Idempoten via where deletedAt: null. */
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).skalaInstrument.updateMany({
    where: { id, ...ALIVE },
    data: { deletedAt: new Date(), status: "Non_Aktif" },
  });
  return r.count;
}

export interface ListParams {
  kategori: string;
  q?: string;
  modul?: string;
  status?: string;
  limit: number;
}

export function list(p: ListParams, tx?: Tx) {
  const where: Record<string, unknown> = { ...ALIVE, kategori: p.kategori };
  if (p.status) where.status = p.status;
  if (p.modul) where.konsumenModul = { has: p.modul };
  if (p.q) {
    where.OR = [
      { kode: { contains: p.q, mode: "insensitive" } },
      { nama: { contains: p.q, mode: "insensitive" } },
      { singkat: { contains: p.q, mode: "insensitive" } },
    ];
  }
  return db(tx).skalaInstrument.findMany({
    where,
    orderBy: [{ nama: "asc" }, { id: "asc" }],
    take: p.limit,
  });
}
