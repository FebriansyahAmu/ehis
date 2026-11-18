/**
 * Helper murni L13 (diagnosaToCondition) — dipakai Encounter final (L01) dan alasan order/resep/tindakan.
 * Input = baris `medicalrecord.Diagnosa` dari snapshot (urut createdAt asc, termasuk soft-deleted).
 */

import type { Issue } from "./types";

interface DiagnosaRow {
  tipe: string;
  status: string;
  deletedAt: Date | null;
}

/**
 * Diagnosa final kandidat `Encounter.diagnosis`: aktif · status Pasti · tipe Utama/Sekunder ·
 * Utama lebih dulu, lalu urut input (setara query lama `listDiagnosaFinal`).
 */
export function diagnosaFinalOf<T extends DiagnosaRow>(diagnosa: readonly T[]): T[] {
  return diagnosa
    .filter((d) => !d.deletedAt && d.status === "Pasti" && (d.tipe === "Utama" || d.tipe === "Sekunder"))
    .map((d, i) => ({ d, i }))
    .sort((a, b) => (a.d.tipe === b.d.tipe ? a.i - b.i : a.d.tipe === "Utama" ? -1 : 1))
    .map((x) => x.d);
}

/** Diagnosa Utama aktif ber-kode — dipakai sebagai alasan (reason) order/resep/tindakan. */
export function diagnosaUtamaOf<T extends DiagnosaRow & { kodeIcd10: string; namaDiagnosis: string }>(
  diagnosa: readonly T[],
): { kode: string; nama: string } | undefined {
  const u = diagnosa.find((d) => !d.deletedAt && d.tipe === "Utama" && d.kodeIcd10.trim());
  return u ? { kode: u.kodeIcd10.trim().toUpperCase(), nama: u.namaDiagnosis } : undefined;
}

// ── S6a perapian L13 ──────────────────────────────────────────────────────────


/** Kode ICD-10 ternormalisasi (trim + huruf besar) → display resmi master ICD (teks tampilan SatuSehat). */
export type IndeksIcd10 = Map<string, string>;

export const kodeIcd10Of = (kode: string) => kode.trim().toUpperCase();

export const indeksIcd10 = (rows: readonly { kode: string; display: string }[]): IndeksIcd10 =>
  new Map(rows.filter((r) => r.display.trim()).map((r) => [kodeIcd10Of(r.kode), r.display.trim()]));

/**
 * Gerbang Condition diagnosis (L13): kode wajib & harus ada di master ICD-10 — display dikirim dari master
 * (FG-39), bukan nama lokal (nama lokal → `code.text` bila berbeda). Kode di luar master = ditahan.
 */
export function diagnosaSiap(
  d: { id: string; kodeIcd10: string; namaDiagnosis: string },
  icd: IndeksIcd10,
): { ok: true; kode: string; display: string } | { ok: false; issue: Issue } {
  const kode = kodeIcd10Of(d.kodeIcd10);
  const base = { link: "L13" as const, resourceType: "Condition", localId: d.id };
  if (!kode) return { ok: false, issue: { ...base, code: "kode-kosong", message: `Diagnosa "${d.namaDiagnosis}" tanpa kode ICD-10 — ditahan` } };
  const display = icd.get(kode);
  if (!display) {
    return { ok: false, issue: { ...base, code: "kode-tidak-valid", message: `Kode ICD-10 "${kode}" (${d.namaDiagnosis}) tidak ada di master ICD-10 — ditahan` } };
  }
  return { ok: true, kode, display };
}

/** localId Condition diagnosa masuk (1 per kunjungan, `Encounter.diagnosis` use AD). */
export const diagnosaMasukLocalId = (kunjunganId: string) => `${kunjunganId}:diagnosa-masuk`;

export interface DiagnosaMasuk {
  localId: string;
  kode: string;
  display: string;
  waktu: Date;
}

/**
 * Diagnosa masuk (`kunjungan.kode_icd_masuk`, diisi dari diagnosa rujukan saat pendaftaran) → Condition
 * `encounter-diagnosis` + `Encounter.diagnosis` AD (contoh resmi IGD "Diagnosis Awal"). null = tidak ada.
 */
export function diagnosaMasukOf(
  kunjunganId: string,
  kodeIcdMasuk: string | null,
  icd: IndeksIcd10,
  waktu: Date,
): { ok: true; item: DiagnosaMasuk } | { ok: false; issue: Issue } | null {
  const kode = kodeIcd10Of(kodeIcdMasuk ?? "");
  if (!kode) return null;
  const localId = diagnosaMasukLocalId(kunjunganId);
  const display = icd.get(kode);
  if (!display) {
    return {
      ok: false,
      issue: { link: "L13", resourceType: "Condition", localId, code: "kode-tidak-valid", message: `Diagnosa masuk "${kode}" tidak ada di master ICD-10 — ditahan` },
    };
  }
  return { ok: true, item: { localId, kode, display, waktu } };
}
