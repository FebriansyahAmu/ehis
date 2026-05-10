"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Pill, AlertTriangle, Plus, Trash2, Pencil, Check, X, Info,
  Send, CheckCircle2, Clock, Package, ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ObatPulangItem } from "./dischargeShared";

type Props = {
  items:    ObatPulangItem[];
  onChange: (items: ObatPulangItem[]) => void;
};

type OrderStatus = "draft" | "terkirim" | "dikonfirmasi" | "siap";

const ORDER_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "draft",        label: "Draft",              icon: Clock          },
  { status: "terkirim",     label: "Terkirim",           icon: Send           },
  { status: "dikonfirmasi", label: "Konfirmasi Apt.",    icon: ClipboardCheck },
  { status: "siap",         label: "Siap Diambil",       icon: Package        },
];

const EMPTY_OBAT: Omit<ObatPulangItem, "id"> = {
  namaObat: "", dosis: "", frekuensi: "", durasi: "", instruksi: "", isHAM: false, fromResep: false,
};

// ── Compact obat card ─────────────────────────────────────

function ObatCard({
  item, onUpdate, onDelete,
}: { item: ObatPulangItem; onUpdate: (u: ObatPulangItem) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(item.instruksi);

  function saveInstruksi() {
    onUpdate({ ...item, instruksi: draft });
    setEditing(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "overflow-hidden rounded-xl border bg-white shadow-sm",
        item.isHAM ? "border-l-4 border-l-red-400 border-slate-200" : "border-slate-200",
      )}
    >
      {/* Main row */}
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <div className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          item.isHAM ? "bg-red-50" : "bg-slate-100",
        )}>
          <Pill size={12} className={item.isHAM ? "text-red-500" : "text-slate-500"} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-xs font-semibold text-slate-800">{item.namaObat}</p>
            {item.isHAM && (
              <span className="flex items-center gap-0.5 rounded-md bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                <AlertTriangle size={7} /> HAM
              </span>
            )}
            {item.fromResep && (
              <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700">Resep</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {[item.dosis, item.frekuensi, item.durasi].filter(Boolean).map((v, i) => (
              <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{v}</span>
            ))}
          </div>
          {!editing && item.instruksi && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 line-clamp-2">{item.instruksi}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => { setDraft(item.instruksi); setEditing(e => !e); }}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
          >
            <Pencil size={11} />
          </button>
          {!item.fromResep && (
            <button
              onClick={onDelete}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Instruksi edit */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-3 pb-3 pt-2">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Instruksi Penggunaan</p>
              <div className="flex items-start gap-2">
                <textarea
                  autoFocus
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={3}
                  className="flex-1 resize-none rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none ring-2 ring-indigo-100"
                />
                <div className="flex flex-col gap-1">
                  <button onClick={saveInstruksi} className="rounded-lg bg-indigo-500 p-1.5 text-white transition hover:bg-indigo-600">
                    <Check size={11} />
                  </button>
                  <button onClick={() => { setDraft(item.instruksi); setEditing(false); }} className="rounded-lg bg-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-300">
                    <X size={11} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Add form ──────────────────────────────────────────────

function AddObatForm({
  onAdd, onCancel,
}: { onAdd: (item: ObatPulangItem) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ ...EMPTY_OBAT });

  function setF<K extends keyof typeof EMPTY_OBAT>(k: K, v: (typeof EMPTY_OBAT)[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
      className="rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 p-4"
    >
      <p className="mb-3 text-xs font-bold text-indigo-700">Tambah Obat Manual</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <input
            value={form.namaObat}
            onChange={e => setF("namaObat", e.target.value)}
            placeholder="Nama obat & kekuatan (mis. Metformin 500 mg) *"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
          />
        </div>
        <input value={form.dosis}     onChange={e => setF("dosis", e.target.value)}     placeholder="Dosis" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100" />
        <input value={form.frekuensi} onChange={e => setF("frekuensi", e.target.value)} placeholder="Frekuensi (mis. 3×1)" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100" />
        <input value={form.durasi}    onChange={e => setF("durasi", e.target.value)}    placeholder="Durasi (mis. 30 hari)" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100" />
        <label className="flex items-center gap-2 self-center">
          <input type="checkbox" checked={form.isHAM} onChange={e => setF("isHAM", e.target.checked)} className="accent-red-500" />
          <span className="text-xs text-slate-600">High-Alert (HAM)</span>
        </label>
        <div className="sm:col-span-2">
          <textarea value={form.instruksi} onChange={e => setF("instruksi", e.target.value)} placeholder="Instruksi penggunaan..." rows={2} className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100" />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Batal</button>
        <button onClick={() => { if (!form.namaObat.trim()) return; onAdd({ ...form, id: `op-manual-${Date.now()}` }); }} disabled={!form.namaObat.trim()} className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-600 disabled:opacity-40">Tambah Obat</button>
      </div>
    </motion.div>
  );
}

// ── Main ─────────────────────────────────────────────────

export default function StepObatPulang({ items, onChange }: Props) {
  const [showAdd,     setShowAdd]     = useState(false);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("draft");
  const [orderId]                     = useState(() => `RFML-${String(Math.floor(Math.random() * 90000) + 10000)}`);

  const fromResep = items.filter(i => i.fromResep);
  const manual    = items.filter(i => !i.fromResep);
  const hamCount  = items.filter(i => i.isHAM).length;

  function updateItem(updated: ObatPulangItem) {
    onChange(items.map(i => i.id === updated.id ? updated : i));
  }
  function deleteItem(id: string) { onChange(items.filter(i => i.id !== id)); }
  function addItem(item: ObatPulangItem) { onChange([...items, item]); setShowAdd(false); }

  const statusIndex = ORDER_STEPS.findIndex(s => s.status === orderStatus);

  return (
    <div className="flex flex-col gap-4 xl:flex-row">

      {/* ── Left: Obat List ── */}
      <div className="min-w-0 flex-1 space-y-3">

        {/* Auto-pull notice */}
        <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 p-3">
          <Info size={13} className="mt-0.5 shrink-0 text-sky-600" />
          <div>
            <p className="text-xs font-semibold text-sky-800">Obat ditarik otomatis dari Resep Aktif</p>
            <p className="mt-0.5 text-[11px] text-sky-700">
              {fromResep.length} obat dari tab Resep & Obat. Instruksi dapat diedit sesuai kebutuhan pasien pulang.
            </p>
          </div>
        </div>

        {/* HAM warning */}
        {hamCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3"
          >
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="text-xs font-semibold text-red-800">{hamCount} obat High-Alert Medication (HAM) — SKP 3</p>
              <p className="mt-0.5 text-[11px] text-red-700">Wajib edukasi khusus kepada pasien & keluarga.</p>
            </div>
          </motion.div>
        )}

        {/* Obat cards */}
        <AnimatePresence mode="popLayout">
          {items.map(item => (
            <ObatCard key={item.id} item={item} onUpdate={updateItem} onDelete={() => deleteItem(item.id)} />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {showAdd && <AddObatForm onAdd={addItem} onCancel={() => setShowAdd(false)} />}
        </AnimatePresence>

        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-xs font-semibold text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600"
          >
            <Plus size={13} /> Tambah Obat Manual
          </button>
        )}

        {manual.length > 0 && (
          <p className="text-center text-[11px] text-slate-400">
            {fromResep.length} dari Resep · {manual.length} manual · {hamCount} HAM
          </p>
        )}
      </div>

      {/* ── Right: Order ke Farmasi ── */}
      <div className="w-full shrink-0 space-y-3 xl:w-72">

        {/* Ringkasan */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ringkasan Resep Pulang</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-indigo-50 p-3 text-center">
              <p className="text-2xl font-bold text-indigo-700">{items.length}</p>
              <p className="text-[10px] font-medium text-indigo-600">Total Obat</p>
            </div>
            <div className={cn("rounded-lg p-3 text-center", hamCount > 0 ? "bg-red-50" : "bg-slate-50")}>
              <p className={cn("text-2xl font-bold", hamCount > 0 ? "text-red-600" : "text-slate-400")}>{hamCount}</p>
              <p className={cn("text-[10px] font-medium", hamCount > 0 ? "text-red-500" : "text-slate-400")}>HAM</p>
            </div>
            <div className="rounded-lg bg-sky-50 p-3 text-center">
              <p className="text-2xl font-bold text-sky-700">{fromResep.length}</p>
              <p className="text-[10px] font-medium text-sky-600">Dari Resep</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-slate-600">{manual.length}</p>
              <p className="text-[10px] font-medium text-slate-500">Manual</p>
            </div>
          </div>
        </div>

        {/* Order panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50">
              <Send size={12} className="text-indigo-600" />
            </div>
            <p className="text-xs font-bold text-slate-700">Order ke Depo Farmasi Central</p>
          </div>

          {/* Order ID */}
          <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[10px] text-slate-500">No. Order</p>
            <p className="font-mono text-[11px] font-bold text-slate-700">{orderId}</p>
          </div>

          {/* Status stepper */}
          <div className="mb-4 space-y-2.5">
            {ORDER_STEPS.map(({ status, label, icon: Icon }, idx) => {
              const isDone   = statusIndex > idx;
              const isActive = statusIndex === idx;
              return (
                <div key={status} className="flex items-center gap-2.5">
                  <div className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    isDone   ? "bg-emerald-500"
                    : isActive ? "bg-indigo-600 ring-4 ring-indigo-100"
                    : "bg-slate-200",
                  )}>
                    {isDone
                      ? <CheckCircle2 size={12} className="text-white" />
                      : <Icon size={11} className={isActive ? "text-white" : "text-slate-400"} />
                    }
                  </div>
                  <p className={cn(
                    "text-xs transition-colors",
                    isDone   ? "font-medium text-emerald-600"
                    : isActive ? "font-semibold text-indigo-700"
                    : "text-slate-400",
                  )}>
                    {label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Action area */}
          {orderStatus === "draft" ? (
            <button
              onClick={() => setOrderStatus("terkirim")}
              disabled={items.length === 0}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all",
                items.length > 0
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98]"
                  : "cursor-not-allowed bg-slate-100 text-slate-400",
              )}
            >
              <Send size={12} /> Kirim Order Resep Pulang
            </button>
          ) : orderStatus === "terkirim" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-xs font-medium text-amber-700">
                <Clock size={12} /> Menunggu konfirmasi apoteker...
              </div>
              <button onClick={() => setOrderStatus("dikonfirmasi")} className="w-full rounded-xl border border-slate-200 py-2 text-xs text-slate-400 transition hover:text-slate-600">
                Simulasi: Konfirmasi →
              </button>
            </div>
          ) : orderStatus === "dikonfirmasi" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 py-2.5 text-xs font-medium text-sky-700">
                <Package size={12} /> Sedang disiapkan di Farmasi...
              </div>
              <button onClick={() => setOrderStatus("siap")} className="w-full rounded-xl border border-slate-200 py-2 text-xs text-slate-400 transition hover:text-slate-600">
                Simulasi: Obat Siap →
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 size={13} /> Obat Siap Diambil
            </div>
          )}

          {orderStatus !== "draft" && (
            <button onClick={() => setOrderStatus("draft")} className="mt-2 w-full rounded-lg py-1.5 text-[11px] text-slate-400 transition hover:text-slate-600">
              Reset order
            </button>
          )}
        </div>

        <p className="rounded-xl border border-slate-100 bg-white p-3 text-center text-[10px] text-slate-400">
          PMK 72/2016 · SKP 3 · Verifikasi apoteker wajib sebelum obat diserahkan
        </p>

      </div>
    </div>
  );
}
