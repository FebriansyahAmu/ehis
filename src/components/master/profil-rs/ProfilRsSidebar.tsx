"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_REGISTRY } from "./profilRsShared";
import type { SectionKey } from "./profilRsShared";

interface Props {
  activeSection: SectionKey;
  onSelect:      (key: SectionKey) => void;
  isDirty:       boolean;
  savedSection:  SectionKey | null;
}

export default function ProfilRsSidebar({
  activeSection, onSelect, isDirty, savedSection,
}: Props) {
  return (
    <div className="flex h-full w-[260px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Konfigurasi
        </p>
        <p className="text-sm font-bold text-slate-800">Profil Rumah Sakit</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto p-2">
        {SECTION_REGISTRY.map((s, i) => {
          const Icon   = s.icon;
          const active = s.key === activeSection;
          const saved  = s.key === savedSection;

          return (
            <motion.button
              key={s.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: i * 0.04 }}
              onClick={() => onSelect(s.key)}
              className={cn(
                "mb-1 flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition",
                active
                  ? cn(s.accent.bg, `ring-1 ${s.accent.ring}`)
                  : "hover:bg-slate-50",
              )}
            >
              {/* Icon */}
              <div className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition",
                active
                  ? cn(s.accent.bg, `ring-1 ${s.accent.ring}`)
                  : "bg-slate-100",
              )}>
                <Icon size={13} className={active ? s.accent.text : "text-slate-500"} />
              </div>

              {/* Label + desc */}
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-xs font-semibold",
                  active ? s.accent.text : "text-slate-700",
                )}>
                  {s.label}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">{s.desc}</p>
              </div>

              {/* Saved indicator */}
              {saved && (
                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Dirty indicator */}
      {isDirty && (
        <div className="shrink-0 border-t border-amber-100 bg-amber-50 px-3 py-2.5">
          <p className="text-[11px] text-amber-700">
            <span className="font-semibold">Ada perubahan</span> belum tersimpan
          </p>
        </div>
      )}

    </div>
  );
}
