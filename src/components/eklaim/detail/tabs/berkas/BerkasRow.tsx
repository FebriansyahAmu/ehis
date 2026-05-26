"use client";

/**
 * BerkasRow — single row di BerkasGroupList (EK3.2).
 *
 * Visual:
 *   [icon]  Nama berkas  [Wajib badge]                [Status chip ▼]
 *           catatan khusus / file info                [Upload]
 *   [optional: file row]
 *   [optional: notes textarea expanded]
 *
 * Interaksi:
 * - Click row body → select for preview (selectedId)
 * - Click status chip → cycle Belum → Siap → Tidak Berlaku → Belum
 * - Click Upload → onUpload (parent handles file input stub)
 * - Click Auto-pull (jika ada source) → onAutoPull
 * - Toggle note → expand textarea + onNoteChange
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Download,
  RefreshCw,
  StickyNote,
  ChevronDown,
  Paperclip,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { KLAIM_TONE } from "../../../klaim/klaimBoardShared";
import {
  KATEGORI_CFG,
  STATUS_CFG,
  fileTypeIcon,
  formatFileSize,
} from "./berkasShared";
import type { BerkasKlaim, BerkasStatus } from "@/lib/eklaim/eklaimShared";

interface Props {
  berkas: BerkasKlaim;
  selected: boolean;
  /** Catatan khusus dari template (untuk hint). */
  catatanTemplate?: string;
  onSelect: (id: string) => void;
  onStatusCycle: (id: string) => void;
  onUpload: (id: string) => void;
  onAutoPull: (id: string) => void;
  onNoteChange: (id: string, note: string) => void;
}

export default function BerkasRow({
  berkas,
  selected,
  catatanTemplate,
  onSelect,
  onStatusCycle,
  onUpload,
  onAutoPull,
  onNoteChange,
}: Props) {
  const cfg = KATEGORI_CFG[berkas.kategori];
  const tone = KLAIM_TONE[cfg.tone];
  const statusCfg = STATUS_CFG[berkas.status];
  const statusTone = KLAIM_TONE[statusCfg.tone];
  const Icon = cfg.icon;
  const StatusIcon = statusCfg.icon;
  const hasFile = !!berkas.file;
  const hasAutoPull = !!cfg.autoPull;
  const [noteOpen, setNoteOpen] = useState(false);

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      onClick={() => onSelect(berkas.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(berkas.id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-pressed={selected}
      className={cn(
        "group cursor-pointer rounded-lg border border-slate-200 bg-white p-2.5 transition-all duration-150",
        "hover:border-teal-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30",
        selected && "border-teal-400 bg-teal-50/30 ring-1 ring-teal-200",
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-2.5">
        {/* Kategori icon */}
        <span
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1",
            tone.iconBg,
            tone.iconText,
            tone.chipRing,
          )}
          aria-hidden
        >
          <Icon size={13} strokeWidth={2.2} />
        </span>

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p
              className="truncate text-[12.5px] font-semibold text-slate-800"
              title={berkas.nama}
            >
              {berkas.nama}
            </p>
            {berkas.wajib ? (
              <span className="inline-flex items-center rounded-sm bg-rose-50 px-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 ring-1 ring-rose-200">
                Wajib
              </span>
            ) : (
              <span className="inline-flex items-center rounded-sm bg-slate-50 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 ring-1 ring-slate-200">
                Opsional
              </span>
            )}
          </div>
          {catatanTemplate && (
            <p
              className="mt-0.5 truncate text-[11.5px] text-slate-500"
              title={catatanTemplate}
            >
              {catatanTemplate}
            </p>
          )}
        </div>

        {/* Status chip (clickable to cycle) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStatusCycle(berkas.id);
          }}
          title={`Klik untuk ubah status (sekarang: ${statusCfg.label})`}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-bold ring-1 transition-all duration-150 active:scale-95",
            statusTone.chipBg,
            statusTone.chipText,
            statusTone.chipRing,
            "hover:shadow-sm",
          )}
        >
          <StatusIcon size={10} strokeWidth={2.6} />
          {statusCfg.label}
        </button>
      </div>

      {/* File info row (jika ada file) */}
      {hasFile && berkas.file && (
        <FileInfoRow
          fileName={berkas.file.url.split("/").pop() ?? "file"}
          mime={berkas.file.mimeType}
          sizeBytes={berkas.file.sizeBytes}
          versionCount={berkas.file.versions.length}
          uploadedBy={berkas.uploadedBy}
        />
      )}

      {/* Actions row */}
      <div
        className="mt-2 flex flex-wrap items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {hasAutoPull && berkas.status !== "Siap" && (
          <button
            type="button"
            onClick={() => onAutoPull(berkas.id)}
            title={`Auto-pull dari ${cfg.autoPull?.label}`}
            className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200 transition-colors hover:bg-sky-100"
          >
            <RefreshCw size={10} strokeWidth={2.5} />
            Auto-pull
          </button>
        )}
        <button
          type="button"
          onClick={() => onUpload(berkas.id)}
          className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-teal-700"
        >
          <Upload size={10} strokeWidth={2.5} />
          {hasFile ? "Replace" : "Upload"}
        </button>
        {hasFile && (
          <button
            type="button"
            onClick={() => onSelect(berkas.id)}
            className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-teal-700"
          >
            <Download size={10} strokeWidth={2.5} />
            Preview
          </button>
        )}
        <button
          type="button"
          onClick={() => setNoteOpen((o) => !o)}
          aria-expanded={noteOpen}
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold ring-1 transition-all duration-150",
            berkas.catatan
              ? "bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100"
              : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50 hover:text-slate-700",
          )}
          title={berkas.catatan ? "Sudah ada catatan" : "Tambah catatan koder"}
        >
          <StickyNote size={10} strokeWidth={2.5} />
          {berkas.catatan ? "Catatan" : "+ Catatan"}
          <ChevronDown
            size={10}
            strokeWidth={2.6}
            className={cn(
              "transition-transform duration-150",
              noteOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Notes textarea (collapsed by default) */}
      <AnimatePresence initial={false}>
        {noteOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div onClick={(e) => e.stopPropagation()}>
              <textarea
                value={berkas.catatan ?? ""}
                onChange={(e) => onNoteChange(berkas.id, e.target.value)}
                placeholder="Catatan koder untuk verifikator (mis. alasan upload manual / referensi tindakan terkait)…"
                rows={2}
                className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-slate-50/60 px-2 py-1.5 text-[12px] text-slate-700 placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// ── File Info Row ──────────────────────────────────────

function FileInfoRow({
  fileName,
  mime,
  sizeBytes,
  versionCount,
  uploadedBy,
}: {
  fileName: string;
  mime: string;
  sizeBytes: number;
  versionCount: number;
  uploadedBy?: string;
}) {
  const Icon = fileTypeIcon(mime);
  return (
    <div className="mt-2 flex items-center gap-1.5 rounded-md bg-slate-50/60 px-2 py-1.5 ring-1 ring-slate-100">
      <Icon size={12} strokeWidth={2} className="shrink-0 text-slate-500" />
      <span
        className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-600"
        title={fileName}
      >
        {fileName}
      </span>
      <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-slate-400">
        {formatFileSize(sizeBytes)}
      </span>
      {versionCount > 1 && (
        <span
          className="inline-flex shrink-0 items-center gap-0.5 rounded-sm bg-amber-50 px-1 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200"
          title={`${versionCount} versi (append-only audit)`}
        >
          <Paperclip size={8} strokeWidth={2.6} />v{versionCount}
        </span>
      )}
      {uploadedBy && (
        <span
          className="hidden shrink-0 text-[10.5px] text-slate-500 sm:inline"
          title={`Diupload oleh ${uploadedBy}`}
        >
          · {uploadedBy.split(" ")[0]}
        </span>
      )}
    </div>
  );
}

// ── Helper (re-export status for parent) ───────────────

export type { BerkasStatus };
