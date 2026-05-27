/**
 * EK4 iDRG Calculator Standalone — shared types, form state, param config.
 *
 * Mode: iDRG (primary, post-Okt 2025) · INA-CBG Legacy · Compare Both (AD-19).
 * Referensi: TODO-EKLAIM.md § EK4 · groupingResolver.ts (resolveGrouping/resolveComparator).
 */

import type {
  CaraPulang,
  Gender,
  KelasRawat,
  KodeICD10IM,
  KodeICD9CMIM,
  TingkatKompetensiRS,
  TipePelayanan,
  iDRGResult,
  InaCbgLegacyResult,
} from "@/lib/eklaim/eklaimShared";
import type { DiagnosaSekunderEntry } from "../detail/tabs/coding/codingShared";

// ── Mode ──────────────────────────────────────────────

export type CalculatorMode = "idrg" | "ina-cbg" | "compare";

export interface ModeCfg {
  key: CalculatorMode;
  label: string;
  accent: "teal" | "amber" | "sky";
  desc: string;
  caveat?: string;
  era: "iDRG" | "INA_CBG_Legacy";
}

export const MODE_CFG: ReadonlyArray<ModeCfg> = [
  {
    key: "idrg",
    label: "iDRG",
    accent: "teal",
    desc: "Primary — Kemenkes post-Okt 2025 · INA-Grouper iDRG v1.0",
    era: "iDRG",
  },
  {
    key: "ina-cbg",
    label: "INA-CBG Legacy",
    accent: "amber",
    desc: "Legacy — klaim layanan pre-Okt 2025 · E-Klaim v5.9",
    era: "INA_CBG_Legacy",
  },
  {
    key: "compare",
    label: "Compare Both",
    accent: "sky",
    desc: "Dual engine paralel (AD-19) — iDRG vs INA-CBG perbandingan",
    caveat: "REFERENCE ONLY — INA-CBG di mode ini bukan untuk submission",
    era: "iDRG",
  },
];

// ── Form State ─────────────────────────────────────────

export interface CalculatorFormState {
  mode: CalculatorMode;
  diagnosaPrimer: KodeICD10IM | null;
  diagnosaSekunder: DiagnosaSekunderEntry[];
  tindakanProsedur: KodeICD9CMIM[];
  tingkatKompetensiRS: TingkatKompetensiRS;
  tipePelayanan: TipePelayanan;
  kelasLegacy: KelasRawat;
  los: number;
  age: number;
  gender: Gender;
  caraPulang: CaraPulang;
  tarifRSInput: string;
}

export const INITIAL_FORM: CalculatorFormState = {
  mode: "idrg",
  diagnosaPrimer: null,
  diagnosaSekunder: [],
  tindakanProsedur: [],
  tingkatKompetensiRS: "utama",
  tipePelayanan: "RI",
  kelasLegacy: "Kelas_2",
  los: 3,
  age: 45,
  gender: "L",
  caraPulang: "Sembuh",
  tarifRSInput: "",
};

// ── Result ─────────────────────────────────────────────

export type CalcStatus = "idle" | "loading" | "done" | "error";

export interface CalcResult {
  idrg?: iDRGResult;
  inaCbg?: InaCbgLegacyResult;
  inaCbgError?: string;
  errorMsg?: string;
  elapsedMs?: number;
  tarifRS?: bigint;
}

// ── Validation ─────────────────────────────────────────

export function canCalculate(form: CalculatorFormState): { ok: boolean; reason?: string } {
  if (!form.diagnosaPrimer) return { ok: false, reason: "Diagnosa primer wajib diisi" };
  if (form.los < 0 || form.los > 365)
    return { ok: false, reason: "LOS harus 0–365 hari" };
  if (form.age < 0 || form.age > 150)
    return { ok: false, reason: "Usia harus 0–150 tahun" };
  return { ok: true };
}

// ── Type Guard ─────────────────────────────────────────

/** Discriminate iDRGResult (severity object) vs InaCbgLegacyResult (severity number). */
export function isIDRGResult(
  r: iDRGResult | InaCbgLegacyResult,
): r is iDRGResult {
  return typeof (r as iDRGResult).severity === "object";
}

// ── Param Config ───────────────────────────────────────

export interface TingkatTile {
  value: TingkatKompetensiRS;
  label: string;
  desc: string;
  fromBg: string;
  toBg: string;
  textActive: string;
  ringActive: string;
}

export const TINGKAT_TILES: ReadonlyArray<TingkatTile> = [
  { value: "dasar",        label: "Dasar",       desc: "~Tipe D", fromBg: "from-emerald-50", toBg: "to-emerald-100/60", textActive: "text-emerald-800", ringActive: "ring-emerald-400" },
  { value: "menengah",     label: "Menengah",     desc: "~Tipe C", fromBg: "from-teal-50",    toBg: "to-teal-100/60",    textActive: "text-teal-800",    ringActive: "ring-teal-400"    },
  { value: "utama",        label: "Utama",        desc: "~Tipe B", fromBg: "from-sky-50",     toBg: "to-sky-100/60",     textActive: "text-sky-800",     ringActive: "ring-sky-400"     },
  { value: "komprehensif", label: "Komprehensif", desc: "~Tipe A", fromBg: "from-amber-50",   toBg: "to-amber-100/60",   textActive: "text-amber-800",   ringActive: "ring-amber-400"   },
];

export const TIPE_OPTIONS: ReadonlyArray<{ value: TipePelayanan; label: string }> = [
  { value: "RI",      label: "Rawat Inap" },
  { value: "RJ",      label: "Rawat Jalan" },
  { value: "SameDay", label: "Same-Day" },
];

export const CARA_PULANG_OPTIONS: ReadonlyArray<{ value: CaraPulang; label: string }> = [
  { value: "Sembuh",    label: "Sembuh / Pulang Baik" },
  { value: "PulangAPS", label: "Pulang APS" },
  { value: "Rujuk",     label: "Dirujuk" },
  { value: "Meninggal", label: "Meninggal" },
];

export const KELAS_LEGACY_OPTIONS: ReadonlyArray<{ value: KelasRawat; label: string }> = [
  { value: "VIP",     label: "VIP" },
  { value: "Kelas_1", label: "Kelas 1" },
  { value: "Kelas_2", label: "Kelas 2" },
  { value: "Kelas_3", label: "Kelas 3" },
];
