// Zod input + DTO — Rencana Asuhan Terintegrasi / RAT (tab Rencana Asuhan, SNARS PP 1 & PP 2).
// Model Goal-centric & PROBLEM-ORIENTED: parent MASALAH (boleh di-link Diagnosa/SDKI via
// sumber+refKode → anti-redundan) + anak GOAL terukur per PPA. Input pakai OPTIONAL murni
// (partial PATCH rapi); normalisasi (trim/default) di Service. DTO mirror bentuk FE (tanggal = ISO).

import { z } from "zod";

// ── Vocab terkontrol ──────────────────────────────────────────────────────────
export const SumberEnum = z.enum(["Diagnosa", "Keperawatan", "Manual"]);
export const FaseEnum = z.enum(["Admisi", "Perawatan", "Pre_Discharge"]);
export const PrioritasEnum = z.enum(["Tinggi", "Sedang", "Rendah"]);
export const MasalahStatusEnum = z.enum(["Aktif", "Teratasi", "Batal"]);
export const PpaEnum = z.enum([
  "DPJP", "Perawat", "Apoteker", "Dietisien", "Fisioterapis", "Lainnya",
]);
export const GoalStatusEnum = z.enum(["Belum_Tercapai", "Tercapai_Sebagian", "Tercapai"]);

export type SumberDTO = z.infer<typeof SumberEnum>;
export type FaseDTO = z.infer<typeof FaseEnum>;
export type PrioritasDTO = z.infer<typeof PrioritasEnum>;
export type MasalahStatusDTO = z.infer<typeof MasalahStatusEnum>;
export type PpaDTO = z.infer<typeof PpaEnum>;
export type GoalStatusDTO = z.infer<typeof GoalStatusEnum>;

const optStr = z.string().trim().optional();
const strArr = z.array(z.string()).optional();

// ── Goal (anak) ───────────────────────────────────────────────────────────────
export const GoalInput = z.object({
  ppa: PpaEnum,
  target: z.string().trim().min(1, "Target outcome wajib").max(1000),
  indikator: optStr,
  targetWaktu: optStr,
  intervensi: strArr,
  status: GoalStatusEnum.optional(),
  evaluasi: optStr,
  waktu: z.string().optional(), // ISO; default now di Service
  pencatat: optStr,              // default nama actor di Service
});
export type GoalInput = z.infer<typeof GoalInput>;

export const GoalUpdate = z.object({
  ppa: PpaEnum.optional(),
  target: z.string().trim().min(1).max(1000).optional(),
  indikator: optStr,
  targetWaktu: optStr,
  intervensi: strArr,
  status: GoalStatusEnum.optional(),
  evaluasi: optStr,
  waktu: z.string().optional(),
  pencatat: optStr,
});
export type GoalUpdate = z.infer<typeof GoalUpdate>;

// ── Masalah (parent) ──────────────────────────────────────────────────────────
export const MasalahInput = z.object({
  masalah: z.string().trim().min(1, "Masalah wajib").max(1000),
  sumber: SumberEnum.optional(),
  refKode: optStr,
  fase: FaseEnum.optional(),
  prioritas: PrioritasEnum.optional(),
  status: MasalahStatusEnum.optional(),
  tanggalInput: z.string().optional(), // ISO; default now di Service
  pencatat: optStr,                     // default nama actor di Service
  goals: z.array(GoalInput).optional(), // goal awal (dibuat bersama masalah dalam 1 tx)
});
export type MasalahInput = z.infer<typeof MasalahInput>;

export const MasalahUpdate = z.object({
  masalah: z.string().trim().min(1).max(1000).optional(),
  sumber: SumberEnum.optional(),
  refKode: optStr,
  fase: FaseEnum.optional(),
  prioritas: PrioritasEnum.optional(),
  status: MasalahStatusEnum.optional(),
  tanggalInput: z.string().optional(),
  pencatat: optStr,
  // Verifikasi (co-sign DPJP). verifiedAt di-set Service saat verified→true.
  verified: z.boolean().optional(),
  verifiedBy: optStr,
});
export type MasalahUpdate = z.infer<typeof MasalahUpdate>;

// ── Params ────────────────────────────────────────────────────────────────────
export const IdParam = z.object({ id: z.string().uuid() });
export const MasalahParam = z.object({ id: z.string().uuid(), masalahId: z.string().uuid() });
export type MasalahParam = z.infer<typeof MasalahParam>;
export const GoalParam = z.object({
  id: z.string().uuid(), masalahId: z.string().uuid(), goalId: z.string().uuid(),
});
export type GoalParam = z.infer<typeof GoalParam>;

// ── DTO (response) ──────────────────────────────────────────────────────────────
export interface CarePlanGoalDTO {
  id: string;
  ppa: PpaDTO;
  target: string;
  indikator: string;
  targetWaktu: string;
  intervensi: string[];
  status: GoalStatusDTO;
  evaluasi: string;
  waktu: string; // ISO
  pencatat: string;
}
export interface CarePlanMasalahDTO {
  id: string;
  masalah: string;
  sumber: SumberDTO;
  refKode: string;
  fase: FaseDTO | "";
  prioritas: PrioritasDTO | "";
  status: MasalahStatusDTO;
  goals: CarePlanGoalDTO[];
  tanggalInput: string; // ISO
  pencatat: string;
  verified: boolean;
  verifiedBy: string;
  verifiedAt: string; // ISO atau ""
}
