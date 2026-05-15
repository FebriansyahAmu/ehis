"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { IGDPatient, TriageLevel, IGDStatus } from "@/lib/data";
import PatientCard from "./PatientCard";
import { cn } from "@/lib/utils";

type FilterTriage = "Semua" | TriageLevel;
type FilterStatus = "Semua" | IGDStatus;

const ITEMS_PER_PAGE = 9;

const TRIAGE_TABS: FilterTriage[] = ["Semua", "P1", "P2", "P3", "P4"];
const STATUS_OPTS: FilterStatus[] = ["Semua", "Triage", "Menunggu", "Dalam Penanganan", "Observasi", "Selesai"];

const TRIAGE_COLOR: Record<FilterTriage, string> = {
  Semua: "bg-slate-800 text-white",
  P1:    "bg-rose-600 text-white",
  P2:    "bg-amber-500 text-white",
  P3:    "bg-emerald-600 text-white",
  P4:    "bg-slate-600 text-white",
};

const TRIAGE_OUTLINE: Record<FilterTriage, string> = {
  Semua: "border-slate-300 text-slate-600 hover:bg-slate-100",
  P1:    "border-rose-200 text-rose-600 hover:bg-rose-50",
  P2:    "border-amber-200 text-amber-600 hover:bg-amber-50",
  P3:    "border-emerald-200 text-emerald-600 hover:bg-emerald-50",
  P4:    "border-slate-300 text-slate-600 hover:bg-slate-50",
};

interface IGDBoardProps {
  patients: IGDPatient[];
}

export default function IGDBoard({ patients }: IGDBoardProps) {
  const [triage, setTriage] = useState<FilterTriage>("Semua");
  const [status, setStatus] = useState<FilterStatus>("Semua");
  const [dpjp, setDpjp]     = useState("Semua");
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);

  const dpjpOptions = useMemo(() => {
    const names = Array.from(new Set(patients.map((p) => p.doctor))).sort();
    return ["Semua", ...names];
  }, [patients]);

  const filtered = patients.filter((p) => {
    const matchTriage = triage === "Semua" || p.triage === triage;
    const matchStatus = status === "Semua" || p.status === status;
    const matchDpjp   = dpjp === "Semua" || p.doctor === dpjp;
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.noRM.toLowerCase().includes(search.toLowerCase()) ||
      p.complaint.toLowerCase().includes(search.toLowerCase());
    return matchTriage && matchStatus && matchDpjp && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  function resetPage() { setPage(1); }

  const gridKey = `${triage}|${status}|${dpjp}|${search}|${safePage}`;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Triage tabs */}
        <div className="flex items-center gap-1.5">
          {TRIAGE_TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTriage(t); resetPage(); }}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                triage === t ? TRIAGE_COLOR[t] : TRIAGE_OUTLINE[t],
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <span className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden="true" />

        {/* Status */}
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as FilterStatus); resetPage(); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          aria-label="Filter status"
        >
          {STATUS_OPTS.map((s) => (
            <option key={s} value={s}>{s === "Semua" ? "Semua Status" : s}</option>
          ))}
        </select>

        {/* DPJP */}
        <select
          value={dpjp}
          onChange={(e) => { setDpjp(e.target.value); resetPage(); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          aria-label="Filter DPJP"
        >
          {dpjpOptions.map((d) => (
            <option key={d} value={d}>{d === "Semua" ? "Semua DPJP" : d}</option>
          ))}
        </select>

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          placeholder="Cari nama / No. RM…"
          className="ml-auto w-48 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          aria-label="Cari pasien IGD"
        />
      </div>

      {/* Result count */}
      <p className="text-xs text-slate-400">
        Menampilkan{" "}
        <span className="font-semibold text-slate-600">{filtered.length}</span> pasien
        {totalPages > 1 && (
          <span className="ml-1">
            · hal. {safePage}/{totalPages}
          </span>
        )}
      </p>

      {/* ── Cards grid ── */}
      {paged.length > 0 ? (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={gridKey}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {paged.map((p, i) => (
              <PatientCard key={p.id} patient={p} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="font-medium text-slate-500">Tidak ada pasien ditemukan</p>
          <p className="mt-1 text-sm text-slate-400">Coba ubah filter atau kata pencarian</p>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-400">
            {(safePage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} pasien
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-semibold transition",
                  n === safePage
                    ? "border-indigo-500 bg-indigo-500 text-white"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50",
                )}
                aria-label={`Halaman ${n}`}
                aria-current={n === safePage ? "page" : undefined}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
