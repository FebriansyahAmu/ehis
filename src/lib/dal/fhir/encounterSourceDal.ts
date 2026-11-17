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
      disposisiRiwayat: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { jenis: true, rujukTujuan: true, instruksi: true },
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

export function getRuangan(locationId: string, tx?: Tx) {
  return db(tx).location.findFirst({ where: { id: locationId }, select: { nama: true, locationType: true } });
}
