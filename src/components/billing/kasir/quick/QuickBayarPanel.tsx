"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MousePointerClick, Loader2 } from "lucide-react";
import QuickSearchInput from "./QuickSearchInput";
import OutstandingResultRow from "./OutstandingResultRow";
import QuickPaymentForm from "./QuickPaymentForm";
import RecentPaymentsFeed from "./RecentPaymentsFeed";
import {
  searchOutstanding, topOutstandingSuggestions, type OutstandingResult,
} from "@/lib/billing/outstandingSearch";
import { listBillingKunjungan } from "@/lib/api/billing/projection";
import {
  getInvoiceState, recordPayment, listRecentPayments,
  type InvoiceStateDTO, type RecentPaymentDTO,
} from "@/lib/api/billing/invoice";
import { mapProjectionRow } from "../../tagihan/realRows";
import { invoiceStateToDetail } from "../../invoice/invoiceStateMap";
import type { TagihanRow } from "@/lib/billing/tagihanBoardMock";
import type { ShiftPaymentLog } from "@/lib/billing/shiftPaymentsMock";
import type { KwitansiContext } from "@/lib/billing/kwitansiContext";
import type { KasirShift } from "@/lib/billing/kasirShiftMock";
import type {
  PaymentRecord, MetodeBayar, PaymentKategori, PaymentSource,
} from "../../invoice/invoiceShared";

interface Props {
  shift: KasirShift;
  onAccumulate: (metode: PaymentRecord["metode"], nominal: number) => void;
  /** Buka kwitansi modal — auto-trigger setelah save, juga dipanggil reprint feed. */
  onPrintKwitansi?: (ctx: KwitansiContext) => void;
  /** Deep-link dari detail tagihan (kunjunganId) → pre-select tagihan di form. */
  deepLinkInvoice?: string;
  /** Mode form: "refund" → kategori Refund (dari deep-link ?mode=refund). Default bayar. */
  deepLinkMode?: "bayar" | "refund";
}

/**
 * Quick Bayar Panel — orchestrator search + form + feed. Data NYATA (tanpa mock):
 *   - Outstanding = proyeksi billing (`GET /billing/kunjungan` → mapProjectionRow), sisa dari DB.
 *   - Bayar = `recordPayment` (kwitansi KW, kasir server-resolved).
 *   - Recent feed = `GET /billing/payments/recent` (per shift).
 * Deep-link `?invoice=<kid>` → pre-select tagihan tsb ke dalam form (desain sama).
 */
export default function QuickBayarPanel({ shift, onAccumulate, onPrintKwitansi, deepLinkInvoice, deepLinkMode = "bayar" }: Props) {
  const [query, setQuery] = useState("");
  const [allRows, setAllRows] = useState<TagihanRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [selected, setSelected] = useState<OutstandingResult | null>(null);
  const [recent, setRecent] = useState<ShiftPaymentLog[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  // ── Fetch outstanding (proyeksi billing) ──
  useEffect(() => {
    const ac = new AbortController();
    listBillingKunjungan(ac.signal)
      .then((data) => { if (!ac.signal.aborted) setAllRows(data.map(mapProjectionRow)); })
      .catch(() => { if (!ac.signal.aborted) setAllRows([]); })
      .finally(() => { if (!ac.signal.aborted) setRowsLoading(false); });
    return () => ac.abort();
  }, [refreshTick]);

  // ── Fetch recent payments (feed shift) ──
  useEffect(() => {
    const ac = new AbortController();
    listRecentPayments({ shiftId: shift.id, limit: 10 }, ac.signal)
      .then((data) => { if (!ac.signal.aborted) setRecent(data.map(toShiftLog)); })
      .catch(() => { if (!ac.signal.aborted) setRecent([]); })
      .finally(() => {});
    return () => ac.abort();
  }, [shift.id, refreshTick]);

  // ── Deep-link: pre-select tagihan tertentu (fetch state → build target) ──
  useEffect(() => {
    if (!deepLinkInvoice) return;
    const ac = new AbortController();
    getInvoiceState(deepLinkInvoice, ac.signal)
      .then((s) => { if (!ac.signal.aborted) setSelected(outstandingFromState(s)); })
      .catch(() => {});
    return () => ac.abort();
  }, [deepLinkInvoice]);

  const results = useMemo(
    () => (query.trim() === "" ? topOutstandingSuggestions(allRows) : searchOutstanding(query, allRows)),
    [query, allRows],
  );

  // Mode refund HANYA berlaku untuk kunjungan yang di-deep-link (?mode=refund&invoice=<kid>).
  // Pilih tagihan lain dari daftar/pencarian → kembali ke mode bayar (bukan refund global).
  const formMode: "bayar" | "refund" =
    deepLinkMode === "refund" && selected?.id === deepLinkInvoice ? "refund" : "bayar";

  const handlePaymentSubmit = async (payload: Omit<PaymentRecord, "id" | "noKwitansi">) => {
    if (!selected) return;
    try {
      const state = await recordPayment(selected.id, {
        metode: payload.metode,
        kategori: payload.kategori, // "Pembayaran" | "Refund" (dari mode form)
        nominal: payload.nominal,
        source: "Quick",
        shiftId: shift.id,
        bank: payload.bank || undefined,
        noRef: payload.noRef || undefined,
        catatan: payload.catatan || undefined,
      });
      onAccumulate(payload.metode, payload.nominal);

      // Kwitansi dari state nyata (invoice + payment terbaru)
      if (onPrintKwitansi) {
        const detail = invoiceStateToDetail(state);
        const payment = [...detail.payments]
          .filter((p) => !p.voided)
          .sort((a, b) => b.tanggalISO.localeCompare(a.tanggalISO))[0];
        if (payment) onPrintKwitansi({ detail, payment });
      }

      // Refresh worklist + feed
      setRefreshTick((v) => v + 1);

      // Update / clear target sesuai sisa terbaru
      if (state.sisa <= 0) {
        setQuery("");
        setSelected(null);
      } else {
        setSelected(outstandingFromState(state));
      }
    } catch (e) {
      console.error("[QuickBayar] recordPayment gagal:", e);
    }
  };

  const handleReprintFromFeed = async (p: ShiftPaymentLog) => {
    if (!onPrintKwitansi) return;
    try {
      const state = await getInvoiceState(p.invoiceId); // invoiceId = kunjunganId
      const detail = invoiceStateToDetail(state);
      const payment =
        detail.payments.find((pay) => pay.id === p.id) ??
        detail.payments.find((pay) => pay.noKwitansi === p.noKwitansi);
      if (payment) onPrintKwitansi({ detail, payment });
    } catch (e) {
      console.warn("[QuickBayar] reprint gagal:", e);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {/* Left column */}
      <div className="space-y-3">
        {/* Search input */}
        <QuickSearchInput value={query} onChange={setQuery} autoFocus />

        {/* If selected → show form; else show result list */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <QuickPaymentForm
                target={selected}
                kasirName={shift.kasirNama}
                onSubmit={handlePaymentSubmit}
                mode={formMode}
              />
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mt-2 text-[11.5px] text-slate-500 hover:text-slate-700 hover:underline dark:hover:text-slate-300"
              >
                ← Kembali ke hasil pencarian
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-2"
            >
              <SectionLabel
                title={query.trim() ? "Hasil Pencarian" : "Top Outstanding"}
                hint={
                  query.trim()
                    ? `${results.length} tagihan match "${query}"`
                    : "Tagihan dengan sisa terbesar — klik untuk bayar cepat"
                }
                icon={query.trim() ? MousePointerClick : Sparkles}
              />

              {rowsLoading ? (
                <LoadingList />
              ) : results.length === 0 ? (
                <EmptyResults query={query} />
              ) : (
                <ul className="space-y-2">
                  {results.map((r, idx) => (
                    <OutstandingResultRow
                      key={r.id}
                      row={r}
                      selected={false}
                      onSelect={() => setSelected(r)}
                      delay={Math.min(0.25, idx * 0.03)}
                    />
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right column — sticky feed */}
      <aside className="lg:sticky lg:top-2 lg:self-start">
        <RecentPaymentsFeed
          payments={recent}
          onPrintKwitansi={handleReprintFromFeed}
        />
      </aside>
    </div>
  );
}

// ── Mappers ────────────────────────────────────────────

function toShiftLog(d: RecentPaymentDTO): ShiftPaymentLog {
  return {
    id: d.id,
    tanggalISO: d.tanggalISO,
    metode: d.metode as MetodeBayar,
    nominal: d.nominal,
    kasir: d.kasir,
    noKwitansi: d.noKwitansi,
    kategori: d.kategori as PaymentKategori,
    source: (d.source as PaymentSource | null) ?? undefined,
    bank: d.bank ?? undefined,
    noRef: d.noRef ?? undefined,
    catatan: d.catatan ?? undefined,
    voided: d.voided,
    invoiceId: d.kunjunganId,
    invoiceNo: d.noInvoice,
    pasienNama: d.pasienNama,
    pasienRM: d.pasienRM,
  };
}

function outstandingFromState(s: InvoiceStateDTO): OutstandingResult {
  const d = invoiceStateToDetail(s);
  return {
    id: s.kunjunganId,
    noTagihan: d.noTagihan,
    tanggalISO: d.tanggalISO,
    noKunjungan: s.noKunjungan,
    pasien: { nama: d.pasien.nama, noRM: d.pasien.noRM, gender: d.pasien.gender, age: d.pasien.age },
    unit: d.unit,
    kelas: d.kelas,
    penjamin: { tipe: d.penjamin.tipe, nama: d.penjamin.nama },
    dpjp: d.dpjp,
    total: s.grandTotal,
    dibayar: s.dibayar,
    status: d.status,
    sisaTagihan: s.sisa,
  };
}

// ── Section label ──────────────────────────────────────

function SectionLabel({
  title, hint, icon: Icon,
}: {
  title: string;
  hint: string;
  icon: typeof Sparkles;
}) {
  return (
    <div className="flex items-center gap-2 px-1">
      <Icon size={13} className="text-amber-500" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
        {title}
      </span>
      <span className="text-[10.5px] text-slate-500">— {hint}</span>
    </div>
  );
}

// ── Loading list ───────────────────────────────────────

function LoadingList() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-8 text-slate-400 dark:border-slate-800 dark:bg-slate-900/30">
      <Loader2 size={15} className="animate-spin text-amber-500" />
      <span className="text-[12px]">Memuat tagihan…</span>
    </div>
  );
}

// ── Empty results ──────────────────────────────────────

function EmptyResults({ query }: { query: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-8 text-center dark:border-slate-800 dark:bg-slate-900/30">
      <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
        Tidak ada tagihan dengan sisa
      </p>
      <p className="mt-1 text-[10.5px] text-slate-500">
        {query
          ? `Tidak ada match untuk "${query}". Coba kata kunci lain atau cek nomor RM.`
          : "Semua tagihan saat ini sudah lunas."}
      </p>
    </div>
  );
}
