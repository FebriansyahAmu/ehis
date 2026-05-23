"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MasterListPanel } from "@/components/master/shared";
import {
  type SdkiItem, type SdkiKategori, type SdkiJenis,
  getSdkiStatusCfg, countSdkiIntervensi,
} from "@/lib/master/sdkiMock";
import { KATEGORI_CFG, KATEGORI_LIST, JENIS_CFG, JENIS_LIST } from "./sdkiShared";

interface Props {
  items: SdkiItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

type FilterStatus = "Semua" | "Aktif" | "Non_Aktif";
type FilterKategori = "Semua" | SdkiKategori;
type FilterJenis = "Semua" | SdkiJenis;

export default function SdkiList({
  items, selectedId, onSelect, onAddNew,
}: Props) {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("Semua");
  const [filterKategori, setFilterKategori] = useState<FilterKategori>("Semua");
  const [filterJenis, setFilterJenis] = useState<FilterJenis>("Semua");

  const filtered = items.filter((item) => {
    const q = query.toLowerCase();
    const matchQ = !q
      || item.nama.toLowerCase().includes(q)
      || item.kode.toLowerCase().includes(q)
      || item.subKategori.toLowerCase().includes(q);
    const matchS = filterStatus === "Semua" || item.status === filterStatus;
    const matchK = filterKategori === "Semua" || item.kategori === filterKategori;
    const matchJ = filterJenis === "Semua" || item.jenis === filterJenis;
    return matchQ && matchS && matchK && matchJ;
  });

  const hasActiveFilter = filterStatus !== "Semua" || filterKategori !== "Semua" || filterJenis !== "Semua";
  const aktifCount = items.filter((i) => i.status === "Aktif").length;

  return (
    <MasterListPanel
      accent="rose"
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Cari kode D.NNNN, nama, atau sub-kategori..."
      visibleCount={filtered.length}
      totalCount={items.length}
      hasActiveFilter={hasActiveFilter}
      onAddNew={onAddNew}
      addLabel="Tambah Diagnosa"
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
                      ? "bg-rose-600 text-white"
                      : "border border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-600",
                  )}
                >
                  {s === "Non_Aktif" ? "Non-Aktif" : s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kategori SDKI</p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setFilterKategori("Semua")}
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-medium transition",
                  filterKategori === "Semua"
                    ? "bg-rose-600 text-white"
                    : "border border-slate-200 text-slate-500 hover:border-slate-300",
                )}
              >
                Semua
              </button>
              {KATEGORI_LIST.map((k) => {
                const cfg = KATEGORI_CFG[k];
                const active = filterKategori === k;
                const Icon = cfg.icon;
                const count = items.filter((i) => i.kategori === k).length;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setFilterKategori(k)}
                    className={cn(
                      "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition",
                      active
                        ? cn(cfg.bg, cfg.text, "ring-1 ring-current")
                        : "border border-slate-200 text-slate-500 hover:border-slate-300",
                    )}
                  >
                    <Icon size={9} />
                    {cfg.label}
                    <span className="font-mono text-[9px] text-slate-400">·{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Jenis Diagnosa</p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setFilterJenis("Semua")}
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-medium transition",
                  filterJenis === "Semua"
                    ? "bg-rose-600 text-white"
                    : "border border-slate-200 text-slate-500 hover:border-slate-300",
                )}
              >
                Semua
              </button>
              {JENIS_LIST.map((j) => {
                const cfg = JENIS_CFG[j];
                const active = filterJenis === j;
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setFilterJenis(j)}
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-medium transition",
                      active
                        ? cn(cfg.bg, cfg.text, "ring-1 ring-current")
                        : "border border-slate-200 text-slate-500 hover:border-slate-300",
                    )}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      }
      footer={
        <>
          <strong className="text-slate-700">{aktifCount}</strong> aktif ·{" "}
          <strong className="text-slate-700">{KATEGORI_LIST.length}</strong> kategori SDKI
        </>
      }
    >
      <ul>
        {filtered.map((item, i) => (
          <SdkiRow
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

function SdkiRow({
  item, active, index, onSelect,
}: {
  item: SdkiItem;
  active: boolean;
  index: number;
  onSelect: () => void;
}) {
  const katCfg = KATEGORI_CFG[item.kategori];
  const jnsCfg = JENIS_CFG[item.jenis];
  const stsCfg = getSdkiStatusCfg(item.status);
  const KatIcon = katCfg.icon;
  const intervensiCount = countSdkiIntervensi(item);

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.13, delay: index * 0.012 }}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full border-b border-slate-50 px-3 py-2.5 text-left transition",
          active
            ? "bg-rose-50 border-l-2 border-l-rose-500"
            : "hover:bg-slate-50/80 border-l-2 border-l-transparent",
        )}
      >
        <div className="flex items-start gap-2.5">
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            katCfg.bg, katCfg.text,
          )}>
            <KatIcon size={13} />
          </div>

          <div className="min-w-0 flex-1">
            <p className={cn(
              "text-xs font-semibold leading-snug",
              active ? "text-rose-800" : "text-slate-700",
            )}>
              {item.nama}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-slate-400">{item.kode}</span>
              {item.subKategori && (
                <span className="text-[10px] text-slate-400">· {item.subKategori}</span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span className={cn("rounded px-1 py-0 text-[9px] font-semibold", jnsCfg.bg, jnsCfg.text)}>
                {jnsCfg.label}
              </span>
              <span className="rounded bg-emerald-50 px-1 font-mono text-[9px] text-emerald-700" title="SLKI: kriteria hasil">
                {item.kriteriaHasil.length} SLKI
              </span>
              <span className="rounded bg-violet-50 px-1 font-mono text-[9px] text-violet-700" title="SIKI: total intervensi">
                {intervensiCount} SIKI
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            {item.status === "Non_Aktif" && (
              <span className={cn("rounded-full px-1 text-[8px]", stsCfg.bg, stsCfg.text)}>off</span>
            )}
          </div>
        </div>
      </button>
    </motion.li>
  );
}
