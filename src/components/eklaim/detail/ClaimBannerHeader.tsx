"use client";

/**
 * ClaimBannerHeader — compact header banner untuk halaman Klaim Detail (EK3.1+ revisi).
 *
 * Redesign 2026-05-27: dari 5-row stack (~200px) → 3-row dense (~130px) supaya
 * tab content lebih lega. Lebih colorful: gradient avatar (teal→sky→emerald),
 * Tarif/Berkas mini-card dengan gradient bg, top accent bar 3-warna, status
 * chip sparkle untuk Paid/Approved.
 *
 * Layout (sticky · ~130px desktop):
 *  Row 1 (28px) │ ← Klaim · noKlaim · [INV↗] [KJ↗]                  [STATUS BIG]
 *  Row 2 (62px) │ [Avatar] Identity (3-line) │ Tarif card + Berkas card
 *  Row 3 (36px) │ Timeline mini             │ [Submit][Gen][Print]
 *
 * Accent: teal primary, sky CTA, emerald success, amber peringatan, rose error.
 * **No indigo / violet.**
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  FileDown,
  Printer,
  CheckCircle2,
  BedDouble,
  Stethoscope,
  Sun,
  FileText,
  Receipt,
  Ticket,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Scale,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  fmtRupiahKpi,
  fmtRupiahFull,
} from "@/components/eklaim/beranda/berandaEklaimShared";
import {
  KLAIM_TONE,
  STATUS_CFG,
  KELAS_CFG,
  UNIT_CFG,
} from "../klaim/klaimBoardShared";
import PenjaminBadge from "../klaim/shared/PenjaminBadge";
import ClaimTimelineMini from "./parts/ClaimTimelineMini";
import {
  avatarInitials,
  computeBerkasProgress,
  computeQuickActionState,
  fmtDateShort,
  statusToneForBanner,
} from "./claimDetailShared";
import type { ClaimRecord, ClaimStatus } from "@/lib/eklaim/eklaimShared";
import { patientMasterData } from "@/lib/data";

interface Props {
  claim: ClaimRecord;
  onSubmit?: () => void;
  onGenerateBerkas?: () => void;
  onPrintResume?: () => void;
  onAjukanBanding?: () => void;
}

/** Status yang menampilkan sparkle decoration (success/completion). */
const SPARKLE_STATUSES: ReadonlyArray<ClaimStatus> = [
  "Paid",
  "Approved",
  "Banding Approved",
];

export default function ClaimBannerHeader({
  claim,
  onSubmit,
  onGenerateBerkas,
  onPrintResume,
  onAjukanBanding,
}: Props) {
  const router = useRouter();
  const nama = patientMasterData[claim.pasienId]?.name ?? `Pasien ${claim.pasienId}`;
  const verified = !!patientMasterData[claim.pasienId];
  const statusTone = KLAIM_TONE[statusToneForBanner(claim.statusPenjamin)];
  const showSparkle = SPARKLE_STATUSES.includes(claim.statusPenjamin);
  const progress = computeBerkasProgress(claim.berkas);
  const actions = computeQuickActionState(claim);
  const tarifGrouper =
    claim.iDRG?.tarifAktual ?? claim.inaCbgLegacy?.tarif.kelas2 ?? 0n;
  const selisih = claim.selisih ?? 0n;
  const selisihPositif = selisih > 0n;
  const selisihNegatif = selisih < 0n;

  const handleBack = () => router.push("/ehis-eklaim/klaim");

  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative overflow-hidden border-b border-slate-200 bg-linear-to-br from-white via-teal-50/20 to-sky-50/20"
    >
      {/* Top accent: multi-color animated gradient bar */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.75 bg-linear-to-r from-teal-400 via-sky-500 to-emerald-400 bg-size-[200%_100%]"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      {/* Subtle radial blob (decorative) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 right-4 h-32 w-32 rounded-full bg-linear-to-br from-teal-200/30 via-sky-200/20 to-transparent blur-2xl"
      />

      <div className="relative space-y-2 px-4 pt-3 pb-2.5 sm:px-6">
        {/* ── Row 1: Breadcrumb + Status ── */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700"
              aria-label="Kembali ke Klaim Board"
            >
              <ArrowLeft size={11} />
              Klaim Board
            </button>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-linear-to-r from-teal-50 to-sky-50 px-1.5 py-0.5 text-[12px] font-bold text-teal-800 ring-1 ring-teal-200">
              <FileText size={10} className="text-teal-600" />
              <span className="font-mono tabular-nums">{claim.noKlaim}</span>
            </span>
            <Link
              href={`/ehis-billing/tagihan/kunjungan/${claim.kunjunganId}`}
              className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[11.5px] font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-amber-50 hover:text-amber-700 hover:ring-amber-200"
              title="Buka invoice billing"
            >
              <Receipt size={10} className="text-amber-500" />
              <span className="font-mono tabular-nums">{claim.invoiceId}</span>
            </Link>
            <Link
              href={`/ehis-registration/pasien/${claim.pasienId}/kunjungan/${claim.kunjunganId}`}
              className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[11.5px] font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-sky-50 hover:text-sky-700 hover:ring-sky-200"
              title="Buka detail kunjungan"
            >
              <Ticket size={10} className="text-sky-500" />
              <span className="font-mono tabular-nums">{claim.kunjunganId}</span>
            </Link>
          </div>

          {/* Status chip — big · animated sparkle for success states */}
          <div
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12.5px] font-bold shadow-sm ring-1",
              statusTone.chipBg,
              statusTone.chipText,
              statusTone.chipRing,
            )}
            title={STATUS_CFG[claim.statusPenjamin].label}
          >
            {showSparkle && (
              <motion.span
                aria-hidden
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="text-amber-400"
              >
                <Sparkles size={11} strokeWidth={2.6} />
              </motion.span>
            )}
            <span
              className={cn("inline-block h-1.5 w-1.5 rounded-full", statusTone.dot)}
            />
            {STATUS_CFG[claim.statusPenjamin].label}
          </div>
        </div>

        {/* ── Row 2: Identity + Tarif/Berkas mini-cards ── */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
          {/* Left: avatar + identity */}
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar nama={nama} verified={verified} />
            <div className="min-w-0 flex-1">
              {/* Line 1: Nama + verified + age/gender/RM */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                <h1
                  className="truncate text-[16px] font-bold tracking-tight text-slate-900"
                  title={nama}
                >
                  {nama}
                </h1>
                <span className="font-mono text-[11.5px] tabular-nums text-slate-500">
                  {claim.pasienId}
                </span>
                <span className="text-[11.5px] text-slate-500">
                  · {claim.age} thn · {claim.gender === "L" ? "L" : "P"}
                </span>
                <span className="text-[11.5px] text-slate-400">
                  · LOS{" "}
                  <span className="font-mono font-semibold tabular-nums text-slate-700">
                    {claim.los}h
                  </span>
                </span>
                <span className="text-[11.5px] text-slate-400">
                  · {fmtDateShort(claim.createdAt)}
                </span>
              </div>

              {/* Line 2: Chips strip */}
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <PenjaminBadge penjamin={claim.penjamin} size="sm" />
                <KelasChip kelas={claim.kelas} />
                {claim.penjamin.sep && (
                  <SEPChip noSEP={claim.penjamin.sep.noSEP} masaBerlaku={claim.penjamin.sep.masaBerlaku} />
                )}
                <UnitChip tipe={claim.tipePelayanan} />
                <KompetensiChip tingkat={claim.tingkatKompetensiRS} />
                <span className="ml-1 text-[10.5px] text-slate-400">
                  DPJP <span className="font-medium text-slate-600">dr. Andi Sp.PD</span>
                  <span className="mx-1 text-slate-300">·</span>
                  Coder <span className="font-medium text-slate-600">Lina</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Tarif mini + Berkas mini (side-by-side) */}
          <div className="flex items-stretch gap-1.5 self-start">
            <TarifInlineCard
              tarifRS={claim.tarifRS}
              tarifGrouper={tarifGrouper}
              selisih={selisih}
              positif={selisihPositif}
              negatif={selisihNegatif}
            />
            <BerkasInlineCard
              ready={progress.readyWajib}
              total={progress.totalWajib}
              percent={progress.percent}
              isComplete={progress.isComplete}
            />
          </div>
        </div>

        {/* ── Row 3: Timeline + Actions ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-white/60 px-2 py-1.5">
          <div className="min-w-0 flex-1">
            <ClaimTimelineMini status={claim.statusPenjamin} />
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-1">
            {actions.showSubmit && (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!actions.canSubmit}
                title={actions.submitDisabledReason}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-semibold shadow-sm transition-all duration-150 active:scale-[0.97]",
                  actions.canSubmit
                    ? "bg-linear-to-br from-sky-500 to-sky-700 text-white hover:from-sky-600 hover:to-sky-800 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
                    : "cursor-not-allowed bg-slate-50 text-slate-400 ring-1 ring-slate-200",
                )}
              >
                <Send size={11} strokeWidth={2.4} />
                Submit BPJS
              </button>
            )}
            {actions.showBanding && (
              <button
                type="button"
                onClick={onAjukanBanding}
                className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-[12px] font-semibold text-rose-700 ring-1 ring-rose-200 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30"
              >
                <Scale size={11} strokeWidth={2.4} />
                Ajukan Banding T{actions.defaultBandingTingkat}
              </button>
            )}
            <button
              type="button"
              onClick={onGenerateBerkas}
              className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[12px] font-semibold text-teal-700 ring-1 ring-teal-200 transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
            >
              <FileDown size={11} strokeWidth={2.4} />
              Generate
            </button>
            {actions.showPrintResume && (
              <button
                type="button"
                onClick={onPrintResume}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[12px] font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30"
              >
                <Printer size={11} strokeWidth={2.4} />
                Print
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}

// ── Avatar (vibrant gradient) ──────────────────────────

function Avatar({ nama, verified }: { nama: string; verified: boolean }) {
  const initials = avatarInitials(nama);
  return (
    <div
      className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-teal-400 via-sky-500 to-emerald-400 text-[14px] font-extrabold text-white shadow-md ring-2 ring-white"
      aria-hidden
    >
      <span className="tracking-wide drop-shadow-sm">{initials}</span>
      {verified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white"
          title="Identitas terverifikasi"
        >
          <CheckCircle2 size={9} strokeWidth={3.2} className="text-white" />
        </span>
      )}
    </div>
  );
}

// ── Kelas Chip ─────────────────────────────────────────

function KelasChip({ kelas }: { kelas: ClaimRecord["kelas"] }) {
  const cfg = KELAS_CFG[kelas];
  const tone = KLAIM_TONE[cfg.tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold ring-1",
        tone.chipBg,
        tone.chipText,
        tone.chipRing,
      )}
      title={`Kelas ${cfg.label}`}
    >
      <BedDouble size={9} strokeWidth={2.6} />
      {cfg.label}
    </span>
  );
}

// ── SEP Chip ───────────────────────────────────────────

function SEPChip({
  noSEP,
  masaBerlaku,
}: {
  noSEP: string;
  masaBerlaku: { from: string; to: string };
}) {
  const last5 = noSEP.slice(-5);
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-md bg-linear-to-r from-emerald-50 to-teal-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200"
      title={`SEP ${noSEP} · berlaku ${fmtDateShort(masaBerlaku.from)} → ${fmtDateShort(masaBerlaku.to)}`}
    >
      <CheckCircle2 size={9} strokeWidth={2.8} />
      SEP·{last5}
    </span>
  );
}

// ── Unit Chip ──────────────────────────────────────────

function UnitChip({ tipe }: { tipe: ClaimRecord["tipePelayanan"] }) {
  const cfg = UNIT_CFG[tipe];
  const tone = KLAIM_TONE[cfg.tone];
  const Icon = cfg.icon ?? Stethoscope;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold ring-1",
        tone.chipBg,
        tone.chipText,
        tone.chipRing,
      )}
      title={cfg.label}
    >
      <Icon size={9} strokeWidth={2.6} />
      {cfg.short ?? cfg.label}
    </span>
  );
}

// ── Kompetensi Chip ────────────────────────────────────

const KOMPETENSI_LABEL: Record<ClaimRecord["tingkatKompetensiRS"], string> = {
  dasar: "Dasar",
  menengah: "Menengah",
  utama: "Utama",
  komprehensif: "Komprehensif",
};

function KompetensiChip({ tingkat }: { tingkat: ClaimRecord["tingkatKompetensiRS"] }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200"
      title={`Tingkat kompetensi RS · ${KOMPETENSI_LABEL[tingkat]} (Perpres 59/2024)`}
    >
      <Sun size={9} strokeWidth={2.6} className="text-amber-500" />
      {KOMPETENSI_LABEL[tingkat]}
    </span>
  );
}

// ── Tarif Inline Card (compact) ────────────────────────

function TarifInlineCard({
  tarifRS,
  tarifGrouper,
  selisih,
  positif,
  negatif,
}: {
  tarifRS: bigint;
  tarifGrouper: bigint;
  selisih: bigint;
  positif: boolean;
  negatif: boolean;
}) {
  const TrendIcon = positif ? TrendingUp : negatif ? TrendingDown : TrendingUp;
  const selisihTone = positif ? "emerald" : negatif ? "rose" : "slate";
  const tone = KLAIM_TONE[selisihTone];

  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-teal-200 bg-linear-to-br from-teal-50/70 via-emerald-50/40 to-white px-2.5 py-1.5 shadow-sm"
      title={`Tarif RS ${fmtRupiahFull(tarifRS)} · Tarif Grouper ${fmtRupiahFull(tarifGrouper)} · Selisih ${fmtRupiahFull(selisih)}`}
    >
      <div className="flex flex-col leading-tight">
        <span className="text-[9.5px] font-bold uppercase tracking-wider text-teal-700">
          Tarif
        </span>
        <span className="font-mono text-[12px] font-bold tabular-nums text-slate-700">
          {fmtRupiahKpi(tarifRS)}
        </span>
      </div>
      <span className="text-slate-300">→</span>
      <div className="flex flex-col leading-tight">
        <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-700">
          Grouper
        </span>
        <span className="font-mono text-[12px] font-bold tabular-nums text-emerald-700">
          {fmtRupiahKpi(tarifGrouper)}
        </span>
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ring-1",
          tone.chipBg,
          tone.chipText,
          tone.chipRing,
        )}
      >
        <TrendIcon size={10} strokeWidth={2.6} />
        {positif ? "+" : ""}
        {fmtRupiahKpi(selisih)}
      </span>
    </div>
  );
}

// ── Berkas Inline Card (compact) ───────────────────────

function BerkasInlineCard({
  ready,
  total,
  percent,
  isComplete,
}: {
  ready: number;
  total: number;
  percent: number;
  isComplete: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 shadow-sm",
        isComplete
          ? "border-emerald-200 bg-linear-to-br from-emerald-50/80 via-teal-50/40 to-white"
          : "border-amber-200 bg-linear-to-br from-amber-50/80 via-white to-amber-50/30",
      )}
      title={`${ready} dari ${total} berkas wajib siap (${percent}%)`}
    >
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            "text-[9.5px] font-bold uppercase tracking-wider",
            isComplete ? "text-emerald-700" : "text-amber-700",
          )}
        >
          Berkas
        </span>
        <span className="font-mono text-[12px] font-bold tabular-nums">
          <span className={isComplete ? "text-emerald-700" : "text-amber-700"}>
            {ready}
          </span>
          <span className="text-slate-400">/{total}</span>
        </span>
      </div>

      {/* Progress ring (mini circular) */}
      <div className="relative h-7 w-7 shrink-0">
        <svg viewBox="0 0 36 36" className="h-7 w-7 -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="rgb(226 232 240)"
            strokeWidth="3"
          />
          <motion.circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke={isComplete ? "rgb(16 185 129)" : "rgb(245 158 11)"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="87.96"
            initial={{ strokeDashoffset: 87.96 }}
            animate={{ strokeDashoffset: 87.96 - (percent / 100) * 87.96 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          />
        </svg>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center font-mono text-[9px] font-bold tabular-nums",
            isComplete ? "text-emerald-700" : "text-amber-700",
          )}
        >
          {percent}
        </span>
      </div>
    </div>
  );
}
