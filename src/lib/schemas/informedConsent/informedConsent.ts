// Zod input + DTO — rekam medis Informed Consent (tab IC, per-kunjungan, PMK 290/2008).
// Daftar hidup per-item, immutable (add/delete only). TTD = PNG data URL base64 (signatureData).
// Lihat medicalrecord.InformedConsent. DTO TIDAK memuat signatureData (write-mostly; row bloat).

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

// ── Create (POST /kunjungan/:id/consent) ───────────────────────────────────────
export const InformedConsentInput = z.object({
  noFormulir: z.string().trim().min(1, "Nomor formulir wajib").max(60),

  tindakanId: z.string().uuid().optional(),                       // ref master.Tindakan (null = manual)
  tindakanNama: z.string().trim().min(1, "Nama tindakan wajib").max(500),
  tindakanKategori: z.string().trim().max(120).optional(),

  tujuan: optStr,
  manfaat: optStr,
  risiko: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  risikoLain: optStr,
  alternatif: optStr,
  konsekuensiTolak: optStr,
  pertanyaanPasien: optStr,

  keputusan: z.enum(["setuju", "menolak"]),
  alasanTolak: optStr,

  penandaHubungan: z.string().trim().min(1, "Hubungan penanda wajib").max(80),
  penandaNama: z.string().trim().min(1, "Nama penanda wajib").max(200),
  saksi1: optStr,
  saksi2: optStr,
  namaDokter: z.string().trim().min(1, "Nama dokter wajib").max(200),

  signatureMethod: z.enum(["draw", "webcam"]).optional(),
  signatureData: z.string().max(3_000_000).optional(),           // PNG data URL base64 (~cap 3MB)
  signedAt: z.coerce.date().optional(),

  waktuPersetujuan: z.coerce.date(),
});
export type InformedConsentInput = z.infer<typeof InformedConsentInput>;

export const ConsentItemParam = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
});
export type ConsentItemParam = z.infer<typeof ConsentItemParam>;

// ── DTO (response) — TANPA signatureData; hasSignature = derived ────────────────
export interface InformedConsentDTO {
  id: string;
  noFormulir: string;
  tindakanId: string | null;
  tindakanNama: string;
  tindakanKategori: string | null;
  tujuan: string | null;
  manfaat: string | null;
  risiko: string[];
  risikoLain: string | null;
  alternatif: string | null;
  konsekuensiTolak: string | null;
  pertanyaanPasien: string | null;
  keputusan: "setuju" | "menolak";
  alasanTolak: string | null;
  penandaHubungan: string;
  penandaNama: string;
  saksi1: string | null;
  saksi2: string | null;
  namaDokter: string;
  signatureMethod: string | null;
  hasSignature: boolean;
  signedAt: string | null;       // ISO
  waktuPersetujuan: string;      // ISO
  petugas: string;
  createdAt: string;             // ISO
}

// ── Detail DTO (GET /:itemId) — list DTO + TTD image (untuk cetak/preview) ───────
export interface InformedConsentDetailDTO extends InformedConsentDTO {
  signatureData: string | null; // PNG data URL base64
}
