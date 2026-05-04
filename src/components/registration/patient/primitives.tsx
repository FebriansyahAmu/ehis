"use client";

import { X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

// ── InfoRow ────────────────────────────────────────────────

export function InfoRow({
  label,
  value,
  mono,
  span3,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  span3?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", span3 && "col-span-3")}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span
        className={cn(
          "text-xs font-medium leading-snug text-slate-700",
          mono && "font-mono",
        )}
      >
        {value || <span className="text-slate-300">—</span>}
      </span>
    </div>
  );
}

// ── ModalShell ─────────────────────────────────────────────

export function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  size = "md",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}) {
  const maxW = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-5xl",
    "2xl": "max-w-4xl",
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className={cn(
          "flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl",
          maxW,
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"
          >
            <X size={13} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── EditSmallBtn ───────────────────────────────────────────

export function EditSmallBtn({
  onClick,
  label = "Edit",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <Pencil size={11} /> {label}
    </button>
  );
}
