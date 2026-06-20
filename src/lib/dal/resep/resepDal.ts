// resepDal — Prisma murni medicalrecord.ResepOrder (+ ResepItem nested). Read filter
// deletedAt: null. Tanpa aturan bisnis. Terima `tx?`. Selaras tindakanMedisDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateResepItemData {
  kodeObat: string;
  namaObat: string;
  bzaKode?: string | null;
  dosis?: string | null;
  dosisSekali?: string | null;
  signa?: string | null;
  jumlah: number;
  rute?: string | null;
  aturanPakai?: string | null;
  kategori: string;
  durasiHari: number;
  keterangan?: string | null;
  isHAM: boolean;
}

export interface CreateResepOrderData {
  kunjunganId: string;
  depoKode?: string | null;
  depoNama: string;
  catatan?: string | null;
  kondisiGinjal?: string | null;
  kondisiMenyusui?: string | null;
  kondisiKehamilan?: string | null;
  prioritas: string;
  status: string;
  penulis: string;
  penulisKontak?: string | null;
  tteToken?: string | null;
  tteSignedBy?: string | null;
  tteSignedAt?: Date | null;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
  items: CreateResepItemData[];
}

const withItems = { items: { orderBy: { createdAt: "asc" as const } } };

export function create(data: CreateResepOrderData, tx?: Tx) {
  const { items, ...header } = data;
  return db(tx).resepOrder.create({
    data: { ...header, items: { create: items } },
    include: withItems,
  });
}

export function listByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).resepOrder.findMany({
    where: { kunjunganId, deletedAt: null },
    include: withItems,
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).resepOrder.findUnique({ where: { id }, include: withItems });
}

export function listForFarmasi(filter: { depoKode?: string; status?: string }, tx?: Tx) {
  return db(tx).resepOrder.findMany({
    where: {
      deletedAt: null,
      ...(filter.depoKode ? { depoKode: filter.depoKode } : {}),
      // Status eksplisit → pakai; default → kecualikan order yang dibatalkan klinisi (bukan antrian Farmasi).
      ...(filter.status ? { status: filter.status } : { status: { not: "Dibatalkan" } }),
    },
    include: {
      ...withItems,
      kunjungan: {
        select: {
          unit: true,
          noKunjungan: true,
          pasien: { select: { noRm: true, nama: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

/** Batalkan order — hanya saat masih "Menunggu" (belum disentuh Farmasi). Atomic guard via where.
 *  Return count: 1 = berhasil, 0 = tak ada / status sudah lanjut (race). */
export async function cancel(id: string, kunjunganId: string, tx?: Tx) {
  const r = await db(tx).resepOrder.updateMany({
    where: { id, kunjunganId, deletedAt: null, status: "Menunggu" },
    data: { status: "Dibatalkan" },
  });
  return r.count;
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).resepOrder.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}

export type ResepOrderEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;
export type ResepOrderFarmasiEntity = Awaited<ReturnType<typeof listForFarmasi>>[number];
