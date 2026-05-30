"use client";

// ANT-ONSITE — Primitif UI kiosk APM (touch-first, target besar).
// Dipakai lintas step. Aksen indigo/cyan · base slate. Tanpa ungu.

import { motion } from "framer-motion";
import {
  Stethoscope,
  HeartPulse,
  Wind,
  Scissors,
  Brain,
  Baby,
  Ear,
  Eye,
  Bone,
  Smile,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PoliIconKey } from "@/lib/antrean/onsiteMock";

// ── Poli icon resolver ─────────────────────────────────────

const POLI_ICONS: Record<PoliIconKey, LucideIcon> = {
  stethoscope: Stethoscope,
  heart: HeartPulse,
  lungs: Wind,
  scalpel: Scissors,
  brain: Brain,
  baby: Baby,
  ear: Ear,
  eye: Eye,
  bone: Bone,
  tooth: Smile,
};

export function PoliIcon({
  icon,
  className,
}: {
  icon: PoliIconKey;
  className?: string;
}) {
  const Icon = POLI_ICONS[icon] ?? Stethoscope;
  return <Icon className={className} aria-hidden />;
}

// ── KioskButton ────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none",
  secondary:
    "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-300",
  ghost:
    "bg-transparent text-slate-500 hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-300",
  danger:
    "bg-white text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50 active:bg-rose-100",
};

export function KioskButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
  icon: Icon,
  className,
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  type?: "button" | "submit";
  icon?: LucideIcon;
  className?: string;
  full?: boolean;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={cn(
        "inline-flex items-center justify-center gap-3 rounded-2xl px-8 py-5 text-lg font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300/60",
        "disabled:cursor-not-allowed",
        full && "w-full",
        BTN_VARIANT[variant],
        className,
      )}
    >
      {Icon && <Icon className="h-6 w-6" aria-hidden />}
      {children}
    </motion.button>
  );
}

// ── ChoiceCard — kartu besar selectable ────────────────────

export function ChoiceCard({
  title,
  subtitle,
  icon: Icon,
  selected,
  disabled,
  badge,
  onClick,
  accent = "indigo",
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  selected?: boolean;
  disabled?: boolean;
  badge?: React.ReactNode;
  onClick?: () => void;
  accent?: "indigo" | "cyan";
  className?: string;
}) {
  const accentRing = accent === "cyan" ? "ring-cyan-500" : "ring-indigo-600";
  const accentBg = accent === "cyan" ? "bg-cyan-50 text-cyan-600" : "bg-indigo-50 text-indigo-600";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={cn(
        "group relative flex w-full flex-col items-start gap-4 rounded-3xl bg-white p-6 text-left transition-all",
        "ring-1 ring-slate-200 hover:ring-slate-300 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300/60",
        selected && `ring-2 ${accentRing} shadow-lg`,
        disabled && "cursor-not-allowed opacity-50 hover:ring-slate-200 hover:shadow-none",
        className,
      )}
    >
      {badge && <span className="absolute right-4 top-4">{badge}</span>}
      {Icon && (
        <span
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
            selected ? "bg-indigo-600 text-white" : accentBg,
          )}
        >
          <Icon className="h-7 w-7" aria-hidden />
        </span>
      )}
      <span className="flex flex-col gap-0.5">
        <span className="text-xl font-bold text-slate-800">{title}</span>
        {subtitle && <span className="text-sm text-slate-500">{subtitle}</span>}
      </span>
    </motion.button>
  );
}

// ── KioskField — label + input besar ───────────────────────

export function KioskField({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="text-sm font-semibold text-slate-600">
        {label}
        {hint && <span className="ml-2 font-normal text-slate-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const kioskInputClass = cn(
  "w-full rounded-2xl border-0 bg-white px-5 py-4 text-lg text-slate-800 ring-1 ring-slate-200",
  "placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500",
);

// ── KuotaBar — progress kuota ──────────────────────────────

export function KuotaBar({
  terisi,
  total,
}: {
  terisi: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((terisi / total) * 100)) : 100;
  const sisa = Math.max(0, total - terisi);
  const tone =
    sisa === 0
      ? "bg-rose-500"
      : sisa <= Math.max(2, total * 0.2)
        ? "bg-amber-500"
        : "bg-emerald-500";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-500">
        Sisa kuota <span className="font-bold text-slate-700">{sisa}</span> / {total}
      </span>
    </div>
  );
}
