import type { LucideIcon } from "lucide-react";
import {
  Users, ShieldCheck, Activity, BadgePercent, Pill, PackageSearch, Lock,
} from "lucide-react";

// ── Sub-page Registry ─────────────────────────────────────

export type SubpageKey =
  | "sdm"
  | "kewenangan"
  | "layanan"
  | "tarif"
  | "formularium"
  | "distribusi"
  | "rbac";

export type SubpageStatus = "ready" | "soon";

export interface SubpageConfig {
  key: SubpageKey;
  label: string;
  desc: string;
  icon: LucideIcon;
  status: SubpageStatus;
  /** Modul master lain yang harus selesai dulu (untuk badge dependsOn) */
  dependsOn?: string;
  /** Warna accent untuk active state */
  accent: { bg: string; text: string; ring: string };
}

export const SUBPAGE_REGISTRY: SubpageConfig[] = [
  {
    key: "sdm",
    label: "SDM Assignment",
    desc: "Dokter & Perawat → Unit / Poli",
    icon: Users,
    status: "ready",
    accent: { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200" },
  },
  {
    key: "kewenangan",
    label: "Kewenangan Klinis",
    desc: "Dokter ↔ Tindakan (SNARS PMK 755)",
    icon: ShieldCheck,
    status: "ready",
    accent: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  },
  {
    key: "layanan",
    label: "Layanan Unit",
    desc: "Tindakan ↔ Unit (lokasi pelaksanaan)",
    icon: Activity,
    status: "ready",
    accent: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  },
  {
    key: "tarif",
    label: "Tarif Matrix",
    desc: "Tindakan × Penjamin × Kelas → Harga",
    icon: BadgePercent,
    status: "soon",
    dependsOn: "Tarif + Penjamin",
    accent: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  },
  {
    key: "formularium",
    label: "Formularium",
    desc: "Obat × Kelas Penjamin → boleh/tidak",
    icon: Pill,
    status: "soon",
    dependsOn: "Katalog Obat + Penjamin",
    accent: { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
  },
  {
    key: "distribusi",
    label: "Distribusi Obat",
    desc: "Obat ↔ Depo Farmasi (stock & restock)",
    icon: PackageSearch,
    status: "soon",
    dependsOn: "Katalog Obat",
    accent: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  },
  {
    key: "rbac",
    label: "RBAC",
    desc: "Role × Permission per modul",
    icon: Lock,
    status: "soon",
    accent: { bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-200" },
  },
];

export function getSubpage(key: SubpageKey): SubpageConfig {
  const found = SUBPAGE_REGISTRY.find((s) => s.key === key);
  if (!found) throw new Error(`Unknown subpage: ${key}`);
  return found;
}

// ── Helpers ───────────────────────────────────────────────

export function makeInitials(name: string): string {
  return name
    .replace(/^dr\.\s+/i, "")
    .replace(/,.*$/, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}
