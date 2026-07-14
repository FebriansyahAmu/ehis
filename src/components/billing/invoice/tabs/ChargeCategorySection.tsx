"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Plus, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { KATEGORI_CFG, fmtRupiah } from "../invoiceShared";
import type { KategoriCharge, ChargeItem } from "../invoiceShared";
import ChargeRow, { type ChargeAction } from "./ChargeRow";

interface Props {
  kategori: KategoriCharge;
  items: ChargeItem[];
  count: number;
  voidedCount: number;
  subtotal: number;
  defaultOpen?: boolean;
  onAddItem: (kategori: KategoriCharge) => void;
  onItemAction: (action: ChargeAction, item: ChargeItem) => void;
  readOnly?: boolean;
}

export default function ChargeCategorySection({
  kategori, items, count, voidedCount, subtotal, defaultOpen = false,
  onAddItem, onItemAction, readOnly,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [showVoided, setShowVoided] = useState(false);

  const cfg = KATEGORI_CFG[kategori];
  const Icon = cfg.icon;

  const visibleItems = showVoided ? items : items.filter((i) => !i.voided);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow dark:border-slate-800 dark:bg-slate-900/60",
        open && "shadow-sm ring-1 ring-slate-100 dark:ring-slate-800",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
      >
        <div className="flex items-center gap-2.5">
          <ChevronDown
            size={14}
            className={cn(
              "flex-none text-slate-400 transition-transform duration-200",
              !open && "-rotate-90",
            )}
          />
          <div className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md ring-1",
            cfg.bg, cfg.text, cfg.ring,
          )}>
            <Icon size={12} />
          </div>
          <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
            {cfg.label}
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {count} item{count !== 1 ? "s" : ""}
            {voidedCount > 0 && (
              <span className="ml-1 text-slate-400">· {voidedCount} void</span>
            )}
          </span>
        </div>
        <span className="font-mono text-[12.5px] font-semibold text-slate-700 tabular-nums dark:text-slate-200">
          {fmtRupiah(subtotal)}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden border-t border-slate-100 dark:border-slate-800/60"
          >
            <table className="w-full border-separate border-spacing-0">
              <thead className="bg-slate-50/60 dark:bg-slate-900/30">
                <tr>
                  <Th>Tgl</Th>
                  <Th>Item</Th>
                  <Th>Source</Th>
                  <Th align="right">Qty</Th>
                  <Th align="right">Harga</Th>
                  <Th align="right">Subtotal</Th>
                  <Th>Coverage</Th>
                  <Th align="center">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item, i) => (
                  <ChargeRow
                    key={item.id}
                    item={item}
                    index={i}
                    onAction={onItemAction}
                    readOnly={readOnly}
                  />
                ))}
              </tbody>
            </table>

            {/* Footer section: add + toggle voided */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/40 px-4 py-1.5 dark:border-slate-800/60 dark:bg-slate-900/30">
              {readOnly ? (
                <span className="text-[11px] text-slate-400">Proyeksi order — tak dapat diubah di sini</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onAddItem(kategori)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium text-amber-700 transition-colors hover:bg-amber-50 hover:text-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
                >
                  <Plus size={12} />
                  Tambah Item ke {cfg.label}
                </button>
              )}

              {voidedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowVoided((p) => !p)}
                  className="inline-flex items-center gap-1 text-[10.5px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {showVoided ? <EyeOff size={11} /> : <Eye size={11} />}
                  {showVoided ? "Sembunyikan" : "Tampilkan"} {voidedCount} void
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Th({
  children, align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cn(
        "border-b border-slate-200 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:border-slate-700 dark:text-slate-400",
        align === "right" && "text-right",
        align === "center" && "text-center",
      )}
    >
      {children}
    </th>
  );
}
