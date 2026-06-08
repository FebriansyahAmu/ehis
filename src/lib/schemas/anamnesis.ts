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
  pemeriksa: string; // nama pencatat (dari user login)
  authorUserId: string | null;
  createdAt: string; // ISO
}
