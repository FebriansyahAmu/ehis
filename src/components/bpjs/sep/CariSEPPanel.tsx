"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, Loader2, ChevronDown, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { validateNoSEP, SAMPLE_SEP } from "./sepShared";

interface CariSEPPanelProps {
  onSubmit: (noSEP: string) => void;
  busy: boolean;
}

export default function CariSEPPanel({ onSubmit, busy }: CariSEPPanelProps) {
  const [value, setValue]             = useState("");
  const [touched, setTouched]         = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const inputId = useId();

  const err = touched ? validateNoSEP(value) : null;

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setTouched(true);
    if (validateNoSEP(value) || busy) return;
    onSubmit(value.trim());
  }

  return (
    <div className="flex h-full flex-col">

      {/* Panel header */}
      <div className="shrink-0 border-b border-slate-100 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">V-Claim</p>
        <h2 className="mt-0.5 text-sm font-semibold text-slate-700">Pencarian SEP</h2>
      </div>

      {/* Form body */}
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">

        {/* Context info */}
        <div className="rounded-xl bg-emerald-50/70 px-3.5 py-3 ring-1 ring-emerald-100">
          <div className="flex items-start gap-2">
            <FileText size={13} className="mt-0.5 shrink-0 text-emerald-500" strokeWidth={2} />
            <p className="text-xs leading-relaxed text-emerald-700">
              Cari SEP untuk melihat detail lengkap, verifikasi status kepesertaan, atau melakukan penghapusan SEP via V-Claim BPJS.
            </p>
          </div>
        </div>

        {/* No SEP input */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor={inputId} className="text-xs font-semibold text-slate-600">
              Nomor SEP
            </label>
            <span className="text-xs tabular-nums text-slate-400">{value.length} karakter</span>
          </div>
          <input
            id={inputId}
            type="text"
            placeholder="SEP-2026-0501-00012"
            value={value}
            autoComplete="off"
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
            className={cn(
              "w-full rounded-xl border px-3.5 py-2.5 font-mono text-sm text-slate-800 placeholder:font-sans placeholder:text-slate-300 transition-all focus:outline-none focus:ring-2",
              err
                ? "border-rose-300 bg-rose-50/30 focus:ring-rose-100"
                : "border-slate-200 bg-white focus:border-emerald-300 focus:ring-emerald-100",
            )}
          />
          <AnimatePresence mode="wait">
            {err && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.14 }}
                className="mt-1.5 text-xs font-medium text-rose-500"
              >
                {err}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={busy}
          whileTap={!busy ? { scale: 0.98 } : undefined}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2",
            busy
              ? "cursor-wait bg-emerald-300 text-white"
              : "bg-emerald-500 text-white shadow-md shadow-emerald-200/50 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-300/40",
          )}
        >
          {busy
            ? <><Loader2 size={14} strokeWidth={2.3} className="animate-spin" />Mencari SEP…</>
            : <><Search size={14} strokeWidth={2.3} />Cari SEP</>
          }
        </motion.button>

        {/* Dev sample — collapsible */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowSamples((v) => !v)}
            className="flex w-full items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
          >
            <Info size={11} />
            <span className="flex-1 text-left">Contoh No. SEP (dev helper)</span>
            <motion.span animate={{ rotate: showSamples ? 180 : 0 }} transition={{ duration: 0.18 }}>
              <ChevronDown size={11} />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {showSamples && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 flex flex-col gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
                  {SAMPLE_SEP.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => { setValue(s.value); setTouched(false); }}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-left ring-1 ring-slate-200 transition-colors hover:text-emerald-700 hover:ring-emerald-300"
                    >
                      <span className="text-xs font-medium text-slate-500 shrink-0">{s.label}</span>
                      <span className="truncate font-mono text-xs text-slate-600">{s.value}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </form>
    </div>
  );
}
