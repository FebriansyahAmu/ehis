"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen, ChevronDown, CheckCircle2, Plus, Trash2, Clock, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type EdukasiItem, type EdukasiLog,
  type MetodeEdukasi, type PenerimaEdukasi, type PemahamanEdukasi,
  KATEGORI_COLOR, PEMAHAMAN_CONFIG, PROFESI_COLOR, PROFESI_EDUKASI_OPTIONS,
  getLatestLog,
} from "./dischargeShared";

// ── Constants ─────────────────────────────────────────────

const METODE_OPTIONS: MetodeEdukasi[]     = ["Lisan", "Demonstrasi", "Leaflet", "Video"];
const PENERIMA_OPTIONS: PenerimaEdukasi[] = ["Pasien", "Keluarga", "Keduanya"];
const PEMAHAMAN_OPTIONS: PemahamanEdukasi[] = ["Paham", "Perlu Ulang", "Tidak Paham"];

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── AddLogForm ────────────────────────────────────────────

interface LogDraft {
  tanggal:   string;
  petugas:   string;
  profesi:   string;
  metode:    string;
  penerima:  string;
  pemahaman: string;
  catatan:   string;
}

function emptyDraft(): LogDraft {
  return {
    tanggal: todayISO(), petugas: "", profesi: "",
    metode: "", penerima: "", pemahaman: "", catatan: "",
  };
}

function AddLogForm({
  onSave, onCancel,
}: { onSave: (log: Omit<EdukasiLog, "id">) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<LogDraft>(emptyDraft);

  function set<K extends keyof LogDraft>(key: K, val: string) {
    setDraft(d => ({ ...d, [key]: val }));
  }

  const canSave =
    draft.petugas.trim() !== "" && draft.profesi !== "" &&
    draft.metode !== "" && draft.penerima !== "" && draft.pemahaman !== "";

  function handleSave() {
    if (!canSave) return;
    onSave({
      tanggal:   draft.tanggal,
      petugas:   draft.petugas.trim(),
      profesi:   draft.profesi   as EdukasiLog["profesi"],
      metode:    draft.metode    as MetodeEdukasi,
      penerima:  draft.penerima  as PenerimaEdukasi,
      pemahaman: draft.pemahaman as PemahamanEdukasi,
      catatan:   draft.catatan.trim(),
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="mt-2 rounded-xl border border-sky-200 bg-sky-50/60 p-3.5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600">Tambah Log Edukasi</p>

        <div className="grid gap-2.5 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">Tanggal</label>
            <input
              type="date" value={draft.tanggal}
              onChange={e => set("tanggal", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">
              Nama Petugas <span className="text-red-400">*</span>
            </label>
            <input
              value={draft.petugas} onChange={e => set("petugas", e.target.value)}
              placeholder="Ns. / dr. / apt. ..."
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">
              Profesi <span className="text-red-400">*</span>
            </label>
            <select
              value={draft.profesi} onChange={e => set("profesi", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
            >
              <option value="">Pilih profesi...</option>
              {PROFESI_EDUKASI_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Metode */}
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold text-slate-500">
              Metode <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {METODE_OPTIONS.map(m => (
                <button key={m} type="button" onClick={() => set("metode", draft.metode === m ? "" : m)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[10px] font-medium transition-all",
                    draft.metode === m
                      ? "border-sky-300 bg-sky-100 text-sky-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                  )}
                >{m}</button>
              ))}
            </div>
          </div>
          {/* Penerima */}
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold text-slate-500">
              Penerima <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {PENERIMA_OPTIONS.map(p => (
                <button key={p} type="button" onClick={() => set("penerima", draft.penerima === p ? "" : p)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[10px] font-medium transition-all",
                    draft.penerima === p
                      ? "border-sky-300 bg-sky-100 text-sky-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                  )}
                >{p}</button>
              ))}
            </div>
          </div>
          {/* Evaluasi */}
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold text-slate-500">
              Evaluasi <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {PEMAHAMAN_OPTIONS.map(p => (
                <button key={p} type="button" onClick={() => set("pemahaman", draft.pemahaman === p ? "" : p)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[10px] font-medium transition-all",
                    draft.pemahaman === p
                      ? `${PEMAHAMAN_CONFIG[p]} border-transparent`
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                  )}
                >{p}</button>
              ))}
            </div>
          </div>
        </div>

        <input
          value={draft.catatan} onChange={e => set("catatan", e.target.value)}
          placeholder="Catatan tambahan (opsional)..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
        />

        <div className="flex items-center gap-2">
          <button
            type="button" onClick={handleSave} disabled={!canSave}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
              canSave
                ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95"
                : "cursor-not-allowed bg-slate-200 text-slate-400",
            )}
          >
            Simpan Log
          </button>
          <button
            type="button" onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
          >
            Batal
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── LogEntry ──────────────────────────────────────────────

function LogEntry({ log, onDelete }: { log: EdukasiLog; onDelete: () => void }) {
  return (
    <div className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3">
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <div className="h-2 w-2 rounded-full bg-sky-400" />
        <div className="w-px flex-1 bg-slate-100" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <span className="text-[11px] font-semibold text-slate-700">{fmtDate(log.tanggal)}</span>
          <span className="text-[10px] text-slate-400">·</span>
          <span className="text-[11px] text-slate-600">{log.petugas}</span>
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", PROFESI_COLOR[log.profesi])}>
            {log.profesi}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] text-slate-500">
            {log.metode}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] text-slate-500">
            {log.penerima}
          </span>
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", PEMAHAMAN_CONFIG[log.pemahaman])}>
            {log.pemahaman}
          </span>
        </div>
        {log.catatan && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 italic">{log.catatan}</p>
        )}
      </div>
      <button
        type="button" onClick={onDelete}
        className="shrink-0 rounded-lg p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-400"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

// ── EdukasiRow ────────────────────────────────────────────

function EdukasiRow({
  item, onUpdate,
}: { item: EdukasiItem; onUpdate: (u: EdukasiItem) => void }) {
  const [expanded, setExpanded] = useState(item.logs.length > 0);
  const [showForm, setShowForm] = useState(false);
  const latest        = getLatestLog(item);
  const covered       = item.logs.length > 0;
  const needsFollowUp = latest?.pemahaman === "Perlu Ulang" || latest?.pemahaman === "Tidak Paham";

  function addLog(partial: Omit<EdukasiLog, "id">) {
    const newLog: EdukasiLog = { id: `log-${Date.now()}`, ...partial };
    onUpdate({ ...item, logs: [newLog, ...item.logs] });
    setShowForm(false);
    setExpanded(true);
  }

  function deleteLog(id: string) {
    onUpdate({ ...item, logs: item.logs.filter(l => l.id !== id) });
  }

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border transition-all duration-200",
      covered
        ? needsFollowUp
          ? "border-amber-200 bg-amber-50/30"
          : "border-emerald-200 bg-emerald-50/20"
        : "border-slate-200 bg-white",
    )}>
      {/* Row header — full row clickable */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-black/2"
      >
        {/* Status indicator */}
        <div className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          covered
            ? needsFollowUp ? "border-amber-400 bg-amber-400" : "border-emerald-500 bg-emerald-500"
            : "border-slate-300 bg-white",
        )}>
          {covered && !needsFollowUp && <CheckCircle2 size={11} className="text-white" />}
          {covered && needsFollowUp  && <AlertTriangle size={10} className="text-white" />}
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-700 truncate">{item.topik}</span>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide shrink-0",
            KATEGORI_COLOR[item.kategori] ?? "bg-slate-100 text-slate-500",
          )}>
            {item.kategori}
          </span>
          {latest && (
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[9px] font-semibold shrink-0",
              PEMAHAMAN_CONFIG[latest.pemahaman],
            )}>
              {latest.pemahaman}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {item.logs.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {item.logs.length}×
            </span>
          )}
          <ChevronDown
            size={14}
            className={cn("text-slate-400 transition-transform duration-200", expanded && "rotate-180")}
          />
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-2">
              <AnimatePresence mode="wait">
                {showForm ? (
                  <AddLogForm key="form" onSave={addLog} onCancel={() => setShowForm(false)} />
                ) : (
                  <motion.button
                    key="btn"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50 py-2 text-xs font-semibold text-sky-600 transition hover:bg-sky-100 hover:border-sky-400"
                  >
                    <Plus size={13} /> Tambah Log Edukasi
                  </motion.button>
                )}
              </AnimatePresence>

              {item.logs.length > 0 ? (
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <Clock size={9} /> Riwayat Pemberian
                  </p>
                  {item.logs.map(log => (
                    <LogEntry key={log.id} log={log} onDelete={() => deleteLog(log.id)} />
                  ))}
                </div>
              ) : (
                !showForm && (
                  <p className="py-2 text-center text-[11px] text-slate-400">
                    Belum ada log — klik tombol di atas untuk mencatat pemberian edukasi
                  </p>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

type Props = {
  items:    EdukasiItem[];
  onChange: (items: EdukasiItem[]) => void;
};

export default function StepEdukasi({ items, onChange }: Props) {
  const covered       = items.filter(i => i.logs.length > 0).length;
  const pct           = items.length > 0 ? Math.round((covered / items.length) * 100) : 0;
  const circumference = 2 * Math.PI * 15;

  const pahamCount      = items.filter(i => getLatestLog(i)?.pemahaman === "Paham").length;
  const perluUlangCount = items.filter(i => getLatestLog(i)?.pemahaman === "Perlu Ulang").length;
  const tidakPahamCount = items.filter(i => getLatestLog(i)?.pemahaman === "Tidak Paham").length;

  const kategoriMap: Record<string, { total: number; covered: number }> = {};
  for (const item of items) {
    if (!kategoriMap[item.kategori]) kategoriMap[item.kategori] = { total: 0, covered: 0 };
    kategoriMap[item.kategori].total++;
    if (item.logs.length > 0) kategoriMap[item.kategori].covered++;
  }

  const ringColor =
    tidakPahamCount > 0 ? "#f87171" :
    perluUlangCount > 0 ? "#fbbf24" :
    "#0ea5e9";

  function updateItem(updated: EdukasiItem) {
    onChange(items.map(i => i.id === updated.id ? updated : i));
  }

  return (
    <div className="flex flex-col gap-4 xl:flex-row">

      {/* ── Left: topic list ── */}
      <div className="min-w-0 flex-1 space-y-2">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.025, duration: 0.15 }}
          >
            <EdukasiRow item={item} onUpdate={updateItem} />
          </motion.div>
        ))}
        <p className="pt-2 text-center text-[11px] text-slate-400">
          SNARS HPK 2 · Edukasi diberikan bertahap setiap hari — catat setiap sesi secara terpisah
        </p>
      </div>

      {/* ── Right: progress summary ── */}
      <div className="w-full shrink-0 space-y-3 xl:w-64">

        {/* Donut */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Progress Edukasi</p>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                <motion.circle
                  cx="18" cy="18" r="15"
                  fill="none" stroke={ringColor} strokeWidth="3.5" strokeLinecap="round"
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray: `${(pct / 100) * circumference} ${circumference}` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-base font-bold text-slate-800">{pct}%</p>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {covered}<span className="text-sm font-normal text-slate-400">/{items.length}</span>
              </p>
              <p className="text-xs text-slate-500">topik dikunjungi</p>
              {covered > 0 && covered < items.length && (
                <p className="mt-0.5 text-[11px] text-sky-600">{items.length - covered} belum dimulai</p>
              )}
            </div>
          </div>

          {covered > 0 && (
            <div className="mt-4 space-y-2">
              {[
                { label: "Paham",       count: pahamCount,      dot: "bg-emerald-500" },
                { label: "Perlu Ulang", count: perluUlangCount, dot: "bg-amber-400"   },
                { label: "Tidak Paham", count: tidakPahamCount, dot: "bg-red-400"     },
              ].map(({ label, count, dot }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 shrink-0 rounded-full", dot)} />
                  <span className="flex-1 text-[11px] text-slate-600">{label}</span>
                  <span className={cn("text-[11px] font-bold", count === 0 ? "text-slate-300" : "text-slate-700")}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-kategori */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Per Kategori</p>
          <div className="space-y-3">
            {Object.entries(kategoriMap).map(([kat, { total, covered: kov }]) => (
              <div key={kat}>
                <div className="mb-1 flex items-center justify-between">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                    KATEGORI_COLOR[kat] ?? "bg-slate-100 text-slate-500",
                  )}>{kat}</span>
                  <span className="text-[11px] font-semibold text-slate-600">{kov}/{total}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-sky-400"
                    initial={{ width: 0 }}
                    animate={{ width: kov === 0 ? "0%" : `${(kov / total) * 100}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SNARS note */}
        <div className="rounded-xl border border-sky-100 bg-sky-50 p-3.5">
          <div className="flex items-start gap-2">
            <BookOpen size={13} className="mt-0.5 shrink-0 text-sky-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-sky-700">SNARS HPK 2</p>
              <p className="mt-1 text-[11px] leading-relaxed text-sky-700">
                Edukasi diberikan bertahap sejak hari pertama. Setiap sesi dicatat lengkap dengan evaluasi pemahaman.
              </p>
            </div>
          </div>
        </div>

        {pct === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3"
          >
            <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
            <p className="text-xs font-semibold text-emerald-700">Semua topik telah dikunjungi</p>
          </motion.div>
        )}

      </div>
    </div>
  );
}
