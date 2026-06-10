"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FileSpreadsheet, CheckCircle2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MasterListPanel } from "@/components/master/shared";
import { type IcdItem, type IcdJenis, getIcdStatusCfg } from "@/lib/master/icdMock";
import { JENIS_CFG, JENIS_LIST } from "./icdShared";

export type FilterStatus = "Semua" | "Aktif" | "Non_Aktif";

interface Props {
  items: IcdItem[]; // halaman yang sudah dimuat (server-filtered)
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  activeJenis: IcdJenis;
  onJenisChange: (j: IcdJenis) => void;
  // Filter server-side (di-drive parent)
  query: string;
  onQueryChange: (q: string) => void;
  filterStatus: FilterStatus;
  onFilterStatusChange: (s: FilterStatus) => void;
  // Paginasi cursor
  loading: boolean;       // memuat halaman pertama
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  // Import
  onImport?: () => void;
  importNotice?: string | null;
  onDismissNotice?: () => void;
}

export default function IcdList({
  items, selectedId, onSelect, onAddNew,
  activeJenis, onJenisChange,
  query, onQueryChange, filterStatus, onFilterStatusChange,
  loading, hasMore, loadingMore, onLoadMore,
  onImport, importNotice, onDismissNotice,
}: Props) {
  const hasActiveFilter = filterStatus !== "Semua";
  const activeCfg = JENIS_CFG[activeJenis];

  return (
    <MasterListPanel
      accent="sky"
      query={query}
      onQueryChange={onQueryChange}
      searchPlaceholder={`Cari ${activeCfg.short} kode atau display...`}
      visibleCount={items.length}
      totalCount={items.length}
      hasActiveFilter={hasActiveFilter}
      onAddNew={onAddNew}
      addLabel={`Tambah ${activeCfg.short}`}
      isEmpty={!loading && items.length === 0}
      emptyTitle={query ? "Tidak ada hasil" : "Katalog kosong"}
      emptyDesc={query ? "Coba kata kunci atau jenis lain" : "Import dataset SatuSehat untuk mengisi katalog"}
      secondaryAction={
        <>
          {onImport && (
            <button
              type="button"
              onClick={onImport}
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 py-1.5 text-[11px] font-semibold text-sky-700 transition",
                "hover:border-sky-400 hover:bg-sky-100",
              )}
            >
              <FileSpreadsheet size={12} />
              Import dari Excel / CSV
            </button>
          )}
          <AnimatePresence>
            {importNotice && (
              <motion.div
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
                  <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-600" />
                  <p className="flex-1 text-[10.5px] leading-snug text-emerald-800">{importNotice}</p>
                  {onDismissNotice && (
                    <button
                      type="button"
                      onClick={onDismissNotice}
                      aria-label="Tutup notifikasi"
                      className="shrink-0 rounded p-0.5 text-emerald-600 transition hover:bg-emerald-100"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      }
      filterSlot={
        <>
          {/* Jenis switcher */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Jenis</p>
            <div className="grid grid-cols-2 gap-1.5">
              {JENIS_LIST.map((j) => {
                const cfg = JENIS_CFG[j];
                const active = activeJenis === j;
                const Icon = cfg.icon;
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => onJenisChange(j)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-semibold transition",
                      active
                        ? cn(cfg.bg, cfg.text, "border-current ring-1 ring-current")
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                    )}
                  >
                    <Icon size={11} />
                    <span>{cfg.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status filter */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
            <div className="flex gap-1">
              {(["Semua", "Aktif", "Non_Aktif"] as FilterStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onFilterStatusChange(s)}
                  className={cn(
                    "rounded px-2.5 py-1 text-[10px] font-medium transition",
                    filterStatus === s
                      ? "bg-sky-600 text-white"
                      : "border border-slate-200 text-slate-500 hover:border-sky-300 hover:text-sky-600",
                  )}
                >
                  {s === "Non_Aktif" ? "Non-Aktif" : s}
                </button>
              ))}
            </div>
          </div>
        </>
      }
      footer={
        <>
          <strong className="text-slate-700">{items.length}</strong> kode dimuat
          {hasMore && <span className="text-slate-400"> · ada lagi</span>}
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400">
          <Loader2 size={14} className="animate-spin" /> Memuat katalog…
        </div>
      ) : (
        <>
          <ul>
            {items.map((item, i) => (
              <IcdRow
                key={item.id}
                item={item}
                active={item.id === selectedId}
                index={i}
                onSelect={() => onSelect(item.id)}
              />
            ))}
          </ul>
          {hasMore && (
            <div className="p-2">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-1.5 text-[11px] font-semibold transition",
                  loadingMore ? "cursor-not-allowed text-slate-300" : "text-slate-600 hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-700",
                )}
              >
                {loadingMore ? <Loader2 size={12} className="animate-spin" /> : null}
                {loadingMore ? "Memuat…" : "Muat lebih banyak"}
              </button>
            </div>
          )}
        </>
      )}
    </MasterListPanel>
  );
}

// ── Row ──────────────────────────────────────────────────

function IcdRow({
  item, active, index, onSelect,
}: {
  item: IcdItem;
  active: boolean;
  index: number;
  onSelect: () => void;
}) {
  const cfg = JENIS_CFG[item.jenis];
  const stsCfg = getIcdStatusCfg(item.status);

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.13, delay: Math.min(index, 12) * 0.01 }}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full border-b border-slate-50 px-3 py-2 text-left transition",
          active
            ? "bg-sky-50 border-l-2 border-l-sky-500"
            : "hover:bg-slate-50/80 border-l-2 border-l-transparent",
        )}
      >
        <div className="flex items-start gap-2">
          <div className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-bold tracking-tight",
            active ? cn(cfg.bg, cfg.text) : "bg-slate-100 text-slate-600",
          )}>
            {item.kode}
          </div>

          <div className="min-w-0 flex-1">
            <p className={cn(
              "text-xs font-semibold leading-snug",
              active ? "text-sky-800" : "text-slate-700",
            )}>
              {item.nama}
            </p>
            {item.namaInggris && (
              <p className="mt-0.5 truncate text-[10px] italic text-slate-400">
                {item.namaInggris}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span className="rounded bg-sky-50 px-1 font-mono text-[9px] text-sky-600" title="Versi CodeSystem">
                v{item.version}
              </span>
              {item.chapter && (
                <span className="truncate text-[9px] text-slate-400" title={item.chapter}>
                  {item.chapter}
                </span>
              )}
              {item.inaCbg && (
                <span className="rounded bg-emerald-50 px-1 font-mono text-[9px] text-emerald-700" title="INA-CBG mapping">
                  CBG {item.inaCbg}
                </span>
              )}
              {item.status === "Non_Aktif" && (
                <span className={cn("rounded-full px-1 text-[8px]", stsCfg.bg, stsCfg.text)}>off</span>
              )}
            </div>
          </div>
        </div>
      </button>
    </motion.li>
  );
}
