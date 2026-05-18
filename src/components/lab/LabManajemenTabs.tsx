"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BeakerIcon, BookOpen, Package2, Wrench, Award, BarChart3,
  Settings2, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

import InternalQCPane from "./manajemen/InternalQCPane";
import RegisterPane   from "./manajemen/RegisterPane";
import ReagenPane     from "./manajemen/ReagenPane";
import KalibrasiPane  from "./manajemen/KalibrasiPane";
import EQAPane        from "./manajemen/EQAPane";
import LaporanPane    from "./manajemen/LaporanPane";

// ── Tab definitions ───────────────────────────────────────

interface TabDef {
  id:    string;
  label: string;
  icon:  LucideIcon;
  sub:   string;
}

const TABS: TabDef[] = [
  { id: "qc",        label: "Internal QC",         icon: BeakerIcon, sub: "Levey-Jennings · Westgard"     },
  { id: "register",  label: "Register Pemeriksaan", icon: BookOpen,   sub: "Volume · TAT statistik"        },
  { id: "reagen",    label: "Manajemen Reagen",     icon: Package2,   sub: "Stok · Lot · Kadaluarsa"       },
  { id: "kalibrasi", label: "Kalibrasi Alat",       icon: Wrench,     sub: "Jadwal · Log · Status"         },
  { id: "eqa",       label: "EQA / Proficiency",    icon: Award,      sub: "Uji profisiensi eksternal"     },
  { id: "laporan",   label: "Laporan Bulanan",      icon: BarChart3,  sub: "Manajemen RS · Dinkes"          },
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
        "mx-2 flex w-[calc(100%-16px)] cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-all duration-150",
        active
          ? "bg-sky-600 text-white shadow-sm shadow-sky-200"
          : "text-slate-500 hover:bg-sky-50 hover:text-sky-700",
      )}
    >
      <Icon size={13} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="truncate font-semibold">{tab.label}</p>
        <p className={cn("truncate text-[10px]", active ? "text-sky-200" : "text-slate-400")}>{tab.sub}</p>
      </div>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function LabManajemenTabs() {
  const [active, setActive] = useState<TabId>("qc");

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* Mobile: horizontal scroll */}
      <nav className="flex shrink-0 overflow-x-auto border-b border-slate-200 px-2 md:hidden" aria-label="Navigasi manajemen lab">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "my-1.5 flex shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-2 text-[10px] font-semibold transition-all",
                active === tab.id
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-sky-50 hover:text-sky-600",
              )}
            >
              <Icon size={13} />
              {tab.label.split(" ")[0]}
            </button>
          );
        })}
      </nav>

      {/* Desktop: vertical left nav */}
      <nav
        className="hidden w-60 shrink-0 overflow-y-auto border-r border-slate-200 py-3 md:flex md:flex-col"
        aria-label="Navigasi manajemen lab"
      >
        {/* Header */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-sky-600 px-3 py-2.5 shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <Settings2 size={13} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-sky-200">Laboratorium</p>
              <p className="text-xs font-bold leading-none text-white">QC & Manajemen</p>
            </div>
          </div>
        </div>

        {/* Standard labels */}
        <div className="mb-1 px-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">ISO 15189:2022 · PMK 43/2013</p>
        </div>

        {/* Tabs */}
        <div className="space-y-0.5">
          {TABS.map((tab) => (
            <NavItem
              key={tab.id} tab={tab}
              active={active === tab.id}
              onClick={() => setActive(tab.id)}
            />
          ))}
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
            {active === "qc"        && <InternalQCPane />}
            {active === "register"  && <RegisterPane   />}
            {active === "reagen"    && <ReagenPane      />}
            {active === "kalibrasi" && <KalibrasiPane   />}
            {active === "eqa"       && <EQAPane         />}
            {active === "laporan"   && <LaporanPane     />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
