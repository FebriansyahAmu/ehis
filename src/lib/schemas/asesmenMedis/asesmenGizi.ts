// Zod + DTO — Asesmen Medis · sub-menu Skrining Gizi (MUST). Append-only time-series:
// tiap simpan = 1 baris skrining (riwayat). Mirror GiziHistoryEntry + GiziState (GiziPane).
// Hanya 3 skor sumber jadi input; total & risiko = DERIVED di Service (tak disimpan).

import { z } from "zod";

const optStr = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

// Skor komponen MUST (0/1/2). akut hanya 0/2 di FE, tapi divalidasi rentang sama.
const Skor = z.number().int().min(0).max(2);

// ── Input (POST /kunjungan/:id/asesmen/gizi) ──────────────────────────────────
export const AsesmenGiziInput = z.object({
  skorBmi: Skor,
  skorBb: Skor,
  skorAkut: Skor,
  ahliGizi: optStr,
  catatan: optStr,
  tanggal: optStr, // tanggal skrining (date string), opsional
});
export type AsesmenGiziInput = z.infer<typeof AsesmenGiziInput>;

// Tingkat risiko MUST — selaras getGiziRiskKey (total>=2 high · 1 mid · 0 low).
export type GiziRiskKey = "low" | "mid" | "high";

// ── DTO (GET list) — mirror GiziHistoryEntry (scores + derived total/risk) ─────
export interface AsesmenGiziDTO {
  id: string;
  kunjunganId: string;
  scores: { bmi: number; bb: number; akut: number };
  total: number; // derived
  risk: GiziRiskKey; // derived
  ahliGizi: string | null;
  catatan: string | null;
  tanggal: string | null;
  petugas: string; // nama pencatat (dari user login)
  savedAt: string; // ISO = createdAt
  createdAt: string; // ISO
}
