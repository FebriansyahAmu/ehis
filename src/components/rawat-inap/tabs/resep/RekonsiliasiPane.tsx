"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Plus, Pencil, Check, X, Home, AlertCircle, ChevronDown } from "lucide-react";
import type { RawatInapPatientDetail, RekonsiliasItem, DecisionRekonsiliasi } from "@/lib/data";
import { cn } from "@/lib/utils";
import { DECISION_CONFIG } from "@/components/shared/resep/resepShared";

// ── Types ─────────────────────────────────────────────────

interface Props {
  rekonsiliasi: RekonsiliasItem[];
  patient:      RawatInapPatientDetail;
  onUpdate:     (item: RekonsiliasItem) => void;
  onAdd:        (item: RekonsiliasItem) => void;
}

const DECISION_OPTS: DecisionRekonsiliasi[] = ["Lanjutkan", "Hentikan", "Ganti", "Tunda"];
const SUMBER_OPTS = ["Rumah", "IGD", "Rawat Jalan"] as const;

const DECISION_LABEL: Record<DecisionRekonsiliasi, string> = {
  Lanjutkan: "Lanjutkan seperti semula",
  Hentikan:  "Hentikan — tidak diperlukan saat RI",
  Ganti:     "Ganti dengan obat / rute / dosis lain",
  Tunda:     "Tunda — evaluasi ulang",
};

// ── Row with inline edit ──────────────────────────────────

function RekRow({
  item, index, onUpdate,
}: {
  item:     RekonsiliasItem;
  index:    number;
  onUpdate: (item: RekonsiliasItem) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState({ ...item });
  const cfg = DECISION_CONFIG[item.decision];

  const d = <K extends keyof RekonsiliasItem>(k: K, v: RekonsiliasItem[K]) =>
    setDraft((p) => ({ ...p, [k]: v }));

  function save() { onUpdate(draft); setEditing(false); }
  function cancel() { setDraft({ ...item }); setEditing(false); }

  return (
    <motion.div
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.05 }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
          <Home size={12} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-xs font-semibold text-slate-800">{item.namaObat}</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              {item.sumber}
            </span>
          </div>
          {!editing && (
            <>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {item.dosis} · {item.signa}
              </p>
              {item.alasan && (
                <p className="mt-1 text-[11px] italic text-slate-400">"{item.alasan}"</p>
              )}
              {item.gantiDengan && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-sky-600">
                  → Ganti dengan: <span className="font-semibold">{item.gantiDengan}</span>
                </p>
              )}
            </>
          )}
        </div>
        {!editing && (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1", cfg.cls)}>
              {item.decision}
            </span>
            <button type="button" onClick={() => setEditing(true)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-0.5 text-[10px] text-slate-400 transition hover:border-indigo-200 hover:text-indigo-600">
              <Pencil size={9} />Edit
            </button>
          </div>
        )}
      </div>

      {/* Inline edit */}
      {editing && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-3 pb-3 pt-2.5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-indigo-500">Edit Keputusan Rekonsiliasi</p>

          <div className="mb-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Keputusan</p>
            <div className="grid grid-cols-2 gap-1.5">
              {DECISION_OPTS.map((opt) => {
                const c = DECISION_CONFIG[opt];
                return (
                  <button key={opt} type="button" onClick={() => d("decision", opt)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[11px] font-medium transition",
                      draft.decision === opt
                        ? cn(c.cls, "border-transparent")
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                    )}>
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", c.dot)} />
                    {opt}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[10px] italic text-slate-400">{DECISION_LABEL[draft.decision]}</p>
          </div>

          {draft.decision === "Ganti" && (
            <div className="mb-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ganti Dengan</p>
              <input value={draft.gantiDengan ?? ""} onChange={(e) => d("gantiDengan", e.target.value)}
                placeholder="Nama obat / dosis / rute pengganti..."
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-indigo-400" />
            </div>
          )}

          <div className="mb-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Alasan / Klinis</p>
            <textarea rows={2} value={draft.alasan ?? ""} onChange={(e) => d("alasan", e.target.value)}
              placeholder="Alasan klinis keputusan rekonsiliasi..."
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-400" />
          </div>

          <div className="flex justify-end gap-1.5">
            <button onClick={cancel}
              className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 px-3 text-[11px] text-slate-500 hover:bg-slate-100">
              <X size={10} />Batal
            </button>
            <button onClick={save}
              className="flex h-7 items-center gap-1 rounded-lg bg-indigo-600 px-3 text-[11px] font-semibold text-white hover:bg-indigo-700">
              <Check size={10} />Simpan
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Add new form ──────────────────────────────────────────

function AddForm({ onAdd, dokterPj }: { onAdd: (item: RekonsiliasItem) => void; dokterPj: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ namaObat: "", dosis: "", signa: "1×1", sumber: "Rumah" as "Rumah" | "IGD" | "Rawat Jalan", decision: "Lanjutkan" as DecisionRekonsiliasi, gantiDengan: "", alasan: "" });

  function submit() {
    if (!form.namaObat) return;
    onAdd({
      id:           `rk-${Date.now()}`,
      namaObat:     form.namaObat,
      dosis:        form.dosis,
      signa:        form.signa,
      sumber:       form.sumber,
      decision:     form.decision,
      gantiDengan:  form.gantiDengan || undefined,
      alasan:       form.alasan || undefined,
      dokterPj,
      tanggal:      new Date().toISOString().slice(0, 10),
    });
    setForm({ namaObat: "", dosis: "", signa: "1×1", sumber: "Rumah", decision: "Lanjutkan", gantiDengan: "", alasan: "" });
    setOpen(false);
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white shadow-xs">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition hover:bg-slate-50">
        <Plus size={13} className="text-indigo-500" />
        <p className="text-xs font-semibold text-indigo-600">Tambah Obat Rekonsiliasi</p>
        <ChevronDown size={12} className={cn("ml-auto text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 px-4 pb-4 pt-3 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-1">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nama Obat *</p>
                <input value={form.namaObat} onChange={(e) => setForm((p) => ({ ...p, namaObat: e.target.value }))}
                  placeholder="Nama obat dari rumah..." className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-indigo-400" />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Dosis</p>
                <input value={form.dosis} onChange={(e) => setForm((p) => ({ ...p, dosis: e.target.value }))}
                  placeholder="5 mg" className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-indigo-400" />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Signa</p>
                <input value={form.signa} onChange={(e) => setForm((p) => ({ ...p, signa: e.target.value }))}
                  placeholder="1×1" className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-indigo-400" />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sumber</p>
                <select value={form.sumber} onChange={(e) => setForm((p) => ({ ...p, sumber: e.target.value as typeof form.sumber }))}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-indigo-400">
                  {SUMBER_OPTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Keputusan</p>
                <select value={form.decision} onChange={(e) => setForm((p) => ({ ...p, decision: e.target.value as DecisionRekonsiliasi }))}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-indigo-400">
                  {DECISION_OPTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Alasan / Klinis</p>
                <input value={form.alasan} onChange={(e) => setForm((p) => ({ ...p, alasan: e.target.value }))}
                  placeholder="Alasan klinis (opsional)..." className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-indigo-400" />
              </div>
              <div className="col-span-2 sm:col-span-3 flex justify-end">
                <button type="button" onClick={submit} disabled={!form.namaObat}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-40">
                  <Plus size={12} />Tambah
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────

export default function RekonsiliasiPane({ rekonsiliasi, patient, onUpdate, onAdd }: Props) {
  const completedCount = rekonsiliasi.filter((r) => r.decision !== "Tunda").length;

  return (
    <div className="flex flex-col gap-3">

      {/* Header info */}
      <div className="flex flex-wrap items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-3">
        <RefreshCw size={14} className="mt-0.5 shrink-0 text-sky-500" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-sky-800">Rekonsiliasi Obat — SNARS PP 3.1</p>
          <p className="mt-0.5 text-[11px] text-sky-600">
            Bandingkan obat dari rumah / pre-rawat dengan terapi RI saat ini. Setiap obat wajib mendapat keputusan dokter.
          </p>
        </div>
        {rekonsiliasi.length > 0 && (
          <span className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1",
            completedCount === rekonsiliasi.length
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-amber-50 text-amber-700 ring-amber-200",
          )}>
            {completedCount}/{rekonsiliasi.length} selesai
          </span>
        )}
      </div>

      {/* Warning if no home meds documented */}
      {!patient.obatSaatIni && rekonsiliasi.length === 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/40 px-4 py-3">
          <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-[11px] text-amber-700">
            Riwayat obat dari rumah tidak terdokumentasi. Lakukan rekonsiliasi manual dengan pasien / keluarga dan tambahkan di bawah.
          </p>
        </div>
      )}

      {/* Pre-admission meds hint */}
      {patient.obatSaatIni && (
        <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Home size={13} className="mt-0.5 shrink-0 text-slate-400" />
          <p className="text-[11px] text-slate-600">
            <span className="font-semibold">Obat dari rumah (anamnesis):</span> {patient.obatSaatIni}
          </p>
        </div>
      )}

      {/* Rekonsiliasi list */}
      {rekonsiliasi.length > 0 ? (
        <div className="flex flex-col gap-2">
          {rekonsiliasi.map((item, i) => (
            <RekRow key={item.id} item={item} index={i} onUpdate={onUpdate} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-10 text-center">
          <RefreshCw size={22} className="mb-2 text-slate-200" />
          <p className="text-xs text-slate-400">Belum ada data rekonsiliasi</p>
        </div>
      )}

      <AddForm onAdd={onAdd} dokterPj={patient.dpjp} />
    </div>
  );
}
