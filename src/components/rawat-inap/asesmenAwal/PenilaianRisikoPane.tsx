"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BARTHEL_ITEMS, MORSE_ITEMS, BRADEN_ITEMS,
  BARTHEL_MAX, MORSE_MAX, BRADEN_MAX,
  barthelInterpretation, morseInterpretation, bradenInterpretation,
  type ScoringItemDef, type ScoreOption,
} from "./asesmenAwalShared";

// ── Helpers ───────────────────────────────────────────────

type ScoreMap = Record<string, number | null>;
type ScaleId  = "barthel" | "morse" | "braden";

function sumScores(map: ScoreMap): number {
  return Object.values(map).reduce<number>((s, v) => s + (v ?? 0), 0);
}
function allFilled(items: ScoringItemDef[], map: ScoreMap): boolean {
  return items.every(i => map[i.key] !== null && map[i.key] !== undefined);
}
function makeEmptyMap(items: ScoringItemDef[]): ScoreMap {
  return Object.fromEntries(items.map(i => [i.key, null]));
}

// ── Scale config ──────────────────────────────────────────

interface ScaleConfig {
  id: ScaleId;
  title: string;
  standard: string;
  items: ScoringItemDef[];
  max: number;
  inverse?: boolean;
  color: "sky" | "amber" | "violet";
}

const SCALES: ScaleConfig[] = [
  { id: "barthel", title: "ADL Barthel", standard: "AP 1.4",   items: BARTHEL_ITEMS, max: BARTHEL_MAX, color: "sky"    },
  { id: "morse",   title: "Morse Fall",  standard: "AP 1.5",   items: MORSE_ITEMS,   max: MORSE_MAX,   color: "amber"  },
  { id: "braden",  title: "Braden",      standard: "SNARS PP", items: BRADEN_ITEMS,  max: BRADEN_MAX,  color: "violet", inverse: true },
];

const C = {
  sky:    { activeTab: "bg-sky-600 text-white shadow-md shadow-sky-100",    inactiveTab: "bg-white border-slate-200 text-slate-600 hover:bg-sky-50/70",    chip: "bg-sky-600 text-white border-sky-600",    chipOff: "bg-white border-slate-200 text-slate-600 hover:border-sky-300 hover:bg-sky-50/60",    bar: "bg-sky-400"    },
  amber:  { activeTab: "bg-amber-500 text-white shadow-md shadow-amber-100", inactiveTab: "bg-white border-slate-200 text-slate-600 hover:bg-amber-50/70",  chip: "bg-amber-500 text-white border-amber-500", chipOff: "bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50/60", bar: "bg-amber-400"  },
  violet: { activeTab: "bg-violet-600 text-white shadow-md shadow-violet-100", inactiveTab: "bg-white border-slate-200 text-slate-600 hover:bg-violet-50/70", chip: "bg-violet-600 text-white border-violet-600", chipOff: "bg-white border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50/60", bar: "bg-violet-400" },
} as const;

// ── Score chip ────────────────────────────────────────────

function ScoreChip({
  option, selected, onClick, color,
}: { option: ScoreOption; selected: boolean; onClick: () => void; color: keyof typeof C }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all duration-150",
        selected ? C[color].chip : C[color].chipOff,
      )}
    >
      <span className={cn(
        "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-black",
        selected ? "bg-white/20" : "bg-slate-100 text-slate-500",
      )}>
        {option.score}
      </span>
      <span className="text-xs font-medium leading-tight">{option.label}</span>
    </button>
  );
}

// ── Scoring item row ──────────────────────────────────────

function ScoreItem({
  item, value, onChange, color,
}: { item: ScoringItemDef; value: number | null; onChange: (v: number) => void; color: keyof typeof C }) {
  const filled   = value !== null && value !== undefined;
  const selected = item.options.find(o => o.score === value);

  return (
    <div className={cn(
      "rounded-lg border p-3 transition-colors duration-150",
      filled ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50/40",
    )}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold leading-tight text-slate-700">{item.label}</p>
        <span className={cn(
          "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold transition",
          filled ? C[color].chip + " opacity-90" : "bg-slate-100 text-slate-400",
        )}>
          {filled ? value : "—"}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {item.options.map(opt => (
          <ScoreChip
            key={opt.score}
            option={opt}
            selected={value === opt.score}
            onClick={() => onChange(opt.score)}
            color={color}
          />
        ))}
      </div>

      <AnimatePresence>
        {selected?.detail && (
          <motion.p
            key={selected.score}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 6 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden text-[10px] leading-relaxed text-slate-400"
          >
            {selected.detail}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Scale tab button ──────────────────────────────────────

function ScaleTab({
  scale, scores, active, onClick,
}: { scale: ScaleConfig; scores: ScoreMap; active: boolean; onClick: () => void }) {
  const done   = allFilled(scale.items, scores);
  const filled = scale.items.filter(i => scores[i.key] !== null && scores[i.key] !== undefined).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex-1 rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
        active ? C[scale.color].activeTab : C[scale.color].inactiveTab,
      )}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        {done && (
          <CheckCircle2 size={11} className={active ? "text-white/80" : "text-emerald-500"} />
        )}
        <span className={cn("text-xs font-bold", active ? "text-white" : "text-slate-700")}>
          {scale.title}
        </span>
      </div>
      <p className={cn("text-[10px]", active ? "text-white/70" : "text-slate-400")}>
        {done ? "Selesai" : `${filled}/${scale.items.length} item`}
      </p>
      <span className={cn(
        "absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold",
        active ? "bg-white/20 text-white/90" : "bg-slate-100 text-slate-500",
      )}>
        {scale.standard}
      </span>
    </button>
  );
}

// ── Scale content ─────────────────────────────────────────

function ScaleContent({
  scale, scores, onScoreChange,
}: { scale: ScaleConfig; scores: ScoreMap; onScoreChange: (key: string, val: number) => void }) {
  const total      = sumScores(scores);
  const isComplete = allFilled(scale.items, scores);
  const filled     = scale.items.filter(i => scores[i.key] !== null && scores[i.key] !== undefined).length;

  const interpretation = isComplete
    ? scale.id === "barthel" ? barthelInterpretation(total)
    : scale.id === "morse"   ? morseInterpretation(total)
    : bradenInterpretation(total)
    : null;

  return (
    <div className="flex flex-col gap-2">

      {/* Per-scale progress bar */}
      {!isComplete && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <div className="flex-1 overflow-hidden rounded-full bg-slate-200" style={{ height: 4 }}>
            <motion.div
              className={cn("h-full rounded-full", C[scale.color].bar)}
              animate={{ width: `${(filled / scale.items.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-[10px] font-bold tabular-nums text-slate-500">
            {filled}/{scale.items.length}
          </span>
        </div>
      )}

      {/* Items */}
      {scale.items.map(item => (
        <ScoreItem
          key={item.key}
          item={item}
          value={scores[item.key] ?? null}
          onChange={v => onScoreChange(item.key, v)}
          color={scale.color}
        />
      ))}

      {/* Interpretation result */}
      <AnimatePresence>
        {isComplete && interpretation && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("rounded-xl border p-4", interpretation.cls)}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">{interpretation.label}</p>
              <span className="font-mono text-lg font-black">{total}</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed opacity-80">{interpretation.action}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          className="rounded-lg bg-slate-700 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-slate-800"
        >
          Simpan Penilaian
        </button>
      </div>
    </div>
  );
}

// ── Summary strip ─────────────────────────────────────────

function SummaryStrip({
  barthelScores, morseScores, bradenScores,
}: { barthelScores: ScoreMap; morseScores: ScoreMap; bradenScores: ScoreMap }) {
  const items = [
    {
      label: "ADL Barthel", color: "sky" as const,
      done: allFilled(BARTHEL_ITEMS, barthelScores), total: sumScores(barthelScores), max: BARTHEL_MAX,
      interp: allFilled(BARTHEL_ITEMS, barthelScores) ? barthelInterpretation(sumScores(barthelScores)).label : "—",
    },
    {
      label: "Morse Fall", color: "amber" as const,
      done: allFilled(MORSE_ITEMS, morseScores), total: sumScores(morseScores), max: MORSE_MAX,
      interp: allFilled(MORSE_ITEMS, morseScores) ? morseInterpretation(sumScores(morseScores)).label : "—",
    },
    {
      label: "Braden", color: "violet" as const,
      done: allFilled(BRADEN_ITEMS, bradenScores), total: sumScores(bradenScores), max: BRADEN_MAX,
      interp: allFilled(BRADEN_ITEMS, bradenScores) ? bradenInterpretation(sumScores(bradenScores)).label : "—",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map(item => (
        <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
          <p className={cn("text-2xl font-black tabular-nums", item.done ? "text-slate-800" : "text-slate-300")}>
            {item.done ? item.total : "—"}
          </p>
          <p className={cn("mt-1 text-[11px] font-semibold", item.done ? "text-slate-600" : "text-slate-300")}>
            {item.interp}
          </p>
          {item.done && (
            <div className="mt-2 overflow-hidden rounded-full bg-slate-100" style={{ height: 4 }}>
              <div
                className={cn("h-full rounded-full", C[item.color].bar)}
                style={{ width: `${(item.total / item.max) * 100}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────

interface PenilaianRisikoPaneProps {
  onComplete?: (done: boolean) => void;
}

// ── Main component ────────────────────────────────────────

export default function PenilaianRisikoPane({ onComplete }: PenilaianRisikoPaneProps) {
  const [activeScale, setActiveScale] = useState<ScaleId>("barthel");
  const [prevScale,   setPrevScale]   = useState<ScaleId>("barthel");

  const [barthelScores, setBarthelScores] = useState<ScoreMap>(makeEmptyMap(BARTHEL_ITEMS));
  const [morseScores,   setMorseScores]   = useState<ScoreMap>(makeEmptyMap(MORSE_ITEMS));
  const [bradenScores,  setBradenScores]  = useState<ScoreMap>(makeEmptyMap(BRADEN_ITEMS));

  const scoresMap  = { barthel: barthelScores, morse: morseScores, braden: bradenScores };
  const settersMap = { barthel: setBarthelScores, morse: setMorseScores, braden: setBradenScores };

  function handleScoreChange(scaleId: ScaleId, key: string, val: number) {
    const items  = SCALES.find(s => s.id === scaleId)!.items;
    const others = SCALES.filter(s => s.id !== scaleId);

    settersMap[scaleId](prev => {
      const updated = { ...prev, [key]: val };
      const done = allFilled(items, updated) && others.every(s => allFilled(s.items, scoresMap[s.id]));
      onComplete?.(done);
      return updated;
    });
  }

  function navigateScale(id: ScaleId) {
    setPrevScale(activeScale);
    setActiveScale(id);
  }

  const activeIdx = SCALES.findIndex(s => s.id === activeScale);
  const prevIdx   = SCALES.findIndex(s => s.id === prevScale);
  const direction = activeIdx >= prevIdx ? 1 : -1;

  return (
    <div className="flex flex-col gap-4">

      {/* Summary strip */}
      <SummaryStrip
        barthelScores={barthelScores}
        morseScores={morseScores}
        bradenScores={bradenScores}
      />

      {/* Scale tabs */}
      <div className="flex gap-2">
        {SCALES.map(scale => (
          <ScaleTab
            key={scale.id}
            scale={scale}
            scores={scoresMap[scale.id]}
            active={activeScale === scale.id}
            onClick={() => navigateScale(scale.id)}
          />
        ))}
      </div>

      {/* Active scale content — direction-aware transition */}
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={activeScale}
          custom={direction}
          variants={{
            enter:  (d: number) => ({ opacity: 0, x: d * 20 }),
            center: { opacity: 1, x: 0 },
            exit:   (d: number) => ({ opacity: 0, x: d * -16 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <ScaleContent
            scale={SCALES.find(s => s.id === activeScale)!}
            scores={scoresMap[activeScale]}
            onScoreChange={(key, val) => handleScoreChange(activeScale, key, val)}
          />
        </motion.div>
      </AnimatePresence>

      {/* Clinical note */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-[11px] text-slate-500">
          <span className="font-semibold">Catatan:</span> Braden Scale bersifat terbalik — skor lebih rendah menunjukkan risiko dekubitus lebih tinggi.
          Semua penilaian wajib diselesaikan dalam 24 jam pertama setelah masuk rawat inap (SNARS AP 1).
        </p>
      </div>

    </div>
  );
}
