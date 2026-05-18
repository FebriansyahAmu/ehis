"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  FileWarning, Plus, X, CalendarDays, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EQA_PROGRAMS_MOCK, EQA_STATUS_CFG, MODALITAS_COLOR,
  type EQAProgram, type EQASiklus, type EQAStatus,
} from "./radManajemenShared";

// ── Helpers ───────────────────────────────────────────────

function parseRef(acuan: string): number | null {
  const ge = acuan.match(/[≥≤]\s*([\d.]+)/);
  if (ge) return parseFloat(ge[1]);
  const rng = acuan.match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
  if (rng) return (parseFloat(rng[1]) + parseFloat(rng[2])) / 2;
  const pm = acuan.match(/(-?[\d.]+)\s*[±]\s*([\d.]+)/);
  if (pm) return parseFloat(pm[1]);
  return null;
}

function parseVal(s: string): number | null {
  const m = s.match(/-?[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

function calcDeviasi(nilaiRS: string, nilaiAcuan: string): number | null {
  const val = parseVal(nilaiRS);
  const ref = parseRef(nilaiAcuan);
  if (val === null || ref === null) return null;
  if (Math.abs(ref) < 0.001) return val;
  return parseFloat(((val - ref) / Math.abs(ref) * 100).toFixed(1));
}

function deriveStatus(nilaiRS: string, nilaiAcuan: string): EQAStatus {
  const val = parseVal(nilaiRS);
  if (val === null || !nilaiRS.trim()) return "Pending";
  const ge = nilaiAcuan.match(/≥\s*([\d.]+)/);
  if (ge) return val >= parseFloat(ge[1]) ? "Lulus" : "Tidak Lulus";
  const le = nilaiAcuan.match(/≤\s*([\d.]+)/);
  if (le) return val <= parseFloat(le[1]) ? "Lulus" : "Tidak Lulus";
  const rng = nilaiAcuan.match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
  if (rng) {
    const lo = parseFloat(rng[1]), hi = parseFloat(rng[2]);
    return val >= lo && val <= hi ? "Lulus" : "Tidak Lulus";
  }
  const pm = nilaiAcuan.match(/(-?[\d.]+)\s*[±]\s*([\d.]+)/);
  if (pm) {
    const c = parseFloat(pm[1]), r = parseFloat(pm[2]);
    return val >= c - r && val <= c + r ? "Lulus" : "Tidak Lulus";
  }
  const dev = calcDeviasi(nilaiRS, nilaiAcuan);
  return dev !== null && Math.abs(dev) <= 10 ? "Lulus" : "Tidak Lulus";
}

function extractUnit(parameter: string): string {
  const m = parameter.match(/\(([^)]+)\)$/);
  return m ? m[1] : "";
}

function getUniqueParams(prog: EQAProgram) {
  const seen = new Set<string>();
  return prog.siklus
    .filter((s) => { const ok = !seen.has(s.parameter); seen.add(s.parameter); return ok; })
    .map((s) => ({ parameter: s.parameter, nilaiAcuan: s.nilaiAcuan }));
}

// ── Deviasi Bar ────────────────────────────────────────────

function DeviasiBar({ deviasi }: { deviasi: number }) {
  const abs    = Math.abs(deviasi);
  const pct    = Math.min(abs / 20 * 100, 100);
  const isNeg  = deviasi < 0;
  const barCls = abs <= 5 ? "bg-emerald-500" : abs <= 10 ? "bg-amber-400" : "bg-rose-500";
  const txtCls = abs <= 5 ? "text-emerald-700" : abs <= 10 ? "text-amber-700" : "text-rose-700";
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }}
          className={cn("h-2 rounded-full", isNeg ? "ml-auto" : "", barCls)}
        />
      </div>
      <span className={cn("shrink-0 text-[10px] font-semibold w-12 text-right", txtCls)}>
        {deviasi > 0 ? "+" : ""}{deviasi.toFixed(1)}%
      </span>
    </div>
  );
}

// ── Siklus Table ──────────────────────────────────────────

function SiklusTable({ siklus }: { siklus: EQASiklus[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1.5">
      {siklus.map((s, i) => {
        const isOpen  = openId === s.id;
        const hasCata = Boolean(s.catatan);
        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={cn("rounded-lg border", s.status === "Tidak Lulus" ? "border-rose-200 bg-rose-50/40" : "border-slate-100 bg-white")}
          >
            <button
              onClick={() => hasCata && setOpenId(isOpen ? null : s.id)}
              className="grid w-full items-center gap-2 px-3 py-2.5 text-left grid-cols-[1fr_80px_90px_20px]"
            >
              <div>
                <p className="text-[11px] font-medium text-slate-700">{s.parameter}</p>
                <p className="text-[9px] text-slate-400">{s.tanggal}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-slate-700">{s.nilaiRS}</p>
                <p className="text-[9px] text-slate-400">Acuan: {s.nilaiAcuan}</p>
              </div>
              <DeviasiBar deviasi={s.deviasi} />
              <div className="flex items-center justify-end">
                {hasCata && (isOpen
                  ? <ChevronUp size={11} className="text-slate-400" />
                  : <ChevronDown size={11} className="text-slate-400" />
                )}
              </div>
            </button>
            <AnimatePresence>
              {isOpen && s.catatan && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 border-t border-rose-100 px-3 pb-2.5 pt-2">
                    <FileWarning size={11} className="mt-0.5 shrink-0 text-rose-500" />
                    <p className="text-[10px] text-rose-700">{s.catatan}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
      <p className="px-3 pt-1 text-[9px] text-slate-400">Deviasi: hijau &lt;5% · amber 5–10% · merah &gt;10%</p>
    </div>
  );
}

// ── Param Row (Form) ──────────────────────────────────────

function ParamRow({ parameter, nilaiAcuan, nilaiRS, catatan, onChangeNilai, onChangeCatatan }: {
  parameter: string; nilaiAcuan: string;
  nilaiRS: string; catatan: string;
  onChangeNilai: (v: string) => void;
  onChangeCatatan: (v: string) => void;
}) {
  const unit    = extractUnit(parameter);
  const deviasi = nilaiRS.trim() ? calcDeviasi(nilaiRS, nilaiAcuan) : null;
  const status  = nilaiRS.trim() ? deriveStatus(nilaiRS, nilaiAcuan) : null;

  return (
    <div className={cn(
      "rounded-xl border p-3 transition-colors",
      status === "Tidak Lulus" ? "border-rose-200 bg-rose-50/30" : "border-slate-100 bg-white",
    )}>
      <div className="grid grid-cols-[1fr_110px_150px] items-center gap-3">
        <div>
          <p className="text-[11px] font-semibold text-slate-700">{parameter}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">Acuan: {nilaiAcuan}</p>
        </div>
        <input
          type="text" value={nilaiRS}
          onChange={(e) => onChangeNilai(e.target.value)}
          placeholder={unit ? `Nilai (${unit})` : "Nilai ukur"}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-800 placeholder:text-slate-300 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-200"
        />
        {deviasi !== null && status ? (
          <div className="flex items-center gap-1.5">
            <div className="flex-1"><DeviasiBar deviasi={deviasi} /></div>
            <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold", EQA_STATUS_CFG[status].badge)}>
              {status === "Tidak Lulus" ? "Gagal" : "Lulus"}
            </span>
          </div>
        ) : (
          <p className="text-[9px] text-slate-300 text-center">— masukkan nilai</p>
        )}
      </div>
      <AnimatePresence>
        {status === "Tidak Lulus" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
          >
            <textarea
              value={catatan} onChange={(e) => onChangeCatatan(e.target.value)}
              placeholder="Catatan investigasi & tindak lanjut..."
              rows={2}
              className="mt-2 w-full rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 placeholder:text-slate-300 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-200 resize-none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Add EQA Form ──────────────────────────────────────────

function AddEQAForm({ programs, onClose, onSubmit }: {
  programs: EQAProgram[];
  onClose: () => void;
  onSubmit: (progId: string, siklus: EQASiklus[]) => void;
}) {
  const [progId,  setProgId]  = useState(programs[0].id);
  const [tanggal, setTanggal] = useState("2026-05-19");
  const [petugas, setPetugas] = useState("");
  const [values,  setValues]  = useState<Record<string, string>>({});
  const [catatan, setCatatan] = useState<Record<string, string>>({});

  const prog   = programs.find((p) => p.id === progId)!;
  const params = getUniqueParams(prog);

  function selectProg(id: string) {
    setProgId(id);
    setValues({});
    setCatatan({});
  }

  const anyValue = params.some((p) => values[p.parameter]?.trim());
  const isValid  = tanggal && petugas.trim() && anyValue;

  function handleSubmit() {
    const newSiklus: EQASiklus[] = params
      .filter((p) => values[p.parameter]?.trim())
      .map((p, i) => {
        const nilaiRS = values[p.parameter].trim();
        return {
          id:         `eq-${Date.now()}-${i}`,
          tanggal,
          parameter:  p.parameter,
          nilaiRS,
          nilaiAcuan: p.nilaiAcuan,
          deviasi:    calcDeviasi(nilaiRS, p.nilaiAcuan) ?? 0,
          status:     deriveStatus(nilaiRS, p.nilaiAcuan),
          catatan:    catatan[p.parameter]?.trim() || undefined,
        };
      });
    onSubmit(progId, newSiklus);
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border border-teal-200 bg-linear-to-b from-teal-50 to-white p-5 mb-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[12px] font-bold text-slate-800">Tambah Hasil Phantom Test</p>
            <p className="text-[10px] text-slate-400">Satu siklus pengujian per program per tanggal</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Program selector */}
        <div className="mb-4">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">Program</p>
          <div className="flex gap-2 flex-wrap">
            {programs.map((p) => (
              <button
                key={p.id} onClick={() => selectProg(p.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition-all",
                  progId === p.id
                    ? "border-teal-300 bg-teal-50 text-teal-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", MODALITAS_COLOR[p.modalitas])} />
                {p.modalitas} — {p.nama.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Tanggal + Petugas */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-slate-400">
              <CalendarDays size={9} className="inline mr-1" />Tanggal Uji
            </label>
            <input
              type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-800 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-slate-400">
              <User size={9} className="inline mr-1" />Petugas
            </label>
            <input
              type="text" value={petugas} onChange={(e) => setPetugas(e.target.value)}
              placeholder="Fisikawan Medik / Radiografer"
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-800 placeholder:text-slate-300 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-200"
            />
          </div>
        </div>

        {/* Parameters */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Parameter Pengujian</p>
            <p className="text-[9px] text-slate-400">{params.length} parameter · {prog.provider}</p>
          </div>
          <div className="flex flex-col gap-2">
            {params.map((p) => (
              <ParamRow
                key={p.parameter}
                parameter={p.parameter} nilaiAcuan={p.nilaiAcuan}
                nilaiRS={values[p.parameter] ?? ""}
                catatan={catatan[p.parameter] ?? ""}
                onChangeNilai={(v) => setValues((prev) => ({ ...prev, [p.parameter]: v }))}
                onChangeCatatan={(v) => setCatatan((prev) => ({ ...prev, [p.parameter]: v }))}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="text-[9px] text-slate-400">IAEA HH-19 · ACR · AAPM TG-18 · Deviasi &amp; status dihitung otomatis</p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >Batal</button>
            <button
              onClick={handleSubmit} disabled={!isValid}
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-[11px] font-bold text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Simpan Hasil</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Program Card ──────────────────────────────────────────

function ProgramCard({ prog }: { prog: EQAProgram }) {
  const [expanded, setExpanded] = useState(true);
  const lulusCount   = prog.siklus.filter((s) => s.status === "Lulus").length;
  const tidakLulus   = prog.siklus.filter((s) => s.status === "Tidak Lulus").length;
  const pendingCount = prog.siklus.filter((s) => s.status === "Pending").length;
  const hasFailure   = tidakLulus > 0;

  return (
    <div className={cn("rounded-2xl border bg-white overflow-hidden", hasFailure ? "border-rose-200" : "border-slate-200")}>
      <button onClick={() => setExpanded((v) => !v)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", MODALITAS_COLOR[prog.modalitas] ?? "bg-slate-500")}>
          <FlaskConical size={15} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-slate-800">{prog.nama}</p>
          <p className="text-[10px] text-slate-400">{prog.provider} · {prog.tahun}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 size={10} /> {lulusCount} Lulus
            </span>
            {tidakLulus > 0 && (
              <span className="flex items-center gap-1 text-rose-600 font-semibold">
                <AlertTriangle size={10} /> {tidakLulus} Tidak Lulus
              </span>
            )}
            {pendingCount > 0 && <span className="text-slate-400">{pendingCount} Pending</span>}
          </div>
          {expanded ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {hasFailure && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
          >
            <div className="mx-4 mb-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertTriangle size={13} className="mt-0.5 shrink-0 text-rose-600" />
              <div>
                <p className="text-[11px] font-bold text-rose-800">CAPA Diperlukan — {tidakLulus} Parameter Tidak Lulus</p>
                <p className="text-[10px] text-rose-600 mt-0.5">
                  Corrective and Preventive Action wajib dilakukan sebelum siklus berikutnya.
                  Dokumentasikan akar masalah, tindakan korektif, dan jadwal verifikasi perbaikan.
                  IAEA HH-19 · ACR Accreditation Requirements.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-5 pb-4 pt-3">
              <div className="mb-2 grid grid-cols-[1fr_80px_90px_20px] gap-2 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                <span>Parameter</span>
                <span className="text-right">Nilai RS</span>
                <span>Deviasi</span>
                <span />
              </div>
              <SiklusTable siklus={prog.siklus} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function EQAPane() {
  const [programs, setPrograms] = useState<EQAProgram[]>(EQA_PROGRAMS_MOCK);
  const [showForm, setShowForm] = useState(false);

  function handleSubmit(progId: string, newSiklus: EQASiklus[]) {
    setPrograms((prev) =>
      prev.map((p) => p.id === progId ? { ...p, siklus: [...p.siklus, ...newSiklus] } : p)
    );
    setShowForm(false);
  }

  const totalSiklus = programs.flatMap((p) => p.siklus);
  const totalLulus  = totalSiklus.filter((s) => s.status === "Lulus").length;
  const totalTidak  = totalSiklus.filter((s) => s.status === "Tidak Lulus").length;
  const hasCapa     = totalTidak > 0;

  const stats = [
    { label: "Program Aktif", val: programs.length,    color: "text-teal-700",    alert: false },
    { label: "Total Siklus",  val: totalSiklus.length, color: "text-slate-700",   alert: false },
    { label: "Lulus",         val: totalLulus,          color: "text-emerald-700", alert: false },
    { label: "Tidak Lulus",   val: totalTidak,          color: totalTidak > 0 ? "text-rose-600" : "text-slate-400", alert: totalTidak > 0 },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[13px] font-bold text-slate-800">EQA & Phantom Test Radiologi</p>
          <p className="text-[11px] text-slate-400">IAEA HH-19 · ACR Accreditation Program · AAPM</p>
        </div>
        <div className="flex items-center gap-2">
          {hasCapa && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
              <AlertTriangle size={13} className="text-rose-600" />
              <p className="text-[11px] font-semibold text-rose-700">{totalTidak} parameter perlu CAPA</p>
            </div>
          )}
          <button
            onClick={() => setShowForm((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-semibold transition-all",
              showForm
                ? "border-teal-300 bg-teal-50 text-teal-700"
                : "border-teal-200 bg-white text-teal-700 hover:bg-teal-50",
            )}
          >
            <Plus size={13} className={cn("transition-transform duration-200", showForm && "rotate-45")} />
            Tambah Hasil
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={cn(
            "rounded-xl border px-4 py-3",
            s.alert ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white",
          )}>
            <p className="text-[10px] text-slate-400">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.color)}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Reference info */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-[10px] font-semibold text-slate-600 mb-1">Standar Acuan Program EQA / Phantom Test</p>
        <div className="grid grid-cols-3 gap-3 text-[10px] text-slate-500">
          <div>
            <p className="font-semibold text-slate-600">CT — AAPM TG-18</p>
            <p>CTDIvol · Noise · Uniformitas HU · Resolusi kontras rendah</p>
          </div>
          <div>
            <p className="font-semibold text-slate-600">USG — AIUM / SMPTE</p>
            <p>Akurasi jarak · Dead zone · Penetrasi kedalaman · Resolusi aksial</p>
          </div>
          <div>
            <p className="font-semibold text-slate-600">MRI — ACR</p>
            <p>SNR · Uniformitas gambar · Resolusi spasial · Ketebalan irisan</p>
          </div>
        </div>
      </div>

      {/* Add form (slide-in) */}
      <AnimatePresence>
        {showForm && (
          <AddEQAForm
            programs={programs}
            onClose={() => setShowForm(false)}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>

      {/* Program cards */}
      <div className="flex flex-col gap-3">
        {programs.map((prog, i) => (
          <motion.div
            key={prog.id}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
          >
            <ProgramCard prog={prog} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
