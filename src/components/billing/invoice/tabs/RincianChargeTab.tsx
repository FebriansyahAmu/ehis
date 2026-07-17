"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { KATEGORI_ORDER } from "../invoiceShared";
import type { InvoiceDetail, ChargeItem, KategoriCharge } from "../invoiceShared";
import { groupByKategori, coverageBreakdown } from "@/lib/billing/invoiceCalc";
import ChargeCategorySection from "./ChargeCategorySection";
import ChargeStickyFooter from "./ChargeStickyFooter";
import { fmtRupiah } from "../invoiceShared";
import { cn } from "@/lib/utils";
import type { ChargeAction } from "./ChargeRow";

interface Props {
  detail: InvoiceDetail;
  onAddItem: (kategori: KategoriCharge) => void;
  onItemAction: (action: ChargeAction, item: ChargeItem) => void;
  onApplyDiskonInvoice: () => void;
  onFinalize?: () => void;
  /** Mode proyeksi (billing/kunjungan) — charge read-only, sembunyikan semua aksi mutasi. */
  readOnly?: boolean;
  /** Read-only tapi izinkan penyesuaian level-invoice (tombol "Penyesuaian" di footer). */
  onAdjust?: () => void;
}

export default function RincianChargeTab({
  detail, onAddItem, onItemAction, onApplyDiskonInvoice, onFinalize, readOnly, onAdjust,
}: Props) {
  const sections = useMemo(() => groupByKategori(detail.items), [detail.items]);
  const coverage = useMemo(() => coverageBreakdown(detail.items), [detail.items]);

  // Default-open: 3 kategori paling sering dilihat
  const defaultOpenSet = new Set<KategoriCharge>(["Akomodasi", "Tindakan", "Lab"]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-5 py-4">
          {/* Coverage breakdown info banner */}
          <CoverageBanner
            penjamin={coverage.penjamin}
            pasien={coverage.pasien}
            mixed={coverage.mixed}
            penjaminName={detail.penjamin.nama}
          />

          {/* Sections */}
          <div className="mt-4 space-y-2.5 pb-6">
            {sections.length === 0 ? (
              readOnly ? <ProjectionEmpty /> : <EmptyState onAdd={() => onAddItem("Lain-lain")} />
            ) : (
              sections.map((s) => (
                <ChargeCategorySection
                  key={s.kategori}
                  kategori={s.kategori}
                  items={s.items}
                  count={s.count}
                  voidedCount={s.voidedCount}
                  subtotal={s.subtotal}
                  defaultOpen={defaultOpenSet.has(s.kategori)}
                  onAddItem={onAddItem}
                  onItemAction={onItemAction}
                  readOnly={readOnly}
                />
              ))
            )}

            {/* Persuasive add — selalu di bawah list (disembunyikan di mode proyeksi) */}
            {sections.length > 0 && !readOnly && (
              <button
                type="button"
                onClick={() => onAddItem("Lain-lain")}
                className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 text-[12.5px] font-medium text-slate-500 transition-all hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-700 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-amber-950/20"
              >
                <Sparkles size={13} className="transition-transform group-hover:rotate-12" />
                Tambah item baru (kategori bebas)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky footer totals */}
      <ChargeStickyFooter
        detail={detail}
        onApplyDiskonInvoice={onApplyDiskonInvoice}
        onFinalize={onFinalize}
        readOnly={readOnly}
        onAdjust={onAdjust}
      />
    </div>
  );
}

// ── Empty state (mode proyeksi/read-only) ───────────────

function ProjectionEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-800">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-4 ring-slate-100/60 dark:bg-slate-900 dark:ring-slate-800/60">
        <Sparkles size={20} />
      </div>
      <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">
        Belum ada tagihan
      </h3>
      <p className="mt-1 max-w-xs text-[12px] text-slate-500 dark:text-slate-400">
        Charge otomatis muncul dari order klinis (tindakan, resep, lab, radiologi, BMHP) & akomodasi kunjungan ini.
      </p>
    </div>
  );
}

// ── Coverage breakdown banner ───────────────────────────

function CoverageBanner({
  penjamin, pasien, mixed, penjaminName,
}: {
  penjamin: number;
  pasien: number;
  mixed: number;
  penjaminName: string;
}) {
  const total = penjamin + pasien + mixed;
  if (total === 0) return null;
  const pctP = total > 0 ? (penjamin / total) * 100 : 0;
  const pctU = total > 0 ? (pasien / total) * 100 : 0;
  const pctM = total > 0 ? (mixed / total) * 100 : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-3 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/40">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Distribusi Penanggung
        </span>
        <span className="font-mono text-[11px] text-slate-400">{KATEGORI_ORDER.length - 0} kategori</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        {pctP > 0 && <div style={{ width: `${pctP}%` }} className="bg-emerald-500 transition-all" title={`Penjamin ${pctP.toFixed(1)}%`} />}
        {pctM > 0 && <div style={{ width: `${pctM}%` }} className="bg-sky-500 transition-all" title={`Split ${pctM.toFixed(1)}%`} />}
        {pctU > 0 && <div style={{ width: `${pctU}%` }} className="bg-amber-500 transition-all" title={`Pasien ${pctU.toFixed(1)}%`} />}
      </div>

      {/* Legend */}
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
        <LegendItem dot="bg-emerald-500" label={penjaminName} value={fmtRupiah(penjamin)} pct={pctP} />
        {mixed > 0 && (
          <LegendItem dot="bg-sky-500" label="Split / Mixed" value={fmtRupiah(mixed)} pct={pctM} />
        )}
        <LegendItem dot="bg-amber-500" label="Pasien" value={fmtRupiah(pasien)} pct={pctU} />
      </div>
    </div>
  );
}

function LegendItem({
  dot, label, value, pct,
}: {
  dot: string;
  label: string;
  value: string;
  pct: number;
}) {
  return (
    <div className="flex flex-col gap-0.5 leading-tight">
      <div className="flex items-center gap-1.5">
        <span className={cn("h-2 w-2 flex-none rounded-full", dot)} />
        <span className="truncate text-[10.5px] text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <span className="font-mono text-[12px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
        {value}
        <span className="ml-1 text-[10px] font-normal text-slate-400">({pct.toFixed(0)}%)</span>
      </span>
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-800">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-4 ring-amber-50/60 dark:bg-amber-950/40 dark:ring-amber-950/30">
        <Sparkles size={20} />
      </div>
      <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">
        Belum ada item charge
      </h3>
      <p className="mt-1 max-w-xs text-[12px] text-slate-500 dark:text-slate-400">
        Item akan otomatis muncul saat order/resep/tindakan di unit klinis selesai (BL6).
        Untuk sementara tambah manual di bawah.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-[0.97]"
      >
        Tambah Item Pertama
      </button>
    </div>
  );
}
