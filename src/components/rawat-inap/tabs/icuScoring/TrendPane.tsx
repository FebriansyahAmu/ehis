"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSOFARisk, getAPACHERisk, type ICUScoringData, type SOFAEntry } from "./icuScoringShared";

const TODAY = "2026-05-15";

// ── Helpers ────────────────────────────────────────────────

function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function fmtDay(iso: string): string {
  const [, , dd] = iso.split("-");
  return dd;
}

function fmtMonth(iso: string): string {
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  return months[parseInt(iso.split("-")[1]) - 1];
}

function sofaBarColor(total: number): string {
  if (total <= 6)  return "bg-emerald-400";
  if (total <= 9)  return "bg-amber-400";
  if (total <= 12) return "bg-orange-400";
  if (total <= 14) return "bg-rose-500";
  return "bg-rose-600";
}

function DeltaChip({ current, prev }: { current: number; prev?: number }) {
  if (prev === undefined) return <span className="text-[9px] text-slate-400">–</span>;
  const delta = current - prev;
  if (delta < 0) return (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
      <TrendingDown size={10} /> {Math.abs(delta)}
    </span>
  );
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-rose-500">
      <TrendingUp size={10} /> +{delta}
    </span>
  );
  return <span className="flex items-center gap-0.5 text-[10px] text-slate-400"><Minus size={10} /> 0</span>;
}

// ── SOFABarChart ───────────────────────────────────────────

function SOFABarChart({ sofa }: { sofa: SOFAEntry[] }) {
  const days   = last7Days();
  const byDate = Object.fromEntries(sofa.map((e) => [e.tanggal, e]));
  const MAX    = 24;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Tren SOFA — 7 Hari Terakhir
      </p>

      {/* Bar chart */}
      <div className="flex items-end justify-between gap-1.5">
        {days.map((d, i) => {
          const entry = byDate[d];
          const pct   = entry ? (entry.total / MAX) * 100 : 0;
          const color = entry ? sofaBarColor(entry.total) : "bg-slate-100";
          const isToday = d === TODAY;

          return (
            <div key={d} className="flex flex-1 flex-col items-center gap-1">
              {/* Value label above bar */}
              <span className={cn(
                "text-[10px] font-semibold tabular-nums",
                entry ? "text-slate-700" : "text-slate-300",
              )}>
                {entry ? entry.total : "–"}
              </span>

              {/* Bar */}
              <div className="relative w-full" style={{ height: 80 }}>
                <div className="absolute inset-x-0 bottom-0 h-full overflow-hidden rounded-t-lg bg-slate-100">
                  <motion.div
                    className={cn("absolute inset-x-0 bottom-0 rounded-t-lg", color)}
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
                  />
                </div>
                {isToday && (
                  <div className="absolute inset-x-0 -bottom-1 flex justify-center">
                    <div className="h-1 w-1 rounded-full bg-sky-500" />
                  </div>
                )}
              </div>

              {/* Day label */}
              <div className="text-center">
                <p className={cn("text-[10px] font-semibold", isToday ? "text-sky-600" : "text-slate-500")}>
                  {fmtDay(d)}
                </p>
                {i === 0 || fmtMonth(d) !== fmtMonth(days[i - 1]) ? (
                  <p className="text-[8px] text-slate-400">{fmtMonth(d)}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          { label: "≤6 Rendah",   cls: "bg-emerald-400" },
          { label: "7–9 Sedang",  cls: "bg-amber-400"   },
          { label: "10–12 Tinggi",cls: "bg-orange-400"  },
          { label: "13+ Kritis",  cls: "bg-rose-500"    },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1 text-[9px] text-slate-400">
            <span className={cn("h-2 w-2 rounded-sm", l.cls)} />
            {l.label}
          </span>
        ))}
        <span className="flex items-center gap-1 text-[9px] text-sky-500">
          <span className="h-1 w-1 rounded-full bg-sky-500" /> Hari ini
        </span>
      </div>
    </div>
  );
}

// ── SummaryTable ───────────────────────────────────────────

function SummaryTable({ data }: { data: ICUScoringData }) {
  const sortedSOFA   = [...data.sofa].sort((a, b)   => b.tanggal.localeCompare(a.tanggal));
  const sortedAPACHE = [...data.apache].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  if (sortedSOFA.length === 0 && sortedAPACHE.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-8 text-center">
        <CalendarDays size={24} className="mx-auto mb-2 text-slate-300" />
        <p className="text-xs text-slate-400">Belum ada data scoring yang tersimpan</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <p className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
        Ringkasan Harian
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500">Tanggal</th>
              <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-500">SOFA</th>
              <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-500">Delta</th>
              <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-500">APACHE II</th>
              <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-500">Mortalitas</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedSOFA.map((s, i) => {
              const prev       = sortedSOFA[i + 1];
              const sofaRisk   = getSOFARisk(s.total);
              const apacheEntry = sortedAPACHE.find((a) => a.tanggal === s.tanggal)
                ?? sortedAPACHE.find((a) => a.tanggal <= s.tanggal);

              return (
                <motion.tr
                  key={s.tanggal}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <div>
                      <p className="font-semibold text-slate-700 tabular-nums">
                        {s.tanggal.slice(8)} {fmtMonth(s.tanggal)}
                      </p>
                      {s.tanggal === TODAY && (
                        <span className="text-[8px] font-bold text-sky-500 uppercase tracking-wide">Hari ini</span>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", sofaRisk.cls)}>
                      {s.total}
                    </span>
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    <DeltaChip current={s.total} prev={prev?.total} />
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    {apacheEntry ? (
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", getAPACHERisk(apacheEntry.total).cls)}>
                        {apacheEntry.total}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300">–</span>
                    )}
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    {apacheEntry ? (
                      <span className="text-[11px] font-semibold tabular-nums text-slate-700">
                        {apacheEntry.mortalitas}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300">–</span>
                    )}
                  </td>

                  <td className="px-3 py-2.5">
                    <span className={cn("text-[9px] font-semibold", sofaRisk.cls.split(" ").slice(1, 2).join(" "))}>
                      {sofaRisk.label} · {sofaRisk.mort}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── TrendPane ─────────────────────────────────────────────

export default function TrendPane({ data }: { data: ICUScoringData }) {
  return (
    <div className="flex flex-col gap-4">
      <SOFABarChart sofa={data.sofa} />
      <SummaryTable data={data} />
    </div>
  );
}
