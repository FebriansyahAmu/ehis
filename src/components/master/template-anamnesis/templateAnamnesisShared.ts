/**
 * UI helpers untuk Master Template Anamnesis.
 */

import { ClipboardList, Stethoscope, FileText, type LucideIcon } from "lucide-react";
import type { TemplateAnamnesisItem } from "@/lib/master/templateAnamnesisMock";

// ── Tab registry untuk Detail panel ──────────────────────

export type TemplateTabKey = "identitas" | "konten" | "preview";

export interface TemplateTabDef {
  key: TemplateTabKey;
  label: string;
  icon: LucideIcon;
  desc: string;
}

export const TEMPLATE_TABS: TemplateTabDef[] = [
  { key: "identitas", label: "Identitas",        icon: ClipboardList, desc: "Nama, kategori, context tag" },
  { key: "konten",    label: "Isi Anamnesis",    icon: Stethoscope,   desc: "Keluhan utama, RPS, status generalis" },
  { key: "preview",   label: "Preview & Catatan", icon: FileText,      desc: "Tampilan akhir & catatan perawat" },
];

// ── Tab completeness ──────────────────────────────────────

export function tabCompleteness(
  template: TemplateAnamnesisItem,
  tab: TemplateTabKey,
): "empty" | "partial" | "complete" {
  switch (tab) {
    case "identitas": {
      const filled = [
        template.label.trim() !== "",
        template.contextTags.length > 0,
      ].filter(Boolean).length;
      if (filled === 0) return "empty";
      if (filled < 2) return "partial";
      return "complete";
    }
    case "konten": {
      const filled = [
        template.keluhanUtama.trim() !== "",
        template.rps.trim() !== "",
        template.onsetDurasi.trim() !== "",
        template.statusGeneralis.trim() !== "",
      ].filter(Boolean).length;
      if (filled === 0) return "empty";
      if (filled < 3) return "partial";
      return "complete";
    }
    case "preview": {
      return template.catatanPerawat?.trim() ? "complete" : "partial";
    }
  }
}

export function getCompletenessBadge(state: "empty" | "partial" | "complete"): {
  cls: string;
  label: string;
} {
  if (state === "complete") return { cls: "bg-emerald-100 text-emerald-700", label: "✓" };
  if (state === "partial") return { cls: "bg-amber-100 text-amber-700", label: "•" };
  return { cls: "bg-slate-100 text-slate-400", label: "○" };
}
