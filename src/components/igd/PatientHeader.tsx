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

// ── Triage configs ────────────────────────────────────────────────────────

const TRIAGE: Record<TriageLevel, {
  panelGrad: string;
  identityWash: string;
  avatarRing: string;
  avatarShadow: string;
  topBarBg: string;
  pulse: boolean;
  shortLabel: string;
  label: string;
}> = {
  P1: {
    panelGrad:    "bg-linear-to-b from-rose-700 to-rose-500",
    identityWash: "from-rose-50/50 to-transparent",
    avatarRing:   "ring-rose-300",
    avatarShadow: "shadow-md shadow-rose-100",
    topBarBg:     "bg-rose-50/60",
    pulse: true,  shortLabel: "P1", label: "MERAH",
  },
  P2: {
    panelGrad:    "bg-linear-to-b from-amber-600 to-amber-400",
    identityWash: "from-amber-50/50 to-transparent",
    avatarRing:   "ring-amber-300",
    avatarShadow: "shadow-md shadow-amber-100",
    topBarBg:     "bg-amber-50/50",
    pulse: false, shortLabel: "P2", label: "KUNING",
  },
  P3: {
    panelGrad:    "bg-linear-to-b from-emerald-700 to-emerald-500",
    identityWash: "from-emerald-50/50 to-transparent",
    avatarRing:   "ring-emerald-300",
    avatarShadow: "shadow-md shadow-emerald-100",
    topBarBg:     "bg-emerald-50/50",
    pulse: false, shortLabel: "P3", label: "HIJAU",
  },
  P4: {
    panelGrad:    "bg-linear-to-b from-slate-800 to-slate-600",
    identityWash: "from-slate-100/60 to-transparent",
    avatarRing:   "ring-slate-400",
    avatarShadow: "shadow-md shadow-slate-200",
    topBarBg:     "bg-slate-50/50",
    pulse: false, shortLabel: "P4", label: "HITAM",
  },
};

const STATUS_BADGE: Record<IGDStatus, string> = {
  Triage:             "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200",
  Menunggu:           "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  "Dalam Penanganan": "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
  Observasi:          "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
  Selesai:            "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
};

// ── Vital helpers ─────────────────────────────────────────────────────────

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

// ── VitalChip ─────────────────────────────────────────────────────────────

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
        "relative flex shrink-0 cursor-default items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition hover:shadow-sm",
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

// ── InfoChip ──────────────────────────────────────────────────────────────

function InfoChip({
  icon: Icon, value, cls,
}: {
  icon: React.ElementType; value: React.ReactNode; cls: string;
}) {
  return (
    <span className={cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs shadow-sm ring-1",
      cls,
    )}>
      <Icon size={11} className="shrink-0" />
      {value}
    </span>
  );
}

// ── DPJPCard — emerald gradient, click-anywhere to edit ──────────────────

function DPJPCard({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const [current, setCurrent] = useState(value);

  const save   = () => { onSave(draft); setCurrent(draft); setEditing(false); };
  const cancel = () => { setDraft(current); setEditing(false); };

  return (
    <div className={cn(
      "group relative min-w-0 flex-1 overflow-hidden rounded-xl bg-linear-to-br from-emerald-600 to-emerald-800 shadow-md transition-shadow duration-200",
      !editing && "hover:shadow-lg hover:shadow-emerald-300/40",
    )}>
      <Stethoscope
        size={90}
        className="pointer-events-none absolute -right-6 -top-6 rotate-12 text-white/[0.07]"
      />
      <div className="relative flex h-full flex-col px-3 py-2.5">

        <span className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-200">
          <Stethoscope size={9} />
          DPJP
        </span>

        {editing ? (
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
              className="w-full rounded-lg border border-white/30 bg-white/15 px-2.5 py-1.5 text-sm font-semibold text-white outline-none placeholder-white/30 focus:border-white/50 focus:bg-white/20 focus:ring-1 focus:ring-white/40"
              placeholder="Nama dokter..."
            />
            <div className="flex gap-1.5">
              <button
                onClick={save}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-white/20 py-1.5 text-xs font-semibold text-white transition hover:bg-white/30"
              >
                <Check size={11} /> Simpan
              </button>
              <button
                onClick={cancel}
                className="flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/15 hover:text-white"
              >
                <X size={11} /> Batal
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="group/val w-full cursor-pointer rounded-lg px-0 text-left transition hover:bg-white/8"
            aria-label="Edit DPJP"
          >
            <p className="truncate text-sm font-bold leading-tight text-white">{current}</p>
            <span className="mt-1 flex items-center gap-1 text-[9px] text-emerald-200/0 transition-all duration-150 group-hover/val:text-emerald-200/70">
              <Pencil size={8} /> Klik untuk edit
            </span>
          </button>
        )}

        {!editing && (
          <p className="mt-auto pt-1.5 text-[9px] tracking-wide text-emerald-200/50">
            Dokter Penanggung Jawab
          </p>
        )}
      </div>
    </div>
  );
}

// ── DateCard helpers ──────────────────────────────────────────────────────

const MONTHS_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function displayToInput(display: string): string {
  // "14 April 2026" → "2026-04-14"
  const parts = display.trim().split(" ");
  if (parts.length !== 3) return "";
  const day   = parts[0].padStart(2, "0");
  const mIdx  = MONTHS_ID.indexOf(parts[1]);
  if (mIdx === -1) return "";
  return `${parts[2]}-${String(mIdx + 1).padStart(2, "0")}-${day}`;
}

function inputToDisplay(iso: string): string {
  // "2026-04-14" → "14 April 2026"
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${parseInt(d, 10)} ${MONTHS_ID[parseInt(m, 10) - 1]} ${y}`;
}

// ── DateCard — dark slate gradient, native date-picker ────────────────────

function DateCard({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(() => displayToInput(value));
  const [current, setCurrent] = useState(value);

  const save = () => {
    const display = inputToDisplay(draft);
    if (!display) return;
    onSave(display);
    setCurrent(display);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(displayToInput(current));
    setEditing(false);
  };

  return (
    <div className={cn(
      "group relative w-48 shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-slate-700 to-slate-900 shadow-md transition-shadow duration-200",
      !editing && "hover:shadow-lg hover:shadow-slate-400/30",
    )}>
      <CalendarDays
        size={64}
        className="pointer-events-none absolute -right-3 -bottom-3 text-white/[0.07]"
      />
      <div className="relative flex h-full flex-col px-3 py-2.5">

        <span className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
          <CalendarDays size={9} />
          Tgl Masuk
        </span>

        {editing ? (
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              type="date"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") cancel(); }}
              className="w-full cursor-pointer rounded-lg border border-white/30 bg-white/15 px-2.5 py-1.5 text-sm font-semibold text-white outline-none scheme-dark focus:border-white/50 focus:bg-white/20 focus:ring-1 focus:ring-white/40"
            />
            <div className="flex gap-1.5">
              <button
                onClick={save}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-white/20 py-1.5 text-xs font-semibold text-white transition hover:bg-white/30"
              >
                <Check size={11} /> Simpan
              </button>
              <button
                onClick={cancel}
                className="flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/15 hover:text-white"
              >
                <X size={11} /> Batal
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="group/val w-full cursor-pointer rounded-lg px-0 text-left transition hover:bg-white/5"
            aria-label="Edit tanggal masuk"
          >
            <p className="text-sm font-bold leading-tight text-white">{current}</p>
            <span className="mt-1 flex items-center gap-1 text-[9px] text-slate-400/0 transition-all duration-150 group-hover/val:text-slate-300/70">
              <Pencil size={8} /> Klik untuk edit
            </span>
          </button>
        )}

        {!editing && (
          <p className="mt-auto pt-1.5 text-[9px] tracking-wide text-slate-400/70">
            Waktu Pendaftaran IGD
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

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

        {/* ── Left: triage gradient panel ── */}
        <div className={cn(
          "flex w-14 shrink-0 select-none flex-col items-center justify-center gap-1.5 py-3 md:w-16",
          cfg.panelGrad,
        )}>
          <span className="text-[7px] font-black uppercase tracking-[0.15em] text-white/40 [writing-mode:vertical-rl] rotate-180">
            TRIASE
          </span>
          <div className="flex flex-col items-center gap-1">
            {cfg.pulse && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
            )}
            <span className="text-2xl font-black leading-none text-white">{cfg.shortLabel}</span>
          </div>
          <span className="text-[7px] font-bold uppercase tracking-wide text-white/70">{cfg.label}</span>
        </div>

        {/* ── Right: content ── */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Breadcrumb bar */}
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

          {/* Identity section — triage-wash gradient over white */}
          <div className="relative bg-white">
            <div className={cn(
              "pointer-events-none absolute inset-0 bg-linear-to-r",
              cfg.identityWash,
            )} />

            <div className="relative grid grid-cols-1 gap-2 px-3 py-2.5 md:grid-cols-[1fr_360px] md:gap-3 md:px-4">

              {/* Left: avatar + name + info chips */}
              <motion.div
                className="flex flex-col gap-2"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black ring-2",
                    cfg.avatarRing, cfg.avatarShadow,
                    patient.gender === "L"
                      ? "bg-sky-100 text-sky-700"
                      : "bg-pink-100 text-pink-700",
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
                      <span className="inline text-slate-300 md:hidden">·</span>
                      <span className="inline font-medium text-indigo-600 md:hidden">{patient.doctor}</span>
                    </p>
                  </div>
                </div>

                {/* Info chips — scrollable row */}
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
                    cls="bg-teal-50 ring-teal-200 text-teal-800"
                  />
                </div>
              </motion.div>

              {/* Right: DPJP + Date cards — desktop only */}
              <motion.div
                className="hidden gap-2 md:flex"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
              >
                <DPJPCard value={patient.doctor} onSave={() => {}} />
                <DateCard value={tglMasuk} onSave={setTglMasuk} />
              </motion.div>
            </div>
          </div>

          {/* Vitals bar */}
          <div className="border-t border-slate-200 bg-linear-to-r from-slate-100 to-slate-50 px-3 py-2 md:px-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="mr-1 shrink-0 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Vital
              </span>
              <VitalChip icon={Activity}    label="TD"    value={`${vs.tdSistolik}/${vs.tdDiastolik}`} unit="mmHg" lvl={lvlTD(vs.tdSistolik, vs.tdDiastolik)}  title={`Tekanan Darah: ${vs.tdSistolik}/${vs.tdDiastolik} mmHg`} />
              <VitalChip icon={Heart}       label="Nadi"  value={`${vs.nadi}`}       unit="bpm"  lvl={lvlNadi(vs.nadi)}           title={`Denyut Nadi: ${vs.nadi} bpm`} />
              <VitalChip icon={Wind}        label="RR"    value={`${vs.respirasi}`}  unit="/mnt" lvl={lvlResp(vs.respirasi)}       title={`Laju Napas: ${vs.respirasi}×/mnt`} />
              <VitalChip icon={Gauge}       label="SpO₂"  value={`${vs.spo2}`}       unit="%"    lvl={lvlSpo2(vs.spo2)}           title={`Saturasi: ${vs.spo2}%`} />
              <VitalChip icon={Thermometer} label="Suhu"  value={`${vs.suhu}`}       unit="°C"   lvl={lvlSuhu(vs.suhu)}           title={`Suhu: ${vs.suhu}°C`} />
              <VitalChip icon={Layers}      label="GCS"   value={`${gcsTotal}`}      unit="/15"  lvl={lvlGCS(gcsTotal)}           title={`GCS: E${vs.gcsEye} V${vs.gcsVerbal} M${vs.gcsMotor} = ${gcsTotal}`} />
              <VitalChip icon={Zap}         label="Nyeri" value={`${vs.skalaNyeri}`} unit="/10"  lvl={lvlNyeri(vs.skalaNyeri)}    title={`Nyeri: ${vs.skalaNyeri}/10`} />
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
