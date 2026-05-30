"use client";

// ANT-ONSITE — Chrome kiosk: header (brand + jam live), stepper, slot konten, footer.
// Tidak tahu detail step; murni layout + progress.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Hospital, Clock, RotateCcw, ChevronLeft, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApmStep } from "./apmTypes";

const STEPPER: { key: ApmStep | "input"; label: string }[] = [
  { key: "welcome", label: "Mulai" },
  { key: "input", label: "Data Pasien" },
  { key: "penjamin", label: "Penjamin" },
  { key: "poliDokter", label: "Poli & Dokter" },
  { key: "struk", label: "Selesai" },
];

/** Map step aktual → index stepper (cari + inputBaru = satu fase "Data Pasien"). */
function stepIndex(step: ApmStep): number {
  switch (step) {
    case "welcome":
      return 0;
    case "cari":
    case "inputBaru":
      return 1;
    case "penjamin":
      return 2;
    case "poliDokter":
      return 3;
    case "struk":
      return 4;
  }
}

function useClock(): Date {
  // Lazy init agar tampil langsung; interval callback (bukan body) update tiap detik.
  // Span waktu pakai suppressHydrationWarning untuk hindari mismatch SSR.
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function ApmShell({
  step,
  onReset,
  onBack,
  canBack,
  isFullscreen,
  onToggleFullscreen,
  wide,
  children,
}: {
  step: ApmStep;
  onReset: () => void;
  onBack: () => void;
  canBack: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const now = useClock();
  const idx = stepIndex(step);

  const jam = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const tanggal = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-100 via-slate-100 to-indigo-50">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b border-slate-200/70 bg-white/80 px-8 py-4 backdrop-blur print:hidden">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-600/30">
            <Hospital className="h-6 w-6" aria-hidden />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-extrabold tracking-tight text-slate-800">
              RS Sakti Husada
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-indigo-500">
              Anjungan Pendaftaran Mandiri
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-indigo-600 active:bg-slate-100"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-2.5 text-white shadow-sm">
            <Clock className="h-5 w-5 text-cyan-300" aria-hidden />
            <div className="flex flex-col items-end leading-tight">
              <span suppressHydrationWarning className="font-mono text-lg font-bold tabular-nums">{jam}</span>
              <span suppressHydrationWarning className="text-[11px] text-slate-300">{tanggal}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="border-b border-slate-200/70 bg-white/40 px-8 py-3 print:hidden">
        <ol className="mx-auto flex max-w-4xl items-center">
          {STEPPER.map((s, i) => {
            const done = i < idx;
            const active = i === idx;
            return (
              <li key={s.key} className="flex flex-1 items-center last:flex-none">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
                      done && "bg-emerald-500 text-white",
                      active && "bg-indigo-600 text-white ring-4 ring-indigo-200",
                      !done && !active && "bg-slate-200 text-slate-400",
                    )}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span
                    className={cn(
                      "hidden text-sm font-semibold sm:inline",
                      active ? "text-indigo-700" : done ? "text-emerald-600" : "text-slate-400",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPPER.length - 1 && (
                  <span
                    className={cn(
                      "mx-3 h-0.5 flex-1 rounded-full transition-colors",
                      i < idx ? "bg-emerald-400" : "bg-slate-200",
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Konten */}
      <main className="relative flex-1 overflow-y-auto px-6 py-8">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={cn("mx-auto w-full", wide ? "max-w-6xl" : "max-w-4xl")}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between gap-4 border-t border-slate-200/70 bg-white/80 px-8 py-3.5 backdrop-blur print:hidden">
        <button
          type="button"
          onClick={onBack}
          disabled={!canBack}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-5 py-3 text-base font-bold ring-1 transition-colors",
            canBack
              ? "bg-white text-slate-700 ring-slate-300 shadow-sm hover:bg-slate-50 active:bg-slate-100"
              : "cursor-not-allowed bg-transparent text-slate-300 ring-transparent",
          )}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
          Kembali
        </button>

        <p className="hidden text-xs text-slate-400 md:block">
          Salah pilih? Tekan <span className="font-semibold text-slate-500">Kembali</span> · butuh bantuan, hubungi petugas.
        </p>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100"
        >
          <RotateCcw className="h-5 w-5" aria-hidden />
          Mulai Ulang
        </button>
      </footer>
    </div>
  );
}
