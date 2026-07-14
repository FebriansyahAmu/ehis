"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ExternalLink, FileQuestion, ListChecks, Loader2,
  ChevronsDownUp, ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fmtRupiah, KATEGORI_CFG, COVERAGE_CFG,
} from "../../invoice/invoiceShared";
import type { ChargeItem, KategoriCharge } from "../../invoice/invoiceShared";
import { getChargeSummary, buildChargeSummary, type ChargeKategoriRow, type ChargeSummary } from "@/lib/billing/chargeSummary";
import { getInvoiceState } from "@/lib/api/billing/invoice";
import { invoiceStateToDetail } from "../../invoice/invoiceStateMap";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Detail tagihan: kunjungan nyata (UUID) → rincian proyeksi; else mock invoice. */
function tagihanHref(invoiceId: string): string {
  return UUID_RE.test(invoiceId)
    ? `/ehis-billing/tagihan/kunjungan/${invoiceId}`
    : `/ehis-billing/tagihan/${invoiceId}`;
}

interface Props {
  invoiceId: string;
  /** Default expand outer: jika item-count ≤ threshold → expanded saat mount. */
  autoExpandThreshold?: number;
}

/**
 * ChargeSummaryCard — kasir Quick Bayar context.
 *
 * Tree 2-level:
 *   L1 — outer "Rincian Charge" toggle (expand all kategori header)
 *   L2 — per-kategori toggle (expand items detail di kategori tsb)
 *
 * Auto-expand outer jika item-count ≤ threshold (default 5).
 * Per-kategori L2: default collapsed; tombol "Expand All / Collapse All" untuk batch.
 */
export default function ChargeSummaryCard({ invoiceId, autoExpandThreshold = 5 }: Props) {
  const isReal = UUID_RE.test(invoiceId);
  // Kunjungan nyata (UUID) → charge summary DIPROYEKSIKAN dari getInvoiceState (bukan mock).
  const [live, setLive] = useState<ChargeSummary | null>(null);
  const [loading, setLoading] = useState(isReal);
  const mock = useMemo(() => (isReal ? null : getChargeSummary(invoiceId)), [isReal, invoiceId]);

  useEffect(() => {
    if (!isReal) return;
    const ac = new AbortController();
    getInvoiceState(invoiceId, ac.signal)
      .then((s) => { if (!ac.signal.aborted) setLive(buildChargeSummary(invoiceStateToDetail(s), invoiceId)); })
      .catch(() => { if (!ac.signal.aborted) setLive(null); })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [isReal, invoiceId]);

  if (isReal && loading) return <LoadingCard />;
  const summary = isReal ? live : mock;
  if (!summary || !summary.hasDetail) return <NoDetailFallback invoiceId={invoiceId} />;
  return <ChargeSummaryView summary={summary} invoiceId={invoiceId} autoExpandThreshold={autoExpandThreshold} />;
}

// ── View (summary sudah pasti ada) ─────────────────────

function ChargeSummaryView({
  summary, invoiceId, autoExpandThreshold,
}: {
  summary: ChargeSummary;
  invoiceId: string;
  autoExpandThreshold: number;
}) {
  const [expandedOuter, setExpandedOuter] = useState(summary.itemCountTotal <= autoExpandThreshold);
  const [expandedKategori, setExpandedKategori] = useState<Set<KategoriCharge>>(new Set());

  const toggleKategori = (kategori: KategoriCharge) => {
    setExpandedKategori((prev) => {
      const next = new Set(prev);
      if (next.has(kategori)) next.delete(kategori);
      else next.add(kategori);
      return next;
    });
  };

  const allExpanded = expandedKategori.size === summary.kategori.length;
  const expandAllToggle = () => {
    if (allExpanded) setExpandedKategori(new Set());
    else setExpandedKategori(new Set(summary.kategori.map((k) => k.kategori)));
  };

  return (
    <section
      aria-label="Rincian Charge"
      className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-900/40"
    >
      {/* Outer header toggle */}
      <button
        type="button"
        onClick={() => setExpandedOuter((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            size={14}
            className={cn(
              "flex-none text-slate-500 transition-transform",
              expandedOuter && "rotate-180",
            )}
          />
          <ListChecks size={13} className="text-amber-600" />
          <span className="text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
            Rincian Charge
          </span>
          <span className="rounded-full bg-slate-200/80 px-1.5 py-0 font-mono text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {summary.kategori.length} kategori · {summary.itemCountTotal} item
          </span>
        </div>
        <span className="font-mono text-[12px] font-bold tabular-nums text-slate-800 dark:text-slate-100">
          {fmtRupiah(summary.subTotal)}
        </span>
      </button>

      {/* Body (expandable outer) */}
      <AnimatePresence initial={false}>
        {expandedOuter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-slate-200 dark:border-slate-700"
          >
            {/* Expand-All toggle strip */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-3 py-1 text-[10px] dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-slate-500">
                Klik kategori untuk lihat item · atau:
              </span>
              <button
                type="button"
                onClick={expandAllToggle}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-amber-700 transition-colors hover:bg-amber-100/50 dark:text-amber-300 dark:hover:bg-amber-950/30"
              >
                {allExpanded ? (
                  <>
                    <ChevronsDownUp size={10} />
                    Collapse Semua
                  </>
                ) : (
                  <>
                    <ChevronsUpDown size={10} />
                    Expand Semua
                  </>
                )}
              </button>
            </div>

            {/* Per-kategori rows (L2 tree) */}
            <ul className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-slate-900">
              {summary.kategori.map((k, idx) => (
                <KategoriNode
                  key={k.kategori}
                  row={k}
                  expanded={expandedKategori.has(k.kategori)}
                  onToggle={() => toggleKategori(k.kategori)}
                  delay={idx * 0.03}
                />
              ))}
            </ul>

            {/* Footer totals */}
            <FooterTotals summary={summary} />

            {/* Deep link */}
            <Link
              href={tagihanHref(invoiceId)}
              className="group flex items-center justify-between gap-2 border-t border-slate-200 bg-amber-50/40 px-3 py-2 text-[11px] text-amber-700 transition-colors hover:bg-amber-100/50 dark:border-slate-700 dark:bg-amber-950/15 dark:text-amber-300 dark:hover:bg-amber-950/25"
              title="Lihat seluruh detail (audit, void, diskon, klaim, riwayat)"
            >
              <span className="font-medium">
                Lihat Rincian Lengkap (audit · void · diskon · klaim)
              </span>
              <ExternalLink size={11} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Kategori node (parent toggle + child items) ────────

function KategoriNode({
  row, expanded, onToggle, delay,
}: {
  row: ChargeKategoriRow;
  expanded: boolean;
  onToggle: () => void;
  delay: number;
}) {
  const cfg = KATEGORI_CFG[row.kategori];
  const covCfg = COVERAGE_CFG[row.dominantCoverage];
  const Icon = cfg.icon;

  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.16, delay }}
    >
      {/* Parent row — toggle button */}
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full grid-cols-[14px_24px_minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
      >
        <ChevronDown
          size={12}
          className={cn(
            "flex-none text-slate-400 transition-transform",
            expanded && "rotate-180",
          )}
        />
        <span className={cn(
          "flex h-6 w-6 items-center justify-center rounded ring-1",
          cfg.bg, cfg.text, cfg.ring,
        )}>
          <Icon size={11} />
        </span>
        <div className="min-w-0">
          <p className="text-[11.5px] font-medium text-slate-800 dark:text-slate-100">
            {cfg.label}
          </p>
          <p className="font-mono text-[9.5px] text-slate-500">
            {row.count} item
          </p>
        </div>
        <span className={cn(
          "rounded px-1 py-0 text-[9px] font-semibold ring-1",
          covCfg.bg, covCfg.text, covCfg.ring,
        )}>
          {covCfg.label}
        </span>
        <span className="font-mono text-[12px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
          {fmtRupiah(row.subtotal)}
        </span>
      </button>

      {/* Child items list (expandable) */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <ul className="bg-slate-50/40 px-3 py-1 pl-9 dark:bg-slate-800/20">
              {row.items.length === 0 ? (
                <li className="py-1 text-[10.5px] italic text-slate-400">
                  Tidak ada item aktif di kategori ini
                </li>
              ) : (
                row.items.map((item, idx) => (
                  <ItemRow key={item.id} item={item} delay={idx * 0.02} />
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// ── Per-item row ───────────────────────────────────────

function ItemRow({ item, delay }: { item: ChargeItem; delay: number }) {
  const covCfg = COVERAGE_CFG[item.coverage];
  const gross = item.qty * item.hargaSatuan;
  const net = Math.max(0, gross - (item.diskonItem ?? 0));
  const hasDiskon = (item.diskonItem ?? 0) > 0;

  return (
    <motion.li
      initial={{ opacity: 0, x: -2 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.14, delay: Math.min(0.2, delay) }}
      className="grid grid-cols-[44px_minmax(0,1fr)_56px_auto_auto] items-baseline gap-2 border-b border-dotted border-slate-100 py-1 last:border-0 dark:border-slate-800/40"
    >
      {/* Date short */}
      <span className="font-mono text-[9.5px] tabular-nums text-slate-400">
        {formatTanggalShort(item.tanggalISO)}
      </span>

      {/* Nama (+ diskon inline) */}
      <div className="min-w-0">
        <p className="truncate text-[10.5px] text-slate-700 dark:text-slate-300">
          {item.nama}
        </p>
        {hasDiskon && (
          <p className="font-mono text-[9px] italic text-rose-600">
            diskon −{fmtRupiah(item.diskonItem!)} · {item.alasanDiskon ?? "—"}
          </p>
        )}
      </div>

      {/* Qty satuan */}
      <span className="text-right font-mono text-[10px] tabular-nums text-slate-500">
        {item.qty} {item.satuan}
      </span>

      {/* Subtotal (with strikethrough gross if diskon) */}
      <div className="text-right">
        {hasDiskon && (
          <span className="block font-mono text-[9px] tabular-nums text-slate-400 line-through">
            {fmtRupiah(gross)}
          </span>
        )}
        <span className="font-mono text-[10.5px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
          {fmtRupiah(net)}
        </span>
      </div>

      {/* Coverage chip per item (mini) */}
      <span
        title={`Coverage: ${covCfg.label}`}
        className={cn(
          "inline-block h-3 w-3 flex-none rounded-full ring-1",
          covCfg.bg, covCfg.ring,
        )}
      />
    </motion.li>
  );
}

// ── Footer totals ──────────────────────────────────────

function FooterTotals({ summary }: { summary: ReturnType<typeof getChargeSummary> }) {
  return (
    <dl className="space-y-0.5 border-t border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] dark:border-slate-700 dark:bg-slate-900/60">
      <TotalRow label="Sub-Total" value={fmtRupiah(summary.subTotal)} />
      {summary.diskonInvoice > 0 && (
        <TotalRow label="Diskon Invoice" value={`− ${fmtRupiah(summary.diskonInvoice)}`} tone="rose" />
      )}
      {summary.ppn > 0 && (
        <TotalRow label="PPN" value={fmtRupiah(summary.ppn)} />
      )}
      {summary.materai > 0 && (
        <TotalRow label="Materai" value={fmtRupiah(summary.materai)} />
      )}
      <TotalRow label="Grand Total" value={fmtRupiah(summary.grandTotal)} emphasis />
      {summary.dibayar > 0 && (
        <TotalRow label="Sudah Dibayar" value={`− ${fmtRupiah(summary.dibayar)}`} tone="emerald" />
      )}
      <TotalRow label="Sisa Tagihan" value={fmtRupiah(summary.sisa)} sisaTone />
    </dl>
  );
}

function TotalRow({
  label, value, tone, emphasis, sisaTone,
}: {
  label: string;
  value: string;
  tone?: "rose" | "emerald";
  emphasis?: boolean;
  sisaTone?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2">
      <dt className={cn(
        "text-slate-600 dark:text-slate-400",
        emphasis && "font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100",
      )}>
        {label}
      </dt>
      <dd className={cn(
        "font-mono tabular-nums",
        emphasis ? "text-[13px] font-bold text-slate-900 dark:text-slate-50" : "text-[11.5px]",
        tone === "rose" && "text-rose-700 dark:text-rose-300",
        tone === "emerald" && "text-emerald-700 dark:text-emerald-300",
        sisaTone && "font-bold text-amber-700 dark:text-amber-300",
      )}>
        {value}
      </dd>
    </div>
  );
}

// ── No-detail fallback ─────────────────────────────────

function NoDetailFallback({ invoiceId }: { invoiceId: string }) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50/40 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-start gap-2">
        <FileQuestion size={14} className="mt-0.5 flex-none text-slate-400" />
        <div className="min-w-0">
          <p className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
            Rincian charge belum tersedia
          </p>
          <p className="text-[10.5px] text-slate-500">
            Belum ada order berharga pada kunjungan ini. Untuk audit lengkap, buka detail tagihan.
          </p>
          <Link
            href={tagihanHref(invoiceId)}
            className="mt-1 inline-flex items-center gap-1 text-[10.5px] font-medium text-amber-700 hover:underline dark:text-amber-300"
          >
            Buka detail tagihan
            <ExternalLink size={9} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Loading (fetch charge nyata) ───────────────────────

function LoadingCard() {
  return (
    <section className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2.5 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-900/40">
      <Loader2 size={13} className="animate-spin text-amber-500" />
      Memuat rincian charge…
    </section>
  );
}

// ── Format helper ──────────────────────────────────────

function formatTanggalShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}
