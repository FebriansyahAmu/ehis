import Link from "next/link";
import { Clock, Stethoscope, FileText, BedDouble, Timer } from "lucide-react";
import type { IGDPatient, TriageLevel, IGDStatus } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Triage config ─────────────────────────────────────────

const TRIAGE = {
  P1: {
    border: "border-l-rose-500",
    badge:  "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    label:  "P1 · Merah",
    dot:    "bg-rose-500",
  },
  P2: {
    border: "border-l-amber-400",
    badge:  "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    label:  "P2 · Kuning",
    dot:    "bg-amber-400",
  },
  P3: {
    border: "border-l-emerald-500",
    badge:  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    label:  "P3 · Hijau",
    dot:    "bg-emerald-500",
  },
  P4: {
    border: "border-l-slate-500",
    badge:  "bg-slate-100 text-slate-700 ring-1 ring-slate-300",
    label:  "P4 · Hitam",
    dot:    "bg-slate-700",
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
  badge: string; dot: string; label: string; strip: string; icon: string;
}> = {
  BEDAH:     { badge: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",    dot: "bg-rose-500",  label: "BEDAH",     strip: "bg-rose-50 border-rose-100",    icon: "text-rose-400"  },
  NON_BEDAH: { badge: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",       dot: "bg-sky-500",   label: "NON BEDAH", strip: "bg-sky-50 border-sky-100",      icon: "text-sky-400"   },
  IRDA:      { badge: "bg-amber-100 text-amber-700 ring-1 ring-amber-200", dot: "bg-amber-500", label: "IRDA",      strip: "bg-amber-50 border-amber-100",  icon: "text-amber-400" },
  IRDO:      { badge: "bg-teal-100 text-teal-700 ring-1 ring-teal-200",   dot: "bg-teal-500",  label: "IRDO",      strip: "bg-teal-50 border-teal-100",    icon: "text-teal-400"  },
};

// ── Wait urgency helpers ──────────────────────────────────

function parseWaitMinutes(s: string): number | null {
  if (!s || s === "Selesai") return null;
  let total = 0;
  const jamMatch = s.match(/(\d+)\s*jam/);
  const mntMatch = s.match(/(\d+)\s*mnt/);
  if (jamMatch) total += parseInt(jamMatch[1], 10) * 60;
  if (mntMatch) total += parseInt(mntMatch[1], 10);
  return total > 0 ? total : null;
}

// Thresholds (minutes) where wait becomes notable per triage level
const URGENCY_WARN: Record<TriageLevel, number> = { P1: 30,  P2: 60,  P3: 120, P4: 999 };
const URGENCY_CRIT: Record<TriageLevel, number> = { P1: 60,  P2: 120, P3: 240, P4: 999 };
const BOARDING_MIN = 360; // 6 jam — threshold boarding ke RI

type Urgency = "ok" | "warn" | "critical";

function getUrgency(triage: TriageLevel, minutes: number | null): Urgency {
  if (minutes === null) return "ok";
  if (minutes >= URGENCY_CRIT[triage]) return "critical";
  if (minutes >= URGENCY_WARN[triage]) return "warn";
  return "ok";
}

const WAIT_TEXT_CLS: Record<Urgency, string> = {
  ok:       "text-slate-400",
  warn:     "text-amber-600 font-semibold",
  critical: "text-rose-600 font-bold",
};

// ── Component ─────────────────────────────────────────────

interface PatientCardProps {
  patient: IGDPatient;
  index?: number;
}

export default function PatientCard({ patient, index = 0 }: PatientCardProps) {
  const triage     = TRIAGE[patient.triage];
  const bedCfg     = patient.bed ? RUANGAN_CFG[patient.bed.kategori] : null;
  const waitMin    = parseWaitMinutes(patient.waitDuration);
  const urgency    = getUrgency(patient.triage, waitMin);
  const isBoarding = waitMin !== null && waitMin >= BOARDING_MIN;

  return (
    <Link
      href={`/ehis-care/igd/${patient.id}`}
      className={cn(
        "animate-fade-in flex flex-col gap-3 rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 cursor-pointer",
        triage.border,
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      aria-label={`Buka detail pasien ${patient.name}`}
    >
      {/* Row 1 — triage + status */}
      <div className="flex items-center justify-between gap-2">
        <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold", triage.badge)}>
          {urgency === "critical" ? (
            <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
              <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", triage.dot)} />
              <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", triage.dot)} />
            </span>
          ) : (
            <span className={cn("h-1.5 w-1.5 rounded-full", triage.dot)} aria-hidden="true" />
          )}
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

      <hr className="border-slate-100" />

      {/* Row 3 — ruangan */}
      {bedCfg && patient.bed ? (
        <div className={cn(
          "group flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-all duration-150 hover:shadow-xs",
          bedCfg.strip,
        )}>
          <BedDouble
            size={13}
            className={cn("shrink-0 transition-transform duration-150 group-hover:scale-110", bedCfg.icon)}
            aria-hidden="true"
          />
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

      {/* Boarding alert — muncul jika pasien menunggu ≥ 6 jam */}
      {isBoarding && (
        <div className="flex items-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700">
          <Timer size={11} aria-hidden="true" />
          Boarding {Math.round(waitMin! / 60)}+ jam — menunggu RI
        </div>
      )}

      {/* Row 5 — doctor + wait time */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <Stethoscope size={12} className="shrink-0 text-slate-400" aria-hidden="true" />
          <p className="truncate text-xs font-medium text-slate-700">{patient.doctor}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs">
          <Clock size={12} className="text-slate-400" aria-hidden="true" />
          <span className="text-slate-400">{patient.arrivalTime}</span>
          <span className="text-slate-300">·</span>
          <span className={WAIT_TEXT_CLS[urgency]}>{patient.waitDuration}</span>
        </div>
      </div>

    </Link>
  );
}
