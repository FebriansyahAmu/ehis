"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, FlaskConical, Clock, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LabOrder, type UnitAsalLab, type LabStatus,
  deriveLabOrders, LAB_STATUS_CFG, PRIORITAS_CFG,
} from "./labShared";
import LabOrderCard from "./LabOrderCard";

// ── Types ─────────────────────────────────────────────────

type UnitFilter  = "Semua" | UnitAsalLab;
type StatusGroup = "Semua" | "Antrian" | "Proses" | "Selesai" | "Ditolak";

const UNIT_TABS: UnitFilter[] = ["Semua", "IGD", "Rawat Inap", "Rawat Jalan"];
const STATUS_GROUPS: { value: StatusGroup; label: string; statuses: LabStatus[] }[] = [
  { value: "Semua",    label: "Semua",       statuses: [] },
  { value: "Antrian",  label: "Antrian",     statuses: ["Menunggu", "Diterima"]  },
  { value: "Proses",   label: "Proses",      statuses: ["Ambil Sampel", "Sampel Diterima", "Dianalisa", "Divalidasi"] },
  { value: "Selesai",  label: "Selesai",     statuses: ["Selesai"]  },
  { value: "Ditolak",  label: "Ditolak",     statuses: ["Ditolak"]  },
];

const PAGE_SIZE = 6;

// ── Skeleton ──────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-2">
        <div className="h-8 w-8 rounded-lg bg-slate-100" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-2/3 rounded bg-slate-100" />
          <div className="h-2.5 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-3 flex gap-1.5">
        <div className="h-4 w-12 rounded-full bg-slate-100" />
        <div className="h-4 w-16 rounded-full bg-slate-100" />
      </div>
      <div className="mt-3 flex gap-1">
        <div className="h-4 w-24 rounded bg-slate-100" />
        <div className="h-4 w-20 rounded bg-slate-100" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-1.5 w-full rounded-full bg-slate-100" />
        <div className="flex justify-between">
          <div className="h-3 w-24 rounded bg-slate-100" />
          <div className="h-6 w-20 rounded-lg bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────

function StatCard({
  icon, value, label, sub, className,
}: {
  icon: React.ReactNode; value: number | string;
  label: string; sub?: string; className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm", className)}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-lg font-bold leading-none tabular-nums text-slate-900">{value}</p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-500">{label}</p>
        {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function LabBoard() {
  const [unit,        setUnit]        = useState<UnitFilter>("Semua");
  const [statusGroup, setStatusGroup] = useState<StatusGroup>("Semua");
  const [search,      setSearch]      = useState("");
  const [citoOnly,    setCitoOnly]    = useState(false);
  const [page,        setPage]        = useState(1);
  const [loading]                     = useState(false);

  const allOrders = useMemo(() => deriveLabOrders(), []);

  // Stats
  const citoPending  = allOrders.filter((o) => o.prioritas === "CITO" && o.status !== "Selesai" && o.status !== "Ditolak").length;
  const antrian      = allOrders.filter((o) => ["Menunggu", "Diterima"].includes(o.status)).length;
  const inProcess    = allOrders.filter((o) => ["Ambil Sampel", "Sampel Diterima", "Dianalisa", "Divalidasi"].includes(o.status)).length;
  const selesaiHari  = allOrders.filter((o) => o.status === "Selesai" && o.tanggal === "2026-05-18").length;
  const hasCritical  = allOrders.filter((o) => o.criticalNotifs?.some((n) => !n.confirmed)).length;

  const filtered = useMemo(() => {
    let list = allOrders;
    if (unit !== "Semua")        list = list.filter((o) => o.unitAsal === unit);
    if (citoOnly)                list = list.filter((o) => o.prioritas === "CITO");
    if (statusGroup !== "Semua") {
      const sg = STATUS_GROUPS.find((g) => g.value === statusGroup)!;
      list = list.filter((o) => sg.statuses.includes(o.status));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        o.namaPasien.toLowerCase().includes(q) ||
        o.noRM.toLowerCase().includes(q) ||
        o.noOrder.toLowerCase().includes(q) ||
        o.dokter.toLowerCase().includes(q) ||
        o.items.some((i) => i.nama.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [allOrders, unit, statusGroup, search, citoOnly]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFilter(setter: (v: never) => void, val: never) {
    setter(val);
    setPage(1);
  }

  return (
    <div className="space-y-5">

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Zap size={18} className="text-rose-500" />}
          value={citoPending}
          label="CITO Aktif"
          sub="Belum selesai"
          className={citoPending > 0 ? "border-rose-200 ring-1 ring-rose-100" : ""}
        />
        <StatCard
          icon={<Clock size={18} className="text-sky-500" />}
          value={antrian}
          label="Antrian"
          sub="Menunggu / Diterima"
        />
        <StatCard
          icon={<FlaskConical size={18} className="text-amber-500" />}
          value={inProcess}
          label="Diproses"
          sub="Analisa / Validasi"
        />
        <StatCard
          icon={<CheckCircle2 size={18} className="text-emerald-500" />}
          value={selesaiHari}
          label="Selesai Hari Ini"
          className={selesaiHari > 0 ? "border-emerald-100" : ""}
        />
      </div>

      {/* Critical Value Alert Banner */}
      {hasCritical > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100">
            <AlertTriangle size={16} className="text-rose-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-rose-800">
              {hasCritical} Order dengan Nilai Kritis Belum Dikonfirmasi
            </p>
            <p className="text-xs text-rose-600">
              Konfirmasi notifikasi ke dokter pengirim sesuai ISO 15189 §5.6.2 · SNARS AP 5.9
            </p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        {/* Unit Tabs */}
        <div className="flex gap-1">
          {UNIT_TABS.map((u) => (
            <button
              key={u}
              onClick={() => handleFilter(setUnit as never, u as never)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors",
                unit === u
                  ? "bg-sky-600 text-white"
                  : "text-slate-500 hover:bg-sky-50 hover:text-sky-700",
              )}
            >
              {u}
            </button>
          ))}
        </div>

        {/* Status + Search row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_GROUPS.map((g) => (
              <button
                key={g.value}
                onClick={() => handleFilter(setStatusGroup as never, g.value as never)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  statusGroup === g.value
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* CITO toggle */}
          <button
            onClick={() => { setCitoOnly((p) => !p); setPage(1); }}
            className={cn(
              "ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-colors",
              citoOnly ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-600 hover:bg-rose-100",
            )}
          >
            <Zap size={10} />
            CITO
          </button>

          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari pasien, order…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-8 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X size={12} className="text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : paginated.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-16 text-center"
          >
            <FlaskConical size={32} className="text-slate-300" />
            <p className="text-sm font-medium text-slate-400">Tidak ada order ditemukan</p>
            {(search || unit !== "Semua" || statusGroup !== "Semua" || citoOnly) && (
              <button
                onClick={() => { setSearch(""); setUnit("Semua"); setStatusGroup("Semua"); setCitoOnly(false); }}
                className="text-xs text-sky-600 hover:underline"
              >
                Reset filter
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {paginated.map((order) => (
              <LabOrderCard key={order.id} order={order} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {filtered.length} order · Hal. {page}/{totalPages}
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  p === page ? "bg-sky-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Status legend */}
      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        {(Object.entries(LAB_STATUS_CFG) as [string, typeof LAB_STATUS_CFG[keyof typeof LAB_STATUS_CFG]][])
          .map(([k, v]) => (
            <span key={k} className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className={cn("h-2 w-2 rounded-full", v.dot)} />
              {v.label}
            </span>
          ))}
      </div>
    </div>
  );
}
