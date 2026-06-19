// bmhpDal — akses Prisma MURNI master.Bmhp. Tanpa aturan bisnis. Terima `tx?`.
// Read filter deletedAt: null. Katalog leaf → tanpa optimistic-version. Pola identik obatDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface BmhpData {
  kode: string;
  nama: string;
  merek?: string | null;
  pabrik?: string | null;
  kategori: string;
  ukuran?: string | null;
  satuan: string;
  isiPerKemasan?: number | null;

  isSteril: boolean;
  isSingleUse: boolean;
  isImplan: boolean;
  kelasRisiko?: string | null;
  isFormularium: boolean;

  nomorIzinEdar?: string | null;
  kodeEKatalog?: string | null;

  hargaSatuan: number;
  hpp?: number | null;
  het?: number | null;
  bpjsCoverage: boolean;

  catatan?: string | null;
  status: string;
}

/** Patch parsial — hanya field yang di-set yang ikut. */
export type BmhpPatch = Partial<BmhpData>;

export type BmhpEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

const ALIVE = { deletedAt: null } as const;

// Counter kode BMHP per-bulan (atomik, anti-race). Upsert by PK `periode` →
// INSERT … ON CONFLICT … RETURNING. Pola identik obatDal.nextObatSeq.
export async function nextBmhpSeq(periode: string, tx?: Tx): Promise<number> {
  const row = await db(tx).bmhpCounter.upsert({
    where: { periode },
    create: { periode, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  return row.lastSeq;
}

export function create(data: BmhpData, tx?: Tx) {
  return db(tx).bmhp.create({ data });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).bmhp.findFirst({ where: { id, ...ALIVE } });
}

export function update(id: string, data: BmhpPatch, tx?: Tx) {
  return db(tx).bmhp.update({ where: { id }, data });
}

/** Soft-delete (deletedAt + status Non_Aktif). Idempoten via where deletedAt: null. */
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).bmhp.updateMany({
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

export function list(p: ListParams, tx?: Tx) {
  const where: Record<string, unknown> = { ...ALIVE };
  if (p.kategori) where.kategori = p.kategori;
  if (p.status) where.status = p.status;
  if (p.q) {
    where.OR = [
      { kode: { contains: p.q, mode: "insensitive" } },
      { nama: { contains: p.q, mode: "insensitive" } },
      { merek: { contains: p.q, mode: "insensitive" } },
    ];
  }
  return db(tx).bmhp.findMany({
    where,
    orderBy: [{ nama: "asc" }, { id: "asc" }],
    take: p.limit,
    ...(p.cursorId ? { cursor: { id: p.cursorId }, skip: 1 } : {}),
  });
}
