import type { TindakanRecord } from "@/lib/master/tindakanMock";
import type { TindakanDTO } from "@/lib/schemas/master/tindakan";
import type { LayananUnitEdgeDTO } from "@/lib/schemas/master/layananUnit";
import type { AnyNode, LocationNode, LocationType } from "@/components/master/ruangan/ruanganShared";

// ── Types ─────────────────────────────────────────────────

/** Map tindakanId → array of unit kode yang boleh lakukan tindakan ini */
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

// ── Derive dari master ────────────────────────────────────

function unitCategory(lt: LocationType): LayananUnit["category"] {
  if (lt === "Rawat_Jalan") return "Poli";
  if (lt === "Penunjang") return "Penunjang";
  return "Klinis"; // IGD/ICU/HCU/Isolasi/Rawat_Inap/OK
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

// ── Edge persist (master.LayananUnit) ─────────────────────

/** Kunci index edge: `${tindakanId}|${ruanganKode}` → id edge (untuk revoke). */
export function edgeKey(tindakanId: string, unitKode: string): string {
  return `${tindakanId}|${unitKode}`;
}

/**
 * Seed `LayananMap` + index id-edge dari data persist (`/master/layanan-unit`).
 * `validUnitKodes` (bila ada) menyaring ke kode kolom aktif — cegah edge ke ruangan
 * non-aktif mengotori statistik/granted. Map di-key by `ruanganKode` (selaras kolom matrix).
 */
export function mapFromEdges(
  edges: LayananUnitEdgeDTO[],
  validUnitKodes?: Set<string>,
): { map: LayananMap; index: Map<string, string> } {
  const map: LayananMap = {};
  const index = new Map<string, string>();
  for (const e of edges) {
    if (validUnitKodes && !validUnitKodes.has(e.ruanganKode)) continue;
    (map[e.tindakanId] ??= []).push(e.ruanganKode);
    index.set(edgeKey(e.tindakanId, e.ruanganKode), e.id);
  }
  return { map, index };
}

// ── Cache edge per-sesi (module-scoped, client-only) ──────
// Pane Layanan Unit di-unmount→remount tiap ganti sub-page Mapping Hub (AnimatePresence). Prop
// `initialLayanan` adalah snapshot SSR yang BEKU saat page-load → seed remount darinya bikin edit
// sesi ini "muncul lalu hilang" (flicker) saat reconcile. Cache ini menyimpan state edge TERKINI
// yang diketahui klien (di-update tiap reconcile & tiap grant/revoke sukses) → seed remount pakai
// data terbaru, bukan snapshot basi. Hanya di-import komponen client → aman (per-tab, bukan server).
let edgeCache: Map<string, LayananUnitEdgeDTO> | null = null;

/** Baca cache edge terkini (null bila belum pernah di-isi → caller fallback ke SSR snapshot). */
export function readEdgeCache(): LayananUnitEdgeDTO[] | null {
  return edgeCache ? [...edgeCache.values()] : null;
}

/** Ganti seluruh isi cache dgn snapshot server (dipanggil saat reconcile sukses). */
export function writeEdgeCache(edges: LayananUnitEdgeDTO[]): void {
  edgeCache = new Map(edges.map((e) => [edgeKey(e.tindakanId, e.ruanganKode), e]));
}

/** Tambah/replace satu edge (grant sukses). */
export function cacheEdge(edge: LayananUnitEdgeDTO): void {
  (edgeCache ??= new Map()).set(edgeKey(edge.tindakanId, edge.ruanganKode), edge);
}

/** Hapus satu edge dari cache (revoke sukses). */
export function uncacheEdge(tindakanId: string, unitKode: string): void {
  edgeCache?.delete(edgeKey(tindakanId, unitKode));
}

/** Set/unset keberadaan satu kode di array (imutabel). */
export function setPresence(arr: string[], unitKode: string, present: boolean): string[] {
  const has = arr.includes(unitKode);
  if (present && !has) return [...arr, unitKode];
  if (!present && has) return arr.filter((k) => k !== unitKode);
  return arr;
}

// ── Helpers ───────────────────────────────────────────────

export function hasLayanan(map: LayananMap, tindakanId: string, unitKode: string): boolean {
  return (map[tindakanId] ?? []).includes(unitKode);
}

export function countUnitPerTindakan(map: LayananMap, tindakanId: string): number {
  return (map[tindakanId] ?? []).length;
}

export function countTindakanPerUnit(map: LayananMap, unitKode: string): number {
  return Object.values(map).filter((arr) => arr.includes(unitKode)).length;
}

export function countAllLayanan(map: LayananMap): number {
  return Object.values(map).reduce((sum, arr) => sum + arr.length, 0);
}
