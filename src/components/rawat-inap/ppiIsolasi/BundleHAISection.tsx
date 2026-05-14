"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ToggleLeft, ToggleRight, CheckSquare, Square,
  ChevronDown, ChevronRight, ClipboardCheck, User, Clock,
  CheckCircle2, AlertCircle, Save, Activity, MoveDown, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BUNDLE_CFG, BUNDLE_ORDER, BUNDLE_HISTORY_MOCK, SHIFT_ORDER, SHIFT_CFG,
  initChecks, completionPct, fmtTgl, todayISO, currentShift,
  type BundleTipe, type DailyRecord, type Shift,
} from "./ppiIsolasiShared";

// ── Helpers ────────────────────────────────────────────────

type GroupedDay = { tanggal: string; shifts: Partial<Record<Shift, DailyRecord>> };

function groupByDate(records: DailyRecord[]): GroupedDay[] {
  const map = new Map<string, Partial<Record<Shift, DailyRecord>>>();
  for (const r of records) {
    if (!map.has(r.tanggal)) map.set(r.tanggal, {});
    map.get(r.tanggal)![r.shift] = r;
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tanggal, shifts]) => ({ tanggal, shifts }));
}

function pctColor(pct: number) {
  return pct === 100 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : pct > 0 ? "bg-orange-400" : "bg-slate-200";
}

// ── Types ─────────────────────────────────────────────────

interface BundleSummaryState {
  enabled:      boolean;
  shiftRecords: Partial<Record<Shift, DailyRecord>>;
  livePct:      number;
  activeShift:  Shift;
}

// ── Summary Card ──────────────────────────────────────────

function SummaryCard({
  states,
  onFocus,
}: {
  states:  Record<BundleTipe, BundleSummaryState>;
  onFocus: (tipe: BundleTipe) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
        <Activity size={13} className="text-indigo-500" />
        <p className="text-xs font-bold text-slate-700">Rekapitulasi Bundle HAI</p>
        <span className="text-slate-300">·</span>
        <span className="text-[11px] text-slate-400">
          {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </span>
        <span className={cn(
          "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
          SHIFT_CFG[states.VAP.activeShift].chip,
        )}>
          Shift {states.VAP.activeShift}
        </span>
      </div>

      {/* 3 columns */}
      <div className="grid grid-cols-3 divide-x divide-slate-100">
        {BUNDLE_ORDER.map((tipe) => {
          const cfg         = BUNDLE_CFG[tipe];
          const state       = states[tipe];
          const activeRec   = state.shiftRecords[state.activeShift];
          const pct         = activeRec ? completionPct(activeRec.checks) : state.livePct;

          type StatusKey = "inactive" | "done" | "partial" | "filling" | "empty";
          const statusKey: StatusKey =
            !state.enabled            ? "inactive" :
            activeRec && pct === 100  ? "done"     :
            activeRec                 ? "partial"  :
            state.livePct > 0         ? "filling"  : "empty";

          const STATUS = {
            inactive: { label: "Tidak aktif",        cls: "text-slate-400",   dot: "bg-slate-200",   bar: "bg-slate-200",   pulse: false },
            done:     { label: "Selesai",             cls: "text-emerald-600", dot: "bg-emerald-500", bar: "bg-emerald-500", pulse: false },
            partial:  { label: `${pct}% terlaksana`, cls: "text-amber-600",   dot: "bg-amber-400",   bar: "bg-amber-400",   pulse: false },
            filling:  { label: `Diisi · ${pct}%`,    cls: "text-amber-500",   dot: "bg-amber-300",   bar: "bg-amber-300",   pulse: true  },
            empty:    { label: "Belum diisi",         cls: "text-rose-500",    dot: "bg-rose-300",    bar: "bg-rose-200",    pulse: false },
          } as const;

          const s = STATUS[statusKey];

          return (
            <button
              key={tipe}
              onClick={() => onFocus(tipe)}
              className="group flex flex-col gap-2 px-4 py-3.5 text-left transition hover:bg-indigo-50/50 active:bg-indigo-100/40"
            >
              {/* Bundle name */}
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", s.dot, s.pulse && "animate-pulse")} />
                <p className="flex-1 text-xs font-bold text-slate-700 transition-colors group-hover:text-indigo-700">
                  {cfg.label}
                </p>
                <MoveDown size={11} className="shrink-0 text-slate-200 transition-colors group-hover:text-indigo-400" />
              </div>

              {/* Shift dots: P / S / M */}
              <div className="flex items-center gap-2">
                {SHIFT_ORDER.map((sh) => {
                  const rec   = state.shiftRecords[sh];
                  const shPct = rec ? completionPct(rec.checks) : 0;
                  return (
                    <div key={sh} className="flex items-center gap-1" title={sh + (rec ? ` · ${shPct}%` : " · belum")}>
                      <span className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        !state.enabled ? "bg-slate-100" :
                        rec ? pctColor(shPct) : "border border-slate-200 bg-white",
                      )} />
                      <span className="text-[9px] font-bold text-slate-400">{SHIFT_CFG[sh].short}</span>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className={cn("h-full rounded-full", s.bar)}
                  initial={{ width: 0 }}
                  animate={{ width: state.enabled ? `${pct}%` : "0%" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Status label */}
              <p className={cn("text-[10px] font-semibold", s.cls)}>{s.label}</p>

              {/* Saved detail for active shift */}
              {activeRec && (
                <div className="flex flex-col gap-0.5 border-t border-slate-100 pt-1.5">
                  <p className="flex items-center gap-1 text-[10px] text-slate-600">
                    <User size={9} className="shrink-0 text-slate-400" />
                    <span className="truncate font-medium">{activeRec.perawat}</span>
                  </p>
                  <p className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock size={9} className="shrink-0" />
                    {activeRec.waktu}
                  </p>
                </div>
              )}

              {statusKey === "empty" && (
                <p className="text-[10px] italic leading-tight text-rose-300">Klik untuk isi ↓</p>
              )}
              {statusKey === "inactive" && (
                <p className="text-[10px] italic leading-tight text-slate-300">Alat tidak terpasang</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Bundle card ────────────────────────────────────────────

interface BundleCardProps {
  tipe:            BundleTipe;
  hasHistory:      boolean;
  enabled:         boolean;
  liveChecks:      Record<string, boolean>;
  shiftRecords:    Partial<Record<Shift, DailyRecord>>;
  activeShift:     Shift;
  isFocused:       boolean;
  cardRef:         React.RefObject<HTMLDivElement | null>;
  onEnabledChange: (v: boolean) => void;
  onChecksChange:  (checks: Record<string, boolean>) => void;
  onSave:          (record: DailyRecord) => void;
}

function BundleCard({
  tipe, hasHistory, enabled, liveChecks, shiftRecords, activeShift,
  isFocused, cardRef, onEnabledChange, onChecksChange, onSave,
}: BundleCardProps) {
  const cfg         = BUNDLE_CFG[tipe];
  const today       = todayISO();
  const historyInit = hasHistory ? BUNDLE_HISTORY_MOCK[tipe] : [];

  const [expanded,    setExpanded]    = useState(hasHistory);
  const [perawat,     setPerawat]     = useState("");
  const [history,     setHistory]     = useState<DailyRecord[]>(historyInit);
  const [showHistory, setShowHistory] = useState(false);

  const isSaved  = !!shiftRecords[activeShift];
  const pctToday = completionPct(liveChecks);

  // Yesterday compliance count
  const yesterdayISO = (() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();
  const yesterdayRecs = history.filter(r => r.tanggal === yesterdayISO);
  const yesterdayDone = yesterdayRecs.filter(r => completionPct(r.checks) === 100).length;

  // Grouped history for display (past records + today's saved from props)
  const pastRecords   = history.filter(r => r.tanggal !== today);
  const todayFromSaved = Object.values(shiftRecords) as DailyRecord[];
  const grouped       = groupByDate([...pastRecords, ...todayFromSaved]);
  const displayDays   = grouped.slice(-7);

  function toggle(id: string) {
    onChecksChange({ ...liveChecks, [id]: !liveChecks[id] });
  }

  function handleSave() {
    if (!perawat.trim()) return;
    const record: DailyRecord = {
      tanggal: today,
      shift:   activeShift,
      checks:  { ...liveChecks },
      perawat: perawat.trim(),
      waktu:   new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };
    setHistory(prev => {
      const without = prev.filter(r => !(r.tanggal === today && r.shift === activeShift));
      return [...without, record].sort((a, b) =>
        a.tanggal.localeCompare(b.tanggal) || SHIFT_ORDER.indexOf(a.shift) - SHIFT_ORDER.indexOf(b.shift)
      );
    });
    onSave(record);
    setPerawat("");
  }

  return (
    <div
      ref={cardRef}
      id={`bundle-${tipe}`}
      className={cn(
        "overflow-hidden rounded-xl border bg-white shadow-xs transition-all duration-300",
        isFocused
          ? "border-indigo-400 ring-2 ring-indigo-300 ring-offset-1 shadow-indigo-100"
          : "border-slate-200",
      )}
    >
      {/* Card header */}
      <div className={cn("flex items-center gap-2.5 border-b px-4 py-2.5", cfg.hdrCls)}>
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", cfg.dotCls)} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-800">{cfg.label}</p>
          <p className="truncate text-[10px] text-slate-500">{cfg.desc}</p>
        </div>
        {yesterdayRecs.length > 0 && (
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", cfg.badgeCls)}>
            {yesterdayDone}/{yesterdayRecs.length} shift kmrn
          </span>
        )}
        <button
          onClick={() => { onEnabledChange(!enabled); if (!enabled) setExpanded(true); }}
          className="flex shrink-0 items-center gap-1 text-[11px] font-medium transition hover:text-slate-800"
          title={cfg.trigger}
        >
          {enabled
            ? <ToggleRight size={20} className="text-emerald-500" />
            : <ToggleLeft  size={20} className="text-slate-300"   />}
          <span className={cn("text-[11px]", enabled ? "text-emerald-600 font-semibold" : "text-slate-400")}>
            {enabled ? "Aktif" : "Nonaktif"}
          </span>
        </button>
        <button
          onClick={() => setExpanded(v => !v)}
          disabled={!enabled}
          className="shrink-0 text-slate-400 transition hover:text-slate-600 disabled:opacity-30"
        >
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      {/* Disabled hint */}
      {!enabled && (
        <div className="px-4 py-2.5">
          <p className="text-[11px] italic text-slate-400">{cfg.trigger} — aktifkan toggle untuk mulai dokumentasi</p>
        </div>
      )}

      {/* Checklist body */}
      <AnimatePresence>
        {enabled && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: "hidden" }}
          >
            <div className="p-4">

              {/* Shift tabs — today's 3 shifts status */}
              <div className="mb-3 flex items-center gap-1.5">
                {SHIFT_ORDER.map(sh => {
                  const rec   = shiftRecords[sh];
                  const shPct = rec ? completionPct(rec.checks) : 0;
                  const isActive = sh === activeShift;
                  return (
                    <div
                      key={sh}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                        rec
                          ? shPct === 100
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                          : isActive
                            ? SHIFT_CFG[sh].chip
                            : "bg-slate-50 text-slate-400 ring-slate-200",
                      )}
                    >
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        rec ? (shPct === 100 ? "bg-emerald-500" : "bg-amber-400") : isActive ? SHIFT_CFG[sh].dot : "bg-slate-200",
                      )} />
                      {sh}
                      {rec && <CheckCircle2 size={9} />}
                    </div>
                  );
                })}
                <span className="ml-auto text-[10px] text-slate-400">Hari ini</span>
              </div>

              {/* Subheader */}
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Checklist Shift {activeShift}
                </p>
                {isSaved
                  ? <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><CheckCircle2 size={11} /> Tersimpan</span>
                  : <span className="flex items-center gap-1 text-[10px] text-amber-500"><AlertCircle size={11} /> Belum disimpan</span>}
              </div>

              {/* Progress bar */}
              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className={cn("h-full rounded-full", pctColor(pctToday))}
                  animate={{ width: `${isSaved ? completionPct(shiftRecords[activeShift]!.checks) : pctToday}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Items */}
              <div className="mb-3 flex flex-col gap-1.5">
                {cfg.items.map((item) => {
                  const done = isSaved
                    ? (shiftRecords[activeShift]?.checks[item.id] ?? false)
                    : liveChecks[item.id];
                  return (
                    <button
                      key={item.id}
                      onClick={() => { if (!isSaved) toggle(item.id); }}
                      disabled={isSaved}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition",
                        done
                          ? "border-emerald-200 bg-emerald-50"
                          : isSaved
                            ? "border-slate-100 bg-slate-50 opacity-60"
                            : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white",
                      )}
                    >
                      {done
                        ? <CheckSquare size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                        : <Square      size={14} className="mt-0.5 shrink-0 text-slate-300"   />}
                      <div className="min-w-0">
                        <p className={cn("text-xs font-semibold leading-tight", done ? "text-emerald-800" : "text-slate-700")}>
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">{item.detail}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Save row — hidden if already saved this shift */}
              {!isSaved ? (
                <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                  <div className="flex h-8 flex-1 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5">
                    <User size={11} className="shrink-0 text-slate-400" />
                    <input
                      value={perawat}
                      onChange={e => setPerawat(e.target.value)}
                      placeholder="Nama perawat..."
                      className="flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder-slate-300"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={!perawat.trim()}
                    className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Save size={11} /> Simpan Shift {activeShift}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                  <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-emerald-700">
                      Shift {activeShift} tersimpan
                    </p>
                    <p className="text-[10px] text-emerald-600">
                      {shiftRecords[activeShift]?.perawat} · {shiftRecords[activeShift]?.waktu}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">
                    {completionPct(shiftRecords[activeShift]!.checks)}%
                  </span>
                </div>
              )}

              {/* History strip */}
              {displayDays.length > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setShowHistory(v => !v)}
                    className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 transition hover:text-slate-600"
                  >
                    <Clock size={10} /> Riwayat 7 Hari
                    {showHistory ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                  </button>

                  {/* Day strip — each day shows 3 shift dots */}
                  <div className="flex items-end gap-3">
                    {displayDays.map((day) => (
                      <div key={day.tanggal} className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-0.5">
                          {SHIFT_ORDER.map(sh => {
                            const rec   = day.shifts[sh];
                            const shPct = rec ? completionPct(rec.checks) : -1;
                            return (
                              <div
                                key={sh}
                                title={sh + (rec ? ` · ${shPct}%` : " · tidak diisi")}
                                className={cn(
                                  "h-2.5 w-2.5 rounded-sm",
                                  shPct === -1 ? "border border-slate-150 bg-slate-50" : pctColor(shPct),
                                )}
                              />
                            );
                          })}
                        </div>
                        <p className="text-[9px] leading-none text-slate-400">{fmtTgl(day.tanggal)}</p>
                      </div>
                    ))}
                  </div>

                  {/* History list (expanded) */}
                  {showHistory && (
                    <div className="mt-2 flex flex-col gap-2">
                      {[...displayDays].reverse().map((day) => (
                        <div key={day.tanggal} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                          <p className="mb-1.5 text-[10px] font-bold text-slate-500">{fmtTgl(day.tanggal)}</p>
                          <div className="flex flex-col gap-1">
                            {SHIFT_ORDER.map(sh => {
                              const rec   = day.shifts[sh];
                              const shPct = rec ? completionPct(rec.checks) : -1;
                              return (
                                <div key={sh} className="flex items-center gap-2">
                                  <span className={cn(
                                    "w-10 rounded px-1 py-0.5 text-center text-[9px] font-bold ring-1",
                                    SHIFT_CFG[sh].chip,
                                  )}>
                                    {sh}
                                  </span>
                                  {rec ? (
                                    <>
                                      <div className="h-1 w-14 overflow-hidden rounded-full bg-slate-200">
                                        <div
                                          className={cn("h-full rounded-full", pctColor(shPct))}
                                          style={{ width: `${shPct}%` }}
                                        />
                                      </div>
                                      <span className="w-7 text-right text-[9px] font-bold text-slate-500">{shPct}%</span>
                                      <span className="min-w-0 flex-1 truncate text-[10px] text-slate-400">{rec.perawat}</span>
                                      <span className="text-[9px] text-slate-400">{rec.waktu}</span>
                                    </>
                                  ) : (
                                    <span className="text-[10px] italic text-slate-300">tidak diisi</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────

export default function BundleHAISection({ noRM }: { noRM: string }) {
  const hasHistory = noRM === "RM-2025-007";
  const autoShift  = currentShift();

  const [selectedShift, setSelectedShift] = useState<Shift>(currentShift);
  const [enabledMap, setEnabledMap] = useState<Record<BundleTipe, boolean>>({
    VAP: hasHistory, CAUTI: hasHistory, CLABSI: hasHistory,
  });
  const [liveChecksMap, setLiveChecksMap] = useState<Record<BundleTipe, Record<string, boolean>>>({
    VAP:    initChecks(BUNDLE_CFG.VAP.items),
    CAUTI:  initChecks(BUNDLE_CFG.CAUTI.items),
    CLABSI: initChecks(BUNDLE_CFG.CLABSI.items),
  });
  // Per-bundle, per-shift saved records for today
  const [todayShiftRecords, setTodayShiftRecords] = useState<
    Partial<Record<BundleTipe, Partial<Record<Shift, DailyRecord>>>>
  >({});
  const [focusedBundle, setFocusedBundle] = useState<BundleTipe | null>(null);

  const vapRef    = useRef<HTMLDivElement>(null);
  const cautiRef  = useRef<HTMLDivElement>(null);
  const clabsiRef = useRef<HTMLDivElement>(null);
  const cardRefs: Record<BundleTipe, React.RefObject<HTMLDivElement | null>> = {
    VAP: vapRef, CAUTI: cautiRef, CLABSI: clabsiRef,
  };

  function handleFocus(tipe: BundleTipe) {
    setFocusedBundle(tipe);
    cardRefs[tipe].current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setFocusedBundle(null), 1800);
  }

  const summaryStates: Record<BundleTipe, BundleSummaryState> = {
    VAP:    { enabled: enabledMap.VAP,    shiftRecords: todayShiftRecords.VAP    ?? {}, livePct: completionPct(liveChecksMap.VAP),    activeShift: selectedShift },
    CAUTI:  { enabled: enabledMap.CAUTI,  shiftRecords: todayShiftRecords.CAUTI  ?? {}, livePct: completionPct(liveChecksMap.CAUTI),  activeShift: selectedShift },
    CLABSI: { enabled: enabledMap.CLABSI, shiftRecords: todayShiftRecords.CLABSI ?? {}, livePct: completionPct(liveChecksMap.CLABSI), activeShift: selectedShift },
  };

  const isManual = selectedShift !== autoShift;

  return (
    <div className="flex flex-col gap-3">

      {/* Section header */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <ShieldCheck size={16} className="text-indigo-500" />
        <span className="text-sm font-semibold text-slate-700">Bundle Pencegahan HAI</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs text-slate-400">VAP · CAUTI · CLABSI</span>
        <span className="ml-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">ICU / HCU</span>
        <span className="ml-auto text-[10px] text-slate-400">SNARS PPI 1–7</span>
        <div className="ml-1 flex items-center gap-1">
          <ClipboardCheck size={11} className="text-slate-400" />
          <span className="text-[10px] text-slate-400">3 shift / hari</span>
        </div>
      </div>

      {/* Shift selector */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs">
        <Clock size={12} className="shrink-0 text-slate-400" />
        <span className="text-xs text-slate-500 shrink-0">Shift aktif:</span>
        <div className="flex items-center gap-1">
          {SHIFT_ORDER.map(sh => {
            const isAuto     = sh === autoShift;
            const isSelected = sh === selectedShift;
            return (
              <button
                key={sh}
                onClick={() => setSelectedShift(sh)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition ring-1",
                  isSelected
                    ? cn(SHIFT_CFG[sh].chip, "shadow-sm")
                    : "bg-slate-50 text-slate-400 ring-slate-200 hover:bg-slate-100 hover:text-slate-600",
                )}
              >
                {isAuto && (
                  <span className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    isSelected ? SHIFT_CFG[sh].dot : "bg-slate-300",
                    isSelected && "animate-pulse",
                  )} />
                )}
                {sh}
                {isAuto && <span className={cn("text-[9px]", isSelected ? "opacity-70" : "text-slate-300")}>auto</span>}
              </button>
            );
          })}
        </div>
        {isManual ? (
          <button
            onClick={() => setSelectedShift(autoShift)}
            className="ml-auto flex items-center gap-1 text-[10px] font-medium text-indigo-500 transition hover:text-indigo-700"
          >
            <RotateCcw size={10} /> Reset ke {autoShift}
          </button>
        ) : (
          <span className="ml-auto text-[10px] text-slate-400">Terdeteksi otomatis</span>
        )}
      </div>

      {/* Summary card */}
      <SummaryCard states={summaryStates} onFocus={handleFocus} />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-1 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" />100%</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400" />60–99%</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-orange-400" />&lt;60%</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm border border-slate-200 bg-slate-50" />Shift tidak diisi</span>
        <span className="ml-auto text-[10px] text-slate-300">P = Pagi · S = Siang · M = Malam</span>
      </div>

      {/* Bundle cards */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {BUNDLE_ORDER.map((tipe) => (
          <BundleCard
            key={tipe}
            tipe={tipe}
            hasHistory={hasHistory}
            enabled={enabledMap[tipe]}
            liveChecks={liveChecksMap[tipe]}
            shiftRecords={todayShiftRecords[tipe] ?? {}}
            activeShift={selectedShift}
            isFocused={focusedBundle === tipe}
            cardRef={cardRefs[tipe]}
            onEnabledChange={v => setEnabledMap(prev => ({ ...prev, [tipe]: v }))}
            onChecksChange={checks => setLiveChecksMap(prev => ({ ...prev, [tipe]: checks }))}
            onSave={record => {
              setTodayShiftRecords(prev => ({
                ...prev,
                [tipe]: { ...(prev[tipe] ?? {}), [record.shift]: record },
              }));
              // Reset live checks — next shift starts fresh
              setLiveChecksMap(prev => ({ ...prev, [tipe]: initChecks(BUNDLE_CFG[tipe].items) }));
            }}
          />
        ))}
      </div>
    </div>
  );
}
