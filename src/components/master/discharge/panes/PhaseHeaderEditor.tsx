"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type PhaseDefinition, type PhaseColor,
  PHASE_COLOR_CFG,
} from "@/lib/master/dischargeKlasifikasiMock";

interface Props {
  phase: PhaseDefinition;
  onSave: (patch: Partial<PhaseDefinition>) => void;
  onCancel: () => void;
}

const COLOR_OPTIONS: PhaseColor[] = ["sky", "emerald", "amber"];

export default function PhaseHeaderEditor({ phase, onSave, onCancel }: Props) {
  const [fase, setFase] = useState(phase.fase);
  const [desc, setDesc] = useState(phase.desc);
  const [standar, setStandar] = useState(phase.standar);
  const [color, setColor] = useState<PhaseColor>(phase.color);

  const canSave = fase.trim().length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <input
        type="text"
        value={fase}
        onChange={(e) => setFase(e.target.value)}
        placeholder="Nama fase"
        autoFocus
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[13px] font-bold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
      />
      <input
        type="text"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Deskripsi"
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10.5px] text-slate-700 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          type="text"
          value={standar}
          onChange={(e) => setStandar(e.target.value)}
          placeholder="Standar (mis. SNARS ARK 5)"
          className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
        />
        <div className="flex gap-0.5">
          {COLOR_OPTIONS.map((c) => {
            const cfg = PHASE_COLOR_CFG[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md border transition",
                  c === color
                    ? cn(cfg.border, "ring-2", cfg.ring)
                    : "border-slate-200 hover:border-slate-300",
                )}
                aria-label={`Warna ${cfg.label}`}
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", cfg.dot)} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-1 flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Batal"
        >
          <X size={12} />
        </button>
        <button
          type="button"
          onClick={() => canSave && onSave({ fase, desc, standar, color })}
          disabled={!canSave}
          className={cn(
            "flex items-center gap-1 rounded-md px-2.5 py-1 text-[10.5px] font-semibold text-white shadow-sm transition",
            canSave ? "bg-emerald-600 hover:bg-emerald-700" : "cursor-not-allowed bg-slate-300",
          )}
        >
          <Check size={11} />
          Simpan
        </button>
      </div>
    </div>
  );
}
