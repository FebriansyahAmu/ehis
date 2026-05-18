"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type LabOrder, FLAG_CFG } from "../labShared";
import {
  type TrendDataPoint, type DeltaResult,
  getTrendHistory, calcDelta, getParamsWithHistory, DELTA_THRESHOLDS,
} from "../trend/trendShared";

interface Props { order: LabOrder }

// ── Mini Sparkline (left panel cards) ────────────────────

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) {
    return (
      <svg width={80} height={28} className="overflow-visible">
        <line x1={0} y1={14} x2={80} y2={14} stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
      </svg>
    );
  }
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pad = 4;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * (80 - pad * 2) + pad,
    y: (28 - pad * 2) - ((v - min) / range) * (28 - pad * 2) + pad,
  }));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg width={80} height={28} className="overflow-visible shrink-0">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y}
          r={i === pts.length - 1 ? 3.5 : 2}
          fill={i === pts.length - 1 ? color : "white"}
          stroke={color} strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

// ── Full Sparkline (right panel) ──────────────────────────

function FullSparkline({ data }: { data: TrendDataPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex h-24 items-center justify-center text-[11px] text-slate-300">
        Data tidak cukup untuk menampilkan tren
      </div>
    );
  }
  const W = 300, H = 90;
  const values = data.map((d) => d.nilai);
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const px = 12, py = 12;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * (W - px * 2) + px,
    y: (H - py * 2) - ((v - min) / range) * (H - py * 2) + py,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${H - py} L${pts[0].x},${H - py} Z`;

  const DOT_COLOR: Record<string, string> = { C: "#dc2626", H: "#d97706", L: "#0284c7", N: "#10b981" };

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#trendGrad)" />
      <path d={linePath} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const c = DOT_COLOR[data[i].flag ?? "N"];
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5} fill={c} opacity="0.9" />
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fill="#475569" fontWeight="600">
              {data[i].nilai}
            </text>
            <text x={p.x} y={H - 2} textAnchor="middle" fontSize="8" fill="#94a3b8">
              {data[i].tanggal.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Delta Badge ───────────────────────────────────────────

function DeltaBadge({ delta }: { delta: DeltaResult | null }) {
  if (!delta) return null;
  const Icon = delta.direction === "up" ? TrendingUp : TrendingDown;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
      delta.triggered
        ? "bg-amber-100 text-amber-700"
        : delta.direction === "up"
          ? "bg-rose-50 text-rose-500"
          : "bg-sky-50 text-sky-600",
    )}>
      <Icon size={9} />
      {delta.direction === "up" ? "+" : "-"}{delta.absolute}
      {delta.triggered && " ⚠"}
    </span>
  );
}

// ── Parameter Card (left panel) ───────────────────────────

function ParamCard({ noRM, param, currentNilai, currentFlag, satuan, selected, onClick }: {
  noRM: string; param: string; currentNilai?: number;
  currentFlag?: string; satuan: string;
  selected: boolean; onClick: () => void;
}) {
  const history = getTrendHistory(noRM, param);
  const values  = history.map((d) => d.nilai);
  const prev    = history.length >= 2 ? history[history.length - 2] : null;
  const delta   = (currentNilai !== undefined && prev) ? calcDelta(currentNilai, prev.nilai, param) : null;

  const lineColor =
    currentFlag === "C" ? "#dc2626" :
    currentFlag === "H" ? "#d97706" :
    currentFlag === "L" ? "#0284c7" :
    "#10b981";

  const valueCls =
    currentFlag === "C" ? "text-rose-700" :
    currentFlag === "H" ? "text-amber-700" :
    currentFlag === "L" ? "text-sky-700"   :
    "text-emerald-700";

  return (
    <motion.button
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all",
        selected
          ? "border-sky-300 bg-sky-50 ring-1 ring-sky-200 shadow-sm"
          : "border-slate-200 bg-white hover:border-sky-200 hover:shadow-sm",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="truncate text-[11px] font-bold text-slate-700">{param}</p>
          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
            {currentNilai !== undefined ? (
              <span className={cn("text-sm font-bold", valueCls)}>
                {currentNilai}
                <span className="ml-0.5 text-[10px] font-normal text-slate-400">{satuan}</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-300">Belum dientry</span>
            )}
            <DeltaBadge delta={delta} />
          </div>
        </div>
        <MiniSparkline data={values} color={lineColor} />
      </div>
      {delta?.triggered && (
        <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-amber-700">
          <AlertTriangle size={9} />
          {delta.thresholdLabel}
        </p>
      )}
    </motion.button>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function TrendPane({ order }: Props) {
  const historyParams = useMemo(() => getParamsWithHistory(order.noRM), [order.noRM]);

  const currentMap = useMemo(() => {
    const map = new Map<string, { nilai?: number; flag?: string; satuan: string }>();
    for (const h of (order.hasil ?? [])) {
      const v = h.nilai ? parseFloat(h.nilai) : undefined;
      map.set(h.nama, { nilai: (v !== undefined && !isNaN(v)) ? v : undefined, flag: h.flag, satuan: h.satuan });
    }
    return map;
  }, [order.hasil]);

  const allParams = useMemo(() => {
    const set = new Set([...historyParams, ...currentMap.keys()]);
    return [...set].filter((p) => getTrendHistory(order.noRM, p).length > 0);
  }, [historyParams, currentMap, order.noRM]);

  const [selected, setSelected] = useState<string | null>(allParams[0] ?? null);

  const selectedHistory = useMemo(
    () => selected ? getTrendHistory(order.noRM, selected) : [],
    [selected, order.noRM],
  );

  const deltaAlerts = useMemo(() =>
    allParams.filter((p) => {
      const cur  = currentMap.get(p);
      const hist = getTrendHistory(order.noRM, p);
      if (!cur?.nilai || hist.length < 2) return false;
      const prev  = hist[hist.length - 2];
      return calcDelta(cur.nilai, prev.nilai, p)?.triggered ?? false;
    }),
    [allParams, currentMap, order.noRM],
  );

  if (allParams.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-16 text-center">
        <BarChart3 size={28} className="text-slate-300" />
        <p className="text-sm text-slate-400">Belum ada data historis untuk pasien ini</p>
        <p className="text-[11px] text-slate-300">Muncul setelah hasil pertama dirilis</p>
      </div>
    );
  }

  const selCurrent = selected ? currentMap.get(selected) : undefined;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_300px]">

      {/* Left — parameter list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Trend Parameter Lab</h3>
            <p className="text-[11px] text-slate-400">{order.namaPasien} · {order.noRM}</p>
          </div>
          <AnimatePresence>
            {deltaAlerts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 shrink-0"
              >
                <AlertTriangle size={12} className="text-amber-600" />
                <span className="text-[11px] font-bold text-amber-700">
                  {deltaAlerts.length} delta check
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          {allParams.map((param) => {
            const cur = currentMap.get(param);
            return (
              <ParamCard
                key={param}
                noRM={order.noRM}
                param={param}
                currentNilai={cur?.nilai}
                currentFlag={cur?.flag}
                satuan={cur?.satuan ?? ""}
                selected={selected === param}
                onClick={() => setSelected(param)}
              />
            );
          })}
        </div>
      </div>

      {/* Right — detail */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {selected && selectedHistory.length > 0 ? (
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {/* Chart card */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-0.5 text-[12px] font-bold text-slate-700">{selected}</p>
                <p className="mb-3 text-[10px] text-slate-400">{selectedHistory.length} titik data · {selCurrent?.satuan}</p>
                <FullSparkline data={selectedHistory} />
              </div>

              {/* History table */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-4 py-2">
                  <p className="text-[11px] font-bold text-slate-600">Riwayat Hasil</p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-1.5 text-left text-[10px] text-slate-400">Tanggal</th>
                      <th className="px-3 py-1.5 text-right text-[10px] text-slate-400">Nilai</th>
                      <th className="px-3 py-1.5 text-left text-[10px] text-slate-400">Flag</th>
                      <th className="px-3 py-1.5 text-left text-[10px] text-slate-400">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedHistory.map((pt, i) => {
                      const prev    = i > 0 ? selectedHistory[i - 1] : null;
                      const delta   = prev ? calcDelta(pt.nilai, prev.nilai, selected) : null;
                      const flagCfg = pt.flag ? FLAG_CFG[pt.flag] : null;
                      return (
                        <tr key={i} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-2 text-[11px] text-slate-600">{pt.tanggal.slice(5)}</td>
                          <td className={cn("px-3 py-2 text-right text-sm font-bold", flagCfg?.cls ?? "text-slate-500")}>
                            {pt.nilai}
                          </td>
                          <td className="px-3 py-2">
                            {pt.flag && (
                              <span className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                                pt.flag === "C" ? "bg-rose-100 text-rose-700" :
                                pt.flag === "H" ? "bg-amber-100 text-amber-700" :
                                pt.flag === "L" ? "bg-sky-100 text-sky-700" :
                                "bg-emerald-50 text-emerald-700",
                              )}>
                                {flagCfg?.label}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {delta ? <DeltaBadge delta={delta} /> : <span className="text-[10px] text-slate-300">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Delta threshold info */}
              {DELTA_THRESHOLDS[selected] && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                  <p className="text-[10px] font-bold text-amber-700 mb-0.5">Threshold Delta Check</p>
                  <p className="text-[11px] text-amber-800">{DELTA_THRESHOLDS[selected].label}</p>
                  <p className="mt-1 text-[9px] text-amber-600">ISO 15189:2022 §5.6.2</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-12 text-center"
            >
              <BarChart3 size={20} className="text-slate-300" />
              <p className="text-[11px] text-slate-400">Pilih parameter untuk melihat detail</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
