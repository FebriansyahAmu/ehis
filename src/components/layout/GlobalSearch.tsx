"use client";

// Pencarian pasien global (header). Backend auto-deteksi dari satu `q`:
// 16-digit → NIK (hash, exact) · pola No. RM → exact · selainnya → nama (ILIKE).
// Debounce 250ms, navigasi ke dashboard pasien. Keyboard: ↑/↓ pilih · Enter buka · Esc tutup.

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, X, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchPatients, type PatientDTO } from "@/lib/api/patients";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;
const LIMIT = 8;

function initialsOf(name: string): string {
  const w = name.split(/\s+/).filter((s) => s && !s.includes(".")).map((s) => s.replace(/[^\p{L}]/gu, "")).filter(Boolean);
  if (!w.length) return "?";
  return (w[0][0] + (w[1]?.[0] ?? "")).toUpperCase();
}

function penjaminBadge(tipe?: string): string {
  if (!tipe) return "bg-slate-100 text-slate-500";
  if (tipe.startsWith("BPJS")) return "bg-sky-50 text-sky-700";
  if (tipe === "Umum") return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700"; // Asuransi / Jamkesda / lain
}

function primaryPenjamin(p: PatientDTO): string | undefined {
  return (p.penjamin.find((j) => j.isPrimer) ?? p.penjamin[0])?.tipe;
}

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientDTO[]>([]);
  const [searchedFor, setSearchedFor] = useState(""); // query yang `results` cerminkan
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();
  const canSearch = trimmed.length >= MIN_CHARS;
  // "Sibuk" = ada query valid yang hasilnya belum sinkron (debounce ATAU fetch jalan).
  const busy = canSearch && searchedFor !== trimmed;

  // Debounced fetch — abort in-flight + cancel timer on keystroke. Semua setState
  // hanya di dalam callback (bukan body efek) → tak memicu cascading render.
  useEffect(() => {
    if (!canSearch) return;
    const ac = new AbortController();
    const t = setTimeout(() => {
      searchPatients({ q: trimmed, limit: LIMIT }, ac.signal)
        .then(({ items }) => { setResults(items); setSearchedFor(trimmed); setActive(-1); })
        .catch((e) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setResults([]); setSearchedFor(trimmed);
        });
    }, DEBOUNCE_MS);
    return () => { clearTimeout(t); ac.abort(); };
  }, [trimmed, canSearch]);

  // Tutup saat klik di luar.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const goTo = useCallback((p: PatientDTO) => {
    router.push(`/ehis-registration/pasien/${encodeURIComponent(p.noRm)}`);
    setOpen(false);
    setQuery("");
    setResults([]);
    inputRef.current?.blur();
  }, [router]);

  function clear() {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); return; }
    if (!open || !canSearch) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") {
      const sel = results[active] ?? results[0];
      if (sel) { e.preventDefault(); goTo(sel); }
    }
  }

  const showPanel = open && trimmed.length > 0;

  return (
    <div ref={rootRef} className="relative w-full max-w-md">
      <label htmlFor="global-search" className="sr-only">Cari pasien (nama, No. RM, atau NIK)</label>
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        id="global-search"
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="global-search-listbox"
        aria-activedescendant={active >= 0 ? `gs-opt-${active}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Cari pasien — nama, No. RM, atau NIK…"
        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />

      {/* Status icon kanan — spinner saat memuat, tombol bersihkan saat ada teks */}
      {busy ? (
        <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-indigo-400" aria-hidden="true" />
      ) : query ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Bersihkan pencarian"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={14} />
        </button>
      ) : null}

      {/* Panel hasil */}
      {showPanel && (
        <div
          id="global-search-listbox"
          role="listbox"
          aria-label="Hasil pencarian pasien"
          className="animate-fade-in absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          {!canSearch ? (
            <p className="px-4 py-6 text-center text-xs text-slate-400">Ketik minimal {MIN_CHARS} karakter…</p>
          ) : busy && results.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-slate-400">
              <Loader2 size={14} className="animate-spin text-indigo-400" />
              <span className="text-xs">Mencari pasien…</span>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-4 py-7 text-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-300">
                <UserRound size={18} />
              </span>
              <p className="text-xs font-medium text-slate-500">Pasien tidak ditemukan</p>
              <p className="text-[11px] text-slate-400">Coba nama lengkap, No. RM, atau NIK 16 digit.</p>
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {results.map((p, i) => (
                <li key={p.id} id={`gs-opt-${i}`} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onClick={() => goTo(p)}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                      i === active ? "bg-indigo-50" : "hover:bg-slate-50",
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-[10px] font-black text-indigo-700">
                      {initialsOf(p.nama)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{p.nama}</p>
                      <p className="truncate text-[11px] text-slate-400">
                        <span className="font-mono">{p.noRm}</span>
                        <span className="mx-1 text-slate-300">·</span>
                        {p.gender === "L" ? "Laki-laki" : "Perempuan"}
                        {p.umur != null && <><span className="mx-1 text-slate-300">·</span>{p.umur} th</>}
                      </p>
                    </div>
                    {primaryPenjamin(p) && (
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", penjaminBadge(primaryPenjamin(p)))}>
                        {primaryPenjamin(p)!.replace(/_/g, " ")}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
