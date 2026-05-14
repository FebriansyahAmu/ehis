"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SCORE_CLR, CHRONIC_OPTIONS, getAPACHERisk,
  calcAPACHEFromActual, scoreAPACHETemp, scoreAPACHEMap, scoreAPACHEHR,
  scoreAPACHERR, scoreAPACHEOxy, scoreAPACHEPH, scoreAPACHENa,
  scoreAPACHEK, scoreAPACHECr, scoreAPACHEHct, scoreAPACHEWBC,
  gcsContrib, emptyAPACHEActual,
  type Score04, type APACHEActualValues, type APACHEEntry, type ChronicPoints,
} from "./icuScoringShared";

const TODAY = "2026-05-15";

// ── Param config ───────────────────────────────────────────

type StdKey = "temperature" | "map" | "heartRate" | "rr" | "ph" | "sodium" | "potassium" | "hematocrit" | "wbc";

const STANDARD_PARAMS: {
  key:       StdKey;
  label:     string; unit:  string; placeholder: string;
  min?:      number; max?:  number; step?: number;
  scoreFn:   (v: number) => Score04;
  hint:      string;
}[] = [
  { key: "temperature", label: "Suhu Rektal",   unit: "°C",       placeholder: "37.2", min: 20,  max: 45,  step: 0.1,
    scoreFn: scoreAPACHETemp,
    hint: "36–38.4=0 · 38.5–38.9=1 · 34–35.9=1 · 39–40.9=3 · 32–33.9=2 · ≥41=4 · 30–31.9=3 · <30=4" },
  { key: "map",         label: "MAP",            unit: "mmHg",     placeholder: "75",   min: 0,   max: 250,
    scoreFn: scoreAPACHEMap,
    hint: "70–109=0 · 110–129=2 · 50–69=2 · 130–159=3 · ≥160=4 · <50=4" },
  { key: "heartRate",   label: "Nadi",           unit: "bpm",      placeholder: "90",   min: 0,   max: 300,
    scoreFn: scoreAPACHEHR,
    hint: "70–109=0 · 110–139=2 · 55–69=2 · 140–179=3 · 40–54=3 · ≥180=4 · <40=4" },
  { key: "rr",          label: "Laju Napas",     unit: "x/mnt",    placeholder: "16",   min: 0,   max: 80,
    scoreFn: scoreAPACHERR,
    hint: "12–24=0 · 25–34=1 · 10–11=1 · 35–49=3 · 6–9=2 · ≥50=4 · <6=4" },
  { key: "ph",          label: "pH Darah",       unit: "",         placeholder: "7.40", min: 6.5, max: 8.0, step: 0.01,
    scoreFn: scoreAPACHEPH,
    hint: "7.33–7.49=0 · 7.50–7.59=1 · 7.25–7.32=2 · 7.60–7.69=3 · 7.15–7.24=3 · ≥7.70=4 · <7.15=4" },
  { key: "sodium",      label: "Natrium",        unit: "mEq/L",    placeholder: "138",  min: 80,  max: 200,
    scoreFn: scoreAPACHENa,
    hint: "130–149=0 · 150–154=1 · 155–159=2 · 120–129=2 · 160–179=3 · 111–119=3 · ≥180=4 · <111=4" },
  { key: "potassium",   label: "Kalium",         unit: "mEq/L",    placeholder: "4.0",  min: 1,   max: 10,  step: 0.1,
    scoreFn: scoreAPACHEK,
    hint: "3.5–5.4=0 · 5.5–5.9=1 · 3.0–3.4=1 · 2.5–2.9=2 · 6.0–6.9=3 · ≥7.0=4 · <2.5=4" },
  { key: "hematocrit",  label: "Hematokrit",     unit: "%",        placeholder: "38",   min: 0,   max: 70,
    scoreFn: scoreAPACHEHct,
    hint: "30–45.9=0 · 46–49.9=1 · 20–29.9=2 · 50–59.9=2 · ≥60=4 · <20=4" },
  { key: "wbc",         label: "Leukosit",       unit: "×10³/µL",  placeholder: "8.5",  min: 0,   max: 200, step: 0.1,
    scoreFn: scoreAPACHEWBC,
    hint: "3–14.9=0 · 15–19.9=1 · 1–2.9=2 · 20–39.9=2 · ≥40=4 · <1=4" },
];

// ── Primitives ─────────────────────────────────────────────

function NumInput({
  value, onChange, placeholder, min, max, step, unit,
}: {
  value: number | ""; onChange: (v: number | "") => void;
  placeholder: string; min?: number; max?: number; step?: number; unit?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number" min={min} max={max} step={step ?? "any"} value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        placeholder={placeholder}
        className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 tabular-nums outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      {unit && <span className="shrink-0 text-[10px] text-slate-400">{unit}</span>}
    </div>
  );
}

function ScoreChip({ score, extra }: { score: number | null; extra?: string }) {
  if (score === null) return <span className="w-6 text-center text-[10px] text-slate-300">–</span>;
  const s = Math.min(4, Math.max(0, Math.round(score))) as Score04;
  return (
    <div className="flex items-center gap-1.5">
      <motion.span
        key={score}
        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn("flex h-6 min-w-[24px] items-center justify-center rounded-md px-1 text-[11px] font-bold", SCORE_CLR[s].pill)}
      >
        {score}
      </motion.span>
      {extra && <span className="text-[9px] text-slate-400">{extra}</span>}
    </div>
  );
}

// ── ParamRow ───────────────────────────────────────────────

function ParamRow({ label, unit, hint, value, onChange, score, placeholder, min, max, step }: {
  label: string; unit: string; hint: string; value: number | ""; score: number | null;
  onChange: (v: number | "") => void; placeholder: string;
  min?: number; max?: number; step?: number;
}) {
  const [showHint, setShowHint] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-28 shrink-0">
          <p className="text-[11px] font-semibold text-slate-700">{label}</p>
          {unit && <p className="text-[9px] text-slate-400">{unit}</p>}
        </div>
        <NumInput value={value} onChange={onChange} placeholder={placeholder} min={min} max={max} step={step} />
        <ScoreChip score={score} />
        <button onClick={() => setShowHint(v => !v)}
          className="ml-auto shrink-0 rounded p-0.5 text-[9px] text-slate-400 transition-colors hover:text-indigo-500">
          Ref {showHint ? "▲" : "▼"}
        </button>
      </div>
      <AnimatePresence>
        {showHint && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            <p className="bg-slate-50 px-10 pb-2 text-[9px] leading-relaxed text-slate-400">{hint}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Oxygenation (special) ──────────────────────────────────

function OxygenSection({ v, onChange }: { v: APACHEActualValues; onChange: (p: Partial<APACHEActualValues>) => void }) {
  const fio2Val  = v.fio2 !== "" ? +v.fio2 : 21;
  const fio2Low  = fio2Val < 50;
  const paco2Val = v.paco2 !== "" ? +v.paco2 : 40;
  const oxy      = (v.pao2 !== "" && v.fio2 !== "") ? scoreAPACHEOxy(+v.pao2, fio2Val, paco2Val) : null;

  return (
    <div className="border-b border-slate-100">
      <div className="px-3 py-2">
        <div className="mb-2 flex items-center gap-2">
          <div className="w-28 shrink-0">
            <p className="text-[11px] font-semibold text-slate-700">Oksigenasi</p>
            <p className="text-[9px] text-slate-400">{fio2Low ? "Skor dari PaO₂" : "Skor dari A-aDO₂"}</p>
          </div>
          <ScoreChip score={oxy?.score ?? null}
            extra={oxy?.aado2 !== undefined ? `A-aDO₂ ${oxy.aado2}` : oxy?.ratio !== undefined ? `P/F ${oxy.ratio}` : undefined}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="mb-1 text-[9px] text-slate-400">FiO₂ (%)</p>
            <NumInput value={v.fio2} onChange={(x) => onChange({ fio2: x })} placeholder="40" min={21} max={100} />
          </div>
          <div>
            <p className="mb-1 text-[9px] text-slate-400">PaO₂ (mmHg)</p>
            <NumInput value={v.pao2} onChange={(x) => onChange({ pao2: x })} placeholder="80" min={0} max={600} />
          </div>
          {!fio2Low && (
            <div>
              <p className="mb-1 text-[9px] text-slate-400">PaCO₂ (mmHg)</p>
              <NumInput value={v.paco2} onChange={(x) => onChange({ paco2: x })} placeholder="40" min={10} max={100} />
            </div>
          )}
        </div>
        <p className="mt-1.5 text-[9px] text-slate-400">
          {fio2Low
            ? "FiO₂ <50% → PaO₂: >70=0 · 61–70=1 · 55–60=3 · <55=4"
            : "FiO₂ ≥50% → A-aDO₂ = (713×FiO₂/100)−(PaCO₂/0.8)−PaO₂ : <200=0 · 200–349=2 · 350–499=3 · ≥500=4"}
        </p>
      </div>
    </div>
  );
}

// ── Creatinine + AKI ───────────────────────────────────────

function CreatinineRow({ v, onChange }: { v: APACHEActualValues; onChange: (p: Partial<APACHEActualValues>) => void }) {
  const score = v.creatinine !== "" ? scoreAPACHECr(+v.creatinine, v.akiPresent) : null;
  return (
    <div className="border-b border-slate-100">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-28 shrink-0">
          <p className="text-[11px] font-semibold text-slate-700">Kreatinin</p>
          <p className="text-[9px] text-slate-400">mg/dL{v.akiPresent ? " × 2 (AKI)" : ""}</p>
        </div>
        <NumInput value={v.creatinine} onChange={(x) => onChange({ creatinine: x })} placeholder="1.0" min={0} max={20} step={0.1} />
        <ScoreChip score={score} extra={v.akiPresent && score !== null && score > 4 ? "(AKI×2)" : undefined} />
        <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[10px] text-slate-500">
          <input type="checkbox" checked={v.akiPresent} onChange={(e) => onChange({ akiPresent: e.target.checked })}
            className="h-3 w-3 rounded accent-rose-500" />
          AKI
        </label>
      </div>
      <p className="px-10 pb-1.5 text-[9px] text-slate-400">
        Tabel Knaus 1985 · skor dikali 2 bila AKI (maks 8) · 0.6–1.4=0 · 1.5–1.9=2 · 2.0–3.4=3 · ≥3.5=4 · &lt;0.6=2
      </p>
    </div>
  );
}

// ── GCS ────────────────────────────────────────────────────

function GCSRow({ v, onChange }: { v: APACHEActualValues; onChange: (p: Partial<APACHEActualValues>) => void }) {
  const contrib = v.gcs !== "" ? gcsContrib(+v.gcs) : null;
  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-28 shrink-0">
          <p className="text-[11px] font-semibold text-slate-700">GCS</p>
          <p className="text-[9px] text-slate-400">15 − GCS</p>
        </div>
        <NumInput value={v.gcs} onChange={(x) => onChange({ gcs: x })} placeholder="14" min={3} max={15} step={1} unit="/15" />
        <ScoreChip score={contrib} extra={contrib !== null ? `= 15 − ${v.gcs}` : undefined} />
      </div>
      <p className="px-10 pb-1.5 text-[9px] text-slate-400">
        GCS 15 = 0 poin · GCS 3 = 12 poin · range kontribusi: 0–12 (tidak dibatasi 4 seperti SOFA)
      </p>
    </div>
  );
}

// ── APACHE Breakdown ───────────────────────────────────────

function APACHEBreakdown({ v }: { v: APACHEActualValues }) {
  const result = calcAPACHEFromActual(v);
  const risk   = getAPACHERisk(result.total);
  const pct    = Math.min(result.mortalitas, 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="text-slate-500">APS</span>
        <span className="rounded-lg bg-sky-100 px-2 py-0.5 font-bold text-sky-700">{result.aps}</span>
        <span className="text-slate-400">+</span>
        <span className="text-slate-500">Usia</span>
        <span className="rounded-lg bg-indigo-100 px-2 py-0.5 font-bold text-indigo-700">{result.agePoints}</span>
        <span className="text-slate-400">+</span>
        <span className="text-slate-500">Kronik</span>
        <span className="rounded-lg bg-amber-100 px-2 py-0.5 font-bold text-amber-700">{v.chronicType}</span>
        <span className="text-slate-400">=</span>
        <div className="flex items-baseline gap-1">
          <motion.span key={result.total} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="text-2xl font-black tabular-nums text-slate-800">
            {result.total}
          </motion.span>
          <span className="text-xs text-slate-400">/71</span>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", risk.cls)}>{risk.label}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className={cn("h-full rounded-full", pct > 50 ? "bg-rose-400" : pct > 25 ? "bg-amber-400" : "bg-emerald-400")}
            animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="shrink-0 text-right">
          <motion.span key={result.mortalitas} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-base font-black tabular-nums text-slate-800">{result.mortalitas}%</motion.span>
          <p className="text-[9px] text-slate-400">est. mortalitas</p>
        </div>
      </div>
      <p className="mt-1.5 text-[9px] text-slate-400">
        ln(odds) = −3.517 + ({result.total} × 0.146). Estimasi populasi, bukan prediksi individual.
      </p>
    </div>
  );
}

// ── HistoryRow ─────────────────────────────────────────────

function APACHEHistoryRow({ entry }: { entry: APACHEEntry }) {
  const [open, setOpen] = useState(false);
  const risk = getAPACHERisk(entry.total);
  const a    = entry.actual;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50">
        <span className="w-[52px] shrink-0 text-[11px] font-semibold tabular-nums text-slate-500">
          {entry.tanggal.slice(5).replace("-", " / ")}
        </span>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", risk.cls)}>
          APACHE {entry.total}
        </span>
        <span className="truncate text-[10px] text-slate-400">APS {entry.aps} · Mortalitas {entry.mortalitas}%</span>
        <span className="ml-auto shrink-0 text-[10px] text-slate-400">
          {entry.inputBy.split(" ").slice(0, 2).join(" ")}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={13} className="text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            {a ? (
              <div className="border-t border-slate-100 p-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] sm:grid-cols-3">
                  <span className="text-slate-400">Suhu: <b className="text-slate-600">{a.temperature}°C</b></span>
                  <span className="text-slate-400">MAP: <b className="text-slate-600">{a.map} mmHg</b></span>
                  <span className="text-slate-400">Nadi: <b className="text-slate-600">{a.heartRate} bpm</b></span>
                  <span className="text-slate-400">RR: <b className="text-slate-600">{a.rr} x/mnt</b></span>
                  <span className="text-slate-400">pH: <b className="text-slate-600">{a.ph}</b></span>
                  <span className="text-slate-400">Na: <b className="text-slate-600">{a.sodium} mEq/L</b></span>
                  <span className="text-slate-400">K: <b className="text-slate-600">{a.potassium} mEq/L</b></span>
                  <span className="text-slate-400">FiO₂/PaO₂: <b className="text-slate-600">{a.fio2}% / {a.pao2} mmHg</b></span>
                  <span className="text-slate-400">Hkt: <b className="text-slate-600">{a.hematocrit}%</b></span>
                  <span className="text-slate-400">Leukosit: <b className="text-slate-600">{a.wbc} ×10³</b></span>
                  <span className="text-slate-400">Kreatinin: <b className="text-slate-600">{a.creatinine} mg/dL{a.akiPresent ? " (AKI)" : ""}</b></span>
                  <span className="text-slate-400">GCS: <b className="text-slate-600">{a.gcs}/15</b></span>
                  <span className="text-slate-400">Usia: <b className="text-slate-600">{a.age} tahun (+{entry.aps > 0 ? "—" : "0"})</b></span>
                  <span className="text-slate-400">Kronik: <b className="text-slate-600">+{a.chronicType} poin</b></span>
                </div>
              </div>
            ) : (
              <div className="border-t border-slate-100 p-3">
                <p className="text-[10px] text-slate-400">APS {entry.aps} · Total {entry.total} · Mortalitas {entry.mortalitas}%</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── APACHEPane ────────────────────────────────────────────

export interface APACHEPaneProps {
  history: APACHEEntry[];
  onSave:  (entry: APACHEEntry) => void;
}

export default function APACHEPane({ history, onSave }: APACHEPaneProps) {
  const [actual,  setActual]  = useState<APACHEActualValues>(emptyAPACHEActual());
  const [inputBy, setInputBy] = useState("");
  const [saved,   setSaved]   = useState(false);
  const [apsOpen, setApsOpen] = useState(true);

  const result    = calcAPACHEFromActual(actual);
  const todayDone = history.some(h => h.tanggal === TODAY);

  function patch(p: Partial<APACHEActualValues>) { setActual(v => ({ ...v, ...p })); setSaved(false); }

  function handleSave() {
    if (!inputBy.trim()) return;
    onSave({
      tanggal: TODAY, actual,
      aps: result.aps, total: result.total, mortalitas: result.mortalitas,
      inputBy: inputBy.trim(),
    });
    setSaved(true);
    setActual(emptyAPACHEActual());
  }

  const sorted = [...history].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">

        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">
            Input Nilai Aktual APACHE II — {TODAY.split("-").reverse().slice(0, 2).join(" / ")}
          </p>
          {todayDone && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle size={9} /> Sudah diisi hari ini
            </span>
          )}
        </div>

        {/* APS accordion */}
        <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <button onClick={() => setApsOpen(v => !v)}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-50">
            <span className="flex-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
              12 Parameter APS
            </span>
            <span className="rounded-lg bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700">
              {result.aps} poin
            </span>
            <motion.div animate={{ rotate: apsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} className="text-slate-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {apsOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                transition={{ duration: 0.25 }} className="overflow-hidden">
                <div className="border-t border-slate-100">
                  {STANDARD_PARAMS.map((p) => {
                    const rawVal = actual[p.key] as number | "";
                    return (
                      <ParamRow key={p.key}
                        label={p.label} unit={p.unit} hint={p.hint}
                        placeholder={p.placeholder} min={p.min} max={p.max} step={p.step}
                        value={rawVal}
                        onChange={(x) => patch({ [p.key]: x })}
                        score={rawVal !== "" ? p.scoreFn(rawVal) : null}
                      />
                    );
                  })}
                  <OxygenSection    v={actual} onChange={patch} />
                  <CreatinineRow    v={actual} onChange={patch} />
                  <GCSRow           v={actual} onChange={patch} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Usia */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Usia — {result.agePoints} poin
          </p>
          <div className="flex items-center gap-3">
            <NumInput value={actual.age} onChange={(x) => patch({ age: x })} placeholder="45" min={0} max={120} step={1} unit="tahun" />
            <AnimatePresence>
              {actual.age !== "" && (
                <motion.span key={result.agePoints} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                    result.agePoints === 0 ? "bg-emerald-100 text-emerald-700" :
                    result.agePoints <= 3  ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                  )}>
                  +{result.agePoints} poin
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-1.5 text-[9px] text-slate-400">&lt;44=0 · 45–54=+2 · 55–64=+3 · 65–74=+5 · ≥75=+6</p>
        </div>

        {/* Penyakit kronik */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Penyakit Kronik — {actual.chronicType} poin
          </p>
          <div className="flex flex-col gap-1.5">
            {CHRONIC_OPTIONS.map((opt) => (
              <motion.button key={opt.value} whileTap={{ scale: 0.98 }}
                onClick={() => patch({ chronicType: opt.value as ChronicPoints })}
                className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-all",
                  actual.chronicType === opt.value ? "bg-amber-50 ring-1 ring-amber-200" : "bg-slate-50 hover:bg-amber-50/50"
                )}>
                <div className={cn("h-3.5 w-3.5 shrink-0 rounded-full border-2 transition-colors",
                  actual.chronicType === opt.value ? "border-amber-500 bg-amber-500" : "border-slate-300 bg-white"
                )} />
                <div>
                  <p className="text-[11px] font-semibold text-slate-700">{opt.label} (+{opt.value})</p>
                  <p className="text-[10px] text-slate-400">{opt.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* APACHE breakdown */}
        <APACHEBreakdown v={actual} />

        {/* InputBy + Save */}
        <div className="mt-3 flex items-center gap-2">
          <input value={inputBy} onChange={e => { setInputBy(e.target.value); setSaved(false); }}
            placeholder="Input oleh (dr. / Ns.)"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleSave} disabled={!inputBy.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">
            Simpan APACHE II
          </motion.button>
          <AnimatePresence>
            {saved && (
              <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                <CheckCircle size={12} /> Tersimpan
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* History */}
      {sorted.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Riwayat APACHE II ({sorted.length} entri)
          </p>
          <div className="flex flex-col gap-2">
            {sorted.map(e => <APACHEHistoryRow key={e.tanggal} entry={e} />)}
          </div>
        </div>
      )}
    </div>
  );
}
