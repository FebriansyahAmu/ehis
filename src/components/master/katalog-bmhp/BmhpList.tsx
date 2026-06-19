"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { MasterListPanel } from "@/components/master/shared";
import {
  type BmhpRecord, type BmhpKategori,
  BMHP_KATEGORI_CFG, KATEGORI_BMHP_ORDER,
} from "@/lib/master/bmhpMock";
import { bmhpInitials } from "./katalogBmhpShared";

type FilterFlag = "all" | "form" | "non_form" | "steril" | "single" | "implan";

interface Props {
  items: BmhpRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

export default function BmhpList({ items, selectedId, onSelect, onAddNew }: Props) {
  const [search, setSearch] = useState("");
  const [activeKategori, setActiveKategori] = useState<BmhpKategori | "all">("all");
  const [flag, setFlag] = useState<FilterFlag>("all");

  const filtered = useMemo(() => {
    let arr = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((b) =>
        b.nama.toLowerCase().includes(q) ||
        (b.merek ?? "").toLowerCase().includes(q) ||
        b.kode.toLowerCase().includes(q) ||
        (b.pabrik ?? "").toLowerCase().includes(q),
      );
    }
    if (activeKategori !== "all") arr = arr.filter((b) => b.kategori === activeKategori);
    if (flag === "form")     arr = arr.filter((b) => b.isFormularium);
    if (flag === "non_form") arr = arr.filter((b) => !b.isFormularium);
    if (flag === "steril")   arr = arr.filter((b) => b.isSteril);
    if (flag === "single")   arr = arr.filter((b) => b.isSingleUse);
    if (flag === "implan")   arr = arr.filter((b) => b.isImplan);
    return arr;
  }, [items, search, activeKategori, flag]);

  const hasActiveFilter = activeKategori !== "all" || flag !== "all";

  return (
    <MasterListPanel
      accent="teal"
      query={search}
      onQueryChange={setSearch}
      searchPlaceholder="Cari nama, kode, merek..."
      visibleCount={filtered.length}
      totalCount={items.length}
      hasActiveFilter={hasActiveFilter}
      onAddNew={onAddNew}
      addLabel="Tambah BMHP"
      isEmpty={filtered.length === 0}
      emptyTitle="Tidak ada BMHP cocok"
      emptyDesc="Ubah filter atau tambah BMHP baru"
      filterSlot={
        <>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kategori</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <FilterChip label="Semua" active={activeKategori === "all"} onClick={() => setActiveKategori("all")} />
              {KATEGORI_BMHP_ORDER.map((cat) => {
                const cfg = BMHP_KATEGORI_CFG[cat];
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
              <FilterChip label="Semua"       active={flag === "all"}      onClick={() => setFlag("all")} />
              <FilterChip label="Formularium" active={flag === "form"}     onClick={() => setFlag("form")} />
              <FilterChip label="Non-Form"    active={flag === "non_form"} onClick={() => setFlag("non_form")} />
              <FilterChip label="Steril"      active={flag === "steril"}   onClick={() => setFlag("steril")} />
              <FilterChip label="Single-Use"  active={flag === "single"}   onClick={() => setFlag("single")} />
              <FilterChip label="Implan"      active={flag === "implan"}   onClick={() => setFlag("implan")} />
            </div>
          </div>
        </>
      }
    >
      <motion.ul layout className="flex flex-col gap-0.5 px-1.5 py-1.5">
        {filtered.map((b, i) => (
          <BmhpRow
            key={b.id}
            bmhp={b}
            active={selectedId === b.id}
            onClick={() => onSelect(b.id)}
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
        "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-teal-200",
        active
          ? accent
            ? cn("border-transparent", accent.bg, accent.text)
            : "border-transparent bg-teal-100 text-teal-700"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}

function BmhpRow({
  bmhp, active, onClick, index,
}: {
  bmhp: BmhpRecord;
  active: boolean;
  onClick: () => void;
  index: number;
}) {
  const catCfg = BMHP_KATEGORI_CFG[bmhp.kategori];

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
          "group flex w-full items-start gap-2 rounded-lg border px-2 py-2 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-teal-200",
          active
            ? "border-teal-200 bg-teal-50/70 ring-1 ring-teal-200"
            : "border-transparent hover:border-slate-200 hover:bg-slate-50",
        )}
      >
        <span className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-[10px]",
          catCfg.bg, catCfg.text,
        )}>
          {bmhpInitials(bmhp)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className={cn("truncate text-xs font-semibold", active ? "text-teal-900" : "text-slate-800")}>
              {bmhp.nama}
            </p>
            {bmhp.isSteril && (
              <span className="shrink-0 rounded bg-sky-100 px-1 py-0 text-[9px] font-bold text-sky-700">Steril</span>
            )}
            {bmhp.isImplan && (
              <span className="shrink-0 rounded bg-rose-100 px-1 py-0 text-[9px] font-bold text-rose-700">Implan</span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[10px] text-slate-500">
            {bmhp.merek ?? "—"} {bmhp.pabrik && `· ${bmhp.pabrik}`}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="rounded px-1 py-0 text-[10px] font-mono text-slate-400 bg-slate-100">
              {catCfg.short}
            </span>
            {bmhp.ukuran && <span className="text-[10px] text-slate-500">{bmhp.ukuran}</span>}
            <span className="text-[10px] italic text-slate-400">/ {bmhp.satuan}</span>
            {bmhp.isFormularium && (
              <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                <ShieldCheck size={9} />
                Form
              </span>
            )}
          </div>
        </div>
      </motion.button>
    </motion.li>
  );
}
