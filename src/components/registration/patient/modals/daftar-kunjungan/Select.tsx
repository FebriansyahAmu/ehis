"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePopover, triggerClasses, type TriggerVariant } from "./popoverShared";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (val: string) => void;
  /** String[] (value=label) atau objek {value,label}. */
  options: (string | SelectOption)[];
  icon?: LucideIcon;
  placeholder?: string;
  /** Tampilkan kotak cari. Default: otomatis bila opsi > 8. */
  searchable?: boolean;
  className?: string;
  variant?: TriggerVariant;
  id?: string;
}

const norm = (o: string | SelectOption): SelectOption =>
  typeof o === "string" ? { value: o, label: o } : o;

export function Select({
  value, onChange, options, icon: Icon, placeholder = "Pilih…", searchable, className, variant = "default", id,
}: SelectProps) {
  const reduce = useReducedMotion();
  const { open, setOpen, mounted, coords, width, triggerRef, popRef } = usePopover(0, 280, { matchWidth: true });

  const opts = useMemo(() => options.map(norm), [options]);
  const showSearch = searchable ?? opts.length > 8;
  const selected = opts.find((o) => o.value === value) ?? null;

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? opts.filter((o) => o.label.toLowerCase().includes(q)) : opts;
  }, [opts, query]);

  // Reset + fokus saat dibuka.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    const idx = Math.max(0, opts.findIndex((o) => o.value === value));
    setActive(idx);
    if (showSearch) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open, opts, value, showSearch]);

  // Jaga active tetap valid saat filter berubah.
  useEffect(() => { setActive(0); }, [query]);

  // Scroll opsi aktif ke viewport.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const commit = (v: string) => {
    onChange(v);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[active]) commit(filtered[active].value); }
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(triggerClasses(variant, open), className)}
      >
        {Icon && <Icon size={14} className="shrink-0 text-slate-400" />}
        <span className={cn("flex-1 truncate text-left", selected ? "text-slate-700" : "text-slate-400")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && coords && (
            <motion.div
              ref={popRef}
              role="listbox"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "fixed", top: coords.top, left: coords.left, width, zIndex: 60 }}
              onKeyDown={onKey}
              className="origin-top overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 ring-1 ring-black/5"
            >
              {showSearch && (
                <div className="flex items-center gap-2 border-b border-slate-100 px-2 pb-1.5 pt-1">
                  <Search size={13} className="shrink-0 text-slate-400" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari…"
                    className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-300"
                  />
                </div>
              )}

              <div ref={listRef} className="mt-1 max-h-60 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-slate-400">Tidak ada hasil</p>
                ) : (
                  filtered.map((o, i) => {
                    const isSel = o.value === value;
                    const isActive = i === active;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="option"
                        aria-selected={isSel}
                        data-idx={i}
                        title={o.label}
                        onClick={() => commit(o.value)}
                        onMouseEnter={() => setActive(i)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition",
                          isActive ? "bg-sky-50 text-sky-700" : "text-slate-600",
                          isSel && "font-semibold",
                        )}
                      >
                        <Check size={14} className={cn("shrink-0", isSel ? "text-sky-600" : "text-transparent")} />
                        <span className="flex-1 truncate">{o.label}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
