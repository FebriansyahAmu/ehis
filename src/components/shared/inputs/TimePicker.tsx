"use client";

import { useMemo } from "react";
import { createPortal } from "react-dom";
import { Clock, ChevronDown } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePopover, triggerClasses, type TriggerVariant } from "./popoverShared";

const pad = (n: number) => String(n).padStart(2, "0");
const POP_W = 256;

export interface TimePickerProps {
  /** "HH:MM" (kontrak sama dengan <input type="time">). */
  value: string;
  onChange: (val: string) => void;
  /** Langkah menit pada grid (default 5). */
  minuteStep?: number;
  className?: string;
  placeholder?: string;
  variant?: TriggerVariant;
  id?: string;
}

export function TimePicker({
  value, onChange, minuteStep = 5, className, placeholder = "Pilih jam", variant = "default", id,
}: TimePickerProps) {
  const reduce = useReducedMotion();
  const { open, setOpen, mounted, coords, triggerRef, popRef } = usePopover(POP_W, 300);

  const [hh, mm] = useMemo(() => {
    const m = /^(\d{1,2}):(\d{1,2})$/.exec(value ?? "");
    return m ? [Number(m[1]), Number(m[2])] : [null, null];
  }, [value]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(
    () => Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep),
    [minuteStep],
  );

  const pickHour = (h: number) => onChange(`${pad(h)}:${pad(mm ?? 0)}`);
  const pickMinute = (m: number) => onChange(`${pad(hh ?? 0)}:${pad(m)}`);
  const setNow = () => {
    const d = new Date();
    const m = Math.round(d.getMinutes() / minuteStep) * minuteStep;
    onChange(`${pad(d.getHours())}:${pad(m % 60)}`);
  };

  const colCell = (active: boolean) =>
    cn(
      "flex h-9 items-center justify-center rounded-lg text-[12.5px] font-semibold tabular-nums transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
      active
        ? "bg-sky-600 text-white shadow-sm shadow-sky-200"
        : "text-slate-600 hover:bg-sky-50",
    );

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(triggerClasses(variant, open), className)}
      >
        <Clock size={14} className="shrink-0 text-slate-400" />
        <span className={cn("flex-1 text-left tabular-nums", hh !== null ? "text-slate-700" : "text-slate-400")}>
          {hh !== null ? `${pad(hh)}:${pad(mm ?? 0)}` : placeholder}
        </span>
        <ChevronDown size={14} className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && coords && (
            <motion.div
              ref={popRef}
              role="dialog"
              aria-label="Pilih jam"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "fixed", top: coords.top, left: coords.left, width: POP_W, zIndex: 60 }}
              className="origin-top rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xl shadow-slate-900/10 ring-1 ring-black/5"
            >
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2.5">
                {/* Jam */}
                <div>
                  <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Jam</p>
                  <div className="grid grid-cols-3 gap-1">
                    {hours.map((h) => (
                      <button key={h} type="button" onClick={() => pickHour(h)} className={colCell(hh === h)}>
                        {pad(h)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-px bg-slate-100" />

                {/* Menit */}
                <div>
                  <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Menit</p>
                  <div className="grid grid-cols-2 gap-1">
                    {minutes.map((m) => (
                      <button key={m} type="button" onClick={() => pickMinute(m)} className={colCell(mm === m)}>
                        {pad(m)}
                      </button>
                    ))}
                  </div>
                </div>
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
