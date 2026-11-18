// Data Beranda EHIS Care (/ehis-care) — definisi kartu layanan + KPI ringkas.
// Angka masih CONTOH (belum terhubung data kunjungan/order) → halaman menampilkan badge "Data contoh".
// Kelas warna ditulis utuh (bukan dirangkai) agar terdeteksi Tailwind.

import {
  BedDouble,
  Clock,
  FlaskConical,
  Pill,
  Radiation,
  Siren,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { CareUnit } from "@/lib/auth/careUnit";

export type ServiceGroup = "pelayanan" | "penunjang";

export interface ServiceStat {
  label: string;
  value: number | string;
  /** Pembagi untuk nilai rasio (mis. 4 dari 12 bed) — ditampilkan "4/12". */
  of?: number;
  /** Perlu perhatian — ditandai ikon + teks, bukan warna saja. */
  alert?: boolean;
}

/** Nada warna per layanan. Fokus = cincin -600 (kontras ≥ 3:1 terhadap latar putih). */
export interface ServiceTone {
  tile: string;
  icon: string;
  hover: string;
  focus: string;
}

export interface ServiceDef {
  label: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  tone: ServiceTone;
  group: ServiceGroup;
  stats: readonly ServiceStat[];
  /** RBAC penggerak visibilitas (selaras careNav). Kartu tampil bila `can(perm,"read")`. */
  perm: string | readonly string[];
  /** Unit care (IGD/RI/RJ) — kartu hanya tampil bila user ter-assign ke unit itu (ABAC).
   *  Penunjang (Lab/Rad/Farmasi) tanpa careUnit (lintas-unit, digerakkan RBAC `ancillary.*`). */
  careUnit?: CareUnit;
}

export const SERVICE_GROUPS: readonly { key: ServiceGroup; label: string }[] = [
  { key: "pelayanan", label: "Pelayanan Klinis" },
  { key: "penunjang", label: "Penunjang Medis" },
];

export const SERVICES: readonly ServiceDef[] = [
  {
    label: "IGD",
    desc: "Pasien prioritas & triase real-time",
    href: "/ehis-care/igd",
    icon: Siren,
    tone: {
      tile: "bg-rose-50 text-rose-600 ring-rose-100",
      icon: "text-rose-600",
      hover: "has-[a:hover]:border-rose-300",
      focus: "has-[a:focus-visible]:ring-rose-600",
    },
    group: "pelayanan",
    stats: [
      { label: "Pasien aktif", value: 8 },
      { label: "P1 kritis", value: 2, alert: true },
      { label: "Bed tersedia", value: 4, of: 12 },
    ],
    perm: "clinical.igd",
    careUnit: "IGD",
  },
  {
    label: "Rawat Jalan",
    desc: "Antrean poliklinik & rekam medis kunjungan",
    href: "/ehis-care/rawat-jalan",
    icon: Stethoscope,
    tone: {
      tile: "bg-cyan-50 text-cyan-600 ring-cyan-100",
      icon: "text-cyan-600",
      hover: "has-[a:hover]:border-cyan-300",
      focus: "has-[a:focus-visible]:ring-cyan-600",
    },
    group: "pelayanan",
    stats: [
      { label: "Kunjungan", value: 136 },
      { label: "Antrean aktif", value: 24 },
      { label: "Poli buka", value: 8, of: 10 },
    ],
    perm: "clinical.rj",
    careUnit: "RawatJalan",
  },
  {
    label: "Rawat Inap",
    desc: "Census bangsal, bed & pemulangan",
    href: "/ehis-care/rawat-inap",
    icon: BedDouble,
    tone: {
      tile: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      icon: "text-emerald-600",
      hover: "has-[a:hover]:border-emerald-300",
      focus: "has-[a:focus-visible]:ring-emerald-600",
    },
    group: "pelayanan",
    stats: [
      { label: "Dirawat", value: 74 },
      { label: "Masuk hari ini", value: 6 },
      { label: "Bed kosong", value: 18, of: 92 },
    ],
    perm: "clinical.ri",
    careUnit: "RawatInap",
  },
  {
    label: "Farmasi",
    desc: "Telaah resep, dispensing & stok depo",
    href: "/ehis-care/farmasi",
    icon: Pill,
    tone: {
      tile: "bg-amber-50 text-amber-600 ring-amber-100",
      icon: "text-amber-600",
      hover: "has-[a:hover]:border-amber-300",
      focus: "has-[a:focus-visible]:ring-amber-600",
    },
    group: "penunjang",
    stats: [
      { label: "Resep menunggu", value: 12 },
      { label: "Selesai", value: 89 },
      { label: "Stok rendah", value: 3, alert: true },
    ],
    perm: ["ancillary.farmasi.telaah", "ancillary.farmasi.serah"],
  },
  {
    label: "Laboratorium",
    desc: "Order masuk, entry hasil & validasi",
    href: "/ehis-care/laboratorium",
    icon: FlaskConical,
    tone: {
      tile: "bg-teal-50 text-teal-600 ring-teal-100",
      icon: "text-teal-600",
      hover: "has-[a:hover]:border-teal-300",
      focus: "has-[a:focus-visible]:ring-teal-600",
    },
    group: "penunjang",
    stats: [
      { label: "Order menunggu", value: 18 },
      { label: "Hasil tersedia", value: 42 },
      { label: "Nilai kritis", value: 1, alert: true },
    ],
    perm: ["ancillary.lab.worklist", "ancillary.lab.validate", "ancillary.lab.critical"],
  },
  {
    label: "Radiologi",
    desc: "Order pencitraan, akuisisi & ekspertise",
    href: "/ehis-care/radiologi",
    icon: Radiation,
    tone: {
      tile: "bg-orange-50 text-orange-600 ring-orange-100",
      icon: "text-orange-600",
      hover: "has-[a:hover]:border-orange-300",
      focus: "has-[a:focus-visible]:ring-orange-600",
    },
    group: "penunjang",
    stats: [
      { label: "Order menunggu", value: 7 },
      { label: "Selesai", value: 31 },
      { label: "Rata-rata tunggu", value: "25 mnt" },
    ],
    perm: ["ancillary.rad.worklist", "ancillary.rad.expertise"],
  },
];

export interface KpiDef {
  label: string;
  value: number | string;
  of?: number;
  icon: LucideIcon;
  tile: string;
  /** Warna bar rasio (hanya bila `of` ada). */
  bar?: string;
}

export const KPIS: readonly KpiDef[] = [
  { label: "Total pasien", value: 248, icon: Users, tile: "bg-indigo-50 text-indigo-600" },
  { label: "Pasien IGD", value: 38, icon: Siren, tile: "bg-rose-50 text-rose-600" },
  { label: "Bed tersedia", value: 22, of: 104, icon: BedDouble, tile: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  { label: "Rata-rata tunggu", value: "42 mnt", icon: Clock, tile: "bg-amber-50 text-amber-600" },
];
