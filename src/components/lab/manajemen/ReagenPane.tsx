"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package2, AlertTriangle, CheckCircle2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ReagenItem, REAGEN_LIST } from "./manajemenShared";

// ── Helpers ───────────────────────────────────────────────

function isExpiringSoon(tgl: string): boolean {
  const diff = new Date(tgl).getTime() - new Date("2026-05-18").getTime();
  return diff > 0 && diff < 60 * 24 * 60 * 60 * 1000; // < 60 days
}

function isExpired(tgl: string): boolean {
  return new Date(tgl) < new Date("2026-05-18");
}

function isLowStock(item: ReagenItem): boolean {
  return item.stokSaat < item.stokMin;
}

function getStockStatus(item: ReagenItem) {
  if (isLowStock(item))        return { cls: "text-rose-600",   label: "Stok Kritis" };
  if (item.stokSaat === item.stokMin) return { cls: "text-amber-600", label: "Stok Minimum" };
  return { cls: "text-emerald-600", label: "Stok OK" };
}

// ── Stock Bar ──────────────────────────────────────────────

function StockBar({ item }: { item: ReagenItem }) {
  const pct = Math.min(100, (item.stokSaat / Math.max(item.stokMin * 2, 1)) * 100);
  const isLow = isLowStock(item);
  const isMin = item.stokSaat === item.stokMin;
  return (
    <div className="mt-1.5">
      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
        <span>Stok</span>
        <span className={cn("font-semibold", isLow ? "text-rose-600" : isMin ? "text-amber-600" : "text-emerald-600")}>
          {item.stokSaat} / {item.stokMin} min {item.satuan}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={cn("h-full rounded-full", isLow ? "bg-rose-400" : isMin ? "bg-amber-400" : "bg-emerald-400")}
        />
      </div>
    </div>
  );
}

// ── Reagen Card ───────────────────────────────────────────

function ReagenCard({ item }: { item: ReagenItem }) {
  const low  = isLowStock(item);
  const exp  = isExpired(item.tglKadaluarsa);
  const soon = isExpiringSoon(item.tglKadaluarsa);
  const status = getStockStatus(item);
  const hasAlert = low || exp || soon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border p-3 transition-colors",
        exp   ? "border-rose-200 bg-rose-50"   :
        low   ? "border-rose-200 bg-rose-50/50" :
        soon  ? "border-amber-200 bg-amber-50/50" :
        "border-slate-200 bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-bold text-slate-800">{item.nama}</p>
          <p className="text-[10px] text-slate-400">{item.instrumen}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", status.cls === "text-rose-600" ? "bg-rose-100 text-rose-700" : status.cls === "text-amber-600" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
            {status.label}
          </span>
        </div>
      </div>

      <StockBar item={item} />

      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
        <span className="rounded bg-slate-100 px-1.5 py-0.5">Lot {item.lotNumber}</span>
        <span className={cn("rounded px-1.5 py-0.5", exp ? "bg-rose-100 text-rose-700 font-semibold" : soon ? "bg-amber-100 text-amber-700" : "bg-slate-100")}>
          Exp: {item.tglKadaluarsa}
        </span>
      </div>

      {hasAlert && (
        <div className={cn(
          "mt-2 flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px]",
          exp ? "border-rose-200 bg-rose-100 text-rose-700" : "border-amber-200 bg-amber-100 text-amber-700",
        )}>
          <AlertTriangle size={10} className="shrink-0" />
          {exp  && "Reagen kadaluarsa — hentikan penggunaan"}
          {!exp && low  && `Stok di bawah minimum (min ${item.stokMin} ${item.satuan}) — order segera`}
          {!exp && !low && soon && `Kadaluarsa dalam 60 hari — rencanakan pemesanan`}
        </div>
      )}
    </motion.div>
  );
}

// ── Add Restock Form ──────────────────────────────────────

function RestockForm({ onClose }: { onClose: () => void }) {
  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-400";
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-bold text-sky-800">Tambah Penerimaan Reagen</p>
        <button onClick={onClose}><X size={14} className="text-sky-600" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Nama Reagen</label>
          <select className={inputCls}>
            <option value="">-- Pilih --</option>
            {REAGEN_LIST.map((r) => <option key={r.id}>{r.nama}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Lot Number</label>
          <input placeholder="Lot #" className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Jumlah Diterima</label>
          <input type="number" placeholder="0" className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tgl Kadaluarsa</label>
          <input type="date" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Petugas Penerima</label>
        <input placeholder="Nama analis" className={inputCls} />
      </div>
      <div className="flex gap-2">
        <button className="flex-1 rounded-xl bg-sky-600 py-2 text-sm font-semibold text-white hover:bg-sky-700">
          Simpan
        </button>
        <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
          Batal
        </button>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function ReagenPane() {
  const [showForm, setShowForm] = useState(false);

  const grouped = REAGEN_LIST.reduce<Record<string, ReagenItem[]>>((acc, r) => {
    acc[r.instrumen] = [...(acc[r.instrumen] ?? []), r];
    return acc;
  }, {});

  const alertItems = REAGEN_LIST.filter((r) =>
    isLowStock(r) || isExpired(r.tglKadaluarsa) || isExpiringSoon(r.tglKadaluarsa),
  );

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_260px]">

      {/* Left — reagen list by instrument */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5">
            <Package2 size={14} className="text-sky-600 shrink-0" />
            <div>
              <p className="text-[12px] font-bold text-sky-800">Manajemen Reagen</p>
              <p className="text-[10px] text-sky-600">Kartu stok per alat · ISO 15189 §5.3.2</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm((p) => !p)}
            className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-sky-700"
          >
            <Plus size={13} /> Terima Reagen
          </button>
        </div>

        <AnimatePresence>
          {showForm && <RestockForm onClose={() => setShowForm(false)} />}
        </AnimatePresence>

        {Object.entries(grouped).map(([instrumen, items]) => (
          <div key={instrumen}>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold text-slate-500">
              <span className="h-px flex-1 bg-slate-100" />
              {instrumen}
              <span className="h-px flex-1 bg-slate-100" />
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {items.map((item) => <ReagenCard key={item.id} item={item} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Right — summary + alerts */}
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Ringkasan Stok</p>
          <div className="space-y-2.5">
            {[
              { label: "Total Reagen",   value: REAGEN_LIST.length,                                                     cls: "text-slate-800" },
              { label: "Stok OK",         value: REAGEN_LIST.filter((r) => !isLowStock(r) && !isExpired(r.tglKadaluarsa)).length, cls: "text-emerald-600" },
              { label: "Stok Kritis",     value: REAGEN_LIST.filter((r) => isLowStock(r)).length,                       cls: "text-rose-600"   },
              { label: "Kadaluarsa",      value: REAGEN_LIST.filter((r) => isExpired(r.tglKadaluarsa)).length,           cls: "text-rose-700"   },
              { label: "Exp < 60 Hari",   value: REAGEN_LIST.filter((r) => !isExpired(r.tglKadaluarsa) && isExpiringSoon(r.tglKadaluarsa)).length, cls: "text-amber-600" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="flex items-center justify-between">
                <p className="text-[11px] text-slate-500">{label}</p>
                <p className={cn("text-[13px] font-bold", cls)}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {alertItems.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-rose-700">
              <AlertTriangle size={12} /> {alertItems.length} Perlu Perhatian
            </p>
            <div className="space-y-1.5">
              {alertItems.map((r) => (
                <div key={r.id} className="flex items-start gap-1.5 text-[11px] text-rose-700">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                  <span className="font-medium">{r.nama}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {alertItems.length === 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
            <p className="text-[11px] font-semibold text-emerald-700">Semua reagen dalam kondisi baik</p>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Panduan</p>
          {[
            "Cek stok setiap awal shift",
            "Reagen kadaluarsa wajib dipisahkan",
            "Order reagen min H-7 sebelum habis",
            "Simpan sesuai suhu & kondisi label",
          ].map((t, i) => (
            <div key={i} className="flex gap-2 mb-1.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[9px] font-bold text-sky-700">{i + 1}</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">{t}</p>
            </div>
          ))}
          <p className="mt-2 text-[9px] text-slate-400">ISO 15189:2022 §5.3.2</p>
        </div>
      </div>
    </div>
  );
}
