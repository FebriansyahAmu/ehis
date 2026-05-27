"use client";

/**
 * ImportTransferModal — upload transfer CSV untuk rekonsiliasi (EK7.1).
 *
 * Flow 2-step:
 *   Step 1 · Upload  — drag-drop atau pilih file CSV + template download
 *   Step 2 · Preview — preview parsed rows + penjamin auto-detect + konfirmasi import
 *
 * Fitur:
 *   - Parse CSV (tanggal / nominal / bank / keterangan)
 *   - Auto-detect penjamin dari keterangan (BPJS / Mandiri Inhealth / Prudential / dll)
 *   - Download template CSV contoh
 *   - AnimatePresence slide antar step
 *   - Spring modal animation (stiffness 380 / damping 30)
 */

import { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, Upload, FileText, Download, CheckCircle2,
  AlertCircle, ChevronRight, ArrowLeft, Info,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/eklaim/money";
import type { ReconciliationRecord } from "@/lib/eklaim/eklaimShared";

import {
  BANDING_TONE,
  parseCSVContent,
  CSV_TEMPLATE_CONTENT,
  getPenjaminDisplay,
  generateReconId,
  generateTransferNo,
  type CSVTransferRow,
} from "./reconciliationShared";

// ── Animation variants ────────────────────────────────────────

const BACKDROP_V = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

const PANEL_V = {
  hidden:  { opacity: 0, scale: 0.97, y: 10 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: "spring" as const, stiffness: 380, damping: 30 },
  },
  exit: { opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.15 } },
};

// ── Step 1: Dropzone ──────────────────────────────────────────

function DropzoneStep({
  onFileParsed,
}: {
  onFileParsed: (rows: CSVTransferRow[]) => void;
}) {
  const fileRef     = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError]   = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    const isCSV =
      file.name.toLowerCase().endsWith(".csv") ||
      file.type.includes("csv") ||
      file.type.includes("text");
    if (!isCSV) {
      setFileError("Format file harus .csv");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) ?? "";
      const rows = parseCSVContent(content);
      if (rows.length === 0) {
        setFileError("File CSV kosong atau format tidak dikenali");
        return;
      }
      setFileError(null);
      onFileParsed(rows);
    };
    reader.onerror = () => setFileError("Gagal membaca file");
    reader.readAsText(file, "utf-8");
  }, [onFileParsed]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can re-trigger
    e.target.value = "";
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE_CONTENT], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = "template-transfer-rekonsiliasi.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Template banner */}
      <div className="flex items-center justify-between gap-3 rounded-xl bg-sky-50 px-4 py-3 ring-1 ring-sky-200">
        <div>
          <p className="text-sm font-semibold text-sky-800">Template CSV</p>
          <p className="text-sm text-sky-600">
            Format: tanggal, nominal, bank, keterangan
          </p>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          <Download size={13} />
          Unduh
        </button>
      </div>

      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
          isDragOver
            ? "border-teal-400 bg-teal-50"
            : "border-slate-300 bg-slate-50 hover:border-teal-300 hover:bg-teal-50/30",
        )}
      >
        <motion.div
          animate={{ y: isDragOver ? -4 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <Upload
            size={36}
            className={cn(
              "mb-3 transition-colors",
              isDragOver ? "text-teal-500" : "text-slate-400",
            )}
          />
        </motion.div>
        <p className="text-sm font-semibold text-slate-700">
          {isDragOver ? "Lepas file di sini" : "Drag & drop file CSV"}
        </p>
        <p className="mt-1 text-sm text-slate-500">atau klik untuk pilih file</p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="sr-only"
          onChange={handleInput}
        />
      </div>

      {/* File error */}
      {fileError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 ring-1 ring-rose-200"
        >
          <AlertCircle size={15} className="shrink-0 text-rose-500" />
          <p className="text-sm text-rose-700">{fileError}</p>
        </motion.div>
      )}

      {/* Format guide */}
      <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
          <Info size={13} className="text-slate-400" />
          Format kolom yang diterima
        </p>
        <code className="block rounded-lg bg-white p-3 font-mono text-sm text-slate-700 ring-1 ring-slate-200">
          <span className="text-teal-600">tanggal</span>,
          <span className="text-emerald-600">nominal</span>,
          <span className="text-sky-600">bank</span>,
          <span className="text-amber-600">keterangan</span>
          <br />
          2026-05-28,25000000,Mandiri,BPJS Mei 2026
        </code>
        <p className="mt-2 text-sm text-slate-500">
          Keterangan mengandung nama penjamin → auto-detect: BPJS, Mandiri Inhealth, Prudential, dll.
        </p>
      </div>
    </div>
  );
}

// ── Step 2: Preview ───────────────────────────────────────────

function PreviewStep({
  rows,
  onBack,
  onImport,
}: {
  rows: CSVTransferRow[];
  onBack: () => void;
  onImport: (validRows: CSVTransferRow[]) => void;
}) {
  const [isImporting, setIsImporting] = useState(false);
  const validRows = rows.filter((r) => r.valid);

  async function handleImport() {
    if (validRows.length === 0) return;
    setIsImporting(true);
    await new Promise<void>((res) => setTimeout(res, 900));
    onImport(validRows);
  }

  return (
    <div className="space-y-4">
      {/* Summary badge */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl px-4 py-3 ring-1",
          validRows.length > 0
            ? "bg-emerald-50 ring-emerald-200"
            : "bg-rose-50 ring-rose-200",
        )}
      >
        {validRows.length > 0 ? (
          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
        ) : (
          <AlertCircle size={16} className="shrink-0 text-rose-500" />
        )}
        <p className="text-sm font-semibold text-slate-700">
          {validRows.length > 0
            ? `${validRows.length} baris valid${rows.length !== validRows.length ? ` — ${rows.length - validRows.length} dilewati` : ""}`
            : "Tidak ada baris valid ditemukan"}
        </p>
      </div>

      {/* Preview table */}
      <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Tanggal", "Nominal", "Bank", "Penjamin", "✓"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-sm font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const penjamin = getPenjaminDisplay(row.penjaminId);
                return (
                  <tr
                    key={idx}
                    className={cn(
                      "border-b border-slate-100",
                      !row.valid && "bg-rose-50/40",
                    )}
                  >
                    <td className="px-3 py-2.5 font-mono text-sm text-slate-700">
                      {row.tanggal.slice(0, 10)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-sm font-bold text-teal-700">
                      {row.valid ? formatRupiah(row.nominal) : row.nominalRaw}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-slate-700">{row.bank}</td>
                    <td className="px-3 py-2.5">
                      {row.valid ? (
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-sm font-medium ring-1",
                            BANDING_TONE[penjamin.tone].chipBg,
                            BANDING_TONE[penjamin.tone].chipText,
                            BANDING_TONE[penjamin.tone].chipRing,
                          )}
                        >
                          {penjamin.label}
                        </span>
                      ) : (
                        <span className="text-sm italic text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.valid ? (
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      ) : (
                        <span title={row.error}>
                          <AlertCircle size={15} className="text-rose-400" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <ArrowLeft size={14} />
          Kembali
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={validRows.length === 0 || isImporting}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          {isImporting ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Mengimpor…
            </>
          ) : (
            <>
              Import {validRows.length} Transfer
              <ChevronRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onImport: (record: ReconciliationRecord) => void;
}

export default function ImportTransferModal({ onClose, onImport }: Props) {
  const [step, setStep]           = useState<"upload" | "preview">("upload");
  const [parsedRows, setParsedRows] = useState<CSVTransferRow[]>([]);

  function handleFileParsed(rows: CSVTransferRow[]) {
    setParsedRows(rows);
    setStep("preview");
  }

  function handleImportRows(validRows: CSVTransferRow[]) {
    if (validRows.length === 0) return;
    // Import first valid row as ReconciliationRecord (demo: one record at a time)
    const row       = validRows[0];
    const penjaminId = row.penjaminId === "unknown" ? "bpjs-jakarta" : row.penjaminId;
    const periodeKlaim = row.tanggal.slice(0, 7); // "YYYY-MM"

    const newRecord: ReconciliationRecord = {
      id:               generateReconId(),
      noTransfer:       generateTransferNo(row.bank, penjaminId),
      tanggalTransfer:  row.tanggal,
      nominalTransfer:  row.nominal,
      bank:             row.bank,
      penjaminId,
      periodeKlaim,
      matchedClaims:    [],
      selisih:          undefined,
      statusSelisih:    "Pending",
    };
    onImport(newRecord);
  }

  return (
    <motion.div
      variants={BACKDROP_V}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        variants={PANEL_V}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-slate-200 bg-teal-50/50 px-5 py-3.5">
          <FileText size={16} className="text-teal-600" />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-800">Import Transfer CSV</h2>
            <p className="text-sm text-slate-500">
              {step === "upload"
                ? "Upload file transfer dari sistem bank"
                : "Pratinjau & konfirmasi data yang akan diimpor"}
            </p>
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                step === "upload" ? "bg-teal-500" : "bg-teal-200",
              )}
            />
            <span
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                step === "preview" ? "bg-teal-500" : "bg-slate-200",
              )}
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-1 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content — step switch */}
        <div className="max-h-[72vh] overflow-y-auto p-5 [scrollbar-width:thin]">
          <AnimatePresence mode="wait">
            {step === "upload" ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
              >
                <DropzoneStep onFileParsed={handleFileParsed} />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <PreviewStep
                  rows={parsedRows}
                  onBack={() => setStep("upload")}
                  onImport={handleImportRows}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
