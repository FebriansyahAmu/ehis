import {
  HeartPulse,
  LayoutDashboard,
  Database,
  ClipboardList,
  CreditCard,
  BarChart3,
  LayoutGrid,
  Siren,
  Stethoscope,
  BedDouble,
  Pill,
  FlaskConical,
  Radiation,
  Users,
  UserCog,
  UserPlus,
  Building2,
  Receipt,
  Wallet,
  TrendingUp,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: readonly NavItem[];
};

export type ModuleKey =
  | "care"
  | "dashboard"
  | "master"
  | "registration"
  | "billing"
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
  },
  {
    key: "dashboard",
    label: "EHIS Dashboard",
    desc: "Ringkasan operasional",
    href: "/ehis-dashboard",
    icon: LayoutDashboard,
    accent: { bg: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-100" },
  },
  {
    key: "master",
    label: "EHIS Master",
    desc: "Data master & referensi",
    href: "/ehis-master",
    icon: Database,
    accent: { bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100" },
  },
  {
    key: "registration",
    label: "EHIS Registration",
    desc: "Registrasi pasien",
    href: "/ehis-registration",
    icon: ClipboardList,
    accent: { bg: "bg-sky-50", text: "text-sky-600", ring: "ring-sky-100" },
  },
  {
    key: "billing",
    label: "EHIS Billing",
    desc: "Tagihan & pembayaran",
    href: "/ehis-billing",
    icon: CreditCard,
    accent: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100" },
  },
  {
    key: "report",
    label: "EHIS Report",
    desc: "Rekapitulasi & statistik",
    href: "/ehis-report",
    icon: BarChart3,
    accent: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
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
      { label: "IGD",         href: "/ehis-care/igd",         icon: Siren       },
      { label: "Rawat Jalan", href: "/ehis-care/rawat-jalan", icon: Stethoscope },
      { label: "Rawat Inap",  href: "/ehis-care/rawat-inap",  icon: BedDouble   },
    ],
  },
  {
    label: "Penunjang",
    items: [
      { label: "Farmasi",      href: "/ehis-care/farmasi",      icon: Pill         },
      { label: "Laboratorium", href: "/ehis-care/laboratorium", icon: FlaskConical },
      { label: "Radiologi",    href: "/ehis-care/radiologi",    icon: Radiation    },
    ],
  },
] as const;

export const dashboardNav: readonly NavGroup[] = [
  {
    label: "Utama",
    items: [{ label: "Ringkasan", href: "/ehis-dashboard", icon: LayoutDashboard }],
  },
] as const;

export const masterNav: readonly NavGroup[] = [
  {
    label: "Utama",
    items: [{ label: "Beranda", href: "/ehis-master", icon: LayoutGrid }],
  },
  {
    label: "Sumber Daya",
    items: [
      { label: "Pengguna", href: "/ehis-master/pengguna", icon: Users     },
      { label: "Dokter",   href: "/ehis-master/dokter",   icon: UserCog   },
      { label: "Ruangan",  href: "/ehis-master/ruangan",  icon: Building2 },
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
      { label: "Pasien",      href: "/ehis-registration/pasien",   icon: Users        },
      { label: "Antrian",     href: "/ehis-registration/antrian",  icon: CalendarDays },
      { label: "Pasien Baru", href: "/ehis-registration/baru",     icon: UserPlus     },
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
      { label: "Tagihan",    href: "/ehis-billing/tagihan",    icon: Receipt },
      { label: "Pembayaran", href: "/ehis-billing/pembayaran", icon: Wallet  },
    ],
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
      { label: "Harian",   href: "/ehis-report/harian",   icon: CalendarDays },
      { label: "Bulanan",  href: "/ehis-report/bulanan",  icon: TrendingUp   },
    ],
  },
] as const;

// ── Lookup helpers ────────────────────────────────────────

const NAV_MAP: Record<ModuleKey, readonly NavGroup[]> = {
  care: careNav,
  dashboard: dashboardNav,
  master: masterNav,
  registration: registrationNav,
  billing: billingNav,
  report: reportNav,
};

export function getNav(key: ModuleKey): readonly NavGroup[] {
  return NAV_MAP[key];
}
