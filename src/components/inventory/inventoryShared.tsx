"use client";

/**
 * EHIS Inventory — UI kit bersama (SaaS, accent cyan, TANPA ungu).
 * Dipakai oleh seluruh halaman modul Inventory agar konsisten & ringkas.
 */

import { useEffect, useRef, useState } from "react";
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
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const sel = options.find((o) => o.value === value);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- guard mount portal aman-SSR
  useEffect(() => setMounted(true), []);

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setRect(r);
  };

  // Re-posisi menu saat scroll (termasuk scroll dalam modal/drawer, capture) & resize.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onMove = () => place();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  function toggle() {
    if (!open) place();
    setOpen((o) => !o);
  }

  // Posisi fixed (di-portal ke body → anti-clip overflow modal/drawer). Flip ke atas bila sempit.
  let menuStyle: React.CSSProperties = {};
  if (rect) {
    const vw = typeof window !== "undefined" ? window.innerWidth : 9999;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const width = Math.max(rect.width, 240);
    const left = Math.max(8, Math.min(rect.left, vw - width - 8));
    const below = vh - rect.bottom;
    const above = rect.top;
    const up = below < 220 && above > below;
    const maxHeight = Math.max(120, Math.min(288, (up ? above : below) - 12));
    menuStyle = up
      ? { position: "fixed", left, width, bottom: vh - rect.top + 6, maxHeight }
      : { position: "fixed", left, width, top: rect.bottom + 6, maxHeight };
  }

  return (
    <div className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
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
      {mounted && open && rect && createPortal(
        <>
          <button type="button" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} className="fixed inset-0 z-99 cursor-default" />
          <div role="listbox" style={menuStyle} className="z-100 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10">
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
        </>,
        document.body,
      )}
    </div>
  );
}

// ── InvCombobox (searchable select) ───────────────────────
// Input bisa diketik → filter opsi (label + sub) · dropdown di-portal (anti-clip, flip, fixed) ·
// keyboard ↑/↓/Enter/Esc · tombol clear. Untuk daftar panjang (mis. picker barang per lokasi).

export function InvCombobox({
  value, onChange, options, icon: Icon = Search, placeholder, className, emptyText = "Tidak ditemukan",
}: {
  value: string;
  onChange: (v: string) => void;
  options: InvSelectOption[];
  icon?: LucideIcon;
  placeholder?: string;
  className?: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hi, setHi] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- guard mount portal aman-SSR
  useEffect(() => setMounted(true), []);

  const sel = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((o) => o.label.toLowerCase().includes(q) || (o.sub?.toLowerCase().includes(q) ?? false))
    : options;

  const place = () => { const r = wrapRef.current?.getBoundingClientRect(); if (r) setRect(r); };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onMove = () => place();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  function openMenu() { place(); setQuery(""); setHi(0); setOpen(true); }
  function pick(v: string) { onChange(v); setOpen(false); setQuery(""); }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); if (!open) { openMenu(); return; } setHi((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && open && filtered[hi]) { e.preventDefault(); pick(filtered[hi].value); }
  }

  let menuStyle: React.CSSProperties = {};
  if (rect) {
    const vw = typeof window !== "undefined" ? window.innerWidth : 9999;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const width = Math.max(rect.width, 240);
    const left = Math.max(8, Math.min(rect.left, vw - width - 8));
    const below = vh - rect.bottom;
    const above = rect.top;
    const up = below < 240 && above > below;
    const maxHeight = Math.max(140, Math.min(300, (up ? above : below) - 12));
    menuStyle = up
      ? { position: "fixed", left, width, bottom: vh - rect.top + 6, maxHeight }
      : { position: "fixed", left, width, top: rect.bottom + 6, maxHeight };
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className={cn(
        "flex w-full items-center gap-2 rounded-xl border bg-white px-3 py-2 transition",
        open ? cn(INV_ACCENT.border, "ring-2 ring-cyan-100") : "border-slate-200 hover:border-slate-300",
      )}>
        <Icon size={15} className="shrink-0 text-cyan-600" />
        <input
          value={open ? query : (sel?.label ?? "")}
          onChange={(e) => { if (!open) openMenu(); setQuery(e.target.value); setHi(0); }}
          onFocus={openMenu}
          onKeyDown={onKeyDown}
          placeholder={sel ? sel.label : (placeholder ?? "Ketik untuk cari…")}
          className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-slate-700 outline-none placeholder:font-normal placeholder:text-slate-400"
        />
        {sel && !open ? (
          <button type="button" aria-label="Hapus pilihan" onClick={() => onChange("")} className="shrink-0 rounded p-0.5 text-slate-300 transition hover:text-rose-500">
            <X size={14} />
          </button>
        ) : (
          <ChevronDown size={15} className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
        )}
      </div>
      {mounted && open && rect && createPortal(
        <div ref={menuRef} role="listbox" style={menuStyle} className="z-100 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10">
          {filtered.length === 0 ? (
            <p className="px-2.5 py-3 text-center text-[12px] text-slate-400">{emptyText}</p>
          ) : filtered.map((o, i) => {
            const active = o.value === value;
            const hl = i === hi;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onMouseEnter={() => setHi(i)}
                onClick={() => pick(o.value)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition",
                  active ? cn(INV_ACCENT.bg, INV_ACCENT.text) : hl ? "bg-slate-100 text-slate-700" : "text-slate-600 hover:bg-slate-50",
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
        </div>,
        document.body,
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

// ── Modal (centered) ──────────────────────────────────────
// `dismissible=false` → backdrop & Escape TIDAK menutup + tanpa tombol X (penutupan dikontrol penuh
// lewat footer caller, mis. tombol Batal ber-konfirmasi). Default dismissible.

export function Modal({
  open, onClose, title, subtitle, children, footer, width = "max-w-2xl", dismissible = true, icon: Icon,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  dismissible?: boolean;
  icon?: LucideIcon;
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- guard mount portal aman-SSR
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open || !dismissible) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissible, onClose]);

  if (!mounted) return null;

  const card = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.94, y: 16 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: 8 },
      };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => dismissible && onClose()}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            {...card}
            className={cn("relative z-10 flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl ring-1 ring-slate-200", width)}
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                {Icon && (
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1", INV_ACCENT.bg, INV_ACCENT.text, INV_ACCENT.border)}>
                    <Icon size={18} />
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-slate-900">{title}</h2>
                  {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
                </div>
              </div>
              {dismissible && (
                <button
                  type="button" onClick={onClose} aria-label="Tutup"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              )}
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
