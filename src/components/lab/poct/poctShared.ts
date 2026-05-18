// POCT (Point of Care Testing) — Types, Config, Store
// Standard: PMK 43/2013 · ISO 15189:2022

import { autoFlag, type FlagHasil } from "../labShared";

export type POCTTestType =
  | "GDS"
  | "GDP"
  | "GD2JPP"
  | "HbA1c"
  | "Blood Gas (AGD)"
  | "Troponin I Rapid"
  | "D-Dimer Rapid"
  | "CRP Rapid"
  | "Antigen COVID-19"
  | "Antigen Influenza A/B";

export type POCTDevice =
  | "GlucoMeter OneTouch Vita"
  | "GlucoMeter Accu-Check Active"
  | "Blood Gas Analyzer ABL90"
  | "i-STAT 1 Analyzer"
  | "DCA Vantage (HbA1c)"
  | "cobas h232 (Troponin)"
  | "Lateral Flow Reader";

export interface POCTTestConfig {
  nama:          string;
  satuan:        string;
  nilaiMin?:     number;
  nilaiMax?:     number;
  criticalLow?:  number;
  criticalHigh?: number;
  devices:       POCTDevice[];
  kategori:      "Metabolik" | "Respirasi" | "Kardiak" | "Koagulasi" | "Inflamasi" | "Skrining";
  isCito?:       boolean;
}

export const POCT_CATALOG: Record<POCTTestType, POCTTestConfig> = {
  "GDS": {
    nama: "Gula Darah Sewaktu", satuan: "mg/dL",
    nilaiMin: 70, nilaiMax: 200, criticalLow: 50, criticalHigh: 450,
    devices: ["GlucoMeter OneTouch Vita", "GlucoMeter Accu-Check Active"],
    kategori: "Metabolik",
  },
  "GDP": {
    nama: "Gula Darah Puasa", satuan: "mg/dL",
    nilaiMin: 70, nilaiMax: 100, criticalLow: 50, criticalHigh: 400,
    devices: ["GlucoMeter OneTouch Vita", "GlucoMeter Accu-Check Active"],
    kategori: "Metabolik",
  },
  "GD2JPP": {
    nama: "Gula Darah 2 Jam PP", satuan: "mg/dL",
    nilaiMin: 70, nilaiMax: 140, criticalLow: 50, criticalHigh: 500,
    devices: ["GlucoMeter OneTouch Vita", "GlucoMeter Accu-Check Active"],
    kategori: "Metabolik",
  },
  "HbA1c": {
    nama: "HbA1c", satuan: "%",
    nilaiMax: 6.5, criticalHigh: 15,
    devices: ["DCA Vantage (HbA1c)"],
    kategori: "Metabolik",
  },
  "Blood Gas (AGD)": {
    nama: "Analisa Gas Darah Bedside", satuan: "(lihat detail)",
    criticalLow: 7.2, criticalHigh: 7.6,
    devices: ["Blood Gas Analyzer ABL90", "i-STAT 1 Analyzer"],
    kategori: "Respirasi",
    isCito: true,
  },
  "Troponin I Rapid": {
    nama: "Troponin I Rapid", satuan: "ng/mL",
    nilaiMax: 0.04, criticalHigh: 1.0,
    devices: ["cobas h232 (Troponin)", "Lateral Flow Reader"],
    kategori: "Kardiak",
    isCito: true,
  },
  "D-Dimer Rapid": {
    nama: "D-Dimer Rapid", satuan: "mg/L FEU",
    nilaiMax: 0.5, criticalHigh: 5.0,
    devices: ["Lateral Flow Reader"],
    kategori: "Koagulasi",
  },
  "CRP Rapid": {
    nama: "CRP Rapid", satuan: "mg/L",
    nilaiMax: 10, criticalHigh: 100,
    devices: ["Lateral Flow Reader"],
    kategori: "Inflamasi",
  },
  "Antigen COVID-19": {
    nama: "Antigen SARS-CoV-2", satuan: "Kualitatif",
    devices: ["Lateral Flow Reader"],
    kategori: "Skrining",
  },
  "Antigen Influenza A/B": {
    nama: "Antigen Influenza A/B", satuan: "Kualitatif",
    devices: ["Lateral Flow Reader"],
    kategori: "Skrining",
  },
};

export const POCT_KATEGORI_BADGE: Record<POCTTestConfig["kategori"], string> = {
  Metabolik:  "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Respirasi:  "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  Kardiak:    "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  Koagulasi:  "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  Inflamasi:  "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  Skrining:   "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
};

export interface POCTEntry {
  id:         string;
  testType:   POCTTestType;
  device:     POCTDevice;
  nilai:      string;
  satuan:     string;
  flag?:      FlagHasil;
  waktu:      string;
  petugas:    string;
  lokasi:     string;
  catatan?:   string;
  confirmed?: boolean;
}

const _poctStore = new Map<string, POCTEntry[]>();

export function getPOCTEntries(orderId: string): POCTEntry[] {
  return _poctStore.get(orderId) ?? [];
}

export function addPOCTEntry(orderId: string, entry: Omit<POCTEntry, "id" | "flag">): POCTEntry {
  const cfg   = POCT_CATALOG[entry.testType];
  const v     = parseFloat(entry.nilai);
  const flag  = !isNaN(v) ? autoFlag(entry.nilai, cfg.nilaiMin, cfg.nilaiMax, cfg.criticalLow, cfg.criticalHigh) : undefined;
  const full: POCTEntry = { ...entry, id: `poct-${Date.now()}`, flag };
  const prev  = _poctStore.get(orderId) ?? [];
  _poctStore.set(orderId, [full, ...prev]);
  return full;
}
