// rujukanEksternalDal — Prisma murni medicalrecord.RujukanEksternal (+ counter nomor).
// Read filter deletedAt: null (terbaru dulu). `detail` = JSONB snapshot penuh (RujukanDetail).
// Tanpa aturan bisnis. Terima `tx?`. Selaras suratSakitDal.

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { RujukanDetail } from "@/lib/schemas/rujukanEksternal/rujukanEksternal";

export interface CreateRujukanEksternalData {
  kunjunganId: string;
  nomor: string;
  detail: RujukanDetail;
  pencatat: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type RujukanEksternalEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).rujukanEksternal.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).rujukanEksternal.findUnique({ where: { id } });
}

export function create(data: CreateRujukanEksternalData, tx?: Tx) {
  return db(tx).rujukanEksternal.create({
    data: {
      kunjunganId: data.kunjunganId,
      nomor: data.nomor,
      detail: data.detail as unknown as Prisma.InputJsonValue,
      pencatat: data.pencatat,
      authorUserId: data.authorUserId ?? null,
      authorPegawaiId: data.authorPegawaiId ?? null,
    },
  });
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).rujukanEksternal.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}

/** Naikkan counter nomor per-scope ("RUJ-<YYMM>") atomik, kembalikan seq baru. */
export async function nextSeq(scope: string, tx?: Tx): Promise<number> {
  const r = await db(tx).rujukanEksternalCounter.upsert({
    where: { scope },
    create: { scope, seq: 1 },
    update: { seq: { increment: 1 } },
  });
  return r.seq;
}
