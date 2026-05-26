"use client";

/**
 * BerkasPreviewPane — preview pane sticky di sebelah kanan list (EK3.2).
 *
 * Mode:
 * - empty: tidak ada berkas selected → guide message
 * - selected + file ada: header meta + preview area (PDF / image mock) + versions list
 * - selected + file kosong: empty state per berkas + Upload CTA prominent
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FileImage,
  Download,
  ExternalLink,
  Upload,
  History,
  CheckCircle2,
  Inbox,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { KLAIM_TONE } from "../../../klaim/klaimBoardShared";
import {
  KATEGORI_CFG,
  STATUS_CFG,
  fileTypeFromMime,
  formatFileSize,
} from "./berkasShared";
import { fmtDateTimeShort } from "../../claimDetailShared";
import type { BerkasKlaim } from "@/lib/eklaim/eklaimShared";

interface Props {
  berkas: BerkasKlaim | null;
  onUpload: (id: string) => void;
  onAutoPull: (id: string) => void;
}

export default function BerkasPreviewPane({
  berkas,
  onUpload,
  onAutoPull,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-white">
      <AnimatePresence mode="wait">
        {!berkas ? (
          <EmptyState key="empty" />
        ) : !berkas.file ? (
          <NoFileState
            key={`no-file-${berkas.id}`}
            berkas={berkas}
            onUpload={onUpload}
            onAutoPull={onAutoPull}
          />
        ) : (
          <FileViewer
            key={`file-${berkas.id}`}
            berkas={berkas}
            onUpload={onUpload}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center"
    >
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 ring-1 ring-teal-200">
        <Inbox size={26} strokeWidth={1.8} className="text-teal-600" />
      </div>
      <div>
        <p className="text-[13.5px] font-bold text-slate-700">
          Pilih berkas untuk preview
        </p>
        <p className="mt-1 text-[12px] text-slate-500">
          Klik salah satu baris di kiri untuk melihat detail file,
          versi, dan catatan koder.
        </p>
      </div>
    </motion.div>
  );
}

// ── No File State ──────────────────────────────────────

function NoFileState({
  berkas,
  onUpload,
  onAutoPull,
}: {
  berkas: BerkasKlaim;
  onUpload: (id: string) => void;
  onAutoPull: (id: string) => void;
}) {
  const cfg = KATEGORI_CFG[berkas.kategori];
  const tone = KLAIM_TONE[cfg.tone];
  const Icon = cfg.icon;
  const statusCfg = STATUS_CFG[berkas.status];
  const statusTone = KLAIM_TONE[statusCfg.tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      className="flex h-full flex-col"
    >
      <PreviewHeader
        kategoriIcon={Icon}
        kategoriTone={tone}
        nama={berkas.nama}
        statusLabel={statusCfg.label}
        statusToneClass={cn(statusTone.chipBg, statusTone.chipText, statusTone.chipRing)}
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-200">
          <Upload size={24} strokeWidth={1.8} className="text-amber-600" />
        </div>
        <div>
          <p className="text-[13.5px] font-bold text-slate-700">
            Belum ada file
          </p>
          <p className="mt-1 max-w-xs text-[12px] text-slate-500">
            Upload manual atau auto-pull dari modul EHIS lain untuk melengkapi
            berkas {berkas.kategori}.
          </p>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onUpload(berkas.id)}
            className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-[12.5px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-teal-700 hover:shadow active:scale-[0.97]"
          >
            <Upload size={12} strokeWidth={2.4} />
            Upload File
          </button>
          {cfg.autoPull && (
            <button
              type="button"
              onClick={() => onAutoPull(berkas.id)}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-3 py-1.5 text-[12.5px] font-semibold text-sky-700 ring-1 ring-sky-200 transition-colors hover:bg-sky-100"
            >
              <Sparkles size={12} strokeWidth={2.4} />
              Auto-pull dari {cfg.autoPull.label}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── File Viewer ────────────────────────────────────────

function FileViewer({
  berkas,
  onUpload,
}: {
  berkas: BerkasKlaim;
  onUpload: (id: string) => void;
}) {
  const cfg = KATEGORI_CFG[berkas.kategori];
  const tone = KLAIM_TONE[cfg.tone];
  const Icon = cfg.icon;
  const statusCfg = STATUS_CFG[berkas.status];
  const statusTone = KLAIM_TONE[statusCfg.tone];
  const file = berkas.file!;
  const fileName = file.url.split("/").pop() ?? "file";
  const ftype = fileTypeFromMime(file.mimeType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      className="flex h-full flex-col"
    >
      <PreviewHeader
        kategoriIcon={Icon}
        kategoriTone={tone}
        nama={berkas.nama}
        statusLabel={statusCfg.label}
        statusToneClass={cn(statusTone.chipBg, statusTone.chipText, statusTone.chipRing)}
      />

      {/* Metadata strip */}
      <div className="grid grid-cols-2 gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 sm:grid-cols-4">
        <MetaItem
          label="Nama File"
          value={fileName}
          mono
          truncate
          title={fileName}
        />
        <MetaItem label="Ukuran" value={formatFileSize(file.sizeBytes)} mono />
        <MetaItem label="Tipe" value={file.mimeType.split("/")[1].toUpperCase()} />
        <MetaItem
          label="Versi"
          value={`v${file.versions.length}`}
          mono
        />
      </div>

      {/* Preview area (scrollable) */}
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <MockPreview ftype={ftype} fileName={fileName} />
      </div>

      {/* Footer: actions + versions */}
      <div className="shrink-0 space-y-2 border-t border-slate-100 bg-slate-50/40 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <a
            href={file.url}
            download={fileName}
            onClick={(e) => e.preventDefault()}
            title="Download (mock — tidak tersedia di demo)"
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-teal-700"
          >
            <Download size={11} strokeWidth={2.4} />
            Download
          </a>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.preventDefault()}
            title="Buka file (mock)"
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-teal-700"
          >
            <ExternalLink size={11} strokeWidth={2.4} />
            Buka
          </a>
          <button
            type="button"
            onClick={() => onUpload(berkas.id)}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-amber-700"
          >
            <Upload size={11} strokeWidth={2.4} />
            Replace
          </button>
          {berkas.uploadedAt && (
            <span className="ml-auto text-[11px] text-slate-500">
              <CheckCircle2
                size={10}
                strokeWidth={2.6}
                className="inline align-text-bottom text-emerald-500"
              />{" "}
              {fmtDateTimeShort(berkas.uploadedAt)} oleh{" "}
              <span className="font-semibold text-slate-700">
                {berkas.uploadedBy ?? "—"}
              </span>
            </span>
          )}
        </div>

        {/* Versions list */}
        {file.versions.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
              <History
                size={10}
                strokeWidth={2.6}
                className="inline align-text-bottom"
              />{" "}
              Versi:
            </span>
            {file.versions.map((v) => (
              <span
                key={v.versionNumber}
                title={`${fmtDateTimeShort(v.uploadedAt)} oleh ${v.uploadedBy}`}
                className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[10.5px] font-mono font-bold text-slate-600 ring-1 ring-slate-200"
              >
                v{v.versionNumber}
              </span>
            ))}
          </div>
        )}

        {/* Coder note (if exists) */}
        {berkas.catatan && (
          <div className="rounded-md bg-amber-50 px-2 py-1.5 ring-1 ring-amber-200">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-amber-700">
              Catatan Koder
            </p>
            <p className="mt-0.5 text-[12px] text-slate-700">{berkas.catatan}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Preview Header (shared) ────────────────────────────

function PreviewHeader({
  kategoriIcon: Icon,
  kategoriTone,
  nama,
  statusLabel,
  statusToneClass,
}: {
  kategoriIcon: typeof FileText;
  kategoriTone: { iconBg: string; iconText: string; chipRing: string };
  nama: string;
  statusLabel: string;
  statusToneClass: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 border-b border-slate-200 bg-white px-4 py-2.5">
      <span
        className={cn(
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1",
          kategoriTone.iconBg,
          kategoriTone.iconText,
          kategoriTone.chipRing,
        )}
        aria-hidden
      >
        <Icon size={14} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-[13px] font-bold text-slate-800"
          title={nama}
        >
          {nama}
        </p>
        <p className="text-[10.5px] uppercase tracking-wider text-slate-400">
          Preview Berkas
        </p>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-bold ring-1",
          statusToneClass,
        )}
      >
        {statusLabel}
      </span>
    </div>
  );
}

// ── Mock Preview Renderers ─────────────────────────────

function MockPreview({
  ftype,
  fileName,
}: {
  ftype: "pdf" | "image" | "other";
  fileName: string;
}) {
  if (ftype === "image") {
    return <MockImagePreview fileName={fileName} />;
  }
  if (ftype === "pdf") {
    return <MockPdfPreview fileName={fileName} />;
  }
  return <MockOtherPreview fileName={fileName} />;
}

function MockPdfPreview({ fileName }: { fileName: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-lg border border-slate-300 bg-linear-to-br from-slate-100 via-white to-slate-50 p-6 shadow-inner">
      <FileText size={48} strokeWidth={1.4} className="text-rose-500" />
      <p className="font-mono text-[11px] text-slate-500" title={fileName}>
        {fileName}
      </p>
      {/* Mock PDF content lines */}
      <div className="mt-2 w-full space-y-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full bg-slate-200"
            style={{ width: `${65 + ((i * 13) % 30)}%` }}
          />
        ))}
      </div>
      <p className="mt-3 text-[10.5px] italic text-slate-400">
        Mock PDF preview · embed viewer akan di-wire di EK3.7
      </p>
    </div>
  );
}

function MockImagePreview({ fileName }: { fileName: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-lg border border-slate-300 bg-linear-to-br from-sky-50 via-white to-teal-50 p-6 shadow-inner">
      <div className="flex h-40 w-full items-center justify-center rounded-md bg-slate-200/60 ring-1 ring-slate-300">
        <FileImage size={48} strokeWidth={1.4} className="text-sky-500" />
      </div>
      <p className="mt-1 font-mono text-[11px] text-slate-500" title={fileName}>
        {fileName}
      </p>
      <p className="text-[10.5px] italic text-slate-400">
        Mock image preview · gambar asli akan render di production
      </p>
    </div>
  );
}

function MockOtherPreview({ fileName }: { fileName: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 p-6">
      <FileText size={48} strokeWidth={1.4} className="text-slate-500" />
      <p className="font-mono text-[11px] text-slate-500">{fileName}</p>
    </div>
  );
}

// ── Meta Item ──────────────────────────────────────────

function MetaItem({
  label,
  value,
  mono,
  truncate,
  title,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
  title?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-[12px] font-semibold text-slate-700",
          mono && "font-mono tabular-nums",
          truncate && "truncate",
        )}
        title={title}
      >
        {value}
      </p>
    </div>
  );
}
