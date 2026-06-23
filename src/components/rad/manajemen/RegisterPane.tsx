"use client";

// Register Pemeriksaan Radiologi — DB-driven dari order pemeriksaan (medicalrecord.RadOrder via
// GET /rad/orders). Statistik nyata: volume harian, per-modalitas, per-unit, distribusi status,
// Selesai/Proses/CITO/Ditolak. TAT & temuan kritis butuh data HASIL (RadResult) → menyusul.
// Aksen teal (modul Rad). Order "Dibatalkan" dikecualikan server (worklist aktif).

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart2, Layers, CheckCircle2, Loader2, RefreshCw, Zap, Activity, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { listRadWorklist, type RadOrderWorklistDTO } from "@/lib/api/rad/radOrder";

// ── Modalitas (kode FHIR method) → label + warna ───────────
const MOD_LABEL: Record<string, string> = {
  XR: "X-Ray", CT: "CT Scan", MR: "MRI", RF: "Fluoroskopi", US: "USG", MG: "Mammografi", DXA: "Densitometri", NM: "Ked. Nuklir",
};
const MOD_COLOR: Record<string, string> = {
  XR: "bg-teal-500", CT: "bg-sky-500", US: "bg-violet-500", MR: "bg-rose-500",
  MG: "bg-pink-400", RF: "bg-orange-400", DXA: "bg-lime-500", NM: "bg-amber-500",
};
const modLabel = (m: string) => MOD_LABEL[m] ?? (m || "Lainnya");
const modColor = (m: string) => MOD_COLOR[m] ?? "bg-slate-400";

// ── Status order → label + warna ───────────────────────────
const STATUS_ORDER = ["Menunggu", "Diterima", "Diperiksa", "Divalidasi", "Selesai", "Ditolak"] as const;
const STATUS_LABEL: Record<string, string> = {
  Menunggu: "Belum Diterima", Diterima: "Diterima", Diperiksa: "Akuisisi", Divalidasi: "Validasi", Selesai: "Selesai", Ditolak: "Ditolak",
};
const STATUS_COLOR: Record<string, string> = {
  Menunggu: "bg-amber-400", Diterima: "bg-teal-400", Diperiksa: "bg-sky-400", Divalidasi: "bg-cyan-400", Selesai: "bg-emerald-500", Ditolak: "bg-rose-500",
};
const ACTIVE = new Set(["Diterima", "Diperiksa", "Divalidasi"]);

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
const fmtTgl = (k: string) => new Date(k + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short" });

// ── Horizontal Bar ─────────────────────────────────────────
function HBar({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  const pct = max > 0 ? (val / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5">
      <p className="w-28 shrink-0 truncate text-[11px] text-slate-600">{label}</p>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} className={cn("h-3 rounded-full", color)} />
      </div>
      <p className="w-8 shrink-0 text-right text-[11px] font-semibold text-slate-700">{val}</p>
    </div>
  );
}

// ── Volume sparkline (oldest→newest) ───────────────────────
function Sparkline({ series }: { series: number[] }) {
  const max = Math.max(...series, 1);
  if (series.length === 0) return null;
  return (
    <svg viewBox={`0 0 ${series.length * 8} 40`} className="w-full" preserveAspectRatio="none">
      <polyline
        points={series.map((v, i) => `${i * 8 + 4},${40 - (v / max) * 34}`).join(" ")}
        fill="none" stroke="#0d9488" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
      />
      {series.map((v, i) => (
        <circle key={i} cx={i * 8 + 4} cy={40 - (v / max) * 34} r="1.5" fill="#0d9488" />
      ))}
    </svg>
  );
}

// ── Main ───────────────────────────────────────────────────
type FilterDays = 1 | 7 | 30;

interface DailyRow {
  tanggal: string; order: number; pemeriksaan: number;
  selesai: number; proses: number; ditolak: number; cito: number;
}

export default function RegisterPane() {
  const [days, setDays] = useState<FilterDays>(7);
  const [orders, setOrders] = useState<RadOrderWorklistDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  const refetch = useCallback(async (signal?: AbortSignal) => {
    try {
      const rows = await listRadWorklist({}, signal);
      if (!signal?.aborted) { setOrders(rows); setErr(false); }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (!signal?.aborted) setErr(true);
    } finally {
      if (!signal?.aborted) { setLoading(false); setBusy(false); }
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void refetch(ac.signal);
    return () => ac.abort();
  }, [refetch]);

  // Order dalam jendela waktu (berdasar createdAt, hari lokal).
  const windowed = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    return orders.filter((o) => new Date(o.createdAt) >= start);
  }, [orders, days]);

  // Agregat utama.
  const agg = useMemo(() => {
    let pemeriksaan = 0, selesai = 0, proses = 0, ditolak = 0, cito = 0;
    const byMod: Record<string, number> = {};
    const byUnit: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const o of windowed) {
      const n = o.items.length;
      pemeriksaan += n;
      if (o.status === "Selesai") selesai++;
      else if (ACTIVE.has(o.status)) proses++;
      if (o.status === "Ditolak") ditolak++;
      if (o.prioritas === "CITO") cito++;
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
      byUnit[o.unit] = (byUnit[o.unit] ?? 0) + n;
      for (const it of o.items) {
        const m = it.modalitas || "—";
        byMod[m] = (byMod[m] ?? 0) + 1;
      }
    }
    return { totalOrder: windowed.length, pemeriksaan, selesai, proses, ditolak, cito, byMod, byUnit, byStatus };
  }, [windowed]);

  // Rincian harian (terbaru dahulu) + seri sparkline (lama→baru).
  const daily = useMemo<DailyRow[]>(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const keys: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      keys.push(dayKey(d));
    }
    const map = new Map<string, DailyRow>();
    for (const k of keys) map.set(k, { tanggal: k, order: 0, pemeriksaan: 0, selesai: 0, proses: 0, ditolak: 0, cito: 0 });
    for (const o of windowed) {
      const e = map.get(dayKey(new Date(o.createdAt)));
      if (!e) continue;
      e.order++;
      e.pemeriksaan += o.items.length;
      if (o.status === "Selesai") e.selesai++;
      else if (ACTIVE.has(o.status)) e.proses++;
      if (o.status === "Ditolak") e.ditolak++;
      if (o.prioritas === "CITO") e.cito++;
    }
    return keys.map((k) => map.get(k)!);
  }, [windowed, days]);

  const series = useMemo(() => [...daily].reverse().map((d) => d.pemeriksaan), [daily]);
  const maxMod = useMemo(() => Math.max(...Object.values(agg.byMod), 1), [agg.byMod]);
  const maxUnit = useMemo(() => Math.max(...Object.values(agg.byUnit), 1), [agg.byUnit]);
  const maxStatus = useMemo(() => Math.max(...Object.values(agg.byStatus), 1), [agg.byStatus]);
  const pctSelesai = agg.totalOrder > 0 ? Math.round((agg.selesai / agg.totalOrder) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-12 text-slate-400">
        <Loader2 size={15} className="animate-spin" /> <span className="text-xs">Memuat register pemeriksaan…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13px] font-bold text-slate-800">Register Pemeriksaan Radiologi</p>
          <p className="text-[11px] text-slate-400">Dari order pemeriksaan (real-time) · PMK 1014/2008</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setBusy(true); void refetch(); }}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={12} className={cn(busy && "animate-spin")} /> Muat ulang
          </button>
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            {([1, 7, 30] as FilterDays[]).map((d) => (
              <button key={d} onClick={() => setDays(d)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all",
                  days === d ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-700",
                )}>
                {d === 1 ? "Hari Ini" : d === 7 ? "7 Hari" : "30 Hari"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {err && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          <AlertTriangle size={13} /> Gagal memuat sebagian data order — tekan “Muat ulang”.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { icon: BarChart2,    label: "Total Order",      val: agg.totalOrder,             color: "text-teal-700",  bg: "bg-teal-50 border-teal-200" },
          { icon: Layers,       label: "Total Pemeriksaan", val: agg.pemeriksaan,           color: "text-slate-700", bg: "bg-white border-slate-200" },
          { icon: CheckCircle2, label: "Selesai",          val: `${agg.selesai} (${pctSelesai}%)`, color: agg.selesai > 0 ? "text-emerald-700" : "text-slate-400", bg: "bg-white border-slate-200" },
          { icon: Activity,     label: "Dalam Proses",     val: agg.proses,                 color: agg.proses > 0 ? "text-sky-700" : "text-slate-400", bg: "bg-white border-slate-200" },
          { icon: Zap,          label: "CITO",             val: agg.cito,                   color: agg.cito > 0 ? "text-rose-600" : "text-slate-400", bg: agg.cito > 0 ? "bg-rose-50 border-rose-200" : "bg-white border-slate-200" },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-xl border px-4 py-3", s.bg)}>
            <s.icon size={13} className={cn("mb-1", s.color)} />
            <p className="text-[10px] text-slate-400">{s.label}</p>
            <p className={cn("text-xl font-bold", s.color)}>{s.val}</p>
          </motion.div>
        ))}
      </div>

      {windowed.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center">
          <BarChart2 size={22} className="text-slate-300" />
          <p className="text-xs text-slate-400">Belum ada order pemeriksaan pada periode ini.</p>
        </div>
      ) : (
        <>
          {/* Sparkline + breakdown */}
          <div className="grid gap-4 md:grid-cols-[1fr_220px_220px]">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[11px] font-bold text-slate-700">
                Volume Harian ({days === 1 ? "Hari Ini" : days === 7 ? "7 Hari Terakhir" : "30 Hari Terakhir"})
              </p>
              <Sparkline series={series} />
              <div className="mt-2 flex justify-between text-[9px] text-slate-400">
                <span>{days === 1 ? "Hari ini" : `${days} hari lalu`}</span>
                <span>Hari ini</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[11px] font-bold text-slate-700">Per Modalitas</p>
              <div className="flex flex-col gap-2">
                {Object.entries(agg.byMod).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <HBar key={k} label={modLabel(k)} val={v} max={maxMod} color={modColor(k)} />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[11px] font-bold text-slate-700">Per Unit Pengirim</p>
              <div className="flex flex-col gap-2">
                {Object.entries(agg.byUnit).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <HBar key={k} label={k} val={v} max={maxUnit} color="bg-teal-400" />
                ))}
              </div>
            </div>
          </div>

          {/* Distribusi status */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-[11px] font-bold text-slate-700">Distribusi Status Order</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {STATUS_ORDER.filter((s) => (agg.byStatus[s] ?? 0) > 0).map((s) => (
                <HBar key={s} label={STATUS_LABEL[s]} val={agg.byStatus[s] ?? 0} max={maxStatus} color={STATUS_COLOR[s]} />
              ))}
            </div>
          </div>

          {/* Log harian */}
          <div>
            <p className="mb-2 text-[11px] font-bold text-slate-700">Log Harian</p>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Tanggal</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Order</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Pemeriksaan</th>
                    <th className="hidden px-3 py-2.5 text-right font-semibold text-slate-500 sm:table-cell">Selesai</th>
                    <th className="hidden px-3 py-2.5 text-right font-semibold text-slate-500 sm:table-cell">Proses</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-slate-500">CITO</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Ditolak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {daily.slice(0, 14).map((d, i) => (
                    <motion.tr key={d.tanggal} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-600">{fmtTgl(d.tanggal)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-800">{d.order || <span className="text-slate-300">—</span>}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{d.pemeriksaan || <span className="text-slate-300">—</span>}</td>
                      <td className="hidden px-3 py-2 text-right sm:table-cell">{d.selesai > 0 ? <span className="font-semibold text-emerald-600">{d.selesai}</span> : <span className="text-slate-300">—</span>}</td>
                      <td className="hidden px-3 py-2 text-right sm:table-cell">{d.proses > 0 ? <span className="text-sky-600">{d.proses}</span> : <span className="text-slate-300">—</span>}</td>
                      <td className="px-3 py-2 text-right">{d.cito > 0 ? <span className="font-bold text-rose-600">{d.cito}</span> : <span className="text-slate-300">—</span>}</td>
                      <td className="px-3 py-2 text-right">{d.ditolak > 0 ? <span className="font-semibold text-amber-600">{d.ditolak}</span> : <span className="text-slate-300">—</span>}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[9px] text-slate-400">
              Menampilkan {Math.min(daily.length, 14)} hari · Statistik dari order pemeriksaan (maks. 200 order terbaru) ·
              TAT &amp; temuan kritis menyusul dari data hasil ekspertise.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
