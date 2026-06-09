// asesmenAlergiDal — Prisma MURNI medicalrecord.Alergi (per-item) + AlergiAsesmen (header
// NKA). Model PER-ITEM: list/create/softDelete item + get/upsert header. Read filter
// deletedAt: null (soft-delete). Tanpa aturan bisnis. Terima `tx?`.

import { db, type Tx } from "@/lib/db/prisma";

// ── Item alergi ────────────────────────────────────────────────────────────---
export interface CreateAlergiData {
  kunjunganId: string;
  category: string;
  allergen: string;
  reactions: string[];
  severity: string;
  status: string;
  keterangan?: string | null;
  snomedCode?: string | null;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type AlergiEntity = Awaited<ReturnType<typeof findItemById>>;

/** Daftar alergi aktif kunjungan (terlama dulu = urut input). */
export function listByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenAlergi.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

export function createItem(data: CreateAlergiData, tx?: Tx) {
  return db(tx).asesmenAlergi.create({ data });
}

/** 1 item (tanpa filter deletedAt → utk guard kepemilikan sebelum soft-delete). */
export function findItemById(id: string, tx?: Tx) {
  return db(tx).asesmenAlergi.findUnique({ where: { id } });
}

/** Soft-delete (set deletedAt) — idempoten via where deletedAt: null. Mengembalikan count. */
export async function softDeleteItem(id: string, tx?: Tx) {
  const r = await db(tx).asesmenAlergi.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}

// ── Header NKA (1 per kunjungan) ──────────────────────────────────────────────
export interface UpsertHeaderData {
  nka: boolean;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export function getHeader(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenAlergiNka.findUnique({ where: { kunjunganId } });
}

export function upsertHeader(kunjunganId: string, data: UpsertHeaderData, tx?: Tx) {
  return db(tx).asesmenAlergiNka.upsert({
    where: { kunjunganId },
    create: { kunjunganId, ...data },
    update: { nka: data.nka, pemeriksa: data.pemeriksa, version: { increment: 1 } },
  });
}
