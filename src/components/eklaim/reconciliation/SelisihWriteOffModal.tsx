"use client";

/**
 * SelisihWriteOffModal — modal 2-step penanganan selisih rekonsiliasi (EK7.3).
 *
 * Step 1 — Review Detail Selisih:
 *   · 3 summary cards: Nominal Transfer · Total Dicocokkan · Selisih
 *   · Direction hint (underpaid = Write-off candidate, overpaid = Refund candidate)
 *   · Per-klaim breakdown table: No Klaim · Tarif Diajukan · Disetujui · Selisih
 *
 * Step 2 — Pilih Penanganan:
 *   · 3 option cards: Write-off · Refund · Pending
 *   · Alasan textarea (required, ≥ 20 char)
 *   · Approver input (required)
 *   · Submit dengan loading 800 ms
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Clock,
  ChevronRight,
  ChevronLeft,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/eklaim/money";
import type { ReconciliationRecord, SelisihStatus } from "@/lib/eklaim/eklaimShared";

import { BANDING_TONE, findClaimById, fmtDateShort } from "./reconciliationShared";

// ── Variants ──────────────────────────────────────────────────

const BACKDROP_V = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

const PANEL_V = {
  hidden:  { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 380, damping: 30 },
  },
  exit: { opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.18 } },
};

type Dir = 1 | -1;

const STEP_V = {
  enter:  (d: Dir) => ({ opacity: 0, x: d * 28 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit:   (d: Dir) => ({ opacity: 0, x: d * -28, transition: { duration: 0.16 } }),
};

// ── Status Options Config ─────────────────────────────────────

interface StatusOpt {
  value: SelisihStatus;
  label: string;
  desc:  string;
  hint:  string;
  tone:  "amber" | "sky" | "slate";
  Icon:  React.ComponentType<{ size?: number; className?: string }>;
}

const STATUS_OPTS: StatusOpt[] = [
  {
    value: "Write-off",
    label: "Write-off",
    desc:  "Selisih dihapuskan dari AR",
    hint:  "Penjamin tidak akan membayar sisa. Debet ke akun kerugian/biaya RS. Wajib persetujuan Ka.Keuangan.",
    tone:  "amber",
    Icon:  TrendingDown,
  },
  {
    value: "Refund",
    label: "Refund",
    desc:  "Kembalikan ke penjamin",
    hint:  "RS menerima lebih dari seharusnya. Buat credit memo/nota kredit ke penjamin.",
    tone:  "sky",
    Icon:  RotateCcw,
  },
  {
    value: "Pending",
    label: "Pending",
    desc:  "Tunda — masih sengketa",
    hint:  "Masih dalam proses klarifikasi atau sengketa dengan penjamin. Akan di-review kembali.",
    tone:  "slate",
    Icon:  Clock,
  },
];

// ── Step 1: Review Selisih ────────────────────────────────────

function ReviewStep({
  record,
  onNext,
}: {
  record: ReconciliationRecord;
  onNext: () => void;
}) {
  const totalMatched  = record.matchedClaims.reduce((acc, m) => acc + m.amount, 0n);
  const selisih       = record.selisih ?? 0n;
  const isUnderpaid   = totalMatched > record.nominalTransfer; // klaim > transfer → Write-off
  const isOverpaid    = record.nominalTransfer > totalMatched; // transfer > klaim → Refund

  return (
    <div className="flex min-h-0 flex-col overflow-hidden">
      <div className="flex-1 space-y-5 overflow-y-auto p-6 [scrollbar-width:thin]">
        {/* 3-card summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-teal-50 p-3.5 ring-1 ring-teal-200 text-center">
            <p className="text-sm font-medium text-teal-600">Nominal Transfer</p>
            <p className="mt-1.5 font-mono text-sm font-bold text-teal-800">
              {formatRupiah(record.nominalTransfer)}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3.5 ring-1 ring-emerald-200 text-center">
            <p className="text-sm font-medium text-emerald-600">Total Dicocokkan</p>
            <p className="mt-1.5 font-mono text-sm font-bold text-emerald-800">
              {formatRupiah(totalMatched)}
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3.5 ring-1 ring-amber-200 text-center">
            <p className="text-sm font-medium text-amber-600">Selisih</p>
            <p className="mt-1.5 font-mono text-sm font-bold text-amber-800">
              {formatRupiah(selisih)}
            </p>
          </div>
        </div>

        {/* Direction hint */}
        {(isUnderpaid || isOverpaid) && (
          <div
            className={cn(
              "flex items-start gap-2.5 rounded-xl p-3.5 text-sm ring-1",
              isUnderpaid
                ? "bg-amber-50 ring-amber-200 text-amber-700"
                : "bg-sky-50 ring-sky-200 text-sky-700",
            )}
          >
            {isUnderpaid ? (
              <TrendingDown size={15} className="mt-0.5 shrink-0" />
            ) : (
              <TrendingUp size={15} className="mt-0.5 shrink-0" />
            )}
            <span>
              {isUnderpaid
                ? `Total klaim melebihi nominal transfer sebesar ${formatRupiah(selisih)}. Pertimbangkan Write-off.`
                : `Transfer melebihi total klaim sebesar ${formatRupiah(selisih)}. Pertimbangkan Refund ke penjamin.`}
            </span>
          </div>
        )}

        {/* Per-claim breakdown */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Breakdown per Klaim ({record.matchedClaims.length})
          </p>
          <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
            <div className="max-h-48 overflow-x-auto overflow-y-auto [scrollbar-width:thin]">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50">
                    {["No Klaim", "Tarif Diajukan", "Disetujui", "Selisih"].map((h) => (
                      <th
                        key={h}
                        className="border-b border-slate-200 px-3 py-2 text-sm font-semibold uppercase tracking-wider text-slate-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.matchedClaims.map((match) => {
                    const claim        = findClaimById(match.claimId);
                    const tarifAjukan  = claim?.tarifRS ?? 0n;
                    const disetujui    = match.amount;
                    const rowSelisih   =
                      tarifAjukan >= disetujui
                        ? tarifAjukan - disetujui
                        : disetujui - tarifAjukan;
                    return (
                      <tr key={match.claimId} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2.5">
                          <p className="font-mono text-sm font-semibold text-slate-800">
                            {claim?.noKlaim ?? match.claimId}
                          </p>
                          {claim && (
                            <p className="text-sm text-slate-500">{claim.pasienId}</p>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-sm text-slate-700">
                          {tarifAjukan > 0n ? formatRupiah(tarifAjukan) : "—"}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-sm font-semibold text-emerald-700">
                          {formatRupiah(disetujui)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-sm font-bold text-amber-600">
                          {rowSelisih > 0n ? formatRupiah(rowSelisih) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Transfer meta strip */}
        <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">
            <span className="font-mono font-medium text-slate-700">{record.noTransfer}</span>
            {" · "}
            {record.bank}
            {" · "}
            {fmtDateShort(record.tanggalTransfer)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50/60 px-6 py-4">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          Pilih Penanganan
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Status Option Card ────────────────────────────────────────

function StatusOptionCard({
  opt,
  selected,
  onSelect,
}: {
  opt:      StatusOpt;
  selected: boolean;
  onSelect: () => void;
}) {
  const tone = BANDING_TONE[opt.tone];
  const Icon = opt.Icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl p-4 text-left ring-1 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        selected
          ? cn(tone.chipBg, "ring-2", tone.chipRing)
          : "bg-white ring-slate-200 hover:ring-slate-300",
      )}
    >
      <div
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg",
          selected ? tone.iconBg : "bg-slate-100",
        )}
      >
        <Icon size={15} className={selected ? tone.iconText : "text-slate-400"} />
      </div>
      <div>
        <p className={cn("text-sm font-bold", selected ? tone.chipText : "text-slate-700")}>
          {opt.label}
        </p>
        <p className="text-sm leading-snug text-slate-500">{opt.desc}</p>
      </div>
      <AnimatePresence>
        {selected && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className={cn("overflow-hidden text-sm leading-relaxed", tone.chipText)}
          >
            {opt.hint}
          </motion.p>
        )}
      </AnimatePresence>
    </button>
  );
}

// ── Step 2: Pilih Penanganan ──────────────────────────────────

function PenangananStep({
  selisih,
  onBack,
  onSave,
}: {
  selisih: bigint;
  onBack:  () => void;
  onSave:  (status: SelisihStatus, alasan: string, approver: string) => void;
}) {
  const [status, setStatus]     = useState<SelisihStatus | null>(null);
  const [alasan, setAlasan]     = useState("");
  const [approver, setApprover] = useState("");
  const [saving, setSaving]     = useState(false);

  const MIN_CHARS  = 20;
  const alasanOk   = alasan.trim().length >= MIN_CHARS;
  const approverOk = approver.trim().length > 0;
  const canSave    = status !== null && alasanOk && approverOk;

  async function handleSave() {
    if (!canSave || !status) return;
    setSaving(true);
    await new Promise<void>((r) => setTimeout(r, 800));
    onSave(status, alasan.trim(), approver.trim());
  }

  return (
    <div className="flex min-h-0 flex-col overflow-hidden">
      <div className="flex-1 space-y-5 overflow-y-auto p-6 [scrollbar-width:thin]">
        {/* Reminder banner */}
        <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
          <AlertTriangle size={14} className="shrink-0 text-amber-500" />
          <p className="text-sm text-amber-700">
            Selisih rekonsiliasi:{" "}
            <span className="font-mono font-bold">{formatRupiah(selisih)}</span>{" "}
            — pilih cara penanganan di bawah.
          </p>
        </div>

        {/* Status picker */}
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">
            Pilih Penanganan Selisih <span className="text-rose-500">*</span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            {STATUS_OPTS.map((opt) => (
              <StatusOptionCard
                key={opt.value}
                opt={opt}
                selected={status === opt.value}
                onSelect={() => setStatus(opt.value)}
              />
            ))}
          </div>
        </div>

        {/* Alasan */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">
              Alasan <span className="text-rose-500">*</span>
            </label>
            <span
              className={cn(
                "text-sm",
                alasanOk ? "font-medium text-emerald-600" : "text-slate-400",
              )}
            >
              {alasan.trim().length}/{MIN_CHARS}+ karakter
            </span>
          </div>
          <textarea
            rows={3}
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Jelaskan alasan penanganan selisih ini untuk keperluan audit…"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300/40"
          />
          {!alasanOk && alasan.length > 0 && (
            <p className="mt-1.5 text-sm text-rose-500">
              Alasan minimal {MIN_CHARS} karakter untuk keperluan audit.
            </p>
          )}
        </div>

        {/* Approver */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Disetujui oleh (Approver) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={approver}
            onChange={(e) => setApprover(e.target.value)}
            placeholder="Nama atau NIP pejabat yang menyetujui…"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300/40"
          />
          <p className="mt-1.5 text-sm text-slate-400">
            Biasanya Kepala Keuangan atau Direktur RS sesuai kebijakan internal.
          </p>
        </div>

        {/* Validation summary */}
        {!canSave && (status !== null || alasan.length > 0 || approver.length > 0) && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
            <span>Wajib diisi sebelum menyimpan:</span>
            <ul className="flex flex-wrap gap-1.5">
              {status === null && (
                <li className="rounded-md bg-rose-50 px-2 py-0.5 text-sm font-medium text-rose-600 ring-1 ring-rose-200">
                  Pilih penanganan
                </li>
              )}
              {!alasanOk && (
                <li className="rounded-md bg-rose-50 px-2 py-0.5 text-sm font-medium text-rose-600 ring-1 ring-rose-200">
                  Alasan {MIN_CHARS}+ karakter
                </li>
              )}
              {!approverOk && (
                <li className="rounded-md bg-rose-50 px-2 py-0.5 text-sm font-medium text-rose-600 ring-1 ring-rose-200">
                  Nama approver
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50/60 px-6 py-4">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <ChevronLeft size={15} />
          Kembali
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          {saving ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Menyimpan…
            </>
          ) : (
            <>
              <CheckCircle2 size={15} />
              Simpan Penanganan
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────

interface Props {
  record:  ReconciliationRecord;
  onClose: () => void;
  onSave:  (status: SelisihStatus, alasan: string, approver: string) => void;
}

export default function SelisihWriteOffModal({ record, onClose, onSave }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [dir, setDir]   = useState<Dir>(1);

  const selisih = record.selisih ?? 0n;

  function goNext() { setDir(1);  setStep(2); }
  function goBack() { setDir(-1); setStep(1); }

  return (
    <motion.div
      variants={BACKDROP_V}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.18 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
    >
      <motion.div
        variants={PANEL_V}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-amber-50/60 px-6 py-4">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 ring-1 ring-amber-300">
            <AlertTriangle size={16} className="text-amber-600" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-800">Tangani Selisih Rekonsiliasi</h2>
            <p className="font-mono text-sm text-slate-500">{record.noTransfer}</p>
          </div>

          {/* Step pill indicators */}
          <div className="flex items-center gap-1.5">
            {([1, 2] as const).map((s) => (
              <div
                key={s}
                className={cn(
                  "h-2 rounded-full transition-all duration-200",
                  s === step ? "w-8 bg-teal-500" : "w-2 bg-slate-200",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="ml-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step label bar */}
        <div className="shrink-0 border-b border-slate-100 bg-slate-50/40 px-6 py-2">
          <p className="text-sm text-slate-500">
            Langkah {step} dari 2 —{" "}
            <span className="font-semibold text-slate-700">
              {step === 1 ? "Review Detail Selisih" : "Pilih Penanganan"}
            </span>
          </p>
        </div>

        {/* Animated step content */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            {step === 1 ? (
              <motion.div
                key="step1"
                custom={dir}
                variants={STEP_V}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex min-h-0 w-full flex-col overflow-hidden"
              >
                <ReviewStep record={record} onNext={goNext} />
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                custom={dir}
                variants={STEP_V}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex min-h-0 w-full flex-col overflow-hidden"
              >
                <PenangananStep selisih={selisih} onBack={goBack} onSave={onSave} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
