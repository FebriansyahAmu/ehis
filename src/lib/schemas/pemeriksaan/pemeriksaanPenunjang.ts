// Zod input + DTO — Pemeriksaan Penunjang (tab Pemeriksaan, sub Penunjang). Diagnostik bedside
// NON-Lab/Rad (hasil interpretatif). Daftar hidup per-item: create (tambah) · soft-delete (hapus);
// tanpa update (koreksi = hapus + baris baru). Input pakai OPTIONAL murni; normalisasi/default di Service.

import { z } from "zod";

// ── Create (POST /kunjungan/:id/pemeriksaan-penunjang) ─────────────────────────
export const PemeriksaanPenunjangInput = z.object({
  jenis: z.string().trim().min(1, "Jenis wajib").max(100),
  keterangan: z.string().optional(),
  hasil: z.string().trim().min(1, "Hasil/interpretasi wajib").max(4000),
  kesimpulan: z.string().optional(),
  waktu: z.string().optional(), // ISO; default now() di Service bila kosong
  pemeriksa: z.string().trim().optional(),  // default nama actor di Service
});
export type PemeriksaanPenunjangInput = z.infer<typeof PemeriksaanPenunjangInput>;

export const IdParam = z.object({ id: z.string().uuid() });
export const ItemParam = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });
export type ItemParam = z.infer<typeof ItemParam>;

// ── DTO (response) — mirror HasilEntry FE (nama=keterangan) + waktu (tampilan TZ Asia/Jakarta) ──
export interface PemeriksaanPenunjangDTO {
  id: string;
  jenis: string;
  keterangan: string;
  hasil: string;
  kesimpulan: string;
  waktu: string;   // ISO ("" bila null) — prefill DateTimePicker
  tanggal: string; // "DD Mon YYYY" (TZ Asia/Jakarta) — tampilan
  jam: string;     // "HH:mm" (TZ Asia/Jakarta) — tampilan
}
