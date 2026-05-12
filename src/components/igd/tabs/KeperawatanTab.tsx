"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartHandshake, LayoutList, Edit2, Copy, Plus,
  CheckCircle2, AlertTriangle, X,
} from "lucide-react";
import type { IGDPatientDetail, AsuhanKeperawatanEntry, EvaluasiShift } from "@/lib/data";
import { cn } from "@/lib/utils";
import { STATUS_LUARAN_CONFIG, emptyForm, type AsuhanFormState } from "@/components/shared/medical-records/keperawatanShared";
import AsuhanForm, { type FormMode } from "@/components/shared/medical-records/keperawatan/AsuhanForm";
import AsuhanCard from "@/components/shared/medical-records/keperawatan/AsuhanCard";

// ── Helpers ────────────────────────────────────────────────

function genId() { return `ak-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function formStateFromEntry(e: AsuhanKeperawatanEntry): AsuhanFormState {
  return {
    kodeSdki:     e.kodeSdki,
    dataMayor:    { ...e.dataMayor },
    dataMinor:    { ...e.dataMinor },
    faktorResiko: e.faktorResiko,
    diagnosa:     e.diagnosa,
    penyebab:     e.penyebab,
    tujuanDurasi: e.tujuanDurasi,
    tujuanUnit:   e.tujuanUnit,
    selama:       e.selama,
    kriteriaHasil: [...e.kriteriaHasil],
    intervensi:   {
      observasi:  [...e.intervensi.observasi],
      terapeutik: [...e.intervensi.terapeutik],
      edukasi:    [...e.intervensi.edukasi],
      kolaborasi: [...e.intervensi.kolaborasi],
    },
    tanggalInput: e.tanggalInput,
    perawat:      e.perawat,
    statusLuaran: e.statusLuaran,
  };
}

// ── Panel header config ─────────────────────────────────────

const PANEL_HDR: Record<FormMode, { bg: string; label: string; labelCls: string; iconBg: string }> = {
  new:  { bg: "border-slate-200 bg-slate-50",   label: "Tambah Asuhan Keperawatan", labelCls: "text-slate-600",  iconBg: "bg-white text-indigo-600 ring-1 ring-indigo-300" },
  edit: { bg: "border-indigo-200 bg-indigo-50", label: "Edit Asuhan Keperawatan",   labelCls: "text-indigo-700", iconBg: "bg-indigo-600 text-white"                        },
  copy: { bg: "border-sky-200 bg-sky-50",       label: "Salin Asuhan Keperawatan",  labelCls: "text-sky-700",    iconBg: "bg-sky-500 text-white"                           },
};

const BORDER_COLOR: Record<FormMode, string> = {
  new:  "#e2e8f0",
  edit: "#a5b4fc",
  copy: "#7dd3fc",
};

// ── Main Component ─────────────────────────────────────────

export default function KeperawatanTab({ patient }: { patient: IGDPatientDetail }) {
  const [entries,    setEntries]    = useState<AsuhanKeperawatanEntry[]>(
    patient.asuhanKeperawatan ?? []
  );
  const [editId,     setEditId]     = useState<string | null>(null);
  const [copySource, setCopySource] = useState<AsuhanKeperawatanEntry | undefined>(undefined);

  const formMode: FormMode = editId ? "edit" : copySource ? "copy" : "new";
  const formInitial: AsuhanFormState | undefined = editId
    ? (() => { const e = entries.find(e => e.id === editId); return e ? formStateFromEntry(e) : undefined; })()
    : copySource ? formStateFromEntry(copySource) : undefined;
  const formKey = editId ? `edit-${editId}` : copySource ? `copy-${copySource.id}` : "new";

  // ── Handlers ──────────────────────────────────────────────

  function handleSave(data: AsuhanFormState) {
    if (editId) {
      setEntries(p => p.map(e => e.id === editId ? { ...e, ...data } : e));
    } else {
      const newEntry: AsuhanKeperawatanEntry = {
        id: genId(), ...data,
        verified: false, verifiedBy: "", verifiedAt: "",
        evaluasi: [], aktif: true,
      };
      setEntries(p => [...p, newEntry]);
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
      e.id === id
        ? { ...e, verified: true, verifiedBy: name, verifiedAt: new Date().toLocaleDateString("id-ID") }
        : e
    ));
  }

  function handleDelete(id: string) {
    if (editId === id) setEditId(null);
    if (copySource?.id === id) setCopySource(undefined);
    setEntries(p => p.filter(e => e.id !== id));
  }

  function handleCopyToForm(entry: AsuhanKeperawatanEntry) {
    setEditId(null);
    setCopySource(entry);
  }

  function handleAddEval(id: string, ev: EvaluasiShift) {
    setEntries(p => p.map(e =>
      e.id === id
        ? { ...e, evaluasi: [...e.evaluasi, ev], statusLuaran: ev.statusLuaran }
        : e
    ));
  }

  // ── Stats ─────────────────────────────────────────────────

  const totalDiagnosa  = entries.length;
  const teratasi       = entries.filter(e => e.statusLuaran === "Teratasi").length;
  const teratasiseb    = entries.filter(e => e.statusLuaran === "Teratasi_Sebagian").length;
  const belumTeratasi  = entries.filter(e => e.statusLuaran === "Belum_Teratasi").length;
  const dipantau       = entries.filter(e => e.statusLuaran === "Dipantau").length;
  const verifiedCount  = entries.filter(e => e.verified).length;

  const hdr = PANEL_HDR[formMode];

  return (
    <div className="flex flex-col gap-3">

      {/* ── Top bar ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <HeartHandshake size={16} className="text-indigo-500" />
        <span className="text-sm font-semibold text-slate-700">Asuhan Keperawatan</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs text-slate-400">SDKI / SLKI / SIKI</span>

        {totalDiagnosa > 0 && (
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400">{totalDiagnosa} diagnosa</span>
            {teratasi > 0      && <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STATUS_LUARAN_CONFIG.Teratasi.cls)}>✓ {teratasi}</span>}
            {teratasiseb > 0   && <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STATUS_LUARAN_CONFIG.Teratasi_Sebagian.cls)}>⚡ {teratasiseb}</span>}
            {belumTeratasi > 0 && <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STATUS_LUARAN_CONFIG.Belum_Teratasi.cls)}>✗ {belumTeratasi}</span>}
            {dipantau > 0      && <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STATUS_LUARAN_CONFIG.Dipantau.cls)}>● {dipantau}</span>}
            {verifiedCount > 0 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 size={9} className="mr-0.5 inline" />{verifiedCount} verified
              </span>
            )}
            {entries.some(e => !e.verified) && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                <AlertTriangle size={9} className="mr-0.5 inline" />{entries.filter(e => !e.verified).length} pending
              </span>
            )}
          </div>
        )}

        {formMode !== "new" && (
          <div className="flex items-center gap-1.5">
            {formMode === "edit" && (
              <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                <Edit2 size={10} /> Mode Edit
              </span>
            )}
            {formMode === "copy" && (
              <span className="flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-700">
                <Copy size={10} /> Mode Salin
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── 2-panel layout ── */}
      <div className="grid gap-3 lg:grid-cols-[3fr_2fr]">

        {/* ── LEFT: Form panel ── */}
        <div
          className="overflow-hidden rounded-xl border shadow-xs transition-all duration-200"
          style={{ borderColor: BORDER_COLOR[formMode] }}
        >
          <div className={cn("flex items-center gap-2 border-b px-4 py-3 transition-colors", hdr.bg)}>
            <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", hdr.iconBg)}>
              {formMode === "edit" ? <Edit2 size={12} /> : formMode === "copy" ? <Copy size={12} /> : <Plus size={12} />}
            </div>
            <span className={cn("text-xs font-bold", hdr.labelCls)}>{hdr.label}</span>
            {formMode !== "new" && (
              <button type="button" onClick={handleReset}
                className="ml-auto cursor-pointer rounded-md p-1 text-slate-400 transition hover:bg-white/60 hover:text-slate-700">
                <X size={14} />
              </button>
            )}
          </div>

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
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <LayoutList size={14} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-600">Daftar Diagnosa Keperawatan</span>
              {entries.length > 0 && (
                <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">
                  {entries.length}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white p-3">
            {entries.length === 0 ? (
              <motion.div
                className="flex flex-col items-center justify-center py-16 text-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <HeartHandshake size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-400">Belum ada asuhan</p>
                <p className="mt-1.5 max-w-45 text-xs leading-relaxed text-slate-400">
                  Pilih diagnosa dari katalog SDKI di sebelah kiri, lalu simpan untuk menambah asuhan keperawatan
                </p>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <AnimatePresence>
                  {entries.map((entry, idx) => (
                    <AsuhanCard
                      key={entry.id}
                      entry={entry}
                      index={idx}
                      isEditing={editId === entry.id}
                      isCopySource={copySource?.id === entry.id}
                      onEdit={() => { setCopySource(undefined); setEditId(entry.id); }}
                      onDelete={() => handleDelete(entry.id)}
                      onVerify={name => handleVerify(entry.id, name)}
                      onCopyToForm={() => handleCopyToForm(entry)}
                      onAddEval={ev => handleAddEval(entry.id, ev)}
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
