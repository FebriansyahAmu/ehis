// Zod input + DTO — Master Asesmen Katalog (schema "master", model AsesmenItem).
// DTO MIRROR AsesmenItem (FE: lib/master/asesmenKatalogMock.ts) → zero-refactor wiring.
// Kode `<PREFIX>-NNN` AUTO-GEN di Service (counter per kategori) → TIDAK ada di input.
// Enum FE-facing (kategori/status/severity) = pass-through union.

import { z } from "zod";

// ── Vocab terkontrol (identik union asesmenKatalogMock) ───────────────────────
export const AsesmenKategoriEnum = z.enum([
  "AllergenObat", "AllergenMakanan", "AllergenLainnya", "ReaksiAlergi",
  "PenyakitDahulu", "PenyakitBeresiko", "PenyakitKeluarga", "PerilakuBeresiko",
  "AnggotaKeluarga", "MetodeKB", "JenisPersalinan",
]);
export type AsesmenKategoriEnum = z.infer<typeof AsesmenKategoriEnum>;

export const AsesmenStatusEnum = z.enum(["Aktif", "Non_Aktif"]);
export const AsesmenSeverityEnum = z.enum(["Ringan", "Sedang", "Berat"]);

/**
 * Prefix kode per kategori (= scope counter). Format kode = `<PREFIX>-NNN` (pad 3),
 * mis. ALG-OB-001 / RX-001 / PD-001. Sumber: pola kode di asesmenKatalogMock.
 */
export const KATEGORI_PREFIX: Record<AsesmenKategoriEnum, string> = {
  AllergenObat:     "ALG-OB",
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
};

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

// ── Create (POST /master/asesmen-katalog) — TANPA kode (auto-gen server) ───────
export const CreateAsesmenInput = z.object({
  nama: z.string().trim().min(1, "Nama item wajib").max(200),
  kategori: AsesmenKategoriEnum,
  deskripsi: optStr,
  snomedCode: optStr,
  severityDefault: AsesmenSeverityEnum.optional(),
  status: AsesmenStatusEnum.optional(), // default Aktif di Service
});
export type CreateAsesmenInput = z.infer<typeof CreateAsesmenInput>;

// ── Update (PATCH /master/asesmen-katalog/:id) — parsial; kode & kategori immutable ──
// kategori immutable: kode terikat prefix kategori → ganti kategori akan men-drift kode.
export const UpdateAsesmenInput = z.object({
  nama: z.string().trim().min(1).max(200).optional(),
  deskripsi: optStr,
  snomedCode: z.string().trim().optional(), // "" → kosongkan snomed
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
  severityDefault?: z.infer<typeof AsesmenSeverityEnum>;
  status: z.infer<typeof AsesmenStatusEnum>;
}
