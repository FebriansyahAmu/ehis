"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSkeletonDelay } from "@/components/master/shared";
import PatientBannerBilling from "./PatientBannerBilling";
import InvoiceTabs, { type InvoiceTabKey } from "./InvoiceTabs";
import RincianChargeTab from "./tabs/RincianChargeTab";
import PembayaranTab from "./tabs/PembayaranTab";
import KlaimStatusTab from "./tabs/KlaimStatusTab";
import RiwayatAuditTab from "./tabs/RiwayatAuditTab";
import AddItemModal from "./modals/AddItemModal";
import DiskonItemModal from "./modals/DiskonItemModal";
import VoidItemModal from "./modals/VoidItemModal";
import RefundModal from "./modals/RefundModal";
import VoidPaymentModal from "./modals/VoidPaymentModal";
import type {
  InvoiceDetail, ChargeItem, KategoriCharge, PaymentRecord, MetodeBayar,
} from "./invoiceShared";
import type { ChargeAction } from "./tabs/ChargeRow";
import type { PaymentRowAction } from "./tabs/payment/PaymentRow";
import { nextNoKwitansi } from "@/lib/billing/paymentCalc";

interface Props {
  initialDetail: InvoiceDetail;
}

type ModalKey = "add" | "diskon" | "void" | "refund" | "void-payment" | null;

export default function InvoiceDetailPage({ initialDetail }: Props) {
  const ready = useSkeletonDelay(400);
  const [detail, setDetail] = useState<InvoiceDetail>(initialDetail);
  const [activeTab, setActiveTab] = useState<InvoiceTabKey>("rincian");

  // Modal state
  const [modal, setModal] = useState<ModalKey>(null);
  const [targetItem, setTargetItem] = useState<ChargeItem | null>(null);
  const [addKategori, setAddKategori] = useState<KategoriCharge>("Lain-lain");
  const [targetPayment, setTargetPayment] = useState<PaymentRecord | null>(null);

  const activeItemCount = useMemo(
    () => detail.items.filter((i) => !i.voided).length,
    [detail.items],
  );

  // ── Mutations (mock-only — backend swap di BL0/B1.7) ──

  const addItem = (item: Omit<ChargeItem, "id">) => {
    const newItem: ChargeItem = {
      ...item,
      id: `manual-${Date.now()}`,
    };
    setDetail((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    console.log("[BL2.2] Add item:", newItem);
  };

  const applyDiskon = (itemId: string, diskon: number, alasan: string) => {
    setDetail((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === itemId ? { ...it, diskonItem: diskon, alasanDiskon: alasan } : it,
      ),
    }));
    console.log("[BL2.2] Apply diskon:", { itemId, diskon, alasan });
  };

  const voidItem = (itemId: string, reason: string) => {
    setDetail((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === itemId ? { ...it, voided: true, voidReason: reason } : it,
      ),
    }));
    console.log("[BL2.2] Void item:", { itemId, reason });
  };

  const unvoidItem = (itemId: string) => {
    setDetail((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === itemId ? { ...it, voided: false, voidReason: undefined } : it,
      ),
    }));
    console.log("[BL2.2] Unvoid item:", itemId);
  };

  // ── Action dispatchers ──

  const handleItemAction = (action: ChargeAction, item: ChargeItem) => {
    setTargetItem(item);
    if (action === "diskon") setModal("diskon");
    else if (action === "void") setModal("void");
    else if (action === "unvoid") unvoidItem(item.id);
    else if (action === "source") {
      console.log("[BL2.2] Open source:", item.sourceModul, item.sourceRef);
    }
  };

  const handleAddItem = (kategori: KategoriCharge) => {
    setAddKategori(kategori);
    setModal("add");
  };

  // ── Payment mutations (BL2.3) ──

  const addPayment = (payload: Omit<PaymentRecord, "id" | "noKwitansi">) => {
    setDetail((prev) => {
      const noKwitansi = nextNoKwitansi(prev.payments);
      const newPayment: PaymentRecord = {
        ...payload,
        id: `pay-${Date.now()}`,
        noKwitansi,
      };
      const nextPayments = [...prev.payments, newPayment];
      const nextDibayar = nextPayments.reduce((s, p) => (p.voided ? s : s + p.nominal), 0);
      console.log("[BL2.3] Add payment:", newPayment);
      return { ...prev, payments: nextPayments, dibayar: nextDibayar };
    });
  };

  const refundPayment = (
    paymentId: string,
    nominal: number,
    metode: MetodeBayar,
    alasan: string,
  ) => {
    setDetail((prev) => {
      const noKwitansi = nextNoKwitansi(prev.payments);
      const refund: PaymentRecord = {
        id: `pay-${Date.now()}`,
        tanggalISO: new Date().toISOString().slice(0, 16),
        metode,
        nominal: -Math.abs(nominal),
        kasir: "Sari (Kasir-1)", // mock — backend ambil dari session
        noKwitansi,
        kategori: "Refund",
        refundOf: paymentId,
        catatan: alasan,
      };
      const nextPayments = [...prev.payments, refund];
      const nextDibayar = nextPayments.reduce((s, p) => (p.voided ? s : s + p.nominal), 0);
      console.log("[BL2.3] Refund:", refund);
      return { ...prev, payments: nextPayments, dibayar: nextDibayar };
    });
  };

  const voidPayment = (paymentId: string, reason: string) => {
    setDetail((prev) => {
      const nextPayments = prev.payments.map((p) =>
        p.id === paymentId ? { ...p, voided: true, voidReason: reason } : p,
      );
      const nextDibayar = nextPayments.reduce((s, p) => (p.voided ? s : s + p.nominal), 0);
      console.log("[BL2.3] Void payment:", { paymentId, reason });
      return { ...prev, payments: nextPayments, dibayar: nextDibayar };
    });
  };

  const handlePaymentAction = (action: PaymentRowAction, payment: PaymentRecord) => {
    setTargetPayment(payment);
    if (action === "refund") setModal("refund");
    else if (action === "void") setModal("void-payment");
    else if (action === "print") {
      console.log("[BL2.3] Print kwitansi → BL2.6 modal", payment.noKwitansi);
    }
  };

  // ── Banner actions (stubs untuk BL2.4-2.6) ──
  const handlePrint        = () => console.log("[BL2.1] Print struk → BL2.6 modal");
  const handleSubmitKlaim  = () => { setActiveTab("klaim"); };
  const handleRefund       = () => { setActiveTab("pembayaran"); };
  const handleApplyDiskInv = () => console.log("[BL2.2] Diskon invoice — modal akan dibuat di follow-up");
  const handleFinalize     = () => {
    setDetail((prev) => ({ ...prev, status: "Final" }));
    console.log("[BL2.2] Finalize invoice");
  };
  // Deep-link ke modul /ehis-eklaim (belum dibangun). Saat EK0 route ready,
  // ganti console.log → router.push(href).
  const handleOpenEklaim   = (href: string) =>
    console.log("[BL2.4] Open E-Klaim route (belum dibangun):", href);

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/60 dark:bg-slate-950">
      <AnimatePresence mode="wait">
        {!ready ? (
          <SkeletonShell key="skeleton" />
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <PatientBannerBilling
              detail={detail}
              onPrint={handlePrint}
              onSubmitKlaim={handleSubmitKlaim}
              onRefund={handleRefund}
            />

            <InvoiceTabs
              detail={detail}
              active={activeTab}
              onChange={setActiveTab}
              itemCount={activeItemCount}
            />

            {/* Tab body */}
            <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-slate-950">
              {activeTab === "rincian" && (
                <RincianChargeTab
                  detail={detail}
                  onAddItem={handleAddItem}
                  onItemAction={handleItemAction}
                  onApplyDiskonInvoice={handleApplyDiskInv}
                  onFinalize={handleFinalize}
                />
              )}
              {activeTab === "pembayaran" && (
                <PembayaranTab
                  detail={detail}
                  onAddPayment={addPayment}
                  onRowAction={handlePaymentAction}
                />
              )}
              {activeTab === "klaim" && (
                <KlaimStatusTab
                  detail={detail}
                  onOpenEklaim={handleOpenEklaim}
                />
              )}
              {activeTab === "riwayat" && (
                <RiwayatAuditTab detail={detail} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddItemModal
        open={modal === "add"}
        defaultKategori={addKategori}
        onClose={() => setModal(null)}
        onAdd={addItem}
      />
      <DiskonItemModal
        open={modal === "diskon"}
        item={targetItem}
        onClose={() => setModal(null)}
        onApply={applyDiskon}
      />
      <VoidItemModal
        open={modal === "void"}
        item={targetItem}
        onClose={() => setModal(null)}
        onVoid={voidItem}
      />
      <RefundModal
        open={modal === "refund"}
        payment={targetPayment}
        allPayments={detail.payments}
        onClose={() => setModal(null)}
        onRefund={refundPayment}
      />
      <VoidPaymentModal
        open={modal === "void-payment"}
        payment={targetPayment}
        onClose={() => setModal(null)}
        onVoid={voidPayment}
      />
    </div>
  );
}

// ── Sub: skeleton & placeholder ─────────────────────────

function SkeletonShell() {
  return (
    <motion.div
      key="skeleton"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex h-full flex-col"
    >
      {/* Banner placeholder */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex gap-3">
          <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-72 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
        <div className="mt-3 h-6 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
      {/* Body placeholder */}
      <div className="flex-1 space-y-3 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-white ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800"
          />
        ))}
      </div>
    </motion.div>
  );
}

