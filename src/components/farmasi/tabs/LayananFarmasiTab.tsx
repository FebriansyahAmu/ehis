"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, Package, FileText, History,
  Check, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type FarmasiOrder, type FarmasiOrderItem, type SerahTerima,
} from "@/components/farmasi/farmasiShared";
import type { FarmasiOrderCallbacks } from "@/components/farmasi/FarmasiOrderTabs";
import TelaahPane          from "./layananFarmasi/TelaahPane";
import DispensingSerahPane from "./layananFarmasi/DispensingSerahPane";
import DokumenPane         from "./layananFarmasi/DokumenPane";
import RiwayatResepPane    from "./layananFarmasi/RiwayatResepPane";

// ── Tab definitions ───────────────────────────────────────

type SubTabId = "telaah" | "dispensing" | "dokumen" | "riwayat";

interface SubTab {
  id:      SubTabId;
  label:   string;
  icon:    LucideIcon;
  step:    number | null;
}

const SUB_TABS: SubTab[] = [
  { id: "telaah",     label: "Telaah Resep",      icon: ClipboardCheck, step: 1    },
  { id: "dispensing", label: "Dispensing & Serah", icon: Package,        step: 2    },
  { id: "dokumen",    label: "Dokumen",            icon: FileText,       step: 3    },
  { id: "riwayat",    label: "Riwayat Resep",      icon: History,        step: null },
];

function isDone(tabId: string, order: FarmasiOrder): boolean {
  if (tabId === "telaah")     return order.telaah?.result === "Disetujui";
  if (tabId === "dispensing") return order.status === "Selesai";
  return false;
}

// ── Tab button ────────────────────────────────────────────

interface TabBtnProps { tab: SubTab; active: boolean; done: boolean; onClick: () => void }

function TabBtn({ tab, active, done, onClick }: TabBtnProps) {
  const Icon = tab.icon;
  const isStep = tab.step !== null;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 px-2 sm:px-3 transition-all duration-200 min-w-0",
        active
          ? "border-sky-500 bg-sky-600 text-white shadow-md shadow-sky-200"
          : isStep && done
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border-slate-200 bg-white text-slate-500 hover:border-sky-200 hover:bg-sky-50/60 hover:text-sky-700",
      )}
    >
      {isStep ? (
        <div className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black transition-all",
          active ? "bg-white/25 text-white"
            : done  ? "bg-emerald-500 text-white"
            : "bg-slate-100 text-slate-500",
        )}>
          {done && !active ? <Check size={9} /> : tab.step}
        </div>
      ) : (
        <Icon size={13} className={cn("shrink-0", active ? "text-white" : "text-slate-400")} aria-hidden="true" />
      )}

      <p className={cn(
        "hidden sm:block text-xs font-bold truncate",
        active ? "text-white" : isStep && done ? "text-emerald-700" : "text-slate-700",
      )}>{tab.label}</p>

      {/* Mobile: show icon for step tabs (no badge on small screen) */}
      {isStep && (
        <Icon size={14} className={cn("sm:hidden shrink-0", active ? "text-white" : "")} aria-hidden="true" />
      )}
    </motion.button>
  );
}

// ── Main ──────────────────────────────────────────────────

interface Props {
  order:     FarmasiOrder;
  callbacks: FarmasiOrderCallbacks;
}

export default function LayananFarmasiTab({ order, callbacks }: Props) {
  const [active, setActive] = useState<SubTabId>("telaah");

  function handleDispensingSerah(orderId: string, items: FarmasiOrderItem[], serahTerima: SerahTerima) {
    callbacks.onDispensasiSubmit(orderId, items, serahTerima);
    setActive("dokumen");
  }

  return (
    <div className="space-y-4">
      {/* Tab nav */}
      <div className="flex gap-2" role="tablist" aria-label="Langkah pelayanan farmasi">
        {SUB_TABS.map((tab) => (
          <TabBtn
            key={tab.id}
            tab={tab}
            active={active === tab.id}
            done={isDone(tab.id, order)}
            onClick={() => setActive(tab.id)}
          />
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          role="tabpanel"
        >
          {active === "telaah"     && <TelaahPane          order={order} onSubmit={callbacks.onTelaahSubmit} />}
          {active === "dispensing" && <DispensingSerahPane order={order} onSubmit={handleDispensingSerah} />}
          {active === "dokumen"    && <DokumenPane         order={order} />}
          {active === "riwayat"    && <RiwayatResepPane    order={order} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
