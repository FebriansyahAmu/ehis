"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPinned, Search, X, Copy, Check, RotateCcw, Loader2, Home, ChevronRight, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard, useSkeletonDelay } from "@/components/master/shared";
import { listWilayah } from "@/lib/api/wilayah";
import { toast } from "@/lib/ui/toastStore";
import WilayahColumn from "./WilayahColumn";
import {
  LEVELS, LEVEL_META, fmt,
  type Level, type WilayahDTO, type WilayahStats,
} from "./wilayahBrowserShared";

interface ColState {
  parentKode: string | null;
  items: WilayahDTO[];
  loading: boolean;
}

interface WilayahBrowserProps {
  initialProvinces: WilayahDTO[];
  stats: WilayahStats;
  prefetched: boolean;
}

const STAT_TONE = { 1: "sky", 2: "teal", 3: "amber", 4: "emerald" } as const;

export default function WilayahBrowser({ initialProvinces, stats, prefetched }: WilayahBrowserProps) {
  const loaded = useSkeletonDelay();

  const [cols, setCols] = useState<Record<number, ColState>>(() => ({
    1: { parentKode: null, items: initialProvinces, loading: !prefetched },
  }));
  const [selected, setSelected] = useState<Record<number, WilayahDTO | null>>({});
  const reqRef = useRef<Record<number, string | null>>({}); // induk pending per kolom (guard balapan)

  // Search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WilayahDTO[]>([]);
  const [searching, setSearching] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Muat provinsi bila SSR gagal prefetch (degradasi anggun).
  useEffect(() => {
    if (prefetched) return;
    let alive = true;
    (async () => {
      try {
        const items = await listWilayah({ level: 1 });
        if (alive) setCols((p) => ({ ...p, 1: { parentKode: null, items, loading: false } }));
      } catch {
        if (alive) {
          setCols((p) => ({ ...p, 1: { ...p[1], loading: false } }));
          toast.error("Gagal memuat data provinsi");
        }
      }
    })();
    return () => { alive = false; };
  }, [prefetched]);

  // Pencarian nama lintas-level (debounce).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await listWilayah({ q, limit: 40 });
        setResults(r);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Pilih node → muat anak ke kolom berikutnya (lazy).
  const selectNode = useCallback(async (node: WilayahDTO) => {
    const lvl = node.level as Level;
    setSelected((prev) => {
      const next: Record<number, WilayahDTO | null> = {};
      for (const l of LEVELS) if (l < lvl) next[l] = prev[l] ?? null;
      next[lvl] = node;
      return next;
    });
    setCols((prev) => {
      const next: Record<number, ColState> = {};
      for (const l of LEVELS) if (l <= lvl) next[l] = prev[l];
      if (lvl < 4) next[lvl + 1] = { parentKode: node.kode, items: [], loading: true };
      return next;
    });
    if (lvl >= 4) return;
    const childLevel = (lvl + 1) as Level;
    reqRef.current[childLevel] = node.kode;
    try {
      const items = await listWilayah({ parentKode: node.kode, limit: 1000 });
      if (reqRef.current[childLevel] !== node.kode) return; // respons basi
      setCols((prev) => ({ ...prev, [childLevel]: { parentKode: node.kode, items, loading: false } }));
    } catch {
      if (reqRef.current[childLevel] !== node.kode) return;
      setCols((prev) => ({ ...prev, [childLevel]: { parentKode: node.kode, items: [], loading: false } }));
      toast.error(`Gagal memuat ${LEVEL_META[childLevel].label.toLowerCase()}`);
    }
  }, []);

  // Loncat ke wilayah hasil pencarian: rekonstruksi rantai kolom dari leluhur.
  const navigateTo = useCallback(async (target: WilayahDTO) => {
    setQuery("");
    setResults([]);
    try {
      const chain = await listWilayah({ ancestorsOf: target.kode });
      const parents = chain.filter((n) => n.level < target.level);
      const childLists = await Promise.all(parents.map((p) => listWilayah({ parentKode: p.kode, limit: 1000 })));
      setCols((prev) => {
        const next: Record<number, ColState> = { 1: prev[1] };
        parents.forEach((p, i) => {
          next[p.level + 1] = { parentKode: p.kode, items: childLists[i], loading: false };
          reqRef.current[p.level + 1] = p.kode;
        });
        return next;
      });
      const nextSel: Record<number, WilayahDTO | null> = {};
      for (const n of chain) nextSel[n.level] = n;
      setSelected(nextSel);
    } catch {
      toast.error("Gagal membuka wilayah");
    }
  }, []);

  const reset = useCallback(() => {
    setSelected({});
    setCols((prev) => ({ 1: prev[1] }));
    for (const l of LEVELS) reqRef.current[l] = null;
  }, []);

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(key);
        setTimeout(() => setCopied((c) => (c === key ? null : c)), 1200);
      },
      () => toast.error("Gagal menyalin"),
    );
  }

  const crumbs = useMemo(
    () => LEVELS.map((l) => selected[l]).filter((n): n is WilayahDTO => !!n),
    [selected],
  );
  const deepest = selected[4] ?? selected[3] ?? selected[2] ?? selected[1] ?? null;

  if (!loaded) return <BrowserSkeleton />;

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex shrink-0 flex-wrap items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-500">
            Master · Konfigurasi
          </p>
          <h1 className="mt-0.5 flex items-center gap-2 text-xl font-bold text-slate-900">
            <MapPinned size={20} className="text-indigo-500" />
            Wilayah Kemendagri
          </h1>
          <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-500">
            Data wilayah administratif Indonesia (Kepmendagri 2025) — jelajah bertingkat provinsi → kelurahan.
            Dimuat <span className="font-medium text-slate-600">bertahap</span> per level agar ringan.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {LEVELS.map((l) => (
            <StatCard
              key={l}
              icon={LEVEL_META[l].icon}
              label={LEVEL_META[l].short}
              value={fmt(stats.byLevel[l] ?? 0)}
              tone={STAT_TONE[l]}
            />
          ))}
        </div>
      </motion.div>

      {/* ── Toolbar: search + reset ── */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="relative w-full max-w-md">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama wilayah (mis. Serang, Menteng)…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Bersihkan pencarian"
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            </button>
          )}

          {/* Dropdown hasil */}
          <AnimatePresence>
            {query.trim().length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-30 mt-1.5 max-h-80 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-200/60"
              >
                {searching && results.length === 0 ? (
                  <div className="flex items-center gap-2 px-3 py-3 text-[13px] text-slate-400">
                    <Loader2 size={14} className="animate-spin" /> Mencari…
                  </div>
                ) : results.length === 0 ? (
                  <div className="px-3 py-3 text-[13px] text-slate-400">Tidak ada hasil untuk “{query.trim()}”</div>
                ) : (
                  results.map((r) => {
                    const m = LEVEL_META[r.level as Level];
                    return (
                      <button
                        key={r.kode}
                        type="button"
                        onClick={() => navigateTo(r)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-50"
                      >
                        <span className={cn("grid size-6 shrink-0 place-items-center rounded-md ring-1 ring-inset", m.chip)}>
                          <m.icon size={13} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-slate-700">{r.nama}</span>
                          <span className="block font-mono text-[10.5px] text-slate-400">{r.kode}</span>
                        </span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-500">
                          {m.short}
                        </span>
                      </button>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {crumbs.length > 0 && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <RotateCcw size={14} /> Reset
          </button>
        )}

        <div className="ml-auto hidden items-center gap-1.5 text-[11px] text-slate-400 sm:flex">
          <Layers size={13} /> Sumber: Kemendagri (cahyadsn/wilayah)
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="flex shrink-0 flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] shadow-sm">
        <button
          type="button"
          onClick={reset}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition",
            crumbs.length === 0 ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
          )}
        >
          <Home size={13} /> Indonesia
        </button>
        {crumbs.map((n, i) => (
          <span key={n.kode} className="inline-flex items-center gap-1">
            <ChevronRight size={13} className="text-slate-300" />
            <button
              type="button"
              onClick={() => selectNode(n)}
              className={cn(
                "max-w-[13rem] truncate rounded-lg px-2 py-1 font-medium transition",
                i === crumbs.length - 1 ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
              )}
              title={n.nama}
            >
              {n.nama}
            </button>
          </span>
        ))}
        {crumbs.length === 0 && (
          <span className="ml-1 text-slate-400">— pilih provinsi untuk mulai menjelajah</span>
        )}
      </div>

      {/* ── Miller columns (lazy) ── */}
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-1">
        {LEVELS.map((l) => {
          const col = cols[l];
          const active = !!col;
          return (
            <WilayahColumn
              key={l}
              level={l}
              active={active}
              parentLabel={l > 1 ? LEVEL_META[(l - 1) as Level].label.toLowerCase() : undefined}
              items={col?.items ?? []}
              loading={col?.loading ?? false}
              selectedKode={selected[l]?.kode ?? null}
              onSelect={selectNode}
            />
          );
        })}
      </div>

      {/* ── Detail node terpilih ── */}
      <AnimatePresence mode="wait">
        {deepest && (
          <motion.div
            key={deepest.kode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="shrink-0 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white p-3.5"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
                  {LEVEL_META[deepest.level as Level].label}
                </p>
                <p className="truncate text-sm font-bold text-slate-900">{deepest.nama}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-slate-500">
                  {crumbs.map((c) => c.nama).join(" › ")}
                </p>
              </div>
              <CodeChip label="Kode Kemendagri" value={deepest.kode} onCopy={() => copy(deepest.kode, "kode")} copied={copied === "kode"} mono />
              <CodeChip label="Kode Flat (FHIR/BPS)" value={deepest.kodeFlat} onCopy={() => copy(deepest.kodeFlat, "flat")} copied={copied === "flat"} mono />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-komponen ───────────────────────────────────────────────

function CodeChip({
  label, value, onCopy, copied, mono,
}: {
  label: string; value: string; onCopy: () => void; copied: boolean; mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex items-center gap-2">
        <span className={cn("text-[13px] font-semibold text-slate-800", mono && "font-mono tabular-nums")}>{value}</span>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
          aria-label={`Salin ${label}`}
        >
          {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}

function BrowserSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-5 w-56 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-80 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 w-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
      <div className="h-11 w-full max-w-md animate-pulse rounded-xl bg-slate-100" />
      <div className="h-9 w-full animate-pulse rounded-xl bg-slate-100" />
      <div className="flex flex-1 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-full min-w-60 flex-1 rounded-2xl border border-slate-200 bg-white p-3">
            <div className="mb-3 h-6 w-32 animate-pulse rounded bg-slate-100" />
            <div className="space-y-2">
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="h-8 animate-pulse rounded-lg bg-slate-50" style={{ opacity: 1 - j * 0.1 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
