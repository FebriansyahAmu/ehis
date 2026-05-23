"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSpreadsheet, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MasterListPanel } from "@/components/master/shared";
import {
  type IcdItem, type IcdJenis,
  getIcdStatusCfg, getChaptersByJenis,
} from "@/lib/master/icdMock";
import { JENIS_CFG, JENIS_LIST } from "./icdShared";

interface Props {
  items: IcdItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  activeJenis: IcdJenis;
  onJenisChange: (j: IcdJenis) => void;
  /** Optional: handler tombol Import Excel/CSV di header filter. */
  onImport?: () => void;
  /** Optional: notice banner setelah import sukses (auto-dismiss). */
  importNotice?: string | null;
  onDismissNotice?: () => void;
}

type FilterStatus = "Semua" | "Aktif" | "Non_Aktif";

export default function IcdList({
  items, selectedId, onSelect, onAddNew,
  activeJenis, onJenisChange,
  onImport, importNotice, onDismissNotice,
}: Props) {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("Semua");
  const [filterChapter, setFilterChapter] = useState<string>("Semua");

  const chapters = useMemo(
    () => getChaptersByJenis(items, activeJenis),
    [items, activeJenis],
  );

  // Reset chapter filter saat ganti jenis (chapter list beda)
  const handleJenisChange = (j: IcdJenis) => {
    onJenisChange(j);
    setFilterChapter("Semua");
  };

  const filtered = items.filter((item) => {
    if (item.jenis !== activeJenis) return false;
    const q = query.toLowerCase();
    const matchQ = !q
      || item.nama.toLowerCase().includes(q)
      || item.kode.toLowerCase().includes(q)
      || (item.namaInggris ?? "").toLowerCase().includes(q);
    const matchS = filterStatus === "Semua" || item.status === filterStatus;
    const matchC = filterChapter === "Semua" || item.chapter === filterChapter;
    return matchQ && matchS && matchC;
  });

  const hasActiveFilter = filterStatus !== "Semua" || filterChapter !== "Semua";
  const aktifCount = items.filter((i) => i.jenis === activeJenis && i.status === "Aktif").length;
  const activeCfg = JENIS_CFG[activeJenis];

  return (
    <MasterListPanel
      accent="sky"
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder={`Cari ${activeCfg.short} kode, nama Indonesia, atau Inggris...`}
      visibleCount={filtered.length}
      totalCount={items.filter((i) => i.jenis === activeJenis).length}
      hasActiveFilter={hasActiveFilter}
      onAddNew={onAddNew}
      addLabel={`Tambah ${activeCfg.short}`}
      isEmpty={filtered.length === 0}
      secondaryAction={
        <>
          {/* Import CTA — always visible di bawah Add CTA */}
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

          {/* Notice banner — muncul setelah import sukses, auto-dismiss */}
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
                const count = items.filter((i) => i.jenis === j).length;
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => handleJenisChange(j)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-semibold transition",
                      active
                        ? cn(cfg.bg, cfg.text, "border-current ring-1 ring-current")
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                    )}
                  >
                    <Icon size={11} />
                    <span>{cfg.short}</span>
                    <span className="ml-auto font-mono text-[9px] text-slate-400">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
            <div className="flex gap-1">
              {(["Semua", "Aktif", "Non_Aktif"] as FilterStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilterStatus(s)}
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

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Chapter
              <span className="ml-1 font-mono text-[9px] text-slate-400">({chapters.length})</span>
            </p>
            <select
              value={filterChapter}
              onChange={(e) => setFilterChapter(e.target.value)}
              className={cn(
                "w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none",
                "focus:border-sky-400 focus:ring-2 focus:ring-sky-100",
              )}
            >
              <option value="Semua">Semua chapter</option>
              {chapters.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </>
      }
      footer={
        <>
          <strong className="text-slate-700">{aktifCount}</strong> aktif ·{" "}
          <strong className="text-slate-700">{chapters.length}</strong> chapter
        </>
      }
    >
      <ul>
        {filtered.map((item, i) => (
          <IcdRow
            key={item.id}
            item={item}
            active={item.id === selectedId}
            index={i}
            onSelect={() => onSelect(item.id)}
          />
        ))}
      </ul>
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
      transition={{ duration: 0.13, delay: index * 0.01 }}
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
          {/* Kode chip */}
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
              <span className="truncate text-[9px] text-slate-400" title={item.chapter}>
                {item.chapter}
              </span>
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
