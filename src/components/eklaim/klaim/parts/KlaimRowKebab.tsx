"use client";

/**
 * KlaimRowKebab — dropdown 9-action per row.
 *
 * Disabled rules via `kebabActionsFor` di `klaimBoardLogic.ts`.
 * Tooltip alasan disabled muncul saat hover item disabled.
 *
 * UX:
 * - Klik trigger → toggle menu
 * - Klik luar → tutup (mousedown listener)
 * - ESC → tutup
 * - Klik item disabled → no-op (cursor not-allowed)
 * - Klik item enabled → call onAction + close
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MoreVertical, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { kebabActionsFor, type KebabAction, type KebabActionKey } from "../klaimBoardLogic";
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";

interface Props {
  claim: ClaimRecord;
  onAction: (key: KebabActionKey, claim: ClaimRecord) => void;
}

export default function KlaimRowKebab({ claim, onAction }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const actions = kebabActionsFor(claim);

  // Close on outside click + ESC
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleClick = (action: KebabAction) => {
    if (action.disabledReason) return;
    onAction(action.key, claim);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Aksi klaim"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors",
          "hover:bg-slate-100 hover:text-slate-700",
          open && "bg-slate-100 text-slate-700",
        )}
      >
        <MoreVertical size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            role="menu"
            aria-orientation="vertical"
            className="absolute right-0 top-8 z-30 w-56 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-slate-200"
          >
            <ul className="py-1">
              {actions.map((action, idx) => {
                const isDanger = action.tone === "danger";
                const isPrimary = action.tone === "primary";
                const disabled = !!action.disabledReason;
                return (
                  <li key={action.key}>
                    {idx === 6 && <hr className="my-1 border-slate-100" />}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClick(action);
                      }}
                      disabled={disabled}
                      title={action.disabledReason}
                      className={cn(
                        "group flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[12.5px] font-medium transition-colors",
                        disabled
                          ? "cursor-not-allowed text-slate-300"
                          : isDanger
                            ? "text-rose-700 hover:bg-rose-50"
                            : isPrimary
                              ? "text-teal-700 hover:bg-teal-50"
                              : "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <span className="truncate">{action.label}</span>
                      {!disabled && isPrimary && (
                        <ChevronRight
                          size={12}
                          className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-500"
                        />
                      )}
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
