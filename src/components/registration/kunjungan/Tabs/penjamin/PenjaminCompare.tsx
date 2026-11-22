"use client";

// Ringkasan "Saat ini → Akan menjadi". Sisi kanan ter-highlight amber selama ada perubahan jenis yang
// belum disimpan; tanpa perubahan → kotak putus-putus berisi petunjuk. Ponsel: bertumpuk (panah ke
// bawah); ≥ sm: berdampingan.

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { optOf, type PenjaminType } from "./penjaminConfig";

export interface CompareSide {
  type: PenjaminType;
  label: string;
  details?: ReactNode;
}

function SideCard({ side, kind }: { side: CompareSide; kind: "current" | "next" }) {
  const opt = optOf(side.type);
  const Icon = opt.icon;
  const next = kind === "next";
  return (
    <div
      className={cn(
        "relative flex h-full min-w-0 items-start gap-3 rounded-xl p-3.5 ring-1 ring-inset",
        next ? "bg-amber-50/80 ring-amber-300" : "bg-slate-50 ring-slate-200",
      )}
    >
      <span aria-hidden="true" className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", opt.accent.tile)}>
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("m-tiny font-semibold uppercase tracking-wider", next ? "text-amber-800" : "text-slate-500")}>
          {next ? "Akan menjadi" : "Penjamin saat ini"}
        </p>
        <p className="mt-0.5 truncate text-[15px] font-semibold leading-snug text-slate-900">{side.label}</p>
        {side.details && <div className="mt-2 flex flex-wrap gap-1.5">{side.details}</div>}
      </div>
      {next && (
        <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 m-mini font-bold uppercase tracking-wide text-amber-900 shadow-sm ring-1 ring-amber-300">
          <span aria-hidden="true" className="relative flex size-1.5">
            <span className="absolute inline-flex size-full rounded-full bg-amber-500 motion-safe:animate-ping" />
            <span className="relative inline-flex size-1.5 rounded-full bg-amber-600" />
          </span>
          Belum disimpan
        </span>
      )}
    </div>
  );
}

export function PenjaminCompare({ current, next }: { current: CompareSide; next: CompareSide | null }) {
  const changed = !!next;
  return (
    <section aria-label="Ringkasan perubahan penjamin" className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="grid items-stretch gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3">
        <SideCard side={current} kind="current" />

        <div aria-hidden="true" className="flex items-center justify-center">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-full transition-colors duration-200",
              changed ? "bg-amber-600 text-white shadow-sm shadow-amber-200" : "bg-slate-100 text-slate-500",
            )}
          >
            <ArrowRight className="size-4 rotate-90 sm:rotate-0" />
          </span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {next ? (
            <motion.div
              key={`next-${next.type}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18 }}
              className="min-w-0"
            >
              <SideCard side={next} kind="next" />
            </motion.div>
          ) : (
            <motion.div
              key="same"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex min-h-22 items-center gap-3 rounded-xl border border-dashed border-slate-300 px-3.5 py-3"
            >
              <MousePointerClick className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
              <p className="m-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-700">Belum ada perubahan.</span> Pilih jenis penjamin lain di
                bawah, atau perbarui data penjamin yang sama.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
