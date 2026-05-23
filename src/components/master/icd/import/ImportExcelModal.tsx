"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileSpreadsheet, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IcdItem, IcdJenis } from "@/lib/master/icdMock";
import {
  type ParsedFile, type ColumnMapping, type ValidationSummary,
  autoDetectMapping, validateImport,
} from "./importHelpers";
import StepUpload from "./StepUpload";
import StepMapping from "./StepMapping";
import StepPreview from "./StepPreview";

interface Props {
  open: boolean;
  onClose: () => void;
  onCommit: (items: IcdItem[]) => void;
  existingItems: IcdItem[];
  defaultJenis: IcdJenis;
}

type WizardStep = "upload" | "mapping" | "preview";

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "upload",  label: "Pilih File" },
  { key: "mapping", label: "Mapping Kolom" },
  { key: "preview", label: "Preview & Konfirmasi" },
];

export default function ImportExcelModal({
  open, onClose, onCommit, existingItems, defaultJenis,
}: Props) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [jenis, setJenis] = useState<IcdJenis>(defaultJenis);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});

  const reset = useCallback(() => {
    setStep("upload");
    setParsed(null);
    setMapping({});
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileParsed = (p: ParsedFile) => {
    setParsed(p);
    setMapping(autoDetectMapping(p.headers));
    setStep("mapping");
  };

  const handleMappingConfirm = () => setStep("preview");

  const handleBack = () => {
    if (step === "preview") setStep("mapping");
    else if (step === "mapping") setStep("upload");
  };

  const handleCommit = (items: IcdItem[]) => {
    onCommit(items);
    handleClose();
  };

  // Re-compute summary saat user di step preview (untuk show-pre-commit)
  const computeSummary = (): ValidationSummary | null => {
    if (!parsed) return null;
    return validateImport(parsed.rows, mapping, jenis, existingItems);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18 }}
          className="flex h-full max-h-[760px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-linear-to-br from-sky-50 to-white px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Import ICD dari Excel/CSV</p>
                <p className="text-[10.5px] text-slate-500">
                  Upload dataset resmi WHO atau Kemkes (.xlsx, .xls, .csv)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Tutup"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </header>

          {/* Stepper */}
          <Stepper currentStep={step} />

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <AnimatePresence mode="wait">
              {step === "upload" && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18 }}
                >
                  <StepUpload
                    jenis={jenis}
                    onJenisChange={setJenis}
                    onFileParsed={handleFileParsed}
                  />
                </motion.div>
              )}
              {step === "mapping" && parsed && (
                <motion.div
                  key="mapping"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18 }}
                >
                  <StepMapping
                    parsed={parsed}
                    mapping={mapping}
                    onMappingChange={setMapping}
                  />
                </motion.div>
              )}
              {step === "preview" && parsed && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18 }}
                >
                  <StepPreview
                    parsed={parsed}
                    jenis={jenis}
                    summary={computeSummary()}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer actions */}
          <Footer
            step={step}
            canNext={
              step === "upload"   ? !!parsed
              : step === "mapping" ? hasRequiredMapping(mapping)
              : true
            }
            onBack={handleBack}
            onNext={() => {
              if (step === "mapping") handleMappingConfirm();
            }}
            onCommit={() => {
              const summary = computeSummary();
              if (summary && summary.acceptedItems.length > 0) {
                handleCommit(summary.acceptedItems);
              }
            }}
            commitDisabled={
              step !== "preview" ||
              (computeSummary()?.acceptedItems.length ?? 0) === 0
            }
            commitCount={computeSummary()?.acceptedItems.length ?? 0}
            onCancel={handleClose}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Stepper ──────────────────────────────────────────────

function Stepper({ currentStep }: { currentStep: WizardStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);
  return (
    <div className="flex shrink-0 items-center justify-center gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
      {STEPS.map((s, idx) => {
        const isCurrent = idx === currentIdx;
        const isDone = idx < currentIdx;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition",
                  isDone   ? "bg-emerald-500 text-white"
                  : isCurrent ? "bg-sky-600 text-white ring-2 ring-sky-200"
                  : "bg-slate-200 text-slate-500",
                )}
              >
                {isDone ? <CheckCircle2 size={11} /> : idx + 1}
              </span>
              <span
                className={cn(
                  "text-[11px] font-semibold",
                  isCurrent ? "text-sky-700"
                  : isDone   ? "text-emerald-700"
                  : "text-slate-400",
                )}
              >
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px w-8 transition",
                  idx < currentIdx ? "bg-emerald-400" : "bg-slate-300",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────

function Footer({
  step, canNext, onBack, onNext, onCommit, onCancel, commitDisabled, commitCount,
}: {
  step: WizardStep;
  canNext: boolean;
  onBack: () => void;
  onNext: () => void;
  onCommit: () => void;
  onCancel: () => void;
  commitDisabled: boolean;
  commitCount: number;
}) {
  return (
    <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        Batal
      </button>
      <div className="flex items-center gap-2">
        {step !== "upload" && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={12} />
            Kembali
          </button>
        )}
        {step !== "preview" ? (
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className={cn(
              "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              canNext
                ? "bg-sky-600 text-white shadow-sm hover:bg-sky-700"
                : "cursor-not-allowed bg-slate-200 text-slate-400",
            )}
          >
            Lanjut
            <ArrowRight size={12} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onCommit}
            disabled={commitDisabled}
            className={cn(
              "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              !commitDisabled
                ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                : "cursor-not-allowed bg-slate-200 text-slate-400",
            )}
          >
            <CheckCircle2 size={12} />
            Import {commitCount > 0 ? `${commitCount} kode` : ""}
          </button>
        )}
      </div>
    </footer>
  );
}

// Cek apakah min required field (kode + nama + chapter) sudah ter-map ke salah satu kolom.
function hasRequiredMapping(mapping: ColumnMapping): boolean {
  const values = Object.values(mapping);
  return ["kode", "nama", "chapter"].every((req) => values.includes(req as never));
}
