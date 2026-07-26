// paketLayananDal — akses Prisma MURNI master.PaketLayanan. Tanpa aturan bisnis. Terima `tx?`.
// Read filter deletedAt: null. Katalog leaf → tanpa optimistic-version. items = JSONB (set/replace utuh).
// Kode auto `PKT-NNNN` via counter atomik (pola sdkiDal.nextSdkiSeq).

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

type Json = Prisma.InputJsonValue;

export interface PaketData {
  kode: string;
  nama: string;
  kategori: string;
  deskripsi: string;
  items: Json;
  hargaUmum: number;
  hargaBpjs: number | null;
  diskonPct: number | null;
  badge: string | null;
  status: string;
}

/** Patch parsial — hanya field yang di-set yang ikut. `kode` immutable (tak ikut). */
export type PaketPatch = Partial<Omit<PaketData, "kode">>;

export type PaketEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

const ALIVE = { deletedAt: null } as const;
const COUNTER_SCOPE = "PKT";

/** Counter kode paket (atomik, anti-race). Upsert by PK `scope` → increment. */
export async function nextPaketSeq(tx?: Tx): Promise<number> {
  const row = await db(tx).paketCounter.upsert({
    where: { scope: COUNTER_SCOPE },
    create: { scope: COUNTER_SCOPE, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  return row.lastSeq;
}

export function create(data: PaketData, tx?: Tx) {
  return db(tx).paketLayanan.create({ data });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).paketLayanan.findFirst({ where: { id, ...ALIVE } });
}

export function update(id: string, data: PaketPatch, tx?: Tx) {
  return db(tx).paketLayanan.update({ where: { id }, data });
}

/** Soft-delete (deletedAt + status Non_Aktif). Idempoten via where deletedAt: null. */
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).paketLayanan.updateMany({
    where: { id, ...ALIVE },
    data: { deletedAt: new Date(), status: "Non_Aktif" },
  });
  return r.count;
}

export interface ListParams {
  q?: string;
  kategori?: string;
  status?: string;
  cursorId?: string;
  limit: number;
}

/**
 * Ambil paket by ids untuk KONSUMEN billing (proyeksi charge). TIDAK memfilter deletedAt/status:
 * paket yang pernah dipilih pada kunjungan tetap ditagihkan walau kelak dinonaktifkan/dihapus.
 */
export function findByIds(ids: string[], tx?: Tx) {
  if (ids.length === 0) return Promise.resolve([] as { id: string; nama: string; hargaUmum: number; hargaBpjs: number | null }[]);
  return db(tx).paketLayanan.findMany({
    where: { id: { in: ids } },
    select: { id: true, nama: true, hargaUmum: true, hargaBpjs: true },
  });
}

export function list(p: ListParams, tx?: Tx) {
  const where: Record<string, unknown> = { ...ALIVE };
  if (p.kategori) where.kategori = p.kategori;
  if (p.status) where.status = p.status;
  if (p.q) {
    where.OR = [
      { kode: { contains: p.q, mode: "insensitive" } },
      { nama: { contains: p.q, mode: "insensitive" } },
    ];
  }
  return db(tx).paketLayanan.findMany({
    where,
    orderBy: [{ kode: "asc" }, { id: "asc" }],
    take: p.limit,
    ...(p.cursorId ? { cursor: { id: p.cursorId }, skip: 1 } : {}),
  });
}
