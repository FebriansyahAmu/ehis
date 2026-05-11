"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle, CheckCircle2, ChevronDown, Circle, ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ChecklistItem, type DischargeChecklist,
  isChecklistComplete,
} from "./dischargeShared";

type Props = {
  data:     DischargeChecklist;
  onChange: (d: DischargeChecklist) => void;
};

function ChecklistRow({
  item,
  onChange,
}: {
  item:     ChecklistItem;
  onChange: (u: ChecklistItem) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border transition-all duration-200",
        item.confirmed
          ? "border-emerald-200 bg-emerald-50"
          : item.required
            ? "border-slate-200 bg-white"
            : "border-slate-100 bg-white/70",
      )}
    >
      <div className="flex items-start gap-3 p-3">
        <button
          onClick={() => onChange({ ...item, confirmed: !item.confirmed })}
          className="mt-0.5 shrink-0 transition-transform duration-150 active:scale-90"
        >
          {item.confirmed
            ? <CheckCircle2 size={18} className="text-emerald-500" />
            : <Circle       size={18} className="text-slate-300" />
          }
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={cn(
              "text-[13px] font-semibold",
              item.confirmed
                ? "text-emerald-800 line-through decoration-emerald-400/60"
                : "text-slate-700",
            )}>
              {item.label}
            </p>
            {item.required && !item.confirmed && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-red-600">
                Wajib
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">{item.sublabel}</p>
        </div>

        <button
          onClick={() => setOpen(o => !o)}
          className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <ChevronDown size={14} className={cn("transition-transform duration-200", open && "rotate-180")} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-3 pb-3 pt-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Catatan
              </label>
              <textarea
                value={item.catatan}
                onChange={e => onChange({ ...item, catatan: e.target.value })}
                rows={2}
                placeholder="Tambahkan catatan jika perlu..."
                className="w-full resize-none rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function StepChecklist({ data, onChange }: Props) {
  function updateItem(updated: ChecklistItem) {
    onChange({ ...data, items: data.items.map(i => i.id === updated.id ? updated : i) });
  }

  const required    = data.items.filter(i => i.required);
  const conditional = data.items.filter(i => !i.required);
  const doneCount   = data.items.filter(i => i.confirmed).length;
  const reqDone     = required.filter(i => i.confirmed).length;
  const allReqDone  = isChecklistComplete(data);
  const pct         = Math.round((doneCount / data.items.length) * 100);
  const circleLen   = 163.4;

  return (
    <div className="flex flex-col gap-4 xl:flex-row">

      {/* ── Left: Checklist ── */}
      <div className="min-w-0 flex-1 space-y-3">

        {/* Phase banner */}
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <span className="shrink-0 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Fase 3
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-amber-800">H-1 Pulang — Checklist Kesiapan Pemulangan</p>
            <p className="text-[10px] text-amber-600">Konfirmasi semua poin sehari sebelum kepulangan · Standar SNARS ARK 3</p>
          </div>
        </div>

        {/* Wajib group */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={12} className="text-red-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Wajib Dipenuhi</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-500">{reqDone} / {required.length}</span>
          </div>
          <div className="space-y-2">
            {required.map(item => (
              <ChecklistRow key={item.id} item={item} onChange={updateItem} />
            ))}
          </div>
        </div>

        {/* Kondisional group */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
            <ClipboardCheck size={12} className="text-slate-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Kondisional (jika relevan)</p>
          </div>
          <div className="space-y-2">
            {conditional.map(item => (
              <ChecklistRow key={item.id} item={item} onChange={updateItem} />
            ))}
          </div>
        </div>

        {/* Catatan DPJP */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Catatan DPJP / Instruksi Khusus
          </label>
          <textarea
            value={data.catatanKhusus}
            onChange={e => onChange({ ...data, catatanKhusus: e.target.value })}
            rows={3}
            placeholder="Instruksi khusus dari DPJP sebelum kepulangan..."
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
          />
        </div>

      </div>

      {/* ── Right: Progress sidebar ── */}
      <div className="w-full shrink-0 space-y-3 xl:w-60">

        {/* Donut progress */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Progress Kesiapan</p>
          <div className="mb-3 flex justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#f1f5f9" strokeWidth="7" />
                <motion.circle
                  cx="32" cy="32" r="26" fill="none"
                  stroke={allReqDone ? "#10b981" : "#f59e0b"}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.round((pct / 100) * circleLen)} ${circleLen}`}
                  initial={{ strokeDasharray: `0 ${circleLen}` }}
                  animate={{ strokeDasharray: `${Math.round((pct / 100) * circleLen)} ${circleLen}` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </svg>
              <p className={cn("text-lg font-bold", allReqDone ? "text-emerald-600" : "text-amber-600")}>
                {doneCount}
              </p>
            </div>
          </div>
          <p className="text-center text-[11px] text-slate-500">{doneCount} dari {data.items.length} item</p>
          <div className={cn(
            "mt-3 rounded-lg p-2.5 text-center text-[11px] font-semibold",
            allReqDone ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
          )}>
            {allReqDone
              ? "Semua poin wajib terpenuhi"
              : `${required.length - reqDone} poin wajib belum selesai`
            }
          </div>
        </div>

        {/* Item status list */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status Item</p>
          <div className="space-y-1.5">
            {data.items.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                {item.confirmed
                  ? <CheckCircle2 size={10} className="shrink-0 text-emerald-500" />
                  : <Circle       size={10} className={cn("shrink-0", item.required ? "text-red-300" : "text-slate-300")} />
                }
                <p className={cn(
                  "truncate text-[11px]",
                  item.confirmed ? "text-slate-400 line-through" : item.required ? "text-slate-700" : "text-slate-400",
                )}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
