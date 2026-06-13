// obatDal — akses Prisma MURNI master.Obat. Tanpa aturan bisnis. Terima `tx?`.
// Read filter deletedAt: null. Katalog leaf → tanpa optimistic-version. Pemetaan
// KFA = kolom JSONB (`kfa`), di-set/replace utuh oleh Service (blok, bukan relasi).

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

type Json = Prisma.InputJsonValue;

export interface ObatData {
  kode: string;
  namaGenerik: string;
  namaDagang: string;
  pabrik?: string | null;
  kategori: string;
  bentuk: string;
  kekuatan: string;
  satuanTerkecil?: string | null;
  rute?: string | null;

  isFormularium: boolean;
  isHAM: boolean;
  isLASA: boolean;
  lasaPairIds: string[];
  golongan?: string | null;
  isColdChain: boolean;
  isRestricted: boolean;

  indikasi?: string | null;
  kontraindikasi?: string | null;
  dosisDewasa?: string | null;
  dosisAnak?: string | null;
  efekSamping?: string | null;
  interaksiObat?: string | null;
  catatanKhusus?: string | null;

  hargaSatuan: number;
  hpp?: number | null;
  het?: number | null;
  kodeFornas?: string | null;
  bpjsCoverage: boolean;
  batasResepPerKunjungan?: number | null;

  /** Blok mapping KFA. undefined = jangan set (JSON null khusus tak dipakai). */
  kfa?: Json;
  status: string;
}

/** Patch parsial — hanya field yang di-set yang ikut. */
export type ObatPatch = Partial<ObatData>;

export type ObatEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

const ALIVE = { deletedAt: null } as const;

// Counter kode obat per-bulan (atomik, anti-race). Upsert by PK `periode` →
// INSERT … ON CONFLICT … RETURNING. Pola identik patientDal.nextNoRmSeq.
export async function nextObatSeq(periode: string, tx?: Tx): Promise<number> {
  const row = await db(tx).obatCounter.upsert({
    where: { periode },
    create: { periode, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  return row.lastSeq;
}

export function create(data: ObatData, tx?: Tx) {
  return db(tx).obat.create({ data });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).obat.findFirst({ where: { id, ...ALIVE } });
}

export function update(id: string, data: ObatPatch, tx?: Tx) {
  return db(tx).obat.update({ where: { id }, data });
}

/** Soft-delete (deletedAt + status Non_Aktif). Idempoten via where deletedAt: null. */
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).obat.updateMany({
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
      { namaGenerik: { contains: p.q, mode: "insensitive" } },
      { namaDagang: { contains: p.q, mode: "insensitive" } },
    ];
  }
  return db(tx).obat.findMany({
    where,
    orderBy: [{ namaGenerik: "asc" }, { id: "asc" }],
    take: p.limit,
    ...(p.cursorId ? { cursor: { id: p.cursorId }, skip: 1 } : {}),
  });
}
