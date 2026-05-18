"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, AlertTriangle, CheckCircle2, Clock, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { type KalibrasiRecord, KALIBRASI_LIST, KALIBRASI_STATUS_CFG } from "./manajemenShared";

// ── Days Until ────────────────────────────────────────────

function daysUntil(tgl: string): number {
  return Math.round((new Date(tgl).getTime() - new Date("2026-05-18").getTime()) / (24 * 60 * 60 * 1000));
}

// ── Kalibrasi Card ────────────────────────────────────────

function KalibrasiCard({ record, active, onClick }: {
  record: KalibrasiRecord; active: boolean; onClick: () => void;
}) {
  const cfg   = KALIBRASI_STATUS_CFG[record.status];
  const days  = daysUntil(record.tanggalBerikut);
  const isOverdue = record.status === "Overdue";
  const isSegera  = record.status === "Segera";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all",
        active
          ? "border-sky-300 bg-sky-50 shadow-sm"
          : isOverdue
            ? "border-rose-200 bg-rose-50/50 hover:bg-rose-50"
            : isSegera
              ? "border-amber-200 bg-amber-50/50 hover:bg-amber-50"
              : "border-slate-200 bg-white hover:bg-slate-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-bold text-slate-800">{record.instrumen}</p>
          <p className="text-[10px] text-slate-400">{record.jenis}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold", cfg.badge)}>
          {record.status}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
        <span>Terakhir: {record.tanggalTerakhir}</span>
        <span>Berikut: {record.tanggalBerikut}</span>
      </div>

      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">Frekuensi: {record.frekuensi}</span>
        <span className={cn(
          "text-[10px] font-semibold",
          isOverdue ? "text-rose-600" : isSegera ? "text-amber-600" : days <= 30 ? "text-amber-500" : "text-emerald-600",
        )}>
          {isOverdue ? `Terlambat ${Math.abs(days)} hari` : `${days} hari lagi`}
        </span>
      </div>

      {record.catatan && (
        <p className="mt-1.5 text-[10px] italic text-slate-500">"{record.catatan}"</p>
      )}
    </button>
  );
}

// ── Detail Panel ──────────────────────────────────────────

function DetailPanel({ record }: { record: KalibrasiRecord }) {
  const cfg  = KALIBRASI_STATUS_CFG[record.status];
  const days = daysUntil(record.tanggalBerikut);

  return (
    <div className="space-y-4">
      <div className={cn("rounded-xl border p-4", record.status === "Overdue" ? "border-rose-200 bg-rose-50" : record.status === "Segera" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50")}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-sm font-bold text-slate-900">{record.instrumen}</p>
            <p className="text-[11px] text-slate-500">SN: {record.serialNo}</p>
            <p className="text-[11px] text-slate-500">{record.jenis}</p>
          </div>
          <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", cfg.badge)}>
            {record.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Terakhir Dikalibrasi", value: record.tanggalTerakhir },
            { label: "Kalibrasi Berikut",    value: record.tanggalBerikut  },
            { label: "Frekuensi",            value: record.frekuensi       },
            { label: "Hasil Terakhir",       value: record.hasilTerakhir   },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-white/50 bg-white/60 p-2.5">
              <p className="text-[10px] text-slate-400">{label}</p>
              <p className={cn(
                "text-[12px] font-bold",
                value === "Tidak Lulus" ? "text-rose-700" : value === "Lulus" ? "text-emerald-700" : "text-slate-700",
              )}>{value}</p>
            </div>
          ))}
        </div>

        {record.status !== "Valid" && (
          <div className={cn("mt-3 flex items-start gap-2 rounded-lg border px-3 py-2", record.status === "Overdue" ? "border-rose-300 bg-rose-100" : "border-amber-200 bg-amber-100")}>
            <AlertTriangle size={12} className={cn("mt-0.5 shrink-0", record.status === "Overdue" ? "text-rose-600" : "text-amber-600")} />
            <div>
              <p className={cn("text-[11px] font-bold", record.status === "Overdue" ? "text-rose-800" : "text-amber-800")}>
                {record.status === "Overdue"
                  ? `Kalibrasi terlambat ${Math.abs(days)} hari — Segera hubungi vendor/BPFK`
                  : `Jadwalkan kalibrasi dalam ${days} hari`}
              </p>
              {record.catatan && <p className="mt-0.5 text-[10px] text-slate-600">{record.catatan}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Log kalibrasi mock */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Log Kalibrasi</p>
        <div className="space-y-2">
          {[
            { tanggal: record.tanggalTerakhir, hasil: record.hasilTerakhir, petugas: record.petugas ?? "—", catatan: "Sesuai prosedur kalibrasi vendor" },
            { tanggal: "2025-12-01", hasil: "Lulus", petugas: record.petugas ?? "—", catatan: "Kalibrasi rutin terjadwal" },
          ].map((log, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2">
              <div className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", log.hasil === "Lulus" ? "bg-emerald-400" : "bg-rose-400")} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-700">{log.tanggal}</span>
                  <span className={cn("rounded text-[9px] font-bold px-1", log.hasil === "Lulus" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                    {log.hasil}
                  </span>
                  <span className="text-[10px] text-slate-400">{log.petugas}</span>
                </div>
                <p className="text-[10px] text-slate-500">{log.catatan}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Add Kalibrasi Form ────────────────────────────────────

function AddKalibrasiForm({ onClose }: { onClose: () => void }) {
  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400";
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-bold text-sky-800">Tambah Record Kalibrasi</p>
        <button onClick={onClose}><X size={14} className="text-sky-600" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Instrumen</label>
          <select className={inputCls}>
            <option value="">-- Pilih --</option>
            {KALIBRASI_LIST.map((k) => <option key={k.id}>{k.instrumen}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tanggal Kalibrasi</label>
          <input type="date" className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Hasil</label>
          <select className={inputCls}>
            <option>Lulus</option>
            <option>Tidak Lulus</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Petugas</label>
          <input placeholder="Nama" className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Berikutnya</label>
          <input type="date" className={inputCls} />
        </div>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 rounded-xl bg-sky-600 py-2 text-sm font-semibold text-white hover:bg-sky-700">Simpan</button>
        <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function KalibrasiPane() {
  const [selected, setSelected] = useState<string>(KALIBRASI_LIST[0].id);
  const [showForm, setShowForm] = useState(false);

  const record      = KALIBRASI_LIST.find((k) => k.id === selected)!;
  const overdue     = KALIBRASI_LIST.filter((k) => k.status === "Overdue").length;
  const segera      = KALIBRASI_LIST.filter((k) => k.status === "Segera").length;
  const valid       = KALIBRASI_LIST.filter((k) => k.status === "Valid").length;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[260px_1fr]">

      {/* Left — list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
            <Wrench size={13} className="text-sky-600 shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-sky-800">Kalibrasi Alat</p>
              <p className="text-[10px] text-sky-600">ISO 15189 §5.3.4</p>
            </div>
          </div>
          <button onClick={() => setShowForm((p) => !p)} className="flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-sky-700">
            <Plus size={11} /> Tambah
          </button>
        </div>

        <AnimatePresence>{showForm && <AddKalibrasiForm onClose={() => setShowForm(false)} />}</AnimatePresence>

        {/* Summary chips */}
        <div className="flex gap-2 flex-wrap">
          {overdue > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold text-rose-700">
              <AlertTriangle size={10} /> {overdue} Overdue
            </span>
          )}
          {segera > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
              <Clock size={10} /> {segera} Segera
            </span>
          )}
          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
            <CheckCircle2 size={10} /> {valid} Valid
          </span>
        </div>

        <div className="space-y-1.5">
          {KALIBRASI_LIST.map((k) => (
            <KalibrasiCard
              key={k.id} record={k}
              active={k.id === selected}
              onClick={() => setSelected(k.id)}
            />
          ))}
        </div>
      </div>

      {/* Right — detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          <DetailPanel record={record} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
