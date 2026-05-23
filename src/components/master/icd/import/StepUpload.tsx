"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Upload, FileText, FileSpreadsheet, AlertTriangle, Info, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IcdJenis } from "@/lib/master/icdMock";
import {
  type ParsedFile, MAX_PREVIEW_ROWS,
  parseCsvContent, parseExcelDemo, readFileAsText, detectFileMode,
} from "./importHelpers";
import { JENIS_CFG, JENIS_LIST } from "../icdShared";

interface Props {
  jenis: IcdJenis;
  onJenisChange: (j: IcdJenis) => void;
  onFileParsed: (p: ParsedFile) => void;
}

interface SelectedFileInfo {
  file: File;
  mode: "csv" | "excel-demo" | "unsupported";
}

export default function StepUpload({
  jenis, onJenisChange, onFileParsed,
}: Props) {
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedFileInfo | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = (file: File | null | undefined) => {
    if (!file) return;
    const mode = detectFileMode(file);
    setSelected({ file, mode });
    setError(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    handlePick(f);
  };

  const parseAndContinue = useCallback(async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      if (selected.mode === "unsupported") {
        setError("Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv");
        return;
      }
      if (selected.mode === "csv") {
        const text = await readFileAsText(selected.file);
        const { headers, rows } = parseCsvContent(text);
        if (headers.length === 0) {
          setError("File kosong atau tidak ada header.");
          return;
        }
        const truncated = rows.length > MAX_PREVIEW_ROWS;
        const limitedRows = truncated ? rows.slice(0, MAX_PREVIEW_ROWS) : rows;
        const parsed: ParsedFile = {
          mode: "csv",
          fileName: selected.file.name,
          headers,
          rows: limitedRows,
          totalRows: rows.length,
          truncated,
        };
        onFileParsed(parsed);
      } else {
        // excel-demo: mock parsing (saat backend ready, replace dengan xlsx lib)
        const { headers, rows } = parseExcelDemo(selected.file.name);
        const parsed: ParsedFile = {
          mode: "excel-demo",
          fileName: selected.file.name,
          headers,
          rows,
          totalRows: rows.length,
          truncated: false,
        };
        onFileParsed(parsed);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membaca file");
    } finally {
      setBusy(false);
    }
  }, [selected, onFileParsed]);

  return (
    <div className="flex flex-col gap-4">
      {/* Jenis selector */}
      <section>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
          1. Target Import
        </p>
        <p className="mb-2 text-[10.5px] text-slate-500">
          Pilih jenis kode yang akan di-import. File harus berisi satu jenis konsisten.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {JENIS_LIST.map((j) => {
            const cfg = JENIS_CFG[j];
            const active = jenis === j;
            const Icon = cfg.icon;
            return (
              <button
                key={j}
                type="button"
                onClick={() => onJenisChange(j)}
                className={cn(
                  "flex items-start gap-2 rounded-lg border px-3 py-2 text-left transition",
                  active
                    ? cn(cfg.bg, "border-current ring-1 ring-current")
                    : "border-slate-200 bg-white hover:border-slate-300",
                )}
              >
                <Icon size={14} className={active ? cfg.text : "text-slate-400"} />
                <div className="min-w-0">
                  <p className={cn("text-[12px] font-bold", active ? cfg.text : "text-slate-700")}>
                    {cfg.label}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{cfg.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* File upload */}
      <section>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
          2. Pilih File Dataset
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 transition",
            drag
              ? "border-sky-400 bg-sky-50/70"
              : selected
                ? "border-emerald-300 bg-emerald-50/40"
                : "border-slate-300 bg-slate-50/60 hover:border-sky-300 hover:bg-sky-50/30",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handlePick(e.target.files?.[0])}
          />

          {selected ? (
            <SelectedPreview info={selected} />
          ) : (
            <>
              <Upload size={32} className={cn(drag ? "text-sky-500" : "text-slate-400")} />
              <p className="mt-2 text-xs font-semibold text-slate-700">
                {drag ? "Lepaskan file di sini…" : "Drag & drop file ke sini, atau klik untuk pilih"}
              </p>
              <p className="mt-1 text-[10.5px] text-slate-500">
                Format: .xlsx · .xls · .csv · max preview {MAX_PREVIEW_ROWS} baris
              </p>
            </>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2"
          >
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-rose-600" />
            <p className="text-[11px] text-rose-700">{error}</p>
          </motion.div>
        )}

        {selected && selected.mode === "excel-demo" && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
            <Sparkles size={13} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="flex-1 text-[10.5px] leading-relaxed">
              <p className="font-semibold text-amber-800">Mode Demo Excel</p>
              <p className="text-amber-700">
                File .xlsx terdeteksi, namun preview akan pakai{" "}
                <strong>15 baris sample WHO ICD-10</strong> (demo). Saat backend ready,
                lib <code className="rounded bg-white px-1 font-mono">xlsx</code> akan di-install
                untuk parsing real file Excel. Sementara, gunakan format <strong>.csv</strong>{" "}
                untuk preview dataset real.
              </p>
            </div>
          </div>
        )}

        {selected && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={parseAndContinue}
              disabled={busy || selected.mode === "unsupported"}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                busy || selected.mode === "unsupported"
                  ? "cursor-not-allowed bg-slate-200 text-slate-400"
                  : "bg-sky-600 text-white hover:bg-sky-700",
              )}
            >
              {busy ? "Memproses…" : "Baca File"}
            </button>
          </div>
        )}
      </section>

      {/* Info bar — format expected */}
      <section className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <Info size={13} className="mt-0.5 shrink-0 text-slate-500" />
          <div className="flex-1 text-[10.5px] leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-700">Format file yang diharapkan</p>
            <p className="mt-0.5">
              Baris 1 = header kolom. Min wajib ada kolom <strong>Kode</strong>,{" "}
              <strong>Nama Indonesia</strong>, dan <strong>Chapter</strong>. Kolom opsional:{" "}
              Nama Inggris, Blok, INA-CBG. Auto-detect mapping akan jalan di langkah berikutnya.
            </p>
            <p className="mt-1 text-slate-500">
              Source umum: <strong>WHO ICD-10 Tabular List</strong>,{" "}
              <strong>Kemkes Buku ICD-10 Volume 1</strong>, atau export dari aplikasi ICD-10 Browser.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Selected file preview ────────────────────────────────

function SelectedPreview({ info }: { info: SelectedFileInfo }) {
  const fileIcon = info.mode === "csv" ? FileText : FileSpreadsheet;
  const FileIcon = fileIcon;
  const sizeKb = (info.file.size / 1024).toFixed(1);
  return (
    <div className="flex items-center gap-3">
      <FileIcon size={28} className={cn(
        info.mode === "csv" ? "text-emerald-600"
        : info.mode === "excel-demo" ? "text-amber-600"
        : "text-slate-400",
      )} />
      <div className="min-w-0 text-left">
        <p className="truncate text-xs font-bold text-slate-800">{info.file.name}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
          <span>{sizeKb} KB</span>
          <span className="text-slate-300">·</span>
          <span className={cn(
            "rounded px-1.5 py-0 font-semibold",
            info.mode === "csv"          ? "bg-emerald-100 text-emerald-700"
            : info.mode === "excel-demo" ? "bg-amber-100 text-amber-700"
            : "bg-rose-100 text-rose-700",
          )}>
            {info.mode === "csv" ? "CSV (real parse)"
              : info.mode === "excel-demo" ? "Excel (demo)"
              : "Tidak didukung"}
          </span>
        </div>
      </div>
    </div>
  );
}
