"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, CheckCircle2, XCircle, Timer, Filter,
  ChevronDown, ChevronUp, Download, Search,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BPJSAuditEntry, BPJSAuditMethod } from "@/lib/bpjs/bpjsShared";
import { getAuditEntries, subscribeAudit } from "@/lib/bpjs/auditStore";
import { seedAuditTrailMock } from "@/lib/bpjs/mock/auditTrailMock";
import AuditDetailModal from "./AuditDetailModal";

// ── Skeleton ──────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />;
}
function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Bone className="h-8 w-56" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Bone key={i} className="h-20 rounded-2xl" />)}
      </div>
      <Bone className="h-16 rounded-2xl" />
      <Bone className="h-72 rounded-2xl" />
    </div>
  );
}

// ── Chips ─────────────────────────────────────────────────

const METHOD_CLS: Record<string, string> = {
  GET:    "bg-sky-100 text-sky-700",
  POST:   "bg-emerald-100 text-emerald-700",
  PUT:    "bg-amber-100 text-amber-700",
  DELETE: "bg-rose-100 text-rose-700",
};
const CODE_CLS: Record<string, string> = {
  "200": "bg-emerald-100 text-emerald-700",
  "201": "bg-slate-100 text-slate-600",
  "202": "bg-amber-100 text-amber-700",
  "203": "bg-amber-100 text-amber-700",
  "204": "bg-amber-100 text-amber-700",
  "500": "bg-rose-100 text-rose-700",
  "503": "bg-rose-100 text-rose-700",
};

// ── Stat Card ─────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, iconCls, delay = 0,
}: {
  icon: React.ElementType; label: string; value: string;
  sub: string; iconCls: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconCls)}>
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-normal leading-none text-slate-900">{value}</p>
        <p className="mt-0.5 text-[10px] font-normal text-slate-400">{sub}</p>
      </div>
    </motion.div>
  );
}

// ── Duration Bar ──────────────────────────────────────────

function DurationBar({ ms }: { ms: number }) {
  const MAX_MS = 10000;
  const pct = Math.min(1, ms / MAX_MS);
  const barCls = pct >= 0.7 ? "bg-rose-400" : pct >= 0.35 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full", barCls)} style={{ width: `${pct * 100}%` }} />
      </div>
      <span className="font-mono text-[11px] text-slate-500 tabular-nums">
        {ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`}
      </span>
    </div>
  );
}

// ── CSV Export ────────────────────────────────────────────

function exportCsv(rows: readonly BPJSAuditEntry[]): void {
  const header = "id,timestamp,endpoint,method,responseCode,success,durationMs,actor,actorRole,idempotencyKey,errorType,retryCount";
  const lines = rows.map((e) =>
    [
      e.id, e.timestamp, `"${e.endpoint}"`, e.method, e.responseCode,
      e.success, e.durationMs, `"${e.actor}"`, e.actorRole,
      e.idempotencyKey ?? "", e.errorType ?? "", e.retryCount ?? 0,
    ].join(","),
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `bpjs-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Filter Bar ────────────────────────────────────────────

const METHODS: Array<"ALL" | BPJSAuditMethod> = ["ALL", "GET", "POST", "PUT", "DELETE"];
const STATUSES = ["ALL", "SUCCESS", "ERROR"] as const;
type StatusFilter = (typeof STATUSES)[number];

interface FilterState {
  tglMulai: string;
  tglAkhir: string;
  method: "ALL" | BPJSAuditMethod;
  status: StatusFilter;
  actor: string;
}

function FilterBar({
  open, toggle, filter, setFilter, endpointOptions,
}: {
  open: boolean;
  toggle: () => void;
  filter: FilterState;
  setFilter: (f: FilterState) => void;
  endpointOptions: string[];
}) {
  void endpointOptions;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between px-4 py-3 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <span className="flex items-center gap-2">
          <Filter size={13} className="text-slate-400" />
          Filter Audit Trail
        </span>
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="filter-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-3 border-t border-slate-100 px-4 py-3">
              {/* Periode */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-slate-500">Dari</label>
                <input
                  type="date"
                  value={filter.tglMulai}
                  onChange={(e) => setFilter({ ...filter, tglMulai: e.target.value })}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
                <label className="text-[11px] font-medium text-slate-500">s/d</label>
                <input
                  type="date"
                  value={filter.tglAkhir}
                  onChange={(e) => setFilter({ ...filter, tglAkhir: e.target.value })}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>

              {/* Method toggle */}
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
                {METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFilter({ ...filter, method: m })}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition",
                      filter.method === m
                        ? m === "ALL" ? "bg-white text-slate-700 shadow-sm"
                          : cn("bg-white shadow-sm", METHOD_CLS[m])
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Status toggle */}
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilter({ ...filter, status: s })}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition",
                      filter.status === s
                        ? s === "SUCCESS" ? "bg-white text-emerald-700 shadow-sm"
                          : s === "ERROR" ? "bg-white text-rose-700 shadow-sm"
                          : "bg-white text-slate-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    {s === "ALL" ? "Semua" : s === "SUCCESS" ? "Berhasil" : "Gagal"}
                  </button>
                ))}
              </div>

              {/* Actor search */}
              <div className="relative flex items-center">
                <Search size={12} className="absolute left-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari aktor…"
                  value={filter.actor}
                  onChange={(e) => setFilter({ ...filter, actor: e.target.value })}
                  className="rounded-lg border border-slate-200 pl-7 pr-3 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────

function AuditTable({
  rows,
  onDetail,
}: {
  rows: readonly BPJSAuditEntry[];
  onDetail: (e: BPJSAuditEntry) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
        <ClipboardList size={32} strokeWidth={1.5} />
        <p className="text-sm font-medium">Tidak ada audit entry sesuai filter</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="py-2.5 pr-3">Waktu</th>
            <th className="py-2.5 pr-3">Endpoint</th>
            <th className="py-2.5 pr-3">Method</th>
            <th className="py-2.5 pr-3">Kode</th>
            <th className="py-2.5 pr-3">Status</th>
            <th className="py-2.5 pr-3">Durasi</th>
            <th className="py-2.5 pr-3">Aktor</th>
            <th className="py-2.5 pr-3">Idempotency</th>
            <th className="py-2.5 pr-3">Error</th>
            <th className="py-2.5">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((e, idx) => (
            <motion.tr
              key={e.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.3) }}
              className={cn(
                "text-[11px] transition-colors",
                e.success ? "hover:bg-emerald-50/30" : "bg-rose-50/20 hover:bg-rose-50/40",
              )}
            >
              <td className="py-2.5 pr-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                {new Date(e.timestamp).toLocaleString("id-ID", {
                  day: "2-digit", month: "2-digit", year: "2-digit",
                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                })}
              </td>
              <td className="py-2.5 pr-3 max-w-[180px]" title={e.endpoint}>
                <span className="block truncate font-mono text-[10px] text-sky-700">
                  {e.endpoint}
                </span>
              </td>
              <td className="py-2.5 pr-3">
                <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold", METHOD_CLS[e.method] ?? "bg-slate-100 text-slate-600")}>
                  {e.method}
                </span>
              </td>
              <td className="py-2.5 pr-3">
                <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold", CODE_CLS[e.responseCode] ?? "bg-slate-100 text-slate-600")}>
                  {e.responseCode}
                </span>
              </td>
              <td className="py-2.5 pr-3">
                {e.success ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                  <XCircle size={14} className="text-rose-500" />
                )}
              </td>
              <td className="py-2.5 pr-3">
                <DurationBar ms={e.durationMs} />
              </td>
              <td className="py-2.5 pr-3 whitespace-nowrap">
                <p className="text-[11px] text-slate-700">{e.actor}</p>
                <p className="text-[10px] text-slate-400">{e.actorRole}</p>
              </td>
              <td className="py-2.5 pr-3 max-w-[100px]">
                {e.idempotencyKey ? (
                  <span className="block truncate font-mono text-[9px] text-violet-600" title={e.idempotencyKey}>
                    {e.idempotencyKey}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="py-2.5 pr-3">
                {e.errorType ? (
                  <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold text-rose-600">
                    {e.errorType}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="py-2.5">
                <button
                  type="button"
                  onClick={() => onDetail(e)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                >
                  Detail
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

function PaginationBar({
  total,
  page,
  pageSize,
  onPage,
  onPageSize,
}: {
  total: number;
  page: number;
  pageSize: PageSize;
  onPage: (p: number) => void;
  onPageSize: (ps: PageSize) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-[11px]">
      {/* Info */}
      <p className="text-slate-500">
        Menampilkan{" "}
        <span className="font-semibold text-slate-700">{from}–{to}</span>{" "}
        dari{" "}
        <span className="font-semibold text-slate-700">{total}</span> entri
      </p>

      <div className="flex items-center gap-3">
        {/* Per-page */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Baris</span>
          <div className="flex gap-0.5 rounded-lg bg-slate-100 p-0.5">
            {PAGE_SIZE_OPTIONS.map((ps) => (
              <button
                key={ps}
                type="button"
                onClick={() => { onPageSize(ps); onPage(1); }}
                className={cn(
                  "rounded-md px-2 py-0.5 font-semibold transition",
                  pageSize === ps
                    ? "bg-white text-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                {ps}
              </button>
            ))}
          </div>
        </div>

        {/* Nav buttons */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => onPage(1)}
            className="rounded-lg border border-slate-200 p-1 text-slate-500 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:pointer-events-none disabled:opacity-30"
            title="Halaman pertama"
          >
            <ChevronsLeft size={13} />
          </button>
          <button
            type="button"
            disabled={page === 1}
            onClick={() => onPage(page - 1)}
            className="rounded-lg border border-slate-200 p-1 text-slate-500 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:pointer-events-none disabled:opacity-30"
            title="Halaman sebelumnya"
          >
            <ChevronLeft size={13} />
          </button>

          {/* Page indicator */}
          <span className="mx-1.5 tabular-nums text-slate-600">
            <span className="font-semibold text-slate-800">{page}</span>
            <span className="text-slate-400"> / {totalPages}</span>
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            className="rounded-lg border border-slate-200 p-1 text-slate-500 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:pointer-events-none disabled:opacity-30"
            title="Halaman berikutnya"
          >
            <ChevronRight size={13} />
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPage(totalPages)}
            className="rounded-lg border border-slate-200 p-1 text-slate-500 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:pointer-events-none disabled:opacity-30"
            title="Halaman terakhir"
          >
            <ChevronsRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function AuditTrailPage() {
  const [loaded, setLoaded] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);
  const [filter, setFilter] = useState<FilterState>({
    tglMulai: "2026-05-26",
    tglAkhir: "2026-05-30",
    method: "ALL",
    status: "ALL",
    actor: "",
  });
  const [selectedEntry, setSelectedEntry] = useState<BPJSAuditEntry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);

  useEffect(() => {
    seedAuditTrailMock();
    const t = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(t);
  }, []);

  const allEntries = useSyncExternalStore(subscribeAudit, getAuditEntries, () => []);

  const filtered = useMemo(() => {
    return allEntries.filter((e) => {
      const date = e.timestamp.slice(0, 10);
      if (date < filter.tglMulai || date > filter.tglAkhir) return false;
      if (filter.method !== "ALL" && e.method !== filter.method) return false;
      if (filter.status === "SUCCESS" && !e.success) return false;
      if (filter.status === "ERROR" && e.success) return false;
      if (filter.actor && !e.actor.toLowerCase().includes(filter.actor.toLowerCase())) return false;
      return true;
    });
  }, [allEntries, filter]);

  const kpis = useMemo(() => {
    const total   = filtered.length;
    const success = filtered.filter((e) => e.success).length;
    const failed  = total - success;
    const avgMs   = total > 0
      ? Math.round(filtered.reduce((s, e) => s + e.durationMs, 0) / total)
      : 0;
    return { total, success, failed, avgMs };
  }, [filtered]);

  const endpointOptions = useMemo(
    () => [...new Set(allEntries.map((e) => e.endpoint))].sort(),
    [allEntries],
  );

  // Reset ke halaman 1 setiap kali filter mengubah hasil
  useEffect(() => { setPage(1); }, [filtered.length, filter]);

  const paginatedRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  function openDetail(entry: BPJSAuditEntry) {
    setSelectedEntry(entry);
    setModalOpen(true);
  }

  const pageContent = (
    <motion.div
      key="page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-4 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            BPJS Integration Hub
          </p>
          <h1 className="mt-0.5 text-xl font-bold text-slate-800">Audit Trail</h1>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Log panggilan adapter BPJS · Compliance UU PDP 27/2022
          </p>
        </div>
        <button
          type="button"
          onClick={() => exportCsv(filtered)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-600 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
        >
          <Download size={13} />
          Export CSV ({filtered.length})
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total Call" value={String(kpis.total)} sub="dalam filter aktif" iconCls="bg-sky-100 text-sky-600" delay={0} />
        <StatCard icon={CheckCircle2} label="Berhasil" value={String(kpis.success)} sub={`${kpis.total > 0 ? Math.round((kpis.success / kpis.total) * 100) : 0}% dari total`} iconCls="bg-emerald-100 text-emerald-600" delay={0.05} />
        <StatCard icon={XCircle} label="Gagal" value={String(kpis.failed)} sub={`${kpis.total > 0 ? Math.round((kpis.failed / kpis.total) * 100) : 0}% dari total`} iconCls="bg-rose-100 text-rose-600" delay={0.1} />
        <StatCard icon={Timer} label="Rata-rata" value={kpis.avgMs >= 1000 ? `${(kpis.avgMs / 1000).toFixed(1)}s` : `${kpis.avgMs}ms`} sub="durasi per call" iconCls="bg-amber-100 text-amber-600" delay={0.15} />
      </div>

      {/* Filter */}
      <FilterBar
        open={filterOpen}
        toggle={() => setFilterOpen((v) => !v)}
        filter={filter}
        setFilter={setFilter}
        endpointOptions={endpointOptions}
      />

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <AuditTable rows={paginatedRows} onDetail={openDetail} />
        <PaginationBar
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={setPageSize}
        />
      </motion.div>
    </motion.div>
  );

  return (
    <>
      <div className="flex h-full flex-col overflow-y-auto bg-slate-50">
        <AnimatePresence mode="wait">
          {!loaded ? (
            <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <PageSkeleton />
            </motion.div>
          ) : pageContent}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        <AuditDetailModal
          open={modalOpen}
          entry={selectedEntry}
          onClose={() => { setModalOpen(false); setSelectedEntry(null); }}
        />
      </AnimatePresence>
    </>
  );
}
