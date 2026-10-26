// onboardingSourceDal — baca master lokal untuk onboarding SatuSehat (FH1). Prisma murni,
// read-only (+ 1 tulis denormalisasi Dokter.ihsPractitionerId). Select hanya kolom yang dipetakan.

import { db, type Tx } from "@/lib/db/prisma";

const ADDRESS = {
  alamat: true, rtRw: true, kodePos: true, kotaNama: true,
  provinsiKode: true, kotaKode: true, kecamatanKode: true, kelurahanKode: true,
} as const;

/** Semua Organization belum dihapus (aktif & nonaktif) — urut stabil. */
export function listOrganizations(tx?: Tx) {
  return db(tx).organization.findMany({
    where: { deletedAt: null },
    orderBy: [{ isRoot: "desc" }, { kode: "asc" }],
    select: {
      id: true, parentId: true, kode: true, nama: true, orgType: true, active: true, isRoot: true,
      telp: true, email: true, gpsLat: true, gpsLng: true, ...ADDRESS,
    },
  });
}

/** Semua Location (ruangan) belum dihapus. */
export function listLocations(tx?: Tx) {
  return db(tx).location.findMany({
    where: { deletedAt: null },
    orderBy: { kode: "asc" },
    select: {
      id: true, organizationId: true, kode: true, nama: true, locationType: true, kelas: true,
      active: true, overrideAlamat: true, ...ADDRESS,
    },
  });
}

/** Pegawai aktif ber-profesi (kandidat Practitioner) + NIK terenkripsi + profil Dokter (bila ada). */
export function listPractitionerCandidates(tx?: Tx) {
  return db(tx).pegawai.findMany({
    where: { deletedAt: null, isActive: true, profesi: { not: null } },
    orderBy: { namaLengkap: "asc" },
    select: {
      id: true, nip: true, namaLengkap: true, gelarDepan: true, gelarBelakang: true, profesi: true, nikEnc: true,
      dokter: { select: { id: true, ihsPractitionerId: true } },
    },
  });
}

export function setDokterIhsPractitionerId(dokterId: string, ihsId: string, tx?: Tx) {
  return db(tx).dokter.update({ where: { id: dokterId }, data: { ihsPractitionerId: ihsId } });
}
