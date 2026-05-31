"use client";

// Master — Jadwal Dokter (single source). HFIS mock sync + grid mingguan + kuota.
// Consumer: Antrean (estimasi jam + kuota) & RJ via getJadwalDokterFor().

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock,
  Users,
  LayoutGrid,
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  Search,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSkeletonDelay } from "@/components/master/shared";
import {
  useJadwalDokter,
  syncFromHFIS,
  resetJadwal,
  type Hari,
  type JadwalDokter,
  type JadwalSlot,
} from "@/lib/master/jadwalDokterStore";
import { WeeklyGrid } from "./WeeklyGrid";
import { SlotEditModal } from "./SlotEditModal";

interface EditTarget {
  dokter: JadwalDokter;
  hari: Hari;
  slot?: JadwalSlot;
}

export default function JadwalDokterPage() {
  const jadwal = useJadwalDokter();
  const loaded = useSkeletonDelay(500);

  const [poli, setPoli] = useState("ALL");
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const [syncing, setSyncing] = useState(false);

  const poliOptions = useMemo(() => {
    const map = new Map<string, string>();
    jadwal.forEach((d) => map.set(d.poliKode, d.poliNama));
    return Array.from(map, ([kode, nama]) => ({ kode, nama }));
  }, [jadwal]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jadwal.filter((d) => {
      if (poli !== "ALL" && d.poliKode !== poli) return false;
      if (q && !`${d.dokterNama} ${d.poliNama} ${d.spesialis}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [jadwal, poli, query]);

  const stats = useMemo(() => {
    const totalSlot = jadwal.reduce((n, d) => n + d.slots.length, 0);
    const kuotaJKN = jadwal.reduce((n, d) => n + d.slots.reduce((m, s) => m + s.kuotaJKN, 0), 0);
    const lastSync = jadwal.reduce((mx, d) => Math.max(mx, d.syncedAt ?? 0), 0);
    return { totalDokter: jadwal.length, totalSlot, kuotaJKN, poli: poliOptions.length, lastSync };
  }, [jadwal, poliOptions.length]);

  const handleSync = () => {
    setSyncing(true);
    // Simulasi latency tarik HFIS.
    setTimeout(() => {
      syncFromHFIS();
      setSyncing(false);
    }, 1100);
  };

  if (!loaded) return <Skeleton />;

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-600">EHIS Master</p>
          <h1 className="mt-0.5 flex items-center gap-2 text-base font-bold text-slate-900">
            <CalendarClock className="h-5 w-5 text-sky-600" /> Jadwal Dokter
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Single source jadwal praktik + kapasitas/kuota per hari. Ditarik via HFIS, dikonsumsi Antrean & Rawat Jalan.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Users} label="Total Dokter" value={stats.totalDokter} sub={`${stats.poli} poli`} tone="bg-sky-100 text-sky-600" />
        <Stat icon={LayoutGrid} label="Slot Mingguan" value={stats.totalSlot} sub="total sesi praktik" tone="bg-violet-100 text-violet-600" />
        <Stat icon={ShieldCheck} label="Kuota JKN / Minggu" value={stats.kuotaJKN} sub="akumulasi semua slot" tone="bg-emerald-100 text-emerald-600" />
        <Stat icon={CalendarClock} label="Hari Aktif" value={7} sub="Senin – Minggu" tone="bg-amber-100 text-amber-600" />
      </div>

      {/* HFIS sync + filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
        <span className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
          <Wifi className="h-4 w-4" />
          {stats.lastSync ? `Tersinkron HFIS · ${new Date(stats.lastSync).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Belum sinkron"}
        </span>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          {syncing ? "Menarik…" : "Tarik dari HFIS"}
        </button>
        <button
          type="button"
          onClick={resetJadwal}
          title="Kembalikan ke konfigurasi awal"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </button>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={poli}
            onChange={(e) => setPoli(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          >
            <option value="ALL">Semua Poli</option>
            {poliOptions.map((p) => (
              <option key={p.kode} value={p.kode}>{p.nama}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari dokter / spesialis…"
              className="w-60 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <WeeklyGrid rows={rows} onEdit={(dokter, hari, slot) => setEdit({ dokter, hari, slot })} />
      </div>

      <AnimatePresence>
        {edit && (
          <SlotEditModal
            dokter={edit.dokter}
            hari={edit.hari}
            slot={edit.slot}
            onClose={() => setEdit(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  sub: string;
  tone: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-slate-500">{label}</p>
        <p className="text-xl font-black leading-none text-slate-900 tabular-nums">{value}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>
      </div>
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="h-12 w-72 animate-pulse rounded-xl bg-slate-100" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}
