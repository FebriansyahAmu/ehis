"use client";

import { useState, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, AlertTriangle, Clock, ChevronLeft, ChevronRight,
  Pill, X, User, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RawatInapPatientDetail, MAREntry, ResepRIItem, StatusMAR } from "@/lib/data";
import {
  type MARShift,
  SHIFT_CFG, STATUS_MAR_CFG,
  getCurrentShift, deriveTimeSlots, isFlexibleSigna,
  isHAMDrug, getRecentDates, fmtTanggalShort,
} from "./mar/marShared";

// ── Types ─────────────────────────────────────────────────

interface MARTabProps { patient: RawatInapPatientDetail }

interface InputForm {
  status:   StatusMAR;
  waktu:    string;
  perawat:  string;
  catatan:  string;
  perawat2: string;
}

interface CellTarget { item: ResepRIItem; slotWaktu: string | null }

// ── Helpers ───────────────────────────────────────────────

function getShiftCols(items: ResepRIItem[], shift: MARShift): string[] {
  const slots = new Set<string>();
  items
    .filter((i) => i.aktif && !isFlexibleSigna(i.signa))
    .forEach((item) => {
      deriveTimeSlots(item.signa)
        .filter((s) => s.shift === shift)
        .forEach((s) => slots.add(s.waktu));
    });
  return Array.from(slots).sort();
}

// ── Drug groups ───────────────────────────────────────────

const GROUP_ORDER = ["scheduled", "continuous", "prn"] as const;
type DrugGroup = typeof GROUP_ORDER[number];

const GROUP_CFG: Record<DrugGroup, { label: string; cls: string; flexLabel: string }> = {
  scheduled:  { label: "Terjadwal",         cls: "text-slate-500", flexLabel: "Kontinu / Titrasi" },
  continuous: { label: "Kontinu / Titrasi", cls: "text-sky-600",   flexLabel: "Kontinu / Titrasi" },
  prn:        { label: "PRN / k/p",          cls: "text-amber-600", flexLabel: "Sesuai kebutuhan (k/p)" },
};

function getMARGroup(signa: string): DrugGroup {
  const s = signa.toLowerCase();
  if (/k\/p|prn|bila perlu/.test(s)) return "prn";
  if (/kontinu|drip|titrasi/.test(s)) return "continuous";
  return "scheduled";
}

// ── Cell styles ───────────────────────────────────────────

const CELL_STYLE: Record<StatusMAR, string> = {
  Diberikan:     "bg-emerald-100 text-emerald-700",
  Ditunda:       "bg-amber-100 text-amber-700",
  Ditolak:       "bg-rose-100 text-rose-700",
  TidakTersedia: "bg-slate-100 text-slate-400",
  NA:            "bg-slate-50 text-slate-200",
};

const CELL_ICON: Record<StatusMAR, string> = {
  Diberikan:     "✓",
  Ditunda:       "⏸",
  Ditolak:       "✕",
  TidakTersedia: "○",
  NA:            "—",
};

// ── Slot cell ─────────────────────────────────────────────

function SlotCell({
  entry, hasSlot, isToday, onClick,
}: {
  entry?: MAREntry; hasSlot: boolean; isToday: boolean; onClick: () => void;
}) {
  if (!hasSlot) {
    return (
      <div className="flex h-8 items-center justify-center">
        <span className="text-[10px] text-slate-200 select-none">—</span>
      </div>
    );
  }
  if (!entry) {
    return isToday ? (
      <button
        onClick={onClick}
        className="mx-auto flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-600 active:scale-95"
        aria-label="Catat pemberian"
      >
        <span className="text-[9px] font-black leading-none">+</span>
      </button>
    ) : (
      <div className="flex h-8 items-center justify-center">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
      </div>
    );
  }
  return (
    <button
      onClick={isToday ? onClick : undefined}
      title={[STATUS_MAR_CFG[entry.status].label, entry.waktuPemberian].filter(Boolean).join(" · ")}
      className={cn(
        "mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black transition",
        CELL_STYLE[entry.status],
        isToday ? "cursor-pointer hover:opacity-70 active:scale-95" : "cursor-default",
      )}
    >
      {CELL_ICON[entry.status]}
    </button>
  );
}

// ── Drug row ──────────────────────────────────────────────

function DrugRow({
  item, group, shiftCols, entry, isHAM, isToday, onCellClick, index,
}: {
  item: ResepRIItem;
  group: DrugGroup;
  shiftCols: string[];
  entry?: MAREntry;
  isHAM: boolean;
  isToday: boolean;
  onCellClick: (item: ResepRIItem, slotWaktu: string | null) => void;
  index: number;
}) {
  const flexible  = isFlexibleSigna(item.signa);
  const itemSlots = flexible ? [] : deriveTimeSlots(item.signa);
  const colCount  = Math.max(shiftCols.length, 1);

  function hasSlotAt(waktu: string): boolean {
    return itemSlots.some((s) => s.waktu === waktu);
  }

  return (
    <motion.tr
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, ease: "easeOut" }}
      className={cn(
        "group border-b border-slate-100 transition-colors last:border-0",
        isHAM ? "bg-rose-50/20 hover:bg-rose-50/40" : "hover:bg-slate-50/60",
        !item.aktif && "opacity-40",
      )}
    >
      {/* Drug info */}
      <td className="py-2.5 pl-3 pr-4 min-w-[160px] max-w-[220px]">
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-1 leading-none">
            {isHAM && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-rose-50 px-1 py-0.5 text-[9px] font-bold text-rose-600 ring-1 ring-rose-200">
                <AlertTriangle size={7} aria-hidden />HAM
              </span>
            )}
            {item.kategori !== "Reguler" && (
              <span className={cn(
                "shrink-0 rounded px-1 py-0.5 text-[9px] font-bold ring-1",
                item.kategori === "Narkotika"
                  ? "bg-orange-50 text-orange-600 ring-orange-200"
                  : "bg-purple-50 text-purple-600 ring-purple-200",
              )}>
                {item.kategori === "Narkotika" ? "N" : "P"}
              </span>
            )}
            <span className="truncate text-xs font-semibold text-slate-800 max-w-[130px]">{item.namaObat}</span>
          </div>
          <span className="text-[10px] text-slate-400 leading-none">{item.dosis} · {item.rute} · {item.signa}</span>
        </div>
      </td>

      {/* Slot cells or flexible */}
      {flexible ? (
        <td colSpan={colCount} className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] italic text-slate-400">{GROUP_CFG[group].flexLabel}</span>
            {isToday && (
              <button
                onClick={() => onCellClick(item, null)}
                className={cn(
                  "rounded border px-2 py-0.5 text-[10px] font-semibold transition active:scale-95",
                  entry
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100",
                )}
              >
                {entry ? `${CELL_ICON[entry.status]} Edit` : "+ Catat"}
              </button>
            )}
            {!isToday && entry && (
              <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", CELL_STYLE[entry.status])}>
                {CELL_ICON[entry.status]} {STATUS_MAR_CFG[entry.status].label}
              </span>
            )}
          </div>
        </td>
      ) : shiftCols.length > 0 ? (
        shiftCols.map((slot) => (
          <td key={slot} className="w-14 px-1 py-2 text-center">
            <SlotCell
              entry={entry}
              hasSlot={hasSlotAt(slot)}
              isToday={isToday}
              onClick={() => onCellClick(item, slot)}
            />
          </td>
        ))
      ) : (
        <td className="px-3 py-2 text-center">
          <span className="text-[10px] text-slate-300">Tidak ada jadwal</span>
        </td>
      )}

      {/* Perawat + waktu */}
      <td className="py-2 pl-2 pr-3 min-w-[90px]">
        {entry?.perawat && (
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <User size={8} aria-hidden className="shrink-0" />
            <span className="truncate max-w-[90px]">{entry.perawat}</span>
          </span>
        )}
        {entry?.waktuPemberian && (
          <span className="flex items-center gap-1 text-[9px] text-slate-300 mt-0.5">
            <Clock size={7} aria-hidden className="shrink-0" />
            {entry.waktuPemberian}
          </span>
        )}
      </td>
    </motion.tr>
  );
}

// ── Input modal ───────────────────────────────────────────

const STATUS_OPTIONS: StatusMAR[] = ["Diberikan", "Ditunda", "Ditolak", "TidakTersedia"];

function InputModal({
  item, slotWaktu, entry, shift, isHAM, onSave, onClose,
}: {
  item: ResepRIItem; slotWaktu: string | null; entry?: MAREntry;
  shift: MARShift; isHAM: boolean;
  onSave: (data: Omit<MAREntry, "id">) => void;
  onClose: () => void;
}) {
  const defaultWaktu = slotWaktu ?? new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const [form, setForm] = useState<InputForm>({
    status:   entry?.status ?? "Diberikan",
    waktu:    entry?.waktuPemberian ?? defaultWaktu,
    perawat:  entry?.perawat ?? "",
    catatan:  entry?.catatan ?? "",
    perawat2: "",
  });

  const needsWaktu  = form.status === "Diberikan";
  const hamRequired = isHAM && needsWaktu;
  const valid       = form.perawat.trim().length > 0 && (!hamRequired || form.perawat2.trim().length > 0);

  function handleSave() {
    if (!valid) return;
    const today = new Date().toISOString().split("T")[0];
    onSave({
      resepItemId:    item.id,
      tanggal:        today,
      shift,
      status:         form.status,
      waktuPemberian: needsWaktu ? form.waktu : undefined,
      perawat:        form.perawat || undefined,
      catatan:        form.catatan || undefined,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <div className="flex items-center gap-1.5">
              {isHAM && (
                <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-200">
                  <AlertTriangle size={9} />HAM
                </span>
              )}
              <h3 className="font-bold text-slate-900 text-sm leading-tight">{item.namaObat}</h3>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {item.dosis} · {item.rute} · Shift {shift}
              {slotWaktu && ` · ${slotWaktu}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {isHAM && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
              <AlertTriangle size={12} className="mt-0.5 shrink-0 text-rose-600" />
              <p className="text-xs font-semibold text-rose-700">
                High Alert Medication — verifikasi wajib oleh 2 perawat
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Status Pemberian</label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => {
                const cfg = STATUS_MAR_CFG[s];
                return (
                  <button
                    key={s}
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                      form.status === s ? cfg.badge : "bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100",
                    )}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {needsWaktu && (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Clock size={11} />Waktu Pemberian
              </label>
              <input
                type="time" value={form.waktu}
                onChange={(e) => setForm((f) => ({ ...f, waktu: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <User size={11} />Nama Perawat
            </label>
            <input
              type="text" value={form.perawat}
              onChange={(e) => setForm((f) => ({ ...f, perawat: e.target.value }))}
              placeholder="Ns. Sari Dewi, S.Kep"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {hamRequired && (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                <AlertTriangle size={11} />
                Verifikator Ke-2 <span className="font-normal text-rose-400">(wajib)</span>
              </label>
              <input
                type="text" value={form.perawat2}
                onChange={(e) => setForm((f) => ({ ...f, perawat2: e.target.value }))}
                placeholder="Perawat verifikator (berbeda)"
                className="w-full rounded-lg border border-rose-200 bg-rose-50/40 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Catatan <span className="font-normal text-slate-400">(opsional)</span>
            </label>
            <textarea
              rows={2} value={form.catatan}
              onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
              placeholder="Observasi atau keterangan khusus"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!valid}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-bold transition-all",
              valid
                ? "bg-sky-600 text-white shadow-sm hover:bg-sky-700 active:scale-95"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            Simpan
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Shift button ──────────────────────────────────────────

function ShiftBtn({ shift, active, count, onClick }: {
  shift: MARShift; active: boolean; count: number; onClick: () => void;
}) {
  const cfg = SHIFT_CFG[shift];
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150",
        active ? cfg.activeBadge : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", active ? "bg-white/70" : cfg.dot)} />
      {cfg.label}
      {count > 0 && (
        <span className={cn(
          "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
          active ? "bg-white/25" : "bg-slate-100 text-slate-500",
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function MARTab({ patient }: MARTabProps) {
  const resepRI     = patient.resepRI;
  const allItems    = resepRI?.items ?? [];
  const activeItems = allItems.filter((i) => i.aktif);

  const [activeShift, setActiveShift] = useState<MARShift>(getCurrentShift());
  const dates      = getRecentDates(7);
  const [dateIdx,  setDateIdx]   = useState(0);
  const activeDate = dates[dateIdx];
  const isToday    = dateIdx === 0;

  const [localMAR,    setLocalMAR]    = useState<MAREntry[]>(resepRI?.mar ?? []);
  const [cellTarget,  setCellTarget]  = useState<CellTarget | null>(null);

  function getEntry(itemId: string): MAREntry | undefined {
    return localMAR.find(
      (e) => e.resepItemId === itemId && e.tanggal === activeDate && e.shift === activeShift,
    );
  }

  function handleSave(data: Omit<MAREntry, "id">) {
    const newEntry: MAREntry = { id: `mar-local-${Date.now()}`, ...data };
    setLocalMAR((prev) => [
      ...prev.filter(
        (e) => !(e.resepItemId === data.resepItemId && e.tanggal === data.tanggal && e.shift === data.shift),
      ),
      newEntry,
    ]);
  }

  const shiftCols = getShiftCols(activeItems, activeShift);
  const totalCols = Math.max(shiftCols.length, 1) + 2;
  const grouped   = GROUP_ORDER
    .map((g) => ({ group: g, items: activeItems.filter((i) => getMARGroup(i.signa) === g) }))
    .filter(({ items }) => items.length > 0);

  const entriesNow = localMAR.filter((e) => e.tanggal === activeDate && e.shift === activeShift);
  const diberikan  = entriesNow.filter((e) => e.status === "Diberikan").length;
  const tertunda   = entriesNow.filter((e) => e.status !== "Diberikan").length;
  const hamPending = isToday
    ? activeItems.filter((i) => isHAMDrug(i.namaObat) && !getEntry(i.id)).length
    : 0;

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
          <BookOpen size={15} className="text-sky-600" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Medication Administration Record</h2>
          <p className="text-[11px] text-slate-400">SNARS PKPO 6 · PMK 72/2016 Ps. 25</p>
        </div>
      </div>

      {/* HAM alert */}
      <AnimatePresence>
        {hamPending > 0 && (
          <motion.div
            key="ham-alert"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <AlertTriangle size={14} className="shrink-0 text-rose-600" aria-hidden />
            <p className="text-xs font-semibold text-rose-700">
              {hamPending} HAM belum dicatat shift ini — verifikasi 2 perawat wajib
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Obat Aktif", value: activeItems.length, cls: "border-slate-200 bg-white text-slate-900"        },
          { label: "Diberikan",  value: diberikan,          cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
          { label: "Tertunda",   value: tertunda,           cls: "border-amber-200 bg-amber-50 text-amber-700"       },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-xl border px-4 py-3 text-center", s.cls)}>
            <p className="text-2xl font-bold tabular-nums leading-none">{s.value}</p>
            <p className="mt-1 text-[10px] opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Date strip */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDateIdx((i) => Math.min(i + 1, dates.length - 1))}
          disabled={dateIdx >= dates.length - 1}
          aria-label="Hari sebelumnya"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
        >
          <ChevronLeft size={13} />
        </button>
        <div className="flex flex-1 gap-1 overflow-x-auto pb-0.5">
          {dates.map((d, i) => (
            <button
              key={d}
              onClick={() => setDateIdx(i)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                i === dateIdx
                  ? "bg-sky-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
              )}
            >
              {i === 0 ? "Hari ini" : fmtTanggalShort(d)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setDateIdx((i) => Math.max(i - 1, 0))}
          disabled={dateIdx === 0}
          aria-label="Hari berikutnya"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Shift tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(["Pagi", "Siang", "Malam"] as MARShift[]).map((shift) => {
          const n = localMAR.filter(
            (e) => e.tanggal === activeDate && e.shift === shift && e.status === "Diberikan",
          ).length;
          return (
            <ShiftBtn
              key={shift} shift={shift}
              active={activeShift === shift}
              count={n}
              onClick={() => setActiveShift(shift)}
            />
          );
        })}
        <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
          <Clock size={10} aria-hidden />
          {SHIFT_CFG[activeShift].hours}
        </span>
      </div>

      {/* MAR table */}
      {activeItems.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 py-12 text-center">
          <Pill size={24} className="mb-2 text-slate-300" aria-hidden />
          <p className="font-medium text-slate-500">Tidak ada obat aktif</p>
          <p className="mt-1 text-sm text-slate-400">Resep belum diinput atau semua obat dihentikan</p>
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${activeDate}-${activeShift}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="py-2.5 pl-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Obat
                    </th>
                    {shiftCols.length > 0 ? (
                      shiftCols.map((slot) => (
                        <th key={slot} className="w-14 px-1 py-2.5 text-center text-[11px] font-bold text-slate-500 tabular-nums">
                          {slot}
                        </th>
                      ))
                    ) : (
                      <th className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-400">
                        Status
                      </th>
                    )}
                    <th className="py-2.5 pl-2 pr-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Perawat
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map(({ group, items }) => (
                    <Fragment key={group}>
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <td colSpan={totalCols} className="px-3 py-1.5">
                          <span className={cn("text-[9px] font-bold uppercase tracking-widest", GROUP_CFG[group].cls)}>
                            {GROUP_CFG[group].label}
                          </span>
                          <span className="ml-1.5 text-[9px] text-slate-300">({items.length})</span>
                        </td>
                      </tr>
                      {items.map((item, i) => (
                        <DrugRow
                          key={item.id}
                          item={item}
                          group={group}
                          shiftCols={shiftCols}
                          entry={getEntry(item.id)}
                          isHAM={isHAMDrug(item.namaObat)}
                          isToday={isToday}
                          onCellClick={(it, slot) => setCellTarget({ item: it, slotWaktu: slot })}
                          index={i}
                        />
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {!isToday && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2">
                <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Info size={10} aria-hidden />
                  Riwayat {fmtTanggalShort(activeDate)} — read-only
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Summary today */}
      {isToday && activeItems.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Ringkasan Hari Ini</p>
          <div className="flex gap-4">
            {(["Pagi", "Siang", "Malam"] as MARShift[]).map((shift) => {
              const entries = localMAR.filter((e) => e.tanggal === activeDate && e.shift === shift);
              const given   = entries.filter((e) => e.status === "Diberikan").length;
              const cfg     = SHIFT_CFG[shift];
              return (
                <div key={shift} className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", cfg.dot)} />
                  <span className="text-xs text-slate-600">{shift}</span>
                  <span className="text-xs font-bold text-emerald-600">{given}/{activeItems.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Input modal */}
      <AnimatePresence>
        {cellTarget && (
          <InputModal
            key="input-modal"
            item={cellTarget.item}
            slotWaktu={cellTarget.slotWaktu}
            entry={getEntry(cellTarget.item.id)}
            shift={activeShift}
            isHAM={isHAMDrug(cellTarget.item.namaObat)}
            onSave={handleSave}
            onClose={() => setCellTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
