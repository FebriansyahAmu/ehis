/**
 * UI helpers + kategori config untuk halaman master Asesmen Katalog.
 * Data: `@/lib/master/asesmenKatalogMock.ts`.
 */

import {
  IdCard, Tag,
  Utensils, ShieldAlert, Activity,
  History, AlertTriangle, Users, Cigarette, UsersRound, Heart, Baby,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AsesmenKategori } from "@/lib/master/asesmenKatalogMock";

// ── Tab Registry ─────────────────────────────────────────

export type AsesmenTabKey = "identitas";

export const ASESMEN_TABS = [
  { key: "identitas" as const, label: "Identitas", icon: IdCard, desc: "Kode, nama, kategori, deskripsi", accentText: "text-violet-700" },
];

// ── Kategori config ──────────────────────────────────────

export interface KategoriConfig {
  label: string;
  groupLabel: string;       // grouping di filter
  usage: string;            // keterangan "digunakan di mana" (pane + kontrol konsumen)
  icon: LucideIcon;
  bg: string;
  text: string;
  dot: string;
  ring: string;
}

export const KATEGORI_CFG: Record<AsesmenKategori, KategoriConfig> = {
  AllergenMakanan:  { label: "Allergen · Makanan",  groupLabel: "Alergi",        usage: "AllergyPane (sub-tab Alergi) — opsi allergen kategori Makanan",       icon: Utensils,      bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500",  ring: "ring-orange-200" },
  AllergenLainnya:  { label: "Allergen · Lainnya",  groupLabel: "Alergi",        usage: "AllergyPane (sub-tab Alergi) — opsi allergen kategori Lainnya",       icon: ShieldAlert,   bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-500",    ring: "ring-teal-200"   },
  ReaksiAlergi:     { label: "Reaksi Alergi",       groupLabel: "Alergi",        usage: "AllergyPane (sub-tab Alergi) — daftar reaksi alergi + severity default", icon: Activity,      bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500",    ring: "ring-rose-200"   },
  PenyakitDahulu:   { label: "Penyakit Dahulu",     groupLabel: "Riwayat Medis", usage: "RiwayatPane (sub-tab Riwayat Medis) — Riwayat Penyakit Dahulu",       icon: History,       bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   ring: "ring-amber-200"  },
  PenyakitBeresiko: { label: "Penyakit Beresiko",   groupLabel: "Riwayat Medis", usage: "RiwayatPane (sub-tab Riwayat Medis) — Penyakit Berisiko",             icon: AlertTriangle, bg: "bg-yellow-50",  text: "text-yellow-700",  dot: "bg-yellow-500",  ring: "ring-yellow-200" },
  PenyakitKeluarga: { label: "Penyakit Keluarga",   groupLabel: "Riwayat Medis", usage: "RiwayatPane (sub-tab Riwayat Medis) — Riwayat Penyakit Keluarga",     icon: UsersRound,    bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500",     ring: "ring-sky-200"    },
  PerilakuBeresiko: { label: "Perilaku Beresiko",   groupLabel: "Riwayat Medis", usage: "RiwayatPane (sub-tab Riwayat Medis) — Perilaku Berisiko",             icon: Cigarette,     bg: "bg-slate-100",  text: "text-slate-700",   dot: "bg-slate-500",   ring: "ring-slate-200"  },
  AnggotaKeluarga:  { label: "Anggota Keluarga",    groupLabel: "Riwayat Medis", usage: "RiwayatPane (sub-tab Riwayat Medis) — pilihan anggota keluarga",      icon: Users,         bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200"},
  MetodeKB:         { label: "Metode KB",           groupLabel: "Riwayat Medis", usage: "RiwayatPane (sub-tab Riwayat Medis) — Riwayat Obstetri: Metode KB",   icon: Heart,         bg: "bg-pink-50",    text: "text-pink-700",    dot: "bg-pink-500",    ring: "ring-pink-200"   },
  JenisPersalinan:  { label: "Jenis Persalinan",    groupLabel: "Riwayat Medis", usage: "RiwayatPane (sub-tab Riwayat Medis) — Riwayat Obstetri: Jenis Persalinan", icon: Baby,      bg: "bg-fuchsia-50", text: "text-fuchsia-700", dot: "bg-fuchsia-500", ring: "ring-fuchsia-200"},
};

export const KATEGORI_ORDER: AsesmenKategori[] = [
  "AllergenMakanan", "AllergenLainnya", "ReaksiAlergi",
  "PenyakitDahulu", "PenyakitBeresiko", "PenyakitKeluarga", "PerilakuBeresiko",
  "AnggotaKeluarga", "MetodeKB", "JenisPersalinan",
];

/**
 * Grouping kategori untuk filter UI = berdasarkan SUB-TAB yang mengonsumsi items.
 * Mempermudah penyesuaian per konsumen (tambah item → langsung terlihat di grup pane-nya).
 *   • Alergi        → AllergyPane (sub-tab Alergi)
 *   • Riwayat Medis → RiwayatPane (sub-tab Riwayat Medis)
 */
export const KATEGORI_GROUPS: Array<{ label: string; sub: string; items: AsesmenKategori[] }> = [
  {
    label: "Sub-tab Alergi",
    sub: "AllergyPane",
    // Kategori Obat dihapus → allergen obat ditarik dari Katalog Obat (master.obat).
    items: ["AllergenMakanan", "AllergenLainnya", "ReaksiAlergi"],
  },
  {
    label: "Sub-tab Riwayat Medis",
    sub: "RiwayatPane",
    items: ["PenyakitDahulu", "PenyakitBeresiko", "PenyakitKeluarga", "PerilakuBeresiko", "AnggotaKeluarga", "MetodeKB", "JenisPersalinan"],
  },
];

// ── Severity (untuk reaksi alergi) ───────────────────────

import type { AsesmenSeverity } from "@/lib/master/asesmenKatalogMock";

export const SEVERITY_CFG: Record<AsesmenSeverity, { bg: string; text: string; ring: string }> = {
  Ringan: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  Sedang: { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200"   },
  Berat:  { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200"    },
};

export const SEVERITY_OPTS: AsesmenSeverity[] = ["Ringan", "Sedang", "Berat"];

// ── Re-export icon shorthand ─────────────────────────────

export { Tag };
