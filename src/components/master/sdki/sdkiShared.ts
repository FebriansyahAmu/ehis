/**
 * UI helpers + tab registry untuk halaman master SDKI/SIKI/SLKI.
 * Data: `@/lib/master/sdkiMock.ts`.
 */

import {
  IdCard, ClipboardList, Workflow,
  HeartPulse, Brain, Activity, Users, Trees,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SdkiKategori, SdkiJenis } from "@/lib/master/sdkiMock";

// ── Tab Registry ─────────────────────────────────────────

export type SdkiTabKey = "identitas" | "klinis" | "intervensi";

export interface SdkiTabConfig {
  key: SdkiTabKey;
  label: string;
  icon: LucideIcon;
  desc: string;
  accentText: string;
}

export const SDKI_TABS: SdkiTabConfig[] = [
  { key: "identitas",  label: "Identitas",       icon: IdCard,        desc: "Kode, nama, kategori, penyebab",   accentText: "text-rose-700" },
  { key: "klinis",     label: "Data Klinis",     icon: ClipboardList, desc: "Data mayor & minor + SLKI hasil",  accentText: "text-sky-700"  },
  { key: "intervensi", label: "Intervensi SIKI", icon: Workflow,      desc: "Observasi · Terapeutik · Edukasi · Kolaborasi", accentText: "text-emerald-700" },
];

// ── Kategori config ──────────────────────────────────────

export interface KategoriCfg {
  label: string;
  icon: LucideIcon;
  bg: string;
  text: string;
  dot: string;
}

export const KATEGORI_CFG: Record<SdkiKategori, KategoriCfg> = {
  Fisiologis: { label: "Fisiologis", icon: HeartPulse, bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500"    },
  Psikologis: { label: "Psikologis", icon: Brain,      bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500"  },
  Perilaku:   { label: "Perilaku",   icon: Activity,   bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"   },
  Relasional: { label: "Relasional", icon: Users,      bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500"     },
  Lingkungan: { label: "Lingkungan", icon: Trees,      bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};

export const KATEGORI_LIST: SdkiKategori[] = [
  "Fisiologis", "Psikologis", "Perilaku", "Relasional", "Lingkungan",
];

// ── Jenis Diagnosa config ────────────────────────────────

export interface JenisCfg {
  label: string;
  bg: string;
  text: string;
}

export const JENIS_CFG: Record<SdkiJenis, JenisCfg> = {
  Aktual:             { label: "Aktual",              bg: "bg-rose-50",    text: "text-rose-700"    },
  Risiko:             { label: "Risiko",              bg: "bg-amber-50",   text: "text-amber-700"   },
  Promosi_Kesehatan:  { label: "Promosi Kesehatan",   bg: "bg-emerald-50", text: "text-emerald-700" },
};

export const JENIS_LIST: SdkiJenis[] = ["Aktual", "Risiko", "Promosi_Kesehatan"];

// ── Intervensi (SIKI) category config ────────────────────

export const SIKI_GROUPS = [
  { key: "observasi"  as const, label: "Observasi",   bg: "bg-sky-50",     text: "text-sky-700",     accent: "sky"     as const, hint: "Pengkajian, monitoring, identifikasi" },
  { key: "terapeutik" as const, label: "Terapeutik",  bg: "bg-emerald-50", text: "text-emerald-700", accent: "emerald" as const, hint: "Tindakan langsung pada pasien" },
  { key: "edukasi"    as const, label: "Edukasi",     bg: "bg-amber-50",   text: "text-amber-700",   accent: "amber"   as const, hint: "Penjelasan, anjuran, ajakan pembelajaran" },
  { key: "kolaborasi" as const, label: "Kolaborasi",  bg: "bg-violet-50",  text: "text-violet-700",  accent: "violet"  as const, hint: "Kerja sama dengan profesi/tim lain" },
] as const;
