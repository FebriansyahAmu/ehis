"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Activity, AlertCircle, Check, CheckCircle2, ChevronDown,
  RotateCcw, Stethoscope, User,
} from "lucide-react";
import type { KunjunganRecord } from "@/lib/data";
import { DiagnosaCombobox } from "./DiagnosaCombobox";
import {
  KODE_RS, NAMA_RS, getIcdName, MOCK_SEP_RANAP, SMF_LIST,
  type IcdOption,
} from "./rujukanTypes";

// ─── Types ────────────────────────────────────────────────────

type SEPState = "idle" | "used";

// ─── PPPKInfoBar ──────────────────────────────────────────────

function PPPKInfoBar({ dokter }: { dokter: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <Activity size={10} className="text-sky-400" />
        <span className="font-mono text-[10.5px] font-bold text-slate-700">{KODE_RS}</span>
        <span className="text-[10px] text-slate-400">{NAMA_RS}</span>
      </div>
      <div className="h-3 w-px bg-slate-200" />
      <div className="flex items-center gap-1.5">
        <User size={10} className="text-sky-400" />
        <span className="text-[10px] text-slate-600">{dokter}</span>
      </div>
    </div>
  );
}

// ─── LastSEPCard ──────────────────────────────────────────────

function LastSEPCard({
  used,
  onUse,
  onManual,
}: {
  used:     boolean;
  onUse:    () => void;
  onManual: () => void;
}) {
  const d = MOCK_SEP_RANAP;
  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        used
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            {used && <Check size={10} className="shrink-0 text-emerald-500" />}
            <span className="font-mono text-[10.5px] font-bold text-slate-700">{d.noSEP}</span>
          </div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-0.5">
            {([
              ["Diagnosa",   `${d.diagnosa} — ${getIcdName(d.diagnosa)}`],
              ["Tgl Keluar", d.tglKeluar],
              ["Kelas",      d.kelas],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k}>
                <p className="text-[8.5px] font-bold uppercase tracking-wide text-slate-400">{k}</p>
                <p className="truncate text-[10px] font-medium text-slate-600">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {!used && (
          <button
            type="button"
            onClick={onUse}
            className="shrink-0 rounded-lg bg-sky-600 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-sky-700"
          >
            Gunakan
          </button>
        )}
      </div>

      {!used && (
        <button
          type="button"
          onClick={onManual}
          className="mt-2 text-[9.5px] text-slate-400 underline underline-offset-2 hover:text-slate-600"
        >
          Input nomor SEP lain
        </button>
      )}
    </div>
  );
}

// ─── ManualSEPInput ───────────────────────────────────────────

function ManualSEPInput({
  value,
  onChange,
  onCancel,
}: {
  value:    string;
  onChange: (v: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Masukkan nomor SEP Rawat Inap…"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[12px] text-slate-800 placeholder:text-slate-300 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
      />
      <button
        type="button"
        onClick={onCancel}
        className="text-[9.5px] text-slate-400 underline underline-offset-2 hover:text-slate-600"
      >
        Gunakan SEP terakhir
      </button>
    </div>
  );
}

// ─── ConfirmPanel ─────────────────────────────────────────────

function ConfirmPanel({
  noSEP,
  diagnosa,
  smf,
  dokter,
  onConfirm,
  onCancel,
}: {
  noSEP:     string;
  diagnosa:  IcdOption;
  smf:       string;
  dokter:    string;
  onConfirm: () => void;
  onCancel:  () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div className="mt-3 overflow-hidden rounded-xl border border-sky-200 bg-sky-50 shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-100 bg-sky-500 px-4 py-3">
          <div>
            <p className="text-[12px] font-bold text-white">Konfirmasi Buat & Pilih Rujukan</p>
            <p className="text-[9.5px] text-white/70">Rujukan akan dibuat dan langsung dipilih untuk SEP Kontrol</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-white/15 text-white/80 transition hover:bg-white/25"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 p-4">
          {/* Summary */}
          <div className="space-y-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-sky-100">
            {([
              ["Kode RS",       KODE_RS],
              ["Dokter DPJP",   dokter],
              ["No. SEP Ranap", noSEP],
              ["Diagnosa",      `${diagnosa.code} — ${diagnosa.name}`],
              ...(smf ? [["SMF", smf] as [string, string]] : []),
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex items-start gap-3">
                <span className="w-24 shrink-0 text-[9.5px] font-bold uppercase tracking-wide text-slate-400">{k}</span>
                <span className="flex-1 text-[11px] font-semibold text-slate-700">{v}</span>
              </div>
            ))}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
            <AlertCircle size={11} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-[10px] leading-relaxed text-amber-700">
              Rujukan kontrol berlaku <strong>1 kali</strong> dan harus digunakan dalam{" "}
              <strong>1 bulan</strong> sejak tanggal keluar rawat inap.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-0.5">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-sky-600 py-2.5 text-[11px] font-bold text-white transition hover:bg-sky-700 active:scale-95"
            >
              Ya, Buat & Pilih
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── SuccessState ─────────────────────────────────────────────

function SuccessState({ noRujukan, onReset }: { noRujukan: string; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center gap-4 py-8 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 18 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100"
      >
        <Check size={24} className="text-emerald-600" />
      </motion.div>

      <div className="space-y-2">
        <p className="text-[14px] font-bold text-slate-800">Rujukan Kontrol Berhasil Dibuat</p>
        <p className="text-[10.5px] text-slate-400">Nomor rujukan yang dihasilkan:</p>
        <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 px-4 py-2.5">
          <span className="font-mono text-[12px] font-bold text-sky-700">{noRujukan}</span>
        </div>
      </div>

      {/* Pilih confirmation badge */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2"
      >
        <CheckCircle2 size={12} className="text-emerald-500" />
        <p className="text-[10.5px] font-semibold text-emerald-700">Dipilih untuk SEP Kontrol Pasca Ranap</p>
      </motion.div>

      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        <RotateCcw size={11} />
        Buat Rujukan Lain
      </button>
    </motion.div>
  );
}

// ─── KontrolPascaRanapForm ────────────────────────────────────

export function KontrolPascaRanapForm({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const [sepState,    setSepState]    = useState<SEPState>("idle");
  const [manualSEP,   setManualSEP]   = useState(false);
  const [noSEPInput,  setNoSEPInput]  = useState("");
  const [smf,         setSmf]         = useState("");
  const [diagnosa,    setDiagnosa]    = useState<IcdOption | null>(null);
  const [catatan,     setCatatan]     = useState("");
  const [confirming,  setConfirming]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [noRujukan,   setNoRujukan]   = useState("");

  const noSEPActive = manualSEP ? noSEPInput.trim() : MOCK_SEP_RANAP.noSEP;
  const sepReady    = manualSEP ? noSEPInput.trim().length >= 10 : sepState === "used";
  const canSubmit   = sepReady && diagnosa !== null;
  const dokter      = kunjungan.dokter ?? "—";

  const handleUseSEP = () => setSepState("used");

  const handleConfirm = () => {
    const ts = Date.now().toString().slice(-6);
    const d  = new Date();
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setNoRujukan(`${KODE_RS}${dd}${mm}${yy}K${ts}`);
    setConfirming(false);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSepState("idle");
    setManualSEP(false);
    setNoSEPInput("");
    setSmf("");
    setDiagnosa(null);
    setCatatan("");
    setConfirming(false);
    setSubmitted(false);
    setNoRujukan("");
  };

  if (submitted) {
    return <SuccessState noRujukan={noRujukan} onReset={handleReset} />;
  }

  return (
    <div className="space-y-4">

      {/* PPPK Info */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Data PPPK Rumah Sakit
        </p>
        <PPPKInfoBar dokter={dokter} />
      </div>

      {/* SEP Rawat Inap Terakhir */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          SEP Rawat Inap
          <span className="ml-1 font-normal normal-case text-slate-300">— dari kunjungan rawat inap sebelumnya</span>
        </p>
        {manualSEP ? (
          <ManualSEPInput
            value={noSEPInput}
            onChange={v => setNoSEPInput(v)}
            onCancel={() => { setManualSEP(false); setNoSEPInput(""); }}
          />
        ) : (
          <LastSEPCard
            used={sepState === "used"}
            onUse={handleUseSEP}
            onManual={() => setManualSEP(true)}
          />
        )}
      </div>

      {/* SMF (optional) */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          SMF
          <span className="ml-1 font-normal normal-case text-slate-300">— opsional</span>
        </p>
        <div className="relative">
          <select
            value={smf}
            onChange={e => setSmf(e.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-[12px] text-slate-800 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          >
            <option value="">— Pilih SMF —</option>
            {SMF_LIST.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300"
          />
        </div>
      </div>

      {/* Diagnosa (required) */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Diagnosa
          <span className="ml-1 font-normal normal-case text-slate-300">— ICD-10, wajib</span>
        </p>
        <DiagnosaCombobox value={diagnosa} onChange={setDiagnosa} />
      </div>

      {/* Catatan (optional) */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Catatan
          <span className="ml-1 font-normal normal-case text-slate-300">— opsional</span>
        </p>
        <textarea
          value={catatan}
          onChange={e => setCatatan(e.target.value)}
          rows={2}
          placeholder="Keterangan tambahan jika diperlukan…"
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 placeholder:text-slate-300 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div className="text-[10px] text-slate-300">
          {!sepReady && "Pilih SEP terlebih dahulu"}
          {sepReady && !diagnosa && "Diagnosa ICD-10 wajib diisi"}
        </div>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => setConfirming(true)}
          className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2.5 text-[12px] font-bold text-white transition hover:bg-sky-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Stethoscope size={13} />
          Buat &amp; Pilih Rujukan
        </button>
      </div>

      {/* Confirm panel (inline) */}
      <AnimatePresence>
        {confirming && diagnosa && (
          <ConfirmPanel
            key="confirm"
            noSEP={noSEPActive}
            diagnosa={diagnosa}
            smf={smf}
            dokter={dokter}
            onConfirm={handleConfirm}
            onCancel={() => setConfirming(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
