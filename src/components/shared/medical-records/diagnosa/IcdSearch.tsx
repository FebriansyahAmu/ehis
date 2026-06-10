"use client";

// Pencarian ICD live ke API master (/api/v1/master/icd) — debounce + abort + keyboard nav.
// Fallback otomatis ke katalog lokal (diagnosaShared) bila API gagal/kosong → demo tetap jalan.

import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { listIcd } from "@/lib/api/master/icd";
import type { IcdJenisDTO } from "@/lib/schemas/master/icd";
import type { CatalogEntry } from "../diagnosaShared";

/** Entri hasil pilih — CatalogEntry + estimasi INA-CBG dari master (bila ada). */
export interface IcdPick extends CatalogEntry {
  inaCbg?: string;
}

export interface IcdSearchAccent {
  focus: string;
  itemActive: string;
  kodeText: string;
  badge: string;
}

export interface IcdSearchProps {
  jenis: IcdJenisDTO;
  placeholder: string;
  accent: IcdSearchAccent;
  /** katalog lokal — fallback saat API gagal (offline/belum login) */
  fallback: CatalogEntry[];
  onSelect: (entry: IcdPick) => void;
  autoFocus?: boolean;
}

/** Tebalkan bagian teks yang cocok dengan query. */
function Highlight({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0 || !q) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-semibold text-slate-900 underline decoration-amber-300 decoration-2 underline-offset-1">
        {text.slice(i, i + q.length)}
      </span>
      {text.slice(i + q.length)}
    </>
  );
}

export default function IcdSearch({
  jenis,
  placeholder,
  accent,
  fallback,
  onSelect,
  autoFocus,
}: IcdSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IcdPick[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false); // true = hasil dari katalog lokal
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // tutup saat klik di luar
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // debounce + fetch API (abortable) — fallback lokal saat gagal.
  // setState hanya di callback async (bukan badan effect) — hindari cascading render.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { items } = await listIcd(
          { jenis, q, status: "Aktif", limit: 30 },
          ctrl.signal,
        );
        const picks: IcdPick[] = items.map((d) => ({
          kode: d.kode,
          nama: d.nama,
          kategori: d.chapter || d.blok || jenis,
          inaCbg: d.inaCbg,
        }));
        // DB kosong (belum import) → tetap berikan fallback lokal agar demo hidup
        if (picks.length === 0) {
          const lokal = filterLokal(fallback, q);
          setResults(lokal);
          setOffline(lokal.length > 0);
        } else {
          setResults(picks);
          setOffline(false);
        }
        setLoading(false);
        setActiveIdx(-1);
      } catch {
        if (ctrl.signal.aborted) return;
        setResults(filterLokal(fallback, q));
        setOffline(true);
        setLoading(false);
        setActiveIdx(-1);
      }
    }, 300);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [query, jenis, fallback]);

  const pick = (entry: IcdPick) => {
    onSelect(entry);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      pick(results[activeIdx]);
    }
  };

  // scroll item aktif ke viewport dropdown
  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const el = listRef.current.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const q = query.trim();

  return (
    <div className="relative" ref={wrapRef}>
      <Search
        size={13}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={placeholder}
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setOpen(true);
          if (v.trim().length >= 2) {
            setLoading(true);
          } else {
            setResults([]);
            setLoading(false);
          }
        }}
        onFocus={() => q && setOpen(true)}
        onKeyDown={onKeyDown}
        className={cn(
          "h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs text-slate-700 shadow-xs placeholder:text-slate-400 outline-none transition",
          accent.focus,
        )}
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {loading && <Loader2 size={12} className="animate-spin text-slate-300" />}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Bersihkan pencarian"
            className="text-slate-300 transition hover:text-slate-500"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && q.length >= 2 && (results.length > 0 || !loading) && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.13 }}
            className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            {results.length > 0 ? (
              <>
                <div ref={listRef} id={listId} role="listbox" className="max-h-72 overflow-y-auto">
                  {results.map((item, i) => (
                    <button
                      key={`${item.kode}-${i}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(item);
                      }}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={cn(
                        "flex w-full items-start gap-2.5 border-b border-slate-50 px-3 py-2 text-left transition last:border-b-0",
                        i === activeIdx && accent.itemActive,
                      )}
                    >
                      <span
                        className={cn(
                          "mt-px w-14 shrink-0 font-mono text-[10px] font-bold",
                          accent.kodeText,
                        )}
                      >
                        <Highlight text={item.kode} q={q} />
                      </span>
                      <span className="min-w-0 flex-1 text-[11px] leading-snug text-slate-700">
                        <Highlight text={item.nama} q={q} />
                      </span>
                      {item.kategori && (
                        <span
                          className={cn(
                            "max-w-28 shrink-0 truncate rounded px-1.5 py-0.5 text-[8px] font-semibold",
                            accent.badge,
                          )}
                        >
                          {item.kategori}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/80 px-3 py-1.5">
                  <span className="text-[9px] text-slate-400">
                    <kbd className="rounded border border-slate-200 bg-white px-1 font-sans">↑↓</kbd>{" "}
                    navigasi ·{" "}
                    <kbd className="rounded border border-slate-200 bg-white px-1 font-sans">Enter</kbd>{" "}
                    pilih
                  </span>
                  {offline && (
                    <span className="ml-auto flex items-center gap-1 text-[9px] font-medium text-amber-600">
                      <CloudOff size={9} /> katalog lokal
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="px-3 py-5 text-center">
                <p className="text-xs text-slate-400">
                  Tidak ditemukan untuk &ldquo;{q}&rdquo;
                </p>
                <p className="mt-0.5 text-[10px] text-slate-300">
                  Coba kode (mis. I10) atau potongan nama diagnosis
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function filterLokal(catalog: CatalogEntry[], q: string): IcdPick[] {
  const lower = q.toLowerCase();
  return catalog
    .filter(
      (e) =>
        e.kode.toLowerCase().includes(lower) || e.nama.toLowerCase().includes(lower),
    )
    .slice(0, 12);
}
