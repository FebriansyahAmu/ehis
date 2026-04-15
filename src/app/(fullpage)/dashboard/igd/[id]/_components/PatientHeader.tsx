import { X, Clock, User, CreditCard, Phone } from "lucide-react";
import Link from "next/link";
import type { IGDPatientDetail, TriageLevel, IGDStatus } from "@/app/lib/data";
import { cn } from "@/app/lib/utils";

const TRIAGE_BADGE: Record<TriageLevel, { label: string; cls: string }> = {
  P1: { label: "P1 · Merah",  cls: "bg-rose-100 text-rose-700 ring-1 ring-rose-300" },
  P2: { label: "P2 · Kuning", cls: "bg-amber-100 text-amber-700 ring-1 ring-amber-300" },
  P3: { label: "P3 · Hijau",  cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300" },
  P4: { label: "P4 · Hitam",  cls: "bg-slate-200 text-slate-700 ring-1 ring-slate-300" },
};

const TRIAGE_STRIPE: Record<TriageLevel, string> = {
  P1: "bg-linear-to-r from-rose-500 to-rose-400",
  P2: "bg-linear-to-r from-amber-400 to-amber-300",
  P3: "bg-linear-to-r from-emerald-500 to-emerald-400",
  P4: "bg-linear-to-r from-slate-500 to-slate-400",
};

const STATUS_BADGE: Record<IGDStatus, string> = {
  Triage:             "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  Menunggu:           "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  "Dalam Penanganan": "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  Observasi:          "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  Selesai:            "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

export default function PatientHeader({ patient }: { patient: IGDPatientDetail }) {
  const triage = TRIAGE_BADGE[patient.triage];

  return (
    <header className="shrink-0 bg-white shadow-sm">

      {/* ── Triage color accent strip ── */}
      <div className={cn("h-1 w-full", TRIAGE_STRIPE[patient.triage])} />

      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-4 py-2 md:gap-3 md:px-5">
        {/* Breadcrumb (hidden on very small screens) */}
        <span className="hidden text-xs text-slate-400 sm:inline">IGD</span>
        <span className="hidden text-slate-300 sm:inline">/</span>
        <span className="hidden text-xs font-medium text-slate-500 sm:inline">
          {patient.noKunjungan}
        </span>

        {/* Badges — always visible */}
        <div className="flex items-center gap-1.5">
          <span className={cn("rounded-md px-2.5 py-0.5 text-xs font-bold tracking-wide", triage.cls)}>
            {triage.label}
          </span>
          <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", STATUS_BADGE[patient.status])}>
            {patient.status}
          </span>
        </div>

        {/* Close */}
        <Link
          href="/dashboard/igd"
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
          aria-label="Tutup halaman pasien"
        >
          <X size={15} />
        </Link>
      </div>

      {/* ── Patient identity ── */}
      <div className="border-t border-slate-100 bg-gradient-to-r from-slate-50/70 to-white px-4 py-3 md:px-5">
        {/* Name row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight text-slate-900 md:text-lg">
              {patient.name}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              {patient.age} th · {patient.gender === "L" ? "Laki-laki" : "Perempuan"}
              <span className="mx-1.5 text-slate-300">·</span>
              <span className="font-mono text-slate-600">{patient.noRM}</span>
              <span className="hidden sm:inline">
                <span className="mx-1.5 text-slate-300">·</span>
                Lahir: {patient.tanggalLahir} di {patient.tempatLahir}
              </span>
            </p>
          </div>
        </div>

        {/* Info chips */}
        <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs">
          <span className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 shadow-xs ring-1 ring-slate-200 text-slate-600">
            <Clock size={11} className="shrink-0 text-slate-400" />
            <span>Tiba {patient.arrivalTime}</span>
            <span className="hidden sm:inline text-slate-400">· {patient.waitDuration}</span>
          </span>

          <span className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 shadow-xs ring-1 ring-slate-200 text-slate-600">
            <User size={11} className="shrink-0 text-slate-400" />
            <span className="max-w-40 truncate">{patient.doctor}</span>
          </span>

          <span className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 shadow-xs ring-1 ring-slate-200 text-slate-600">
            <CreditCard size={11} className="shrink-0 text-slate-400" />
            {patient.penjamin}
            {patient.noBpjs && (
              <span className="hidden font-mono text-slate-500 sm:inline"> {patient.noBpjs}</span>
            )}
          </span>

          <span className="hidden items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 shadow-xs ring-1 ring-slate-200 text-slate-600 sm:flex">
            <Phone size={11} className="shrink-0 text-slate-400" />
            {patient.namaKeluarga} ({patient.hubunganKeluarga}) · {patient.noHp}
          </span>
        </div>
      </div>
    </header>
  );
}
