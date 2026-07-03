// Zod schema + DTO — Discharge Planning step 3: Checklist Kesiapan H-1 (SNARS ARK 3).
// Mirror DischargeChecklist FE (discharge/dischargeShared.ts) → zero-refactor wiring.
// Snapshot dokumen (items JSONB = SNAPSHOT penuh template + status), append-only
// "latest wins" per kunjungan (pola DischargeAsesmen). Draft parsial sah — kelengkapan
// poin wajib = urusan FE (isChecklistComplete). pencatat = actor login (Service).

import { z } from "zod";

// ── 1 item checklist (snapshot template + status konfirmasi) ───────────────────
export const ChecklistItemInput = z.object({
  id: z.string().trim().min(1).max(40),        // soft-ref template FE ("ck-01"…)
  label: z.string().trim().min(1).max(200),    // snapshot judul poin
  sublabel: z.string().trim().max(300).default(""),
  required: z.boolean().default(false),
  confirmed: z.boolean().default(false),
  catatan: z.string().trim().max(1000).default(""),
});
export type ChecklistItemInput = z.infer<typeof ChecklistItemInput>;

// ── Simpan (POST /kunjungan/:id/discharge/checklist) ───────────────────────────
export const DischargeChecklistInput = z.object({
  items: z.array(ChecklistItemInput).max(50).default([]),
  catatanKhusus: z.string().trim().max(2000).default(""),
});
export type DischargeChecklistInput = z.infer<typeof DischargeChecklistInput>;

export const IdParam = z.object({ id: z.string().uuid() });

// ── DTO (mirror DischargeChecklist FE + meta pencatat) ─────────────────────────
export interface DischargeChecklistDTO {
  items: ChecklistItemInput[];
  catatanKhusus: string;
  /** Meta revisi terakhir (latest-wins). */
  pencatat: string;
  updatedAt: string; // ISO
}
