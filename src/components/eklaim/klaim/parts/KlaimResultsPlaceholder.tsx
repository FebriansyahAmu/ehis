"use client";

/**
 * KlaimResultsPlaceholder — preview ringkasan hasil filter sebelum
 * EK2.2 (KlaimTable) di-build. Menampilkan:
 *  - Banner "EK2.2 segera" (info, bukan blocker)
 *  - Preview list 6 klaim pertama dengan info essential (status chip, pasien, penjamin, tarif RS)
 *  - Footer summary: count rows · total Tarif RS · total Selisih
 *
 * Saat KlaimTable selesai, file ini dihapus dan diganti.
 */

import { motion } from "framer-motion";
import { Construction, Inbox, ChevronRight, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  KLAIM_TONE,
  STATUS_CFG,
  fmtRupiahKpi,
  fmtRupiahFull,
  type KlaimFilterState,
} from "../klaimBoardShared";
import {
  applyAllFilters,
  KLAIM_BOARD_MOCK,
} from "../klaimBoardLogic";
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";
import { addRupiah } from "@/lib/eklaim/money";

interface Props {
  filters: KlaimFilterState;
  onResetFilters: () => void;
}

const MAX_PREVIEW = 6;

export default function KlaimResultsPlaceholder({ filters, onResetFilters }: Props) {
  const rows = applyAllFilters(KLAIM_BOARD_MOCK, filters);
  const preview = rows.slice(0, MAX_PREVIEW);
  const totalTarifRS = addRupiah(...rows.map((r) => r.tarifRS));
  const totalSelisih = addRupiah(...rows.map((r) => r.selisih ?? 0n));

  if (rows.length === 0) {
    return <EmptyState onResetFilters={onResetFilters} />;
  }

  return (
    <div className="flex h-full flex-col">
      {/* EK2.2 banner */}
      <div className="border-b border-amber-200/60 bg-amber-50/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Construction size={14} className="text-amber-600" />
          <p className="text-[12px] text-amber-800">
            <span className="font-semibold">Preview ringan</span> · tabel lengkap dengan
            sort 3-state, bulk-select, dan kolom CBG akan tersedia di EK2.2.
          </p>
        </div>
      </div>

      {/* Preview list */}
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="divide-y divide-slate-100">
          {preview.map((r, idx) => (
            <PreviewRow key={r.id} row={r} index={idx} />
          ))}
        </ul>

        {rows.length > MAX_PREVIEW && (
          <div className="border-t border-dashed border-slate-200 px-4 py-3 text-center">
            <p className="text-[12.5px] text-slate-500">
              + {rows.length - MAX_PREVIEW} klaim lain · akan terlihat penuh di tabel EK2.2
            </p>
          </div>
        )}
      </div>

      {/* Footer summary */}
      <footer className="shrink-0 border-t border-slate-200 bg-slate-50/60 px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
          <p className="text-slate-600">
            <span className="font-semibold text-slate-800">{rows.length}</span> klaim
            <span className="mx-1.5 text-slate-300">·</span>
            density{" "}
            <span className="font-medium capitalize text-slate-700">{filters.density}</span>
          </p>
          <div className="flex items-center gap-3 font-mono tabular-nums">
            <span className="text-slate-600">
              Tarif RS{" "}
              <span className="font-semibold text-slate-800" title={fmtRupiahFull(totalTarifRS)}>
                {fmtRupiahKpi(totalTarifRS)}
              </span>
            </span>
            <span
              className={cn(
                "font-semibold",
                totalSelisih > 0n
                  ? "text-emerald-700"
                  : totalSelisih < 0n
                    ? "text-rose-700"
                    : "text-slate-600",
              )}
              title={fmtRupiahFull(totalSelisih)}
            >
              Selisih {totalSelisih > 0n ? "+" : ""}
              {fmtRupiahKpi(totalSelisih)}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Preview Row ────────────────────────────────────────

function PreviewRow({ row, index }: { row: ClaimRecord; index: number }) {
  const statusCfg = STATUS_CFG[row.statusPenjamin];
  const StatusIcon = statusCfg.icon!;
  const statusTone = KLAIM_TONE[statusCfg.tone];
  const tarifGrouper = row.iDRG?.tarifAktual ?? row.inaCbgLegacy?.tarif.kelas2 ?? null;
  const selisihPositive = row.selisih !== undefined && row.selisih > 0n;
  const selisihNegative = row.selisih !== undefined && row.selisih < 0n;
  const grouperCode = row.iDRG?.code ?? row.inaCbgLegacy?.code ?? "—";

  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.04 + index * 0.03 }}
      className="group block px-4 py-3 transition hover:bg-teal-50/40"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: identity */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[13px] font-semibold text-slate-800 group-hover:text-slate-900">
              {row.pasienId}
            </p>
            <span className="font-mono text-[11.5px] text-slate-400">{row.noKlaim}</span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1",
                statusTone.chipBg,
                statusTone.chipText,
                statusTone.chipRing,
              )}
            >
              <StatusIcon size={10} />
              {statusCfg.label}
            </span>
            <span className="text-[11.5px] text-slate-500">{row.penjamin.nama}</span>
            <span className="text-[11px] text-slate-300">·</span>
            <span className="text-[11.5px] uppercase text-slate-500">{row.tipePelayanan}</span>
            <span className="text-[11px] text-slate-300">·</span>
            <span className="font-mono text-[11px] text-slate-500">{grouperCode}</span>
          </div>
        </div>

        {/* Right: tarif + chevron */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className="text-[10.5px] uppercase tracking-wider text-slate-400">Tarif RS</p>
            <p
              className="font-mono text-[13px] font-bold tabular-nums text-slate-800"
              title={fmtRupiahFull(row.tarifRS)}
            >
              {fmtRupiahKpi(row.tarifRS)}
            </p>
            {tarifGrouper !== null && row.selisih !== undefined && (
              <p
                className={cn(
                  "mt-0.5 font-mono text-[11px] tabular-nums",
                  selisihPositive
                    ? "text-emerald-600"
                    : selisihNegative
                      ? "text-rose-600"
                      : "text-slate-400",
                )}
              >
                {selisihPositive ? "+" : ""}
                {fmtRupiahKpi(row.selisih)}
              </p>
            )}
          </div>
          <ChevronRight
            size={14}
            className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-500"
          />
        </div>
      </div>
    </motion.li>
  );
}

// ── Empty State ────────────────────────────────────────

function EmptyState({ onResetFilters }: { onResetFilters: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center"
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-100">
        <Inbox size={22} className="text-teal-500" />
      </span>
      <div className="space-y-1">
        <p className="text-[14px] font-semibold text-slate-800">Tidak ada klaim yang cocok</p>
        <p className="text-[12.5px] text-slate-500">
          Coba lebarkan periode, kurangi filter penjamin, atau hapus chip status.
        </p>
      </div>
      <button
        type="button"
        onClick={onResetFilters}
        className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-teal-700 hover:shadow active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
      >
        Reset filter
        <ArrowRight size={12} />
      </button>
    </motion.div>
  );
}
