import type { LucideIcon } from "lucide-react";
import {
  Stethoscope, HeartPulse, Pill, Apple, Activity, UserCog,
} from "lucide-react";
import type { CarePlanMasalahDTO, MasalahInput, GoalInput } from "@/lib/api/carePlan/carePlan";
import type {
  CarePlanGoalDTO,
  PpaDTO, GoalStatusDTO, MasalahStatusDTO, SumberDTO, FaseDTO, PrioritasDTO,
} from "@/lib/schemas/carePlan/carePlan";

export type {
  CarePlanMasalahDTO, CarePlanGoalDTO, MasalahInput, GoalInput,
  PpaDTO, GoalStatusDTO, MasalahStatusDTO, SumberDTO, FaseDTO, PrioritasDTO,
};

// ── PPA (Profesional Pemberi Asuhan) — pemilik goal ───────────────────────────
export interface PpaDef { value: PpaDTO; label: string; icon: LucideIcon; cls: string; dot: string; }
export const PPA_DEFS: PpaDef[] = [
  { value: "DPJP",         label: "DPJP",         icon: Stethoscope, cls: "bg-blue-50 text-blue-700 border-blue-300", dot: "bg-blue-600" },
  { value: "Perawat",      label: "Perawat",      icon: HeartPulse,  cls: "bg-sky-50 text-sky-700 border-sky-200",          dot: "bg-sky-500"    },
  { value: "Apoteker",     label: "Apoteker",     icon: Pill,        cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  { value: "Dietisien",    label: "Dietisien",    icon: Apple,       cls: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-500"  },
  { value: "Fisioterapis", label: "Fisioterapis", icon: Activity,    cls: "bg-teal-50 text-teal-700 border-teal-200",       dot: "bg-teal-500"   },
  { value: "Lainnya",      label: "Lainnya",      icon: UserCog,     cls: "bg-slate-50 text-slate-600 border-slate-200",    dot: "bg-slate-400"  },
];
export const ppaDef = (v: string): PpaDef => PPA_DEFS.find((p) => p.value === v) ?? PPA_DEFS[5];

// ── Status goal (luaran ketercapaian) ─────────────────────────────────────────
export const GOAL_STATUS_CFG: Record<GoalStatusDTO, { label: string; cls: string; dot: string }> = {
  Belum_Tercapai:    { label: "Belum Tercapai",    cls: "bg-slate-100 text-slate-500",     dot: "bg-slate-400"   },
  Tercapai_Sebagian: { label: "Tercapai Sebagian", cls: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
  Tercapai:          { label: "Tercapai",          cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
};
export const GOAL_STATUS_OPTS: GoalStatusDTO[] = ["Belum_Tercapai", "Tercapai_Sebagian", "Tercapai"];

// ── Status masalah (problem-level) ────────────────────────────────────────────
export const MASALAH_STATUS_CFG: Record<MasalahStatusDTO, { label: string; cls: string }> = {
  Aktif:    { label: "Aktif",    cls: "bg-sky-100 text-sky-700"         },
  Teratasi: { label: "Teratasi", cls: "bg-emerald-100 text-emerald-700" },
  Batal:    { label: "Batal",    cls: "bg-slate-100 text-slate-400"     },
};
export const MASALAH_STATUS_OPTS: MasalahStatusDTO[] = ["Aktif", "Teratasi", "Batal"];

// ── Sumber masalah (asal — anti-redundan: link Diagnosa/SDKI) ──────────────────
export const SUMBER_CFG: Record<SumberDTO, { label: string; cls: string }> = {
  Diagnosa:    { label: "Diagnosa",    cls: "bg-rose-50 text-rose-600 border-rose-200"       },
  Keperawatan: { label: "Keperawatan", cls: "bg-sky-50 text-sky-600 border-sky-200"          },
  Manual:      { label: "Manual",      cls: "bg-slate-50 text-slate-500 border-slate-200"    },
};
export const SUMBER_OPTS: SumberDTO[] = ["Manual", "Diagnosa", "Keperawatan"];

// ── Fase (atribut opsional, bukan sumbu kaku) ─────────────────────────────────
export const FASE_CFG: Record<FaseDTO, { label: string; cls: string }> = {
  Admisi:        { label: "Admisi / Akut",  cls: "bg-sky-50 text-sky-600"         },
  Perawatan:     { label: "Perawatan",      cls: "bg-blue-50 text-blue-600"       },
  Pre_Discharge: { label: "Pre-Discharge",  cls: "bg-emerald-50 text-emerald-600" },
};
export const FASE_OPTS: FaseDTO[] = ["Admisi", "Perawatan", "Pre_Discharge"];

// ── Prioritas ─────────────────────────────────────────────────────────────────
export const PRIORITAS_CFG: Record<PrioritasDTO, { label: string; cls: string }> = {
  Tinggi: { label: "Tinggi", cls: "bg-rose-100 text-rose-700"   },
  Sedang: { label: "Sedang", cls: "bg-amber-100 text-amber-700" },
  Rendah: { label: "Rendah", cls: "bg-slate-100 text-slate-500" },
};
export const PRIORITAS_OPTS: PrioritasDTO[] = ["Tinggi", "Sedang", "Rendah"];

// ── Helpers ───────────────────────────────────────────────────────────────────
export function uid() { return crypto.randomUUID(); }

/** Agregat ketercapaian goal lintas masalah (untuk progress header). */
export function goalTally(list: CarePlanMasalahDTO[]) {
  let total = 0, tercapai = 0;
  for (const m of list) for (const g of m.goals) {
    total++;
    if (g.status === "Tercapai") tercapai++;
  }
  return { total, tercapai };
}

/** Masalah aktif yang BELUM diverifikasi DPJP (gate banner). */
export function unverifiedAktif(list: CarePlanMasalahDTO[]): number {
  return list.filter((m) => m.status === "Aktif" && !m.verified).length;
}

// ── Factory lokal (pasien demo non-UUID: state efemeral, tak persist) ──────────
export function localGoal(input: GoalInput, pencatat: string): CarePlanGoalDTO {
  return {
    id: uid(),
    ppa: input.ppa,
    target: input.target.trim(),
    indikator: input.indikator?.trim() ?? "",
    targetWaktu: input.targetWaktu?.trim() ?? "",
    intervensi: (input.intervensi ?? []).map((x) => x.trim()).filter(Boolean),
    status: input.status ?? "Belum_Tercapai",
    evaluasi: input.evaluasi?.trim() ?? "",
    waktu: input.waktu ?? new Date().toISOString(),
    pencatat,
  };
}
export function localMasalah(input: MasalahInput, pencatat: string): CarePlanMasalahDTO {
  return {
    id: uid(),
    masalah: input.masalah.trim(),
    sumber: input.sumber ?? "Manual",
    refKode: input.refKode?.trim() ?? "",
    fase: input.fase ?? "",
    prioritas: input.prioritas ?? "",
    status: input.status ?? "Aktif",
    goals: (input.goals ?? []).map((g) => localGoal(g, pencatat)),
    tanggalInput: input.tanggalInput ?? new Date().toISOString(),
    pencatat,
    verified: false,
    verifiedBy: "",
    verifiedAt: "",
  };
}
