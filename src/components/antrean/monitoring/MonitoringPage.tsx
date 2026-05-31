"use client";

// ANT5 — Monitoring Status Antrian: timeline TaskID per antrean + monitoring
// pengiriman outbox BPJS + koreksi/re-send + KPI compliance.

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Search, CheckCircle2, AlertTriangle, Clock3, Gauge, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSkeletonDelay } from "@/components/master/shared";
import { useAntreanStore, seedAntrean } from "@/lib/antrean/antreanStore";
import { buildSeedAntrean } from "@/lib/antrean/antreanSeed";
import { TASK_SEQUENCE, type AntreanRecord, type TaskLog } from "@/lib/antrean/types";
import { StatusBadge, JenisBadge } from "../board/boardShared";
import { TaskTimeline } from "./TaskTimeline";
import { TaskEditModal } from "./TaskEditModal";
import { KIRIM_META, fmtDur } from "./monitoringShared";

interface EditTarget {
  rec: AntreanRecord;
  task: TaskLog;
}
interface Toast {
  id: number;
  text: string;
}

const FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "gagal", label: "Ada Gagal" },
  { key: "pending", label: "Ada Pending" },
  { key: "lengkap", label: "Semua Terkirim" },
] as const;

export function MonitoringPage() {
  const store = useAntreanStore();
  const loaded = useSkeletonDelay(500);

  const [filter, setFilter] = useState<string>("semua");
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    seedAntrean(buildSeedAntrean());
  }, []);

  const list = useMemo<AntreanRecord[]>(
    () => Object.values(store.byKode).sort((a, b) => b.createdAt - a.createdAt),
    [store.byKode],
  );

  const kpi = useMemo(() => {
    let total = 0, terkirim = 0, gagal = 0, pending = 0;
    const gaps: number[] = [];
    for (const rec of list) {
      const seq = TASK_SEQUENCE[rec.jenisPasien];
      const ordered = [...rec.tasks].sort((a, b) => seq.indexOf(a.taskid) - seq.indexOf(b.taskid));
      for (const t of rec.tasks) {
        total++;
        if (t.kirim === "terkirim") terkirim++;
        else if (t.kirim === "gagal") gagal++;
        else pending++;
      }
      for (let i = 1; i < ordered.length; i++) {
        const d = ordered[i].waktu - ordered[i - 1].waktu;
        if (d > 0) gaps.push(d);
      }
    }
    const avgGap = gaps.length ? gaps.reduce((s, n) => s + n, 0) / gaps.length : 0;
    return {
      total,
      terkirim,
      gagal,
      pending,
      compliance: total ? Math.round((terkirim / total) * 100) : 100,
      avgGap,
    };
  }, [list]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((rec) => {
      if (filter === "gagal" && !rec.tasks.some((t) => t.kirim === "gagal")) return false;
      if (filter === "pending" && !rec.tasks.some((t) => t.kirim === "pending")) return false;
      if (filter === "lengkap" && (rec.tasks.length === 0 || !rec.tasks.every((t) => t.kirim === "terkirim"))) return false;
      if (q && !`${rec.nomorAntrean} ${rec.pasien.nama} ${rec.kodebooking} ${rec.poli}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [list, filter, query]);

  const showToast = (text: string) => {
    const id = Date.now();
    setToast({ id, text });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2600);
  };

  if (!loaded) return <Skeleton />;

  return (
    <div className="flex w-full flex-col gap-5 p-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-800">
          <Activity className="h-6 w-6 text-sky-600" /> Monitoring Status Antrian
        </h1>
        <p className="m-xs text-slate-500">Timeline TaskID Antrol BPJS per antrean, status pengiriman outbox, koreksi & kirim ulang.</p>
      </header>

      {/* KPI compliance */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Gauge} label="Compliance Kirim" value={`${kpi.compliance}%`} sub={`${kpi.terkirim}/${kpi.total} task`} tone="bg-sky-100 text-sky-600" />
        <Kpi icon={AlertTriangle} label="Task Gagal" value={`${kpi.gagal}`} sub="perlu re-send" tone="bg-rose-100 text-rose-600" />
        <Kpi icon={Clock3} label="Task Pending" value={`${kpi.pending}`} sub="antre di outbox" tone="bg-amber-100 text-amber-600" />
        <Kpi icon={CheckCircle2} label="Rata-rata Jeda Tahap" value={fmtDur(kpi.avgGap)} sub="antar TaskID" tone="bg-emerald-100 text-emerald-600" />
      </section>

      {/* Filter + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-3 py-1.5 m-tiny font-semibold transition",
                filter === f.key ? "bg-sky-600 text-white shadow-sm" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nomor / nama / kode booking…"
            className="w-72 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 m-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </div>
      </div>

      {/* List */}
      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center m-sm text-slate-400 ring-1 ring-slate-200">
          Tidak ada antrean sesuai filter.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((rec) => (
            <AntreanMonitorCard key={rec.kodebooking} rec={rec} onEdit={(task) => setEdit({ rec, task })} />
          ))}
        </div>
      )}

      {edit && (
        <TaskEditModal rec={edit.rec} task={edit.task} onClose={() => setEdit(null)} onToast={showToast} />
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 m-sm font-semibold text-white shadow-xl"
          >
            <Send className="h-4 w-4 text-sky-400" /> {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AntreanMonitorCard({ rec, onEdit }: { rec: AntreanRecord; onEdit: (t: TaskLog) => void }) {
  const counts = rec.tasks.reduce(
    (acc, t) => { acc[t.kirim]++; return acc; },
    { terkirim: 0, gagal: 0, pending: 0 } as Record<string, number>,
  );
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="m-base font-extrabold tabular-nums text-sky-700">{rec.nomorAntrean}</span>
          <div>
            <p className="m-sm font-bold text-slate-800">{rec.pasien.nama}</p>
            <p className="m-mini font-mono text-slate-400">{rec.kodebooking}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <JenisBadge jenis={rec.jenisPasien} />
          <StatusBadge status={rec.status} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(["terkirim", "gagal", "pending"] as const).map((k) =>
          counts[k] > 0 ? (
            <span key={k} className={cn("rounded-md px-2 py-0.5 m-mini font-semibold", KIRIM_META[k].badge)}>
              {counts[k]} {KIRIM_META[k].label.toLowerCase()}
            </span>
          ) : null,
        )}
      </div>

      <div className="border-t border-slate-100 pt-3">
        <TaskTimeline rec={rec} onEdit={onEdit} />
      </div>
    </motion.section>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone }: { icon: typeof Gauge; label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="m-tiny font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-extrabold leading-tight text-slate-800 tabular-nums">{value}</p>
        <p className="m-mini text-slate-400">{sub}</p>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex w-full flex-col gap-5 p-6">
      <div className="h-10 w-80 animate-pulse rounded-xl bg-slate-100" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
