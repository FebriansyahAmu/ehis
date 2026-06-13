// Zod input + DTO — Master Katalog Obat (schema "master").
// DTO = ObatRecord FE (mirror penuh → zero-refactor saat wiring). Enum FE-facing
// (kategori/bentuk/rute/golongan/status) pass-through TEXT; vocab map hanya
// null⇄undefined. Pemetaan KFA = blok JSONB (KfaMapping) → replace utuh saat update.
// Katalog leaf (tanpa optimistic-version).

import { z } from "zod";
import type { ObatRecord } from "@/lib/master/obatMock";

// ── Vocab terkontrol (mirror union FE obatMock.ts) ────────
export const ObatKategoriEnum = z.enum([
  "Antibiotik", "Analgesik", "Antihipertensi", "Kardiovaskular", "Antidiabetik",
  "Saluran_Cerna", "Saluran_Nafas", "Neurologi", "Vitamin_Cairan", "Lainnya",
]);
export const SediaanBentukEnum = z.enum([
  "Tablet", "Kapsul", "Sirup", "Injeksi", "Salep", "Inhaler", "Cairan",
  "Suppositoria", "Drops", "Patch", "Spray",
]);
export const SatuanTerkecilEnum = z.enum([
  "Tablet", "Kapsul", "Botol", "Vial", "Ampul", "Sachet", "Tube", "Strip", "Pcs", "ml",
]);
export const RutePemberianEnum = z.enum([
  "PO", "IV", "IM", "SC", "Topikal", "Inhalasi", "Rektal", "Sublingual", "Vaginal", "Mata", "Telinga",
]);
export const GolonganObatEnum = z.enum([
  "Narkotika_I", "Narkotika_II", "Narkotika_III",
  "Psikotropika_I", "Psikotropika_II", "Psikotropika_III", "Psikotropika_IV",
  "OOT", "Keras_G", "Bebas_Terbatas", "Bebas",
]);
export const StatusObatEnum = z.enum(["Aktif", "Non_Aktif", "Discontinued"]);

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));
const optInt = z.number().int().min(0).optional();
// KFA: key OPTIONAL (tanpa transform) agar `KfaMapping` FE (key opsional) assignable.
const kfaStr = z.string().trim().optional();

// ── KFA mapping (blok JSONB) ──────────────────────────────
export const KfaIngredientInput = z.object({
  kode: z.string().trim().max(40).default(""),
  display: z.string().trim().max(200).default(""),
  dosis: z.number().nonnegative().optional(),
  satuan: kfaStr,
  dosisPerSatuan: kfaStr,
});

export const KfaMappingInput = z.object({
  poaKode: kfaStr, poaNama: kfaStr, nie: kfaStr,
  povKode: kfaStr, povNama: kfaStr,
  ruteKode: kfaStr, ruteNama: kfaStr,
  bentukKode: kfaStr, bentukNama: kfaStr,
  zatAktif: z.array(KfaIngredientInput).default([]),
  sumber: z.enum(["KFA_API", "Manual"]).optional(),
  mappedAt: kfaStr,
});
export type KfaMappingInput = z.infer<typeof KfaMappingInput>;

// ── Body bersama (create/update share field) ──────────────
// `kode` TIDAK di-input — auto-generate `OBT-<YYMM><NNN>` di Service (immutable).
const obatBody = {
  namaGenerik: z.string().trim().min(1, "Nama generik wajib").max(200),
  namaDagang: z.string().trim().min(1, "Nama dagang wajib").max(200),
  pabrik: optStr,
  kategori: ObatKategoriEnum,
  bentuk: SediaanBentukEnum,
  kekuatan: z.string().trim().min(1, "Kekuatan wajib").max(80),
  satuanTerkecil: SatuanTerkecilEnum.optional(),
  rute: RutePemberianEnum.optional(),

  isFormularium: z.boolean().optional(),
  isHAM: z.boolean().optional(),
  isLASA: z.boolean().optional(),
  lasaPairIds: z.array(z.string()).optional(),
  golongan: GolonganObatEnum.optional(),
  isColdChain: z.boolean().optional(),
  isRestricted: z.boolean().optional(),

  indikasi: optStr,
  kontraindikasi: optStr,
  dosisDewasa: optStr,
  dosisAnak: optStr,
  efekSamping: optStr,
  interaksiObat: optStr,
  catatanKhusus: optStr,

  hargaSatuan: optInt,
  hpp: optInt,
  het: optInt,
  kodeFornas: optStr,
  bpjsCoverage: z.boolean().optional(),
  batasResepPerKunjungan: optInt,

  kfa: KfaMappingInput.optional(),
  status: StatusObatEnum.optional(),
} as const;

// ── Create (POST /master/obat) ────────────────────────────
export const CreateObatInput = z.object({
  ...obatBody,
  kategori: ObatKategoriEnum.optional(), // default Lainnya di Service
  bentuk: SediaanBentukEnum.optional(),  // default Tablet di Service
  kekuatan: z.string().trim().max(80).optional(),
});
export type CreateObatInput = z.infer<typeof CreateObatInput>;

// ── Update (PATCH /master/obat/:id) — parsial; kfa = replace utuh ──
export const UpdateObatInput = z.object({
  ...obatBody,
  namaGenerik: z.string().trim().min(1).max(200).optional(),
  namaDagang: z.string().trim().min(1).max(200).optional(),
  kategori: ObatKategoriEnum.optional(),
  bentuk: SediaanBentukEnum.optional(),
  kekuatan: z.string().trim().min(1).max(80).optional(),
});
export type UpdateObatInput = z.infer<typeof UpdateObatInput>;

// ── Query list (GET /master/obat) ─────────────────────────
export const ObatQuery = z.object({
  q: z.string().trim().optional(),
  kategori: ObatKategoriEnum.optional(),
  status: z.enum(["Semua", "Aktif", "Non_Aktif", "Discontinued"]).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(300).optional(),
});
export type ObatQuery = z.infer<typeof ObatQuery>;

export const IdParam = z.object({ id: z.string().uuid() });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) = ObatRecord FE (mirror penuh) ─────────
export type ObatDTO = ObatRecord;
