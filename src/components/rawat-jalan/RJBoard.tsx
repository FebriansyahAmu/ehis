"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, ChevronLeft, ChevronRight, CheckCircle2, CalendarDays, X } from "lucide-react";
import type { RJPatient, RJPoli } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Select, DatePicker, type SelectOption } from "@/components/shared/inputs";
import { ORDER_CFG, type RJOrderStatus } from "@/lib/rawat-jalan/rjQueueStore";
import { PENJAMIN_CFG } from "./rjShared";
import RJPatientCard from "./RJPatientCard";
import RJPoliPanel from "./RJPoliPanel";
import RJCancelDialog from "./RJCancelDialog";

// ── Constants ─────────────────────────────────────────────

const ITEMS_PER_PAGE = 9;

type StatusFilter = RJOrderStatus | "Semua";

// Worklist mengecualikan status pra-pelayanan (Order Masuk & Dipanggil) → keduanya ada di
// sub-menu "Order Masuk". Chip worklist pun tanpa keduanya; default aktif = "Dilayani".
const WORKLIST_STATUSES: StatusFilter[] = [
  "Semua", "Dilayani", "Selesai", "Dikembalikan_Admisi",
];

// Status yang ditangani tab "Order Masuk" (antrean pra-pelayanan). Dikecualikan dari worklist.
export const ORDER_TAB_STATUSES: readonly RJOrderStatus[] = ["Order_Masuk", "Dipanggil"];

type DatePreset = "Semua" | "Hari Ini" | "3 Hari" | "7 Hari" | "Kustom";
const DATE_PRESETS: DatePreset[] = ["Semua", "Hari Ini", "3 Hari", "7 Hari", "Kustom"];
const DATE_PRESET_LABEL: Record<DatePreset, string> = {
  Semua: "Semua", "Hari Ini": "Hari Ini", "3 Hari": "3 Hari", "7 Hari": "7 Hari", Kustom: "Rentang",
};

interface Toast {
  id: number;
  text: string;
}

// ── Main ──────────────────────────────────────────────────

/** Aksi worklist yang dipetakan ke transisi server (subset KunjunganActionName). */
export type BoardApiAction = "call" | "recall" | "receive" | "complete" | "cancel";

export default function RJBoard({
  patients,
  statusOverride,
  recallOverride,
  onApiAction,
  lockStatuses,
  allowedPolis,
}: {
  patients: RJPatient[];
  /** Order per pasien (dibangun RJPageView dari worklist DB). */
  statusOverride?: Record<string, RJOrderStatus>;
  /** Recall count per pasien (dari worklist DB). */
  recallOverride?: Record<string, number>;
  /** Handler aksi kartu → transisi server (version-guarded). Kembalikan ok + pesan untuk toast. */
  onApiAction: (patient: RJPatient, action: BoardApiAction) => Promise<{ ok: boolean; message?: string }>;
  /** Kunci board ke sekumpulan status (tab "Order Masuk") — chips filter status disembunyikan. */
  lockStatuses?: readonly RJOrderStatus[];
  /** Poli penugasan user login — Panel Poliklinik hanya menampilkan poli ini (null = semua). */
  allowedPolis?: ReadonlySet<RJPoli> | null;
}) {
  const orderOf = (id: string): RJOrderStatus => statusOverride?.[id] ?? "Dilayani";

  const [statusPick, setStatusPick] = useState<StatusFilter>("Dilayani");
  // Tab terkunci (Order Masuk) → tampilkan semua status terkunci (tanpa chip). Worklist → chip aktif.
  const statusFilter: StatusFilter = lockStatuses ? "Semua" : statusPick;
  const [poliFilter, setPoliFilter] = useState<RJPoli | "Semua">("Semua");
  const [dokterFilter, setDokterFilter] = useState("Semua");
  const [penjaminFilter, setPenjaminFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("Semua");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<Toast | null>(null);
  const [cancelTarget, setCancelTarget] = useState<RJPatient | null>(null); // konfirmasi batal kunjungan
  const [canceling, setCanceling] = useState(false);

  // Reset halaman saat filter berubah — pola "adjust state during render" (bukan efek).
  const filterKey = `${statusFilter}|${poliFilter}|${dokterFilter}|${penjaminFilter}|${search}|${datePreset}|${dateFrom}|${dateTo}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) { setPrevFilterKey(filterKey); setPage(1); }

  const showToast = (text: string) => {
    const id = Date.now();
    setToast({ id, text });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2400);
  };

  // Worklist mengecualikan Order_Masuk (ada di sub-menu Order Masuk sendiri). Tab Order Masuk
  // (statusLock) hanya menampilkan status yang dilock → panel poli/dokter/empty akurat.
  const boardPatients = useMemo(
    () =>
      lockStatuses
        ? patients.filter((p) => lockStatuses.includes(orderOf(p.id)))
        : patients.filter((p) => !ORDER_TAB_STATUSES.includes(orderOf(p.id))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patients, lockStatuses, statusOverride],
  );

  const dokterOptions: SelectOption[] = useMemo(
    () => [
      { value: "Semua", label: "Semua Dokter" },
      ...Array.from(new Set(boardPatients.map((p) => p.dokter))).sort()
        .map((d) => ({ value: d, label: d })),
    ],
    [boardPatients],
  );
  const penjaminOptions: SelectOption[] = [
    { value: "Semua", label: "Semua Penjamin" },
    ...(Object.keys(PENJAMIN_CFG) as Array<keyof typeof PENJAMIN_CFG>)
      .map((k) => ({ value: k, label: PENJAMIN_CFG[k].label })),
  ];

  const counts = useMemo(
    () =>
      WORKLIST_STATUSES.reduce<Record<string, number>>((acc, s) => {
        acc[s] = s === "Semua" ? boardPatients.length : boardPatients.filter((p) => orderOf(p.id) === s).length;
        return acc;
      }, {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boardPatients, statusOverride],
  );

  const inDateRange = (tgl: string): boolean => {
    if (datePreset === "Semua") return true;
    const admit = new Date(tgl);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (datePreset === "Hari Ini") {
      const next = new Date(today); next.setDate(next.getDate() + 1);
      return admit >= today && admit < next;
    }
    if (datePreset === "3 Hari") {
      const c = new Date(today); c.setDate(c.getDate() - 2); return admit >= c;
    }
    if (datePreset === "7 Hari") {
      const c = new Date(today); c.setDate(c.getDate() - 6); return admit >= c;
    }
    // Kustom
    if (dateFrom && admit < new Date(dateFrom)) return false;
    if (dateTo) { const end = new Date(dateTo); end.setDate(end.getDate() + 1); if (admit >= end) return false; }
    return true;
  };

  const filtered = useMemo(
    () =>
      boardPatients.filter((p) => {
        if (statusFilter !== "Semua" && orderOf(p.id) !== statusFilter) return false;
        if (poliFilter !== "Semua" && p.poli !== poliFilter) return false;
        if (dokterFilter !== "Semua" && p.dokter !== dokterFilter) return false;
        if (penjaminFilter !== "Semua" && p.penjamin !== penjaminFilter) return false;
        if (!inDateRange(p.tanggalKunjungan)) return false;
        if (search) {
          const q = search.toLowerCase();
          return p.name.toLowerCase().includes(q) || p.noRM.toLowerCase().includes(q) || p.keluhan.toLowerCase().includes(q);
        }
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boardPatients, statusOverride, statusFilter, poliFilter, dokterFilter, penjaminFilter, search, datePreset, dateFrom, dateTo],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const visible = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const startIdx = filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(page * ITEMS_PER_PAGE, filtered.length);
  const gridKey = `${filterKey}|${page}`;
  const hasDateActive = datePreset !== "Semua" || dateFrom || dateTo;
  function clearDate() { setDatePreset("Semua"); setDateFrom(""); setDateTo(""); }

  // ── Aksi worklist → transisi server ──────────────────────
  const runApi = async (p: RJPatient, action: BoardApiAction, okMsg: string) => {
    const r = await onApiAction(p, action);
    showToast(r.ok ? okMsg : (r.message ?? "Gagal memproses aksi"));
  };
  const handlePanggil = (p: RJPatient) => void runApi(p, "call", `Memanggil ${p.name} ke ${p.dokter}`);
  const handlePanggilUlang = (p: RJPatient) => void runApi(p, "recall", `Panggil ulang ${p.name}`);
  const handleTerima = (p: RJPatient) => void runApi(p, "receive", `${p.name} diterima — mulai pelayanan`);
  // Batal kunjungan = destruktif (kembali ke admisi) → buka dialog konfirmasi dulu.
  const handleBatal = (p: RJPatient) => setCancelTarget(p);
  const confirmCancel = async () => {
    if (!cancelTarget || canceling) return;
    const p = cancelTarget;
    setCanceling(true);
    const r = await onApiAction(p, "cancel");
    showToast(r.ok ? `Kunjungan ${p.name} dikembalikan ke admisi` : (r.message ?? "Gagal membatalkan kunjungan"));
    setCanceling(false);
    setCancelTarget(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <RJPoliPanel patients={boardPatients} selected={poliFilter} onSelect={setPoliFilter} allowedPolis={allowedPolis} />

      <div className="h-px bg-slate-100" />

      {/* Filter bar */}
      <div className="flex flex-col gap-3">
        {!lockStatuses && (
          <div className="flex flex-wrap gap-1.5">
            {WORKLIST_STATUSES.map((s) => {
              const isActive = statusFilter === s;
              const activeCls = s === "Semua" ? "bg-slate-800 text-white border-slate-800" : ORDER_CFG[s].active;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusPick(s)}
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
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* Dokter — dropdown kustom (kontras terbaca, bukan native) */}
          <div className="w-48">
            <Select value={dokterFilter} onChange={setDokterFilter} options={dokterOptions} placeholder="Semua Dokter" />
          </div>

          {/* Penjamin — dropdown kustom */}
          <div className="w-44">
            <Select value={penjaminFilter} onChange={setPenjaminFilter} options={penjaminOptions} placeholder="Semua Penjamin" />
          </div>

          {/* Cari — font tegas (bukan terang) */}
          <div className="relative ml-auto">
            <Search size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / No. RM / keluhan…"
              className="h-9 w-56 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs font-medium text-slate-700 placeholder:font-normal placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              aria-label="Cari pasien rawat jalan"
            />
          </div>
        </div>

        {/* Filter tanggal / periode kunjungan */}
        <div className={cn(
          "flex flex-wrap items-center gap-2 rounded-xl border px-4 py-2.5 transition-colors",
          hasDateActive ? "border-sky-200 bg-sky-50/60" : "border-slate-100 bg-slate-50/60",
        )}>
          <div className="flex items-center gap-1.5">
            <CalendarDays size={12} className={hasDateActive ? "text-sky-500" : "text-slate-400"} />
            <span className={cn("text-[11px] font-semibold", hasDateActive ? "text-sky-700" : "text-slate-500")}>
              Tanggal Kunjungan
            </span>
          </div>

          <span className="h-3.5 w-px bg-slate-200" aria-hidden="true" />

          <div className="flex flex-wrap items-center gap-1">
            {DATE_PRESETS.map((preset) => {
              const isActive = datePreset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDatePreset(preset)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition",
                    isActive
                      ? "border-sky-400 bg-sky-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800",
                  )}
                >
                  {DATE_PRESET_LABEL[preset]}
                </button>
              );
            })}
          </div>

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
                <span className="w-1" />
                <div className="w-40"><DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Dari tanggal" /></div>
                <span className="text-xs text-slate-400">–</span>
                <div className="w-40"><DatePicker value={dateTo} onChange={setDateTo} placeholder="Sampai tanggal" /></div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {hasDateActive && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                type="button"
                onClick={clearDate}
                className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                aria-label="Hapus filter tanggal"
              >
                <X size={10} /> Hapus
              </motion.button>
            )}
          </AnimatePresence>
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
                recalls={recallOverride?.[p.id] ?? 0}
                onPanggil={handlePanggil}
                onPanggilUlang={handlePanggilUlang}
                onTerima={handleTerima}
                onBatal={handleBatal}
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

      {/* Konfirmasi batalkan kunjungan (portal → di luar Link kartu) */}
      <RJCancelDialog
        patient={cancelTarget}
        busy={canceling}
        onConfirm={() => void confirmCancel()}
        onCancel={() => { if (!canceling) setCancelTarget(null); }}
      />
    </div>
  );
}
