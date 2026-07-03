// Zod schema + DTO — Jadwal Kontrol Poliklinik (tab Pasien Pulang RI, sub Obat & Jadwal).
// `nomor` auto sistem (counter, Service) — TIDAK dikirim client. `kodeDokter` di-resolve
// SERVER dari bpjs.DpjpMapping via dokterId (anti-spoof) — TIDAK diterima dari client.
// `bpjs=true` → Service memanggil V-Claim RencanaKontrol/insert → `noReferensi` = noSuratKontrol.

import { z } from "zod";

const TGL = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus YYYY-MM-DD");

// ── Tambah (POST /kunjungan/:id/jadwal-kontrol) ────────────────────────────────
export const JadwalKontrolInput = z.object({
  tanggal: TGL, // tglRencanaKontrol
  poliNama: z.string().trim().min(1, "Poliklinik wajib").max(120),
  poliKontrol: z.string().trim().max(10).default(""), // kode poli BPJS
  dokterId: z.string().uuid().optional(),             // master.Dokter → resolve kode DPJP
  dokterNama: z.string().trim().max(160).default(""),
  catatan: z.string().trim().max(1000).default(""),
  /** true = pasien BPJS → kirim RencanaKontrol/insert (wajib noSep + dokter ter-map + poliKontrol). */
  bpjs: z.boolean().default(false),
  noSep: z.string().trim().max(30).default(""),
});
export type JadwalKontrolInput = z.infer<typeof JadwalKontrolInput>;

export const IdParam = z.object({ id: z.string().uuid() });
export const ItemParam = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });

// ── DTO SEP terbit (GET /kunjungan/:id/sep-terbit — picker No. SEP) ─────────────
export interface SepTerbitDTO {
  noSep: string;
  tglSep: string;       // "YYYY-MM-DD"
  jenis: string;        // "Rawat Inap" | "Rawat Jalan"
  poliTujuan: string;   // "" bila tidak ada
  /** SEP milik kunjungan yang sedang dibuka (default pilihan). */
  kunjunganIni: boolean;
  createdAt: string;    // ISO — urut terbaru dulu
}

// ── DTO ─────────────────────────────────────────────────────────────────────────
export interface JadwalKontrolDTO {
  id: string;
  nomor: string;              // JK-<YYMM><NNN> (auto sistem)
  tanggal: string;
  poliNama: string;
  poliKontrol: string;
  dokterNama: string;
  kodeDokter: string;         // ter-embed payload (resolve server)
  catatan: string;
  noSep: string;
  noReferensi: string | null; // noSuratKontrol dari BPJS (null = non-BPJS)
  pencatat: string;
  createdAt: string;          // ISO
}
