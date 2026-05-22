"use client";

/**
 * Orchestrator layout untuk halaman master.
 *
 * Bertanggung jawab atas:
 *   - Skeleton placeholder selama loading (`loaded=false`)
 *   - AnimatePresence transition skeleton → page
 *   - Header: eyebrow + title + description + stats slot
 *   - Body: 2-panel container (list panel kiri + detail panel kanan)
 *
 * Halaman cukup compose tanpa mengulang plumbing motion/skeleton:
 *   <MasterPageLayout
 *     loaded={loaded}
 *     accent="rose"
 *     eyebrow="EHIS Master · Katalog Klinis"
 *     title="Katalog Radiologi"
 *     description="..."
 *     stats={<><StatCard ... /><StatCard ... /></>}
 *     list={<RadiologiList ... />}
 *     detail={<RadiologiDetail ... />}
 *   />
 */

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getAccent, type MasterAccent } from "./masterAccent";

// ── Skeleton ────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton({ statCount = 4 }: { statCount?: number }) {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Bone className="h-3 w-44" />
          <Bone className="h-5 w-56" />
          <Bone className="h-3 w-80" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: statCount }).map((_, i) => (
            <Bone key={i} className="h-12 w-28" />
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-4">
        <Bone className="h-full w-[340px] shrink-0" />
        <Bone className="h-full flex-1" />
      </div>
    </div>
  );
}

// ── StatCard ────────────────────────────────────────────

export type StatTone =
  | "rose"
  | "sky"
  | "teal"
  | "violet"
  | "emerald"
  | "amber"
  | "slate"
  | "pink";

const STAT_TONE_CLS: Record<StatTone, string> = {
  rose:    "bg-rose-50 text-rose-600",
  sky:     "bg-sky-50 text-sky-600",
  teal:    "bg-teal-50 text-teal-600",
  violet:  "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber:   "bg-amber-50 text-amber-600",
  slate:   "bg-slate-50 text-slate-600",
  pink:    "bg-pink-50 text-pink-600",
};

export interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: StatTone;
}

export function StatCard({ icon: Icon, label, value, tone = "slate" }: StatCardProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
      <span className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md",
        STAT_TONE_CLS[tone],
      )}>
        <Icon size={12} />
      </span>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-black leading-none text-slate-900">{value}</p>
      </div>
    </div>
  );
}

// ── Layout ──────────────────────────────────────────────

export interface MasterPageLayoutProps {
  /** Apakah konten sudah siap (false = render skeleton). */
  loaded: boolean;
  /** Aksen warna untuk eyebrow & elemen UI dinamis. Default rose. */
  accent?: MasterAccent;
  /** Caption kecil di atas title (uppercase tracking-widest). */
  eyebrow?: string;
  /** Judul halaman. */
  title: string;
  /** Deskripsi singkat di bawah title. */
  description?: string;
  /** Slot stat cards di kanan header. Biasanya beberapa `<StatCard />`. */
  stats?: React.ReactNode;
  /** Panel kiri (list / sidebar). Lebar fix via internal-style 340px. */
  list: React.ReactNode;
  /** Panel kanan (detail / form / empty state). */
  detail: React.ReactNode;
  /** Jumlah skeleton stat box yang ditampilkan selama loading. Default 4. */
  skeletonStatCount?: number;
  /** Extra class untuk root container. */
  className?: string;
}

export default function MasterPageLayout({
  loaded,
  accent = "rose",
  eyebrow,
  title,
  description,
  stats,
  list,
  detail,
  skeletonStatCount = 4,
  className,
}: MasterPageLayoutProps) {
  const a = getAccent(accent);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div
            key="skel"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <PageSkeleton statCount={skeletonStatCount} />
          </motion.div>
        ) : (
          <motion.div
            key="page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex h-full flex-col gap-4 p-6"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex shrink-0 items-start justify-between gap-3"
            >
              <div className="min-w-0">
                {eyebrow && (
                  <p className={cn(
                    "text-[11px] font-semibold uppercase tracking-widest",
                    a.textAccent,
                  )}>
                    {eyebrow}
                  </p>
                )}
                <h1 className="mt-0.5 text-xl font-bold text-slate-900">{title}</h1>
                {description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    {description}
                  </p>
                )}
              </div>
              {stats && (
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  {stats}
                </div>
              )}
            </motion.div>

            {/* Body */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
              {list}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {detail}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
