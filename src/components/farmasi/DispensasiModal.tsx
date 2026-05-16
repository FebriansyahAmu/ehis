"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Package, CheckCircle2, Printer, ArrowRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { type FarmasiOrder, type FarmasiOrderItem, type SerahTerima } from "./farmasiShared";

// ── Lot item row ──────────────────────────────────────────

interface LotRowProps {
  item:      FarmasiOrderItem;
  lotNo:     string;
  expiry:    string;
  labeled:   boolean;
  onLot:     (v: string) => void;
  onExpiry:  (v: string) => void;
  onLabel:   (v: boolean) => void;
}

function LotRow({ item, lotNo, expiry, labeled, onLot, onExpiry, onLabel }: LotRowProps) {
  const hasExpiry  = expiry.trim() !== "";
  const isExpired  = hasExpiry && new Date(expiry) <= new Date();
  const isNearExp  = hasExpiry && !isExpired &&
    (new Date(expiry).getTime() - Date.now()) < 1000 * 60 * 60 * 24 * 90;

  return (
    <div className={cn(
      "rounded-xl border p-3 space-y-2.5 transition-colors",
      item.isHAM ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-white",
    )}>
      {/* Item header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {item.isHAM && <AlertTriangle size={12} className="text-rose-600 shrink-0" aria-hidden="true" />}
          <span className="text-sm font-semibold text-slate-800 truncate">{item.namaObat}</span>
          {item.kategori !== "Reguler" && (
            <span className={cn(
              "shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold",
              item.kategori === "Narkotika" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700",
            )}>
              {item.kategori.toUpperCase()}
            </span>
          )}
        </div>
        <span className="shrink-0 text-[11px] text-slate-500">{item.dosis} · {item.rute} · ×{item.jumlah}</span>
      </div>

      {/* Lot + Expiry */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">No. Lot/Batch</label>
          <input
            type="text" value={lotNo} onChange={(e) => onLot(e.target.value)}
            placeholder="e.g. MOR-2025-001"
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tanggal Kedaluwarsa</label>
          <input
            type="date" value={expiry} onChange={(e) => onExpiry(e.target.value)}
            className={cn(
              "w-full rounded-lg border px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:ring-2",
              isExpired   ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100"
              : isNearExp ? "border-amber-300 bg-amber-50 focus:border-amber-400 focus:ring-amber-100"
              :             "border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100",
            )}
          />
          {isExpired  && <p className="mt-0.5 text-[10px] text-rose-600 font-semibold">⚠ Obat kadaluarsa!</p>}
          {isNearExp  && !isExpired && <p className="mt-0.5 text-[10px] text-amber-600">Mendekati kedaluwarsa</p>}
        </div>
      </div>

      {/* Label */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox" checked={labeled} onChange={(e) => onLabel(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-slate-300 accent-indigo-600"
        />
        <div className="flex items-center gap-1.5">
          <Printer size={11} className="text-slate-400" aria-hidden="true" />
          <span className="text-xs text-slate-600">Label obat sudah dicetak / ditempelkan</span>
        </div>
        {labeled && <CheckCircle2 size={12} className="text-emerald-500 ml-auto" />}
      </label>
    </div>
  );
}

// ── Serah terima step ─────────────────────────────────────

interface SerahTerimaStepProps {
  perawat:    string;
  catatan:    string;
  onPerawat:  (v: string) => void;
  onCatatan:  (v: string) => void;
}

function SerahTerimaStep({ perawat, catatan, onPerawat, onCatatan }: SerahTerimaStepProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2">
        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
        <p className="text-xs text-emerald-700 font-medium">Semua item sudah disiapkan. Lanjutkan serah terima ke bangsal.</p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Nama Perawat Penerima <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={perawat} onChange={(e) => onPerawat(e.target.value)}
            placeholder="Ns. Nama Lengkap"
            className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Catatan Serah Terima <span className="font-normal text-slate-400">(opsional)</span>
        </label>
        <textarea
          value={catatan} onChange={(e) => onCatatan(e.target.value)}
          placeholder="Instruksi penyimpanan, kondisi khusus..."
          rows={2}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
        />
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────

interface DispensasiModalProps {
  order:    FarmasiOrder;
  onClose:  () => void;
  onSubmit: (orderId: string, items: FarmasiOrderItem[], serahTerima: SerahTerima) => void;
}

export default function DispensasiModal({ order, onClose, onSubmit }: DispensasiModalProps) {
  const [step, setStep] = useState<"dispensasi" | "serah">(
    order.status === "Siap Diserahkan" ? "serah" : "dispensasi",
  );

  const [lots, setLots]     = useState<string[]>(order.items.map((i) => i.lotNo    ?? ""));
  const [expiries, setExp]  = useState<string[]>(order.items.map((i) => i.expiredDate ?? ""));
  const [labels, setLabels] = useState<boolean[]>(order.items.map((i) => i.labelDicetak ?? false));
  const [perawat, setPerawat] = useState("");
  const [catatan, setCatatan] = useState("");

  const allLots    = lots.every((l) => l.trim() !== "");
  const allLabels  = labels.every(Boolean);
  const noExpired  = expiries.every((e) => !e || new Date(e) > new Date());
  const dispensasiOk = allLots && noExpired;

  function handleDispensasiNext() {
    if (!dispensasiOk) return;
    setStep("serah");
  }

  function handleSerahTerima() {
    if (!perawat.trim()) return;
    const updatedItems = order.items.map((item, i) => ({
      ...item,
      lotNo: lots[i],
      expiredDate: expiries[i],
      labelDicetak: labels[i],
    }));
    onSubmit(order.id, updatedItems, {
      waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      perawatPenerima: perawat.trim(),
      apoteker: "Apt. Dewi Lestari",
      catatan: catatan.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 flex flex-col w-full max-w-lg max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="font-bold text-slate-900">
                {step === "dispensasi" ? "Dispensasi Obat" : "Serah Terima ke Bangsal"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {order.namaPasien} · <span className="font-mono">{order.noRM}</span>
              </p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors" aria-label="Tutup modal">
              <X size={16} />
            </button>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs">
            {(["dispensasi", "serah"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <ArrowRight size={12} className="text-slate-300" />}
                <div className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold transition-colors",
                  step === s ? "bg-indigo-100 text-indigo-700" : s === "serah" && step === "serah" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
                )}>
                  <span>{i + 1}</span>
                  <span>{s === "dispensasi" ? "Siapkan Obat" : "Serah Terima"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <AnimatePresence mode="wait">
            {step === "dispensasi" ? (
              <motion.div
                key="dispensasi"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="space-y-3"
              >
                {order.items.map((item, i) => (
                  <LotRow
                    key={item.id} item={item}
                    lotNo={lots[i]}     onLot={(v)    => { const n = [...lots];    n[i] = v; setLots(n);    }}
                    expiry={expiries[i]} onExpiry={(v) => { const n = [...expiries]; n[i] = v; setExp(n);  }}
                    labeled={labels[i]} onLabel={(v)  => { const n = [...labels];  n[i] = v; setLabels(n); }}
                  />
                ))}
                {!allLabels && (
                  <p className="text-xs text-amber-600 flex items-center gap-1.5">
                    <Package size={12} />{labels.filter(Boolean).length}/{order.items.length} label sudah dicetak
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="serah"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              >
                <SerahTerimaStep
                  perawat={perawat} catatan={catatan}
                  onPerawat={setPerawat} onCatatan={setCatatan}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-4 flex items-center justify-between gap-3">
          <button
            onClick={step === "serah" ? () => setStep("dispensasi") : onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {step === "serah" ? "← Kembali" : "Batal"}
          </button>
          {step === "dispensasi" ? (
            <button
              onClick={handleDispensasiNext}
              disabled={!dispensasiOk}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siap Diserahkan →
            </button>
          ) : (
            <button
              onClick={handleSerahTerima}
              disabled={!perawat.trim()}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Konfirmasi Diserahkan ✓
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
