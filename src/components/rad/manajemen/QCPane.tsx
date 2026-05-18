"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench, CheckCircle2, AlertTriangle, Plus, ChevronDown,
  ChevronUp, FileCheck, X, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PESAWAT_MOCK, KALIBRASI_STATUS_CFG,
  getDaysLabel, type Pesawat, type KalibrasiLog,
} from "./radManajemenShared";

// ── Instrument Card ───────────────────────────────────────

function InstrumentCard({ p, active, onClick }: {
  p: Pesawat; active: boolean; onClick: () => void;
}) {
  const cfg     = KALIBRASI_STATUS_CFG[p.status];
  const isOver  = p.status === "Overdue";
  const isSeg   = p.status === "Segera";

  return (
    <motion.button
      layout
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all",
        active   ? "border-teal-400 bg-teal-50 shadow-sm ring-2 ring-teal-100"
        : isOver ? "border-rose-200 bg-rose-50/50 hover:bg-rose-50"
        : isSeg  ? "border-amber-200 bg-amber-50/50 hover:bg-amber-50"
                 : "border-slate-200 bg-white hover:bg-slate-50",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          isOver ? "bg-rose-100" : isSeg ? "bg-amber-100" : "bg-teal-50",
        )}>
          <Wrench size={13} className={cn(isOver ? "text-rose-600" : isSeg ? "text-amber-600" : "text-teal-600")} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold text-slate-800">{p.nama}</p>
          <p className="text-[10px] text-slate-400">{p.merek} · {p.lokasi}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ring-1", cfg.badge, cfg.ring)}>
          {p.status}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
        <span className={cn("flex items-center gap-1", isOver && "text-rose-600 font-semibold", isSeg && "text-amber-600 font-semibold")}>
          <div className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
          Kalibrasi berikut: {p.kalibrasiBerikut}
        </span>
        <span className="ml-auto font-medium">{getDaysLabel(p.daysUntil, p.status)}</span>
      </div>
    </motion.button>
  );
}

// ── UjiRow ────────────────────────────────────────────────

function UjiRow({ u }: { u: { id: string; tanggal: string; parameter: string; nilaiTerukur: string; nilaiAcuan: string; status: string; petugas: string; catatan?: string } }) {
  const [open, setOpen] = useState(false);
  const ok = u.status === "Sesuai";

  return (
    <div className={cn("rounded-lg border", ok ? "border-slate-100" : "border-rose-200 bg-rose-50/40")}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <span className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold",
          ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
        )}>
          {ok ? "✓" : "✗"}
        </span>
        <span className="flex-1 text-[11px] font-medium text-slate-700">{u.parameter}</span>
        <span className={cn("text-[10px] font-semibold", ok ? "text-slate-500" : "text-rose-600")}>
          {u.nilaiTerukur}
        </span>
        {u.catatan && (open ? <ChevronUp size={10} className="text-slate-400" /> : <ChevronDown size={10} className="text-slate-400" />)}
      </button>
      <AnimatePresence>
        {open && u.catatan && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-rose-100 px-3 pb-2.5 pt-2 text-[10px] text-rose-700">
              <span className="font-bold">Catatan:</span> {u.catatan}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Add Kalibrasi Form ────────────────────────────────────

function AddKalibrasiForm({ pesawatNama, onClose, onSave }: {
  pesawatNama: string; onClose: () => void; onSave: (entry: KalibrasiLog) => void;
}) {
  const [form, setForm] = useState({
    tanggal: "", hasil: "Lulus" as "Lulus" | "Tidak Lulus",
    petugas: "", sertifikat: "", catatan: "",
  });

  const inp = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100";

  const handleSave = () => {
    if (!form.tanggal || !form.petugas) return;
    onSave({
      id: Date.now().toString(),
      tanggal:    form.tanggal,
      hasil:      form.hasil,
      petugas:    form.petugas,
      sertifikat: form.sertifikat || undefined,
      catatan:    form.catatan || undefined,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="rounded-xl border border-teal-200 bg-teal-50/60 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-bold text-teal-800">Tambah Record Kalibrasi</p>
        <button onClick={onClose}><X size={12} className="text-slate-400 hover:text-slate-600" /></button>
      </div>
      <p className="mb-3 text-[10px] text-teal-700">{pesawatNama}</p>

      <div className="grid gap-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1 text-[10px] font-semibold text-slate-600">Tanggal <span className="text-rose-500">*</span></p>
            <input type="date" value={form.tanggal}
              onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
              className={inp} />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold text-slate-600">Hasil</p>
            <div className="flex gap-1.5">
              {(["Lulus", "Tidak Lulus"] as const).map((h) => (
                <button key={h} onClick={() => setForm({ ...form, hasil: h })}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-[10px] font-semibold transition-all",
                    form.hasil === h
                      ? h === "Lulus" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                  )}>
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-semibold text-slate-600">Petugas / Institusi <span className="text-rose-500">*</span></p>
          <input value={form.petugas} onChange={(e) => setForm({ ...form, petugas: e.target.value })}
            placeholder="Nama petugas atau institusi kalibrasi"
            className={inp} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1 text-[10px] font-semibold text-slate-600">No. Sertifikat</p>
            <input value={form.sertifikat} onChange={(e) => setForm({ ...form, sertifikat: e.target.value })}
              placeholder="Opsional" className={inp} />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold text-slate-600">Catatan</p>
            <input value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              placeholder="Opsional" className={inp} />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 py-2 text-[11px] text-slate-600 hover:bg-slate-50">
            Batal
          </button>
          <button onClick={handleSave}
            disabled={!form.tanggal || !form.petugas}
            className="flex-1 rounded-lg bg-teal-600 py-2 text-[11px] font-bold text-white hover:bg-teal-700 disabled:opacity-40">
            Simpan Record
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Detail Panel ──────────────────────────────────────────

function DetailPanel({ p, onAddLog }: { p: Pesawat; onAddLog: (id: string, log: KalibrasiLog) => void }) {
  const [showForm, setShowForm] = useState(false);
  const cfg     = KALIBRASI_STATUS_CFG[p.status];
  const isOver  = p.status === "Overdue";
  const isSeg   = p.status === "Segera";
  const badOk   = p.logUji.filter((u) => u.status === "Sesuai").length;
  const badNok  = p.logUji.filter((u) => u.status === "Tidak Sesuai").length;

  return (
    <motion.div
      key={p.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4"
    >
      {/* Overdue/Segera Alert */}
      <AnimatePresence>
        {(isOver || isSeg) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-start gap-2.5 rounded-xl px-4 py-3",
              isOver ? "bg-rose-50 border border-rose-200" : "bg-amber-50 border border-amber-200",
            )}
          >
            <AlertTriangle size={14} className={cn("mt-0.5 shrink-0", isOver ? "text-rose-600" : "text-amber-600")} />
            <div>
              <p className={cn("text-[11px] font-bold", isOver ? "text-rose-800" : "text-amber-800")}>
                {isOver ? "Kalibrasi Overdue — Segera Jadwalkan Ulang" : "Kalibrasi Segera Jatuh Tempo"}
              </p>
              <p className={cn("text-[10px]", isOver ? "text-rose-600" : "text-amber-600")}>
                {isOver
                  ? `Kalibrasi berikut telah melewati jadwal ${Math.abs(p.daysUntil)} hari. Perka BAPETEN No. 2/2018 — pesawat wajib dikalibrasi sesuai jadwal.`
                  : `Kalibrasi berikut ${p.daysUntil} hari lagi pada ${p.kalibrasiBerikut}. Siapkan jadwal segera.`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-[13px] font-bold text-slate-800">{p.nama}</p>
            <p className="text-[11px] text-slate-400">{p.merek} · SN: {p.serialNo}</p>
            <p className="text-[11px] text-slate-500">{p.lokasi}</p>
          </div>
          <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1", cfg.badge, cfg.ring)}>
            {p.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-slate-400">Kalibrasi Terakhir</p>
            <p className="font-semibold text-slate-700">{p.kalibrasiTerakhir}</p>
          </div>
          <div className={cn("rounded-lg px-3 py-2", isOver ? "bg-rose-50" : isSeg ? "bg-amber-50" : "bg-emerald-50")}>
            <p className="text-slate-400">Kalibrasi Berikut</p>
            <p className={cn("font-bold", isOver ? "text-rose-700" : isSeg ? "text-amber-700" : "text-emerald-700")}>
              {p.kalibrasiBerikut} <span className="font-normal text-[10px]">({getDaysLabel(p.daysUntil, p.status)})</span>
            </p>
          </div>
        </div>
      </div>

      {/* Uji Kesesuaian */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-700">Uji Kesesuaian</p>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-emerald-600 font-semibold">{badOk} Sesuai</span>
            {badNok > 0 && <span className="text-rose-600 font-semibold">{badNok} Tidak Sesuai</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          {p.logUji.map((u) => <UjiRow key={u.id} u={u} />)}
        </div>
        <p className="mt-2 text-[9px] text-slate-400">
          Nilai acuan: Perka BAPETEN No. 2/2018 · IAEA HH-19 §7 · Standar pabrikan
        </p>
      </div>

      {/* Log Kalibrasi */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-700">Log Kalibrasi</p>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-teal-700"
          >
            <Plus size={10} /> Tambah Record
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <div className="mb-3">
              <AddKalibrasiForm
                pesawatNama={p.nama}
                onClose={() => setShowForm(false)}
                onSave={(log) => { onAddLog(p.id, log); setShowForm(false); }}
              />
            </div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-2">
          {p.logKalibrasi.map((log) => (
            <div key={log.id} className={cn(
              "rounded-lg border p-3",
              log.hasil === "Lulus" ? "border-slate-100 bg-slate-50" : "border-rose-200 bg-rose-50",
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {log.hasil === "Lulus"
                    ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    : <AlertTriangle size={13} className="text-rose-500 shrink-0" />}
                  <div>
                    <p className="text-[11px] font-semibold text-slate-700">{log.tanggal}</p>
                    <p className="text-[10px] text-slate-500">{log.petugas}</p>
                  </div>
                </div>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-bold",
                  log.hasil === "Lulus" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
                )}>
                  {log.hasil}
                </span>
              </div>
              {log.sertifikat && (
                <p className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                  <FileCheck size={9} /> No. Sertifikat: {log.sertifikat}
                </p>
              )}
              {log.catatan && (
                <p className="mt-1.5 text-[10px] text-slate-500">{log.catatan}</p>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[9px] text-slate-400">
          Frekuensi kalibrasi: 6 bulan atau sesuai rekomendasi pabrikan · BAPETEN / Kemenkes
        </p>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function QCPane() {
  const [pesawat, setPesawat] = useState<Pesawat[]>(PESAWAT_MOCK);
  const [selId,   setSelId]   = useState<string>(PESAWAT_MOCK[0].id);

  const selected = pesawat.find((p) => p.id === selId) ?? pesawat[0];
  const overdue  = pesawat.filter((p) => p.status === "Overdue").length;
  const segera   = pesawat.filter((p) => p.status === "Segera").length;

  const handleAddLog = (pesawatId: string, log: KalibrasiLog) => {
    setPesawat((prev) => prev.map((p) =>
      p.id !== pesawatId ? p : { ...p, logKalibrasi: [log, ...p.logKalibrasi] },
    ));
  };

  return (
    <div className="relative">

      {/* Dimmed content — not interactive */}
      <div className="pointer-events-none select-none opacity-30">
      <div className="flex flex-col gap-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Pesawat",       val: pesawat.length,                            color: "text-teal-600"    },
          { label: "Overdue Kalibrasi",   val: overdue, alert: overdue > 0,               color: "text-rose-600"    },
          { label: "Segera Kalibrasi",    val: segera,  alert: segera > 0,                color: "text-amber-600"   },
        ].map((s) => (
          <div key={s.label} className={cn(
            "rounded-xl border px-4 py-3",
            s.alert ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white",
          )}>
            <p className="text-[10px] text-slate-400">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.color)}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Two-panel */}
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        {/* Left: instrument list */}
        <div className="flex flex-col gap-2">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Pesawat Radiologi</p>
          {pesawat.map((p) => (
            <InstrumentCard key={p.id} p={p} active={selId === p.id} onClick={() => setSelId(p.id)} />
          ))}
          <p className="mt-1 px-1 text-[9px] text-slate-400">
            Standar: Perka BAPETEN No. 2/2018 · IAEA HH-19 §7
          </p>
        </div>

        {/* Right: detail */}
        <div className="overflow-y-auto">
          <AnimatePresence mode="wait">
            <DetailPanel key={selected.id} p={selected} onAddLog={handleAddLog} />
          </AnimatePresence>
        </div>
      </div>
    </div> {/* end flex col */}
    </div> {/* end dimmed wrapper */}

      {/* Disabled overlay */}
      <div className="absolute inset-0 flex items-start justify-center pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-6 text-center shadow-xl backdrop-blur-sm"
        >
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
            <Lock size={20} className="text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-700">Fitur Belum Diaktifkan</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
            QC Pesawat memerlukan setup awal bersama vendor kalibrasi dan Fisikawan Medik sebelum dapat digunakan.
            Aktifkan setelah jadwal kalibrasi pertama terdokumentasi.
          </p>
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Langkah Aktivasi</p>
            <div className="space-y-1 text-[10px] text-slate-500">
              <p>1. Hubungi BAPETEN atau vendor alat untuk jadwal kalibrasi</p>
              <p>2. Dokumentasikan sertifikat kalibrasi pertama</p>
              <p>3. Tetapkan Fisikawan Medik penanggung jawab</p>
              <p>4. Aktifkan tab ini setelah record pertama tersedia</p>
            </div>
          </div>
          <p className="mt-3 text-[9px] text-slate-400">Perka BAPETEN No. 2/2018 · IAEA HH-19 §7</p>
        </motion.div>
      </div>

    </div>
  );
}
