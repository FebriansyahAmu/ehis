// disposisiDal — Prisma murni medicalrecord.Disposisi (append latest-wins per kunjungan).
// Read filter deletedAt: null, urut createdAt desc (terbaru = berlaku). Tanpa aturan bisnis.
// Terima `tx?`. create dipanggil oleh kunjunganService dalam transaksi "complete" (atomik).

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateDisposisiData {
  kunjunganId: string;
  jenis: string;
  waktuKeluar: Date;
  dokter: string;
  kondisiUmum: string;
  diagnosaKeluar: string[];
  instruksi: string;
  rujukTujuan?: string | null;
  rujukAlasan?: string | null;
  meninggalWaktu?: string | null;
  meninggalSebab?: string | null;
  apsAlasan?: string | null;
  rawatInapRuangan?: string | null;
  rawatInapKelas?: string | null;
  catatan?: string | null;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type DisposisiEntity = NonNullable<Awaited<ReturnType<typeof findLatest>>>;

/** Disposisi terbaru aktif per kunjungan (berlaku). Null bila belum ada. */
export function findLatest(kunjunganId: string, tx?: Tx) {
  return db(tx).disposisi.findFirst({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export function create(data: CreateDisposisiData, tx?: Tx) {
  return db(tx).disposisi.create({ data });
}
