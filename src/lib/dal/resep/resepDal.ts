// resepDal — Prisma murni medicalrecord.ResepOrder (+ ResepItem nested). Read filter
// deletedAt: null. Tanpa aturan bisnis. Terima `tx?`. Selaras tindakanMedisDal.

import { db, type Tx } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";

type Json = Prisma.InputJsonValue;

/** Kolom Json NULLABLE: null/undefined → SQL NULL (Prisma.DbNull), bukan literal null. */
function jsonOrDbNull(v: Json | null | undefined): Json | typeof Prisma.DbNull {
  return v == null ? Prisma.DbNull : v;
}

export interface CreateResepItemData {
  kodeObat: string;
  namaObat: string;
  bzaKode?: string | null;
  dosis?: string | null;
  dosisSekali?: string | null;
  signa?: string | null;
  jumlah: number;
  rute?: string | null;
  aturanPakai?: string | null;
  kategori: string;
  durasiHari: number;
  keterangan?: string | null;
  isHAM: boolean;
}

export interface CreateResepOrderData {
  kunjunganId: string;
  depoKode?: string | null;
  depoNama: string;
  catatan?: string | null;
  kondisiGinjal?: string | null;
  kondisiMenyusui?: string | null;
  kondisiKehamilan?: string | null;
  prioritas: string;
  status: string;
  penulis: string;
  penulisKontak?: string | null;
  tteToken?: string | null;
  tteSignedBy?: string | null;
  tteSignedAt?: Date | null;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
  items: CreateResepItemData[];
}

const withItems = { items: { orderBy: { createdAt: "asc" as const } } };

export function create(data: CreateResepOrderData, tx?: Tx) {
  const { items, ...header } = data;
  return db(tx).resepOrder.create({
    data: { ...header, items: { create: items } },
    include: withItems,
  });
}

export function listByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).resepOrder.findMany({
    where: { kunjunganId, deletedAt: null },
    include: withItems,
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).resepOrder.findUnique({ where: { id }, include: withItems });
}

const latestTelaah = { telaahs: { orderBy: { createdAt: "desc" as const }, take: 1 } };
const latestDispensing = { dispensings: { orderBy: { createdAt: "desc" as const }, take: 1 } };

const withKunjungan = {
  ...withItems,
  ...latestTelaah,
  ...latestDispensing,
  kunjungan: {
    select: {
      unit: true,
      noKunjungan: true,
      pasien: { select: { noRm: true, nama: true } },
    },
  },
};

/** Satu order + join kunjungan/pasien (detail Farmasi worklist). Filter deletedAt: null. */
export function findByIdWithKunjungan(id: string, tx?: Tx) {
  return db(tx).resepOrder.findFirst({ where: { id, deletedAt: null }, include: withKunjungan });
}

export function listForFarmasi(filter: { depoKode?: string; status?: string }, tx?: Tx) {
  return db(tx).resepOrder.findMany({
    where: {
      deletedAt: null,
      ...(filter.depoKode ? { depoKode: filter.depoKode } : {}),
      // Status eksplisit → pakai; default → kecualikan order yang dibatalkan klinisi (bukan antrian Farmasi).
      ...(filter.status ? { status: filter.status } : { status: { not: "Dibatalkan" } }),
    },
    include: withKunjungan,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

/** Transisi status ter-guard (atomik via where) — pindah hanya bila status ∈ `from`.
 *  Return count: 1 = berhasil, 0 = tak ada / status sudah lanjut (race). */
export async function transition(id: string, from: string[], to: string, tx?: Tx) {
  const r = await db(tx).resepOrder.updateMany({
    where: { id, deletedAt: null, status: { in: from } },
    data: { status: to },
  });
  return r.count;
}

/** Terima order — hanya saat "Menunggu" (non-Poli) → "Diterima" (masuk worklist). Atomic guard.
 *  Return count: 1 = berhasil, 0 = tak ada / status sudah lanjut. */
export async function receive(id: string, tx?: Tx) {
  const r = await db(tx).resepOrder.updateMany({
    where: { id, deletedAt: null, status: "Menunggu" },
    data: { status: "Diterima" },
  });
  return r.count;
}

/** Batalkan order — hanya saat masih "Menunggu" (belum disentuh Farmasi). Atomic guard via where.
 *  Return count: 1 = berhasil, 0 = tak ada / status sudah lanjut (race). */
export async function cancel(id: string, kunjunganId: string, tx?: Tx) {
  const r = await db(tx).resepOrder.updateMany({
    where: { id, kunjunganId, deletedAt: null, status: "Menunggu" },
    data: { status: "Dibatalkan" },
  });
  return r.count;
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).resepOrder.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}

// ── Telaah resep (append-only) ────────────────────────────────────────────────
export interface CreateResepTelaahData {
  resepOrderId: string;
  kunjunganId: string;
  hasil: string;
  alasanKembali?: string | null;
  catatan?: string | null;
  lulusAdministrasi: boolean;
  lulusFarmasetik: boolean;
  lulusKlinis: boolean;
  answers: unknown; // {administrasi,farmasetik,klinis} → cast ke Json di boundary
  substitusi?: unknown | null;
  justifikasiNonFormularium?: unknown | null;
  lasaKonfirmasi?: boolean | null;
  apoteker: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export function createTelaah(data: CreateResepTelaahData, tx?: Tx) {
  const { answers, substitusi, justifikasiNonFormularium, ...rest } = data;
  return db(tx).resepTelaah.create({
    data: {
      ...rest,
      answers: (answers ?? {}) as Json,
      substitusi: jsonOrDbNull(substitusi as Json | null | undefined),
      justifikasiNonFormularium: jsonOrDbNull(justifikasiNonFormularium as Json | null | undefined),
    },
  });
}

// ── Dispensing & serah (append-only) ──────────────────────────────────────────
export interface CreateResepDispensingData {
  resepOrderId: string;
  kunjunganId: string;
  edukasi: string[];
  semuaLabelDicetak: boolean;
  lasaKonfirmasi?: boolean | null;
  petugas2Nar?: string | null;
  narDoubleCheck?: boolean | null;
  apoteker: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export function createDispensing(data: CreateResepDispensingData, tx?: Tx) {
  return db(tx).resepDispensing.create({ data });
}

export type ResepOrderEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;
export type ResepOrderFarmasiEntity = NonNullable<Awaited<ReturnType<typeof findByIdWithKunjungan>>>;
export type ResepTelaahEntity = ResepOrderFarmasiEntity["telaahs"][number];
export type ResepDispensingEntity = ResepOrderFarmasiEntity["dispensings"][number];
