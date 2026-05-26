"use client";

/**
 * Quick Nav Grid — 4 entry point modul E-Klaim.
 *
 * Compact 4-col grid (sm:2 / lg:4). Tiap card:
 *  - Icon ring + label + count badge
 *  - Hover: subtle scale + colored shadow + chevron translate
 *  - Disabled: lock icon + opacity-70 + cursor-not-allowed
 *
 * Different dari versi sebelumnya: no full description, 1-line subtle hint
 * untuk keep card height pendek (fit dalam 1 viewport).
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { EKLAIM_TONE, type QuickNavCard } from "./berandaEklaimShared";

// ── Card ───────────────────────────────────────────────

function NavCard({ card, index }: { card: QuickNavCard; index: number }) {
  const t = EKLAIM_TONE[card.tone];
  const Icon = card.icon;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition-transform",
            t.iconBg,
            t.iconText,
            t.ring,
            !card.disabled && "group-hover:scale-110 group-hover:rotate-3",
          )}
        >
          <Icon size={17} strokeWidth={2.2} />
        </span>

        {card.disabled ? (
          <span className="flex h-5 items-center gap-1 rounded-full bg-slate-100 px-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
            <Lock size={9} />
            Soon
          </span>
        ) : (
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums",
              t.badgeBg,
              t.badgeText,
            )}
          >
            {card.badge}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-1">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-slate-800 group-hover:text-slate-900">
            {card.label}
          </p>
          <p className="mt-0.5 truncate text-[10.5px] text-slate-500">{card.desc}</p>
        </div>
        {!card.disabled && (
          <ChevronRight
            size={14}
            className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600"
          />
        )}
      </div>

      {!card.disabled && (
        <span
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 rounded-b-xl transition-transform duration-300 group-hover:scale-x-100",
            t.bar,
          )}
        />
      )}
    </>
  );

  const baseClass =
    "group relative flex h-full flex-col overflow-hidden rounded-xl border bg-white p-3 transition";

  if (card.disabled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 + index * 0.04 }}
        title="Modul belum dibangun"
        className={cn(baseClass, "cursor-not-allowed border-dashed border-slate-200 bg-slate-50/40 opacity-70")}
      >
        {inner}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 + index * 0.04 }}
      className="h-full"
    >
      <Link
        href={card.href}
        className={cn(
          baseClass,
          "border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2",
          t.cardHover,
        )}
      >
        {inner}
      </Link>
    </motion.div>
  );
}

// ── Grid ───────────────────────────────────────────────

export default function QuickNavGridEklaim({ cards }: { cards: QuickNavCard[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <li key={card.label}>
          <NavCard card={card} index={idx} />
        </li>
      ))}
    </ul>
  );
}
