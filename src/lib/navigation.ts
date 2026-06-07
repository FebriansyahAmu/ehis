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
  UserPlus,
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

// ── Types ─────────────────────────────────────────────────

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Resource key (atau daftar) penggerak visibilitas. Terlihat bila `can(perm,"read")`
   *  untuk salah satunya. Tanpa perm = ikut visibilitas modul (mis. Beranda). */
  perm?: string | readonly string[];
};

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
    perms: [
      "master.ruangan", "master.dokter", "master.pegawai", "master.pengguna",
      "master.mapping", "master.penugasan-ruangan", "master.katalog", "master.tarif",
    ],
  },
  {
    key: "registration",
    label: "EHIS Registration",
    desc: "Registrasi pasien",
    href: "/ehis-registration",
    icon: ClipboardList,
    accent: { bg: "bg-sky-50", text: "text-sky-600", ring: "ring-sky-100" },
    perms: ["registration.pasien", "registration.kunjungan"],
  },
  {
    key: "antrian",
    label: "EHIS Antrean",
    desc: "Antrean online & onsite",
    href: "/ehis-antrian",
    icon: Ticket,
    accent: { bg: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-100" },
    // Antrean erat dgn registrasi → digerbang oleh izin pendaftaran kunjungan.
    perms: ["registration.kunjungan"],
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
      { label: "IGD", href: "/ehis-care/igd", icon: Siren, perm: "clinical.igd" },
      {
        label: "Rawat Jalan",
        href: "/ehis-care/rawat-jalan",
        icon: Stethoscope,
        perm: "clinical.rj",
      },
      { label: "Rawat Inap", href: "/ehis-care/rawat-inap", icon: BedDouble, perm: "clinical.ri" },
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

export const masterNav: readonly NavGroup[] = [
  {
    label: "Utama",
    items: [{ label: "Beranda", href: "/ehis-master", icon: LayoutGrid }],
  },
  {
    label: "Sumber Daya",
    items: [
      {
        label: "Unit & Ruangan",
        href: "/ehis-master/ruangan",
        icon: Building2,
      },
      { label: "Dokter & Nakes", href: "/ehis-master/dokter", icon: UserCog },
      { label: "Jadwal Dokter", href: "/ehis-master/jadwal-dokter", icon: CalendarDays },
      { label: "Pengguna", href: "/ehis-master/pengguna", icon: Users },
    ],
  },
  {
    label: "Katalog Klinis",
    items: [
      { label: "Katalog Obat", href: "/ehis-master/katalog-obat", icon: Pill },
      {
        label: "Katalog Tindakan",
        href: "/ehis-master/katalog-tindakan",
        icon: Zap,
      },
      {
        label: "Katalog Laboratorium",
        href: "/ehis-master/katalog-lab",
        icon: TestTube,
      },
      {
        label: "Katalog Radiologi",
        href: "/ehis-master/katalog-radiologi",
        icon: Radiation,
      },
      { label: "ICD-10 & ICD-9", href: "/ehis-master/icd", icon: BookText },
      {
        label: "SDKI / SIKI / SLKI",
        href: "/ehis-master/sdki",
        icon: Workflow,
      },
    ],
  },
  {
    label: "Skala Klinis",
    items: [
      { label: "Skala Risiko", href: "/ehis-master/skala-risiko", icon: Gauge },
      { label: "Skala Umum", href: "/ehis-master/skala-umum", icon: Activity },
      {
        label: "Skala Penyakit",
        href: "/ehis-master/skala-penyakit",
        icon: Microscope,
      },
      { label: "Triase IGD", href: "/ehis-master/triase-igd", icon: Siren },
    ],
  },
  {
    label: "Referensi",
    items: [
      {
        label: "Asesmen Katalog",
        href: "/ehis-master/asesmen-katalog",
        icon: ClipboardList,
      },
    ],
  },
  {
    label: "Template & Enum",
    items: [
      { label: "Status Enum", href: "/ehis-master/status-enum", icon: Layers },
      {
        label: "Template Anamnesis",
        href: "/ehis-master/template-anamnesis",
        icon: MessageSquare,
      },
      {
        label: "Template Form",
        href: "/ehis-master/template-form",
        icon: FileText,
      },
    ],
  },
  {
    label: "Workflow Klinis",
    items: [
      {
        label: "Workflow Edukasi",
        href: "/ehis-master/workflow-edukasi",
        icon: GraduationCap,
      },
      {
        label: "Discharge Klasifikasi",
        href: "/ehis-master/discharge",
        icon: LogOut,
      },
      {
        label: "Operasional Klinis",
        href: "/ehis-master/operasional",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    label: "Penugasan",
    items: [
      { label: "Mapping Hub", href: "/ehis-master/mapping", icon: Network },
    ],
  },
  {
    label: "Operasional",
    items: [
      { label: "Tarif & Layanan", href: "/ehis-master/tarif", icon: Tag },
      {
        label: "Penjamin & Kontrak",
        href: "/ehis-master/penjamin",
        icon: Wallet,
      },
    ],
  },
  {
    label: "Konfigurasi",
    items: [
      { label: "Profil RS", href: "/ehis-master/profil-rs", icon: Settings2 },
      {
        label: "Faskes Rujukan (PPK)",
        href: "/ehis-master/ppk",
        icon: Landmark,
      },
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

/** Item terlihat: tanpa perm = ikut modul; punya perm = bila salah satunya bisa di-read. */
export function navItemVisible(item: NavItem, can: Can): boolean {
  const ps = permList(item.perm);
  return ps.length === 0 || ps.some((p) => can(p, "read"));
}

/** Modul terlihat bila punya ≥1 izin read di `perms` (kosong = selalu). */
export function canSeeModule(mod: ModuleDescriptor, can: Can): boolean {
  return mod.perms.length === 0 || mod.perms.some((p) => can(p, "read"));
}

/** Filter nav: buang item tak berizin + group yang jadi kosong. */
export function visibleNav(groups: readonly NavGroup[], can: Can): NavGroup[] {
  return groups
    .map((g) => ({ ...g, items: g.items.filter((it) => navItemVisible(it, can)) }))
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
