import { RS_PROFIL, RS_ROOT_ID } from "@/lib/master/rsConfig";

// ── Types ─────────────────────────────────────────────────

export type NodeType = "Organization" | "Location";

/**
 * Klasifikasi Organization (Unit / Departemen / KSM / Tim).
 * Dipakai untuk pengelompokan internal & filtering — bukan field FHIR-specific.
 */
export type OrgType = "prov" | "dept" | "dept-clin" | "team";

export type LocationType =
  | "Rawat_Inap"
  | "Rawat_Jalan"
  | "ICU"
  | "HCU"
  | "Isolasi"
  | "IGD"
  | "OK"
  | "Penunjang" // DEPRECATED — dipecah jadi Laboratorium + Radiologi (2026-06-18). Disimpan utk baris lama.
  | "Laboratorium"
  | "Radiologi"
  | "Farmasi"
  | "Gudang_Farmasi"
  | "Gudang";

export type LocationKelas = "VIP" | "Kelas_1" | "Kelas_2" | "Kelas_3" | "—";

export type BedStatus = "active" | "inactive" | "suspended";

export interface Alamat {
  jalan: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  kodePos: string;
  /** Kode Kemendagri 10-digit */
  kodeWilayah: string;
}

export interface GPS {
  lat: number;
  lng: number;
}

export interface OrganizationNode {
  id: string;
  type: "Organization";
  name: string;
  kode: string;
  /** Klasifikasi unit (dept / dept-clin / team / prov) */
  orgType: OrgType;
  /** Aktif / non-aktif (tidak hapus) */
  active: boolean;
  telp: string;
  email?: string;
  alamat: Alamat;
  gps?: GPS;
  /** null hanya untuk RS root. Unit reguler partOf ke RS root atau parent Org lain. */
  parentId: string | null;
  /** true = RS Induk (read-only di modul ini). Dari DTO; mock root pakai RS_ROOT_ID. */
  isRoot?: boolean;
  /** Optimistic concurrency (DTO). undefined = node DRAFT (belum tersimpan → POST saat save). */
  version?: number;
}

/**
 * Bed disimpan sebagai sub-collection di LocationNode (BUKAN node tree
 * tersendiri) supaya hirarki tree tetap ringkas.
 */
export interface BedSubRecord {
  id: string;
  name: string;
  kode: string;
  status: BedStatus;
}

export interface LocationNode {
  id: string;
  type: "Location";
  name: string;
  kode: string;
  locationType: LocationType;
  kelas: LocationKelas;
  kapasitas: number;
  /** Aktif/non-aktif ruangan (DTO). Opsional agar draft/mock lama tetap valid. */
  active?: boolean;
  /** Override alamat — null/undefined = inherit dari Organization parent terdekat */
  alamatOverride?: Alamat;
  parentId: string;
  beds: BedSubRecord[];
  /** Optimistic concurrency (DTO). undefined = node DRAFT (belum tersimpan → POST saat save). */
  version?: number;
}

export type AnyNode = OrganizationNode | LocationNode;

// ── Config Maps ───────────────────────────────────────────

export const NODE_CFG: Record<
  NodeType,
  { label: string; iconBg: string; iconText: string }
> = {
  Organization: { label: "Unit",    iconBg: "bg-teal-50", iconText: "text-teal-600" },
  Location:     { label: "Ruangan", iconBg: "bg-sky-50",  iconText: "text-sky-600" },
};

export const ORG_TYPE_CFG: Record<
  OrgType,
  { label: string; desc: string; bg: string; text: string }
> = {
  prov:        { label: "Healthcare Provider", desc: "Rumah Sakit / Penyedia layanan",     bg: "bg-violet-50",  text: "text-violet-700" },
  dept:        { label: "Departemen / Instalasi", desc: "Unit operasional formal",         bg: "bg-teal-50",    text: "text-teal-700" },
  "dept-clin": { label: "Departemen Klinis",   desc: "KSM (Kelompok Staf Medis)",          bg: "bg-sky-50",     text: "text-sky-700" },
  team:        { label: "Tim",                 desc: "Tim fungsional (PPI, K3, Mutu, dll)", bg: "bg-amber-50",  text: "text-amber-700" },
};

export const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
  Rawat_Inap:  "Rawat Inap",
  Rawat_Jalan: "Rawat Jalan / Poli",
  ICU:         "ICU",
  HCU:         "HCU",
  Isolasi:     "Isolasi",
  IGD:         "IGD",
  OK:          "Kamar Operasi",
  Penunjang:   "Penunjang (lama)",
  Laboratorium: "Laboratorium",
  Radiologi:   "Radiologi",
  Farmasi:        "Farmasi / Depo Obat",
  Gudang_Farmasi: "Gudang Farmasi",
  Gudang:         "Gudang / Logistik",
};

export const BED_STATUS_CFG: Record<
  BedStatus,
  { label: string; bg: string; text: string; ring: string }
> = {
  active:    { label: "Aktif",       bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-300" },
  inactive:  { label: "Non-Aktif",   bg: "bg-slate-100",  text: "text-slate-500",   ring: "ring-slate-300" },
  suspended: { label: "Maintenance", bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-300" },
};

// ── Kemendagri (mini sample — production: import JSON ~500KB) ─

export const PROVINSI_LIST: { kode: string; nama: string }[] = [
  { kode: "31", nama: "DKI Jakarta" },
  { kode: "32", nama: "Jawa Barat" },
  { kode: "33", nama: "Jawa Tengah" },
  { kode: "35", nama: "Jawa Timur" },
  { kode: "36", nama: "Banten" },
];

export const KOTA_BY_PROVINSI: Record<string, { kode: string; nama: string }[]> = {
  "31": [
    { kode: "3171", nama: "Jakarta Pusat" },
    { kode: "3172", nama: "Jakarta Utara" },
    { kode: "3173", nama: "Jakarta Barat" },
    { kode: "3174", nama: "Jakarta Selatan" },
    { kode: "3175", nama: "Jakarta Timur" },
  ],
  "32": [
    { kode: "3273", nama: "Kota Bandung" },
    { kode: "3275", nama: "Kota Bekasi" },
    { kode: "3276", nama: "Kota Depok" },
  ],
  "33": [
    { kode: "3374", nama: "Kota Semarang" },
    { kode: "3372", nama: "Kota Surakarta" },
  ],
  "35": [
    { kode: "3578", nama: "Kota Surabaya" },
    { kode: "3573", nama: "Kota Malang" },
  ],
  "36": [
    { kode: "3671", nama: "Kota Tangerang" },
    { kode: "3674", nama: "Kota Tangerang Selatan" },
  ],
};

// ── Mock Data ─────────────────────────────────────────────

export const RUANGAN_MOCK: AnyNode[] = [
  // ── RS Induk (root, dari rsConfig) ──
  {
    id: RS_ROOT_ID,
    type: "Organization",
    name: RS_PROFIL.nama,
    kode: RS_PROFIL.kode,
    orgType: "prov",
    active: true,
    telp: RS_PROFIL.telp,
    email: RS_PROFIL.email,
    alamat: { ...RS_PROFIL.alamat },
    parentId: null,
  },

  // ── Direktorat Pelayanan Medis (contoh sub-Organization nested) ──
  {
    id: "org-dir-yanmed",
    type: "Organization",
    name: "Direktorat Pelayanan Medis",
    kode: "DIR-YANMED",
    orgType: "dept",
    active: true,
    telp: "021-555-0100",
    email: "yanmed@rsharapansehat.id",
    alamat: { ...RS_PROFIL.alamat },
    parentId: RS_ROOT_ID,
  },

  // ── Instalasi IGD (di bawah Direktorat) ──
  {
    id: "org-igd",
    type: "Organization",
    name: "Instalasi Gawat Darurat",
    kode: "IGD",
    orgType: "dept",
    active: true,
    telp: "021-555-0101",
    email: "igd@rsharapansehat.id",
    alamat: { ...RS_PROFIL.alamat },
    parentId: "org-dir-yanmed",
  },
  {
    id: "loc-igd-triase",
    type: "Location",
    name: "Ruang Triase",
    kode: "IGD-TRI",
    locationType: "IGD",
    kelas: "—",
    kapasitas: 4,
    parentId: "org-igd",
    beds: [],
  },
  {
    id: "loc-igd-observasi",
    type: "Location",
    name: "Ruang Observasi IGD",
    kode: "IGD-OBS",
    locationType: "IGD",
    kelas: "—",
    kapasitas: 8,
    parentId: "org-igd",
    beds: [
      { id: "bed-igd-obs-1", name: "Bed Observasi 01", kode: "IGD-OBS-01", status: "active" },
      { id: "bed-igd-obs-2", name: "Bed Observasi 02", kode: "IGD-OBS-02", status: "active" },
      { id: "bed-igd-obs-3", name: "Bed Observasi 03", kode: "IGD-OBS-03", status: "suspended" },
    ],
  },

  // ── Instalasi Rawat Inap ──
  {
    id: "org-ri",
    type: "Organization",
    name: "Instalasi Rawat Inap",
    kode: "RI",
    orgType: "dept",
    active: true,
    telp: "021-555-0202",
    email: "ranap@rsharapansehat.id",
    alamat: { ...RS_PROFIL.alamat },
    parentId: "org-dir-yanmed",
  },
  {
    id: "loc-ri-melati",
    type: "Location",
    name: "Bangsal Melati (Kelas 1)",
    kode: "RI-MEL",
    locationType: "Rawat_Inap",
    kelas: "Kelas_1",
    kapasitas: 4,
    parentId: "org-ri",
    beds: [
      { id: "bed-mel-1", name: "Bed 01", kode: "MEL-01", status: "active" },
      { id: "bed-mel-2", name: "Bed 02", kode: "MEL-02", status: "active" },
      { id: "bed-mel-3", name: "Bed 03", kode: "MEL-03", status: "active" },
      { id: "bed-mel-4", name: "Bed 04", kode: "MEL-04", status: "active" },
    ],
  },
  {
    id: "loc-ri-mawar",
    type: "Location",
    name: "Bangsal Mawar (VIP)",
    kode: "RI-MAW",
    locationType: "Rawat_Inap",
    kelas: "VIP",
    kapasitas: 2,
    parentId: "org-ri",
    beds: [
      { id: "bed-maw-1", name: "VIP 01", kode: "MAW-01", status: "active" },
      { id: "bed-maw-2", name: "VIP 02", kode: "MAW-02", status: "inactive" },
    ],
  },
  {
    id: "loc-ri-icu",
    type: "Location",
    name: "Ruang ICU",
    kode: "RI-ICU",
    locationType: "ICU",
    kelas: "—",
    kapasitas: 6,
    parentId: "org-ri",
    beds: [
      { id: "bed-icu-1", name: "ICU 01", kode: "ICU-01", status: "active" },
      { id: "bed-icu-2", name: "ICU 02", kode: "ICU-02", status: "active" },
    ],
  },

  // ── Instalasi Rawat Jalan (langsung di RS Induk, contoh struktur tanpa Direktorat) ──
  {
    id: "org-poli",
    type: "Organization",
    name: "Instalasi Rawat Jalan",
    kode: "RJ",
    orgType: "dept",
    active: true,
    telp: "021-555-0303",
    email: "poli@rsharapansehat.id",
    alamat: { ...RS_PROFIL.alamat },
    parentId: RS_ROOT_ID,
  },
  {
    id: "loc-poli-umum",
    type: "Location",
    name: "Poli Umum",
    kode: "POLI-UMUM",
    locationType: "Rawat_Jalan",
    kelas: "—",
    kapasitas: 1,
    parentId: "org-poli",
    beds: [],
  },
  {
    id: "loc-poli-jantung",
    type: "Location",
    name: "Poli Jantung",
    kode: "POLI-JTG",
    locationType: "Rawat_Jalan",
    kelas: "—",
    kapasitas: 1,
    parentId: "org-poli",
    beds: [],
  },
];

// ── Helpers ───────────────────────────────────────────────

export function isRSRoot(node: AnyNode | null | undefined): boolean {
  if (!node) return false;
  // DTO: flag isRoot (id = UUID asli). Mock/legacy: id === RS_ROOT_ID.
  return (node.type === "Organization" && node.isRoot === true) || node.id === RS_ROOT_ID;
}

export function getChildren(nodes: AnyNode[], parentId: string | null): AnyNode[] {
  return nodes.filter((n) => n.parentId === parentId);
}

export function getNodeById(nodes: AnyNode[], id: string): AnyNode | undefined {
  return nodes.find((n) => n.id === id);
}

/** Total descendant count (Organizations + Locations + Beds) */
export function countDescendants(nodes: AnyNode[], parentId: string): number {
  const direct = getChildren(nodes, parentId);
  let count = direct.length;
  for (const c of direct) {
    if (c.type === "Location") count += c.beds.length;
    count += countDescendants(nodes, c.id);
  }
  return count;
}

export function countAllBeds(nodes: AnyNode[]): number {
  return nodes.reduce((sum, n) => sum + (n.type === "Location" ? n.beds.length : 0), 0);
}

export function getEffectiveAlamat(nodes: AnyNode[], node: AnyNode): Alamat | null {
  if (node.type === "Organization") return node.alamat;
  if (node.alamatOverride) return node.alamatOverride;
  const parent = getNodeById(nodes, node.parentId);
  if (parent?.type === "Organization") return parent.alamat;
  if (parent) return getEffectiveAlamat(nodes, parent);
  return null;
}

/** Breadcrumb ancestor chain — dari root ke node (inklusif). */
export function getAncestors(nodes: AnyNode[], node: AnyNode): AnyNode[] {
  const chain: AnyNode[] = [node];
  let cur: AnyNode | undefined = node;
  while (cur?.parentId) {
    const parent = getNodeById(nodes, cur.parentId);
    if (!parent) break;
    chain.unshift(parent);
    cur = parent;
  }
  return chain;
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/** YYMM dari tanggal (mis. Juni 2026 → "2606"). */
function yymm(date: Date): string {
  return `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Kode unik SATU STRING: `<PREFIX><YYMM><NNN>` (mis. "UN2606001") — tanpa hyphen.
 * Sequence = (max sequence kode existing ber-prefix+YYMM sama) + 1 → tahan gap/hapus.
 * Unik final dijaga server (CONFLICT → toast). Prefix: Unit "UN" · Ruangan "R" · Bed "BD".
 */
export function genKode(prefix: string, existing: string[], date: Date = new Date()): string {
  const head = `${prefix}${yymm(date)}`;
  let max = 0;
  for (const k of existing) {
    if (!k.startsWith(head)) continue;
    const n = parseInt(k.slice(head.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${head}${String(max + 1).padStart(3, "0")}`;
}

/** Kode existing per tipe (untuk hitung sequence berikutnya). */
export function unitKodes(nodes: AnyNode[]): string[] {
  return nodes.filter((n) => n.type === "Organization").map((n) => n.kode);
}
export function ruanganKodes(nodes: AnyNode[]): string[] {
  return nodes.filter((n) => n.type === "Location").map((n) => n.kode);
}
export function bedKodes(nodes: AnyNode[]): string[] {
  return nodes.flatMap((n) => (n.type === "Location" ? n.beds.map((b) => b.kode) : []));
}
