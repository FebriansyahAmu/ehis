"use client";

// Widget estimasi biaya order kunjungan — akumulasi tarif per jenis (Resep/Lab/Radiologi/BMHP)
// + grand total. Tarif = snapshot item (Lab dari Tarif Matrix). Order Dibatalkan tak dihitung.

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { TYPE_CFG, costByType, fmtRp, type Order, type OrderType } from "./daftarOrderShared";

const TYPES: OrderType[] = ["Resep", "Lab", "Radiologi", "BMHP"];

export function OrderCostSummary({ orders }: { orders: Order[] }) {
  const { byType, total } = costByType(orders);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Wallet size={14} />
        </span>
        <div>
          <p className="text-xs font-bold text-slate-800">Estimasi Biaya Order</p>
          <p className="text-[10px] text-slate-400">Akumulasi tarif per jenis · order aktif kunjungan ini</p>
        </div>
      </div>

      {/* Per jenis */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TYPES.map((t, i) => {
          const cfg = TYPE_CFG[t];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.18 }}
              className={cn("rounded-lg border p-2.5", cfg.border, cfg.softBg)}
            >
              <div className="flex items-center gap-1.5">
                <Icon size={11} className={cfg.iconCls} />
                <span className={cn("text-[10px] font-semibold", cfg.text)}>{cfg.label}</span>
              </div>
              <p className="mt-1 font-mono text-[13px] font-bold tabular-nums text-slate-800">
                {fmtRp(byType[t])}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Grand total */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs font-semibold text-slate-500">Total Estimasi Biaya</span>
        <span className="font-mono text-base font-extrabold tabular-nums text-emerald-700">
          {fmtRp(total)}
        </span>
      </div>
    </div>
  );
}
