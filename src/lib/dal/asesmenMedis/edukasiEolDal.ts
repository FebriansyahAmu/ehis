// edukasiEolDal — Prisma MURNI: AsesmenEdukasiEol (care plan, latest-wins) +
// AsesmenEdukasiEolMeeting (log, soft-delete). Tanpa aturan bisnis. Terima `tx?`.

import { db, type Tx } from "@/lib/db/prisma";

// ── Care plan ──────────────────────────────────────────────────────────────---
export interface CreateEolPlanData {
  kunjunganId: string;
  codeStatus: string;
  alasanKode?: string | null;
  pengambilKeputusan: string;
  namaWali?: string | null;
  hubunganWali?: string | null;
  kontakWali?: string | null;
  advanceDirective: boolean;
  terapiDiinginkan: string[];
  terapiDitolak: string[];
  tujuanPerawatan?: string | null;
  gejalaDitangani?: string | null;
  kebutuhanSpiritual?: string | null;
  petugasPaliatif?: string | null;
  tanggalDNR?: string | null;
  dokterDNR?: string | null;
  catatanDNR?: string | null;
  petugas: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type EolPlanEntity = NonNullable<Awaited<ReturnType<typeof latestPlan>>>;

export function createPlan(data: CreateEolPlanData, tx?: Tx) {
  return db(tx).asesmenEdukasiEol.create({ data });
}

/** Care plan terbaru (latest by createdAt) milik kunjungan. */
export function latestPlan(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenEdukasiEol.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

// ── Family meeting log ─────────────────────────────────────────────────────---
export interface CreateEolMeetingData {
  kunjunganId: string;
  tanggal?: string | null;
  peserta: string;
  topik: string;
  keputusan?: string | null;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type EolMeetingEntity = Awaited<ReturnType<typeof listMeetings>>[number];

const MEETING_LIMIT = 100;

export function createMeeting(data: CreateEolMeetingData, tx?: Tx) {
  return db(tx).asesmenEdukasiEolMeeting.create({ data });
}

/** Log pertemuan keluarga kunjungan (terbaru dulu, aktif). */
export function listMeetings(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenEdukasiEolMeeting.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: MEETING_LIMIT,
  });
}

/** 1 meeting (tanpa filter deletedAt → guard kepemilikan sebelum soft-delete). */
export function findMeetingById(id: string, tx?: Tx) {
  return db(tx).asesmenEdukasiEolMeeting.findUnique({ where: { id } });
}

/** Soft-delete 1 meeting. Idempoten via where deletedAt: null. */
export async function softDeleteMeeting(id: string, tx?: Tx) {
  const r = await db(tx).asesmenEdukasiEolMeeting.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}
