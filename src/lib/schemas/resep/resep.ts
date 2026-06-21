// Zod input + DTO — tab Resep Pasien (order obat ke depo Farmasi, per-kunjungan).
// 1 order = header (depo + kondisi klinis + penulis) + items[] (baris obat). Mirror FE
// ResepItem (igd/tabs/ResepPasienTab) + ResepRIItem (lib/data) + FarmasiOrder (worklist).
// Lihat medicalrecord.ResepOrder / ResepItem.

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

export const KategoriObatEnum = z.enum(["Reguler", "Narkotika", "Psikotropika"]);
export const PrioritasEnum = z.enum(["CITO", "Segera", "Rutin"]);

// ── Item input ───────────────────────────────────────────────────────────────
export const ResepItemInput = z.object({
  kodeObat: z.string().trim().max(60).default(""),
  namaObat: z.string().trim().min(1, "Nama obat wajib").max(300),
  bzaKode: optStr,                          // zat aktif KFA (bila dari Katalog Obat)
  dosis: optStr,
  dosisSekali: optStr,
  signa: optStr,
  jumlah: z.coerce.number().int().min(1).max(9999).default(1),
  rute: optStr,
  aturanPakai: optStr,
  kategori: KategoriObatEnum.default("Reguler"),
  durasiHari: z.coerce.number().int().min(0).max(365).default(1),
  keterangan: optStr,
  isHAM: z.boolean().default(false),
});
export type ResepItemInput = z.infer<typeof ResepItemInput>;

// ── Order input (POST /kunjungan/:id/resep) ───────────────────────────────────
export const ResepOrderInput = z.object({
  depoKode: optStr,                         // Location.kode kategori Farmasi (opsional)
  depoNama: z.string().trim().min(1, "Depo Farmasi wajib").max(120),
  catatan: optStr,
  kondisiGinjal: optStr,
  kondisiMenyusui: optStr,
  kondisiKehamilan: optStr,
  prioritas: PrioritasEnum.default("Rutin"),
  penulis: optStr,                          // kosong → default nama actor (server)
  penulisKontak: optStr,
  items: z.array(ResepItemInput).min(1, "Resep minimal berisi 1 obat"),
});
export type ResepOrderInput = z.infer<typeof ResepOrderInput>;
/** Bentuk pra-parse (field ber-default opsional) — dipakai pemanggil API/FE. */
export type ResepOrderBody = z.input<typeof ResepOrderInput>;

// ── Params batalkan order (POST /kunjungan/:id/resep/:resepId/cancel) ──────────
// `id` = kunjungan (dipakai ABAC careUnit route()), `resepId` = order yang dibatalkan.
export const ResepCancelParams = z.object({
  id: z.string().uuid("Kunjungan tidak valid"),
  resepId: z.string().uuid("Order resep tidak valid"),
});
export type ResepCancelParams = z.infer<typeof ResepCancelParams>;

// ── Param order Farmasi (POST /farmasi/resep/:id/receive|telaah|dispensing · GET /:id) ─────
//  Lintas-kunjungan (penunjang berdiri-sendiri), by order id.
export const FarmasiResepIdParam = z.object({
  id: z.string().uuid("Order resep tidak valid"),
});
export type FarmasiResepIdParam = z.infer<typeof FarmasiResepIdParam>;

// ── Body telaah resep (POST /farmasi/resep/:id/telaah) ─────────────────────────
//  Pengkajian resep PMK 72/2016 (administrasi/farmasetik/klinis) → snapshot QuestionnaireResponse-
//  ready (SatuSehat). `answers` = linkId→boolean per grup (faithful Questionnaire). `lulus*` =
//  ringkasan per-aspek. result Disetujui → status "Ditelaah" · Dikembalikan → "Dikembalikan".
const TelaahGroupAnswers = z.record(z.string(), z.boolean());

export const TelaahAnswers = z.object({
  administrasi: TelaahGroupAnswers.default({}),
  farmasetik: TelaahGroupAnswers.default({}),
  klinis: TelaahGroupAnswers.default({}),
});
export type TelaahAnswers = z.infer<typeof TelaahAnswers>;

export const TelaahSubstitusiItem = z.object({
  itemId: z.string(),
  namaAsli: z.string(),
  namaGenerik: z.string(),
  alasan: optStr,
});
export type TelaahSubstitusiItem = z.infer<typeof TelaahSubstitusiItem>;

export const FarmasiTelaahInput = z.object({
  result: z.enum(["Disetujui", "Dikembalikan"]),
  alasanKembali: optStr,
  catatan: optStr,
  apoteker: optStr,                          // kosong → nama actor (server)
  answers: TelaahAnswers.default({ administrasi: {}, farmasetik: {}, klinis: {} }),
  lulusAdministrasi: z.boolean().default(false),
  lulusFarmasetik: z.boolean().default(false),
  lulusKlinis: z.boolean().default(false),
  substitusi: z.array(TelaahSubstitusiItem).optional(),
  justifikasiNonFormularium: z.record(z.string(), z.string()).optional(),
  lasaKonfirmasi: z.boolean().optional(),
});
export type FarmasiTelaahInput = z.infer<typeof FarmasiTelaahInput>;
export type FarmasiTelaahBody = z.input<typeof FarmasiTelaahInput>;

// ── Body dispensing & serah (POST /farmasi/resep/:id/dispensing) ───────────────
//  SNARS PKPO 5/6 · MedicationDispense-ready. Item yang diserahkan = ResepItem order (tanpa
//  LOT/ED). edukasi = item edukasi pasien diberikan. apoteker kosong → nama actor (server).
export const FarmasiDispensingInput = z.object({
  edukasi: z.array(z.string()).default([]),
  semuaLabelDicetak: z.boolean().default(false),
  lasaKonfirmasi: z.boolean().optional(),
  petugas2Nar: optStr,
  narDoubleCheck: z.boolean().optional(),
  apoteker: optStr,
});
export type FarmasiDispensingInput = z.infer<typeof FarmasiDispensingInput>;
export type FarmasiDispensingBody = z.input<typeof FarmasiDispensingInput>;

// ── DTO dispensing (snapshot tersimpan) ────────────────────────────────────────
export interface ResepDispensingDTO {
  id: string;
  edukasi: string[];
  semuaLabelDicetak: boolean;
  lasaKonfirmasi: boolean | null;
  petugas2Nar: string | null;
  narDoubleCheck: boolean | null;
  apoteker: string;
  createdAt: string; // ISO
}

// ── DTO telaah (snapshot tersimpan) ────────────────────────────────────────────
export interface ResepTelaahDTO {
  id: string;
  hasil: string; // Disetujui / Dikembalikan
  alasanKembali: string | null;
  catatan: string | null;
  lulusAdministrasi: boolean;
  lulusFarmasetik: boolean;
  lulusKlinis: boolean;
  answers: TelaahAnswers;
  substitusi: TelaahSubstitusiItem[] | null;
  justifikasiNonFormularium: Record<string, string> | null;
  lasaKonfirmasi: boolean | null;
  apoteker: string;
  createdAt: string; // ISO
}

// ── Farmasi worklist query (GET /farmasi/resep) ───────────────────────────────
export const FarmasiResepQuery = z.object({
  depoKode: z.string().trim().optional(),
  status: z.string().trim().optional(),
  noRM: z.string().trim().optional(), // filter riwayat per pasien (lintas-kunjungan, semua status)
});
export type FarmasiResepQuery = z.infer<typeof FarmasiResepQuery>;

// ── DTO (response) — mirror vocab FE ──────────────────────────────────────────
export interface ResepItemDTO {
  id: string;
  kodeObat: string;
  namaObat: string;
  bzaKode: string | null;
  dosis: string | null;
  dosisSekali: string | null;
  signa: string | null;
  jumlah: number;
  rute: string | null;
  aturanPakai: string | null;
  kategori: string;
  durasiHari: number;
  keterangan: string | null;
  isHAM: boolean;
}

export interface ResepOrderDTO {
  id: string;
  kunjunganId: string;
  depoKode: string | null;
  depoNama: string;
  catatan: string | null;
  kondisiGinjal: string | null;
  kondisiMenyusui: string | null;
  kondisiKehamilan: string | null;
  prioritas: string;
  status: string;
  penulis: string;
  penulisKontak: string | null;
  /** TTE (Tanda Tangan Elektronik) — serial barcode + penanda tangan + waktu. null = belum/ tak ditandatangani. */
  tteToken: string | null;
  tteSignedBy: string | null;
  tteSignedAt: string | null; // ISO
  items: ResepItemDTO[];
  createdAt: string; // ISO
}

/** Order untuk worklist Farmasi — header + pasien (join kunjungan) + items + telaah terkini. */
export interface ResepOrderFarmasiDTO extends ResepOrderDTO {
  noOrder: string;     // = noKunjungan order ref (snapshot tampil)
  noRM: string;
  namaPasien: string;
  unit: string;        // "IGD" | "Rawat Inap" | "Rawat Jalan"
  telaah: ResepTelaahDTO | null;         // telaah terbaru (null = belum ditelaah)
  dispensing: ResepDispensingDTO | null; // dispensing terbaru (null = belum diserahkan)
}
