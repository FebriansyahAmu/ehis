"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Stethoscope, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster, KunjunganRecord } from "@/lib/data";
import { UNIT_CFG, StatusBadge } from "./kunjungan/shared";
import KunjunganTabs from "./kunjungan/KunjunganTabs";

interface Props {
  patient: PatientMaster;
  kunjungan: KunjunganRecord;
}

export default function KunjunganDetailPage({ patient, kunjungan }: Props) {
  const unit = UNIT_CFG[kunjungan.unit];
  const icdCodes = kunjungan.kodeICD?.split(",").map(c => c.trim()).filter(Boolean) ?? [];
  const initials  = patient.name.split(" ").map(n => n[0]).slice(0, 2).join("");

  return (
    <div className="flex h-full flex-col bg-slate-50">

      {/* ── Header ── */}
      <header className="shrink-0 bg-white shadow-sm">

        {/* Unit accent strip */}
        <div className={cn("h-0.5 w-full", unit.accent)} />

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 px-5 py-2 text-[11px]">
          <Link
            href="/ehis-registration"
            className="text-slate-400 transition hover:text-slate-600"
          >
            Beranda
          </Link>
          <ChevronRight size={10} className="shrink-0 text-slate-300" />
          <Link
            href={`/ehis-registration/pasien/${patient.noRM}`}
            className="max-w-35 truncate text-slate-400 transition hover:text-slate-600"
          >
            {patient.name}
          </Link>
          <ChevronRight size={10} className="shrink-0 text-slate-300" />
          <span className="font-medium text-slate-600">Detail kunjungan</span>
          <Link
            href="/ehis-registration"
            className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={12} />
          </Link>
        </div>

        {/* Patient identity row */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 px-5 py-3.5"
        >
          {/* Avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-[13px] font-bold text-indigo-700 ring-2 ring-indigo-50">
            {initials}
          </div>

          {/* Name + IDs */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[15px] font-bold text-slate-900">{patient.name}</span>
              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9.5px] text-slate-500">
                {patient.noRM}
              </span>
              <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold", unit.bg, unit.text)}>
                {kunjungan.unit}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-indigo-600">
                {kunjungan.noPendaftaran}
              </span>
              <span className="text-slate-200">·</span>
              <span className="text-[11px] text-slate-400">{kunjungan.tanggal}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/ehis-registration/pasien/${patient.noRM}`}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95"
            >
              <ArrowLeft size={12} />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
            {kunjungan.klinisPath && (
              <Link
                href={kunjungan.klinisPath}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 transition hover:bg-indigo-100 active:scale-95"
              >
                <Stethoscope size={12} />
                <span className="hidden md:inline">Rekam Medis</span>
                <ExternalLink size={10} className="hidden md:block" />
              </Link>
            )}
            <StatusBadge status={kunjungan.status} />
          </div>
        </motion.div>
      </header>

      {/* ── Body: left sidebar + content ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <KunjunganTabs kunjungan={kunjungan} icdCodes={icdCodes} />
      </div>

    </div>
  );
}
