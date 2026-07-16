"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PiggyBank, MousePointerClick, Inbox, Loader2 } from "lucide-react";
import QuickSearchInput from "../quick/QuickSearchInput";
import AdmisiResultRow from "./AdmisiResultRow";
import DepositForm, { type DepositSubmitInput } from "./DepositForm";
import DraftInvoicePreview from "./DraftInvoicePreview";
import { searchPasienAdmisi, suggestDeposit, type PasienAdmisi } from "@/lib/billing/depositMock";
import { recordPayment } from "@/lib/api/billing/invoice";
import { invoiceStateToDetail } from "../../invoice/invoiceStateMap";
import type { KwitansiContext } from "@/lib/billing/kwitansiContext";
import type { KasirShift } from "@/lib/billing/kasirShiftMock";
import type { PaymentRecord } from "../../invoice/invoiceShared";

interface Props {
  shift: KasirShift;
  /** Daftar pasien admisi pending (RI belum bayar) — data NYATA dari proyeksi billing (page-level). */
  pending: PasienAdmisi[];
  /** Status muat daftar (page-level fetch). */
  loading: boolean;
  onAccumulate: (metode: PaymentRecord["metode"], nominal: number) => void;
  /** Auto-buka kwitansi preview setelah deposit di-save. */
  onPrintKwitansi?: (ctx: KwitansiContext) => void;
}

/**
 * Deposit Awal Panel (BL3.3) — orchestrator search + form + draft preview. Data NYATA (tanpa mock):
 *   - Daftar admisi = kunjungan Rawat Inap belum bayar (proyeksi billing, di-supply page).
 *   - Buka deposit = `recordPayment` kategori "Deposit" (kwitansi KW, kasir server-resolved).
 *
 * Layout 2-col responsive:
 *   - Left: search input + result list pasien admisi (atau form jika selected)
 *   - Right: DraftInvoicePreview sticky lg-up
 */
export default function DepositAwalPanel({ shift, pending, loading, onAccumulate, onPrintKwitansi }: Props) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const results = useMemo(() => searchPasienAdmisi(query, pending), [query, pending]);

  // Seleksi diturunkan dari daftar nyata → auto-lepas bila pasien hilang (deposit tercatat / refetch).
  const selected = useMemo(
    () => (selectedId ? results.find((p) => p.id === selectedId) ?? null : null),
    [selectedId, results],
  );

  // Preview nominal = saran sistem (kelas × LOS default + buffer) — statik; form boleh override live.
  const previewNominal = useMemo(
    () => (selected
      ? suggestDeposit({
          kelas: selected.kelas,
          losDays: selected.estimasiLOS ?? 5,
          kategori: selected.kategori,
          penjaminTipe: selected.penjamin.tipe,
        }).total
      : 0),
    [selected],
  );

  const handleDepositSubmit = async (input: DepositSubmitInput) => {
    try {
      const state = await recordPayment(input.pasien.id, {
        metode: input.payment.metode,
        kategori: "Deposit",
        nominal: input.payment.nominal,
        shiftId: shift.id,
        bank: input.payment.bank || undefined,
        noRef: input.payment.noRef || undefined,
        catatan: input.payment.catatan || undefined,
      });
      onAccumulate(input.payment.metode, input.payment.nominal);

      // Kwitansi dari state nyata (invoice + deposit terbaru)
      if (onPrintKwitansi) {
        const detail = invoiceStateToDetail(state);
        const payment = [...detail.payments]
          .filter((p) => !p.voided)
          .sort((a, b) => b.tanggalISO.localeCompare(a.tanggalISO))[0];
        if (payment) onPrintKwitansi({ detail, payment });
      }

      // Pasien lepas dari daftar setelah refetch (dibayar > 0) — bersihkan seleksi + query.
      setSelectedId(null);
      setQuery("");
    } catch (e) {
      console.error("[Deposit] recordPayment gagal:", e);
    }
  };

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
                onClick={() => setSelectedId(null)}
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
                    : `${results.length} pasien Rawat Inap menunggu deposit — belum ada pembayaran`
                }
                icon={query.trim() ? MousePointerClick : PiggyBank}
              />

              {loading ? (
                <LoadingResults />
              ) : results.length === 0 ? (
                <EmptyResults query={query} />
              ) : (
                <ul className="space-y-2">
                  {results.map((p, idx) => (
                    <AdmisiResultRow
                      key={p.id}
                      pasien={p}
                      selected={false}
                      onSelect={() => setSelectedId(p.id)}
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
            nominal={previewNominal}
            metode="Tunai"
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

// ── Loading results ────────────────────────────────────

function LoadingResults() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-8 text-slate-400 dark:border-slate-800 dark:bg-slate-900/30">
      <Loader2 size={15} className="animate-spin text-amber-500" />
      <span className="text-[12px]">Memuat pasien admisi…</span>
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
          : "Belum ada pasien Rawat Inap yang menunggu deposit. Pasien baru akan muncul saat admisi RI dibuat dan belum ada pembayaran."}
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
          <strong>1 invoice</strong> dibuat saat submit — deposit tercatat sebagai pembayaran
          pertama di <em>/ehis-billing/tagihan</em>.
        </li>
      </ul>
      <p className="mt-2 text-[10px] italic text-slate-500">
        Pilih pasien di kiri untuk mulai input deposit.
      </p>
    </section>
  );
}
