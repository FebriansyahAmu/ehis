"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/shared/inputs/Select";
import {
  SUMBER_OPTS, SUMBER_CFG, FASE_OPTS, FASE_CFG, PRIORITAS_OPTS, PRIORITAS_CFG,
  type MasalahInput, type SumberDTO, type FaseDTO, type PrioritasDTO,
} from "./carePlanShared";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

const labelCls = "mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400";

const SUMBER_OPTIONS = SUMBER_OPTS.map((s) => ({ value: s, label: SUMBER_CFG[s].label }));
const FASE_OPTIONS = [{ value: "", label: "—" }, ...FASE_OPTS.map((f) => ({ value: f, label: FASE_CFG[f].label }))];
const PRIORITAS_OPTIONS = [{ value: "", label: "—" }, ...PRIORITAS_OPTS.map((p) => ({ value: p, label: PRIORITAS_CFG[p].label }))];

interface Props {
  busy?: boolean;
  onSubmit: (input: MasalahInput) => void;
  onCancel: () => void;
}

export default function MasalahForm({ busy, onSubmit, onCancel }: Props) {
  const [masalah, setMasalah] = useState("");
  const [sumber, setSumber] = useState<SumberDTO>("Manual");
  const [refKode, setRefKode] = useState("");
  const [fase, setFase] = useState<FaseDTO | "">("");
  const [prioritas, setPrioritas] = useState<PrioritasDTO | "">("");

  const valid = masalah.trim().length > 0;

  function submit() {
    if (!valid || busy) return;
    onSubmit({
      masalah: masalah.trim(),
      sumber,
      refKode: refKode.trim() || undefined,
      fase: fase || undefined,
      prioritas: prioritas || undefined,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.22 }}
      className="overflow-hidden"
    >
      <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Masalah / Diagnosis Aktif Baru</p>

        {/* Masalah */}
        <textarea
          rows={2}
          value={masalah}
          onChange={(e) => setMasalah(e.target.value)}
          placeholder="Rumusan masalah / diagnosis aktif. mis. Penurunan curah jantung b.d. perubahan afterload"
          className={cn(inputCls, "resize-none")}
          autoFocus
        />

        {/* Sumber + ref kode */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className={labelCls}>Sumber Masalah</p>
            <Select value={sumber} onChange={(v) => setSumber(v as SumberDTO)} options={SUMBER_OPTIONS} />
          </div>
          <div>
            <p className={labelCls}>Kode Rujuk (ICD/SDKI, opsional)</p>
            <input value={refKode} onChange={(e) => setRefKode(e.target.value)} placeholder="mis. I50.0 / D.0008" className={inputCls} />
          </div>
        </div>

        {/* Fase + prioritas */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className={labelCls}>Fase (opsional)</p>
            <Select value={fase} onChange={(v) => setFase(v as FaseDTO | "")} options={FASE_OPTIONS} placeholder="—" />
          </div>
          <div>
            <p className={labelCls}>Prioritas (opsional)</p>
            <Select value={prioritas} onChange={(v) => setPrioritas(v as PrioritasDTO | "")} options={PRIORITAS_OPTIONS} placeholder="—" />
          </div>
        </div>

        {/* Aksi */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            <X size={13} /> Batal
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid || busy}
            className="flex h-8 items-center gap-1 rounded-lg bg-sky-600 px-4 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:opacity-40"
          >
            <Check size={13} /> Tambah Masalah
          </button>
        </div>
      </div>
    </motion.div>
  );
}
