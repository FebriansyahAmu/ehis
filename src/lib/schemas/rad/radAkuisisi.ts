// Zod input + DTO — Akuisisi & Dosis Radiologi (tab Akuisisi, OPSIONAL). Metadata teknis akuisisi +
// proteksi + log dosis (BAPETEN/DRL). 1 rad_akuisisi = 1 sesi (append-only "latest wins").
// Radiografer bisa >1 (DICOM Operators' Name). paramTeknis/proteksi/dosis variatif per modalitas;
// dosis & proteksi tak relevan utk non-pengion (USG/MRI) → boleh kosong. Lihat medicalrecord.RadAkuisisi.

import { z } from "zod";

const optNum = z.number().finite().optional();

// ── Radiografer pelaksana (RadiograferRef) ──
export const RadiograferRefInput = z.object({
  pegawaiId: z.string().trim().default(""),
  nama: z.string().trim().min(1).max(200),
});
export type RadiograferRefInput = z.infer<typeof RadiograferRefInput>;

// ── Parameter teknis (variatif per modalitas) ──
export const RadParamTeknisInput = z.object({
  kvp: optNum,        // CT
  mas: optNum,        // CT (mAs efektif)
  fov: z.string().trim().max(60).optional(),   // CT
  slice: z.string().trim().max(60).optional(), // CT (tebal irisan)
  probe: z.string().trim().max(120).optional(),     // USG
  frekuensi: z.string().trim().max(60).optional(),  // USG
  sekuens: z.array(z.string().trim().max(120)).optional(), // MRI
  kv: optNum,         // Konvensional
  mAs: optNum,        // Konvensional
});
export type RadParamTeknisInput = z.infer<typeof RadParamTeknisInput>;

// ── Proteksi radiasi (NULL utk non-pengion) ──
export const RadProteksiInput = z.object({
  apron: z.boolean().default(false),
  collar: z.boolean().default(false),
  gonadShield: z.boolean().default(false),
  thyroidShield: z.boolean().optional(),
});
export type RadProteksiInput = z.infer<typeof RadProteksiInput>;

// ── Log dosis radiasi (NULL utk non-pengion) ──
export const RadDosisInput = z.object({
  ctdiVol: optNum,
  dlp: optNum,
  drlCtdiVol: optNum,
  drlDlp: optNum,
  dap: optNum,
  waktuFluoro: optNum,
  doseEntrance: optNum,
  drlEntrance: optNum,
});
export type RadDosisInput = z.infer<typeof RadDosisInput>;

// ── Simpan akuisisi (POST /rad/orders/:id/akuisisi) — semua field opsional ──
export const SaveRadAkuisisiInput = z.object({
  radiografer: z.array(RadiograferRefInput).default([]),
  paramTeknis: RadParamTeknisInput.optional(),
  proteksi: RadProteksiInput.optional(),
  dosis: RadDosisInput.optional(),
  mulaiAt: z.string().trim().optional(),   // "YYYY-MM-DDTHH:mm" / ISO
  selesaiAt: z.string().trim().optional(),
});
export type SaveRadAkuisisiInput = z.infer<typeof SaveRadAkuisisiInput>;
/** Bentuk pra-parse (field ber-default opsional) — dipakai pemanggil API/FE. */
export type SaveRadAkuisisiBody = z.input<typeof SaveRadAkuisisiInput>;

// ── DTO (response) ──
export interface RadiograferRefDTO {
  pegawaiId: string;
  nama: string;
}

export interface RadAkuisisiDTO {
  id: string;
  radOrderId: string;
  kunjunganId: string;
  radiografer: RadiograferRefDTO[];
  paramTeknis: RadParamTeknisInput | null;
  proteksi: RadProteksiInput | null;
  dosis: RadDosisInput | null;
  mulaiAt: string | null;   // ISO
  selesaiAt: string | null; // ISO
  createdAt: string;        // ISO
}
