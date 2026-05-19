"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Type, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type DensityLevel = "compact" | "comfortable" | "cozy";

const STORAGE_KEY = "ehis-mapping-density";

const OPTIONS: { value: DensityLevel; label: string; desc: string }[] = [
  { value: "compact",     label: "Compact",     desc: "Info terpadat (~9–16px)" },
  { value: "comfortable", label: "Comfortable", desc: "Seimbang (~10–17px)" },
  { value: "cozy",        label: "Cozy",        desc: "Paling lega (~11–18px)" },
];

export function useDensity() {
  const [density, setDensityState] = useState<DensityLevel>("comfortable");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as DensityLevel | null;
    if (stored && OPTIONS.some((o) => o.value === stored)) {
      setDensityState(stored);
    }
  }, []);

  const setDensity = (d: DensityLevel) => {
    setDensityState(d);
    try {
      localStorage.setItem(STORAGE_KEY, d);
    } catch {
      /* localStorage may be unavailable */
    }
  };

  return { density, setDensity, mounted };
}

interface DensityToggleProps {
  density: DensityLevel;
  onChange: (d: DensityLevel) => void;
}

export default function DensityToggle({ density, onChange }: DensityToggleProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.value === density) ?? OPTIONS[1];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Atur kepadatan tampilan"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-600 shadow-sm transition",
          "m-tiny hover:bg-slate-50 hover:text-slate-800",
          open && "ring-2 ring-teal-100 border-teal-300",
        )}
      >
        <Type size={11} />
        <span>Density:</span>
        <span className="font-bold text-slate-800">{current.label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={11} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15 }}
            role="menu"
            className="absolute right-0 top-full z-40 mt-1.5 flex w-56 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <p className="border-b border-slate-100 bg-slate-50/60 px-3 py-2 m-mini font-semibold uppercase tracking-wide text-slate-500">
              Kepadatan Tampilan
            </p>
            {OPTIONS.map((opt) => {
              const active = opt.value === density;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-start gap-2 px-3 py-2.5 text-left transition",
                    active ? "bg-teal-50" : "hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      active ? "border-teal-500 bg-teal-500 text-white" : "border-slate-300",
                    )}
                  >
                    {active && <Check size={9} strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("m-xs font-bold", active ? "text-teal-800" : "text-slate-800")}>
                      {opt.label}
                    </p>
                    <p className={cn("m-mini mt-0.5", active ? "text-teal-700/80" : "text-slate-500")}>
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
