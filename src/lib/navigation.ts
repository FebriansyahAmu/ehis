import {
  HeartPulse,
  LayoutDashboard,
  Database,
  ClipboardList,
  CreditCard,
  BarChart3,
  ShieldCheck,
  Inbox,
  Scale,
  ArrowDownUp,
  LayoutGrid,
  Siren,
  Stethoscope,
  BedDouble,
  Pill,
  FlaskConical,
  Radiation,
  Users,
  UserCog,
  Building2,
  Receipt,
  Wallet,
  TrendingUp,
  CalendarDays,
  Network,
  Zap,
  TestTube,
  Settings2,
  Landmark,
  Tag,
  Gauge,
  Activity,
  Microscope,
  BookText,
  Workflow,
  Layers,
  FileText,
  MessageSquare,
  GraduationCap,
  LogOut,
  ClipboardCheck,
  UserCheck,
  Share2,
  CalendarCheck,
  Bed,
  History,
  Ticket,
  ListChecks,
  SlidersHorizontal,
  BookMarked,
  MonitorPlay,
  type LucideIcon,
} from "lucide-react";
import type { CareUnit } from "@/lib/auth/careUnit";

// ── Types ─────────────────────────────────────────────────

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Resource key (atau daftar) penggerak visibilitas. Terlihat bila `can(perm,"read")`
   *  untuk salah satunya. Tanpa perm = ikut visibilitas modul (mis. Beranda). */
  perm?: string | readonly string[];
  /** Konteks unit care (IGD/RI/RJ) — item hanya tampil bila unit kerja user mencakupnya (ABAC). */
  careUnit?: CareUnit;
};

/** Scope ABAC untuk filter nav: unit kerja user + apakah dibebaskan (superuser/global). */
export interface NavScope {
  careUnits: readonly string[];
  unrestricted: boolean;
}

export type NavGroup = {
  label: string;
  items: readonly NavItem[];
};

/** Predikat izin (isomorphic: client SessionContext.can / server actor). */
export type Can = (resource: string, action: string) => boolean;

export type ModuleKey =
  | "care"
  | "dashboard"
  | "master"
  | "registration"
  | "antrian"
  | "billing"
  | "eklaim"
  | "bpjs"
  | "report";

export type ModuleDescriptor = {
  key: ModuleKey;
  label: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  accent: {
    bg: string;
    text: string;
    ring: string;
  };
  /** Resource key milik modul. Modul terlihat bila user punya `:read` ≥1 di antaranya
   *  (atau superuser). Kosong = selalu terlihat. */
  perms: readonly string[];
};

// ── Top-level modules (used by ModuleSwitcher) ────────────

export const MODULES: readonly ModuleDescriptor[] = [
  {
    key: "care",
    label: "EHIS Care",
    desc: "Pelayanan medis",
    href: "/ehis-care",
    icon: HeartPulse,
    accent: { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-100" },
    perms: [
      "clinical.igd", "clinical.ri", "clinical.rj", "clinical.cppt",
      "clinical.diagnosa", "clinical.tindakan", "clinical.resep",
      "ancillary.lab.worklist", "ancillary.lab.validate", "ancillary.lab.critical",
      "ancillary.rad.worklist", "ancillary.rad.expertise",
      "ancillary.farmasi.telaah", "ancillary.farmasi.serah",
    ],
  },
  {
    key: "dashboard",
    label: "EHIS Dashboard",
    desc: "Ringkasan operasional",
    href: "/ehis-dashboard",
    icon: LayoutDashboard,
    accent: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      ring: "ring-indigo-100",
    },
    perms: ["dashboard.view"],
  },
  {
    key: "master",
    label: "EHIS Master",
    desc: "Data master & referensi",
    href: "/ehis-master",
    icon: Database,
    accent: {
      bg: "bg-violet-50",
      text: "text-violet-600",
      ring: "ring-violet-100",
    },
    // Gate = `master.view` (visibilitas modul), TERPISAH dari permission DATA master.*.
    // Role klinis punya master.ruangan/master.dokter:read (resolve nama ruangan/DPJP) TAPI
    // bukan master.view → modul Master tetap tersembunyi & requireModule menolak via URL.
    perms: ["master.view"],
  },
  {
    key: "registration",
    label: "EHIS Registration",
    desc: "Registrasi pasien",
    href: "/ehis-registration",
    icon: ClipboardList,
    accent: { bg: "bg-sky-50", text: "text-sky-600", ring: "ring-sky-100" },
    // Gate = `registration.loket` (visibilitas modul), TERPISAH dari permission DATA.
    // Role klinis punya registration.pasien/kunjungan:read (baca rekam medis) TAPI bukan
    // loket → modul ini tetap tersembunyi & requireModule menolak akses langsung via URL.
    perms: ["registration.loket"],
  },
  {
    key: "antrian",
    label: "EHIS Antrean",
    desc: "Antrean online & onsite",
    href: "/ehis-antrian",
    icon: Ticket,
    accent: { bg: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-100" },
    // Antrean = klaster loket → gate `registration.loket` (sama dengan modul Registrasi).
    perms: ["registration.loket"],
  },
  {
    key: "billing",
    label: "EHIS Billing",
    desc: "Tagihan & pembayaran",
    href: "/ehis-billing",
    icon: CreditCard,
    accent: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      ring: "ring-amber-100",
    },
    perms: ["billing.invoice", "billing.kasir", "billing.klaim"],
  },
  {
    key: "eklaim",
    label: "EHIS E-Klaim",
    desc: "Klaim BPJS & Asuransi",
    href: "/ehis-eklaim",
    icon: ShieldCheck,
    accent: { bg: "bg-teal-50", text: "text-teal-600", ring: "ring-teal-100" },
    perms: ["billing.klaim"],
  },
  {
    key: "bpjs",
    label: "EHIS BPJS",
    desc: "Bridging WS BPJS",
    href: "/ehis-bpjs",
    icon: ShieldCheck,
    accent: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      ring: "ring-emerald-100",
    },
    perms: ["billing.klaim"],
  },
  {
    key: "report",
    label: "EHIS Report",
    desc: "Rekapitulasi & statistik",
    href: "/ehis-report",
    icon: BarChart3,
    accent: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      ring: "ring-emerald-100",
    },
    perms: ["report.clinical", "report.financial", "report.audit"],
  },
] as const;

export function getModule(key: ModuleKey): ModuleDescriptor {
  const mod = MODULES.find((m) => m.key === key);
  if (!mod) throw new Error(`Unknown module: ${key}`);
  return mod;
}

// ── Per-module sub-navigation ─────────────────────────────

export const careNav: readonly NavGroup[] = [
  {
    label: "Utama",
    items: [{ label: "Beranda", href: "/ehis-care", icon: LayoutGrid }],
  },
  {
    label: "Pelayanan",
    items: [
      { label: "IGD", href: "/ehis-care/igd", icon: Siren, perm: "clinical.igd", careUnit: "IGD" },
      {
        label: "Rawat Jalan",
        href: "/ehis-care/rawat-jalan",
        icon: Stethoscope,
        perm: "clinical.rj",
        careUnit: "RawatJalan",
      },
      { label: "Rawat Inap", href: "/ehis-care/rawat-inap", icon: BedDouble, perm: "clinical.ri", careUnit: "RawatInap" },
    ],
  },
  {
    label: "Penunjang",
    items: [
      { label: "Farmasi", href: "/ehis-care/farmasi", icon: Pill, perm: ["ancillary.farmasi.telaah", "ancillary.farmasi.serah"] },
      {
        label: "Laboratorium",
        href: "/ehis-care/laboratorium",
        icon: FlaskConical,
        perm: ["ancillary.lab.worklist", "ancillary.lab.validate", "ancillary.lab.critical"],
      },
      { label: "Radiologi", href: "/ehis-care/radiologi", icon: Radiation, perm: ["ancillary.rad.worklist", "ancillary.rad.expertise"] },
    ],
  },
] as const;

export const dashboardNav: readonly NavGroup[] = [
  {
    label: "Utama",
    items: [
      { label: "Ringkasan", href: "/ehis-dashboard", icon: LayoutDashboard },
    ],
  },
] as const;

// Tiap item ber-`perm` → di dalam modul Master, user hanya lihat menu sesuai izin fitur
// (mis. Apoteker hanya Katalog). Gate MODUL = `master.view` (terpisah). Halaman config
// sistem (Template/Enum/Workflow/Profil/PPK) → `master.konfigurasi` (Admin).
export const masterNav: readonly NavGroup[] = [
  {
    label: "Utama",
    items: [{ label: "Beranda", href: "/ehis-master", icon: LayoutGrid }],
  },
  {
    label: "Sumber Daya",
    items: [
      { label: "Unit & Ruangan", href: "/ehis-master/ruangan", icon: Building2, perm: "master.ruangan" },
      { label: "Dokter & Nakes", href: "/ehis-master/dokter", icon: UserCog, perm: "master.dokter" },
      { label: "Jadwal Dokter", href: "/ehis-master/jadwal-dokter", icon: CalendarDays, perm: "master.dokter" },
      { label: "Pengguna", href: "/ehis-master/pengguna", icon: Users, perm: "master.pengguna" },
    ],
  },
  {
    label: "Katalog Klinis",
    items: [
      { label: "Katalog Obat", href: "/ehis-master/katalog-obat", icon: Pill, perm: "master.katalog" },
      { label: "Katalog Tindakan", href: "/ehis-master/katalog-tindakan", icon: Zap, perm: "master.katalog" },
      { label: "Katalog Laboratorium", href: "/ehis-master/katalog-lab", icon: TestTube, perm: "master.katalog" },
      { label: "Katalog Radiologi", href: "/ehis-master/katalog-radiologi", icon: Radiation, perm: "master.katalog" },
      { label: "ICD-10 & ICD-9", href: "/ehis-master/icd", icon: BookText, perm: "master.icd" },
      { label: "SDKI / SIKI / SLKI", href: "/ehis-master/sdki", icon: Workflow, perm: "master.katalog" },
    ],
  },
  {
    label: "Skala Klinis",
    items: [
      { label: "Skala Risiko", href: "/ehis-master/skala-risiko", icon: Gauge, perm: "master.triase" },
      { label: "Skala Umum", href: "/ehis-master/skala-umum", icon: Activity, perm: "master.triase" },
      { label: "Skala Penyakit", href: "/ehis-master/skala-penyakit", icon: Microscope, perm: "master.triase" },
      { label: "Triase IGD", href: "/ehis-master/triase-igd", icon: Siren, perm: "master.triase" },
    ],
  },
  {
    label: "Referensi",
    items: [
      { label: "Asesmen Katalog", href: "/ehis-master/asesmen-katalog", icon: ClipboardList, perm: "master.katalog" },
    ],
  },
  {
    label: "Template & Enum",
    items: [
      { label: "Status Enum", href: "/ehis-master/status-enum", icon: Layers, perm: "master.konfigurasi" },
      { label: "Template Anamnesis", href: "/ehis-master/template-anamnesis", icon: MessageSquare, perm: "master.konfigurasi" },
      { label: "Template Form", href: "/ehis-master/template-form", icon: FileText, perm: "master.konfigurasi" },
    ],
  },
  {
    label: "Workflow Klinis",
    items: [
      { label: "Workflow Edukasi", href: "/ehis-master/workflow-edukasi", icon: GraduationCap, perm: "master.konfigurasi" },
      { label: "Discharge Klasifikasi", href: "/ehis-master/discharge", icon: LogOut, perm: "master.konfigurasi" },
      { label: "Operasional Klinis", href: "/ehis-master/operasional", icon: ClipboardCheck, perm: "master.konfigurasi" },
    ],
  },
  {
    label: "Penugasan",
    items: [
      { label: "Mapping Hub", href: "/ehis-master/mapping", icon: Network, perm: "master.mapping" },
    ],
  },
  {
    label: "Operasional",
    items: [
      { label: "Tarif & Layanan", href: "/ehis-master/tarif", icon: Tag, perm: "master.tarif" },
      { label: "Penjamin & Kontrak", href: "/ehis-master/penjamin", icon: Wallet, perm: "master.tarif" },
    ],
  },
  {
    label: "Konfigurasi",
    items: [
      { label: "Profil RS", href: "/ehis-master/profil-rs", icon: Settings2, perm: "master.konfigurasi" },
      { label: "Faskes Rujukan (PPK)", href: "/ehis-master/ppk", icon: Landmark, perm: "master.konfigurasi" },
    ],
  },
] as const;

export const registrationNav: readonly NavGroup[] = [
  {
    label: "Utama",
    items: [{ label: "Beranda", href: "/ehis-registration", icon: LayoutGrid }],
  },
  {
    label: "Loket",
    items: [
      { label: "Pasien", href: "/ehis-registration/pasien", icon: Users },
    ],
  },
] as const;

export const antrianNav: readonly NavGroup[] = [
  {
    label: "Utama",
    items: [{ label: "Beranda", href: "/ehis-antrian", icon: LayoutGrid }],
  },
  {
    label: "Operasional",
    items: [
      { label: "Antrean List", href: "/ehis-antrian/antrean", icon: ListChecks },
      { label: "Monitoring", href: "/ehis-antrian/monitoring", icon: Activity },
      { label: "Display", href: "/ehis-antrian/display", icon: MonitorPlay },
    ],
  },
  {
    label: "Konfigurasi",
    items: [
      { label: "Pengaturan", href: "/ehis-antrian/pengaturan", icon: SlidersHorizontal },
      { label: "Referensi", href: "/ehis-antrian/referensi", icon: BookMarked },
    ],
  },
] as const;

export const billingNav: readonly NavGroup[] = [
  {
    label: "Utama",
    items: [{ label: "Beranda", href: "/ehis-billing", icon: LayoutGrid }],
  },
  {
    label: "Transaksi",
    items: [
      { label: "Tagihan", href: "/ehis-billing/tagihan", icon: Receipt },
      { label: "Pembayaran", href: "/ehis-billing/pembayaran", icon: Wallet },
    ],
  },
] as const;

export const eklaimNav: readonly NavGroup[] = [
  {
    label: "Utama",
    items: [{ label: "Beranda", href: "/ehis-eklaim", icon: LayoutGrid }],
  },
  {
    label: "Klaim",
    items: [
      { label: "Klaim Board", href: "/ehis-eklaim/klaim", icon: Inbox },
      {
        label: "iDRG Calculator",
        href: "/ehis-eklaim/calculator",
        icon: Scale,
      },
      { label: "Banding", href: "/ehis-eklaim/banding", icon: FileText },
      {
        label: "Reconciliation",
        href: "/ehis-eklaim/reconciliation",
        icon: ArrowDownUp,
      },
    ],
  },
  {
    label: "Analitik",
    items: [
      {
        label: "Laporan Analitik",
        href: "/ehis-eklaim/report",
        icon: BarChart3,
      },
    ],
  },
] as const;

export const bpjsNav: readonly NavGroup[] = [
  {
    label: "Utama",
    items: [{ label: "Beranda", href: "/ehis-bpjs", icon: LayoutGrid }],
  },
  {
    label: "V-Claim",
    items: [
      {
        label: "Kepesertaan",
        href: "/ehis-bpjs/vclaim/kepesertaan",
        icon: UserCheck,
      },
      { label: "SEP", href: "/ehis-bpjs/vclaim/sep", icon: FileText },
      { label: "Rujukan", href: "/ehis-bpjs/vclaim/rujukan", icon: Share2 },
      {
        label: "Monitoring",
        href: "/ehis-bpjs/vclaim/monitoring",
        icon: Activity,
      },
      {
        label: "Rencana Kontrol",
        href: "/ehis-bpjs/vclaim/rencana-kontrol",
        icon: CalendarCheck,
      },
    ],
  },
  {
    label: "Aplicares",
    items: [
      {
        label: "Referensi Kamar",
        href: "/ehis-bpjs/aplicares/referensi-kamar",
        icon: BedDouble,
      },
      {
        label: "Map Kelas",
        href: "/ehis-bpjs/aplicares/map-kelas",
        icon: LayoutGrid,
      },
      {
        label: "Ketersediaan",
        href: "/ehis-bpjs/aplicares/ketersediaan",
        icon: Bed,
      },
    ],
  },
  {
    label: "Audit",
    items: [{ label: "Audit Trail", href: "/ehis-bpjs/audit", icon: History }],
  },
] as const;

export const reportNav: readonly NavGroup[] = [
  {
    label: "Utama",
    items: [{ label: "Beranda", href: "/ehis-report", icon: LayoutGrid }],
  },
  {
    label: "Periode",
    items: [
      { label: "Harian", href: "/ehis-report/harian", icon: CalendarDays },
      { label: "Bulanan", href: "/ehis-report/bulanan", icon: TrendingUp },
    ],
  },
] as const;

// ── Lookup helpers ────────────────────────────────────────

const NAV_MAP: Record<ModuleKey, readonly NavGroup[]> = {
  care: careNav,
  dashboard: dashboardNav,
  master: masterNav,
  registration: registrationNav,
  antrian: antrianNav,
  billing: billingNav,
  eklaim: eklaimNav,
  bpjs: bpjsNav,
  report: reportNav,
};

export function getNav(key: ModuleKey): readonly NavGroup[] {
  return NAV_MAP[key];
}

// ── Visibilitas berbasis izin (isomorphic) ────────────────
// Dipakai klien (Sidebar/ModuleSwitcher via SessionContext.can) & server (requireModule
// via actor). `can(r,"read")` = baseline "boleh lihat". Superuser → can() selalu true.

function permList(p?: string | readonly string[]): readonly string[] {
  return p == null ? [] : typeof p === "string" ? [p] : p;
}

/** Item terlihat: lolos RBAC (perm) DAN — bila ber-careUnit — unit kerja user mencakupnya
 *  (kecuali `scope.unrestricted`). Tanpa `scope` → careUnit diabaikan (mis. saat loading sesi). */
export function navItemVisible(item: NavItem, can: Can, scope?: NavScope): boolean {
  const ps = permList(item.perm);
  if (ps.length > 0 && !ps.some((p) => can(p, "read"))) return false;
  if (item.careUnit && scope && !scope.unrestricted && !scope.careUnits.includes(item.careUnit)) {
    return false;
  }
  return true;
}

/** Modul terlihat bila punya ≥1 izin read di `perms` (kosong = selalu). */
export function canSeeModule(mod: ModuleDescriptor, can: Can): boolean {
  return mod.perms.length === 0 || mod.perms.some((p) => can(p, "read"));
}

/** Bangun NavScope dari sesi/actor (unrestricted = superuser ATAU role global). */
export function navScopeFrom(s: { careUnits: readonly string[]; isSuperuser: boolean; isGlobal: boolean }): NavScope {
  return { careUnits: s.careUnits, unrestricted: s.isSuperuser || s.isGlobal };
}

/** Filter nav: buang item tak berizin / di luar unit kerja + group yang jadi kosong. */
export function visibleNav(groups: readonly NavGroup[], can: Can, scope?: NavScope): NavGroup[] {
  return groups
    .map((g) => ({ ...g, items: g.items.filter((it) => navItemVisible(it, can, scope)) }))
    .filter((g) => g.items.length > 0);
}

/** Modul-modul yang boleh dilihat user (urutan MODULES). */
export function visibleModules(can: Can): ModuleDescriptor[] {
  return MODULES.filter((m) => canSeeModule(m, can));
}

/** Halaman "rumah" aman saat akses ditolak: dashboard bila boleh, else modul pertama, else "/". */
export function homeHref(can: Can): string {
  const dash = MODULES.find((m) => m.key === "dashboard");
  if (dash && canSeeModule(dash, can)) return dash.href;
  return visibleModules(can)[0]?.href ?? "/";
}
