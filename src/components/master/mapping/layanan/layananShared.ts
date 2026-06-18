import {
  type TindakanRecord, type TindakanKategori,
  KATEGORI_CFG, KATEGORI_ORDER, KOMPLEKSITAS_CFG,
} from "@/lib/master/tindakanMock";
import type { TindakanDTO } from "@/lib/schemas/master/tindakan";
import type { LabTestDTO } from "@/lib/schemas/master/labTest";
import type { RadCatalogDTO } from "@/lib/schemas/master/radCatalog";
import type { LayananUnitEdgeDTO } from "@/lib/schemas/master/layananUnit";
import type { LayananUnitLabEdgeDTO } from "@/lib/schemas/master/layananUnitLab";
import type { LayananUnitRadEdgeDTO } from "@/lib/schemas/master/layananUnitRad";
import type { AnyNode, LocationNode, LocationType } from "@/components/master/ruangan/ruanganShared";

// ── Types ─────────────────────────────────────────────────

/** Map rowId → array of unit kode yang boleh lakukan baris ini (tindakan ATAU tes lab). */
export type LayananMap = Record<string, string[]>;

/** Kolom matrix Layanan Unit — diturunkan dari Location (Ruangan) master. */
export interface LayananUnit {
  /** Location.id — dipakai persist grant/revoke (FK ke master.LayananUnit). */
  id: string;
  kode: string;
  nama: string;
  short: string;
  category: "Klinis" | "Poli" | "Penunjang";
}

/** Warna per jenis unit — dipakai header kolom matrix + panel tree filter (sumber tunggal). */
export const UNIT_CATEGORY_CFG: Record<
  LayananUnit["category"],
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  Klinis:    { label: "Klinis",    bg: "bg-rose-50",   text: "text-rose-700",   border: "border-rose-200",   dot: "bg-rose-500" },
  Poli:      { label: "Poli",      bg: "bg-sky-50",    text: "text-sky-700",    border: "border-sky-200",    dot: "bg-sky-500" },
  Penunjang: { label: "Penunjang", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500" },
};

export const UNIT_CATEGORY_ORDER: LayananUnit["category"][] = ["Klinis", "Poli", "Penunjang"];

// ── Baris matriks: Tindakan + Lab + Radiologi terpadu ─────--
// Matriks Layanan Unit memetakan TIGA jenis baris ke kolom ruangan: katalog Tindakan (per kategori),
// katalog Laboratorium (grup "Tindakan Laboratorium"), dan katalog Radiologi (grup "Tindakan
// Radiologi"). Semua disatukan jadi `LayananRow` agar Matrix/MobileView agnostik jenis. `kind`
// menentukan endpoint persist (tindakan vs lab vs rad).

export type RowKind = "tindakan" | "lab" | "rad";

/** Pseudo-kategori untuk grup Lab & Rad — disisipkan setelah semua kategori tindakan. */
export type RowKategori = TindakanKategori | "Laboratorium" | "Radiologi";

type RowKatCfg = { label: string; short: string; bg: string; text: string; dot: string };

export const ROW_KATEGORI_CFG: Record<RowKategori, RowKatCfg> = {
  ...KATEGORI_CFG,
  Laboratorium: { label: "Tindakan Laboratorium", short: "Lab", bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  Radiologi:    { label: "Tindakan Radiologi",    short: "Rad", bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
};

export const ROW_KATEGORI_ORDER: RowKategori[] = [...KATEGORI_ORDER, "Laboratorium", "Radiologi"];

/** Satu baris matriks (tindakan atau tes lab) — bentuk seragam untuk render + filter. */
export interface LayananRow {
  id: string;
  kind: RowKind;
  nama: string;
  kategori: RowKategori;
  /** Baris kedua: kode tindakan, atau (lab) kode/kategori internal. */
  subLabel: string;
  /** Badge kecil: kompleksitas tindakan, atau jumlah parameter lab. */
  chip?: { label: string; bg: string; text: string };
  /** Teks ter-precompute (lowercase) untuk pencarian bebas-jenis. */
  searchText: string;
}

/** Katalog tindakan → baris matriks (kategori = kategori tindakan, chip = kompleksitas). */
export function rowsFromTindakan(records: TindakanRecord[]): LayananRow[] {
  return records.map((t) => {
    const kCfg = t.kompleksitas ? KOMPLEKSITAS_CFG[t.kompleksitas] : null;
    return {
      id: t.id,
      kind: "tindakan" as const,
      nama: t.nama,
      kategori: t.kategori,
      subLabel: t.kode,
      chip: kCfg ? { label: kCfg.label, bg: kCfg.bg, text: kCfg.text } : undefined,
      searchText: `${t.nama} ${t.kode}`.toLowerCase(),
    };
  });
}

/** Katalog lab → baris matriks (semua di grup "Laboratorium", chip = jumlah parameter). */
export function rowsFromLab(tests: LabTestDTO[]): LayananRow[] {
  return tests.map((t) => {
    const n = t.parameters.length;
    return {
      id: t.id,
      kind: "lab" as const,
      nama: t.nama,
      kategori: "Laboratorium" as const,
      subLabel: t.kode ? t.kode : t.kategori,
      chip: { label: `${n} par`, bg: "bg-cyan-50", text: "text-cyan-700" },
      searchText: `${t.nama} ${t.kode} ${t.kategori}`.toLowerCase(),
    };
  });
}

/** Katalog radiologi → baris matriks (semua di grup "Radiologi", chip = modalitas FHIR). */
export function rowsFromRad(items: RadCatalogDTO[]): LayananRow[] {
  return items.map((r) => ({
    id: r.id,
    kind: "rad" as const,
    nama: r.nama,
    kategori: "Radiologi" as const,
    subLabel: r.kode || r.modalitas,
    chip: { label: r.modalitas, bg: "bg-rose-50", text: "text-rose-700" },
    searchText: `${r.nama} ${r.kode} ${r.kodeIcd ?? ""} ${r.modalitas}`.toLowerCase(),
  }));
}

/** Grup baris per RowKategori (urutan tetap ROW_KATEGORI_ORDER; semua kunci di-seed kosong). */
export function groupRowsByKategori(rows: LayananRow[]): Map<RowKategori, LayananRow[]> {
  const map = new Map<RowKategori, LayananRow[]>();
  for (const cat of ROW_KATEGORI_ORDER) map.set(cat, []);
  for (const r of rows) {
    const arr = map.get(r.kategori);
    if (arr) arr.push(r);
    else map.set(r.kategori, [r]);
  }
  return map;
}

// ── Derive dari master ────────────────────────────────────

function unitCategory(lt: LocationType): LayananUnit["category"] {
  if (lt === "Rawat_Jalan") return "Poli";
  if (lt === "Penunjang" || lt === "Laboratorium" || lt === "Radiologi") return "Penunjang";
  return "Klinis"; // IGD/ICU/HCU/Isolasi/Rawat_Inap/OK/Farmasi/Gudang
}

// Label kolom sempit: pakai kode bila ringkas, else inisial nama.
function unitShort(kode: string, nama: string): string {
  if (kode && kode.length <= 9) return kode;
  return nama.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 5).toUpperCase();
}

/**
 * Kolom unit = Location (Ruangan) AKTIF dari tree master Unit & Ruangan — selaras
 * pola SDM Assignment (`ruanganFromTree`). Organization (Unit) & Bed tidak masuk.
 */
export function unitsFromTree(tree: AnyNode[]): LayananUnit[] {
  return tree
    .filter((n): n is LocationNode => n.type === "Location" && n.active !== false)
    .map((n) => ({
      id: n.id,
      kode: n.kode,
      nama: n.name,
      short: unitShort(n.kode, n.name),
      category: unitCategory(n.locationType),
    }))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

/** DTO katalog tindakan (API) → TindakanRecord FE (narrow spesialisDefault). */
export function tindakanRecordsFromDTO(dtos: TindakanDTO[]): TindakanRecord[] {
  return dtos.map((d) => ({
    ...d,
    nomorKptl: d.nomorKptl ?? null,
    kompleksitas: d.kompleksitas ?? null,
    spesialisDefault: d.spesialisDefault as TindakanRecord["spesialisDefault"],
  }));
}

// ── Edge persist (master.LayananUnit + master.LayananUnitLab) ──────────────────
// Edge terpadu lintas-jenis: tindakan (layanan_unit) & lab (layanan_unit_lab) dinormalisasi ke
// bentuk yang sama (`rowId` + `kind`) supaya map/index/cache satu jalur. `kind` menentukan
// endpoint persist saat grant/revoke.

export interface LayananEdge {
  /** id edge (untuk revoke). */
  id: string;
  /** tindakanId atau labTestId — kunci baris di map. */
  rowId: string;
  kind: RowKind;
  ruanganKode: string;
}

export function tindakanToEdge(e: LayananUnitEdgeDTO): LayananEdge {
  return { id: e.id, rowId: e.tindakanId, kind: "tindakan", ruanganKode: e.ruanganKode };
}

export function labToEdge(e: LayananUnitLabEdgeDTO): LayananEdge {
  return { id: e.id, rowId: e.labTestId, kind: "lab", ruanganKode: e.ruanganKode };
}

export function radToEdge(e: LayananUnitRadEdgeDTO): LayananEdge {
  return { id: e.id, rowId: e.radCatalogId, kind: "rad", ruanganKode: e.ruanganKode };
}

/** Kunci index edge: `${rowId}|${ruanganKode}` → id edge (untuk revoke). */
export function edgeKey(rowId: string, unitKode: string): string {
  return `${rowId}|${unitKode}`;
}

/**
 * Seed `LayananMap` + index id-edge dari edge terpadu (`/master/layanan-unit` + `.../lab`).
 * `validUnitKodes` (bila ada) menyaring ke kode kolom aktif — cegah edge ke ruangan non-aktif
 * mengotori statistik/granted. Map di-key by `ruanganKode` (selaras kolom matrix).
 */
export function mapFromEdges(
  edges: LayananEdge[],
  validUnitKodes?: Set<string>,
): { map: LayananMap; index: Map<string, string> } {
  const map: LayananMap = {};
  const index = new Map<string, string>();
  for (const e of edges) {
    if (validUnitKodes && !validUnitKodes.has(e.ruanganKode)) continue;
    (map[e.rowId] ??= []).push(e.ruanganKode);
    index.set(edgeKey(e.rowId, e.ruanganKode), e.id);
  }
  return { map, index };
}

// ── Cache edge per-sesi (module-scoped, client-only) ──────
// Pane Layanan Unit di-unmount→remount tiap ganti sub-page Mapping Hub (AnimatePresence). Prop
// SSR adalah snapshot yang BEKU saat page-load → seed remount darinya bikin edit sesi ini "muncul
// lalu hilang" (flicker) saat reconcile. Cache ini menyimpan state edge TERKINI yang diketahui
// klien (di-update tiap reconcile & tiap grant/revoke sukses) → seed remount pakai data terbaru,
// bukan snapshot basi. Hanya di-import komponen client → aman (per-tab, bukan server).
let edgeCache: Map<string, LayananEdge> | null = null;

/** Baca cache edge terkini (null bila belum pernah di-isi → caller fallback ke SSR snapshot). */
export function readEdgeCache(): LayananEdge[] | null {
  return edgeCache ? [...edgeCache.values()] : null;
}

/** Ganti seluruh isi cache dgn snapshot server (dipanggil saat reconcile sukses). */
export function writeEdgeCache(edges: LayananEdge[]): void {
  edgeCache = new Map(edges.map((e) => [edgeKey(e.rowId, e.ruanganKode), e]));
}

/** Tambah/replace satu edge (grant sukses). */
export function cacheEdge(edge: LayananEdge): void {
  (edgeCache ??= new Map()).set(edgeKey(edge.rowId, edge.ruanganKode), edge);
}

/** Hapus satu edge dari cache (revoke sukses). */
export function uncacheEdge(rowId: string, unitKode: string): void {
  edgeCache?.delete(edgeKey(rowId, unitKode));
}

/** Set/unset keberadaan satu kode di array (imutabel). */
export function setPresence(arr: string[], unitKode: string, present: boolean): string[] {
  const has = arr.includes(unitKode);
  if (present && !has) return [...arr, unitKode];
  if (!present && has) return arr.filter((k) => k !== unitKode);
  return arr;
}

// ── Helpers ───────────────────────────────────────────────

export function hasLayanan(map: LayananMap, rowId: string, unitKode: string): boolean {
  return (map[rowId] ?? []).includes(unitKode);
}

export function countUnitPerRow(map: LayananMap, rowId: string): number {
  return (map[rowId] ?? []).length;
}

export function countRowsPerUnit(map: LayananMap, unitKode: string): number {
  return Object.values(map).filter((arr) => arr.includes(unitKode)).length;
}

export function countAllLayanan(map: LayananMap): number {
  return Object.values(map).reduce((sum, arr) => sum + arr.length, 0);
}
