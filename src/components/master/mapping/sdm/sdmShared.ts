import { makeInitials } from "../mappingShared";
import { type AnyNode, type LocationNode } from "@/components/master/ruangan/ruanganShared";
import type { DokterListItemDTO } from "@/lib/api/dokter";
import type { PegawaiListItemDTO } from "@/lib/api/pegawai";

// ── Types ─────────────────────────────────────────────────

export type SDMSource = "dokter" | "pegawai" | "pengguna";

export type SDMStatus = "Aktif" | "Cuti" | "Suspended" | "Non_Aktif";

export type SDMCategory =
  | "Dokter"
  | "Perawat"
  | "Bidan"
  | "Apoteker"
  | "Radiografer"
  | "SpPK"
  | "SpRad"
  | "Kasir"
  | "Registrasi"
  | "Lainnya";

export interface SDMItem {
  id: string;
  source: SDMSource;
  sourceId: string;
  /** Anchor persist penugasan (FK ke master.Pegawai). Hanya dokter REAL yang punya; pengguna mock = undefined. */
  pegawaiId?: string;
  nama: string;
  initials: string;
  roleLabel: string;
  roleCategory: SDMCategory;
  status: SDMStatus;
  email: string;
  /** Unit/poli kode yang ditugaskan */
  units: string[];
  /** Tanggal mulai penugasan (mock: deterministic dari sourceId) */
  sinceISO?: string;
}

export interface UnitItem {
  kode: string;
  nama: string;
  /** Klasifikasi tampilan */
  category: "Poli" | "Unit Klinis" | "Unit Penunjang" | "Unit Operasional";
}

// ── Config ───────────────────────────────────────────────

export const CATEGORY_CFG: Record<
  SDMCategory,
  { label: string; bg: string; text: string; dot: string }
> = {
  Dokter:      { label: "Dokter",       bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-500" },
  Perawat:     { label: "Perawat",      bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Bidan:       { label: "Bidan",        bg: "bg-fuchsia-50", text: "text-fuchsia-700", dot: "bg-fuchsia-500" },
  Apoteker:    { label: "Apoteker",     bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500" },
  Radiografer: { label: "Radiografer",  bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  SpPK:        { label: "Sp. Patologi", bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500" },
  SpRad:       { label: "Sp. Radiologi",bg: "bg-pink-50",    text: "text-pink-700",    dot: "bg-pink-500" },
  Kasir:       { label: "Kasir",        bg: "bg-yellow-50",  text: "text-yellow-700",  dot: "bg-yellow-500" },
  Registrasi:  { label: "Registrasi",   bg: "bg-cyan-50",    text: "text-cyan-700",    dot: "bg-cyan-500" },
  Lainnya:     { label: "Lainnya",      bg: "bg-slate-100",  text: "text-slate-600",   dot: "bg-slate-400" },
};

export const STATUS_CFG: Record<
  SDMStatus,
  { label: string; bg: string; text: string }
> = {
  Aktif:     { label: "Aktif",      bg: "bg-emerald-50", text: "text-emerald-700" },
  Cuti:      { label: "Cuti",       bg: "bg-amber-50",   text: "text-amber-700" },
  Suspended: { label: "Suspended",  bg: "bg-rose-50",    text: "text-rose-700" },
  Non_Aktif: { label: "Non-Aktif",  bg: "bg-slate-100",  text: "text-slate-500" },
};

// Klasifikasi tampilan dari jenis ruangan (locationType). Rawat Jalan → Poli; Penunjang →
// Penunjang; sisanya (IGD/ICU/HCU/Isolasi/Rawat Inap/OK) = Unit Klinis.
function locationToCategory(node: LocationNode): UnitItem["category"] {
  switch (node.locationType) {
    case "Rawat_Jalan":   return "Poli";
    case "Penunjang":     // deprecated (lama)
    case "Laboratorium":
    case "Radiologi":     return "Unit Penunjang";
    default:              return "Unit Klinis";
  }
}

// ── Derive Functions ──────────────────────────────────────

/** Map DokterListItemDTO (API /master/dokter) → SDMItem. Email tak ada di list DTO (tak dipakai di roster). */
export function dokterDtoToSDM(d: DokterListItemDTO): SDMItem {
  return {
    id: `sdm-dr-${d.id}`,
    source: "dokter",
    sourceId: d.id,
    pegawaiId: d.pegawaiId,
    nama: d.namaTampil,
    initials: makeInitials(d.namaTampil),
    roleLabel: d.spesialisLabel,
    roleCategory: "Dokter",
    status: d.statusPraktik, // StatusPraktik ⊂ SDMStatus
    email: "",
    units: [],
    sinceISO: d.createdAt.slice(0, 10),
  };
}

/** Klasifikasi tampilan dari master.Pegawai.profesi (PROFESI_OPTS penggunaShared, acuan SISDMK). */
export function profesiToCategory(profesi: string | null): SDMCategory {
  switch (profesi) {
    case "Dokter":
    case "Dokter Gigi":
    case "Dokter Spesialis":
      return "Dokter";
    case "Perawat":     return "Perawat";
    case "Bidan":       return "Bidan";
    case "Apoteker":    return "Apoteker";
    case "Radiografer": return "Radiografer";
    default:            return "Lainnya";
  }
}

/** Map PegawaiListItemDTO (API /master/pegawai) → SDMItem. Anchor persist = pegawaiId (= p.id). */
export function pegawaiDtoToSDM(p: PegawaiListItemDTO): SDMItem {
  return {
    id: `sdm-pg-${p.id}`,
    source: "pegawai",
    sourceId: p.id,
    pegawaiId: p.id,
    nama: p.namaTampil,
    initials: makeInitials(p.namaTampil),
    roleLabel: p.profesi ?? "Pegawai",
    roleCategory: profesiToCategory(p.profesi),
    status: p.isActive ? "Aktif" : "Non_Aktif",
    email: "",
    units: [],
    sinceISO: p.createdAt.slice(0, 10),
  };
}

/**
 * Daftar SDM untuk Assignment = SEMUA pegawai REAL (/master/pegawai) + dokter (/master/dokter).
 * Keduanya ber-anchor `pegawaiId` (FK persist penugasan). Dokter dirender dari entri dokter
 * (label spesialis lebih kaya) → baris pegawai yang sama (dedup by pegawaiId) di-skip.
 */
export function deriveSDMList(
  dokters: DokterListItemDTO[],
  pegawai: PegawaiListItemDTO[] = [],
): SDMItem[] {
  const dokterPegawaiIds = new Set(dokters.map((d) => d.pegawaiId));
  return [
    ...dokters.map(dokterDtoToSDM),
    ...pegawai.filter((p) => !dokterPegawaiIds.has(p.id)).map(pegawaiDtoToSDM),
  ];
}

/**
 * Bangun daftar RUANGAN dari tree (master/ruangan) — node Location aktif. Penugasan SDM diatur
 * per-RUANGAN (bukan per-unit). Identitas assignment = `kode` ruangan (unik). Sumber data REAL
 * (bukan mock) — dipanggil setelah `getTree()`. Organization (unit) & Bed TIDAK dimasukkan.
 */
export function ruanganFromTree(nodes: AnyNode[]): UnitItem[] {
  return nodes
    .filter((n): n is LocationNode => n.type === "Location" && n.active !== false)
    .map((n) => ({ kode: n.kode, nama: n.name, category: locationToCategory(n) }))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

// ── Assignment Map Helpers ────────────────────────────────

export type AssignmentMap = Record<string, string[]>;

/** Initial state dari list SDM saat ini */
export function initAssignmentMap(sdmList: SDMItem[]): AssignmentMap {
  const map: AssignmentMap = {};
  for (const sdm of sdmList) {
    map[sdm.id] = [...sdm.units];
  }
  return map;
}

/** Daftar SDM id yang assigned ke unit tertentu */
export function getSDMsInUnit(map: AssignmentMap, unitKode: string): string[] {
  return Object.entries(map)
    .filter(([, units]) => units.includes(unitKode))
    .map(([id]) => id);
}

/** Count SDM per unit */
export function countSDMPerUnit(map: AssignmentMap, unitKode: string): number {
  return getSDMsInUnit(map, unitKode).length;
}

/** Total assignment edges (untuk stats global) */
export function countTotalAssignments(map: AssignmentMap): number {
  return Object.values(map).reduce((sum, units) => sum + units.length, 0);
}
