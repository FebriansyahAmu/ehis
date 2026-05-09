"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { OBAT_CATALOG, KATEGORI_BADGE, type ObatCatalog } from "./resepShared";

interface Props {
  value:    string;
  onSelect: (obat: ObatCatalog) => void;
  placeholder?: string;
}

export default function ObatSearch({ value, onSelect, placeholder = "Ketik nama obat atau kode FAR-..." }: Props) {
  const [query,   setQuery]   = useState(value);
  const [open,    setOpen]    = useState(false);
  const [results, setResults] = useState<ObatCatalog[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setQuery(value); }, [value]);

  function handleInput(q: string) {
    setQuery(q);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    const filtered = OBAT_CATALOG.filter(
      (o) => o.nama.toLowerCase().includes(q.toLowerCase()) || o.kode.toLowerCase().includes(q.toLowerCase()),
    ).slice(0, 8);
    setResults(filtered);
    setOpen(filtered.length > 0);
  }

  function pick(obat: ObatCatalog) {
    setQuery(obat.nama);
    setOpen(false);
    onSelect(obat);
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => query.length >= 2 && results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((obat) => (
            <button
              key={obat.kode}
              type="button"
              onClick={() => pick(obat)}
              className="flex w-full items-center justify-between gap-3 border-b border-slate-50 px-3 py-2.5 text-left last:border-0 transition hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800">{obat.nama}</p>
                <p className="text-[11px] text-slate-400">{obat.kode} · {obat.dosis} {obat.satuan}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", KATEGORI_BADGE[obat.kategori])}>
                  {obat.kategori}
                </span>
                <span className={cn("text-[10px] font-medium", obat.stok > 0 ? "text-emerald-600" : "text-rose-500")}>
                  {obat.stok > 0 ? `Stok: ${obat.stok}` : "Habis"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
