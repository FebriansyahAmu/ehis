"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Edit2, Trash2, Copy, ShieldCheck, Plus,
  User, Clock, CheckCircle2, AlertTriangle, X, Save,
  Calendar, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AsuhanKeperawatanEntry, EvaluasiShift, StatusLuaran, ShiftType } from "@/lib/data";
import { STATUS_LUARAN_CONFIG, SHIFT_CONFIG } from "@/components/shared/medical-records/keperawatanShared";

// ── Evaluasi form (inline) ─────────────────────────────────

const SHIFT_OPTIONS: ShiftType[] = ["Pagi", "Siang", "Malam"];

interface EvaluasiFormState {
  tanggal:      string;
  jam:          string;
  shift:        ShiftType;
  subjektif:    string;
  objektif:     string;
  statusLuaran: StatusLuaran;
  perawat:      string;
}

function emptyEval(): EvaluasiFormState {
  const now = new Date();
  const h = now.getHours();
  const defaultShift: ShiftType = h >= 6 && h < 14 ? "Pagi" : h >= 14 && h < 21 ? "Siang" : "Malam";
  return {
    tanggal:      now.toISOString().split("T")[0],
    jam:          now.toTimeString().slice(0, 5),
    shift:        defaultShift,
    subjektif:    "",
    objektif:     "",
    statusLuaran: "Dipantau",
    perawat:      "",
  };
}

function EvaluasiForm({
  currentStatus, onSave, onCancel,
}: { currentStatus: StatusLuaran; onSave: (e: EvaluasiFormState) => void; onCancel: () => void }) {
  const [f, setF] = useState<EvaluasiFormState>(() => ({ ...emptyEval(), statusLuaran: currentStatus }));
  const set = <K extends keyof EvaluasiFormState>(k: K, v: EvaluasiFormState[K]) => setF(p => ({ ...p, [k]: v }));
  const canSave = f.objektif.trim() && f.perawat.trim();

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="mx-3.5 mb-3.5 rounded-xl border border-sky-200 bg-sky-50/60 p-3.5">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-sky-700">
          <Plus size={12} /> Tambah Evaluasi Shift
        </p>

        {/* Row 1: tanggal, jam, shift */}
        <div className="mb-2.5 grid grid-cols-3 gap-2">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Tanggal</p>
            <input type="date" value={f.tanggal} onChange={e => set("tanggal", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Jam</p>
            <input type="time" value={f.jam} onChange={e => set("jam", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Shift</p>
            <select value={f.shift} onChange={e => set("shift", e.target.value as ShiftType)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100">
              {SHIFT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* S/O */}
        <div className="mb-2.5 grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Subjektif</p>
            <textarea rows={2} value={f.subjektif} onChange={e => set("subjektif", e.target.value)}
              placeholder="Keluhan pasien / tidak dapat dikaji..."
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Objektif <span className="normal-case text-rose-400">*</span>
            </p>
            <textarea rows={2} value={f.objektif} onChange={e => set("objektif", e.target.value)}
              placeholder="Temuan klinis, hasil pemeriksaan..."
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100" />
          </div>
        </div>

        {/* Status Luaran */}
        <div className="mb-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Status Luaran</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(STATUS_LUARAN_CONFIG) as StatusLuaran[]).map(s => {
              const cfg = STATUS_LUARAN_CONFIG[s];
              const active = f.statusLuaran === s;
              return (
                <button key={s} type="button" onClick={() => set("statusLuaran", s)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all active:scale-95",
                    active ? cfg.cls : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                  )}>
                  {cfg.icon} {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Perawat */}
        <div className="mb-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Perawat <span className="normal-case text-rose-400">*</span>
          </p>
          <input value={f.perawat} onChange={e => set("perawat", e.target.value)}
            placeholder="Nama perawat evaluasi..."
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100" />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel}
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50">
            <X size={12} /> Batal
          </button>
          <button type="button" onClick={() => canSave && onSave(f)} disabled={!canSave}
            className="flex cursor-pointer items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:opacity-40">
            <Save size={12} /> Simpan Evaluasi
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Evaluasi timeline row ──────────────────────────────────

function EvaluasiRow({ ev }: { ev: EvaluasiShift }) {
  const shiftCfg  = SHIFT_CONFIG[ev.shift];
  const statusCfg = STATUS_LUARAN_CONFIG[ev.statusLuaran];
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white", statusCfg.dotCls)} />
        <div className="mt-1 w-px flex-1 bg-slate-100" />
      </div>
      <div className="pb-3">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", shiftCfg.badgeCls)}>
            {ev.shift}
          </span>
          <span className="text-[11px] text-slate-500">
            <Calendar size={10} className="mr-0.5 inline" />
            {ev.tanggal} · {ev.jam}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", statusCfg.cls)}>
            {statusCfg.icon} {statusCfg.label}
          </span>
        </div>
        {ev.subjektif && (
          <p className="mb-0.5 text-xs text-slate-700">
            <span className="mr-1 font-semibold text-sky-600">S:</span>{ev.subjektif}
          </p>
        )}
        {ev.objektif && (
          <p className="text-xs text-slate-700">
            <span className="mr-1 font-semibold text-violet-600">O:</span>{ev.objektif}
          </p>
        )}
        <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
          <User size={9} /> {ev.perawat}
        </p>
      </div>
    </div>
  );
}

// ── Main Card ──────────────────────────────────────────────

interface Props {
  entry:        AsuhanKeperawatanEntry;
  index:        number;
  isEditing:    boolean;
  isCopySource: boolean;
  onEdit:       () => void;
  onDelete:     () => void;
  onVerify:     (name: string) => void;
  onCopyToForm: () => void;
  onAddEval:    (ev: EvaluasiShift) => void;
}

export default function AsuhanCard({
  entry, index, isEditing, isCopySource,
  onEdit, onDelete, onVerify, onCopyToForm, onAddEval,
}: Props) {
  const [expanded,      setExpanded]      = useState(false);
  const [evalOpen,      setEvalOpen]      = useState(false);
  const [verifyOpen,    setVerifyOpen]    = useState(false);
  const [verifier,      setVerifier]      = useState("");
  const [evalHistOpen,  setEvalHistOpen]  = useState(false);

  const statusCfg = STATUS_LUARAN_CONFIG[entry.statusLuaran];
  const evalCount = entry.evaluasi.length;

  const ringClass = isEditing
    ? "border-indigo-300 shadow-md shadow-indigo-100/60 ring-2 ring-indigo-200/70"
    : isCopySource
    ? "border-sky-300 shadow-md shadow-sky-100/60 ring-2 ring-sky-200/70"
    : "border-slate-200 hover:border-slate-300 hover:shadow-sm";

  function confirmVerify() {
    if (!verifier.trim()) return;
    onVerify(verifier.trim());
    setVerifyOpen(false);
    setVerifier("");
  }

  function handleAddEval(data: EvaluasiFormState) {
    const ev: EvaluasiShift = { id: `eval-${Date.now()}`, ...data };
    onAddEval(ev);
    setEvalOpen(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.16 }}
      className={cn("rounded-xl border bg-white transition-all duration-200", ringClass)}
    >
      {/* ── Card header ── */}
      <div className="flex items-start gap-2.5 p-3.5">
        <div className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
          isEditing ? "bg-indigo-600 text-white" : isCopySource ? "bg-sky-500 text-white" : "bg-indigo-100 text-indigo-700",
        )}>
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          {entry.kodeSdki && (
            <span className="mb-1 inline-block rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">
              {entry.kodeSdki}
            </span>
          )}
          <p className="text-sm font-semibold leading-snug text-slate-800 line-clamp-2">{entry.diagnosa || "—"}</p>
          {entry.penyebab && (
            <p className="mt-0.5 text-xs leading-snug text-slate-500 line-clamp-1">
              <span className="font-medium">Penyebab:</span> {entry.penyebab}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", statusCfg.cls)}>
              {statusCfg.icon} {statusCfg.label}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <User size={10} />{entry.perawat}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock size={10} />{entry.tanggalInput}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {entry.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 size={10} /> Verified · {entry.verifiedBy}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                <AlertTriangle size={10} /> Belum Diverifikasi
              </span>
            )}
            {evalCount > 0 && (
              <button type="button" onClick={() => setEvalHistOpen(p => !p)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-600 transition hover:bg-sky-100">
                <MessageSquare size={10} /> {evalCount} evaluasi
              </button>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-0.5">
          <button type="button" onClick={onEdit} title="Edit"
            className={cn("cursor-pointer rounded-md p-1.5 transition",
              isEditing ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-600")}>
            <Edit2 size={13} />
          </button>
          <button type="button" onClick={onCopyToForm} title="Salin ke formulir"
            className={cn("cursor-pointer rounded-md p-1.5 transition",
              isCopySource ? "bg-sky-100 text-sky-600" : "text-slate-400 hover:bg-sky-50 hover:text-sky-500")}>
            <Copy size={13} />
          </button>
          <button type="button" onClick={onDelete} title="Hapus"
            className="cursor-pointer rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500">
            <Trash2 size={13} />
          </button>
          {!entry.verified && (
            <button type="button" onClick={() => setVerifyOpen(p => !p)} title="Verifikasi"
              className={cn("cursor-pointer rounded-md p-1.5 transition",
                verifyOpen ? "bg-emerald-100 text-emerald-700" : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600")}>
              <ShieldCheck size={13} />
            </button>
          )}
          <button type="button" onClick={() => setExpanded(p => !p)}
            className="cursor-pointer rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100">
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown size={13} />
            </motion.div>
          </button>
        </div>
      </div>

      {/* ── + Evaluasi Shift button ── */}
      <div className="mx-3.5 mb-2.5">
        <button type="button" onClick={() => { setEvalOpen(p => !p); setEvalHistOpen(false); }}
          className={cn(
            "flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-semibold transition-all",
            evalOpen
              ? "border-sky-300 bg-sky-600 text-white"
              : "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
          )}>
          <Plus size={12} /> Evaluasi Shift
        </button>
      </div>

      {/* ── Inline Evaluasi Form ── */}
      <AnimatePresence>
        {evalOpen && (
          <EvaluasiForm
            currentStatus={entry.statusLuaran}
            onSave={handleAddEval}
            onCancel={() => setEvalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Inline Verify ── */}
      <AnimatePresence>
        {verifyOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mx-3.5 mb-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-emerald-700">Nama Verifikator</p>
              <div className="flex gap-2">
                <input
                  value={verifier}
                  onChange={e => setVerifier(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && confirmVerify()}
                  placeholder="Supervisor / kepala ruangan..."
                  autoFocus
                  className="flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                />
                <button type="button" onClick={confirmVerify} disabled={!verifier.trim()}
                  className="flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40">
                  <ShieldCheck size={12} /> OK
                </button>
                <button type="button" onClick={() => { setVerifyOpen(false); setVerifier(""); }}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 text-slate-400 transition hover:bg-slate-50">
                  <X size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Evaluasi History ── */}
      <AnimatePresence>
        {evalHistOpen && entry.evaluasi.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mx-3.5 mb-3 rounded-xl border border-sky-100 bg-sky-50/40 p-3">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-sky-700">
                Riwayat Evaluasi Shift
              </p>
              {entry.evaluasi.map((ev) => (
                <EvaluasiRow key={ev.id} ev={ev} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Expanded Detail ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2.5 border-t border-slate-100 p-3.5">

              {(entry.dataMayor.subjektif || entry.dataMayor.objektif) && (
                <div className="grid grid-cols-2 gap-2">
                  {(entry.dataMayor.subjektif || entry.dataMayor.objektif) && (
                    <div className="rounded-lg bg-indigo-50/60 p-2.5">
                      <p className="mb-1.5 text-[11px] font-bold uppercase text-indigo-600">Data Mayor</p>
                      {entry.dataMayor.subjektif && <p className="text-xs leading-relaxed text-slate-700"><span className="font-semibold">S:</span> {entry.dataMayor.subjektif}</p>}
                      {entry.dataMayor.objektif  && <p className="mt-0.5 text-xs leading-relaxed text-slate-700"><span className="font-semibold">O:</span> {entry.dataMayor.objektif}</p>}
                    </div>
                  )}
                  {(entry.dataMinor.subjektif || entry.dataMinor.objektif) && (
                    <div className="rounded-lg bg-slate-50 p-2.5">
                      <p className="mb-1.5 text-[11px] font-bold uppercase text-slate-500">Data Minor</p>
                      {entry.dataMinor.subjektif && <p className="text-xs leading-relaxed text-slate-700"><span className="font-semibold">S:</span> {entry.dataMinor.subjektif}</p>}
                      {entry.dataMinor.objektif  && <p className="mt-0.5 text-xs leading-relaxed text-slate-700"><span className="font-semibold">O:</span> {entry.dataMinor.objektif}</p>}
                    </div>
                  )}
                </div>
              )}

              {entry.faktorResiko && (
                <div className="rounded-lg bg-amber-50/60 p-2.5">
                  <p className="mb-1 text-[11px] font-bold uppercase text-amber-600">Faktor Risiko</p>
                  <p className="text-xs leading-relaxed text-slate-700">{entry.faktorResiko}</p>
                </div>
              )}

              {entry.kriteriaHasil.some(k => k) && (
                <div className="rounded-lg bg-emerald-50/60 p-2.5">
                  <p className="mb-1.5 text-[11px] font-bold uppercase text-emerald-700">
                    Luaran / Kriteria Hasil
                    {entry.tujuanDurasi && (
                      <span className="ml-2 normal-case font-normal text-emerald-600">
                        · target {entry.tujuanDurasi} {entry.tujuanUnit} {entry.selama}
                      </span>
                    )}
                  </p>
                  {entry.kriteriaHasil.filter(k => k).map((k, i) => (
                    <div key={i} className="mt-1 flex items-start gap-1.5 text-xs text-slate-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />{k}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "observasi" as const,  label: "Observasi",  cls: "text-sky-600"     },
                  { key: "terapeutik" as const, label: "Terapeutik", cls: "text-emerald-600" },
                  { key: "edukasi" as const,    label: "Edukasi",    cls: "text-amber-600"   },
                  { key: "kolaborasi" as const, label: "Kolaborasi", cls: "text-indigo-600"  },
                ] as const).map(({ key, label, cls }) => {
                  const items = entry.intervensi[key].filter(v => v);
                  if (!items.length) return null;
                  return (
                    <div key={key} className="rounded-lg bg-slate-50 p-2.5">
                      <p className={cn("mb-1.5 text-[11px] font-bold uppercase", cls)}>{label}</p>
                      {items.map((item, i) => (
                        <div key={i} className="mt-1 flex items-start gap-1.5 text-xs text-slate-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />{item}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
