"use client";

import { useState } from "react";
import type { IGDPatientDetail, IGDVitalSigns, StatusKesadaran } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Status helpers ────────────────────────────────────────

type VStatus = "normal" | "warning" | "critical";

function tdStatus(s: number, d: number): VStatus {
  if (s < 90 || d < 60) return "critical";
  if (s > 140 || d > 90) return "warning";
  return "normal";
}
function nadiStatus(v: number): VStatus {
  if (v > 120 || v < 50) return "critical";
  if (v > 100 || v < 60) return "warning";
  return "normal";
}
function rrStatus(v: number): VStatus {
  if (v > 30 || v < 10) return "critical";
  if (v > 20) return "warning";
  return "normal";
}
function suhuStatus(v: number): VStatus {
  if (v >= 39 || v < 35) return "critical";
  if (v >= 37.5) return "warning";
  return "normal";
}
function spo2Status(v: number): VStatus {
  if (v < 90) return "critical";
  if (v < 95) return "warning";
  return "normal";
}
function gcsStatus(total: number): VStatus {
  if (total <= 8) return "critical";
  if (total <= 12) return "warning";
  return "normal";
}

const VCARD_CLS: Record<VStatus, { card: string; value: string; label: string }> = {
  normal:   { card: "border-emerald-200 bg-emerald-50", value: "text-emerald-800", label: "text-emerald-600" },
  warning:  { card: "border-amber-200  bg-amber-50",   value: "text-amber-800",   label: "text-amber-600"   },
  critical: { card: "border-rose-200   bg-rose-50",    value: "text-rose-800",    label: "text-rose-600"    },
};

const STATUS_DOT: Record<VStatus, string> = {
  normal:  "bg-emerald-400",
  warning: "bg-amber-400",
  critical: "bg-rose-500",
};

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
        {value}
        <span className="ml-1 text-xs font-normal opacity-60">{unit}</span>
      </p>
      <p className={cn("mt-1 text-xs", cls.label, "opacity-80")}>{sub}</p>
    </div>
  );
}

// ── Pain scale ────────────────────────────────────────────

function PainScale({ value }: { value: number }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Skala Nyeri (VAS)</p>
      <div className="flex gap-1">
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
              i === value
                ? i <= 3 ? "bg-emerald-500 text-white ring-2 ring-emerald-300"
                  : i <= 6 ? "bg-amber-400 text-white ring-2 ring-amber-200"
                  : "bg-rose-500 text-white ring-2 ring-rose-300"
                : "bg-slate-100 text-slate-400",
            )}
          >
            {i}
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-slate-400">
        {value === 0 ? "Tidak nyeri" : value <= 3 ? "Nyeri ringan" : value <= 6 ? "Nyeri sedang" : "Nyeri berat"}
      </p>
    </div>
  );
}

// ── Kesadaran label ───────────────────────────────────────

const KESADARAN_LABEL: Record<StatusKesadaran, { label: string; cls: string }> = {
  Compos_Mentis: { label: "Compos Mentis", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  Apatis:        { label: "Apatis",        cls: "bg-amber-50  text-amber-700  ring-1 ring-amber-200"  },
  Somnolen:      { label: "Somnolen",      cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-200" },
  Sopor:         { label: "Sopor",         cls: "bg-rose-50   text-rose-700   ring-1 ring-rose-200"   },
  Koma:          { label: "Koma",          cls: "bg-red-100   text-red-800    ring-1 ring-red-300"    },
};

// ── Input primitive ───────────────────────────────────────

function NumInput({ label, unit, value, onChange }: {
  label: string; unit: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex h-9 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-800 outline-none"
        />
        <span className="flex items-center border-l border-slate-200 bg-slate-100 px-2 text-xs text-slate-400">
          {unit}
        </span>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────

export default function TTVTab({ patient }: { patient: IGDPatientDetail }) {
  const vs = patient.vitalSigns;
  const gcs = vs.gcsEye + vs.gcsVerbal + vs.gcsMotor;
  const kes = KESADARAN_LABEL[patient.statusKesadaran];
  const bmi = vs.beratBadan && vs.tinggiBadan
    ? (vs.beratBadan / Math.pow(vs.tinggiBadan / 100, 2)).toFixed(1)
    : null;

  // Edit form state (pre-filled from patient data)
  const [form, setForm] = useState({
    tdS: String(vs.tdSistolik), tdD: String(vs.tdDiastolik),
    nadi: String(vs.nadi), rr: String(vs.respirasi),
    suhu: String(vs.suhu), spo2: String(vs.spo2),
    gcsE: String(vs.gcsEye), gcsV: String(vs.gcsVerbal), gcsM: String(vs.gcsMotor),
    nyeri: String(vs.skalaNyeri),
    bb: String(vs.beratBadan ?? ""), tb: String(vs.tinggiBadan ?? ""),
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="flex flex-col gap-4">

      {/* ── Current vital signs display ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Tanda-tanda Vital Terakhir</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <VitalCard
            label="Tekanan Darah" unit="mmHg"
            value={`${vs.tdSistolik}/${vs.tdDiastolik}`}
            status={tdStatus(vs.tdSistolik, vs.tdDiastolik)}
            sub={vs.tdSistolik < 90 ? "Hipotensi" : vs.tdSistolik > 140 ? "Hipertensi" : "Normal"}
          />
          <VitalCard
            label="Nadi" unit="×/mnt"
            value={String(vs.nadi)}
            status={nadiStatus(vs.nadi)}
            sub={vs.nadi > 100 ? "Takikardia" : vs.nadi < 60 ? "Bradikardia" : "Normal"}
          />
          <VitalCard
            label="Respirasi" unit="×/mnt"
            value={String(vs.respirasi)}
            status={rrStatus(vs.respirasi)}
            sub={vs.respirasi > 20 ? "Takipnea" : "Normal"}
          />
          <VitalCard
            label="Suhu" unit="°C"
            value={String(vs.suhu)}
            status={suhuStatus(vs.suhu)}
            sub={vs.suhu >= 37.5 ? "Febris" : "Afebris"}
          />
          <VitalCard
            label="SpO₂" unit="%"
            value={String(vs.spo2)}
            status={spo2Status(vs.spo2)}
            sub={vs.spo2 < 90 ? "Hipoksemia berat" : vs.spo2 < 95 ? "Hipoksemia" : "Normal"}
          />
          <VitalCard
            label="GCS" unit="/ 15"
            value={String(gcs)}
            status={gcsStatus(gcs)}
            sub={`E${vs.gcsEye} V${vs.gcsVerbal} M${vs.gcsMotor}`}
          />
        </div>

        {/* Kesadaran + Nyeri */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Kesadaran</p>
            <span className={cn("rounded-md px-2.5 py-1 text-xs font-semibold", kes.cls)}>
              {kes.label}
            </span>
          </div>
          {bmi && (
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">BMI</p>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {bmi} kg/m²
              </span>
            </div>
          )}
        </div>

        {/* Pain scale */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <PainScale value={vs.skalaNyeri} />
        </div>
      </section>

      {/* ── Update form ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Perbarui TTV</h2>

        {/* Tekanan Darah */}
        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Tekanan Darah (mmHg)
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={form.tdS}
              onChange={(e) => set("tdS", e.target.value)}
              placeholder="Sistolik"
              className="h-9 w-28 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <span className="text-slate-400">/</span>
            <input
              type="number"
              value={form.tdD}
              onChange={(e) => set("tdD", e.target.value)}
              placeholder="Diastolik"
              className="h-9 w-28 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <span className="text-xs text-slate-400">mmHg</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <NumInput label="Nadi" unit="×/mnt" value={form.nadi} onChange={(v) => set("nadi", v)} />
          <NumInput label="Respirasi" unit="×/mnt" value={form.rr} onChange={(v) => set("rr", v)} />
          <NumInput label="Suhu" unit="°C" value={form.suhu} onChange={(v) => set("suhu", v)} />
          <NumInput label="SpO₂" unit="%" value={form.spo2} onChange={(v) => set("spo2", v)} />
        </div>

        {/* GCS */}
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">GCS</p>
          <div className="grid grid-cols-3 gap-3 sm:max-w-sm">
            <NumInput label="Eye (E)" unit="/4" value={form.gcsE} onChange={(v) => set("gcsE", v)} />
            <NumInput label="Verbal (V)" unit="/5" value={form.gcsV} onChange={(v) => set("gcsV", v)} />
            <NumInput label="Motor (M)" unit="/6" value={form.gcsM} onChange={(v) => set("gcsM", v)} />
          </div>
        </div>

        {/* Skala Nyeri + BB/TB */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumInput label="Skala Nyeri (VAS)" unit="/10" value={form.nyeri} onChange={(v) => set("nyeri", v)} />
          <NumInput label="Berat Badan" unit="kg" value={form.bb} onChange={(v) => set("bb", v)} />
          <NumInput label="Tinggi Badan" unit="cm" value={form.tb} onChange={(v) => set("tb", v)} />
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            Simpan TTV
          </button>
        </div>
      </section>

    </div>
  );
}
