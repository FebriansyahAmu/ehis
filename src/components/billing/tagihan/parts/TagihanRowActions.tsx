"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MoreVertical, Eye, Printer, Undo2, Ban, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TagihanRow } from "../tagihanBoardLogic";

interface Props {
  row: TagihanRow;
  onAction: (action: ActionKey, row: TagihanRow) => void;
}

export type ActionKey = "detail" | "print" | "refund" | "void" | "kunjungan";

interface MenuItem {
  key: ActionKey;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone?: "default" | "danger";
  disabledIf?: (row: TagihanRow) => boolean;
}

const MENU: MenuItem[] = [
  { key: "detail",    label: "Lihat Detail",         icon: Eye },
  { key: "kunjungan", label: "Buka Kunjungan",       icon: ExternalLink },
  { key: "print",     label: "Cetak Struk",          icon: Printer,
    disabledIf: (r) => r.status === "Draft" || r.status === "Void" },
  { key: "refund",    label: "Refund Pembayaran",    icon: Undo2,
    disabledIf: (r) => r.dibayar === 0 || r.status === "Void" },
  { key: "void",      label: "Void Tagihan",         icon: Ban, tone: "danger",
    disabledIf: (r) => r.status === "Lunas" || r.status === "Klaim Disetujui" },
];

export default function TagihanRowActions({ row, onAction }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-label="Aksi tagihan"
        aria-expanded={open}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
          "dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200",
          open && "bg-amber-50 text-amber-600 dark:bg-amber-950/40",
        )}
      >
        <MoreVertical size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            role="menu"
            className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900"
          >
            <ul className="py-1">
              {MENU.map((item, i) => {
                const Icon = item.icon;
                const disabled = item.disabledIf?.(row) ?? false;
                const isDivider = item.tone === "danger";
                return (
                  <li key={item.key}>
                    {isDivider && (
                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (disabled) return;
                        setOpen(false);
                        onAction(item.key, row);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] transition-colors",
                        disabled
                          ? "cursor-not-allowed text-slate-300 dark:text-slate-600"
                          : item.tone === "danger"
                          ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800",
                      )}
                    >
                      <Icon
                        size={13}
                        className={cn(
                          disabled
                            ? "text-slate-300 dark:text-slate-600"
                            : item.tone === "danger"
                            ? "text-rose-500"
                            : "text-slate-400",
                        )}
                      />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
