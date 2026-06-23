// Zod input + DTO — Hasil/Ekspertise Radiologi (laporan tunggal per RadOrder, ACR Practice Parameters).
// Selaras desain EkspertasiPane: indikasi/teknik/temuan/kesan/saran + radiolog (SpRad) + temuan kritis.
// 1 rad_result = 1 sesi ekspertise (append-only "latest wins"). Lihat medicalrecord.RadResult.

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

// ── Temuan kritis (ACR critical results — pelaporan ke DPJP) ──
export const RadCriticalFindingInput = z.object({
  id: z.string().optional(),
  kategori: z.string().trim().min(1).max(120),
  deskripsi: z.string().trim().max(500).default(""),
  metode: z.enum(["Telepon", "SMS", "WhatsApp", "Langsung"]).optional(),
  namaDokter: optStr,
  jamLapor: optStr,
  pelapor: optStr,
  confirmed: z.boolean().default(false),
});
export type RadCriticalFindingInput = z.infer<typeof RadCriticalFindingInput>;

// ── Simpan ekspertise (POST /rad/orders/:id/hasil) ──
// finalize=false → simpan draft (status order tetap); finalize=true → terbitkan (→ Divalidasi).
export const SaveRadResultInput = z.object({
  indikasiKlinis: z.string().trim().max(4000).default(""),
  teknik: z.string().trim().max(4000).default(""),
  temuan: z.string().trim().max(8000).default(""),
  kesan: z.string().trim().max(4000).default(""),
  saran: optStr,
  radiolog: z.string().trim().max(200).default(""), // spradNama (boleh kosong saat draft)
  radiologSip: optStr,                              // spradSIP
  radiografer: optStr,
  criticalFindings: z.array(RadCriticalFindingInput).optional(),
  finalize: z.boolean().default(false),
});
export type SaveRadResultInput = z.infer<typeof SaveRadResultInput>;
/** Bentuk pra-parse (field ber-default opsional) — dipakai pemanggil API/FE. */
export type SaveRadResultBody = z.input<typeof SaveRadResultInput>;

// ── Validasi hasil (POST /rad/orders/:id/validasi) — SpRad stamp + Divalidasi → Selesai ──
export const ValidateRadResultInput = z.object({
  validator: z.string().trim().min(1, "Nama validator wajib").max(200), // nama SpRad (desain free-text)
  catatanValidator: optStr,
});
export type ValidateRadResultInput = z.infer<typeof ValidateRadResultInput>;
export type ValidateRadResultBody = z.input<typeof ValidateRadResultInput>;

// ── DTO (response) ──
export interface RadCriticalFindingDTO {
  id: string;
  kategori: string;
  deskripsi: string;
  metode: "Telepon" | "SMS" | "WhatsApp" | "Langsung" | null;
  namaDokter: string | null;
  jamLapor: string | null;
  pelapor: string | null;
  confirmed: boolean;
}

export interface RadResultDTO {
  id: string;
  radOrderId: string;
  kunjunganId: string;
  indikasiKlinis: string;
  teknik: string;
  temuan: string;
  kesan: string;
  saran: string | null;
  radiolog: string;       // spradNama
  radiologSip: string | null; // spradSIP
  radiografer: string | null;
  criticalFindings: RadCriticalFindingDTO[];
  /** Validasi (SpRad) — null bila belum divalidasi. */
  validator: string | null;
  catatanValidator: string | null;
  validatedAt: string | null; // ISO
  createdAt: string; // ISO
}
