"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Clock, Users } from "lucide-react";
import {
  buildAgingData,
  buildStuckClaims,
  type AgingRow,
} from "@/lib/eklaim/dashboardShared";
import { formatRupiahShort } from "@/lib/eklaim/money";

// ── Color map per penjamin ─────────────────────────────

const PENJAMIN_CFG = {
  bpjs: {
    label: "BPJS",
    bar: "bg-teal-500",
    text: "text-teal-700",
    dot: "bg-teal-500",
  },
  asuransi: {
    label: "Asuransi",
    bar: "bg-sky-500",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
  jamkesda: {
    label: "Jamkesda",
    bar: "bg-amber-400",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
} as const;

type PenjaminKey = keyof typeof PENJAMIN_CFG;

const BUCKET_TONE: Record<AgingRow["bucket"], { bg: string; text: string; label: string }> = {
  "0-30":  { bg: "bg-emerald-50 text-emerald-700", text: "text-emerald-700", label: "0–30 hari" },
  "31-60": { bg: "bg-amber-50 text-amber-700",     text: "text-amber-700",   label: "31–60 hari" },
  "61-90": { bg: "bg-rose-50 text-rose-700",       text: "text-rose-700",    label: "61–90 hari" },
  ">90":   { bg: "bg-rose-100 text-rose-800",      text: "text-rose-800",    label: "> 90 hari" },
};

// ── Panel ──────────────────────────────────────────────

export default function AgingKlaimPanel() {
  const agingRows   = useMemo(() => buildAgingData(), []);
  const stuckClaims = useMemo(() => buildStuckClaims(), []);

  const maxTotal = Math.max(...agingRows.map(r => r.total), 1);

  return (
    <div className="space-y-5 p-5">
      {/* Panel header */}
      <div>
        <h2 className="text-base font-semibold text-slate-800">Aging Klaim</h2>
        <p className="text-sm text-slate-500">
          Distribusi klaim berdasarkan durasi sejak submit · per penjamin
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3">
        {(Object.entries(PENJAMIN_CFG) as [PenjaminKey, (typeof PENJAMIN_CFG)[PenjaminKey]][]).map(
          ([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
              <span className="text-sm text-slate-600">{cfg.label}</span>
            </div>
          ),
        )}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
          <Users size={12} />
          <span>Total klaim aktif</span>
        </div>
      </div>

      {/* Bar Chart — 4 bucket rows */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200">
        <div className="divide-y divide-slate-100">
          {agingRows.map((row, idx) => {
            const tone = BUCKET_TONE[row.bucket];
            const penjaminKeys: PenjaminKey[] = ["bpjs", "asuransi", "jamkesda"];
            return (
              <div key={row.bucket} className="px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`rounded-md px-2 py-0.5 text-sm font-semibold ${tone.bg}`}
                  >
                    {tone.label}
                  </span>
                  <span className="text-sm font-bold text-slate-700 tabular-nums">
                    {row.total} klaim
                  </span>
                </div>

                {/* Stacked bar */}
                <div className="mb-2 flex h-5 w-full overflow-hidden rounded-full bg-slate-100">
                  {penjaminKeys.map(key => {
                    const count = row[key];
                    const widthPct = (count / Math.max(row.total, 1)) * 100;
                    const cfg = PENJAMIN_CFG[key];
                    return (
                      <motion.div
                        key={key}
                        className={`h-full first:rounded-l-full last:rounded-r-full ${cfg.bar}`}
                        style={{ width: `${widthPct}%` }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{ delay: 0.1 + idx * 0.06, duration: 0.4, ease: "easeOut" }}
                        title={`${cfg.label}: ${count}`}
                      />
                    );
                  })}
                </div>

                {/* Per-penjamin counts */}
                <div className="flex gap-4">
                  {penjaminKeys.map(key => {
                    const cfg = PENJAMIN_CFG[key];
                    return (
                      <div key={key} className="flex items-center gap-1">
                        <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
                        <span className="text-xs font-bold text-slate-700 tabular-nums">
                          {row[key]}
                        </span>
                      </div>
                    );
                  })}

                  {/* Proportion bar relative to max total */}
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-20 overflow-hidden rounded-full bg-slate-100" style={{ height: 4 }}>
                      <motion.div
                        className={`h-full rounded-full ${idx === 0 ? "bg-emerald-400" : idx === 1 ? "bg-amber-400" : "bg-rose-400"}`}
                        initial={{ width: "0%" }}
                        animate={{ width: `${(row.total / maxTotal) * 100}%` }}
                        transition={{ delay: 0.2 + idx * 0.06, duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">
                      {Math.round((row.total / maxTotal) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stuck claims section */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-slate-200" />
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
          <AlertTriangle size={13} className="text-rose-500" />
          Stuck Claims — Pending &gt; 30 Hari
        </span>
        <div className="flex-1 border-t border-slate-200" />
      </div>

      {stuckClaims.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-emerald-50 py-6 ring-1 ring-emerald-200">
          <Clock size={20} className="text-emerald-500" />
          <p className="text-sm font-medium text-emerald-700">
            Semua klaim dalam batas waktu normal
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_120px_80px_90px] gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Klaim</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Penjamin</span>
            <span className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tarif RS
            </span>
            <span className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pending
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {stuckClaims.slice(0, 8).map((c, idx) => {
              const urgency =
                c.daysPending > 60 ? "rose" : c.daysPending > 30 ? "amber" : "slate";
              const urgencyClass =
                urgency === "rose"
                  ? "bg-rose-50 text-rose-700 ring-rose-200"
                  : urgency === "amber"
                    ? "bg-amber-50 text-amber-700 ring-amber-200"
                    : "bg-slate-50 text-slate-600 ring-slate-200";

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.04 * idx, duration: 0.2 }}
                  className="grid grid-cols-[1fr_120px_80px_90px] items-center gap-2 px-4 py-2.5 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-slate-700">{c.noKlaim}</p>
                    <p className="truncate text-xs text-slate-400">{c.pasienId}</p>
                  </div>
                  <p className="truncate text-sm text-slate-600">{c.penjaminNama}</p>
                  <p className="text-right font-mono text-sm text-slate-700 tabular-nums">
                    {formatRupiahShort(c.tarifRS)}
                  </p>
                  <div className="flex justify-end">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${urgencyClass}`}
                    >
                      {c.daysPending} hr
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {stuckClaims.length > 8 && (
            <div className="border-t border-slate-100 px-4 py-2 text-right">
              <span className="text-xs text-slate-400">
                +{stuckClaims.length - 8} klaim lainnya
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
