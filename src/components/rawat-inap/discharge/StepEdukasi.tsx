"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type EdukasiItem, type MetodeEdukasi, type PenerimaEdukasi,
  type PemahamanEdukasi, KATEGORI_COLOR, PEMAHAMAN_CONFIG,
} from "./dischargeShared";

type Props = {
  items:    EdukasiItem[];
  onChange: (items: EdukasiItem[]) => void;
};

const METODE_OPTIONS: MetodeEdukasi[]     = ["Lisan", "Demonstrasi", "Leaflet", "Video"];
const PENERIMA_OPTIONS: PenerimaEdukasi[] = ["Pasien", "Keluarga", "Keduanya"];
const PEMAHAMAN_OPTIONS: PemahamanEdukasi[] = ["Paham", "Perlu Ulang", "Tidak Paham"];

// ── Row component ─────────────────────────────────────────

function EdukasiRow({
  item, onUpdate,
}: { item: EdukasiItem; onUpdate: (u: EdukasiItem) => void }) {
  function set<K extends keyof EdukasiItem>(key: K, val: EdukasiItem[K]) {
    onUpdate({ ...item, [key]: val });
  }
  function handleToggle() {
    const next = !item.diberikan;
    onUpdate({
      ...item, diberikan: next,
      metode: next ? item.metode : "",
      penerima: next ? item.penerima : "",
      pemahaman: next ? item.pemahaman : "",
      catatan: next ? item.catatan : "",
    });
  }

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border transition-all duration-200",
      item.diberikan ? "border-sky-200 bg-sky-50/40" : "border-slate-200 bg-white",
    )}>
      <div className="flex cursor-pointer items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={e => { e.stopPropagation(); handleToggle(); }}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
            item.diberikan
              ? "border-sky-500 bg-sky-500 text-white"
              : "border-slate-300 bg-white hover:border-sky-400",
          )}
        >
          {item.diberikan && (
            <svg viewBox="0 0 10 8" fill="none" className="h-3 w-3">
              <path d="M1 4l2.5 3L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <span className={cn("text-xs font-medium transition-colors", item.diberikan ? "text-slate-700" : "text-slate-600")}>
            {item.topik}
          </span>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
            KATEGORI_COLOR[item.kategori] ?? "bg-slate-100 text-slate-500",
          )}>
            {item.kategori}
          </span>
          {item.diberikan && item.pemahaman && (
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold", PEMAHAMAN_CONFIG[item.pemahaman])}>
              {item.pemahaman}
            </span>
          )}
        </div>
        {item.diberikan && (
          <ChevronDown size={14} className="shrink-0 text-slate-400" aria-hidden />
        )}
      </div>

      <AnimatePresence initial={false}>
        {item.diberikan && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-sky-100 px-4 pb-3 pt-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Metode</label>
                  <div className="flex flex-wrap gap-1.5">
                    {METODE_OPTIONS.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => set("metode", item.metode === m ? "" : m)}
                        className={cn(
                          "rounded-md border px-2 py-1 text-[11px] font-medium transition-all",
                          item.metode === m
                            ? "border-sky-300 bg-sky-100 text-sky-700"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Penerima</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PENERIMA_OPTIONS.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => set("penerima", item.penerima === p ? "" : p)}
                        className={cn(
                          "rounded-md border px-2 py-1 text-[11px] font-medium transition-all",
                          item.penerima === p
                            ? "border-sky-300 bg-sky-100 text-sky-700"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Evaluasi</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PEMAHAMAN_OPTIONS.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => set("pemahaman", item.pemahaman === p ? "" : p)}
                        className={cn(
                          "rounded-md border px-2 py-1 text-[11px] font-medium transition-all",
                          item.pemahaman === p
                            ? `${PEMAHAMAN_CONFIG[p]} border-transparent`
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-2.5">
                <input
                  value={item.catatan}
                  onChange={e => set("catatan", e.target.value)}
                  placeholder="Catatan tambahan (opsional)..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────

export default function StepEdukasi({ items, onChange }: Props) {
  const totalDiberikan  = items.filter(i => i.diberikan).length;
  const totalPaham      = items.filter(i => i.pemahaman === "Paham").length;
  const totalPerluUlang = items.filter(i => i.pemahaman === "Perlu Ulang").length;
  const totalTidakPaham = items.filter(i => i.pemahaman === "Tidak Paham").length;
  const pct = items.length > 0 ? Math.round((totalDiberikan / items.length) * 100) : 0;

  const kategoriMap: Record<string, { total: number; diberikan: number }> = {};
  for (const item of items) {
    if (!kategoriMap[item.kategori]) kategoriMap[item.kategori] = { total: 0, diberikan: 0 };
    kategoriMap[item.kategori].total++;
    if (item.diberikan) kategoriMap[item.kategori].diberikan++;
  }

  const circumference = 2 * Math.PI * 15;

  function updateItem(updated: EdukasiItem) {
    onChange(items.map(i => i.id === updated.id ? updated : i));
  }

  return (
    <div className="flex flex-col gap-4 xl:flex-row">

      {/* ── Left: Topic List ── */}
      <div className="min-w-0 flex-1 space-y-2">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.15 }}
          >
            <EdukasiRow item={item} onUpdate={updateItem} />
          </motion.div>
        ))}
        <p className="pt-2 text-center text-[11px] text-slate-400">
          SNARS HPK 2 · Wajib verifikasi pemahaman setiap topik yang diberikan
        </p>
      </div>

      {/* ── Right: Progress Summary ── */}
      <div className="w-full shrink-0 space-y-3 xl:w-64">

        {/* Donut + count */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Progress Edukasi</p>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                <motion.circle
                  cx="18" cy="18" r="15"
                  fill="none"
                  stroke={totalTidakPaham > 0 ? "#f87171" : totalPerluUlang > 0 ? "#fbbf24" : "#0ea5e9"}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray: `${(pct / 100) * circumference} ${circumference}` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-base font-bold text-slate-800">{pct}%</p>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {totalDiberikan}
                <span className="text-sm font-normal text-slate-400">/{items.length}</span>
              </p>
              <p className="text-xs text-slate-500">topik selesai</p>
              {totalDiberikan > 0 && totalDiberikan < items.length && (
                <p className="mt-0.5 text-[11px] text-sky-600">{items.length - totalDiberikan} tersisa</p>
              )}
            </div>
          </div>

          {totalDiberikan > 0 && (
            <div className="mt-4 space-y-2">
              {[
                { label: "Paham",       count: totalPaham,      dot: "bg-emerald-500" },
                { label: "Perlu Ulang", count: totalPerluUlang, dot: "bg-amber-400"   },
                { label: "Tidak Paham", count: totalTidakPaham, dot: "bg-red-400"     },
              ].map(({ label, count, dot }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 shrink-0 rounded-full", dot)} />
                  <span className="flex-1 text-[11px] text-slate-600">{label}</span>
                  <span className={cn(
                    "text-[11px] font-bold",
                    count === 0 ? "text-slate-300" : "text-slate-700",
                  )}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-kategori breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Per Kategori</p>
          <div className="space-y-3">
            {Object.entries(kategoriMap).map(([kat, { total, diberikan }]) => (
              <div key={kat}>
                <div className="mb-1 flex items-center justify-between">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                    KATEGORI_COLOR[kat] ?? "bg-slate-100 text-slate-500",
                  )}>
                    {kat}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600">{diberikan}/{total}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-sky-400"
                    initial={{ width: 0 }}
                    animate={{ width: diberikan === 0 ? "0%" : `${(diberikan / total) * 100}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SNARS note */}
        <div className="rounded-xl border border-sky-100 bg-sky-50 p-3.5">
          <div className="flex items-start gap-2">
            <BookOpen size={13} className="mt-0.5 shrink-0 text-sky-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-sky-700">SNARS HPK 2</p>
              <p className="mt-1 text-[11px] leading-relaxed text-sky-700">
                Edukasi pasien & keluarga wajib didokumentasikan dengan verifikasi pemahaman di setiap topik.
              </p>
            </div>
          </div>
        </div>

        {pct === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3"
          >
            <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
            <p className="text-xs font-semibold text-emerald-700">Semua topik telah diberikan</p>
          </motion.div>
        )}

      </div>
    </div>
  );
}
