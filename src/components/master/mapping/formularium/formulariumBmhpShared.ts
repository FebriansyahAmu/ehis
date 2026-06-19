// Ketersediaan Farmasi sub BMHP (Mapping Hub) — helper model REAL (SSR hybrid). Edge = grant
// BMHP ⇄ Ruangan(Location): "BMHP jadi daftar standar depo di lokasi mana". Bentuk PERSIS
// versi Obat (formulariumShared) → reuse helper generik kolom-unit + grant-map. Cache edge
// TERPISAH (per-modul) supaya tak bentrok dgn cache Formularium Obat.

import type { FormulariumBmhpEdgeDTO } from "@/lib/api/master/formulariumBmhp";
// Helper generik catalog-agnostic (map id→kode[], kolom unit dari tree, filter lokasi farmasi).
import {
  type LayananMap, type LayananUnit,
  UNIT_CATEGORY_CFG, UNIT_CATEGORY_ORDER, unitsFromTree,
  setPresence, hasLayanan, countUnitPerRow, countRowsPerUnit, countAllLayanan,
  FARMASI_LOCATION_TYPES, pharmacyUnitsFromTree, pharmacyTreeNodes,
} from "./formulariumShared";

export type { LayananMap, LayananUnit };
export {
  UNIT_CATEGORY_CFG, UNIT_CATEGORY_ORDER, unitsFromTree,
  setPresence, hasLayanan, countUnitPerRow, countRowsPerUnit, countAllLayanan,
  FARMASI_LOCATION_TYPES, pharmacyUnitsFromTree, pharmacyTreeNodes,
};

// ── Edge index (key `${bmhpId}|${ruanganKode}` → id edge, untuk revoke) ─────────
export function edgeKey(bmhpId: string, unitKode: string): string {
  return `${bmhpId}|${unitKode}`;
}

/**
 * Seed `LayananMap` (bmhpId → ruanganKode[]) + index id-edge dari edge DB. `validUnitKodes`
 * (bila ada) menyaring ke kode kolom aktif — cegah edge ke ruangan non-aktif mengotori statistik.
 */
export function mapFromEdges(
  edges: FormulariumBmhpEdgeDTO[],
  validUnitKodes?: Set<string>,
): { map: LayananMap; index: Map<string, string> } {
  const map: LayananMap = {};
  const index = new Map<string, string>();
  for (const e of edges) {
    if (validUnitKodes && !validUnitKodes.has(e.ruanganKode)) continue;
    (map[e.bmhpId] ??= []).push(e.ruanganKode);
    index.set(edgeKey(e.bmhpId, e.ruanganKode), e.id);
  }
  return { map, index };
}

// ── Cache edge per-sesi (module-scoped, client-only — TERPISAH dari Formularium Obat) ──
// Pane di-unmount→remount tiap ganti sub-page/tab Mapping Hub (AnimatePresence). Prop SSR =
// snapshot beku saat page-load → seed remount darinya bikin edit sesi ini "muncul lalu hilang".
// Cache ini simpan state edge TERKINI klien (update tiap reconcile & grant/revoke sukses).
let edgeCache: Map<string, FormulariumBmhpEdgeDTO> | null = null;

/** Baca cache edge terkini (null bila belum pernah di-isi → caller fallback ke SSR snapshot). */
export function readEdgeCache(): FormulariumBmhpEdgeDTO[] | null {
  return edgeCache ? [...edgeCache.values()] : null;
}

/** Ganti seluruh isi cache dgn snapshot server (dipanggil saat reconcile sukses). */
export function writeEdgeCache(edges: FormulariumBmhpEdgeDTO[]): void {
  edgeCache = new Map(edges.map((e) => [edgeKey(e.bmhpId, e.ruanganKode), e]));
}

/** Tambah/replace satu edge (grant sukses). */
export function cacheEdge(edge: FormulariumBmhpEdgeDTO): void {
  (edgeCache ??= new Map()).set(edgeKey(edge.bmhpId, edge.ruanganKode), edge);
}

/** Hapus satu edge dari cache (revoke sukses). */
export function uncacheEdge(bmhpId: string, unitKode: string): void {
  edgeCache?.delete(edgeKey(bmhpId, unitKode));
}
