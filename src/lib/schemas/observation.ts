// Zod schema + DTO Observation (TTV / tanda-tanda vital). Vocab kanonik mirror
// IGDVitalSigns + RITTVRecord (TTVTab.tsx). Time-series append-only: tiap POST =
// satu pengukuran baru. DTO mirror FE (nested `vitalSigns`) → zero-refactor saat wiring.

import { z } from "zod";

// Vocab terkontrol (divalidasi di sini; di DB disimpan sebagai TEXT — bukan enum Postgres).
export const StatusKesadaran = z.enum(["Compos_Mentis", "Apatis", "Somnolen", "Sopor", "Koma"]);
export type StatusKesadaran = z.infer<typeof StatusKesadaran>;

export const RIShift = z.enum(["Pagi", "Siang", "Malam"]);
export type RIShift = z.infer<typeof RIShift>;

// ── Helpers ────────────────────────────────────────────────────────────────---
// Angka dari string form ("123") atau number. Rentang fisiologis longgar (cegah sampah).
const intIn = (label: string, min: number, max: number) =>
  z.coerce
    .number()
    .int(`${label} harus bilangan bulat`)
    .min(min, `${label} minimal ${min}`)
    .max(max, `${label} maksimal ${max}`);

const numIn = (label: string, min: number, max: number) =>
  z.coerce
    .number()
    .min(min, `${label} minimal ${min}`)
    .max(max, `${label} maksimal ${max}`);

// Angka opsional: "" / null / undefined → undefined (form kirim "" saat kosong).
const optNumIn = (label: string, min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    numIn(label, min, max).optional(),
  );

// String opsional (kosong/whitespace → undefined).
const optStr = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

// ── Input (POST /kunjungan/:id/observasi) ──────────────────────────────────────
//  Field flat mengikuti form TTV; Service merakit jadi baris + nested DTO.
export const ObservationInput = z.object({
  // Tanda-tanda vital. Batas BAWAH fisiologis > 0 disengaja: field kosong (form kirim
  // "") di-coerce jadi 0 → GAGAL validasi (bukan diam-diam tersimpan 0 yang menyesatkan
  // NEWS2). Batas atas = nilai terukur ekstrem yang masih plausibel pada pasien hidup.
  tdSistolik: intIn("Tekanan darah sistolik", 40, 300),
  tdDiastolik: intIn("Tekanan darah diastolik", 20, 200),
  nadi: intIn("Nadi", 20, 300),
  respirasi: intIn("Respirasi", 4, 80),
  suhu: numIn("Suhu", 25, 44),
  spo2: intIn("SpO₂", 40, 100),
  gcsEye: intIn("GCS Eye", 1, 4),
  gcsVerbal: intIn("GCS Verbal", 1, 5),
  gcsMotor: intIn("GCS Motor", 1, 6),
  skalaNyeri: intIn("Skala nyeri", 0, 10), // 0 = tidak nyeri (valid, sengaja izinkan)
  beratBadan: optNumIn("Berat badan", 0.3, 500), // opsional: kosong → undefined (bukan 0)
  tinggiBadan: optNumIn("Tinggi badan", 20, 300),
  // Kesadaran + konteks
  statusKesadaran: StatusKesadaran,
  shift: RIShift.optional(),
  // Pencatat diturunkan SERVER dari user login (actor→pegawai). Field ini hanya fallback
  // opsional bila pegawai actor tak ditemukan (mis. dev actor). Lihat observationService.
  perawat: optStr,
  /** ISO atau "YYYY-MM-DDTHH:mm" (datetime-local). Kosong → Service pakai now(). */
  waktuObservasi: optStr,
});
export type ObservationInput = z.infer<typeof ObservationInput>;

// ── DTO (GET) ───────────────────────────────────────────────────────────────--
//  Mirror IGDVitalSigns + RITTVRecord persis (nested `vitalSigns`).
export interface ObservationVitalSigns {
  tdSistolik: number;
  tdDiastolik: number;
  nadi: number;
  respirasi: number;
  suhu: number;
  spo2: number;
  gcsEye: number;
  gcsVerbal: number;
  gcsMotor: number;
  skalaNyeri: number;
  beratBadan?: number;
  tinggiBadan?: number;
}

export interface ObservationDTO {
  id: string;
  kunjunganId: string;
  tanggal: string; // "YYYY-MM-DD" (diturunkan dari waktuObservasi)
  jam: string; // "HH:mm"
  shift: RIShift | null;
  perawat: string;
  vitalSigns: ObservationVitalSigns;
  statusKesadaran: StatusKesadaran;
  waktuObservasi: string; // ISO (kanonik)
  authorUserId: string | null;
  createdAt: string; // ISO
}
