import { LogIn, ArrowLeftRight, LogOut, type LucideIcon } from "lucide-react";

// ── Types ──────────────────────────────────────────────────

export type RekonContext = "igd" | "ri";
export type RekonPhase   = "admisi" | "transfer" | "discharge";
export type Keputusan    = "Lanjut" | "Stop" | "Sesuaikan" | "Tunda";

export interface ObatEntry {
  id:           string;
  namaObat:     string;
  dosis:        string;
  rute:         string;
  frekuensi:    string;
  sumber:       string;
  keputusan:    Keputusan;
  gantiDengan?: string;
  alasan?:      string;
  isHAM:        boolean;
}

export interface RekonData {
  selesai:  boolean;
  tanggal:  string;
  petugas:  string;
  obatList: ObatEntry[];
  catatan:  string;
}

export interface RekonPhaseDef {
  id:           RekonPhase;
  label:        string;
  desc:         string;
  Icon:         LucideIcon;
  iconColor:    string;
  accentBorder: string;
  accentBg:     string;
}

// ── Phase configs ──────────────────────────────────────────

export const REKON_PHASES: Record<RekonContext, RekonPhaseDef[]> = {
  igd: [
    {
      id: "admisi", label: "Rekonsiliasi Admisi",
      desc: "Obat yang dibawa pasien saat masuk IGD",
      Icon: LogIn, iconColor: "text-indigo-500",
      accentBorder: "border-l-indigo-400", accentBg: "bg-indigo-50/50",
    },
    {
      id: "transfer", label: "Rekonsiliasi Transfer",
      desc: "Obat saat transfer antar unit / bangsal",
      Icon: ArrowLeftRight, iconColor: "text-sky-500",
      accentBorder: "border-l-sky-400", accentBg: "bg-sky-50/50",
    },
    {
      id: "discharge", label: "Rekonsiliasi Discharge",
      desc: "Obat yang diberikan saat pasien pulang dari IGD",
      Icon: LogOut, iconColor: "text-emerald-500",
      accentBorder: "border-l-emerald-400", accentBg: "bg-emerald-50/50",
    },
  ],
  ri: [
    {
      id: "admisi", label: "Rekonsiliasi MRS",
      desc: "Obat dari rumah / IGD saat masuk rawat inap",
      Icon: LogIn, iconColor: "text-indigo-500",
      accentBorder: "border-l-indigo-400", accentBg: "bg-indigo-50/50",
    },
    {
      id: "transfer", label: "Rekonsiliasi Transfer",
      desc: "Obat saat pindah bangsal / unit perawatan",
      Icon: ArrowLeftRight, iconColor: "text-sky-500",
      accentBorder: "border-l-sky-400", accentBg: "bg-sky-50/50",
    },
    {
      id: "discharge", label: "Rekonsiliasi KLRS",
      desc: "Obat yang diberikan saat pasien keluar rawat inap",
      Icon: LogOut, iconColor: "text-emerald-500",
      accentBorder: "border-l-emerald-400", accentBg: "bg-emerald-50/50",
    },
  ],
};

// ── Status configs ─────────────────────────────────────────

export const KEPUTUSAN_CFG: Record<Keputusan, { cls: string; dot: string; label: string }> = {
  Lanjut:    { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-400", label: "Lanjutkan pengobatan"     },
  Stop:      { cls: "bg-rose-50    text-rose-700    ring-1 ring-rose-200",    dot: "bg-rose-400",    label: "Hentikan obat"            },
  Sesuaikan: { cls: "bg-amber-50   text-amber-700   ring-1 ring-amber-200",   dot: "bg-amber-400",   label: "Sesuaikan dosis / rute"   },
  Tunda:     { cls: "bg-slate-100  text-slate-600   ring-1 ring-slate-200",   dot: "bg-slate-300",   label: "Tunda — evaluasi ulang"   },
};

export const SUMBER_OPTS = ["Rumah", "IGD", "Rawat Jalan", "Lain-lain"] as const;
export const RUTE_OPTS   = ["Oral", "IV Bolus", "IV Drip", "IM", "SC", "Sublingual", "Inhalasi", "Topikal", "NGT"] as const;
export const KEPUTUSAN_OPTS: Keputusan[] = ["Lanjut", "Stop", "Sesuaikan", "Tunda"];

// ── Factories ──────────────────────────────────────────────

export function emptyEntry(): ObatEntry {
  return {
    id: `oe-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    namaObat: "", dosis: "", rute: "Oral", frekuensi: "",
    sumber: "Rumah", keputusan: "Lanjut", isHAM: false,
  };
}

export function emptyRekon(): RekonData {
  return { selesai: false, tanggal: "", petugas: "", obatList: [], catatan: "" };
}
