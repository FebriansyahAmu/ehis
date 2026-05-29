"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Fingerprint, Search, Loader2, ChevronDown, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SearchMode } from "./kepesertaanShared";
import { SAMPLE_KARTU, SAMPLE_NIK } from "./kepesertaanShared";

// ── Props ──────────────────────────────────────────────────

interface CekPesertaFormProps {
  onSubmit: (mode: SearchMode, value: string, tgl: string) => void;
  busy: boolean;
}

// ── Helpers ────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function offsetDate(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}
function validateInput(mode: SearchMode, value: string): string | null {
  if (!value) return "Wajib diisi";
  if (!/^\d+$/.test(value)) return "Hanya angka";
  const required = mode === "kartu" ? 13 : 16;
  if (value.length !== required) return `${value.length} dari ${required} digit`;
  return null;
}

// ── Component ──────────────────────────────────────────────

export default function CekPesertaForm({ onSubmit, busy }: CekPesertaFormProps) {
  const [mode, setMode]             = useState<SearchMode>("kartu");
  const [value, setValue]           = useState("");
  const [tgl, setTgl]               = useState(todayISO);
  const [touched, setTouched]       = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const inputId = useId();
  const dateId  = useId();

  const maxLen = mode === "kartu" ? 13 : 16;
  const err    = touched ? validateInput(mode, value) : null;
  const pct    = Math.min(Math.round((value.length / maxLen) * 100), 100);

  function handleModeSwitch(m: SearchMode) {
    if (m === mode) return;
    setMode(m);
    setValue("");
    setTouched(false);
  }

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setTouched(true);
    if (validateInput(mode, value) || busy) return;
    onSubmit(mode, value, tgl);
  }

  const samples = mode === "kartu" ? SAMPLE_KARTU : SAMPLE_NIK;

  return (
    <div className="flex h-full flex-col">

      {/* ── Panel header ── */}
      <div className="shrink-0 border-b border-slate-100 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">V-Claim</p>
        <h2 className="mt-0.5 text-sm font-semibold text-slate-700">Pencarian Peserta</h2>
      </div>

      {/* ── Form body ── */}
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">

        {/* Mode toggle */}
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-500">Cari berdasarkan</p>
          <div
            role="tablist"
            aria-label="Mode pencarian"
            className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100/70 p-1"
          >
            {(["kartu", "nik"] as const).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleModeSwitch(m)}
                  className={cn(
                    "relative flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                    active ? "text-slate-800" : "text-slate-400 hover:text-slate-600",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="kep-mode-pill"
                      className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-slate-200/50"
                      transition={{ type: "spring", stiffness: 450, damping: 34 }}
                    />
                  )}
                  <span className="relative shrink-0">
                    {m === "kartu"
                      ? <CreditCard size={13} strokeWidth={2.2} />
                      : <Fingerprint size={13} strokeWidth={2.2} />
                    }
                  </span>
                  <span className="relative">{m === "kartu" ? "No. Kartu" : "NIK KTP"}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Number input */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor={inputId} className="text-xs font-semibold text-slate-600">
              {mode === "kartu" ? "Nomor Kartu BPJS" : "NIK KTP"}
            </label>
            <span className={cn(
              "text-xs tabular-nums font-medium transition-colors",
              value.length === maxLen ? "text-emerald-500" : "text-slate-400",
            )}>
              {value.length}/{maxLen}
            </span>
          </div>
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={maxLen}
            placeholder={mode === "kartu" ? "0001234567891" : "3171010103700001"}
            value={value}
            autoComplete="off"
            onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, maxLen))}
            onBlur={() => setTouched(true)}
            className={cn(
              "w-full rounded-xl border px-3.5 py-2.5 font-mono text-sm text-slate-800 placeholder:font-sans placeholder:text-slate-300 transition-all focus:outline-none focus:ring-2",
              err
                ? "border-rose-300 bg-rose-50/30 focus:ring-rose-100"
                : "border-slate-200 bg-white focus:border-sky-300 focus:ring-sky-100",
            )}
          />
          {/* Digit progress bar */}
          <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className={cn("h-full rounded-full", pct >= 100 ? "bg-emerald-400" : "bg-sky-400")}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
            />
          </div>
          <AnimatePresence mode="wait">
            {err && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.14 }}
                className="mt-1.5 text-xs font-medium text-rose-500"
              >
                {err}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Tanggal SEP */}
        <div>
          <label htmlFor={dateId} className="mb-1.5 block text-xs font-semibold text-slate-600">
            Tanggal SEP
          </label>
          <input
            id={dateId}
            type="date"
            value={tgl}
            min={offsetDate(-7)}
            max={offsetDate(30)}
            onChange={(e) => setTgl(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition-all focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
          <p className="mt-1 text-xs text-slate-400">Rentang: 7 hari lalu — 30 hari ke depan</p>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={busy}
          whileTap={!busy ? { scale: 0.98 } : undefined}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2",
            busy
              ? "cursor-wait bg-sky-300 text-white"
              : "bg-sky-500 text-white shadow-md shadow-sky-200/50 hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-300/40",
          )}
        >
          {busy ? (
            <><Loader2 size={14} strokeWidth={2.3} className="animate-spin" />Memverifikasi…</>
          ) : (
            <><Search size={14} strokeWidth={2.3} />Cek Kepesertaan</>
          )}
        </motion.button>

        {/* Contoh data — collapsible */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowSamples((v) => !v)}
            className="flex w-full items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
          >
            <Info size={11} />
            <span className="flex-1 text-left">Contoh data uji</span>
            <motion.span
              animate={{ rotate: showSamples ? 180 : 0 }}
              transition={{ duration: 0.18 }}
            >
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
                <div className="mt-2 flex flex-wrap gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
                  {samples.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => { setValue(s.value); setTouched(false); }}
                      className="rounded-lg bg-white px-2.5 py-1 font-mono text-xs text-slate-600 ring-1 ring-slate-200 transition-colors hover:text-sky-700 hover:ring-sky-300"
                    >
                      {s.label}
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
