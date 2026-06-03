"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import type { RJPatient, RJPoli } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  useRJQueue,
  panggilPoli,
  panggilUlangPoli,
  terimaPoli,
  batalKunjungan,
  selesaikanPoli,
  ORDER_CFG,
  type RJOrderStatus,
} from "@/lib/rawat-jalan/rjQueueStore";
import { PENJAMIN_CFG } from "./rjShared";
import RJPatientCard from "./RJPatientCard";
import RJPoliPanel from "./RJPoliPanel";

// ── Constants ─────────────────────────────────────────────

const ITEMS_PER_PAGE = 9;

type StatusFilter = RJOrderStatus | "Semua";

const ALL_STATUSES: StatusFilter[] = [
  "Semua", "Order_Masuk", "Dipanggil", "Dilayani", "Selesai", "Dikembalikan_Admisi",
];

interface Toast {
  id: number;
  text: string;
}

// ── Main ──────────────────────────────────────────────────

export default function RJBoard({
  patients,
  statusOverride,
}: {
  patients: RJPatient[];
  /** Order untuk pasien dari API (tak ada di mock queue store) — mis. kunjungan baru. */
  statusOverride?: Record<string, RJOrderStatus>;
}) {
  const queue = useRJQueue();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Semua");
  const [poliFilter, setPoliFilter] = useState<RJPoli | "Semua">("Semua");
  const [dokterFilter, setDokterFilter] = useState("Semua");
  const [penjaminFilter, setPenjaminFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => { setPage(1); }, [statusFilter, poliFilter, dokterFilter, penjaminFilter, search]);

  const orderOf = (id: string): RJOrderStatus => statusOverride?.[id] ?? queue[id]?.order ?? "Dilayani";

  const showToast = (text: string) => {
    const id = Date.now();
    setToast({ id, text });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2400);
  };

  const dokterList = useMemo(
    () => ["Semua", ...Array.from(new Set(patients.map((p) => p.dokter))).sort()],
    [patients],
  );

  const counts = useMemo(
    () =>
      ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
        acc[s] = s === "Semua" ? patients.length : patients.filter((p) => orderOf(p.id) === s).length;
        return acc;
      }, {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patients, queue],
  );

  const filtered = useMemo(
    () =>
      patients.filter((p) => {
        if (statusFilter !== "Semua" && orderOf(p.id) !== statusFilter) return false;
        if (poliFilter !== "Semua" && p.poli !== poliFilter) return false;
        if (dokterFilter !== "Semua" && p.dokter !== dokterFilter) return false;
        if (penjaminFilter !== "Semua" && p.penjamin !== penjaminFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return p.name.toLowerCase().includes(q) || p.noRM.toLowerCase().includes(q) || p.keluhan.toLowerCase().includes(q);
        }
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patients, queue, statusFilter, poliFilter, dokterFilter, penjaminFilter, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const visible = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const startIdx = filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(page * ITEMS_PER_PAGE, filtered.length);
  const gridKey = `${statusFilter}|${poliFilter}|${dokterFilter}|${penjaminFilter}|${search}|${page}`;

  // ── Aksi worklist ────────────────────────────────────────
  const handlePanggil = (p: RJPatient) => { panggilPoli(p.id); showToast(`Memanggil ${p.name} ke ${p.dokter}`); };
  const handlePanggilUlang = (p: RJPatient) => { const n = panggilUlangPoli(p.id); showToast(`Panggil ulang ${p.name} (ke-${n + 1})`); };
  const handleTerima = (p: RJPatient) => { terimaPoli(p.id); showToast(`${p.name} diterima — mulai pelayanan`); };
  const handleBatal = (p: RJPatient) => { batalKunjungan(p.id); showToast(`Kunjungan ${p.name} dikembalikan ke admisi`); };
  const handleSelesai = (p: RJPatient) => { selesaikanPoli(p.id); showToast(`Pelayanan ${p.name} selesai`); };

  return (
    <div className="flex flex-col gap-4">
      <RJPoliPanel patients={patients} selected={poliFilter} onSelect={setPoliFilter} />

      <div className="h-px bg-slate-100" />

      {/* Filter bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ALL_STATUSES.map((s) => {
            const isActive = statusFilter === s;
            const activeCls = s === "Semua" ? "bg-slate-800 text-white border-slate-800" : ORDER_CFG[s].active;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                  isActive ? activeCls : "border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                {s === "Semua" ? "Semua" : ORDER_CFG[s].label}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-black", isActive ? "bg-white/25" : "bg-slate-100 text-slate-500")}>
                  {counts[s]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={dokterFilter}
            onChange={(e) => setDokterFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            aria-label="Filter dokter"
          >
            {dokterList.map((d) => (
              <option key={d} value={d}>{d === "Semua" ? "Semua Dokter" : d}</option>
            ))}
          </select>

          <select
            value={penjaminFilter}
            onChange={(e) => setPenjaminFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            aria-label="Filter penjamin"
          >
            <option value="Semua">Semua Penjamin</option>
            {(Object.keys(PENJAMIN_CFG) as Array<keyof typeof PENJAMIN_CFG>).map((k) => (
              <option key={k} value={k}>{PENJAMIN_CFG[k].label}</option>
            ))}
          </select>

          <div className="relative ml-auto">
            <Search size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / No. RM…"
              className="h-8 w-52 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              aria-label="Cari pasien rawat jalan"
            />
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <AnimatePresence mode="wait">
        {visible.length > 0 ? (
          <motion.div
            key={gridKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {visible.map((p, i) => (
              <RJPatientCard
                key={p.id}
                patient={p}
                index={i}
                order={orderOf(p.id)}
                recalls={queue[p.id]?.recalls ?? 0}
                onPanggil={handlePanggil}
                onPanggilUlang={handlePanggilUlang}
                onTerima={handleTerima}
                onBatal={handleBatal}
                onSelesai={handleSelesai}
              />
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
            <Users size={32} className="mb-3 text-slate-300" />
            <p className="font-medium text-slate-500">Tidak ada pasien ditemukan</p>
            <p className="mt-1 text-sm text-slate-400">Coba ubah filter atau kata pencarian</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {filtered.length === 0 ? (
            "Tidak ada hasil"
          ) : (
            <>
              Menampilkan <span className="font-semibold text-slate-600">{startIdx}–{endIdx}</span> dari{" "}
              <span className="font-semibold text-slate-600">{filtered.length}</span> pasien
            </>
          )}
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
                  n === page ? "border-sky-500 bg-sky-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50",
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

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
