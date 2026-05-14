"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListChecks, LayoutList, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  ORDERS_MOCK, FILTER_OPTS, TODAY_LABEL,
  groupByDate, matchesSearch,
  type Order, type OrderType, type OrderStatus,
  type FilterValue, type ConfirmTarget, type ToastData,
  type DaftarOrderPatient,
} from "./daftarOrder/daftarOrderShared";
import { OrderRow } from "./daftarOrder/OrderRow";
import { ActiveBanner, StatCard } from "./daftarOrder/OrderStats";
import { ConfirmCancelDialog, CancelToast } from "./daftarOrder/CancelDialog";

// ── Animations ────────────────────────────────────────────

const LIST_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0 },
};

// ── Date separator ────────────────────────────────────────

function DateSep({ tanggal, count }: { tanggal: string; count: number }) {
  const label = tanggal === TODAY_LABEL ? "Hari ini" : tanggal;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className="h-px flex-1 bg-slate-100" />
      <div className="flex items-center gap-1.5">
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
          {label}
        </span>
        <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
          {count}
        </span>
      </div>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────

function EmptyState({ filter, query }: { filter: FilterValue; query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-14 text-center"
    >
      <LayoutList size={22} className="text-slate-300" />
      <p className="text-xs font-medium text-slate-400">
        {query
          ? `Tidak ada order yang cocok dengan "${query}"`
          : filter === "Semua"
            ? "Belum ada order untuk pasien ini"
            : `Tidak ada order ${filter} ditemukan`}
      </p>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────

export default function DaftarOrderTab({ patient }: { patient: DaftarOrderPatient }) {
  const [orders, setOrders]               = useState<Order[]>(() => ORDERS_MOCK[patient.noRM] ?? []);
  const [filter, setFilter]               = useState<FilterValue>("Semua");
  const [query, setQuery]                 = useState("");
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [toast, setToast]                 = useState<ToastData | null>(null);

  // Auto-dismiss toast after 3.5 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function handleRequestCancel(id: string, noOrder: string, type: OrderType, itemCount: number) {
    setConfirmTarget({ id, noOrder, type, itemCount });
  }

  function handleConfirmCancel() {
    if (!confirmTarget) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === confirmTarget.id ? { ...o, status: "Dibatalkan" as OrderStatus } : o,
      ),
    );
    setToast({ uid: Date.now(), noOrder: confirmTarget.noOrder, type: confirmTarget.type });
    setConfirmTarget(null);
  }

  const byType   = (type: OrderType) => orders.filter((o) => o.type === type);
  const activeCount = orders.filter((o) => ["Menunggu", "Diterima", "Diproses"].includes(o.status)).length;

  const filtered = orders
    .filter((o) => filter === "Semua" || o.type === filter)
    .filter((o) => matchesSearch(o, query));

  const grouped = groupByDate(filtered);

  return (
    <div className="flex flex-col gap-4">

      {/* Active orders banner */}
      <ActiveBanner count={activeCount} />

      {/* Stat cards — 2×2 mobile, 4×1 sm+ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["Resep", "Lab", "Radiologi", "BMHP"] as OrderType[]).map((type) => (
          <StatCard
            key={type}
            type={type}
            orders={byType(type)}
            active={filter === type}
            onClick={() => setFilter((f) => (f === type ? "Semua" : type))}
          />
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari order, obat, dokter..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-8 text-xs text-slate-700 placeholder:text-slate-400 transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                type="button"
                onClick={() => setQuery("")}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
                aria-label="Hapus pencarian"
              >
                <X size={12} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <ListChecks size={13} className="shrink-0 text-slate-400" />
          {FILTER_OPTS.map(({ value, label }) => {
            const count    = value === "Semua" ? orders.length : byType(value as OrderType).length;
            const isActive = filter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                  isActive
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700",
                )}
              >
                {label}
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500",
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Order list grouped by date — with stagger animation */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <EmptyState key="empty" filter={filter} query={query} />
        ) : (
          <motion.div
            key={filter + query}
            variants={LIST_VARIANTS}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-2"
          >
            {grouped.map(([tanggal, grpOrders]) => (
              <div key={tanggal} className="flex flex-col gap-2">
                <DateSep tanggal={tanggal} count={grpOrders.length} />
                {grpOrders.map((order) => (
                  <motion.div key={order.id} variants={ITEM_VARIANTS}>
                    <OrderRow order={order} onRequestCancel={handleRequestCancel} />
                  </motion.div>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm cancel dialog */}
      <AnimatePresence>
        {confirmTarget && (
          <ConfirmCancelDialog
            target={confirmTarget}
            onConfirm={handleConfirmCancel}
            onClose={() => setConfirmTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Cancel toast */}
      <AnimatePresence>
        {toast && (
          <CancelToast data={toast} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

    </div>
  );
}
