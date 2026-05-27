"use client";

/**
 * BerkasGeneratorModal — pilih template · pratinjau A4 · cetak / unduh bundle (EK5.2).
 *
 * Layout (max-w-5xl · max-h-[92vh]):
 *   ┌──────────────────────────────────────────────────────┐
 *   │ Header: icon · noKlaim · penjamin · [✕]              │
 *   ├────────────────────┬─────────────────────────────────┤
 *   │ Template Selector  │ Preview Area (A4 zoom:0.52)     │
 *   │ (3 cards · kiri)   │ AnimatePresence slide-fade      │
 *   │                    │                                 │
 *   └────────────────────┴─────────────────────────────────┤
 *   │ Footer: [Unduh Bundle]          [Tutup] [Cetak]      │
 *   └──────────────────────────────────────────────────────┘
 *
 * Print strategy: hidden fixed div (#eklaim-print-root) rendered off-screen.
 * On print: CSS visibility trick makes only that div visible.
 *
 * Preview: `zoom: 0.52` CSS property (standards-track CSS Level 3, Chrome/Firefox/Safari ✓).
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Printer,
  Download,
  Eye,
  Check,
  FileArchive,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";
import {
  TEMPLATE_CFG,
  type TemplateKey,
  printElementById,
  downloadBerkasBundle,
} from "./berkasGeneratorShared";
import ResumeMedisTemplate from "./ResumeMedisTemplate";
import BerkasKlaimTemplate from "./BerkasKlaimTemplate";
import SuratPengantarTemplate from "./SuratPengantarTemplate";

// ── Constants ──────────────────────────────────────────

const PRINT_ROOT_ID = "eklaim-print-root";

const BACKDROP_V = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const PANEL_V = {
  hidden: { opacity: 0, scale: 0.97, y: 14 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 8 },
};

const PREVIEW_V = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ── Template Router ────────────────────────────────────

function TemplateRenderer({
  active,
  claim,
  batchKlaims,
}: {
  active: TemplateKey;
  claim: ClaimRecord;
  batchKlaims?: ReadonlyArray<ClaimRecord>;
}) {
  if (active === "resume-medis") return <ResumeMedisTemplate claim={claim} />;
  if (active === "berkas-klaim") return <BerkasKlaimTemplate claim={claim} />;
  return <SuratPengantarTemplate claim={claim} batchKlaims={batchKlaims} />;
}

// ── Modal ──────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  claim: ClaimRecord;
  /** Optional batch list for Surat Pengantar — defaults to [claim]. */
  batchKlaims?: ReadonlyArray<ClaimRecord>;
}

export default function BerkasGeneratorModal({
  open,
  onClose,
  claim,
  batchKlaims,
}: Props) {
  const [active, setActive] = useState<TemplateKey>("resume-medis");
  const [downloading, setDownloading] = useState(false);

  function handlePrint() {
    printElementById(PRINT_ROOT_ID);
  }

  function handleDownloadBundle() {
    setDownloading(true);
    setTimeout(() => {
      downloadBerkasBundle(claim);
      setDownloading(false);
    }, 700);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-60 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
          aria-label="Generator Berkas Klaim"
        >
          {/* ── Backdrop ── */}
          <motion.div
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
            variants={BACKDROP_V}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* ── Panel ── */}
          <motion.div
            className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
            style={{ maxHeight: "92vh" }}
            variants={PANEL_V}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {/* ── Header ── */}
            <div className="relative flex shrink-0 items-center justify-between overflow-hidden border-b border-slate-200 bg-linear-to-br from-white via-teal-50/30 to-sky-50/20 px-5 py-3">
              <motion.div
                aria-hidden
                className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal-400 via-sky-400 to-emerald-400 bg-size-[200%_100%]"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-sky-600 shadow-sm ring-1 ring-teal-400/30">
                  <FileArchive size={15} strokeWidth={2.3} className="text-white" />
                </span>
                <div>
                  <h2 className="text-[13.5px] font-extrabold leading-tight tracking-tight text-slate-900">
                    Generator Berkas Klaim
                  </h2>
                  <p className="text-[10.5px] text-slate-500">
                    <span className="font-mono">{claim.noKlaim}</span>
                    {" · "}
                    {claim.penjamin.nama}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>

            {/* ── Body: 2-col ── */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* Left: Template Selector */}
              <div className="flex w-60 shrink-0 flex-col gap-1.5 overflow-y-auto border-r border-slate-200 bg-slate-50/70 p-3">
                <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Pilih Template
                </p>
                {TEMPLATE_CFG.map((tmpl) => {
                  const isActive = active === tmpl.key;
                  return (
                    <motion.button
                      key={tmpl.key}
                      type="button"
                      onClick={() => setActive(tmpl.key)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "relative flex flex-col items-start rounded-xl border p-3 text-left transition-all duration-150",
                        isActive
                          ? `bg-linear-to-br ${tmpl.fromBg} ${tmpl.toBg} border-transparent ring-2 ${tmpl.ringActive} shadow-sm`
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-white/80",
                      )}
                    >
                      {/* Check badge */}
                      {isActive && (
                        <span className="absolute right-2 top-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal-500">
                          <Check size={9} strokeWidth={3} className="text-white" />
                        </span>
                      )}

                      {/* Icon */}
                      <span
                        className={cn(
                          "mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg",
                          isActive ? `${tmpl.iconBg} shadow-sm` : "bg-slate-100 text-slate-400",
                        )}
                      >
                        <tmpl.icon size={14} strokeWidth={2} />
                      </span>

                      <span
                        className={cn(
                          "text-[11.5px] font-bold leading-tight",
                          isActive ? tmpl.textActive : "text-slate-800",
                        )}
                      >
                        {tmpl.label}
                      </span>
                      <span className="mt-0.5 text-[10px] text-slate-500">
                        {tmpl.sublabel}
                      </span>

                      {/* Description (only when active) */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            className="mt-1.5 text-[10px] leading-snug text-slate-500 overflow-hidden"
                          >
                            {tmpl.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>

              {/* Right: Preview */}
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/80">
                {/* Preview label bar */}
                <div className="flex shrink-0 items-center gap-1.5 border-b border-slate-200 bg-white/80 px-4 py-2">
                  <Eye size={11} strokeWidth={2} className="text-slate-400" />
                  <span className="text-[10.5px] font-medium text-slate-500">Pratinjau A4</span>
                  <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] text-slate-400">
                    Zoom 52%
                  </span>
                  <span className="ml-auto text-[9.5px] text-slate-400">
                    794 × 1123 px @ 96dpi
                  </span>
                </div>

                {/* Scrollable preview */}
                <div className="flex-1 overflow-y-auto p-5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active}
                      variants={PREVIEW_V}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="origin-top-left shadow-xl ring-1 ring-slate-300"
                      style={{
                        // zoom scales both layout AND visual size — cleaner than transform:scale
                        zoom: 0.52,
                        // marginBottom compensates: after zoom, the preview is visually shorter
                        // but scroll still sees full height. marginBottom=-(h*(1-0.52)) approx.
                        marginBottom: "-530px",
                      }}
                    >
                      <TemplateRenderer
                        active={active}
                        claim={claim}
                        batchKlaims={batchKlaims}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* ── Print Area (off-screen, always rendered when modal is open) ── */}
            <div
              id={PRINT_ROOT_ID}
              style={{ position: "fixed", left: "-99999px", top: 0, pointerEvents: "none" }}
              aria-hidden="true"
            >
              <TemplateRenderer active={active} claim={claim} batchKlaims={batchKlaims} />
            </div>

            {/* ── Footer ── */}
            <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white/90 px-5 py-3">
              {/* Left: Download Bundle */}
              <motion.button
                type="button"
                onClick={handleDownloadBundle}
                disabled={downloading}
                whileHover={!downloading ? { scale: 1.02 } : {}}
                whileTap={!downloading ? { scale: 0.98 } : {}}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2 size={13} strokeWidth={2} className="animate-spin text-teal-500" />
                ) : (
                  <Download size={13} strokeWidth={2} />
                )}
                {downloading ? "Memuat..." : "Unduh Bundle"}
              </motion.button>

              {/* Right: actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  Tutup
                </button>
                <motion.button
                  type="button"
                  onClick={handlePrint}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
                >
                  <Printer size={13} strokeWidth={2.2} />
                  Cetak Template
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
