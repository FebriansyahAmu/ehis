/**
 * UI helpers + tab registry untuk halaman master Triase IGD.
 * Data: `@/lib/master/triaseMock.ts`.
 */

import { IdCard, Grid3X3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type TriaseTabKey = "identitas" | "matrix";

export interface TriaseTabConfig {
  key: TriaseTabKey;
  label: string;
  icon: LucideIcon;
  desc: string;
  accentText: string;
}

export const TRIASE_TABS: TriaseTabConfig[] = [
  { key: "identitas", label: "Identitas", icon: IdCard,    desc: "Kode, nama, protokol referensi",       accentText: "text-amber-700" },
  { key: "matrix",    label: "Matrix Triase", icon: Grid3X3, desc: "Level (kolom) × parameter (baris) editable inline", accentText: "text-rose-700" },
];
