"use client";

/**
 * BPJS KPI Strip — 5 elevated SaaS-style metric cards.
 *
 * Each card:
 *  - Top horizontal accent bar (tone color)
 *  - Gradient tinted bg (tone-50 → white)
 *  - Solid colored icon block
 *  - Large bold value + label + muted hint
 *  - Hover: lift (-2px) + deeper shadow
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BPJS_TONE, type BPJSKPI } from "./berandaBPJSShared";

const CARD_GRADIENT: Record<string, string> = {
  emerald: "from-emerald-50/70 to-white",
  sky:     "from-sky-50/70 to-white",
  teal:    "from-teal-50/70 to-white",
  amber:   "from-amber-50/70 to-white",
  violet:  "from-violet-50/70 to-white",
  pink:    "from-pink-50/70 to-white",
  rose:    "from-rose-50/70 to-white",
  slate:   "from-slate-50/70 to-white",
};

const ICON_SOLID: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-600",
  sky:     "bg-sky-100 text-sky-600",
  teal:    "bg-teal-100 text-teal-600",
  amber:   "bg-amber-100 text-amber-600",
  violet:  "bg-violet-100 text-violet-600",
  pink:    "bg-pink-100 text-pink-600",
  rose:    "bg-rose-100 text-rose-600",
  slate:   "bg-slate-100 text-slate-500",
};

function KPICard({ kpi, index }: { kpi: BPJSKPI; index: number }) {
  const tone    = BPJS_TONE[kpi.tone];
  const Icon    = kpi.icon;
  const cardGrad = CARD_GRADIENT[kpi.tone] ?? CARD_GRADIENT.slate;
  const iconSolid = ICON_SOLID[kpi.tone] ?? ICON_SOLID.slate;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.15, ease: "easeOut" } }}
      transition={{ duration: 0.22, delay: 0.04 + index * 0.06, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-slate-200/80 bg-linear-to-br shadow-sm transition-shadow hover:shadow-md",
        cardGrad,
      )}
    >
      {/* Top accent line */}
      <div className={cn("absolute inset-x-0 top-0 h-0.5 transition-opacity group-hover:opacity-80", tone.bar)} />

      <div className="p-4">
        {/* Icon */}
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            iconSolid,
          )}
        >
          <Icon size={17} strokeWidth={2.2} />
        </div>

        {/* Value */}
        <p className="mt-3 text-2xl font-bold leading-none tabular-nums text-slate-900">
          {kpi.value}
        </p>

        {/* Label */}
        <p className="mt-0.5 text-sm font-semibold text-slate-600">{kpi.label}</p>

        {/* Hint */}
        <p className="mt-1.5 truncate text-xs text-slate-400">{kpi.hint}</p>
      </div>
    </motion.article>
  );
}

export default function BPJSKPIStrip({ kpis }: { kpis: BPJSKPI[] }) {
  return (
    <section
      aria-label="KPI BPJS"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {kpis.map((kpi, i) => (
        <KPICard key={kpi.key} kpi={kpi} index={i} />
      ))}
    </section>
  );
}
