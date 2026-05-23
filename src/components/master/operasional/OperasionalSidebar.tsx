"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  OPERASIONAL_SUBS,
  type OperasionalSubKey, type OperasionalState,
} from "@/lib/master/operasionalKlinisMock";

interface Props {
  activeKey: OperasionalSubKey;
  onSelect: (key: OperasionalSubKey) => void;
  state: OperasionalState;
}

function countFor(key: OperasionalSubKey, state: OperasionalState): { total: number; aktif: number; label: string } {
  switch (key) {
    case "sumber-cairan":
      return { total: state.cairan.length, aktif: state.cairan.filter((e) => e.status === "Aktif").length, label: "entri" };
    case "diet-tekstur":
      return { total: state.dietTekstur.length, aktif: state.dietTekstur.filter((e) => e.status === "Aktif").length, label: "entri" };
    case "bundle-hai":
      return { total: state.bundleHAI.length, aktif: state.bundleHAI.filter((e) => e.status === "Aktif").length, label: "item" };
    case "penyakit-isolasi":
      return { total: state.penyakitIsolasi.length, aktif: state.penyakitIsolasi.filter((e) => e.status === "Aktif").length, label: "penyakit" };
  }
}

export default function OperasionalSidebar({ activeKey, onSelect, state }: Props) {
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="shrink-0 border-b border-slate-100 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Komponen Operasional</p>
        <p className="mt-0.5 text-xs text-slate-600">
          <strong className="text-slate-800">{OPERASIONAL_SUBS.length}</strong> sub-master
        </p>
      </header>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-0.5">
          {OPERASIONAL_SUBS.map((s) => {
            const active = s.key === activeKey;
            const Icon = s.icon;
            const c = countFor(s.key, state);
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => onSelect(s.key)}
                  className={cn(
                    "group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition",
                    active
                      ? "bg-slate-100 ring-1 ring-slate-300"
                      : "hover:bg-slate-50",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition",
                      active
                        ? "bg-slate-700 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
                    )}
                  >
                    <Icon size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-[12px] font-semibold leading-tight",
                        active ? "text-slate-900" : "text-slate-700",
                      )}
                    >
                      {s.label}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                      {c.aktif}/{c.total} {c.label}
                    </p>
                  </div>
                  {active && (
                    <motion.span
                      layoutId="operasional-active-indicator"
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700"
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
