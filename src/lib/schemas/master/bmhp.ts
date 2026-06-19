// Zod input + DTO — Master Katalog BMHP/BHP (schema "master").
// DTO = BmhpRecord FE (mirror penuh → zero-refactor saat wiring). Enum FE-facing
// (kategori/satuan/kelasRisiko/status) pass-through TEXT; vocab map hanya null⇄undefined.
// Katalog leaf (tanpa optimistic-version). KFA Alkes = DITUNDA (tak ada input).

import { z } from "zod";
import type { BmhpRecord } from "@/lib/master/bmhpMock";

// ── Vocab terkontrol (mirror union FE bmhpMock.ts) ────────
export const BmhpKategoriEnum = z.enum([
  "Alat Suntik & Infus", "Sarung Tangan", "Kasa & Pembalut", "Kateter & Selang",
  "Jarum & Benang Bedah", "Antiseptik & Desinfektan", "APD",
  "Alat Diagnostik Habis Pakai", "Lainnya",
]);
export const BmhpSatuanEnum = z.enum([
  "Pcs", "Set", "Box", "Pasang", "Rol", "Lembar", "Vial", "Sachet", "Ampul", "Botol",
]);
export const KelasRisikoEnum = z.enum(["A", "B", "C", "D"]);
export const StatusBmhpEnum = z.enum(["Aktif", "Non_Aktif", "Discontinued"]);

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));
const optInt = z.number().int().min(0).optional();

// ── Body bersama (create/update share field) ──────────────
// `kode` TIDAK di-input — auto-generate `BHP-<YYMM><NNN>` di Service (immutable).
const bmhpBody = {
  nama: z.string().trim().min(1, "Nama barang wajib").max(200),
  merek: optStr,
  pabrik: optStr,
  kategori: BmhpKategoriEnum,
  ukuran: optStr,
  satuan: BmhpSatuanEnum,
  isiPerKemasan: optInt,

  isSteril: z.boolean().optional(),
  isSingleUse: z.boolean().optional(),
  isImplan: z.boolean().optional(),
  kelasRisiko: KelasRisikoEnum.optional(),
  isFormularium: z.boolean().optional(),

  nomorIzinEdar: optStr,
  kodeEKatalog: optStr,

  hargaSatuan: optInt,
  hpp: optInt,
  het: optInt,
  bpjsCoverage: z.boolean().optional(),

  catatan: optStr,
  status: StatusBmhpEnum.optional(),
} as const;

// ── Create (POST /master/bmhp) ────────────────────────────
export const CreateBmhpInput = z.object({
  ...bmhpBody,
  kategori: BmhpKategoriEnum.optional(), // default Lainnya di Service
  satuan: BmhpSatuanEnum.optional(),     // default Pcs di Service
});
export type CreateBmhpInput = z.infer<typeof CreateBmhpInput>;

// ── Update (PATCH /master/bmhp/:id) — parsial ──
export const UpdateBmhpInput = z.object({
  ...bmhpBody,
  nama: z.string().trim().min(1).max(200).optional(),
  kategori: BmhpKategoriEnum.optional(),
  satuan: BmhpSatuanEnum.optional(),
});
export type UpdateBmhpInput = z.infer<typeof UpdateBmhpInput>;

// ── Query list (GET /master/bmhp) ─────────────────────────
export const BmhpQuery = z.object({
  q: z.string().trim().optional(),
  kategori: BmhpKategoriEnum.optional(),
  status: z.enum(["Semua", "Aktif", "Non_Aktif", "Discontinued"]).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(300).optional(),
});
export type BmhpQuery = z.infer<typeof BmhpQuery>;

export const IdParam = z.object({ id: z.string().uuid() });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) = BmhpRecord FE (mirror penuh) ─────────
export type BmhpDTO = BmhpRecord;
