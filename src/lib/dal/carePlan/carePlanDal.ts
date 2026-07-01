// carePlanDal — Prisma murni medicalrecord.CarePlanMasalah (parent) + CarePlanGoal (anak).
// Read filter deletedAt: null + include goals (deletedAt null, urut waktu). Tanpa aturan bisnis.
// Terima `tx?`. Selaras asuhanKeperawatanDal (parent/child + soft-delete).

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

// Include goals (anak) hidup — urut kronologis utk timeline target.
const withGoals = {
  goals: { where: { deletedAt: null }, orderBy: [{ waktu: "asc" }, { createdAt: "asc" }] },
} satisfies Prisma.CarePlanMasalahInclude;

export interface CreateMasalahData {
  kunjunganId: string;
  masalah: string;
  sumber: string;
  refKode: string;
  fase: string | null;
  prioritas: string | null;
  status: string;
  tanggalInput: Date;
  pencatat: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export interface UpdateMasalahData {
  masalah?: string;
  sumber?: string;
  refKode?: string;
  fase?: string | null;
  prioritas?: string | null;
  status?: string;
  tanggalInput?: Date;
  pencatat?: string;
  verified?: boolean;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
}

export interface CreateGoalData {
  masalahId: string;
  ppa: string;
  target: string;
  indikator: string;
  targetWaktu: string;
  intervensi: string[];
  status: string;
  evaluasi: string;
  waktu: Date;
  pencatat: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export interface UpdateGoalData {
  ppa?: string;
  target?: string;
  indikator?: string;
  targetWaktu?: string;
  intervensi?: string[];
  status?: string;
  evaluasi?: string;
  waktu?: Date;
  pencatat?: string;
}

export type MasalahEntity = NonNullable<Awaited<ReturnType<typeof findMasalahById>>>;
export type GoalEntity = MasalahEntity["goals"][number];

// ── Masalah (parent) ────────────────────────────────────────────────────
export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).carePlanMasalah.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: withGoals,
  });
}

export function findMasalahById(id: string, tx?: Tx) {
  return db(tx).carePlanMasalah.findUnique({ where: { id }, include: withGoals });
}

export function createMasalah(data: CreateMasalahData, tx?: Tx) {
  return db(tx).carePlanMasalah.create({ data, include: withGoals });
}

export async function updateMasalah(id: string, data: UpdateMasalahData, tx?: Tx) {
  const r = await db(tx).carePlanMasalah.updateMany({ where: { id, deletedAt: null }, data });
  return r.count;
}

export async function softDeleteMasalah(id: string, tx?: Tx) {
  const r = await db(tx).carePlanMasalah.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}

// ── Goal (anak) ─────────────────────────────────────────────────────────
export function createGoal(data: CreateGoalData, tx?: Tx) {
  return db(tx).carePlanGoal.create({ data });
}

export function findGoalById(id: string, tx?: Tx) {
  return db(tx).carePlanGoal.findUnique({ where: { id } });
}

export async function updateGoal(id: string, data: UpdateGoalData, tx?: Tx) {
  const r = await db(tx).carePlanGoal.updateMany({ where: { id, deletedAt: null }, data });
  return r.count;
}

export async function softDeleteGoal(id: string, tx?: Tx) {
  const r = await db(tx).carePlanGoal.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}
