"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CreditCard, Phone, MapPin, Pencil, Check,
  Stethoscope, CalendarDays, BedDouble, Clock,
  Activity, Heart, Wind, Gauge, Thermometer, Zap, Layers,
  ChevronRight, AlertTriangle, Eye, LogOut, MessageSquare,
  CheckCircle2, ShieldAlert, Shield, ChevronDown,
} from "lucide-react";
import type {
  RawatInapPatientDetail, RIStatus,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  ISOLASI_CFG, ISOLASI_OPTIONS,
  type IsolasiTipe,
} from "@/components/rawat-inap/ppiIsolasi/ppiIsolasiShared";

// ── Status config ─────────────────────────────────────────

const STATUS_CFG: Record<RIStatus, {
  stripe:       string;
  topBarBg:     string;
  identityWash: string;
  avatarRing:   string;
  badge:        string;
  icon:         React.ElementType;
  pulse?:       boolean;
}> = {
  "Aktif":           { stripe: "bg-indigo-600", topBarBg: "bg-indigo-50/40",  identityWash: "from-indigo-50/25",  avatarRing: "ring-indigo-200", badge: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",  icon: CheckCircle2  },
  "Observasi":       { stripe: "bg-sky-500",    topBarBg: "bg-sky-50/40",     identityWash: "from-sky-50/25",     avatarRing: "ring-sky-200",    badge: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",            icon: Eye           },
  "Kritis":          { stripe: "bg-rose-600",   topBarBg: "bg-rose-50/60",    identityWash: "from-rose-50/40",    avatarRing: "ring-rose-400",   badge: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",         icon: AlertTriangle, pulse: true },
  "Pulang Hari Ini": { stripe: "bg-amber-500",  topBarBg: "bg-amber-50/40",   identityWash: "from-amber-50/25",   avatarRing: "ring-amber-200",  badge: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",      icon: LogOut        },
  "Konsultasi":      { stripe: "bg-violet-500", topBarBg: "bg-violet-50/40",  identityWash: "from-violet-50/25",  avatarRing: "ring-violet-200", badge: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",   icon: MessageSquare },
};

// ── Vital helpers ─────────────────────────────────────────

type VLvl = "normal" | "warning" | "critical";

const VITAL_CLS: Record<VLvl, { card: string; value: string; meta: string }> = {
  normal:   { card: "bg-emerald-50 ring-1 ring-emerald-200", value: "text-emerald-700", meta: "text-emerald-500" },
  warning:  { card: "bg-amber-50  ring-1 ring-amber-200",    value: "text-amber-700",   meta: "text-amber-500"   },
  critical: { card: "bg-rose-50   ring-1 ring-rose-200",     value: "text-rose-700",    meta: "text-rose-400"    },
};

const lvlTD    = (s: number, d: number): VLvl => (s > 180 || s < 80 || d > 120 || d < 50) ? "critical" : (s > 140 || s < 90 || d > 90 || d < 60) ? "warning" : "normal";
const lvlNadi  = (v: number): VLvl => (v > 130 || v < 40) ? "critical" : (v > 100 || v < 60) ? "warning" : "normal";
const lvlSpo2  = (v: number): VLvl => v < 90 ? "critical" : v < 95 ? "warning" : "normal";
const lvlSuhu  = (v: number): VLvl => (v > 39.5 || v < 35) ? "critical" : (v > 37.5 || v < 36) ? "warning" : "normal";
const lvlResp  = (v: number): VLvl => (v > 30 || v < 8) ? "critical" : (v > 20 || v < 12) ? "warning" : "normal";
const lvlGCS   = (v: number): VLvl => v <= 8 ? "critical" : v <= 12 ? "warning" : "normal";
const lvlNyeri = (v: number): VLvl => v >= 7 ? "critical" : v >= 4 ? "warning" : "normal";

// ── VitalChip ─────────────────────────────────────────────

function VitalChip({ icon: Icon, label, value, unit, lvl, title }: {
  icon: React.ElementType; label: string; value: string; unit: string; lvl: VLvl; title?: string;
}) {
  const cls = VITAL_CLS[lvl];
  return (
    <div title={title} className={cn(
      "relative flex shrink-0 cursor-default items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition hover:shadow-sm",
      cls.card,
    )}>
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
          {value}<span className={cn("ml-0.5 text-[9px] font-normal", cls.meta)}>{unit}</span>
        </p>
      </div>
    </div>
  );
}

// ── InfoChip ──────────────────────────────────────────────

function InfoChip({ icon: Icon, value, cls }: {
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

// ── DPJPCard ──────────────────────────────────────────────

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
      <Stethoscope size={90} className="pointer-events-none absolute -right-6 -top-6 rotate-12 text-white/[0.07]" />
      <div className="relative flex h-full flex-col px-3 py-2.5">
        <span className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-200">
          <Stethoscope size={9} /> DPJP
        </span>
        {editing ? (
          <div className="flex flex-col gap-2">
            <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
              className="w-full rounded-lg border border-white/30 bg-white/15 px-2.5 py-1.5 text-sm font-semibold text-white outline-none placeholder-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/40" />
            <div className="flex gap-1.5">
              <button onClick={save} className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-white/20 py-1.5 text-xs font-semibold text-white transition hover:bg-white/30">
                <Check size={11} /> Simpan
              </button>
              <button onClick={cancel} className="flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/15 hover:text-white">
                <X size={11} /> Batal
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="group/val w-full cursor-pointer rounded-lg px-0 text-left transition hover:bg-white/8" aria-label="Edit DPJP">
            <p className="truncate text-sm font-bold leading-tight text-white">{current}</p>
            <span className="mt-1 flex items-center gap-1 text-[9px] text-emerald-200/0 transition-all group-hover/val:text-emerald-200/70">
              <Pencil size={8} /> Klik untuk edit
            </span>
          </button>
        )}
        {!editing && <p className="mt-auto pt-1.5 text-[9px] tracking-wide text-emerald-200/50">Dokter Penanggung Jawab</p>}
      </div>
    </div>
  );
}

// ── Admission info card ───────────────────────────────────

function AdmitCard({ tglMasuk, hariKe }: { tglMasuk: string; hariKe: number }) {
  return (
    <div className="relative w-44 shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-slate-700 to-slate-900 shadow-md">
      <CalendarDays size={64} className="pointer-events-none absolute -right-3 -bottom-3 text-white/[0.07]" />
      <div className="relative flex flex-col px-3 py-2.5">
        <span className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
          <CalendarDays size={9} /> Tgl Masuk
        </span>
        <p className="text-sm font-bold leading-tight text-white">{tglMasuk}</p>
        <div className="mt-2 flex items-center gap-1.5">
          <Clock size={9} className="text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-300">
            Hari ke-<strong className="text-white">{hariKe}</strong>
          </span>
        </div>
        <p className="mt-auto pt-1.5 text-[9px] tracking-wide text-slate-400/70">Hari Perawatan</p>
      </div>
    </div>
  );
}

// ── Isolasi form panel ────────────────────────────────────

function IsolasiPanel({
  current,
  onSave,
  onClose,
}: {
  current: IsolasiTipe | null;
  onSave: (tipe: IsolasiTipe, tanggal: string, alasan: string, dokter: string) => void;
  onClose: () => void;
}) {
  const [tipe,    setTipe]    = useState<IsolasiTipe>(current ?? "Contact");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [alasan,  setAlasan]  = useState("");
  const [dokter,  setDokter]  = useState("");

  const cfg = ISOLASI_CFG[tipe];

  return (
    <div className={cn("border-t px-3 pb-3 pt-2.5 md:px-4", cfg.formBg, cfg.formBorder)}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <ShieldAlert size={13} className="text-slate-600" />
          <p className="text-xs font-bold text-slate-700">Kewaspadaan Isolasi</p>
          <span className="text-[10px] text-slate-400">SNARS PPI 5</span>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-white/60 hover:text-slate-600 transition">
          <X size={13} />
        </button>
      </div>

      {/* Type selector */}
      <div className="flex gap-1.5 mb-3">
        {ISOLASI_OPTIONS.map((t) => {
          const c = ISOLASI_CFG[t];
          return (
            <button
              key={t}
              onClick={() => setTipe(t)}
              className={cn(
                "flex-1 rounded-lg border px-2.5 py-2 text-left transition",
                tipe === t
                  ? cn("ring-2", c.formBorder, c.formBg)
                  : "border-slate-200 bg-white hover:bg-slate-50",
              )}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={cn("h-2 w-2 rounded-full shrink-0", c.dot)} />
                <p className={cn("text-xs font-bold", tipe === t ? "" : "text-slate-700")}>{c.label}</p>
                {tipe === t && <Check size={10} className="ml-auto text-slate-600 shrink-0" />}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">{c.subdesc}</p>
            </button>
          );
        })}
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tanggal Mulai</p>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
          />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Alasan Klinis</p>
          <input
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Suspek TB, MRSA, dll..."
            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
          />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Dokter Penetap</p>
          <input
            value={dokter}
            onChange={(e) => setDokter(e.target.value)}
            placeholder="Nama dokter..."
            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
          />
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-end gap-2">
        {current && (
          <button
            onClick={() => { onSave(tipe, "", "", ""); onClose(); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-rose-600 hover:bg-rose-50 transition"
          >
            Cabut Isolasi
          </button>
        )}
        <button
          onClick={() => { onSave(tipe, tanggal, alasan, dokter); onClose(); }}
          className="flex items-center gap-1 rounded-lg bg-slate-800 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-900 transition"
        >
          <Check size={11} /> Tetapkan Isolasi
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RIPatientHeader({ patient }: { patient: RawatInapPatientDetail }) {
  const cfg        = STATUS_CFG[patient.status];
  const StatusIcon = cfg.icon;
  const vs         = patient.vitalSigns;
  const gcsTotal   = vs.gcsEye + vs.gcsVerbal + vs.gcsMotor;

  const [isolasiTipe,     setIsolasiTipe]     = useState<IsolasiTipe | null>(null);
  const [showIsolasiForm, setShowIsolasiForm] = useState(false);

  const initials = patient.name
    .split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  const penjaminLabel: Record<string, string> = {
    BPJS_PBI: "BPJS PBI", BPJS_Non_PBI: "BPJS Non-PBI",
    Umum: "Umum", Asuransi: "Asuransi", Jamkesda: "Jamkesda",
  };

  return (
    <header className="shrink-0 shadow-sm">
      <div className="flex">

        {/* ── Left: thin status stripe ── */}
        <div className={cn("w-1.5 shrink-0", cfg.stripe)}>
          {cfg.pulse && (
            <div className="flex h-full items-center justify-center">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
            </div>
          )}
        </div>

        {/* ── Right: content ── */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Breadcrumb bar */}
          <div className={cn(
            "flex items-center gap-2 border-b border-slate-100 px-3 py-2 md:px-4",
            cfg.topBarBg,
          )}>
            <Link href="/ehis-care/rawat-inap"
              className="text-xs text-slate-400 transition hover:text-slate-600">
              Rawat Inap
            </Link>
            <ChevronRight size={11} className="shrink-0 text-slate-300" />
            <span className="text-xs text-slate-400">{patient.ruangan}</span>
            <ChevronRight size={11} className="shrink-0 text-slate-300" />
            <span className="font-mono text-xs font-semibold text-slate-500">{patient.noBed}</span>

            <span className={cn(
              "ml-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              cfg.badge,
            )}>
              <StatusIcon size={9} />
              {patient.status}
            </span>

            <Link
              href="/ehis-care/rawat-inap"
              className="ml-auto flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-white hover:text-slate-700"
              aria-label="Tutup"
            >
              <X size={12} />
            </Link>
          </div>

          {/* Identity section */}
          <div className="relative bg-white">
            <div className={cn("pointer-events-none absolute inset-0 bg-linear-to-r", cfg.identityWash, "to-transparent")} />

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
                    "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black ring-2",
                    cfg.avatarRing,
                    patient.gender === "L" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700",
                  )}>
                    {initials}
                    {cfg.pulse && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
                      </span>
                    )}
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
                      <span className="text-slate-300">·</span>
                      <span className="font-medium text-slate-600">{patient.spesialis}</span>
                    </p>
                  </div>
                </div>

                {/* Info chips */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <InfoChip
                    icon={BedDouble}
                    value={<>{patient.ruangan}<span className="mx-1 text-slate-300">·</span><strong>{patient.noBed}</strong></>}
                    cls="bg-slate-100 ring-slate-200 text-slate-700"
                  />
                  <InfoChip
                    icon={Clock}
                    value={<>Hari ke-<strong>{patient.hariKe}</strong></>}
                    cls="bg-indigo-50 ring-indigo-200 text-indigo-800"
                  />
                  <InfoChip
                    icon={CreditCard}
                    value={<>{penjaminLabel[patient.penjamin]}{patient.noBpjs && <span className="ml-1 font-mono text-emerald-500">{patient.noBpjs}</span>}</>}
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
                  {/* Isolasi chip */}
                  <button
                    onClick={() => setShowIsolasiForm((v) => !v)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm ring-1 transition",
                      isolasiTipe
                        ? ISOLASI_CFG[isolasiTipe].chip
                        : "bg-white ring-slate-200 text-slate-400 hover:ring-slate-300 hover:text-slate-600 border border-dashed border-slate-300",
                    )}
                  >
                    {isolasiTipe
                      ? <ShieldAlert size={11} className="shrink-0" />
                      : <Shield size={11} className="shrink-0" />}
                    {isolasiTipe ? `Isolasi ${ISOLASI_CFG[isolasiTipe].label}` : "Set Isolasi"}
                    <ChevronDown size={10} className={cn("shrink-0 transition-transform", showIsolasiForm && "rotate-180")} />
                  </button>
                </div>
              </motion.div>

              {/* Right: DPJP + Admit cards */}
              <motion.div
                className="hidden gap-2 md:flex"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
              >
                <DPJPCard value={patient.dpjp} onSave={() => {}} />
                <AdmitCard tglMasuk={patient.tglMasuk} hariKe={patient.hariKe} />
              </motion.div>
            </div>

            {/* Isolasi panel — expands below the grid */}
            <AnimatePresence>
              {showIsolasiForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <IsolasiPanel
                    current={isolasiTipe}
                    onSave={(tipe, tanggal, alasan, dokter) => {
                      setIsolasiTipe(tanggal ? tipe : null);
                    }}
                    onClose={() => setShowIsolasiForm(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Vitals bar */}
          <div className="border-t border-slate-200 bg-linear-to-r from-slate-100 to-slate-50 px-3 py-2 md:px-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="mr-1 shrink-0 text-[9px] font-bold uppercase tracking-widest text-slate-400">Vital</span>
              <VitalChip icon={Activity}    label="TD"    value={`${vs.tdSistolik}/${vs.tdDiastolik}`} unit="mmHg" lvl={lvlTD(vs.tdSistolik, vs.tdDiastolik)} />
              <VitalChip icon={Heart}       label="Nadi"  value={`${vs.nadi}`}       unit="bpm"  lvl={lvlNadi(vs.nadi)} />
              <VitalChip icon={Wind}        label="RR"    value={`${vs.respirasi}`}  unit="/mnt" lvl={lvlResp(vs.respirasi)} />
              <VitalChip icon={Gauge}       label="SpO₂"  value={`${vs.spo2}`}       unit="%"    lvl={lvlSpo2(vs.spo2)} />
              <VitalChip icon={Thermometer} label="Suhu"  value={`${vs.suhu}`}       unit="°C"   lvl={lvlSuhu(vs.suhu)} />
              <VitalChip icon={Layers}      label="GCS"   value={`${gcsTotal}`}      unit="/15"  lvl={lvlGCS(gcsTotal)} />
              <VitalChip icon={Zap}         label="Nyeri" value={`${vs.skalaNyeri}`} unit="/10"  lvl={lvlNyeri(vs.skalaNyeri)} />
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
