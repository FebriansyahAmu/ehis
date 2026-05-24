"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Construction } from "lucide-react";
import { useSkeletonDelay } from "@/components/master/shared";
import PatientBannerBilling from "./PatientBannerBilling";
import InvoiceTabs, { type InvoiceTabKey } from "./InvoiceTabs";
import RincianChargeTab from "./tabs/RincianChargeTab";
import AddItemModal from "./modals/AddItemModal";
import DiskonItemModal from "./modals/DiskonItemModal";
import VoidItemModal from "./modals/VoidItemModal";
import type { InvoiceDetail, ChargeItem, KategoriCharge } from "./invoiceShared";
import type { ChargeAction } from "./tabs/ChargeRow";

interface Props {
  initialDetail: InvoiceDetail;
}

type ModalKey = "add" | "diskon" | "void" | null;

export default function InvoiceDetailPage({ initialDetail }: Props) {
  const ready = useSkeletonDelay(400);
  const [detail, setDetail] = useState<InvoiceDetail>(initialDetail);
  const [activeTab, setActiveTab] = useState<InvoiceTabKey>("rincian");

  // Modal state
  const [modal, setModal] = useState<ModalKey>(null);
  const [targetItem, setTargetItem] = useState<ChargeItem | null>(null);
  const [addKategori, setAddKategori] = useState<KategoriCharge>("Lain-lain");

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

  // ── Banner actions (stubs untuk BL2.3-2.6) ──
  const handlePrint        = () => console.log("[BL2.1] Print struk → BL2.6 modal");
  const handleSubmitKlaim  = () => console.log("[BL2.1] Submit klaim → BL2.4 / BL4");
  const handleRefund       = () => console.log("[BL2.1] Refund → BL2.3 modal");
  const handleApplyDiskInv = () => console.log("[BL2.2] Diskon invoice — modal akan dibuat di follow-up");
  const handleFinalize     = () => {
    setDetail((prev) => ({ ...prev, status: "Final" }));
    console.log("[BL2.2] Finalize invoice");
  };

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
                <TabPlaceholder
                  title="Pembayaran"
                  hint="Form deposit, riwayat pembayaran, refund — akan dibangun di BL2.3."
                />
              )}
              {activeTab === "klaim" && (
                <TabPlaceholder
                  title="Klaim Penjamin"
                  hint="INA-CBG preview, SEP info, submit klaim batch, status timeline — akan dibangun di BL2.4."
                />
              )}
              {activeTab === "riwayat" && (
                <TabPlaceholder
                  title="Riwayat Audit"
                  hint="Timeline lengkap semua event create/edit/void/payment — akan dibangun di BL2.5."
                />
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

function TabPlaceholder({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="max-w-md rounded-xl border border-dashed border-amber-200 bg-amber-50/40 px-6 py-8 text-center dark:border-amber-900/40 dark:bg-amber-950/15">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <Construction size={20} />
        </div>
        <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-400">{hint}</p>
      </div>
    </div>
  );
}
