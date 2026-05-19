"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, ChevronRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TindakanRecord, TindakanKategori, TingkatKompleksitas } from "@/lib/master/tindakanMock";
import { KATEGORI_CFG, KOMPLEKSITAS_CFG, KATEGORI_ORDER } from "@/lib/master/tindakanMock";
import { tindakanInitials, getStatusCfg } from "./katalogTindakanShared";

const KOMPLEKSITAS_ORDER: TingkatKompleksitas[] = ["Sederhana", "Sedang", "Khusus", "Canggih"];

interface TindakanListProps {
  items: TindakanRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

export default function TindakanList({ items, selectedId, onSelect, onAddNew }: TindakanListProps) {
  const [search, setSearch] = useState("");
  const [activeKategori, setActiveKategori] = useState<TindakanKategori | "all">("all");
  const [activeKomp, setActiveKomp] = useState<TingkatKompleksitas | "all">("all");
  const [showFilter, setShowFilter] = useState(false);

  const filtered = useMemo(() => {
    let arr = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((t) =>
        t.nama.toLowerCase().includes(q) ||
        t.kode.toLowerCase().includes(q) ||
        KATEGORI_CFG[t.kategori].label.toLowerCase().includes(q),
      );
    }
    if (activeKategori !== "all") arr = arr.filter((t) => t.kategori === activeKategori);
    if (activeKomp !== "all") arr = arr.filter((t) => t.kompleksitas === activeKomp);
    return arr;
  }, [items, search, activeKategori, activeKomp]);

  const filterCount = (activeKategori !== "all" ? 1 : 0) + (activeKomp !== "all" ? 1 : 0);

  return (
    <aside className="flex h-full w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-[320px]">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Daftar Tindakan</h3>
            <p className="text-[11px] text-slate-400">{filtered.length} dari {items.length}</p>
          </div>
          <motion.button
            type="button"
            onClick={onAddNew}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Plus size={11} strokeWidth={2.5} />
            Tambah
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative mt-2">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, kode ICD-9..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
          />
        </div>

        {/* Filter toggle */}
        <button
          type="button"
          onClick={() => setShowFilter((s) => !s)}
          className="mt-1.5 flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 transition hover:bg-slate-100"
        >
          <span className="text-[11px] font-semibold text-slate-600">
            Filter
            {filterCount > 0 && (
              <span className="ml-1 rounded-full bg-teal-100 px-1.5 py-0 text-[10px] font-bold text-teal-700">
                {filterCount}
              </span>
            )}
          </span>
          <ChevronRight
            size={10}
            className={cn("text-slate-400 transition-transform", showFilter && "rotate-90")}
          />
        </button>

        <AnimatePresence initial={false}>
          {showFilter && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 pt-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kategori</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <FChip label="Semua" active={activeKategori === "all"} onClick={() => setActiveKategori("all")} />
                    {KATEGORI_ORDER.map((cat) => (
                      <FChip
                        key={cat}
                        label={KATEGORI_CFG[cat].short}
                        active={activeKategori === cat}
                        activeCls={cn("border-transparent", KATEGORI_CFG[cat].bg, KATEGORI_CFG[cat].text)}
                        onClick={() => setActiveKategori(cat)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kompleksitas</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <FChip label="Semua" active={activeKomp === "all"} onClick={() => setActiveKomp("all")} />
                    {KOMPLEKSITAS_ORDER.map((k) => (
                      <FChip
                        key={k}
                        label={k}
                        active={activeKomp === k}
                        activeCls={cn("border-transparent", KOMPLEKSITAS_CFG[k].bg, KOMPLEKSITAS_CFG[k].text)}
                        onClick={() => setActiveKomp(k)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Zap size={20} className="text-slate-300" />
            <p className="mt-2 text-xs font-semibold text-slate-500">Tidak ada tindakan cocok</p>
            <p className="text-[11px] text-slate-400">Ubah filter atau tambah tindakan baru.</p>
          </div>
        ) : (
          <motion.ul layout className="flex flex-col gap-0.5">
            {filtered.map((t, i) => (
              <TindakanRow
                key={t.id}
                item={t}
                active={selectedId === t.id}
                onClick={() => onSelect(t.id)}
                index={i}
              />
            ))}
          </motion.ul>
        )}
      </div>
    </aside>
  );
}

// ── Sub-components ───────────────────────────────────────

function FChip({
  label, active, activeCls, onClick,
}: {
  label: string;
  active: boolean;
  activeCls?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition",
        active
          ? activeCls ?? "border-transparent bg-teal-100 text-teal-700"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}

function TindakanRow({
  item, active, onClick, index,
}: {
  item: TindakanRecord;
  active: boolean;
  onClick: () => void;
  index: number;
}) {
  const catCfg = KATEGORI_CFG[item.kategori];
  const kompCfg = KOMPLEKSITAS_CFG[item.kompleksitas];
  const statusCfg = getStatusCfg(item.status);
  const isNonAktif = item.status === "NonAktif";

  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, delay: Math.min(index * 0.012, 0.2) }}
      layout
    >
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "group flex w-full items-start gap-2 rounded-lg border px-2 py-2 text-left transition",
          active
            ? "border-teal-200 bg-teal-50/60 ring-1 ring-teal-200"
            : "border-transparent hover:border-slate-200 hover:bg-slate-50",
          isNonAktif && "opacity-55",
        )}
      >
        <span className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold",
          catCfg.bg, catCfg.text,
        )}>
          {tindakanInitials(item)}
        </span>

        <div className="min-w-0 flex-1">
          <p className={cn(
            "truncate text-xs font-semibold",
            active ? "text-teal-900" : "text-slate-800",
          )}>
            {item.nama}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-slate-400">{item.kode || "—"}</p>
          <div className="mt-1 flex items-center gap-1 flex-wrap">
            <span className={cn("rounded px-1 py-0 text-[10px] font-semibold", catCfg.bg, catCfg.text)}>
              {catCfg.short}
            </span>
            <span className={cn("rounded px-1 py-0 text-[10px] font-medium", kompCfg.bg, kompCfg.text)}>
              {item.kompleksitas}
            </span>
            {isNonAktif && (
              <span className={cn("ml-auto rounded px-1 py-0 text-[10px] font-medium", statusCfg.bg, statusCfg.text)}>
                Non-Aktif
              </span>
            )}
          </div>
        </div>
      </motion.button>
    </motion.li>
  );
}
