"use client";

// ANT0 / Beranda modul Antrean — KPI ringkas + launcher Mode APM + quick nav.
// Stats reaktif dari antreanStore (useSyncExternalStore).

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  MonitorSmartphone,
  Ticket,
  Clock,
  Stethoscope,
  CheckCircle2,
  ListChecks,
  Activity,
  MonitorPlay,
  ArrowRight,
  Wifi,
  Building,
} from "lucide-react";
import { useAntreanStore } from "@/lib/antrean/antreanStore";
import type { AntreanRecord } from "@/lib/antrean/types";
import { useSkeletonDelay } from "@/components/master/shared";
import { cn } from "@/lib/utils";

export default function AntrianBerandaPage() {
  const store = useAntreanStore();
  const loaded = useSkeletonDelay(500);

  const list = useMemo<AntreanRecord[]>(
    () => Object.values(store.byKode).sort((a, b) => b.createdAt - a.createdAt),
    [store.byKode],
  );

  const stats = useMemo(() => {
    const onsite = list.filter((a) => a.sumber === "Onsite").length;
    const online = list.length - onsite;
    return {
      total: list.length,
      onsite,
      online,
      menungguAdmisi: list.filter((a) => a.status === "MenungguAdmisi").length,
      menungguPoli: list.filter((a) => a.status === "MenungguPoli").length,
      selesai: list.filter((a) => a.status === "Selesai").length,
    };
  }, [list]);

  if (!loaded) return <BerandaSkeleton />;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      {/* Hero / launcher */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-cyan-500 p-8 text-white shadow-lg shadow-indigo-600/20"
      >
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <Ticket className="h-4 w-4" /> Modul Antrean
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
              Pusat Antrean Rawat Jalan
            </h1>
            <p className="mt-2 text-indigo-100">
              Kelola antrean online (Mobile JKN) & onsite (kiosk APM) dalam satu tempat. Luncurkan
              layar kiosk untuk pendaftaran mandiri pasien.
            </p>
          </div>
          <Link
            href="/ehis-antrian/apm"
            target="_blank"
            className="group inline-flex items-center gap-3 rounded-2xl bg-white px-7 py-5 text-lg font-bold text-indigo-700 shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
          >
            <MonitorSmartphone className="h-7 w-7" />
            Buka Mode APM
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.section>

      {/* KPI strip */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Ticket} label="Total Antrean Hari Ini" value={stats.total} tone="indigo" />
        <KpiCard icon={Clock} label="Menunggu Admisi" value={stats.menungguAdmisi} tone="amber" />
        <KpiCard icon={Stethoscope} label="Menunggu Poli" value={stats.menungguPoli} tone="cyan" />
        <KpiCard icon={CheckCircle2} label="Selesai" value={stats.selesai} tone="emerald" />
      </section>

      {/* Sumber + Quick nav */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Sumber Antrean</h2>
          <div className="mt-4 flex flex-col gap-4">
            <SumberBar label="Onsite (Kiosk APM)" icon={Building} value={stats.onsite} total={stats.total} tone="bg-indigo-500" />
            <SumberBar label="Online (Mobile JKN)" icon={Wifi} value={stats.online} total={stats.total} tone="bg-cyan-500" />
          </div>
        </section>

        <section className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Navigasi Cepat</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <QuickNav href="/ehis-antrian/antrean" icon={ListChecks} title="Antrean List" desc="Board loket & respon kedatangan" />
            <QuickNav href="/ehis-antrian/monitoring" icon={Activity} title="Monitoring" desc="Status TaskID & pengiriman" />
            <QuickNav href="/ehis-antrian/display" icon={MonitorPlay} title="Display" desc="Layar panggilan ruang tunggu" />
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Pieces ─────────────────────────────────────────────────

const KPI_TONE: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  cyan: "bg-cyan-50 text-cyan-600",
  emerald: "bg-emerald-50 text-emerald-600",
};

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Ticket;
  label: string;
  value: number;
  tone: keyof typeof KPI_TONE | string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200"
    >
      <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", KPI_TONE[tone])}>
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-3xl font-extrabold tabular-nums text-slate-800">{value}</p>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
    </motion.div>
  );
}

function SumberBar({
  label,
  icon: Icon,
  value,
  total,
  tone,
}: {
  label: string;
  icon: typeof Wifi;
  value: number;
  total: number;
  tone: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-slate-600">
          <Icon className="h-4 w-4 text-slate-400" /> {label}
        </span>
        <span className="font-bold text-slate-700">{value}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function QuickNav({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof ListChecks;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-2xl bg-white p-5 ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-200"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon className="h-6 w-6" />
      </span>
      <span className="font-bold text-slate-800">{title}</span>
      <span className="text-xs text-slate-500">{desc}</span>
    </Link>
  );
}

function BerandaSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="h-44 animate-pulse rounded-3xl bg-slate-100" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-48 animate-pulse rounded-3xl bg-slate-100" />
        <div className="h-48 animate-pulse rounded-3xl bg-slate-100 lg:col-span-2" />
      </div>
    </div>
  );
}
