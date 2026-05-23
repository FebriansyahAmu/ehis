"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MasterListPanel } from "@/components/master/shared";
import {
  type ObatRecord, type ObatKategori,
  OBAT_KATEGORI_CFG, KATEGORI_OBAT_ORDER, BENTUK_CFG,
} from "@/lib/master/obatMock";
import { obatInitials } from "./katalogObatShared";

type FilterFlag = "all" | "form" | "non_form" | "ham" | "lasa" | "narkotika";

interface Props {
  items: ObatRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

export default function ObatList({ items, selectedId, onSelect, onAddNew }: Props) {
  const [search, setSearch] = useState("");
  const [activeKategori, setActiveKategori] = useState<ObatKategori | "all">("all");
  const [flag, setFlag] = useState<FilterFlag>("all");

  const filtered = useMemo(() => {
    let arr = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((o) =>
        o.namaGenerik.toLowerCase().includes(q) ||
        o.namaDagang.toLowerCase().includes(q) ||
        o.kode.toLowerCase().includes(q) ||
        (o.pabrik ?? "").toLowerCase().includes(q),
      );
    }
    if (activeKategori !== "all") arr = arr.filter((o) => o.kategori === activeKategori);
    if (flag === "form")      arr = arr.filter((o) => o.isFormularium);
    if (flag === "non_form")  arr = arr.filter((o) => !o.isFormularium);
    if (flag === "ham")       arr = arr.filter((o) => o.isHAM);
    if (flag === "lasa")      arr = arr.filter((o) => o.isLASA);
    if (flag === "narkotika") arr = arr.filter((o) =>
      o.golongan?.startsWith("Narkotika") || o.golongan?.startsWith("Psikotropika"),
    );
    return arr;
  }, [items, search, activeKategori, flag]);

  const hasActiveFilter = activeKategori !== "all" || flag !== "all";

  return (
    <MasterListPanel
      accent="violet"
      query={search}
      onQueryChange={setSearch}
      searchPlaceholder="Cari nama, kode, pabrik..."
      visibleCount={filtered.length}
      totalCount={items.length}
      hasActiveFilter={hasActiveFilter}
      onAddNew={onAddNew}
      addLabel="Tambah Obat"
      isEmpty={filtered.length === 0}
      emptyTitle="Tidak ada obat cocok"
      emptyDesc="Ubah filter atau tambah obat baru"
      filterSlot={
        <>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kategori</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <FilterChip label="Semua" active={activeKategori === "all"} onClick={() => setActiveKategori("all")} />
              {KATEGORI_OBAT_ORDER.map((cat) => {
                const cfg = OBAT_KATEGORI_CFG[cat];
                return (
                  <FilterChip
                    key={cat}
                    label={cfg.short}
                    active={activeKategori === cat}
                    accent={cfg}
                    onClick={() => setActiveKategori(cat)}
                  />
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Flag</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <FilterChip label="Semua"       active={flag === "all"}       onClick={() => setFlag("all")} />
              <FilterChip label="Formularium" active={flag === "form"}      onClick={() => setFlag("form")} />
              <FilterChip label="Non-Form"    active={flag === "non_form"}  onClick={() => setFlag("non_form")} />
              <FilterChip label="HAM"         active={flag === "ham"}       onClick={() => setFlag("ham")} />
              <FilterChip label="LASA"        active={flag === "lasa"}      onClick={() => setFlag("lasa")} />
              <FilterChip label="Nar/Psi"     active={flag === "narkotika"} onClick={() => setFlag("narkotika")} />
            </div>
          </div>
        </>
      }
    >
      <motion.ul layout className="flex flex-col gap-0.5 px-1.5 py-1.5">
        {filtered.map((o, i) => (
          <ObatRow
            key={o.id}
            obat={o}
            active={selectedId === o.id}
            onClick={() => onSelect(o.id)}
            index={i}
          />
        ))}
      </motion.ul>
    </MasterListPanel>
  );
}

// ── Sub-components ───────────────────────────────────────

function FilterChip({
  label, active, accent, onClick,
}: {
  label: string;
  active: boolean;
  accent?: { bg: string; text: string };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-violet-200",
        active
          ? accent
            ? cn("border-transparent", accent.bg, accent.text)
            : "border-transparent bg-violet-100 text-violet-700"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}

function ObatRow({
  obat, active, onClick, index,
}: {
  obat: ObatRecord;
  active: boolean;
  onClick: () => void;
  index: number;
}) {
  const catCfg = OBAT_KATEGORI_CFG[obat.kategori];
  const bentukCfg = BENTUK_CFG[obat.bentuk];

  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.015, 0.2) }}
      layout
    >
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "group flex w-full items-start gap-2 rounded-lg border px-2 py-2 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-violet-200",
          active
            ? "border-violet-200 bg-violet-50/70 ring-1 ring-violet-200"
            : "border-transparent hover:border-slate-200 hover:bg-slate-50",
        )}
      >
        <span className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-[10px]",
          catCfg.bg, catCfg.text,
        )}>
          {obatInitials(obat)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className={cn("truncate text-xs font-semibold", active ? "text-violet-900" : "text-slate-800")}>
              {obat.namaGenerik}
            </p>
            {obat.isHAM && (
              <span className="shrink-0 rounded bg-rose-100 px-1 py-0 text-[9px] font-bold text-rose-700">HAM</span>
            )}
            {obat.isLASA && (
              <span className="shrink-0 rounded bg-amber-100 px-1 py-0 text-[9px] font-bold text-amber-700">LASA</span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[10px] text-slate-500">
            {obat.namaDagang} {obat.pabrik && `· ${obat.pabrik}`}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="rounded px-1 py-0 text-[10px] font-mono text-slate-400 bg-slate-100">
              {bentukCfg.short}
            </span>
            <span className="text-[10px] text-slate-500">{obat.kekuatan}</span>
            {obat.golongan && (obat.golongan.startsWith("Narkotika") || obat.golongan.startsWith("Psikotropika")) && (
              <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-700">
                <AlertTriangle size={9} />
                {obat.golongan.split("_")[0].charAt(0)}
              </span>
            )}
          </div>
        </div>
      </motion.button>
    </motion.li>
  );
}
