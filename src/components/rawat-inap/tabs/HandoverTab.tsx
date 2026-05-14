"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Calendar,
} from "lucide-react";
import type { RawatInapPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  SHIFTS,
  SHIFT_CONFIG,
  HANDOVER_MOCK,
  fmtDate,
  prevDay,
  nextDay,
  todayISO,
  type Shift,
  type HandoverEntry,
} from "./handover/handoverShared";
import HandoverCard from "./handover/HandoverCard";
import HandoverForm from "./handover/HandoverForm";

interface Props {
  patient: RawatInapPatientDetail;
}

export default function HandoverTab({ patient }: Props) {
  const today                     = todayISO();
  const [date, setDate]           = useState(today);
  const [activeShift, setShift]   = useState<Shift>("Pagi");
  const [showForm, setShowForm]   = useState(false);
  const [entries, setEntries]     = useState<HandoverEntry[]>(
    () => HANDOVER_MOCK[patient.noRM] ?? [],
  );

  const isToday    = date === today;
  const dayEntries = entries.filter((e) => e.tanggal === date);
  const shiftEntry = dayEntries.find((e) => e.shift === activeShift);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setShowForm(false);
  };

  const handleShiftChange = (s: Shift) => {
    setShift(s);
    setShowForm(false);
  };

  const handleSubmit = (data: Omit<HandoverEntry, "id" | "tanggal">) => {
    setEntries((prev) => [
      ...prev,
      { ...data, id: `ho-${Date.now()}`, tanggal: date },
    ]);
    setShowForm(false);
  };

  const doneCount = dayEntries.length;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Patient context strip ── */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white px-4 py-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              Serah Terima Shift
            </p>
            <p className="truncate text-sm font-bold text-slate-800">
              {patient.name}
            </p>
            <p className="text-[11px] text-slate-500">
              {patient.diagnosis} · Hari ke-{patient.hariKe} ·{" "}
              {patient.ruangan} {patient.noBed}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-xl bg-indigo-100 px-3 py-1.5 text-[11px] font-semibold text-indigo-700">
              {patient.dpjp}
            </span>
            {doneCount > 0 && (
              <span className="rounded-xl bg-emerald-100 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700">
                {doneCount}/3 shift selesai
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Date navigator ── */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-xs">
        <button
          type="button"
          onClick={() => handleDateChange(prevDay(date))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-indigo-300 hover:text-indigo-600 active:bg-indigo-50"
        >
          <ChevronLeft size={15} />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-slate-400" />
            <p className="text-[12px] font-semibold capitalize text-slate-700">
              {fmtDate(date)}
            </p>
          </div>
          {isToday && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-0.5 rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-600"
            >
              Hari Ini
            </motion.span>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleDateChange(nextDay(date))}
          disabled={isToday}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border transition",
            isToday
              ? "cursor-not-allowed border-slate-100 text-slate-200"
              : "border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 active:bg-indigo-50",
          )}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* ── Shift selector ── */}
      <div className="grid grid-cols-3 gap-2">
        {SHIFTS.map((shift) => {
          const cfg    = SHIFT_CONFIG[shift];
          const done   = dayEntries.some((e) => e.shift === shift);
          const active = activeShift === shift;

          return (
            <button
              key={shift}
              type="button"
              onClick={() => handleShiftChange(shift)}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-center transition",
                active
                  ? cn(cfg.activeBg, cfg.activeBorder, "text-white shadow-sm")
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <div className="flex items-center gap-1.5">
                {done ? (
                  <CheckCircle2
                    size={13}
                    className={active ? "text-white/80" : "text-emerald-500"}
                  />
                ) : (
                  <Clock
                    size={13}
                    className={active ? "text-white/60" : "text-slate-300"}
                  />
                )}
                <span className="text-[13px] font-bold">{shift}</span>
              </div>
              <span
                className={cn(
                  "text-[10px]",
                  active ? "text-white/70" : "text-slate-400",
                )}
              >
                {cfg.jam}
              </span>

              {/* Done dot badge */}
              {done && !active && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content: card / form / pending CTA ── */}
      <AnimatePresence mode="wait">
        {shiftEntry ? (
          <motion.div
            key={`card-${activeShift}-${date}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <HandoverCard entry={shiftEntry} />
          </motion.div>

        ) : showForm ? (
          <motion.div
            key={`form-${activeShift}-${date}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <HandoverForm
              shift={activeShift}
              patient={patient}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
            />
          </motion.div>

        ) : (
          /* Pending CTA */
          <motion.div
            key={`pending-${activeShift}-${date}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-10 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <ArrowRightLeft size={24} className="text-slate-400" />
            </div>
            <p className="mb-1.5 text-sm font-bold text-slate-700">
              Serah Terima Shift {activeShift} Belum Diisi
            </p>
            <p className="mb-5 text-[12px] leading-relaxed text-slate-400">
              Dokumentasikan serah terima menggunakan format SBAR untuk memastikan
              <br className="hidden sm:block" />
              kesinambungan asuhan pasien antar shift.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 active:bg-indigo-800"
            >
              <Plus size={14} />
              Isi Serah Terima Shift {activeShift}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Daily summary chips ── */}
      <AnimatePresence>
        {dayEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2"
          >
            <p className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Ringkasan {isToday ? "Hari Ini" : fmtDate(date).split(",")[0]}
            </p>
            {SHIFTS.map((shift) => {
              const entry = dayEntries.find((e) => e.shift === shift);
              return entry ? (
                <motion.button
                  key={shift}
                  type="button"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => handleShiftChange(shift)}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 transition hover:bg-emerald-100"
                >
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span className="text-[11px] font-semibold text-emerald-700">
                    {shift}
                  </span>
                  <span className="text-[10px] text-emerald-500">
                    {entry.perawatKeluar} → {entry.perawatMasuk}
                  </span>
                </motion.button>
              ) : (
                <div
                  key={shift}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5"
                >
                  <Clock size={12} className="text-slate-300" />
                  <span className="text-[11px] text-slate-400">
                    {shift} belum diisi
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
