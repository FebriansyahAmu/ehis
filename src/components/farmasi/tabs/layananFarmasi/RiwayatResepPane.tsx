"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Pill, AlertTriangle, Handshake, Loader2, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  mapDbResepOrder, STATUS_CFG, PRIORITAS_CFG, DEPO_LABEL,
  type FarmasiOrder,
} from "@/components/farmasi/farmasiShared";
import { listFarmasiResep } from "@/lib/api/resep/resep";
import { ApiError } from "@/lib/api/client";

interface Props { order: FarmasiOrder }

// ── Depo color helper ─────────────────────────────────────

function depoTextCls(depo: FarmasiOrder["depo"]): string {
  if (depo === "Depo IGD")  return "text-rose-600";
  if (depo === "Apotek RI") return "text-sky-600";
  return "text-emerald-600";
}

// ── Per-order card ─────────────────────────────────────────

function OrderHistCard({ h, isCurrent }: { h: FarmasiOrder; isCurrent: boolean }) {
  const statusCfg   = STATUS_CFG[h.status];
  const priorCfg    = PRIORITAS_CFG[h.prioritas];
  const isCancelled = h.status === "Dibatalkan";

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border transition-all duration-200",
      isCancelled
        ? "border-rose-200 bg-rose-50/40"
        : isCurrent
          ? "border-sky-300 bg-sky-50/20 shadow-sm shadow-sky-100"
          : "border-slate-200 bg-white hover:border-slate-300",
    )}>
      {/* ── Header ── */}
      <div className="flex items-start gap-2.5 px-4 py-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {isCurrent && (
              <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[9px] font-black text-white">Order Ini</span>
            )}
            {h.prioritas !== "Rutin" && !isCancelled && (
              <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-black", priorCfg.badge)}>{h.prioritas}</span>
            )}
            {h.hasHAM && !isCancelled && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-semibold text-rose-600 ring-1 ring-rose-200">HAM</span>
            )}
            <span className={cn("font-mono text-xs font-bold", isCancelled ? "text-rose-400 line-through" : "text-slate-700")}>{h.noOrder}</span>
            {isCancelled ? (
              <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-300">
                <Ban size={9} className="shrink-0" /> Order Dibatalkan
              </span>
            ) : (
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusCfg.badge)}>
                {statusCfg.label}
              </span>
            )}
          </div>
          <p className={cn("text-[11px]", isCancelled ? "text-rose-300" : "text-slate-400")}>
            {h.dokterPeminta}
            {" · "}
            <span className={cn("font-medium", isCancelled ? "text-rose-400" : depoTextCls(h.depo))}>{DEPO_LABEL[h.depo]}</span>
            {" · "}{h.tanggal}{h.jam ? ` · ${h.jam}` : ""}
          </p>
        </div>

        {!isCurrent && !isCancelled && (
          <Link
            href={`/ehis-care/farmasi/${h.id}`}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-500 transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
          >
            Detail <ArrowUpRight size={11} />
          </Link>
        )}
      </div>

      {/* ── Item chips ── */}
      <div className={cn("flex flex-wrap gap-1.5 border-t px-4 py-2.5", isCancelled ? "border-rose-100 opacity-60" : "border-slate-100")}>
        {h.items.map((item) => (
          <span key={item.id} className={cn(
            "flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium",
            isCancelled
              ? "border-rose-100 bg-white text-rose-400 line-through"
              : item.isHAM ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-100 bg-slate-50 text-slate-600",
          )}>
            {item.isHAM && !isCancelled && <AlertTriangle size={8} className="shrink-0 text-rose-500" />}
            <span>{item.namaObat}</span>
            {item.dosis && <span className={isCancelled ? "text-rose-300" : "text-slate-400"}>{item.dosis.split(" ").slice(0, 2).join(" ")}</span>}
          </span>
        ))}
      </div>

      {/* ── Penyerahan (bila sudah diserahkan) ── */}
      {h.serahTerima && (
        <div className="flex items-center gap-1.5 border-t border-slate-100 px-4 py-2.5">
          <Handshake size={11} className="shrink-0 text-emerald-500" />
          <span className="text-[11px] text-slate-600">
            Diserahkan · {h.serahTerima.waktu}
            {h.serahTerima.apoteker && <span className="text-slate-400"> · oleh {h.serahTerima.apoteker}</span>}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RiwayatResepPane({ order }: Props) {
  const [orders, setOrders] = useState<FarmasiOrder[] | null>(null);
  const [err, setErr] = useState<string>();

  useEffect(() => {
    const ac = new AbortController();
    const run = async () => {
      try {
        const rows = await listFarmasiResep({ noRM: order.noRM }, ac.signal);
        if (!ac.signal.aborted) setOrders(rows.map(mapDbResepOrder));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (!ac.signal.aborted) { setErr(e instanceof ApiError ? e.message : "Gagal memuat riwayat"); setOrders([]); }
      }
    };
    void run();
    return () => ac.abort();
  }, [order.noRM]);

  if (orders === null) {
    return (
      <div className="flex items-center justify-center gap-2 py-14 text-slate-400">
        <Loader2 size={16} className="animate-spin text-sky-500" /><span className="text-sm">Memuat riwayat resep…</span>
      </div>
    );
  }

  const sorted = [...orders].sort((a, b) =>
    b.tanggal.localeCompare(a.tanggal) || b.jam.localeCompare(a.jam),
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-14">
        <Pill size={22} className="text-slate-300" />
        <p className="text-sm text-slate-400">{err ?? "Belum ada riwayat resep farmasi untuk pasien ini."}</p>
      </div>
    );
  }

  const selesai = sorted.filter((o) => o.status === "Selesai").length;
  const kembali = sorted.filter((o) => o.status === "Dikembalikan").length;
  const batal   = sorted.filter((o) => o.status === "Dibatalkan").length;
  const aktif   = sorted.filter((o) => o.status !== "Selesai" && o.status !== "Dikembalikan" && o.status !== "Dibatalkan").length;

  const stats = [
    { label: "Total",        count: sorted.length, cls: "text-slate-700  bg-white      border-slate-200"   },
    { label: "Selesai",      count: selesai,        cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { label: "Aktif",        count: aktif,          cls: "text-sky-700   bg-sky-50     border-sky-200"      },
    ...(kembali > 0
      ? [{ label: "Dikembalikan", count: kembali, cls: "text-rose-700 bg-rose-50 border-rose-200" }]
      : []),
    ...(batal > 0
      ? [{ label: "Dibatalkan", count: batal, cls: "text-rose-700 bg-rose-100 border-rose-300" }]
      : []),
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {stats.map(({ label, count, cls }) => (
          <div key={label} className={cn("flex-1 rounded-xl border px-2 py-2 text-center", cls)}>
            <p className="text-base font-black tabular-nums">{count}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

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
