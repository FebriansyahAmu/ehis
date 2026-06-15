"use client";

// Dialog "Selesaikan Kunjungan" (pintu cepat dari header). Mini-form disposisi: jenis + waktu +
// kondisi + catatan, dengan KONFIRMASI EKSTRA (checkbox "paham terkunci") sebelum mengunci rekam
// medis. Untuk disposisi lengkap (per-jenis), gunakan tab Pasien Pulang.

import { useState } from "react";
import { motion } from "framer-motion";
import { X, CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateTimePicker, nowInputValue } from "@/components/shared/inputs/DateTimePicker";
import type { DisposisiInput } from "@/lib/schemas/disposisi/disposisi";

const JENIS: { id: DisposisiInput["jenis"]; label: string }[] = [
  { id: "Pulang", label: "Pulang" },
  { id: "Rawat_Inap", label: "Rawat Inap" },
  { id: "Rujuk", label: "Rujuk" },
  { id: "APS", label: "APS" },
  { id: "Meninggal", label: "Meninggal" },
];
const KONDISI = ["Baik", "Sedang", "Buruk", "Kritis"] as const;

const chip =
  "rounded-lg border px-3 py-1.5 text-xs font-medium transition";
const chipIdle = "border-slate-200 bg-white text-slate-600 hover:bg-slate-50";
const chipSel = "border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";

export default function SelesaikanDialog({
  patientName,
  onSubmit,
  onClose,
}: {
  patientName: string;
  onSubmit: (disposisi: DisposisiInput, waktuSelesai: string) => Promise<void> | void;
  onClose: () => void;
}) {
  const [jenis, setJenis] = useState<DisposisiInput["jenis"] | null>(null);
  const [waktu, setWaktu] = useState(nowInputValue);
  const [kondisi, setKondisi] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [ack, setAck] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSubmit = jenis !== null && kondisi !== null && ack && !saving;

  async function submit() {
    if (!canSubmit) return;
    try {
      setSaving(true);
      await onSubmit(
        {
          jenis: jenis!,
          kondisiUmum: kondisi!,
          instruksi: catatan.trim() || undefined,
          catatan: catatan.trim() || undefined,
        },
        waktu,
      );
      onClose();
    } catch {
      /* toast oleh pemanggil; dialog tetap terbuka */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 bg-emerald-600 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Selesaikan Kunjungan</p>
            <p className="text-sm font-bold text-white">{patientName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-emerald-100 transition hover:bg-white/10 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Disposisi <span className="text-rose-400">*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {JENIS.map((j) => (
                <button key={j.id} type="button" onClick={() => setJenis(j.id)} className={cn(chip, jenis === j.id ? chipSel : chipIdle)}>
                  {j.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Waktu Selesai</label>
            <DateTimePicker value={waktu} onChange={setWaktu} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Kondisi Umum <span className="text-rose-400">*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {KONDISI.map((k) => (
                <button key={k} type="button" onClick={() => setKondisi(k)} className={cn(chip, kondisi === k ? chipSel : chipIdle)}>
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Catatan / Instruksi</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={2}
              placeholder="Instruksi pulang / kontrol (opsional)…"
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Konfirmasi ekstra (kunci) */}
          <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 accent-emerald-600" />
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-amber-800">
              <Lock size={12} className="shrink-0" />
              Saya paham rekam medis akan <b>terkunci</b> setelah diselesaikan.
            </span>
          </label>

          <p className="text-[10px] text-slate-400">Untuk disposisi lengkap (rujukan/kematian/transfer), gunakan tab <b>Pasien Pulang</b>.</p>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Batal</button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-bold text-white transition",
                canSubmit ? "bg-emerald-600 shadow-sm shadow-emerald-200 hover:bg-emerald-700" : "cursor-not-allowed bg-slate-200 text-slate-400",
              )}
            >
              <CheckCircle2 size={13} /> Selesaikan & Kunci
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
