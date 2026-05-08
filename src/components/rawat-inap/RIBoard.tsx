"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, BedDouble, Stethoscope, Clock, StickyNote,
  AlertTriangle, LogOut, ChevronLeft, ChevronRight, CalendarDays, X,
} from "lucide-react";
import type { RawatInapPatient, RIStatus, RIKelas, RIPenjamin } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Config ────────────────────────────────────────────────

const ITEMS_PER_PAGE = 9;

const STATUS_CFG: Record<RIStatus, { label: string; badge: string; border: string }> = {
  Aktif:             { label: "Aktif",          badge: "bg-slate-100 text-slate-600",     border: "border-l-slate-400"   },
  Observasi:         { label: "Observasi",       badge: "bg-amber-100 text-amber-700",     border: "border-l-amber-400"   },
  Kritis:            { label: "Kritis",          badge: "bg-rose-100 text-rose-700",       border: "border-l-rose-500"    },
  "Pulang Hari Ini": { label: "Pulang Hari Ini", badge: "bg-emerald-100 text-emerald-700", border: "border-l-emerald-500" },
  Konsultasi:        { label: "Konsultasi",      badge: "bg-indigo-100 text-indigo-700",   border: "border-l-indigo-400"  },
};

const ACTIVE_STATUS_BTN: Record<RIStatus | "Semua", string> = {
  Semua:             "bg-slate-800 text-white border-slate-800",
  Aktif:             "bg-slate-600 text-white border-slate-600",
  Kritis:            "bg-rose-600 text-white border-rose-600",
  Observasi:         "bg-amber-500 text-white border-amber-500",
  Konsultasi:        "bg-indigo-600 text-white border-indigo-600",
  "Pulang Hari Ini": "bg-emerald-600 text-white border-emerald-600",
};

const KELAS_LABEL: Record<RIKelas, string> = {
  ICU: "ICU", HCU: "HCU", Isolasi: "Isolasi",
  VIP: "VIP", Kelas_1: "Kelas 1", Kelas_2: "Kelas 2", Kelas_3: "Kelas 3",
};

const KELAS_BED_COLOR: Record<RIKelas, string> = {
  ICU:     "bg-rose-100 text-rose-700",
  HCU:     "bg-amber-100 text-amber-700",
  Isolasi: "bg-teal-100 text-teal-700",
  VIP:     "bg-violet-100 text-violet-700",
  Kelas_1: "bg-indigo-100 text-indigo-700",
  Kelas_2: "bg-sky-100 text-sky-700",
  Kelas_3: "bg-slate-100 text-slate-600",
};

const PENJAMIN_BADGE: Record<RIPenjamin, string> = {
  BPJS_PBI:     "bg-emerald-100 text-emerald-700",
  BPJS_Non_PBI: "bg-sky-100 text-sky-700",
  Umum:         "bg-slate-100 text-slate-600",
  Asuransi:     "bg-violet-100 text-violet-700",
  Jamkesda:     "bg-teal-100 text-teal-700",
};

const PENJAMIN_LABEL: Record<RIPenjamin, string> = {
  BPJS_PBI: "BPJS PBI", BPJS_Non_PBI: "BPJS Non-PBI",
  Umum: "Umum", Asuransi: "Asuransi", Jamkesda: "Jamkesda",
};

const ALL_STATUSES: (RIStatus | "Semua")[] = [
  "Semua", "Aktif", "Kritis", "Observasi", "Konsultasi", "Pulang Hari Ini",
];

type DatePreset = "Semua" | "Hari Ini" | "3 Hari" | "7 Hari" | "Kustom";
const DATE_PRESETS: DatePreset[] = ["Semua", "Hari Ini", "3 Hari", "7 Hari", "Kustom"];

const DATE_PRESET_LABEL: Record<DatePreset, string> = {
  Semua:    "Semua",
  "Hari Ini": "Hari Ini",
  "3 Hari": "3 Hari",
  "7 Hari": "7 Hari",
  Kustom:   "Rentang",
};

// ── Patient Card ──────────────────────────────────────────

function PatientCard({ p }: { p: RawatInapPatient }) {
  const sc       = STATUS_CFG[p.status];
  const isKritis = p.status === "Kritis";
  const isPulang = p.status === "Pulang Hari Ini";

  const admitFormatted = new Date(p.admitDate).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <Link href={`/ehis-care/rawat-inap/${p.id}`} className="block">
    <article className={cn(
      "group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-l-4 cursor-pointer",
      sc.border,
    )}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black",
            isKritis ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700",
          )}>
            {p.gender === "L" ? "♂" : "♀"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{p.name}</p>
            <p className="text-[10px] text-slate-400">
              <span className="font-mono">{p.noRM}</span>
              <span className="mx-1">·</span>
              <span>{p.age} thn</span>
            </p>
          </div>
        </div>
        <span className={cn(
          "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold",
          sc.badge,
        )}>
          {isKritis && <AlertTriangle size={8} />}
          {isPulang  && <LogOut size={8} />}
          {sc.label}
        </span>
      </div>

      {/* Bed + Penjamin */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2.5">
        <span className={cn(
          "flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold",
          KELAS_BED_COLOR[p.kelas],
        )}>
          <BedDouble size={10} />
          {p.noBed}
        </span>
        <span className="text-[10px] text-slate-400">{p.ruangan}</span>
        <span className="ml-auto">
          <span className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
            PENJAMIN_BADGE[p.penjamin],
          )}>
            {PENJAMIN_LABEL[p.penjamin]}
          </span>
        </span>
      </div>

      {/* Diagnosis */}
      <div className="px-4 pb-3">
        <p className="line-clamp-1 text-xs font-semibold text-slate-700">{p.diagnosis}</p>
        <p className="text-[10px] text-slate-400">ICD-10: {p.kodeIcd}</p>
      </div>

      {/* DPJP + Hari + Admit date */}
      <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <Stethoscope size={11} className="shrink-0 text-slate-400" />
          <p className="truncate text-[10px] text-slate-600">{p.dpjp}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-50 px-2 py-1">
          <Clock size={10} className="text-slate-400" />
          <p className="text-[10px] font-bold text-slate-700">Hari ke-{p.hariKe}</p>
        </div>
      </div>

      {/* Admit date row */}
      <div className="flex items-center gap-1.5 border-t border-slate-100 px-4 py-2">
        <CalendarDays size={10} className="shrink-0 text-slate-300" />
        <p className="text-[10px] text-slate-400">Masuk: <span className="font-medium text-slate-500">{admitFormatted}</span></p>
      </div>

      {/* Clinical note */}
      {p.catatan && (
        <div className="flex items-start gap-2 border-t border-slate-100 bg-rose-50/70 px-4 py-2">
          <StickyNote size={11} className="mt-0.5 shrink-0 text-rose-500" />
          <p className="text-[10px] leading-relaxed text-rose-700">{p.catatan}</p>
        </div>
      )}
    </article>
    </Link>
  );
}

// ── Board ─────────────────────────────────────────────────

interface RIBoardProps {
  patients: RawatInapPatient[];
}

export default function RIBoard({ patients }: RIBoardProps) {
  const [statusFilter, setStatusFilter] = useState<RIStatus | "Semua">("Semua");
  const [kelasFilter,  setKelasFilter]  = useState<RIKelas  | "Semua">("Semua");
  const [dpjpFilter,   setDpjpFilter]   = useState("Semua");
  const [search,       setSearch]       = useState("");
  const [datePreset,   setDatePreset]   = useState<DatePreset>("Semua");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [page,         setPage]         = useState(1);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, kelasFilter, dpjpFilter, search, datePreset, dateFrom, dateTo]);

  const dpjpList = ["Semua", ...Array.from(new Set(patients.map((p) => p.dpjp)))];

  const filtered = patients.filter((p) => {
    if (statusFilter !== "Semua" && p.status !== statusFilter) return false;
    if (kelasFilter  !== "Semua" && p.kelas  !== kelasFilter)  return false;
    if (dpjpFilter   !== "Semua" && p.dpjp   !== dpjpFilter)   return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.name.toLowerCase().includes(q) &&
        !p.noRM.toLowerCase().includes(q) &&
        !p.diagnosis.toLowerCase().includes(q)
      ) return false;
    }
    if (datePreset !== "Semua") {
      const admit  = new Date(p.admitDate);
      const today  = new Date(); today.setHours(0, 0, 0, 0);
      if (datePreset === "Hari Ini") {
        const next = new Date(today); next.setDate(next.getDate() + 1);
        if (admit < today || admit >= next) return false;
      } else if (datePreset === "3 Hari") {
        const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() - 2);
        if (admit < cutoff) return false;
      } else if (datePreset === "7 Hari") {
        const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() - 6);
        if (admit < cutoff) return false;
      } else if (datePreset === "Kustom") {
        if (dateFrom && admit < new Date(dateFrom)) return false;
        if (dateTo) {
          const end = new Date(dateTo); end.setDate(end.getDate() + 1);
          if (admit >= end) return false;
        }
      }
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const visible    = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const counts = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === "Semua"
      ? patients.length
      : patients.filter((p) => p.status === s).length;
    return acc;
  }, {});

  const startIdx = filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const endIdx   = Math.min(page * ITEMS_PER_PAGE, filtered.length);

  const hasDateActive = datePreset !== "Semua" || dateFrom || dateTo;

  function clearDate() {
    setDatePreset("Semua");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Primary filter bar ────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1.5">
          {ALL_STATUSES.map((s) => {
            const isActive = statusFilter === s;
            return (
              <button key={s} type="button"
                onClick={() => setStatusFilter(s as RIStatus | "Semua")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                  isActive
                    ? ACTIVE_STATUS_BTN[s as RIStatus | "Semua"]
                    : "border-slate-200 text-slate-600 hover:bg-slate-50",
                )}>
                {s === "Semua" ? "Semua" : STATUS_CFG[s as RIStatus].label}
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-black",
                  isActive ? "bg-white/25" : "bg-slate-100 text-slate-500",
                )}>
                  {counts[s]}
                </span>
              </button>
            );
          })}
        </div>

        <span className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden="true" />

        {/* Kelas select */}
        <select
          value={kelasFilter}
          onChange={(e) => setKelasFilter(e.target.value as RIKelas | "Semua")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          aria-label="Filter kelas"
        >
          <option value="Semua">Semua Kelas</option>
          {(Object.keys(KELAS_LABEL) as RIKelas[]).map((k) => (
            <option key={k} value={k}>{KELAS_LABEL[k]}</option>
          ))}
        </select>

        {/* DPJP select */}
        <select
          value={dpjpFilter}
          onChange={(e) => setDpjpFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          aria-label="Filter DPJP"
        >
          {dpjpList.map((d) => (
            <option key={d} value={d}>{d === "Semua" ? "Semua DPJP" : d}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative ml-auto">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama / No. RM…"
            className="h-8 w-52 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            aria-label="Cari pasien rawat inap"
          />
        </div>
      </div>

      {/* ── Date filter bar ───────────────────────────── */}
      <div className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border px-4 py-2.5 transition-colors",
        hasDateActive
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-slate-100 bg-slate-50/60",
      )}>
        <div className="flex items-center gap-1.5">
          <CalendarDays size={12} className={hasDateActive ? "text-emerald-500" : "text-slate-400"} />
          <span className={cn(
            "text-[11px] font-semibold",
            hasDateActive ? "text-emerald-700" : "text-slate-500",
          )}>
            Tanggal Masuk
          </span>
        </div>

        <span className="h-3.5 w-px bg-slate-200" aria-hidden="true" />

        {/* Preset chips */}
        <div className="flex flex-wrap items-center gap-1">
          {DATE_PRESETS.map((preset) => {
            const isActive = datePreset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setDatePreset(preset)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition",
                  isActive
                    ? "border-emerald-400 bg-emerald-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
                )}
              >
                {DATE_PRESET_LABEL[preset]}
              </button>
            );
          })}
        </div>

        {/* Custom date range — revealed with animation */}
        <AnimatePresence>
          {datePreset === "Kustom" && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: "hidden" }}
              className="flex items-center gap-2"
            >
              <span className="w-2" />
              <div className="flex items-center gap-2">
                <div className="relative">
                  <CalendarDays size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-8 rounded-lg border border-slate-200 bg-white pl-7 pr-2.5 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    aria-label="Dari tanggal"
                  />
                </div>
                <span className="text-xs text-slate-400">–</span>
                <div className="relative">
                  <CalendarDays size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    min={dateFrom || undefined}
                    className="h-8 rounded-lg border border-slate-200 bg-white pl-7 pr-2.5 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    aria-label="Sampai tanggal"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clear button — only when active */}
        <AnimatePresence>
          {hasDateActive && datePreset !== "Semua" && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              type="button"
              onClick={clearDate}
              className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
              aria-label="Hapus filter tanggal"
            >
              <X size={10} />
              Hapus
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Cards ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {visible.length > 0 ? (
          <motion.div
            key={`${statusFilter}|${kelasFilter}|${dpjpFilter}|${search}|${datePreset}|${dateFrom}|${dateTo}|${page}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {visible.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2, ease: "easeOut" }}
              >
                <PatientCard p={p} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center"
          >
            <BedDouble size={32} className="mb-3 text-slate-300" />
            <p className="font-medium text-slate-500">Tidak ada pasien ditemukan</p>
            <p className="mt-1 text-sm text-slate-400">Coba ubah filter atau kata pencarian</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pagination ────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {filtered.length === 0
            ? "Tidak ada hasil"
            : <>Menampilkan <span className="font-semibold text-slate-600">{startIdx}–{endIdx}</span> dari <span className="font-semibold text-slate-600">{filtered.length}</span> pasien</>
          }
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1" role="navigation" aria-label="Halaman">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft size={13} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                aria-current={n === page ? "page" : undefined}
                className={cn(
                  "flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition",
                  n === page
                    ? "border-emerald-500 bg-emerald-600 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                {n}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
