// Zod schema + DTO — Surat Keterangan Sakit (tab Surat & Dokumen).
// `nomor` auto sistem (counter, Service) — TIDAK dikirim client. `tglSelesai` di-hitung
// SERVER dari tglMulai + lamaHari (anti-drift) — client mengirim tglMulai + lamaHari saja.
// Diagnosis = rahasia medis → `cantumkanDiagnosa` mengatur tampil/sembunyi di cetakan.

import { z } from "zod";

const TGL = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus YYYY-MM-DD");

// ── Tambah (POST /kunjungan/:id/surat-sakit) ───────────────────────────────────
export const SuratSakitInput = z.object({
  tglPeriksa: TGL,                                       // tanggal pemeriksaan
  tglMulai: TGL,                                         // mulai istirahat
  lamaHari: z.number().int().min(1, "Minimal 1 hari").max(365, "Maksimal 365 hari"),
  keperluan: z.string().trim().max(120).default(""),     // Istirahat Bekerja | Sekolah | Pemulihan | Lainnya
  diagnosa: z.string().trim().max(240).default(""),
  cantumkanDiagnosa: z.boolean().default(false),         // rahasia medis (default sembunyi)
  pekerjaan: z.string().trim().max(120).default(""),
  instansi: z.string().trim().max(160).default(""),      // ditujukan kepada (perusahaan/sekolah)
  catatan: z.string().trim().max(1000).default(""),
  dokterId: z.string().uuid().optional(),                // master.Dokter (pre-select)
  dokterNama: z.string().trim().max(160).default(""),
});
export type SuratSakitInput = z.infer<typeof SuratSakitInput>;

export const IdParam = z.object({ id: z.string().uuid() });
export const ItemParam = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });

// ── DTO ─────────────────────────────────────────────────────────────────────────
export interface SuratSakitDTO {
  id: string;
  nomor: string;             // SKS-<YYMM><NNN> (auto sistem)
  tglPeriksa: string;        // "YYYY-MM-DD"
  tglMulai: string;
  tglSelesai: string;        // server = mulai + lama - 1
  lamaHari: number;
  keperluan: string;
  diagnosa: string;
  cantumkanDiagnosa: boolean;
  pekerjaan: string;
  instansi: string;
  catatan: string;
  dokterId: string | null;
  dokterNama: string;
  pencatat: string;
  // ── TTE Dokter Pemeriksa (null = terbit tanpa TTE / dibuat non-Dokter) ──
  tteToken: string | null;   // serial TTE (di-encode jadi QR di cetakan)
  tteSignedBy: string | null;
  tteSignedAt: string | null; // ISO
  createdAt: string;         // ISO
}
