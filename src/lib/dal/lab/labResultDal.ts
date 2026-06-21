// labResultDal — Prisma murni medicalrecord.LabResult (+ LabResultValue nested). Append-only
// "latest wins" (tanpa soft-delete; revisi = baris baru). Tanpa aturan bisnis. Terima `tx?`.

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface CreateLabValueData {
  rowKey: string;
  labTestId?: string | null;
  labParameterId?: string | null;
  kodeTes: string;
  nama: string;
  kategori: string;
  nilai?: string | null;
  satuan: string;
  rujukanStr: string;
  nilaiMin?: number | null;
  nilaiMax?: number | null;
  criticalLow?: number | null;
  criticalHigh?: number | null;
  flag?: string | null;
  urutan: number;
}

export interface CreateLabResultData {
  labOrderId: string;
  kunjunganId: string;
  analis: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
  catatan?: string | null;
  criticalNotifs?: unknown;
  values: CreateLabValueData[];
}

const withValues = { values: { orderBy: { urutan: "asc" as const } } };

export function create(data: CreateLabResultData, tx?: Tx) {
  const { values, criticalNotifs, ...header } = data;
  return db(tx).labResult.create({
    data: {
      ...header,
      criticalNotifs: (criticalNotifs ?? undefined) as Prisma.InputJsonValue | undefined,
      values: { create: values },
    },
    include: withValues,
  });
}

/** Hasil terbaru untuk 1 order (append-only latest wins). */
export function findLatestByOrder(labOrderId: string, tx?: Tx) {
  return db(tx).labResult.findFirst({
    where: { labOrderId },
    include: withValues,
    orderBy: { createdAt: "desc" },
  });
}

export interface ValidationData {
  validator: string;
  validatorUserId?: string | null;
  catatanValidator?: string | null;
  validatedAt: Date;
}

/** Stamp validasi pada 1 hasil — hanya bila belum divalidasi (guard `validated_at` null).
 *  Return count: 1 = berhasil, 0 = sudah divalidasi (race). */
export async function stampValidation(id: string, data: ValidationData, tx?: Tx) {
  const r = await db(tx).labResult.updateMany({
    where: { id, validatedAt: null },
    data,
  });
  return r.count;
}

export type LabResultEntity = NonNullable<Awaited<ReturnType<typeof findLatestByOrder>>>;
