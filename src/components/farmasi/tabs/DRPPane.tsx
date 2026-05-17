"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, ChevronRight, User, Calendar, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FarmasiOrder } from "@/components/farmasi/farmasiShared";
import {
  type DRPEntry, type ProblemCode, type CauseCode, type IntervensiCode, type OutcomeDRP,
  PROBLEM_CATALOG, CAUSE_CATALOG, INTERVENSI_CATALOG, OUTCOME_CATALOG, DOMAIN_CFG,
  getDRPForRM,
} from "@/components/farmasi/drp/drpShared";

// ── Props ─────────────────────────────────────────────────

interface Props { order: FarmasiOrder }

// ── Problem card (left panel) ─────────────────────────────

function ProblemCard({ entry, active, onClick }: {
  entry: DRPEntry; active: boolean; onClick: () => void;
}) {
  const prob   = PROBLEM_CATALOG[entry.problemCode];
  const domain = DOMAIN_CFG[prob.domain];
  const out    = OUTCOME_CATALOG[entry.outcome];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all duration-150",
        active ? "border-sky-300 bg-sky-50 shadow-sm" : "border-slate-100 bg-white hover:border-sky-200 hover:bg-sky-50/40",
        entry.statusTertutup && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold ring-1", domain.bg, domain.cls, domain.ring)}>
          {entry.problemCode} · {domain.label}
        </span>
        <ChevronRight size={11} className={active ? "text-sky-500" : "text-slate-300"} />
      </div>
      <p className="mt-1.5 text-[11px] font-semibold text-slate-700 line-clamp-2">{prob.label}</p>
      <div className="mt-1.5 flex items-center justify-between">
        <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-semibold ring-1 ring-slate-200", out.cls)}>
          {out.label}
        </span>
        <span className="flex items-center gap-0.5 text-[9px] text-slate-400">
          <Calendar size={8} />{entry.tanggal}
        </span>
      </div>
    </motion.button>
  );
}

// ── Detail view ───────────────────────────────────────────

function DetailView({ entry, onClose }: { entry: DRPEntry; onClose: () => void }) {
  const prob   = PROBLEM_CATALOG[entry.problemCode];
  const cause  = CAUSE_CATALOG[entry.causeCode];
  const interv = INTERVENSI_CATALOG[entry.intervensiCode];
  const out    = OUTCOME_CATALOG[entry.outcome];
  const domain = DOMAIN_CFG[prob.domain];

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-lg px-2.5 py-1 text-xs font-bold ring-1", domain.bg, domain.cls, domain.ring)}>
            {entry.problemCode} — {domain.label}
          </span>
          <span className={cn("rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-slate-200", out.cls)}>
            {out.label}
          </span>
        </div>
      </div>

      {/* Problem */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Masalah (PCNE V9)</p>
        <p className="text-xs font-bold text-slate-800">{prob.label}</p>
        <p className="text-[11px] text-slate-500">{prob.desc}</p>
      </div>

      {/* Description */}
      <div className="rounded-xl border border-slate-100 p-4">
        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Deskripsi Klinis</p>
        <p className="text-sm text-slate-700">{entry.deskripsi}</p>
      </div>

      {/* Cause */}
      <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-amber-600">Penyebab — {entry.causeCode}</p>
        <p className="text-xs font-semibold text-amber-700">{cause.label}</p>
      </div>

      {/* Intervention */}
      <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4">
        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-sky-600">Intervensi — {entry.intervensiCode}</p>
        <p className="text-xs font-semibold text-sky-700">{interv}</p>
        {entry.intervensiDetail && (
          <p className="mt-1 text-[11px] text-slate-600">{entry.intervensiDetail}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        <User size={10} />{entry.apoteker}
        <Calendar size={10} className="ml-2" />{entry.tanggal}
        {entry.statusTertutup && (
          <span className="ml-2 flex items-center gap-1 text-emerald-600">
            <CheckCircle size={10} />Tertutup
          </span>
        )}
      </div>
    </div>
  );
}

// ── New DRP form ──────────────────────────────────────────

type NewForm = {
  problemCode: ProblemCode; causeCode: CauseCode; deskripsi: string;
  intervensiCode: IntervensiCode; intervensiDetail: string;
  outcome: OutcomeDRP; apoteker: string; resepItemId: string;
};

const EMPTY_FORM: NewForm = {
  problemCode: "P1.1", causeCode: "C1.1", deskripsi: "",
  intervensiCode: "I0", intervensiDetail: "",
  outcome: "O0", apoteker: "", resepItemId: "",
};

function NewDRPForm({ noRM, obatList, onSave, onCancel }: {
  noRM: string;
  obatList: { id: string; nama: string }[];
  onSave: (d: DRPEntry) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<NewForm>({ ...EMPTY_FORM });
  const set = <K extends keyof NewForm>(k: K, v: NewForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.deskripsi.trim() && form.apoteker.trim();

  const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
  const sel = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
  const lbl = "mb-1 block text-xs font-semibold text-slate-600";

  const probCodes  = Object.keys(PROBLEM_CATALOG) as ProblemCode[];
  const causeCodes = Object.keys(CAUSE_CATALOG)   as CauseCode[];
  const intervCodes = Object.keys(INTERVENSI_CATALOG) as IntervensiCode[];
  const outCodes   = Object.keys(OUTCOME_CATALOG)  as OutcomeDRP[];

  function handleSave() {
    if (!valid) return;
    onSave({
      id: `drp-local-${Date.now()}`, noRM,
      resepItemId: form.resepItemId || undefined,
      tanggal: new Date().toISOString().split("T")[0],
      problemCode: form.problemCode, causeCode: form.causeCode,
      deskripsi: form.deskripsi,
      intervensiCode: form.intervensiCode,
      intervensiDetail: form.intervensiDetail || undefined,
      outcome: form.outcome, apoteker: form.apoteker,
      statusTertutup: false,
    });
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">DRP Baru — PCNE V9</p>
        <button onClick={onCancel} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={14} /></button>
      </div>

      <div>
        <label className={lbl}>Obat Terkait <span className="font-normal text-slate-400">(opsional)</span></label>
        <select value={form.resepItemId} onChange={(e) => set("resepItemId", e.target.value)} className={sel}>
          <option value="">Umum (tidak spesifik obat)</option>
          {obatList.map((o) => <option key={o.id} value={o.id}>{o.nama}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Kode Masalah</label>
          <select value={form.problemCode} onChange={(e) => set("problemCode", e.target.value as ProblemCode)} className={sel}>
            {probCodes.map((c) => (
              <option key={c} value={c}>{c} — {PROBLEM_CATALOG[c].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>Kode Penyebab</label>
          <select value={form.causeCode} onChange={(e) => set("causeCode", e.target.value as CauseCode)} className={sel}>
            {causeCodes.map((c) => (
              <option key={c} value={c}>{c} — {CAUSE_CATALOG[c].label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={lbl}>Deskripsi Klinis</label>
        <textarea rows={3} value={form.deskripsi} onChange={(e) => set("deskripsi", e.target.value)}
          placeholder="Jelaskan masalah yang ditemukan secara klinis..."
          className={cn(inp, "resize-none")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Intervensi</label>
          <select value={form.intervensiCode} onChange={(e) => set("intervensiCode", e.target.value as IntervensiCode)} className={sel}>
            {intervCodes.map((c) => (
              <option key={c} value={c}>{c} — {INTERVENSI_CATALOG[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>Outcome</label>
          <select value={form.outcome} onChange={(e) => set("outcome", e.target.value as OutcomeDRP)} className={sel}>
            {outCodes.map((c) => (
              <option key={c} value={c}>{OUTCOME_CATALOG[c].label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={lbl}>Detail Intervensi <span className="font-normal text-slate-400">(opsional)</span></label>
        <input value={form.intervensiDetail} onChange={(e) => set("intervensiDetail", e.target.value)}
          placeholder="Rekomendasi spesifik yang disampaikan..." className={inp} />
      </div>

      <div>
        <label className={lbl}><User size={10} className="inline mr-1" />Apoteker</label>
        <input value={form.apoteker} onChange={(e) => set("apoteker", e.target.value)}
          placeholder="Apt. Nama, S.Farm." className={inp} />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          Batal
        </button>
        <button onClick={handleSave} disabled={!valid}
          className={cn("flex-1 rounded-lg py-2 text-xs font-bold transition-all",
            valid ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95" : "cursor-not-allowed bg-slate-100 text-slate-400")}>
          Simpan DRP
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function DRPPane({ order }: Props) {
  const [entries,  setEntries]  = useState<DRPEntry[]>(() => getDRPForRM(order.noRM));
  const [selected, setSelected] = useState<string | null>(entries[0]?.id ?? null);
  const [showForm, setShowForm] = useState(false);

  function handleSave(d: DRPEntry) {
    setEntries((prev) => [d, ...prev]);
    setSelected(d.id);
    setShowForm(false);
  }

  const active   = entries.find((e) => e.id === selected);
  const obatList = order.items.map((i) => ({ id: i.id, nama: i.namaObat }));
  const open     = entries.filter((e) => !e.statusTertutup).length;
  const closed   = entries.filter((e) => e.statusTertutup).length;

  return (
    <div className="flex min-h-0 gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ minHeight: 520 }}>

      {/* Left panel */}
      <div className="flex w-64 shrink-0 flex-col border-r border-slate-100 bg-slate-50/60">
        <div className="border-b border-slate-100 px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                <ClipboardList size={13} className="text-amber-600" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Masalah Terkait Obat</p>
                <p className="text-[10px] text-slate-400">PCNE V9</p>
              </div>
            </div>
            <button onClick={() => { setShowForm(true); setSelected(null); }}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition">
              <Plus size={11} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-2">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <ClipboardList size={20} className="mb-1.5 text-slate-300" />
              <p className="text-[11px] text-slate-400">Belum ada DRP tercatat</p>
            </div>
          ) : (
            <AnimatePresence>
              {entries.map((entry, i) => (
                <motion.div key={entry.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ProblemCard entry={entry} active={selected === entry.id && !showForm}
                    onClick={() => { setSelected(entry.id); setShowForm(false); }} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="border-t border-slate-100 px-3 py-2.5">
          <p className="text-[9px] text-slate-400">{open} aktif · {closed} tertutup</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div key="form"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            >
              <NewDRPForm noRM={order.noRM} obatList={obatList} onSave={handleSave} onCancel={() => setShowForm(false)} />
            </motion.div>
          ) : active ? (
            <motion.div key={active.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            >
              <DetailView entry={active} onClose={() => setSelected(null)} />
            </motion.div>
          ) : (
            <motion.div key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center"
            >
              <ClipboardList size={24} className="text-slate-300" />
              <p className="text-sm text-slate-400">Pilih masalah atau dokumentasikan DRP baru</p>
              <button onClick={() => setShowForm(true)}
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700">
                <Plus size={12} />Tambah DRP
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
