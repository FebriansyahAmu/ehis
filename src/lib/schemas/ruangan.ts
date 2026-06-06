// Zod schema + DTO — Master Sumber Daya: Unit · Ruangan · Bed (FLOWS §5 · BACKEND-MASTER-SUMBER-DAYA §A.4.3).
// Input divalidasi di boundary Route SEBELUM Service. VOCAB = FE (ruanganShared.ts) agar
// swap UI zero-refactor: name/parentId/orgType("dept-clin")/kelas("—")/alamat(nama-based)/gps.
// Service memetakan vocab FE ⇄ kolom Prisma (nama, organizationId, dept_clin, kelas null, alamat kode+nama).
// Mapping entity→DTO ada di Service. Di sini hanya schema input + TIPE DTO.

import { z } from "zod";

// ── Enum (vocab FE; Service map ke Prisma `master`) ───────────────────────────
export const OrgType = z.enum(["prov", "dept", "dept-clin", "team"]);
export const LocationType = z.enum([
  "Rawat_Inap", "Rawat_Jalan", "ICU", "HCU", "Isolasi", "IGD", "OK", "Penunjang",
]);
/// "—" = tak berlaku (→ null di DB). Disertakan agar form FE tak perlu transform.
export const LocationKelas = z.enum(["VIP", "Kelas_1", "Kelas_2", "Kelas_3", "—"]);
export const BedStatus = z.enum(["active", "inactive", "suspended"]);

// ── Sub-objek ─────────────────────────────────────────────────────────────────
// Alamat mengikuti FE `Alamat` (nama-based + 1 kodeWilayah Kemendagri 10-digit).
// Service menyimpan ke kolom kode+nama per level (kodeWilayah → kelurahanKode).
export const AlamatInput = z.object({
  jalan: z.string().trim().max(300).optional(),
  kelurahan: z.string().trim().max(120).optional(),
  kecamatan: z.string().trim().max(120).optional(),
  kota: z.string().trim().max(120).optional(),
  provinsi: z.string().trim().max(120).optional(),
  kodePos: z.string().trim().max(10).optional(),
  kodeWilayah: z.string().trim().max(12).optional(),
});

export const GpsInput = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const kode = z.string().trim().min(1, "Kode wajib").max(30);
const nama = z.string().trim().min(1, "Nama wajib").max(120);
/// Optimistic concurrency — wajib di update (FLOWS §7.3). Mismatch → CONFLICT_VERSION (409).
const expectedVersion = z.number().int().nonnegative();

// ── Unit (Organization) ───────────────────────────────────────────────────────
export const CreateUnitInput = z.object({
  parentId: z.string().uuid("parentId tidak valid"), // root tak dibuat via API (di-seed)
  nama,
  kode,
  orgType: OrgType,
  active: z.boolean().default(true),
  telp: z.string().trim().max(30).optional(),
  email: z.string().trim().email("Email tidak valid").max(120).optional(),
  alamat: AlamatInput.optional(),
  gps: GpsInput.optional(),
});

// Patch: semua opsional, parentId tetap uuid bila dikirim (pindah cabang → anti-cycle di Service).
export const UpdateUnitInput = z.object({
  expectedVersion,
  parentId: z.string().uuid().optional(),
  nama: nama.optional(),
  kode: kode.optional(),
  orgType: OrgType.optional(),
  active: z.boolean().optional(),
  telp: z.string().trim().max(30).optional(),
  email: z.string().trim().email().max(120).optional(),
  alamat: AlamatInput.optional(),
  gps: GpsInput.nullable().optional(), // null → hapus koordinat
});

// ── Ruangan (Location) ────────────────────────────────────────────────────────
export const CreateRuanganInput = z.object({
  parentId: z.string().uuid("parentId (Unit) tidak valid"), // FE LocationNode.parentId = Organization
  nama,
  kode,
  locationType: LocationType,
  kelas: LocationKelas.default("—"),
  kapasitas: z.number().int().min(1).max(50).default(1),
  overrideAlamat: z.boolean().default(false),
  alamatOverride: AlamatInput.optional(),
});

export const UpdateRuanganInput = z.object({
  expectedVersion,
  parentId: z.string().uuid().optional(),
  nama: nama.optional(),
  kode: kode.optional(),
  locationType: LocationType.optional(),
  kelas: LocationKelas.optional(),
  kapasitas: z.number().int().min(1).max(50).optional(),
  active: z.boolean().optional(),
  overrideAlamat: z.boolean().optional(),
  alamatOverride: AlamatInput.nullable().optional(),
});

// ── Bed (sub-resource Ruangan) ────────────────────────────────────────────────
export const CreateBedInput = z.object({
  nama,
  kode,
  status: BedStatus.default("active"),
});

export const UpdateBedInput = z.object({
  nama: nama.optional(),
  kode: kode.optional(),
  status: BedStatus.optional(),
});

// ── Params & query ────────────────────────────────────────────────────────────
export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });
export const BedIdParam = z.object({ bedId: z.string().uuid("ID bed tidak valid") });
/// GET /api/v1/master/ruangan?view=tree → seluruh pohon (default). `locationType` → list datar
/// Ruangan tipe tsb (mis. IGD utk pendaftaran), tanpa Bed nested (anti over-fetch).
export const RuanganQuery = z.object({
  view: z.enum(["tree"]).optional(),
  locationType: LocationType.optional(),
});
/// DELETE Unit/Ruangan → optimistic concurrency via query (?expectedVersion=).
export const DeleteQuery = z.object({ expectedVersion: z.coerce.number().int().nonnegative() });

// ── Tipe inferensi ────────────────────────────────────────────────────────────
export type AlamatInput = z.infer<typeof AlamatInput>;
export type GpsInput = z.infer<typeof GpsInput>;
export type CreateUnitInput = z.infer<typeof CreateUnitInput>;
export type UpdateUnitInput = z.infer<typeof UpdateUnitInput>;
export type CreateRuanganInput = z.infer<typeof CreateRuanganInput>;
export type UpdateRuanganInput = z.infer<typeof UpdateRuanganInput>;
export type CreateBedInput = z.infer<typeof CreateBedInput>;
export type UpdateBedInput = z.infer<typeof UpdateBedInput>;

// ── DTO output (mirror FE OrganizationNode/LocationNode/BedSubRecord → zero-refactor) ──
// Tree = ARRAY DATAR (Org & Location ber-parentId; Bed nested di LocationDTO.beds[]) —
// sesuai RUANGAN_MOCK (AnyNode[]). Helper FE (getChildren/getEffectiveAlamat) jalan apa adanya.

export interface AlamatDTO {
  jalan: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  kodePos: string;
  kodeWilayah: string;
}

export interface OrganizationDTO {
  id: string;
  type: "Organization";
  name: string;
  kode: string;
  orgType: z.infer<typeof OrgType>;
  active: boolean;
  telp: string;
  email?: string;
  alamat: AlamatDTO;
  gps?: { lat: number; lng: number };
  parentId: string | null; // null = root RS
  isRoot: boolean;
  version: number;
}

export interface BedDTO {
  id: string;
  name: string;
  kode: string;
  status: z.infer<typeof BedStatus>;
}

export interface LocationDTO {
  id: string;
  type: "Location";
  name: string;
  kode: string;
  locationType: z.infer<typeof LocationType>;
  kelas: z.infer<typeof LocationKelas>; // "—" bila null di DB
  kapasitas: number;
  active: boolean;
  alamatOverride?: AlamatDTO; // absen = inherit Unit
  parentId: string; // Organization id
  beds: BedDTO[];
  version: number;
}

export type RuanganNodeDTO = OrganizationDTO | LocationDTO;
/// GET tree → seluruh node datar (Org + Location). Bed nested di LocationDTO.beds.
export type RuanganTreeDTO = RuanganNodeDTO[];
