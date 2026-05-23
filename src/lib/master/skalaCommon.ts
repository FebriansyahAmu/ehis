/**
 * Shared types untuk master skala klinis (Risiko / Umum / Penyakit).
 *
 * Pattern: 3 master skala punya struktur data identik (items + opsi skor + interpretasi).
 * Dibedakan via `kategori` di mock file + branded accent di components folder.
 *
 * Konsumen:
 *   - `skalaRisikoMock.ts`   → Barthel/Morse/Braden/NRS/MUST
 *   - `skalaUmumMock.ts`     → GCS/Kesadaran/KU/NEWS2/MEWS
 *   - `skalaPenyakitMock.ts` → Killip/NYHA/TIMI/ECOG/TNM/Stadium
 */

// ── Common types ─────────────────────────────────────────

export type SkalaScoringMode = "sum_items" | "select_value";

/** higher_is_worse: total tinggi = risiko tinggi (Morse). lower_is_worse: total rendah = risiko tinggi (Braden inverse). */
export type SkalaArah = "higher_is_worse" | "lower_is_worse";

export type SkalaModulKonsumen = "IGD" | "RI" | "RJ" | "ICU";

export type SkalaTone =
  | "emerald" | "yellow" | "amber" | "orange" | "rose" | "red" | "sky";

export type SkalaStatus = "Aktif" | "Non_Aktif";

export interface SkalaOption {
  score: number;
  label: string;
  detail?: string;
}

export interface SkalaItem {
  id: string;
  label: string;
  /** Skor maksimal item (denormalisasi dari max(options.score)). */
  maxScore: number;
  options: SkalaOption[];
}

export interface SkalaInterpretasi {
  id: string;
  min: number;
  max: number;
  label: string;
  tone: SkalaTone;
  action: string;
}

/** Record dasar — tidak punya field `kategori` (diserahkan ke konsumen file). */
export interface SkalaRecord {
  id: string;
  kode: string;
  nama: string;
  singkat: string;
  deskripsi: string;
  scoringMode: SkalaScoringMode;
  arah: SkalaArah;
  items: SkalaItem[];
  totalMax: number;
  interpretasi: SkalaInterpretasi[];
  referensi: string;
  konsumenModul: SkalaModulKonsumen[];
  status: SkalaStatus;
}

// ── Common helpers ───────────────────────────────────────

export function emptySkalaRecord(idPrefix = "skl"): SkalaRecord {
  return {
    id: `${idPrefix}-${Date.now().toString(36)}`,
    kode: "",
    nama: "",
    singkat: "",
    deskripsi: "",
    scoringMode: "sum_items",
    arah: "higher_is_worse",
    items: [],
    totalMax: 0,
    interpretasi: [],
    referensi: "",
    konsumenModul: ["IGD", "RI"],
    status: "Aktif",
  };
}

/** Total maksimum derived dari items + mode. */
export function deriveTotalMax(
  items: SkalaItem[],
  mode: SkalaScoringMode,
): number {
  if (mode === "select_value") return items[0]?.maxScore ?? 0;
  return items.reduce((acc, it) => acc + (it.maxScore || 0), 0);
}

export function findInterpretasi(
  list: SkalaInterpretasi[],
  score: number,
): SkalaInterpretasi | null {
  return list.find((r) => score >= r.min && score <= r.max) ?? null;
}

export interface RangeIssue {
  type: "gap" | "overlap";
  from: number;
  to: number;
}

export function detectRangeIssues(
  list: SkalaInterpretasi[],
  totalMax: number,
): RangeIssue[] {
  if (list.length === 0) return [];
  const sorted = [...list].sort((a, b) => a.min - b.min);
  const issues: RangeIssue[] = [];

  if (sorted[0].min > 0) {
    issues.push({ type: "gap", from: 0, to: sorted[0].min - 1 });
  }
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (curr.min > prev.max + 1) {
      issues.push({ type: "gap", from: prev.max + 1, to: curr.min - 1 });
    } else if (curr.min <= prev.max) {
      issues.push({ type: "overlap", from: curr.min, to: Math.min(prev.max, curr.max) });
    }
  }
  const last = sorted[sorted.length - 1];
  if (last.max < totalMax) {
    issues.push({ type: "gap", from: last.max + 1, to: totalMax });
  }
  return issues;
}

// ── Constants ────────────────────────────────────────────

export const MODUL_LIST_ALL: SkalaModulKonsumen[] = ["IGD", "RI", "RJ", "ICU"];

export const TONE_OPTIONS: SkalaTone[] = [
  "emerald", "yellow", "amber", "orange", "rose", "red", "sky",
];
