"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X, Clock, CreditCard, Phone, MapPin,
  Pencil, Check, ChevronRight, Stethoscope,
  CalendarDays,
} from "lucide-react";
import type { IGDPatientDetail, TriageLevel, IGDStatus } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Triage configs ────────────────────────────────────────

const TRIAGE_STRIPE: Record<TriageLevel, string> = {
  P1: "from-rose-500 via-rose-400 to-rose-300",
  P2: "from-amber-500 via-amber-400 to-amber-300",
  P3: "from-emerald-500 via-emerald-400 to-emerald-300",
  P4: "from-slate-600 via-slate-500 to-slate-400",
};

const TRIAGE_BADGE: Record<TriageLevel, { label: string; cls: string; dot: string }> = {
  P1: { label: "P1 · Merah",  cls: "bg-rose-100 text-rose-700 ring-1 ring-rose-300",       dot: "bg-rose-500"    },
  P2: { label: "P2 · Kuning", cls: "bg-amber-100 text-amber-700 ring-1 ring-amber-300",    dot: "bg-amber-400"   },
  P3: { label: "P3 · Hijau",  cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300", dot: "bg-emerald-500" },
  P4: { label: "P4 · Hitam",  cls: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",    dot: "bg-slate-600"   },
};

const STATUS_BADGE: Record<IGDStatus, string> = {
  Triage:             "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  Menunggu:           "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  "Dalam Penanganan": "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  Observasi:          "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  Selesai:            "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

// ── Info chip ─────────────────────────────────────────────

function InfoChip({
  icon: Icon, value, accent,
}: {
  icon: React.ElementType;
  value: React.ReactNode;
  accent: { bg: string; icon: string; text: string; ring: string };
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs shadow-xs ring-1",
      accent.bg, accent.ring, accent.text,
    )}>
      <Icon size={11} className={cn("shrink-0", accent.icon)} />
      {value}
    </span>
  );
}

// ── Editable card (compact) ───────────────────────────────

function EditableCard({
  icon: Icon, label, value, onSave, accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onSave: (v: string) => void;
  accent: { bg: string; iconCls: string; labelCls: string; valueCls: string; border: string };
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const [current, setCurrent] = useState(value);

  const save = () => { onSave(draft); setCurrent(draft); setEditing(false); };
  const cancel = () => { setDraft(current); setEditing(false); };

  return (
    <div className={cn("flex-1 min-w-0 rounded-xl border shadow-xs", accent.bg, accent.border)}>
      {/* Header */}
      <div className={cn("flex items-center gap-1.5 border-b px-3 py-1.5", accent.border)}>
        <Icon size={11} className={cn("shrink-0", accent.iconCls)} />
        <span className={cn("text-[10px] font-semibold uppercase tracking-wider", accent.labelCls)}>{label}</span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="ml-auto flex h-5 w-5 items-center justify-center rounded-md bg-white/80 text-slate-500 shadow-xs ring-1 ring-slate-200 transition hover:bg-white hover:text-indigo-600 hover:ring-indigo-300"
            aria-label={`Edit ${label}`}
          >
            <Pencil size={9} />
          </button>
        )}
      </div>
      {/* Body */}
      <div className="px-3 py-2">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
              className="h-6 flex-1 min-w-0 rounded border border-indigo-200 bg-white px-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-300"
            />
            <button onClick={save} className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-600 text-white hover:bg-indigo-700">
              <Check size={9} />
            </button>
            <button onClick={cancel} className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50">
              <X size={9} />
            </button>
          </div>
        ) : (
          <p className={cn("truncate text-xs font-medium", accent.valueCls)}>{current}</p>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────

export default function PatientHeader({ patient }: { patient: IGDPatientDetail }) {
  const triage = TRIAGE_BADGE[patient.triage];
  const [tglMasuk, setTglMasuk] = useState(patient.tglKunjungan);

  return (
    <header className="shrink-0 bg-white shadow-sm">

      {/* Triage stripe */}
      <div className={cn("h-1.5 w-full bg-linear-to-r", TRIAGE_STRIPE[patient.triage])} />

      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 md:px-5">
        <span className="hidden text-xs text-slate-400 sm:inline">IGD</span>
        <ChevronRight size={12} className="hidden shrink-0 text-slate-300 sm:inline-block" />
        <span className="hidden text-xs font-medium text-slate-500 sm:inline">
          {patient.noKunjungan}
        </span>
        <div className="flex items-center gap-1.5 sm:ml-2">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-bold tracking-wide",
            triage.cls,
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", triage.dot)} />
            {triage.label}
          </span>
          <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", STATUS_BADGE[patient.status])}>
            {patient.status}
          </span>
        </div>
        <Link
          href="/ehis-care/igd"
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
          aria-label="Tutup"
        >
          <X size={14} />
        </Link>
      </div>

      {/* Main identity section */}
      <div className="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[1fr_420px] md:px-5">

        {/* ── Left: identity + info chips ── */}
        <div className="flex flex-col gap-2.5">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">
              {patient.name}
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{patient.age} tahun</span>
              <span className="text-slate-300">·</span>
              <span>{patient.gender === "L" ? "Laki-laki" : "Perempuan"}</span>
              <span className="text-slate-300">·</span>
              <span className="font-mono text-slate-600">{patient.noRM}</span>
              <span className="hidden text-slate-300 sm:inline">·</span>
              <span className="hidden sm:inline">Lahir: {patient.tanggalLahir} di {patient.tempatLahir}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <InfoChip
              icon={Clock}
              value={<>Tiba {patient.arrivalTime}<span className="text-sky-400"> · {patient.waitDuration}</span></>}
              accent={{ bg: "bg-sky-50", ring: "ring-sky-200", icon: "text-sky-400", text: "text-sky-800" }}
            />
            <InfoChip
              icon={CreditCard}
              value={<>{patient.penjamin}{patient.noBpjs && <span className="font-mono text-emerald-500"> {patient.noBpjs}</span>}</>}
              accent={{ bg: "bg-emerald-50", ring: "ring-emerald-200", icon: "text-emerald-500", text: "text-emerald-800" }}
            />
            <InfoChip
              icon={Phone}
              value={`${patient.namaKeluarga} (${patient.hubunganKeluarga}) · ${patient.noHp}`}
              accent={{ bg: "bg-amber-50", ring: "ring-amber-200", icon: "text-amber-500", text: "text-amber-800" }}
            />
            <InfoChip
              icon={MapPin}
              value={patient.alamat}
              accent={{ bg: "bg-rose-50", ring: "ring-rose-200", icon: "text-rose-400", text: "text-rose-800" }}
            />
          </div>
        </div>

        {/* ── Right: DPJP + tanggal masuk, satu baris ── */}
        <div className="flex gap-2">
          <EditableCard
            icon={Stethoscope}
            label="DPJP"
            value={patient.doctor}
            onSave={() => {}}
            accent={{
              bg: "bg-indigo-50/50", border: "border-indigo-200",
              iconCls: "text-indigo-400", labelCls: "text-indigo-500", valueCls: "text-indigo-800",
            }}
          />
          <EditableCard
            icon={CalendarDays}
            label="Tanggal Masuk"
            value={tglMasuk}
            onSave={setTglMasuk}
            accent={{
              bg: "bg-violet-50/50", border: "border-violet-200",
              iconCls: "text-violet-400", labelCls: "text-violet-500", valueCls: "text-violet-800",
            }}
          />
        </div>

      </div>
    </header>
  );
}
