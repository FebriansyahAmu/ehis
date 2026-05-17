"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, Plus, FlaskConical, HeartPulse,
  Stethoscope, ChevronRight, Info, User, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FarmasiOrderItem } from "@/components/farmasi/farmasiShared";
import {
  type PTOEntry, type PTOObservasi, type PTOParameter, type PTOStatus,
  type MonitoringTipe,
  PTO_STATUS_CFG, TIPE_CLS, getPTOForItems, calcPTOStatus, getParamsForDrug,
} from "@/components/farmasi/pto/ptoShared";

// ── Props ────────────────────────────────────────────────

interface Props {
  items: FarmasiOrderItem[];
  noRM:  string;
}

// ── Sparkline ────────────────────────────────────────────

function Sparkline({ obs, param }: { obs: PTOObservasi[]; param: PTOParameter }) {
  const sorted = [...obs].filter((o) => o.paramId === param.id)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  if (sorted.length < 2) return null;

  const vals    = sorted.map((o) => o.nilai);
  const allVals = [...vals, param.targetMin ?? Infinity, param.targetMax ?? -Infinity]
    .filter(isFinite);
  const lo = Math.min(...allVals) * 0.92;
  const hi = Math.max(...allVals) * 1.08;
  const span = hi - lo || 1;

  const W = 280, H = 58, P = 14;
  const cx = (i: number) => P + (i / Math.max(sorted.length - 1, 1)) * (W - 2 * P);
  const cy = (v: number) => H - P - ((v - lo) / span) * (H - 2 * P);

  const path = sorted.map((o, i) => `${i === 0 ? "M" : "L"}${cx(i).toFixed(1)},${cy(o.nilai).toFixed(1)}`).join(" ");

  const tMinY = param.targetMin !== undefined ? cy(param.targetMin) : null;
  const tMaxY = param.targetMax !== undefined ? cy(param.targetMax) : null;

  const dotStroke: Record<PTOStatus, string> = {
    Normal: "#10b981", Rendah: "#f59e0b", Tinggi: "#f97316", Kritis: "#ef4444",
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {tMinY !== null && tMaxY !== null && (
        <rect x={P} y={tMaxY} width={W - 2 * P} height={tMinY - tMaxY}
          fill="#d1fae5" fillOpacity={0.6} rx={2} />
      )}
      {tMinY !== null && <line x1={P} y1={tMinY} x2={W - P} y2={tMinY} stroke="#10b981" strokeWidth={0.8} strokeDasharray="4 3" opacity={0.5} />}
      {tMaxY !== null && <line x1={P} y1={tMaxY} x2={W - P} y2={tMaxY} stroke="#10b981" strokeWidth={0.8} strokeDasharray="4 3" opacity={0.5} />}
      <path d={path} fill="none" stroke="#0ea5e9" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {sorted.map((o, i) => (
        <g key={o.id}>
          <circle cx={cx(i)} cy={cy(o.nilai)} r={3.5} fill="white" stroke={dotStroke[o.status]} strokeWidth={2} />
          {(i === 0 || i === sorted.length - 1) && (
            <text x={cx(i)} y={cy(o.nilai) - 6} textAnchor="middle" fontSize={7.5} fill="#64748b">{o.nilai}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── Tipe icon ─────────────────────────────────────────────

const TipeIcon: Record<MonitoringTipe, typeof FlaskConical> = {
  Lab:            FlaskConical,
  "Tanda Vital":  HeartPulse,
  Klinis:         Stethoscope,
};

// ── Drug card (left panel) ────────────────────────────────

function DrugCard({
  entry, active, onClick,
}: { entry: PTOEntry; active: boolean; onClick: () => void }) {
  const latest = [...entry.observasi]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0];
  const cfg = latest ? PTO_STATUS_CFG[latest.status] : null;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all duration-150",
        active
          ? "border-sky-300 bg-sky-50 shadow-sm"
          : "border-slate-100 bg-white hover:border-sky-200 hover:bg-sky-50/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            {entry.isHAM && (
              <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 px-1 py-0.5 text-[9px] font-bold text-rose-600 ring-1 ring-rose-200">
                <AlertTriangle size={7} />HAM
              </span>
            )}
            <span className="truncate text-xs font-semibold text-slate-800">{entry.namaObat}</span>
          </div>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {entry.parameter.length} parameter · {entry.observasi.length} observasi
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {cfg && (
            <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold", cfg.badge)}>
              {cfg.label}
            </span>
          )}
          <ChevronRight size={12} className={active ? "text-sky-500" : "text-slate-300"} />
        </div>
      </div>
      {latest && (
        <p className="mt-1.5 text-[10px] text-slate-400">
          Terakhir: {latest.tanggal} · <span className="tabular-nums font-medium text-slate-600">{latest.nilai}</span>
          <span className="ml-0.5 text-slate-400">({entry.parameter.find((p) => p.id === latest.paramId)?.satuan})</span>
        </p>
      )}
    </motion.button>
  );
}

// ── Add observation form ──────────────────────────────────

interface ObsForm { nilai: string; tanggal: string; catatan: string; rekomendasi: string; apoteker: string }

function AddObsForm({
  param, onSave, onCancel,
}: { param: PTOParameter; onSave: (o: Omit<PTOObservasi, "id">) => void; onCancel: () => void }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<ObsForm>({ nilai: "", tanggal: today, catatan: "", rekomendasi: "", apoteker: "" });

  const nilaiNum = parseFloat(form.nilai);
  const valid    = !isNaN(nilaiNum) && form.apoteker.trim().length > 0;

  function handleSave() {
    if (!valid) return;
    const status = calcPTOStatus(nilaiNum, param.targetMin, param.targetMax);
    onSave({ paramId: param.id, tanggal: form.tanggal, nilai: nilaiNum, status, catatan: form.catatan || undefined, rekomendasi: form.rekomendasi || undefined, apoteker: form.apoteker });
  }

  const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
  const lbl = "mb-1 block text-xs font-semibold text-slate-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-xl border border-sky-200 bg-sky-50/40 p-4 space-y-3"
    >
      <p className="text-xs font-bold text-sky-700">Tambah Observasi — {param.nama}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Nilai ({param.satuan})</label>
          <input type="number" step="0.1" value={form.nilai}
            onChange={(e) => setForm((f) => ({ ...f, nilai: e.target.value }))}
            placeholder={param.targetMin ? `Target: ${param.targetMin}–${param.targetMax}` : ""}
            className={inp} />
        </div>
        <div>
          <label className={lbl}>Tanggal</label>
          <input type="date" value={form.tanggal}
            onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
            className={inp} />
        </div>
      </div>

      <div>
        <label className={lbl}>Catatan <span className="font-normal text-slate-400">(opsional)</span></label>
        <input type="text" value={form.catatan}
          onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
          placeholder="Kondisi klinis pasien saat pengambilan sampel"
          className={inp} />
      </div>

      <div>
        <label className={lbl}>Rekomendasi <span className="font-normal text-slate-400">(opsional)</span></label>
        <input type="text" value={form.rekomendasi}
          onChange={(e) => setForm((f) => ({ ...f, rekomendasi: e.target.value }))}
          placeholder="Tindak lanjut yang direkomendasikan"
          className={inp} />
      </div>

      <div>
        <label className={lbl}><User size={10} className="inline mr-1" />Apoteker</label>
        <input type="text" value={form.apoteker}
          onChange={(e) => setForm((f) => ({ ...f, apoteker: e.target.value }))}
          placeholder="Apt. Nama, S.Farm."
          className={inp} />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
          Batal
        </button>
        <button onClick={handleSave} disabled={!valid}
          className={cn("flex-1 rounded-lg py-2 text-xs font-bold transition-all",
            valid ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95" : "cursor-not-allowed bg-slate-100 text-slate-400")}>
          Simpan
        </button>
      </div>
    </motion.div>
  );
}

// ── Right panel — detail ──────────────────────────────────

function DetailPanel({ entry, onAddObs }: {
  entry: PTOEntry;
  onAddObs: (entryId: string, obs: Omit<PTOObservasi, "id">) => void;
}) {
  const [activeParam, setActiveParam] = useState(entry.parameter[0]?.id ?? "");
  const [showForm,    setShowForm]    = useState(false);

  const param     = entry.parameter.find((p) => p.id === activeParam) ?? entry.parameter[0];
  const obsForParam = [...entry.observasi]
    .filter((o) => o.paramId === param?.id)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const TipeIco = param ? TipeIcon[param.tipe] : FlaskConical;

  return (
    <div className="flex h-full flex-col gap-4 p-5">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            {entry.isHAM && (
              <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 ring-1 ring-rose-200">
                <AlertTriangle size={8} />HAM
              </span>
            )}
            <h3 className="text-sm font-bold text-slate-900">{entry.namaObat}</h3>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">Pemantauan Terapi Obat · SNARS PKPO 7</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
            showForm
              ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              : "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
          )}
        >
          <Plus size={12} />
          {showForm ? "Batal" : "Tambah Observasi"}
        </button>
      </div>

      {/* Parameter tabs */}
      {entry.parameter.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.parameter.map((p) => {
            const Icon = TipeIcon[p.tipe];
            return (
              <button key={p.id} onClick={() => { setActiveParam(p.id); setShowForm(false); }}
                className={cn(
                  "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all",
                  activeParam === p.id
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                )}
              >
                <Icon size={10} className={activeParam === p.id ? "text-sky-500" : "text-slate-400"} />
                {p.nama}
              </button>
            );
          })}
        </div>
      )}

      {param && (
        <>
          {/* Parameter meta */}
          <div className="flex flex-wrap gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Parameter</p>
              <p className="text-xs font-semibold text-slate-700">{param.nama} ({param.satuan})</p>
            </div>
            {param.targetMin !== undefined && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Target</p>
                <p className="text-xs font-semibold text-emerald-700">{param.targetMin} – {param.targetMax} {param.satuan}</p>
              </div>
            )}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Frekuensi</p>
              <p className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <TipeIco size={10} className={TIPE_CLS[param.tipe]} />
                {param.frekuensi}
              </p>
            </div>
          </div>

          {/* Sparkline */}
          {obsForParam.length >= 2 && (
            <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tren {param.nama}</p>
              <Sparkline obs={entry.observasi} param={param} />
              <div className="mt-1 flex items-center gap-3 text-[9px] text-slate-400">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-emerald-100 ring-1 ring-emerald-300" />Area target</span>
                <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-sky-400" />Nilai aktual</span>
              </div>
            </div>
          )}

          {/* Add form */}
          <AnimatePresence>
            {showForm && (
              <AddObsForm
                key="addform"
                param={param}
                onSave={(obs) => { onAddObs(entry.id, obs); setShowForm(false); }}
                onCancel={() => setShowForm(false)}
              />
            )}
          </AnimatePresence>

          {/* Observation history */}
          <div className="flex-1 overflow-y-auto">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Riwayat Observasi</p>
            {obsForParam.length === 0 ? (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 py-8 text-center">
                <Activity size={20} className="mb-1.5 text-slate-300" />
                <p className="text-xs text-slate-400">Belum ada observasi</p>
              </div>
            ) : (
              <div className="space-y-2">
                {obsForParam.map((obs, i) => {
                  const cfg = PTO_STATUS_CFG[obs.status];
                  return (
                    <motion.div
                      key={obs.id}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={cn("rounded-xl border border-slate-100 p-3", cfg.row)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 shrink-0 rounded-full", cfg.dot)} />
                          <span className="text-sm font-bold tabular-nums text-slate-900">
                            {obs.nilai} <span className="text-xs font-normal text-slate-400">{param.satuan}</span>
                          </span>
                          <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold", cfg.badge)}>{cfg.label}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Calendar size={9} />{obs.tanggal}
                        </div>
                      </div>
                      {obs.catatan && <p className="mt-1.5 text-[11px] text-slate-500">{obs.catatan}</p>}
                      {obs.rekomendasi && (
                        <div className="mt-1.5 flex items-start gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5">
                          <Info size={10} className="mt-0.5 shrink-0 text-sky-500" />
                          <p className="text-[11px] font-medium text-sky-700">{obs.rekomendasi}</p>
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                        <User size={9} />{obs.apoteker}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function PTOPane({ items }: Props) {
  const itemIds = items.map((i) => i.id);

  const [entries, setEntries] = useState<PTOEntry[]>(() => {
    const existing = getPTOForItems(itemIds);
    const existingIds = new Set(existing.map((e) => e.resepItemId));
    const stubs = items
      .filter((i) => !existingIds.has(i.id) && getParamsForDrug(i.namaObat).length > 0)
      .map((i, idx) => ({
        id:          `pto-new-${idx}`,
        resepItemId: i.id,
        namaObat:    i.namaObat,
        isHAM:       i.isHAM,
        parameter:   getParamsForDrug(i.namaObat),
        observasi:   [],
      } satisfies PTOEntry));
    return [...existing, ...stubs];
  });

  const [selected, setSelected] = useState<string>(entries[0]?.id ?? "");

  function handleAddObs(entryId: string, obs: Omit<PTOObservasi, "id">) {
    setEntries((prev) => prev.map((e) =>
      e.id !== entryId ? e : {
        ...e,
        observasi: [...e.observasi, { id: `obs-local-${Date.now()}`, ...obs }],
      },
    ));
  }

  const active = entries.find((e) => e.id === selected);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
        <Activity size={28} className="mb-2 text-slate-300" />
        <p className="font-medium text-slate-500">Tidak ada obat yang perlu monitoring PTO</p>
        <p className="mt-1 text-sm text-slate-400">Tidak ada parameter monitoring terstandar untuk obat dalam order ini</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ minHeight: 520 }}>

      {/* Left panel — drug list */}
      <div className="flex w-64 shrink-0 flex-col border-r border-slate-100 bg-slate-50/60">
        <div className="border-b border-slate-100 px-3 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100">
              <Activity size={13} className="text-sky-600" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">Monitoring PTO</p>
              <p className="text-[10px] text-slate-400">SNARS PKPO 7</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-2">
          <AnimatePresence>
            {entries.map((entry, i) => (
              <motion.div key={entry.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <DrugCard entry={entry} active={selected === entry.id} onClick={() => setSelected(entry.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="border-t border-slate-100 px-3 py-2.5">
          <p className="text-[9px] text-slate-400">{entries.length} obat dipantau · {entries.reduce((s, e) => s + e.observasi.length, 0)} total observasi</p>
        </div>
      </div>

      {/* Right panel — detail */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div key={active.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <DetailPanel entry={active} onAddObs={handleAddObs} />
            </motion.div>
          ) : (
            <motion.div key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center"
            >
              <Activity size={24} className="text-slate-300" />
              <p className="text-sm text-slate-400">Pilih obat di sebelah kiri</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
