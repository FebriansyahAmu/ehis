"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MasterListPanel } from "@/components/master/shared";
import type {
  TindakanRecord, TindakanKategori, TingkatKompleksitas,
} from "@/lib/master/tindakanMock";
import {
  KATEGORI_CFG, KOMPLEKSITAS_CFG, KATEGORI_ORDER,
} from "@/lib/master/tindakanMock";
import { tindakanInitials, getStatusCfg } from "./katalogTindakanShared";

const KOMPLEKSITAS_ORDER: TingkatKompleksitas[] = [
  "Sederhana", "Sedang", "Khusus", "Canggih",
];

interface Props {
  items: TindakanRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

export default function TindakanList({ items, selectedId, onSelect, onAddNew }: Props) {
  const [search, setSearch] = useState("");
  const [activeKategori, setActiveKategori] = useState<TindakanKategori | "all">("all");
  const [activeKomp,     setActiveKomp]     = useState<TingkatKompleksitas | "all">("all");

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
    if (activeKomp     !== "all") arr = arr.filter((t) => t.kompleksitas === activeKomp);
    return arr;
  }, [items, search, activeKategori, activeKomp]);

  const hasActiveFilter = activeKategori !== "all" || activeKomp !== "all";

  return (
    <MasterListPanel
      accent="teal"
      query={search}
      onQueryChange={setSearch}
      searchPlaceholder="Cari nama, kode ICD-9..."
      visibleCount={filtered.length}
      totalCount={items.length}
      hasActiveFilter={hasActiveFilter}
      onAddNew={onAddNew}
      addLabel="Tambah Tindakan"
      isEmpty={filtered.length === 0}
      emptyTitle="Tidak ada tindakan cocok"
      emptyDesc="Ubah filter atau tambah tindakan baru"
      widthClass="w-[320px]"
      filterSlot={
        <>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kategori</p>
            <div className="flex flex-wrap gap-1">
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
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kompleksitas</p>
            <div className="flex flex-wrap gap-1">
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
        </>
      }
    >
      <motion.ul layout className="flex flex-col gap-0.5 px-1.5 py-1.5">
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
    </MasterListPanel>
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
        "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-teal-200",
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
          "group flex w-full items-start gap-2 rounded-lg border px-2 py-2 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-teal-200",
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
