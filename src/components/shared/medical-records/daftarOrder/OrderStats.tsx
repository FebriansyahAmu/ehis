"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TYPE_CFG, type Order, type OrderType } from "./daftarOrderShared";

// ── Active banner ─────────────────────────────────────────

export function ActiveBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
      </span>
      <p className="text-[11px] font-semibold text-amber-700">
        {count} order sedang berjalan — pantau status secara berkala
      </p>
    </motion.div>
  );
}

// ── Stat card ─────────────────────────────────────────────

interface StatCardProps {
  type: OrderType;
  orders: Order[];
  active: boolean;
  onClick: () => void;
}

export function StatCard({ type, orders, active: isActive, onClick }: StatCardProps) {
  const cfg    = TYPE_CFG[type];
  const Icon   = cfg.icon;
  const total  = orders.length;
  const inProg = orders.filter((o) => ["Menunggu", "Diterima", "Diproses"].includes(o.status)).length;
  const selesai = orders.filter((o) => o.status === "Selesai").length;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all duration-150",
        isActive
          ? cn("shadow-sm ring-2", cfg.softBg, cfg.ring)
          : "border-slate-200 bg-white hover:shadow-sm",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
          isActive ? "bg-white" : cfg.softBg, cfg.ring,
        )}
      >
        <Icon size={15} className={cfg.iconCls} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn(
          "text-[10px] font-bold uppercase tracking-wide",
          isActive ? cfg.text : "text-slate-400",
        )}>
          {cfg.label}
        </p>
        <p className="mt-0.5 text-lg font-black leading-none tabular-nums text-slate-900">
          {total}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-[10px]">
          {inProg > 0 && (
            <span className="font-semibold text-amber-600">{inProg} aktif</span>
          )}
          <span className="text-slate-400">{selesai} selesai</span>
        </div>
      </div>
    </motion.button>
  );
}
