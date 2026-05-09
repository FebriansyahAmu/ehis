"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Pill, CheckCircle2, AlertTriangle, XCircle, MinusCircle, Clock, Plus, Info } from "lucide-react";
import type { RawatInapPatientDetail, ResepRIItem, MAREntry, StatusMAR, RIShift } from "@/lib/data";
import { cn } from "@/lib/utils";
import { MAR_CONFIG, fmtTanggalRI } from "@/components/shared/resep/resepShared";

// ── Types ─────────────────────────────────────────────────

interface Props {
  items:      ResepRIItem[];
  marEntries: MAREntry[];
  patient:    RawatInapPatientDetail;
  onAdd:      (entry: MAREntry) => void;
  onUpdate:   (entry: MAREntry) => void;
}

const SHIFTS: RIShift[] = ["Pagi", "Siang", "Malam"];
const SHIFT_HOURS: Record<RIShift, string> = { Pagi: "07-14", Siang: "14-21", Malam: "21-07" };

const STATUS_ICON: Record<StatusMAR, React.ElementType> = {
  Diberikan:     CheckCircle2,
  Ditunda:       AlertTriangle,
  Ditolak:       XCircle,
  TidakTersedia: MinusCircle,
  NA:            MinusCircle,
};

// ── Helpers ────────────────────────────────────────────────

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
}

function getEntriesForCell(mar: MAREntry[], itemId: string, tanggal: string, shift: RIShift): MAREntry | undefined {
  return mar.find((e) => e.resepItemId === itemId && e.tanggal === tanggal && e.shift === shift && e.status !== "Ditunda");
}

function getPendingForCell(mar: MAREntry[], itemId: string, tanggal: string, shift: RIShift): MAREntry | undefined {
  return mar.find((e) => e.resepItemId === itemId && e.tanggal === tanggal && e.shift === shift && e.status === "Ditunda");
}

function genMarId(): string {
  return `mar-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}

// ── Cell component ─────────────────────────────────────────

function MARCell({
  entry, pending, itemId, tanggal, shift, onRecord,
}: {
  entry:    MAREntry | undefined;
  pending:  MAREntry | undefined;
  itemId:   string;
  tanggal:  string;
  shift:    RIShift;
  onRecord: (itemId: string, tanggal: string, shift: RIShift, status: StatusMAR, waktu?: string, catatan?: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos,  setMenuPos]  = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const cfg  = entry ? MAR_CONFIG[entry.status] : null;
  const Icon = entry ? STATUS_ICON[entry.status] : null;

  const STATUS_OPTS: StatusMAR[] = ["Diberikan", "Ditunda", "Ditolak", "TidakTersedia"];

  function openMenu() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 4, left: r.left });
    }
    setShowMenu((v) => !v);
  }

  return (
    <div className="relative flex min-h-11 items-center justify-center">
      {entry ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={openMenu}
          className={cn("flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 text-center ring-1 transition hover:opacity-80", cfg?.cls)}
          title={`${entry.status} ${entry.waktuPemberian ? `· ${entry.waktuPemberian}` : ""}`}
        >
          {Icon && <Icon size={13} />}
          <span className="text-[9px] font-bold">{cfg?.label}</span>
          {entry.waktuPemberian && (
            <span className="text-[9px] text-slate-600">{entry.waktuPemberian}</span>
          )}
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={openMenu}
          className={cn(
            "flex items-center gap-1 rounded-lg border border-dashed px-2 py-1.5 text-[10px] font-semibold transition",
            pending
              ? "border-amber-300 bg-amber-50 text-amber-600"
              : "border-slate-200 text-slate-400 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600",
          )}
          title={pending ? "Tertunda — klik untuk update" : "Catat pemberian"}
        >
          <Plus size={9} />
          {pending ? "Tertunda" : "Catat"}
        </button>
      )}

      {showMenu && (
        <div
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left }}
          className="z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          onMouseLeave={() => setShowMenu(false)}
        >
          <p className="border-b border-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-600">
            Catat Status
          </p>
          {STATUS_OPTS.map((s) => {
            const c = MAR_CONFIG[s];
            return (
              <button key={s} type="button"
                onClick={() => { onRecord(itemId, tanggal, shift, s); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", c.dot)} />
                {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function MARPane({ items, marEntries, patient, onAdd, onUpdate }: Props) {
  const days = getLast7Days();
  const [selectedDay, setSelectedDay] = useState(days[0]);

  const activeItems = items.filter((i) => i.aktif);

  function handleRecord(itemId: string, tanggal: string, shift: RIShift, status: StatusMAR, waktu?: string, catatan?: string) {
    const existing = marEntries.find(
      (e) => e.resepItemId === itemId && e.tanggal === tanggal && e.shift === shift,
    );
    const perawat = patient.ttvHistory[0]?.perawat ?? "Perawat Jaga";
    if (existing) {
      onUpdate({ ...existing, status, waktuPemberian: waktu, catatan });
    } else {
      onAdd({
        id:              genMarId(),
        resepItemId:     itemId,
        tanggal,
        shift,
        status,
        waktuPemberian:  waktu,
        perawat,
        catatan,
      });
    }
  }

  // Build stats for selected day
  const dayEntries = marEntries.filter((e) => e.tanggal === selectedDay);
  const givenCount    = dayEntries.filter((e) => e.status === "Diberikan").length;
  const pendingCount  = dayEntries.filter((e) => e.status === "Ditunda").length;
  const issueCount    = dayEntries.filter((e) => e.status === "Ditolak" || e.status === "TidakTersedia").length;

  if (activeItems.length === 0) {
    return (
      <motion.div className="flex flex-col items-center justify-center py-20 text-center"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Pill size={24} className="mb-3 text-slate-200" />
        <p className="text-sm font-semibold text-slate-400">Belum ada obat aktif</p>
        <p className="mt-1 text-xs text-slate-400">Tambah order obat di tab Resep Aktif terlebih dahulu</p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Day picker */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <CalendarDays size={13} className="text-slate-400" />
          Pilih Hari:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {days.map((day) => {
            const hasEntries = marEntries.some((e) => e.tanggal === day);
            return (
              <button key={day} type="button" onClick={() => setSelectedDay(day)}
                className={cn(
                  "rounded-lg border px-3 py-1 text-[11px] font-medium transition",
                  selectedDay === day
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                    : hasEntries
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                )}>
                {fmtTanggalRI(day)}
                {hasEntries && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
          <CheckCircle2 size={11} />{givenCount} Diberikan
        </span>
        {pendingCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
            <Clock size={11} />{pendingCount} Ditunda
          </span>
        )}
        {issueCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200">
            <XCircle size={11} />{issueCount} Masalah
          </span>
        )}
      </div>

      {/* MAR grid table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full min-w-120">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Obat
              </th>
              {SHIFTS.map((shift) => (
                <th key={shift} className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <div>{shift}</div>
                  <div className="text-[9px] font-normal text-slate-400">{SHIFT_HOURS[shift]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {activeItems.map((item, idx) => (
              <motion.tr key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.04 }}
                className="hover:bg-slate-50/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-400">
                      <Pill size={11} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">{item.namaObat}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.dosis} · <span className="font-medium text-indigo-600">{item.signa}</span> · {item.rute}
                      </p>
                    </div>
                  </div>
                </td>
                {SHIFTS.map((shift) => {
                  const entry   = getEntriesForCell(marEntries, item.id, selectedDay, shift);
                  const pending = getPendingForCell(marEntries, item.id, selectedDay, shift);
                  return (
                    <td key={shift} className="px-3 py-2 text-center">
                      <MARCell
                        entry={entry}
                        pending={pending}
                        itemId={item.id}
                        tanggal={selectedDay}
                        shift={shift}
                        onRecord={handleRecord}
                      />
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Panduan Pencatatan */}
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:grid-cols-2">

        {/* Left: steps */}
        <div>
          <div className="mb-2.5 flex items-center gap-1.5">
            <Info size={12} className="text-indigo-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Cara Pencatatan MAR</p>
          </div>
          <ol className="space-y-2">
            {[
              "Pilih tanggal dari bar hari di atas.",
              'Klik tombol "Catat" pada kolom shift obat yang bersangkutan.',
              "Pilih status pemberian dari menu yang muncul.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Right: status badge examples */}
        <div>
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">Status Pemberian</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(["Diberikan", "Ditunda", "Ditolak", "TidakTersedia"] as StatusMAR[]).map((s) => {
              const c    = MAR_CONFIG[s];
              const Icon = STATUS_ICON[s];
              return (
                <span key={s} className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ring-1", c.cls)}>
                  <Icon size={11} />
                  {s === "TidakTersedia" ? "Tdk Tersedia" : s}
                </span>
              );
            })}
            <span className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2.5 py-1.5 text-[11px] font-medium text-slate-400">
              <Plus size={10} />
              Belum Dicatat
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
