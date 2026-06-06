import { TINDAKAN_MOCK, type TindakanRecord } from "@/lib/master/tindakanMock";
import type { DokterListItemDTO } from "@/lib/api/dokter";

// ── Types ─────────────────────────────────────────────────

/** Map dokterId → array of tindakanIds yang dia berwenang lakukan */
export type KewenanganMap = Record<string, string[]>;

// ── Helpers ───────────────────────────────────────────────

export function getTindakanList(): TindakanRecord[] {
  return TINDAKAN_MOCK;
}

/**
 * Default kewenangan: dokter dapat semua tindakan yang spesialisDefault-nya match
 * (berdasarkan `spesialisKode` dari API). Pakai sebagai initial state — admin override per-dokter.
 */
export function initKewenanganMap(dokters: DokterListItemDTO[], tindakan: TindakanRecord[]): KewenanganMap {
  const map: KewenanganMap = {};
  for (const d of dokters) {
    const eligible = tindakan.filter((t) => t.spesialisDefault.includes(d.spesialisKode));
    map[d.id] = eligible.map((t) => t.id);
  }
  return map;
}

/** Cek apakah dokter berwenang lakukan tindakan tertentu */
export function hasKewenangan(map: KewenanganMap, dokterId: string, tindakanId: string): boolean {
  return (map[dokterId] ?? []).includes(tindakanId);
}

/** Total kewenangan per dokter */
export function countKewenangan(map: KewenanganMap, dokterId: string): number {
  return (map[dokterId] ?? []).length;
}

/** Berapa dokter yang berwenang per tindakan (untuk audit reverse) */
export function countDokterPerTindakan(map: KewenanganMap, tindakanId: string): number {
  return Object.values(map).filter((arr) => arr.includes(tindakanId)).length;
}

/** Total cell granted di seluruh matrix */
export function countAllGranted(map: KewenanganMap): number {
  return Object.values(map).reduce((sum, arr) => sum + arr.length, 0);
}
