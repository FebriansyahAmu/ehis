import type { Metadata } from "next";
import { Pill, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import FarmasiBoard from "@/components/farmasi/FarmasiBoard";
import { deriveResepOrders } from "@/components/farmasi/farmasiShared";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Farmasi" };

// ── Stat badge ─────────────────────────────────────────────

function HeaderStat({
  icon, value, label, className,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm", className)}>
      <div className="text-slate-400">{icon}</div>
      <div>
        <p className="text-sm font-bold text-slate-900 tabular-nums leading-none">{value}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function FarmasiPage() {
  const now       = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const today     = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

  const allOrders = deriveResepOrders();
  const pending   = allOrders.filter((o) => o.status === "Menunggu").length;
  const hamActive = allOrders.filter((o) => o.hasHAM && o.status !== "Selesai").length;
  const done      = allOrders.filter((o) => o.status === "Selesai").length;

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* ── Page header ── */}
      <header className="animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
              <Pill size={18} className="text-indigo-600" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Farmasi</h1>
              <p className="text-xs text-slate-400">Pelayanan Kefarmasian · PMK 72/2016</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {today} · Pukul {now} · Data diperbarui otomatis
          </p>
        </div>

        {/* Quick stats row */}
        <div className="flex flex-wrap gap-2">
          <HeaderStat
            icon={<Clock size={15} />}
            value={pending}
            label="Menunggu telaah"
            className={pending > 0 ? "border-amber-200 bg-amber-50" : ""}
          />
          {hamActive > 0 && (
            <HeaderStat
              icon={<AlertTriangle size={15} className="text-rose-500" />}
              value={hamActive}
              label="Order HAM aktif"
              className="border-rose-200 bg-rose-50"
            />
          )}
          <HeaderStat
            icon={<TrendingUp size={15} className="text-emerald-500" />}
            value={done}
            label="Selesai hari ini"
            className="border-emerald-200 bg-emerald-50"
          />
        </div>
      </header>

      {/* ── Workflow guide ── */}
      <div
        className="animate-fade-in flex items-center gap-0 overflow-x-auto rounded-xl border border-slate-200 bg-white px-1 py-1 shadow-sm"
        style={{ animationDelay: "60ms" }}
        aria-label="Alur kerja farmasi"
      >
        {[
          { step: "01", label: "Order Masuk",    sub: "dari IGD / RI / RJ",  cls: "text-slate-600" },
          { step: "02", label: "Telaah Resep",   sub: "Adm · Farm · Klin",   cls: "text-amber-600" },
          { step: "03", label: "Dispensasi",     sub: "Lot · Exp · Label",   cls: "text-sky-600"   },
          { step: "04", label: "Serah Terima",   sub: "ke bangsal / pasien", cls: "text-emerald-600" },
        ].map((s, i, arr) => (
          <div key={s.step} className="flex items-center">
            <div className="flex items-center gap-2 px-4 py-2">
              <span className={cn("text-xs font-black", s.cls)}>{s.step}</span>
              <div>
                <p className={cn("text-xs font-semibold leading-none", s.cls)}>{s.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
              </div>
            </div>
            {i < arr.length - 1 && (
              <span className="text-slate-300 text-sm font-light select-none">›</span>
            )}
          </div>
        ))}
      </div>

      {/* ── Board ── */}
      <div className="animate-fade-in" style={{ animationDelay: "120ms" }}>
        <FarmasiBoard />
      </div>
    </div>
  );
}
