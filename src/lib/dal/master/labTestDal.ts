// labTestDal — akses Prisma MURNI master.LabTest (+ LabParameter anak). Tanpa aturan
// bisnis. Terima `tx?`. Read filter deletedAt: null. Katalog leaf → tanpa optimistic-
// version. Parameter = anak Tes (cascade) → di-replace utuh saat update (deleteMany+create).
// Rentang rujukan numerik per-parameter = JSONB (array baris).

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface RujukanData {
  gender: "L" | "P" | "LP";
  usiaMin?: number;
  usiaMax?: number;
  low: number;
  high: number;
  keterangan?: string;
}

export interface ParameterData {
  nama: string;
  satuan?: string;
  tipeHasil?: string;
  nilaiNormalText?: string | null;
  rujukan?: RujukanData[];
  criticalLow?: number | null;
  criticalHigh?: number | null;
  deltaAbsolute?: number | null;
  deltaPercent?: number | null;
  metode?: string | null;
  urutan?: number;
}

export interface CreateLabTestData {
  kode: string;
  nama: string;
  kategori: string;
  spesimen?: string | null;
  metode?: string | null;
  waktuTunggu?: string | null;
  keterangan?: string | null;
  active?: boolean;
  parameters: ParameterData[];
}

export interface UpdateLabTestData {
  kode?: string;
  nama?: string;
  kategori?: string;
  spesimen?: string | null;
  metode?: string | null;
  waktuTunggu?: string | null;
  keterangan?: string | null;
  active?: boolean;
  /** Bila ada → ganti SELURUH parameter (replace-all). */
  parameters?: ParameterData[];
}

export type LabTestEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

const ALIVE = { deletedAt: null } as const;
const INCLUDE = { parameters: { orderBy: { urutan: "asc" as const } } };

/** ParameterData → input nested create Prisma (rujukan → JSON). */
function toParamCreate(p: ParameterData) {
  return {
    nama: p.nama,
    satuan: p.satuan ?? "",
    tipeHasil: p.tipeHasil ?? "Numerik",
    nilaiNormalText: p.nilaiNormalText ?? null,
    rujukan: (p.rujukan ?? []) as unknown as Prisma.InputJsonValue,
    criticalLow: p.criticalLow ?? null,
    criticalHigh: p.criticalHigh ?? null,
    deltaAbsolute: p.deltaAbsolute ?? null,
    deltaPercent: p.deltaPercent ?? null,
    metode: p.metode ?? null,
    urutan: p.urutan ?? 0,
  };
}

// ── Single ────────────────────────────────────────────────────────────────────
export function create(data: CreateLabTestData, tx?: Tx) {
  const { parameters, ...rest } = data;
  return db(tx).labTest.create({
    data: { ...rest, parameters: { create: parameters.map(toParamCreate) } },
    include: INCLUDE,
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).labTest.findFirst({ where: { id, ...ALIVE }, include: INCLUDE });
}

/** Batch read by ids (+parameter) — entry hasil ambil parameter katalog per tes diorder. */
export function findByIds(ids: string[], tx?: Tx) {
  return db(tx).labTest.findMany({ where: { id: { in: ids }, ...ALIVE }, include: INCLUDE });
}

/**
 * Patch parsial. Bila `parameters` diberikan → replace-all (deleteMany + create) dalam
 * satu update atomik. Pakai update unique (id) → guard eksistensi/alive di Service.
 */
export function update(id: string, data: UpdateLabTestData, tx?: Tx) {
  const { parameters, ...rest } = data;
  return db(tx).labTest.update({
    where: { id },
    data: {
      ...rest,
      ...(parameters ? { parameters: { deleteMany: {}, create: parameters.map(toParamCreate) } } : {}),
    },
    include: INCLUDE,
  });
}

/** Soft-delete (deletedAt + active:false). Idempoten via where deletedAt: null. Return count. */
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).labTest.updateMany({
    where: { id, ...ALIVE },
    data: { deletedAt: new Date(), active: false },
  });
  return r.count;
}

// ── List (filter + keyset cursor) ───────────────────────────────────────────────
export interface ListParams {
  q?: string;
  kategori?: string;
  active?: boolean;
  cursorId?: string;
  limit: number;
}

export function list(p: ListParams, tx?: Tx) {
  const where: Record<string, unknown> = { ...ALIVE };
  if (p.kategori) where.kategori = p.kategori;
  if (p.active !== undefined) where.active = p.active;
  if (p.q) {
    where.OR = [
      { kode: { contains: p.q, mode: "insensitive" } },
      { nama: { contains: p.q, mode: "insensitive" } },
    ];
  }
  return db(tx).labTest.findMany({
    where,
    include: INCLUDE,
    orderBy: [{ nama: "asc" }, { id: "asc" }],
    take: p.limit,
    ...(p.cursorId ? { cursor: { id: p.cursorId }, skip: 1 } : {}),
  });
}
