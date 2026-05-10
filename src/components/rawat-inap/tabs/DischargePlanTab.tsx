"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, BookOpen, Pill, CalendarClock, FileText,
  CheckCircle2, ChevronLeft, ChevronRight, LogOut,
} from "lucide-react";
import type { RawatInapPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  type DischargePlanData, DISCHARGE_MOCK, makeInitialEdukasi,
  isAsesmenComplete, isEdukasiComplete, isObatComplete,
  isFollowUpComplete, isResumeComplete,
} from "../discharge/dischargeShared";
import StepAsesmen    from "../discharge/StepAsesmen";
import StepEdukasi    from "../discharge/StepEdukasi";
import StepObatPulang from "../discharge/StepObatPulang";
import StepFollowUp   from "../discharge/StepFollowUp";
import StepResumeMedis from "../discharge/StepResumeMedis";

// ── Step definitions ──────────────────────────────────────

interface StepDef {
  id:     string;
  label:  string;
  short:  string;
  icon:   React.ElementType;
  std:    string;
}

const STEPS: StepDef[] = [
  { id: "asesmen",   label: "Asesmen Pemulangan", short: "Asesmen",   icon: ClipboardList, std: "SNARS ARK 5"   },
  { id: "edukasi",   label: "Edukasi Pasien",     short: "Edukasi",   icon: BookOpen,      std: "SNARS HPK 2"   },
  { id: "obat",      label: "Obat Pulang",         short: "Obat",      icon: Pill,          std: "PMK 72/2016"   },
  { id: "followup",  label: "Follow-up",           short: "Follow-up", icon: CalendarClock, std: "SNARS ARK 3"   },
  { id: "resume",    label: "Resume Medis",        short: "Resume",    icon: FileText,      std: "PMK 269/2008"  },
];

// ── Slide animation variants ──────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ── Stepper header ────────────────────────────────────────

function StepperHeader({
  current, completions, onNavigate,
}: {
  current:    number;
  completions: boolean[];
  onNavigate:  (i: number) => void;
}) {
  return (
    <div className="shrink-0 overflow-x-auto border-b border-slate-200 bg-white">
      <div className="flex min-w-max items-center px-4 py-3 gap-0">
        {STEPS.map((step, i) => {
          const Icon      = step.icon;
          const done      = completions[i];
          const active    = i === current;
          const clickable = done || i <= current;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step button */}
              <button
                onClick={() => clickable && onNavigate(i)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-150",
                  active
                    ? "bg-indigo-50"
                    : clickable
                      ? "hover:bg-slate-50"
                      : "cursor-default opacity-50",
                )}
              >
                {/* Circle */}
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200",
                  active
                    ? "border-indigo-500 bg-indigo-500 text-white shadow-md shadow-indigo-200"
                    : done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 bg-white text-slate-400",
                )}>
                  {done && !active
                    ? <CheckCircle2 size={14} />
                    : <Icon size={13} />
                  }
                </div>
                {/* Label */}
                <span className={cn(
                  "text-[10px] font-semibold whitespace-nowrap",
                  active ? "text-indigo-700" : done ? "text-emerald-600" : "text-slate-400",
                )}>
                  {step.short}
                </span>
                {/* Std badge */}
                <span className="text-[8px] font-medium text-slate-300">{step.std}</span>
              </button>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "mx-1 h-0.5 w-8 rounded-full transition-colors duration-300",
                  completions[i] ? "bg-emerald-400" : "bg-slate-200",
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Finalize banner ───────────────────────────────────────

function FinalizeBanner({ allDone, patientName }: { allDone: boolean; patientName: string }) {
  const [finalized, setFinalized] = useState(false);

  if (!allDone) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mx-4 mb-3 rounded-xl border p-4",
        finalized
          ? "border-emerald-200 bg-emerald-50"
          : "border-indigo-200 bg-indigo-50",
      )}
    >
      {finalized ? (
        <div className="flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-500" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Discharge Planning Selesai</p>
            <p className="text-xs text-emerald-700">{patientName} siap untuk dipulangkan. Semua dokumen telah lengkap.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogOut size={18} className="shrink-0 text-indigo-600" />
            <div>
              <p className="text-sm font-bold text-indigo-800">Semua langkah selesai!</p>
              <p className="text-xs text-indigo-700">Finalisasi discharge planning untuk {patientName}.</p>
            </div>
          </div>
          <button
            onClick={() => setFinalized(true)}
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 active:scale-95"
          >
            Finalisasi Discharge
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function DischargePlanTab({ patient }: { patient: RawatInapPatientDetail }) {
  const initial = DISCHARGE_MOCK[patient.noRM] ?? {
    asesmen: {
      tanggalRencanaKRS: "", kondisiPulang: "", caregiverNama: "",
      caregiverHubungan: "", caregiverKemampuan: "", kebutuhanHomecare: false,
      jenisHomecare: [], kebutuhanAlatBantu: false, alatBantu: [],
      jarakFaskes: "", kondisiSosEk: "", catatan: "",
    },
    edukasi:    makeInitialEdukasi(),
    obatPulang: [],
    followUp: {
      jadwalKontrol: [], jadwalPemeriksaan: [], adaRujukanFKTP: false,
      fktpNama: "", fktpTujuan: "", instruksiKhusus: "",
    },
    resume: {
      diagnosaMasuk: patient.diagnosis, diagnosaAkhir: "", prosedurUtama: "",
      ringkasanPenyakit: "", kondisiSaatPulang: "", terapiYangDiberikan: "",
      instruksiPulang: "", pembatasanAktivitas: "", dietPulang: "",
      dpjpApproved: false, dpjpApprovedAt: "",
    },
  } satisfies DischargePlanData;

  const [data,        setData]        = useState<DischargePlanData>(initial);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction,   setDirection]   = useState(1);

  const completions = [
    isAsesmenComplete(data.asesmen),
    isEdukasiComplete(data.edukasi),
    isObatComplete(data.obatPulang),
    isFollowUpComplete(data.followUp),
    isResumeComplete(data.resume),
  ];

  const allDone    = completions.every(Boolean);
  const isFirst    = currentStep === 0;
  const isLast     = currentStep === STEPS.length - 1;

  function navigate(to: number) {
    setDirection(to > currentStep ? 1 : -1);
    setCurrentStep(to);
  }

  function prev() { if (!isFirst) navigate(currentStep - 1); }
  function next() { if (!isLast)  navigate(currentStep + 1); }

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* Stepper header */}
      <StepperHeader
        current={currentStep}
        completions={completions}
        onNavigate={navigate}
      />

      {/* Step label bar */}
      <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">
              {STEPS[currentStep].label}
            </p>
            <p className="text-[11px] text-slate-400">
              Langkah {currentStep + 1} dari {STEPS.length} · {STEPS[currentStep].std}
            </p>
          </div>
          {completions[currentStep] && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"
            >
              <CheckCircle2 size={11} /> Lengkap
            </motion.div>
          )}
        </div>
      </div>

      {/* Finalize banner (shown at last step when all done) */}
      {isLast && <FinalizeBanner allDone={allDone} patientName={patient.name} />}

      {/* Step content */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-4">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {currentStep === 0 && (
                <StepAsesmen
                  data={data.asesmen}
                  onChange={asesmen => setData(d => ({ ...d, asesmen }))}
                  patient={patient}
                />
              )}
              {currentStep === 1 && (
                <StepEdukasi
                  items={data.edukasi}
                  onChange={edukasi => setData(d => ({ ...d, edukasi }))}
                />
              )}
              {currentStep === 2 && (
                <StepObatPulang
                  items={data.obatPulang}
                  onChange={obatPulang => setData(d => ({ ...d, obatPulang }))}
                />
              )}
              {currentStep === 3 && (
                <StepFollowUp
                  data={data.followUp}
                  onChange={followUp => setData(d => ({ ...d, followUp }))}
                />
              )}
              {currentStep === 4 && (
                <StepResumeMedis
                  data={data.resume}
                  onChange={resume => setData(d => ({ ...d, resume }))}
                  patient={patient}
                  asesmen={data.asesmen}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="shrink-0 flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
        <button
          onClick={prev}
          disabled={isFirst}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all",
            isFirst
              ? "cursor-not-allowed text-slate-300"
              : "border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
          )}
        >
          <ChevronLeft size={15} /> Sebelumnya
        </button>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => navigate(i)}
              className={cn(
                "rounded-full transition-all duration-200",
                i === currentStep
                  ? "h-2 w-5 bg-indigo-500"
                  : completions[i]
                    ? "h-2 w-2 bg-emerald-400"
                    : "h-2 w-2 bg-slate-300 hover:bg-slate-400",
              )}
            />
          ))}
        </div>

        {isLast ? (
          <button
            onClick={() => {}}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400 cursor-default"
          >
            Selesai <CheckCircle2 size={14} />
          </button>
        ) : (
          <button
            onClick={next}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 active:scale-95"
          >
            Berikutnya <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
