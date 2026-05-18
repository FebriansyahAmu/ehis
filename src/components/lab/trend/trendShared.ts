// Lab Module — Trend History & Delta Check Utilities
// Standard: ISO 15189:2022 §5.6.2 · Clinical Best Practice

import type { FlagHasil } from "../labShared";

export interface TrendDataPoint {
  tanggal: string;  // "YYYY-MM-DD"
  noOrder: string;
  nilai:   number;
  flag?:   FlagHasil;
}

export interface DeltaResult {
  absolute:       number;
  percent:        number;
  direction:      "up" | "down";
  triggered:      boolean;
  thresholdLabel: string;
}

export interface DeltaThreshold {
  absolute?: number;
  percent?:  number;
  unit:      string;
  label:     string;
}

export const DELTA_THRESHOLDS: Record<string, DeltaThreshold> = {
  "Hemoglobin":            { absolute: 2,    unit: "g/dL",    label: "Hb berubah > 2 g/dL"          },
  "Hematokrit":            { absolute: 6,    unit: "%",       label: "Ht berubah > 6%"               },
  "Leukosit":              { percent: 50,    unit: "×10³/µL", label: "Leukosit berubah > 50%"        },
  "Trombosit":             { percent: 30,    unit: "×10³/µL", label: "Trombosit berubah > 30%"       },
  "Natrium (Na)":          { absolute: 10,   unit: "mEq/L",   label: "Natrium berubah > 10 mEq/L"   },
  "Kalium (K)":            { absolute: 1.0,  unit: "mEq/L",   label: "Kalium berubah > 1 mEq/L"     },
  "Klorida (Cl)":          { absolute: 10,   unit: "mEq/L",   label: "Klorida berubah > 10 mEq/L"   },
  "Kreatinin":             { percent: 50,    unit: "mg/dL",   label: "Kreatinin naik > 50%"          },
  "Ureum":                 { percent: 50,    unit: "mg/dL",   label: "Ureum berubah > 50%"           },
  "Prokalsitonin (PCT)":   { percent: 100,   unit: "ng/mL",   label: "PCT naik > 100%"               },
  "Troponin I":            { percent: 20,    unit: "ng/mL",   label: "Troponin naik > 20%"           },
  "BNP":                   { percent: 30,    unit: "pg/mL",   label: "BNP berubah > 30%"             },
  "Bilirubin Total":       { percent: 30,    unit: "mg/dL",   label: "Bilirubin berubah > 30%"       },
  "AST (SGOT)":            { percent: 30,    unit: "U/L",     label: "AST berubah > 30%"             },
  "ALT (SGPT)":            { percent: 30,    unit: "U/L",     label: "ALT berubah > 30%"             },
};

// Mock historical data keyed by `${noRM}::${paramNama}`
const TREND_HISTORY: Record<string, TrendDataPoint[]> = {
  // RM-2025-005 — Joko Prasetyo (IGD, Suspek STEMI)
  "RM-2025-005::Troponin I": [
    { tanggal: "2026-04-15", noOrder: "LAB/2026/04/0341", nilai: 0.02, flag: "N" },
    { tanggal: "2026-05-01", noOrder: "LAB/2026/05/0067", nilai: 0.08, flag: "N" },
    { tanggal: "2026-05-18", noOrder: "LAB/2026/05/1142", nilai: 2.4,  flag: "C" },
  ],
  "RM-2025-005::Hemoglobin": [
    { tanggal: "2026-04-15", noOrder: "LAB/2026/04/0341", nilai: 13.5, flag: "N" },
    { tanggal: "2026-05-01", noOrder: "LAB/2026/05/0067", nilai: 13.2, flag: "N" },
    { tanggal: "2026-05-18", noOrder: "LAB/2026/05/1142", nilai: 12.8, flag: "L" },
  ],
  "RM-2025-005::Leukosit": [
    { tanggal: "2026-04-15", noOrder: "LAB/2026/04/0341", nilai: 8.4,  flag: "N" },
    { tanggal: "2026-05-01", noOrder: "LAB/2026/05/0067", nilai: 9.8,  flag: "N" },
    { tanggal: "2026-05-18", noOrder: "LAB/2026/05/1142", nilai: 14.5, flag: "H" },
  ],

  // RM-2025-003 — Sri Wahyuni (RI, GJK NYHA III)
  "RM-2025-003::Hemoglobin": [
    { tanggal: "2026-04-20", noOrder: "LAB/2026/04/0455", nilai: 12.5, flag: "N" },
    { tanggal: "2026-05-05", noOrder: "LAB/2026/05/0411", nilai: 11.9, flag: "L" },
    { tanggal: "2026-05-17", noOrder: "LAB/2026/05/0857", nilai: 11.4, flag: "L" },
  ],
  "RM-2025-003::Kalium (K)": [
    { tanggal: "2026-04-20", noOrder: "LAB/2026/04/0455", nilai: 4.2, flag: "N" },
    { tanggal: "2026-05-05", noOrder: "LAB/2026/05/0411", nilai: 3.6, flag: "N" },
    { tanggal: "2026-05-17", noOrder: "LAB/2026/05/0857", nilai: 3.1, flag: "L" },
  ],
  "RM-2025-003::BNP": [
    { tanggal: "2026-04-20", noOrder: "LAB/2026/04/0455", nilai: 680,  flag: "H" },
    { tanggal: "2026-05-05", noOrder: "LAB/2026/05/0411", nilai: 920,  flag: "H" },
    { tanggal: "2026-05-17", noOrder: "LAB/2026/05/0857", nilai: 1240, flag: "H" },
  ],
  "RM-2025-003::Kreatinin": [
    { tanggal: "2026-04-20", noOrder: "LAB/2026/04/0455", nilai: 0.9, flag: "N" },
    { tanggal: "2026-05-05", noOrder: "LAB/2026/05/0411", nilai: 1.1, flag: "N" },
    { tanggal: "2026-05-17", noOrder: "LAB/2026/05/0857", nilai: 1.4, flag: "H" },
  ],

  // RM-2025-007 — Hasan Basri (ICU, Syok Sepsis)
  "RM-2025-007::Prokalsitonin (PCT)": [
    { tanggal: "2026-05-14", noOrder: "LAB/2026/05/0783", nilai: 2.1,  flag: "H" },
    { tanggal: "2026-05-16", noOrder: "LAB/2026/05/0831", nilai: 6.8,  flag: "C" },
    { tanggal: "2026-05-18", noOrder: "LAB/2026/05/0878", nilai: 12.4, flag: "C" },
  ],
  "RM-2025-007::Leukosit": [
    { tanggal: "2026-05-14", noOrder: "LAB/2026/05/0783", nilai: 14.2, flag: "H" },
    { tanggal: "2026-05-16", noOrder: "LAB/2026/05/0831", nilai: 18.9, flag: "H" },
    { tanggal: "2026-05-18", noOrder: "LAB/2026/05/0878", nilai: 22.1, flag: "H" },
  ],
  "RM-2025-007::Hemoglobin": [
    { tanggal: "2026-05-14", noOrder: "LAB/2026/05/0783", nilai: 10.8, flag: "L" },
    { tanggal: "2026-05-16", noOrder: "LAB/2026/05/0831", nilai: 9.5,  flag: "L" },
    { tanggal: "2026-05-18", noOrder: "LAB/2026/05/0878", nilai: 8.2,  flag: "L" },
  ],
  "RM-2025-007::Trombosit": [
    { tanggal: "2026-05-14", noOrder: "LAB/2026/05/0783", nilai: 185, flag: "N" },
    { tanggal: "2026-05-16", noOrder: "LAB/2026/05/0831", nilai: 124, flag: "L" },
    { tanggal: "2026-05-18", noOrder: "LAB/2026/05/0878", nilai: 89,  flag: "L" },
  ],
  "RM-2025-007::Kreatinin": [
    { tanggal: "2026-05-14", noOrder: "LAB/2026/05/0783", nilai: 1.8, flag: "H" },
    { tanggal: "2026-05-16", noOrder: "LAB/2026/05/0831", nilai: 2.6, flag: "H" },
    { tanggal: "2026-05-18", noOrder: "LAB/2026/05/0878", nilai: 3.4, flag: "H" },
  ],
};

export function getTrendHistory(noRM: string, paramNama: string): TrendDataPoint[] {
  return TREND_HISTORY[`${noRM}::${paramNama}`] ?? [];
}

export function getPreviousResult(noRM: string, paramNama: string): TrendDataPoint | null {
  const history = getTrendHistory(noRM, paramNama);
  if (history.length < 2) return null;
  return history[history.length - 2];
}

export function calcDelta(
  current: number,
  previous: number,
  paramNama: string,
): DeltaResult | null {
  const threshold = DELTA_THRESHOLDS[paramNama];
  if (!threshold) return null;

  const absolute  = Math.abs(current - previous);
  const percent   = previous !== 0 ? (absolute / Math.abs(previous)) * 100 : 0;
  const direction = current >= previous ? "up" : "down";

  let triggered = false;
  if (threshold.absolute !== undefined && absolute >= threshold.absolute) triggered = true;
  if (threshold.percent  !== undefined && percent  >= threshold.percent)  triggered = true;

  return {
    absolute:       Math.round(absolute * 100) / 100,
    percent:        Math.round(percent * 10)   / 10,
    direction:      direction as "up" | "down",
    triggered,
    thresholdLabel: threshold.label,
  };
}

export function getParamsWithHistory(noRM: string): string[] {
  return Object.keys(TREND_HISTORY)
    .filter((k) => k.startsWith(`${noRM}::`))
    .map((k) => k.split("::")[1]);
}
