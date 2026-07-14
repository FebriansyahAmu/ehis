"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, ExternalLink, Tag, Ban, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { COVERAGE_CFG, SOURCE_BADGE_TONE, fmtRupiah } from "../invoiceShared";
import type { ChargeItem } from "../invoiceShared";
import { rowGross, rowSubtotal } from "@/lib/billing/invoiceCalc";

export type ChargeAction = "diskon" | "void" | "unvoid" | "source";

interface Props {
  item: ChargeItem;
  index: number;
  onAction: (action: ChargeAction, item: ChargeItem) => void;
  /** Mode proyeksi (billing) — sembunyikan aksi mutasi (diskon/void/source). */
  readOnly?: boolean;
}

export default function ChargeRow({ item, index, onAction, readOnly }: Props) {
  const cov  = COVERAGE_CFG[item.coverage];
  const src  = SOURCE_BADGE_TONE[item.sourceModul];
  const gross = rowGross(item);
  const net   = rowSubtotal(item);
  const hasDiskon = (item.diskonItem ?? 0) > 0;
  const voided = !!item.voided;

  return (
    <tr
      className={cn(
        "border-b border-slate-100 transition-colors last:border-b-0 dark:border-slate-800/60",
        voided ? "bg-slate-50/40 dark:bg-slate-900/40" : "hover:bg-amber-50/30 dark:hover:bg-amber-950/15",
      )}
    >
      {/* Tanggal */}
      <td className="whitespace-nowrap px-3 py-2 text-[11.5px] tabular-nums text-slate-500 dark:text-slate-400">
        {formatTglShort(item.tanggalISO)}
      </td>

      {/* Nama + sub-info */}
      <td className="px-3 py-2">
        <div className="flex items-start gap-1.5">
          <span className={cn(
            "min-w-0 truncate text-[12.5px] font-medium",
            voided
              ? "text-slate-400 line-through dark:text-slate-500"
              : "text-slate-800 dark:text-slate-100",
          )}>
            {item.nama}
          </span>
          {!readOnly && (
            <button
              type="button"
              onClick={() => onAction("source", item)}
              title={`Buka source: ${item.sourceRef}`}
              className="flex-none text-slate-300 transition-colors hover:text-amber-600 dark:text-slate-600 dark:hover:text-amber-400"
            >
              <ExternalLink size={11} />
            </button>
          )}
        </div>
        {voided && item.voidReason && (
          <span className="mt-0.5 inline-block text-[10.5px] italic text-rose-500">
            Voided: {item.voidReason}
          </span>
        )}
        {!voided && hasDiskon && (
          <span className="mt-0.5 inline-block text-[10.5px] text-emerald-600 dark:text-emerald-400">
            Diskon -{fmtRupiah(item.diskonItem ?? 0)}{item.alasanDiskon ? ` · ${item.alasanDiskon}` : ""}
          </span>
        )}
      </td>

      {/* Source modul badge */}
      <td className="px-3 py-2">
        <span className={cn(
          "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          src.bg, src.text,
        )}>
          {item.sourceModul}
        </span>
      </td>

      {/* Qty × satuan */}
      <td className="px-3 py-2 text-right text-[11.5px] tabular-nums text-slate-700 dark:text-slate-300">
        {item.qty} <span className="text-slate-400">{item.satuan}</span>
      </td>

      {/* Harga satuan */}
      <td className="px-3 py-2 text-right font-mono text-[11.5px] tabular-nums text-slate-600 dark:text-slate-400">
        {fmtRupiah(item.hargaSatuan)}
      </td>

      {/* Subtotal */}
      <td className="px-3 py-2 text-right">
        {voided ? (
          <span className="font-mono text-[12px] text-slate-400 line-through dark:text-slate-600">
            {fmtRupiah(gross)}
          </span>
        ) : hasDiskon ? (
          <div className="flex flex-col items-end leading-tight">
            <span className="font-mono text-[10.5px] text-slate-400 line-through">{fmtRupiah(gross)}</span>
            <span className="font-mono text-[12.5px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
              {fmtRupiah(net)}
            </span>
          </div>
        ) : (
          <span className="font-mono text-[12.5px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
            {fmtRupiah(net)}
          </span>
        )}
      </td>

      {/* Coverage chip */}
      <td className="px-3 py-2">
        <span className={cn(
          "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ring-1",
          cov.bg, cov.text, cov.ring,
        )}>
          {cov.label}
        </span>
      </td>

      {/* Kebab actions */}
      <td className="px-2 py-2 text-center">
        {readOnly ? (
          <span className="text-slate-300 dark:text-slate-600">—</span>
        ) : (
          <RowKebab item={item} onAction={onAction} voided={voided} index={index} />
        )}
      </td>
    </tr>
  );
}

// ── Kebab dropdown ──────────────────────────────────────

function RowKebab({
  item, onAction, voided,
}: {
  item: ChargeItem;
  onAction: (action: ChargeAction, item: ChargeItem) => void;
  voided: boolean;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", click);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const handle = (action: ChargeAction) => {
    setOpen(false);
    onAction(action, item);
  };

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label="Aksi item"
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200",
          open && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
        )}
      >
        <MoreVertical size={14} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {voided ? (
            <MenuItem icon={Undo2} label="Pulihkan" onClick={() => handle("unvoid")} />
          ) : (
            <>
              <MenuItem icon={Tag} label="Apply Diskon" onClick={() => handle("diskon")} />
              <MenuItem icon={ExternalLink} label="Detail Source" onClick={() => handle("source")} />
              <div className="my-0.5 border-t border-slate-100 dark:border-slate-800" />
              <MenuItem icon={Ban} label="Void Item" danger onClick={() => handle("void")} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon, label, onClick, danger,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-colors",
        danger
          ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800",
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function formatTglShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}
