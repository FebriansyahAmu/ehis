"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertTriangle, CheckCircle2, Plus, X, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DOSIS_LOG_MOCK, DRL_CT, DRL_ENTRANCE, MODALITAS_COLOR,
  type DosisLogEntry,
} from "./radManajemenShared";
import { type Modalitas } from "../radShared";

// ── DRL Gauge ─────────────────────────────────────────────

function DRLGauge({ label, val, drl }: { label: string; val: number; drl: number }) {
  const pct      = Math.min((val / drl) * 100, 130);
  const exceeded = val > drl;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-slate-600">{label}</span>
        <span className={cn("font-semibold", exceeded ? "text-rose-600" : "text-emerald-600")}>
          {val} <span className="font-normal text-slate-400">/ DRL {drl}</span>
        </span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("h-2.5 rounded-full", exceeded ? "bg-rose-500" : "bg-emerald-500")}
        />
        <div className="absolute right-0 top-0 h-2.5 w-0.5 bg-slate-600/40" />
      </div>
    </div>
  );
}

// ── Dose Card ─────────────────────────────────────────────

function DoseCard({ entry, active, onClick }: {
  entry: DosisLogEntry; active: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      layout
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all",
        active
          ? "border-teal-400 bg-teal-50 shadow-sm ring-2 ring-teal-100"
          : entry.exceeded
            ? "border-rose-200 bg-rose-50/50 hover:bg-rose-50"
            : "border-slate-200 bg-white hover:bg-slate-50",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className={cn(
          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
          entry.exceeded ? "bg-rose-500" : "bg-emerald-400",
        )} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold text-slate-800">{entry.namaPasien}</p>
          <p className="text-[10px] text-slate-400">{entry.noRM} · {entry.tanggal}</p>
        </div>
        <span className={cn(
          "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white",
          MODALITAS_COLOR[entry.modalitas],
        )}>
          {entry.modalitas === "Konvensional" ? "XR" : entry.modalitas}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-[10px] text-slate-500">{entry.region}</p>
        {entry.exceeded && <span className="text-[9px] font-bold text-rose-600">⚠ Melebihi DRL</span>}
      </div>
    </motion.button>
  );
}

// ── Dose Detail ───────────────────────────────────────────

function DoseDetail({ entry }: { entry: DosisLogEntry }) {
  return (
    <motion.div
      key={entry.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4"
    >
      <AnimatePresence>
        {entry.exceeded && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-rose-600" />
            <div>
              <p className="text-[11px] font-bold text-rose-800">Dosis Melebihi DRL Nasional</p>
              <p className="text-[10px] text-rose-600">
                Dosis melebihi Diagnostic Reference Level PMK 1014/2008.
                Tinjau teknik akuisisi dan parameter protokol — prinsip ALARA wajib diterapkan.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[13px] font-bold text-slate-800">{entry.namaPasien}</p>
            <p className="text-[11px] text-slate-400">{entry.noRM} · {entry.tanggal}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold text-white", MODALITAS_COLOR[entry.modalitas])}>
              {entry.modalitas}
            </span>
            {entry.exceeded
              ? <AlertTriangle size={15} className="text-rose-500" />
              : <CheckCircle2 size={15} className="text-emerald-500" />}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-slate-400">Region / Proyeksi</p>
            <p className="font-semibold text-slate-700">{entry.region}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-slate-400">Status DRL</p>
            <p className={cn("font-bold", entry.exceeded ? "text-rose-600" : "text-emerald-600")}>
              {entry.exceeded ? "Melebihi DRL" : "Dalam DRL"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-[11px] font-bold text-slate-700">Parameter Dosis</p>
        <div className="flex flex-col gap-3">
          {entry.ctdiVol !== undefined && entry.drlCtdi !== undefined && (
            <DRLGauge label="CTDIvol (mGy)" val={entry.ctdiVol} drl={entry.drlCtdi} />
          )}
          {entry.dlp !== undefined && entry.drlDlp !== undefined && (
            <DRLGauge label="DLP (mGy·cm)" val={entry.dlp} drl={entry.drlDlp} />
          )}
          {entry.entrance !== undefined && entry.drlEntrance !== undefined && (
            <DRLGauge label="Entrance Dose (mGy)" val={entry.entrance} drl={entry.drlEntrance} />
          )}
          {entry.dap !== undefined && (
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-600">DAP (mGy·cm²)</span>
              <span className="font-semibold text-slate-700">{entry.dap}</span>
            </div>
          )}
          {entry.waktuFluoro !== undefined && (
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-600">Waktu Fluoroskopi (det)</span>
              <span className="font-semibold text-slate-700">{entry.waktuFluoro}</span>
            </div>
          )}
        </div>
        <p className="mt-3 text-[9px] text-slate-400">
          DRL: PMK 1014/2008 · Perka BAPETEN No. 2/2018 · IAEA Safety Reports 39
        </p>
      </div>

      <div className="rounded-xl border border-teal-100 bg-teal-50/60 px-4 py-3">
        <p className="text-[10px] font-bold text-teal-800">Prinsip ALARA</p>
        <p className="mt-0.5 text-[10px] text-teal-700">
          <em>As Low As Reasonably Achievable</em> — Setiap paparan radiasi harus dijustifikasi secara klinis
          dan dioptimalkan untuk memberikan dosis serendah mungkin yang masih menghasilkan kualitas diagnostik memadai.
          IAEA HH-19 · Perka BAPETEN No. 2/2018
        </p>
      </div>
    </motion.div>
  );
}

// ── DRL Summary ───────────────────────────────────────────

function DRLSummary({ entries }: { entries: DosisLogEntry[] }) {
  const ctEntries   = entries.filter((e) => e.modalitas === "CT" && e.ctdiVol !== undefined);
  const exceedCount = entries.filter((e) => e.exceeded).length;
  const exceedPct   = entries.length > 0 ? Math.round((exceedCount / entries.length) * 100) : 0;
  const ctAvgCtdi   = ctEntries.length > 0
    ? Math.round((ctEntries.reduce((a, e) => a + (e.ctdiVol ?? 0), 0) / ctEntries.length) * 10) / 10
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-[11px] font-bold text-slate-700">Ringkasan DRL (data saat ini)</p>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Total Log",     val: entries.length,  cls: "text-slate-700"  },
          { label: "Melebihi DRL",  val: exceedCount,     cls: exceedCount > 0 ? "text-rose-600" : "text-emerald-500" },
          { label: "% Melebihi",    val: `${exceedPct}%`, cls: exceedPct > 10 ? "text-rose-600" : "text-slate-700" },
        ].map(({ label, val, cls }) => (
          <div key={label}>
            <p className="text-[10px] text-slate-400">{label}</p>
            <p className={cn("text-xl font-bold", cls)}>{val}</p>
          </div>
        ))}
      </div>
      {ctAvgCtdi !== null && (
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-semibold text-slate-500">Rata-rata CTDIvol CT (semua region)</p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((ctAvgCtdi / 60) * 100, 100)}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={cn("h-2 rounded-full", ctAvgCtdi > 40 ? "bg-amber-400" : "bg-teal-500")}
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-700">{ctAvgCtdi} mGy</span>
          </div>
        </div>
      )}
      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="mb-2 text-[10px] font-semibold text-slate-500">DRL Referensi PMK 1014/2008 — CT</p>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(DRL_CT).map(([region, val]) => (
            <div key={region} className="flex justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px]">
              <span className="text-slate-500">{region}</span>
              <span className="font-semibold text-slate-700">{val.ctdi} · {val.dlp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Form Types & Config ───────────────────────────────────

type FormModalitas = "CT" | "Konvensional" | "Mammografi" | "Fluoroskopi";

const REGION_OPTIONS: Record<FormModalitas, string[]> = {
  CT:           ["Kepala", "Thoraks", "Abdomen", "Pelvis", "Leher"],
  Konvensional: ["PA Thoraks", "Lat Thoraks", "Abdomen AP", "Pelvis AP", "LS AP"],
  Mammografi:   ["Mammografi CC", "Mammografi MLO"],
  Fluoroskopi:  ["Esofagus", "Lambung", "Colon", "HSG", "Lainnya"],
};

interface FormState {
  noRM: string; namaPasien: string; tanggal: string;
  modalitas: FormModalitas; region: string;
  ctdiVol: string; dlp: string; entrance: string;
  dap: string; waktuFluoro: string;
}

const DEFAULT_FORM: FormState = {
  noRM: "", namaPasien: "", tanggal: "2026-05-19",
  modalitas: "CT", region: "",
  ctdiVol: "", dlp: "", entrance: "", dap: "", waktuFluoro: "",
};

// ── DRL Preview ───────────────────────────────────────────

function DRLPreview({ form }: { form: FormState }) {
  const drlCt    = form.region ? DRL_CT[form.region]        : null;
  const drlEntry = form.region ? DRL_ENTRANCE[form.region]  : null;
  const ctdiNum  = parseFloat(form.ctdiVol);
  const dlpNum   = parseFloat(form.dlp);
  const entNum   = parseFloat(form.entrance);
  const dapNum   = parseFloat(form.dap);

  if (form.modalitas === "Fluoroskopi") {
    if (isNaN(dapNum)) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
      >
        <p className="mb-1 text-[10px] font-semibold text-slate-500">Preview Dosis</p>
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-600">DAP</span>
          <span className="font-semibold text-slate-700">{dapNum} mGy·cm²</span>
        </div>
        <p className="mt-1 text-[9px] text-slate-400">Tidak ada DRL nasional untuk fluoroskopi — pantau ALARA</p>
      </motion.div>
    );
  }

  const showCtdi = form.modalitas === "CT" && drlCt && !isNaN(ctdiNum);
  const showDlp  = form.modalitas === "CT" && drlCt && !isNaN(dlpNum);
  const showEnt  = (form.modalitas === "Konvensional" || form.modalitas === "Mammografi") && drlEntry && !isNaN(entNum);

  if (!showCtdi && !showDlp && !showEnt) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
    >
      <p className="text-[10px] font-semibold text-slate-500">Preview DRL — {form.region}</p>
      {showCtdi && drlCt && <DRLGauge label="CTDIvol (mGy)" val={ctdiNum} drl={drlCt.ctdi} />}
      {showDlp  && drlCt && <DRLGauge label="DLP (mGy·cm)" val={dlpNum}  drl={drlCt.dlp}  />}
      {showEnt  && drlEntry && (
        <DRLGauge
          label={form.modalitas === "Mammografi" ? "MGD (mGy)" : "Entrance Dose (mGy)"}
          val={entNum} drl={drlEntry}
        />
      )}
    </motion.div>
  );
}

// ── Add Dosis Form ────────────────────────────────────────

function AddDosisForm({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (entry: DosisLogEntry) => void;
}) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const inp = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400";

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "modalitas") next.region = "";
      return next;
    });
  }

  function calcExceeded(): boolean {
    if (form.modalitas === "CT") {
      const drl = DRL_CT[form.region];
      if (!drl) return false;
      return (!isNaN(parseFloat(form.ctdiVol)) && parseFloat(form.ctdiVol) > drl.ctdi) ||
             (!isNaN(parseFloat(form.dlp))     && parseFloat(form.dlp)     > drl.dlp);
    }
    if (form.modalitas === "Konvensional" || form.modalitas === "Mammografi") {
      const drl = DRL_ENTRANCE[form.region];
      return !!drl && !isNaN(parseFloat(form.entrance)) && parseFloat(form.entrance) > drl;
    }
    return false;
  }

  function buildEntry(): DosisLogEntry {
    const base: DosisLogEntry = {
      id: Date.now().toString(), tanggal: form.tanggal,
      noRM: form.noRM.trim(), namaPasien: form.namaPasien.trim(),
      modalitas: form.modalitas as Modalitas, region: form.region,
      exceeded: calcExceeded(),
    };
    if (form.modalitas === "CT") {
      const drl = DRL_CT[form.region];
      base.ctdiVol = parseFloat(form.ctdiVol) || undefined;
      base.dlp     = parseFloat(form.dlp)     || undefined;
      base.drlCtdi = drl?.ctdi;
      base.drlDlp  = drl?.dlp;
    } else if (form.modalitas === "Konvensional" || form.modalitas === "Mammografi") {
      base.entrance    = parseFloat(form.entrance) || undefined;
      base.drlEntrance = DRL_ENTRANCE[form.region];
    } else {
      base.dap         = parseFloat(form.dap)         || undefined;
      base.waktuFluoro = parseFloat(form.waktuFluoro) || undefined;
    }
    return base;
  }

  const hasDoseVal = form.modalitas === "CT"
    ? (form.ctdiVol || form.dlp)
    : form.modalitas === "Fluoroskopi"
      ? form.dap
      : form.entrance;

  const isValid = form.noRM.trim() && form.namaPasien.trim() && form.tanggal && form.region && hasDoseVal;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className="mb-2 space-y-3 rounded-xl border border-teal-200 bg-linear-to-b from-teal-50 to-white p-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100">
              <Activity size={13} className="text-teal-600" />
            </div>
            <p className="text-[12px] font-bold text-teal-800">Tambah Log Dosis Radiasi</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 transition-colors hover:bg-teal-100">
            <X size={13} className="text-teal-600" />
          </button>
        </div>

        {/* Pasien */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1 text-[10px] font-semibold text-slate-600">No. Rekam Medis <span className="text-rose-500">*</span></p>
            <input value={form.noRM} onChange={(e) => set("noRM", e.target.value)}
              placeholder="RM-2025-XXX" className={inp} />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold text-slate-600">Nama Pasien <span className="text-rose-500">*</span></p>
            <input value={form.namaPasien} onChange={(e) => set("namaPasien", e.target.value)}
              placeholder="Nama lengkap" className={inp} />
          </div>
        </div>

        {/* Tanggal + Modalitas */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1 text-[10px] font-semibold text-slate-600">Tanggal <span className="text-rose-500">*</span></p>
            <input type="date" value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)} className={inp} />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold text-slate-600">Modalitas <span className="text-rose-500">*</span></p>
            <select value={form.modalitas}
              onChange={(e) => set("modalitas", e.target.value as FormModalitas)}
              className={inp + " cursor-pointer"}
            >
              {(["CT", "Konvensional", "Mammografi", "Fluoroskopi"] as FormModalitas[]).map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Region */}
        <div>
          <p className="mb-1 text-[10px] font-semibold text-slate-600">Region / Proyeksi <span className="text-rose-500">*</span></p>
          <select value={form.region} onChange={(e) => set("region", e.target.value)}
            className={inp + " cursor-pointer"}
          >
            <option value="">-- Pilih --</option>
            {REGION_OPTIONS[form.modalitas].map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>

        {/* Dose params */}
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Parameter Dosis</p>
          {form.modalitas === "CT" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1 text-[10px] font-semibold text-slate-600">CTDIvol (mGy)</p>
                <input type="number" step="0.1" min="0" value={form.ctdiVol}
                  onChange={(e) => set("ctdiVol", e.target.value)}
                  placeholder="mis. 28.2" className={inp} />
                {form.region && DRL_CT[form.region] && (
                  <p className="mt-0.5 text-[9px] text-slate-400">DRL: {DRL_CT[form.region].ctdi} mGy</p>
                )}
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold text-slate-600">DLP (mGy·cm)</p>
                <input type="number" step="1" min="0" value={form.dlp}
                  onChange={(e) => set("dlp", e.target.value)}
                  placeholder="mis. 380" className={inp} />
                {form.region && DRL_CT[form.region] && (
                  <p className="mt-0.5 text-[9px] text-slate-400">DRL: {DRL_CT[form.region].dlp} mGy·cm</p>
                )}
              </div>
            </div>
          )}
          {(form.modalitas === "Konvensional" || form.modalitas === "Mammografi") && (
            <div>
              <p className="mb-1 text-[10px] font-semibold text-slate-600">
                {form.modalitas === "Mammografi" ? "MGD (mGy)" : "Entrance Dose (mGy)"}
              </p>
              <input type="number" step="0.01" min="0" value={form.entrance}
                onChange={(e) => set("entrance", e.target.value)}
                placeholder={form.modalitas === "Mammografi" ? "mis. 1.6" : "mis. 0.28"} className={inp} />
              {form.region && DRL_ENTRANCE[form.region] && (
                <p className="mt-0.5 text-[9px] text-slate-400">DRL: {DRL_ENTRANCE[form.region]} mGy</p>
              )}
            </div>
          )}
          {form.modalitas === "Fluoroskopi" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1 text-[10px] font-semibold text-slate-600">DAP (mGy·cm²)</p>
                <input type="number" step="0.1" min="0" value={form.dap}
                  onChange={(e) => set("dap", e.target.value)}
                  placeholder="mis. 45.0" className={inp} />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold text-slate-600">Waktu Fluoro (det)</p>
                <input type="number" step="1" min="0" value={form.waktuFluoro}
                  onChange={(e) => set("waktuFluoro", e.target.value)}
                  placeholder="mis. 120" className={inp} />
              </div>
            </div>
          )}
        </div>

        {/* DRL Preview */}
        <AnimatePresence>
          <DRLPreview form={form} />
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50">
            Batal
          </button>
          <button
            onClick={() => { onSubmit(buildEntry()); onClose(); }}
            disabled={!isValid}
            className="flex-1 rounded-xl bg-teal-600 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-teal-700 disabled:opacity-40"
          >
            Simpan Log
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────

type FilterMod = "Semua" | Modalitas;

export default function DosisPane() {
  const [entries,   setEntries]  = useState<DosisLogEntry[]>(DOSIS_LOG_MOCK);
  const [selId,     setSelId]    = useState<string>(DOSIS_LOG_MOCK[0].id);
  const [filterMod, setFilter]   = useState<FilterMod>("Semua");
  const [showForm,  setShowForm] = useState(false);

  const filtered = useMemo(() =>
    filterMod === "Semua" ? entries : entries.filter((e) => e.modalitas === filterMod),
    [entries, filterMod],
  );

  const selected  = entries.find((e) => e.id === selId) ?? entries[0];
  const exceeded  = entries.filter((e) => e.exceeded).length;

  function handleSubmit(entry: DosisLogEntry) {
    setEntries((prev) => [entry, ...prev]);
    setSelId(entry.id);
  }

  const modalitasOptions: FilterMod[] = ["Semua", "CT", "Konvensional", "Mammografi", "Fluoroskopi"];

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13px] font-bold text-slate-800">Log Dosis Radiasi — DRL Monitoring</p>
          <p className="text-[11px] text-slate-400">Perka BAPETEN No. 2/2018 · PMK 1014/2008 · IAEA Safety Reports 39</p>
        </div>
        <div className="flex items-center gap-2">
          {exceeded > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
              <ShieldAlert size={13} className="text-rose-600" />
              <p className="text-[11px] font-semibold text-rose-700">{exceeded} melebihi DRL</p>
            </div>
          )}
          <button
            onClick={() => setShowForm((p) => !p)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold transition-all",
              showForm
                ? "bg-slate-200 text-slate-700"
                : "bg-teal-600 text-white hover:bg-teal-700",
            )}
          >
            <Plus size={12} /> Tambah Log
          </button>
        </div>
      </div>

      {/* Add Dosis Form */}
      <AnimatePresence>
        {showForm && (
          <AddDosisForm onClose={() => setShowForm(false)} onSubmit={handleSubmit} />
        )}
      </AnimatePresence>

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5">
        {modalitasOptions.map((m) => (
          <button key={m} onClick={() => setFilter(m)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
              filterMod === m
                ? "bg-teal-600 text-white"
                : "border border-slate-200 text-slate-600 hover:border-teal-200 hover:text-teal-700",
            )}>
            {m}
          </button>
        ))}
      </div>

      {/* Two-panel */}
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">

        {/* Left — log list */}
        <div className="flex flex-col gap-2">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Log ({filtered.length} entri)
          </p>
          <div className="flex max-h-130 flex-col gap-2 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {filtered.map((e) => (
                <DoseCard key={e.id} entry={e} active={selId === e.id} onClick={() => setSelId(e.id)} />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right — detail + summary */}
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
            <DoseDetail key={selected.id} entry={selected} />
          </AnimatePresence>
          <DRLSummary entries={entries} />
        </div>
      </div>
    </div>
  );
}
