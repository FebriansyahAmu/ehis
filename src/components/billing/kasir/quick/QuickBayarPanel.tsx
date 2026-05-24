"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MousePointerClick } from "lucide-react";
import QuickSearchInput from "./QuickSearchInput";
import OutstandingResultRow from "./OutstandingResultRow";
import QuickPaymentForm from "./QuickPaymentForm";
import RecentPaymentsFeed from "./RecentPaymentsFeed";
import {
  searchOutstanding, topOutstandingSuggestions,
  type OutstandingResult,
} from "@/lib/billing/outstandingSearch";
import {
  getShiftPayments, appendShiftPayment, type ShiftPaymentLog,
} from "@/lib/billing/shiftPaymentsMock";
import { nextNoKwitansi } from "@/lib/billing/paymentCalc";
import { fromShiftLog, type KwitansiContext } from "@/lib/billing/kwitansiContext";
import type { KasirShift } from "@/lib/billing/kasirShiftMock";
import type { PaymentRecord } from "../../invoice/invoiceShared";

interface Props {
  shift: KasirShift;
  onAccumulate: (metode: PaymentRecord["metode"], nominal: number) => void;
  /** Buka kwitansi modal — auto-trigger setelah save, juga dipanggil reprint feed. */
  onPrintKwitansi?: (ctx: KwitansiContext) => void;
}

/**
 * Quick Bayar Panel (BL3.2) — orchestrator search + form + feed.
 *
 * Layout 2-col responsive:
 *   - Left: search input + result list (atau form jika ada selected target)
 *   - Right: recent payments feed (sticky lg-up)
 */
export default function QuickBayarPanel({ shift, onAccumulate, onPrintKwitansi }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<OutstandingResult | null>(null);
  const [feedRefresh, setFeedRefresh] = useState(0);  // trigger feed re-read

  const results = useMemo(() => {
    if (query.trim() === "") return topOutstandingSuggestions();
    return searchOutstanding(query);
  }, [query]);

  // Auto-deselect kalau row terpilih hilang dari results (mis. ke-bayar di tab lain)
  useEffect(() => {
    if (selected && !results.find((r) => r.id === selected.id)) {
      setSelected(null);
    }
  }, [results, selected]);

  const recentPayments = useMemo(
    () => getShiftPayments(shift.id, 10),
    [shift.id, feedRefresh],
  );

  const handlePaymentSubmit = (payload: Omit<PaymentRecord, "id" | "noKwitansi">) => {
    if (!selected) return;
    const noKwitansi = nextNoKwitansi(recentPayments);
    const log: ShiftPaymentLog = {
      ...payload,
      id: `log-${Date.now()}`,
      noKwitansi,
      invoiceId: selected.id,
      invoiceNo: selected.noTagihan,
      pasienNama: selected.pasien.nama,
      pasienRM: selected.pasien.noRM,
    };
    appendShiftPayment(shift.id, log);
    onAccumulate(payload.metode, payload.nominal);
    setFeedRefresh((v) => v + 1);

    // C1 — auto-open kwitansi preview untuk cetak/email/copy
    if (onPrintKwitansi) {
      const ctx = fromShiftLog(log);
      if (ctx) onPrintKwitansi(ctx);
    }

    // Reset target jika sudah lunas (sisa - nominal == 0); else update sisa
    if (payload.nominal >= selected.sisaTagihan) {
      setQuery("");
      setSelected(null);
    } else {
      setSelected({ ...selected, sisaTagihan: selected.sisaTagihan - payload.nominal });
    }
    console.log("[BL3.2] Quick payment submitted:", log);
  };

  // I1 — reprint kwitansi dari Recent Feed
  const handleReprintFromFeed = (p: ShiftPaymentLog) => {
    if (!onPrintKwitansi) return;
    const ctx = fromShiftLog(p);
    if (ctx) onPrintKwitansi(ctx);
    else console.warn("[BL3.2] Reprint gagal: invoice detail tidak tersedia", p);
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
                    : "5 tagihan dengan sisa terbesar — klik untuk bayar cepat"
                }
                icon={query.trim() ? MousePointerClick : Sparkles}
              />

              {results.length === 0 ? (
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
          payments={recentPayments}
          onPrintKwitansi={handleReprintFromFeed}
        />
      </aside>
    </div>
  );
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
