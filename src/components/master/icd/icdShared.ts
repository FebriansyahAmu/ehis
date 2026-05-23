/**
 * UI helpers untuk halaman master ICD-10 & ICD-9-CM.
 * Data: `@/lib/master/icdMock.ts`.
 */

import { BookText, Stethoscope } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { IcdJenis } from "@/lib/master/icdMock";

// ── Jenis config (untuk switcher di list) ────────────────

export interface JenisCfg {
  label: string;
  short: string;
  icon: LucideIcon;
  bg: string;
  text: string;
  dot: string;
  ring: string;
  desc: string;
}

export const JENIS_CFG: Record<IcdJenis, JenisCfg> = {
  "ICD-10": {
    label: "ICD-10 (Diagnosis)",
    short: "ICD-10",
    icon: BookText,
    bg: "bg-sky-50",
    text: "text-sky-700",
    dot: "bg-sky-500",
    ring: "ring-sky-200",
    desc: "Klasifikasi diagnosis penyakit & masalah kesehatan terkait (WHO)",
  },
  "ICD-9": {
    label: "ICD-9-CM (Prosedur)",
    short: "ICD-9",
    icon: Stethoscope,
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
    desc: "Klasifikasi prosedur klinis (clinical modification)",
  },
};

export const JENIS_LIST: IcdJenis[] = ["ICD-10", "ICD-9"];
