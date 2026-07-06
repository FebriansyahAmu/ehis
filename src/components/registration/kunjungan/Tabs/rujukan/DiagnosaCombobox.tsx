"use client";

// Pencarian diagnosa live ke master ICD-10 (/api/v1/master/icd) — debounce + abort. Fallback
// otomatis ke katalog lokal (ICD10_CATALOG) bila master gagal/kosong (offline/belum ter-grant)
// → demo tetap jalan. Dipakai di rujukan SEP registrasi (Kontrol Pasca Ranap · Rujukan Masuk).

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, Loader2, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { listIcd } from "@/lib/api/master/icd";
import { ICD10_CATALOG, type IcdOption } from "./rujukanTypes";

function filterLokal(q: string): IcdOption[] {
  const l = q.toLowerCase();
  return ICD10_CATALOG
    .filter((it) => it.code.toLowerCase().includes(l) || it.name.toLowerCase().includes(l))
    .slice(0, 8);
}

export function DiagnosaCombobox({
  value,
  onChange,
}: {
  value: IcdOption | null;
  onChange: (v: IcdOption | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<IcdOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false); // true = hasil dari katalog lokal
  const wrapRef = useRef<HTMLDivElement>(null);

  // Tutup saat klik di luar.
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Debounce + fetch master ICD-10 (abortable) → fallback katalog lokal saat gagal/kosong.
  // setState HANYA di callback async (bukan badan efek) → hindari cascading render.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const { items } = await listIcd({ jenis: "ICD-10", q, status: "Aktif", limit: 20 }, ctrl.signal);
        const opts: IcdOption[] = items.map((d) => ({ code: d.kode, name: d.nama }));
        if (opts.length === 0) {
          const lokal = filterLokal(q);
          setResults(lokal);
          setOffline(lokal.length > 0);
        } else {
          setResults(opts);
          setOffline(false);
        }
        setLoading(false);
      } catch {
        if (ctrl.signal.aborted) return;
        setResults(filterLokal(q));
        setOffline(true);
        setLoading(false);
      }
    }, 300);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [query]);

  const handleSelect = (item: IcdOption) => {
    onChange(item);
    setQuery("");
    setResults([]);
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
          aria-label="Ganti diagnosa"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  const q = query.trim();

  return (
    <div className="relative" ref={wrapRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setOpen(true);
          if (v.trim().length >= 2) setLoading(true);
          else { setResults([]); setLoading(false); }
        }}
        onFocus={() => setOpen(true)}
        placeholder="Cari kode / nama diagnosis (master ICD-10)…"
        className={cn(
          "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 pr-7 text-[11px]",
          "text-slate-800 placeholder:text-slate-300 transition",
          "focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100",
        )}
      />
      <span className="pointer-events-none absolute right-2.5 top-2">
        {loading ? (
          <Loader2 size={12} className="animate-spin text-slate-300" />
        ) : (
          <ChevronDown size={12} className="text-slate-300" />
        )}
      </span>

      <AnimatePresence>
        {open && q.length >= 2 && (results.length > 0 || !loading) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            {results.length > 0 ? (
              <>
                <ul className="max-h-56 overflow-y-auto">
                  {results.map((item) => (
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
                </ul>
                {offline && (
                  <div className="flex items-center gap-1 border-t border-slate-100 bg-slate-50/80 px-3 py-1.5 text-[9px] font-medium text-amber-600">
                    <CloudOff size={9} /> katalog lokal (master tak tersedia)
                  </div>
                )}
              </>
            ) : (
              <div className="px-3 py-4 text-center">
                <p className="text-[11px] text-slate-400">Tidak ditemukan untuk &ldquo;{q}&rdquo;</p>
                <p className="mt-0.5 text-[9.5px] text-slate-300">Coba kode (mis. I10) atau potongan nama diagnosis</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
