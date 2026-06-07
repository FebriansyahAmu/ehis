// Zod schema + DTO Triase (pengkajian gawat darurat IGD). Vocab kanonik mirror
// TriaseEntryForm (TriasePrimaryForm.tsx) & enum Prisma medicalrecord.TriaseLevel.
// Field wajib = yang ber-asterisk di form; sisanya opsional. Multi-select = array.

import { z } from "zod";

export const TriaseLevel = z.enum(["P1", "P2", "P3", "P4"]);
export type TriaseLevel = z.infer<typeof TriaseLevel>;

// Helper: string opsional (kosong/whitespace → undefined, biar tak simpan "").
const optStr = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const reqStr = (label: string) => z.string().trim().min(1, `${label} wajib diisi`);

const strArr = z.array(z.string().trim().min(1)).default([]);

// uuid opsional yang menelan "" (form kirim string kosong saat tak ada protokol).
const optUuid = z.preprocess(
  (v) => (typeof v === "string" && v.trim() ? v.trim() : undefined),
  z.string().uuid().optional(),
);

// ── Kriteria triase terpilih (centang panduan) ─────────────────────────────────
// Identitas natural = (parameterKode, levelKode, nilai) — snapshot sekaligus jejak.
export const TriaseCriteriaInput = z.object({
  parameterKode: reqStr("Kode parameter"),
  parameterLabel: reqStr("Label parameter"),
  levelKode: reqStr("Kode level"),
  levelLabel: reqStr("Label level"),
  nilai: reqStr("Nilai kriteria"),
  sourceCriteriaId: optUuid,
});
export type TriaseCriteriaInput = z.infer<typeof TriaseCriteriaInput>;

// ── Input (POST /kunjungan/:id/triase) ─────────────────────────────────────────
export const TriaseInput = z.object({
  // Kedatangan
  caraMasuk: reqStr("Cara masuk"),
  kondisiTiba: reqStr("Kondisi saat tiba"),
  // Anamnesis
  keluhanUtama: reqStr("Keluhan utama"),
  onset: reqStr("Onset"),
  lokasiKeluhan: optStr,
  kualitasKeluhan: optStr,
  skalaBerat: optStr,
  faktorPemberat: optStr,
  faktorPeringan: optStr,
  gejalaPenyerta: strArr,
  riwayatSerupa: optStr,
  // Primary survey ABCDE
  airwayStatus: reqStr("Status airway"),
  suaraNapasAbnormal: strArr,
  breathingQuality: reqStr("Kualitas napas"),
  pergerakanDada: optStr,
  ototBantu: optStr,
  sianosis: optStr,
  nadiTeraba: reqStr("Nadi"),
  kualitasNadi: optStr,
  crt: optStr,
  kondisiKulit: optStr,
  perdarahan: optStr,
  avpu: reqStr("Tingkat kesadaran (AVPU)"),
  pupil: optStr,
  refleksCahaya: optStr,
  traumaLuka: optStr,
  lokasiLuka: optStr,
  suhuKulit: optStr,
  // Diagnosa & tindakan awal
  diagnosisSementara: optStr,
  tindakanTriase: strArr,
  // Keputusan + PJ
  triageLevel: TriaseLevel,
  perawatTriase: reqStr("Nama perawat triase"),
  /** ISO atau "YYYY-MM-DDTHH:mm" (datetime-local). Kosong → Service pakai now(). */
  waktuTriase: optStr,
  // Protokol panduan + kriteria yang dicentang (decision-support → record).
  protocolId: optUuid,
  protocolKode: optStr,
  protocolNama: optStr,
  selectedCriteria: z.array(TriaseCriteriaInput).default([]),
});
export type TriaseInput = z.infer<typeof TriaseInput>;

// ── DTO (GET) ───────────────────────────────────────────────────────────────---
export interface TriaseCriteriaDTO {
  id: string;
  parameterKode: string;
  parameterLabel: string;
  levelKode: string;
  levelLabel: string;
  nilai: string;
  sourceCriteriaId: string | null;
  urutan: number;
}

export interface TriaseDTO {
  id: string;
  kunjunganId: string;
  caraMasuk: string;
  kondisiTiba: string;
  keluhanUtama: string;
  onset: string;
  lokasiKeluhan: string | null;
  kualitasKeluhan: string | null;
  skalaBerat: string | null;
  faktorPemberat: string | null;
  faktorPeringan: string | null;
  gejalaPenyerta: string[];
  riwayatSerupa: string | null;
  airwayStatus: string;
  suaraNapasAbnormal: string[];
  breathingQuality: string;
  pergerakanDada: string | null;
  ototBantu: string | null;
  sianosis: string | null;
  nadiTeraba: string;
  kualitasNadi: string | null;
  crt: string | null;
  kondisiKulit: string | null;
  perdarahan: string | null;
  avpu: string;
  pupil: string | null;
  refleksCahaya: string | null;
  traumaLuka: string | null;
  lokasiLuka: string | null;
  suhuKulit: string | null;
  diagnosisSementara: string | null;
  tindakanTriase: string[];
  triageLevel: TriaseLevel;
  perawatTriase: string;
  waktuTriase: string; // ISO
  protocolId: string | null;
  protocolKode: string | null;
  protocolNama: string | null;
  selectedCriteria: TriaseCriteriaDTO[];
  authorUserId: string | null;
  createdAt: string; // ISO
}

/** P1..P4 → 1..4 (sinkron encounter.Kunjungan.triaseLevel). */
export function triaseLevelToInt(level: TriaseLevel): number {
  return Number(level.slice(1));
}
