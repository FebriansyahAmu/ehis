"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SBAR_DEF,
  SHIFT_CONFIG,
  type HandoverEntry,
  type HandoverPatient,
  type Shift,
} from "./handoverShared";

// ── Style constants ───────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300";

const textareaCls =
  "w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300";

// ── Sub-components ────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
        {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function SBARHeader({ idx }: { idx: number }) {
  const item = SBAR_DEF[idx];
  return (
    <div
      className={cn(
        "mb-3 flex items-center gap-2 rounded-xl border px-3 py-2.5",
        item.border,
        item.bg,
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black ring-1",
          item.badge,
          item.ring,
        )}
      >
        {item.key}
      </span>
      <div>
        <p className={cn("text-xs font-bold uppercase tracking-wide", item.text)}>
          {item.label}
        </p>
        <p className="text-[10px] text-slate-400">{item.desc}</p>
      </div>
    </div>
  );
}

// ── Form state ────────────────────────────────────────────

interface FormState {
  perawatKeluar: string;
  perawatMasuk: string;
  jam: string;
  // S
  kondisiUmum: string;
  keluhanAktif: string;
  // B — TTV
  tdSis: string;
  tdDia: string;
  nadi: string;
  suhu: string;
  spo2: string;
  nrs: string;
  tindakanShift: string;
  obatDiberikan: string;
  // A
  masalahAktif: string;
  perubahanKondisi: string;
  // R
  instruksiPending: string;
  halDipantau: string;
  tindakanPending: string;
}

function initForm(patient: HandoverPatient, shift: Shift): FormState {
  const vs = patient.vitalSigns;
  return {
    perawatKeluar: "",
    perawatMasuk: "",
    jam: SHIFT_CONFIG[shift].jam,
    kondisiUmum: "",
    keluhanAktif: "",
    tdSis: String(vs.tdSistolik),
    tdDia: String(vs.tdDiastolik),
    nadi: String(vs.nadi),
    suhu: String(vs.suhu),
    spo2: String(vs.spo2),
    nrs: String(vs.skalaNyeri),
    tindakanShift: "",
    obatDiberikan: "",
    masalahAktif: "",
    perubahanKondisi: "",
    instruksiPending: "",
    halDipantau: "",
    tindakanPending: "",
  };
}

// ── TTV input grid ────────────────────────────────────────

const TTV_FIELDS: { key: keyof FormState; label: string; unit: string }[] = [
  { key: "tdSis",  label: "Sistolik",  unit: "mmHg" },
  { key: "tdDia",  label: "Diastolik", unit: "mmHg" },
  { key: "nadi",   label: "Nadi",      unit: "×/mnt" },
  { key: "suhu",   label: "Suhu",      unit: "°C" },
  { key: "spo2",   label: "SpO₂",      unit: "%" },
  { key: "nrs",    label: "NRS",       unit: "/10" },
];

// ── HandoverForm ──────────────────────────────────────────

interface Props {
  shift: Shift;
  patient: HandoverPatient;
  onSubmit: (entry: Omit<HandoverEntry, "id" | "tanggal">) => void;
  onCancel: () => void;
}

export default function HandoverForm({ shift, patient, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(() => initForm(patient, shift));

  const set = (k: keyof FormState, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Per-section completion
  const metaOk = form.perawatKeluar.trim() !== "" && form.perawatMasuk.trim() !== "";
  const sOk    = form.kondisiUmum.trim() !== "" && form.keluhanAktif.trim() !== "";
  const bOk    = form.tindakanShift.trim() !== "" && form.obatDiberikan.trim() !== "";
  const aOk    = form.masalahAktif.trim() !== "" && form.perubahanKondisi.trim() !== "";
  const rOk    = form.instruksiPending.trim() !== "" && form.halDipantau.trim() !== "";

  const doneFlags = [sOk, bOk, aOk, rOk];
  const doneCount = doneFlags.filter(Boolean).length;
  const canSubmit = metaOk && sOk && bOk && aOk && rOk;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      shift,
      jamSerahTerima: form.jam,
      perawatKeluar: form.perawatKeluar,
      perawatMasuk: form.perawatMasuk,
      kondisiUmum: form.kondisiUmum,
      keluhanAktif: form.keluhanAktif,
      ttvTerakhir: {
        td:   `${form.tdSis}/${form.tdDia}`,
        nadi: Number(form.nadi),
        suhu: Number(form.suhu),
        spo2: Number(form.spo2),
        nrs:  Number(form.nrs),
      },
      tindakanShift: form.tindakanShift,
      obatDiberikan: form.obatDiberikan,
      masalahAktif: form.masalahAktif,
      perubahanKondisi: form.perubahanKondisi,
      instruksiPending: form.instruksiPending,
      halDipantau: form.halDipantau,
      tindakanPending: form.tindakanPending,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-md"
    >
      {/* Form header */}
      <div className="flex items-center justify-between border-b border-indigo-500/20 bg-indigo-600 px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">
            Isi Serah Terima
          </p>
          <p className="text-sm font-bold text-white">SBAR — Shift {shift}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-1.5 text-indigo-200 transition hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      {/* SBAR progress bar */}
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-500">Kelengkapan SBAR</p>
          <p className="text-[11px] font-bold text-indigo-600">{doneCount} / 4 seksi</p>
        </div>
        <div className="flex gap-1.5">
          {SBAR_DEF.map((item, i) => {
            const done = doneFlags[i];
            return (
              <div key={item.key} className="flex flex-1 flex-col items-center gap-1">
                <motion.div
                  className={cn(
                    "h-1.5 w-full rounded-full transition-colors duration-300",
                    done ? item.badge.split(" ")[0] : "bg-slate-200",
                  )}
                  animate={{ opacity: done ? 1 : 0.4 }}
                />
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wide",
                    done ? item.text : "text-slate-300",
                  )}
                >
                  {item.key}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-6 p-4">

        {/* Meta: perawat + jam */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Identitas Serah Terima
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Perawat Keluar" required>
              <input
                value={form.perawatKeluar}
                onChange={(e) => set("perawatKeluar", e.target.value)}
                placeholder="Ns. Nama..."
                className={inputCls}
              />
            </Field>
            <Field label="Perawat Masuk" required>
              <input
                value={form.perawatMasuk}
                onChange={(e) => set("perawatMasuk", e.target.value)}
                placeholder="Ns. Nama..."
                className={inputCls}
              />
            </Field>
            <Field label="Jam Serah Terima">
              <input
                type="time"
                value={form.jam}
                onChange={(e) => set("jam", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* S — Situation */}
        <div>
          <SBARHeader idx={0} />
          <div className="flex flex-col gap-3">
            <Field label="Kondisi Umum" required>
              <textarea
                rows={2}
                value={form.kondisiUmum}
                onChange={(e) => set("kondisiUmum", e.target.value)}
                placeholder="Tingkat kesadaran, kondisi fisik umum, posisi pasien..."
                className={textareaCls}
              />
            </Field>
            <Field label="Keluhan Aktif" required>
              <textarea
                rows={2}
                value={form.keluhanAktif}
                onChange={(e) => set("keluhanAktif", e.target.value)}
                placeholder="Keluhan yang masih dirasakan pasien saat ini..."
                className={textareaCls}
              />
            </Field>
          </div>
        </div>

        {/* B — Background */}
        <div>
          <SBARHeader idx={1} />
          <div className="flex flex-col gap-3">
            {/* TTV grid — auto-populated from latest patient vitalSigns */}
            <Field label="TTV Terakhir Shift Ini">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {TTV_FIELDS.map(({ key, label, unit }) => (
                  <div key={key}>
                    <p className="mb-1 text-[10px] font-semibold text-slate-400">
                      {label}{" "}
                      <span className="text-slate-300">({unit})</span>
                    </p>
                    <input
                      type="number"
                      value={form[key] as string}
                      onChange={(e) => set(key, e.target.value)}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </Field>
            <Field label="Tindakan yang Dilakukan Shift Ini" required>
              <textarea
                rows={2}
                value={form.tindakanShift}
                onChange={(e) => set("tindakanShift", e.target.value)}
                placeholder="Prosedur, monitoring, dan tindakan keperawatan yang sudah dilakukan..."
                className={textareaCls}
              />
            </Field>
            <Field label="Obat yang Telah Diberikan" required>
              <textarea
                rows={2}
                value={form.obatDiberikan}
                onChange={(e) => set("obatDiberikan", e.target.value)}
                placeholder="Nama obat, dosis, jam pemberian sesuai MAR..."
                className={textareaCls}
              />
            </Field>
          </div>
        </div>

        {/* A — Assessment */}
        <div>
          <SBARHeader idx={2} />
          <div className="flex flex-col gap-3">
            <Field label="Masalah Aktif" required>
              <textarea
                rows={2}
                value={form.masalahAktif}
                onChange={(e) => set("masalahAktif", e.target.value)}
                placeholder="Masalah keperawatan / medis yang masih aktif..."
                className={textareaCls}
              />
            </Field>
            <Field label="Perubahan Kondisi Selama Shift" required>
              <textarea
                rows={2}
                value={form.perubahanKondisi}
                onChange={(e) => set("perubahanKondisi", e.target.value)}
                placeholder="Perubahan signifikan: hasil lab baru, perubahan TTV, respons terapi..."
                className={textareaCls}
              />
            </Field>
          </div>
        </div>

        {/* R — Recommendation */}
        <div>
          <SBARHeader idx={3} />
          <div className="flex flex-col gap-3">
            <Field label="Instruksi / Order Pending" required>
              <textarea
                rows={2}
                value={form.instruksiPending}
                onChange={(e) => set("instruksiPending", e.target.value)}
                placeholder="Instruksi dokter yang belum selesai, order lab/rad pending..."
                className={textareaCls}
              />
            </Field>
            <Field label="Hal yang Harus Dipantau" required>
              <textarea
                rows={2}
                value={form.halDipantau}
                onChange={(e) => set("halDipantau", e.target.value)}
                placeholder="Parameter yang perlu diperhatikan shift berikutnya..."
                className={textareaCls}
              />
            </Field>
            <Field label="Tindakan Pending">
              <textarea
                rows={2}
                value={form.tindakanPending}
                onChange={(e) => set("tindakanPending", e.target.value)}
                placeholder="Tindakan yang belum selesai atau harus dilakukan shift berikutnya..."
                className={textareaCls}
              />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition",
              canSubmit
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            <Check size={13} />
            Simpan Serah Terima
          </button>
        </div>
      </div>
    </motion.div>
  );
}
