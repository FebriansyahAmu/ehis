// ruanganService — business rules master/sumber-daya: Unit · Ruangan · Bed
// (FLOWS §2 · BACKEND-MASTER-SUMBER-DAYA §A.4.2). Tak import prisma langsung (pakai
// `transaction` + DAL). Memetakan VOCAB FE ⇄ DB (dept-clin⇄dept_clin · kelas "—"⇄null ·
// alamat nama-based⇄kolom kode+nama · LocationNode.parentId⇄organizationId). DTO mirror FE
// (zero-refactor UI). Non-determinisme via `clock` di-inject (FLOWS §14).
//
// Invariant (A.3): anti-cycle parent · hapus Unit guard no-child · hapus Ruangan guard no-bed ·
// bed ≤ kapasitas · root RS read-only · optimistic concurrency (version).
// TODO(GAP-B infra): cache-aside Redis (invalidate getTree saat CUD) + audit emit — infra belum ada.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/ruanganDal";
import { systemClock, type Clock } from "@/lib/core/clock";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  CreateUnitInput, UpdateUnitInput,
  CreateRuanganInput, UpdateRuanganInput,
  CreateBedInput, UpdateBedInput,
  AlamatInput, OrganizationDTO, LocationDTO, BedDTO, AlamatDTO, RuanganTreeDTO,
} from "@/lib/schemas/ruangan";
import type {
  OrgEntity, LocationEntity, LocationListEntity, BedEntity, AlamatData,
  UpdateOrgData, UpdateLocationData,
} from "@/lib/dal/ruanganDal";

type Dal = typeof defaultDal;
type Org = NonNullable<OrgEntity>;
type Loc = NonNullable<LocationEntity>;
type Bed = NonNullable<BedEntity>;
type Bed_ = Loc["beds"][number];

const MAX_DEPTH = 32; // jaga anti-cycle walk dari loop tak terbatas (data korup).

/** Set target[key] HANYA bila value !== undefined → patch parsial (field tak dikirim diabaikan). */
function setDefined<T, K extends keyof T>(target: T, key: K, value: T[K] | undefined): void {
  if (value !== undefined) target[key] = value;
}

export function makeRuanganService(deps: { clock?: Clock; dal?: Dal } = {}) {
  const clock = deps.clock ?? systemClock;
  const dal = deps.dal ?? defaultDal;

  // ── Vocab mapping FE ⇄ DB ──────────────────────────────────────────────────--
  const orgTypeToDb = (t: string) => (t === "dept-clin" ? "dept_clin" : t) as "prov" | "dept" | "dept_clin" | "team";
  const orgTypeToFe = (t: string) => (t === "dept_clin" ? "dept-clin" : t) as OrganizationDTO["orgType"];
  const kelasToDb = (k?: string) => (!k || k === "—" ? null : (k as "VIP" | "Kelas_1" | "Kelas_2" | "Kelas_3"));
  const kelasToFe = (k: string | null) => (k ?? "—") as LocationDTO["kelas"];

  /** FE Alamat (nama-based + kodeWilayah) → kolom DB kode+nama. kodeWilayah → kelurahanKode. */
  function alamatToDb(a?: AlamatInput | null): AlamatData {
    if (!a) return {};
    return {
      alamat: a.jalan ?? null,
      kodePos: a.kodePos ?? null,
      provinsiNama: a.provinsi ?? null,
      kotaNama: a.kota ?? null,
      kecamatanNama: a.kecamatan ?? null,
      kelurahanNama: a.kelurahan ?? null,
      kelurahanKode: a.kodeWilayah ?? null,
    };
  }
  /** Kolom DB → FE Alamat (DTO). String non-null (FE Alamat tak nullable). */
  function alamatToFe(src: AlamatData): AlamatDTO {
    return {
      jalan: src.alamat ?? "",
      kelurahan: src.kelurahanNama ?? "",
      kecamatan: src.kecamatanNama ?? "",
      kota: src.kotaNama ?? "",
      provinsi: src.provinsiNama ?? "",
      kodePos: src.kodePos ?? "",
      kodeWilayah: src.kelurahanKode ?? "",
    };
  }

  // ── Patch builder (pure; field tak dikirim → tak diubah) ──────────────────────
  /** UpdateUnitInput (vocab FE) → kolom DB parsial. Tak menyentuh guard/transaksi. */
  function unitPatch(input: UpdateUnitInput): UpdateOrgData {
    const d: UpdateOrgData = {};
    setDefined(d, "parentId", input.parentId);
    setDefined(d, "nama", input.nama);
    setDefined(d, "kode", input.kode?.toUpperCase());
    setDefined(d, "orgType", input.orgType ? orgTypeToDb(input.orgType) : undefined);
    setDefined(d, "active", input.active);
    setDefined(d, "telp", input.telp);
    setDefined(d, "email", input.email);
    if (input.gps !== undefined) { d.gpsLat = input.gps?.lat ?? null; d.gpsLng = input.gps?.lng ?? null; }
    if (input.alamat !== undefined) Object.assign(d, alamatToDb(input.alamat));
    return d;
  }

  /** UpdateRuanganInput (vocab FE) → kolom DB parsial. Override OFF → bersihkan alamat (kembali inherit). */
  function ruanganPatch(input: UpdateRuanganInput): UpdateLocationData {
    const d: UpdateLocationData = {};
    setDefined(d, "organizationId", input.parentId);
    setDefined(d, "nama", input.nama);
    setDefined(d, "kode", input.kode?.toUpperCase());
    setDefined(d, "locationType", input.locationType);
    setDefined(d, "kelas", input.kelas !== undefined ? kelasToDb(input.kelas) : undefined);
    setDefined(d, "kapasitas", input.kapasitas);
    setDefined(d, "active", input.active);
    if (input.overrideAlamat !== undefined) {
      d.overrideAlamat = input.overrideAlamat;
      Object.assign(d, input.overrideAlamat ? alamatToDb(input.alamatOverride) : alamatToDb(null));
    } else if (input.alamatOverride !== undefined) {
      Object.assign(d, alamatToDb(input.alamatOverride));
    }
    return d;
  }

  // ── DTO mapping (mirror FE; entity Prisma TIDAK bocor) ────────────────────────
  function toOrgDTO(o: Org): OrganizationDTO {
    return {
      id: o.id,
      type: "Organization",
      name: o.nama,
      kode: o.kode,
      orgType: orgTypeToFe(o.orgType),
      active: o.active,
      telp: o.telp ?? "",
      email: o.email ?? undefined,
      alamat: alamatToFe(o),
      gps: o.gpsLat !== null && o.gpsLng !== null ? { lat: o.gpsLat, lng: o.gpsLng } : undefined,
      parentId: o.parentId,
      isRoot: o.isRoot,
      version: o.version,
    };
  }
  function toBedDTO(b: Bed | Bed_): BedDTO {
    return { id: b.id, name: b.nama, kode: b.kode, status: b.status };
  }
  function toLocationDTO(l: Loc | LocationListEntity): LocationDTO {
    const hasOverride = l.overrideAlamat;
    return {
      id: l.id,
      type: "Location",
      name: l.nama,
      kode: l.kode,
      locationType: l.locationType,
      kelas: kelasToFe(l.kelas),
      kapasitas: l.kapasitas,
      active: l.active,
      alamatOverride: hasOverride ? alamatToFe(l) : undefined,
      parentId: l.organizationId,
      beds: l.beds.map(toBedDTO),
      version: l.version,
    };
  }

  // ── Anti-cycle (A.3) — newParent tak boleh = node / keturunan node ────────────-
  async function assertNoCycle(orgId: string, newParentId: string): Promise<void> {
    if (newParentId === orgId) throw Errors.validation("Unit tidak boleh menjadi induk dirinya sendiri");
    let cur: string | null = newParentId;
    for (let i = 0; i < MAX_DEPTH && cur; i++) {
      const parent: Org | null = await dal.findOrg(cur);
      if (!parent) break;
      if (parent.id === orgId) throw Errors.validation("Pemindahan membentuk siklus (induk = keturunan unit)");
      cur = parent.parentId;
    }
  }

  // ── Tree (read seluruh pohon, array datar — A.2/§A.8) ─────────────────────────
  async function getTree(_actor: Actor): Promise<RuanganTreeDTO> {
    const [orgs, locs] = await Promise.all([dal.listOrganizations(), dal.listLocations()]);
    return [...orgs.map(toOrgDTO), ...locs.map(toLocationDTO)];
  }

  // ── Unit (Organization) ───────────────────────────────────────────────────────
  async function createUnit(input: CreateUnitInput, _actor: Actor): Promise<OrganizationDTO> {
    const parent = await dal.findOrg(input.parentId);
    if (!parent) throw Errors.validation("Unit induk tidak ditemukan");
    const created = await dal.createOrg({
      parentId: input.parentId,
      kode: input.kode.toUpperCase(),
      nama: input.nama,
      orgType: orgTypeToDb(input.orgType),
      active: input.active,
      telp: input.telp ?? null,
      email: input.email ?? null,
      gpsLat: input.gps?.lat ?? null,
      gpsLng: input.gps?.lng ?? null,
      ...alamatToDb(input.alamat),
    });
    return toOrgDTO(created);
  }

  async function updateUnit(id: string, input: UpdateUnitInput, _actor: Actor): Promise<OrganizationDTO> {
    const updated = await transaction(async (tx) => {
      const org = await dal.findOrg(id, tx);
      if (!org) throw Errors.notFound("Unit tidak ditemukan");
      if (org.isRoot) throw Errors.forbidden("Identitas RS Induk dikelola di Profil RS (read-only di sini)");
      if (org.version !== input.expectedVersion) throw Errors.conflictVersion();
      if (input.parentId && input.parentId !== org.parentId) await assertNoCycle(id, input.parentId);

      const count = await dal.updateOrgWithVersion(id, input.expectedVersion, unitPatch(input), tx);
      if (count === 0) throw Errors.conflictVersion();
      const fresh = await dal.findOrg(id, tx);
      if (!fresh) throw Errors.internal("Gagal memuat unit setelah update");
      return fresh;
    });
    return toOrgDTO(updated);
  }

  async function deleteUnit(id: string, expectedVersion: number, _actor: Actor): Promise<void> {
    await transaction(async (tx) => {
      const org = await dal.findOrg(id, tx);
      if (!org) throw Errors.notFound("Unit tidak ditemukan");
      if (org.isRoot) throw Errors.forbidden("RS Induk tidak dapat dihapus");
      const children = await dal.countOrgChildren(id, tx);
      if (children > 0) throw Errors.forbiddenState("Unit masih memiliki sub-unit / ruangan — kosongkan dulu");
      const count = await dal.softDeleteOrg(id, expectedVersion, clock.now(), tx);
      if (count === 0) throw Errors.conflictVersion();
    });
  }

  // ── Ruangan (Location) ─────────────────────────────────────────────────────---
  async function createRuangan(input: CreateRuanganInput, _actor: Actor): Promise<LocationDTO> {
    const org = await dal.findOrg(input.parentId);
    if (!org) throw Errors.validation("Unit induk tidak ditemukan");
    const created = await dal.createLocation({
      organizationId: input.parentId,
      kode: input.kode.toUpperCase(),
      nama: input.nama,
      locationType: input.locationType,
      kelas: kelasToDb(input.kelas),
      kapasitas: input.kapasitas,
      overrideAlamat: input.overrideAlamat,
      ...(input.overrideAlamat ? alamatToDb(input.alamatOverride) : {}),
    });
    return toLocationDTO(created);
  }

  async function updateRuangan(id: string, input: UpdateRuanganInput, _actor: Actor): Promise<LocationDTO> {
    const updated = await transaction(async (tx) => {
      const loc = await dal.findLocation(id, tx);
      if (!loc) throw Errors.notFound("Ruangan tidak ditemukan");
      if (loc.version !== input.expectedVersion) throw Errors.conflictVersion();
      // Kapasitas baru tak boleh di bawah jumlah bed terpasang.
      if (input.kapasitas !== undefined && input.kapasitas < loc.beds.length) {
        throw Errors.validation(`Kapasitas (${input.kapasitas}) < jumlah bed terpasang (${loc.beds.length})`);
      }
      if (input.parentId) {
        const org = await dal.findOrg(input.parentId, tx);
        if (!org) throw Errors.validation("Unit induk tidak ditemukan");
      }

      const count = await dal.updateLocationWithVersion(id, input.expectedVersion, ruanganPatch(input), tx);
      if (count === 0) throw Errors.conflictVersion();
      const fresh = await dal.findLocation(id, tx);
      if (!fresh) throw Errors.internal("Gagal memuat ruangan setelah update");
      return fresh;
    });
    return toLocationDTO(updated);
  }

  async function deleteRuangan(id: string, expectedVersion: number, _actor: Actor): Promise<void> {
    await transaction(async (tx) => {
      const loc = await dal.findLocation(id, tx);
      if (!loc) throw Errors.notFound("Ruangan tidak ditemukan");
      const beds = await dal.countBedsOfLocation(id, tx);
      if (beds > 0) throw Errors.forbiddenState("Ruangan masih memiliki bed — hapus bed dulu");
      const count = await dal.softDeleteLocation(id, expectedVersion, clock.now(), tx);
      if (count === 0) throw Errors.conflictVersion();
    });
  }

  // ── Bed (sub-resource Ruangan) ─────────────────────────────────────────────---
  async function addBed(locationId: string, input: CreateBedInput, _actor: Actor): Promise<BedDTO> {
    const created = await transaction(async (tx) => {
      const loc = await dal.findLocation(locationId, tx);
      if (!loc) throw Errors.notFound("Ruangan tidak ditemukan");
      if (loc.beds.length >= loc.kapasitas) {
        throw Errors.validation(`Kapasitas ruangan penuh (${loc.beds.length}/${loc.kapasitas}) — naikkan kapasitas dulu`);
      }
      return dal.createBed({
        locationId,
        kode: input.kode.toUpperCase(),
        nama: input.nama,
        status: input.status,
      }, tx);
    });
    return toBedDTO(created);
  }

  async function updateBed(bedId: string, input: UpdateBedInput, _actor: Actor): Promise<BedDTO> {
    const updated = await transaction(async (tx) => {
      const bed = await dal.findBed(bedId, tx);
      if (!bed) throw Errors.notFound("Bed tidak ditemukan");
      const count = await dal.updateBed(bedId, {
        ...(input.kode !== undefined ? { kode: input.kode.toUpperCase() } : {}),
        ...(input.nama !== undefined ? { nama: input.nama } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      }, tx);
      if (count === 0) throw Errors.notFound("Bed tidak ditemukan");
      const fresh = await dal.findBed(bedId, tx);
      if (!fresh) throw Errors.internal("Gagal memuat bed setelah update");
      return fresh;
    });
    return toBedDTO(updated);
  }

  async function deleteBed(bedId: string, _actor: Actor): Promise<void> {
    const count = await dal.softDeleteBed(bedId, clock.now());
    if (count === 0) throw Errors.notFound("Bed tidak ditemukan");
  }

  return {
    getTree,
    createUnit, updateUnit, deleteUnit,
    createRuangan, updateRuangan, deleteRuangan,
    addBed, updateBed, deleteBed,
  };
}

export const ruanganService = makeRuanganService();
