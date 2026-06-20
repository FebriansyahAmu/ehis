import type { Metadata } from "next";
import { Pill } from "lucide-react";
import FarmasiViewTabs from "@/components/farmasi/FarmasiViewTabs";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Farmasi" };

// ── Page ───────────────────────────────────────────────────

export default function FarmasiPage() {
  const now       = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const today     = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

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

      {/* ── Main content (Worklist + Register N/P) ── */}
      <div className="animate-fade-in" style={{ animationDelay: "120ms" }}>
        <FarmasiViewTabs />
      </div>
    </div>
  );
}
