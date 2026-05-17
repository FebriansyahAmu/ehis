"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight, ChevronDown, Check,
  Package, Handshake, Pill, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deriveResepOrders, STATUS_CFG, PRIORITAS_CFG,
  type FarmasiOrder,
} from "@/components/farmasi/farmasiShared";

interface Props { order: FarmasiOrder }

// ── Depo color helper ─────────────────────────────────────

function depoTextCls(depo: FarmasiOrder["depo"]): string {
  if (depo === "Depo IGD")  return "text-rose-600";
  if (depo === "Apotek RI") return "text-sky-600";
  return "text-emerald-600";
}

// ── Per-order card ─────────────────────────────────────────

function OrderHistCard({ h, isCurrent }: { h: FarmasiOrder; isCurrent: boolean }) {
  const [open, setOpen] = useState(false);
  const statusCfg  = STATUS_CFG[h.status];
  const priorCfg   = PRIORITAS_CFG[h.prioritas];
  const lotCount   = h.items.filter((i) => i.lotNo).length;
  const labelCount = h.items.filter((i) => i.labelDicetak).length;
  const total      = h.items.length;
  const hasDisp    = lotCount > 0;

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border transition-all duration-200",
      isCurrent
        ? "border-sky-300 bg-sky-50/20 shadow-sm shadow-sky-100"
        : "border-slate-200 bg-white hover:border-slate-300",
    )}>
      {/* ── Header ── */}
      <div className="flex items-start gap-2.5 px-4 py-3">
        <div className="min-w-0 flex-1 space-y-1">
          {/* Badges + no order + status */}
          <div className="flex flex-wrap items-center gap-1.5">
            {isCurrent && (
              <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[9px] font-black text-white">
                Order Ini
              </span>
            )}
            {h.prioritas !== "Rutin" && (
              <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-black", priorCfg.badge)}>
                {h.prioritas}
              </span>
            )}
            {h.hasHAM && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-semibold text-rose-600 ring-1 ring-rose-200">
                HAM
              </span>
            )}
            <span className="font-mono text-xs font-bold text-slate-700">{h.noOrder}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusCfg.badge)}>
              {statusCfg.label}
            </span>
          </div>
          {/* Sub-info */}
          <p className="text-[11px] text-slate-400">
            {h.dokterPeminta}
            {" · "}
            <span className={cn("font-medium", depoTextCls(h.depo))}>{h.depo}</span>
            {" · "}{h.tanggal}{h.jam ? ` · ${h.jam}` : ""}
          </p>
        </div>

        {/* Detail page link */}
        <Link
          href={`/ehis-care/farmasi/${h.id}`}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-500 transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
        >
          Detail <ArrowUpRight size={11} />
        </Link>
      </div>

      {/* ── Item chips ── */}
      <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-4 py-2.5">
        {h.items.map((item) => (
          <span key={item.id} className={cn(
            "flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium",
            item.isHAM
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-slate-100 bg-slate-50 text-slate-600",
          )}>
            {item.isHAM && <AlertTriangle size={8} className="shrink-0 text-rose-500" />}
            <span>{item.namaObat}</span>
            {item.dosis && <span className="text-slate-400">{item.dosis.split(" ").slice(0, 2).join(" ")}</span>}
          </span>
        ))}
      </div>

      {/* ── Dispensing + Serah overview ── */}
      {(hasDisp || h.serahTerima) && (
        <div className="space-y-1.5 border-t border-slate-100 px-4 py-2.5">
          {hasDisp && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Package size={11} className="shrink-0 text-sky-500" />
                <span className="text-[11px] text-slate-600">
                  {lotCount}/{total} LOT&nbsp;·&nbsp;{labelCount}/{total} label
                </span>
                {lotCount === total && labelCount === total && (
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 ring-1 ring-emerald-200">
                    Lengkap
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-0.5 text-[10px] font-medium text-sky-600 hover:text-sky-700"
              >
                per item
                <ChevronDown
                  size={10}
                  className={cn("transition-transform duration-200", open && "rotate-180")}
                />
              </button>
            </div>
          )}

          {h.serahTerima && (
            <div className="flex items-center gap-1.5">
              <Handshake size={11} className="shrink-0 text-emerald-500" />
              <span className="text-[11px] text-slate-600">
                Diserahkan ke{" "}
                <span className="font-semibold text-slate-700">{h.serahTerima.perawatPenerima}</span>
                {" · "}{h.serahTerima.waktu}
                {h.serahTerima.verifikatorAkhir && (
                  <span className="text-slate-400"> · 5B: {h.serahTerima.verifikatorAkhir}</span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Per-item dispensing detail (expandable) ── */}
      <AnimatePresence>
        {open && hasDisp && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 border-t border-sky-100 bg-sky-50/20 px-4 pb-3 pt-2.5">
              {h.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-[11px]">
                  {/* Label badge */}
                  <div className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    item.labelDicetak
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-white",
                  )}>
                    {item.labelDicetak && <Check size={8} className="text-emerald-600" />}
                  </div>
                  <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{item.namaObat}</span>
                  {item.lotNo
                    ? <span className="rounded bg-sky-100 px-1.5 py-0.5 font-mono text-[10px] text-sky-700">
                        LOT {item.lotNo}
                      </span>
                    : <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">—</span>
                  }
                  {item.expiredDate && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                      {item.expiredDate}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RiwayatResepPane({ order }: Props) {
  const all    = deriveResepOrders().filter((o) => o.noRM === order.noRM);
  const sorted = [...all].sort((a, b) =>
    b.tanggal.localeCompare(a.tanggal) || b.jam.localeCompare(a.jam),
  );

  const selesai = sorted.filter((o) => o.status === "Selesai").length;
  const aktif   = sorted.filter((o) => o.status !== "Selesai" && o.status !== "Dikembalikan").length;
  const kembali = sorted.filter((o) => o.status === "Dikembalikan").length;

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-14">
        <Pill size={22} className="text-slate-300" />
        <p className="text-sm text-slate-400">Belum ada riwayat resep farmasi untuk pasien ini.</p>
      </div>
    );
  }

  const stats = [
    { label: "Total",        count: sorted.length, cls: "text-slate-700  bg-white      border-slate-200"   },
    { label: "Selesai",      count: selesai,        cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { label: "Aktif",        count: aktif,          cls: "text-sky-700   bg-sky-50     border-sky-200"      },
    ...(kembali > 0
      ? [{ label: "Dikembalikan", count: kembali, cls: "text-rose-700 bg-rose-50 border-rose-200" }]
      : []),
  ];

  return (
    <div className="space-y-3">
      {/* ── Stats strip ── */}
      <div className="flex gap-2">
        {stats.map(({ label, count, cls }) => (
          <div key={label} className={cn("flex-1 rounded-xl border px-2 py-2 text-center", cls)}>
            <p className="text-base font-black tabular-nums">{count}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Order cards ── */}
      <div className="space-y-2">
        {sorted.map((o, idx) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
          >
            <OrderHistCard h={o} isCurrent={o.id === order.id} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
