"use client";

/**
 * TarifBreakdownCard — breakdown biaya RS per kategori vs tarif iDRG.
 * Bar chart animasi + margin chip emerald (untung) / rose (rugi).
 */

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/eklaim/money";
import type { Rupiah } from "@/lib/eklaim/eklaimShared";
import { mockBreakdown, computeMargin } from "./grouperShared";

interface Props {
  tarifRS: Rupiah;
  tarifIDRG: Rupiah;
}

export default function TarifBreakdownCard({ tarifRS, tarifIDRG }: Props) {
  const items = mockBreakdown(tarifRS);
  const margin = computeMargin(tarifRS, tarifIDRG);
  const selisihAbs = margin.selisih < 0n ? -margin.selisih : margin.selisih;

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 ring-1 ring-amber-200">
          <BarChart3 size={13} strokeWidth={2.2} className="text-amber-700" />
        </span>
        <div>
          <p className="text-[13px] font-bold text-slate-800">Breakdown Biaya RS</p>
          <p className="text-[11px] text-slate-400">Biaya aktual RS per kategori vs tarif iDRG</p>
        </div>
      </div>

      {/* Category bars */}
      <div className="flex-1 space-y-3 p-4">
        {items.map((item, i) => {
          const pct =
            tarifRS === 0n
              ? 0
              : Math.round((Number(item.tarifRS) / Number(tarifRS)) * 100);
          return (
            <motion.div
              key={item.kategori}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.055, duration: 0.2 }}
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      item.colorClass,
                    )}
                  />
                  <span className="text-sm text-slate-700">{item.kategori}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-slate-400">{pct}%</span>
                  <span className="min-w-[7rem] text-right font-mono text-sm font-bold text-slate-800">
                    {formatRupiah(item.tarifRS)}
                  </span>
                </div>
              </div>
              {/* Animated bar */}
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{
                    delay: i * 0.055 + 0.1,
                    duration: 0.45,
                    ease: "easeOut",
                  }}
                  className={cn("h-full rounded-full", item.colorClass)}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Divider + totals */}
      <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-2">
        {/* Total RS */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Total Biaya RS</span>
          <span className="font-mono font-bold text-slate-800">
            {formatRupiah(tarifRS)}
          </span>
        </div>
        {/* Total iDRG */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Tarif iDRG Aktual</span>
          <span className="font-mono font-bold text-sky-700">
            {formatRupiah(tarifIDRG)}
          </span>
        </div>

        {/* Margin chip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.2 }}
          className={cn(
            "flex items-center justify-between rounded-xl px-3 py-2.5 mt-1",
            margin.untung
              ? "bg-emerald-50 ring-1 ring-emerald-200"
              : "bg-rose-50 ring-1 ring-rose-200",
          )}
        >
          <div className="flex items-center gap-2">
            {margin.untung ? (
              <TrendingUp size={15} strokeWidth={2.2} className="text-emerald-600" />
            ) : (
              <TrendingDown size={15} strokeWidth={2.2} className="text-rose-600" />
            )}
            <div>
              <p
                className={cn(
                  "text-[12.5px] font-bold",
                  margin.untung ? "text-emerald-800" : "text-rose-800",
                )}
              >
                Margin iDRG
              </p>
              <p
                className={cn(
                  "text-[11px]",
                  margin.untung ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {margin.untung ? "RS untung dari tarif iDRG" : "RS rugi dari tarif iDRG"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "font-mono text-base font-black",
                margin.untung ? "text-emerald-700" : "text-rose-700",
              )}
            >
              {margin.untung ? "+" : "-"}{formatRupiah(selisihAbs)}
            </p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11.5px] font-bold text-white",
                margin.untung ? "bg-emerald-600" : "bg-rose-600",
              )}
            >
              {margin.untung ? "+" : "-"}{margin.persen}%
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
