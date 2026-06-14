// Zod input + DTO — Pemeriksaan Fisik (tab Pemeriksaan, SNARS AP 1). DTO mirror
// PemeriksaanFisikEntry (FE: lib/data.ts) → zero-refactor wiring (tanggal/jam derive dari
// waktuPemeriksaan, TZ Asia/Jakarta di Service). Append-only (read/create). Blok orientasi/
// sistem/bodyMarkings = JSONB; temuanAbnormal/temuanLain = text[]. Input pakai OPTIONAL murni
// (tanpa transform pengubah-tipe) → normalisasi/default di Service.

import { z } from "zod";

// ── Vocab terkontrol (identik union FE) ───────────────────────────────────────
export const KuEnum = z.enum(["Baik", "Sedang", "Berat"]);
export const KesadaranEnum = z.enum(["Composmentis", "Apatis", "Delirium", "Somnolen", "Sopor", "Koma"]);
export const GiziEnum = z.enum(["Baik", "Kurang", "Lebih", "Obesitas"]);
export const MobilitasEnum = z.enum(["Mandiri", "Dibantu", "Tirah Baring"]);

const optStr = z.string().trim().optional();
const strArr = z.array(z.string()).optional();

export const OrientasiSchema = z.object({
  waktu: z.boolean(),
  tempat: z.boolean(),
  orang: z.boolean(),
});

export const BodyMarkingSchema = z.object({
  region: z.string(),
  label: z.string(),
  catatan: z.string(),
});

// ── Create (POST /kunjungan/:id/pemeriksaan-fisik) ─────────────────────────────
export const PemeriksaanFisikInput = z.object({
  waktuPemeriksaan: z.string().optional(), // ISO; default now() di Service
  dokterPemeriksa: optStr,                   // dari roster ruangan
  perawat: optStr,                           // default nama actor di Service
  ku: KuEnum,
  kesadaran: KesadaranEnum,
  gizi: GiziEnum,
  mobilitas: MobilitasEnum.optional(),
  orientasi: OrientasiSchema.optional(),
  catatanGeneralis: optStr,
  sistem: z.record(z.string(), z.string()).optional(),
  temuanAbnormal: strArr,
  temuanLain: strArr,
  catatanUmum: optStr,
  bodyMarkings: z.array(BodyMarkingSchema).optional(),
});
export type PemeriksaanFisikInput = z.infer<typeof PemeriksaanFisikInput>;

export const IdParam = z.object({ id: z.string().uuid() });

// ── DTO (response) — mirror PemeriksaanFisikEntry FE ───────────────────────────
export interface PemeriksaanFisikDTO {
  id: string;
  waktuPemeriksaan: string; // ISO (FE set DateTimePicker)
  tanggal: string;          // derive (display, TZ Asia/Jakarta)
  jam: string;              // derive "HH:mm"
  dokter: string;
  perawat: string;
  ku: string;
  kesadaran: string;
  gizi: string;
  mobilitas?: string;
  orientasi: { waktu: boolean; tempat: boolean; orang: boolean };
  catatanGeneralis: string;
  sistem: Record<string, string>;
  temuanAbnormal: string[];
  temuanLain: string[];
  catatanUmum: string;
  bodyMarkings: { region: string; label: string; catatan: string }[];
}
