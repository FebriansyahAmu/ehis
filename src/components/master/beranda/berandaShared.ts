/**
 * Beranda Master — aggregator + types.
 *
 * Tidak boleh import seluruh modul mock besar di file ini supaya bundle ringan.
 * Cukup import array + length-nya saja (tree-shake friendly).
 *
 * Helpers ini menyediakan:
 *   - `getBerandaStats()` — angka realtime dari mock source-of-truth
 *   - `QUICK_NAV_GROUPS` — denormalisasi `masterNav` + accent + per-item count getter
 *   - `MAPPING_COVERAGE` — estimasi coverage matrix Mapping Hub
 *   - `RECENT_EDITS_MOCK` — feed audit aktivitas (mock sampai backend ready)
 */

import {
  Building2, UserCog, Users,
  Pill, Zap, TestTube, Radiation,
  Gauge, Activity, Microscope, Siren,
  BookText, ClipboardList, Workflow,
  Layers, MessageSquare, FileText,
  GraduationCap, LogOut, ClipboardCheck,
  Network, Tag, Wallet,
  Settings2, Landmark,
  ShieldCheck, BadgePercent, PackageSearch, Lock, Building,
  type LucideIcon,
} from "lucide-react";

import { PENGGUNA_MOCK } from "@/components/master/pengguna/penggunaShared";

// Master Dokter kini API-driven (lihat src/lib/api/dokter.ts) — beranda dashboard masih mock,
// pakai angka indikatif sampai KPI di-wire ke endpoint. TODO: ganti dgn count dari GET /master/dokter.
const DOKTER_COUNT = 4;
import { OBAT_MOCK } from "@/lib/master/obatMock";
import { TINDAKAN_MOCK } from "@/lib/master/tindakanMock";
import { LAB_KATALOG_MOCK } from "@/lib/master/labCatalogMock";
import { RAD_KATALOG_MOCK } from "@/lib/master/radCatalogMock";
import { ICD_MOCK } from "@/lib/master/icdMock";
import { ASESMEN_KATALOG_MOCK } from "@/lib/master/asesmenKatalogMock";
import { SDKI_MOCK } from "@/lib/master/sdkiMock";
import { SKALA_RISIKO_MOCK } from "@/lib/master/skalaRisikoMock";
import { SKALA_UMUM_MOCK } from "@/lib/master/skalaUmumMock";
import { SKALA_PENYAKIT_MOCK } from "@/lib/master/skalaPenyakitMock";
import { TRIASE_MOCK } from "@/lib/master/triaseMock";
import { STATUS_ENUM_GROUPS } from "@/lib/master/statusEnumMock";
import { TEMPLATE_ANAMNESIS_MOCK } from "@/lib/master/templateAnamnesisMock";
import { TEMPLATE_FORM_MOCK } from "@/lib/master/templateFormMock";
import { EDUKASI_COLLECTIONS } from "@/lib/master/edukasiMock";
import { OPERASIONAL_INITIAL_STATE } from "@/lib/master/operasionalKlinisMock";
import { TARIF_MOCK, PAKET_MOCK } from "@/lib/master/tarifMock";
import { PENJAMIN_INITIAL, MAPPING_INITIAL } from "@/lib/master/penjaminStore";
import { PPK_INITIAL } from "@/lib/master/ppkStore";

// ── Counts helper ────────────────────────────────────────

function dischargeCount(): number {
  // Aggregate 5 sub-koleksi discharge (homecare/alat/checklist/phase/risiko)
  // Tetap hard-coded karena tidak ada export array gabungan di mock.
  return 10 + 9 + 11 + 3 + 9;
}

function sumOperasional(): number {
  const s = OPERASIONAL_INITIAL_STATE;
  return s.cairan.length + s.dietTekstur.length + s.bundleHAI.length + s.penyakitIsolasi.length;
}

function sumEdukasi(): number {
  return EDUKASI_COLLECTIONS.reduce((a, c) => a + c.entries.length, 0);
}

function sumStatusEnum(): number {
  return STATUS_ENUM_GROUPS.reduce((a, g) => a + g.entries.length, 0);
}

// ── Public stats ─────────────────────────────────────────

export interface BerandaStats {
  sdm: number;        // dokter + pengguna
  katalog: number;    // obat + tindakan + lab + rad
  reference: number;  // icd + asesmen + sdki + skala risk/umum/penyakit + triase
  operasional: number;// tarif + paket + penjamin + ppk
  mapping: number;    // approx. avg coverage %
}

export function getBerandaStats(): BerandaStats {
  return {
    sdm:
      DOKTER_COUNT + PENGGUNA_MOCK.length,
    katalog:
      OBAT_MOCK.length + TINDAKAN_MOCK.length +
      LAB_KATALOG_MOCK.length + RAD_KATALOG_MOCK.length,
    reference:
      ICD_MOCK.length + ASESMEN_KATALOG_MOCK.length + SDKI_MOCK.length +
      SKALA_RISIKO_MOCK.length + SKALA_UMUM_MOCK.length +
      SKALA_PENYAKIT_MOCK.length + TRIASE_MOCK.length,
    operasional:
      TARIF_MOCK.length + PAKET_MOCK.length +
      PENJAMIN_INITIAL.length + PPK_INITIAL.length,
    mapping: 33, // computed avg from MAPPING_COVERAGE entries below
  };
}

// ── Quick-nav grouped structure ──────────────────────────

export type QuickNavTone =
  | "teal" | "sky" | "emerald" | "violet"
  | "rose" | "amber" | "pink" | "slate" | "indigo";

export interface QuickNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  count: number;
  /** Override sub-label (jika kosong, tampilkan "{count} entri"). */
  subLabel?: string;
}

export interface QuickNavGroup {
  label: string;
  tone: QuickNavTone;
  /** Caption singkat untuk grup. */
  desc: string;
  items: QuickNavItem[];
}

export function getQuickNavGroups(): QuickNavGroup[] {
  return [
    {
      label: "Sumber Daya",
      tone: "teal",
      desc: "Unit, dokter, dan pengguna sistem",
      items: [
        { label: "Unit & Ruangan", href: "/ehis-master/ruangan",  icon: Building2, count: 6, subLabel: "1 RS · 5 Unit" },
        { label: "Dokter & Nakes", href: "/ehis-master/dokter",   icon: UserCog,   count: DOKTER_COUNT },
        { label: "Pengguna",       href: "/ehis-master/pengguna", icon: Users,     count: PENGGUNA_MOCK.length },
      ],
    },
    {
      label: "Katalog Klinis",
      tone: "sky",
      desc: "Obat, tindakan, penunjang, dan kode diagnosa",
      items: [
        { label: "Katalog Obat",         href: "/ehis-master/katalog-obat",      icon: Pill,      count: OBAT_MOCK.length },
        { label: "Katalog Tindakan",     href: "/ehis-master/katalog-tindakan",  icon: Zap,       count: TINDAKAN_MOCK.length },
        { label: "Katalog Laboratorium", href: "/ehis-master/katalog-lab",       icon: TestTube,  count: LAB_KATALOG_MOCK.length },
        { label: "Katalog Radiologi",    href: "/ehis-master/katalog-radiologi", icon: Radiation, count: RAD_KATALOG_MOCK.length },
        { label: "ICD-10 & ICD-9",       href: "/ehis-master/icd",               icon: BookText,  count: ICD_MOCK.length },
        { label: "SDKI / SIKI / SLKI",   href: "/ehis-master/sdki",              icon: Workflow,  count: SDKI_MOCK.length },
      ],
    },
    {
      label: "Skala Klinis",
      tone: "violet",
      desc: "Instrumen skoring dan asesmen",
      items: [
        { label: "Skala Risiko",   href: "/ehis-master/skala-risiko",   icon: Gauge,      count: SKALA_RISIKO_MOCK.length },
        { label: "Skala Umum",     href: "/ehis-master/skala-umum",     icon: Activity,   count: SKALA_UMUM_MOCK.length },
        { label: "Skala Penyakit", href: "/ehis-master/skala-penyakit", icon: Microscope, count: SKALA_PENYAKIT_MOCK.length },
        { label: "Triase IGD",     href: "/ehis-master/triase-igd",     icon: Siren,      count: TRIASE_MOCK.length, subLabel: `${TRIASE_MOCK.length} protokol` },
      ],
    },
    {
      label: "Referensi",
      tone: "rose",
      desc: "Referensi asesmen klinis terstandar",
      items: [
        { label: "Asesmen Katalog", href: "/ehis-master/asesmen-katalog", icon: ClipboardList, count: ASESMEN_KATALOG_MOCK.length },
      ],
    },
    {
      label: "Template & Enum",
      tone: "indigo",
      desc: "Form, anamnesis, dan opsi terstandar",
      items: [
        { label: "Status Enum",        href: "/ehis-master/status-enum",        icon: Layers,        count: sumStatusEnum(), subLabel: `${STATUS_ENUM_GROUPS.length} grup` },
        { label: "Template Anamnesis", href: "/ehis-master/template-anamnesis", icon: MessageSquare, count: TEMPLATE_ANAMNESIS_MOCK.length },
        { label: "Template Form",      href: "/ehis-master/template-form",      icon: FileText,      count: TEMPLATE_FORM_MOCK.length },
      ],
    },
    {
      label: "Workflow Klinis",
      tone: "amber",
      desc: "Edukasi, discharge, dan SOP klinis",
      items: [
        { label: "Workflow Edukasi",     href: "/ehis-master/workflow-edukasi", icon: GraduationCap,  count: sumEdukasi() },
        { label: "Discharge Klasifikasi",href: "/ehis-master/discharge",        icon: LogOut,         count: dischargeCount() },
        { label: "Operasional Klinis",   href: "/ehis-master/operasional",      icon: ClipboardCheck, count: sumOperasional() },
      ],
    },
    {
      label: "Penugasan",
      tone: "emerald",
      desc: "Mapping hub terpadu antar master",
      items: [
        { label: "Mapping Hub", href: "/ehis-master/mapping", icon: Network, count: 8, subLabel: "8 sub-page" },
      ],
    },
    {
      label: "Operasional",
      tone: "pink",
      desc: "Tarif, penjamin, dan billing",
      items: [
        { label: "Tarif & Layanan",    href: "/ehis-master/tarif",    icon: Tag,    count: TARIF_MOCK.length + PAKET_MOCK.length, subLabel: `${TARIF_MOCK.length} tarif · ${PAKET_MOCK.length} paket` },
        { label: "Penjamin & Kontrak", href: "/ehis-master/penjamin", icon: Wallet, count: PENJAMIN_INITIAL.length },
      ],
    },
    {
      label: "Konfigurasi",
      tone: "slate",
      desc: "Profil RS dan faskes rujukan",
      items: [
        { label: "Profil RS",            href: "/ehis-master/profil-rs", icon: Settings2, count: 1, subLabel: "RSUD Sentra Medika" },
        { label: "Faskes Rujukan (PPK)", href: "/ehis-master/ppk",       icon: Landmark,  count: PPK_INITIAL.length },
      ],
    },
  ];
}

// ── Tone palette (purge-safe static) ─────────────────────

export const TONE_PALETTE: Record<QuickNavTone, {
  /** Ring tipis di card group header */
  ring: string;
  /** Soft bg untuk icon container */
  iconBg: string;
  /** Icon color */
  iconText: string;
  /** Group dot in eyebrow */
  dot: string;
  /** Hover state for nav card */
  cardHover: string;
  /** Count badge */
  badgeBg: string;
  badgeText: string;
}> = {
  teal:    { ring: "ring-teal-100",    iconBg: "bg-teal-50",    iconText: "text-teal-600",    dot: "bg-teal-500",    cardHover: "hover:border-teal-300",    badgeBg: "bg-teal-50",    badgeText: "text-teal-700"    },
  sky:     { ring: "ring-sky-100",     iconBg: "bg-sky-50",     iconText: "text-sky-600",     dot: "bg-sky-500",     cardHover: "hover:border-sky-300",     badgeBg: "bg-sky-50",     badgeText: "text-sky-700"     },
  emerald: { ring: "ring-emerald-100", iconBg: "bg-emerald-50", iconText: "text-emerald-600", dot: "bg-emerald-500", cardHover: "hover:border-emerald-300", badgeBg: "bg-emerald-50", badgeText: "text-emerald-700" },
  violet:  { ring: "ring-violet-100",  iconBg: "bg-violet-50",  iconText: "text-violet-600",  dot: "bg-violet-500",  cardHover: "hover:border-violet-300",  badgeBg: "bg-violet-50",  badgeText: "text-violet-700"  },
  rose:    { ring: "ring-rose-100",    iconBg: "bg-rose-50",    iconText: "text-rose-600",    dot: "bg-rose-500",    cardHover: "hover:border-rose-300",    badgeBg: "bg-rose-50",    badgeText: "text-rose-700"    },
  amber:   { ring: "ring-amber-100",   iconBg: "bg-amber-50",   iconText: "text-amber-600",   dot: "bg-amber-500",   cardHover: "hover:border-amber-300",   badgeBg: "bg-amber-50",   badgeText: "text-amber-700"   },
  pink:    { ring: "ring-pink-100",    iconBg: "bg-pink-50",    iconText: "text-pink-600",    dot: "bg-pink-500",    cardHover: "hover:border-pink-300",    badgeBg: "bg-pink-50",    badgeText: "text-pink-700"    },
  slate:   { ring: "ring-slate-100",   iconBg: "bg-slate-100",  iconText: "text-slate-600",   dot: "bg-slate-500",   cardHover: "hover:border-slate-300",   badgeBg: "bg-slate-100",  badgeText: "text-slate-700"   },
  indigo:  { ring: "ring-indigo-100",  iconBg: "bg-indigo-50",  iconText: "text-indigo-600",  dot: "bg-indigo-500",  cardHover: "hover:border-indigo-300",  badgeBg: "bg-indigo-50",  badgeText: "text-indigo-700"  },
};

// ── Mapping Coverage ─────────────────────────────────────

export interface MappingCoverageEntry {
  key: string;
  label: string;
  icon: LucideIcon;
  filled: number;
  total: number;
  /** href Mapping Hub sub-page (deep-link) */
  href: string;
}

export const MAPPING_COVERAGE: MappingCoverageEntry[] = [
  { key: "sdm",              label: "SDM Assignment",   icon: Users,         filled: 38,  total: 234,  href: "/ehis-master/mapping?sub=sdm" },
  { key: "kewenangan",       label: "Kewenangan Klinis",icon: ShieldCheck,   filled: 32,  total: 140,  href: "/ehis-master/mapping?sub=kewenangan" },
  { key: "layanan",          label: "Layanan Unit",     icon: Activity,      filled: 110, total: 490,  href: "/ehis-master/mapping?sub=layanan" },
  { key: "tarif",            label: "Tarif Matrix",     icon: BadgePercent,  filled: 612, total: 1470, href: "/ehis-master/mapping?sub=tarif" },
  { key: "formularium",      label: "Formularium",      icon: Pill,          filled: 720, total: 1260, href: "/ehis-master/mapping?sub=formularium" },
  { key: "distribusi",       label: "Distribusi Obat",  icon: PackageSearch, filled: 82,  total: 180,  href: "/ehis-master/mapping?sub=distribusi" },
  { key: "penjamin-ruangan", label: "Penjamin × Ruangan",icon: Building,     filled: MAPPING_INITIAL.length, total: 80, href: "/ehis-master/mapping?sub=penjamin-ruangan" },
  { key: "rbac",             label: "RBAC",             icon: Lock,          filled: 340, total: 1215, href: "/ehis-master/mapping?sub=rbac" },
];

export function getCoveragePercent(e: MappingCoverageEntry): number {
  return e.total === 0 ? 0 : Math.round((e.filled / e.total) * 100);
}

export function getCoverageTone(percent: number): "rose" | "amber" | "emerald" {
  if (percent < 25) return "rose";
  if (percent < 60) return "amber";
  return "emerald";
}

// ── Recent edits (mock) ──────────────────────────────────

export type EditAction = "Tambah" | "Edit" | "Hapus";

export interface RecentEditEntry {
  id: string;
  action: EditAction;
  entity: string;       // mis. "Katalog Obat"
  recordLabel: string;  // mis. "Paracetamol 500mg"
  by: string;           // username
  /** Detik dari sekarang (negatif). Akan diformat ke "X menit lalu". */
  agoSec: number;
  href?: string;
}

export const RECENT_EDITS_MOCK: RecentEditEntry[] = [
  { id: "e1", action: "Tambah", entity: "Operasional Klinis", recordLabel: "Penyakit Isolasi · MRSA",     by: "dr. Hendra W",  agoSec: -180,    href: "/ehis-master/operasional" },
  { id: "e2", action: "Edit",   entity: "Tarif & Layanan",    recordLabel: "Konsul Sp.JP — Kelas 1",      by: "billing-admin", agoSec: -540,    href: "/ehis-master/tarif" },
  { id: "e3", action: "Edit",   entity: "Mapping Hub · SDM",  recordLabel: "dr. Ahmad → Poli Penyakit Dalam", by: "hr-admin",   agoSec: -1620,   href: "/ehis-master/mapping?sub=sdm" },
  { id: "e4", action: "Tambah", entity: "Katalog Obat",       recordLabel: "Enoxaparin Inj 60mg/0.6ml",   by: "apotek-pic",    agoSec: -3540,   href: "/ehis-master/katalog-obat" },
  { id: "e5", action: "Edit",   entity: "Profil RS",          recordLabel: "Jam Shift Pagi 07:00 → 07:30",by: "rs-admin",      agoSec: -7200,   href: "/ehis-master/profil-rs" },
  { id: "e6", action: "Hapus",  entity: "Penjamin & Kontrak", recordLabel: "Astra Insurance (kontrak berakhir)", by: "billing-admin", agoSec: -14400,  href: "/ehis-master/penjamin" },
  { id: "e7", action: "Tambah", entity: "Template Form",      recordLabel: "QuickText /icd-pneumonia",     by: "dr. Budi S",    agoSec: -28800,  href: "/ehis-master/template-form" },
  { id: "e8", action: "Edit",   entity: "Skala Risiko",       recordLabel: "Morse Fall — interpretasi Tinggi ≥45", by: "perawat-icu", agoSec: -64800, href: "/ehis-master/skala-risiko" },
];

export const ACTION_CFG: Record<EditAction, { chip: string; iconCls: string; verb: string }> = {
  Tambah: { chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", iconCls: "text-emerald-600", verb: "menambah" },
  Edit:   { chip: "bg-sky-50 text-sky-700 ring-sky-200",             iconCls: "text-sky-600",     verb: "mengubah" },
  Hapus:  { chip: "bg-rose-50 text-rose-700 ring-rose-200",          iconCls: "text-rose-600",    verb: "menghapus" },
};

/** Format "X menit lalu" / "X jam lalu" / "X hari lalu". */
export function fmtAgo(sec: number): string {
  const abs = Math.abs(sec);
  if (abs < 60) return `${abs}d lalu`;
  if (abs < 3600) return `${Math.round(abs / 60)} mnt lalu`;
  if (abs < 86400) return `${Math.round(abs / 3600)} jam lalu`;
  return `${Math.round(abs / 86400)} hari lalu`;
}
