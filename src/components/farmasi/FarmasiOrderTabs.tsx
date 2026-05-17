"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, FileText, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deriveResepOrders, updateFarmasiWorkflow,
  type FarmasiOrder, type TelaahData,
  type FarmasiOrderItem, type SerahTerima, type CatatanFarmasi,
} from "./farmasiShared";
import { updateOrderStatus } from "@/components/shared/medical-records/daftarOrder/daftarOrderShared";
import CPPTTab    from "@/components/shared/medical-records/CPPTTab";
import LayananFarmasiTab from "./tabs/LayananFarmasiTab";

// ── Tab definitions ───────────────────────────────────────

interface TabDef { id: string; label: string; icon: LucideIcon }

const TABS: TabDef[] = [
  { id: "layanan", label: "Layanan Farmasi", icon: Pill      },
  { id: "cppt",    label: "CPPT Apoteker",   icon: FileText  },
];

type TabId = "layanan" | "cppt";

// ── Nav item ──────────────────────────────────────────────

function NavItem({ tab, active, onClick }: { tab: TabDef; active: boolean; onClick: () => void }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "mx-2 flex w-[calc(100%-16px)] items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-all duration-150",
        active
          ? "bg-sky-600 text-white shadow-sm shadow-sky-200"
          : "text-slate-500 hover:bg-sky-50 hover:text-sky-700",
      )}
    >
      <Icon size={14} className="shrink-0" />
      <span className="truncate">{tab.label}</span>
    </button>
  );
}

// ── Callback types ────────────────────────────────────────

export interface FarmasiOrderCallbacks {
  onTelaahSubmit:     (orderId: string, data: TelaahData) => void;
  onDispensasiSubmit: (orderId: string, items: FarmasiOrderItem[], serahTerima: SerahTerima) => void;
  onCatatanAdd:       (orderId: string, catatan: CatatanFarmasi) => void;
}

// ── Main ──────────────────────────────────────────────────

export default function FarmasiOrderTabs({ orderId }: { orderId: string }) {
  const [active, setActive] = useState<TabId>("layanan");

  // Derive live order (with workflowStore overlay, client-side)
  const [order, setOrder] = useState<FarmasiOrder | null>(() =>
    deriveResepOrders().find((o) => o.id === orderId) ?? null,
  );

  function handleTelaahSubmit(id: string, data: TelaahData) {
    const newStatus = data.result === "Disetujui" ? "Ditelaah" : "Dikembalikan" as const;
    updateFarmasiWorkflow(id, { status: newStatus, telaah: data });
    updateOrderStatus(id, data.result === "Disetujui" ? "Diproses" : "Menunggu");
    setOrder((prev) => prev ? { ...prev, telaah: data, status: newStatus } : prev);
  }

  function handleDispensasiSubmit(id: string, items: FarmasiOrderItem[], serahTerima: SerahTerima) {
    updateFarmasiWorkflow(id, { status: "Selesai", items, serahTerima });
    updateOrderStatus(id, "Selesai");
    setOrder((prev) => prev ? { ...prev, items, serahTerima, status: "Selesai" } : prev);
  }

  function handleCatatanAdd(id: string, catatan: CatatanFarmasi) {
    const existing = order?.catatan ?? [];
    const updated  = [...existing, catatan];
    updateFarmasiWorkflow(id, { catatan: updated });
    setOrder((prev) => prev ? { ...prev, catatan: updated } : prev);
  }

  const callbacks: FarmasiOrderCallbacks = {
    onTelaahSubmit:     handleTelaahSubmit,
    onDispensasiSubmit: handleDispensasiSubmit,
    onCatatanAdd:       handleCatatanAdd,
  };

  if (!order) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
        Order tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">

      {/* ── Sidebar ── */}
      <nav
        className="flex w-52 shrink-0 flex-col overflow-y-auto border-r border-slate-100 bg-slate-50/60 pb-6"
        aria-label="Tab layanan farmasi"
      >
        <p className="mb-1 mt-4 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-400">
          Pelayanan Farmasi
        </p>
        {TABS.map((tab) => (
          <NavItem
            key={tab.id}
            tab={tab}
            active={active === tab.id}
            onClick={() => setActive(tab.id as TabId)}
          />
        ))}
      </nav>

      {/* ── Content ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1,  y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 p-4 md:p-6"
          >
            {active === "layanan" && (
              <LayananFarmasiTab order={order} callbacks={callbacks} />
            )}
            {active === "cppt" && (
              <CPPTTab initialEntries={[]} showDate={true} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
