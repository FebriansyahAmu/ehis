"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  X, Clock, CreditCard, Phone, MapPin,
  Pencil, Check, Stethoscope, CalendarDays,
  Activity, Heart, Wind, Gauge, Thermometer, Zap, Layers,
  ChevronRight,
} from "lucide-react";
import type { IGDPatientDetail, TriageLevel, IGDStatus } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Triage configs ────────────────────────────────────────

const TRIAGE: Record<TriageLevel, {
  panel: string; topBarBg: string;
  pulse: boolean; shortLabel: string; label: string;
}> = {
  P1: { panel: "bg-rose-600",    topBarBg: "bg-rose-50/60",    pulse: true,  shortLabel: "P1", label: "MERAH"  },
  P2: { panel: "bg-amber-500",   topBarBg: "bg-amber-50/50",   pulse: false, shortLabel: "P2", label: "KUNING" },
  P3: { panel: "bg-emerald-600", topBarBg: "bg-emerald-50/50", pulse: false, shortLabel: "P3", label: "HIJAU"  },
  P4: { panel: "bg-slate-700",   topBarBg: "bg-slate-50/50",   pulse: false, shortLabel: "P4", label: "HITAM"  },
};

const STATUS_BADGE: Record<IGDStatus, string> = {
  Triage:             "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
  Menunggu:           "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  "Dalam Penanganan": "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
  Observasi:          "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
  Selesai:            "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
};

// ── Vital helpers ─────────────────────────────────────────

type VLvl = "normal" | "warning" | "critical";

const VITAL_CLS: Record<VLvl, { card: string; value: string; meta: string }> = {
  normal:   { card: "bg-emerald-50 ring-1 ring-emerald-200", value: "text-emerald-700", meta: "text-emerald-500" },
  warning:  { card: "bg-amber-50  ring-1 ring-amber-200",    value: "text-amber-700",   meta: "text-amber-500"   },
  critical: { card: "bg-rose-50   ring-1 ring-rose-200",     value: "text-rose-700",    meta: "text-rose-400"    },
};

const lvlTD    = (s: number, d: number): VLvl =>
  (s > 180 || s < 80 || d > 120 || d < 50) ? "critical"
  : (s > 140 || s < 90 || d > 90 || d < 60) ? "warning" : "normal";
const lvlNadi  = (v: number): VLvl =>
  (v > 130 || v < 40) ? "critical" : (v > 100 || v < 60) ? "warning" : "normal";
const lvlSpo2  = (v: number): VLvl =>
  v < 90 ? "critical" : v < 95 ? "warning" : "normal";
const lvlSuhu  = (v: number): VLvl =>
  (v > 39.5 || v < 35) ? "critical" : (v > 37.5 || v < 36) ? "warning" : "normal";
const lvlResp  = (v: number): VLvl =>
  (v > 30 || v < 8) ? "critical" : (v > 20 || v < 12) ? "warning" : "normal";
const lvlGCS   = (v: number): VLvl =>
  v <= 8 ? "critical" : v <= 12 ? "warning" : "normal";
const lvlNyeri = (v: number): VLvl =>
  v >= 7 ? "critical" : v >= 4 ? "warning" : "normal";

// ── VitalChip — horizontal, compact ──────────────────────

function VitalChip({
  icon: Icon, label, value, unit, lvl, title,
}: {
  icon: React.ElementType; label: string;
  value: string; unit: string; lvl: VLvl; title?: string;
}) {
  const cls = VITAL_CLS[lvl];
  return (
    <div
      title={title}
      className={cn(
        "relative flex shrink-0 cursor-default items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition hover:shadow-xs",
        cls.card,
      )}
    >
      {lvl === "critical" && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
        </span>
      )}
      <Icon size={11} className={cn("shrink-0", cls.meta)} aria-hidden />
      <div className="leading-none">
        <p className={cn("text-[9px] font-bold uppercase tracking-wider", cls.meta)}>{label}</p>
        <p className={cn("mt-0.5 text-xs font-bold", cls.value)}>
          {value}
          <span className={cn("ml-0.5 text-[9px] font-normal", cls.meta)}>{unit}</span>
        </p>
      </div>
    </div>
  );
}

// ── InfoChip ──────────────────────────────────────────────

function InfoChip({
  icon: Icon, value, cls,
}: {
  icon: React.ElementType; value: React.ReactNode; cls: string;
}) {
  return (
    <span className={cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs shadow-xs ring-1",
      cls,
    )}>
      <Icon size={11} className="shrink-0" />
      {value}
    </span>
  );
}

// ── EditableCard ──────────────────────────────────────────

function EditableCard({
  icon: Icon, label, value, onSave, accent,
}: {
  icon: React.ElementType; label: string; value: string;
  onSave: (v: string) => void;
  accent: { bg: string; border: string; iconCls: string; labelCls: string; valueCls: string };
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const [current, setCurrent] = useState(value);

  const save   = () => { onSave(draft); setCurrent(draft); setEditing(false); };
  const cancel = () => { setDraft(current); setEditing(false); };

  return (
    <div className={cn("min-w-0 flex-1 rounded-xl border shadow-xs", accent.bg, accent.border)}>
      <div className={cn("flex items-center gap-1.5 border-b px-3 py-1.5", accent.border)}>
        <Icon size={11} className={cn("shrink-0", accent.iconCls)} />
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", accent.labelCls)}>{label}</span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="ml-auto flex h-5 w-5 cursor-pointer items-center justify-center rounded-md bg-white/80 text-slate-400 shadow-xs ring-1 ring-slate-200 transition hover:bg-white hover:text-indigo-600 hover:ring-indigo-300"
            aria-label={`Edit ${label}`}
          >
            <Pencil size={9} />
          </button>
        )}
      </div>
      <div className="px-3 py-2">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
              className="h-6 min-w-0 flex-1 rounded border border-indigo-200 bg-white px-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-300"
            />
            <button onClick={save}   className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded bg-indigo-600 text-white hover:bg-indigo-700"><Check size={9} /></button>
            <button onClick={cancel} className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50"><X size={9} /></button>
          </div>
        ) : (
          <p className={cn("truncate text-xs font-semibold", accent.valueCls)}>{current}</p>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function PatientHeader({ patient }: { patient: IGDPatientDetail }) {
  const cfg = TRIAGE[patient.triage];
  const vs  = patient.vitalSigns;
  const [tglMasuk, setTglMasuk] = useState(patient.tglKunjungan);
  const gcsTotal = vs.gcsEye + vs.gcsVerbal + vs.gcsMotor;

  const initials = patient.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <header className="shrink-0 shadow-sm">
      <div className="flex">

        {/* ── Left: triage colour panel ── */}
        <div className={cn(
          "flex w-12 shrink-0 select-none flex-col items-center justify-center gap-1.5 py-3 md:w-14",
          cfg.panel,
        )}>
          <span className="text-[7px] font-black uppercase tracking-[0.15em] text-white/40 [writing-mode:vertical-rl] rotate-180">
            TRIASE
          </span>
          <div className="flex flex-col items-center gap-1">
            {cfg.pulse && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
            )}
            <span className="text-xl font-black leading-none text-white">{cfg.shortLabel}</span>
          </div>
          <span className="text-[7px] font-bold uppercase tracking-wide text-white/70">{cfg.label}</span>
        </div>

        {/* ── Right: content ── */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Top bar */}
          <div className={cn(
            "flex items-center gap-2 border-b border-slate-100 px-3 py-2 md:px-4",
            cfg.topBarBg,
          )}>
            <Link href="/ehis-care/igd" className="text-xs text-slate-400 transition hover:text-slate-600">IGD</Link>
            <ChevronRight size={11} className="shrink-0 text-slate-300" />
            <span className="text-xs font-medium text-slate-500">{patient.noKunjungan}</span>
            <span className={cn("ml-1 rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_BADGE[patient.status])}>
              {patient.status}
            </span>
            <Link
              href="/ehis-care/igd"
              className="ml-auto flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-white hover:text-slate-700"
              aria-label="Tutup"
            >
              <X size={12} />
            </Link>
          </div>

          {/* Identity */}
          <div className="grid grid-cols-1 gap-2 bg-white px-3 py-2 md:grid-cols-[1fr_360px] md:gap-3 md:px-4 md:py-2.5">

            {/* Left: avatar + name + chips */}
            <motion.div
              className="flex flex-col gap-1.5"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* Name row */}
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black shadow-xs ring-2",
                  patient.gender === "L"
                    ? "bg-sky-100 text-sky-700 ring-sky-200"
                    : "bg-pink-100 text-pink-700 ring-pink-200",
                )}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-base font-bold tracking-tight text-slate-900 md:text-lg">
                    {patient.name}
                  </h1>
                  <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{patient.age} thn</span>
                    <span className="text-slate-300">·</span>
                    <span>{patient.gender === "L" ? "Laki-laki" : "Perempuan"}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-slate-500">{patient.noRM}</span>
                    {/* Doctor shown inline on mobile only */}
                    <span className="inline text-slate-300 md:hidden">·</span>
                    <span className="inline text-indigo-600 font-medium md:hidden">
                      {patient.doctor}
                    </span>
                  </p>
                </div>
              </div>

              {/* Info chips — single row, scrollable */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <InfoChip
                  icon={Clock}
                  value={<>Tiba <strong>{patient.arrivalTime}</strong>
                    <span className="ml-1 text-sky-400">{patient.waitDuration}</span></>}
                  cls="bg-sky-50 ring-sky-200 text-sky-800"
                />
                <InfoChip
                  icon={CreditCard}
                  value={<>{patient.penjamin}{patient.noBpjs && <span className="ml-1 font-mono text-emerald-500">{patient.noBpjs}</span>}</>}
                  cls="bg-emerald-50 ring-emerald-200 text-emerald-800"
                />
                <InfoChip
                  icon={Phone}
                  value={`${patient.namaKeluarga} (${patient.hubunganKeluarga})`}
                  cls="bg-amber-50 ring-amber-200 text-amber-800"
                />
                <InfoChip
                  icon={MapPin}
                  value={patient.alamat}
                  cls="bg-violet-50 ring-violet-200 text-violet-800"
                />
              </div>
            </motion.div>

            {/* Right: DPJP + Date — desktop only */}
            <div className="hidden gap-2 md:flex">
              <EditableCard
                icon={Stethoscope} label="DPJP" value={patient.doctor} onSave={() => {}}
                accent={{ bg: "bg-indigo-50/60", border: "border-indigo-200", iconCls: "text-indigo-500", labelCls: "text-indigo-500", valueCls: "text-indigo-800" }}
              />
              <EditableCard
                icon={CalendarDays} label="Tanggal Masuk" value={tglMasuk} onSave={setTglMasuk}
                accent={{ bg: "bg-violet-50/60", border: "border-violet-200", iconCls: "text-violet-500", labelCls: "text-violet-500", valueCls: "text-violet-800" }}
              />
            </div>
          </div>

          {/* Vitals bar — single scrollable row */}
          <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-1.5 md:px-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="mr-0.5 shrink-0 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Vital
              </span>
              <VitalChip icon={Activity}   label="TD"    value={`${vs.tdSistolik}/${vs.tdDiastolik}`} unit="mmHg" lvl={lvlTD(vs.tdSistolik, vs.tdDiastolik)}  title={`Tekanan Darah: ${vs.tdSistolik}/${vs.tdDiastolik} mmHg`} />
              <VitalChip icon={Heart}      label="Nadi"  value={`${vs.nadi}`}       unit="bpm"  lvl={lvlNadi(vs.nadi)}           title={`Denyut Nadi: ${vs.nadi} bpm`} />
              <VitalChip icon={Wind}       label="RR"    value={`${vs.respirasi}`}  unit="/mnt" lvl={lvlResp(vs.respirasi)}       title={`Laju Napas: ${vs.respirasi}×/mnt`} />
              <VitalChip icon={Gauge}      label="SpO₂"  value={`${vs.spo2}`}       unit="%"    lvl={lvlSpo2(vs.spo2)}           title={`Saturasi: ${vs.spo2}%`} />
              <VitalChip icon={Thermometer} label="Suhu" value={`${vs.suhu}`}       unit="°C"   lvl={lvlSuhu(vs.suhu)}           title={`Suhu: ${vs.suhu}°C`} />
              <VitalChip icon={Layers}     label="GCS"   value={`${gcsTotal}`}      unit="/15"  lvl={lvlGCS(gcsTotal)}           title={`GCS: E${vs.gcsEye} V${vs.gcsVerbal} M${vs.gcsMotor} = ${gcsTotal}`} />
              <VitalChip icon={Zap}        label="Nyeri" value={`${vs.skalaNyeri}`} unit="/10"  lvl={lvlNyeri(vs.skalaNyeri)}    title={`Nyeri: ${vs.skalaNyeri}/10`} />
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
