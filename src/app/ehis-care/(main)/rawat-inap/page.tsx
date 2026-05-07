import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  BedDouble, Users, Clock, ArrowDownToLine,
  ArrowUpFromLine, AlertTriangle, Plus,
} from "lucide-react";

import RIRuanganPanel from "@/components/rawat-inap/RIRuanganPanel";
import RIBoard from "@/components/rawat-inap/RIBoard";
import { rawatInapPatients, rawatInapRuangan, rawatInapStats } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Rawat Inap" };

// ── BOR Gauge ─────────────────────────────────────────────

function BORGauge({ value }: { value: number }) {
  const isCritical = value >= 85;
  const isOptimal  = value >= 60 && value < 85;
  const barColor   = isCritical ? "bg-rose-500"   : isOptimal ? "bg-amber-400"   : "bg-emerald-500";
  const textColor  = isCritical ? "text-rose-600" : isOptimal ? "text-amber-600" : "text-emerald-600";
  const label      = isCritical ? "Kritis"        : isOptimal ? "Optimal"        : "Rendah";
  const badgeCls   = isCritical
    ? "bg-rose-100 text-rose-600"
    : isOptimal
    ? "bg-amber-100 text-amber-600"
    : "bg-emerald-100 text-emerald-600";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className={cn("text-2xl font-black tabular-nums leading-none", textColor)}>
            {value}<span className="text-sm font-medium text-slate-400">%</span>
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">BOR</p>
          <p className="text-[10px] text-slate-400">Bed Occupancy Rate</p>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", badgeCls)}>{label}</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, variant = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  variant?: "default" | "critical" | "warning" | "success" | "info";
}) {
  const s = {
    default:  { card: "border-slate-200 bg-white",        text: "text-slate-900",   lbl: "text-slate-600",   ico: "text-slate-400"    },
    critical: { card: "border-rose-200 bg-rose-50",       text: "text-rose-700",    lbl: "text-rose-600",    ico: "text-rose-500"     },
    warning:  { card: "border-amber-200 bg-amber-50",     text: "text-amber-700",   lbl: "text-amber-600",   ico: "text-amber-500"    },
    success:  { card: "border-emerald-200 bg-emerald-50", text: "text-emerald-700", lbl: "text-emerald-600", ico: "text-emerald-500"  },
    info:     { card: "border-sky-200 bg-sky-50",         text: "text-sky-700",     lbl: "text-sky-600",     ico: "text-sky-500"      },
  }[variant];

  return (
    <div className={cn("rounded-xl border p-4 shadow-sm", s.card)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={cn("text-2xl font-black tabular-nums leading-none", s.text)}>{value}</p>
          <p className={cn("mt-1 text-sm font-medium", s.lbl)}>{label}</p>
          {sub && <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>}
        </div>
        <Icon size={18} className={s.ico} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function RawatInapPage() {
  const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const s   = rawatInapStats;

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Header */}
      <header className="animate-fade-in flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <BedDouble size={16} className="text-emerald-600" aria-hidden="true" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Rawat Inap</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Data per pukul {now} · {s.bedsAvailable} tempat tidur tersedia dari {s.bedsTotal}
          </p>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
        >
          <Plus size={14} strokeWidth={2.5} />
          Admisi Pasien
        </button>
      </header>

      {/* Stats */}
      <section
        className="animate-fade-in grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        aria-label="Ringkasan Rawat Inap"
        style={{ animationDelay: "60ms" }}
      >
        <BORGauge value={s.bor} />
        <StatCard
          label="ALOS"
          value={`${s.alos}h`}
          sub="rata-rata lama rawat"
          icon={Clock}
        />
        <StatCard
          label="Pasien Aktif"
          value={s.totalAktif}
          sub="saat ini"
          icon={Users}
        />
        <StatCard
          label="Masuk Hari Ini"
          value={s.masukHariIni}
          sub="pasien baru masuk"
          icon={ArrowDownToLine}
          variant="info"
        />
        <StatCard
          label="Rencana Keluar"
          value={s.rencanaKeluar}
          sub="hari ini"
          icon={ArrowUpFromLine}
          variant="success"
        />
        <StatCard
          label="Pasien Kritis"
          value={s.kritis}
          sub="perlu perhatian khusus"
          icon={AlertTriangle}
          variant={s.kritis > 0 ? "critical" : "default"}
        />
      </section>

      {/* Room Panel */}
      <section className="animate-fade-in" style={{ animationDelay: "120ms" }}>
        <RIRuanganPanel ruangan={rawatInapRuangan} />
      </section>

      {/* Patient Board */}
      <section className="animate-fade-in" style={{ animationDelay: "180ms" }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">Daftar Pasien Rawat Inap</p>
          <p className="text-[11px] text-slate-400">
            {rawatInapPatients.length} pasien ditampilkan
          </p>
        </div>
        <RIBoard patients={rawatInapPatients} />
      </section>

    </div>
  );
}
