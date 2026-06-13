// rekonsiliasiDal — Prisma murni medicalrecord.Rekonsiliasi (parent + child obat). Append-only:
// create = parent + nested children; list include obatList (urut). Tanpa aturan bisnis. Terima `tx?`.
// Selaras asesmenObatDal (parent+child snapshot).

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateRekonsiliasiObat {
  namaObat: string;
  dosis?: string | null;
  rute?: string | null;
  frekuensi?: string | null;
  sumber?: string | null;
  keputusan: string;
  gantiDengan?: string | null;
  alasan?: string | null;
  isHAM: boolean;
}

export interface CreateRekonsiliasiData {
  kunjunganId: string;
  fase: string;
  selesai: boolean;
  catatan?: string | null;
  waktu: Date;
  petugas: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
  obatList: CreateRekonsiliasiObat[];
}

const includeObat = { obatList: { orderBy: { urutan: "asc" as const } } };

export type RekonsiliasiEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

/** Semua snapshot per kunjungan (riwayat — terbaru dulu). Include baris obat. */
export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).rekonsiliasi.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
    include: includeObat,
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).rekonsiliasi.findUnique({ where: { id }, include: includeObat });
}

/** Buat 1 snapshot (parent + children obat). */
export function create(data: CreateRekonsiliasiData, tx?: Tx) {
  const { obatList, ...parent } = data;
  return db(tx).rekonsiliasi.create({
    data: {
      ...parent,
      obatList: {
        create: obatList.map((o, i) => ({
          namaObat: o.namaObat,
          dosis: o.dosis ?? null,
          rute: o.rute ?? null,
          frekuensi: o.frekuensi ?? null,
          sumber: o.sumber ?? null,
          keputusan: o.keputusan,
          gantiDengan: o.gantiDengan ?? null,
          alasan: o.alasan ?? null,
          isHAM: o.isHAM,
          urutan: i,
        })),
      },
    },
    include: includeObat,
  });
}
