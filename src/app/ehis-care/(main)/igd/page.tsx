import { Siren, BedDouble, Clock, Users } from "lucide-react";
import type { Metadata } from "next";

import IGDBoard from "@/components/igd/IGDBoard";
import { igdPatients, igdStats } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "IGD" };

// ── Summary stat card ─────────────────────────────────────

function StatBadge({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-600">{label}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────

export default function IGDPage() {
  const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <header className="animate-fade-in flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
              <Siren size={16} className="text-rose-600" aria-hidden="true" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              Instalasi Gawat Darurat
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Data real-time per pukul {now} · Update setiap 5 menit
          </p>
        </div>

        {/* Bed indicator */}
        <div className="hidden shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm sm:flex">
          <BedDouble size={16} className="text-slate-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {igdStats.bedsAvailable}
              <span className="font-normal text-slate-400"> / {igdStats.bedsTotal}</span>
            </p>
            <p className="text-[11px] text-slate-400">Tempat tidur tersedia</p>
          </div>
        </div>
      </header>

      {/* Summary stats */}
      <section
        className="animate-fade-in grid grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="Ringkasan IGD"
        style={{ animationDelay: "60ms" }}
      >
        <StatBadge
          label="Total Pasien"
          value={igdStats.total}
          sub="hari ini"
          className="col-span-2 sm:col-span-1"
        />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
            <p className="text-2xl font-bold text-rose-700 tabular-nums">{igdStats.p1}</p>
          </div>
          <p className="mt-0.5 text-sm font-medium text-rose-600">P1 · Kritis</p>
          <p className="text-xs text-rose-400">Prioritas tertinggi</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
            <p className="text-2xl font-bold text-amber-700 tabular-nums">{igdStats.p2}</p>
          </div>
          <p className="mt-0.5 text-sm font-medium text-amber-600">P2 · Urgent</p>
          <p className="text-xs text-amber-400">Segera ditangani</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <p className="text-2xl font-bold text-emerald-700 tabular-nums">{igdStats.p3}</p>
          </div>
          <p className="mt-0.5 text-sm font-medium text-emerald-600">P3 · Non-urgent</p>
          <p className="text-xs text-emerald-400">Dapat menunggu</p>
        </div>
      </section>

      {/* Secondary info row */}
      <div
        className="animate-fade-in flex flex-wrap gap-4 text-sm text-slate-500"
        style={{ animationDelay: "120ms" }}
      >
        <span className="flex items-center gap-1.5">
          <Clock size={14} className="text-slate-400" aria-hidden="true" />
          Rata-rata tunggu: <strong className="text-slate-700">{igdStats.avgWait}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <Users size={14} className="text-slate-400" aria-hidden="true" />
          Ditampilkan: <strong className="text-slate-700">{igdPatients.length} pasien</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <BedDouble size={14} className="text-slate-400" aria-hidden="true" />
          Tempat tidur tersedia:{" "}
          <strong
            className={cn(
              igdStats.bedsAvailable <= 2 ? "text-rose-600" : "text-emerald-600",
            )}
          >
            {igdStats.bedsAvailable} / {igdStats.bedsTotal}
          </strong>
        </span>
      </div>

      {/* Board */}
      <div className="animate-fade-in" style={{ animationDelay: "160ms" }}>
        <IGDBoard patients={igdPatients} />
      </div>
    </div>
  );
}
