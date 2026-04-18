"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LayoutGrid, Check } from "lucide-react";

import { MODULES, type ModuleKey } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export default function ModuleSwitcher({ active }: { active: ModuleKey }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Pindah modul"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
      >
        <LayoutGrid size={17} />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-in absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
        >
          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Pindah Modul
          </p>
          <div className="grid grid-cols-2 gap-1">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const isActive = mod.key === active;
              return (
                <Link
                  key={mod.key}
                  href={mod.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex flex-col items-start gap-2 rounded-lg p-3 transition",
                    isActive ? "bg-slate-50 ring-1 ring-slate-200" : "hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg ring-4 transition",
                      mod.accent.bg,
                      mod.accent.ring,
                    )}
                  >
                    <Icon size={16} className={mod.accent.text} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{mod.label}</p>
                    <p className="truncate text-[11px] text-slate-500">{mod.desc}</p>
                  </div>
                  {isActive && (
                    <Check
                      size={12}
                      className="absolute right-2 top-2 text-emerald-600"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
