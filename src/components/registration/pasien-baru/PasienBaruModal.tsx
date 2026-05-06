"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Check, Loader2, ChevronRight, ChevronLeft, User, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type FormState, type Errors,
  INITIAL_FORM, validateStep, StepContent,
} from "./PasienBaruSteps";

const STEPS = [
  { n: 1, label: "Identitas Diri", sub: "Data diri & demografi",      icon: User   },
  { n: 2, label: "Alamat & Kartu", sub: "Kartu identitas & domisili", icon: MapPin },
  { n: 3, label: "Kontak",         sub: "Penjamin, kontak & darurat", icon: Phone  },
] as const;

// ── Mobile stepper bar (shown only on small screens) ──────────────────────────

function MobileStepper({ current }: { current: number }) {
  return (
    <div className="flex shrink-0 items-center border-b border-slate-100 px-5 py-3 md:hidden">
      {STEPS.map((s, i) => {
        const done   = s.n < current;
        const active = s.n === current;
        const Icon   = s.icon;
        return (
          <div key={s.n} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-300",
                done   ? "bg-emerald-500 text-white"
                : active ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                         : "bg-slate-100 text-slate-400",
              )}>
                {done ? <Check size={12} strokeWidth={2.5} /> : <Icon size={12} />}
              </div>
              <p className={cn(
                "text-[9px] font-bold",
                active ? "text-indigo-600" : done ? "text-emerald-600" : "text-slate-400",
              )}>
                {s.label.split(" ")[0]}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "mx-2 mb-4 h-px flex-1 rounded-full transition-all duration-500",
                done ? "bg-emerald-300" : "bg-slate-200",
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── PasienBaruModal ───────────────────────────────────────────────────────────

export function PasienBaruModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step,        setStep]        = useState(1);
  const [form,        setForm]        = useState<FormState>(INITIAL_FORM);
  const [errors,      setErrors]      = useState<Errors>({});
  const [submitting,  setSubmitting]  = useState(false);
  const [done,        setDone]        = useState(false);
  const [generatedRM, setGeneratedRM] = useState("");

  useEffect(() => {
    if (open) { setStep(1); setForm(INITIAL_FORM); setErrors({}); setDone(false); setGeneratedRM(""); }
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const onChange = useCallback(
    (field: keyof FormState, value: string | string[]) => {
      setForm((p) => ({ ...p, [field]: value } as FormState));
      setErrors((p) => { const n = { ...p }; delete n[field as string]; return n; });
    },
    [],
  );

  function goToStep(n: number) {
    if (n >= step) return;
    setStep(n);
    setErrors({});
  }

  function handleNext() {
    const e = validateStep(step, form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => s - 1);
    setErrors({});
  }

  async function handleSubmit() {
    const e = validateStep(step, form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1400));
    const rm = `RM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
    setGeneratedRM(rm);
    setSubmitting(false);
    setDone(true);
  }

  const initials = form.namaLengkap.trim()
    ? form.namaLengkap.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
    : null;

  const currentStepCfg = STEPS[step - 1];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Form pendaftaran pasien baru"
      onClick={(ev) => { if (ev.target === ev.currentTarget && !submitting) onClose(); }}
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center p-3 transition-all duration-200 sm:items-center sm:p-4",
        open ? "bg-black/40 backdrop-blur-sm" : "pointer-events-none opacity-0",
      )}
    >
      <div className={cn(
        "flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300",
        "max-h-[95vh] sm:max-h-[92vh]",
        open ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-95 opacity-0",
      )}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pendaftaran Pasien Baru</h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {done ? "Pendaftaran berhasil diselesaikan" : "Lengkapi seluruh data pasien dengan benar"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Tutup"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-40"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        {done ? (
          /* ── Success state ─────────────────────────────────────────────── */
          <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto bg-slate-50/30 py-12 text-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <Check size={32} className="text-emerald-600" />
              </div>
              <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-emerald-400 ring-2 ring-white" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">Pasien Berhasil Didaftarkan!</p>
              <p className="mt-1.5 text-sm text-slate-500">
                Nomor Rekam Medis telah diterbitkan secara otomatis.
              </p>
              <div className="mt-6 inline-block rounded-2xl bg-linear-to-br from-indigo-50 to-indigo-100/60 px-10 py-5 ring-1 ring-indigo-200">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                  Nomor Rekam Medis
                </p>
                <p className="mt-2 font-mono text-3xl font-black tracking-wide text-indigo-700">
                  {generatedRM}
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                onClick={() => { setStep(1); setForm(INITIAL_FORM); setErrors({}); setDone(false); }}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.98]"
              >
                Daftarkan Pasien Lain
              </button>
            </div>
          </div>
        ) : (
          /* ── Landscape: sidebar + content ──────────────────────────────── */
          <div className="flex flex-1 overflow-hidden" style={{ minHeight: 460 }}>

            {/* ── Left sidebar (desktop only) ─────────────────────────── */}
            <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-100 bg-slate-50/80 md:flex">

              {/* Dynamic patient avatar */}
              <div className="flex flex-col items-center gap-2.5 border-b border-slate-100 px-4 py-5">
                <div className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full text-lg font-black shadow-sm ring-4 ring-white",
                  form.gender === "L" ? "bg-sky-100 text-sky-700"
                  : form.gender === "P" ? "bg-pink-100 text-pink-700"
                  : "bg-indigo-50 text-indigo-300",
                )}>
                  {initials ?? <User size={22} strokeWidth={1.5} />}
                </div>
                <div className="text-center">
                  {form.namaLengkap.trim() ? (
                    <>
                      <p className="text-[11px] font-bold leading-tight text-slate-800">
                        {form.namaLengkap.trim().split(/\s+/).slice(0, 3).join(" ")}
                      </p>
                      {form.nik.length >= 6 && (
                        <p className="mt-0.5 font-mono text-[9px] text-slate-400">
                          {form.nik.slice(0, 6)}••••••••••
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[11px] italic text-slate-400">Pasien Baru</p>
                  )}
                  {form.gender && (
                    <span className={cn(
                      "mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold",
                      form.gender === "L" ? "bg-sky-100 text-sky-600" : "bg-pink-100 text-pink-600",
                    )}>
                      {form.gender === "L" ? "Laki-laki" : "Perempuan"}
                    </span>
                  )}
                </div>
              </div>

              {/* Step navigation */}
              <nav className="flex flex-col gap-1 p-3">
                {STEPS.map((s) => {
                  const isDone   = s.n < step;
                  const isActive = s.n === step;
                  const SIcon    = s.icon;
                  return (
                    <button
                      key={s.n}
                      type="button"
                      onClick={() => goToStep(s.n)}
                      className={cn(
                        "flex items-start gap-2.5 rounded-xl p-3 text-left transition-all duration-150",
                        isActive  ? "bg-indigo-600 shadow-sm shadow-indigo-200"
                        : isDone  ? "cursor-pointer hover:bg-white hover:shadow-xs"
                                  : "cursor-default pointer-events-none opacity-40",
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition",
                        isActive ? "bg-white/20"
                        : isDone ? "bg-emerald-100"
                                 : "bg-slate-100",
                      )}>
                        {isDone
                          ? <Check size={11} className="text-emerald-600" strokeWidth={2.5} />
                          : <SIcon size={12} className={isActive ? "text-white" : "text-slate-400"} />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className={cn(
                          "text-[11px] font-bold leading-tight",
                          isActive ? "text-white" : isDone ? "text-slate-700" : "text-slate-400",
                        )}>
                          {s.label}
                        </p>
                        <p className={cn(
                          "mt-0.5 text-[10px] leading-tight",
                          isActive ? "text-white/60" : "text-slate-400",
                        )}>
                          {s.sub}
                        </p>
                      </div>
                      {isActive && (
                        <span className="ml-auto mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Progress dots */}
              <div className="mt-auto flex items-center justify-center gap-1.5 px-4 pb-5">
                {STEPS.map((s) => (
                  <button
                    key={s.n}
                    type="button"
                    onClick={() => goToStep(s.n)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200",
                      s.n === step ? "w-5 bg-indigo-500"
                      : s.n < step ? "w-1.5 cursor-pointer bg-emerald-400 hover:bg-emerald-500"
                                   : "w-1.5 cursor-default bg-slate-300",
                    )}
                  />
                ))}
                <span className="ml-1 text-[10px] text-slate-400">{step}/{STEPS.length}</span>
              </div>
            </aside>

            {/* ── Right content area ──────────────────────────────────── */}
            <div className="flex flex-1 flex-col overflow-hidden">

              {/* Mobile stepper (hidden on md+) */}
              <MobileStepper current={step} />

              {/* Step mini-header inside content pane */}
              <div className="shrink-0 border-b border-slate-100 px-5 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                    {(() => { const S = currentStepCfg.icon; return <S size={15} />; })()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{currentStepCfg.label}</p>
                    <p className="text-[10px] text-slate-400">{currentStepCfg.sub}</p>
                  </div>
                  <span className="ml-auto rounded-xl bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600">
                    {step}&thinsp;/&thinsp;{STEPS.length}
                  </span>
                </div>
              </div>

              {/* Scrollable form */}
              <div className="flex-1 overflow-y-auto bg-slate-50/30 px-5 py-5 sm:px-6">
                <StepContent step={step} data={form} errors={errors} onChange={onChange} />
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        {!done && (
          <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-white px-5 py-3.5 sm:px-6">
            <button
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
            >
              Batal
            </button>
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  disabled={submitting}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft size={13} /> Kembali
                </button>
              )}
              {step < STEPS.length ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
                >
                  Lanjut <ChevronRight size={13} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70 active:scale-[0.98]"
                >
                  {submitting
                    ? <><Loader2 size={13} className="animate-spin" /> Menyimpan…</>
                    : <><Check size={13} /> Simpan Pasien</>}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
