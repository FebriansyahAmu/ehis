"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, PlusCircle, CheckCircle2, AlertTriangle, PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchKfaProducts } from "@/lib/api/kfa/kfa";
import type { KfaProduct } from "@/lib/master/kfaMock";

interface Props {
  defaultQuery: string;
  /** kfa_code (POA) yang sedang terpetakan — untuk tandai "Terpilih". */
  selectedPoaKode?: string;
  onPick: (p: KfaProduct) => void;
}

type Status = "idle" | "loading" | "done" | "error";

/**
 * Panel pencarian produk KFA: input → debounce → hit `searchKfaProducts` →
 * daftar hasil yang bisa dipilih untuk memetakan obat. Auto-cari saat mount
 * (memanfaatkan nama generik obat sebagai kueri awal).
 */
export default function KfaSearchPanel({ defaultQuery, selectedPoaKode, onPick }: Props) {
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<KfaProduct[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query.trim();
    const ac = new AbortController();
    // Semua setState dijalankan di dalam callback debounce (asinkron) — bukan
    // sinkron di badan effect — supaya tidak memicu cascading render.
    const t = setTimeout(() => {
      if (q.length < 2) {
        setResults([]);
        setStatus("idle");
        return;
      }
      setStatus("loading");
      searchKfaProducts(q, ac.signal)
        .then((rows) => {
          setResults(rows);
          setStatus("done");
        })
        .catch((e) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setStatus("error");
        });
    }, q.length < 2 ? 0 : 350);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Search input */}
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari produk KFA — nama obat, merk, atau zat aktif…"
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-[12px] text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        {status === "loading" && (
          <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" />
        )}
      </div>

      {/* Status / hasil */}
      {status === "idle" && (
        <EmptyHint
          icon={PackageSearch}
          text={query.trim().length === 0
            ? "Ketik nama obat untuk mencari padanan di Kamus Farmasi & Alkes."
            : "Ketik minimal 2 karakter…"}
        />
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">
          <AlertTriangle size={14} className="shrink-0" />
          Gagal menghubungi layanan KFA. Coba lagi.
        </div>
      )}

      {status === "done" && results.length === 0 && (
        <EmptyHint icon={PackageSearch} text={`Tidak ada produk KFA cocok untuk "${query.trim()}".`} />
      )}

      {results.length > 0 && (
        <>
          <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {results.length} produk ditemukan
          </p>
          <div className="flex max-h-85 flex-col gap-2 overflow-y-auto pr-0.5">
            <AnimatePresence initial={false}>
              {results.map((p) => (
                <ResultCard
                  key={p.kfaCode}
                  product={p}
                  selected={p.kfaCode === selectedPoaKode}
                  onPick={() => onPick(p)}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function EmptyHint({ icon: Icon, text }: { icon: typeof PackageSearch; text: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-3">
      <Icon size={16} className="shrink-0 text-slate-400" />
      <p className="text-[11px] leading-snug text-slate-500">{text}</p>
    </div>
  );
}

function ResultCard({
  product: p, selected, onPick,
}: {
  product: KfaProduct;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "rounded-lg border bg-white p-2.5 transition",
        selected ? "border-indigo-300 ring-1 ring-indigo-200" : "border-slate-200 hover:border-indigo-200",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-bold text-slate-800">{p.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
            {p.namaDagang && <span className="font-semibold text-slate-600">{p.namaDagang}</span>}
            {p.manufacturer && <span>· {p.manufacturer}</span>}
            {p.nie && <span className="font-mono text-slate-400">· NIE {p.nie}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={onPick}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition",
            selected
              ? "bg-indigo-100 text-indigo-700"
              : "bg-indigo-600 text-white hover:bg-indigo-500",
          )}
        >
          {selected ? <CheckCircle2 size={12} /> : <PlusCircle size={12} />}
          {selected ? "Terpetakan" : "Petakan"}
        </button>
      </div>

      {/* Atribut KFA */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <Tag label="POV" value={p.productTemplate.code} tone="indigo" />
        <Tag label="POA" value={p.kfaCode} tone="violet" />
        <Tag label={p.dosageForm.name} tone="slate" />
        <Tag label={p.rutePemberian.name} tone="sky" />
        {p.dosePerUnit && <Tag label={p.dosePerUnit} tone="emerald" />}
      </div>

      {/* Zat aktif */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {p.activeIngredients.map((i) => (
          <span
            key={i.kode}
            className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700"
          >
            <span className="font-mono text-[9px] text-rose-400">{i.kode}</span>
            {i.zatAktif}
            {i.kekuatan != null && (
              <span className="text-rose-500">{i.kekuatan}{i.satuan}</span>
            )}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

const TAG_TONE: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-700",
  violet: "bg-violet-50 text-violet-700",
  slate: "bg-slate-100 text-slate-600",
  sky: "bg-sky-50 text-sky-700",
  emerald: "bg-emerald-50 text-emerald-700",
};

function Tag({ label, value, tone }: { label: string; value?: string; tone: keyof typeof TAG_TONE | string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold", TAG_TONE[tone] ?? TAG_TONE.slate)}>
      {value ? (
        <>
          <span className="opacity-60">{label}</span>
          <span className="font-mono">{value}</span>
        </>
      ) : (
        label
      )}
    </span>
  );
}
