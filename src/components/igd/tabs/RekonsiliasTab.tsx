"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Repeat, ChevronRight, Plus, Trash2, Check,
  LogIn, ArrowLeftRight, LogOut,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

type RekonType = "admisi" | "transfer" | "discharge";
type ObatStatus = "Lanjut" | "Stop" | "Sesuaikan" | "Tunda";

interface ObatEntry {
  id: string;
  namaObat: string;
  dosis: string;
  rute: string;
  frekuensi: string;
  status: ObatStatus;
}

interface RekonsData {
  selesai: boolean;
  tanggal: string;
  petugas: string;
  obatList: ObatEntry[];
  catatan: string;
}

// ── Config ─────────────────────────────────────────────────

const REKON_DEF = [
  {
    id: "admisi" as RekonType,
    label: "Rekonsiliasi Admisi",
    desc: "Obat yang dibawa pasien saat masuk IGD",
    Icon: LogIn,
    iconColor: "text-indigo-500",
    accentBorder: "border-l-indigo-400",
  },
  {
    id: "transfer" as RekonType,
    label: "Rekonsiliasi Transfer",
    desc: "Obat saat transfer antar unit / bangsal",
    Icon: ArrowLeftRight,
    iconColor: "text-sky-500",
    accentBorder: "border-l-sky-400",
  },
  {
    id: "discharge" as RekonType,
    label: "Rekonsiliasi Discharge",
    desc: "Obat yang diberikan saat pasien pulang",
    Icon: LogOut,
    iconColor: "text-emerald-500",
    accentBorder: "border-l-emerald-400",
  },
];

const STATUS_CFG: Record<ObatStatus, string> = {
  Lanjut:    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Stop:      "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  Sesuaikan: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Tunda:     "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

// ── Helpers ────────────────────────────────────────────────

function emptyRekon(): RekonsData {
  return { selesai: false, tanggal: "", petugas: "", obatList: [], catatan: "" };
}

// ── Bottom-border input ────────────────────────────────────

function BInput({
  label, value, onChange, placeholder, type = "text",
}: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      {label && (
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400"
      />
    </div>
  );
}

// ── Obat row ───────────────────────────────────────────────

function ObatRow({
  entry, onChange, onRemove,
}: {
  entry: ObatEntry;
  onChange: (updated: ObatEntry) => void;
  onRemove: () => void;
}) {
  const set = (k: keyof ObatEntry, v: string) => onChange({ ...entry, [k]: v });
  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2.5">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <input
            value={entry.namaObat}
            onChange={(e) => set("namaObat", e.target.value)}
            placeholder="Nama obat..."
            className="w-full border-b border-slate-200 bg-transparent py-1 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400"
          />
        </div>
        <input
          value={entry.dosis}
          onChange={(e) => set("dosis", e.target.value)}
          placeholder="Dosis..."
          className="w-full border-b border-slate-200 bg-transparent py-1 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          value={entry.rute}
          onChange={(e) => set("rute", e.target.value)}
          placeholder="Rute (oral, IV...)..."
          className="flex-1 border-b border-slate-200 bg-transparent py-1 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
        />
        <input
          value={entry.frekuensi}
          onChange={(e) => set("frekuensi", e.target.value)}
          placeholder="Frekuensi (3×1)..."
          className="flex-1 border-b border-slate-200 bg-transparent py-1 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
        />
        <select
          value={entry.status}
          onChange={(e) => set("status", e.target.value)}
          className={cn("shrink-0 cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-medium outline-none", STATUS_CFG[entry.status])}
        >
          {(["Lanjut", "Stop", "Sesuaikan", "Tunda"] as ObatStatus[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={onRemove}
          aria-label="Hapus obat"
          className="shrink-0 cursor-pointer text-slate-300 transition-colors hover:text-rose-500"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Inline panel ───────────────────────────────────────────

function RekonPanel({
  data, onChange,
}: {
  data: RekonsData;
  onChange: (d: RekonsData) => void;
}) {
  const up = (patch: Partial<RekonsData>) => onChange({ ...data, ...patch });

  function addObat() {
    const entry: ObatEntry = {
      id: `o-${Date.now()}`,
      namaObat: "", dosis: "", rute: "", frekuensi: "", status: "Lanjut",
    };
    up({ obatList: [...data.obatList, entry] });
  }

  function updateObat(idx: number, updated: ObatEntry) {
    up({ obatList: data.obatList.map((o, i) => (i === idx ? updated : o)) });
  }

  function removeObat(idx: number) {
    up({ obatList: data.obatList.filter((_, i) => i !== idx) });
  }

  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/30 px-4 py-4">
      {/* Meta */}
      <div className="grid gap-3 sm:grid-cols-2">
        <BInput
          label="Tanggal & Waktu"
          type="datetime-local"
          value={data.tanggal}
          onChange={(v) => up({ tanggal: v })}
          placeholder=""
        />
        <BInput
          label="Petugas / Apoteker"
          value={data.petugas}
          onChange={(v) => up({ petugas: v })}
          placeholder="Nama petugas..."
        />
      </div>

      {/* Obat list */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Daftar Obat
            {data.obatList.length > 0 && (
              <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 py-0.5 font-bold text-indigo-600">
                {data.obatList.length}
              </span>
            )}
          </p>
          <button
            onClick={addObat}
            className="flex cursor-pointer items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-600 transition hover:bg-indigo-100"
          >
            <Plus size={11} />
            Tambah Obat
          </button>
        </div>

        {data.obatList.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 py-5 text-center text-[11px] text-slate-400">
            Belum ada obat — klik "Tambah Obat" untuk mulai
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {data.obatList.map((o, idx) => (
              <ObatRow
                key={o.id}
                entry={o}
                onChange={(updated) => updateObat(idx, updated)}
                onRemove={() => removeObat(idx)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Catatan */}
      <div>
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Catatan</p>
        <textarea
          rows={2}
          value={data.catatan}
          onChange={(e) => up({ catatan: e.target.value })}
          placeholder="Catatan tambahan rekonsiliasi obat..."
          className="w-full resize-none border-b border-slate-200 bg-transparent py-1 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={data.selesai}
            onChange={(e) => up({ selesai: e.target.checked })}
            className="h-3.5 w-3.5 rounded accent-indigo-600"
          />
          Rekonsiliasi selesai
        </label>
        <button className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-indigo-700">
          Simpan
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RekonsiliasTab({ patient }: { patient: IGDPatientDetail }) {
  const [open, setOpen] = useState<RekonType | null>(null);
  const [dataMap, setDataMap] = useState<Record<RekonType, RekonsData>>({
    admisi:    emptyRekon(),
    transfer:  emptyRekon(),
    discharge: emptyRekon(),
  });

  const doneCount = Object.values(dataMap).filter((d) => d.selesai).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Repeat size={14} className="text-indigo-500" />
          <span className="text-xs font-semibold text-slate-700">Rekonsiliasi Obat</span>
        </div>
        <span className={cn(
          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
          doneCount === 3
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-500",
        )}>
          {doneCount}/3 selesai
        </span>
      </div>

      {/* Rows */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {REKON_DEF.map(({ id, label, desc, Icon, iconColor, accentBorder }, idx) => {
          const isOpen = open === id;
          const data = dataMap[id];
          return (
            <div key={id} className={cn(idx > 0 && "border-t border-slate-100")}>
              <button
                onClick={() => setOpen(isOpen ? null : id)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 border-l-2 px-4 py-3.5 text-left transition-colors hover:bg-slate-50",
                  accentBorder,
                  isOpen && "bg-slate-50/60",
                )}
              >
                <Icon size={15} className={iconColor} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800">{label}</p>
                  <p className="text-[11px] text-slate-400">{desc}</p>
                </div>
                {data.selesai && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check size={10} aria-label="Selesai" />
                  </span>
                )}
                {data.obatList.length > 0 && (
                  <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                    {data.obatList.length}
                  </span>
                )}
                <motion.span
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.18 }}
                  className="shrink-0"
                >
                  <ChevronRight size={14} className="text-slate-400" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
                    style={{ overflow: "hidden" }}
                  >
                    <RekonPanel
                      data={data}
                      onChange={(d) => setDataMap((p) => ({ ...p, [id]: d }))}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
