"use client";

/**
 * KamarMappingForm — modal CRUD untuk BP7.2 MapKelas.
 *
 * Mode: "add" (tambah baru) | "edit" (ubah existing).
 * Validation:
 *   - kdKelasBPJS + kdKelasLokal wajib dipilih
 *   - No duplikat pair (kdKelasBPJS, kdKelasLokal) — skip id sendiri saat edit
 *   - multiplier > 0
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  KELAS_LOKAL_OPTIONS,
  kelasLokalLabel,
  kelasBPJSLabel,
  multiplierBadgeCls,
  multiplierLabel,
  isDuplicateMapping,
  type MapRowLocal,
} from "./aplicaresShared";
import type { KelasRawat } from "@/lib/eklaim/eklaimShared";

// ── Kelas BPJS options for select ─────────────────────

const KELAS_BPJS_OPTIONS = ["VIP", "1", "2", "3"] as const;
type KelasBPJSOpt = (typeof KELAS_BPJS_OPTIONS)[number];

// ── Props ──────────────────────────────────────────────

export interface KamarMappingFormProps {
  open: boolean;
  mode: "add" | "edit";
  initial?: MapRowLocal;
  existingRows: MapRowLocal[];
  onClose: () => void;
  onSave: (row: Omit<MapRowLocal, "id">, id?: string) => void;
}

// ── Form state ─────────────────────────────────────────

interface FormState {
  kdKelasBPJS: KelasBPJSOpt | "";
  kdKelasLokal: KelasRawat | "";
  multiplier: string; // string to allow decimal input
}

// ── Field components ───────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500">
      {children}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 text-[10px] text-rose-600"
    >
      <AlertCircle size={10} />
      {msg}
    </motion.p>
  );
}

// ── Modal ──────────────────────────────────────────────

export default function KamarMappingForm({
  open, mode, initial, existingRows, onClose, onSave,
}: KamarMappingFormProps) {
  const [form, setForm] = useState<FormState>({
    kdKelasBPJS: "",
    kdKelasLokal: "",
    multiplier: "1.00",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  // Pre-fill for edit mode
  useEffect(() => {
    if (open && mode === "edit" && initial) {
      setForm({
        kdKelasBPJS: initial.kdKelasBPJS as KelasBPJSOpt,
        kdKelasLokal: initial.kdKelasLokal,
        multiplier: initial.multiplier.toFixed(2),
      });
    } else if (open && mode === "add") {
      setForm({ kdKelasBPJS: "", kdKelasLokal: "", multiplier: "1.00" });
    }
    setErrors({});
    setSubmitted(false);
  }, [open, mode, initial]);

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};

    if (!form.kdKelasBPJS)  errs.kdKelasBPJS  = "Pilih kelas BPJS";
    if (!form.kdKelasLokal) errs.kdKelasLokal = "Pilih kelas lokal RS";

    const m = parseFloat(form.multiplier);
    if (isNaN(m) || m <= 0) errs.multiplier = "Multiplier harus > 0";

    if (form.kdKelasBPJS && form.kdKelasLokal) {
      const dup = isDuplicateMapping(
        existingRows,
        form.kdKelasBPJS,
        form.kdKelasLokal as KelasRawat,
        mode === "edit" ? initial?.id : undefined,
      );
      if (dup) errs.kdKelasLokal = "Kombinasi kelas BPJS + lokal sudah ada";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    setSubmitted(true);
    if (!validate()) return;

    onSave(
      {
        kdKelasBPJS:   form.kdKelasBPJS as string,
        namaKelasBPJS: kelasBPJSLabel(form.kdKelasBPJS as string),
        kdKelasLokal:  form.kdKelasLokal as KelasRawat,
        namaKelasLokal: kelasLokalLabel(form.kdKelasLokal as KelasRawat),
        multiplier:    parseFloat(form.multiplier),
      },
      mode === "edit" ? initial?.id : undefined,
    );
  }

  const mNum = parseFloat(form.multiplier);
  const mPreview = !isNaN(mNum) && mNum > 0 ? mNum : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}
      {open && (
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-pink-600">
                    Aplicares · Map Kelas
                  </p>
                  <h2 className="text-sm font-bold text-slate-900">
                    {mode === "add" ? "Tambah Mapping Kelas" : "Edit Mapping Kelas"}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Form body */}
              <div className="flex flex-col gap-4 p-4">
                {/* Kelas BPJS */}
                <div className="flex flex-col gap-1.5">
                  <Label required>Kelas BPJS</Label>
                  <select
                    value={form.kdKelasBPJS}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, kdKelasBPJS: e.target.value as KelasBPJSOpt | "" }));
                      if (submitted) validate();
                    }}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none",
                      "focus:border-pink-400 focus:ring-2 focus:ring-pink-100",
                      errors.kdKelasBPJS ? "border-rose-300" : "border-slate-200",
                    )}
                  >
                    <option value="">— Pilih kelas —</option>
                    {KELAS_BPJS_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k} — {kelasBPJSLabel(k)}
                      </option>
                    ))}
                  </select>
                  <AnimatePresence>
                    {errors.kdKelasBPJS && <FieldError msg={errors.kdKelasBPJS} />}
                  </AnimatePresence>
                </div>

                {/* Kelas Lokal */}
                <div className="flex flex-col gap-1.5">
                  <Label required>Kelas RS Lokal</Label>
                  <select
                    value={form.kdKelasLokal}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, kdKelasLokal: e.target.value as KelasRawat | "" }));
                      if (submitted) validate();
                    }}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none",
                      "focus:border-pink-400 focus:ring-2 focus:ring-pink-100",
                      errors.kdKelasLokal ? "border-rose-300" : "border-slate-200",
                    )}
                  >
                    <option value="">— Pilih kelas lokal —</option>
                    {KELAS_LOKAL_OPTIONS.map((k) => (
                      <option key={k} value={k}>{kelasLokalLabel(k)}</option>
                    ))}
                  </select>
                  <AnimatePresence>
                    {errors.kdKelasLokal && <FieldError msg={errors.kdKelasLokal} />}
                  </AnimatePresence>
                </div>

                {/* Multiplier */}
                <div className="flex flex-col gap-1.5">
                  <Label required>Multiplier Tarif</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.01"
                      step="0.05"
                      value={form.multiplier}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, multiplier: e.target.value }));
                        if (submitted) validate();
                      }}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none",
                        "focus:border-pink-400 focus:ring-2 focus:ring-pink-100",
                        errors.multiplier ? "border-rose-300" : "border-slate-200",
                      )}
                    />
                    {mPreview !== null && (
                      <span className={cn(
                        "rounded-lg px-2.5 py-1.5 text-[11px] font-bold tabular-nums",
                        multiplierBadgeCls(mPreview),
                      )}>
                        {multiplierLabel(mPreview)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {">"} 1 = naik kelas · = 1 = standar · {"<"} 1 = turun kelas
                  </p>
                  <AnimatePresence>
                    {errors.multiplier && <FieldError msg={errors.multiplier} />}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 rounded-lg bg-pink-600 px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-pink-700 active:scale-[0.98]"
                >
                  <Save size={11} />
                  {mode === "add" ? "Tambah" : "Simpan"}
                </button>
              </div>
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  );
}
