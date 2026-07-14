"use client";

// KunjunganInvoiceDetail — detail tagihan 1 kunjungan memakai DESAIN InvoiceDetailPage (banner +
// 4 tab), tapi DATA NYATA (proyeksi order + invoice/payment DB via GET /kunjungan/:id/billing/invoice)
// dan READ-ONLY. Charge = proyeksi (tak dapat diubah di sini); Pembayaran = satu pintu (Kasir).
// Menggantikan KunjunganInvoiceView sederhana. Dipakai di /ehis-billing/tagihan/kunjungan/[kid].

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { getInvoiceState, type InvoiceStateDTO } from "@/lib/api/billing/invoice";
import { useRecordVersion } from "@/lib/realtime/recordBus";
import { invoiceStateToDetail } from "./invoiceStateMap";
import PatientBannerBilling from "./PatientBannerBilling";
import InvoiceTabs, { type InvoiceTabKey } from "./InvoiceTabs";
import RincianChargeTab from "./tabs/RincianChargeTab";
import KunjunganPembayaranReadonly from "./tabs/KunjunganPembayaranReadonly";
import KlaimStatusTab from "./tabs/KlaimStatusTab";
import RiwayatAuditTab from "./tabs/RiwayatAuditTab";
import InvoicePrintModal from "./modals/InvoicePrintModal";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const noop = () => {};

export default function KunjunganInvoiceDetail({ kunjunganId }: { kunjunganId: string }) {
  const router = useRouter();
  const isReal = UUID_RE.test(kunjunganId);

  const [state, setState] = useState<InvoiceStateDTO | null>(null);
  const [loading, setLoading] = useState(isReal); // demo (non-UUID) → langsung tampilkan pesan
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<InvoiceTabKey>("rincian");
  const [printOpen, setPrintOpen] = useState(false);

  // Reaktif: charge = proyeksi order → refetch saat order kunjungan berubah.
  const orderVersion = useRecordVersion(kunjunganId, "order", isReal);

  useEffect(() => {
    if (!isReal) return;
    const ac = new AbortController();
    getInvoiceState(kunjunganId, ac.signal)
      .then((s) => { if (!ac.signal.aborted) { setState(s); setError(null); } })
      .catch((e) => { if (!ac.signal.aborted) setError(e instanceof Error ? e.message : "Gagal memuat tagihan"); })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [kunjunganId, isReal, orderVersion]);

  const detail = useMemo(() => (state ? invoiceStateToDetail(state) : null), [state]);

  const handleOpenEklaim = useCallback((href: string) => router.push(href), [router]);

  if (!isReal) {
    return <NotAvailable message="Detail tagihan hanya untuk kunjungan tersimpan (bukan pasien demo)." />;
  }
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-slate-400">
        <Loader2 size={18} className="animate-spin" /> <span className="text-sm">Memuat tagihan…</span>
      </div>
    );
  }
  if (error || !detail || !state) {
    return <NotAvailable message={error ?? "Data tidak ditemukan"} isError />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/60 dark:bg-slate-950">
      <PatientBannerBilling detail={detail} onPrint={() => setPrintOpen(true)} />

      <InvoiceTabs detail={detail} active={tab} onChange={setTab} itemCount={detail.items.length} />

      <div className="min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="h-full min-h-0"
          >
            {tab === "rincian" && (
              <RincianChargeTab
                detail={detail}
                onAddItem={noop}
                onItemAction={noop}
                onApplyDiskonInvoice={noop}
                readOnly
              />
            )}
            {tab === "pembayaran" && (
              <KunjunganPembayaranReadonly
                kunjunganId={kunjunganId}
                grand={state.grandTotal}
                dibayar={state.dibayar}
                sisa={state.sisa}
                status={state.status}
                payments={detail.payments}
              />
            )}
            {tab === "klaim" && <KlaimStatusTab detail={detail} onOpenEklaim={handleOpenEklaim} />}
            {tab === "riwayat" && <RiwayatAuditTab detail={detail} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <InvoicePrintModal open={printOpen} detail={detail} onClose={() => setPrintOpen(false)} />
    </div>
  );
}

// ── Not available / error ───────────────────────────────

function NotAvailable({ message, isError }: { message: string; isError?: boolean }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-950">
      <AlertTriangle size={28} className={isError ? "mx-auto text-rose-400" : "mx-auto text-slate-300"} />
      <p className={`mt-2 text-sm font-semibold ${isError ? "text-rose-700" : "text-slate-600 dark:text-slate-300"}`}>{message}</p>
      <Link
        href="/ehis-billing/tagihan"
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
      >
        <ArrowLeft size={13} /> Kembali ke Tagihan
      </Link>
    </div>
  );
}
