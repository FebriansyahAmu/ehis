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

// ── Farmasi worklist query (GET /farmasi/resep) ───────────────────────────────
export const FarmasiResepQuery = z.object({
  depoKode: z.string().trim().optional(),
  status: z.string().trim().optional(),
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

/** Order untuk worklist Farmasi — header + pasien (join kunjungan) + items. */
export interface ResepOrderFarmasiDTO extends ResepOrderDTO {
  noOrder: string;     // = noKunjungan order ref (snapshot tampil)
  noRM: string;
  namaPasien: string;
  unit: string;        // "IGD" | "Rawat Inap" | "Rawat Jalan"
}
