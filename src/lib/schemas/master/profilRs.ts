// Zod input + DTO — Master Profil RS (schema "master", model RsProfil, SINGLETON).
// DTO mirror RSProfil (FE: lib/master/rsProfilStore.ts) + logoDataUrl → zero-refactor.
// Blok bertingkat (alamat/akreditasi/shift/kop) divalidasi struktural; enum FE-facing
// pass-through (union identik FE). Logo dikelola endpoint terpisah (upload) → tak di body.

import { z } from "zod";

// ── Vocab terkontrol (identik union rsProfilStore) ────────────────────────────
export const KelasRsEnum       = z.enum(["A", "B", "C", "D", "D Pratama"]);
export const TipeRsEnum        = z.enum(["RSUD", "RSU", "RS Khusus", "RSIA", "Klinik"]);
export const KepemilikanRsEnum = z.enum([
  "Pemerintah Pusat", "Pemerintah Daerah", "TNI/Polri", "Swasta Nasional", "BUMN",
]);
export const LembagaAkredEnum  = z.enum(["KARS", "JCI", "Proses", "Belum"]);

const optStr = z.string().trim().max(300).optional().transform((v) => (v ? v : undefined));

// ── Blok bertingkat ───────────────────────────────────────────────────────────
export const RsAlamatSchema = z.object({
  jalan:       z.string().trim().max(300),
  kelurahan:   z.string().trim().max(120),
  kecamatan:   z.string().trim().max(120),
  kota:        z.string().trim().max(120),
  provinsi:    z.string().trim().max(120),
  kodePos:     z.string().trim().max(10),
  kodeWilayah: z.string().trim().max(20),
});

export const RsAkreditasiSchema = z.object({
  lembaga:         LembagaAkredEnum,
  sertifikatNo:    optStr,
  tanggalMulai:    optStr,
  tanggalBerakhir: optStr,
  paripurna:       z.boolean(),
  nomorIzin:       z.string().trim().max(120).default(""),
  tanggalIzin:     optStr,
});

const ShiftJamSchema = z.object({
  mulai:   z.string().regex(/^\d{2}:\d{2}$/, "Format jam HH:mm"),
  selesai: z.string().regex(/^\d{2}:\d{2}$/, "Format jam HH:mm"),
});
export const RsShiftSchema = z.object({
  Pagi:  ShiftJamSchema,
  Siang: ShiftJamSchema,
  Malam: ShiftJamSchema,
});

export const RsKopSchema = z.object({
  subtitle:   optStr,
  alamatKop:  optStr,
  namaKepala: optStr,
  nipKepala:  optStr,
});

// ── Upsert (PUT /master/profil-rs) — profil tekstual penuh (TANPA logo) ─────────
export const UpsertRsProfilInput = z.object({
  nama:        z.string().trim().min(1, "Nama RS wajib").max(200),
  namaInggris: optStr,
  kode:        z.string().trim().min(1, "Kode RS wajib").max(30),
  kelas:       KelasRsEnum,
  tipe:        TipeRsEnum,
  kepemilikan: KepemilikanRsEnum,
  telp:        z.string().trim().min(1, "Telepon wajib").max(60),
  fax:         optStr,
  email:       z.string().trim().min(1, "Email wajib").max(160),
  website:     optStr,
  alamat:      RsAlamatSchema,
  akreditasi:  RsAkreditasiSchema,
  shift:       RsShiftSchema,
  kop:         RsKopSchema,
});
export type UpsertRsProfilInput = z.infer<typeof UpsertRsProfilInput>;

// ── Upload logo (POST /master/profil-rs/logo) ─────────────────────────────────
// data URI base64 gambar (png/jpeg/webp/svg+xml). Batas server-side ~700KB terenkode.
const MAX_LOGO_CHARS = 700_000;
export const UploadLogoInput = z.object({
  dataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/, "Logo harus gambar (png/jpeg/webp/svg) base64")
    .max(MAX_LOGO_CHARS, "Ukuran logo terlalu besar (maks ±500KB) — perkecil gambar"),
});
export type UploadLogoInput = z.infer<typeof UploadLogoInput>;

// ── DTO (response) — mirror RSProfil FE + logo + meta ─────────────────────────
export type RsAlamatDTO     = z.infer<typeof RsAlamatSchema>;
export type RsAkreditasiDTO = z.infer<typeof RsAkreditasiSchema>;
export type RsShiftDTO      = z.infer<typeof RsShiftSchema>;
export type RsKopDTO        = z.infer<typeof RsKopSchema>;

export interface RsProfilDTO {
  nama:        string;
  namaInggris?: string;
  kode:        string;
  kelas:       z.infer<typeof KelasRsEnum>;
  tipe:        z.infer<typeof TipeRsEnum>;
  kepemilikan: z.infer<typeof KepemilikanRsEnum>;
  telp:        string;
  fax?:        string;
  email:       string;
  website?:    string;
  alamat:      RsAlamatDTO;
  akreditasi:  RsAkreditasiDTO;
  shift:       RsShiftDTO;
  kop:         RsKopDTO;
  logoDataUrl: string | null;
  updatedAt?:  string;
  updatedBy?:  string | null;
}
