"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown, TrendingUp, Save, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PERSEN_OPTIONS, PERSEN_CFG, MONITORING_STATUS_CFG, MEAL_LABELS, MEAL_ICONS,
  calcDailyAvg, getMonitoringStatus, emptyDailyMonitoring,
  type DailyMonitoring, type MealEntry,
} from "./giziNutrisiShared";

// ── Helpers ───────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const DAYS   = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtShort(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const TODAY = "2026-05-15"; // consistent with mock reference date

// ── PersenSelector ─────────────────────────────────────────

function PersenSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {PERSEN_OPTIONS.map((p) => (
        <motion.button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          whileTap={{ scale: 0.93 }}
          className={cn(
            "flex-1 rounded-md py-1.5 text-[11px] font-bold ring-1 transition-all duration-150",
            value === p
              ? PERSEN_CFG[p].pill
              : "bg-white text-slate-300 ring-slate-200 hover:bg-slate-50 hover:text-slate-500",
          )}
        >
          {p}%
        </motion.button>
      ))}
    </div>
  );
}

// ── MealCard ───────────────────────────────────────────────

function MealCard({
  mealKey, entry, onChange,
}: {
  mealKey:  string;
  entry:    MealEntry;
  onChange: (e: MealEntry) => void;
}) {
  const cfg = PERSEN_CFG[entry.persen] ?? PERSEN_CFG[0];

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-slate-100 bg-white p-3.5 shadow-xs">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">{MEAL_ICONS[mealKey]}</span>
        <span className="text-xs font-semibold text-slate-600">{MEAL_LABELS[mealKey]}</span>
        <div className="ml-auto flex items-center gap-2">
          {/* Animated bar */}
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className={cn("h-full rounded-full", cfg.bar)}
              animate={{ width: `${entry.persen}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          {/* Badge */}
          <motion.span
            key={entry.persen}
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={cn("min-w-[38px] rounded-full px-2 py-0.5 text-center text-[10px] font-bold ring-1", cfg.pill)}
          >
            {entry.persen}%
          </motion.span>
        </div>
      </div>

      {/* % selector */}
      <PersenSelector value={entry.persen} onChange={(v) => onChange({ ...entry, persen: v })} />
    </div>
  );
}

// ── DaySummaryStrip ────────────────────────────────────────

function DaySummaryStrip({ avg }: { avg: number }) {
  const status = getMonitoringStatus(avg);
  const cfg    = MONITORING_STATUS_CFG[status];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
      <TrendingUp size={14} className="shrink-0 text-slate-400" />
      <span className="text-xs font-semibold text-slate-600">Rata-rata harian</span>

      {/* Progress bar */}
      <div className="flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className={cn("h-full rounded-full", PERSEN_CFG[Math.round(avg / 25) * 25]?.bar ?? "bg-slate-300")}
            animate={{ width: `${avg}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <motion.span
        key={avg}
        initial={{ scale: 0.85, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", cfg.cls)}
      >
        {avg}% — {cfg.label}
      </motion.span>
    </div>
  );
}

// ── HistoryRow ─────────────────────────────────────────────

function HistoryRow({ day }: { day: DailyMonitoring }) {
  const [open, setOpen] = useState(false);
  const avg    = calcDailyAvg(day);
  const status = getMonitoringStatus(avg);
  const cfg    = MONITORING_STATUS_CFG[status];
  const meals  = ["pagi", "siang", "malam"] as const;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50/60"
      >
        {/* Date */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-700">{fmtDate(day.tanggal)}</p>
          {day.inputBy && <p className="text-[10px] text-slate-400">{day.inputBy}</p>}
        </div>

        {/* Mini bar chart (desktop) */}
        <div className="hidden items-end gap-1 sm:flex">
          {meals.map((m) => (
            <div key={m} className="flex flex-col items-center gap-0.5">
              <div className="relative h-6 w-4 overflow-hidden rounded-sm bg-slate-100">
                <motion.div
                  className={cn("absolute bottom-0 w-full rounded-sm", PERSEN_CFG[day[m].persen]?.bar ?? "bg-slate-200")}
                  animate={{ height: `${day[m].persen}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              <span className="text-[8px] text-slate-400">{MEAL_LABELS[m][0]}</span>
            </div>
          ))}
        </div>

        {/* Avg badge */}
        <span className={cn("ml-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold", cfg.cls)}>
          {avg}%
        </span>

        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="text-slate-300"
        >
          <ChevronDown size={13} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 px-4 py-3">
              {meals.map((m) => (
                <div key={m} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2 text-center">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    {MEAL_ICONS[m]} {MEAL_LABELS[m]}
                  </p>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                    PERSEN_CFG[day[m].persen]?.pill ?? "bg-slate-100 text-slate-500",
                  )}>
                    {day[m].persen}%
                  </span>
                  {day[m].catatan && (
                    <p className="mt-1 text-[9px] italic text-slate-400">{day[m].catatan}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── WeekStrip ──────────────────────────────────────────────

function WeekStrip({
  selected, history, onSelect,
}: {
  selected: string;
  history:  DailyMonitoring[];
  onSelect: (iso: string) => void;
}) {
  const historyMap = Object.fromEntries(history.map((d) => [d.tanggal, d]));

  // Show last 7 days up to today
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(TODAY + "T00:00:00");
    d.setDate(d.getDate() - (6 - i));
    return isoDate(d);
  });

  return (
    <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xs">
      {days.map((iso) => {
        const day    = historyMap[iso];
        const avg    = day ? calcDailyAvg(day) : null;
        const status = avg !== null ? getMonitoringStatus(avg) : null;
        const isSelected = iso === selected;
        const isToday    = iso === TODAY;

        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelect(iso)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-center transition-all",
              isSelected
                ? "bg-indigo-600 text-white shadow-sm"
                : "hover:bg-slate-50 text-slate-500",
            )}
          >
            <span className={cn("text-[9px] font-bold uppercase", isSelected ? "text-indigo-200" : "text-slate-400")}>
              {DAYS[new Date(iso + "T00:00:00").getDay()].slice(0, 3)}
            </span>
            <span className={cn("text-[11px] font-bold", isSelected ? "text-white" : "text-slate-700")}>
              {new Date(iso + "T00:00:00").getDate()}
            </span>
            {/* Dot indicator */}
            <div className={cn(
              "h-1.5 w-1.5 rounded-full",
              avg === null       ? (isSelected ? "bg-indigo-400" : "bg-slate-200")
              : status === "baik"   ? "bg-emerald-400"
              : status === "kurang" ? "bg-amber-400"
              : "bg-rose-400",
            )} />
            {isToday && !isSelected && (
              <span className="text-[8px] font-bold text-sky-500">Hari ini</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────

interface Props {
  history: DailyMonitoring[];
  onSave:  (day: DailyMonitoring) => void;
}

export default function MonitoringPane({ history, onSave }: Props) {
  const [selectedDate, setSelectedDate] = useState(TODAY);

  const existing = history.find((d) => d.tanggal === selectedDate);
  const [entry,  setEntry]  = useState<DailyMonitoring>(existing ?? emptyDailyMonitoring(selectedDate));
  const [saved,  setSaved]  = useState(!!existing);

  function goDate(iso: string) {
    if (iso > TODAY) return;
    setSelectedDate(iso);
    const found = history.find((d) => d.tanggal === iso);
    setEntry(found ?? emptyDailyMonitoring(iso));
    setSaved(!!found);
  }

  function prev() {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    goDate(isoDate(d));
  }

  function next() {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    goDate(isoDate(d));
  }

  function setMeal(key: "pagi" | "siang" | "malam", val: MealEntry) {
    setEntry((p) => ({ ...p, [key]: val }));
    setSaved(false);
  }

  function handleSave() {
    const day = { ...entry, tanggal: selectedDate };
    onSave(day);
    setSaved(true);
  }

  const avg      = calcDailyAvg(entry);
  const isToday  = selectedDate === TODAY;
  const pastDays = history
    .filter((d) => d.tanggal !== selectedDate)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  return (
    <div className="flex flex-col gap-3">

      {/* Week strip */}
      <WeekStrip selected={selectedDate} history={history} onSelect={goDate} />

      {/* Date nav header */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xs">
        <button
          type="button"
          onClick={prev}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="flex flex-1 items-center justify-center gap-2">
          <CalendarDays size={12} className="text-slate-400" />
          <p className="text-xs font-semibold text-slate-700">{fmtDate(selectedDate)}</p>
          {isToday && (
            <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-600">
              Hari ini
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={next}
          disabled={isToday}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Meal cards */}
      <div className="flex flex-col gap-2">
        {(["pagi", "siang", "malam"] as const).map((m, i) => (
          <motion.div
            key={`${selectedDate}-${m}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
          >
            <MealCard
              mealKey={m}
              entry={entry[m]}
              onChange={(v) => setMeal(m, v)}
            />
          </motion.div>
        ))}
      </div>

      {/* Daily summary */}
      <DaySummaryStrip avg={avg} />

      {/* Save footer */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs">
        <input
          value={entry.inputBy}
          onChange={(e) => { setEntry((p) => ({ ...p, inputBy: e.target.value })); setSaved(false); }}
          placeholder="Nama perawat / PPA..."
          className="h-7 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-slate-700 placeholder:text-slate-400 outline-none focus:border-slate-300"
        />
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-[10px] font-semibold text-emerald-600"
            >
              ✓ Tersimpan
            </motion.span>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-indigo-700"
        >
          <Save size={11} /> Simpan
        </button>
      </div>

      {/* History */}
      {pastDays.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Riwayat Asupan
          </p>
          <AnimatePresence initial={false}>
            {pastDays.map((d, i) => (
              <motion.div
                key={d.tanggal}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ delay: i * 0.04 }}
              >
                <HistoryRow day={d} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
