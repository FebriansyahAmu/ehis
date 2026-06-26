import type { LucideIcon } from "lucide-react";
import {
  Users, ShieldCheck, Activity, BadgePercent, Pill, Lock, Building, Stethoscope,
} from "lucide-react";

// ── Sub-page Registry ─────────────────────────────────────

export type SubpageKey =
  | "sdm"
  | "kewenangan"
  | "layanan"
  | "tarif"
  | "formularium"
  | "penjamin-ruangan"
  | "dpjp-bpjs"
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
    status: "ready",
    accent: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  },
  {
    key: "formularium",
    label: "Ketersediaan Farmasi",
    desc: "Obat & BMHP × Lokasi Farmasi",
    icon: Pill,
    status: "ready",
    accent: { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
  },
  {
    key: "penjamin-ruangan",
    label: "Penjamin × Ruangan",
    desc: "Kode SMF/Ruangan penjamin (BPJS V-Claim) → Ruangan RS",
    icon: Building,
    status: "ready",
    accent: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  },
  {
    key: "dpjp-bpjs",
    label: "DPJP BPJS",
    desc: "Dokter RS ↔ kode DPJP BPJS (V-Claim referensi dokter)",
    icon: Stethoscope,
    status: "ready",
    accent: { bg: "bg-cyan-50", text: "text-cyan-700", ring: "ring-cyan-200" },
  },
  {
    key: "rbac",
    label: "RBAC",
    desc: "Role × Permission per modul",
    icon: Lock,
    status: "ready",
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
