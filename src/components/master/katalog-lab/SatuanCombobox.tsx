"use client";

// Combobox Satuan — pilih dari daftar satuan baku lab (riset standar nasional/internasional,
// dikelompokkan) ATAU ketik manual (free text). Dipakai per-parameter pada tab Parameter.
// a11y: role=combobox + listbox/option, Escape & klik-luar menutup.

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Ruler, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { LAB_SATUAN_GROUPS, LAB_SATUAN_FLAT } from "@/lib/master/labTestCatalog";

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export default function SatuanCombobox({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => searchRef.current?.focus(), 40);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      LAB_SATUAN_GROUPS
        .map((g) => ({ label: g.label, options: g.options.filter((o) => !q || o.toLowerCase().includes(q)) }))
        .filter((g) => g.options.length > 0),
    [q],
  );
  const exactMatch = LAB_SATUAN_FLAT.some((o) => o.toLowerCase() === q);

  const pick = (v: string) => { onChange(v); setOpen(false); setQuery(""); };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-left text-xs transition outline-none disabled:opacity-50",
          open
            ? "border-sky-300 ring-2 ring-sky-100"
            : "border-slate-200 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-sky-200",
        )}
      >
        <Ruler size={12} className="shrink-0 text-slate-400" />
        <span className={cn("min-w-0 flex-1 truncate font-medium", value ? "text-slate-800" : "text-slate-400")}>
          {value || "Tanpa satuan"}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-slate-400">
          <ChevronDown size={14} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5"
          >
            <div className="border-b border-slate-100 p-1.5">
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari / ketik satuan…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <ul role="listbox" className="max-h-60 overflow-auto p-1">
              {/* Tanpa satuan */}
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === ""}
                  onClick={() => pick("")}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition",
                    value === "" ? "bg-slate-100 font-semibold text-slate-700" : "text-slate-500 hover:bg-slate-50",
                  )}
                >
                  <Ban size={12} className="shrink-0 text-slate-400" />
                  <span className="flex-1">Tanpa satuan (kualitatif)</span>
                  {value === "" && <Check size={13} className="shrink-0" />}
                </button>
              </li>

              {/* Opsi custom bila query belum cocok persis */}
              {q && !exactMatch && (
                <li>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => pick(query.trim())}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-sky-700 transition hover:bg-sky-50"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-sky-100 text-[9px] font-bold">+</span>
                    <span className="flex-1 truncate">Gunakan <span className="font-mono font-bold">“{query.trim()}”</span></span>
                  </button>
                </li>
              )}

              {groups.map((g) => (
                <li key={g.label} className="mt-1 first:mt-0">
                  <p className="px-2.5 pb-0.5 pt-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">{g.label}</p>
                  {g.options.map((o) => {
                    const active = value === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => pick(o)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition",
                          active ? "bg-sky-50 font-semibold text-sky-700" : "text-slate-600 hover:bg-slate-50",
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate font-mono">{o}</span>
                        {active && <Check size={13} className="shrink-0" />}
                      </button>
                    );
                  })}
                </li>
              ))}

              {groups.length === 0 && !q && (
                <li className="px-2.5 py-3 text-center text-[11px] text-slate-400">Ketik untuk satuan kustom</li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
