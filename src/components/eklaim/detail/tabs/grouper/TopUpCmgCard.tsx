"use client";

/**
 * TopUpCmgCard — daftar Top-Up CMG eligible dari iDRG result.
 * Eligible items: teal accent + nominal. Non-eligible: slate muted.
 */

import { motion } from "framer-motion";
import { Zap, MinusCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/eklaim/money";
import type { TopUpCmg } from "@/lib/eklaim/eklaimShared";

interface Props {
  topUpCmg: ReadonlyArray<TopUpCmg>;
}

export default function TopUpCmgCard({ topUpCmg }: Props) {
  const eligible = topUpCmg.filter((t) => t.eligible);
  const totalTopUp = eligible.reduce((s, t) => s + t.nominal, 0n);
  const hasEligible = eligible.length > 0;

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-100 ring-1 ring-teal-200">
          <Sparkles size={13} strokeWidth={2.2} className="text-teal-700" />
        </span>
        <div className="flex-1">
          <p className="text-[13px] font-bold text-slate-800">Top-Up CMG</p>
          <p className="text-[11px] text-slate-400">
            {hasEligible
              ? `${eligible.length} dari ${topUpCmg.length} kriteria eligible`
              : "Tidak ada top-up eligible"}
          </p>
        </div>
        {hasEligible && (
          <span className="rounded-full bg-teal-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
            +{eligible.length}
          </span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 p-4">
        {topUpCmg.length === 0 ? (
          <EmptyTopUp />
        ) : (
          <div className="space-y-2">
            {topUpCmg.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.18 }}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors",
                  item.eligible
                    ? "bg-teal-50 ring-1 ring-teal-100"
                    : "bg-slate-50",
                )}
              >
                {item.eligible ? (
                  <Zap
                    size={13}
                    strokeWidth={2.5}
                    className="shrink-0 text-teal-600"
                  />
                ) : (
                  <MinusCircle
                    size={13}
                    strokeWidth={2}
                    className="shrink-0 text-slate-400"
                  />
                )}
                <span
                  className={cn(
                    "flex-1 text-sm leading-snug",
                    item.eligible
                      ? "font-medium text-teal-900"
                      : "text-slate-500",
                  )}
                >
                  {item.alasan}
                </span>
                {item.eligible && (
                  <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[11.5px] font-bold text-white">
                    +{formatRupiah(item.nominal)}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Total footer (only if eligible) */}
      {hasEligible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.2 }}
          className="border-t border-teal-100 bg-teal-50/70 px-4 py-3 rounded-b-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-teal-800">
              Total Top-Up
            </span>
            <span className="font-mono text-base font-black text-teal-700">
              +{formatRupiah(totalTopUp)}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-teal-600">
            Akan ditambahkan ke tarif iDRG aktual setelah verifikasi BPJS
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ── Empty State ────────────────────────────────────────

function EmptyTopUp() {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
        <Sparkles size={20} strokeWidth={1.8} className="text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600">
        Tidak ada kriteria top-up
      </p>
      <p className="mt-1 max-w-[16rem] text-[12px] text-slate-400">
        Top-Up CMG berlaku untuk ICU &gt;3 hari, obat mahal, prosthesis, atau
        kondisi klinis tertentu sesuai Pedoman iDRG 2025
      </p>
    </div>
  );
}
