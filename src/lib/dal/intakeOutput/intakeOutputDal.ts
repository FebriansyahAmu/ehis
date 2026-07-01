// intakeOutputDal — Prisma murni medicalrecord.IntakeOutput (entri, append-only + soft-delete)
// + IntakeOutputTarget (latest-wins). Tanpa aturan bisnis. Terima `tx?`. Selaras observationDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateEntryData {
  kunjunganId: string;
  tipe: string;
  kategori: string;
  subKategori: string;
  volume: number;
  shift: string;
  catatan: string;
  waktu: Date;
  pencatat: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export interface CreateTargetData {
  kunjunganId: string;
  restriksiIntake: number | null;
  targetBalance: number | null;
  catatan: string;
  updatedBy: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type EntryEntity = NonNullable<Awaited<ReturnType<typeof findEntryById>>>;
export type TargetEntity = NonNullable<Awaited<ReturnType<typeof latestTarget>>>;

// ── Entri ───────────────────────────────────────────────────────────────
export function listEntries(kunjunganId: string, tx?: Tx) {
  return db(tx).intakeOutput.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: [{ waktu: "asc" }, { createdAt: "asc" }],
  });
}

export function findEntryById(id: string, tx?: Tx) {
  return db(tx).intakeOutput.findUnique({ where: { id } });
}

export function createEntry(data: CreateEntryData, tx?: Tx) {
  return db(tx).intakeOutput.create({ data });
}

export async function softDeleteEntry(id: string, tx?: Tx) {
  const r = await db(tx).intakeOutput.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}

// ── Target (latest-wins) ────────────────────────────────────────────────
export function latestTarget(kunjunganId: string, tx?: Tx) {
  return db(tx).intakeOutputTarget.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

export function createTarget(data: CreateTargetData, tx?: Tx) {
  return db(tx).intakeOutputTarget.create({ data });
}
