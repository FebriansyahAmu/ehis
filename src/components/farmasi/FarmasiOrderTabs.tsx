"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, FileText, Activity, ShieldAlert, ClipboardList, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deriveResepOrders, updateFarmasiWorkflow,
  type FarmasiOrder, type TelaahData,
  type FarmasiOrderItem, type SerahTerima, type CatatanFarmasi,
} from "./farmasiShared";
import { updateOrderStatus } from "@/components/shared/medical-records/daftarOrder/daftarOrderShared";
import { ingestFarmasiOrder } from "@/lib/billing/chargeIngest";
import CPPTTab           from "@/components/shared/medical-records/CPPTTab";
import LayananFarmasiTab from "./tabs/LayananFarmasiTab";
import PTOPane           from "./tabs/PTOPane";
import MESOPane          from "./tabs/MESOPane";
import DRPPane           from "./tabs/DRPPane";

// ── Tab definitions ───────────────────────────────────────

interface TabDef { id: string; label: string; icon: LucideIcon; group: "workflow" | "klinis" }

const TABS: TabDef[] = [
  { id: "layanan", label: "Layanan Farmasi",       icon: Pill,          group: "workflow" },
  { id: "cppt",    label: "CPPT Apoteker",          icon: FileText,      group: "workflow" },
  { id: "pto",     label: "Monitoring Terapi",      icon: Activity,      group: "klinis"  },
  { id: "meso",    label: "Pelaporan ESO",           icon: ShieldAlert,   group: "klinis"  },
  { id: "drp",     label: "Masalah Terkait Obat",   icon: ClipboardList, group: "klinis"  },
];

type TabId = "layanan" | "cppt" | "pto" | "meso" | "drp";

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

function GroupSeparator({ label }: { label: string }) {
  return (
    <p className="mb-1 mt-3 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-400">
      {label}
    </p>
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
    // BL6.1 — silent wiring ke Billing. Idempotent (dedupe by sourceRef).
    if (order) {
      const result = ingestFarmasiOrder({
        ...order,
        items,
        serahTerima,
        status: "Selesai",
        timestamps: { ...(order.timestamps ?? { masuk: order.tanggal }), serahTerima: serahTerima.waktu },
      });
      if (result.ok && result.added > 0) {
        // eslint-disable-next-line no-console
        console.info(
          `[Billing] Farmasi ${order.noOrder} → invoice ${result.invoiceId} (+${result.added} charges, ${result.skipped} skipped)`,
        );
      }
    }
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
        <GroupSeparator label="Pelayanan Farmasi" />
        {TABS.filter((t) => t.group === "workflow").map((tab) => (
          <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id as TabId)} />
        ))}
        <GroupSeparator label="Klinis" />
        {TABS.filter((t) => t.group === "klinis").map((tab) => (
          <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id as TabId)} />
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
            {active === "layanan" && <LayananFarmasiTab order={order} callbacks={callbacks} />}
            {active === "cppt"    && <CPPTTab initialEntries={[]} showDate={true} />}
            {active === "pto"     && <PTOPane  items={order.items} noRM={order.noRM} />}
            {active === "meso"    && <MESOPane order={order} />}
            {active === "drp"     && <DRPPane  order={order} />}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
