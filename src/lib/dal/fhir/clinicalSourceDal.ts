// clinicalSourceDal — baca rekam medis kunjungan untuk FHIR klinis inti (FH4). Prisma murni,
// read-only. TERMASUK baris soft-deleted (deletedAt) — Service mengirim `entered-in-error` untuk
// yang sudah pernah terkirim, dan mengabaikan yang belum.

import { db, type Tx } from "@/lib/db/prisma";

export function listDiagnosa(kunjunganId: string, tx?: Tx) {
  return db(tx).diagnosa.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: { id: true, kodeIcd10: true, namaDiagnosis: true, tipe: true, status: true, createdAt: true, deletedAt: true },
  });
}

export function listProsedur(kunjunganId: string, tx?: Tx) {
  return db(tx).diagnosaProsedur.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: { id: true, kode: true, nama: true, catatan: true, authorPegawaiId: true, createdAt: true, deletedAt: true },
  });
}

/**
 * SEMUA tindakan (termasuk tanpa kode ICD-9-CM) — yang tanpa kode menjadi Issue L14 di konsol, bukan
 * hilang diam-diam (FG-37). `kategori` = snapshot kategori katalog → `Procedure.category`.
 */
export function listTindakan(kunjunganId: string, tx?: Tx) {
  return db(tx).tindakanMedis.findMany({
    where: { kunjunganId },
    orderBy: { dilakukanPada: "asc" },
    select: { id: true, kode: true, nama: true, kategori: true, authorPegawaiId: true, dilakukanPada: true, deletedAt: true },
  });
}

/** TTV (append-only, tanpa soft-delete). */
export function listTtv(kunjunganId: string, tx?: Tx) {
  return db(tx).observation.findMany({
    where: { kunjunganId },
    orderBy: { waktuObservasi: "asc" },
    select: {
      id: true, tdSistolik: true, tdDiastolik: true, nadi: true, respirasi: true, suhu: true, spo2: true,
      gcsEye: true, gcsVerbal: true, gcsMotor: true, skalaNyeri: true, beratBadan: true, tinggiBadan: true,
      waktuObservasi: true, authorPegawaiId: true,
    },
  });
}

/** Nama tampil pegawai (performer/recorder display). */
export function listPegawaiNama(ids: string[], tx?: Tx) {
  if (!ids.length) return Promise.resolve([]);
  return db(tx).pegawai.findMany({
    where: { id: { in: ids } },
    select: { id: true, namaLengkap: true, gelarDepan: true, gelarBelakang: true },
  });
}

export function listAlergi(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenAlergi.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, category: true, allergen: true, reactions: true, severity: true, status: true, keterangan: true,
      snomedCode: true, bzaKode: true, authorPegawaiId: true, createdAt: true, deletedAt: true,
    },
  });
}
