"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartHandshake, Plus, Trash2, Edit2, CheckCircle2,
  Clock, User, ChevronDown, X, Save, ShieldCheck,
  Stethoscope, Target, Activity, ClipboardList, AlertTriangle,
  LayoutList, RotateCcw, Copy,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

interface DataSO { subjektif: string; objektif: string }
interface IntervensiGroup {
  observasi: string[]; terapeutik: string[]; edukasi: string[]; kolaborasi: string[];
}
interface AsuhanEntry {
  id: string;
  dataMayor: DataSO; dataMinor: DataSO;
  faktorResiko: string;
  diagnosa: string; penyebab: string;
  tujuanDurasi: string; tujuanUnit: "Jam" | "Hari"; selama: string;
  kriteriaHasil: string[];
  intervensi: IntervensiGroup;
  tanggalInput: string; perawat: string;
  verified: boolean; verifiedBy: string; verifiedAt: string;
}
type FormState = Omit<AsuhanEntry, "id" | "verified" | "verifiedBy" | "verifiedAt">;
type IK = keyof IntervensiGroup;
type FormMode = "new" | "edit" | "copy";

function emptyForm(): FormState {
  return {
    dataMayor: { subjektif: "", objektif: "" },
    dataMinor: { subjektif: "", objektif: "" },
    faktorResiko: "",
    diagnosa: "", penyebab: "",
    tujuanDurasi: "", tujuanUnit: "Jam", selama: "",
    kriteriaHasil: [""],
    intervensi: { observasi: [""], terapeutik: [""], edukasi: [""], kolaborasi: [""] },
    tanggalInput: new Date().toISOString().split("T")[0],
    perawat: "",
  };
}

// ── Constants ──────────────────────────────────────────────

type AccentKey = "indigo" | "emerald" | "sky" | "amber" | "rose" | "slate";

const ACCENT: Record<AccentKey, { head: string; dot: string; text: string }> = {
  indigo:  { head: "bg-indigo-50 text-indigo-700 border-indigo-200",    dot: "bg-indigo-400",  text: "text-indigo-700"  },
  emerald: { head: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400", text: "text-emerald-700" },
  sky:     { head: "bg-sky-50 text-sky-700 border-sky-200",             dot: "bg-sky-400",     text: "text-sky-700"     },
  amber:   { head: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-400",   text: "text-amber-700"   },
  rose:    { head: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-400",    text: "text-rose-700"    },
  slate:   { head: "bg-slate-100 text-slate-600 border-slate-200",      dot: "bg-slate-400",   text: "text-slate-600"   },
};

const IV_SECTIONS: { key: IK; label: string; accent: AccentKey; tint: string }[] = [
  { key: "observasi",  label: "Observasi",  accent: "sky",     tint: "bg-sky-50/70 border-sky-100"         },
  { key: "terapeutik", label: "Terapeutik", accent: "emerald", tint: "bg-emerald-50/70 border-emerald-100" },
  { key: "edukasi",    label: "Edukasi",    accent: "amber",   tint: "bg-amber-50/70 border-amber-100"     },
  { key: "kolaborasi", label: "Kolaborasi", accent: "indigo",  tint: "bg-indigo-50/70 border-indigo-100"   },
];

// ── Primitives ─────────────────────────────────────────────

function FL({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">{children}</p>;
}

function TI({
  value, onChange, placeholder, className, type = "text",
}: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-50",
        className,
      )}
    />
  );
}

function TA({
  value, onChange, placeholder, rows = 2,
}: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-50"
    />
  );
}

function DynList({
  items, onChange, onAdd, onRemove, placeholder, accent = "indigo",
}: {
  items: string[]; onChange: (i: number, v: string) => void;
  onAdd: () => void; onRemove: (i: number) => void;
  placeholder?: string; accent?: AccentKey;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((val, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", ACCENT[accent].dot)} />
          <input
            value={val}
            onChange={e => onChange(idx, e.target.value)}
            placeholder={placeholder ?? `Item ${idx + 1}...`}
            className="flex-1 border-b border-slate-200 bg-transparent py-1 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
          />
          {items.length > 1 && (
            <button onClick={() => onRemove(idx)} className="shrink-0 cursor-pointer text-slate-300 transition-colors hover:text-rose-500">
              <X size={12} />
            </button>
          )}
        </div>
      ))}
      <button onClick={onAdd} className="mt-1 flex w-fit items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-indigo-600">
        <Plus size={12} /> Tambah
      </button>
    </div>
  );
}

// Collapsible form section
function FSection({
  title, icon: Icon, accent = "indigo", children,
}: { title: string; icon: React.ElementType; accent?: AccentKey; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen(p => !p)}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 transition",
          open ? cn("rounded-t-xl border-b", ACCENT[accent].head) : "rounded-xl hover:bg-slate-50",
        )}
      >
        <div className="flex items-center gap-2">
          <Icon size={13} />
          <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }} className="flex">
          <ChevronDown size={13} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="p-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Left Panel: Form ───────────────────────────────────────

function AsuhanForm({
  initial, mode, onSave, onReset,
}: { initial?: AsuhanEntry; mode: FormMode; onSave: (d: FormState) => void; onReset: () => void }) {
  const [f, setF] = useState<FormState>(() =>
    initial ? {
      dataMayor: { ...initial.dataMayor }, dataMinor: { ...initial.dataMinor },
      faktorResiko: initial.faktorResiko,
      diagnosa: initial.diagnosa, penyebab: initial.penyebab,
      tujuanDurasi: initial.tujuanDurasi, tujuanUnit: initial.tujuanUnit, selama: initial.selama,
      kriteriaHasil: [...initial.kriteriaHasil],
      intervensi: {
        observasi:  [...initial.intervensi.observasi],
        terapeutik: [...initial.intervensi.terapeutik],
        edukasi:    [...initial.intervensi.edukasi],
        kolaborasi: [...initial.intervensi.kolaborasi],
      },
      tanggalInput: initial.tanggalInput, perawat: initial.perawat,
    } : emptyForm()
  );

  function set<K extends keyof FormState>(k: K, v: FormState[K]) { setF(p => ({ ...p, [k]: v })); }
  const mayor  = (k: keyof DataSO, v: string) => set("dataMayor", { ...f.dataMayor, [k]: v });
  const minor  = (k: keyof DataSO, v: string) => set("dataMinor", { ...f.dataMinor, [k]: v });
  const khChg  = (i: number, v: string) => set("kriteriaHasil", f.kriteriaHasil.map((x, j) => j === i ? v : x));
  const khAdd  = () => set("kriteriaHasil", [...f.kriteriaHasil, ""]);
  const khRem  = (i: number) => set("kriteriaHasil", f.kriteriaHasil.filter((_, j) => j !== i));
  const ivChg  = (k: IK, i: number, v: string) =>
    set("intervensi", { ...f.intervensi, [k]: f.intervensi[k].map((x, j) => j === i ? v : x) });
  const ivAdd  = (k: IK) => set("intervensi", { ...f.intervensi, [k]: [...f.intervensi[k], ""] });
  const ivRem  = (k: IK, i: number) =>
    set("intervensi", { ...f.intervensi, [k]: f.intervensi[k].filter((_, j) => j !== i) });

  const canSave = f.diagnosa.trim() && f.perawat.trim();

  const saveLabel =
    mode === "edit" ? "Simpan Perubahan" :
    mode === "copy" ? "Simpan Salinan"   :
                     "Simpan Asuhan";

  return (
    <div className="flex flex-col gap-2.5">

      {/* Data Pengkajian */}
      <FSection title="Data Pengkajian" icon={ClipboardList} accent="indigo">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-indigo-400" /> Data Mayor
            </p>
            <div className="space-y-2.5">
              <div><FL>Subjektif</FL><TA value={f.dataMayor.subjektif} onChange={v => mayor("subjektif", v)} placeholder="Keluhan pasien/keluarga..." /></div>
              <div><FL>Objektif</FL><TA  value={f.dataMayor.objektif}  onChange={v => mayor("objektif", v)}  placeholder="Hasil pemeriksaan..." /></div>
            </div>
          </div>
          <div>
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-slate-400" /> Data Minor
            </p>
            <div className="space-y-2.5">
              <div><FL>Subjektif</FL><TA value={f.dataMinor.subjektif} onChange={v => minor("subjektif", v)} placeholder="Keluhan tambahan..." /></div>
              <div><FL>Objektif</FL><TA  value={f.dataMinor.objektif}  onChange={v => minor("objektif", v)}  placeholder="Data pendukung..." /></div>
            </div>
          </div>
        </div>
        <div className="mt-3.5">
          <FL>Faktor Resiko</FL>
          <TA value={f.faktorResiko} onChange={v => set("faktorResiko", v)} placeholder="Faktor resiko yang berkontribusi..." rows={2} />
        </div>
      </FSection>

      {/* Diagnosa */}
      <FSection title="Diagnosa Keperawatan" icon={Stethoscope} accent="rose">
        <div className="space-y-2.5">
          <div>
            <FL>Diagnosa (SDKI) <span className="normal-case text-rose-400">*wajib</span></FL>
            <TA value={f.diagnosa} onChange={v => set("diagnosa", v)} placeholder="Contoh: Nyeri akut b.d agen pencedera fisik d.d pasien mengeluh nyeri skala 7..." rows={2} />
          </div>
          <div>
            <FL>Penyebab / Etiologi</FL>
            <TA value={f.penyebab} onChange={v => set("penyebab", v)} placeholder="Contoh: Agen pencedera fisik (trauma, prosedur invasif)..." rows={2} />
          </div>
        </div>
      </FSection>

      {/* Luaran */}
      <FSection title="Luaran Keperawatan (SLKI)" icon={Target} accent="emerald">
        <div className="space-y-3">
          <div>
            <FL>Tujuan Intervensi</FL>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 whitespace-nowrap">Setelah intervensi</span>
              <TI value={f.tujuanDurasi} onChange={v => set("tujuanDurasi", v)} placeholder="0" className="w-16 text-center" />
              <select
                value={f.tujuanUnit}
                onChange={e => set("tujuanUnit", e.target.value as "Jam" | "Hari")}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400"
              >
                <option value="Jam">Jam</option>
                <option value="Hari">Hari</option>
              </select>
            </div>
          </div>
          <div>
            <FL>Selama</FL>
            <TI value={f.selama} onChange={v => set("selama", v)} placeholder="Contoh: pasien dirawat di IGD, 1x perawatan..." />
          </div>
          <div>
            <FL>Kriteria Hasil</FL>
            <DynList items={f.kriteriaHasil} onChange={khChg} onAdd={khAdd} onRemove={khRem} placeholder="Kriteria yang diharapkan..." accent="emerald" />
          </div>
        </div>
      </FSection>

      {/* Intervensi */}
      <FSection title="Intervensi Keperawatan (SIKI)" icon={Activity} accent="sky">
        <div className="grid grid-cols-2 gap-2.5">
          {IV_SECTIONS.map(({ key, label, accent, tint }) => (
            <div key={key} className={cn("rounded-lg border p-3", tint)}>
              <div className="mb-2 flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", ACCENT[accent].dot)} />
                <p className={cn("text-[11px] font-bold uppercase tracking-widest", ACCENT[accent].text)}>{label}</p>
              </div>
              <DynList
                items={f.intervensi[key]}
                onChange={(i, v) => ivChg(key, i, v)}
                onAdd={() => ivAdd(key)}
                onRemove={i => ivRem(key, i)}
                placeholder="Tindakan..."
                accent={accent}
              />
            </div>
          ))}
        </div>
      </FSection>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5">
        <div>
          <FL>Tanggal Input</FL>
          <input
            type="date"
            value={f.tanggalInput}
            onChange={e => set("tanggalInput", e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
          />
        </div>
        <div>
          <FL>Perawat <span className="normal-case text-rose-400">*wajib</span></FL>
          <TI value={f.perawat} onChange={v => set("perawat", v)} placeholder="Nama perawat pelaksana..." />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-0.5">
        <button
          onClick={onReset}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        >
          <RotateCcw size={13} /> Reset
        </button>
        <button
          onClick={() => canSave && onSave(f)}
          disabled={!canSave}
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
            mode === "copy" ? "bg-sky-600 hover:bg-sky-700" : "bg-indigo-600 hover:bg-indigo-700",
          )}
        >
          <Save size={14} />
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

// ── Right Panel: Record Card ───────────────────────────────

function AsuhanRecordCard({
  entry, index, isEditing, isCopySource, onEdit, onDelete, onVerify, onCopyToForm,
}: {
  entry: AsuhanEntry; index: number; isEditing: boolean; isCopySource: boolean;
  onEdit: () => void; onDelete: () => void; onVerify: (name: string) => void;
  onCopyToForm: () => void;
}) {
  const [expanded,   setExpanded]   = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifier,   setVerifier]   = useState("");

  function confirmVerify() {
    if (!verifier.trim()) return;
    onVerify(verifier.trim());
    setVerifyOpen(false);
    setVerifier("");
  }

  const ringClass = isEditing
    ? "border-indigo-300 shadow-md shadow-indigo-100/60 ring-2 ring-indigo-200/70"
    : isCopySource
    ? "border-sky-300 shadow-md shadow-sky-100/60 ring-2 ring-sky-200/70"
    : "border-slate-200 hover:border-slate-300 hover:shadow-sm";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.16 }}
      className={cn("rounded-xl border bg-white transition-all duration-200", ringClass)}
    >
      {/* Main row */}
      <div className="flex items-start gap-2.5 p-3.5">
        {/* Index */}
        <div className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
          isEditing    ? "bg-indigo-600 text-white" :
          isCopySource ? "bg-sky-500 text-white"    :
                         "bg-indigo-100 text-indigo-700",
        )}>
          {index + 1}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-slate-800 line-clamp-2">{entry.diagnosa || "—"}</p>
          {entry.penyebab && (
            <p className="mt-1 text-xs leading-snug text-slate-500 line-clamp-1">
              <span className="font-medium">b.d</span> {entry.penyebab}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] text-slate-400"><User size={11} />{entry.perawat}</span>
            <span className="text-[11px] text-slate-300">·</span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400"><Clock size={11} />{entry.tanggalInput}</span>
          </div>
          <div className="mt-2">
            {entry.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 size={10} /> Verified · {entry.verifiedBy}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                <AlertTriangle size={10} /> Belum Diverifikasi
              </span>
            )}
          </div>
        </div>

        {/* Action column */}
        <div className="flex shrink-0 flex-col gap-0.5">
          <button
            onClick={onEdit}
            title="Edit"
            className={cn(
              "cursor-pointer rounded-md p-1.5 transition",
              isEditing ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-600",
            )}
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={onCopyToForm}
            title="Salin ke formulir"
            className={cn(
              "cursor-pointer rounded-md p-1.5 transition",
              isCopySource ? "bg-sky-100 text-sky-600" : "text-slate-400 hover:bg-sky-50 hover:text-sky-500",
            )}
          >
            <Copy size={13} />
          </button>
          <button onClick={onDelete} title="Hapus" className="cursor-pointer rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500">
            <Trash2 size={13} />
          </button>
          {!entry.verified && (
            <button
              onClick={() => setVerifyOpen(p => !p)}
              title="Verifikasi"
              className={cn(
                "cursor-pointer rounded-md p-1.5 transition",
                verifyOpen ? "bg-emerald-100 text-emerald-700" : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600",
              )}
            >
              <ShieldCheck size={13} />
            </button>
          )}
          <button onClick={() => setExpanded(p => !p)} className="cursor-pointer rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100">
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown size={13} />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Inline verify */}
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
                  placeholder="Supervisor / perawat PJ..."
                  autoFocus
                  className="flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                />
                <button
                  onClick={confirmVerify}
                  disabled={!verifier.trim()}
                  className="flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
                >
                  <ShieldCheck size={12} /> OK
                </button>
                <button
                  onClick={() => { setVerifyOpen(false); setVerifier(""); }}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 text-slate-400 transition hover:bg-slate-50"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded detail */}
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
              {/* Data Mayor/Minor */}
              {(entry.dataMayor.subjektif || entry.dataMayor.objektif || entry.dataMinor.subjektif || entry.dataMinor.objektif) && (
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

              {/* Faktor Resiko */}
              {entry.faktorResiko && (
                <div className="rounded-lg bg-rose-50/60 p-2.5">
                  <p className="mb-1 text-[11px] font-bold uppercase text-rose-600">Faktor Resiko</p>
                  <p className="text-xs leading-relaxed text-slate-700">{entry.faktorResiko}</p>
                </div>
              )}

              {/* Luaran */}
              {(entry.tujuanDurasi || entry.kriteriaHasil.some(k => k)) && (
                <div className="rounded-lg bg-emerald-50/60 p-2.5">
                  <p className="mb-1.5 text-[11px] font-bold uppercase text-emerald-700">Luaran</p>
                  {entry.tujuanDurasi && (
                    <p className="text-xs text-slate-700">
                      Intervensi <span className="font-semibold">{entry.tujuanDurasi} {entry.tujuanUnit}</span>
                      {entry.selama && <> · <span className="italic">{entry.selama}</span></>}
                    </p>
                  )}
                  {entry.kriteriaHasil.filter(k => k).map((k, i) => (
                    <div key={i} className="mt-1 flex items-start gap-1.5 text-xs text-slate-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />{k}
                    </div>
                  ))}
                </div>
              )}

              {/* Intervensi grid */}
              {IV_SECTIONS.some(({ key }) => entry.intervensi[key].some(v => v)) && (
                <div className="grid grid-cols-2 gap-2">
                  {IV_SECTIONS.map(({ key, label, accent }) => {
                    const items = entry.intervensi[key].filter(v => v);
                    if (!items.length) return null;
                    return (
                      <div key={key} className="rounded-lg bg-slate-50 p-2.5">
                        <p className={cn("mb-1.5 text-[11px] font-bold uppercase", ACCENT[accent].text)}>{label}</p>
                        {items.map((item, i) => (
                          <div key={i} className="mt-1 flex items-start gap-1.5 text-xs text-slate-700">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />{item}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function KeperawatanTab({ patient: _patient }: { patient: IGDPatientDetail }) {
  const [entries,    setEntries]    = useState<AsuhanEntry[]>([]);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [copySource, setCopySource] = useState<AsuhanEntry | undefined>(undefined);

  const formMode: FormMode = editId ? "edit" : copySource ? "copy" : "new";
  const formInitial = editId ? entries.find(e => e.id === editId) : copySource;
  // Key forces AsuhanForm to re-mount cleanly on every mode/source switch
  const formKey = editId ? `edit-${editId}` : copySource ? `copy-${copySource.id}` : "new";

  function handleSave(data: FormState) {
    if (editId) {
      setEntries(p => p.map(e => e.id === editId ? { ...e, ...data } : e));
    } else {
      setEntries(p => [...p, { id: `ak-${Date.now()}`, ...data, verified: false, verifiedBy: "", verifiedAt: "" }]);
    }
    setEditId(null);
    setCopySource(undefined);
  }

  function handleReset() {
    setEditId(null);
    setCopySource(undefined);
  }

  function handleVerify(id: string, name: string) {
    setEntries(p => p.map(e =>
      e.id === id ? { ...e, verified: true, verifiedBy: name, verifiedAt: new Date().toLocaleDateString("id-ID") } : e,
    ));
  }

  function handleDelete(id: string) {
    if (editId === id) setEditId(null);
    if (copySource?.id === id) setCopySource(undefined);
    setEntries(p => p.filter(e => e.id !== id));
  }

  function handleCopyToForm(entry: AsuhanEntry) {
    setEditId(null);
    setCopySource(entry);
  }

  const verifiedCount   = entries.filter(e => e.verified).length;
  const unverifiedCount = entries.filter(e => !e.verified).length;

  // Panel header config per mode
  const panelHeader = {
    new:  { bg: "border-slate-200 bg-slate-50",   icon: "bg-white text-indigo-600 ring-1 ring-indigo-300", label: "Tambah Asuhan Keperawatan", labelColor: "text-slate-600" },
    edit: { bg: "border-indigo-200 bg-indigo-50", icon: "bg-indigo-600 text-white",                        label: "Edit Asuhan Keperawatan",   labelColor: "text-indigo-700" },
    copy: { bg: "border-sky-200 bg-sky-50",       icon: "bg-sky-500 text-white",                           label: "Salin Asuhan Keperawatan",  labelColor: "text-sky-700"   },
  }[formMode];

  const panelBorderColor = formMode === "edit" ? "#a5b4fc" : formMode === "copy" ? "#7dd3fc" : "#e2e8f0";

  return (
    <div className="flex flex-col gap-3">
      {/* Top bar */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <HeartHandshake size={16} className="text-indigo-500" />
        <span className="text-sm font-semibold text-slate-700">Asuhan Keperawatan</span>
        <span className="text-slate-300 text-sm">·</span>
        <span className="text-xs text-slate-400">SDKI / SLKI / SIKI</span>
        {formMode === "edit" && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
            <Edit2 size={10} /> Mode Edit
          </span>
        )}
        {formMode === "copy" && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-700">
            <Copy size={10} /> Mode Salin
          </span>
        )}
      </div>

      {/* 2-panel layout */}
      <div className="grid gap-3 lg:grid-cols-[3fr_2fr]">

        {/* ── LEFT: Form panel ── */}
        <div
          className="overflow-hidden rounded-xl border shadow-xs transition-all duration-200"
          style={{ borderColor: panelBorderColor }}
        >
          {/* Panel header */}
          <div className={cn("flex items-center gap-2 border-b px-4 py-3 transition-colors", panelHeader.bg)}>
            <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", panelHeader.icon)}>
              {formMode === "edit" ? <Edit2 size={12} /> : formMode === "copy" ? <Copy size={12} /> : <Plus size={12} />}
            </div>
            <span className={cn("text-xs font-bold", panelHeader.labelColor)}>{panelHeader.label}</span>
            {formMode !== "new" && (
              <button
                onClick={handleReset}
                className="ml-auto cursor-pointer rounded-md p-1 text-slate-400 transition hover:bg-white/60 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Form content */}
          <div className="bg-slate-50/40 p-3.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={formKey}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.14 }}
              >
                <AsuhanForm
                  initial={formInitial}
                  mode={formMode}
                  onSave={handleSave}
                  onReset={handleReset}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT: List panel ── */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 shadow-xs lg:sticky lg:top-4 lg:max-h-[calc(100vh-140px)]">
          {/* Panel header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <LayoutList size={14} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-600">Daftar Asuhan</span>
              {entries.length > 0 && (
                <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">
                  {entries.length}
                </span>
              )}
            </div>
            {entries.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  {verifiedCount} ✓
                </span>
                <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-600">
                  {unverifiedCount} ⚠
                </span>
              </div>
            )}
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto bg-white p-3">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <HeartHandshake size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-400">Belum ada asuhan</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  Isi formulir di sebelah kiri<br />untuk menambah asuhan keperawatan
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <AnimatePresence>
                  {entries.map((entry, idx) => (
                    <AsuhanRecordCard
                      key={entry.id}
                      entry={entry}
                      index={idx}
                      isEditing={editId === entry.id}
                      isCopySource={copySource?.id === entry.id}
                      onEdit={() => { setCopySource(undefined); setEditId(entry.id); }}
                      onDelete={() => handleDelete(entry.id)}
                      onVerify={name => handleVerify(entry.id, name)}
                      onCopyToForm={() => handleCopyToForm(entry)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
