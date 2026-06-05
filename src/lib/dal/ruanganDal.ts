// ruanganDal — akses Prisma MURNI domain master/sumber-daya (FLOWS §2 · BACKEND-MASTER-SUMBER-DAYA §A.4.1).
// Tak ada aturan bisnis. Terima `tx?` (transaksi dimiliki Service). Soft-delete difilter default.
// Enum di-ketik string-union lokal (DAL "loose", tak tergantung tipe Prisma generated — selaras kunjunganDal).
// Vocab = DB (underscore: dept_clin); pemetaan ⇄ FE ada di Service.

import { db, type Tx } from "@/lib/db/prisma";

type OrgType = "prov" | "dept" | "dept_clin" | "team";
type LocationType =
  | "Rawat_Inap" | "Rawat_Jalan" | "ICU" | "HCU" | "Isolasi" | "IGD" | "OK" | "Penunjang";
type LocationKelas = "VIP" | "Kelas_1" | "Kelas_2" | "Kelas_3";
type BedStatus = "active" | "inactive" | "suspended";

// ── Bentuk alamat (kolom kode+nama; nilai sudah dinormalisasi Service) ──────────
export interface AlamatData {
  alamat?: string | null;
  rtRw?: string | null;
  kodePos?: string | null;
  provinsiKode?: string | null; provinsiNama?: string | null;
  kotaKode?: string | null; kotaNama?: string | null;
  kecamatanKode?: string | null; kecamatanNama?: string | null;
  kelurahanKode?: string | null; kelurahanNama?: string | null;
}

export interface CreateOrgData extends AlamatData {
  parentId: string;
  kode: string;
  nama: string;
  orgType: OrgType;
  active?: boolean;
  telp?: string | null;
  email?: string | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
}
export type UpdateOrgData = Partial<CreateOrgData>;

export interface CreateLocationData extends AlamatData {
  organizationId: string;
  kode: string;
  nama: string;
  locationType: LocationType;
  kelas?: LocationKelas | null;
  kapasitas?: number;
  active?: boolean;
  overrideAlamat?: boolean;
}
export type UpdateLocationData = Partial<Omit<CreateLocationData, "organizationId">> & {
  organizationId?: string;
};

export interface CreateBedData {
  locationId: string;
  kode: string;
  nama: string;
  status?: BedStatus;
}
export interface UpdateBedData {
  kode?: string;
  nama?: string;
  status?: BedStatus;
}

// Ruangan + bed aktif (anti over-fetch bed terhapus). Bed urut kode.
const locationInclude = {
  beds: { where: { deletedAt: null }, orderBy: { kode: "asc" as const } },
} as const;

export type OrgEntity = Awaited<ReturnType<typeof findOrg>>;
export type LocationEntity = Awaited<ReturnType<typeof findLocation>>;
export type LocationListEntity = Awaited<ReturnType<typeof listLocations>>[number];
export type BedEntity = Awaited<ReturnType<typeof findBed>>;

// ── Reads tree (soft-delete difilter) ─────────────────────────────────────────-
export function listOrganizations(tx?: Tx) {
  return db(tx).organization.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

export function listLocations(tx?: Tx) {
  return db(tx).location.findMany({
    where: { deletedAt: null },
    include: locationInclude,
    orderBy: { createdAt: "asc" },
  });
}

// ── Reads detail ───────────────────────────────────────────────────────────────
export function findOrg(id: string, tx?: Tx) {
  return db(tx).organization.findFirst({ where: { id, deletedAt: null } });
}
export function findLocation(id: string, tx?: Tx) {
  return db(tx).location.findFirst({ where: { id, deletedAt: null }, include: locationInclude });
}
export function findBed(id: string, tx?: Tx) {
  return db(tx).bed.findFirst({ where: { id, deletedAt: null } });
}

// ── Guards (count) ─────────────────────────────────────────────────────────────
/** Jumlah anak langsung Unit: sub-Unit + Ruangan (untuk guard hapus "no child"). */
export async function countOrgChildren(orgId: string, tx?: Tx): Promise<number> {
  const c = db(tx);
  const [orgs, locs] = await Promise.all([
    c.organization.count({ where: { parentId: orgId, deletedAt: null } }),
    c.location.count({ where: { organizationId: orgId, deletedAt: null } }),
  ]);
  return orgs + locs;
}
/** Jumlah bed aktif di Ruangan (guard hapus "no bed" + cek kapasitas). */
export function countBedsOfLocation(locationId: string, tx?: Tx): Promise<number> {
  return db(tx).bed.count({ where: { locationId, deletedAt: null } });
}

// ── Create ─────────────────────────────────────────────────────────────────────
export function createOrg(data: CreateOrgData, tx?: Tx) {
  return db(tx).organization.create({ data });
}
export function createLocation(data: CreateLocationData, tx?: Tx) {
  return db(tx).location.create({ data, include: locationInclude });
}
export function createBed(data: CreateBedData, tx?: Tx) {
  return db(tx).bed.create({ data });
}

// ── Update (version guard — optimistic concurrency, FLOWS §7) ──────────────────
/** Update Org bila version cocok; bump version. count 0 = stale/tak ada. */
export async function updateOrgWithVersion(
  id: string, expectedVersion: number, data: UpdateOrgData, tx?: Tx,
): Promise<number> {
  const res = await db(tx).organization.updateMany({
    where: { id, version: expectedVersion, deletedAt: null },
    data: { ...data, version: { increment: 1 } },
  });
  return res.count;
}
export async function updateLocationWithVersion(
  id: string, expectedVersion: number, data: UpdateLocationData, tx?: Tx,
): Promise<number> {
  const res = await db(tx).location.updateMany({
    where: { id, version: expectedVersion, deletedAt: null },
    data: { ...data, version: { increment: 1 } },
  });
  return res.count;
}
/** Bed = leaf sub-record (tanpa version). Update by id. count 0 = tak ada. */
export async function updateBed(id: string, data: UpdateBedData, tx?: Tx): Promise<number> {
  const res = await db(tx).bed.updateMany({ where: { id, deletedAt: null }, data });
  return res.count;
}

// ── Soft-delete ────────────────────────────────────────────────────────────────
export async function softDeleteOrg(id: string, expectedVersion: number, when: Date, tx?: Tx): Promise<number> {
  const res = await db(tx).organization.updateMany({
    where: { id, version: expectedVersion, deletedAt: null },
    data: { deletedAt: when, active: false, version: { increment: 1 } },
  });
  return res.count;
}
export async function softDeleteLocation(id: string, expectedVersion: number, when: Date, tx?: Tx): Promise<number> {
  const res = await db(tx).location.updateMany({
    where: { id, version: expectedVersion, deletedAt: null },
    data: { deletedAt: when, active: false, version: { increment: 1 } },
  });
  return res.count;
}
export async function softDeleteBed(id: string, when: Date, tx?: Tx): Promise<number> {
  const res = await db(tx).bed.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: when } });
  return res.count;
}
