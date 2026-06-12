"use client";

// DateTimePicker — pemilih tanggal + jam dalam SATU field (popover gabungan).
// Kontrak value = "YYYY-MM-DDTHH:mm" (selaras <input type="datetime-local">), timezone-safe.
// Dibangun di atas popoverShared (portal + flip) — konsisten dgn DatePicker/TimePicker/Select.

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarClock, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePopover, triggerClasses, type TriggerVariant } from "./popoverShared";

// ── Locale ID ────────────────────────────────────────────────
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];
const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const WEEK_HEADER = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

// ── Helpers (timezone-safe, no deps) ─────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");

interface Parsed {
  date: Date | null;
  hh: number | null;
  mm: number | null;
}

/** "YYYY-MM-DDTHH:mm" → bagian tanggal & jam (toleran terhadap parsial). */
function parse(value: string): Parsed {
  if (!value) return { date: null, hh: null, mm: null };
  const [datePart, timePart] = value.split("T");
  const [y, mo, d] = (datePart ?? "").split("-").map(Number);
  const date = y && mo && d ? new Date(y, mo - 1, d) : null;
  const tm = /^(\d{1,2}):(\d{1,2})/.exec(timePart ?? "");
  return {
    date: date && !Number.isNaN(date.getTime()) ? date : null,
    hh: tm ? Number(tm[1]) : null,
    mm: tm ? Number(tm[2]) : null,
  };
}
function toValue(d: Date, hh: number, mm: number): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hh)}:${pad(mm)}`;
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function mondayOffset(d: Date): number {
  return (d.getDay() + 6) % 7;
}
function formatTrigger(d: Date, hh: number, mm: number): string {
  return `${DAYS_SHORT[d.getDay()]}, ${pad(d.getDate())} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()} · ${pad(hh)}:${pad(mm)}`;
}

type View = "day" | "month" | "year";
const YEARS_PER_PAGE = 12;
const POP_W = 312;

export interface DateTimePickerProps {
  /** "YYYY-MM-DDTHH:mm" (kontrak sama dengan <input type="datetime-local">). */
  value: string;
  onChange: (val: string) => void;
  minuteStep?: number;
  className?: string;
  placeholder?: string;
  variant?: TriggerVariant;
  id?: string;
}

export function DateTimePicker({
  value, onChange, minuteStep = 1, className, placeholder = "Pilih tanggal & waktu",
  variant = "default", id,
}: DateTimePickerProps) {
  const reduce = useReducedMotion();
  const today = useMemo(() => new Date(), []);
  const { date: selDate, hh: selHH, mm: selMM } = useMemo(() => parse(value), [value]);

  // Jam efektif (untuk emit walau tanggal/jam masih sebagian terisi).
  const hh = selHH ?? 0;
  const mm = selMM ?? 0;

  const { open, setOpen, mounted, coords, triggerRef, popRef } = usePopover(POP_W, 440);
  const [view, setView] = useState<View>("day");
  const [viewDate, setViewDate] = useState<Date>(() => selDate ?? today);

  // Reset anchor bulan saat MEMBUKA (handler, bukan effect → tak cascading render).
  const toggleOpen = () => {
    if (!open) {
      setView("day");
      setViewDate(selDate ?? today);
    }
    setOpen((o) => !o);
  };

  // Emit: gabung tanggal (default hari ini bila belum dipilih) + jam.
  const emit = (d: Date, h: number, m: number) => onChange(toValue(d, h, m));
  const pickDay = (d: Date) => { emit(d, hh, mm); setViewDate(d); };
  const stepHour = (delta: number) => emit(selDate ?? today, (hh + delta + 24) % 24, mm);
  const stepMinute = (delta: number) => {
    const total = hh * 60 + mm + delta * minuteStep;
    const norm = (total + 1440) % 1440;
    emit(selDate ?? today, Math.floor(norm / 60), norm % 60);
  };
  const setNow = () => { const n = new Date(); emit(n, n.getHours(), n.getMinutes()); };

  // ── Day grid (42 sel, Senin-first) ─────────────────────────
  const days = useMemo(() => {
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const start = addDays(first, -mondayOffset(first));
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [viewDate]);

  const yearBase = Math.floor(viewDate.getFullYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE;
  const headerLabel =
    view === "day" ? `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`
      : view === "month" ? `${viewDate.getFullYear()}`
        : `${yearBase} – ${yearBase + YEARS_PER_PAGE - 1}`;

  const step = (dir: 1 | -1) => {
    if (view === "day") setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
    else if (view === "month") setViewDate((d) => new Date(d.getFullYear() + dir, d.getMonth(), 1));
    else setViewDate((d) => new Date(d.getFullYear() + dir * YEARS_PER_PAGE, d.getMonth(), 1));
  };
  const cycleHeader = () => {
    if (view === "day") setView("month");
    else if (view === "month") setView("year");
  };

  const navBtnCls =
    "flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300";
  const gridBtnCls = (active: boolean, isCur: boolean) =>
    cn(
      "rounded-xl py-2.5 text-[12.5px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
      active
        ? "bg-sky-600 text-white shadow-sm shadow-sky-200"
        : cn("text-slate-600 hover:bg-sky-50", isCur && "text-sky-600 ring-1 ring-sky-200"),
    );

  const hasValue = selDate !== null;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={toggleOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(triggerClasses(variant, open), className)}
      >
        <CalendarClock size={14} className="shrink-0 text-slate-400" />
        <span className={cn("flex-1 truncate text-left tabular-nums", hasValue ? "text-slate-700" : "text-slate-400")}>
          {hasValue ? formatTrigger(selDate, hh, mm) : placeholder}
        </span>
        <ChevronDown size={14} className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && coords && (
            <motion.div
              ref={popRef}
              role="dialog"
              aria-label="Pilih tanggal & waktu"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "fixed", top: coords.top, left: coords.left, width: POP_W, zIndex: 60 }}
              className="origin-top rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xl shadow-slate-900/10 ring-1 ring-black/5"
            >
              {/* Header bulan/tahun */}
              <div className="mb-2.5 flex items-center justify-between">
                <button type="button" onClick={() => step(-1)} className={navBtnCls} aria-label="Sebelumnya">
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  onClick={cycleHeader}
                  disabled={view === "year"}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[13.5px] font-bold text-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                    view !== "year" && "hover:bg-slate-100",
                  )}
                >
                  {headerLabel}
                </button>
                <button type="button" onClick={() => step(1)} className={navBtnCls} aria-label="Berikutnya">
                  <ChevronRight size={17} />
                </button>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={view}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  {/* ── Day view ── */}
                  {view === "day" && (
                    <>
                      <div className="mb-1 grid grid-cols-7">
                        {WEEK_HEADER.map((w, i) => (
                          <div
                            key={w}
                            className={cn(
                              "py-1 text-center text-[10px] font-bold uppercase tracking-wide",
                              i >= 5 ? "text-rose-400" : "text-slate-400",
                            )}
                          >
                            {w}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {days.map((d) => {
                          const isCurMonth = d.getMonth() === viewDate.getMonth();
                          const isSel = selDate && sameDay(d, selDate);
                          const isToday = sameDay(d, today);
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                          return (
                            <button
                              key={toValue(d, 0, 0)}
                              type="button"
                              onClick={() => pickDay(d)}
                              aria-pressed={!!isSel}
                              className={cn(
                                "relative mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-[12.5px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                                isSel
                                  ? "bg-sky-600 font-bold text-white shadow-sm shadow-sky-200"
                                  : cn(
                                    "hover:bg-sky-50",
                                    isCurMonth
                                      ? isWeekend ? "text-rose-500" : "text-slate-700"
                                      : "text-slate-300",
                                    isToday && "font-bold text-sky-600 ring-1 ring-sky-200",
                                  ),
                              )}
                            >
                              {d.getDate()}
                              {isToday && !isSel && (
                                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-sky-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* ── Month view ── */}
                  {view === "month" && (
                    <div className="grid grid-cols-3 gap-1.5 py-1">
                      {MONTHS_SHORT.map((m, i) => {
                        const isSel = !!selDate && selDate.getFullYear() === viewDate.getFullYear() && selDate.getMonth() === i;
                        const isCur = today.getFullYear() === viewDate.getFullYear() && today.getMonth() === i;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => { setViewDate((d) => new Date(d.getFullYear(), i, 1)); setView("day"); }}
                            className={gridBtnCls(isSel, isCur)}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Year view ── */}
                  {view === "year" && (
                    <div className="grid grid-cols-3 gap-1.5 py-1">
                      {Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearBase + i).map((yr) => {
                        const isSel = !!selDate && selDate.getFullYear() === yr;
                        const isCur = today.getFullYear() === yr;
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => { setViewDate((d) => new Date(yr, d.getMonth(), 1)); setView("month"); }}
                            className={gridBtnCls(isSel, isCur)}
                          >
                            {yr}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* ── Time spinner ── */}
              <div className="mt-3 flex items-center justify-center gap-3 border-t border-slate-100 pt-3">
                <Clock size={14} className="text-slate-400" />
                <TimeSpinner label="Jam" value={hh} onStep={stepHour} />
                <span className="-mt-1 text-lg font-black text-slate-300">:</span>
                <TimeSpinner label="Menit" value={mm} onStep={stepMinute} />
              </div>

              {/* Footer */}
              <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5">
                <button
                  type="button"
                  onClick={setNow}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-sky-600 transition hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  Sekarang
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

// Spinner kompak ▲ / nilai / ▼ (klik & roda mouse). Wheel di-scope ke elemennya saja.
function TimeSpinner({ label, value, onStep }: { label: string; value: number; onStep: (delta: number) => void }) {
  const ref = useState<HTMLDivElement | null>(null);
  const [el, setEl] = ref;
  useEffect(() => {
    if (!el) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); onStep(e.deltaY < 0 ? 1 : -1); };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [el, onStep]);

  const arrow = "flex h-6 w-10 items-center justify-center rounded-md text-slate-400 transition hover:bg-sky-50 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300";
  return (
    <div ref={setEl} className="flex flex-col items-center">
      <button type="button" onClick={() => onStep(1)} className={arrow} aria-label={`${label} naik`}>
        <ChevronUp size={15} />
      </button>
      <div className="flex h-9 w-12 items-center justify-center rounded-lg bg-slate-100 text-base font-bold tabular-nums text-slate-800">
        {pad(value)}
      </div>
      <button type="button" onClick={() => onStep(-1)} className={arrow} aria-label={`${label} turun`}>
        <ChevronDown size={15} />
      </button>
    </div>
  );
}
