"use client";

// KunjunganInvoiceView — Rincian tagihan PROYEKSI (READ-ONLY, Slice 1) untuk 1 kunjungan.
// Charge diproyeksikan server-side dari order klinis nyata (Tindakan/Resep/Lab/Rad/BMHP + Akomodasi)
// via GET /kunjungan/:id/billing. Belum ada pembayaran / penyesuaian (diskon/void) — menyusul Slice 2.
// Deep-link dari header rekam medis (widget Total Tagihan). Reuse pure calc invoiceCalc + config UI.

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Loader2, Wallet, AlertTriangle, Lock, ChevronRight, Info, ReceiptText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBillingProjection, type BillingProjectionDTO } from "@/lib/api/billing/projection";
import { groupByKategori, coverageBreakdown, rowSubtotal } from "@/lib/billing/invoiceCalc";
import {
  KATEGORI_CFG, COVERAGE_CFG, SOURCE_BADGE_TONE, fmtRupiah,
  type ChargeItem,
} from "./invoiceShared";

const UNIT_LABEL: Record<string, string> = { IGD: "IGD", RawatInap: "Rawat Inap", RawatJalan: "Rawat Jalan" };
const KELAS_LABEL: Record<string, string> = {
  VIP: "VIP", Kelas_1: "Kelas 1", Kelas_2: "Kelas 2", Kelas_3: "Kelas 3", ICU: "ICU", HCU: "HCU", Isolasi: "Isolasi",
};
const PENJAMIN_LABEL: Record<string, string> = {
  BPJS_Non_PBI: "BPJS Non-PBI", BPJS_PBI: "BPJS PBI", Umum: "Umum / Pribadi", Asuransi: "Asuransi", Jamkesda: "Jamkesda",
};

const fmtTgl = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function KunjunganInvoiceView({ kunjunganId }: { kunjunganId: string }) {
  const [data, setData] = useState<BillingProjectionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    getBillingProjection(kunjunganId, ac.signal)
      .then((d) => { if (!ac.signal.aborted) { setData(d); setError(null); } })
      .catch((e) => { if (!ac.signal.aborted) setError(e instanceof Error ? e.message : "Gagal memuat proyeksi tagihan"); })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [kunjunganId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-slate-400">
        <Loader2 size={18} className="animate-spin" /> <span className="text-sm">Memuat proyeksi tagihan…</span>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center">
        <AlertTriangle size={28} className="mx-auto text-rose-400" />
        <p className="mt-2 text-sm font-semibold text-rose-700">{error ?? "Data tidak ditemukan"}</p>
        <Link href="/ehis-billing/tagihan" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50">
          <ArrowLeft size={13} /> Kembali ke Tagihan
        </Link>
      </div>
    );
  }

  // DTO → ChargeItem (union literal identik) untuk pure calc + config UI.
  const chargeItems: ChargeItem[] = data.items.map((it) => ({
    id: it.id, tanggalISO: it.tanggalISO, nama: it.nama,
    sourceModul: it.sourceModul, sourceRef: it.sourceRef, kategori: it.kategori,
    qty: it.qty, satuan: it.satuan, hargaSatuan: it.hargaSatuan, coverage: it.coverage,
  }));
  const untariffed = new Set(data.items.filter((i) => i.untariffed).map((i) => i.id));
  const sections = groupByKategori(chargeItems);
  const coverage = coverageBreakdown(chargeItems);
  const covTotal = coverage.penjamin + coverage.pasien + coverage.mixed;

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
      {/* Breadcrumb + back */}
      <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
        <Link href="/ehis-billing/tagihan" className="inline-flex items-center gap-1 transition hover:text-slate-600">
          <ArrowLeft size={13} /> Tagihan
        </Link>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="font-mono text-slate-500">{data.noKunjungan}</span>
      </div>

      {/* Header identitas */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ReceiptText size={16} className="text-indigo-500" />
              <h1 className="truncate text-lg font-bold text-slate-900">{data.pasien.nama}</h1>
              {data.locked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                  <Lock size={10} /> Terkunci
                </span>
              )}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <span className="font-mono text-slate-600">{data.pasien.noRM}</span>
              <span className="text-slate-300">·</span>
              <span>{UNIT_LABEL[data.unit] ?? data.unit}{data.kelas ? ` · ${KELAS_LABEL[data.kelas] ?? data.kelas}` : ""}</span>
              <span className="text-slate-300">·</span>
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 ring-1 ring-emerald-200">
                {PENJAMIN_LABEL[data.penjaminTipe] ?? data.penjaminTipe}
              </span>
              {data.noSep && (
                <span className="rounded bg-sky-50 px-1.5 py-0.5 font-mono text-[11px] text-sky-700 ring-1 ring-sky-200">SEP {data.noSep}</span>
              )}
            </p>
          </div>

          {/* Total proyeksi */}
          <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-4 py-2.5 text-right shadow-sm">
            <p className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-widest text-indigo-200">
              <Wallet size={11} /> Total Proyeksi
            </p>
            <p className="mt-0.5 font-mono text-xl font-extrabold tabular-nums text-white">{fmtRupiah(data.subtotal)}</p>
          </div>
        </div>

        {/* Coverage bar */}
        {covTotal > 0 && (
          <div className="mt-4">
            <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
              {coverage.penjamin > 0 && <div style={{ width: `${(coverage.penjamin / covTotal) * 100}%` }} className="bg-emerald-500" title="Penjamin" />}
              {coverage.mixed > 0 && <div style={{ width: `${(coverage.mixed / covTotal) * 100}%` }} className="bg-sky-500" title="Split" />}
              {coverage.pasien > 0 && <div style={{ width: `${(coverage.pasien / covTotal) * 100}%` }} className="bg-amber-500" title="Pasien" />}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Penjamin <b className="font-mono text-slate-700">{fmtRupiah(coverage.penjamin)}</b></span>
              <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2 w-2 rounded-full bg-amber-500" /> Pasien <b className="font-mono text-slate-700">{fmtRupiah(coverage.pasien)}</b></span>
            </div>
          </div>
        )}
      </div>

      {/* Banner read-only proyeksi */}
      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3.5 py-2.5">
        <Info size={14} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-[11.5px] leading-relaxed text-amber-800">
          <b>Proyeksi langsung dari order klinis</b> (read-only). Angka mengikuti order aktif kunjungan; order dibatalkan tak dihitung.
          {data.untariffedCount > 0 && (
            <span className="mt-0.5 block font-semibold text-rose-600">
              {data.untariffedCount} item belum bertarif (Rp 0) — perlu ditinjau tim tarif.
            </span>
          )}
          <span className="mt-0.5 block text-amber-600">Pembayaran &amp; penyesuaian (diskon/void/deposit) menyusul.</span>
        </p>
      </div>

      {/* Sections per kategori */}
      <div className="mt-4 space-y-2.5">
        {sections.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 py-14 text-center">
            <Wallet size={22} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-400">Belum ada order yang menghasilkan tagihan pada kunjungan ini.</p>
          </div>
        ) : (
          sections.map((s, si) => {
            const cfg = KATEGORI_CFG[s.kategori];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={s.kategori}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.04, duration: 0.2 }}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className={cn("flex items-center justify-between gap-2 px-4 py-2.5", cfg.bg)}>
                  <div className="flex items-center gap-2">
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-lg bg-white/70", cfg.text)}><Icon size={13} /></span>
                    <span className={cn("text-xs font-bold", cfg.text)}>{cfg.label}</span>
                    <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{s.count}</span>
                  </div>
                  <span className="font-mono text-sm font-bold tabular-nums text-slate-800">{fmtRupiah(s.subtotal)}</span>
                </div>

                <div className="divide-y divide-slate-50">
                  {s.items.map((it) => {
                    const tone = SOURCE_BADGE_TONE[it.sourceModul];
                    const cov = COVERAGE_CFG[it.coverage];
                    const isUntariffed = untariffed.has(it.id);
                    return (
                      <div key={it.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="truncate text-xs font-semibold text-slate-800">{it.nama}</span>
                            <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold", tone.bg, tone.text)}>{it.sourceModul}</span>
                            {isUntariffed && (
                              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-600">BELUM BERTARIF</span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {fmtTgl(it.tanggalISO)} · {it.qty} {it.satuan} × {fmtRupiah(it.hargaSatuan)}
                          </p>
                        </div>
                        <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1", cov.bg, cov.text, cov.ring)}>
                          {cov.label}
                        </span>
                        <span className="w-24 shrink-0 text-right font-mono text-xs font-bold tabular-nums text-slate-800">
                          {fmtRupiah(rowSubtotal(it))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer total */}
      {sections.length > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5">
          <span className="text-sm font-semibold text-slate-600">Total Estimasi Tagihan</span>
          <span className="font-mono text-lg font-extrabold tabular-nums text-indigo-700">{fmtRupiah(data.subtotal)}</span>
        </div>
      )}
    </div>
  );
}
