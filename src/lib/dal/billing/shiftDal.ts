// shiftDal — Prisma murni billing.Shift (sesi buka/tutup kasir). Tanpa aturan bisnis. Terima tx?.
// Tutup = updateMany ter-guard (status Open) → snapshot totals JSONB. Kandidat kasir = user role
// "Kasir" + pegawai.unitKerja mengandung "kasir" (aktif).

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface CreateShiftData {
  counter: string;
  kasirNama: string;
  kasirPegawaiId?: string | null;
  authorUserId?: string | null;
  bukaAt: Date;
  bukaSaldoAwal: number;
  bukaCatatan?: string | null;
}

export function create(data: CreateShiftData, tx?: Tx) {
  return db(tx).shift.create({ data });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).shift.findUnique({ where: { id } });
}

/** Shift Open (semua counter) — untuk occupancy + other counters. */
export function listOpen(tx?: Tx) {
  return db(tx).shift.findMany({ where: { status: "Open" }, orderBy: { bukaAt: "desc" } });
}

/** Shift Open milik pemilik sesi (author) — "shift saya" lintas navigasi. */
export function findActiveByAuthor(authorUserId: string, tx?: Tx) {
  return db(tx).shift.findFirst({ where: { status: "Open", authorUserId }, orderBy: { bukaAt: "desc" } });
}

/** Shift Open pada counter tertentu (cek double-open). */
export function findOpenByCounter(counter: string, tx?: Tx) {
  return db(tx).shift.findFirst({ where: { status: "Open", counter } });
}

/** Recent closed shifts (desc bukaAt). */
export function listRecentClosed(limit: number, tx?: Tx) {
  return db(tx).shift.findMany({ where: { status: "Closed" }, orderBy: { bukaAt: "desc" }, take: limit });
}

export interface CloseShiftData {
  tutupSaldoAkhir: number;
  selisih: number;
  tutupCatatan?: string | null;
  supervisor?: string | null;
  totalByMetode: unknown; // breakdown per metode → JSONB snapshot (cast di boundary Prisma)
  totalTransaksi: number;
  totalRefund: number;
}

/** Tutup ter-guard (atomik via where status Open) — return count: 1 = berhasil. */
export async function closeGuarded(id: string, data: CloseShiftData, tx?: Tx): Promise<number> {
  const r = await db(tx).shift.updateMany({
    where: { id, status: "Open" },
    data: {
      status: "Closed",
      tutupAt: new Date(),
      tutupSaldoAkhir: data.tutupSaldoAkhir,
      selisih: data.selisih,
      tutupCatatan: data.tutupCatatan ?? null,
      supervisor: data.supervisor ?? null,
      totalByMetode: data.totalByMetode as Prisma.InputJsonValue,
      totalTransaksi: data.totalTransaksi,
      totalRefund: data.totalRefund,
    },
  });
  return r.count;
}

/** Kandidat kasir: user role "Kasir" + pegawai.unitKerja mengandung "kasir" + aktif. */
export function listKasirUsers() {
  return db().user.findMany({
    where: {
      deletedAt: null,
      status: "Active",
      roles: { some: { role: { key: "Kasir" } } },
      pegawai: { isActive: true, deletedAt: null, unitKerja: { contains: "kasir", mode: "insensitive" } },
    },
    select: {
      pegawaiId: true,
      pegawai: { select: { namaLengkap: true, gelarDepan: true, gelarBelakang: true } },
    },
    orderBy: { pegawai: { namaLengkap: "asc" } },
  });
}

export type ShiftEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;
