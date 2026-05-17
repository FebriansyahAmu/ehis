"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Pill, FlaskConical, Radiation, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ORDERS_MOCK,
  type Order,
} from "@/components/shared/medical-records/daftarOrder/daftarOrderShared";

// ── Type icons ────────────────────────────────────────────

const TYPE_CFG = {
  Resep:      { icon: Pill,         cls: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  Lab:        { icon: FlaskConical, cls: "bg-sky-50 text-sky-700 ring-sky-200"         },
  Radiologi:  { icon: Radiation,    cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  BMHP:       { icon: ClipboardList,cls: "bg-slate-100 text-slate-600 ring-slate-200"  },
} as const;

const STATUS_COLOR: Record<string, string> = {
  Menunggu:  "text-amber-600",
  Diproses:  "text-sky-600",
  Selesai:   "text-emerald-600",
  Diterima:  "text-emerald-600",
};

// ── Order row ─────────────────────────────────────────────

function OrderHistRow({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const tcfg = TYPE_CFG[order.type as keyof typeof TYPE_CFG] ?? TYPE_CFG.BMHP;
  const Icon = tcfg.icon;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1", tcfg.cls)}>
          <Icon size={13} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 font-mono">{order.noOrder}</span>
            <span className={cn("text-[11px] font-semibold", STATUS_COLOR[order.status] ?? "text-slate-500")}>
              {order.status}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {order.type} · {order.tanggal} · {order.dokter}
          </p>
        </div>
        <span className="text-[10px] text-slate-400 shrink-0">{order.items.length} item</span>
        {open ? <ChevronUp size={13} className="text-slate-400 shrink-0" /> : <ChevronDown size={13} className="text-slate-400 shrink-0" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 space-y-1.5">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-700">{item.nama}</span>
                  <span className="text-[10px] text-slate-400">{item.detail}</span>
                </div>
              ))}
              {order.catatan && (
                <p className="mt-2 text-[11px] italic text-slate-500">Catatan: {order.catatan}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

interface Props { noRM: string }

export default function RiwayatPane({ noRM }: Props) {
  const allOrders: Order[] = ORDERS_MOCK[noRM] ?? [];

  // Group by date
  const grouped: Record<string, Order[]> = {};
  for (const o of [...allOrders].reverse()) {
    const key = o.tanggal;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(o);
  }

  if (allOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 py-16 text-center">
        <ClipboardList size={24} className="text-slate-300" />
        <p className="text-sm text-slate-500">Belum ada riwayat order untuk pasien ini.</p>
      </div>
    );
  }

  const resepCount = allOrders.filter((o) => o.type === "Resep").length;
  const labCount   = allOrders.filter((o) => o.type === "Lab").length;
  const radCount   = allOrders.filter((o) => o.type === "Radiologi").length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Resep Obat",    count: resepCount, cls: "border-indigo-200 bg-indigo-50 text-indigo-700" },
          { label: "Order Lab",     count: labCount,   cls: "border-sky-200 bg-sky-50 text-sky-700"          },
          { label: "Order Radiologi", count: radCount, cls: "border-violet-200 bg-violet-50 text-violet-700" },
        ].map(({ label, count, cls }) => (
          <div key={label} className={cn("rounded-xl border px-3 py-2.5 text-center", cls)}>
            <p className="text-xl font-black tabular-nums">{count}</p>
            <p className="text-[11px] font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Grouped orders */}
      {Object.entries(grouped).map(([date, orders]) => (
        <section key={date}>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">{date}</p>
          <div className="space-y-2">
            {orders.map((o) => <OrderHistRow key={o.id} order={o} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
