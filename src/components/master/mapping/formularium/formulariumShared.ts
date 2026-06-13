// Formularium Unit (Mapping Hub) — model REAL (SSR hybrid). Edge = grant Obat ⇄ Ruangan(Location):
// "obat masuk formularium di unit mana", universal lintas penjamin (BPJS/Umum sama). Bentuk PERSIS
// Layanan Unit → reuse helper generik kolom-unit + grant-map dari layananShared. Cache edge TERPISAH
// (per-modul) supaya tak bentrok dgn cache Layanan Unit.

import type { FormulariumEdgeDTO } from "@/lib/api/master/formularium";
// Helper generik (kolom unit dari master tree + grant-map) — dipakai bersama Layanan Unit.
import {
  type LayananMap, type LayananUnit,
  UNIT_CATEGORY_CFG, UNIT_CATEGORY_ORDER, unitsFromTree,
  setPresence, hasLayanan, countUnitPerRow, countRowsPerUnit, countAllLayanan,
} from "../layanan/layananShared";

export type { LayananMap, LayananUnit };
export {
  UNIT_CATEGORY_CFG, UNIT_CATEGORY_ORDER, unitsFromTree,
  setPresence, hasLayanan, countUnitPerRow, countRowsPerUnit, countAllLayanan,
};

// ── Edge index (key `${obatId}|${ruanganKode}` → id edge, untuk revoke) ────────
export function edgeKey(obatId: string, unitKode: string): string {
  return `${obatId}|${unitKode}`;
}

/**
 * Seed `LayananMap` (obatId → ruanganKode[]) + index id-edge dari edge DB. `validUnitKodes`
 * (bila ada) menyaring ke kode kolom aktif — cegah edge ke ruangan non-aktif mengotori statistik.
 */
export function mapFromEdges(
  edges: FormulariumEdgeDTO[],
  validUnitKodes?: Set<string>,
): { map: LayananMap; index: Map<string, string> } {
  const map: LayananMap = {};
  const index = new Map<string, string>();
  for (const e of edges) {
    if (validUnitKodes && !validUnitKodes.has(e.ruanganKode)) continue;
    (map[e.obatId] ??= []).push(e.ruanganKode);
    index.set(edgeKey(e.obatId, e.ruanganKode), e.id);
  }
  return { map, index };
}

// ── Cache edge per-sesi (module-scoped, client-only — TERPISAH dari Layanan Unit) ──
// Pane di-unmount→remount tiap ganti sub-page Mapping Hub (AnimatePresence). Prop SSR = snapshot
// beku saat page-load → seed remount darinya bikin edit sesi ini "muncul lalu hilang" (flicker)
// saat reconcile. Cache ini simpan state edge TERKINI klien (update tiap reconcile & grant/revoke
// sukses) → seed remount pakai data terbaru. Hanya di-import komponen client → aman (per-tab).
let edgeCache: Map<string, FormulariumEdgeDTO> | null = null;

/** Baca cache edge terkini (null bila belum pernah di-isi → caller fallback ke SSR snapshot). */
export function readEdgeCache(): FormulariumEdgeDTO[] | null {
  return edgeCache ? [...edgeCache.values()] : null;
}

/** Ganti seluruh isi cache dgn snapshot server (dipanggil saat reconcile sukses). */
export function writeEdgeCache(edges: FormulariumEdgeDTO[]): void {
  edgeCache = new Map(edges.map((e) => [edgeKey(e.obatId, e.ruanganKode), e]));
}

/** Tambah/replace satu edge (grant sukses). */
export function cacheEdge(edge: FormulariumEdgeDTO): void {
  (edgeCache ??= new Map()).set(edgeKey(edge.obatId, edge.ruanganKode), edge);
}

/** Hapus satu edge dari cache (revoke sukses). */
export function uncacheEdge(obatId: string, unitKode: string): void {
  edgeCache?.delete(edgeKey(obatId, unitKode));
}
