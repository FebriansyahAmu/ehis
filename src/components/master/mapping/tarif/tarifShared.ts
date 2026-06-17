// Tarif Matrix (Mapping Hub) — model REAL (2026-06-12). Baris = Katalog Tindakan DB (persis Layanan
// Unit). Kolom = TIER "Jenis Ruangan" (locationType[:kelas]) DI-DERIVE dari master Ruangan tree —
// BUKAN Location fisik (tarif ditetapkan per kelas, bukan per bed). Tier valid difilter per penjamin
// (BPJS → KRIS; Umum/Asuransi → VIP/Kelas). Sel = harga dari edge master.TarifTindakan.

import type { AnyNode, LocationNode, LocationType, LocationKelas } from "@/components/master/ruangan/ruanganShared";
import type { PenjaminTipe } from "@/lib/master/penjaminMock";
import type { TarifTindakanDTO } from "@/lib/api/master/tarifTindakan";
import type { TarifLabTestDTO } from "@/lib/api/master/tarifLabTest";

// ════════════════════════════════════════════════════════════════════════════
//  TIER "Jenis Ruangan"
// ════════════════════════════════════════════════════════════════════════════

export type TierGroup = "IGD" | "RAWAT_JALAN" | "RAWAT_INAP" | "INTENSIF" | "OK";

export interface JenisRuanganTier {
  key: string;   // 'IGD' | 'RAWAT_INAP:Kelas_3' | 'RAWAT_INAP:KRIS' | 'ICU' | …
  label: string;
  short: string;
  group: TierGroup;
  order: number;
}

export const KRIS_KEY = "RAWAT_INAP:KRIS";

// ════════════════════════════════════════════════════════════════════════════
//  PENJAMIN (khusus Tarif — TIDAK pakai PENJAMIN_MOCK global yg dipakai billing/formularium)
// ════════════════════════════════════════════════════════════════════════════
// Tarif RS = **Tarif PERDA** → satu harga berlaku SEMUA jaminan (Umum & BPJS sama). Maka untuk
// sekarang hanya sheet "Umum" yang dipakai; BPJS Kesehatan (KRIS) DI-DISABLE dulu (tab tampil,
// tak bisa dipilih/diedit); jaminan lain (Inhealth/AXA/Allianz/Jamkesda) dihapus dari Tarif.
export interface TarifPenjamin {
  kode: string;
  nama: string;
  tipe: PenjaminTipe;
  /** false → tab tampil tapi non-aktif (tak bisa dipilih/diedit). */
  enabled: boolean;
  note?: string;
}

export const TARIF_PENJAMIN: TarifPenjamin[] = [
  { kode: "UMUM", nama: "Umum (Tarif PERDA)", tipe: "Umum", enabled: true, note: "Berlaku semua jaminan" },
  { kode: "BPJS", nama: "BPJS Kesehatan",     tipe: "BPJS", enabled: false, note: "KRIS — nonaktif sementara" },
];

// Metadata kanonik per key (label/short/group/order). Tier inap berjenjang + tier flat per unit.
// PENTING: key inap HARUS sama persis enum LocationKelas (`Kelas_3`, BUKAN `KELAS_3`) — dipakai
// sbg `RAWAT_INAP:${kelas}` di tierKeyOf. Mismatch casing → tier nyasar ke FALLBACK ("Lainnya").
const TIER_META: Record<string, Omit<JenisRuanganTier, "key">> = {
  IGD:                  { label: "IGD",               short: "IGD", group: "IGD",        order: 1 },
  RAWAT_JALAN:          { label: "Rawat Jalan",       short: "RJ",  group: "RAWAT_JALAN", order: 2 },
  [KRIS_KEY]:           { label: "Rawat Inap · KRIS", short: "KRIS", group: "RAWAT_INAP", order: 9 },
  "RAWAT_INAP:Kelas_3": { label: "Rawat Inap · Kelas 3", short: "K3", group: "RAWAT_INAP", order: 10 },
  "RAWAT_INAP:Kelas_2": { label: "Rawat Inap · Kelas 2", short: "K2", group: "RAWAT_INAP", order: 11 },
  "RAWAT_INAP:Kelas_1": { label: "Rawat Inap · Kelas 1", short: "K1", group: "RAWAT_INAP", order: 12 },
  "RAWAT_INAP:VIP":     { label: "Rawat Inap · VIP",     short: "VIP", group: "RAWAT_INAP", order: 13 },
  ICU:                  { label: "ICU",      short: "ICU", group: "INTENSIF", order: 20 },
  HCU:                  { label: "HCU",      short: "HCU", group: "INTENSIF", order: 21 },
  ISOLASI:              { label: "Isolasi",  short: "ISO", group: "INTENSIF", order: 22 },
  OK:                   { label: "Kamar Operasi", short: "OK", group: "OK", order: 30 },
};

const FALLBACK_META: Omit<JenisRuanganTier, "key"> = { label: "Lainnya", short: "—", group: "OK", order: 99 };

function tierMeta(key: string): JenisRuanganTier {
  return { key, ...(TIER_META[key] ?? FALLBACK_META) };
}

export const TIER_GROUP_CFG: Record<TierGroup, { label: string; bg: string; text: string }> = {
  IGD:         { label: "IGD",         bg: "bg-rose-50",    text: "text-rose-700" },
  RAWAT_JALAN: { label: "Rawat Jalan", bg: "bg-sky-50",     text: "text-sky-700" },
  RAWAT_INAP:  { label: "Rawat Inap",  bg: "bg-amber-50",   text: "text-amber-700" },
  INTENSIF:    { label: "Intensif",    bg: "bg-violet-50",  text: "text-violet-700" },
  OK:          { label: "Bedah / OK",  bg: "bg-emerald-50", text: "text-emerald-700" },
};

/** Key tier dari (locationType, kelas). Inap → 'RAWAT_INAP:<kelas>'; lainnya → locationType (flat). */
function tierKeyOf(lt: LocationType, kelas: LocationKelas | null | undefined): string | null {
  if (lt === "Penunjang") return null; // Lab/Rad punya tarif sendiri
  if (lt === "Rawat_Inap") {
    if (!kelas || kelas === "—") return null; // inap wajib berkelas
    return `RAWAT_INAP:${kelas}`;
  }
  if (lt === "Rawat_Jalan") return "RAWAT_JALAN";
  return lt; // IGD | ICU | HCU | Isolasi | OK → key = enum
}

/** Derive daftar tier (distinct) dari master Ruangan tree — analog unitsFromTree (Layanan Unit). */
export function tiersFromTree(tree: AnyNode[]): JenisRuanganTier[] {
  const keys = new Set<string>();
  for (const n of tree) {
    if (n.type !== "Location" || (n as LocationNode).active === false) continue;
    const loc = n as LocationNode;
    const key = tierKeyOf(loc.locationType, loc.kelas);
    if (key) keys.add(key);
  }
  return [...keys].map(tierMeta).sort((a, b) => a.order - b.order);
}

/**
 * Tier valid untuk penjamin tertentu (KRIS-aware):
 *  - BPJS → tier inap berkelas DI-COLLAPSE jadi 1 tier KRIS; tier non-inap tetap.
 *  - lainnya (Umum/Asuransi/Jamkesda) → tier inap berkelas tetap; tanpa KRIS.
 */
export function validTiersForPenjamin(tipe: PenjaminTipe, derived: JenisRuanganTier[]): JenisRuanganTier[] {
  if (tipe !== "BPJS") return derived;
  const nonInap = derived.filter((t) => t.group !== "RAWAT_INAP");
  const hasInap = derived.some((t) => t.group === "RAWAT_INAP");
  const out = hasInap ? [...nonInap, tierMeta(KRIS_KEY)] : nonInap;
  return out.sort((a, b) => a.order - b.order);
}

// ════════════════════════════════════════════════════════════════════════════
//  TARIF MAP (dari edge DB)
// ════════════════════════════════════════════════════════════════════════════

export interface TarifCell {
  id: string;   // id edge (untuk DELETE)
  harga: number;
}
// [penjaminKode][rowId][tierKey] → cell. rowId = tindakanId ATAU labTestId (federasi).
export type TarifMap = Record<string, Record<string, Record<string, TarifCell>>>;

// ── Edge terpadu (Tindakan + Lab) ──────────────────────────────────────────────
// Matriks Tarif memetakan DUA jenis baris ke kolom tier: katalog Tindakan (per kategori) dan
// katalog Laboratorium (grup "Tindakan Laboratorium"). Edge dari 2 endpoint (tarif_tindakan vs
// tarif_lab_test) dinormalisasi ke `TarifEdgeLike` (rowId) → map satu jalur. `kind` baris (untuk
// memilih endpoint persist) ditentukan terpisah dari daftar rows (rowKind di TarifPane).
export interface TarifEdgeLike {
  id: string;
  rowId: string;
  penjaminKode: string;
  jenisRuangan: string;
  harga: number;
}

export function tindakanToTarifEdge(e: TarifTindakanDTO): TarifEdgeLike {
  return { id: e.id, rowId: e.tindakanId, penjaminKode: e.penjaminKode, jenisRuangan: e.jenisRuangan, harga: e.harga };
}
export function labToTarifEdge(e: TarifLabTestDTO): TarifEdgeLike {
  return { id: e.id, rowId: e.labTestId, penjaminKode: e.penjaminKode, jenisRuangan: e.jenisRuangan, harga: e.harga };
}

export function mapFromEdges(edges: TarifEdgeLike[]): TarifMap {
  const m: TarifMap = {};
  for (const e of edges) {
    (m[e.penjaminKode] ??= {});
    (m[e.penjaminKode][e.rowId] ??= {});
    m[e.penjaminKode][e.rowId][e.jenisRuangan] = { id: e.id, harga: e.harga };
  }
  return m;
}

export function getCell(map: TarifMap, penjaminKode: string, tindakanId: string, tierKey: string): TarifCell | undefined {
  return map[penjaminKode]?.[tindakanId]?.[tierKey];
}
export function getHarga(map: TarifMap, penjaminKode: string, tindakanId: string, tierKey: string): number {
  return getCell(map, penjaminKode, tindakanId, tierKey)?.harga ?? 0;
}

/** Set/replace 1 sel (immutable). */
export function setCell(map: TarifMap, penjaminKode: string, tindakanId: string, tierKey: string, cell: TarifCell): TarifMap {
  const next: TarifMap = { ...map };
  next[penjaminKode] = { ...(next[penjaminKode] ?? {}) };
  next[penjaminKode][tindakanId] = { ...(next[penjaminKode][tindakanId] ?? {}) };
  next[penjaminKode][tindakanId][tierKey] = cell;
  return next;
}

/** Hapus 1 sel (immutable). */
export function clearCell(map: TarifMap, penjaminKode: string, tindakanId: string, tierKey: string): TarifMap {
  const next: TarifMap = { ...map };
  if (!next[penjaminKode]?.[tindakanId]) return next;
  next[penjaminKode] = { ...next[penjaminKode] };
  next[penjaminKode][tindakanId] = { ...next[penjaminKode][tindakanId] };
  delete next[penjaminKode][tindakanId][tierKey];
  return next;
}

// ── Stats per penjamin (sel terlihat) ─────────────────────────────────────────
export function calcStats(
  map: TarifMap,
  penjaminKode: string,
  tindakanIds: string[],
  tierKeys: string[],
) {
  const values: number[] = [];
  const sheet = map[penjaminKode] ?? {};
  for (const tId of tindakanIds) {
    const row = sheet[tId] ?? {};
    for (const k of tierKeys) {
      const v = row[k]?.harga ?? 0;
      if (v > 0) values.push(v);
    }
  }
  const total = tindakanIds.length * tierKeys.length;
  if (values.length === 0) return { count: 0, filled: 0, total, avg: 0, min: 0, max: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    filled: values.length,
    total,
    avg: Math.round(sum / values.length),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

// Konversi DTO → TindakanRecord baris matrix → pakai tindakanRecordsFromDTO dari layananShared
// (federasi tindakan+lab). Tak diduplikasi di sini lagi.

export function roundIDR(n: number): number {
  return Math.max(0, Math.round(n / 500) * 500);
}
