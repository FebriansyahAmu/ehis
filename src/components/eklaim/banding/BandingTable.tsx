"use client";

/**
 * BandingTable — worklist banding dengan quick-tab filter (EK6.1).
 *
 * Layout:
 *   ┌─ QuickTabs (Semua / Diajukan / Review / Disetujui / Ditolak) ─┐
 *   ├─ Table (scroll internal) ─────────────────────────────────────┤
 *   │  No. Banding + Tingkat │ Klaim + Diagnosa │ Penjamin │        │
 *   │  Status │ Submit │ Reviewer │ Hasil (truncated) │ Aksi       │
 *   └────────────────────────────────────────────────────────────────┘
 * Empty state per quick-tab + empty state global.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Scale, ExternalLink, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  BANDING_TONE,
  BANDING_STATUS_CFG,
  QUICK_TABS,
  fmtDateShort,
  type BandingViewItem,
  type QuickTab,
} from "./bandingShared";
import type { BandingStatus } from "@/lib/eklaim/eklaimShared";
import Link from "next/link";

// ── Status Chip ───────────────────────────────────────────

function StatusChip({ status }: { status: BandingStatus }) {
  const cfg = BANDING_STATUS_CFG[status];
  const tone = BANDING_TONE[cfg.tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ring-1",
        tone.chipBg,
        tone.chipText,
        tone.chipRing,
      )}
    >
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", tone.dot)} />
      {cfg.label}
    </span>
  );
}

// ── Tingkat Badge ─────────────────────────────────────────

function TingkatBadge({ tingkat }: { tingkat: 1 | 2 }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold ring-1",
        tingkat === 1
          ? "bg-sky-50 text-sky-700 ring-sky-200"
          : "bg-amber-50 text-amber-700 ring-amber-200",
      )}
    >
      T{tingkat}
    </span>
  );
}

// ── Empty State ───────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
        <Scale size={22} className="text-slate-400" />
      </span>
      <p className="text-sm font-semibold text-slate-600">{message}</p>
      <p className="mt-1 text-sm text-slate-400">Coba ubah filter atau tab status</p>
    </motion.div>
  );
}

// ── Row ───────────────────────────────────────────────────

function BandingRow({ item, idx }: { item: BandingViewItem; idx: number }) {
  const { banding, claim } = item;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: idx * 0.03, ease: "easeOut" }}
      className="group border-b border-slate-100 transition-colors hover:bg-teal-50/30"
    >
      {/* 1. No Banding + Tingkat */}
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          <TingkatBadge tingkat={banding.tingkat} />
          <div className="min-w-0">
            <p className="font-mono text-[12px] font-semibold text-slate-800">
              {banding.id}
            </p>
            <p className="text-[11.5px] text-slate-500">
              {fmtDateShort(banding.submittedAt)}
            </p>
          </div>
        </div>
      </td>

      {/* 2. Klaim info */}
      <td className="px-3 py-3">
        {claim ? (
          <div className="min-w-0">
            <Link
              href={`/ehis-eklaim/klaim/${claim.id}`}
              className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-teal-700 hover:underline"
            >
              {claim.noKlaim}
              <ExternalLink size={10} />
            </Link>
            <p className="mt-0.5 text-[11.5px] text-slate-600">
              {claim.pasienId}
              <span className="mx-1 text-slate-300">·</span>
              <span className="font-mono text-[11px] text-teal-700">
                {claim.diagnosaPrimer.kode}
              </span>
            </p>
            <p className="mt-0.5 max-w-[200px] truncate text-[11px] text-slate-500">
              {claim.diagnosaPrimer.deskripsi}
            </p>
          </div>
        ) : (
          <span className="text-sm text-slate-400 italic">—</span>
        )}
      </td>

      {/* 3. Penjamin */}
      <td className="px-3 py-3">
        <p className="text-sm text-slate-700">
          {claim?.penjamin.nama ?? "—"}
        </p>
        <p className="text-[11.5px] uppercase tracking-wide text-slate-400">
          {claim?.penjamin.tipe ?? "—"}
        </p>
      </td>

      {/* 4. Status */}
      <td className="px-3 py-3">
        <StatusChip status={banding.status} />
      </td>

      {/* 5. Submitted by */}
      <td className="px-3 py-3">
        <p className="text-sm text-slate-700">{banding.submittedBy}</p>
        {banding.reviewerBpjs && (
          <p className="mt-0.5 max-w-[160px] truncate text-[11.5px] text-slate-500">
            {banding.reviewerBpjs}
          </p>
        )}
      </td>

      {/* 6. Hasil (truncated) */}
      <td className="px-3 py-3">
        {banding.hasilBanding ? (
          <p className="max-w-[180px] truncate text-sm text-slate-700" title={banding.hasilBanding}>
            {banding.hasilBanding}
          </p>
        ) : banding.reviewedAt ? (
          <p className="text-sm text-slate-500 italic">Sedang diproses</p>
        ) : (
          <span className="text-sm text-slate-300">—</span>
        )}
      </td>

      {/* 7. Action */}
      <td className="px-3 py-3">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-teal-700 ring-1 ring-teal-200 transition-colors hover:bg-teal-50 hover:ring-teal-300"
        >
          Detail
          <ChevronRight size={12} />
        </button>
      </td>
    </motion.tr>
  );
}

// ── Main Component ────────────────────────────────────────

interface Props {
  items: BandingViewItem[];
  quickTab: QuickTab;
  onQuickTab: (tab: QuickTab) => void;
}

export default function BandingTable({ items, quickTab, onQuickTab }: Props) {
  // Tab counts
  const tabCounts: Record<QuickTab, number> = {
    all: items.length,
    Submitted: items.filter((i) => i.banding.status === "Submitted").length,
    Review:    items.filter((i) => i.banding.status === "Review").length,
    Approved:  items.filter((i) => i.banding.status === "Approved").length,
    Rejected:  items.filter((i) => i.banding.status === "Rejected").length,
  };

  // Apply quick-tab filter on top of already-filtered items
  const visibleItems =
    quickTab === "all" ? items : items.filter((i) => i.banding.status === quickTab);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      {/* Quick Tabs */}
      <div className="flex shrink-0 items-center gap-0 overflow-x-auto border-b border-slate-200 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {QUICK_TABS.map((tab) => {
          const isActive = quickTab === tab.value;
          const tone = tab.tone ? BANDING_TONE[tab.tone] : null;
          const count = tabCounts[tab.value];
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onQuickTab(tab.value)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "text-teal-700"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ring-1",
                    isActive && tone
                      ? cn(tone.chipBg, tone.chipText, tone.chipRing)
                      : "bg-slate-100 text-slate-500 ring-slate-200",
                    !tone && isActive && "bg-teal-50 text-teal-700 ring-teal-200",
                  )}
                >
                  {count}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="banding-tab-indicator"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-teal-500"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
        <AnimatePresence mode="wait">
          {visibleItems.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <EmptyState
                message={
                  quickTab !== "all"
                    ? `Tidak ada banding dengan status "${BANDING_STATUS_CFG[quickTab as BandingStatus]?.label ?? quickTab}"`
                    : "Tidak ada banding ditemukan"
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key={quickTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      No. Banding
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Klaim
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Penjamin
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Pengaju / Reviewer
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Hasil Banding
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item, idx) => (
                    <BandingRow key={item.banding.id} item={item} idx={idx} />
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer count */}
      <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-2">
        <p className="text-sm text-slate-500">
          Menampilkan{" "}
          <span className="font-semibold text-slate-700">{visibleItems.length}</span> dari{" "}
          <span className="font-semibold text-slate-700">{items.length}</span> banding
        </p>
        <p className="text-[11.5px] text-slate-400">
          Referensi: PMK 26/2021 · SOP Banding BPJS Kesehatan
        </p>
      </footer>
    </div>
  );
}
