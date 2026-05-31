"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Pill, Clock3, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { seedAntrean } from "@/lib/antrean/antreanStore";
import { buildSeedAntrean } from "@/lib/antrean/antreanSeed";
import {
  useFarmasiQueue,
  panggilFarmasi,
  panggilUlangFarmasi,
  mulaiSiapkan,
  serahSelesai,
  FARMASI_QUEUE_CFG,
  FARMASI_QUEUE_SEQUENCE,
  type FarmasiQueueEntry,
  type FarmasiQueueStatus,
} from "@/lib/farmasi/farmasiQueueStore";
import FarmasiQueueCard from "./FarmasiQueueCard";

type FilterKey = "Semua" | FarmasiQueueStatus;

const FILTERS: FilterKey[] = ["Semua", ...FARMASI_QUEUE_SEQUENCE];

interface Toast {
  msg: string;
  tone: "sky" | "amber" | "emerald";
}

export default function FarmasiQueueBoard() {
  const queue = useFarmasiQueue();
  const [filter, setFilter] = useState<FilterKey>("Semua");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  // Seed contoh saat store antrean kosong → worklist punya data untuk demo.
  useEffect(() => {
    seedAntrean(buildSeedAntrean());
  }, []);

  function flash(msg: string, tone: Toast["tone"]) {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2600);
  }

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      Semua: queue.length,
      Menunggu_Farmasi: 0,
      Dipanggil: 0,
      Disiapkan: 0,
      Selesai: 0,
    };
    for (const e of queue) c[e.status]++;
    return c;
  }, [queue]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return queue.filter((e) => {
      if (filter !== "Semua" && e.status !== filter) return false;
      if (!q) return true;
      return (
        e.nama.toLowerCase().includes(q) ||
        (e.noRM ?? "").toLowerCase().includes(q) ||
        e.nomorAntrean.toLowerCase().includes(q) ||
        e.poli.toLowerCase().includes(q)
      );
    });
  }, [queue, filter, query]);

  // ── Handlers ─────────────────────────────────────────────
  function handlePanggil(e: FarmasiQueueEntry) {
    panggilFarmasi(e.kodebooking);
    flash(`Memanggil ${e.nama} (${e.nomorAntrean}) ke loket farmasi`, "sky");
  }
  function handlePanggilUlang(e: FarmasiQueueEntry) {
    const n = panggilUlangFarmasi(e.kodebooking);
    flash(`Panggil ulang ${e.nomorAntrean} — pemanggilan ke-${n + 1}`, "amber");
  }
  function handleMulai(e: FarmasiQueueEntry) {
    mulaiSiapkan(e.kodebooking);
    flash(`Mulai menyiapkan obat ${e.nama} · Task 6 terkirim`, "sky");
  }
  function handleSerah(e: FarmasiQueueEntry) {
    serahSelesai(e.kodebooking);
    flash(`Obat ${e.nama} diserahkan · Task 7 terkirim · antrean selesai`, "emerald");
  }

  const aktif = counts.Menunggu_Farmasi + counts.Dipanggil + counts.Disiapkan;

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Pill size={16} />} label="Total antrean" value={counts.Semua} tone="slate" />
        <Stat icon={<Clock3 size={16} />} label="Menunggu" value={counts.Menunggu_Farmasi + counts.Dipanggil} tone="amber" />
        <Stat icon={<Pill size={16} />} label="Disiapkan" value={counts.Disiapkan} tone="sky" />
        <Stat icon={<CheckCircle2 size={16} />} label="Diserahkan" value={counts.Selesai} tone="emerald" />
      </div>

      {/* Filter + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const isActive = filter === f;
            const label = f === "Semua" ? "Semua" : FARMASI_QUEUE_CFG[f].label;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  isActive
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50",
                )}
              >
                {label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                    isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama · No. RM · antrean…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />
        </div>
      </div>

      {/* Grid */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 py-16 text-center">
          <Pill size={28} className="text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Tidak ada antrean farmasi</p>
          <p className="mt-1 max-w-sm text-xs text-slate-400">
            Pasien muncul di sini otomatis setelah dokter poli menekan <span className="font-semibold">Selesai</span> (Task 5).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((e, i) => (
            <FarmasiQueueCard
              key={e.kodebooking}
              entry={e}
              index={i}
              onPanggil={handlePanggil}
              onPanggilUlang={handlePanggilUlang}
              onMulai={handleMulai}
              onSerah={handleSerah}
            />
          ))}
        </div>
      )}

      {/* Footer note */}
      <p className="text-[11px] text-slate-400">
        {aktif} antrean aktif · Alur: <span className="font-semibold text-slate-500">Panggil → Mulai Siapkan (Task 6) → Serahkan (Task 7)</span>.
        Timeline task tampil di <span className="font-semibold text-slate-500">Antrian · Monitoring</span>.
      </p>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={cn(
              "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg",
              toast.tone === "sky" && "bg-sky-600",
              toast.tone === "amber" && "bg-amber-500",
              toast.tone === "emerald" && "bg-emerald-600",
            )}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────

const STAT_TONE: Record<string, string> = {
  slate: "border-slate-200 bg-white text-slate-600",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: keyof typeof STAT_TONE }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", STAT_TONE[tone])}>
      <span className="shrink-0 opacity-80">{icon}</span>
      <div>
        <p className="text-xl font-bold leading-none tabular-nums">{value}</p>
        <p className="mt-0.5 text-[11px] font-medium opacity-80">{label}</p>
      </div>
    </div>
  );
}
