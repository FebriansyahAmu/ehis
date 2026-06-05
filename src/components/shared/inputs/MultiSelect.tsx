"use client";

// MultiSelect — varian Select untuk pemilihan BANYAK nilai (mis. unit kerja lintas
// instalasi). Mengikuti pola Select: popover via portal + position:fixed (tak ter-clip
// kontainer overflow), search otomatis bila opsi > 8, keyboard nav. Beda dari Select:
// opsi di-TOGGLE (checkbox) & popover TIDAK menutup saat memilih (alur multi). Trigger
// menampilkan chip nilai terpilih (bisa dihapus per-chip). Aksen teal — hindari indigo/violet.

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePopover, triggerClasses, type TriggerVariant } from "./popoverShared";
import type { SelectOption } from "./Select";

export interface MultiSelectProps {
  value: string[];
  onChange: (vals: string[]) => void;
  /** String[] (value=label) atau objek {value,label}. */
  options: (string | SelectOption)[];
  icon?: LucideIcon;
  placeholder?: string;
  /** Tampilkan kotak cari. Default: otomatis bila opsi > 8. */
  searchable?: boolean;
  className?: string;
  variant?: TriggerVariant;
  id?: string;
  /** Jumlah chip ditampilkan sebelum diringkas jadi "+N". Default 4. */
  maxChips?: number;
}

const norm = (o: string | SelectOption): SelectOption =>
  typeof o === "string" ? { value: o, label: o } : o;

export function MultiSelect({
  value, onChange, options, icon: Icon, placeholder = "Pilih…", searchable, className,
  variant = "default", id, maxChips = 4,
}: MultiSelectProps) {
  const reduce = useReducedMotion();
  const { open, setOpen, mounted, coords, width, triggerRef, popRef } = usePopover(0, 300, { matchWidth: true });

  const opts = useMemo(() => options.map(norm), [options]);
  const showSearch = searchable ?? opts.length > 8;
  const selectedSet = useMemo(() => new Set(value), [value]);
  const selectedOpts = useMemo(() => opts.filter((o) => selectedSet.has(o.value)), [opts, selectedSet]);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? opts.filter((o) => o.label.toLowerCase().includes(q)) : opts;
  }, [opts, query]);

  const toggleOpen = () => {
    if (!open) {
      setQuery("");
      setActive(0);
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (open && showSearch) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open, showSearch]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const toggleValue = (v: string) => {
    onChange(selectedSet.has(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (filtered[active]) toggleValue(filtered[active].value);
    }
  };

  const overflow = selectedOpts.length - maxChips;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(triggerClasses(variant, open), "min-h-[34px] flex-wrap", className)}
      >
        {Icon && <Icon size={14} className="shrink-0 text-slate-400" />}
        {selectedOpts.length === 0 ? (
          <span className="flex-1 truncate text-left text-slate-400">{placeholder}</span>
        ) : (
          <span className="flex flex-1 flex-wrap items-center gap-1">
            {selectedOpts.slice(0, maxChips).map((o) => (
              <span
                key={o.value}
                className="inline-flex max-w-[140px] items-center gap-1 rounded-md bg-teal-50 py-0.5 pl-2 pr-1 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-200"
              >
                <span className="truncate">{o.label}</span>
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Hapus ${o.label}`}
                  onClick={(e) => { e.stopPropagation(); toggleValue(o.value); }}
                  className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full text-teal-500 transition hover:bg-teal-200/70 hover:text-teal-800"
                >
                  <X size={10} />
                </span>
              </span>
            ))}
            {overflow > 0 && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                +{overflow}
              </span>
            )}
          </span>
        )}
        <ChevronDown size={14} className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && coords && (
            <motion.div
              ref={popRef}
              role="listbox"
              aria-multiselectable="true"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "fixed", top: coords.top, left: coords.left, width, zIndex: 60 }}
              onKeyDown={onKey}
              className="origin-top overflow-hidden rounded-xl border border-slate-200/80 bg-white p-1 shadow-xl shadow-slate-900/10 ring-1 ring-black/5"
            >
              {showSearch && (
                <div className="flex items-center gap-2 border-b border-slate-100 px-2 pb-1.5 pt-1">
                  <Search size={13} className="shrink-0 text-slate-400" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setActive(0); }}
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
                    const isSel = selectedSet.has(o.value);
                    const isActive = i === active;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="option"
                        aria-selected={isSel}
                        data-idx={i}
                        title={o.label}
                        onClick={() => toggleValue(o.value)}
                        onMouseEnter={() => setActive(i)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition",
                          isActive ? "bg-teal-50 text-teal-700" : "text-slate-600",
                          isSel && "font-semibold",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-4 w-4 shrink-0 place-items-center rounded border transition",
                            isSel ? "border-teal-600 bg-teal-600" : "border-slate-300 bg-white",
                          )}
                        >
                          {isSel && <Check size={11} className="text-white" />}
                        </span>
                        <span className="flex-1 truncate">{o.label}</span>
                      </button>
                    );
                  })
                )}
              </div>

              {value.length > 0 && (
                <div className="mt-1 flex items-center justify-between border-t border-slate-100 px-2.5 pt-1.5">
                  <span className="text-[10px] font-medium text-slate-400">{value.length} dipilih</span>
                  <button
                    type="button"
                    onClick={() => onChange([])}
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-rose-500 outline-none transition hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-200"
                  >
                    Kosongkan
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
