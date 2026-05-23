"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { MasterListPanel } from "@/components/master/shared";
import {
  type TemplateAnamnesisItem, type ModulContext, type ChiefComplaintCategory,
  KATEGORI_CFG, KATEGORI_LIST, CONTEXT_CFG, CONTEXT_LIST,
} from "@/lib/master/templateAnamnesisMock";

interface Props {
  items: TemplateAnamnesisItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

type FilterStatus = "Semua" | "Aktif" | "NonAktif";

export default function TemplateAnamnesisList({
  items, selectedId, onSelect, onAddNew,
}: Props) {
  const [query, setQuery] = useState("");
  const [filterContext, setFilterContext] = useState<ModulContext | "Semua">("Semua");
  const [filterKategori, setFilterKategori] = useState<ChiefComplaintCategory | "Semua">("Semua");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("Semua");

  const filtered = items.filter((t) => {
    const q = query.toLowerCase();
    const matchQ = !q
      || t.label.toLowerCase().includes(q)
      || t.keluhanUtama.toLowerCase().includes(q)
      || t.rps.toLowerCase().includes(q);
    const matchCtx = filterContext === "Semua" || t.contextTags.includes(filterContext);
    const matchKat = filterKategori === "Semua" || t.kategori === filterKategori;
    const matchSts = filterStatus === "Semua" || t.status === filterStatus;
    return matchQ && matchCtx && matchKat && matchSts;
  });

  const hasActiveFilter =
    filterContext !== "Semua" || filterKategori !== "Semua" || filterStatus !== "Semua";

  return (
    <MasterListPanel
      accent="teal"
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Cari template (label, keluhan, RPS)..."
      visibleCount={filtered.length}
      totalCount={items.length}
      hasActiveFilter={hasActiveFilter}
      onAddNew={onAddNew}
      addLabel="Tambah Template"
      isEmpty={filtered.length === 0}
      filterSlot={
        <>
          {/* Context filter */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Modul Context
            </p>
            <div className="flex flex-wrap gap-1">
              <FilterChip
                active={filterContext === "Semua"}
                onClick={() => setFilterContext("Semua")}
                label="Semua"
                count={items.length}
              />
              {CONTEXT_LIST.map((c) => {
                const cfg = CONTEXT_CFG[c];
                const count = items.filter((t) => t.contextTags.includes(c)).length;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFilterContext(c)}
                    className={cn(
                      "flex items-center gap-1 rounded px-2 py-1 text-[10.5px] font-semibold transition",
                      filterContext === c
                        ? cn(cfg.bg, cfg.text, "ring-1 ring-current")
                        : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                    {cfg.label}
                    <span className="font-mono text-[9px] opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kategori filter */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Kategori Keluhan
            </p>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value as ChiefComplaintCategory | "Semua")}
              className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            >
              <option value="Semua">Semua kategori</option>
              {KATEGORI_LIST.map((k) => (
                <option key={k} value={k}>{KATEGORI_CFG[k].label}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
            <div className="flex gap-1">
              {(["Semua", "Aktif", "NonAktif"] as FilterStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "rounded px-2.5 py-1 text-[10px] font-medium transition",
                    filterStatus === s
                      ? "bg-teal-600 text-white"
                      : "border border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600",
                  )}
                >
                  {s === "NonAktif" ? "Non-Aktif" : s}
                </button>
              ))}
            </div>
          </div>
        </>
      }
      footer={
        <>
          <strong className="text-slate-700">{items.filter((t) => t.status === "Aktif").length}</strong> aktif ·{" "}
          <strong className="text-slate-700">{KATEGORI_LIST.length}</strong> kategori
        </>
      }
    >
      <ul>
        {filtered.map((item, i) => (
          <TemplateRow
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

// ── Filter chip ──────────────────────────────────────────

function FilterChip({
  active, onClick, label, count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded px-2 py-1 text-[10.5px] font-semibold transition",
        active
          ? "bg-teal-100 text-teal-700 ring-1 ring-teal-300"
          : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300",
      )}
    >
      {label}
      <span className="font-mono text-[9px] opacity-70">{count}</span>
    </button>
  );
}

// ── Row ──────────────────────────────────────────────────

function TemplateRow({
  item, active, index, onSelect,
}: {
  item: TemplateAnamnesisItem;
  active: boolean;
  index: number;
  onSelect: () => void;
}) {
  const katCfg = KATEGORI_CFG[item.kategori];

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
          "w-full border-b border-slate-50 px-3 py-2.5 text-left transition",
          active
            ? "bg-teal-50 border-l-2 border-l-teal-500"
            : "hover:bg-slate-50/80 border-l-2 border-l-transparent",
        )}
      >
        <div className="flex items-start gap-2">
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
              active ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500",
            )}
          >
            <Stethoscope size={12} />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate text-xs font-semibold leading-snug",
                active ? "text-teal-800" : "text-slate-700",
              )}
            >
              {item.label}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-500">
              {item.keluhanUtama}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span className={cn("rounded px-1.5 text-[9px] font-semibold uppercase", katCfg.bg, katCfg.text)}>
                {katCfg.label}
              </span>
              {item.contextTags.map((c) => {
                const cfg = CONTEXT_CFG[c];
                return (
                  <span
                    key={c}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-1.5 text-[9px] font-bold",
                      cfg.bg,
                      cfg.text,
                    )}
                  >
                    <span className={cn("h-1 w-1 rounded-full", cfg.dot)} />
                    {cfg.label}
                  </span>
                );
              })}
              {item.status === "NonAktif" && (
                <span className="rounded-full bg-slate-200 px-1.5 text-[9px] font-bold uppercase text-slate-600">
                  off
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    </motion.li>
  );
}
