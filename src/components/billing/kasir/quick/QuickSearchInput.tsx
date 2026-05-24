"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Quick Search Input — large prominent search bar.
 * Icon prefix + clear button (X) saat ada value.
 */
export default function QuickSearchInput({
  value, onChange,
  placeholder = "Cari no tagihan / no RM / nama pasien…",
  autoFocus,
}: Props) {
  return (
    <div className={cn(
      "group relative flex items-center rounded-xl border-2 bg-white transition-all dark:bg-slate-900",
      value
        ? "border-amber-300 ring-4 ring-amber-100/60"
        : "border-slate-200 hover:border-slate-300 dark:border-slate-700",
    )}>
      <Search size={18} className={cn(
        "ml-3 flex-none transition-colors",
        value ? "text-amber-600" : "text-slate-400 group-focus-within:text-slate-600",
      )} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        spellCheck={false}
        autoComplete="off"
        className="flex-1 border-0 bg-transparent px-3 py-3 text-[14px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Hapus pencarian"
          className="mr-2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
