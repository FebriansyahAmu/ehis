// Zod query + DTO — Master Referensi Wilayah Kemendagri (schema "master").
// Reference read-only (di-seed dari cahyadsn/wilayah). Dikonsumsi cascading picker
// (alamat pasien · lokasiLaka KLL · alamat RS). Kode BPJS berbeda → referensi terpisah.

import { z } from "zod";

// Kode dotted Kemendagri: "11" / "11.01" / "11.01.01" / "11.01.01.2001".
const KODE = z.string().trim().regex(/^\d{2}(\.\d{2,4})*$/, "Kode wilayah tidak valid").max(13);

// ── Query (GET /api/v1/wilayah) ───────────────────────────────────────────────
// Mode:
//   (default, tanpa filter)   → provinsi (level 1)
//   ?parentKode=31            → anak langsung provinsi 31 (kab/kota)
//   ?q=jakarta[&level=2]      → cari nama (opsional dibatasi level)
//   ?ancestorsOf=31.71.01.1001 → rantai leluhur (prov→kab→kec→desa) untuk rekonstruksi picker
export const WilayahQuery = z.object({
  level: z.coerce.number().int().min(1).max(4).optional(),
  parentKode: KODE.optional(),
  q: z.string().trim().max(100).optional(),
  ancestorsOf: KODE.optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});
export type WilayahQuery = z.infer<typeof WilayahQuery>;

// ── DTO (response) ────────────────────────────────────────────────────────────
export interface WilayahDTO {
  kode: string;        // dotted Kemendagri (PK)
  nama: string;        // nama (level 2 sudah membawa prefix "Kabupaten"/"Kota")
  level: number;       // 1 Prov · 2 Kab/Kota · 3 Kec · 4 Desa/Kel
  parentKode: string | null;
  kodeFlat: string;    // tanpa titik — FHIR administrativeCode / BPS
}
