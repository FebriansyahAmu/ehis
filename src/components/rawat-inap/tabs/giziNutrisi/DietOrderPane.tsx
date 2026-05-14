"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, ChevronDown, Edit3, Save, UserCheck, Salad,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TIPE_DIET_OPTIONS, TEKSTUR_CFG,
  type DietOrder, type DietitianAddendum, type SkriningSummary, type Tekstur,
} from "./giziNutrisiShared";

// ── Helpers ───────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ── SkriningSummaryCard ────────────────────────────────────

const LEVEL_CFG = {
  low:  { label: "Risiko Rendah", card: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", score: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2, iconCls: "text-emerald-500" },
  mid:  { label: "Risiko Sedang", card: "bg-amber-50   border-amber-200",   text: "text-amber-800",   score: "bg-amber-100   text-amber-700",   Icon: AlertTriangle, iconCls: "text-amber-500"  },
  high: { label: "Risiko Tinggi", card: "bg-rose-50    border-rose-200",    text: "text-rose-800",    score: "bg-rose-100    text-rose-700",    Icon: AlertTriangle, iconCls: "text-rose-500"   },
} as const;

function SkriningSummaryCard({
  summary, rujuk, onRujuk,
}: {
  summary:  SkriningSummary;
  rujuk:    boolean;
  onRujuk:  (v: boolean) => void;
}) {
  const cfg   = LEVEL_CFG[summary.level];
  const Icon  = cfg.Icon;
  const isRisk = summary.level !== "low";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-start gap-3 rounded-xl border px-4 py-3", cfg.card)}
    >
      <Icon size={15} className={cn("mt-0.5 shrink-0", cfg.iconCls)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("text-xs font-semibold", cfg.text)}>Skrining Gizi NRS-2002</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", cfg.score)}>
            Skor {summary.score} — {cfg.label}
          </span>
        </div>
        <p className={cn("mt-0.5 text-[11px] opacity-70", cfg.text)}>
          {summary.tanggal} · {summary.petugas}
        </p>
      </div>
      {isRisk && (
        <button
          type="button"
          onClick={() => onRujuk(!rujuk)}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
            rujuk
              ? "bg-emerald-500 text-white hover:bg-emerald-600"
              : "bg-white text-amber-700 ring-1 ring-amber-300 hover:bg-amber-50",
          )}
        >
          {rujuk ? "✓ Dirujuk Dietitian" : "+ Rujuk Dietitian"}
        </button>
      )}
    </motion.div>
  );
}

// ── InfoChip (saved view helper) ─────────────────────────

function InfoChip({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <span className={cn(
        "text-xs font-semibold text-slate-700",
        cls && `rounded px-1.5 py-0.5 ring-1 ${cls}`,
      )}>
        {value}
      </span>
    </div>
  );
}

// ── DietOrderForm ─────────────────────────────────────────

function DietOrderForm({
  initial, onSave,
}: {
  initial: DietOrder | null;
  onSave:  (d: DietOrder) => void;
}) {
  const [editing, setEditing] = useState(!initial);
  const [form, setForm] = useState<DietOrder>(
    initial ?? { tipeDiet: "", kalori: "", tekstur: "biasa", batasan: "", orderedBy: "", orderedAt: "" },
  );

  function set<K extends keyof DietOrder>(k: K, v: DietOrder[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function save() {
    if (!form.tipeDiet) return;
    onSave({ ...form, orderedAt: form.orderedAt || new Date().toISOString() });
    setEditing(false);
  }

  // ── Saved read-only view ──
  if (!editing && initial) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <InfoChip label="Tipe Diet"     value={initial.tipeDiet} />
          <InfoChip label="Kalori Target" value={initial.kalori ? `${initial.kalori} kkal/hari` : "–"} />
          <InfoChip
            label="Tekstur"
            value={TEKSTUR_CFG[initial.tekstur].label}
            cls={TEKSTUR_CFG[initial.tekstur].cls}
          />
        </div>
        {initial.batasan && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-400">Batasan: </span>{initial.batasan}
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            {initial.orderedBy} · {fmtDateTime(initial.orderedAt)}
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Edit3 size={11} /> Edit
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Edit form ──
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
      {/* Tipe Diet */}
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tipe Diet *</p>
        <select
          value={form.tipeDiet}
          onChange={(e) => set("tipeDiet", e.target.value)}
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white"
        >
          <option value="">Pilih tipe diet...</option>
          {TIPE_DIET_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Kalori */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kalori Target</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={form.kalori}
              onChange={(e) => set("kalori", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="1700"
              className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white"
            />
            <span className="shrink-0 text-xs text-slate-400">kkal/hari</span>
          </div>
        </div>

        {/* Tekstur */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tekstur</p>
          <div className="flex gap-1.5">
            {(Object.keys(TEKSTUR_CFG) as Tekstur[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("tekstur", t)}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-[11px] font-semibold ring-1 transition-all",
                  form.tekstur === t
                    ? TEKSTUR_CFG[t].cls
                    : "bg-white text-slate-400 ring-slate-200 hover:bg-slate-50 hover:text-slate-600",
                )}
              >
                {TEKSTUR_CFG[t].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Batasan */}
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Batasan Khusus</p>
        <input
          value={form.batasan}
          onChange={(e) => set("batasan", e.target.value)}
          placeholder="Cth: Na < 2g/hari · cairan ≤ 1500ml/hari"
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white"
        />
      </div>

      {/* Footer: orderedBy + save */}
      <div className="flex items-center gap-2">
        <input
          value={form.orderedBy}
          onChange={(e) => set("orderedBy", e.target.value)}
          placeholder="Nama DPJP / petugas..."
          className="h-8 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-300"
        />
        <button
          type="button"
          onClick={save}
          disabled={!form.tipeDiet}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-40"
        >
          <Save size={12} /> Simpan
        </button>
      </div>
    </motion.div>
  );
}

// ── DietitianAddendum ─────────────────────────────────────

function DietitianAddendumSection({
  data, onChange,
}: {
  data:     DietitianAddendum | null;
  onChange: (d: DietitianAddendum) => void;
}) {
  const [open,  setOpen]  = useState(!!data);
  const [saved, setSaved] = useState(!!data);
  const [form,  setForm]  = useState<DietitianAddendum>(
    data ?? { nama: "", catatan: "", tanggal: new Date().toISOString().slice(0, 10) },
  );

  function set<K extends keyof DietitianAddendum>(k: K, v: DietitianAddendum[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    setSaved(false);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-teal-200 bg-teal-50/40">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition hover:bg-teal-50/80"
      >
        <UserCheck size={14} className="shrink-0 text-teal-600" />
        <span className="flex-1 text-xs font-semibold text-teal-800">Addendum Dietitian / Ahli Gizi</span>
        {saved && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700 ring-1 ring-teal-200"
          >
            ✓ Tersimpan
          </motion.span>
        )}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="text-teal-400"
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 border-t border-teal-100 px-4 py-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-teal-600">Nama Dietitian</p>
                  <input
                    value={form.nama}
                    onChange={(e) => set("nama", e.target.value)}
                    placeholder="Nama ahli gizi / dietitian..."
                    className="h-8 w-full rounded-lg border border-teal-200 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-teal-600">Tanggal Konsultasi</p>
                  <input
                    type="date"
                    value={form.tanggal}
                    onChange={(e) => set("tanggal", e.target.value)}
                    className="h-8 w-full rounded-lg border border-teal-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-teal-400"
                  />
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-teal-600">Catatan & Rekomendasi</p>
                <textarea
                  rows={3}
                  value={form.catatan}
                  onChange={(e) => set("catatan", e.target.value)}
                  placeholder="Rekomendasi diet, modifikasi tekstur, suplemen oral..."
                  className="w-full resize-none rounded-lg border border-teal-200 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-400"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { onChange(form); setSaved(true); }}
                  disabled={!form.nama || !form.catatan}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-teal-700 disabled:opacity-40"
                >
                  <Save size={11} /> Simpan Addendum
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────

export interface DietOrderPaneProps {
  rm:          string;
  skrining:    SkriningSummary | undefined;
  dietOrder:   DietOrder | null;
  addendum:    DietitianAddendum | null;
  rujuk:       boolean;
  onDietOrder: (d: DietOrder) => void;
  onAddendum:  (d: DietitianAddendum) => void;
  onRujuk:     (v: boolean) => void;
}

export default function DietOrderPane({
  skrining, dietOrder, addendum, rujuk, onDietOrder, onAddendum, onRujuk,
}: DietOrderPaneProps) {
  return (
    <div className="flex flex-col gap-3">

      {/* Skrining context banner */}
      {skrining && (
        <SkriningSummaryCard summary={skrining} rujuk={rujuk} onRujuk={onRujuk} />
      )}

      {/* Diet Order card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
          <Salad size={13} className="text-indigo-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Diet Order</span>
          <AnimatePresence>
            {dietOrder && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200"
              >
                ✓ Aktif
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="px-4 py-4">
          <DietOrderForm initial={dietOrder} onSave={onDietOrder} />
        </div>
      </div>

      {/* Dietitian addendum — only visible when rujuk=true */}
      <AnimatePresence>
        {rujuk && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <DietitianAddendumSection data={addendum} onChange={onAddendum} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
