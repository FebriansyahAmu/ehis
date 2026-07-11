"use client";

// Diagnosa & Prosedur (shared IGD/RI/RJ) — redesign + wiring DB 2026-06-10.
// Search-first: cari ICD via API master (fallback katalog lokal) → kartu konfigurasi → daftar
// tergrup per tipe dengan kartu hero Diagnosis Utama + sidebar Ringkasan Koding (INA-CBG).
// kunjunganId UUID → mode DB (domain Condition, per-aksi); selain itu state lokal (demo mock).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Circle,
  Stethoscope, BookOpen, Activity, Info, Crown, Sparkles, ClipboardList, Loader2,
} from "lucide-react";
import type { IGDDiagnosa, DiagnosaTipe, DiagnosaStatus } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  ICD10, ICD9, TIPE_CONFIG, TIPE_ORDER, STATUS_CONFIG, STATUS_ORDER,
  INA_CBG_MAP, QUICK_PICKS_ICD10,
  type Icd9ProsedurEntry,
} from "./diagnosaShared";
import IcdSearch, { type IcdPick, type IcdSearchAccent } from "./diagnosa/IcdSearch";
import DiagnosaSebelumnya from "./DiagnosaSebelumnya";
import {
  getDiagnosa,
  addDiagnosa as apiAddDiagnosa,
  updateDiagnosa as apiUpdateDiagnosa,
  deleteDiagnosa as apiDeleteDiagnosa,
  addProsedur as apiAddProsedur,
  deleteProsedur as apiDeleteProsedur,
  type DiagnosaDTO,
} from "@/lib/api/diagnosa/diagnosa";
import { emitRecordChange } from "@/lib/realtime/recordBus";

// ── Accent per versi ICD ──────────────────────────────────

const SKY: IcdSearchAccent = {
  focus: "focus:border-sky-300 focus:ring-2 focus:ring-sky-100",
  itemActive: "bg-sky-50",
  kodeText: "text-sky-600",
  badge: "bg-sky-50 text-sky-600",
};
const TEAL: IcdSearchAccent = {
  focus: "focus:border-teal-300 focus:ring-2 focus:ring-teal-100",
  itemActive: "bg-teal-50",
  kodeText: "text-teal-600",
  badge: "bg-teal-50 text-teal-600",
};

// ── Pil pilihan (tipe / status) ───────────────────────────

function PillGroup<T extends string>({
  options, value, onChange, config,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  config: Record<T, { bg: string; text: string; ring: string; dot: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const c = config[opt];
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-150",
              active
                ? cn("border-transparent ring-1", c.bg, c.text, c.ring)
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", active ? c.dot : "bg-slate-300")} />
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Kartu konfigurasi setelah memilih kode ────────────────

function ConfigCard10({
  entry, hasUtama, onAdd, onCancel,
}: {
  entry: IcdPick;
  hasUtama: boolean;
  onAdd: (tipe: DiagnosaTipe, status: DiagnosaStatus, alasan: string, analisa: string) => void;
  onCancel: () => void;
}) {
  const [tipe, setTipe] = useState<DiagnosaTipe>(hasUtama ? "Sekunder" : "Utama");
  const [status, setStatus] = useState<DiagnosaStatus>("Pasti");
  const [alasan, setAlasan] = useState("");
  const [analisa, setAnalisa] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.99 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-sky-200 bg-white shadow-md"
    >
      {/* kode terpilih */}
      <div className="flex items-start gap-2.5 border-b border-sky-100 bg-sky-50/70 px-3.5 py-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-600 font-mono text-[9px] font-bold text-white">
          ICD
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-sky-700">{entry.kode}</span>
            {entry.kategori && (
              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-600">
                {entry.kategori}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] font-medium leading-snug text-sky-900">{entry.nama}</p>
        </div>
        <button
          onClick={onCancel}
          aria-label="Batal pilih kode"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sky-300 transition hover:bg-sky-100 hover:text-sky-600"
        >
          <X size={12} />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-3.5">
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Tipe Diagnosis
          </p>
          <PillGroup options={TIPE_ORDER} value={tipe} onChange={setTipe} config={TIPE_CONFIG} />
          {tipe === "Utama" && hasUtama && (
            <p className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-600">
              <AlertTriangle size={9} /> Diagnosis Utama sebelumnya akan digeser ke Sekunder.
            </p>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Status Kepastian
          </p>
          <PillGroup options={STATUS_ORDER} value={status} onChange={setStatus} config={STATUS_CONFIG} />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold text-slate-500">
            Alasan / Indikasi <span className="font-normal text-slate-400">(opsional)</span>
          </label>
          <input
            type="text"
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Mengapa diagnosis ini ditegakkan…"
            className={cn(
              "h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:bg-white",
              SKY.focus,
            )}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold text-slate-500">
            Analisa Klinis <span className="font-normal text-slate-400">(opsional)</span>
          </label>
          <textarea
            rows={2}
            value={analisa}
            onChange={(e) => setAnalisa(e.target.value)}
            placeholder="Temuan & dasar penegakan diagnosis…"
            className={cn(
              "w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:bg-white",
              SKY.focus,
            )}
          />
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => onAdd(tipe, status, alasan, analisa)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-600 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-sky-700 active:scale-[0.98]"
          >
            <CheckCircle2 size={12} /> Tambah Diagnosis
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            Batal
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ConfigCard9({
  entry, onAdd, onCancel,
}: {
  entry: IcdPick;
  onAdd: (catatan: string) => void;
  onCancel: () => void;
}) {
  const [catatan, setCatatan] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.99 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-teal-200 bg-white shadow-md"
    >
      <div className="flex items-start gap-2.5 border-b border-teal-100 bg-teal-50/70 px-3.5 py-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-600 font-mono text-[9px] font-bold text-white">
          9CM
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-teal-700">{entry.kode}</span>
            {entry.kategori && (
              <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[9px] font-semibold text-teal-600">
                {entry.kategori}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] font-medium leading-snug text-teal-900">{entry.nama}</p>
        </div>
        <button
          onClick={onCancel}
          aria-label="Batal pilih prosedur"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-teal-300 transition hover:bg-teal-100 hover:text-teal-600"
        >
          <X size={12} />
        </button>
      </div>
      <div className="flex flex-col gap-3 p-3.5">
        <textarea
          rows={2}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan — konteks klinis / keterangan prosedur (opsional)…"
          className={cn(
            "w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:bg-white",
            TEAL.focus,
          )}
        />
        <div className="flex gap-1.5">
          <button
            onClick={() => onAdd(catatan)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-600 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-teal-700 active:scale-[0.98]"
          >
            <CheckCircle2 size={12} /> Tambah Prosedur
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            Batal
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Dropdown tipe diagnosis (badge + popover) ─────────────

const TIPE_DESC: Record<DiagnosaTipe, string> = {
  Utama: "Dasar utama klaim / grouping",
  Sekunder: "Diagnosis penyerta episode ini",
  Komplikasi: "Timbul selama perawatan",
  Komorbid: "Penyakit penyerta kronik",
};

function TipeDropdown({
  tipe, onChange,
}: {
  tipe: DiagnosaTipe;
  onChange: (t: DiagnosaTipe) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tc = TIPE_CONFIG[tipe];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Ubah tipe diagnosis"
        className={cn(
          "inline-flex h-5 items-center gap-1.5 rounded-md px-1.5 text-[10px] font-semibold leading-none ring-1 transition",
          tc.bg, tc.text, tc.ring,
          open ? "ring-2" : "hover:opacity-80",
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", tc.dot)} />
        {tipe}
        <ChevronDown size={8} className={cn("transition-transform duration-150", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.13, ease: "easeOut" }}
            role="listbox"
            className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
          >
            <p className="px-3 pb-1 pt-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Tipe Diagnosis
            </p>
            {TIPE_ORDER.map((t) => {
              const c = TIPE_CONFIG[t];
              const act = t === tipe;
              return (
                <button
                  key={t}
                  role="option"
                  aria-selected={act}
                  onClick={() => {
                    onChange(t);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition hover:bg-slate-50",
                    act && "bg-slate-50",
                  )}
                >
                  <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1", c.bg, c.ring)}>
                    {t === "Utama" ? (
                      <Crown size={10} className={c.text} />
                    ) : (
                      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-[11px] font-semibold leading-tight", c.text)}>{t}</span>
                    <span className="block text-[9px] leading-tight text-slate-400">{TIPE_DESC[t]}</span>
                  </span>
                  {act && <CheckCircle2 size={12} className="shrink-0 text-emerald-500" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Badge status (klik = ganti status kepastian) ──────────

function StatusBadge({
  status, onCycle,
}: {
  status: DiagnosaStatus;
  onCycle: () => void;
}) {
  const sc = STATUS_CONFIG[status];
  return (
    <button
      onClick={onCycle}
      title="Klik untuk ubah status kepastian"
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-md px-1.5 text-[10px] font-semibold leading-none ring-1 transition hover:opacity-75",
        sc.bg, sc.text, sc.ring,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
      {status}
    </button>
  );
}

// ── Detail alasan/analisa (expandable) ────────────────────

function DetailBlock({ diag }: { diag: IGDDiagnosa }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
      {diag.alasan && (
        <div>
          <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Alasan / Indikasi
          </p>
          <p className="text-[11px] leading-relaxed text-slate-700">{diag.alasan}</p>
        </div>
      )}
      {diag.analisa && (
        <div className={cn(diag.alasan && "border-t border-slate-200 pt-1.5")}>
          <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Analisa Klinis
          </p>
          <p className="text-[11px] leading-relaxed text-slate-700">{diag.analisa}</p>
        </div>
      )}
    </div>
  );
}

// ── Kartu hero Diagnosis Utama ────────────────────────────

function UtamaCard({
  diag, onRemove, onCycleStatus,
}: {
  diag: IGDDiagnosa;
  onRemove: () => void;
  onCycleStatus: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = !!(diag.alasan || diag.analisa);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18 }}
      className="group overflow-hidden rounded-xl border border-rose-200 bg-white shadow-sm ring-1 ring-rose-100"
    >
      <div className="flex items-start gap-3 px-3.5 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 ring-1 ring-rose-200">
          <Crown size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400">
              Diagnosis Utama
            </span>
            {diag.status && <StatusBadge status={diag.status} onCycle={onCycleStatus} />}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-sm font-bold text-rose-600">{diag.kodeIcd10}</span>
            <p className="min-w-0 text-xs font-semibold leading-snug text-slate-800">
              {diag.namaDiagnosis}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {hasDetail && (
            <button
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? "Sembunyikan detail" : "Lihat alasan & analisa"}
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <ChevronRight size={12} className={cn("transition-transform", expanded && "rotate-90")} />
            </button>
          )}
          <button
            onClick={onRemove}
            aria-label="Hapus diagnosis utama"
            className="flex h-6 w-6 items-center justify-center rounded-md border border-rose-100 bg-rose-50 text-rose-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-100 hover:text-rose-600"
          >
            <X size={11} />
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && hasDetail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3">
              <DetailBlock diag={diag} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Baris diagnosis non-utama ─────────────────────────────

function DiagRow({
  diag, onRemove, onCycleStatus, onPromote, onChangeTipe,
}: {
  diag: IGDDiagnosa;
  onRemove: () => void;
  onCycleStatus: () => void;
  onPromote: () => void;
  onChangeTipe: (t: DiagnosaTipe) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const tc = TIPE_CONFIG[diag.tipe];
  const hasDetail = !!(diag.alasan || diag.analisa);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "border-b border-slate-100 border-l-2 last:border-b-0 first:rounded-t-xl last:rounded-b-xl",
        tc.border,
      )}
    >
      <div className="group flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-slate-50/70">
        <span className="w-14 shrink-0 font-mono text-[10px] font-bold text-slate-500">
          {diag.kodeIcd10}
        </span>
        <p className="min-w-0 flex-1 text-[11px] font-medium leading-snug text-slate-800">
          {diag.namaDiagnosis}
        </p>

        <div className="flex shrink-0 items-center gap-1">
          {diag.status && <StatusBadge status={diag.status} onCycle={onCycleStatus} />}

          {/* tukar tipe via dropdown badge */}
          <TipeDropdown tipe={diag.tipe} onChange={onChangeTipe} />

          {/* promosi cepat ke Utama */}
          <button
            onClick={onPromote}
            title="Jadikan Diagnosis Utama"
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-200 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500"
          >
            <Crown size={11} />
          </button>

          {hasDetail && (
            <button
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? "Sembunyikan detail" : "Lihat alasan & analisa"}
              className="flex h-5 w-5 items-center justify-center rounded text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <ChevronRight size={11} className={cn("transition-transform", expanded && "rotate-90")} />
            </button>
          )}

          <button
            onClick={onRemove}
            aria-label="Hapus diagnosis"
            className="flex h-6 w-6 items-center justify-center rounded-md border border-rose-100 bg-rose-50 text-rose-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-100 hover:text-rose-600"
          >
            <X size={10} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && hasDetail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mx-3 mb-2.5">
              <DetailBlock diag={diag} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// ── Baris prosedur ICD-9 ──────────────────────────────────

function Icd9Row({ entry, onRemove }: { entry: Icd9ProsedurEntry; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.18 }}
      className="border-b border-slate-100 border-l-2 border-l-teal-400 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
    >
      <div className="group flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-slate-50/70">
        <span className="w-14 shrink-0 font-mono text-[10px] font-bold text-teal-600">{entry.kode}</span>
        <p className="min-w-0 flex-1 text-[11px] font-medium leading-snug text-slate-800">{entry.nama}</p>
        <span className="shrink-0 rounded-md bg-teal-50 px-1.5 py-0.5 text-[9px] font-semibold text-teal-600 ring-1 ring-teal-200">
          {entry.kategori}
        </span>
        {entry.catatan && (
          <button
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Sembunyikan catatan" : "Lihat catatan"}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <ChevronRight size={11} className={cn("transition-transform", expanded && "rotate-90")} />
          </button>
        )}
        <button
          onClick={onRemove}
          aria-label="Hapus prosedur"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-rose-100 bg-rose-50 text-rose-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-100 hover:text-rose-600"
        >
          <X size={10} />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {expanded && entry.catatan && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mx-3 mb-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
              <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">Catatan</p>
              <p className="text-[11px] leading-relaxed text-slate-700">{entry.catatan}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// ── Sidebar Ringkasan Koding ──────────────────────────────

function ChecklistItem({ ok, label, sub }: { ok: boolean; label: string; sub?: string }) {
  return (
    <div className="flex items-start gap-2">
      {ok ? (
        <CheckCircle2 size={13} className="mt-px shrink-0 text-emerald-500" />
      ) : (
        <Circle size={13} className="mt-px shrink-0 text-slate-300" />
      )}
      <div className="min-w-0">
        <p className={cn("text-[11px] font-medium leading-snug", ok ? "text-slate-700" : "text-slate-400")}>
          {label}
        </p>
        {sub && <p className="text-[9px] leading-snug text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function RingkasanPanel({
  icd10List, icd9Count, inaCbg,
}: {
  icd10List: IGDDiagnosa[];
  icd9Count: number;
  inaCbg: string | null;
}) {
  const hasUtama = icd10List.some((d) => d.tipe === "Utama");
  const belumPasti = icd10List.filter((d) => d.status && d.status !== "Pasti").length;
  const counts = TIPE_ORDER.map((t) => ({
    tipe: t,
    n: icd10List.filter((d) => d.tipe === t).length,
  })).filter((c) => c.n > 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs lg:sticky lg:top-4">
      <div className="flex items-center gap-2 border-b border-slate-100 px-3.5 py-2.5">
        <ClipboardList size={12} className="text-indigo-400" />
        <p className="text-xs font-bold text-slate-700">Ringkasan Koding</p>
      </div>

      <div className="flex flex-col gap-2.5 px-3.5 py-3">
        <ChecklistItem
          ok={hasUtama}
          label="Diagnosis Utama ditegakkan"
          sub={hasUtama ? undefined : "Wajib untuk klaim — klik ikon mahkota pada baris"}
        />
        <ChecklistItem
          ok={icd10List.length > 0 && belumPasti === 0}
          label="Semua status kepastian Pasti"
          sub={belumPasti > 0 ? `${belumPasti} diagnosis masih Dicurigai / Diferensial` : undefined}
        />
        <ChecklistItem
          ok={icd9Count > 0}
          label={`Prosedur ICD-9 tercatat${icd9Count > 0 ? ` (${icd9Count})` : ""}`}
          sub={icd9Count === 0 ? "Lengkapi bila ada tindakan/prosedur" : undefined}
        />
      </div>

      {counts.length > 0 && (
        <div className="border-t border-slate-100 px-3.5 py-3">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Komposisi Diagnosa
          </p>
          <div className="flex flex-col gap-1.5">
            {counts.map(({ tipe, n }) => {
              const c = TIPE_CONFIG[tipe];
              const pct = Math.round((n / icd10List.length) * 100);
              return (
                <div key={tipe} className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.dot)} />
                  <span className="w-20 shrink-0 text-[10px] text-slate-500">{tipe}</span>
                  <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className={cn("h-full rounded-full", c.dot)}
                    />
                  </div>
                  <span className="w-4 shrink-0 text-right text-[10px] font-semibold text-slate-600">{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 bg-indigo-50/50 px-3.5 py-3">
        <div className="flex items-start gap-2">
          <Info size={11} className="mt-0.5 shrink-0 text-indigo-400" />
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">
              Estimasi Grup INA-CBG / iDRG
            </p>
            <p className="mt-0.5 text-[11px] font-medium leading-snug text-indigo-700">
              {inaCbg ?? "Menunggu Diagnosis Utama…"}
            </p>
            <p className="mt-1 text-[9px] leading-snug text-indigo-400">
              Data koding dikonsumsi modul E-Klaim & Billing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

type IcdVersion = "ICD-10" | "ICD-9";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dtoToIcd10(d: DiagnosaDTO["items"][number]): IGDDiagnosa {
  return {
    id: d.id,
    kodeIcd10: d.kodeIcd10,
    namaDiagnosis: d.namaDiagnosis,
    tipe: d.tipe,
    status: d.status,
    alasan: d.alasan,
    analisa: d.analisa,
  };
}

function dtoToIcd9(p: DiagnosaDTO["prosedur"][number]): Icd9ProsedurEntry {
  return { id: p.id, kode: p.kode, nama: p.nama, kategori: p.kategori, catatan: p.catatan ?? "" };
}

export interface DiagnosaTabProps {
  initialDiagnosa: IGDDiagnosa[];
  /** UUID kunjungan → mode DB (persist per-aksi ke domain Condition); selain itu demo lokal (mock). */
  kunjunganId?: string;
}

export default function DiagnosaTab({ initialDiagnosa, kunjunganId }: DiagnosaTabProps) {
  const isPersisted = !!kunjunganId && UUID_RE.test(kunjunganId);

  const [activeIcd, setActiveIcd] = useState<IcdVersion>("ICD-10");
  const [icd10List, setIcd10List] = useState<IGDDiagnosa[]>(isPersisted ? [] : initialDiagnosa);
  const [icd9List, setIcd9List] = useState<Icd9ProsedurEntry[]>([]);
  const [selected10, setSelected10] = useState<IcdPick | null>(null);
  const [selected9, setSelected9] = useState<IcdPick | null>(null);
  /** metadata kode (kategori/inaCbg dari master) — untuk estimasi grouping */
  const [metaByKode, setMetaByKode] = useState<Record<string, { kategori?: string; inaCbg?: string }>>({});
  const [loading, setLoading] = useState(isPersisted);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyAggregate = useCallback((dto: DiagnosaDTO) => {
    setIcd10List(dto.items.map(dtoToIcd10));
    setIcd9List(dto.prosedur.map(dtoToIcd9));
    setMetaByKode((prev) => {
      const next = { ...prev };
      for (const d of dto.items) next[d.kodeIcd10] = { kategori: d.kategori, inaCbg: d.inaCbg };
      return next;
    });
  }, []);

  // Mode DB → muat agregat saat mount. Mock → state awal dari initialDiagnosa.
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    setLoading(true);
    (async () => {
      try {
        applyAggregate(await getDiagnosa(kunjunganId!, ac.signal));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError("Gagal memuat diagnosa dari rekam medis");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [kunjunganId, isPersisted, applyAggregate]);

  const reload = useCallback(async () => {
    if (!isPersisted) return;
    try {
      applyAggregate(await getDiagnosa(kunjunganId!));
    } catch {
      /* pertahankan state terakhir */
    }
  }, [kunjunganId, isPersisted, applyAggregate]);

  // Mutasi diagnosa yang mengembalikan agregat (add/update) — authoritative; promosi
  // Utama menggeser baris lain → ganti seluruh list dari respons server.
  const runAggregate = async (p: Promise<DiagnosaDTO>) => {
    setBusy(true);
    setError(null);
    try {
      applyAggregate(await p);
      // Beri tahu header (gate "Selesaikan") + turunan lain bahwa diagnosa berubah.
      if (kunjunganId) emitRecordChange(kunjunganId, "diagnosa");
    } catch {
      setError("Gagal menyimpan perubahan diagnosa");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  // Mutasi optimistik (delete/add prosedur) — perbarui lokal dulu, rekonsiliasi bila gagal.
  const runOptimistic = (apiCall: Promise<unknown>, gagal: string) => {
    setBusy(true);
    setError(null);
    apiCall
      .catch(() => {
        setError(gagal);
        return reload();
      })
      .finally(() => setBusy(false));
  };

  const hasUtama = icd10List.some((d) => d.tipe === "Utama");
  const utama = icd10List.find((d) => d.tipe === "Utama") ?? null;
  const nonUtama = useMemo(
    () =>
      [...icd10List]
        .filter((d) => d.tipe !== "Utama")
        .sort((a, b) => TIPE_ORDER.indexOf(a.tipe) - TIPE_ORDER.indexOf(b.tipe)),
    [icd10List],
  );

  const inaCbg = useMemo(() => {
    if (!utama) return null;
    const meta = metaByKode[utama.kodeIcd10];
    if (meta?.inaCbg) return meta.inaCbg;
    const lokal = ICD10.find((e) => e.kode === utama.kodeIcd10);
    const kategori = meta?.kategori ?? lokal?.kategori;
    return kategori ? (INA_CBG_MAP[kategori] ?? kategori) : null;
  }, [utama, metaByKode]);

  // ── Handlers ──

  const rememberMeta = (entry: IcdPick) =>
    setMetaByKode((prev) => ({
      ...prev,
      [entry.kode]: { kategori: entry.kategori, inaCbg: entry.inaCbg },
    }));

  const addIcd10 = (entry: IcdPick, tipe: DiagnosaTipe, status: DiagnosaStatus, alasan: string, analisa: string) => {
    if (icd10List.some((d) => d.kodeIcd10 === entry.kode)) {
      setSelected10(null);
      return;
    }
    rememberMeta(entry);
    setSelected10(null);

    if (isPersisted) {
      void runAggregate(
        apiAddDiagnosa(kunjunganId!, {
          kodeIcd10: entry.kode,
          namaDiagnosis: entry.nama,
          tipe,
          status,
          alasan: alasan.trim() || undefined,
          analisa: analisa.trim() || undefined,
          kategori: entry.kategori || undefined,
          inaCbg: entry.inaCbg,
        }),
      );
      return;
    }

    if (tipe === "Utama" && hasUtama) {
      setIcd10List((prev) => prev.map((d) => (d.tipe === "Utama" ? { ...d, tipe: "Sekunder" } : d)));
    }
    setIcd10List((prev) => [
      ...prev,
      {
        id: `d-${Date.now()}`,
        kodeIcd10: entry.kode,
        namaDiagnosis: entry.nama,
        tipe,
        status,
        alasan: alasan.trim() || undefined,
        analisa: analisa.trim() || undefined,
      },
    ]);
  };

  const removeIcd10 = (id: string) => {
    if (isPersisted) {
      setIcd10List((prev) => prev.filter((d) => d.id !== id));
      runOptimistic(apiDeleteDiagnosa(kunjunganId!, id), "Gagal menghapus diagnosa");
      emitRecordChange(kunjunganId!, "diagnosa"); // header re-evaluasi gate "Selesaikan"
      return;
    }
    setIcd10List((prev) => prev.filter((d) => d.id !== id));
  };

  const changeTipe = (id: string, tipe: DiagnosaTipe) => {
    if (isPersisted) {
      void runAggregate(apiUpdateDiagnosa(kunjunganId!, id, { tipe }));
      return;
    }
    if (tipe === "Utama") {
      setIcd10List((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, tipe: "Utama" } : d.tipe === "Utama" ? { ...d, tipe: "Sekunder" } : d,
        ),
      );
    } else {
      setIcd10List((prev) => prev.map((d) => (d.id === id ? { ...d, tipe } : d)));
    }
  };

  const cycleStatus = (id: string) => {
    const cur = icd10List.find((d) => d.id === id)?.status ?? "Pasti";
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(cur) + 1) % STATUS_ORDER.length];
    if (isPersisted) {
      void runAggregate(apiUpdateDiagnosa(kunjunganId!, id, { status: next }));
      return;
    }
    setIcd10List((prev) => prev.map((d) => (d.id === id ? { ...d, status: next } : d)));
  };

  const addIcd9 = (entry: IcdPick, catatan: string) => {
    if (icd9List.some((e) => e.kode === entry.kode)) {
      setSelected9(null);
      return;
    }
    setSelected9(null);

    if (isPersisted) {
      setBusy(true);
      setError(null);
      apiAddProsedur(kunjunganId!, {
        kode: entry.kode,
        nama: entry.nama,
        kategori: entry.kategori,
        catatan: catatan.trim() || undefined,
      })
        .then((p) => setIcd9List((prev) => [...prev, dtoToIcd9(p)]))
        .catch(() => {
          setError("Gagal menambah prosedur");
          return reload();
        })
        .finally(() => setBusy(false));
      return;
    }

    setIcd9List((prev) => [
      ...prev,
      { id: `p-${Date.now()}`, kode: entry.kode, nama: entry.nama, kategori: entry.kategori, catatan },
    ]);
  };

  const removeIcd9 = (id: string) => {
    if (isPersisted) {
      setIcd9List((prev) => prev.filter((e) => e.id !== id));
      runOptimistic(apiDeleteProsedur(kunjunganId!, id), "Gagal menghapus prosedur");
      return;
    }
    setIcd9List((prev) => prev.filter((e) => e.id !== id));
  };

  const quickPicks = useMemo(
    () => QUICK_PICKS_ICD10.map((k) => ICD10.find((e) => e.kode === k)).filter((e): e is NonNullable<typeof e> => !!e),
    [],
  );

  // ── Render ──

  return (
    <div className="flex flex-col gap-3">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
          <Stethoscope size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Diagnosa & Prosedur</p>
          <p className="text-[10px] text-slate-400">
            Koding ICD-10 (diagnosis) & ICD-9-CM (prosedur) — hulu klaim INA-CBG/iDRG
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {busy && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
              <Loader2 size={10} className="animate-spin" /> Menyimpan…
            </span>
          )}
          {hasUtama ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 size={10} /> Utama ditegakkan
            </span>
          ) : icd10List.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
              <AlertTriangle size={10} /> Belum ada Utama
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Banner error mutasi DB ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2"
          >
            <AlertTriangle size={12} className="shrink-0 text-rose-500" />
            <p className="text-[11px] font-medium text-rose-700">{error}</p>
            <button
              onClick={() => setError(null)}
              aria-label="Tutup"
              className="ml-auto text-rose-300 transition hover:text-rose-500"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Segmented switcher ── */}
      <div className="flex self-start rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {(["ICD-10", "ICD-9"] as IcdVersion[]).map((v) => {
          const act = activeIcd === v;
          const Icon = v === "ICD-10" ? BookOpen : Activity;
          const count = v === "ICD-10" ? icd10List.length : icd9List.length;
          return (
            <button
              key={v}
              onClick={() => setActiveIcd(v)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-150",
                act
                  ? cn(
                      "bg-white shadow-sm ring-1",
                      v === "ICD-10" ? "text-sky-700 ring-sky-100" : "text-teal-700 ring-teal-100",
                    )
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Icon size={12} className={act ? (v === "ICD-10" ? "text-sky-500" : "text-teal-500") : "text-slate-400"} />
              {v === "ICD-10" ? "Diagnosa ICD-10" : "Prosedur ICD-9"}
              {count > 0 && (
                <span
                  className={cn(
                    "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-bold text-white",
                    act ? (v === "ICD-10" ? "bg-sky-600" : "bg-teal-600") : "bg-slate-400",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Workspace ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
        {/* Kiri: alur search-first + daftar */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeIcd}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-3"
            >
              {activeIcd === "ICD-10" ? (
                <>
                  {/* Search / kartu konfigurasi */}
                  <AnimatePresence mode="wait" initial={false}>
                    {selected10 ? (
                      <ConfigCard10
                        key="cfg10"
                        entry={selected10}
                        hasUtama={hasUtama}
                        onAdd={(t, s, al, an) => addIcd10(selected10, t, s, al, an)}
                        onCancel={() => setSelected10(null)}
                      />
                    ) : (
                      <motion.div key="search10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                        <IcdSearch
                          jenis="ICD-10"
                          placeholder="Cari kode / nama diagnosis ICD-10… (min. 2 karakter)"
                          accent={SKY}
                          fallback={ICD10}
                          onSelect={setSelected10}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Daftar */}
                  {loading ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-10 text-xs text-slate-500 shadow-xs">
                      <Loader2 size={14} className="animate-spin" /> Memuat diagnosa…
                    </div>
                  ) : icd10List.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-slate-200">
                        <BookOpen size={20} className="text-sky-300" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Belum ada diagnosis</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          Cari kode di atas, atau pilih cepat yang sering dipakai:
                        </p>
                      </div>
                      <div className="flex max-w-md flex-wrap justify-center gap-1.5 px-4">
                        {quickPicks.map((e) => (
                          <button
                            key={e.kode}
                            onClick={() => setSelected10(e)}
                            className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 shadow-xs transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 active:scale-[0.97]"
                          >
                            <Sparkles size={9} className="text-sky-400" />
                            <span className="font-mono font-bold text-sky-600">{e.kode}</span>
                            <span className="max-w-36 truncate">{e.nama}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {/* Hero Utama */}
                      <AnimatePresence initial={false}>
                        {utama && (
                          <UtamaCard
                            key={utama.id}
                            diag={utama}
                            onRemove={() => removeIcd10(utama.id)}
                            onCycleStatus={() => cycleStatus(utama.id)}
                          />
                        )}
                      </AnimatePresence>

                      {!utama && (
                        <div className="flex items-start gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-3.5 py-2.5">
                          <Crown size={13} className="mt-0.5 shrink-0 text-amber-400" />
                          <p className="text-[11px] leading-snug text-amber-700">
                            <strong>Diagnosis Utama belum ditegakkan.</strong> Arahkan kursor ke baris di
                            bawah lalu klik ikon mahkota, atau pilih tipe <em>Utama</em> saat menambah.
                          </p>
                        </div>
                      )}

                      {/* Daftar non-utama */}
                      {nonUtama.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
                          <ul>
                            <AnimatePresence initial={false}>
                              {nonUtama.map((diag) => (
                                <DiagRow
                                  key={diag.id}
                                  diag={diag}
                                  onRemove={() => removeIcd10(diag.id)}
                                  onCycleStatus={() => cycleStatus(diag.id)}
                                  onPromote={() => changeTipe(diag.id, "Utama")}
                                  onChangeTipe={(t) => changeTipe(diag.id, t)}
                                />
                              ))}
                            </AnimatePresence>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <AnimatePresence mode="wait" initial={false}>
                    {selected9 ? (
                      <ConfigCard9
                        key="cfg9"
                        entry={selected9}
                        onAdd={(cat) => addIcd9(selected9, cat)}
                        onCancel={() => setSelected9(null)}
                      />
                    ) : (
                      <motion.div key="search9" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                        <IcdSearch
                          jenis="ICD-9"
                          placeholder="Cari kode / nama prosedur ICD-9-CM… (min. 2 karakter)"
                          accent={TEAL}
                          fallback={ICD9}
                          onSelect={setSelected9}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {loading ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-10 text-xs text-slate-500 shadow-xs">
                      <Loader2 size={14} className="animate-spin" /> Memuat prosedur…
                    </div>
                  ) : icd9List.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-slate-200">
                        <Activity size={20} className="text-teal-300" />
                      </div>
                      <p className="text-xs font-semibold text-slate-500">Belum ada prosedur ICD-9</p>
                      <p className="text-[10px] text-slate-400">
                        Cari kode prosedur/tindakan di atas untuk menambah
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
                      <ul>
                        <AnimatePresence initial={false}>
                          {icd9List.map((entry) => (
                            <Icd9Row key={entry.id} entry={entry} onRemove={() => removeIcd9(entry.id)} />
                          ))}
                        </AnimatePresence>
                      </ul>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Kanan: ringkasan koding */}
        <div className="w-full shrink-0 lg:w-80">
          <RingkasanPanel icd10List={icd10List} icd9Count={icd9List.length} inaCbg={inaCbg} />
        </div>
      </div>

      {/* ── Catatan Diagnosa Medis Sebelumnya (lintas kunjungan, read-only) ── */}
      <DiagnosaSebelumnya kunjunganId={kunjunganId} />
    </div>
  );
}
