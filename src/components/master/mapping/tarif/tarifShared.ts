import { TINDAKAN_MOCK, type TindakanRecord } from "@/lib/master/tindakanMock";
import {
  PENJAMIN_MOCK, KELAS_LIST,
  type PenjaminRecord, type KelasRawat,
} from "@/lib/master/penjaminMock";

// ── Types ─────────────────────────────────────────────────

/**
 * 3D matrix di-collapse jadi 2 level key:
 * map[penjaminId][tindakanId][kelasId] → harga IDR
 */
export type TarifMap = Record<string, Record<string, Partial<Record<KelasRawat, number>>>>;

// ── Helpers ───────────────────────────────────────────────

export function getTindakanList(): TindakanRecord[] {
  return TINDAKAN_MOCK;
}

export function getPenjaminList(): PenjaminRecord[] {
  return PENJAMIN_MOCK;
}

/**
 * Default tarif: dihitung dari multiplier kompleksitas × kelas × penjamin.
 * Realnya nanti di-input manual oleh admin billing.
 */
const KOMPLEKSITAS_BASE: Record<TindakanRecord["kompleksitas"], number> = {
  Sederhana: 80_000,
  Sedang:    250_000,
  Khusus:    750_000,
  Canggih:   3_500_000,
};

const KELAS_MULTIPLIER: Record<KelasRawat, number> = {
  VIP:         2.2,
  Kelas_1:     1.5,
  Kelas_2:     1.2,
  Kelas_3:     1.0,
  ICU:         2.5,
  HCU:         2.0,
  Rawat_Jalan: 0.9,
};

const PENJAMIN_MULTIPLIER: Record<string, number> = {
  "pj-001": 1.0,   // Umum
  "pj-002": 0.78,  // BPJS INA-CBG (di-cap)
  "pj-003": 1.15,  // Inhealth
  "pj-004": 1.10,  // AXA
  "pj-005": 1.20,  // Allianz
  "pj-006": 0.85,  // Jamkesda
};

function roundIDR(n: number): number {
  return Math.round(n / 500) * 500;
}

export function initTarifMap(
  tindakan: TindakanRecord[],
  penjamin: PenjaminRecord[],
): TarifMap {
  const map: TarifMap = {};
  for (const p of penjamin) {
    map[p.id] = {};
    const pMul = PENJAMIN_MULTIPLIER[p.id] ?? 1.0;
    for (const t of tindakan) {
      const base = KOMPLEKSITAS_BASE[t.kompleksitas];
      map[p.id][t.id] = {};
      for (const k of KELAS_LIST) {
        const kMul = KELAS_MULTIPLIER[k.id];
        map[p.id][t.id][k.id] = roundIDR(base * kMul * pMul);
      }
    }
  }
  return map;
}

export function getTarif(
  map: TarifMap,
  penjaminId: string,
  tindakanId: string,
  kelasId: KelasRawat,
): number {
  return map[penjaminId]?.[tindakanId]?.[kelasId] ?? 0;
}

export function setTarif(
  map: TarifMap,
  penjaminId: string,
  tindakanId: string,
  kelasId: KelasRawat,
  value: number,
): TarifMap {
  const next: TarifMap = { ...map };
  next[penjaminId] = { ...(next[penjaminId] ?? {}) };
  next[penjaminId][tindakanId] = { ...(next[penjaminId][tindakanId] ?? {}) };
  next[penjaminId][tindakanId][kelasId] = Math.max(0, value);
  return next;
}

/** Adjust semua tarif visible (terfilter) di penjamin tertentu × persen */
export function bulkAdjustTarif(
  map: TarifMap,
  penjaminId: string,
  tindakanIds: string[],
  percent: number,
): TarifMap {
  const factor = 1 + percent / 100;
  const next: TarifMap = { ...map };
  next[penjaminId] = { ...(next[penjaminId] ?? {}) };
  for (const tId of tindakanIds) {
    const row = next[penjaminId][tId] ?? {};
    const updated: Partial<Record<KelasRawat, number>> = {};
    for (const k of KELAS_LIST) {
      const v = row[k.id] ?? 0;
      updated[k.id] = roundIDR(v * factor);
    }
    next[penjaminId][tId] = updated;
  }
  return next;
}

/** Reset 1 penjamin ke default initial */
export function resetTarifPenjamin(
  map: TarifMap,
  penjaminId: string,
  tindakan: TindakanRecord[],
  penjamin: PenjaminRecord[],
): TarifMap {
  const fresh = initTarifMap(tindakan, penjamin);
  return { ...map, [penjaminId]: fresh[penjaminId] };
}

/** Stats: total cell tarif, rata-rata, min, max per penjamin */
export function calcStats(map: TarifMap, penjaminId: string, tindakanIds: string[]) {
  const values: number[] = [];
  const tarifPenjamin = map[penjaminId] ?? {};
  for (const tId of tindakanIds) {
    const row = tarifPenjamin[tId] ?? {};
    for (const v of Object.values(row)) {
      if (v && v > 0) values.push(v);
    }
  }
  if (values.length === 0) return { count: 0, avg: 0, min: 0, max: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    avg: Math.round(sum / values.length),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}
