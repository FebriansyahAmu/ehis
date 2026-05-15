"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, MessageSquare, Clock, CheckCircle2, AlertCircle, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  KONSULTASI_MOCK, URGENCY_CONFIG, STATUS_CONFIG, elapsedSince,
  type KonsultasiItem, type StatusKonsultasi,
} from "./konsultasi/konsultasiShared";
import RequestPane from "./konsultasi/RequestPane";
import DetailPane  from "./konsultasi/DetailPane";

// ── Types ─────────────────────────────────────────────────

type Mode = "idle" | "new" | "detail";
type FilterVal = StatusKonsultasi | "all";

const STATUS_FILTERS: { label: string; value: FilterVal }[] = [
  { label: "Semua",    value: "all"      },
  { label: "Menunggu", value: "Terkirim" },
  { label: "Diterima", value: "Diterima" },
  { label: "Dijawab",  value: "Dijawab"  },
  { label: "Selesai",  value: "Selesai"  },
];

export interface KonsultasiTabProps {
  noRM: string;
  dokterPeminta: string;
}

// ── KonsultasiCard ────────────────────────────────────────

function KonsultasiCard({
  item, active, onClick,
}: { item: KonsultasiItem; active: boolean; onClick: () => void }) {
  const urgCfg  = URGENCY_CONFIG[item.urgency];
  const statCfg = STATUS_CONFIG[item.status];
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full cursor-pointer rounded-xl border border-slate-200 border-l-4 bg-white p-3 text-left transition-all duration-150",
        urgCfg.border,
        active ? "bg-sky-50 ring-1 ring-sky-200" : "hover:bg-slate-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold",
            active ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500",
          )}>
            {item.smfSingkatan}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">{item.smfNama}</p>
            <p className="text-[10px] text-slate-400">{item.tanggalRequest} · {item.waktuRequest}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", urgCfg.badge)}>
            {item.urgency}
          </span>
          <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold", statCfg.badge)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", statCfg.dot)} />
            {item.status}
          </span>
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-[11px] text-slate-500">{item.situation}</p>
      {item.dokterKonsultan && (
        <p className="mt-0.5 truncate text-[10px] text-slate-400">{item.dokterKonsultan}</p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <Clock size={10} />
          {elapsedSince(item.tanggalRequest, item.waktuRequest)} lalu
        </span>
        <ChevronRight size={12} className={cn("text-slate-300", active && "text-sky-400")} />
      </div>
    </button>
  );
}

// ── Main ─────────────────────────────────────────────────

export default function KonsultasiTab({ noRM, dokterPeminta }: KonsultasiTabProps) {
  const [items,            setItems]           = useState<KonsultasiItem[]>(KONSULTASI_MOCK[noRM] ?? []);
  const [mode,             setMode]            = useState<Mode>("idle");
  const [selectedId,       setSelectedId]      = useState<string | null>(null);
  const [search,           setSearch]          = useState("");
  const [statusFilter,     setStatusFilter]    = useState<FilterVal>("all");
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const selectedItem = items.find(i => i.id === selectedId) ?? null;

  const filtered = useMemo(() => items.filter(item => {
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || item.smfNama.toLowerCase().includes(q)
      || item.smfSingkatan.toLowerCase().includes(q)
      || item.situation.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  }), [items, statusFilter, search]);

  const stats = useMemo(() => ({
    total:   items.length,
    pending: items.filter(i => i.status === "Terkirim" || i.status === "Diterima").length,
    dijawab: items.filter(i => i.status === "Dijawab").length,
    selesai: items.filter(i => i.status === "Selesai").length,
  }), [items]);

  function handleNewRequest(item: KonsultasiItem) {
    setItems(prev => [item, ...prev]);
    setSelectedId(item.id);
    setMode("detail");
    setShowMobileDetail(true);
  }

  function handleUpdate(updated: KonsultasiItem) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  }

  function selectItem(id: string) {
    setSelectedId(id);
    setMode("detail");
    setShowMobileDetail(true);
  }

  function openNew() {
    setMode("new");
    setSelectedId(null);
    setShowMobileDetail(true);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* Stats bar */}
      <div className="grid shrink-0 grid-cols-4 divide-x divide-slate-200 border-b border-slate-200 bg-white">
        {[
          { label: "Total",   value: stats.total,   Icon: MessageSquare, color: "text-slate-600"    },
          { label: "Pending", value: stats.pending,  Icon: Clock,         color: "text-amber-600"   },
          { label: "Dijawab", value: stats.dijawab,  Icon: AlertCircle,   color: "text-sky-600"     },
          { label: "Selesai", value: stats.selesai,  Icon: CheckCircle2,  color: "text-emerald-600" },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="flex flex-col items-center py-3">
            <Icon size={13} className={cn("mb-0.5", color)} />
            <p className={cn("text-lg font-bold leading-none", color)}>{value}</p>
            <p className="text-[10px] text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: list panel */}
        <div className={cn(
          "flex flex-col border-r border-slate-200 bg-slate-50 md:w-72 md:shrink-0 xl:w-80",
          showMobileDetail ? "hidden md:flex" : "flex w-full",
        )}>
          {/* Controls */}
          <div className="shrink-0 space-y-2 border-b border-slate-200 bg-white p-3">
            <button
              onClick={openNew}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 active:scale-95"
            >
              <Plus size={15} />
              Permintaan Konsultasi Baru
            </button>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari SMF atau pertanyaan klinis..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-xs text-slate-700 outline-none transition focus:border-sky-300 focus:ring-1 focus:ring-sky-200"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {STATUS_FILTERS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all",
                    statusFilter === value
                      ? "bg-sky-600 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center gap-3 py-16 text-center"
                >
                  <MessageSquare size={28} className="text-slate-300" />
                  <p className="text-xs text-slate-400">
                    {items.length === 0 ? "Belum ada konsultasi" : "Tidak ada hasil yang cocok"}
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-2 p-2">
                  {filtered.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: i * 0.04 }}
                    >
                      <KonsultasiCard
                        item={item}
                        active={selectedId === item.id}
                        onClick={() => selectItem(item.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: detail / form panel */}
        <div className={cn(
          "flex flex-1 flex-col overflow-hidden",
          showMobileDetail ? "" : "hidden md:flex",
        )}>
          <AnimatePresence mode="wait">
            {mode === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-col items-center justify-center gap-4 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 shadow-inner">
                  <MessageSquare size={24} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Pilih Konsultasi</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Klik item di sebelah kiri atau buat permintaan konsultasi baru
                  </p>
                </div>
                <button
                  onClick={openNew}
                  className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 active:scale-95"
                >
                  <Plus size={14} /> Permintaan Baru
                </button>
              </motion.div>
            )}

            {mode === "new" && (
              <RequestPane
                key="new"
                noRM={noRM}
                dokterPeminta={dokterPeminta}
                onSubmit={handleNewRequest}
                onCancel={() => { setMode("idle"); setShowMobileDetail(false); }}
              />
            )}

            {mode === "detail" && selectedItem && (
              <DetailPane
                key={selectedItem.id}
                item={selectedItem}
                onUpdate={handleUpdate}
                onBack={showMobileDetail ? () => setShowMobileDetail(false) : undefined}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
