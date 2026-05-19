"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_CFG, type UserRole } from "@/components/master/pengguna/penggunaShared";
import { type RBACMap, ROLE_ORDER, countTotalGrants } from "./rbacShared";

interface RoleListPanelProps {
  map: RBACMap;
  activeRole: UserRole;
  onSelect: (role: UserRole) => void;
}

export default function RoleListPanel({ map, activeRole, onSelect }: RoleListPanelProps) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-[280px]">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-slate-500" />
          <h3 className="m-sm font-bold text-slate-800">Role</h3>
        </div>
        <p className="mt-0.5 m-tiny text-slate-400">
          Pilih role → atur CRUD permission per-modul
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {ROLE_ORDER.map((role) => {
          const cfg = ROLE_CFG[role];
          const total = countTotalGrants(map, role);
          const pct = total.total ? Math.round((total.granted / total.total) * 100) : 0;
          const active = role === activeRole;
          return (
            <motion.button
              key={role}
              type="button"
              onClick={() => onSelect(role)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "group mb-1 flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition",
                active
                  ? cn(cfg.bg, cfg.text, "ring-1 ring-slate-200")
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <span className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                active ? "bg-white/60" : cn(cfg.bg, cfg.text),
              )}>
                <Lock size={12} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <p className={cn("truncate m-xs font-semibold", active && "font-bold")}>
                    {cfg.label}
                  </p>
                  <span className={cn(
                    "shrink-0 rounded px-1 py-0 m-mini font-mono font-bold",
                    active ? "bg-white/60" : "bg-slate-100 text-slate-500",
                  )}>
                    {pct}%
                  </span>
                </div>
                <p className={cn("mt-0.5 truncate m-mini leading-tight", active ? "opacity-80" : "text-slate-400")}>
                  {cfg.desc}
                </p>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                    className={cn("h-full rounded-full", active ? "bg-white/80" : "bg-slate-400")}
                  />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="border-t border-slate-100 px-4 py-2.5">
        <p className="m-mini leading-relaxed text-slate-400">
          Permission = action level (CRUD + Export). Saat ini hard-coded, akan diatur per-role.
        </p>
      </div>
    </aside>
  );
}
