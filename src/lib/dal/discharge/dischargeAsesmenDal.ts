// dischargeAsesmenDal — Prisma murni medicalrecord.DischargeAsesmen (append-only "latest wins"
// per kunjungan). Tanpa aturan bisnis. Terima `tx?`. Selaras intakeOutputDal (target latest-wins).

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateDischargeAsesmenData {
  kunjunganId: string;
  tanggalRencanaKrs: string;
  kondisiPulang: string;
  caregiverNama: string;
  caregiverHubungan: string;
  caregiverKemampuan: string;
  kebutuhanHomecare: boolean;
  jenisHomecare: string[];
  kebutuhanAlatBantu: boolean;
  alatBantu: string[];
  dukunganKeluarga: string;
  kepatuhanObatSebelumnya: string;
  riwayatReadmisi: string;
  catatan: string;
  pencatat: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type DischargeAsesmenEntity = NonNullable<Awaited<ReturnType<typeof latest>>>;

/** Revisi terkini (latest-wins) per kunjungan. */
export function latest(kunjunganId: string, tx?: Tx) {
  return db(tx).dischargeAsesmen.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

export function create(data: CreateDischargeAsesmenData, tx?: Tx) {
  return db(tx).dischargeAsesmen.create({ data });
}
