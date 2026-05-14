import type { LucideIcon } from "lucide-react";
import { AlertCircle, HeartPulse, LogOut } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

export type PhaseId     = "admisi" | "perawatan" | "discharge";
export type PhaseStatus = "belum"  | "berjalan"  | "selesai";

export interface MasalahEntry {
  id:    string;
  teks:  string;
  oleh:  string;
  waktu: string;
}

export interface PPASection {
  target:     string;
  intervensi: string;
}

export interface PhaseData {
  status:         PhaseStatus;
  tanggalMulai:   string;
  tanggalSelesai: string;
  dpjp:           PPASection;
  perawat:        PPASection;
  evaluasi:       string;
  updatedBy:      string;
}

export interface CarePlanData {
  masalahList:    MasalahEntry[];
  phases:         Record<PhaseId, PhaseData>;
  dpjpVerified:   boolean;
  dpjpVerifiedAt: string;
  dpjpVerifiedBy: string;
}

// ── Phase definitions ─────────────────────────────────────────

export interface PhaseDef {
  id:    PhaseId;
  label: string;
  desc:  string;
  icon:  LucideIcon;
  color: "sky" | "indigo" | "emerald";
}

export const PHASE_DEFS: PhaseDef[] = [
  {
    id:    "admisi",
    label: "Admisi / Akut",
    desc:  "Stabilisasi tanda vital & identifikasi seluruh masalah",
    icon:  AlertCircle,
    color: "sky",
  },
  {
    id:    "perawatan",
    label: "Perawatan / Intervensi",
    desc:  "Perbaikan klinis, edukasi pasien & keluarga",
    icon:  HeartPulse,
    color: "indigo",
  },
  {
    id:    "discharge",
    label: "Pre-Discharge",
    desc:  "Persiapan pulang, kemandirian ADL & rencana kontrol",
    icon:  LogOut,
    color: "emerald",
  },
];

// ── Status config ─────────────────────────────────────────────

export const STATUS_CFG = {
  belum:    { label: "Belum Mulai", cls: "bg-slate-100 text-slate-500"       },
  berjalan: { label: "Berjalan",    cls: "bg-sky-100 text-sky-700"           },
  selesai:  { label: "Selesai",     cls: "bg-emerald-100 text-emerald-700"   },
} satisfies Record<PhaseStatus, { label: string; cls: string }>;

// ── Factories ─────────────────────────────────────────────────

export function emptyPhase(): PhaseData {
  return {
    status:         "belum",
    tanggalMulai:   "",
    tanggalSelesai: "",
    dpjp:    { target: "", intervensi: "" },
    perawat: { target: "", intervensi: "" },
    evaluasi:  "",
    updatedBy: "",
  };
}

export function emptyCarePlan(): CarePlanData {
  return {
    masalahList: [],
    phases: {
      admisi:    emptyPhase(),
      perawatan: emptyPhase(),
      discharge: emptyPhase(),
    },
    dpjpVerified:   false,
    dpjpVerifiedAt: "",
    dpjpVerifiedBy: "",
  };
}
