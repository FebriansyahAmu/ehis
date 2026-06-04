"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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
// Header Senin-first (locale RS Indonesia).
const WEEK_HEADER = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

// ── Date helpers (timezone-safe, no deps) ────────────────────
function parseISO(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}
function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function formatLong(d: Date): string {
  return `${DAYS_SHORT[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}
/** Offset Senin-first: 0 = Senin … 6 = Minggu. */
function mondayOffset(d: Date): number {
  return (d.getDay() + 6) % 7;
}

type View = "day" | "month" | "year";
const YEARS_PER_PAGE = 12;
const POP_W = 304;

export interface DatePickerProps {
  /** ISO yyyy-mm-dd (kontrak sama dengan <input type="date">). */
  value: string;
  onChange: (iso: string) => void;
  className?: string;
  placeholder?: string;
  variant?: TriggerVariant;
  /** Tampilkan tombol "Hapus" di footer (default true). */
  clearable?: boolean;
  id?: string;
}

export function DatePicker({
  value, onChange, className, placeholder = "Pilih tanggal", variant = "default", clearable = true, id,
}: DatePickerProps) {
  const reduce = useReducedMotion();
  const today = useMemo(() => new Date(), []);
  const selected = useMemo(() => parseISO(value), [value]);

  const { open, setOpen, mounted, coords, triggerRef, popRef } = usePopover(POP_W, 372);
  const [view, setView] = useState<View>("day");
  // Tanggal "anchor" yang sedang dilihat (bulan/tahun di header).
  const [viewDate, setViewDate] = useState<Date>(() => selected ?? today);
  // Hari yang sedang difokus untuk navigasi keyboard.
  const [focusDate, setFocusDate] = useState<Date>(() => selected ?? today);

  // Reset state saat MEMBUKA (di handler, bukan effect → tak ada cascading render).
  const toggleOpen = () => {
    if (!open) {
      const base = selected ?? today;
      setView("day");
      setViewDate(base);
      setFocusDate(base);
    }
    setOpen((o) => !o);
  };

  // Fokuskan sel hari aktif saat navigasi keyboard (efek DOM murni — tanpa setState).
  useEffect(() => {
    if (!open || view !== "day") return;
    const iso = toISO(focusDate);
    const btn = popRef.current?.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);
    btn?.focus();
  }, [focusDate, open, view, popRef]);

  // ── Day grid (42 sel, Senin-first) ─────────────────────────
  const days = useMemo(() => {
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const start = addDays(first, -mondayOffset(first));
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [viewDate]);

  const commit = (d: Date) => {
    onChange(toISO(d));
    setOpen(false);
    triggerRef.current?.focus();
  };
  const clear = () => {
    onChange("");
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onDayKey = (e: React.KeyboardEvent) => {
    let next: Date | null = null;
    switch (e.key) {
      case "ArrowLeft": next = addDays(focusDate, -1); break;
      case "ArrowRight": next = addDays(focusDate, 1); break;
      case "ArrowUp": next = addDays(focusDate, -7); break;
      case "ArrowDown": next = addDays(focusDate, 7); break;
      case "Home": next = addDays(focusDate, -mondayOffset(focusDate)); break;
      case "End": next = addDays(focusDate, 6 - mondayOffset(focusDate)); break;
      case "PageUp": next = new Date(focusDate.getFullYear(), focusDate.getMonth() - 1, focusDate.getDate()); break;
      case "PageDown": next = new Date(focusDate.getFullYear(), focusDate.getMonth() + 1, focusDate.getDate()); break;
      case "Enter":
      case " ": e.preventDefault(); commit(focusDate); return;
      default: return;
    }
    if (next) {
      e.preventDefault();
      setFocusDate(next);
      if (next.getMonth() !== viewDate.getMonth() || next.getFullYear() !== viewDate.getFullYear()) setViewDate(next);
    }
  };

  // ── Header label + nav ─────────────────────────────────────
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
      "rounded-xl py-3 text-[12.5px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
      active
        ? "bg-sky-600 text-white shadow-sm shadow-sky-200"
        : cn("text-slate-600 hover:bg-sky-50", isCur && "text-sky-600 ring-1 ring-sky-200"),
    );

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
        <CalendarDays size={14} className="shrink-0 text-slate-400" />
        <span className={cn("flex-1 text-left", selected ? "text-slate-700" : "text-slate-400")}>
          {selected ? formatLong(selected) : placeholder}
        </span>
        <ChevronDown size={14} className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && coords && (
            <motion.div
              ref={popRef}
              role="dialog"
              aria-label="Pilih tanggal"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "fixed", top: coords.top, left: coords.left, width: POP_W, zIndex: 60 }}
              className="origin-top rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xl shadow-slate-900/10 ring-1 ring-black/5"
            >
              {/* Header */}
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
                  exit={reduce ? { opacity: 0 } : { opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  {/* ── Day view ── */}
                  {view === "day" && (
                    <div onKeyDown={onDayKey}>
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
                          const isSel = selected && sameDay(d, selected);
                          const isToday = sameDay(d, today);
                          const isFocus = sameDay(d, focusDate);
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                          return (
                            <button
                              key={toISO(d)}
                              type="button"
                              data-iso={toISO(d)}
                              tabIndex={isFocus ? 0 : -1}
                              onClick={() => commit(d)}
                              aria-label={formatLong(d)}
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
                    </div>
                  )}

                  {/* ── Month view ── */}
                  {view === "month" && (
                    <div className="grid grid-cols-3 gap-1.5 py-1">
                      {MONTHS_SHORT.map((m, i) => {
                        const isSel = !!selected && selected.getFullYear() === viewDate.getFullYear() && selected.getMonth() === i;
                        const isCur = today.getFullYear() === viewDate.getFullYear() && today.getMonth() === i;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setViewDate((d) => new Date(d.getFullYear(), i, 1));
                              setFocusDate((f) => new Date(viewDate.getFullYear(), i, Math.min(f.getDate(), 28)));
                              setView("day");
                            }}
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
                        const isSel = !!selected && selected.getFullYear() === yr;
                        const isCur = today.getFullYear() === yr;
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => {
                              setViewDate((d) => new Date(yr, d.getMonth(), 1));
                              setView("month");
                            }}
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

              {/* Footer */}
              <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5">
                <button
                  type="button"
                  onClick={() => commit(new Date())}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-sky-600 transition hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  Hari Ini
                </button>
                {clearable && selected && (
                  <button
                    type="button"
                    onClick={clear}
                    className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
