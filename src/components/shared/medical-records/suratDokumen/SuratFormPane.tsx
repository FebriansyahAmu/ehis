"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, RotateCcw, CheckCircle2, User, Hash, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type JenisSurat, type SuratPatient, type SuratDibuat,
  type FormField, SURAT_CONFIG, COLOR_MAP,
  genSuratId, genNomorSurat,
} from "./suratDokumenShared";

// ── Types ─────────────────────────────────────────────────

interface Props {
  jenis:    JenisSurat;
  patient:  SuratPatient;
  onSubmit: (surat: SuratDibuat) => void;
}

// ── Sub-components ────────────────────────────────────────

function InfoChip({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={11} className="shrink-0 text-slate-400" />
      <span className="text-[11px] text-slate-500">
        <span className="font-semibold text-slate-700">{label}</span>{" "}{value}
      </span>
    </div>
  );
}

function FieldInput({
  field, value, onChange, ringCls,
}: {
  field:    FormField;
  value:    string;
  onChange: (v: string) => void;
  ringCls:  string;
}) {
  const base = cn(
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800",
    "placeholder:text-slate-300 transition focus:border-transparent focus:outline-none focus:ring-2",
    ringCls,
  );

  if (field.type === "textarea") {
    return (
      <textarea
        rows={field.rows ?? 3}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        className={cn(base, "resize-none")}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className={base}>
        <option value="">— Pilih —</option>
        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  return (
    <input
      type={field.type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      className={base}
    />
  );
}

// ── Main ─────────────────────────────────────────────────

export default function SuratFormPane({ jenis, patient, onSubmit }: Props) {
  const config   = SURAT_CONFIG[jenis];
  const colorCls = COLOR_MAP[config.colorBase];

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    config.fields.forEach(f => {
      if (f.autoFill) {
        const val = patient[f.autoFill];
        if (val !== undefined && val !== null) init[f.id] = String(val);
      }
    });
    return init;
  });

  const [submitted, setSubmitted] = useState(false);

  function handleChange(id: string, val: string) {
    setValues(p => ({ ...p, [id]: val }));
  }

  function handleReset() {
    const init: Record<string, string> = {};
    config.fields.forEach(f => {
      if (f.autoFill) {
        const val = patient[f.autoFill];
        if (val !== undefined && val !== null) init[f.id] = String(val);
      }
    });
    setValues(init);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const surat: SuratDibuat = {
      id:            genSuratId(),
      jenis,
      nomorSurat:    genNomorSurat(jenis),
      tanggalBuat:   new Date().toISOString().slice(0, 10),
      data:          { ...values },
      dokterPembuat: patient.dokter,
    };
    onSubmit(surat);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      handleReset();
    }, 1800);
  }

  const isValid = config.fields
    .filter(f => f.required)
    .every(f => values[f.id]?.trim());

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
    >
      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-3.5">
        <p className="text-sm font-semibold text-slate-700">{config.label}</p>
        <p className="mt-0.5 text-xs text-slate-400">{config.description}</p>
      </div>

      {/* Patient strip */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
        <InfoChip icon={User}     label="Pasien" value={patient.name} />
        <InfoChip icon={Hash}     label="No RM"  value={patient.noRM} />
        <InfoChip icon={Calendar} label="Dokter" value={patient.dokter} />
      </div>

      {/* Fields */}
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        {config.fields.map(field => (
          <div
            key={field.id}
            className={field.type === "textarea" || config.fields.length === 1 ? "sm:col-span-2" : ""}
          >
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              {field.label}
              {field.required && <span className="ml-1 text-rose-400">*</span>}
            </label>
            <FieldInput
              field={field}
              value={values[field.id] ?? ""}
              onChange={v => handleChange(field.id, v)}
              ringCls={colorCls.ring}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-5 py-3">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white hover:text-slate-600 hover:shadow-xs"
        >
          <RotateCcw size={11} />
          Reset
        </button>

        <motion.button
          type="submit"
          disabled={!isValid || submitted}
          whileTap={isValid && !submitted ? { scale: 0.97 } : {}}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition",
            isValid && !submitted
              ? cn(colorCls.btn, "cursor-pointer")
              : "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none",
          )}
        >
          {submitted ? (
            <>
              <CheckCircle2 size={12} className="text-emerald-300" />
              Surat Dibuat!
            </>
          ) : (
            <>
              <Send size={11} />
              Buat Surat
            </>
          )}
        </motion.button>
      </div>
    </motion.form>
  );
}
