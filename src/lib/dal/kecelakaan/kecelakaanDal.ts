// kecelakaanDal — akses Prisma MURNI encounter.Kecelakaan (1:1 kunjungan). Tanpa aturan bisnis.
// Terima `tx?` (transaksi dimiliki Service). Mapping FE↔entity di-resolve Service. Enum = TEXT.

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface KendaraanRow {
  jenis: string;
  noPol: string;
  peran: string;
}

export interface KecelakaanData {
  jenis: string;
  tglKejadian: Date | null;
  waktuKejadian: string | null;
  provinsi: string | null;
  lokasi: string | null;
  kronologi: string | null;
  mekanismeTrauma: string | null;
  statusLp: string | null;
  noLapPol: string | null;
  satuanPolisi: string | null;
  kendaraan: KendaraanRow[];
  penjaminLanjutan: string | null;
  statusKoordinasiJr: string | null;
  namaPerusahaan: string | null;
  noKpj: string | null;
  jenisPekerjaan: string | null;
  lokasiKerja: string | null;
  statusKlaim: string;
  nomorKlaim: string | null;
}

export type KecelakaanEntity = Awaited<ReturnType<typeof findByKunjungan>>;

export function findByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).kecelakaan.findFirst({ where: { kunjunganId, deletedAt: null } });
}

/** Upsert by kunjunganId (1:1 @unique). Data kecelakaan = snapshot penuh (last-write-wins);
 *  update mengganti seluruh field + bump version (audit). */
export function upsertByKunjungan(kunjunganId: string, data: KecelakaanData, tx?: Tx) {
  // kendaraan JSONB — cast ke InputJsonValue (array interface tak punya index signature).
  const { kendaraan, ...rest } = data;
  const payload = { ...rest, kendaraan: kendaraan as unknown as Prisma.InputJsonValue };
  return db(tx).kecelakaan.upsert({
    where: { kunjunganId },
    create: { kunjunganId, ...payload },
    update: { ...payload, version: { increment: 1 } },
  });
}
