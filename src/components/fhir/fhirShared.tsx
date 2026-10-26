"use client";

/**
 * EHIS SatuSehat (FHIR) — UI kit konsol operator interop (accent teal, TANPA ungu).
 * Dipakai halaman /ehis-fhir: Beranda · Onboarding · Antrean Kirim · Pasien & NIK (FH9).
 */

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";

export const FHIR_ACCENT = {
  text: "text-teal-700",
  textSoft: "text-teal-600",
  bg: "bg-teal-50",
  focus: "focus:border-teal-400 focus:ring-2 focus:ring-teal-100",
};

/** Pesan error ramah dari ApiError / Error. */
export function errMsg(e: unknown): string | undefined {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return undefined;
}

export const isAbort = (e: unknown) => e instanceof DOMException && e.name === "AbortError";

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── Shell ─────────────────────────────────────────────────

export function FhirShell({
  title, description, icon: Icon, actions, children,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", FHIR_ACCENT.bg, FHIR_ACCENT.text)}>
            <Icon size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className={cn("text-[11px] font-semibold uppercase tracking-widest", FHIR_ACCENT.textSoft)}>EHIS SatuSehat</p>
            <h1 className="mt-0.5 text-xl font-bold text-slate-900">{title}</h1>
            {description && <p className="mt-0.5 max-w-3xl text-xs leading-relaxed text-slate-500">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </motion.div>
  );
}

// ── Cards ─────────────────────────────────────────────────

export type Tone = "teal" | "emerald" | "amber" | "rose" | "sky" | "slate";
export const TONE_SOFT: Record<Tone, string> = {
  teal: "bg-teal-50 text-teal-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  sky: "bg-sky-50 text-sky-700",
  slate: "bg-slate-100 text-slate-600",
};

export function KpiCard({ icon: Icon, label, value, sub, tone = "teal" }: {
  icon: LucideIcon; label: string; value: React.ReactNode; sub?: string; tone?: Tone;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", TONE_SOFT[tone])}>
        <Icon size={18} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <div className="text-lg font-black leading-tight text-slate-900">{value}</div>
        {sub && <p className="truncate text-[11px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

export function SectionCard({ title, desc, action, children, className }: {
  title: string; desc?: string; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          {desc && <p className="mt-0.5 text-[11px] text-slate-400">{desc}</p>}
        </div>
        {action}
      </header>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function Pill({ label, tone = "slate", dot }: { label: string; tone?: Tone; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", TONE_SOFT[tone])}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {label}
    </span>
  );
}

// ── Buttons ───────────────────────────────────────────────

export function Button({
  children, onClick, loading, disabled, variant = "primary", icon: Icon, type = "button", title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  icon?: LucideIcon;
  type?: "button" | "submit";
  title?: string;
}) {
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition outline-none",
        "focus-visible:ring-2 focus-visible:ring-teal-300 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-teal-600 text-white shadow-sm hover:bg-teal-700",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
        variant === "ghost" && "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
      )}
    >
      {loading ? <Loader2 size={13} className="animate-spin" aria-hidden /> : Icon ? <Icon size={13} aria-hidden /> : null}
      {children}
    </button>
  );
}

// ── States ────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Icon size={18} aria-hidden />
      </span>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {desc && <p className="max-w-md text-xs text-slate-400">{desc}</p>}
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 p-4" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

/** Bungkus animasi muncul/hilang (panel hasil aksi). */
export function Reveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.18 }}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Tabel ─────────────────────────────────────────────────

export const tableWrap = "w-full overflow-x-auto";
export const tableCls = "w-full min-w-[640px] border-collapse text-[12px]";
export const thCls = "bg-slate-50 px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-slate-500";
export const tdCls = "px-3 py-2 align-top text-slate-700";
export const trCls = "border-b border-slate-100 last:border-0";
