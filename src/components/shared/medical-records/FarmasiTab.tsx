"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill, AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronUp,
  Package, ExternalLink, MessageSquare, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deriveResepOrders,
  STATUS_CFG, INTERVENSI_CFG,
  type FarmasiOrder,
} from "@/components/farmasi/farmasiShared";

// ── Types ─────────────────────────────────────────────────

export interface FarmasiTabPatient {
  noRM:    string;
  name:    string;
  context: "igd" | "ri" | "rj";
}

// ── Step indicator ────────────────────────────────────────

function StepDots({ step }: { step: number }) {
  if (step === -1) return (
    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full ring-1 ring-rose-200">Dikembalikan</span>
  );
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3].map((s) => (
        <div key={s} className={cn(
          "h-1.5 w-4 rounded-full transition-colors",
          s <= step ? "bg-indigo-500" : "bg-slate-200",
        )} />
      ))}
    </div>
  );
}

// ── Order row ─────────────────────────────────────────────

function OrderRow({ order }: { order: FarmasiOrder }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CFG[order.status];

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden transition-colors",
      order.hasHAM ? "border-rose-200" : "border-slate-200",
    )}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        {/* Status dot */}
        <span className={cn("h-2 w-2 rounded-full shrink-0", cfg.dot)} />

        {/* Order info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">{order.noOrder}</span>
            {order.hasHAM && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 ring-1 ring-rose-200">
                <AlertTriangle size={8} />HAM
              </span>
            )}
            <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", cfg.badge)}>
              {cfg.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {order.items.length} item · {order.dokterPeminta} · {order.jam}
          </p>
        </div>

        {/* Progress + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <StepDots step={cfg.step} />
          {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-4 py-3 space-y-2 bg-slate-50/50">
              {/* Items */}
              <div className="space-y-1.5">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Pill size={11} className={cn("shrink-0", item.isHAM ? "text-rose-500" : "text-slate-400")} />
                      <span className="text-xs text-slate-700 truncate">{item.namaObat}</span>
                      {item.kategori !== "Reguler" && (
                        <span className={cn(
                          "shrink-0 rounded px-1 text-[9px] font-bold",
                          item.kategori === "Narkotika" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700",
                        )}>
                          {item.kategori.substring(0, 3).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-400">{item.dosis} · ×{item.jumlah}</span>
                      {item.lotNo && (
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 rounded">{item.lotNo}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Telaah info */}
              {order.telaah && (
                <div className={cn(
                  "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs",
                  order.telaah.result === "Disetujui"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700",
                )}>
                  <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold">{order.telaah.apoteker}</span>
                    <span className="text-opacity-70"> · {order.telaah.waktu}</span>
                    {order.telaah.catatan && <p className="mt-0.5 italic opacity-80">"{order.telaah.catatan}"</p>}
                    {order.telaah.alasanKembali && <p className="mt-0.5 font-medium">Alasan: {order.telaah.alasanKembali}</p>}
                  </div>
                </div>
              )}

              {/* Serah terima */}
              {order.serahTerima && (
                <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                  <Package size={11} className="shrink-0" />
                  <span>Diterima: <strong>{order.serahTerima.perawatPenerima}</strong> · {order.serahTerima.waktu}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────

export default function FarmasiTab({ patient }: { patient: FarmasiTabPatient }) {
  const orders = deriveResepOrders(patient.noRM);

  // Aggregate stats
  const total     = orders.length;
  const pending   = orders.filter((o) => o.status === "Menunggu").length;
  const done      = orders.filter((o) => o.status === "Selesai").length;
  const returned  = orders.filter((o) => o.status === "Dikembalikan").length;
  const allCatatan = orders.flatMap((o) => o.catatan ?? []);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 py-16 text-center">
        <Pill size={24} className="text-slate-300" />
        <div>
          <p className="font-medium text-slate-500">Belum ada order farmasi</p>
          <p className="mt-1 text-sm text-slate-400">Order resep dari dokter akan muncul di sini</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Summary cards ── */}
      <section className="grid grid-cols-3 gap-2" aria-label="Status farmasi pasien">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-xl font-bold text-slate-900 tabular-nums">{total}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Total Order</p>
        </div>
        <div className={cn(
          "rounded-xl border p-3 text-center",
          pending > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white",
        )}>
          <div className="flex items-center justify-center gap-1">
            <Clock size={12} className={pending > 0 ? "text-amber-500" : "text-slate-400"} />
            <p className={cn("text-xl font-bold tabular-nums", pending > 0 ? "text-amber-700" : "text-slate-900")}>{pending}</p>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Menunggu</p>
        </div>
        <div className={cn(
          "rounded-xl border p-3 text-center",
          done > 0 ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white",
        )}>
          <div className="flex items-center justify-center gap-1">
            <CheckCircle2 size={12} className={done > 0 ? "text-emerald-500" : "text-slate-400"} />
            <p className={cn("text-xl font-bold tabular-nums", done > 0 ? "text-emerald-700" : "text-slate-900")}>{done}</p>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Selesai</p>
        </div>
      </section>

      {/* Returned alert */}
      {returned > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <AlertTriangle size={14} className="text-rose-600 shrink-0" />
          <p className="text-sm font-medium text-rose-700">
            {returned} resep dikembalikan apoteker ke dokter — perlu koreksi.
          </p>
        </div>
      )}

      {/* ── Orders ── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">DAFTAR ORDER RESEP</p>
        <div className="space-y-2">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      </div>

      {/* ── Catatan Farmasi ── */}
      {allCatatan.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">CATATAN APOTEKER</p>
          <div className="space-y-2">
            {allCatatan.map((c) => {
              const icfg = INTERVENSI_CFG[c.tipe];
              return (
                <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={12} className="text-slate-400 shrink-0" />
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", icfg.badge)}>{icfg.label}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">{c.apoteker} · {c.waktu}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{c.isi}</p>
                  {c.rekomendasi && (
                    <p className="text-xs text-indigo-700 bg-indigo-50 rounded-lg px-2.5 py-1.5">
                      <strong>Rekomendasi:</strong> {c.rekomendasi}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Link to farmasi page ── */}
      <a
        href="/ehis-care/farmasi"
        className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 hover:border-indigo-300"
        target="_blank" rel="noopener noreferrer"
      >
        <Info size={13} />
        Buka Halaman Farmasi untuk proses telaah & dispensasi
        <ExternalLink size={11} className="ml-auto" />
      </a>
    </div>
  );
}
