"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, ShieldCheck, Printer, Send, Undo2,
  Calendar, Stethoscope, BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UNIT_CFG, KELAS_CFG } from "../tagihan/tagihanShared";
import { STATUS_BANNER_CFG } from "./invoiceShared";
import type { InvoiceDetail } from "./invoiceShared";
import InvoiceStatusTimeline from "./InvoiceStatusTimeline";

interface Props {
  detail: InvoiceDetail;
  onPrint: () => void;
  onSubmitKlaim?: () => void;
  onRefund?: () => void;
}

export default function PatientBannerBilling({ detail, onPrint, onSubmitKlaim, onRefund }: Props) {
  const unit  = UNIT_CFG[detail.unit];
  const kelas = KELAS_CFG[detail.kelas];
  const stat  = STATUS_BANNER_CFG[detail.status];
  const StatusIcon = stat.icon;
  const UnitIcon   = unit.icon;

  const showKlaim  = detail.penjamin.tipe !== "umum" && onSubmitKlaim;
  const showRefund = detail.dibayar > 0 && onRefund;

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      {/* Breadcrumb / back */}
      <div className="flex items-center justify-between px-6 pt-3 pb-2">
        <Link
          href="/ehis-billing/tagihan"
          className="group inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 transition-colors hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-400"
        >
          <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
          Tagihan Board
        </Link>
        <span className="font-mono text-[11px] text-slate-400">{detail.noTagihan}</span>
      </div>

      {/* Main banner row */}
      <div className="grid gap-4 px-6 pb-3 lg:grid-cols-[1fr_auto] lg:items-start">
        {/* Left: identity & meta */}
        <div className="flex gap-3">
          {/* Avatar */}
          <Avatar nama={detail.pasien.nama} />

          {/* Identity */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="truncate text-[18px] font-bold text-slate-900 dark:text-slate-50">
                {detail.pasien.nama}
              </h1>
              {detail.pasien.verified && (
                <span title="Identitas terverifikasi" className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <BadgeCheck size={11} />
                  Verified
                </span>
              )}
              <span className="text-[12px] text-slate-500 dark:text-slate-400">
                · {detail.pasien.gender === "L" ? "♂" : "♀"} {detail.pasien.age} thn · <span className="font-mono">{detail.pasien.noRM}</span>
              </span>
            </div>

            {/* Chips strip */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Chip icon={UnitIcon} bg={unit.bg} text={unit.text} ring={unit.ring}>
                {unit.label}
              </Chip>
              <Chip>{kelas.label}</Chip>
              <Chip bg="bg-slate-50" text="text-slate-700" ring="ring-slate-200">
                {detail.penjamin.nama}
              </Chip>
              {detail.penjamin.noSEP && (
                <Chip icon={ShieldCheck} bg="bg-sky-50" text="text-sky-700" ring="ring-sky-200">
                  <span className="font-mono text-[10.5px]">{detail.penjamin.noSEP}</span>
                </Chip>
              )}
            </div>

            {/* Meta line */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Calendar size={11} />
                {formatTanggalLong(detail.tanggalISO)}
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="inline-flex items-center gap-1">
                <Stethoscope size={11} />
                {detail.dpjp}
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="font-mono">{detail.noKunjungan}</span>
            </div>
          </div>
        </div>

        {/* Right: status + actions */}
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12.5px] font-semibold ring-1",
              stat.bg, stat.text, stat.ring,
            )}
          >
            <StatusIcon size={13} />
            {stat.label}
          </motion.div>

          <div className="flex items-center gap-1.5">
            <ActionBtn icon={Printer} label="Print Struk" onClick={onPrint} />
            {showKlaim && (
              <ActionBtn icon={Send} label="Submit Klaim" primary onClick={onSubmitKlaim!} />
            )}
            {showRefund && (
              <ActionBtn icon={Undo2} label="Refund" onClick={onRefund!} />
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="border-t border-slate-100 px-6 py-2.5 dark:border-slate-800/60">
        <InvoiceStatusTimeline timeline={detail.timeline} />
      </div>
    </header>
  );
}

// ── Sub-components ──────────────────────────────────────

function Avatar({ nama }: { nama: string }) {
  const initials = nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      aria-hidden
      className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-[13px] font-bold text-amber-800 ring-1 ring-amber-300/50 dark:from-amber-900/40 dark:to-amber-800/40 dark:text-amber-200"
    >
      {initials}
    </div>
  );
}

function Chip({
  children, icon: Icon, bg = "bg-slate-100", text = "text-slate-700", ring = "ring-slate-200",
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  bg?: string; text?: string; ring?: string;
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1",
      bg, text, ring,
    )}>
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

function ActionBtn({
  icon: Icon, label, primary, onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-all duration-150 active:scale-[0.97]",
        primary
          ? "bg-amber-600 text-white shadow-sm hover:bg-amber-700"
          : "border border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-amber-950/30",
      )}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

function formatTanggalLong(iso: string): string {
  const d = new Date(iso);
  const tgl = d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  const jam = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${tgl} · ${jam}`;
}
