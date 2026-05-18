"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, ClipboardList, Activity, FlaskConical, FileText, Radiation, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import QCPane       from "./manajemen/QCPane";
import RegisterPane from "./manajemen/RegisterPane";
import DosisPane    from "./manajemen/DosisPane";
import EQAPane      from "./manajemen/EQAPane";
import LaporanPane  from "./manajemen/LaporanPane";

// ── Tab definitions ───────────────────────────────────────

interface TabDef { id: string; label: string; icon: LucideIcon; description: string }

const TABS: TabDef[] = [
  { id: "qc",       label: "QC Pesawat",       icon: Wrench,        description: "Kalibrasi & Uji Kesesuaian" },
  { id: "register", label: "Register",          icon: ClipboardList, description: "Statistik Pemeriksaan" },
  { id: "dosis",    label: "Log Dosis",         icon: Activity,      description: "DRL Monitoring ALARA" },
  { id: "eqa",      label: "EQA / Phantom",     icon: FlaskConical,  description: "Phantom Test Quality" },
  { id: "laporan",  label: "Laporan Bulanan",   icon: FileText,      description: "KPI & Cetak Laporan" },
];

type TabId = typeof TABS[number]["id"];

// ── Nav Item ──────────────────────────────────────────────

function NavItem({ tab, active, onClick }: {
  tab: TabDef; active: boolean; onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "mx-2 flex w-[calc(100%-16px)] cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-all duration-150",
        active
          ? "bg-teal-600 text-white shadow-sm shadow-teal-200"
          : "text-slate-500 hover:bg-teal-50 hover:text-teal-700",
      )}
    >
      <Icon size={13} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate leading-none">{tab.label}</p>
        {!active && <p className="mt-0.5 truncate text-[9px] text-slate-400">{tab.description}</p>}
      </div>
      {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RadManajemenTabs() {
  const [active, setActive] = useState<TabId>("qc");

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">

      {/* Mobile: horizontal scroll */}
      <nav className="flex shrink-0 overflow-x-auto border-b border-slate-200 bg-white px-2 md:hidden">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActive(tab.id)}
              className={cn(
                "my-1.5 flex shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-2 text-[10px] font-semibold transition-all",
                active === tab.id
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-teal-50 hover:text-teal-600",
              )}>
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Desktop: vertical left nav */}
      <nav className="hidden w-52 shrink-0 overflow-y-auto border-r border-slate-200 bg-white py-3 md:flex md:flex-col">
        {/* Branded header */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-teal-600 px-3 py-2.5 shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <Radiation size={13} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-teal-200">Radiologi</p>
              <p className="text-xs font-bold leading-none text-white">QC & Manajemen</p>
            </div>
          </div>
        </div>

        <p className="mb-1 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-400">Menu</p>

        <div className="flex flex-col gap-0.5">
          {TABS.map((tab) => (
            <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id)} />
          ))}
        </div>

        <div className="mt-auto px-3 pt-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2.5">
            <p className="text-[9px] font-bold text-slate-500">Standar Regulasi</p>
            <div className="mt-1 space-y-0.5 text-[9px] text-slate-400">
              <p>BAPETEN Perka No. 2/2018</p>
              <p>IAEA HH-19 §7</p>
              <p>PMK 1014/2008</p>
              <p>ACR Accreditation</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {active === "qc"       && <QCPane />}
            {active === "register" && <RegisterPane />}
            {active === "dosis"    && <DosisPane />}
            {active === "eqa"      && <EQAPane />}
            {active === "laporan"  && <LaporanPane />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
