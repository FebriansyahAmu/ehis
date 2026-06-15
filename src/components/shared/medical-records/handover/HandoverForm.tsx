"use client";

// Form Serah Terima Shift — COMPACT. 4 field SBAR konsolidasi + meta minimal.
// Perawat Keluar = sesi login (read-only). Penerima diisi nanti via aksi "Terima".
// Waktu = DateTimePicker global. Aksen sky.

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/shared/inputs/DateTimePicker";
import {
  SBAR_DEF,
  SHIFT_CONFIG,
  type HandoverEntry,
  type Shift,
} from "./handoverShared";

const textareaCls =
  "w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100";

// huruf SBAR ⇄ field konsolidasi (urutan = SBAR_DEF)
const SBAR_KEYS = ["situation", "background", "assessment", "recommendation"] as const;
type SbarKey = (typeof SBAR_KEYS)[number];

interface Props {
  shift: Shift;
  /** perawat keluar = penyusun handover (sesi login) — read-only */
  perawatKeluar: string;
  /** tanggal terpilih (ISO) → default waktu serah terima */
  date: string;
  /** penerima diisi saat aksi "Terima" → entry baru selalu belum diterima */
  onSubmit: (entry: Omit<HandoverEntry, "id" | "perawatMasuk" | "jamTerima">) => void;
  onCancel: () => void;
}

export default function HandoverForm({ shift, perawatKeluar, date, onSubmit, onCancel }: Props) {
  const [waktu, setWaktu] = useState(`${date}T${SHIFT_CONFIG[shift].jam}`);
  const [sbar, setSbar] = useState<Record<SbarKey, string>>({
    situation: "",
    background: "",
    assessment: "",
    recommendation: "",
  });
  const setField = (k: SbarKey, v: string) => setSbar((p) => ({ ...p, [k]: v }));

  const doneFlags = SBAR_KEYS.map((k) => sbar[k].trim() !== "");
  const doneCount = doneFlags.filter(Boolean).length;
  const canSubmit = doneFlags.every(Boolean);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const [tgl, tm] = waktu.split("T");
    onSubmit({
      tanggal: tgl || date,
      shift,
      jamSerahTerima: (tm ?? "").slice(0, 5) || SHIFT_CONFIG[shift].jam,
      perawatKeluar,
      situation: sbar.situation.trim(),
      background: sbar.background.trim(),
      assessment: sbar.assessment.trim(),
      recommendation: sbar.recommendation.trim(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sky-500/20 bg-sky-600 px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-100">Isi Serah Terima</p>
          <p className="text-sm font-bold text-white">SBAR — Shift {shift}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-1.5 text-sky-100 transition hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress SBAR */}
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-500">Kelengkapan SBAR</p>
          <p className="text-[11px] font-bold text-sky-600">{doneCount} / 4</p>
        </div>
        <div className="flex gap-1.5">
          {SBAR_DEF.map((item, i) => (
            <div key={item.key} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  "h-1.5 w-full rounded-full transition-colors duration-300",
                  doneFlags[i] ? item.badge.split(" ")[0] : "bg-slate-200",
                )}
              />
              <span
                className={cn(
                  "text-[9px] font-bold uppercase tracking-wide",
                  doneFlags[i] ? item.text : "text-slate-300",
                )}
              >
                {item.key}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Meta */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Perawat Keluar (Anda)
            </label>
            <div className="flex h-9 items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3">
              <User size={13} className="shrink-0 text-sky-500" />
              <span className="truncate text-xs font-semibold text-sky-800">{perawatKeluar || "—"}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Waktu Serah Terima
            </label>
            <DateTimePicker value={waktu} onChange={setWaktu} />
          </div>
        </div>

        {/* SBAR — 1 field per huruf */}
        {SBAR_DEF.map((item, i) => {
          const k = SBAR_KEYS[i];
          return (
            <div key={item.key}>
              <div className={cn("mb-2 flex items-center gap-2 rounded-xl border px-3 py-2", item.border, item.bg)}>
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ring-1",
                    item.badge,
                    item.ring,
                  )}
                >
                  {item.key}
                </span>
                <div>
                  <p className={cn("text-[11px] font-bold uppercase tracking-wide", item.text)}>{item.label}</p>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </div>
              </div>
              <textarea
                rows={2}
                value={sbar[k]}
                onChange={(e) => setField(k, e.target.value)}
                placeholder={item.placeholder}
                className={textareaCls}
              />
            </div>
          );
        })}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
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
                ? "bg-sky-600 text-white shadow-sm shadow-sky-200 hover:bg-sky-700"
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
