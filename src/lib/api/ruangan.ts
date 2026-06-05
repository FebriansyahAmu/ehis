// API master/ruangan (browser) — Unit · Ruangan · Bed. Tipe DI-REUSE dari schema server.
// Vocab boundary: node FE pakai `name`, Input server pakai `nama` (Service map balik di DTO →
// `name`), jadi DTO output ⇄ node FE praktis identik (cukup di-return apa adanya). Endpoint:
// /master/unit · /master/ruangan · /master/bed (lihat API-RULES §8 · BACKEND-MASTER-SUMBER-DAYA).

import { api } from "@/lib/api/client";
import type {
  CreateUnitInput, UpdateUnitInput,
  CreateRuanganInput, UpdateRuanganInput,
  CreateBedInput, UpdateBedInput,
  OrganizationDTO, LocationDTO, BedDTO, RuanganTreeDTO,
} from "@/lib/schemas/ruangan";
import type {
  AnyNode, OrganizationNode, LocationNode, BedSubRecord,
} from "@/components/master/ruangan/ruanganShared";

/** Buang string kosong → undefined (Zod email menolak ""; field opsional tak perlu dikirim). */
const opt = (v?: string): string | undefined => {
  const t = v?.trim();
  return t ? t : undefined;
};

// ── node FE → Input server (arah tulis; name → nama) ──────────────────────────
function unitToCreate(n: OrganizationNode): CreateUnitInput {
  return {
    parentId: n.parentId ?? "", // unit selalu punya induk; "" akan ditolak Zod bila keliru
    nama: n.name,
    kode: n.kode,
    orgType: n.orgType,
    active: n.active,
    telp: opt(n.telp),
    email: opt(n.email),
    alamat: n.alamat,
    gps: n.gps,
  };
}
function unitToUpdate(n: OrganizationNode): UpdateUnitInput {
  return {
    expectedVersion: n.version ?? 0,
    parentId: n.parentId ?? undefined,
    nama: n.name,
    kode: n.kode,
    orgType: n.orgType,
    active: n.active,
    telp: opt(n.telp),
    email: opt(n.email),
    alamat: n.alamat,
    gps: n.gps ?? null, // null = hapus koordinat
  };
}
function ruanganToCreate(n: LocationNode): CreateRuanganInput {
  return {
    parentId: n.parentId,
    nama: n.name,
    kode: n.kode,
    locationType: n.locationType,
    kelas: n.kelas,
    kapasitas: n.kapasitas,
    overrideAlamat: !!n.alamatOverride,
    alamatOverride: n.alamatOverride,
  };
}
function ruanganToUpdate(n: LocationNode): UpdateRuanganInput {
  return {
    expectedVersion: n.version ?? 0,
    parentId: n.parentId,
    nama: n.name,
    kode: n.kode,
    locationType: n.locationType,
    kelas: n.kelas,
    kapasitas: n.kapasitas,
    active: n.active,
    overrideAlamat: !!n.alamatOverride,
    alamatOverride: n.alamatOverride ?? null,
  };
}
const bedToInput = (b: BedSubRecord): CreateBedInput & UpdateBedInput => ({
  nama: b.name,
  kode: b.kode,
  status: b.status,
});

// ── Reads ─────────────────────────────────────────────────────────────────────
/** GET /master/ruangan?view=tree → seluruh pohon (array datar, bed nested). DTO ≅ node FE. */
export async function getTree(signal?: AbortSignal): Promise<AnyNode[]> {
  const { data } = await api.get<RuanganTreeDTO>("/master/ruangan", { query: { view: "tree" }, signal });
  return data; // OrganizationDTO|LocationDTO struktural = OrganizationNode|LocationNode
}

// ── Unit (Organization) ───────────────────────────────────────────────────────
export async function createUnit(node: OrganizationNode, signal?: AbortSignal): Promise<OrganizationNode> {
  const { data } = await api.post<OrganizationDTO>("/master/unit", unitToCreate(node), { signal });
  return data;
}
export async function updateUnit(node: OrganizationNode, signal?: AbortSignal): Promise<OrganizationNode> {
  const { data } = await api.patch<OrganizationDTO>(
    `/master/unit/${encodeURIComponent(node.id)}`, unitToUpdate(node), { signal },
  );
  return data;
}
export async function deleteUnit(id: string, expectedVersion: number, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/unit/${encodeURIComponent(id)}`, { query: { expectedVersion }, signal });
}

// ── Ruangan (Location) ─────────────────────────────────────────────────────────
export async function createRuangan(node: LocationNode, signal?: AbortSignal): Promise<LocationNode> {
  const { data } = await api.post<LocationDTO>("/master/ruangan", ruanganToCreate(node), { signal });
  return data;
}
export async function updateRuangan(node: LocationNode, signal?: AbortSignal): Promise<LocationNode> {
  const { data } = await api.patch<LocationDTO>(
    `/master/ruangan/${encodeURIComponent(node.id)}`, ruanganToUpdate(node), { signal },
  );
  return data;
}
export async function deleteRuangan(id: string, expectedVersion: number, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/ruangan/${encodeURIComponent(id)}`, { query: { expectedVersion }, signal });
}

// ── Bed (sub-resource Ruangan) ─────────────────────────────────────────────────
export async function addBed(locationId: string, bed: BedSubRecord, signal?: AbortSignal): Promise<BedSubRecord> {
  const { data } = await api.post<BedDTO>(
    `/master/ruangan/${encodeURIComponent(locationId)}/bed`, bedToInput(bed), { signal },
  );
  return data;
}
export async function updateBed(bed: BedSubRecord, signal?: AbortSignal): Promise<BedSubRecord> {
  const { data } = await api.patch<BedDTO>(
    `/master/bed/${encodeURIComponent(bed.id)}`, bedToInput(bed), { signal },
  );
  return data;
}
export async function deleteBed(bedId: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/bed/${encodeURIComponent(bedId)}`, { signal });
}
