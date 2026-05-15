"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope, HeartPulse, FileText, Tag, ScanLine,
  MessageSquare, ShieldCheck, ListChecks, Pill,
  FlaskConical, Radiation, ScrollText, Navigation,
  type LucideIcon, Construction,
} from "lucide-react";
import type { RJPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

import AsesmenAwalRJTab from "./tabs/AsesmenAwalRJTab";

// ── Tab definitions ───────────────────────────────────────

interface TabDef { id: string; label: string; icon: LucideIcon; done: boolean }

const REKAM_MEDIS: TabDef[] = [
  { id: "asesmen-awal",     label: "Asesmen Awal",      icon: Stethoscope,   done: true  },
  { id: "ttv",              label: "TTV",               icon: HeartPulse,    done: false },
  { id: "cppt",             label: "CPPT / SOAP",       icon: FileText,      done: false },
  { id: "diagnosa",         label: "Diagnosa",          icon: Tag,           done: false },
  { id: "pemeriksaan",      label: "Pemeriksaan Fisik", icon: ScanLine,      done: false },
  { id: "konsultasi",       label: "Konsultasi",        icon: MessageSquare, done: false },
  { id: "informed-consent", label: "Informed Consent",  icon: ShieldCheck,   done: false },
];

const LAYANAN: TabDef[] = [
  { id: "daftar-order", label: "Daftar Order",     icon: ListChecks,  done: false },
  { id: "resep",        label: "Resep & Obat",     icon: Pill,        done: false },
  { id: "order-lab",    label: "Order Lab",        icon: FlaskConical,done: false },
  { id: "order-rad",    label: "Order Radiologi",  icon: Radiation,   done: false },
  { id: "surat",        label: "Surat & Dokumen",  icon: ScrollText,  done: false },
  { id: "disposisi",    label: "Disposisi",        icon: Navigation,  done: false },
];

const ALL_TABS = [...REKAM_MEDIS, ...LAYANAN];
type TabId = typeof ALL_TABS[number]["id"];

// ── NavItem ───────────────────────────────────────────────

function NavItem({ tab, active, onClick }: { tab: TabDef; active: boolean; onClick: () => void }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "mx-2 flex w-[calc(100%-16px)] cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-all duration-150",
        active
          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
          : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-700",
      )}
    >
      <Icon size={14} className="shrink-0" />
      <span className="truncate">{tab.label}</span>
      {!tab.done && (
        <span className={cn(
          "ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400",
        )}>
          baru
        </span>
      )}
    </button>
  );
}

// ── Group label ───────────────────────────────────────────

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 mt-4 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-400 first:mt-2">
      {children}
    </p>
  );
}

// ── Placeholder ───────────────────────────────────────────

function ComingSoon({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-20 text-center"
    >
      <Construction size={32} className="mb-3 text-slate-300" />
      <p className="font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-400">Tab ini sedang dalam pengembangan</p>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RJRecordTabs({ patient }: { patient: RJPatientDetail }) {
  const [active, setActive] = useState<TabId>("asesmen-awal");

  const activeTab = ALL_TABS.find(t => t.id === active)!;

  return (
    <div className="flex min-h-0 flex-1">

      {/* ── Sidebar ── */}
      <nav
        className="flex w-52 shrink-0 flex-col overflow-y-auto border-r border-slate-100 bg-slate-50/60 pb-6"
        aria-label="Tab rekam medis"
      >
        <GroupLabel>Rekam Medis</GroupLabel>
        {REKAM_MEDIS.map(tab => (
          <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id)} />
        ))}

        <GroupLabel>Layanan</GroupLabel>
        {LAYANAN.map(tab => (
          <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id)} />
        ))}
      </nav>

      {/* ── Content ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 p-4 md:p-6"
          >
            {active === "asesmen-awal" && <AsesmenAwalRJTab patient={patient} />}
            {active !== "asesmen-awal" && <ComingSoon label={activeTab.label} />}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
