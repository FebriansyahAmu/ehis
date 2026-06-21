"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, FlaskConical, Clock, CheckCircle2, AlertTriangle, Zap, Inbox, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LabOrder, type UnitAsalLab, type LabStatus,
  LAB_STATUS_CFG, PRIORITAS_CFG,
} from "./labShared";
import { receiveLabOrder } from "@/lib/api/lab/labOrder";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import LabOrderCard from "./LabOrderCard";

// ── Types ─────────────────────────────────────────────────

type UnitFilter  = "Semua" | UnitAsalLab;
type StatusGroup = "Semua" | "Antrian" | "Proses" | "Selesai" | "Ditolak";

const UNIT_TABS: UnitFilter[] = ["Semua", "IGD", "Rawat Inap", "Rawat Jalan"];
const STATUS_GROUPS: { value: StatusGroup; label: string; statuses: LabStatus[] }[] = [
  { value: "Semua",    label: "Semua",       statuses: [] },
  { value: "Antrian",  label: "Antrian",     statuses: ["Diterima"]  },
  { value: "Proses",   label: "Proses",      statuses: ["Ambil Sampel", "Sampel Diterima", "Dianalisa", "Divalidasi"] },
  { value: "Selesai",  label: "Selesai",     statuses: ["Selesai"]  },
  { value: "Ditolak",  label: "Ditolak",     statuses: ["Ditolak"]  },
];

const PAGE_SIZE = 6;

// ── Animated number (count-up pop saat berubah) ───────────

function AnimatedNum({ value }: { value: number }) {
  return (
    <span className="relative inline-flex h-[1em] items-center overflow-hidden tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "0.7em", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-0.7em", opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

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
  icon: React.ReactNode; value: number;
  label: string; sub?: string; className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm", className)}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-lg font-bold leading-none text-slate-900"><AnimatedNum value={value} /></p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-500">{label}</p>
        {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function LabBoard({
  orders, loading, onRefetch,
}: {
  orders: LabOrder[];
  loading: boolean;
  onRefetch: () => void | Promise<void>;
}) {
  const [unit,        setUnit]        = useState<UnitFilter>("Semua");
  const [statusGroup, setStatusGroup] = useState<StatusGroup>("Semua");
  const [search,      setSearch]      = useState("");
  const [citoOnly,    setCitoOnly]    = useState(false);
  const [page,        setPage]        = useState(1);
  const [receivingId, setReceivingId] = useState<string | null>(null);

  // "Menunggu" = belum diterima Lab (reception). Sisanya = worklist (sudah diterima).
  const pending  = useMemo(() => orders.filter((o) => o.status === "Menunggu"), [orders]);
  const worklist = useMemo(() => orders.filter((o) => o.status !== "Menunggu"), [orders]);

  // Stats (atas seluruh order)
  const citoPending  = orders.filter((o) => o.prioritas === "CITO" && o.status !== "Selesai" && o.status !== "Ditolak").length;
  const antrian      = orders.filter((o) => ["Menunggu", "Diterima"].includes(o.status)).length;
  const inProcess    = orders.filter((o) => ["Ambil Sampel", "Sampel Diterima", "Dianalisa", "Divalidasi"].includes(o.status)).length;
  const selesai      = orders.filter((o) => o.status === "Selesai").length;
  const hasCritical  = orders.filter((o) => o.criticalNotifs?.some((n) => !n.confirmed)).length;

  async function handleTerima(o: LabOrder) {
    setReceivingId(o.id);
    try {
      await receiveLabOrder(o.id);
      toast.success("Order diterima", `${o.namaPasien} · ${o.noOrder} masuk worklist`);
      await onRefetch();
    } catch (e) {
      toast.error("Gagal menerima order", e instanceof ApiError ? e.message : undefined);
    } finally {
      setReceivingId(null);
    }
  }

  const filtered = useMemo(() => {
    let list = worklist;
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
  }, [worklist, unit, statusGroup, search, citoOnly]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage   = Math.min(page, Math.max(1, totalPages));
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
          value={selesai}
          label="Selesai"
          className={selesai > 0 ? "border-emerald-100" : ""}
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

      {/* Belum Diterima (reception non-Poli) — order IGD/RI wajib diterima sebelum masuk worklist */}
      {pending.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-200 bg-amber-50/50 p-4"
          aria-label="Order belum diterima"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Inbox size={16} className="shrink-0 text-amber-600" aria-hidden="true" />
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-amber-800">
              Belum Diterima
              <motion.span
                key={pending.length}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-black tabular-nums text-white"
              >
                {pending.length}
              </motion.span>
            </h2>
            <span className="text-[11px] text-amber-600">order baru menunggu diterima sebelum masuk worklist</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {pending.map((o) => (
              <div key={o.id} className="flex items-start gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2.5 shadow-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-slate-800">{o.namaPasien}</span>
                    {o.prioritas !== "Rutin" && (
                      <span className={cn("shrink-0 rounded px-1 py-0.5 text-[9px] font-bold", PRIORITAS_CFG[o.prioritas].badge)}>{o.prioritas}</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">{o.noRM} · {o.unitAsal} · {o.items.length} tes · {o.jam}</p>
                  {/* Detail tindakan — daftar pemeriksaan yang diorder */}
                  {o.items.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {o.items.slice(0, 4).map((item) => (
                        <span
                          key={item.id}
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px]",
                            item.isSpecial
                              ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                              : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {item.nama}
                        </span>
                      ))}
                      {o.items.length > 4 && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
                          +{o.items.length - 4} lainnya
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleTerima(o)}
                  disabled={receivingId === o.id}
                  className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
                  aria-label={`Terima order ${o.noOrder}`}
                >
                  {receivingId === o.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Terima
                </button>
              </div>
            ))}
          </div>
        </motion.section>
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
          <div className="relative min-w-40 flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari pasien, order…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-8 text-[12px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
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
            <p className="text-sm font-medium text-slate-400">
              {worklist.length === 0 && pending.length === 0 ? "Belum ada order lab" : "Tidak ada order ditemukan"}
            </p>
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
            key={`grid-${unit}-${statusGroup}-${citoOnly}-${search}-${safePage}`}
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
            {filtered.length} order · Hal. {safePage}/{totalPages}
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
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
                  p === safePage ? "bg-sky-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
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
