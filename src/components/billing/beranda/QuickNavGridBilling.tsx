"use client";

/**
 * Grid quick-nav untuk Beranda Billing.
 *
 * 3 grup: Transaksi (amber) · Operasional (emerald) · Laporan (sky).
 * Card disabled (route belum dibangun) ditandai opacity-60 + cursor-not-allowed
 * + tetap render sebagai div (bukan Link) supaya tidak navigate.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TONE_PALETTE,
  type QuickNavGroup,
  type QuickNavItem,
  type QuickNavTone,
} from "./berandaBillingShared";

export default function QuickNavGridBilling({ groups }: { groups: QuickNavGroup[] }) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((g, gi) => (
        <NavGroupBlock key={g.label} group={g} delay={gi * 0.04} />
      ))}
    </div>
  );
}

function NavGroupBlock({ group, delay }: { group: QuickNavGroup; delay: number }) {
  const t = TONE_PALETTE[group.tone];

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      <header className="mb-2 flex items-center gap-2 px-1">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", t.dot)} />
        <h3 className="shrink-0 text-[12.5px] font-bold uppercase tracking-wide text-slate-800">
          {group.label}
        </h3>
        <span className="shrink-0 text-[10.5px] font-medium text-slate-400">
          · {group.items.length}
        </span>
        <p
          title={group.desc}
          className="ml-auto hidden min-w-0 truncate text-[10.5px] text-slate-500 sm:block"
        >
          {group.desc}
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {group.items.map((item) => (
          <li key={item.label}>
            <NavCard item={item} tone={group.tone} />
          </li>
        ))}
      </ul>
    </motion.section>
  );
}

function NavCard({ item, tone }: { item: QuickNavItem; tone: QuickNavTone }) {
  const t = TONE_PALETTE[tone];
  const Icon = item.icon;

  const inner = (
    <>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform",
          t.iconBg,
          t.iconText,
          t.ring,
          !item.disabled && "group-hover:scale-105",
        )}
      >
        <Icon size={15} />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[12.5px] font-semibold text-slate-800",
            !item.disabled && "group-hover:text-slate-900",
          )}
        >
          {item.label}
        </p>
        <p className="mt-0.5 truncate text-[10.5px] text-slate-500">{item.subLabel}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-bold tabular-nums",
            item.disabled ? "bg-slate-100 text-slate-500" : cn(t.badgeBg, t.badgeText),
          )}
        >
          {item.badge}
        </span>
        {item.disabled ? (
          <Lock size={11} className="text-slate-300" />
        ) : (
          <ChevronRight
            size={13}
            className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
          />
        )}
      </div>
    </>
  );

  if (item.disabled) {
    return (
      <div
        title="Modul belum dibangun"
        className={cn(
          "flex cursor-not-allowed items-center gap-2.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/40 p-2.5 opacity-70",
        )}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1",
        t.cardHover,
      )}
    >
      {inner}
    </Link>
  );
}
