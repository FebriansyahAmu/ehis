// onboardingSourceDal — baca master lokal untuk onboarding SatuSehat (FH1). Prisma murni,
// read-only (+ 1 tulis denormalisasi Dokter.ihsPractitionerId). Select hanya kolom yang dipetakan.

import { db, type Tx } from "@/lib/db/prisma";

const ADDRESS = {
  alamat: true, rtRw: true, kodePos: true, kotaNama: true,
  provinsiKode: true, kotaKode: true, kecamatanKode: true, kelurahanKode: true,
} as const;

const ORG_SELECT = {
  id: true, parentId: true, kode: true, nama: true, orgType: true, active: true, isRoot: true,
  telp: true, email: true, gpsLat: true, gpsLng: true, ...ADDRESS,
} as const;

const LOC_SELECT = {
  id: true, organizationId: true, kode: true, nama: true, locationType: true, kelas: true,
  active: true, overrideAlamat: true, ...ADDRESS,
} as const;

const PRACTITIONER_WHERE = { deletedAt: null, isActive: true, profesi: { not: null } } as const;
const PRACTITIONER_SELECT = {
  id: true, nip: true, namaLengkap: true, gelarDepan: true, gelarBelakang: true, profesi: true, nikEnc: true,
  jenisKelamin: true, tanggalLahir: true,
  dokter: { select: { id: true, ihsPractitionerId: true } },
} as const;

/** Semua Organization belum dihapus (aktif & nonaktif) — urut stabil. */
export function listOrganizations(tx?: Tx) {
  return db(tx).organization.findMany({
    where: { deletedAt: null },
    orderBy: [{ isRoot: "desc" }, { kode: "asc" }],
    select: ORG_SELECT,
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 1 Organization (detail/pratinjau) — PK lookup, bukan muat semua lalu `.find`. Id non-UUID → null. */
export async function getOrganization(id: string, tx?: Tx) {
  if (!UUID_RE.test(id)) return null;
  return db(tx).organization.findFirst({ where: { id, deletedAt: null }, select: ORG_SELECT });
}

/** Semua Location (ruangan) belum dihapus. */
export function listLocations(tx?: Tx) {
  return db(tx).location.findMany({
    where: { deletedAt: null },
    orderBy: { kode: "asc" },
    select: LOC_SELECT,
  });
}

export async function getLocation(id: string, tx?: Tx) {
  if (!UUID_RE.test(id)) return null;
  return db(tx).location.findFirst({ where: { id, deletedAt: null }, select: LOC_SELECT });
}

/** Pegawai aktif ber-profesi (kandidat Practitioner) + NIK terenkripsi + profil Dokter (bila ada). */
export function listPractitionerCandidates(tx?: Tx) {
  return db(tx).pegawai.findMany({
    where: PRACTITIONER_WHERE,
    orderBy: { namaLengkap: "asc" },
    select: PRACTITIONER_SELECT,
  });
}

export async function getPractitionerCandidate(id: string, tx?: Tx) {
  if (!UUID_RE.test(id)) return null;
  return db(tx).pegawai.findFirst({ where: { id, ...PRACTITIONER_WHERE }, select: PRACTITIONER_SELECT });
}

export function setDokterIhsPractitionerId(dokterId: string, ihsId: string, tx?: Tx) {
  return db(tx).dokter.update({ where: { id: dokterId }, data: { ihsPractitionerId: ihsId } });
}
