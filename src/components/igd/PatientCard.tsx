import Link from "next/link";
import { Clock, Stethoscope, FileText, ArrowRight, BedDouble } from "lucide-react";
import type { IGDPatient, TriageLevel, IGDStatus } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Triage config ─────────────────────────────────────────

const TRIAGE = {
  P1: {
    border:  "border-l-rose-500",
    badge:   "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    label:   "P1 · Merah",
    dot:     "bg-rose-500",
  },
  P2: {
    border:  "border-l-amber-400",
    badge:   "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    label:   "P2 · Kuning",
    dot:     "bg-amber-400",
  },
  P3: {
    border:  "border-l-emerald-500",
    badge:   "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    label:   "P3 · Hijau",
    dot:     "bg-emerald-500",
  },
  P4: {
    border:  "border-l-slate-500",
    badge:   "bg-slate-100 text-slate-700 ring-1 ring-slate-300",
    label:   "P4 · Hitam",
    dot:     "bg-slate-700",
  },
} satisfies Record<TriageLevel, { border: string; badge: string; label: string; dot: string }>;

// ── Status config ─────────────────────────────────────────

const STATUS: Record<IGDStatus, string> = {
  Triage:             "bg-violet-50 text-violet-700",
  Menunggu:           "bg-slate-100 text-slate-600",
  "Dalam Penanganan": "bg-sky-50 text-sky-700",
  Observasi:          "bg-indigo-50 text-indigo-700",
  Selesai:            "bg-emerald-50 text-emerald-700",
};

// ── Ruangan config ────────────────────────────────────────

type BedKategori = "BEDAH" | "NON_BEDAH" | "IRDA" | "IRDO";

const RUANGAN_CFG: Record<BedKategori, {
  badge: string; dot: string; label: string;
  strip: string; icon: string;
}> = {
  BEDAH:     { badge: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",   dot: "bg-rose-500",   label: "BEDAH",     strip: "bg-rose-50 border-rose-100",   icon: "text-rose-400"   },
  NON_BEDAH: { badge: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",      dot: "bg-sky-500",    label: "NON BEDAH", strip: "bg-sky-50 border-sky-100",     icon: "text-sky-400"    },
  IRDA:      { badge: "bg-amber-100 text-amber-700 ring-1 ring-amber-200", dot: "bg-amber-500",  label: "IRDA",      strip: "bg-amber-50 border-amber-100", icon: "text-amber-400"  },
  IRDO:      { badge: "bg-teal-100 text-teal-700 ring-1 ring-teal-200",   dot: "bg-teal-500",   label: "IRDO",      strip: "bg-teal-50 border-teal-100",   icon: "text-teal-400"   },
};

// ── Component ─────────────────────────────────────────────

interface PatientCardProps {
  patient: IGDPatient;
  index?: number;
}

export default function PatientCard({ patient, index = 0 }: PatientCardProps) {
  const triage = TRIAGE[patient.triage];
  const bedCfg = patient.bed ? RUANGAN_CFG[patient.bed.kategori] : null;

  return (
    <article
      className={cn(
        "animate-fade-in flex flex-col gap-3 rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm transition hover:shadow-md",
        triage.border,
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      aria-label={`Pasien ${patient.name}`}
    >
      {/* Row 1 — triage + status */}
      <div className="flex items-center justify-between gap-2">
        <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold", triage.badge)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", triage.dot)} aria-hidden="true" />
          {triage.label}
        </span>
        <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", STATUS[patient.status])}>
          {patient.status}
        </span>
      </div>

      {/* Row 2 — patient identity */}
      <div>
        <p className="font-semibold text-slate-900 leading-tight">{patient.name}</p>
        <p className="mt-0.5 text-xs text-slate-400">
          {patient.age} th · {patient.gender === "L" ? "Laki-laki" : "Perempuan"}
          <span className="mx-1.5 text-slate-300">·</span>
          <span className="font-mono">{patient.noRM}</span>
        </p>
      </div>

      {/* Divider */}
      <hr className="border-slate-100" />

      {/* Row 3 — ruangan */}
      {bedCfg && patient.bed ? (
        <div className={cn(
          "group flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-all duration-150",
          bedCfg.strip,
          "hover:shadow-xs",
        )}>
          <BedDouble size={13} className={cn("shrink-0 transition-transform duration-150 group-hover:scale-110", bedCfg.icon)} aria-hidden="true" />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wider", bedCfg.badge)}>
              {bedCfg.label}
            </span>
            <span className="text-[11px] font-bold text-slate-700">{patient.bed.nomor}</span>
            <span className="mx-0.5 text-slate-300">·</span>
            <span className="truncate text-[10px] text-slate-500">{patient.bed.ruangan}</span>
          </div>
          <span className={cn("h-1.5 w-1.5 shrink-0 animate-pulse rounded-full", bedCfg.dot)} />
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2">
          <BedDouble size={12} className="shrink-0 text-slate-300" aria-hidden="true" />
          <span className="text-[11px] text-slate-400">Belum ditentukan ruangan</span>
        </div>
      )}

      {/* Row 4 — complaint */}
      <div className="flex items-start gap-2">
        <FileText size={13} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
        <p className="text-sm text-slate-600 leading-snug line-clamp-2">{patient.complaint}</p>
      </div>

      {patient.notes && (
        <p className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700 leading-snug">
          {patient.notes}
        </p>
      )}

      {/* Row 5 — doctor + time */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Stethoscope size={12} className="shrink-0 text-slate-400" aria-hidden="true" />
          <p className="truncate text-xs text-slate-500">{patient.doctor}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-xs text-slate-400">
          <Clock size={12} aria-hidden="true" />
          {patient.arrivalTime}
          <span className="ml-1 text-slate-300">·</span>
          <span>{patient.waitDuration}</span>
        </div>
      </div>

      {/* Row 6 — action */}
      <div className="border-t border-slate-100 pt-3">
        <Link
          href={`/ehis-care/igd/${patient.id}`}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          aria-label={`Lihat detail pasien ${patient.name}`}
        >
          Lihat Detail Pasien
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
