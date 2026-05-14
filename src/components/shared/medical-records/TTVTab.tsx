"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CalendarDays } from "lucide-react";
import type { IGDVitalSigns, StatusKesadaran, RITTVRecord, RIShift } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Vital status helpers ──────────────────────────────────

type VStatus = "normal" | "warning" | "critical";

const tdStatus   = (s: number, d: number): VStatus =>
  (s < 90 || d < 60) ? "critical" : (s > 140 || d > 90) ? "warning" : "normal";
const nadiStatus = (v: number): VStatus =>
  (v > 120 || v < 50) ? "critical" : (v > 100 || v < 60) ? "warning" : "normal";
const rrStatus   = (v: number): VStatus =>
  (v > 30 || v < 10) ? "critical" : v > 20 ? "warning" : "normal";
const suhuStatus = (v: number): VStatus =>
  (v >= 39 || v < 35) ? "critical" : v >= 37.5 ? "warning" : "normal";
const spo2Status = (v: number): VStatus =>
  v < 90 ? "critical" : v < 95 ? "warning" : "normal";
const gcsStatus  = (v: number): VStatus =>
  v <= 8 ? "critical" : v <= 12 ? "warning" : "normal";
const nyeriStatus = (v: number): VStatus =>
  v >= 7 ? "critical" : v >= 4 ? "warning" : "normal";

const VCARD_CLS: Record<VStatus, { card: string; value: string; label: string }> = {
  normal:   { card: "border-emerald-200 bg-emerald-50", value: "text-emerald-800", label: "text-emerald-600" },
  warning:  { card: "border-amber-200  bg-amber-50",   value: "text-amber-800",   label: "text-amber-600"   },
  critical: { card: "border-rose-200   bg-rose-50",    value: "text-rose-800",    label: "text-rose-600"    },
};

const STATUS_DOT: Record<VStatus, string> = {
  normal: "bg-emerald-400", warning: "bg-amber-400", critical: "bg-rose-500 animate-pulse",
};

// ── Pain scale helpers ────────────────────────────────────

type PainLevel = "zero" | "mild" | "moderate" | "severe";

function painLevel(v: number): PainLevel {
  if (v === 0) return "zero";
  if (v <= 3)  return "mild";
  if (v <= 6)  return "moderate";
  return "severe";
}

const PAIN_META: Record<PainLevel, { text: string; badge: string; btn: string; hover: string }> = {
  zero:     { text: "Tidak Nyeri",  badge: "bg-slate-100 text-slate-600",    btn: "bg-slate-500 text-white ring-2 ring-slate-300",    hover: "hover:bg-slate-100 hover:text-slate-600"    },
  mild:     { text: "Nyeri Ringan", badge: "bg-emerald-100 text-emerald-700", btn: "bg-emerald-500 text-white ring-2 ring-emerald-300", hover: "hover:bg-emerald-50 hover:text-emerald-700" },
  moderate: { text: "Nyeri Sedang", badge: "bg-amber-100 text-amber-700",    btn: "bg-amber-400 text-white ring-2 ring-amber-200",    hover: "hover:bg-amber-50 hover:text-amber-700"    },
  severe:   { text: "Nyeri Berat",  badge: "bg-rose-100 text-rose-700",      btn: "bg-rose-500 text-white ring-2 ring-rose-300",      hover: "hover:bg-rose-50 hover:text-rose-700"      },
};

// ── VitalCard ─────────────────────────────────────────────

function VitalCard({ label, value, unit, status, sub }: {
  label: string; value: string; unit: string; status: VStatus; sub: string;
}) {
  const cls = VCARD_CLS[status];
  return (
    <div className={cn("rounded-xl border p-4", cls.card)}>
      <div className="flex items-center justify-between gap-2">
        <p className={cn("text-[11px] font-semibold uppercase tracking-wide", cls.label)}>{label}</p>
        <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[status])} />
      </div>
      <p className={cn("mt-2 text-2xl font-bold tabular-nums leading-none", cls.value)}>
        {value}<span className="ml-1 text-xs font-normal opacity-60">{unit}</span>
      </p>
      <p className={cn("mt-1 text-xs opacity-80", cls.label)}>{sub}</p>
    </div>
  );
}

// ── PainScale — interactive or read-only ─────────────────

function PainScale({ value, onSelect }: { value: number; onSelect?: (v: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = !!onSelect;
  const display = hovered ?? value;
  const meta    = PAIN_META[painLevel(display)];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Skala Nyeri NRS (0–10)
        </p>
        <motion.span
          key={display}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          className={cn("shrink-0 rounded-md px-2 py-0.5 text-xs font-bold", meta.badge)}
        >
          {display}/10 · {meta.text}
        </motion.span>
      </div>

      <div className="mb-1.5 flex justify-between px-0.5">
        <span className="text-[10px] text-slate-400">Tidak nyeri</span>
        <span className="text-[10px] text-slate-400">Sangat nyeri</span>
      </div>

      {/* grid-cols-11 makes buttons always fill container width — responsive by default */}
      <div className="grid grid-cols-11 gap-0.5 sm:gap-1">
        {Array.from({ length: 11 }, (_, i) => {
          const m        = PAIN_META[painLevel(i)];
          const isActive = i === value;
          return (
            <motion.button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => onSelect?.(i)}
              onMouseEnter={() => interactive && setHovered(i)}
              onMouseLeave={() => interactive && setHovered(null)}
              whileHover={interactive ? { scale: 1.1 } : {}}
              whileTap={interactive ? { scale: 0.92 } : {}}
              className={cn(
                "flex h-9 items-center justify-center rounded-lg text-xs font-bold transition-colors",
                isActive
                  ? m.btn
                  : cn("bg-slate-100 text-slate-400", interactive && m.hover),
                interactive ? "cursor-pointer" : "cursor-default",
              )}
            >
              {i}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-2 h-1.5 w-full rounded-full bg-linear-to-r from-emerald-400 via-amber-400 to-rose-500 opacity-60" />

      {interactive && (
        <p className="mt-1.5 text-[11px] text-slate-400">
          Klik angka untuk memilih skala nyeri (0 = tidak nyeri, 10 = sangat nyeri)
        </p>
      )}
    </div>
  );
}

// ── Kesadaran ─────────────────────────────────────────────

const KESADARAN_LABEL: Record<StatusKesadaran, { label: string; cls: string }> = {
  Compos_Mentis: { label: "Compos Mentis", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  Apatis:        { label: "Apatis",        cls: "bg-amber-50  text-amber-700  ring-1 ring-amber-200"  },
  Somnolen:      { label: "Somnolen",      cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-200" },
  Sopor:         { label: "Sopor",         cls: "bg-rose-50   text-rose-700   ring-1 ring-rose-200"   },
  Koma:          { label: "Koma",          cls: "bg-red-100   text-red-800    ring-1 ring-red-300"    },
};

const KESADARAN_LIST: StatusKesadaran[] = [
  "Compos_Mentis", "Apatis", "Somnolen", "Sopor", "Koma",
];

// ── NumInput ──────────────────────────────────────────────

function NumInput({ label, unit, value, onChange }: {
  label: string; unit: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex h-9 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-800 outline-none" />
        <span className="flex items-center border-l border-slate-200 bg-slate-100 px-2 text-xs text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

// ── Shift config ──────────────────────────────────────────

const SHIFT_CLS: Record<RIShift, string> = {
  Pagi:  "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  Siang: "bg-sky-100   text-sky-700   ring-1 ring-sky-200",
  Malam: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
};

const MONTHS_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)} ${MONTHS_ID[parseInt(m, 10) - 1]} ${y}`;
}

// ── HistoryRow (expandable) ───────────────────────────────

function HistoryRow({ rec, delay }: { rec: RITTVRecord; delay: number }) {
  const [open, setOpen] = useState(false);
  const vs       = rec.vitalSigns;
  const gcs      = vs.gcsEye + vs.gcsVerbal + vs.gcsMotor;
  const kes      = KESADARAN_LABEL[rec.statusKesadaran];
  const nrsMeta  = PAIN_META[painLevel(vs.skalaNyeri)];

  const worst: VStatus =
    [tdStatus(vs.tdSistolik, vs.tdDiastolik), nadiStatus(vs.nadi), spo2Status(vs.spo2), gcsStatus(gcs), nyeriStatus(vs.skalaNyeri)]
      .includes("critical") ? "critical"
    : [tdStatus(vs.tdSistolik, vs.tdDiastolik), nadiStatus(vs.nadi), spo2Status(vs.spo2), nyeriStatus(vs.skalaNyeri)]
      .includes("warning") ? "warning" : "normal";

  const borderCls = worst === "critical" ? "border-rose-200" : worst === "warning" ? "border-amber-200" : "border-slate-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay, ease: "easeOut" }}
      className={cn("overflow-hidden rounded-xl border bg-white shadow-sm", borderCls)}
    >
      {/* Row header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold", SHIFT_CLS[rec.shift])}>
          {rec.shift}
        </span>
        <span className="font-mono text-xs font-semibold text-slate-500">{rec.jam}</span>
        <span className="truncate text-xs text-slate-500">{rec.perawat}</span>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* Compact vital preview */}
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums",
              VCARD_CLS[tdStatus(vs.tdSistolik, vs.tdDiastolik)].card,
              VCARD_CLS[tdStatus(vs.tdSistolik, vs.tdDiastolik)].value,
            )}>
              {vs.tdSistolik}/{vs.tdDiastolik}
            </span>
            <span className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-bold",
              VCARD_CLS[spo2Status(vs.spo2)].card,
              VCARD_CLS[spo2Status(vs.spo2)].value,
            )}>
              SpO₂ {vs.spo2}%
            </span>
            {/* Pain badge — shown only when pain > 0 */}
            {vs.skalaNyeri > 0 && (
              <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold", nrsMeta.badge)}>
                NRS {vs.skalaNyeri}
              </span>
            )}
          </div>
          <ChevronDown
            size={14}
            className={cn("shrink-0 text-slate-400 transition-transform duration-200", open && "rotate-180")}
          />
        </div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="border-t border-slate-100 px-4 pb-4 pt-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <VitalCard label="Tekanan Darah" unit="mmHg"
                  value={`${vs.tdSistolik}/${vs.tdDiastolik}`}
                  status={tdStatus(vs.tdSistolik, vs.tdDiastolik)}
                  sub={vs.tdSistolik < 90 ? "Hipotensi" : vs.tdSistolik > 140 ? "Hipertensi" : "Normal"} />
                <VitalCard label="Nadi" unit="×/mnt" value={String(vs.nadi)}
                  status={nadiStatus(vs.nadi)}
                  sub={vs.nadi > 100 ? "Takikardia" : vs.nadi < 60 ? "Bradikardia" : "Normal"} />
                <VitalCard label="Respirasi" unit="×/mnt" value={String(vs.respirasi)}
                  status={rrStatus(vs.respirasi)}
                  sub={vs.respirasi > 20 ? "Takipnea" : "Normal"} />
                <VitalCard label="Suhu" unit="°C" value={String(vs.suhu)}
                  status={suhuStatus(vs.suhu)}
                  sub={vs.suhu >= 37.5 ? "Febris" : "Afebris"} />
                <VitalCard label="SpO₂" unit="%" value={String(vs.spo2)}
                  status={spo2Status(vs.spo2)}
                  sub={vs.spo2 < 90 ? "Hipoksemia berat" : vs.spo2 < 95 ? "Hipoksemia" : "Normal"} />
                <VitalCard label="GCS" unit="/ 15" value={String(gcs)}
                  status={gcsStatus(gcs)} sub={`E${vs.gcsEye} V${vs.gcsVerbal} M${vs.gcsMotor}`} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Kesadaran</p>
                  <span className={cn("rounded-md px-2.5 py-0.5 text-xs font-semibold", kes.cls)}>{kes.label}</span>
                </div>
              </div>

              {/* Pain scale read-only display */}
              <div className="mt-3 border-t border-slate-100 pt-3">
                <PainScale value={vs.skalaNyeri} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Props ─────────────────────────────────────────────────

export interface TTVTabProps {
  vitalSigns:      IGDVitalSigns;
  statusKesadaran: StatusKesadaran;
  history?:        RITTVRecord[];  // RI mode: show history + shift fields in form
}

// ── Component ─────────────────────────────────────────────

export default function TTVTab({ vitalSigns, statusKesadaran, history }: TTVTabProps) {
  const showShift = history !== undefined;

  const [currentVS,  setCurrentVS]  = useState(vitalSigns);
  const [currentKes, setCurrentKes] = useState(statusKesadaran);
  const [localHistory, setLocalHistory] = useState<RITTVRecord[]>(history ?? []);

  const vs  = currentVS;
  const gcs = vs.gcsEye + vs.gcsVerbal + vs.gcsMotor;
  const kes = KESADARAN_LABEL[currentKes];
  const bmi = vs.beratBadan && vs.tinggiBadan
    ? (vs.beratBadan / Math.pow(vs.tinggiBadan / 100, 2)).toFixed(1)
    : null;

  const [form, setForm] = useState({
    tdS: String(vs.tdSistolik), tdD: String(vs.tdDiastolik),
    nadi: String(vs.nadi), rr: String(vs.respirasi),
    suhu: String(vs.suhu), spo2: String(vs.spo2),
    gcsE: String(vs.gcsEye), gcsV: String(vs.gcsVerbal), gcsM: String(vs.gcsMotor),
    nyeri: String(vs.skalaNyeri),
    bb: String(vs.beratBadan ?? ""), tb: String(vs.tinggiBadan ?? ""),
    shift: "Pagi" as RIShift,
    perawat: "",
    kesadaran: currentKes,
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    const newVS: IGDVitalSigns = {
      tdSistolik: Number(form.tdS),  tdDiastolik: Number(form.tdD),
      nadi:       Number(form.nadi), respirasi:   Number(form.rr),
      suhu:       Number(form.suhu), spo2:        Number(form.spo2),
      gcsEye:     Number(form.gcsE), gcsVerbal:   Number(form.gcsV), gcsMotor: Number(form.gcsM),
      skalaNyeri: Number(form.nyeri),
      beratBadan:  form.bb ? Number(form.bb) : undefined,
      tinggiBadan: form.tb ? Number(form.tb) : undefined,
    };
    const kes = form.kesadaran as StatusKesadaran;

    if (showShift) {
      const now     = new Date();
      const jam     = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const tanggal = now.toISOString().split("T")[0];
      const newRec: RITTVRecord = {
        id: `ttv-${Date.now()}`, tanggal, jam,
        shift: form.shift as RIShift,
        perawat: form.perawat || "—",
        vitalSigns: newVS, statusKesadaran: kes,
      };
      setLocalHistory((prev) => [newRec, ...prev]);
    }
    setCurrentVS(newVS);
    setCurrentKes(kes);
  };

  const histGroups: Record<string, RITTVRecord[]> = localHistory.reduce((acc, r) => {
    if (!acc[r.tanggal]) acc[r.tanggal] = [];
    acc[r.tanggal].push(r);
    return acc;
  }, {} as Record<string, RITTVRecord[]>);
  const sortedDates = Object.keys(histGroups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col gap-4">

      {/* ── Current vitals display ── */}
      <motion.section
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Tanda-tanda Vital Terakhir</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Tekanan Darah", unit: "mmHg", value: `${vs.tdSistolik}/${vs.tdDiastolik}`, status: tdStatus(vs.tdSistolik, vs.tdDiastolik), sub: vs.tdSistolik < 90 ? "Hipotensi" : vs.tdSistolik > 140 ? "Hipertensi" : "Normal" },
            { label: "Nadi",          unit: "×/mnt", value: String(vs.nadi),      status: nadiStatus(vs.nadi),      sub: vs.nadi > 100 ? "Takikardia" : vs.nadi < 60 ? "Bradikardia" : "Normal" },
            { label: "Respirasi",     unit: "×/mnt", value: String(vs.respirasi), status: rrStatus(vs.respirasi),   sub: vs.respirasi > 20 ? "Takipnea" : "Normal" },
            { label: "Suhu",          unit: "°C",    value: String(vs.suhu),      status: suhuStatus(vs.suhu),      sub: vs.suhu >= 37.5 ? "Febris" : "Afebris" },
            { label: "SpO₂",          unit: "%",     value: String(vs.spo2),      status: spo2Status(vs.spo2),      sub: vs.spo2 < 90 ? "Hipoksemia berat" : vs.spo2 < 95 ? "Hipoksemia" : "Normal" },
            { label: "GCS",           unit: "/ 15",  value: String(gcs),          status: gcsStatus(gcs),           sub: `E${vs.gcsEye} V${vs.gcsVerbal} M${vs.gcsMotor}` },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: i * 0.04, ease: "easeOut" }}>
              <VitalCard {...card} />
            </motion.div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Kesadaran</p>
            <span className={cn("rounded-md px-2.5 py-1 text-xs font-semibold", kes.cls)}>{kes.label}</span>
          </div>
          {bmi && (
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">BMI</p>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{bmi} kg/m²</span>
            </div>
          )}
        </div>

        {/* Pain scale read-only — current value */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <PainScale value={vs.skalaNyeri} />
        </div>
      </motion.section>

      {/* ── Update/Add form ── */}
      <motion.section
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.08 }}
      >
        <h2 className="mb-4 text-sm font-semibold text-slate-700">
          {showShift ? "Catat TTV Baru" : "Perbarui TTV"}
        </h2>

        {showShift && (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Shift</p>
              <div className="flex gap-1.5">
                {(["Pagi","Siang","Malam"] as RIShift[]).map((s) => (
                  <button key={s} type="button" onClick={() => set("shift", s)}
                    className={cn(
                      "flex-1 rounded-lg border py-1.5 text-xs font-semibold transition",
                      form.shift === s ? SHIFT_CLS[s] : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                    )}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Nama Perawat</p>
              <input type="text" value={form.perawat} onChange={(e) => set("perawat", e.target.value)}
                placeholder="Nama lengkap..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>
        )}

        {/* Tekanan Darah */}
        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tekanan Darah (mmHg)</p>
          <div className="flex items-center gap-2">
            <input type="number" value={form.tdS} onChange={(e) => set("tdS", e.target.value)}
              placeholder="Sistolik"
              className="h-9 w-28 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <span className="text-slate-400">/</span>
            <input type="number" value={form.tdD} onChange={(e) => set("tdD", e.target.value)}
              placeholder="Diastolik"
              className="h-9 w-28 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <span className="text-xs text-slate-400">mmHg</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <NumInput label="Nadi" unit="×/mnt" value={form.nadi} onChange={(v) => set("nadi", v)} />
          <NumInput label="Respirasi" unit="×/mnt" value={form.rr} onChange={(v) => set("rr", v)} />
          <NumInput label="Suhu" unit="°C" value={form.suhu} onChange={(v) => set("suhu", v)} />
          <NumInput label="SpO₂" unit="%" value={form.spo2} onChange={(v) => set("spo2", v)} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 sm:max-w-sm">
          <NumInput label="Eye (E)" unit="/4" value={form.gcsE} onChange={(v) => set("gcsE", v)} />
          <NumInput label="Verbal (V)" unit="/5" value={form.gcsV} onChange={(v) => set("gcsV", v)} />
          <NumInput label="Motor (M)" unit="/6" value={form.gcsM} onChange={(v) => set("gcsM", v)} />
        </div>

        {/* Skala Nyeri — interactive visual selector */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <PainScale
            value={Number(form.nyeri)}
            onSelect={(v) => set("nyeri", String(v))}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-xs">
          <NumInput label="Berat Badan" unit="kg" value={form.bb} onChange={(v) => set("bb", v)} />
          <NumInput label="Tinggi Badan" unit="cm" value={form.tb} onChange={(v) => set("tb", v)} />
        </div>

        {showShift && (
          <div className="mt-4">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tingkat Kesadaran</p>
            <div className="flex flex-wrap gap-1.5">
              {KESADARAN_LIST.map((k) => {
                const kc = KESADARAN_LABEL[k];
                return (
                  <button key={k} type="button" onClick={() => set("kesadaran", k)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                      form.kesadaran === k ? kc.cls : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                    )}>
                    {kc.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={handleSave}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700">
            {showShift ? "Simpan Rekaman TTV" : "Simpan TTV"}
          </button>
        </div>
      </motion.section>

      {/* ── History (RI mode only) ── */}
      {showShift && (
        <motion.section
          className="flex flex-col gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-700">Riwayat TTV</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {localHistory.length}
            </span>
          </div>

          {localHistory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-sm text-slate-400">
              Belum ada rekaman TTV
            </div>
          ) : (
            sortedDates.map((date) => (
              <div key={date} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1">
                  <CalendarDays size={11} className="text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{fmtDate(date)}</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                {histGroups[date].map((rec, i) => (
                  <HistoryRow key={rec.id} rec={rec} delay={i * 0.05} />
                ))}
              </div>
            ))
          )}
        </motion.section>
      )}

    </div>
  );
}
