// radResultDal — Prisma murni medicalrecord.RadResult (laporan ekspertise tunggal per order).
// Append-only "latest wins" (revisi = baris baru). Tanpa aturan bisnis. Terima `tx?`. Selaras labResultDal.

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface CreateRadResultData {
  radOrderId: string;
  kunjunganId: string;
  indikasiKlinis?: string | null;
  teknik?: string | null;
  temuan?: string | null;
  kesan?: string | null;
  saran?: string | null;
  radiolog: string;
  radiologSip?: string | null;
  radiografer?: string | null;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
  criticalNotifs?: unknown; // CriticalFinding[]
}

export function create(data: CreateRadResultData, tx?: Tx) {
  const { criticalNotifs, ...header } = data;
  return db(tx).radResult.create({
    data: {
      ...header,
      criticalNotifs: (criticalNotifs ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

/** Hasil terbaru untuk 1 order (append-only latest wins). */
export function findLatestByOrder(radOrderId: string, tx?: Tx) {
  return db(tx).radResult.findFirst({
    where: { radOrderId },
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
  const r = await db(tx).radResult.updateMany({
    where: { id, validatedAt: null },
    data,
  });
  return r.count;
}

export type RadResultEntity = NonNullable<Awaited<ReturnType<typeof findLatestByOrder>>>;
