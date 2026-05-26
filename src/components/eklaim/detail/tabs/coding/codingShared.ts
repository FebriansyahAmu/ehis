/**
 * Coding Tab — shared types, validation, search helpers (EK3.3).
 * ICS v1 rules: Pedoman Pengodean iDRG 2025 Kemenkes.
 */

import type { KodeICD10IM, KodeICD9CMIM } from "@/lib/eklaim/eklaimShared";
import { ICD10_IM_MOCK, ICD9_CM_IM_MOCK } from "@/lib/eklaim/icdIMMock";

// ── Mutable coding state ───────────────────────────────

export interface DiagnosaSekunderEntry {
  icd: KodeICD10IM;
  /** Flag CC/MCC PPI per PMK 27/2017 — diagnosa acquired in hospital. */
  hospitalAcquired: boolean;
}

export interface CodingState {
  diagnosaPrimer: KodeICD10IM | null;
  diagnosaSekunder: ReadonlyArray<DiagnosaSekunderEntry>;
  tindakanProsedur: ReadonlyArray<KodeICD9CMIM>;
  isSigned: boolean;
  signedAt?: string;
  signedBy?: string;
}

// ── ICS v1 Validation ──────────────────────────────────

export interface ICSValidation {
  valid: boolean;
  errors: ReadonlyArray<string>;
  warnings: ReadonlyArray<string>;
  /** True jika diagnosa primer ada — cukup untuk Re-Group. */
  canReGroup: boolean;
}

export function validateICS(state: CodingState): ICSValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!state.diagnosaPrimer) {
    errors.push("Diagnosa primer wajib diisi (ICS v1 — Pedoman Pengodean iDRG 2025)");
  }

  if (state.diagnosaSekunder.length > 10) {
    errors.push(
      `Diagnosa sekunder maksimal 10 entri (saat ini: ${state.diagnosaSekunder.length})`,
    );
  }

  if (state.diagnosaSekunder.length === 0 && state.diagnosaPrimer) {
    warnings.push(
      "Belum ada diagnosa sekunder — CC/MCC meningkatkan akurasi severity iDRG",
    );
  }

  if (state.tindakanProsedur.length === 0) {
    warnings.push(
      "Belum ada tindakan/prosedur — beberapa grup iDRG membutuhkan kode prosedur",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    canReGroup: !!state.diagnosaPrimer,
  };
}

// ── Search ─────────────────────────────────────────────

const MAX_RESULTS = 30;

export function searchICD10IM(query: string): ReadonlyArray<KodeICD10IM> {
  const q = query.trim().toLowerCase();
  if (!q) return ICD10_IM_MOCK.slice(0, MAX_RESULTS);
  return ICD10_IM_MOCK.filter(
    (e) =>
      e.kode.toLowerCase().includes(q) ||
      e.deskripsi.toLowerCase().includes(q) ||
      e.kategori.toLowerCase().includes(q) ||
      (e.hint?.toLowerCase().includes(q) ?? false),
  ).slice(0, MAX_RESULTS);
}

export function searchICD9CMIM(query: string): ReadonlyArray<KodeICD9CMIM> {
  const q = query.trim().toLowerCase();
  if (!q) return ICD9_CM_IM_MOCK.slice(0, MAX_RESULTS);
  return ICD9_CM_IM_MOCK.filter(
    (e) =>
      e.kode.toLowerCase().includes(q) ||
      e.deskripsi.toLowerCase().includes(q) ||
      e.kategori.toLowerCase().includes(q) ||
      (e.hint?.toLowerCase().includes(q) ?? false),
  ).slice(0, MAX_RESULTS);
}

/** Group ICD entries by kategori for grouped display in picker. */
export function groupByKategori<T extends { kategori: string }>(
  entries: ReadonlyArray<T>,
): ReadonlyArray<{ kategori: string; items: ReadonlyArray<T> }> {
  const map = new Map<string, T[]>();
  entries.forEach((e) => {
    const arr = map.get(e.kategori) ?? [];
    arr.push(e);
    map.set(e.kategori, arr);
  });
  return Array.from(map.entries()).map(([kategori, items]) => ({
    kategori,
    items,
  }));
}
