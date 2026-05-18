"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, BeakerIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type QCParameter, type WestgardRule,
  QC_PARAMETERS, WESTGARD_CFG, checkWestgard,
} from "./manajemenShared";

// ── Levey-Jennings SVG Chart ──────────────────────────────

const SVG_W = 540, SVG_H = 190;
const PAD = { l: 48, r: 16, t: 18, b: 32 };
const CW = SVG_W - PAD.l - PAD.r;
const CH = SVG_H - PAD.t - PAD.b;
const CX0 = PAD.l, CY0 = PAD.t;
const MID_Y = CY0 + CH / 2; // y for mean line
const SD_RANGE = 3.5;

function sdY(sd: number, sdCount: number): number {
  return MID_Y - (sdCount / SD_RANGE) * (CH / 2);
}

function runX(i: number, total: number): number {
  if (total <= 1) return CX0 + CW / 2;
  return CX0 + (i / (total - 1)) * CW;
}

function pointColor(rules: WestgardRule[] | undefined): { fill: string; stroke: string } {
  if (!rules || rules.length === 0) return { fill: "#10b981", stroke: "#059669" };
  const isReject = rules.some((r) => WESTGARD_CFG[r].severity === "reject");
  return isReject
    ? { fill: "#f43f5e", stroke: "#e11d48" }
    : { fill: "#f59e0b", stroke: "#d97706" };
}

function LeveyJenninsChart({ param, violations }: {
  param: QCParameter;
  violations: Map<string, WestgardRule[]>;
}) {
  const { runs, lot } = param;
  const { mean, sd } = lot;
  const N = runs.length;

  const lines = [
    { sd: 3,  stroke: "#fca5a5", dash: "4,3", label: "+3SD" },
    { sd: 2,  stroke: "#fcd34d", dash: "4,3", label: "+2SD" },
    { sd: 1,  stroke: "#bae6fd", dash: "2,3", label: "+1SD" },
    { sd: 0,  stroke: "#94a3b8", dash: "",    label: "Mean" },
    { sd: -1, stroke: "#bae6fd", dash: "2,3", label: "-1SD" },
    { sd: -2, stroke: "#fcd34d", dash: "4,3", label: "-2SD" },
    { sd: -3, stroke: "#fca5a5", dash: "4,3", label: "-3SD" },
  ];

  const points = runs.map((r, i) => {
    const x = runX(i, N);
    const y = MID_Y - ((r.nilai - mean) / (SD_RANGE * sd)) * (CH / 2);
    const clampedY = Math.max(CY0 + 2, Math.min(CY0 + CH - 2, y));
    return { x, y: clampedY, run: r };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" aria-label="Levey-Jennings Chart">
      {/* Band backgrounds */}
      <rect x={CX0} y={sdY(sd, 3)} width={CW} height={sdY(sd, -3) - sdY(sd, 3)} fill="#fff1f2" opacity="0.4" />
      <rect x={CX0} y={sdY(sd, 2)} width={CW} height={sdY(sd, -2) - sdY(sd, 2)} fill="#fffbeb" opacity="0.5" />
      <rect x={CX0} y={sdY(sd, 1)} width={CW} height={sdY(sd, -1) - sdY(sd, 1)} fill="#f0f9ff" opacity="0.6" />

      {/* Horizontal SD lines */}
      {lines.map(({ sd: s, stroke, dash, label }) => {
        const y = sdY(sd, s);
        return (
          <g key={s}>
            <line x1={CX0} y1={y} x2={CX0 + CW} y2={y} stroke={stroke} strokeWidth={s === 0 ? 1.5 : 1} strokeDasharray={dash} />
            <text x={CX0 - 4} y={y + 3.5} textAnchor="end" fontSize={8.5} fill={stroke} fontWeight={s === 0 ? "700" : "500"}>{label}</text>
          </g>
        );
      })}

      {/* X axis ticks */}
      {runs.map((r, i) => (
        <text key={r.id} x={runX(i, N)} y={CY0 + CH + 14} textAnchor="middle" fontSize={8} fill="#94a3b8">
          {r.no}
        </text>
      ))}
      <text x={CX0 + CW / 2} y={CY0 + CH + 26} textAnchor="middle" fontSize={8} fill="#cbd5e1">Run #</text>

      {/* Connecting line */}
      <polyline points={polyline} fill="none" stroke="#cbd5e1" strokeWidth={1} />

      {/* Data points */}
      {points.map((p, i) => {
        const rules = violations.get(p.run.id);
        const { fill, stroke } = pointColor(rules);
        return (
          <g key={p.run.id}>
            <circle
              cx={p.x} cy={p.y}
              r={i === N - 1 ? 5 : 4}
              fill={fill} stroke={stroke} strokeWidth={1.5}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ── Param Card ────────────────────────────────────────────

function ParamCard({ param, active, onClick }: {
  param: QCParameter; active: boolean; onClick: () => void;
}) {
  const violations = useMemo(() => checkWestgard(param.runs, param.lot), [param]);
  const rejectCount  = [...violations.values()].filter((r) => r.some((x) => WESTGARD_CFG[x].severity === "reject")).length;
  const warningCount = [...violations.values()].filter((r) => r.every((x) => WESTGARD_CFG[x].severity === "warning")).length;
  const lastRun = param.runs[param.runs.length - 1];
  const lastRules = violations.get(lastRun?.id);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all",
        active
          ? "border-sky-300 bg-sky-50 shadow-sm"
          : rejectCount > 0
            ? "border-rose-200 bg-rose-50/50 hover:bg-rose-50"
            : warningCount > 0
              ? "border-amber-200 bg-amber-50/50 hover:bg-amber-50"
              : "border-slate-200 bg-white hover:bg-slate-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-bold text-slate-800">{param.paramNama}</p>
          <p className="text-[10px] text-slate-400">{param.instrumen}</p>
        </div>
        <div className="shrink-0 text-right">
          {rejectCount > 0 && (
            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">
              {rejectCount} REJECT
            </span>
          )}
          {rejectCount === 0 && warningCount > 0 && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
              {warningCount} warn
            </span>
          )}
          {rejectCount === 0 && warningCount === 0 && (
            <CheckCircle2 size={13} className="text-emerald-500" />
          )}
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500">
        <span>Lot: {param.lot.lotNumber}</span>
        <span>·</span>
        <span>CV {param.lot.cv}%</span>
        {lastRun && (
          <>
            <span>·</span>
            <span className={cn(lastRules ? "font-semibold text-rose-600" : "text-slate-400")}>
              Run {lastRun.no}: {lastRun.nilai} {param.satuan}
            </span>
          </>
        )}
      </div>
    </button>
  );
}

// ── Violation List ────────────────────────────────────────

function ViolationList({ param, violations }: {
  param: QCParameter; violations: Map<string, WestgardRule[]>;
}) {
  const items = param.runs
    .filter((r) => violations.has(r.id))
    .map((r) => ({ run: r, rules: violations.get(r.id)! }));

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
        <p className="text-[11px] font-semibold text-emerald-700">Tidak ada pelanggaran Westgard — QC In-Control</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {items.map(({ run, rules }) => {
        const hasReject = rules.some((r) => WESTGARD_CFG[r].severity === "reject");
        return (
          <div
            key={run.id}
            className={cn(
              "flex items-start gap-2.5 rounded-lg border px-3 py-2",
              hasReject ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50",
            )}
          >
            <AlertTriangle size={12} className={cn("mt-0.5 shrink-0", hasReject ? "text-rose-500" : "text-amber-500")} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-700">Run {run.no}</span>
                <span className="text-[10px] text-slate-400">{run.tanggal} · {run.shift}</span>
                <span className="text-[11px] font-semibold text-slate-600">{run.nilai} {param.satuan}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {rules.map((rule) => (
                  <span
                    key={rule}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-bold",
                      WESTGARD_CFG[rule].severity === "reject"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {rule}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function InternalQCPane() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const param    = QC_PARAMETERS[selectedIdx];
  const violations = useMemo(() => checkWestgard(param.runs, param.lot), [param]);

  const rejectTotal  = [...violations.values()].filter((r) => r.some((x) => WESTGARD_CFG[x].severity === "reject")).length;
  const warningTotal = [...violations.values()].filter((r) => r.every((x) => WESTGARD_CFG[x].severity === "warning")).length;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[240px_1fr]">

      {/* Left — parameter list */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
          <BeakerIcon size={14} className="text-sky-600 shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-sky-800">QC Internal</p>
            <p className="text-[10px] text-sky-600">Levey-Jennings · ISO 15189 §5.6.3</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {QC_PARAMETERS.map((p, i) => (
            <ParamCard key={p.paramNama} param={p} active={i === selectedIdx} onClick={() => setSelectedIdx(i)} />
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Westgard Rules</p>
          <div className="space-y-1.5">
            {(Object.entries(WESTGARD_CFG) as [WestgardRule, typeof WESTGARD_CFG[WestgardRule]][]).map(([rule, cfg]) => (
              <div key={rule} className="flex items-start gap-2">
                <span className={cn(
                  "mt-0.5 shrink-0 rounded px-1 py-0.5 text-[8px] font-bold",
                  cfg.severity === "reject" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700",
                )}>{rule}</span>
                <p className="text-[10px] text-slate-500 leading-relaxed">{cfg.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[9px] text-slate-400">ISO 15189:2022 §5.6.3 · Westgard 1981</p>
        </div>
      </div>

      {/* Right — chart + violations */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={param.paramNama}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Chart header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{param.paramNama} — {param.instrumen}</p>
                <p className="text-[11px] text-slate-400">
                  Lot {param.lot.lotNumber} · Mean {param.lot.mean} {param.satuan} · SD {param.lot.sd} · CV {param.lot.cv}%
                </p>
              </div>
              <div className="flex gap-2">
                {rejectTotal > 0 && (
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold text-rose-700">
                    {rejectTotal} Reject
                  </span>
                )}
                {warningTotal > 0 && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                    {warningTotal} Warning
                  </span>
                )}
                {rejectTotal === 0 && warningTotal === 0 && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">In-Control</span>
                )}
              </div>
            </div>

            {/* LJ Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <LeveyJenninsChart param={param} violations={violations} />
              <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Normal</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Warning (1-2s)</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Reject</span>
                <span className="ml-auto text-[9px] text-slate-400">Total {param.runs.length} run · {param.lot.tglMasuk} s/d {param.lot.tglKadaluarsa}</span>
              </div>
            </div>

            {/* Lot info */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Mean Target", value: `${param.lot.mean} ${param.satuan}` },
                { label: "SD",          value: `±${param.lot.sd} ${param.satuan}` },
                { label: "% CV",        value: `${param.lot.cv}%` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-2.5 text-center">
                  <p className="text-[10px] text-slate-400">{label}</p>
                  <p className="text-[13px] font-bold text-slate-800">{value}</p>
                </div>
              ))}
            </div>

            {/* Violations */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Log Pelanggaran</p>
                <Info size={11} className="text-slate-300" />
              </div>
              <ViolationList param={param} violations={violations} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
