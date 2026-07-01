"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/shared/inputs/Select";
import {
  PPA_DEFS, GOAL_STATUS_OPTS, GOAL_STATUS_CFG,
  type GoalInput, type CarePlanGoalDTO, type PpaDTO, type GoalStatusDTO,
} from "./carePlanShared";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

const PPA_OPTIONS = PPA_DEFS.map((p) => ({ value: p.value, label: p.label }));
const STATUS_OPTIONS = GOAL_STATUS_OPTS.map((s) => ({ value: s, label: GOAL_STATUS_CFG[s].label }));

const labelCls = "mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400";

interface Props {
  initial?: CarePlanGoalDTO;
  defaultPpa?: PpaDTO;
  busy?: boolean;
  onSubmit: (input: GoalInput) => void;
  onCancel: () => void;
}

export default function GoalForm({ initial, defaultPpa, busy, onSubmit, onCancel }: Props) {
  const [ppa, setPpa] = useState<PpaDTO>(initial?.ppa ?? defaultPpa ?? "DPJP");
  const [target, setTarget] = useState(initial?.target ?? "");
  const [indikator, setIndikator] = useState(initial?.indikator ?? "");
  const [targetWaktu, setTargetWaktu] = useState(initial?.targetWaktu ?? "");
  const [status, setStatus] = useState<GoalStatusDTO>(initial?.status ?? "Belum_Tercapai");
  const [evaluasi, setEvaluasi] = useState(initial?.evaluasi ?? "");

  const valid = target.trim().length > 0;

  function submit() {
    if (!valid || busy) return;
    onSubmit({
      ppa,
      target: target.trim(),
      indikator: indikator.trim(),
      targetWaktu: targetWaktu.trim(),
      status,
      evaluasi: evaluasi.trim(),
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="flex flex-col gap-2.5 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
        {/* PPA + target waktu */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className={labelCls}>PPA Penanggung Jawab</p>
            <Select value={ppa} onChange={(v) => setPpa(v as PpaDTO)} options={PPA_OPTIONS} />
          </div>
          <div>
            <p className={labelCls}>Batas Waktu</p>
            <input value={targetWaktu} onChange={(e) => setTargetWaktu(e.target.value)} placeholder="mis. 3×24 jam" className={inputCls} />
          </div>
        </div>

        {/* Target outcome */}
        <div>
          <p className={labelCls}>Target Outcome (terukur)</p>
          <textarea
            rows={2}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Hasil yang ingin dicapai, terukur. mis. Sesak berkurang, SpO₂ ≥95% udara ruang"
            className={cn(inputCls, "resize-none")}
          />
        </div>

        {/* Indikator + status */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className={labelCls}>Indikator / Parameter</p>
            <input value={indikator} onChange={(e) => setIndikator(e.target.value)} placeholder="mis. RR, SpO₂, skor NRS" className={inputCls} />
          </div>
          <div>
            <p className={labelCls}>Status</p>
            <Select value={status} onChange={(v) => setStatus(v as GoalStatusDTO)} options={STATUS_OPTIONS} />
          </div>
        </div>

        {/* Evaluasi (opsional) */}
        <div>
          <p className={labelCls}>Evaluasi (opsional)</p>
          <textarea
            rows={2}
            value={evaluasi}
            onChange={(e) => setEvaluasi(e.target.value)}
            placeholder="Catatan ketercapaian / hambatan saat review..."
            className={cn(inputCls, "resize-none")}
          />
        </div>

        {/* Aksi */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            <X size={12} /> Batal
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid || busy}
            className="flex h-7 items-center gap-1 rounded-lg bg-sky-600 px-3 text-[11px] font-semibold text-white transition hover:bg-sky-700 disabled:opacity-40"
          >
            <Check size={12} /> {initial ? "Simpan" : "Tambah Goal"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
