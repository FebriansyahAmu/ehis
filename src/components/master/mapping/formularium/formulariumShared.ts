import { OBAT_MOCK, type ObatRecord } from "@/lib/master/obatMock";
import {
  PENJAMIN_MOCK, KELAS_LIST,
  type PenjaminRecord, type KelasRawat,
} from "@/lib/master/penjaminMock";

// ── Types ─────────────────────────────────────────────────

export interface FormulariumCell {
  allowed: boolean;
  /** Alasan substitusi jika tidak allowed (mis. "Hanya generik yang dijamin") */
  alasan?: string;
}

/**
 * map[penjaminId][obatId][kelasId] → FormulariumCell
 */
export type FormulariumMap = Record<string, Record<string, Partial<Record<KelasRawat, FormulariumCell>>>>;

// ── Helpers ───────────────────────────────────────────────

export function getObatList(): ObatRecord[] {
  return OBAT_MOCK;
}

export function getPenjaminListF(): PenjaminRecord[] {
  return PENJAMIN_MOCK;
}

/**
 * Default rules:
 * - Umum: semua obat boleh di semua kelas
 * - BPJS: hanya formularium nasional, kelas VIP non-coverage
 * - Asuransi Swasta: default allow kecuali HAM advanced di Kelas 3
 * - Jamkesda: formularium only + kelas 3-2
 */
export function initFormulariumMap(
  obat: ObatRecord[],
  penjamin: PenjaminRecord[],
): FormulariumMap {
  const map: FormulariumMap = {};
  for (const p of penjamin) {
    map[p.id] = {};
    for (const o of obat) {
      map[p.id][o.id] = {};
      for (const k of KELAS_LIST) {
        let allowed = true;
        let alasan: string | undefined;
        switch (p.tipe) {
          case "Umum":
            allowed = true;
            break;
          case "BPJS":
            allowed = o.isFormularium && k.id !== "VIP";
            if (!allowed) alasan = k.id === "VIP" ? "BPJS tidak coverage VIP" : "Non-formularium nasional";
            break;
          case "Asuransi_Swasta":
            allowed = true;
            if (o.isHAM && k.id === "Kelas_3") {
              allowed = false;
              alasan = "HAM coverage hanya Kelas 1-2+VIP";
            }
            break;
          case "Jamkesda":
            allowed = o.isFormularium && (k.id === "Kelas_2" || k.id === "Kelas_3" || k.id === "Rawat_Jalan");
            if (!allowed) {
              alasan = !o.isFormularium ? "Non-formularium nasional" : "Jamkesda hanya Kelas 2-3 / RJ";
            }
            break;
        }
        map[p.id][o.id][k.id] = { allowed, alasan };
      }
    }
  }
  return map;
}

export function getCell(
  map: FormulariumMap,
  penjaminId: string,
  obatId: string,
  kelasId: KelasRawat,
): FormulariumCell {
  return map[penjaminId]?.[obatId]?.[kelasId] ?? { allowed: false };
}

export function toggleCell(
  map: FormulariumMap,
  penjaminId: string,
  obatId: string,
  kelasId: KelasRawat,
  alasan?: string,
): FormulariumMap {
  const next: FormulariumMap = { ...map };
  next[penjaminId] = { ...(next[penjaminId] ?? {}) };
  next[penjaminId][obatId] = { ...(next[penjaminId][obatId] ?? {}) };
  const current = next[penjaminId][obatId][kelasId] ?? { allowed: false };
  const flipped = !current.allowed;
  next[penjaminId][obatId][kelasId] = {
    allowed: flipped,
    alasan: flipped ? undefined : (alasan ?? current.alasan ?? "Tidak dijamin"),
  };
  return next;
}

export function setCellReason(
  map: FormulariumMap,
  penjaminId: string,
  obatId: string,
  kelasId: KelasRawat,
  alasan: string,
): FormulariumMap {
  const next: FormulariumMap = { ...map };
  next[penjaminId] = { ...(next[penjaminId] ?? {}) };
  next[penjaminId][obatId] = { ...(next[penjaminId][obatId] ?? {}) };
  const current = next[penjaminId][obatId][kelasId] ?? { allowed: false };
  next[penjaminId][obatId][kelasId] = { ...current, alasan };
  return next;
}

export function bulkSetRow(
  map: FormulariumMap,
  penjaminId: string,
  obatId: string,
  allowed: boolean,
): FormulariumMap {
  const next: FormulariumMap = { ...map };
  next[penjaminId] = { ...(next[penjaminId] ?? {}) };
  const row: Partial<Record<KelasRawat, FormulariumCell>> = {};
  for (const k of KELAS_LIST) {
    row[k.id] = allowed ? { allowed: true } : { allowed: false, alasan: "Bulk: tidak dijamin" };
  }
  next[penjaminId][obatId] = row;
  return next;
}

export function bulkSetColumn(
  map: FormulariumMap,
  penjaminId: string,
  obatIds: string[],
  kelasId: KelasRawat,
  allowed: boolean,
): FormulariumMap {
  const next: FormulariumMap = { ...map };
  next[penjaminId] = { ...(next[penjaminId] ?? {}) };
  for (const oId of obatIds) {
    next[penjaminId][oId] = { ...(next[penjaminId][oId] ?? {}) };
    next[penjaminId][oId][kelasId] = allowed
      ? { allowed: true }
      : { allowed: false, alasan: "Bulk kolom: tidak dijamin" };
  }
  return next;
}

export function calcCoverage(
  map: FormulariumMap,
  penjaminId: string,
  obatIds: string[],
): { granted: number; total: number; pct: number } {
  const total = obatIds.length * KELAS_LIST.length;
  let granted = 0;
  for (const oId of obatIds) {
    const row = map[penjaminId]?.[oId] ?? {};
    for (const k of KELAS_LIST) {
      if (row[k.id]?.allowed) granted++;
    }
  }
  return { granted, total, pct: total ? Math.round((granted / total) * 100) : 0 };
}
