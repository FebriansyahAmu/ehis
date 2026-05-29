"use client";

/**
 * Quick Nav Grid BPJS — 8 module entry points (V-Claim 5 + Aplicares 3).
 *
 * SaaS card style:
 *  - Gradient colored icon block (scale on hover)
 *  - Badge top-right
 *  - "Buka →" CTA reveals on hover
 *  - Ring glow on hover via ring-2
 *  - Hover: -translate-y-0.5 + deeper shadow
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Lock, ShieldCheck, BedDouble } from "lucide-react";

import { cn } from "@/lib/utils";
import { BPJS_TONE, type BPJSQuickNavCard } from "./berandaBPJSShared";

const ICON_SOFT: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-600",
  sky:     "bg-sky-100 text-sky-600",
  teal:    "bg-teal-100 text-teal-600",
  amber:   "bg-amber-100 text-amber-600",
  violet:  "bg-violet-100 text-violet-600",
  pink:    "bg-pink-100 text-pink-600",
  rose:    "bg-rose-100 text-rose-600",
  slate:   "bg-slate-100 text-slate-500",
};

const HOVER_RING: Record<string, string> = {
  emerald: "ring-emerald-200",
  sky:     "ring-sky-200",
  teal:    "ring-teal-200",
  amber:   "ring-amber-200",
  violet:  "ring-violet-200",
  pink:    "ring-pink-200",
  rose:    "ring-rose-200",
  slate:   "ring-slate-200",
};

function NavCard({ card, index }: { card: BPJSQuickNavCard; index: number }) {
  const tone      = BPJS_TONE[card.tone];
  const Icon      = card.icon;
  const iconSoft  = ICON_SOFT[card.tone] ?? ICON_SOFT.slate;
  const hoverRing = HOVER_RING[card.tone] ?? HOVER_RING.slate;

  const inner = (
    <>
      {/* Icon + badge row */}
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200",
            iconSoft,
            !card.disabled && "group-hover:scale-110",
          )}
        >
          <Icon size={16} strokeWidth={2.2} />
        </div>

        {card.disabled ? (
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400">
            <Lock size={9} />
            Soon
          </span>
        ) : (
          <span
            className={cn(
              "rounded-lg px-2 py-0.5 font-mono text-xs font-bold tabular-nums",
              tone.badgeBg,
              tone.badgeText,
            )}
          >
            {card.badge}
          </span>
        )}
      </div>

      {/* Label + desc */}
      <div className="mt-3 min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-semibold text-slate-700 transition-colors",
            !card.disabled && "group-hover:text-slate-900",
          )}
        >
          {card.label}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{card.desc}</p>
      </div>

      {/* CTA row — appears on hover */}
      {!card.disabled && (
        <div className="mt-2.5 flex items-center justify-end">
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold opacity-0 transition-all duration-200 group-hover:gap-1 group-hover:opacity-100",
              tone.iconText,
            )}
          >
            Buka
            <ChevronRight
              size={11}
              strokeWidth={2.5}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      )}

      {/* Hover ring glow */}
      {!card.disabled && (
        <span
          className={cn(
            "pointer-events-none absolute inset-0 rounded-xl opacity-0 ring-2 transition-opacity duration-200 group-hover:opacity-100",
            hoverRing,
          )}
        />
      )}
    </>
  );

  const base =
    "group relative flex flex-col overflow-hidden rounded-xl border bg-white p-3 transition-all duration-200";

  if (card.disabled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 + index * 0.04 }}
        title="Modul belum dibangun"
        className={cn(
          base,
          "cursor-not-allowed border-dashed border-slate-200 bg-slate-50/50 opacity-50",
        )}
      >
        {inner}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 + index * 0.04 }}
    >
      <Link
        href={card.href}
        className={cn(
          base,
          "border-slate-200/80 shadow-sm hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2",
        )}
      >
        {inner}
      </Link>
    </motion.div>
  );
}

function GroupHeader({
  icon: Icon,
  label,
  count,
  iconBg,
}: {
  icon: typeof ShieldCheck;
  label: string;
  count: number;
  iconBg: string;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-md",
          iconBg,
        )}
      >
        <Icon size={11} className="text-white" strokeWidth={2.5} />
      </div>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-slate-500">
        {count} modul
      </span>
      <span className="flex-1 border-t border-slate-200/70" />
    </div>
  );
}

export default function QuickNavGridBPJS({ cards }: { cards: BPJSQuickNavCard[] }) {
  const vclaim    = cards.filter((c) => c.group === "vclaim");
  const aplicares = cards.filter((c) => c.group === "aplicares");

  return (
    <section aria-label="Quick Nav BPJS" className="flex flex-col gap-4">
      {/* V-Claim group */}
      <div>
        <GroupHeader
          icon={ShieldCheck}
          label="V-Claim"
          count={vclaim.length}
          iconBg="bg-emerald-500"
        />
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {vclaim.map((card, idx) => (
            <li key={card.label}>
              <NavCard card={card} index={idx} />
            </li>
          ))}
        </ul>
      </div>

      {/* Aplicares group */}
      <div>
        <GroupHeader
          icon={BedDouble}
          label="Aplicares"
          count={aplicares.length}
          iconBg="bg-pink-500"
        />
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {aplicares.map((card, idx) => (
            <li key={card.label}>
              <NavCard card={card} index={idx} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
