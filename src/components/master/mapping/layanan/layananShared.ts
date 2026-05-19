import { TINDAKAN_MOCK, type TindakanRecord } from "@/lib/master/tindakanMock";

// ── Types ─────────────────────────────────────────────────

/** Map tindakanId → array of unit kode yang boleh lakukan tindakan ini */
export type LayananMap = Record<string, string[]>;

// ── Helpers ───────────────────────────────────────────────

export function getTindakanList(): TindakanRecord[] {
  return TINDAKAN_MOCK;
}

/**
 * Default: setiap tindakan tersedia di unit yang ada di unitDefault-nya
 * (dari katalog tindakan).
 */
export function initLayananMap(tindakan: TindakanRecord[]): LayananMap {
  const map: LayananMap = {};
  for (const t of tindakan) {
    map[t.id] = [...t.unitDefault];
  }
  return map;
}

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
