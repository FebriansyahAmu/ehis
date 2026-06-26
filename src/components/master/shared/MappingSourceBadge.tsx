"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SUBPAGE_REGISTRY,
  type SubpageKey,
} from "../mapping/mappingShared";

type MappingBadgeVariant = "card" | "banner" | "inline";

interface MappingSourceBadgeProps {
  subpage: SubpageKey;
  variant?: MappingBadgeVariant;
  /** Override default judul (default = label sub-page) */
  title?: string;
  /** Override default deskripsi */
  description?: string;
  /** Override CTA label (default "Buka di Mapping Hub") */
  ctaLabel?: string;
  className?: string;
}

// ── Palette Map per subpage ────────────────────────────────
//
// Tailwind v4 men-tree-shake class string statis — jadi semua varian
// warna disebut eksplisit di sini supaya tidak hilang saat build.

type Palette = {
  stripe: string;
  iconBg: string;
  iconText: string;
  bannerBg: string;
  bannerBorder: string;
  titleText: string;
  ctaBg: string;
  ctaHover: string;
  ctaRing: string;
};

const PALETTE: Record<SubpageKey, Palette> = {
  sdm: {
    stripe: "bg-teal-500", iconBg: "bg-teal-50", iconText: "text-teal-600",
    bannerBg: "bg-teal-50/70", bannerBorder: "border-teal-200",
    titleText: "text-teal-800",
    ctaBg: "bg-teal-600", ctaHover: "hover:bg-teal-700", ctaRing: "focus-visible:ring-teal-300",
  },
  kewenangan: {
    stripe: "bg-sky-500", iconBg: "bg-sky-50", iconText: "text-sky-600",
    bannerBg: "bg-sky-50/70", bannerBorder: "border-sky-200",
    titleText: "text-sky-800",
    ctaBg: "bg-sky-600", ctaHover: "hover:bg-sky-700", ctaRing: "focus-visible:ring-sky-300",
  },
  layanan: {
    stripe: "bg-emerald-500", iconBg: "bg-emerald-50", iconText: "text-emerald-600",
    bannerBg: "bg-emerald-50/70", bannerBorder: "border-emerald-200",
    titleText: "text-emerald-800",
    ctaBg: "bg-emerald-600", ctaHover: "hover:bg-emerald-700", ctaRing: "focus-visible:ring-emerald-300",
  },
  tarif: {
    stripe: "bg-amber-500", iconBg: "bg-amber-50", iconText: "text-amber-600",
    bannerBg: "bg-amber-50/70", bannerBorder: "border-amber-200",
    titleText: "text-amber-800",
    ctaBg: "bg-amber-600", ctaHover: "hover:bg-amber-700", ctaRing: "focus-visible:ring-amber-300",
  },
  formularium: {
    stripe: "bg-violet-500", iconBg: "bg-violet-50", iconText: "text-violet-600",
    bannerBg: "bg-violet-50/70", bannerBorder: "border-violet-200",
    titleText: "text-violet-800",
    ctaBg: "bg-violet-600", ctaHover: "hover:bg-violet-700", ctaRing: "focus-visible:ring-violet-300",
  },
  "penjamin-ruangan": {
    stripe: "bg-emerald-500", iconBg: "bg-emerald-50", iconText: "text-emerald-600",
    bannerBg: "bg-emerald-50/70", bannerBorder: "border-emerald-200",
    titleText: "text-emerald-800",
    ctaBg: "bg-emerald-600", ctaHover: "hover:bg-emerald-700", ctaRing: "focus-visible:ring-emerald-300",
  },
  "dpjp-bpjs": {
    stripe: "bg-cyan-500", iconBg: "bg-cyan-50", iconText: "text-cyan-600",
    bannerBg: "bg-cyan-50/70", bannerBorder: "border-cyan-200",
    titleText: "text-cyan-800",
    ctaBg: "bg-cyan-600", ctaHover: "hover:bg-cyan-700", ctaRing: "focus-visible:ring-cyan-300",
  },
  rbac: {
    stripe: "bg-slate-500", iconBg: "bg-slate-100", iconText: "text-slate-600",
    bannerBg: "bg-slate-50/80", bannerBorder: "border-slate-200",
    titleText: "text-slate-800",
    ctaBg: "bg-slate-700", ctaHover: "hover:bg-slate-800", ctaRing: "focus-visible:ring-slate-300",
  },
};

const ctaBase =
  "group inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

// ── Component ──────────────────────────────────────────────

export default function MappingSourceBadge({
  subpage,
  variant = "card",
  title,
  description,
  ctaLabel = "Buka di Mapping Hub",
  className,
}: MappingSourceBadgeProps) {
  const config = SUBPAGE_REGISTRY.find((s) => s.key === subpage);
  if (!config) return null;

  const Icon = config.icon;
  const palette = PALETTE[subpage];
  const href = `/ehis-master/mapping?sub=${subpage}`;
  const headline = title ?? config.label;
  const body = description ?? config.desc;

  if (variant === "inline") {
    return (
      <Link
        href={href}
        className={cn(
          "group inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          palette.iconBg, palette.titleText, palette.ctaRing,
          "hover:brightness-95",
          className,
        )}
      >
        <Icon size={10} />
        <span>{headline}</span>
        <ArrowUpRight
          size={10}
          className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </Link>
    );
  }

  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={cn(
          "flex items-start gap-2.5 rounded-lg border p-2.5",
          palette.bannerBg, palette.bannerBorder, className,
        )}
      >
        <span className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
          palette.iconBg, palette.iconText,
        )}>
          <Icon size={12} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-[11px] font-semibold leading-tight", palette.titleText)}>
            {headline}
          </p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-slate-600">
            {body}
          </p>
        </div>
        <Link
          href={href}
          className={cn(ctaBase, palette.ctaBg, palette.ctaHover, palette.ctaRing, "shrink-0")}
        >
          {ctaLabel}
          <ArrowUpRight
            size={11}
            className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </Link>
      </motion.div>
    );
  }

  // ── card variant (default) ─────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm",
        className,
      )}
    >
      {/* Accent stripe — kiri */}
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", palette.stripe)} />
      <div className="flex items-start gap-3 pl-1.5">
        <span className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          palette.iconBg, palette.iconText,
        )}>
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Mapping Hub
            </p>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <p className={cn("text-[11px] font-semibold", palette.titleText)}>
              {headline}
            </p>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
            {body}
          </p>
          <Link
            href={href}
            className={cn(ctaBase, palette.ctaBg, palette.ctaHover, palette.ctaRing, "mt-2.5")}
          >
            {ctaLabel}
            <ArrowUpRight
              size={11}
              className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
