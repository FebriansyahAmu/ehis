"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  type TemplateFormJenis, type TemplateFormItem,
  JENIS_CFG, JENIS_LIST, countByJenis,
} from "@/lib/master/templateFormMock";

interface Props {
  items: TemplateFormItem[];
  activeJenis: TemplateFormJenis;
  onSelect: (j: TemplateFormJenis) => void;
}

export default function TemplateFormSidebar({ items, activeJenis, onSelect }: Props) {
  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="shrink-0 border-b border-slate-100 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Jenis Template</p>
        <p className="mt-0.5 text-xs text-slate-600">
          <strong className="text-slate-800">{JENIS_LIST.length}</strong> kategori
        </p>
      </header>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-1">
          {JENIS_LIST.map((j) => {
            const cfg = JENIS_CFG[j];
            const Icon = cfg.icon;
            const count = countByJenis(items, j);
            const aktif = items.filter((t) => t.jenis === j && t.status === "Aktif").length;
            const active = j === activeJenis;
            return (
              <li key={j}>
                <button
                  type="button"
                  onClick={() => onSelect(j)}
                  className={cn(
                    "group flex w-full items-start gap-2.5 rounded-lg border px-2.5 py-2 text-left transition",
                    active
                      ? cn(cfg.bg, "border-current ring-1", cfg.ring)
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition",
                      active ? "bg-white shadow-sm" : "bg-slate-50 group-hover:bg-white",
                      cfg.text,
                    )}
                  >
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-[12px] font-bold leading-tight",
                        active ? cfg.text : "text-slate-700",
                      )}
                    >
                      {cfg.label}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-500">
                      {cfg.deskripsi}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[9.5px] font-semibold">
                      <span className={cn("rounded px-1.5 py-0.5", cfg.bg, cfg.text)}>
                        {aktif}/{count}
                      </span>
                      <span className="text-slate-400">template</span>
                    </div>
                  </div>
                  {active && (
                    <motion.span
                      layoutId="tf-active-indicator"
                      className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", cfg.text.replace("text-", "bg-"))}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <footer className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-3 py-2">
        <p className="text-[10px] leading-snug text-slate-500">
          Pilih jenis, lalu kelola template di panel kanan.
        </p>
      </footer>
    </aside>
  );
}
