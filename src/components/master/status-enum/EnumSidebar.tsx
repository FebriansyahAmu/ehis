"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { EnumGroup, StatusEnumKey } from "@/lib/master/statusEnumMock";
import { countActiveEntries } from "@/lib/master/statusEnumMock";

interface Props {
  groups: EnumGroup[];
  activeKey: StatusEnumKey;
  onSelect: (key: StatusEnumKey) => void;
}

export default function EnumSidebar({ groups, activeKey, onSelect }: Props) {
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="shrink-0 border-b border-slate-100 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Daftar Enum</p>
        <p className="mt-0.5 text-xs text-slate-600">
          <strong className="text-slate-800">{groups.length}</strong> kategori
        </p>
      </header>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-0.5">
          {groups.map((g) => {
            const active = g.key === activeKey;
            const Icon = g.icon;
            const total = g.entries.length;
            const aktif = countActiveEntries(g);
            return (
              <li key={g.key}>
                <button
                  type="button"
                  onClick={() => onSelect(g.key)}
                  className={cn(
                    "group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition",
                    active
                      ? "bg-violet-50 ring-1 ring-violet-200"
                      : "hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition",
                      active
                        ? "bg-violet-100 text-violet-700"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
                    )}
                  >
                    <Icon size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-[12px] font-semibold leading-tight",
                        active ? "text-violet-800" : "text-slate-700",
                      )}
                    >
                      {g.label}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                      {aktif}/{total} aktif
                    </p>
                  </div>
                  {active && (
                    <motion.span
                      layoutId="enum-active-indicator"
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500"
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
          Pilih kategori untuk kelola entri-nya
        </p>
      </footer>
    </aside>
  );
}
