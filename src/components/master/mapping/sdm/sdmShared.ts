import { SPESIALIS_LABEL } from "@/components/master/dokter/dokterShared";
import { DOKTER_MOCK, POLI_LIST } from "@/components/master/dokter/dokterMock";
import { PENGGUNA_MOCK, UNIT_LIST, ROLE_CFG, type UserRole } from "@/components/master/pengguna/penggunaShared";
import { makeInitials } from "../mappingShared";

// ── Types ─────────────────────────────────────────────────

export type SDMSource = "dokter" | "pengguna";

export type SDMStatus = "Aktif" | "Cuti" | "Suspended" | "Non_Aktif";

export type SDMCategory =
  | "Dokter"
  | "Perawat"
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

// Kategori Unit (dipakai untuk grouping di list panel kiri)
const UNIT_CATEGORY: Record<string, UnitItem["category"]> = {
  // Poli (dari POLI_LIST)
  "POLI-UMUM": "Poli", "POLI-JTG": "Poli", "POLI-PD": "Poli", "POLI-ANAK": "Poli",
  "POLI-OBGYN": "Poli", "POLI-BEDAH": "Poli", "POLI-SARAF": "Poli", "POLI-MATA": "Poli",
  // Unit Klinis (dari UNIT_LIST + POLI_LIST yang overlap)
  IGD: "Unit Klinis", ICU: "Unit Klinis", RI: "Unit Klinis", RJ: "Unit Klinis",
  // Unit Penunjang
  FARMASI: "Unit Penunjang", LAB: "Unit Penunjang", RAD: "Unit Penunjang",
  // Operasional
  KASIR: "Unit Operasional", REGIST: "Unit Operasional", ADMIN: "Unit Operasional",
};

// ── Map Pengguna.role ke SDMCategory ──────────────────────

function roleToCategory(role: UserRole): SDMCategory {
  switch (role) {
    case "Dokter":      return "Dokter";
    case "Perawat":     return "Perawat";
    case "Apoteker":    return "Apoteker";
    case "Radiografer": return "Radiografer";
    case "SpPK":        return "SpPK";
    case "SpRad":       return "SpRad";
    case "Kasir":       return "Kasir";
    case "Registrasi":  return "Registrasi";
    case "Admin":       return "Lainnya"; // admin akan di-skip
  }
}

// ── Derive Functions ──────────────────────────────────────

/**
 * Gabungkan DOKTER_MOCK + PENGGUNA_MOCK jadi 1 unified list SDM.
 * Dedupe: jika dokter sudah ada di pengguna (sama email), pertahankan source "dokter".
 */
export function deriveSDMList(): SDMItem[] {
  const dokters: SDMItem[] = DOKTER_MOCK.map((d) => ({
    id: `sdm-dr-${d.id}`,
    source: "dokter" as const,
    sourceId: d.id,
    nama: d.nama,
    initials: makeInitials(d.nama),
    roleLabel: d.spesialis ? SPESIALIS_LABEL[d.spesialis] : "Dokter",
    roleCategory: "Dokter" as const,
    status: d.status,
    email: d.email,
    units: [...d.poliAssignment],
    sinceISO: "2024-02-01",
  }));

  const seen = new Set(dokters.map((s) => s.email));
  const penggunas: SDMItem[] = PENGGUNA_MOCK
    // Multi-role: pakai role utama (pertama) utk kategori SDM; skip akun Admin-only.
    .filter((p) => !(p.roles.length === 1 && p.roles[0] === "Admin"))
    .filter((p) => !seen.has(p.email))
    .map((p) => {
      const primary = p.roles.find((r) => r !== "Admin") ?? p.roles[0];
      return {
      id: `sdm-user-${p.id}`,
      source: "pengguna" as const,
      sourceId: p.id,
      nama: p.nama,
      initials: makeInitials(p.nama),
      roleLabel: ROLE_CFG[primary].label,
      roleCategory: roleToCategory(primary),
      status: p.status,
      email: p.email,
      units: [...p.unitAssignment],
      sinceISO: p.createdAt.slice(0, 10),
      };
    });

  return [...dokters, ...penggunas];
}

/**
 * Merge POLI_LIST + UNIT_LIST (dedupe by kode) → unified list dengan kategori.
 */
export function deriveUnitList(): UnitItem[] {
  const merged = new Map<string, UnitItem>();

  for (const p of POLI_LIST) {
    merged.set(p.kode, {
      kode: p.kode,
      nama: p.nama,
      category: UNIT_CATEGORY[p.kode] ?? "Poli",
    });
  }
  for (const u of UNIT_LIST) {
    if (!merged.has(u.kode)) {
      merged.set(u.kode, {
        kode: u.kode,
        nama: u.nama,
        category: UNIT_CATEGORY[u.kode] ?? "Unit Operasional",
      });
    }
  }
  return Array.from(merged.values());
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
