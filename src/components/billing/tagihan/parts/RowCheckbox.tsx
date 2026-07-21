"use client";

// RowCheckbox — checkbox tabel tagihan (header & baris). Menggantikan checkbox bawaan browser
// yang tampilannya berbeda-beda per OS/browser dan tak bisa dianimasikan.
//
// Input asli tetap ada (sr-only) → semantik, keyboard (Space), dan a11y label tak berubah;
// kotak yang terlihat hanyalah lapisan visual yang mengikuti state via peer-checked.

import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  checked: boolean;
  onChange: () => void;
  /** Sebagian terpilih (header) — tampil strip, bukan centang. */
  indeterminate?: boolean;
  label: string;
  className?: string;
}

export default function RowCheckbox({
  checked, onChange, indeterminate = false, label, className,
}: Props) {
  const active = checked || indeterminate;
  return (
    <label className={cn("group relative inline-flex cursor-pointer items-center", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        aria-checked={indeterminate ? "mixed" : checked}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-[5px] border transition-all duration-150",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500/40 peer-focus-visible:ring-offset-1",
          "dark:peer-focus-visible:ring-offset-slate-950",
          active
            ? "border-amber-600 bg-amber-600 shadow-sm shadow-amber-600/25"
            : "border-slate-300 bg-white group-hover:border-amber-400 group-hover:bg-amber-50/60 dark:border-slate-600 dark:bg-slate-900 dark:group-hover:border-amber-500/70 dark:group-hover:bg-amber-950/30",
          "active:scale-90",
        )}
      >
        {indeterminate ? (
          <Minus size={11} strokeWidth={3.5} className="text-white" />
        ) : (
          <Check
            size={11}
            strokeWidth={3.5}
            className={cn(
              "text-white transition-all duration-150",
              checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
          />
        )}
      </span>
    </label>
  );
}
