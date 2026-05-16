"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type FarmasiOrder, type TelaahData,
  TELAAH_ADM_ITEMS, TELAAH_FARM_ITEMS, TELAAH_KLIN_ITEMS,
} from "./farmasiShared";

// ── Checklist section ─────────────────────────────────────

interface CheckSectionProps {
  title:     string;
  icon:      string;
  color:     string;
  items:     string[];
  checked:   boolean[];
  onChange:  (i: number, val: boolean) => void;
}

function CheckSection({ title, icon, color, items, checked, onChange }: CheckSectionProps) {
  const [open, setOpen] = useState(true);
  const allDone = checked.every(Boolean);

  return (
    <div className={cn("rounded-xl border overflow-hidden", allDone ? "border-emerald-200" : "border-slate-200")}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3 text-left transition-colors",
          allDone ? "bg-emerald-50" : "bg-slate-50 hover:bg-slate-100",
        )}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className={cn("text-sm font-semibold", allDone ? "text-emerald-700" : "text-slate-700")}>{title}</span>
          <span className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            allDone ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600",
          )}>
            {checked.filter(Boolean).length}/{items.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {allDone && <CheckCircle2 size={14} className="text-emerald-500" />}
          {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-slate-100 px-4">
              {items.map((label, i) => (
                <label
                  key={i}
                  className="flex cursor-pointer items-center gap-3 py-2.5 hover:bg-slate-50 -mx-4 px-4 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked[i]}
                    onChange={(e) => onChange(i, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 accent-indigo-600"
                  />
                  <span className={cn("text-sm transition-colors", checked[i] ? "text-slate-500 line-through" : "text-slate-700")}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── HAM warning ───────────────────────────────────────────

function HAMWarning({ items }: { items: FarmasiOrder["items"] }) {
  const hamItems = items.filter((i) => i.isHAM);
  if (!hamItems.length) return null;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={14} className="text-rose-600 shrink-0" />
        <p className="text-xs font-bold text-rose-700">High Alert Medication — Verifikasi Ganda Wajib</p>
      </div>
      <div className="space-y-1">
        {hamItems.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-xs text-rose-700">
            <span className="h-1 w-1 rounded-full bg-rose-400 shrink-0" />
            <span className="font-semibold">{item.namaObat}</span>
            <span className="text-rose-500">{item.dosis} · {item.rute}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────

interface TelaahModalProps {
  order:    FarmasiOrder;
  onClose:  () => void;
  onSubmit: (orderId: string, data: TelaahData) => void;
}

export default function TelaahModal({ order, onClose, onSubmit }: TelaahModalProps) {
  const [adm,  setAdm]  = useState<boolean[]>(Array(TELAAH_ADM_ITEMS.length).fill(false));
  const [farm, setFarm] = useState<boolean[]>(Array(TELAAH_FARM_ITEMS.length).fill(false));
  const [klin, setKlin] = useState<boolean[]>(Array(TELAAH_KLIN_ITEMS.length).fill(false));
  const [catatan, setCatatan]   = useState("");
  const [alasan,  setAlasan]    = useState("");
  const [kembalikan, setKembalikan] = useState(false);

  const allAdm  = adm.every(Boolean);
  const allFarm = farm.every(Boolean);
  const allKlin = klin.every(Boolean);
  const allPass = allAdm && allFarm && allKlin;

  function toggle(arr: boolean[], setArr: (v: boolean[]) => void, i: number, val: boolean) {
    const next = [...arr]; next[i] = val; setArr(next);
  }

  function handleSetujui() {
    if (!allPass) return;
    onSubmit(order.id, {
      checks: { administratif: allAdm, farmasetis: allFarm, klinis: allKlin },
      catatan: catatan.trim() || undefined,
      apoteker: "Apt. Dewi Lestari",
      waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      result: "Disetujui",
    });
  }

  function handleKembalikan() {
    if (!alasan.trim()) return;
    onSubmit(order.id, {
      checks: { administratif: allAdm, farmasetis: allFarm, klinis: allKlin },
      apoteker: "Apt. Dewi Lestari",
      waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      result: "Dikembalikan",
      alasanKembali: alasan.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog" aria-modal="true" aria-label="Telaah Resep"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 flex flex-col w-full max-w-lg max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Telaah Resep</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {order.namaPasien} · <span className="font-mono">{order.noRM}</span> · {order.noOrder}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" aria-label="Tutup modal">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <HAMWarning items={order.items} />

          <CheckSection
            title="Telaah Administratif" icon="📋" color="slate"
            items={TELAAH_ADM_ITEMS} checked={adm}
            onChange={(i, v) => toggle(adm, setAdm, i, v)}
          />
          <CheckSection
            title="Telaah Farmasetis" icon="⚗️" color="sky"
            items={TELAAH_FARM_ITEMS} checked={farm}
            onChange={(i, v) => toggle(farm, setFarm, i, v)}
          />
          <CheckSection
            title="Telaah Klinis" icon="🩺" color="emerald"
            items={TELAAH_KLIN_ITEMS} checked={klin}
            onChange={(i, v) => toggle(klin, setKlin, i, v)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Apoteker <span className="font-normal text-slate-400">(opsional)</span>
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Rekomendasi, penjelasan klinis, catatan khusus..."
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
            />
          </div>

          {/* Kembalikan section */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox" checked={kembalikan}
                onChange={(e) => setKembalikan(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-rose-600"
              />
              <span className="text-xs font-semibold text-rose-700">Kembalikan ke dokter penulis</span>
            </label>
            <AnimatePresence>
              {kembalikan && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-2"
                >
                  <textarea
                    value={alasan} onChange={(e) => setAlasan(e.target.value)}
                    placeholder="Alasan dikembalikan (wajib)..."
                    rows={2}
                    className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 placeholder:text-rose-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            {allPass
              ? <><CheckCircle2 size={13} className="text-emerald-500" /><span className="text-emerald-600 font-medium">Semua telaah selesai</span></>
              : <><XCircle size={13} className="text-slate-400" /><span className="text-slate-500">{[allAdm, allFarm, allKlin].filter(Boolean).length}/3 seksi selesai</span></>
            }
          </div>
          <div className="flex gap-2">
            {kembalikan ? (
              <button
                onClick={handleKembalikan}
                disabled={!alasan.trim()}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Kembalikan ke Dokter
              </button>
            ) : (
              <button
                onClick={handleSetujui}
                disabled={!allPass}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Setujui Resep
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
