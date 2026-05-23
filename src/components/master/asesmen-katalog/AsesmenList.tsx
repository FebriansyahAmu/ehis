"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MasterListPanel } from "@/components/master/shared";
import {
  type AsesmenItem, type AsesmenKategori,
  getAsesmenStatusCfg, asesmenInitials,
} from "@/lib/master/asesmenKatalogMock";
import {
  KATEGORI_CFG, KATEGORI_GROUPS, SEVERITY_CFG,
} from "./asesmenKatalogShared";

interface Props {
  items: AsesmenItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  kategoriFilter: AsesmenKategori | "Semua";
  onKategoriFilterChange: (k: AsesmenKategori | "Semua") => void;
}

type FilterStatus = "Semua" | "Aktif" | "Non_Aktif";

export default function AsesmenList({
  items, selectedId, onSelect, onAddNew,
  kategoriFilter, onKategoriFilterChange,
}: Props) {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("Semua");

  const filtered = items.filter((item) => {
    const q = query.toLowerCase();
    const matchQ = !q
      || item.nama.toLowerCase().includes(q)
      || item.kode.toLowerCase().includes(q)
      || (item.snomedCode ?? "").includes(q);
    const matchS = filterStatus === "Semua" || item.status === filterStatus;
    const matchK = kategoriFilter === "Semua" || item.kategori === kategoriFilter;
    return matchQ && matchS && matchK;
  });

  const hasActiveFilter = filterStatus !== "Semua" || kategoriFilter !== "Semua";
  const aktifCount = items.filter((i) => i.status === "Aktif").length;

  return (
    <MasterListPanel
      accent="violet"
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Cari nama, kode, atau SNOMED..."
      visibleCount={filtered.length}
      totalCount={items.length}
      hasActiveFilter={hasActiveFilter}
      onAddNew={onAddNew}
      addLabel={kategoriFilter === "Semua" ? "Tambah Item" : `Tambah ${KATEGORI_CFG[kategoriFilter].label}`}
      isEmpty={filtered.length === 0}
      filterSlot={
        <>
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
                      ? "bg-violet-600 text-white"
                      : "border border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600",
                  )}
                >
                  {s === "Non_Aktif" ? "Non-Aktif" : s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kategori</p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => onKategoriFilterChange("Semua")}
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-medium transition",
                  kategoriFilter === "Semua"
                    ? "bg-violet-600 text-white"
                    : "border border-slate-200 text-slate-500 hover:border-slate-300",
                )}
              >
                Semua
              </button>
            </div>
            {KATEGORI_GROUPS.map((group) => (
              <div key={group.label} className="mt-1.5">
                <p className="mb-0.5 text-[9px] font-medium uppercase text-slate-400">{group.label}</p>
                <div className="flex flex-wrap gap-1">
                  {group.items.map((k) => {
                    const cfg = KATEGORI_CFG[k];
                    const active = kategoriFilter === k;
                    const count = items.filter((i) => i.kategori === k).length;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => onKategoriFilterChange(k)}
                        title={cfg.label}
                        className={cn(
                          "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition",
                          active
                            ? cn(cfg.bg, cfg.text, "ring-1 ring-current")
                            : "border border-slate-200 text-slate-500 hover:border-slate-300",
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", active ? cfg.dot : "bg-slate-300")} />
                        {cfg.label.replace(/^[^·]+· /, "")}
                        <span className="font-mono text-[9px] text-slate-400">·{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      }
      footer={
        <>
          <strong className="text-slate-700">{aktifCount}</strong> aktif ·{" "}
          <strong className="text-slate-700">{KATEGORI_GROUPS.length}</strong> grup kategori
        </>
      }
    >
      <ul>
        {filtered.map((item, i) => (
          <AsesmenRow
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

function AsesmenRow({
  item, active, index, onSelect,
}: {
  item: AsesmenItem;
  active: boolean;
  index: number;
  onSelect: () => void;
}) {
  const katCfg = KATEGORI_CFG[item.kategori];
  const stsCfg = getAsesmenStatusCfg(item.status);
  const initials = asesmenInitials(item);
  const KatIcon = katCfg.icon;

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: index * 0.012 }}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full border-b border-slate-50 px-3 py-2.5 text-left transition",
          active
            ? "bg-violet-50 border-l-2 border-l-violet-500"
            : "hover:bg-slate-50/80 border-l-2 border-l-transparent",
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            katCfg.bg, katCfg.text,
          )}>
            <KatIcon size={13} />
          </div>

          <div className="min-w-0 flex-1">
            <p className={cn(
              "truncate text-xs font-semibold",
              active ? "text-violet-800" : "text-slate-700",
            )}>
              {item.nama}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-slate-400">{item.kode}</span>
              {item.snomedCode && (
                <span className="rounded bg-teal-50 px-1 font-mono text-[9px] text-teal-700" title="SNOMED CT">
                  SCT
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className={cn(
              "max-w-[100px] truncate rounded px-1 py-0 text-[9px] font-semibold",
              katCfg.bg, katCfg.text,
            )}>
              {katCfg.label.replace(/^[^·]+· /, "")}
            </span>
            <div className="flex items-center gap-1">
              {item.severityDefault && (
                <span
                  className={cn("rounded px-1 text-[9px]", SEVERITY_CFG[item.severityDefault].bg, SEVERITY_CFG[item.severityDefault].text)}
                  title={`Severity default: ${item.severityDefault}`}
                >
                  {item.severityDefault[0]}
                </span>
              )}
              {item.status === "Non_Aktif" && (
                <span className={cn("rounded-full px-1 text-[8px]", stsCfg.bg, stsCfg.text)}>off</span>
              )}
              {initials && active && (
                <span className="rounded-md bg-violet-100 px-1 font-mono text-[8px] font-black text-violet-700">
                  {initials}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    </motion.li>
  );
}
