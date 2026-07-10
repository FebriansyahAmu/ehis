// Zod schema + DTO — Rujukan Eksternal / Rujukan Keluar (tab Disposisi RJ → Rujuk Eksternal).
// `nomor` (No. Rujukan {PPK}{MMYY}B{6}) auto sistem (counter, Service) — TIDAK dikirim client.
// `tglBerlakuKunjungan` (+90h) · `terbitAt` · `pencatat` di-isi SERVER. FE kirim isian form +
// nama-nama terselesaikan (faskes/poli/diagnosa) + snapshot peserta. `detail` = RujukanDetail
// (snapshot penuh) → sumber CETAK ULANG. BPJS issuance MOCK (belum cons-id prod).

import { z } from "zod";

const TGL = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus YYYY-MM-DD");
const KodeNama = z.object({
  kode: z.string().trim().max(40).default(""),
  nama: z.string().trim().max(240).default(""),
});

// ── Tambah (POST /kunjungan/:id/rujukan) ───────────────────────────────────────
export const RujukanEksternalInput = z.object({
  tglRujukan: TGL,
  tglRencanaKunjungan: TGL,
  jnsPelayanan: z.enum(["1", "2"]),            // 1 Rawat Inap · 2 Rawat Jalan
  tipeRujukan: z.enum(["0", "1", "2"]),        // 0 Penuh · 1 Partial · 2 Balik PRB
  catatan: z.string().trim().max(1000).default(""),
  asalRujukan: KodeNama,                        // faskes perujuk (RS kita)
  tujuanRujukan: KodeNama,                      // faskes tujuan (ppkDirujuk)
  poliTujuan: KodeNama,                         // poli tujuan (kosong utk PRB)
  diagnosa: KodeNama,                           // diagRujukan (ICD-10)
  peserta: z.object({
    nama: z.string().trim().max(160).default(""),
    noKartu: z.string().trim().max(40).default(""),
    noMr: z.string().trim().max(40).default(""),
    tglLahir: z.string().trim().max(40).default(""),
    kelamin: z.string().trim().max(20).default(""),
    jnsPeserta: z.string().trim().max(60).default(""),
  }),
  dokterPerujuk: z.string().trim().max(160).default(""),
  noSep: z.string().trim().max(40).optional(),
});
export type RujukanEksternalInput = z.infer<typeof RujukanEksternalInput>;

export const IdParam = z.object({ id: z.string().uuid() });
export const ItemParam = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });

// ── Snapshot penuh surat rujukan (detail JSONB) — kontrak CETAK (dipakai template A4) ──────
export interface RujukanDetail {
  noRujukan: string;
  tglRujukan: string;             // yyyy-MM-dd
  tglRencanaKunjungan: string;    // yyyy-MM-dd
  tglBerlakuKunjungan?: string;   // yyyy-MM-dd (masa berlaku, server +90h)
  jnsPelayanan: "1" | "2";
  tipeRujukan: "0" | "1" | "2";
  catatan?: string;
  asalRujukan: { kode: string; nama: string };
  tujuanRujukan: { kode: string; nama: string };
  poliTujuan: { kode: string; nama: string };
  diagnosa: { kode: string; nama: string };
  peserta: {
    nama: string;
    noKartu: string;
    noMr: string;
    tglLahir: string;
    kelamin: string;
    jnsPeserta: string;
  };
  dokterPerujuk: string;
  noSep?: string;
  terbitAt?: string;   // ISO (server)
  pencatat?: string;   // server-otoritatif
}

// ── DTO ─────────────────────────────────────────────────────────────────────────
export interface RujukanEksternalDTO {
  id: string;
  nomor: string;        // No. Rujukan (auto sistem)
  pencatat: string;
  createdAt: string;    // ISO
  detail: RujukanDetail; // snapshot penuh → cetak ulang
}
