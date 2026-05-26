"use client";

/**
 * BerkasGroupList — daftar berkas dikelompokkan ke 4 group semantik (EK3.2).
 *
 * Group: Identitas · Klinis · Finansial · Khusus (lihat BERKAS_GROUPS).
 * Per group:
 *   - Header: dot tone + label + count progress + chevron collapse
 *   - Body: list BerkasRow (filter N.A optional kalau toggle off)
 *
 * Empty group di-skip (tidak render).
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, EyeOff, Eye } from "lucide-react";

import { cn } from "@/lib/utils";
import { KLAIM_TONE } from "../../../klaim/klaimBoardShared";
import { buildGroupSummaries, type BerkasGroupKey } from "./berkasShared";
import BerkasRow from "./BerkasRow";
import type { BerkasKlaim } from "@/lib/eklaim/eklaimShared";

interface Props {
  berkas: ReadonlyArray<BerkasKlaim>;
  /** Template lookup by berkas.id → catatanKhusus untuk hint row. */
  templateNotes?: Record<string, string | undefined>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onStatusCycle: (id: string) => void;
  onUpload: (id: string) => void;
  onAutoPull: (id: string) => void;
  onNoteChange: (id: string, note: string) => void;
}

export default function BerkasGroupList({
  berkas,
  templateNotes,
  selectedId,
  onSelect,
  onStatusCycle,
  onUpload,
  onAutoPull,
  onNoteChange,
}: Props) {
  const summaries = useMemo(() => buildGroupSummaries(berkas), [berkas]);
  const [showOptionalNA, setShowOptionalNA] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<BerkasGroupKey>>(
    () => {
      // Default collapse groups yang fully N.A
      const initial = new Set<BerkasGroupKey>();
      summaries.forEach((s) => {
        if (s.collapsibleDefault && s.items.length > 0) initial.add(s.key);
      });
      return initial;
    },
  );

  const toggleGroup = (key: BerkasGroupKey) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Filter toggle (show optional N.A) */}
      <div className="flex shrink-0 items-center justify-between">
        <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">
          Checklist Berkas
        </p>
        <button
          type="button"
          onClick={() => setShowOptionalNA((v) => !v)}
          aria-pressed={showOptionalNA}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium ring-1 transition-colors",
            showOptionalNA
              ? "bg-teal-50 text-teal-700 ring-teal-200 hover:bg-teal-100"
              : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50",
          )}
          title="Tampilkan/sembunyikan berkas opsional yang Tidak Berlaku"
        >
          {showOptionalNA ? <Eye size={11} /> : <EyeOff size={11} />}
          {showOptionalNA ? "Sembunyikan N.A" : "Tampilkan N.A"}
        </button>
      </div>

      {/* Group sections (scrollable) */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {summaries.map((s) => {
          if (s.items.length === 0) return null;

          const isCollapsed = collapsedGroups.has(s.key);
          const tone = KLAIM_TONE[s.cfg.tone];
          const visibleItems = s.items.filter((b) => {
            if (!showOptionalNA && !b.wajib && b.status === "Tidak Berlaku") {
              return false;
            }
            return true;
          });

          return (
            <section
              key={s.key}
              aria-label={s.cfg.label}
              className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/40"
            >
              {/* Section header */}
              <button
                type="button"
                onClick={() => toggleGroup(s.key)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-100/60"
              >
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    tone.dot,
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-slate-800">
                    {s.cfg.label}
                    <span className="text-[10.5px] font-normal text-slate-400">
                      · {s.cfg.description}
                    </span>
                  </p>
                </div>
                <ProgressBadge
                  ready={s.readyWajib}
                  total={s.totalWajib}
                  percent={s.percent}
                  tone={s.cfg.tone}
                />
                <ChevronDown
                  size={13}
                  strokeWidth={2.4}
                  className={cn(
                    "shrink-0 text-slate-400 transition-transform duration-200",
                    !isCollapsed && "rotate-180",
                  )}
                />
              </button>

              {/* Section body */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    {visibleItems.length === 0 ? (
                      <p className="px-3 pb-3 text-[12px] italic text-slate-400">
                        Semua berkas opsional di group ini Tidak Berlaku — toggle
                        di atas untuk tampilkan.
                      </p>
                    ) : (
                      <ul className="space-y-1.5 border-t border-slate-200 bg-white px-2 py-2">
                        {visibleItems.map((b) => (
                          <BerkasRow
                            key={b.id}
                            berkas={b}
                            selected={selectedId === b.id}
                            catatanTemplate={templateNotes?.[b.id]}
                            onSelect={onSelect}
                            onStatusCycle={onStatusCycle}
                            onUpload={onUpload}
                            onAutoPull={onAutoPull}
                            onNoteChange={onNoteChange}
                          />
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ── Progress Badge ─────────────────────────────────────

function ProgressBadge({
  ready,
  total,
  percent,
  tone,
}: {
  ready: number;
  total: number;
  percent: number;
  tone: "teal" | "amber" | "rose" | "emerald" | "sky" | "slate";
}) {
  const isComplete = total > 0 && ready >= total;
  const palette = isComplete ? KLAIM_TONE.emerald : KLAIM_TONE[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-bold tabular-nums ring-1",
        palette.chipBg,
        palette.chipText,
        palette.chipRing,
      )}
      title={`${ready} dari ${total} berkas wajib siap (${percent}%)`}
    >
      <span>
        {ready}/{total}
      </span>
      <span className="text-slate-400">·</span>
      <span>{percent}%</span>
    </span>
  );
}
