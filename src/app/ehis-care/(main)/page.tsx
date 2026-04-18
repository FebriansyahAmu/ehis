import Link from "next/link";
import type { Metadata } from "next";
import {
  Siren,
  Stethoscope,
  BedDouble,
  Pill,
  FlaskConical,
  Radiation,
  ArrowRight,
  Users,
  Clock,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pelayanan Medis" };

// ── Service definitions with live context ─────────────────

interface ServiceStat {
  label: string;
  value: string | number;
  alert?: boolean;
}

interface ServiceDef {
  label: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  accent: { bg: string; text: string; border: string; badge: string };
  stats: ServiceStat[];
  cta: string;
}

const SERVICES: ServiceDef[] = [
  {
    label: "IGD",
    desc: "Instalasi Gawat Darurat — monitoring pasien prioritas & triase real-time.",
    href: "/ehis-care/igd",
    icon: Siren,
    accent: {
      bg: "bg-rose-50",
      text: "text-rose-600",
      border: "border-rose-200 hover:border-rose-300",
      badge: "bg-rose-100 text-rose-700",
    },
    stats: [
      { label: "Pasien aktif", value: 8 },
      { label: "P1 Kritis", value: 2, alert: true },
      { label: "Bed tersedia", value: "4/12" },
    ],
    cta: "Buka IGD",
  },
  {
    label: "Rawat Jalan",
    desc: "Kunjungan poli klinik — jadwal, antrian, dan rekam medis pasien.",
    href: "/ehis-care/rawat-jalan",
    icon: Stethoscope,
    accent: {
      bg: "bg-cyan-50",
      text: "text-cyan-600",
      border: "border-cyan-200 hover:border-cyan-300",
      badge: "bg-cyan-100 text-cyan-700",
    },
    stats: [
      { label: "Kunjungan hari ini", value: 136 },
      { label: "Antrian aktif", value: 24 },
      { label: "Poli buka", value: "8/10" },
    ],
    cta: "Buka Rawat Jalan",
  },
  {
    label: "Rawat Inap",
    desc: "Pasien yang dirawat di bangsal — monitoring, bed management, & transfer.",
    href: "/ehis-care/rawat-inap",
    icon: BedDouble,
    accent: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-200 hover:border-emerald-300",
      badge: "bg-emerald-100 text-emerald-700",
    },
    stats: [
      { label: "Total rawat", value: 74 },
      { label: "Masuk hari ini", value: 6 },
      { label: "Bed kosong", value: "18/92" },
    ],
    cta: "Buka Rawat Inap",
  },
  {
    label: "Farmasi",
    desc: "Pengelolaan resep, dispensing obat, & monitoring stok apotek.",
    href: "/ehis-care/farmasi",
    icon: Pill,
    accent: {
      bg: "bg-violet-50",
      text: "text-violet-600",
      border: "border-violet-200 hover:border-violet-300",
      badge: "bg-violet-100 text-violet-700",
    },
    stats: [
      { label: "Resep menunggu", value: 12 },
      { label: "Selesai hari ini", value: 89 },
      { label: "Stok rendah", value: 3, alert: true },
    ],
    cta: "Buka Farmasi",
  },
  {
    label: "Laboratorium",
    desc: "Order pemeriksaan lab, tracking sampel, & distribusi hasil.",
    href: "/ehis-care/laboratorium",
    icon: FlaskConical,
    accent: {
      bg: "bg-teal-50",
      text: "text-teal-600",
      border: "border-teal-200 hover:border-teal-300",
      badge: "bg-teal-100 text-teal-700",
    },
    stats: [
      { label: "Order menunggu", value: 18 },
      { label: "Hasil tersedia", value: 42 },
      { label: "Kritis", value: 1, alert: true },
    ],
    cta: "Buka Lab",
  },
  {
    label: "Radiologi",
    desc: "Order pencitraan (X-Ray, CT, USG, MRI) & distribusi hasil.",
    href: "/ehis-care/radiologi",
    icon: Radiation,
    accent: {
      bg: "bg-orange-50",
      text: "text-orange-600",
      border: "border-orange-200 hover:border-orange-300",
      badge: "bg-orange-100 text-orange-700",
    },
    stats: [
      { label: "Order menunggu", value: 7 },
      { label: "Selesai hari ini", value: 31 },
      { label: "Rata-rata tunggu", value: "25 mnt" },
    ],
    cta: "Buka Radiologi",
  },
];

// ── Quick stats ───────────────────────────────────────────

const QUICK_STATS = [
  { label: "Total Pasien", value: "248", icon: Users, accent: "text-indigo-600 bg-indigo-50" },
  { label: "Pasien IGD", value: "38", icon: Siren, accent: "text-rose-600 bg-rose-50" },
  { label: "Bed Tersedia", value: "22/104", icon: BedDouble, accent: "text-emerald-600 bg-emerald-50" },
  { label: "Rata-rata Tunggu", value: "42 mnt", icon: Clock, accent: "text-amber-600 bg-amber-50" },
];

// ── Page ─────────────────────────────────────────────────

export default function EhisCareHubPage() {
  const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {/* ── Header ────────────────────────────────────────── */}
      <header className="animate-fade-in">
        <p className="text-xs text-slate-400">{today}</p>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Pelayanan Medis
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Ringkasan layanan aktif per pukul{" "}
          <span className="font-medium text-slate-700">{now}</span>
        </p>
      </header>

      {/* ── Quick stats ───────────────────────────────────── */}
      <section
        className="animate-fade-in grid grid-cols-2 gap-3 lg:grid-cols-4"
        style={{ animationDelay: "60ms" }}
        aria-label="Statistik ringkasan"
      >
        {QUICK_STATS.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4"
          >
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", accent)}>
              <Icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-bold tabular-nums text-slate-900 sm:text-xl">{value}</p>
              <p className="truncate text-[11px] text-slate-500 sm:text-xs">{label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Service cards ─────────────────────────────────── */}
      <section aria-label="Layanan medis">
        <h2 className="animate-fade-in mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400" style={{ animationDelay: "100ms" }}>
          Layanan Aktif
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SERVICES.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <Link
                key={svc.href}
                href={svc.href}
                className={cn(
                  "group animate-fade-in flex flex-col rounded-xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                  svc.accent.border,
                )}
                style={{ animationDelay: `${120 + i * 50}ms` }}
              >
                {/* Card header */}
                <div className="flex items-start gap-3.5 p-4 pb-3 sm:p-5 sm:pb-3">
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition",
                      svc.accent.bg,
                    )}
                  >
                    <Icon size={20} className={svc.accent.text} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">{svc.label}</h3>
                      <ArrowRight
                        size={15}
                        className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      {svc.desc}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
                  {svc.stats.map((stat) => (
                    <span
                      key={stat.label}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
                        stat.alert
                          ? "bg-rose-50 text-rose-700"
                          : "bg-slate-50 text-slate-600",
                      )}
                    >
                      {stat.alert && (
                        <AlertCircle size={11} className="shrink-0 text-rose-500" aria-hidden="true" />
                      )}
                      <span className="font-bold tabular-nums">{stat.value}</span>
                      <span className="text-slate-400">{stat.label}</span>
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-auto border-t border-slate-100 px-4 py-2.5 sm:px-5">
                  <span className={cn("text-xs font-semibold transition", svc.accent.text, "group-hover:underline")}>
                    {svc.cta} &rarr;
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
