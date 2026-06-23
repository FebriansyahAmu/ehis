// radAkuisisiDal — Prisma murni medicalrecord.RadAkuisisi (akuisisi & dosis, opsional).
// Append-only "latest wins" (revisi = baris baru). Tanpa aturan bisnis. Terima `tx?`. Selaras radResultDal.

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface CreateRadAkuisisiData {
  radOrderId: string;
  kunjunganId: string;
  radiografer?: unknown;  // RadiograferRef[]
  paramTeknis?: unknown;  // {kvp,mas,fov,slice,probe,frekuensi,sekuens,kv,mAs}
  proteksi?: unknown;     // ProteksiChecklist
  dosis?: unknown;        // DosisLog
  mulaiAt?: Date | null;
  selesaiAt?: Date | null;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

const asJson = (v: unknown) => (v ?? undefined) as Prisma.InputJsonValue | undefined;

export function create(data: CreateRadAkuisisiData, tx?: Tx) {
  const { radiografer, paramTeknis, proteksi, dosis, ...rest } = data;
  return db(tx).radAkuisisi.create({
    data: {
      ...rest,
      radiografer: asJson(radiografer),
      paramTeknis: asJson(paramTeknis),
      proteksi: asJson(proteksi),
      dosis: asJson(dosis),
    },
  });
}

/** Akuisisi terbaru untuk 1 order (append-only latest wins; null bila belum ada). */
export function findLatestByOrder(radOrderId: string, tx?: Tx) {
  return db(tx).radAkuisisi.findFirst({
    where: { radOrderId },
    orderBy: { createdAt: "desc" },
  });
}

export type RadAkuisisiEntity = NonNullable<Awaited<ReturnType<typeof findLatestByOrder>>>;
