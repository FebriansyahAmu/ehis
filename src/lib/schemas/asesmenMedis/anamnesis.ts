// Zod schema + DTO Anamnesis (Asesmen Medis · sub-menu Anamnesis). Vocab kanonik
// mirror AnamnesisIGDForm (AsesmenMedisTab.tsx > AnamnesisPane). Append-only: tiap POST =
// baris baru; latest by createdAt = berlaku. DTO mirror FE → wiring zero-refactor.
//
// Catatan vocab: field `rps` = Riwayat Penyakit Sekarang (abbr. medis baku, dipertahankan).
// `faktorPeringan` membetulkan typo form FE `faktorPemerut` → di-map saat wiring (Fase B).

import { z } from "zod";

// Sumber keterangan anamnesis (vocab terkontrol; di DB = TEXT, bukan enum Postgres).
export const SumberAnamnesis = z.enum(["Pasien", "Keluarga", "Pengantar", "Rekam Medis"]);
export type SumberAnamnesis = z.infer<typeof SumberAnamnesis>;

// ── Helpers ────────────────────────────────────────────────────────────────---
const reqStr = (label: string) => z.string().trim().min(1, `${label} wajib diisi`);

// String opsional (kosong/whitespace → undefined, biar tak simpan "").
const optStr = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

// ── Psikososial & spiritual (RI — SNARS AP 1.1 / HPK 1.1; IGD tak mengoleksi → undefined) ──
//  Disimpan sebagai JSONB di medicalrecord.Anamnesis. Longgar (semua opsional) — form bisa parsial.
export const SosialSchema = z.object({
  pekerjaan: z.string().trim().max(120).optional(),
  pendidikan: z.string().trim().max(120).optional(),
  statusPernikahan: z.string().trim().max(60).optional(),
  tinggalBersama: z.string().trim().max(160).optional(),
  dukunganKeluarga: z.enum(["", "Kuat", "Cukup", "Lemah", "Tidak Ada"]).optional(),
  hambatanKomunikasi: z.array(z.string().max(80)).max(20).optional(),
  kondisiEkonomi: z.enum(["", "Mampu", "Cukup", "Kurang"]).optional(),
  catatanSosial: z.string().trim().max(2000).optional(),
});
export type SosialData = z.infer<typeof SosialSchema>;

export const SpiritualSchema = z.object({
  agama: z.string().trim().max(60).optional(),
  kebutuhanSpiritual: z.boolean().nullable().optional(),
  detailKebutuhan: z.string().trim().max(2000).optional(),
  penolakanProsedur: z.boolean().nullable().optional(),
  detailPenolakan: z.string().trim().max(2000).optional(),
  catatanSpiritual: z.string().trim().max(2000).optional(),
});
export type SpiritualData = z.infer<typeof SpiritualSchema>;

// ── Input (POST /kunjungan/:id/anamnesis) ──────────────────────────────────────
//  Wajib = yang ber-asterisk di form (sumber, keluhan, RPS, status generalis); sisanya opsional.
export const AnamnesisInput = z.object({
  sumberAnamnesis: SumberAnamnesis,
  keluhanUtama: reqStr("Keluhan utama"),
  rps: reqStr("Riwayat penyakit sekarang"),
  onsetDurasi: optStr,
  mekanismeCedera: optStr,
  faktorPemberat: optStr,
  faktorPeringan: optStr,
  statusGeneralis: reqStr("Status generalis"),
  obatSaatIni: optStr,
  sosial: SosialSchema.optional(),
  spiritual: SpiritualSchema.optional(),
});
export type AnamnesisInput = z.infer<typeof AnamnesisInput>;

// ── DTO (GET) ───────────────────────────────────────────────────────────────--
export interface AnamnesisDTO {
  id: string;
  kunjunganId: string;
  sumberAnamnesis: SumberAnamnesis;
  keluhanUtama: string;
  rps: string;
  onsetDurasi: string | null;
  mekanismeCedera: string | null;
  faktorPemberat: string | null;
  faktorPeringan: string | null;
  statusGeneralis: string;
  obatSaatIni: string | null;
  sosial: SosialData | null; // RI — null bila tak dikoleksi (IGD)
  spiritual: SpiritualData | null;
  pemeriksa: string; // nama pencatat (dari user login)
  authorUserId: string | null;
  createdAt: string; // ISO
}

// ── DTO "Anamnesis Sebelumnya" (longitudinal, read-only) ───────────────────────
//  Anamnesis TERBARU per kunjungan, lintas semua kunjungan pasien (IGD/RJ/RI). Dipakai
//  panel referensi di samping form Anamnesis (continuity of care, SNARS AP 1.2).
export interface AnamnesisRiwayatEpisodeDTO {
  kunjunganId: string;
  noKunjungan: string;
  unit: string; // IGD | RawatJalan | RawatInap
  unitLabel: string;
  poli: string | null;
  tanggal: string; // YYYY-MM-DD (WIB) — saat anamnesis dicatat
  isCurrent: boolean; // = kunjungan yang sedang dibuka
  pemeriksa: string;
  keluhanUtama: string;
  rps: string;
  statusGeneralis: string;
  obatSaatIni: string | null;
}

export interface AnamnesisRiwayatDTO {
  kunjunganId: string;
  patientId: string;
  noRM: string;
  total: number;
  episodes: AnamnesisRiwayatEpisodeDTO[]; // terbaru dulu
}
