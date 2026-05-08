"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  Stethoscope, BookOpen, Activity, Info,
} from "lucide-react";
import type { IGDDiagnosa, DiagnosaTipe, DiagnosaStatus } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  ICD10, ICD9, TIPE_CONFIG, TIPE_ORDER, STATUS_CONFIG, STATUS_ORDER,
  INA_CBG_MAP,
  type CatalogEntry, type Icd9ProsedurEntry,
} from "./diagnosaShared";

// ── CatalogSearch ─────────────────────────────────────────

function CatalogSearch({
  catalog, placeholder, accentCls, onSelect,
}: {
  catalog: CatalogEntry[];
  placeholder: string;
  accentCls: { focus: string; dropHover: string; kategoriText: string; kodeText: string };
  onSelect: (entry: CatalogEntry) => void;
}) {
  const [query, setQuery]   = useState("");
  const [open, setOpen]     = useState(false);
  const wrapRef             = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setQuery(""); } };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  const results = query.trim().length >= 2
    ? catalog.filter(e =>
        e.kode.toLowerCase().includes(query.toLowerCase()) ||
        e.nama.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 10)
    : [];

  const groups = results.reduce<Record<string, CatalogEntry[]>>((acc, e) => {
    (acc[e.kategori] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="relative" ref={wrapRef}>
      <Search size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => query && setOpen(true)}
        className={cn(
          "h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-7 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition",
          accentCls.focus,
        )}
      />
      {query && (
        <button
          onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus(); }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
        >
          <X size={11} />
        </button>
      )}

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-x-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            {Object.entries(groups).map(([kat, items]) => (
              <div key={kat}>
                <div className="sticky top-0 border-b border-slate-100 bg-slate-50/95 px-2.5 py-1 backdrop-blur-sm">
                  <span className={cn("text-[9px] font-bold uppercase tracking-wider", accentCls.kategoriText)}>{kat}</span>
                </div>
                {items.map(item => (
                  <button
                    key={item.kode}
                    onMouseDown={e => { e.preventDefault(); onSelect(item); setQuery(""); setOpen(false); }}
                    className={cn("flex w-full items-start gap-2 px-2.5 py-2 text-left transition", accentCls.dropHover)}
                  >
                    <span className={cn("mt-px w-11 shrink-0 font-mono text-[10px] font-bold", accentCls.kodeText)}>{item.kode}</span>
                    <span className="text-[11px] leading-snug text-slate-700">{item.nama}</span>
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
        {open && query.trim().length >= 2 && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-full z-50 mt-1 rounded-xl border border-slate-200 bg-white px-3 py-4 text-center shadow-lg"
          >
            <p className="text-xs text-slate-400">Tidak ditemukan untuk &ldquo;{query}&rdquo;</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!query && (
        <p className="mt-1.5 text-[10px] text-slate-400">Ketik minimal 2 karakter untuk mencari</p>
      )}
    </div>
  );
}

// ── DiagnosaRow ───────────────────────────────────────────

function DiagnosaRow({ diag, onRemove, onChangeTipe }: {
  diag: IGDDiagnosa;
  onRemove: () => void;
  onChangeTipe: (t: DiagnosaTipe) => void;
}) {
  const [tipeOpen, setTipeOpen]   = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const ref                       = useRef<HTMLDivElement>(null);
  const tc                        = TIPE_CONFIG[diag.tipe];
  const sc                        = diag.status ? STATUS_CONFIG[diag.status] : null;
  const hasDetail                 = !!(diag.alasan || diag.analisa);

  useEffect(() => {
    if (!tipeOpen) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setTipeOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [tipeOpen]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "border-b border-slate-100 border-l-2 last:border-b-0 transition-colors",
        "first:rounded-t-xl last:rounded-b-xl",
        tc.border,
      )}
    >
      {/* ── Main row ── */}
      <div className="group flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50/70">
        <span className="w-14 shrink-0 font-mono text-[10px] font-bold text-slate-500">{diag.kodeIcd10}</span>
        <p className="min-w-0 flex-1 text-[11px] font-medium leading-snug text-slate-800">{diag.namaDiagnosis}</p>

        <div className="flex shrink-0 items-center gap-1">
          {/* Status badge */}
          {sc && diag.status && (
            <span className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ring-1",
              sc.bg, sc.text, sc.ring,
            )}>
              <span className={cn("h-1 w-1 rounded-full", sc.dot)} />
              {diag.status}
            </span>
          )}

          {/* Tipe dropdown */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setTipeOpen(v => !v)}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 transition hover:opacity-80",
                tc.bg, tc.text, tc.ring,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", tc.dot)} />
              {diag.tipe}
              <ChevronDown size={8} />
            </button>
            {tipeOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {TIPE_ORDER.map(t => {
                  const c = TIPE_CONFIG[t];
                  return (
                    <button
                      key={t}
                      onClick={() => { onChangeTipe(t); setTipeOpen(false); }}
                      className={cn(
                        "flex w-full items-center gap-2 px-2.5 py-1.5 text-xs transition hover:bg-slate-50",
                        t === diag.tipe && "bg-slate-50",
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.dot)} />
                      <span className={cn("font-medium", c.text)}>{t}</span>
                      {t === diag.tipe && <CheckCircle2 size={10} className="ml-auto text-slate-300" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Expand detail */}
          {hasDetail && (
            <button
              onClick={() => setExpanded(v => !v)}
              title={expanded ? "Sembunyikan detail" : "Lihat alasan & analisa"}
              className="flex h-5 w-5 items-center justify-center rounded text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <ChevronRight size={11} className={cn("transition-transform", expanded && "rotate-90")} />
            </button>
          )}

          {/* Delete */}
          <button
            onClick={onRemove}
            aria-label="Hapus diagnosis"
            className="flex h-6 w-6 items-center justify-center rounded-md border border-rose-100 bg-rose-50 text-rose-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-100 hover:text-rose-600"
          >
            <X size={10} />
          </button>
        </div>
      </div>

      {/* ── Expandable detail ── */}
      <AnimatePresence initial={false}>
        {expanded && hasDetail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mx-3 mb-2.5 flex flex-col gap-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
              {diag.alasan && (
                <div>
                  <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">Alasan / Indikasi</p>
                  <p className="text-[11px] leading-relaxed text-slate-700">{diag.alasan}</p>
                </div>
              )}
              {diag.analisa && (
                <div className={cn(diag.alasan && "border-t border-slate-200 pt-1.5")}>
                  <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">Analisa Klinis</p>
                  <p className="text-[11px] leading-relaxed text-slate-700">{diag.analisa}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// ── Icd9Row ───────────────────────────────────────────────

function Icd9Row({ entry, onRemove }: { entry: Icd9ProsedurEntry; onRemove: () => void }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.18 }}
      className="group flex items-center gap-2.5 border-b border-slate-100 border-l-2 border-l-teal-400 px-3 py-2.5 last:border-b-0 transition-colors hover:bg-slate-50/70 first:rounded-t-xl last:rounded-b-xl"
    >
      <span className="w-14 shrink-0 font-mono text-[10px] font-bold text-teal-600">{entry.kode}</span>
      <p className="min-w-0 flex-1 text-[11px] font-medium leading-snug text-slate-800">{entry.nama}</p>
      <span className="shrink-0 rounded-md bg-teal-50 px-1.5 py-0.5 text-[9px] font-semibold text-teal-600 ring-1 ring-teal-200">
        {entry.kategori}
      </span>
      {entry.catatan && (
        <span title={entry.catatan}>
          <Info size={10} className="shrink-0 text-slate-300 hover:text-slate-500" />
        </span>
      )}
      <button
        onClick={onRemove}
        aria-label="Hapus prosedur"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-rose-100 bg-rose-50 text-rose-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-100 hover:text-rose-600"
      >
        <X size={10} />
      </button>
    </motion.li>
  );
}

// ── Accent configs ────────────────────────────────────────

const SKY_ACCENT   = {
  focus: "focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100",
  dropHover: "hover:bg-sky-50", kategoriText: "text-sky-500", kodeText: "text-sky-600",
};
const TEAL_ACCENT  = {
  focus: "focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-100",
  dropHover: "hover:bg-teal-50", kategoriText: "text-teal-500", kodeText: "text-teal-600",
};

// ── Icd10Form ─────────────────────────────────────────────

function Icd10Form({ onAdd, hasUtama }: {
  onAdd: (entry: CatalogEntry, tipe: DiagnosaTipe, status: DiagnosaStatus, alasan: string, analisa: string) => void;
  hasUtama: boolean;
}) {
  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const [tipe,     setTipe]     = useState<DiagnosaTipe>("Sekunder");
  const [status,   setStatus]   = useState<DiagnosaStatus>("Pasti");
  const [alasan,   setAlasan]   = useState("");
  const [analisa,  setAnalisa]  = useState("");

  const handleAdd = () => {
    if (!selected) return;
    onAdd(selected, tipe, status, alasan, analisa);
    setSelected(null); setAlasan(""); setAnalisa("");
    setTipe("Sekunder"); setStatus("Pasti");
  };

  return (
    <div className="flex flex-col gap-3">
      {selected ? (
        <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50/70 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold text-sky-600">{selected.kode}</span>
              <span className="rounded bg-sky-100 px-1 py-0.5 text-[9px] font-semibold text-sky-600">{selected.kategori}</span>
            </div>
            <p className="text-[11px] font-medium leading-snug text-sky-900">{selected.nama}</p>
          </div>
          <button
            onClick={() => { setSelected(null); setAlasan(""); setAnalisa(""); }}
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-sky-300 hover:bg-sky-100 hover:text-sky-600"
          >
            <X size={11} />
          </button>
        </div>
      ) : (
        <CatalogSearch
          catalog={ICD10}
          placeholder="Cari kode / nama diagnosis…"
          accentCls={SKY_ACCENT}
          onSelect={setSelected}
        />
      )}

      {selected && (
        <>
          {/* Tipe */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipe Diagnosis</p>
            <div className="flex flex-wrap gap-1.5">
              {TIPE_ORDER.map(t => {
                const c = TIPE_CONFIG[t];
                const active = tipe === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTipe(t)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                      active
                        ? cn("border-transparent ring-1", c.bg, c.text, c.ring)
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", active ? c.dot : "bg-slate-300")} />
                    {t}
                  </button>
                );
              })}
            </div>
            {tipe === "Utama" && hasUtama && (
              <p className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-600">
                <AlertTriangle size={9} /> Diagnosis Utama sebelumnya akan digeser ke Sekunder.
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Kepastian</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_ORDER.map(s => {
                const c = STATUS_CONFIG[s];
                const active = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                      active
                        ? cn("border-transparent ring-1", c.bg, c.text, c.ring)
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", active ? c.dot : "bg-slate-300")} />
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alasan */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">
              Alasan / Indikasi <span className="font-normal text-slate-400">(opsional)</span>
            </label>
            <input
              type="text"
              value={alasan}
              onChange={e => setAlasan(e.target.value)}
              placeholder="Mengapa diagnosis ini ditegakkan…"
              className={cn("h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition", SKY_ACCENT.focus)}
            />
          </div>

          {/* Analisa */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">
              Analisa Klinis <span className="font-normal text-slate-400">(opsional)</span>
            </label>
            <textarea
              rows={2}
              value={analisa}
              onChange={e => setAnalisa(e.target.value)}
              placeholder="Temuan dan dasar penegakan diagnosis…"
              className={cn("w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition", SKY_ACCENT.focus)}
            />
          </div>

          <button
            onClick={handleAdd}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-sky-600 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.98]"
          >
            Tambah Diagnosis
          </button>
        </>
      )}
    </div>
  );
}

// ── Icd9Form ──────────────────────────────────────────────

function Icd9Form({ onAdd }: {
  onAdd: (entry: CatalogEntry, catatan: string) => void;
}) {
  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const [catatan,  setCatatan]  = useState("");

  const handleAdd = () => {
    if (!selected) return;
    onAdd(selected, catatan);
    setSelected(null); setCatatan("");
  };

  return (
    <div className="flex flex-col gap-3">
      {selected ? (
        <div className="flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50/70 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold text-teal-600">{selected.kode}</span>
              <span className="rounded bg-teal-100 px-1 py-0.5 text-[9px] font-semibold text-teal-600">{selected.kategori}</span>
            </div>
            <p className="text-[11px] font-medium leading-snug text-teal-900">{selected.nama}</p>
          </div>
          <button
            onClick={() => { setSelected(null); setCatatan(""); }}
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-teal-300 hover:bg-teal-100 hover:text-teal-600"
          >
            <X size={11} />
          </button>
        </div>
      ) : (
        <CatalogSearch
          catalog={ICD9}
          placeholder="Cari kode / nama prosedur…"
          accentCls={TEAL_ACCENT}
          onSelect={setSelected}
        />
      )}

      {selected && (
        <>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">
              Catatan <span className="font-normal text-slate-400">(opsional)</span>
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Konteks klinis / keterangan prosedur…"
              className={cn("w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition", TEAL_ACCENT.focus)}
            />
          </div>
          <button
            onClick={handleAdd}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-600 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98]"
          >
            Tambah Prosedur
          </button>
        </>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

type IcdVersion = "ICD-10" | "ICD-9";

export interface DiagnosaTabProps {
  initialDiagnosa: IGDDiagnosa[];
}

export default function DiagnosaTab({ initialDiagnosa }: DiagnosaTabProps) {
  const [activeIcd,  setActiveIcd]  = useState<IcdVersion>("ICD-10");
  const [icd10List,  setIcd10List]  = useState<IGDDiagnosa[]>(initialDiagnosa);
  const [icd9List,   setIcd9List]   = useState<Icd9ProsedurEntry[]>([]);

  const hasUtama = icd10List.some(d => d.tipe === "Utama");

  const sortedIcd10 = useMemo(() =>
    [...icd10List].sort((a, b) => TIPE_ORDER.indexOf(a.tipe) - TIPE_ORDER.indexOf(b.tipe)),
    [icd10List],
  );

  const counts = useMemo(() =>
    TIPE_ORDER.reduce<Record<DiagnosaTipe, number>>((acc, t) => {
      acc[t] = icd10List.filter(d => d.tipe === t).length;
      return acc;
    }, {} as Record<DiagnosaTipe, number>),
    [icd10List],
  );

  const inaCbgGroup = useMemo(() => {
    const utama = icd10List.find(d => d.tipe === "Utama");
    if (!utama) return null;
    const entry = ICD10.find(e => e.kode === utama.kodeIcd10);
    return entry ? (INA_CBG_MAP[entry.kategori] ?? null) : null;
  }, [icd10List]);

  // ── Handlers ──

  const addIcd10 = (entry: CatalogEntry, tipe: DiagnosaTipe, status: DiagnosaStatus, alasan: string, analisa: string) => {
    if (icd10List.some(d => d.kodeIcd10 === entry.kode)) return;
    if (tipe === "Utama" && hasUtama) {
      setIcd10List(prev => prev.map(d => d.tipe === "Utama" ? { ...d, tipe: "Sekunder" } : d));
    }
    setIcd10List(prev => [...prev, {
      id: `d-${Date.now()}`,
      kodeIcd10: entry.kode,
      namaDiagnosis: entry.nama,
      tipe,
      status,
      alasan: alasan.trim() || undefined,
      analisa: analisa.trim() || undefined,
    }]);
  };

  const removeIcd10 = (id: string) => setIcd10List(prev => prev.filter(d => d.id !== id));

  const changeTipe = (id: string, tipe: DiagnosaTipe) => {
    if (tipe === "Utama") {
      setIcd10List(prev => prev.map(d =>
        d.id === id ? { ...d, tipe: "Utama" }
        : d.tipe === "Utama" ? { ...d, tipe: "Sekunder" }
        : d,
      ));
    } else {
      setIcd10List(prev => prev.map(d => d.id === id ? { ...d, tipe } : d));
    }
  };

  const addIcd9 = (entry: CatalogEntry, catatan: string) => {
    if (icd9List.some(e => e.kode === entry.kode)) return;
    setIcd9List(prev => [...prev, {
      id: `p-${Date.now()}`,
      kode: entry.kode,
      nama: entry.nama,
      kategori: entry.kategori,
      catatan,
    }]);
  };

  const removeIcd9 = (id: string) => setIcd9List(prev => prev.filter(e => e.id !== id));

  // ── Render ──

  return (
    <div className="flex flex-col gap-3">

      {/* ── Tab switcher ── */}
      <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {(["ICD-10", "ICD-9"] as IcdVersion[]).map((v, i) => {
          const isActive = activeIcd === v;
          const count    = v === "ICD-10" ? icd10List.length : icd9List.length;
          const Icon     = v === "ICD-10" ? BookOpen : Activity;
          return (
            <button
              key={v}
              onClick={() => setActiveIcd(v)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-2 px-4 py-3 text-xs font-semibold transition-colors",
                i === 0 && "border-r border-slate-200",
                isActive
                  ? v === "ICD-10" ? "bg-sky-50 text-sky-700" : "bg-teal-50 text-teal-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
              )}
            >
              <Icon size={12} />
              <span>{v === "ICD-10" ? "Diagnosa ICD-10" : "Prosedur ICD-9"}</span>
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none",
                isActive && v === "ICD-10" ? "bg-sky-100 text-sky-700"
                : isActive && v === "ICD-9"  ? "bg-teal-100 text-teal-700"
                : "bg-slate-100 text-slate-500",
              )}>
                {count}
              </span>
              {isActive && (
                <motion.span
                  layoutId="diag-tab-underline"
                  className={cn("absolute bottom-0 left-0 right-0 h-0.5", v === "ICD-10" ? "bg-sky-500" : "bg-teal-500")}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Body ── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeIcd}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4"
        >
          {/* ── Left: list panel ── */}
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            {activeIcd === "ICD-10" ? (
              <>
                {/* Summary chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
                    <Stethoscope size={11} className="text-sky-400" />
                    <span className="text-xs font-semibold text-slate-700">Diagnosa</span>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      {icd10List.length}
                    </span>
                  </div>
                  {TIPE_ORDER.filter(t => counts[t] > 0).map(t => {
                    const c = TIPE_CONFIG[t];
                    return (
                      <span key={t} className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold ring-1",
                        c.bg, c.text, c.ring,
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
                        {counts[t]} {t}
                      </span>
                    );
                  })}
                </div>

                {/* INA-CBG preview */}
                {inaCbgGroup && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-1.5"
                  >
                    <Info size={11} className="shrink-0 text-indigo-400" />
                    <p className="text-[10px] text-indigo-700">
                      <span className="font-semibold">Estimasi INA-CBG:</span> {inaCbgGroup}
                    </p>
                  </motion.div>
                )}

                {/* ICD-10 list */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  {sortedIcd10.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-300">
                        <BookOpen size={18} />
                      </div>
                      <p className="text-xs text-slate-400">Belum ada diagnosis ICD-10</p>
                      <p className="text-[10px] text-slate-300">Gunakan panel di bawah / kanan untuk menambah</p>
                    </div>
                  ) : (
                    <ul>
                      <AnimatePresence initial={false}>
                        {sortedIcd10.map(diag => (
                          <DiagnosaRow
                            key={diag.id}
                            diag={diag}
                            onRemove={() => removeIcd10(diag.id)}
                            onChangeTipe={t => changeTipe(diag.id, t)}
                          />
                        ))}
                      </AnimatePresence>
                    </ul>
                  )}
                </div>

                {/* Validation alerts */}
                {icd10List.length > 0 && !hasUtama && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" />
                    <p className="text-xs text-amber-700">
                      Belum ada <strong>Diagnosis Utama</strong>. Klik badge tipe untuk mengubahnya.
                    </p>
                  </div>
                )}
                {icd10List.length > 0 && hasUtama && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <CheckCircle2 size={12} className="shrink-0 text-emerald-500" />
                    <p className="text-xs text-emerald-700">Diagnosis utama sudah ditegakkan.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* ICD-9 summary */}
                <div className="flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
                  <Activity size={11} className="text-teal-500" />
                  <span className="text-xs font-semibold text-slate-700">Prosedur Tindakan</span>
                  <span className="rounded-full bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-600 ring-1 ring-teal-200">
                    {icd9List.length}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  {icd9List.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-300">
                        <Activity size={18} />
                      </div>
                      <p className="text-xs text-slate-400">Belum ada prosedur ICD-9</p>
                      <p className="text-[10px] text-slate-300">Gunakan panel di bawah / kanan untuk menambah</p>
                    </div>
                  ) : (
                    <ul>
                      <AnimatePresence initial={false}>
                        {icd9List.map(entry => (
                          <Icd9Row key={entry.id} entry={entry} onRemove={() => removeIcd9(entry.id)} />
                        ))}
                      </AnimatePresence>
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Right: form panel ── */}
          <div className="shrink-0 lg:w-96">
            <div className={cn(
              "rounded-xl border bg-white p-3.5 shadow-sm",
              activeIcd === "ICD-10" ? "border-sky-100" : "border-teal-100",
            )}>
              <div className={cn(
                "mb-3 flex items-center gap-2 border-b pb-2.5",
                activeIcd === "ICD-10" ? "border-sky-100" : "border-teal-100",
              )}>
                {activeIcd === "ICD-10"
                  ? <><BookOpen size={11} className="text-sky-500" /><p className="text-xs font-semibold text-slate-700">Tambah Diagnosis ICD-10</p></>
                  : <><Activity size={11}  className="text-teal-500"/><p className="text-xs font-semibold text-slate-700">Tambah Prosedur ICD-9</p></>
                }
              </div>
              <AnimatePresence mode="wait" initial={false}>
                {activeIcd === "ICD-10" ? (
                  <motion.div key="f10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                    <Icd10Form onAdd={addIcd10} hasUtama={hasUtama} />
                  </motion.div>
                ) : (
                  <motion.div key="f9" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                    <Icd9Form onAdd={addIcd9} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
