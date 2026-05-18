"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, AlertTriangle, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type RadOrder, type Modalitas, type UnitAsalRad,
  deriveRadOrders, hasCriticalFinding,
} from "./radShared";
import RadOrderCard from "./RadOrderCard";

// ── Constants ─────────────────────────────────────────────

const PAGE_SIZE = 6;

const UNIT_OPTS: { label: string; value: "Semua" | UnitAsalRad }[] = [
  { label: "Semua Unit",   value: "Semua"        },
  { label: "IGD",          value: "IGD"           },
  { label: "Rawat Inap",   value: "Rawat Inap"    },
  { label: "Rawat Jalan",  value: "Rawat Jalan"   },
];

const MOD_OPTS: { label: string; value: "Semua" | Modalitas }[] = [
  { label: "Semua",        value: "Semua"          },
  { label: "X-Ray",        value: "Konvensional"   },
  { label: "USG",          value: "USG"            },
  { label: "CT Scan",      value: "CT"             },
  { label: "MRI",          value: "MRI"            },
  { label: "Fluoroskopi",  value: "Fluoroskopi"    },
  { label: "Mammografi",   value: "Mammografi"     },
];

// ── Skeleton ──────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex justify-between">
        <div>
          <div className="mb-1.5 h-3.5 w-32 rounded bg-slate-200" />
          <div className="h-2.5 w-24 rounded bg-slate-100" />
        </div>
        <div className="h-5 w-14 rounded-full bg-slate-200" />
      </div>
      <div className="mb-3 flex gap-2">
        <div className="h-5 w-16 rounded-lg bg-slate-100" />
        <div className="h-5 w-28 rounded bg-slate-100" />
      </div>
      <div className="mb-3 flex gap-4">
        <div className="h-2.5 w-20 rounded bg-slate-100" />
        <div className="h-2.5 w-16 rounded bg-slate-100" />
      </div>
      <div className="mb-1 flex justify-between">
        <div className="h-6 w-24 rounded-lg bg-slate-100" />
        <div className="h-5 w-14 rounded-full bg-slate-100" />
      </div>
      <div className="mt-2 h-1 w-full rounded-full bg-slate-100" />
      <div className="mt-3 border-t border-slate-100 pt-2.5">
        <div className="h-8 w-full rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

// ── Filter pill ───────────────────────────────────────────

function Pill<T extends string>({
  value, active, onClick, label,
}: {
  value: T; active: boolean; onClick: () => void; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all",
        active
          ? "bg-teal-600 text-white shadow-sm"
          : "bg-white text-slate-500 border border-slate-200 hover:border-teal-300 hover:text-teal-700",
      )}
    >
      {label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RadBoard() {
  const [unit,     setUnit]     = useState<"Semua" | UnitAsalRad>("Semua");
  const [mod,      setMod]      = useState<"Semua" | Modalitas>("Semua");
  const [citoPinn, setCitoPinn] = useState(false);
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [loading]               = useState(false);

  const allOrders = deriveRadOrders();

  const criticalUnconfirmed = allOrders.filter(hasCriticalFinding);

  const filtered = useMemo(() => {
    let list = allOrders;
    if (unit !== "Semua")   list = list.filter((o) => o.unitAsal === unit);
    if (mod  !== "Semua")   list = list.filter((o) => o.items.some((i) => i.modalitas === mod));
    if (search.trim())      list = list.filter((o) =>
      o.namaPasien.toLowerCase().includes(search.toLowerCase()) ||
      o.noRM.toLowerCase().includes(search.toLowerCase()) ||
      o.noOrder.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.nama.toLowerCase().includes(search.toLowerCase())),
    );
    if (citoPinn) {
      const cito  = list.filter((o) => o.prioritas === "CITO");
      const rest  = list.filter((o) => o.prioritas !== "CITO");
      list = [...cito, ...rest];
    }
    return list;
  }, [allOrders, unit, mod, search, citoPinn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setUnit("Semua"); setMod("Semua"); setSearch(""); setCitoPinn(false); setPage(1);
  };
  const hasFilters = unit !== "Semua" || mod !== "Semua" || citoPinn || search.trim();

  return (
    <div className="flex flex-col gap-4">

      {/* Critical finding banner */}
      <AnimatePresence>
        {criticalUnconfirmed.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <AlertTriangle size={16} className="shrink-0 text-rose-600" />
            <div className="flex-1">
              <p className="text-[12px] font-bold text-rose-800">
                {criticalUnconfirmed.length} Temuan Kritis Belum Dikonfirmasi
              </p>
              <p className="text-[11px] text-rose-600">
                {criticalUnconfirmed.map((o) => o.namaPasien).join(", ")} · Konfirmasi segera ke DPJP
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="shrink-0 text-slate-400" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Filter</p>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto flex items-center gap-1 rounded-full px-2 py-1 text-[10px] text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X size={10} /> Reset
            </button>
          )}
        </div>

        {/* Unit filter */}
        <div className="flex flex-wrap gap-1.5">
          {UNIT_OPTS.map((o) => (
            <Pill key={o.value} value={o.value} label={o.label}
              active={unit === o.value} onClick={() => { setUnit(o.value); setPage(1); }} />
          ))}
        </div>

        {/* Modalitas + CITO + Search row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {MOD_OPTS.map((o) => (
              <Pill key={o.value} value={o.value} label={o.label}
                active={mod === o.value} onClick={() => { setMod(o.value); setPage(1); }} />
            ))}
          </div>

          <button
            onClick={() => { setCitoPinn((p) => !p); setPage(1); }}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all",
              citoPinn
                ? "border-rose-300 bg-rose-500 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-600",
            )}
          >
            CITO Prioritas
          </button>

          <div className="relative ml-auto min-w-[180px]">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pasien / order..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-[12px] placeholder-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] text-slate-400">
          {filtered.length} order ditemukan
          {search && <> · pencarian: <span className="font-semibold text-teal-700">"{search}"</span></>}
        </p>
        <p className="text-[11px] text-slate-400">
          Halaman {page} / {totalPages}
        </p>
      </div>

      {/* Card grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : pageItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-slate-400"
        >
          <Search size={28} className="text-slate-300" />
          <p className="text-sm font-medium">Tidak ada order ditemukan</p>
          {hasFilters && (
            <button onClick={resetFilters} className="text-[12px] text-teal-600 hover:underline">
              Hapus semua filter
            </button>
          )}
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${unit}-${mod}-${search}-${page}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {pageItems.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <RadOrderCard order={order} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={cn(
                "h-7 w-7 rounded-lg text-[12px] font-semibold transition-all",
                page === i + 1
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
        {[
          { dot: "bg-rose-500",  label: "CITO"         },
          { dot: "bg-amber-500", label: "Semi-Cito"     },
          { dot: "bg-teal-500",  label: "Rutin"         },
          { dot: "bg-emerald-500", label: "Selesai"     },
        ].map(({ dot, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className={cn("h-2 w-2 rounded-full", dot)} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
