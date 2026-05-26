"use client";

/**
 * ClaimBannerHeader — sticky header banner untuk halaman Klaim Detail (EK3.1).
 *
 * Visual hierarchy (single banner, tinggi ~180-220px desktop):
 *  Row 1 │ Breadcrumb ← + noKlaim mono + invoice mono + status chip besar (kanan)
 *  Row 2 │ Avatar + Identity (nama + meta) + Chips strip (penjamin, kelas, SEP, kunjungan, unit)
 *        │ ── di kanan: Tarif Card mini (Tarif RS + Grouper + Selisih)
 *  Row 3 │ Meta line (tanggal · LOS · DPJP · Coder)
 *  Row 4 │ Timeline mini horizontal 5-stage
 *  Row 5 │ Berkas progress bar (kiri) + Quick action buttons (kanan)
 *
 * Color: accent teal · CTA primary sky · "no indigo".
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
  UserRound,
  FileText,
  Receipt,
  Calendar,
  Activity,
  UserCheck,
  Ticket,
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
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";
import { patientMasterData } from "@/lib/data";

interface Props {
  claim: ClaimRecord;
  onSubmit?: () => void;
  onGenerateBerkas?: () => void;
  onPrintResume?: () => void;
}

export default function ClaimBannerHeader({
  claim,
  onSubmit,
  onGenerateBerkas,
  onPrintResume,
}: Props) {
  const router = useRouter();
  const nama = patientMasterData[claim.pasienId]?.name ?? `Pasien ${claim.pasienId}`;
  const verified = !!patientMasterData[claim.pasienId];
  const statusTone = KLAIM_TONE[statusToneForBanner(claim.statusPenjamin)];
  const progress = computeBerkasProgress(claim.berkas);
  const actions = computeQuickActionState(claim);

  const handleBack = () => {
    router.push("/ehis-eklaim/klaim");
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative overflow-hidden border-b border-slate-200 bg-white"
    >
      {/* Subtle teal accent gradient bar di top */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal-400 via-sky-400 to-teal-400" />

      <div className="px-4 pt-3.5 pb-3 sm:px-6">
        {/* ── Row 1: Breadcrumb · noKlaim · status chip ── */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700"
              aria-label="Kembali ke Klaim Board"
            >
              <ArrowLeft size={12} />
              Klaim Board
            </button>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-[12px] font-semibold text-slate-700 ring-1 ring-slate-200">
              <FileText size={11} className="text-teal-600" />
              <span className="font-mono tabular-nums">{claim.noKlaim}</span>
            </span>
            <Link
              href={`/ehis-billing/tagihan/${claim.invoiceId}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-[12px] font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 hover:text-teal-700"
              title="Buka invoice billing"
            >
              <Receipt size={11} className="text-slate-500" />
              <span className="font-mono tabular-nums">{claim.invoiceId}</span>
            </Link>
            <Link
              href={`/ehis-registration/pasien/${claim.pasienId}/kunjungan/${claim.kunjunganId}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-[12px] font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 hover:text-teal-700"
              title="Buka detail kunjungan"
            >
              <Ticket size={11} className="text-slate-500" />
              <span className="font-mono tabular-nums">{claim.kunjunganId}</span>
            </Link>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12.5px] font-bold ring-1 shadow-sm",
              statusTone.chipBg,
              statusTone.chipText,
              statusTone.chipRing,
            )}
            title={STATUS_CFG[claim.statusPenjamin].label}
          >
            <span
              className={cn("inline-block h-1.5 w-1.5 rounded-full", statusTone.dot)}
            />
            {STATUS_CFG[claim.statusPenjamin].label}
          </div>
        </div>

        {/* ── Row 2: Identity (avatar + nama + chips) + Tarif card ── */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          {/* Left: Avatar + Identity */}
          <div className="flex min-w-0 items-start gap-3">
            <Avatar nama={nama} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className="text-[18px] font-bold tracking-tight text-slate-900 sm:text-[19px]"
                  title={nama}
                >
                  {nama}
                </h1>
                {verified && (
                  <span
                    className="inline-flex items-center gap-0.5 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-sky-700 ring-1 ring-sky-200"
                    title="Identitas terverifikasi"
                  >
                    <CheckCircle2 size={9} strokeWidth={2.8} />
                    Verified
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12px] text-slate-500">
                <span className="font-mono tabular-nums">{claim.pasienId}</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span>{claim.age} thn</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span>{claim.gender === "L" ? "Laki-laki" : "Perempuan"}</span>
              </p>

              {/* Chips strip */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <PenjaminBadge penjamin={claim.penjamin} size="sm" />
                <KelasChip kelas={claim.kelas} />
                {claim.penjamin.sep && (
                  <span
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11.5px] font-mono font-semibold text-emerald-700 ring-1 ring-emerald-200"
                    title={`SEP ${claim.penjamin.sep.noSEP} · berlaku ${fmtDateShort(claim.penjamin.sep.masaBerlaku.from)} → ${fmtDateShort(claim.penjamin.sep.masaBerlaku.to)}`}
                  >
                    <UserCheck size={10} strokeWidth={2.6} />
                    {claim.penjamin.sep.noSEP}
                  </span>
                )}
                <UnitChip tipe={claim.tipePelayanan} />
                <KompetensiChip tingkat={claim.tingkatKompetensiRS} />
              </div>

              {/* Meta line */}
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} className="text-slate-400" />
                  <span className="text-slate-500">Tanggal:</span>
                  <span className="font-medium text-slate-700">
                    {fmtDateShort(claim.createdAt)}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Activity size={11} className="text-slate-400" />
                  <span className="text-slate-500">LOS:</span>
                  <span className="font-mono font-medium tabular-nums text-slate-700">
                    {claim.los} hari
                  </span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Stethoscope size={11} className="text-slate-400" />
                  <span className="text-slate-500">DPJP:</span>
                  <span className="font-medium text-slate-700">
                    {claim.verifierBpjs ? "dr. Budi Santoso Sp.PD" : "—"}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <UserRound size={11} className="text-slate-400" />
                  <span className="text-slate-500">Coder:</span>
                  <span className="font-medium text-slate-700">
                    {claim.createdBy || "Lina (Coder RM)"}
                  </span>
                </span>
              </p>
            </div>
          </div>

          {/* Right: Tarif Card (Rp RS + Grouper + Selisih) */}
          <TarifMiniCard claim={claim} />
        </div>

        {/* ── Row 3: Timeline mini horizontal ── */}
        <div className="mt-3.5 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5">
          <ClaimTimelineMini status={claim.statusPenjamin} />
        </div>

        {/* ── Row 4: Berkas progress + Quick actions ── */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {/* Berkas progress (kiri) */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="min-w-0 flex-1 max-w-100">
              <div className="flex items-center justify-between">
                <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">
                  Berkas Wajib
                </p>
                <p className="font-mono text-[12px] tabular-nums">
                  <span
                    className={cn(
                      "font-bold",
                      progress.isComplete ? "text-emerald-700" : "text-amber-700",
                    )}
                  >
                    {progress.readyWajib}
                  </span>
                  <span className="text-slate-400">/{progress.totalWajib}</span>
                  <span className="ml-2 text-slate-500">{progress.percent}%</span>
                </p>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                  className={cn(
                    "h-full rounded-full",
                    progress.isComplete
                      ? "bg-linear-to-r from-emerald-400 to-emerald-500"
                      : "bg-linear-to-r from-amber-400 to-amber-500",
                  )}
                />
              </div>
            </div>
          </div>

          {/* Quick actions (kanan) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {actions.showSubmit && (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!actions.canSubmit}
                title={actions.submitDisabledReason}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold shadow-sm transition-all duration-150 active:scale-[0.97]",
                  actions.canSubmit
                    ? "bg-sky-600 text-white hover:bg-sky-700 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
                    : "cursor-not-allowed bg-slate-50 text-slate-400 ring-1 ring-slate-200",
                )}
              >
                <Send size={12} strokeWidth={2.4} />
                Submit ke BPJS
              </button>
            )}
            <button
              type="button"
              onClick={onGenerateBerkas}
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
            >
              <FileDown size={12} strokeWidth={2.4} />
              Generate Berkas
            </button>
            {actions.showPrintResume && (
              <button
                type="button"
                onClick={onPrintResume}
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
              >
                <Printer size={12} strokeWidth={2.4} />
                Print Resume
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}

// ── Avatar ─────────────────────────────────────────────

function Avatar({ nama }: { nama: string }) {
  const initials = avatarInitials(nama);
  return (
    <div
      className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-teal-100 via-sky-100 to-teal-50 text-[14px] font-bold text-teal-700 ring-1 ring-teal-200"
      aria-hidden
    >
      <span className="tracking-wide">{initials}</span>
      <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full bg-white ring-1 ring-teal-200">
        <UserRound size={7} strokeWidth={2.8} className="text-teal-600" />
      </span>
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
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold ring-1",
        tone.chipBg,
        tone.chipText,
        tone.chipRing,
      )}
      title={`Kelas ${cfg.label}`}
    >
      <BedDouble size={10} strokeWidth={2.6} />
      {cfg.label}
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
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold ring-1",
        tone.chipBg,
        tone.chipText,
        tone.chipRing,
      )}
      title={cfg.label}
    >
      <Icon size={10} strokeWidth={2.6} />
      {cfg.label}
    </span>
  );
}

// ── Kompetensi Chip ────────────────────────────────────

const KOMPETENSI_LABEL: Record<ClaimRecord["tingkatKompetensiRS"], string> = {
  dasar: "Kompetensi Dasar",
  menengah: "Menengah",
  utama: "Utama",
  komprehensif: "Komprehensif",
};

function KompetensiChip({ tingkat }: { tingkat: ClaimRecord["tingkatKompetensiRS"] }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 text-[11.5px] font-medium text-slate-600 ring-1 ring-slate-200"
      title={`Tingkat kompetensi RS · ${KOMPETENSI_LABEL[tingkat]} (Perpres 59/2024)`}
    >
      <Sun size={10} strokeWidth={2.4} className="text-amber-500" />
      <span className="capitalize">{tingkat}</span>
    </span>
  );
}

// ── Tarif Mini Card ────────────────────────────────────

function TarifMiniCard({ claim }: { claim: ClaimRecord }) {
  const tarifGrouper =
    claim.iDRG?.tarifAktual ?? claim.inaCbgLegacy?.tarif.kelas2 ?? 0n;
  const selisih = claim.selisih ?? 0n;
  const selisihTone =
    selisih > 0n ? "emerald" : selisih < 0n ? "rose" : "slate";
  const tone = KLAIM_TONE[selisihTone];

  return (
    <div className="grid w-full grid-cols-3 gap-2 self-start rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 sm:w-auto sm:min-w-90">
      <TarifItem
        label="Tarif RS"
        value={fmtRupiahKpi(claim.tarifRS)}
        title={fmtRupiahFull(claim.tarifRS)}
      />
      <TarifItem
        label="Tarif Grouper"
        value={fmtRupiahKpi(tarifGrouper)}
        title={fmtRupiahFull(tarifGrouper)}
        valueClass="text-teal-700"
      />
      <TarifItem
        label="Selisih"
        value={`${selisih > 0n ? "+" : ""}${fmtRupiahKpi(selisih)}`}
        title={fmtRupiahFull(selisih)}
        valueClass={tone.chipText}
        accentBar={tone.dot}
      />
    </div>
  );
}

function TarifItem({
  label,
  value,
  title,
  valueClass,
  accentBar,
}: {
  label: string;
  value: string;
  title?: string;
  valueClass?: string;
  accentBar?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
        {accentBar && (
          <span className={cn("inline-block h-1.5 w-1.5 rounded-full", accentBar)} />
        )}
        {label}
      </span>
      <span
        className={cn(
          "mt-0.5 truncate font-mono text-[13px] font-bold tabular-nums text-slate-800",
          valueClass,
        )}
        title={title}
      >
        {value}
      </span>
    </div>
  );
}
