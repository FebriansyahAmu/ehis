"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, CreditCard, Package, Navigation, Car,
  Upload, Printer, Trash2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KunjunganRecord } from "@/lib/data";
import { OverviewTab } from "./Tabs/OverviewTab";
import {
  PenjaminForm, PaketForm, RujukanForm, KecelakaanForm,
  UpdateSEPForm, CetakTab, HapusForm,
} from "./Tabs/ActionForms";

// ─── Tab definitions ──────────────────────────────────────────

type TabId =
  | "overview"
  | "penjamin" | "paket" | "rujukan" | "kecelakaan"
  | "update-sep" | "cetak" | "hapus";

interface TabDef {
  id: TabId;
  label: string;
  icon: LucideIcon;
  variant?: "warning" | "danger";
}

const INFO_TABS: TabDef[] = [
  { id: "overview", label: "Ringkasan & Info", icon: ClipboardList },
];

const AKSI_TABS: TabDef[] = [
  { id: "penjamin",   label: "Ubah Penjamin",     icon: CreditCard              },
  { id: "paket",      label: "Ubah Paket",         icon: Package                 },
  { id: "rujukan",    label: "Surat Rujukan",       icon: Navigation              },
  { id: "kecelakaan", label: "Data Kecelakaan",     icon: Car, variant: "warning" },
];

const MGMT_TABS: TabDef[] = [
  { id: "update-sep", label: "Update SEP",     icon: Upload                  },
  { id: "cetak",      label: "Cetak Dokumen",  icon: Printer                 },
  { id: "hapus",      label: "Hapus Kunjungan", icon: Trash2, variant: "danger" },
];

// ─── NavItem ──────────────────────────────────────────────────

function NavItem({
  tab,
  active,
  onClick,
}: {
  tab: TabDef;
  active: boolean;
  onClick: () => void;
}) {
  const Icon      = tab.icon;
  const isDanger  = tab.variant === "danger";
  const isWarning = tab.variant === "warning";

  return (
    <button
      onClick={onClick}
      className={cn(
        "mx-2 flex w-[calc(100%-16px)] cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-all duration-150",
        active
          ? isDanger
            ? "bg-rose-600 text-white shadow-sm shadow-rose-200"
            : isWarning
            ? "bg-amber-500 text-white shadow-sm shadow-amber-200"
            : "bg-sky-600 text-white shadow-sm shadow-sky-200"
          : isDanger
          ? "text-rose-500 hover:bg-rose-50 hover:text-rose-700"
          : isWarning
          ? "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
          : "text-slate-500 hover:bg-sky-50 hover:text-sky-700",
      )}
    >
      <Icon size={14} className="shrink-0" />
      <span className="truncate">{tab.label}</span>
    </button>
  );
}

// ─── Group label ──────────────────────────────────────────────

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 mt-4 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-400 first:mt-2">
      {children}
    </p>
  );
}

// ─── Content renderer ─────────────────────────────────────────

function TabContent({
  active,
  kunjungan,
  icdCodes,
}: {
  active: TabId;
  kunjungan: KunjunganRecord;
  icdCodes: string[];
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex-1 p-4 md:p-6"
      >
        {active === "overview"    && <OverviewTab kunjungan={kunjungan} icdCodes={icdCodes} />}
        {active === "penjamin"    && <PenjaminForm kunjungan={kunjungan} />}
        {active === "paket"       && <PaketForm kunjungan={kunjungan} />}
        {active === "rujukan"     && <RujukanForm kunjungan={kunjungan} />}
        {active === "kecelakaan"  && <KecelakaanForm />}
        {active === "update-sep"  && <UpdateSEPForm kunjungan={kunjungan} />}
        {active === "cetak"       && <CetakTab kunjungan={kunjungan} />}
        {active === "hapus"       && <HapusForm kunjungan={kunjungan} />}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main export ──────────────────────────────────────────────

export default function KunjunganTabs({
  kunjungan,
  icdCodes,
}: {
  kunjungan: KunjunganRecord;
  icdCodes: string[];
}) {
  const [active, setActive] = useState<TabId>("overview");

  return (
    <div className="flex min-h-0 flex-1">

      {/* ── Left sidebar ── */}
      <nav
        className="flex w-52 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white pb-6"
        aria-label="Navigasi kunjungan"
      >
        <GroupLabel>Informasi</GroupLabel>
        {INFO_TABS.map(tab => (
          <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id)} />
        ))}

        <GroupLabel>Aksi kunjungan</GroupLabel>
        {AKSI_TABS.map(tab => (
          <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id)} />
        ))}

        <GroupLabel>Manajemen</GroupLabel>
        {MGMT_TABS.map(tab => (
          <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id)} />
        ))}
      </nav>

      {/* ── Content area ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <TabContent active={active} kunjungan={kunjungan} icdCodes={icdCodes} />
      </div>

    </div>
  );
}
