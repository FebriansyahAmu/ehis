import {
  Users,
  Stethoscope,
  BedDouble,
  Siren,
  FlaskConical,
  Pill,
  CreditCard,
  BarChart3,
  ClipboardList,
  Radiation,
} from "lucide-react";
import { Suspense } from "react";
import type { Metadata } from "next";

import DashboardCard from "@/app/components/DashboardCard";
import PatientTable   from "@/app/components/PatientTable";
import SkeletonCard, { SkeletonTable } from "@/app/components/SkeletonCard";
import { stats, recentPatients, recentActivities } from "@/app/lib/data";
import { cn } from "@/app/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const STAT_ICONS = [
  <Users      key="users"  size={18} />,
  <Stethoscope key="steth" size={18} />,
  <BedDouble  key="bed"    size={18} />,
  <Siren      key="siren"  size={18} />,
];

const ACTIVITY_META = {
  patient:  { icon: Users,        bg: "bg-indigo-100",  text: "text-indigo-600" },
  lab:      { icon: FlaskConical, bg: "bg-sky-100",     text: "text-sky-600"    },
  pharmacy: { icon: Pill,         bg: "bg-emerald-100", text: "text-emerald-600"},
  billing:  { icon: CreditCard,   bg: "bg-amber-100",   text: "text-amber-600"  },
} as const;

const MODULES = [
  { label: "Pendaftaran",  href: "/dashboard/pendaftaran", icon: ClipboardList, bg: "bg-indigo-50",  text: "text-indigo-600"  },
  { label: "Rawat Jalan",  href: "/dashboard/rawat-jalan", icon: Stethoscope,  bg: "bg-sky-50",     text: "text-sky-600"     },
  { label: "Rawat Inap",   href: "/dashboard/rawat-inap",  icon: BedDouble,    bg: "bg-emerald-50", text: "text-emerald-600" },
  { label: "IGD",          href: "/dashboard/igd",          icon: Siren,        bg: "bg-rose-50",    text: "text-rose-600"    },
  { label: "Farmasi",      href: "/dashboard/farmasi",      icon: Pill,         bg: "bg-violet-50",  text: "text-violet-600"  },
  { label: "Laboratorium", href: "/dashboard/laboratorium", icon: FlaskConical, bg: "bg-cyan-50",    text: "text-cyan-600"    },
  { label: "Radiologi",    href: "/dashboard/radiologi",    icon: Radiation,    bg: "bg-orange-50",  text: "text-orange-600"  },
  { label: "Billing",      href: "/dashboard/billing",      icon: CreditCard,   bg: "bg-amber-50",   text: "text-amber-600"   },
  { label: "Laporan",      href: "/dashboard/laporan",      icon: BarChart3,    bg: "bg-slate-100",  text: "text-slate-600"   },
];

// ── Data fetchers (simulated async) ──────────────────────

async function getStats()      { return stats; }
async function getPatients()   { return recentPatients; }
async function getActivities() { return recentActivities; }

// ── Server sub-components ─────────────────────────────────

async function StatsSection() {
  const data = await getStats();
  return (
    <section
      className="grid grid-cols-2 gap-4 xl:grid-cols-4"
      aria-label="Statistik pasien hari ini"
    >
      {data.map((stat, i) => (
        <DashboardCard key={stat.label} {...stat} icon={STAT_ICONS[i]} index={i} />
      ))}
    </section>
  );
}

async function PatientsSection() {
  const patients = await getPatients();
  return <PatientTable patients={patients} />;
}

async function ActivitySection() {
  const activities = await getActivities();
  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-800">Aktivitas Terbaru</h2>
      </div>
      <ul className="divide-y divide-slate-100" role="list">
        {activities.map((act, i) => {
          const { icon: Icon, bg, text } = ACTIVITY_META[act.type];
          return (
            <li
              key={act.id}
              className="animate-fade-in flex items-start gap-3 px-5 py-3.5"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span
                className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", bg)}
                aria-hidden="true"
              >
                <Icon size={14} className={text} />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-slate-700">{act.action}</p>
                <p className="mt-0.5 text-xs text-slate-400">{act.actor} · {act.time}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ModuleGrid() {
  return (
    <section aria-label="Akses cepat modul">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Akses Cepat
      </h2>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-9">
        {MODULES.map(({ label, href, icon: Icon, bg, text }, i) => (
          <a
            key={href}
            href={href}
            className={cn(
              "animate-fade-in flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-3.5 text-center transition hover:-translate-y-0.5 hover:shadow-sm",
              bg,
            )}
            style={{ animationDelay: `${i * 35}ms` }}
          >
            <Icon size={20} className={text} aria-hidden="true" />
            <span className="text-[11px] font-medium leading-tight text-slate-600">{label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 p-6">
      {/* Welcome */}
      <header className="animate-fade-in">
        <p className="text-xs text-slate-400">{today}</p>
        <h1 className="mt-0.5 text-xl font-bold text-slate-900">
          Selamat datang, <span className="text-indigo-600">dr. Rizky</span>
        </h1>
        <p className="text-sm text-slate-500">Berikut ringkasan aktivitas rumah sakit hari ini.</p>
      </header>

      {/* Stat cards */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        }
      >
        <StatsSection />
      </Suspense>

      {/* Module shortcuts */}
      <ModuleGrid />

      {/* Table + Activity */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Suspense fallback={<SkeletonTable />}>
            <PatientsSection />
          </Suspense>
        </div>

        <div>
          <Suspense
            fallback={
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="animate-skeleton h-8 w-8 shrink-0 rounded-lg bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="animate-skeleton h-4 w-full rounded bg-slate-200" />
                      <div className="animate-skeleton h-3 w-24 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <ActivitySection />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
