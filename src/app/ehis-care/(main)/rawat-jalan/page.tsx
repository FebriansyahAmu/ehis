import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Stethoscope, Users, Clock, CheckCircle2, Building2, Plus,
} from "lucide-react";
import RJBoard from "@/components/rawat-jalan/RJBoard";
import { rjPatients, rjStats } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Rawat Jalan" };

// ── Stat card ─────────────────────────────────────────────

type Variant = "default" | "warning" | "active" | "success" | "info";

const VARIANT_CLS: Record<Variant, { card: string; text: string; lbl: string; ico: string }> = {
  default: { card: "border-slate-200 bg-white",         text: "text-slate-900",   lbl: "text-slate-600",   ico: "text-slate-400"   },
  warning: { card: "border-amber-200 bg-amber-50",      text: "text-amber-700",   lbl: "text-amber-600",   ico: "text-amber-500"   },
  active:  { card: "border-sky-200 bg-sky-50",          text: "text-sky-700",     lbl: "text-sky-600",     ico: "text-sky-500"     },
  success: { card: "border-emerald-200 bg-emerald-50",  text: "text-emerald-700", lbl: "text-emerald-600", ico: "text-emerald-500" },
  info:    { card: "border-sky-200 bg-sky-50",           text: "text-sky-700",     lbl: "text-sky-600",     ico: "text-sky-500"    },
};

function StatCard({
  label, value, sub, icon: Icon, variant = "default",
}: {
  label: string; value: string | number; sub?: string; icon: LucideIcon; variant?: Variant;
}) {
  const s = VARIANT_CLS[variant];
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

export default function RawatJalanPage() {
  const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const s   = rjStats;

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Header */}
      <header className="animate-fade-in flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
              <Stethoscope size={16} className="text-sky-600" aria-hidden="true" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Rawat Jalan</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Data per pukul {now} · {s.poliAktif} poliklinik aktif hari ini
          </p>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-95"
        >
          <Plus size={14} strokeWidth={2.5} />
          Kunjungan Baru
        </button>
      </header>

      {/* Stats */}
      <section
        className="animate-fade-in grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        aria-label="Ringkasan Rawat Jalan"
        style={{ animationDelay: "60ms" }}
      >
        <StatCard label="Total Kunjungan"   value={s.totalHariIni} sub="hari ini"          icon={Users}        />
        <StatCard label="Menunggu"           value={s.menunggu}     sub="antrian aktif"     icon={Clock}        variant="warning" />
        <StatCard label="Sedang Diperiksa"   value={s.aktif}        sub="dalam proses"      icon={Stethoscope}  variant="active"  />
        <StatCard label="Selesai"            value={s.selesai}      sub="kunjungan tuntas"  icon={CheckCircle2} variant="success" />
        <StatCard label="Poli Aktif"         value={s.poliAktif}    sub="poliklinik"        icon={Building2}    variant="info"    />
      </section>

      {/* Board */}
      <section className="animate-fade-in" style={{ animationDelay: "120ms" }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">Daftar Pasien Rawat Jalan</p>
          <p className="text-[11px] text-slate-400">{rjPatients.length} pasien terdaftar hari ini</p>
        </div>
        <RJBoard patients={rjPatients} />
      </section>

    </div>
  );
}
