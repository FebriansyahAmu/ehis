// icdDal — akses Prisma MURNI master.IcdCode (referensi ICD-10/ICD-9). Tanpa aturan
// bisnis. Terima `tx?`. Read filter deletedAt: null. Enum di-ketik string-union lokal
// (DAL "loose", tak tergantung tipe Prisma generated — selaras ruanganDal/kunjunganDal).
// Vocab = DB (ICD_10/cs_version); pemetaan ⇄ FE ada di Service.

import { db, type Tx } from "@/lib/db/prisma";

type IcdJenisDb = "ICD_10" | "ICD_9";

export interface CreateIcdData {
  jenis: IcdJenisDb;
  kode: string;
  display: string;
  csVersion: string;
  namaInggris?: string | null;
  chapter?: string | null;
  blok?: string | null;
  inaCbg?: string | null;
  active?: boolean;
}
export type UpdateIcdData = Partial<Omit<CreateIcdData, "jenis">>;

export type IcdEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

const ALIVE = { deletedAt: null } as const;

// ── Single ────────────────────────────────────────────────────────────────---
export function create(data: CreateIcdData, tx?: Tx) {
  return db(tx).icdCode.create({ data });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).icdCode.findFirst({ where: { id, ...ALIVE } });
}

/** Patch parsial (tanpa optimistic-version: reference leaf). Mengembalikan count. */
export async function update(id: string, data: UpdateIcdData, tx?: Tx) {
  const r = await db(tx).icdCode.updateMany({ where: { id, ...ALIVE }, data });
  return r.count;
}

/** Soft-delete (deletedAt + active:false). Idempoten via where deletedAt: null. */
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).icdCode.updateMany({
    where: { id, ...ALIVE },
    data: { deletedAt: new Date(), active: false },
  });
  return r.count;
}

// ── List (filter + keyset cursor) ─────────────────────────────────────────────
export interface ListParams {
  jenis?: IcdJenisDb;
  q?: string;           // cari kode/display (case-insensitive)
  active?: boolean;     // undefined = semua status
  cursorId?: string;    // id baris terakhir halaman sebelumnya
  limit: number;        // jumlah baris diminta (Service kirim limit+1 utk deteksi hasMore)
}

export function list(p: ListParams, tx?: Tx) {
  const where: Record<string, unknown> = { ...ALIVE };
  if (p.jenis) where.jenis = p.jenis;
  if (p.active !== undefined) where.active = p.active;
  if (p.q) {
    where.OR = [
      { kode: { contains: p.q, mode: "insensitive" } },
      { display: { contains: p.q, mode: "insensitive" } },
    ];
  }
  return db(tx).icdCode.findMany({
    where,
    orderBy: [{ kode: "asc" }, { id: "asc" }],
    take: p.limit,
    ...(p.cursorId ? { cursor: { id: p.cursorId }, skip: 1 } : {}),
  });
}

// ── Bulk import ───────────────────────────────────────────────────────────────
/** Insert massal; lewati baris dgn (jenis,kode) yang sudah ada (unique). Return count baru. */
export async function createManySkip(data: CreateIcdData[], tx?: Tx) {
  const r = await db(tx).icdCode.createMany({ data, skipDuplicates: true });
  return r.count;
}
