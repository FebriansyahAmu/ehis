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
import {
  getInvoiceState, setInvoiceAdjustment, finalizeInvoice, reopenInvoice, listBillingAudit,
  setItemAdjustment, removeItemAdjustment,
  type InvoiceStateDTO,
} from "@/lib/api/billing/invoice";
import type { AuditEvent, AuditActionKind } from "@/lib/billing/auditTrail";
import { useRecordVersion } from "@/lib/realtime/recordBus";
import { useCan } from "@/components/auth/Can";
import { invoiceStateToDetail } from "./invoiceStateMap";
import type { ChargeItem } from "./invoiceShared";
import type { ChargeAction } from "./tabs/ChargeRow";
import PatientBannerBilling from "./PatientBannerBilling";
import InvoiceFinalizeBar from "./InvoiceFinalizeBar";
import InvoiceTabs, { type InvoiceTabKey } from "./InvoiceTabs";
import RincianChargeTab from "./tabs/RincianChargeTab";
import KunjunganPembayaranReadonly from "./tabs/KunjunganPembayaranReadonly";
import KlaimStatusTab from "./tabs/KlaimStatusTab";
import RiwayatAuditTab from "./tabs/RiwayatAuditTab";
import InvoicePrintModal from "./modals/InvoicePrintModal";
import AdjustmentModal from "./modals/AdjustmentModal";
import ItemAdjustModal, { type ItemAdjustPayload } from "./modals/ItemAdjustModal";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const noop = () => {};

export default function KunjunganInvoiceDetail({ kunjunganId }: { kunjunganId: string }) {
  const router = useRouter();
  const can = useCan();
  const isReal = UUID_RE.test(kunjunganId);

  const [state, setState] = useState<InvoiceStateDTO | null>(null);
  const [loading, setLoading] = useState(isReal); // demo (non-UUID) → langsung tampilkan pesan
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<InvoiceTabKey>("rincian");
  const [printOpen, setPrintOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustBusy, setAdjustBusy] = useState(false);
  const [finBusy, setFinBusy] = useState(false);
  const [finErr, setFinErr] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  // Penyesuaian per-baris (Slice 2d Fase 2)
  const [adjItem, setAdjItem] = useState<ChargeItem | null>(null);
  const [adjMode, setAdjMode] = useState<"diskon" | "void">("diskon");
  const [itemAdjBusy, setItemAdjBusy] = useState(false);
  const [itemAdjErr, setItemAdjErr] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0); // bump → refetch (sesudah void/refund)

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
  }, [kunjunganId, isReal, orderVersion, reloadTick]);

  // Audit trail NYATA (billing.AuditLog) — refetch saat versi invoice / reload berubah
  // (finalize/reopen/adjust menaikkan version; void/refund lewat reloadTick).
  const stateVersion = state?.version ?? 0;
  useEffect(() => {
    if (!isReal) return;
    const ac = new AbortController();
    listBillingAudit(kunjunganId, ac.signal)
      .then((rows) => {
        if (ac.signal.aborted) return;
        setAuditEvents(rows.map((r) => ({ ...r, action: r.action as AuditActionKind })));
      })
      .catch(() => { /* diam — audit advisory, tak menghalangi detail */ });
    return () => ac.abort();
  }, [kunjunganId, isReal, stateVersion, reloadTick]);

  const detail = useMemo(() => (state ? invoiceStateToDetail(state) : null), [state]);
  const canAdjust = can("billing.invoice", "update");

  const handleOpenEklaim = useCallback((href: string) => router.push(href), [router]);

  const handleAdjust = useCallback(
    async (input: { diskonInvoice: number; materai: number; ppnPct: number; alasan?: string }) => {
      if (!state) return;
      setAdjustBusy(true);
      try {
        const next = await setInvoiceAdjustment(kunjunganId, { ...input, expectedVersion: state.version });
        setState(next);
        setAdjustOpen(false);
      } catch (e) {
        console.error("[Adjustment] gagal:", e);
      } finally {
        setAdjustBusy(false);
      }
    },
    [kunjunganId, state],
  );

  const handleFinalize = useCallback(
    async (force: boolean) => {
      if (!state) return;
      setFinBusy(true);
      setFinErr(null);
      try {
        const next = await finalizeInvoice(kunjunganId, { force, expectedVersion: state.version });
        setState(next);
      } catch (e) {
        setFinErr(e instanceof Error ? e.message : "Gagal memfinalisasi");
      } finally {
        setFinBusy(false);
      }
    },
    [kunjunganId, state],
  );

  const handleReopen = useCallback(
    async (alasan: string) => {
      if (!state) return;
      setFinBusy(true);
      setFinErr(null);
      try {
        const next = await reopenInvoice(kunjunganId, { alasan, expectedVersion: state.version });
        setState(next);
      } catch (e) {
        setFinErr(e instanceof Error ? e.message : "Gagal membatalkan finalisasi");
      } finally {
        setFinBusy(false);
      }
    },
    [kunjunganId, state],
  );

  // Penyesuaian per-baris: buka modal (diskon/void) atau langsung pulihkan (unvoid).
  const handleItemAction = useCallback(
    async (action: ChargeAction, item: ChargeItem) => {
      if (action === "diskon" || action === "void") {
        setItemAdjErr(null);
        setAdjMode(action);
        setAdjItem(item);
      } else if (action === "unvoid") {
        try {
          const next = await removeItemAdjustment(kunjunganId, item.sourceRef);
          setState(next);
        } catch (e) {
          console.error("[ItemAdjust] unvoid gagal:", e);
        }
      }
      // "source" → tak ada aksi di konteks billing (charge = proyeksi)
    },
    [kunjunganId],
  );

  const closeItemAdjust = useCallback(() => { setAdjItem(null); setItemAdjErr(null); }, []);

  const handleItemAdjustSubmit = useCallback(
    async (payload: ItemAdjustPayload) => {
      if (!adjItem) return;
      setItemAdjBusy(true);
      setItemAdjErr(null);
      try {
        const next = await setItemAdjustment(kunjunganId, { sourceRef: adjItem.sourceRef, ...payload });
        setState(next);
        setAdjItem(null);
      } catch (e) {
        setItemAdjErr(e instanceof Error ? e.message : "Gagal menerapkan penyesuaian");
      } finally {
        setItemAdjBusy(false);
      }
    },
    [kunjunganId, adjItem],
  );

  const handleItemAdjustRemove = useCallback(async () => {
    if (!adjItem) return;
    setItemAdjBusy(true);
    setItemAdjErr(null);
    try {
      const next = await removeItemAdjustment(kunjunganId, adjItem.sourceRef);
      setState(next);
      setAdjItem(null);
    } catch (e) {
      setItemAdjErr(e instanceof Error ? e.message : "Gagal menghapus penyesuaian");
    } finally {
      setItemAdjBusy(false);
    }
  }, [kunjunganId, adjItem]);

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

      <InvoiceFinalizeBar
        lifecycle={state.lifecycle}
        finalizedAt={state.finalizedAt}
        finalizedBy={state.finalizedBy}
        untariffedCount={state.untariffedCount}
        subtotal={state.subtotal}
        canManage={canAdjust}
        busy={finBusy}
        errorMsg={finErr}
        onFinalize={handleFinalize}
        onReopen={handleReopen}
      />

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
                onItemAction={handleItemAction}
                onApplyDiskonInvoice={noop}
                readOnly
                allowItemAdjust={canAdjust && state.lifecycle === "Draft"}
                onAdjust={canAdjust && state.lifecycle === "Draft" ? () => setAdjustOpen(true) : undefined}
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
                onChanged={() => setReloadTick((v) => v + 1)}
              />
            )}
            {tab === "klaim" && <KlaimStatusTab detail={detail} onOpenEklaim={handleOpenEklaim} />}
            {tab === "riwayat" && <RiwayatAuditTab detail={detail} events={auditEvents} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <InvoicePrintModal open={printOpen} detail={detail} onClose={() => setPrintOpen(false)} />

      <AdjustmentModal
        open={adjustOpen}
        subtotal={state.subtotal}
        current={{ diskonInvoice: state.diskonInvoice, materai: state.materai, ppnPct: state.ppnPct }}
        busy={adjustBusy}
        onClose={() => setAdjustOpen(false)}
        onSubmit={handleAdjust}
      />

      <ItemAdjustModal
        open={adjItem !== null}
        mode={adjMode}
        item={adjItem}
        busy={itemAdjBusy}
        error={itemAdjErr}
        onClose={closeItemAdjust}
        onSubmit={handleItemAdjustSubmit}
        onRemove={handleItemAdjustRemove}
      />
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
