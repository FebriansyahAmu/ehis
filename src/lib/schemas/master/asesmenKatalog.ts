// Zod input + DTO — Master Asesmen Katalog (schema "master", model AsesmenItem).
// DTO MIRROR AsesmenItem (FE: lib/master/asesmenKatalogMock.ts) → zero-refactor wiring.
// Kode `<PREFIX>-NNN` AUTO-GEN di Service (counter per kategori) → TIDAK ada di input.
// Enum FE-facing (kategori/status/severity) = pass-through union.

import { z } from "zod";

// ── Vocab terkontrol (identik union asesmenKatalogMock) ───────────────────────
// Kategori "AllergenObat" DIHAPUS (2026-06-18) — allergen obat ditarik dari Katalog Obat.
export const AsesmenKategoriEnum = z.enum([
  "AllergenMakanan", "AllergenLainnya", "ReaksiAlergi",
  "PenyakitDahulu", "PenyakitBeresiko", "PenyakitKeluarga", "PerilakuBeresiko",
  "AnggotaKeluarga", "MetodeKB", "JenisPersalinan",
  "KeluhanUtama", // subset keluhan ber-SNOMED → FHIR Condition chief-complaint (L03 · D4, 2026-11-17)
]);
export type AsesmenKategoriEnum = z.infer<typeof AsesmenKategoriEnum>;

export const AsesmenStatusEnum = z.enum(["Aktif", "Non_Aktif"]);
export const AsesmenSeverityEnum = z.enum(["Ringan", "Sedang", "Berat"]);

/**
 * Prefix kode per kategori (= scope counter). Format kode = `<PREFIX>-NNN` (pad 3),
 * mis. ALG-OB-001 / RX-001 / PD-001. Sumber: pola kode di asesmenKatalogMock.
 */
export const KATEGORI_PREFIX: Record<AsesmenKategoriEnum, string> = {
  AllergenMakanan:  "ALG-MK",
  AllergenLainnya:  "ALG-LN",
  ReaksiAlergi:     "RX",
  PenyakitDahulu:   "PD",
  PenyakitBeresiko: "PB",
  PenyakitKeluarga: "PK",
  PerilakuBeresiko: "PR",
  AnggotaKeluarga:  "AK",
  MetodeKB:         "KB",
  JenisPersalinan:  "JP",
  KeluhanUtama:     "KU",
};

/** Kategori yang WAJIB berkode SNOMED (tanpa kode = tak berguna untuk interoperabilitas). */
export const KATEGORI_WAJIB_SNOMED: ReadonlySet<AsesmenKategoriEnum> = new Set(["KeluhanUtama"]);

/**
 * Kategori riwayat dengan kode SNOMED OPSIONAL — konsep konteks riwayat, BUKAN konsep penyakitnya langsung
 * (FHIR L04 `< 417662000 History of clinical finding` · L05 `< 416471007 Family history of clinical finding`).
 * Item tanpa kode tetap bisa dipilih di form; riwayatnya ditahan (Issue) saat kirim SatuSehat.
 */
export const KATEGORI_SNOMED_RIWAYAT: Partial<Record<AsesmenKategoriEnum, string>> = {
  PenyakitDahulu: "Opsional — SNOMED konsep \"History of …\" (mis. 161501007 H/O: hypertension) untuk Condition riwayat penyakit SatuSehat. Bukan kode penyakitnya langsung",
  PenyakitKeluarga: "Opsional — SNOMED konsep \"Family history …\" (mis. 160357008 FH: Hypertension) untuk FamilyMemberHistory SatuSehat. Bukan kode penyakitnya langsung",
};

/** SCTID: 6–18 digit, tanpa nol di depan (check digit divalidasi di skrip seed / saat POST SatuSehat). */
export const SCTID_RE = /^[1-9]\d{5,17}$/;

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

// ── Create (POST /master/asesmen-katalog) — TANPA kode (auto-gen server) ───────
export const CreateAsesmenInput = z.object({
  nama: z.string().trim().min(1, "Nama item wajib").max(200),
  kategori: AsesmenKategoriEnum,
  deskripsi: optStr,
  snomedCode: optStr.refine((v) => v === undefined || SCTID_RE.test(v), "Kode SNOMED harus 6–18 digit angka"),
  snomedDisplay: z.string().trim().max(255).optional().transform((v) => (v ? v : undefined)),
  severityDefault: AsesmenSeverityEnum.optional(),
  status: AsesmenStatusEnum.optional(), // default Aktif di Service
});
export type CreateAsesmenInput = z.infer<typeof CreateAsesmenInput>;

// ── Update (PATCH /master/asesmen-katalog/:id) — parsial; kode & kategori immutable ──
// kategori immutable: kode terikat prefix kategori → ganti kategori akan men-drift kode.
export const UpdateAsesmenInput = z.object({
  nama: z.string().trim().min(1).max(200).optional(),
  deskripsi: optStr,
  snomedCode: z.string().trim().optional() // "" → kosongkan snomed
    .refine((v) => !v || SCTID_RE.test(v), "Kode SNOMED harus 6–18 digit angka"),
  snomedDisplay: z.string().trim().max(255).optional(), // "" → kosongkan display
  severityDefault: AsesmenSeverityEnum.optional(),
  status: AsesmenStatusEnum.optional(),
});
export type UpdateAsesmenInput = z.infer<typeof UpdateAsesmenInput>;

// ── Query list (GET /master/asesmen-katalog) ──────────────────────────────────
export const AsesmenQuery = z.object({
  q: z.string().trim().optional(),
  kategori: AsesmenKategoriEnum.optional(),
  status: z.enum(["Semua", "Aktif", "Non_Aktif"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});
export type AsesmenQuery = z.infer<typeof AsesmenQuery>;

export const IdParam = z.object({ id: z.string().uuid() });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) — MIRROR AsesmenItem FE ────────────────────────────────────
export interface AsesmenItemDTO {
  id: string;
  kode: string;
  nama: string;
  kategori: AsesmenKategoriEnum;
  deskripsi: string;
  snomedCode?: string;
  snomedDisplay?: string;
  severityDefault?: z.infer<typeof AsesmenSeverityEnum>;
  status: z.infer<typeof AsesmenStatusEnum>;
}
