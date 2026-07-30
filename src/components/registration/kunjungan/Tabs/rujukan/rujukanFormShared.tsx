"use client";

// Primitif presentasional bersama untuk form rujukan registrasi (Kontrol Pasca Ranap ·
// Rujukan Internal). Badge status, kartu field ber-highlight, banner kesiapan, panel
// konfirmasi & layar sukses — semuanya generik agar tampilan konsisten antar sub-menu.

import { motion } from "framer-motion";
import { AlertCircle, Check, CheckCircle2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Badge ────────────────────────────────────────────────────

export type BadgeTone = "wajib" | "opsional" | "sumber" | "otomatis";

const BADGE_CLS: Record<BadgeTone, string> = {
  wajib:    "bg-rose-50 text-rose-600 ring-rose-100",
  opsional: "bg-slate-100 text-slate-500 ring-slate-200",
  sumber:   "bg-sky-50 text-sky-600 ring-sky-100",
  otomatis: "bg-teal-50 text-teal-600 ring-teal-100",
};

export function Badge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide ring-1", BADGE_CLS[tone])}>
      {children}
    </span>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────

/** Header baris tiap seksi: label + badge + indikator "Terisi". */
export function SectionLabel({
  children, badge, hint, done,
}: {
  children: React.ReactNode;
  badge?:   React.ReactNode;
  hint?:    string;
  done?:    boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{children}</p>
      {badge}
      {hint && <span className="text-[9.5px] font-normal normal-case text-slate-300">{hint}</span>}
      {done && (
        <span className="ml-auto flex items-center gap-0.5 text-[9px] font-bold text-emerald-500">
          <Check size={10} /> Terisi
        </span>
      )}
    </div>
  );
}

// ─── FieldCard ────────────────────────────────────────────────

/** Kartu field — background & border menyorot hijau saat terisi. */
export function FieldCard({
  label, badge, hint, done, children,
}: {
  label:    string;
  badge?:   React.ReactNode;
  hint?:    string;
  done?:    boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border p-3 transition-colors duration-200",
        done ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white",
      )}
    >
      <SectionLabel badge={badge} hint={hint} done={done}>{label}</SectionLabel>
      {children}
    </div>
  );
}

// ─── ReadinessBanner ──────────────────────────────────────────

export interface Requirement { ok: boolean; label: string }

function ReqChip({ ok, label }: Requirement) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold ring-1 transition-colors",
        ok ? "bg-emerald-100 text-emerald-700 ring-emerald-200" : "bg-white text-slate-400 ring-slate-200",
      )}
    >
      {ok ? <Check size={10} /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
      {label}
    </span>
  );
}

export function ReadinessBanner({
  reqs, readyLabel, pendingLabel,
}: {
  reqs:         Requirement[];
  readyLabel:   string;
  pendingLabel: string;
}) {
  const ready = reqs.every((r) => r.ok);
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3.5 py-2.5 transition-colors duration-200",
        ready ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50",
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("flex h-6 w-6 items-center justify-center rounded-lg", ready ? "bg-emerald-100" : "bg-slate-200")}>
          {ready ? <CheckCircle2 size={13} className="text-emerald-600" /> : <AlertCircle size={13} className="text-slate-500" />}
        </span>
        <p className={cn("text-[11.5px] font-bold", ready ? "text-emerald-700" : "text-slate-600")}>
          {ready ? readyLabel : pendingLabel}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        {reqs.map((r) => <ReqChip key={r.label} ok={r.ok} label={r.label} />)}
      </div>
    </div>
  );
}

// ─── RujukanConfirmPanel ──────────────────────────────────────

export function RujukanConfirmPanel({
  title, subtitle, rows, warning, confirmLabel, onConfirm, onCancel,
}: {
  title:        string;
  subtitle:     string;
  rows:         [string, string][];
  warning:      React.ReactNode;
  confirmLabel: string;
  onConfirm:    () => void;
  onCancel:     () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div className="overflow-hidden rounded-xl border border-sky-200 bg-sky-50 shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-100 bg-sky-500 px-4 py-3">
          <div>
            <p className="text-[12px] font-bold text-white">{title}</p>
            <p className="text-[9.5px] text-white/70">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-white/15 text-white/80 transition hover:bg-white/25"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 p-4">
          {/* Summary */}
          <div className="space-y-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-sky-100">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-start gap-3">
                <span className="w-24 shrink-0 text-[9.5px] font-bold uppercase tracking-wide text-slate-400">{k}</span>
                <span className="flex-1 text-[11px] font-semibold text-slate-700">{v}</span>
              </div>
            ))}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
            <AlertCircle size={11} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-[10px] leading-relaxed text-amber-700">{warning}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-0.5">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-sky-600 py-2.5 text-[11px] font-bold text-white transition hover:bg-sky-700 active:scale-95"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── RujukanSuccessState ──────────────────────────────────────

export function RujukanSuccessState({
  title, noRujukan, pickedLabel, resetLabel = "Buat Rujukan Lain", onReset,
}: {
  title:       string;
  noRujukan:   string;
  pickedLabel: string;
  resetLabel?: string;
  onReset:     () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center gap-4 py-8 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 18 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100"
      >
        <Check size={24} className="text-emerald-600" />
      </motion.div>

      <div className="space-y-2">
        <p className="text-[14px] font-bold text-slate-800">{title}</p>
        <p className="text-[10.5px] text-slate-400">Nomor rujukan yang dihasilkan:</p>
        <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 px-4 py-2.5">
          <span className="font-mono text-[12px] font-bold text-sky-700">{noRujukan}</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2"
      >
        <CheckCircle2 size={12} className="text-emerald-500" />
        <p className="text-[10.5px] font-semibold text-emerald-700">{pickedLabel}</p>
      </motion.div>

      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        <RotateCcw size={11} />
        {resetLabel}
      </button>
    </motion.div>
  );
}
