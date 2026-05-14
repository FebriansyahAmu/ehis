"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Droplets, Zap, HeartPulse, Brain, Droplet, ChevronDown, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SOFA_PARAMS, SCORE_CLR, SOFA_RISK, calcSOFAFromActual, calcSOFATotal,
  getSOFARisk, emptySOFAActual, scoreSOFAResirasi,
  type Score04, type SOFAActualValues, type SOFAEntry, type VasopressorType,
} from "./icuScoringShared";

const TODAY = "2026-05-15";

// ── Shared primitives ──────────────────────────────────────

const PARAM_CFG = {
  respirasi:      { Icon: Wind,       bg: "bg-sky-50",    text: "text-sky-500"    },
  koagulasi:      { Icon: Droplets,   bg: "bg-red-50",    text: "text-red-400"    },
  liver:          { Icon: Zap,        bg: "bg-amber-50",  text: "text-amber-500"  },
  kardiovaskular: { Icon: HeartPulse, bg: "bg-rose-50",   text: "text-rose-500"   },
  neurologi:      { Icon: Brain,      bg: "bg-indigo-50", text: "text-indigo-500" },
  renal:          { Icon: Droplet,    bg: "bg-teal-50",   text: "text-teal-500"   },
} as const;

const VASOPRESSOR_OPTIONS: { value: VasopressorType; label: string }[] = [
  { value: "none",          label: "Tidak ada"      },
  { value: "dobutamine",    label: "Dobutamin"      },
  { value: "dopamine",      label: "Dopamin"        },
  { value: "epinephrine",   label: "Epinefrin"      },
  { value: "norepinephrine",label: "Norepinefrin"   },
];

function NumInput({
  value, onChange, placeholder, min, max, step, unit,
}: {
  value: number | ""; onChange: (v: number | "") => void;
  placeholder: string; min?: number; max?: number; step?: number; unit?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number" min={min} max={max} step={step ?? "any"}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        placeholder={placeholder}
        className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 tabular-nums outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
      {unit && <span className="text-[10px] text-slate-400">{unit}</span>}
    </div>
  );
}

function ScoreBadge({ score, level }: { score: Score04 | null; level?: string }) {
  if (score === null) return <span className="text-[10px] text-slate-300">–</span>;
  return (
    <div className="flex items-center gap-1.5">
      <motion.span
        key={score}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", SCORE_CLR[score].pill)}
      >
        {score}
      </motion.span>
      {level && <span className="text-[10px] text-slate-400">{level}</span>}
    </div>
  );
}

function OrganCard({ id, score, children }: { id: keyof typeof PARAM_CFG; score: Score04 | null; children: React.ReactNode }) {
  const cfg  = PARAM_CFG[id];
  const risk = score !== null ? SOFA_PARAMS.find(p => p.id === id)?.levels[score] : undefined;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", cfg.bg)}>
          <cfg.Icon size={12} className={cfg.text} aria-hidden />
        </div>
        <span className="flex-1 text-[11px] font-semibold text-slate-700">
          {SOFA_PARAMS.find(p => p.id === id)?.label}
        </span>
        <ScoreBadge score={score} level={risk} />
      </div>
      {children}
    </div>
  );
}

// ── Organ input cards ──────────────────────────────────────

function ResirasiCard({ v, onChange }: { v: SOFAActualValues; onChange: (patch: Partial<SOFAActualValues>) => void }) {
  const hasValues = v.pao2 !== "" && v.fio2 !== "";
  const ratio     = hasValues ? Math.round(+v.pao2 / (+v.fio2 / 100)) : null;
  const score     = hasValues ? scoreSOFAResirasi(+v.pao2, +v.fio2, v.onVentilator) : null;

  return (
    <OrganCard id="respirasi" score={score}>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-[9px] text-slate-400">PaO₂</p>
          <NumInput value={v.pao2} onChange={(x) => onChange({ pao2: x })} placeholder="ex: 80" unit="mmHg" min={0} max={600} />
        </div>
        <div>
          <p className="mb-1 text-[9px] text-slate-400">FiO₂</p>
          <NumInput value={v.fio2} onChange={(x) => onChange({ fio2: x })} placeholder="ex: 40" unit="%" min={21} max={100} />
        </div>
      </div>
      {ratio !== null && (
        <p className="text-[10px] text-slate-500">
          PaO₂/FiO₂ ratio = <span className="font-semibold tabular-nums">{ratio}</span>
        </p>
      )}
      <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-600">
        <input
          type="checkbox" checked={v.onVentilator}
          onChange={(e) => onChange({ onVentilator: e.target.checked })}
          className="h-3.5 w-3.5 rounded border-slate-300 accent-sky-600"
        />
        Ventilasi mekanik / NIV
      </label>
    </OrganCard>
  );
}

function KoagulasiCard({ v, onChange }: { v: SOFAActualValues; onChange: (patch: Partial<SOFAActualValues>) => void }) {
  const score = v.platelet !== "" ? (v.platelet >= 150 ? 0 : v.platelet >= 100 ? 1 : v.platelet >= 50 ? 2 : v.platelet >= 20 ? 3 : 4) as Score04 : null;
  return (
    <OrganCard id="koagulasi" score={score}>
      <div>
        <p className="mb-1 text-[9px] text-slate-400">Trombosit</p>
        <NumInput value={v.platelet} onChange={(x) => onChange({ platelet: x })} placeholder="ex: 142" unit="×10³/µL" min={0} max={1000} />
      </div>
    </OrganCard>
  );
}

function LiverCard({ v, onChange }: { v: SOFAActualValues; onChange: (patch: Partial<SOFAActualValues>) => void }) {
  const bili  = v.bilirubin;
  const score = bili !== "" ? (bili < 1.2 ? 0 : bili < 2.0 ? 1 : bili < 6.0 ? 2 : bili < 12.0 ? 3 : 4) as Score04 : null;
  return (
    <OrganCard id="liver" score={score}>
      <div>
        <p className="mb-1 text-[9px] text-slate-400">Bilirubin total</p>
        <NumInput value={v.bilirubin} onChange={(x) => onChange({ bilirubin: x })} placeholder="ex: 1.8" unit="mg/dL" min={0} max={50} step={0.1} />
      </div>
    </OrganCard>
  );
}

function KardiovaskularCard({ v, onChange }: { v: SOFAActualValues; onChange: (patch: Partial<SOFAActualValues>) => void }) {
  const showDose  = v.vasopressor !== "none" && v.vasopressor !== "dobutamine";
  const mapOk     = v.map !== "";
  let score: Score04 | null = null;
  if (mapOk) {
    const dose = v.vasopressorDose !== "" ? +v.vasopressorDose : 0;
    score = v.vasopressor === "none"
      ? (+v.map >= 70 ? 0 : 1)
      : v.vasopressor === "dobutamine" ? 2
      : v.vasopressor === "dopamine"
        ? (dose <= 5 ? 2 : dose <= 15 ? 3 : 4)
        : (dose <= 0.1 ? 3 : 4) as Score04;
  }

  return (
    <OrganCard id="kardiovaskular" score={score}>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-[9px] text-slate-400">MAP</p>
          <NumInput value={v.map} onChange={(x) => onChange({ map: x })} placeholder="ex: 68" unit="mmHg" min={0} max={200} />
        </div>
        <div>
          <p className="mb-1 text-[9px] text-slate-400">Vasopresor</p>
          <select
            value={v.vasopressor}
            onChange={(e) => onChange({ vasopressor: e.target.value as VasopressorType, vasopressorDose: "" })}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-400"
          >
            {VASOPRESSOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <AnimatePresence>
        {showDose && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="mb-1 text-[9px] text-slate-400">Dosis {v.vasopressor === "dopamine" ? "(µg/kg/min)" : "(µg/kg/min)"}</p>
            <NumInput
              value={v.vasopressorDose}
              onChange={(x) => onChange({ vasopressorDose: x })}
              placeholder={v.vasopressor === "dopamine" ? "ex: 8" : "ex: 0.12"}
              unit="µg/kg/min" min={0} max={50} step={0.01}
            />
            {v.vasopressor !== "dopamine" && (
              <p className="mt-1 text-[9px] text-slate-400">≤0.1 → skor 3 · &gt;0.1 → skor 4</p>
            )}
            {v.vasopressor === "dopamine" && (
              <p className="mt-1 text-[9px] text-slate-400">≤5 → skor 2 · ≤15 → skor 3 · &gt;15 → skor 4</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {v.vasopressor === "dobutamine" && (
        <p className="text-[9px] text-slate-400">Dobutamin dosis apapun → skor 2</p>
      )}
    </OrganCard>
  );
}

function NeurologiCard({ v, onChange }: { v: SOFAActualValues; onChange: (patch: Partial<SOFAActualValues>) => void }) {
  const gcs   = v.gcs;
  const score = gcs !== "" ? (gcs === 15 ? 0 : gcs >= 13 ? 1 : gcs >= 10 ? 2 : gcs >= 6 ? 3 : 4) as Score04 : null;
  return (
    <OrganCard id="neurologi" score={score}>
      <div>
        <p className="mb-1 text-[9px] text-slate-400">GCS total (E+V+M)</p>
        <NumInput value={v.gcs} onChange={(x) => onChange({ gcs: x })} placeholder="ex: 13" unit="/15" min={3} max={15} step={1} />
      </div>
      {gcs !== "" && <p className="text-[9px] text-slate-400">GCS 15=0 · 13–14=1 · 10–12=2 · 6–9=3 · &lt;6=4</p>}
    </OrganCard>
  );
}

function RenalCard({ v, onChange }: { v: SOFAActualValues; onChange: (patch: Partial<SOFAActualValues>) => void }) {
  const cr   = v.creatinine;
  let score: Score04 | null = null;
  if (cr !== "") {
    let crS: Score04 = cr >= 5.0 ? 4 : cr >= 3.5 ? 3 : cr >= 2.0 ? 2 : cr >= 1.2 ? 1 : 0;
    if (v.urineOutput !== "") {
      const uo = +v.urineOutput;
      const uoS: Score04 = uo < 200 ? 4 : uo < 500 ? 3 : 0;
      crS = Math.max(crS, uoS) as Score04;
    }
    score = crS;
  }
  return (
    <OrganCard id="renal" score={score}>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-[9px] text-slate-400">Kreatinin</p>
          <NumInput value={v.creatinine} onChange={(x) => onChange({ creatinine: x })} placeholder="ex: 2.4" unit="mg/dL" min={0} max={20} step={0.1} />
        </div>
        <div>
          <p className="mb-1 text-[9px] text-slate-400">Urine Output (opt.)</p>
          <NumInput value={v.urineOutput} onChange={(x) => onChange({ urineOutput: x })} placeholder="ex: 450" unit="mL/24j" min={0} max={5000} />
        </div>
      </div>
      <p className="text-[9px] text-slate-400">Skor tertinggi antara kreatinin dan UO yang dipakai</p>
    </OrganCard>
  );
}

// ── SOFATotalCard ─────────────────────────────────────────

function SOFATotalCard({ scores }: { scores: ReturnType<typeof calcSOFAFromActual> }) {
  const total = calcSOFATotal(scores);
  const risk  = getSOFARisk(total);
  const pct   = Math.round((total / 24) * 100);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center gap-4">
        <div className="flex items-baseline gap-1">
          <motion.span key={total} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="text-4xl font-black tabular-nums text-slate-800">
            {total}
          </motion.span>
          <span className="text-base font-medium text-slate-400">/24</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className={cn("w-fit rounded-full px-2.5 py-0.5 text-xs font-bold", risk.cls)}>{risk.label}</span>
          <p className="text-[10px] text-slate-400">Est. mortalitas <span className="font-semibold text-slate-600">{risk.mort}</span></p>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div className={cn("h-full rounded-full", risk.bar)}
          animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
      </div>
      <div className="mt-2.5 grid grid-cols-6 gap-1">
        {SOFA_PARAMS.map((p) => (
          <div key={p.id} className="flex flex-col items-center gap-0.5 rounded-lg bg-slate-50 p-1.5">
            <span className="text-[8px] text-slate-400">{p.label.slice(0, 5)}</span>
            <span className={cn("rounded px-1 py-0.5 text-[10px] font-bold", SCORE_CLR[scores[p.id]].pill)}>
              {scores[p.id]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HistoryRow ─────────────────────────────────────────────

function HistoryRow({ entry }: { entry: SOFAEntry }) {
  const [open, setOpen] = useState(false);
  const risk = getSOFARisk(entry.total);
  const a    = entry.actual;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50">
        <span className="w-[52px] shrink-0 text-[11px] font-semibold tabular-nums text-slate-500">
          {entry.tanggal.slice(5).replace("-", " / ")}
        </span>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", risk.cls)}>SOFA {entry.total}</span>
        <span className="truncate text-[10px] text-slate-400">{risk.label} · {risk.mort}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="ml-auto shrink-0">
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
                  <span className="text-slate-400">PaO₂/FiO₂: <b className="text-slate-600">{a.pao2}/{a.fio2}% {a.onVentilator ? "(vent)" : ""}</b></span>
                  <span className="text-slate-400">Trombosit: <b className="text-slate-600">{a.platelet} ×10³/µL</b></span>
                  <span className="text-slate-400">Bilirubin: <b className="text-slate-600">{a.bilirubin} mg/dL</b></span>
                  <span className="text-slate-400">MAP: <b className="text-slate-600">{a.map} mmHg · {a.vasopressor !== "none" ? `${a.vasopressor} ${a.vasopressorDose} µg/kg/min` : "tanpa vasopresor"}</b></span>
                  <span className="text-slate-400">GCS: <b className="text-slate-600">{a.gcs}/15</b></span>
                  <span className="text-slate-400">Kreatinin: <b className="text-slate-600">{a.creatinine} mg/dL {a.urineOutput !== "" ? `· UO ${a.urineOutput} mL` : ""}</b></span>
                </div>
                {entry.catatan && <p className="mt-2 text-[10px] italic text-slate-400">{entry.catatan}</p>}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 border-t border-slate-100 p-3 sm:grid-cols-6">
                {SOFA_PARAMS.map(p => (
                  <div key={p.id} className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 py-1.5 px-1">
                    <span className="text-[9px] text-slate-400">{p.label}</span>
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-bold", SCORE_CLR[entry.scores[p.id]].pill)}>
                      {entry.scores[p.id]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SOFAPane ──────────────────────────────────────────────

export interface SOFAPaneProps { history: SOFAEntry[]; onSave: (e: SOFAEntry) => void }

export default function SOFAPane({ history, onSave }: SOFAPaneProps) {
  const [actual,  setActual]  = useState<SOFAActualValues>(emptySOFAActual());
  const [inputBy, setInputBy] = useState("");
  const [catatan, setCatatan] = useState("");
  const [saved,   setSaved]   = useState(false);

  const scores    = calcSOFAFromActual(actual);
  const total     = calcSOFATotal(scores);
  const todayDone = history.some(h => h.tanggal === TODAY);

  function patch(p: Partial<SOFAActualValues>) { setActual(v => ({ ...v, ...p })); setSaved(false); }

  function handleSave() {
    if (!inputBy.trim()) return;
    onSave({ tanggal: TODAY, scores, actual, total, inputBy: inputBy.trim(), catatan: catatan.trim() || undefined });
    setSaved(true);
    setActual(emptySOFAActual());
    setCatatan("");
  }

  const sorted = [...history].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">Input Nilai Aktual SOFA — {TODAY.split("-").reverse().slice(0,2).join(" / ")}</p>
          {todayDone && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle size={9} /> Sudah diisi hari ini
            </span>
          )}
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <ResirasiCard      v={actual} onChange={patch} />
          <KoagulasiCard     v={actual} onChange={patch} />
          <LiverCard         v={actual} onChange={patch} />
          <KardiovaskularCard v={actual} onChange={patch} />
          <NeurologiCard     v={actual} onChange={patch} />
          <RenalCard         v={actual} onChange={patch} />
        </div>

        <SOFATotalCard scores={scores} />

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input value={inputBy} onChange={e => { setInputBy(e.target.value); setSaved(false); }}
            placeholder="Input oleh (dr. / Ns.)"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
          <input value={catatan} onChange={e => setCatatan(e.target.value)}
            placeholder="Catatan klinis (opsional)"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleSave} disabled={!inputBy.trim()}
            className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40">
            Simpan SOFA
          </motion.button>
          <AnimatePresence>
            {saved && (
              <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                <CheckCircle size={12} /> Tersimpan
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {sorted.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Riwayat SOFA ({sorted.length} hari)</p>
          <div className="flex flex-col gap-2">
            {sorted.map(e => <HistoryRow key={e.tanggal} entry={e} />)}
          </div>
        </div>
      )}
    </div>
  );
}
