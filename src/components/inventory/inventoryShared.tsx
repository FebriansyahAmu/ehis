"use client";

/**
 * EHIS Inventory — UI kit bersama (SaaS, accent cyan, TANPA ungu).
 * Dipakai oleh seluruh halaman modul Inventory agar konsisten & ringkas.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Search, Plus, ChevronDown, Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Accent (cyan signature) ───────────────────────────────

export const INV_ACCENT = {
  text: "text-cyan-700",
  textSoft: "text-cyan-600",
  bg: "bg-cyan-50",
  bgSolid: "bg-cyan-600",
  bgSolidHover: "hover:bg-cyan-700",
  ring: "ring-cyan-200",
  border: "border-cyan-200",
  focus: "focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100",
};

// ── Skeleton timing ───────────────────────────────────────

export function useSkeletonDelay(ms = 450): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return ready;
}

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

// ── Page shell (header + skeleton + entry anim) ───────────

export function InvShell({
  eyebrow = "EHIS Inventory",
  title,
  description,
  icon: Icon,
  actions,
  children,
  loaded = true,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  loaded?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex h-full flex-col gap-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <Bone className="h-3 w-32" />
                <Bone className="h-6 w-56" />
                <Bone className="h-3 w-80" />
              </div>
              <Bone className="h-9 w-32" />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Bone key={i} className="h-20" />)}
            </div>
            <Bone className="h-full flex-1" />
          </motion.div>
        ) : (
          <motion.div
            key="page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex h-full flex-col gap-4 p-4 sm:p-6"
          >
            <motion.header
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex shrink-0 flex-wrap items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                {Icon && (
                  <span className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", INV_ACCENT.bg, INV_ACCENT.text)}>
                    <Icon size={18} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className={cn("text-[11px] font-semibold uppercase tracking-widest", INV_ACCENT.textSoft)}>{eyebrow}</p>
                  <h1 className="mt-0.5 text-xl font-bold text-slate-900">{title}</h1>
                  {description && <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-500">{description}</p>}
                </div>
              </div>
              {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </motion.header>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────

type Tone = "cyan" | "emerald" | "amber" | "orange" | "rose" | "sky" | "slate";
const TONE_CLS: Record<Tone, string> = {
  cyan: "bg-cyan-50 text-cyan-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  orange: "bg-orange-50 text-orange-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
  slate: "bg-slate-100 text-slate-600",
};

export function KpiCard({
  icon: Icon, label, value, sub, tone = "cyan", onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone?: Tone;
  onClick?: () => void;
}) {
  const Comp = onClick ? motion.button : motion.div;
  return (
    <Comp
      {...(onClick ? { whileTap: { scale: 0.98 }, onClick, type: "button" as const } : {})}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm",
        onClick && "transition hover:border-slate-300 hover:shadow",
      )}
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", TONE_CLS[tone])}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-lg font-black leading-tight text-slate-900">{value}</p>
        {sub && <p className="truncate text-[11px] text-slate-400">{sub}</p>}
      </div>
    </Comp>
  );
}

// ── Section card ──────────────────────────────────────────

export function SectionCard({
  title, desc, action, children, className, bodyClassName,
}: {
  title?: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      {(title || action) && (
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            {title && <p className="text-sm font-bold text-slate-800">{title}</p>}
            {desc && <p className="mt-0.5 text-[11px] text-slate-400">{desc}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

// ── Status pill ───────────────────────────────────────────

export function StatusPill({
  label, bg, text, dot, size = "sm",
}: {
  label: string;
  bg: string;
  text: string;
  dot?: string;
  size?: "xs" | "sm";
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full font-semibold",
      size === "xs" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-[11px]",
      bg, text,
    )}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />}
      {label}
    </span>
  );
}

// ── Search input ──────────────────────────────────────────

export function SearchInput({
  value, onChange, placeholder = "Cari…", className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition",
          INV_ACCENT.focus,
        )}
      />
    </div>
  );
}

// ── Filter chip ───────────────────────────────────────────

export function FilterChip({
  label, active, onClick, count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-cyan-200",
        active
          ? cn("border-transparent", INV_ACCENT.bg, INV_ACCENT.text)
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn(
          "rounded-full px-1.5 text-[10px] font-bold",
          active ? "bg-white/70 text-cyan-700" : "bg-slate-100 text-slate-500",
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Primary button ────────────────────────────────────────

export function PrimaryButton({
  children, onClick, icon: Icon = Plus, type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: LucideIcon | null;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
        INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover,
      )}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

// ── Dropdown select ───────────────────────────────────────

export interface InvSelectOption {
  value: string;
  label: string;
  sub?: string;
}

export function InvSelect({
  value, onChange, options, icon: Icon, placeholder, className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: InvSelectOption[];
  icon?: LucideIcon;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const sel = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border bg-white px-3 py-2 text-[13px] text-slate-700 outline-none transition",
          open ? cn(INV_ACCENT.border, "ring-2 ring-cyan-100") : "border-slate-200 hover:border-slate-300",
        )}
      >
        {Icon && <Icon size={15} className="shrink-0 text-cyan-600" />}
        <span className="flex-1 truncate text-left font-semibold">{sel ? sel.label : (placeholder ?? "Pilih…")}</span>
        <ChevronDown size={15} className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <button type="button" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default" />
          <div role="listbox" className="absolute left-0 top-full z-50 mt-1.5 max-h-72 w-full min-w-[240px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10">
            {options.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition",
                    active ? cn(INV_ACCENT.bg, INV_ACCENT.text) : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{o.label}</span>
                    {o.sub && <span className="block truncate text-[11px] text-slate-400">{o.sub}</span>}
                  </span>
                  {active && <Check size={15} className="shrink-0 text-cyan-600" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────

export function EmptyState({
  icon: Icon, title, description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
        <Icon size={26} />
      </span>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {description && <p className="max-w-sm text-xs text-slate-400">{description}</p>}
    </div>
  );
}

// ── SlideOver (right drawer) ──────────────────────────────

export function SlideOver({
  open, onClose, title, subtitle, children, footer, width = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- guard mount portal aman-SSR (document hanya ada di klien)
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]"
          />
          <motion.div
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn("relative flex h-full w-full flex-col bg-slate-50 shadow-2xl", width)}
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-slate-900">{title}</h2>
                {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
            {footer && <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-3">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── Table style helpers ───────────────────────────────────

export const tableWrap = "w-full overflow-x-auto";
export const tableCls = "w-full min-w-[640px] border-collapse text-[13px]";
export const thCls = "sticky top-0 z-10 bg-slate-50/95 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 backdrop-blur";
export const tdCls = "px-3 py-2.5 text-slate-700";
export const trCls = "border-b border-slate-100 transition hover:bg-slate-50/70";
