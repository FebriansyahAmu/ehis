"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PiggyBank, MousePointerClick, Inbox } from "lucide-react";
import QuickSearchInput from "../quick/QuickSearchInput";
import AdmisiResultRow from "./AdmisiResultRow";
import DepositForm, { type DepositSubmitInput } from "./DepositForm";
import DraftInvoicePreview from "./DraftInvoicePreview";
import {
  PASIEN_ADMISI_MOCK, searchPasienAdmisi, removePasienAdmisi,
  type PasienAdmisi,
} from "@/lib/billing/depositMock";
import { appendShiftPayment, type ShiftPaymentLog } from "@/lib/billing/shiftPaymentsMock";
import { nextNoKwitansi } from "@/lib/billing/paymentCalc";
import { fromDepositInput, type KwitansiContext } from "@/lib/billing/kwitansiContext";
import type { KasirShift } from "@/lib/billing/kasirShiftMock";
import type { PaymentRecord } from "../../invoice/invoiceShared";

interface Props {
  shift: KasirShift;
  onAccumulate: (metode: PaymentRecord["metode"], nominal: number) => void;
  /** Auto-buka kwitansi preview setelah deposit di-save. */
  onPrintKwitansi?: (ctx: KwitansiContext) => void;
}

/**
 * Deposit Awal Panel (BL3.3) — orchestrator search + form + draft preview.
 *
 * Layout 2-col responsive:
 *   - Left: search input + result list pasien admisi (atau form jika selected)
 *   - Right: DraftInvoicePreview sticky lg-up
 */
export default function DepositAwalPanel({ shift, onAccumulate, onPrintKwitansi }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PasienAdmisi | null>(null);
  const [previewNominal, setPreviewNominal] = useState(0);
  const [previewMetode, setPreviewMetode] = useState("Tunai");
  // Trigger re-render saat list mutated (pasien dihapus dari mock)
  const [tick, setTick] = useState(0);

  const results = useMemo(
    () => searchPasienAdmisi(query, PASIEN_ADMISI_MOCK),
    [query, tick],
  );

  // Auto-deselect kalau pasien terpilih sudah hilang dari list (di-process di tab lain)
  useEffect(() => {
    if (selected && !results.find((p) => p.id === selected.id)) {
      setSelected(null);
    }
  }, [results, selected]);

  const handleDepositSubmit = (input: DepositSubmitInput) => {
    // 1. Create payment log entry (mock — backend create invoice draft + payment)
    const baseLog: ShiftPaymentLog = {
      ...input.payment,
      id: `log-${Date.now()}`,
      noKwitansi: nextNoKwitansi([]),
      invoiceId: `INV-DRAFT-${input.pasien.id}`,
      invoiceNo: `INV/2026/05/NEW-${input.pasien.noKunjungan.slice(-4)}`,
      pasienNama: input.pasien.pasien.nama,
      pasienRM: input.pasien.pasien.noRM,
    };

    // 2. Synthesize InvoiceDetail draft → cache di log.draftDetail untuk reprint
    const ctx = fromDepositInput(input.pasien, baseLog);
    const log: ShiftPaymentLog = { ...baseLog, draftDetail: ctx.detail };

    appendShiftPayment(shift.id, log);
    onAccumulate(input.payment.metode, input.payment.nominal);

    // 3. C2 — auto-buka kwitansi preview (cetak deposit slip)
    if (onPrintKwitansi) onPrintKwitansi(ctx);

    // 4. Remove pasien dari admisi pending list
    removePasienAdmisi(input.pasien.id);
    setSelected(null);
    setQuery("");
    setTick((v) => v + 1);

    console.log("[BL3.3] Deposit awal submitted:", { input, log });
  };

  // Watch nominal change di form (for preview update)
  // Karena DepositForm tidak expose live state, kita pakai useEffect listener
  // alternatif via re-mount approach. Simplest: bind state via parent.
  // Untuk MVP — preview pakai suggested.total estimasi (default).
  useEffect(() => {
    if (selected) {
      // Default preview = suggested total dengan LOS default
      // (akan re-calc di DepositForm internal, preview is static estimate)
      setPreviewNominal(0);  // will be updated when form mounts
      setPreviewMetode("Tunai");
    }
  }, [selected]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {/* Left column */}
      <div className="space-y-3">
        {/* Search input */}
        <QuickSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Cari pasien admisi (nama / no RM / no kunjungan)…"
          autoFocus
        />

        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <DepositForm
                pasien={selected}
                kasirName={shift.kasirNama}
                onSubmit={handleDepositSubmit}
              />
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mt-2 text-[11.5px] text-slate-500 hover:text-slate-700 hover:underline dark:hover:text-slate-300"
              >
                ← Kembali ke daftar admisi
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
                title={query.trim() ? "Hasil Pencarian" : "Daftar Admisi Pending"}
                hint={
                  query.trim()
                    ? `${results.length} pasien match "${query}"`
                    : `${results.length} pasien menunggu deposit — sort by urgensi & jam`
                }
                icon={query.trim() ? MousePointerClick : PiggyBank}
              />

              {results.length === 0 ? (
                <EmptyResults query={query} />
              ) : (
                <ul className="space-y-2">
                  {results.map((p, idx) => (
                    <AdmisiResultRow
                      key={p.id}
                      pasien={p}
                      selected={false}
                      onSelect={() => setSelected(p)}
                      delay={Math.min(0.25, idx * 0.04)}
                    />
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right column — sticky preview */}
      <aside className="lg:sticky lg:top-2 lg:self-start">
        {selected ? (
          <DraftInvoicePreview
            pasien={selected}
            nominal={previewNominal || 0}
            metode={previewMetode}
          />
        ) : (
          <DepositInfoCard />
        )}
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
  icon: typeof PiggyBank;
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
      <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
        <Inbox size={18} />
      </span>
      <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
        Tidak ada pasien admisi
      </p>
      <p className="mt-1 max-w-sm text-[10.5px] text-slate-500">
        {query
          ? `Tidak ada match untuk "${query}". Coba kata kunci lain atau cek no kunjungan.`
          : "Tidak ada pasien yang menunggu deposit admisi saat ini. Pasien baru akan muncul saat tim pendaftaran selesai entry."}
      </p>
    </div>
  );
}

// ── Info card (when no selection) ──────────────────────

function DepositInfoCard() {
  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/40 px-4 py-4 dark:border-amber-900/40 dark:bg-amber-950/15">
      <div className="flex items-center gap-2">
        <PiggyBank size={14} className="text-amber-600" />
        <h3 className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
          Apa itu Deposit Awal?
        </h3>
      </div>
      <p className="mt-1 text-[11.5px] leading-snug text-slate-700 dark:text-slate-300">
        Uang muka yang dibayar pasien <strong>sebelum</strong> mulai pelayanan RI / pre-op.
        Dipakai sebagai jaminan kelengkapan pembayaran selama rawat inap.
      </p>
      <ul className="mt-2 space-y-1 text-[10.5px] text-slate-600 dark:text-slate-400">
        <li>
          <strong>Suggest amount</strong> auto dari kelas × LOS + buffer 10-30%
          (tergantung penjamin).
        </li>
        <li>
          <strong>Kasir bisa override</strong> nominal jika ada negotiation atau permintaan
          keluarga.
        </li>
        <li>
          <strong>1 invoice draft</strong> dibuat saat submit — tagihan baru muncul di
          <em> /ehis-billing/tagihan</em>.
        </li>
      </ul>
      <p className="mt-2 text-[10px] italic text-slate-500">
        Pilih pasien di kiri untuk mulai input deposit.
      </p>
    </section>
  );
}
