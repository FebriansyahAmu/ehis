"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingDown, InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah, KATEGORI_CFG } from "../../invoice/invoiceShared";
import { projectDepositBreakdown } from "@/lib/billing/chargeSummary";
import type { KelasFilter, PenjaminFilter } from "@/components/billing/tagihan/tagihanShared";
import type { AdmisiKategori } from "@/lib/billing/depositMock";

interface Props {
  kelas: KelasFilter;
  losDays: number;
  penjaminTipe: Exclude<PenjaminFilter, "all">;
  admisiKategori: AdmisiKategori;
}

/**
 * EstimateChargeCard — projection rencana charge untuk pasien admisi (Deposit Awal).
 *
 * Beda dengan ChargeSummaryCard (Quick Bayar):
 *   - Quick Bayar = invoice sudah ada, lookup actual items
 *   - Deposit = invoice belum ada, projection dari kelas × LOS + buffer
 *
 * Component re-calculate real-time saat user adjust LOS slider di parent form.
 * Tujuan: educate pasien "rencana biaya rawat selama X hari kira-kira segini".
 */
export default function EstimateChargeCard({
  kelas, losDays, penjaminTipe, admisiKategori,
}: Props) {
  const estimate = useMemo(
    () => projectDepositBreakdown({ kelas, losDays, penjaminTipe, admisiKategori }),
    [kelas, losDays, penjaminTipe, admisiKategori],
  );

  // Penghematan dari coverage (Umum vs Asuransi vs BPJS)
  const fullCost = estimate.subTotal + estimate.buffer;
  const savedByPenjamin = fullCost - estimate.total;
  const coveragePct = fullCost > 0 ? Math.round((savedByPenjamin / fullCost) * 100) : 0;

  return (
    <section
      aria-label="Estimasi Rencana Charge"
      className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-900/40"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-amber-600" />
          <span className="text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
            Rencana Charge Estimasi
          </span>
          <span className="rounded-full bg-amber-50 px-1.5 py-0 font-mono text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-900/60">
            {losDays} hari rawat
          </span>
        </div>
        <span className="font-mono text-[12px] font-bold tabular-nums text-slate-800 dark:text-slate-100">
          {fmtRupiah(estimate.total)}
        </span>
      </div>

      {/* Per-kategori rows */}
      <ul className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-slate-900">
        {estimate.rows.map((row, idx) => {
          const cfg = KATEGORI_CFG[row.kategori];
          const Icon = cfg.icon;
          return (
            <motion.li
              key={row.kategori}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.16, delay: idx * 0.04 }}
              className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-1.5"
            >
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
                <p className="truncate font-mono text-[9.5px] text-slate-500">
                  {row.hint}
                </p>
              </div>
              <span className="font-mono text-[12px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                {fmtRupiah(row.nominal)}
              </span>
            </motion.li>
          );
        })}
      </ul>

      {/* Footer totals */}
      <dl className="space-y-0.5 border-t border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] dark:border-slate-700 dark:bg-slate-900/60">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <dt className="text-slate-600 dark:text-slate-400">Sub-Estimasi (full cost)</dt>
          <dd className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
            {fmtRupiah(fullCost)}
          </dd>
        </div>

        {/* Penjamin discount info */}
        {savedByPenjamin > 0 && (
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <dt className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
              <TrendingDown size={10} />
              Ditanggung Penjamin (~{coveragePct}%)
            </dt>
            <dd className="font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
              − {fmtRupiah(savedByPenjamin)}
            </dd>
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto] gap-2 border-t border-slate-200 pt-1 dark:border-slate-700">
          <dt className="font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
            Estimasi Beban Pasien
          </dt>
          <dd className="font-mono text-[13px] font-bold tabular-nums text-amber-700 dark:text-amber-300">
            {fmtRupiah(estimate.total)}
          </dd>
        </div>
      </dl>

      {/* Footnote disclaimer */}
      <div className="flex items-start gap-1.5 border-t border-slate-200 bg-amber-50/30 px-3 py-1.5 dark:border-slate-700 dark:bg-amber-950/15">
        <InfoIcon size={10} className="mt-0.5 flex-none text-amber-600" />
        <p className="text-[9.5px] leading-snug text-slate-600 dark:text-slate-400">
          Estimasi kasar berbasis kelas × LOS + buffer.
          Charge real bisa berbeda — total final tergantung tindakan, obat, dan hasil lab/rad aktual.
        </p>
      </div>
    </section>
  );
}
