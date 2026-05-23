"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  type DischargeSubDescriptor, type DischargeSubKey, type DischargeState,
} from "@/lib/master/dischargeKlasifikasiMock";

interface Props {
  subs: DischargeSubDescriptor[];
  activeKey: DischargeSubKey;
  onSelect: (key: DischargeSubKey) => void;
  state: DischargeState;
}

function getCountForSub(key: DischargeSubKey, state: DischargeState): { label: string; total: number } {
  switch (key) {
    case "homecare":        return { label: "entri", total: state.homecare.length };
    case "alat-bantu":      return { label: "entri", total: state.alatBantu.length };
    case "checklist":       return { label: "entri", total: state.checklist.length };
    case "phase-planning":  return { label: "fase",  total: state.phases.length };
    case "risiko-readmisi": return { label: "rule",  total: state.risikoRules.length };
  }
}

export default function DischargeSidebar({ subs, activeKey, onSelect, state }: Props) {
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="shrink-0 border-b border-slate-100 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Komponen Discharge</p>
        <p className="mt-0.5 text-xs text-slate-600">
          <strong className="text-slate-800">{subs.length}</strong> sub-master
        </p>
      </header>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-0.5">
          {subs.map((s) => {
            const active = s.key === activeKey;
            const Icon = s.icon;
            const count = getCountForSub(s.key, state);
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => onSelect(s.key)}
                  className={cn(
                    "group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition",
                    active
                      ? "bg-emerald-50 ring-1 ring-emerald-200"
                      : "hover:bg-slate-50",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition",
                      active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
                    )}
                  >
                    <Icon size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-[12px] font-semibold leading-tight",
                        active ? "text-emerald-800" : "text-slate-700",
                      )}
                    >
                      {s.label}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                      {count.total} {count.label}
                    </p>
                  </div>
                  {active && (
                    <motion.span
                      layoutId="discharge-active-indicator"
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <footer className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-3 py-2 text-center">
        <p className="text-[10px] text-slate-500">
          Pilih komponen untuk kelola
        </p>
      </footer>
    </aside>
  );
}
