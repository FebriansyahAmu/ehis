"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICD10_CATALOG, type IcdOption } from "./rujukanTypes";

export function DiagnosaCombobox({
  value,
  onChange,
}: {
  value: IcdOption | null;
  onChange: (v: IcdOption | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const inputRef          = useRef<HTMLInputElement>(null);

  const filtered = query.length < 1
    ? []
    : ICD10_CATALOG.filter(
        item =>
          item.code.toLowerCase().includes(query.toLowerCase()) ||
          item.name.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 5);

  const handleSelect = (item: IcdOption) => {
    onChange(item);
    setQuery("");
    setOpen(false);
  };

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5">
        <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sky-700">
          {value.code}
        </span>
        <span className="flex-1 truncate text-[11px] text-slate-700">{value.name}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-slate-400 transition hover:text-slate-600"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Ketik kode atau nama diagnosis…"
        className={cn(
          "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 pr-7 text-[11px]",
          "text-slate-800 placeholder:text-slate-300 transition",
          "focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100",
        )}
      />
      <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-2 text-slate-300" />

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            {filtered.map(item => (
              <li key={item.code}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(item)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-sky-50"
                >
                  <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-sky-700">
                    {item.code}
                  </span>
                  <span className="text-[11px] text-slate-700">{item.name}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
