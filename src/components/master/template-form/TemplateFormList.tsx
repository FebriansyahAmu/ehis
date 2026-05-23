"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MasterListPanel } from "@/components/master/shared";
import {
  type TemplateFormItem, type TemplateFormJenis,
  JENIS_CFG, SBAR_CONTEXT_CFG, SURAT_JENIS_CFG, QUICKTEXT_KAT_CFG,
} from "@/lib/master/templateFormMock";

interface Props {
  items: TemplateFormItem[];
  jenis: TemplateFormJenis;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

type FilterStatus = "Semua" | "Aktif" | "NonAktif";

export default function TemplateFormList({
  items, jenis, selectedId, onSelect, onAddNew,
}: Props) {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("Semua");

  const cfg = JENIS_CFG[jenis];

  const filtered = items.filter((t) => {
    if (t.jenis !== jenis) return false;
    const q = query.toLowerCase();
    const matchQ = !q
      || t.label.toLowerCase().includes(q)
      || (t.jenis === "quick-text" && t.shortcut.toLowerCase().includes(q));
    const matchS = filterStatus === "Semua" || t.status === filterStatus;
    return matchQ && matchS;
  });

  const totalForJenis = items.filter((t) => t.jenis === jenis).length;
  const aktifCount = items.filter((t) => t.jenis === jenis && t.status === "Aktif").length;
  const hasActiveFilter = filterStatus !== "Semua";

  return (
    <MasterListPanel
      accent="sky"
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder={`Cari template ${cfg.short.toLowerCase()}...`}
      visibleCount={filtered.length}
      totalCount={totalForJenis}
      hasActiveFilter={hasActiveFilter}
      onAddNew={onAddNew}
      addLabel={`Tambah ${cfg.short}`}
      isEmpty={filtered.length === 0}
      filterSlot={
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
                    ? "bg-sky-600 text-white"
                    : "border border-slate-200 text-slate-500 hover:border-sky-300 hover:text-sky-600",
                )}
              >
                {s === "NonAktif" ? "Non-Aktif" : s}
              </button>
            ))}
          </div>
        </div>
      }
      footer={
        <>
          <strong className="text-slate-700">{aktifCount}</strong> aktif ·{" "}
          <span className={cfg.text}>{cfg.label}</span>
        </>
      }
      widthClass="w-[320px]"
    >
      <ul>
        {filtered.map((item, i) => (
          <Row
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

// ── Row — adaptif per jenis ──────────────────────────────

function Row({
  item, active, index, onSelect,
}: {
  item: TemplateFormItem;
  active: boolean;
  index: number;
  onSelect: () => void;
}) {
  const cfg = JENIS_CFG[item.jenis];
  const Icon = cfg.icon;

  // Sub-label per jenis
  const subLabel = (() => {
    switch (item.jenis) {
      case "sbar":       return SBAR_CONTEXT_CFG[item.context].label;
      case "ic-risiko":  return `${item.tindakan}${item.kodeIcd9 ? ` · ICD-9 ${item.kodeIcd9}` : ""}`;
      case "surat":      return SURAT_JENIS_CFG[item.jenisSurat].label;
      case "quick-text": return `${item.shortcut} · ${QUICKTEXT_KAT_CFG[item.kategori].label}`;
    }
  })();

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
            ? cn(cfg.bg, "border-l-2", `border-l-${cfg.tone}-500`)
            : "hover:bg-slate-50/80 border-l-2 border-l-transparent",
        )}
      >
        <div className="flex items-start gap-2">
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
              active ? cfg.bg : "bg-slate-100",
              active ? cfg.text : "text-slate-500",
            )}
          >
            <Icon size={12} />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate text-xs font-semibold leading-snug",
                active ? cfg.text : "text-slate-700",
              )}
            >
              {item.label || "(tanpa label)"}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-500">{subLabel}</p>
            {item.status === "NonAktif" && (
              <span className="mt-1 inline-block rounded-full bg-slate-200 px-1.5 text-[9px] font-bold uppercase text-slate-600">
                off
              </span>
            )}
          </div>
        </div>
      </button>
    </motion.li>
  );
}
