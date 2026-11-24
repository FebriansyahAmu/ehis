// mutasiDal — akses Prisma MURNI domain encounter.Mutasi. Tanpa aturan bisnis; `tx?` milik Service.

import type { Prisma } from "@/generated/prisma/client";
import { db, type Tx } from "@/lib/db/prisma";

export interface CreateMutasiData {
  kunjunganId: string;
  dariRuanganId: string | null;
  dariRuanganNama: string | null;
  dariBedId: string | null;
  dariBedKode: string | null;
  dariKelas: string | null;
  keRuanganId: string;
  keRuanganNama: string;
  keBedId: string | null;
  keBedKode: string | null;
  keKelas: string | null;
  alasan: string;
  catatan: string | null;
  diajukanOleh: string;
  diajukanOlehUserId: string | null;
}

export type MutasiEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function create(data: CreateMutasiData, tx?: Tx) {
  return db(tx).mutasi.create({ data });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).mutasi.findUnique({ where: { id } });
}

export function findPendingByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).mutasi.findFirst({ where: { kunjunganId, status: "Diajukan" } });
}

/** Semua mutasi kunjungan, terbaru dulu. */
export function listByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).mutasi.findMany({ where: { kunjunganId }, orderBy: { diajukanAt: "desc" } });
}

/** Diajukan → Selesai (guard status + versi). Mengembalikan count (0 = sudah berubah). */
export async function markSelesai(id: string, version: number, oleh: string, when: Date, tx?: Tx): Promise<number> {
  const res = await db(tx).mutasi.updateMany({
    where: { id, version, status: "Diajukan" },
    data: { status: "Selesai", selesaiOleh: oleh, selesaiAt: when, version: { increment: 1 } },
  });
  return res.count;
}

/** Diajukan → Dibatalkan (guard status + versi). */
export async function markBatal(id: string, version: number, oleh: string, alasan: string, when: Date, tx?: Tx): Promise<number> {
  const res = await db(tx).mutasi.updateMany({
    where: { id, version, status: "Diajukan" },
    data: { status: "Dibatalkan", dibatalkanOleh: oleh, dibatalkanAt: when, alasanBatal: alasan, version: { increment: 1 } },
  });
  return res.count;
}

/** Batalkan otomatis mutasi yang masih Diajukan (kunjungan selesai/dibatalkan → bed dilepas). */
export async function cancelPendingByKunjungan(kunjunganId: string, alasan: string, when: Date, tx?: Tx): Promise<number> {
  const res = await db(tx).mutasi.updateMany({
    where: { kunjunganId, status: "Diajukan" },
    data: { status: "Dibatalkan", dibatalkanOleh: "Sistem", dibatalkanAt: when, alasanBatal: alasan, version: { increment: 1 } },
  });
  return res.count;
}

export async function saveLembar(id: string, lembar: Prisma.InputJsonValue, oleh: string, when: Date, tx?: Tx): Promise<number> {
  const res = await db(tx).mutasi.updateMany({
    where: { id, status: { in: ["Diajukan", "Selesai"] } },
    data: { lembarTransfer: lembar, lembarDiisiOleh: oleh, lembarDiisiAt: when, version: { increment: 1 } },
  });
  return res.count;
}
