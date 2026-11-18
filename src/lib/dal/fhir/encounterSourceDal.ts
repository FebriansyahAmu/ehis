// encounterSourceDal — baca state kunjungan untuk membangun FHIR Encounter (FH3). Prisma murni,
// read-only. Referensi lintas-schema (DPJP=master.Dokter.id, ruangan=master.Location.id) di-resolve
// dengan query terpisah (soft-ref, tanpa FK).

import { db, type Tx } from "@/lib/db/prisma";

export function getKunjungan(id: string, tx?: Tx) {
  return db(tx).kunjungan.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true, noKunjungan: true, unit: true, status: true, patientId: true,
      waktuKunjungan: true, dilayaniAt: true, selesaiAt: true,
      dpjpId: true, ruanganId: true, kelas: true, kelasHak: true, titipan: true,
      pasien: { select: { nama: true } },
      // Disposisi BERLAKU = terbaru yang belum dihapus (Batal Selesai men-soft-delete).
      disposisiRiwayat: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, jenis: true, rujukTujuan: true, instruksi: true, kondisiUmum: true, waktuKeluar: true },
      },
    },
  });
}

/** Dokter (master) → pegawaiId (kunci peta Practitioner) + nama tampil. */
export function getDokter(dokterId: string, tx?: Tx) {
  return db(tx).dokter.findFirst({
    where: { id: dokterId },
    select: { pegawaiId: true, pegawai: { select: { namaLengkap: true, gelarDepan: true, gelarBelakang: true } } },
  });
}


/** Resume medis revisi TERBARU (append-only latest-wins) — sumber Composition (FH7). */
export function getLatestResume(kunjunganId: string, tx?: Tx) {
  return db(tx).resumeMedik.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, ringkasanKlinis: true, kondisiMasuk: true, kondisiPulang: true,
      authorPegawaiId: true, tteSignedAt: true, createdAt: true,
    },
  });
}

/** Anamnesis TERBARU (append-only latest-wins) — keluhan utama / Condition CC (L03) + RPS / ClinicalImpression (L27). */
export function getLatestAnamnesis(kunjunganId: string, tx?: Tx) {
  return db(tx).anamnesis.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, keluhanUtama: true, keluhanSnomedKode: true, keluhanSnomedDisplay: true, rps: true,
      authorPegawaiId: true, createdAt: true,
    },
  });
}

/** Waktu triase PERTAMA (IGD) — status `triaged` di Encounter.statusHistory (L01). */
export async function getFirstTriaseWaktu(kunjunganId: string, tx?: Tx): Promise<Date | null> {
  const t = await db(tx).triase.findFirst({
    where: { kunjunganId },
    orderBy: { waktuTriase: "asc" },
    select: { waktuTriase: true },
  });
  return t?.waktuTriase ?? null;
}

export function getRuangan(locationId: string, tx?: Tx) {
  return db(tx).location.findFirst({ where: { id: locationId }, select: { nama: true, locationType: true } });
}
