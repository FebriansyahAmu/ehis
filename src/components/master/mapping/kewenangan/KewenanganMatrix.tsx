"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ShieldCheck, Search, Filter, RotateCcw, CheckCheck, Square,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SPESIALIS_LABEL } from "@/components/master/dokter/dokterShared";
import { type DokterRecord } from "@/components/master/dokter/dokterMock";
import { makeInitials } from "../mappingShared";
import {
  type TindakanRecord, type TindakanKategori,
  KATEGORI_CFG, KATEGORI_ORDER, KOMPLEKSITAS_CFG, groupByKategori,
} from "@/lib/master/tindakanMock";
import type { KewenanganMap } from "./kewenanganShared";
import { hasKewenangan } from "./kewenanganShared";

interface KewenanganMatrixProps {
  dokter: DokterRecord;
  tindakan: TindakanRecord[];
  map: KewenanganMap;
  onToggle: (tindakanId: string) => void;
  onResetDefault: () => void;
  onClearAll: () => void;
}

type FilterStatus = "all" | "granted" | "not";

export default function KewenanganMatrix({
  dokter, tindakan, map, onToggle, onResetDefault, onClearAll,
}: KewenanganMatrixProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  // Kategori expand state — defaultnya semua collapsed kecuali yang ada granted
  const [expanded, setExpanded] = useState<Record<TindakanKategori, boolean>>(() => {
    const initial: Partial<Record<TindakanKategori, boolean>> = {};
    for (const cat of KATEGORI_ORDER) {
      initial[cat] = tindakan.some(
        (t) => t.kategori === cat && hasKewenangan(map, dokter.id, t.id),
      );
    }
    return initial as Record<TindakanKategori, boolean>;
  });

  // Re-derive when dokter changes — re-collapse based on new map
  useMemo(() => {
    const fresh: Partial<Record<TindakanKategori, boolean>> = {};
    for (const cat of KATEGORI_ORDER) {
      fresh[cat] = tindakan.some(
        (t) => t.kategori === cat && hasKewenangan(map, dokter.id, t.id),
      );
    }
    setExpanded(fresh as Record<TindakanKategori, boolean>);
  }, [dokter.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return tindakan.filter((t) => {
      const granted = hasKewenangan(map, dokter.id, t.id);
      if (filterStatus === "granted" && !granted) return false;
      if (filterStatus === "not" && granted) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return t.nama.toLowerCase().includes(q) || t.kode.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tindakan, map, dokter.id, filterStatus, search]);

  const grouped = useMemo(() => groupByKategori(filtered), [filtered]);
  const grantedTotal = useMemo(
    () => tindakan.filter((t) => hasKewenangan(map, dokter.id, t.id)).length,
    [tindakan, map, dokter.id],
  );

  const toggleCategory = (cat: TindakanKategori) => {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const grantAllInCategory = (cat: TindakanKategori) => {
    const inCat = tindakan.filter((t) => t.kategori === cat);
    for (const t of inCat) {
      if (!hasKewenangan(map, dokter.id, t.id)) onToggle(t.id);
    }
  };

  const revokeAllInCategory = (cat: TindakanKategori) => {
    const inCat = tindakan.filter((t) => t.kategori === cat);
    for (const t of inCat) {
      if (hasKewenangan(map, dokter.id, t.id)) onToggle(t.id);
    }
  };

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 m-tiny font-black text-teal-700">
            {makeInitials(dokter.nama)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="m-mini font-semibold uppercase tracking-wider text-teal-600">
                Kewenangan Klinis
              </p>
              <Stethoscope size={9} className="text-teal-500" />
            </div>
            <h2 className="truncate m-base font-bold text-slate-900">{dokter.nama}</h2>
            {dokter.spesialis && (
              <p className="mt-0.5 truncate m-tiny text-slate-500">
                {SPESIALIS_LABEL[dokter.spesialis]} ·{" "}
                <span className="font-semibold text-teal-700">
                  {grantedTotal} / {tindakan.length} tindakan
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 border-b border-slate-100 px-4 py-2.5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tindakan / kode..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 m-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <FilterChip value="all"     active={filterStatus === "all"}     onClick={() => setFilterStatus("all")}>Semua</FilterChip>
            <FilterChip value="granted" active={filterStatus === "granted"} onClick={() => setFilterStatus("granted")}>Diberi</FilterChip>
            <FilterChip value="not"     active={filterStatus === "not"}     onClick={() => setFilterStatus("not")}>Belum</FilterChip>
          </div>
        </div>

        {/* Bulk actions */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="m-mini text-slate-500">
            <Filter size={9} className="-mt-0.5 mr-0.5 inline" />
            Aksi cepat berdasarkan spesialis dokter
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onResetDefault}
              className="flex items-center gap-1 rounded-md border border-teal-200 bg-white px-2 py-1 m-mini font-semibold text-teal-700 transition hover:bg-teal-50"
            >
              <RotateCcw size={9} />
              Sesuai Spesialis
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 m-mini font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Square size={9} />
              Hapus Semua
            </button>
          </div>
        </div>
      </div>

      {/* Accordion list */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          KATEGORI_ORDER.map((cat) => {
            const items = grouped.get(cat) ?? [];
            if (items.length === 0) return null;
            const isOpen = expanded[cat];
            const grantedInCat = items.filter((t) => hasKewenangan(map, dokter.id, t.id)).length;
            return (
              <CategorySection
                key={cat}
                kategori={cat}
                items={items}
                granted={grantedInCat}
                isOpen={isOpen}
                onToggleOpen={() => toggleCategory(cat)}
                onGrantAll={() => grantAllInCategory(cat)}
                onRevokeAll={() => revokeAllInCategory(cat)}
                renderRow={(t) => (
                  <TindakanRow
                    key={t.id}
                    tindakan={t}
                    granted={hasKewenangan(map, dokter.id, t.id)}
                    onToggle={() => onToggle(t.id)}
                  />
                )}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

// ── Sub-components ───────────────────────────────────────

function FilterChip({
  active, onClick, children,
}: {
  value: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-1 m-mini font-semibold transition",
        active
          ? "bg-teal-600 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}

interface CategorySectionProps {
  kategori: TindakanKategori;
  items: TindakanRecord[];
  granted: number;
  isOpen: boolean;
  onToggleOpen: () => void;
  onGrantAll: () => void;
  onRevokeAll: () => void;
  renderRow: (t: TindakanRecord) => React.ReactNode;
}

function CategorySection({
  kategori, items, granted, isOpen, onToggleOpen, onGrantAll, onRevokeAll, renderRow,
}: CategorySectionProps) {
  const cfg = KATEGORI_CFG[kategori];
  const allGranted = granted === items.length;

  return (
    <div className="mb-1.5 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className={cn("flex items-center gap-2 px-2.5 py-2 transition-colors", isOpen ? cfg.bg : "bg-slate-50")}>
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex flex-1 items-center gap-2"
        >
          <motion.span animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
            <ChevronDown size={12} className={isOpen ? cfg.text : "text-slate-400"} />
          </motion.span>
          <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
          <span className={cn("m-xs font-bold", isOpen ? cfg.text : "text-slate-800")}>
            {cfg.label}
          </span>
          <span className={cn(
            "rounded-full px-1.5 py-0.5 m-mini font-bold",
            allGranted ? "bg-teal-100 text-teal-700" : isOpen ? "bg-white/60 text-slate-600" : "bg-slate-200 text-slate-600",
          )}>
            {granted}/{items.length}
          </span>
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onGrantAll}
            title="Beri kewenangan semua di kategori ini"
            className="flex items-center gap-0.5 rounded-md border border-teal-200 bg-white px-1.5 py-0.5 m-mini font-semibold text-teal-700 transition hover:bg-teal-50"
          >
            <CheckCheck size={9} />
          </button>
          <button
            type="button"
            onClick={onRevokeAll}
            title="Cabut semua kewenangan di kategori ini"
            className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 m-mini font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            <Square size={9} />
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="items"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col divide-y divide-slate-100">
              {items.map(renderRow)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TindakanRow({
  tindakan, granted, onToggle,
}: {
  tindakan: TindakanRecord;
  granted: boolean;
  onToggle: () => void;
}) {
  const kCfg = KOMPLEKSITAS_CFG[tindakan.kompleksitas];

  return (
    <motion.label
      whileTap={{ scale: 0.99 }}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors",
        granted ? "bg-teal-50/40 hover:bg-teal-50/60" : "hover:bg-slate-50",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={granted ? "Cabut kewenangan" : "Beri kewenangan"}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition",
          granted
            ? "border-teal-600 bg-teal-600 text-white"
            : "border-slate-300 bg-white hover:border-teal-400",
        )}
      >
        {granted && <ShieldCheck size={12} strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn(
          "truncate m-xs font-semibold",
          granted ? "text-slate-900" : "text-slate-700",
        )}>
          {tindakan.nama}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="font-mono m-mini text-slate-400">{tindakan.kode}</span>
          <span className={cn("rounded px-1 py-0 m-mini font-bold", kCfg.bg, kCfg.text)}>
            {kCfg.label}
          </span>
        </div>
      </div>
    </motion.label>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
        <ShieldCheck size={16} className="text-slate-400" />
      </span>
      <p className="m-xs text-slate-500">Tidak ada tindakan cocok dengan filter</p>
    </div>
  );
}
