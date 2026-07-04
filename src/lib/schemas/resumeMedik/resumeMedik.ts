// Zod schema + DTO — Resume Medik Rawat Inap (tab Pasien Pulang RI, sub Resume Medik).
// Append-only "latest wins" per kunjungan. `dataKlinis` = snapshot agregat medikolegal
// (TTV masuk/pulang · lab abnormal · rad · obat · tindakan) — dibekukan FE saat simpan,
// sumber live tetap domain masing-masing (Observation/LabResult/RadResult/Resep/Tindakan).
// TTE sign-off DPJP = aksi terpisah (stamp sekali per revisi; Dokter-only di Service).

import { z } from "zod";

export const IdParam = z.object({ id: z.string().uuid() });

// ── Snapshot agregat (bentuk = view-model FE ResumeMedikData) ───────────────────

const TtvSnap = z.object({
  tanggal: z.string().trim().max(40).default(""),
  tekananDarah: z.string().trim().max(20).default(""),
  nadi: z.number().finite().default(0),
  rr: z.number().finite().default(0),
  suhu: z.number().finite().default(0),
  spo2: z.number().finite().default(0),
  gcs: z.number().finite().default(0),
  kesadaran: z.string().trim().max(40).default(""),
});

const LabSnap = z.object({
  nama: z.string().trim().max(160),
  nilai: z.string().trim().max(40).default(""),
  satuan: z.string().trim().max(40).default(""),
  rujukan: z.string().trim().max(80).default(""),
  flag: z.enum(["normal", "tinggi", "rendah", "kritis"]),
  tanggal: z.string().trim().max(40).default(""),
});

const RadSnap = z.object({
  jenis: z.string().trim().max(200),
  tanggal: z.string().trim().max(40).default(""),
  kesimpulan: z.string().trim().max(2000).default(""),
});

const ObatSnap = z.object({
  namaObat: z.string().trim().max(200),
  dosis: z.string().trim().max(120).default(""),
  rute: z.string().trim().max(40).default(""),
  mulaiTanggal: z.string().trim().max(40).default(""),
  akhirTanggal: z.string().trim().max(40).default(""),
  isHAM: z.boolean().default(false),
});

const TindakanSnap = z.object({
  kodeIcd9: z.string().trim().max(20).default(""),
  namaTindakan: z.string().trim().max(240),
  tanggal: z.string().trim().max(40).default(""),
});

export const DataKlinisSchema = z.object({
  ttvMasuk: TtvSnap.nullable().default(null),
  ttvPulang: TtvSnap.nullable().default(null),
  hasilLabAbnormal: z.array(LabSnap).max(200).default([]),
  hasilRad: z.array(RadSnap).max(50).default([]),
  obatSelamaRawat: z.array(ObatSnap).max(200).default([]),
  tindakan: z.array(TindakanSnap).max(100).default([]),
});
export type DataKlinisSnapshot = z.infer<typeof DataKlinisSchema>;

// ── Simpan (POST /kunjungan/:id/resume-medik) ───────────────────────────────────

export const ResumeMedikInput = z.object({
  asalMasuk: z.string().trim().max(40).default(""), // IGD | Poliklinik | Transfer RS Lain | Langsung
  tanggalMasukIgd: z.string().trim().max(60).default(""),
  diagnosisIgd: z.string().trim().max(240).default(""),
  kondisiMasuk: z.string().trim().max(4000).default(""),
  kondisiPulang: z.string().trim().max(4000).default(""),
  ringkasanKlinis: z.string().trim().max(8000).default(""),
  dataKlinis: DataKlinisSchema.nullable().default(null),
});
export type ResumeMedikInput = z.infer<typeof ResumeMedikInput>;

// ── DTO deteksi asal masuk (GET /kunjungan/:id/asal-masuk) ──────────────────────
// Diturunkan SERVER dari rantai admisi: SPRI ter-konsumsi (riKunjunganId = kunjungan
// RI ini) → kunjungan asal SPRI → unit (IGD/RawatJalan) + waktu masuk + dx utama.
// terdeteksi=false (admisi tanpa SPRI / Transfer RS Lain) → FE fallback isian manual.

export interface AsalMasukDTO {
  terdeteksi: boolean;
  asalMasuk: "IGD" | "Poliklinik" | "";
  tanggalMasuk: string | null; // ISO — createdAt kunjungan asal
  diagnosisAsal: string;       // "Nama (ICD)" dx utama kunjungan asal, "" bila belum ada
  noKunjunganAsal: string;
}

// ── DTO ─────────────────────────────────────────────────────────────────────────

export interface ResumeMedikDTO {
  id: string;
  asalMasuk: string;
  tanggalMasukIgd: string;
  diagnosisIgd: string;
  kondisiMasuk: string;
  kondisiPulang: string;
  ringkasanKlinis: string;
  dataKlinis: DataKlinisSnapshot | null;
  pencatat: string;
  /** TTE DPJP — null = revisi ini belum ditandatangani. */
  tteToken: string | null;
  tteSignedBy: string | null;
  tteSignedAt: string | null; // ISO
  updatedAt: string;          // ISO (createdAt revisi terkini)
}
