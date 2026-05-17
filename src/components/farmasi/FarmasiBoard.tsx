"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, AlertTriangle, Clock, CheckCircle2, Package, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deriveResepOrders,
  STATUS_CFG, DEPO_CFG,
  type FarmasiOrder, type FarmasiStatus, type DepoTujuan,
} from "./farmasiShared";
import OrderCard from "./OrderCard";

// ── Constants ──────────────────────────────────────────────

const ITEMS_PER_PAGE = 6;
const DEPO_TABS: ("Semua" | DepoTujuan)[] = ["Semua", "Depo IGD", "Apotek RI", "Apotek RJ"];
const STATUS_FILTERS: ("Semua" | FarmasiStatus)[] = [
  "Semua", "Menunggu", "Ditelaah", "Siap Diserahkan", "Selesai", "Dikembalikan",
];

// ── Stat card ──────────────────────────────────────────────

interface StatCardProps { label: string; value: number; badge: string; dot: string; icon: React.ReactNode }

function StatCard({ label, value, badge, dot, icon }: StatCardProps) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", badge)}>
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", badge)}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold tabular-nums leading-none">{value}</p>
        <p className="mt-0.5 text-xs font-medium opacity-80">{label}</p>
      </div>
      <span className={cn("ml-auto h-2 w-2 rounded-full", dot)} />
    </div>
  );
}

// ── Main board ─────────────────────────────────────────────

export default function FarmasiBoard() {
  const orders = useMemo(() => deriveResepOrders(), []);

  const [depo,   setDepo]   = useState<"Semua" | DepoTujuan>("Semua");
  const [status, setStatus] = useState<"Semua" | FarmasiStatus>("Semua");
  const [search, setSearch] = useState("");
  const [hamOnly, setHamOnly] = useState(false);
  const [page,   setPage]   = useState(1);

  // ── Stats ──────────────────────────────────────────────
  const stats = useMemo(() => ({
    menunggu:     orders.filter((o) => o.status === "Menunggu").length,
    ditelaah:     orders.filter((o) => o.status === "Ditelaah").length,
    siapSerahkan: orders.filter((o) => o.status === "Siap Diserahkan").length,
    selesai:      orders.filter((o) => o.status === "Selesai").length,
    ham:          orders.filter((o) => o.hasHAM && o.status !== "Selesai").length,
  }), [orders]);

  // ── Filtering ──────────────────────────────────────────
  const filtered = useMemo(() => orders.filter((o) => {
    const matchDepo   = depo   === "Semua" || o.depo   === depo;
    const matchStatus = status === "Semua" || o.status === status;
    const matchHAM    = !hamOnly || o.hasHAM;
    const q           = search.toLowerCase();
    const matchSearch = !q ||
      o.namaPasien.toLowerCase().includes(q) ||
      o.noRM.toLowerCase().includes(q)       ||
      o.noOrder.toLowerCase().includes(q)    ||
      o.items.some((i) => i.namaObat.toLowerCase().includes(q));
    return matchDepo && matchStatus && matchHAM && matchSearch;
  }), [orders, depo, status, hamOnly, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);
  const gridKey    = `${depo}|${status}|${hamOnly}|${search}|${safePage}`;

  function resetPage() { setPage(1); }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Stat bar ── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Ringkasan farmasi">
        <StatCard label="Menunggu Telaah"  value={stats.menunggu}     badge="border-amber-200 bg-amber-50 text-amber-800"      dot="bg-amber-400"   icon={<Clock size={16} className="text-amber-600" />} />
        <StatCard label="Siap Dispensasi"  value={stats.ditelaah}     badge="border-sky-200 bg-sky-50 text-sky-800"            dot="bg-sky-500"     icon={<Package size={16} className="text-sky-600" />} />
        <StatCard label="Siap Diserahkan"  value={stats.siapSerahkan} badge="border-indigo-200 bg-indigo-50 text-indigo-800"   dot="bg-indigo-500"  icon={<CheckCircle2 size={16} className="text-indigo-600" />} />
        <StatCard label="Selesai Hari Ini" value={stats.selesai}      badge="border-emerald-200 bg-emerald-50 text-emerald-800" dot="bg-emerald-500" icon={<CheckCircle2 size={16} className="text-emerald-600" />} />
      </section>

      {/* HAM alert */}
      {stats.ham > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
        >
          <AlertTriangle size={15} className="text-rose-600 shrink-0" aria-hidden="true" />
          <p className="text-sm font-semibold text-rose-700">
            {stats.ham} order mengandung High Alert Medication — verifikasi ganda wajib sebelum dispensasi.
          </p>
        </motion.div>
      )}

      {/* ── Depo tabs ── */}
      <div className="flex flex-wrap items-center gap-2">
        {DEPO_TABS.map((d) => {
          const count  = d === "Semua" ? orders.length : orders.filter((o) => o.depo === d).length;
          const depoCls = d !== "Semua" ? DEPO_CFG[d].badge : "";
          return (
            <button
              key={d}
              onClick={() => { setDepo(d); resetPage(); }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                depo === d
                  ? d === "Semua" ? "bg-slate-800 text-white border-slate-800" : cn(depoCls, "border-transparent shadow-sm")
                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              {d}
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                depo === d ? "bg-white/30 text-inherit" : "bg-slate-100 text-slate-500",
              )}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as typeof status); resetPage(); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          aria-label="Filter status"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>{s === "Semua" ? "Semua Status" : STATUS_CFG[s as FarmasiStatus]?.label ?? s}</option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
          <input
            type="checkbox" checked={hamOnly}
            onChange={(e) => { setHamOnly(e.target.checked); resetPage(); }}
            className="h-3.5 w-3.5 rounded border-slate-300 accent-rose-600"
          />
          <AlertTriangle size={11} className="text-rose-500" />
          HAM Only
        </label>

        <button
          onClick={() => { setDepo("Semua"); setStatus("Semua"); setHamOnly(false); setSearch(""); resetPage(); }}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
          aria-label="Reset filter"
        >
          <RotateCcw size={11} />Reset
        </button>

        <div className="relative ml-auto">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search" value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            placeholder="Cari pasien / obat / No. RM…"
            className="w-52 rounded-lg border border-slate-200 bg-white pl-7 pr-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs text-slate-400">
        Menampilkan <span className="font-semibold text-slate-600">{filtered.length}</span> order
        {totalPages > 1 && <span className="ml-1">· hal. {safePage}/{totalPages}</span>}
      </p>

      {/* ── Cards grid ── */}
      {paged.length > 0 ? (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={gridKey}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {paged.map((order: FarmasiOrder, i) => (
              <OrderCard key={order.id} order={order} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <Package size={24} className="text-slate-300 mb-2" />
          <p className="font-medium text-slate-500">Tidak ada order ditemukan</p>
          <p className="mt-1 text-sm text-slate-400">Coba ubah filter atau kata pencarian</p>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-400">
            {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} order
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Halaman sebelumnya"><ChevronLeft size={13} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)}
                className={cn("flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-semibold transition",
                  n === safePage ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50")}
                aria-label={`Halaman ${n}`} aria-current={n === safePage ? "page" : undefined}>{n}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Halaman berikutnya"><ChevronRight size={13} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
