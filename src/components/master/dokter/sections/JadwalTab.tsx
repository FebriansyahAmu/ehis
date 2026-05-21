"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type JadwalSlot, HARI_LIST } from "../dokterShared";
import { fieldCls, selectCls } from "../../ruangan/forms/OrganizationForm";

interface JadwalTabProps {
  jadwal: JadwalSlot[];
  onAdd: () => void;
  onUpdate: (idx: number, patch: Partial<JadwalSlot>) => void;
  onRemove: (idx: number) => void;
}

export default function JadwalTab({ jadwal, onAdd, onUpdate, onRemove }: JadwalTabProps) {
  const totalJam = jadwal.reduce((acc, j) => acc + hitungDurasi(j.jamMulai, j.jamSelesai), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-3"
    >
      <div className="rounded-xl border border-slate-200 bg-white p-3.5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-500">
              <Calendar size={11} />
            </span>
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
              Jadwal Praktik Mingguan
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span><strong className="text-slate-700">{jadwal.length}</strong> slot</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span><strong className="text-slate-700">{totalJam.toFixed(1)} jam</strong>/minggu</span>
          </div>
        </div>

        {jadwal.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-6 text-center text-[11px] text-slate-500">
            Belum ada jadwal terdaftar
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {jadwal.map((j, i) => (
                <JadwalRow
                  key={i}
                  slot={j}
                  onChange={(patch) => onUpdate(i, patch)}
                  onRemove={() => onRemove(i)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        <button
          type="button"
          onClick={onAdd}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
        >
          <Clock size={11} />
          Tambah Slot Jadwal
        </button>
      </div>
    </motion.div>
  );
}

// ── Sub-components ─────────────────────────────────────────

function JadwalRow({
  slot, onChange, onRemove,
}: {
  slot: JadwalSlot;
  onChange: (patch: Partial<JadwalSlot>) => void;
  onRemove: () => void;
}) {
  const durasi = hitungDurasi(slot.jamMulai, slot.jamSelesai);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2"
    >
      <select
        value={slot.hari}
        onChange={(e) => onChange({ hari: e.target.value as JadwalSlot["hari"] })}
        className={cn(selectCls, "flex-1")}
      >
        {HARI_LIST.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <input
        type="time"
        value={slot.jamMulai}
        onChange={(e) => onChange({ jamMulai: e.target.value })}
        className={cn(fieldCls, "w-24 font-mono")}
      />
      <span className="text-[10px] text-slate-400">—</span>
      <input
        type="time"
        value={slot.jamSelesai}
        onChange={(e) => onChange({ jamSelesai: e.target.value })}
        className={cn(fieldCls, "w-24 font-mono")}
      />
      <span className="hidden w-14 shrink-0 text-right text-[10px] text-slate-500 sm:block">
        {durasi > 0 ? `${durasi.toFixed(1)}j` : "—"}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
        aria-label="Hapus jadwal"
      >
        <Trash2 size={11} />
      </button>
    </motion.div>
  );
}

function hitungDurasi(mulai: string, selesai: string): number {
  if (!mulai || !selesai) return 0;
  const [hM, mM] = mulai.split(":").map(Number);
  const [hS, mS] = selesai.split(":").map(Number);
  const start = hM * 60 + mM;
  const end = hS * 60 + mS;
  if (end <= start) return 0;
  return (end - start) / 60;
}
