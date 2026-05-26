"use client";

/**
 * ICDPicker — searchable autocomplete dropdown untuk ICD-10-IM dan ICD-9-CM-IM.
 * Font ICD kode + deskripsi: text-sm (14px) — per user pref "normal aja".
 */

import { useEffect, useRef, useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { KodeICD10IM, KodeICD9CMIM } from "@/lib/eklaim/eklaimShared";
import {
  groupByKategori,
  searchICD10IM,
  searchICD9CMIM,
} from "./codingShared";

type ICDVariant = "icd10" | "icd9";
type ICDEntry = KodeICD10IM | KodeICD9CMIM;

interface Props {
  variant: ICDVariant;
  placeholder?: string;
  /** Kode yang sudah dipilih — untuk marking "sudah ditambah". */
  selectedKodes: ReadonlyArray<string>;
  onSelect: (entry: ICDEntry) => void;
  disabled?: boolean;
}

export default function ICDPicker({
  variant,
  placeholder,
  selectedKodes,
  onSelect,
  disabled = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results =
    variant === "icd10" ? searchICD10IM(query) : searchICD9CMIM(query);
  const groups = groupByKategori(results);
  const codeColor = variant === "icd10" ? "text-teal-700" : "text-sky-700";
  const focusBg = variant === "icd10" ? "bg-teal-50" : "bg-sky-50";
  const ringColor =
    variant === "icd10"
      ? "border-teal-400 ring-2 ring-teal-100"
      : "border-sky-400 ring-2 ring-sky-100";

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && focusIdx >= 0) {
      e.preventDefault();
      const entry = results[focusIdx];
      if (entry && !selectedKodes.includes(entry.kode)) handleSelect(entry);
    }
  };

  const handleSelect = (entry: ICDEntry) => {
    onSelect(entry);
    setQuery("");
    setOpen(false);
    setFocusIdx(-1);
    inputRef.current?.focus();
  };

  const defaultPh =
    variant === "icd10"
      ? "Cari diagnosis ICD-10-IM — kode (I21.0) atau nama"
      : "Cari tindakan ICD-9-CM-IM — kode (36.07) atau nama";

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-white px-3 py-2.5 transition-colors",
          open ? ringColor : "border-slate-200 hover:border-slate-300",
          disabled && "pointer-events-none bg-slate-50 opacity-60",
        )}
      >
        <Search
          size={15}
          className={cn(
            "shrink-0 transition-colors",
            open
              ? variant === "icd10"
                ? "text-teal-500"
                : "text-sky-500"
              : "text-slate-400",
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setFocusIdx(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? defaultPh}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600"
          >
            <X size={13} />
          </button>
        )}
        <ChevronDown
          size={13}
          className={cn(
            "shrink-0 text-slate-400 transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-100"
          >
            {results.length > 0 ? (
              <ul
                className="max-h-72 overflow-y-auto py-1"
                role="listbox"
              >
                {groups.map(({ kategori, items }) => (
                  <li key={kategori} className="mb-0.5 last:mb-0">
                    {/* Group header */}
                    <div className="sticky top-0 z-10 bg-white/95 px-3 pb-1 pt-2 backdrop-blur-sm">
                      <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
                        {kategori}
                      </span>
                    </div>
                    {/* Items */}
                    {items.map((item) => {
                      const isSelected = selectedKodes.includes(item.kode);
                      const flatIdx = results.indexOf(item);
                      return (
                        <button
                          key={item.kode}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => !isSelected && handleSelect(item)}
                          className={cn(
                            "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                            isSelected
                              ? "cursor-default bg-slate-50/60"
                              : focusIdx === flatIdx
                                ? focusBg
                                : "hover:bg-slate-50/70",
                          )}
                        >
                          {/* ICD Code chip */}
                          <span
                            className={cn(
                              "mt-px shrink-0 rounded-md px-1.5 py-0.5 font-mono text-sm font-bold leading-none",
                              isSelected
                                ? "bg-slate-100 text-slate-400"
                                : `bg-slate-100 ${codeColor}`,
                            )}
                          >
                            {item.kode}
                          </span>
                          {/* Description */}
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "block text-sm leading-snug",
                                isSelected ? "text-slate-400" : "text-slate-800",
                              )}
                            >
                              {item.deskripsi}
                            </span>
                            {item.hint && (
                              <span className="mt-0.5 block text-[12px] italic text-slate-400">
                                {item.hint}
                              </span>
                            )}
                          </span>
                          {isSelected && (
                            <span className="mt-0.5 shrink-0 text-[11.5px] font-medium text-teal-600">
                              ✓ Terpilih
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </li>
                ))}
                {results.length === 30 && (
                  <li className="border-t border-slate-100 px-3 py-2 text-center text-[12px] text-slate-400">
                    30 hasil pertama — ketik lebih spesifik untuk mempersempit
                  </li>
                )}
              </ul>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-slate-500">
                  Tidak ada kode yang cocok untuk{" "}
                  <span className="font-mono font-semibold">
                    &ldquo;{query}&rdquo;
                  </span>
                </p>
                <p className="mt-1 text-[12px] text-slate-400">
                  Coba kode (contoh:{" "}
                  {variant === "icd10" ? "I21.0, E11.9, J18.9" : "36.07, 47.01, 74.1"})
                </p>
              </div>
            )}

            {/* Footer: version badge */}
            <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-1.5">
              <span className="text-[10.5px] text-slate-400">
                {variant === "icd10"
                  ? "ICD-10-IM · Versi ICD-10-IM_2025 · Pedoman Pengodean iDRG 2025 Kemenkes"
                  : "ICD-9-CM-IM · Versi ICD-9-CM-IM_2025 · Pedoman Pengodean iDRG 2025 Kemenkes"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
