"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Camera, FileText, Award,
  History, Radiation, Monitor, Syringe, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type RadOrder, RAD_STATUS_CFG } from "./radShared";

import VerifikasiPane  from "./tabs/VerifikasiPane";
import AkuisisiPane    from "./tabs/AkuisisiPane";
import EkspertasiPane  from "./tabs/EkspertasiPane";
import ValidasiPane    from "./tabs/ValidasiPane";
import RiwayatRadPane  from "./tabs/RiwayatRadPane";
import ViewerPane      from "./tabs/ViewerPane";
import KontrasPane     from "./tabs/KontrasPane";

// ── Tab definitions ───────────────────────────────────────

interface TabDef {
  id:    string;
  label: string;
  icon:  LucideIcon;
  step?: number;
  group: "workflow" | "klinis" | "dokumen";
}

const TABS: TabDef[] = [
  { id: "verifikasi",  label: "Verifikasi Identitas", icon: ShieldCheck, step: 1, group: "workflow" },
  { id: "akuisisi",    label: "Akuisisi & Dosis",       icon: Camera,      step: 3, group: "workflow" },
  { id: "ekspertasi",  label: "Expertise SpRad",        icon: FileText,    step: 4, group: "workflow" },
  { id: "validasi",    label: "Validasi & Rilis",        icon: Award,       step: 5, group: "workflow" },
  { id: "viewer",      label: "Image Viewer",            icon: Monitor,              group: "klinis"   },
  { id: "kontras",     label: "Alergi Kontras",          icon: Syringe,              group: "klinis"   },
  { id: "riwayat",     label: "Riwayat & Cetak",         icon: History,              group: "dokumen"  },
];

type TabId = typeof TABS[number]["id"];

// ── Nav Item ──────────────────────────────────────────────

function NavItem({ tab, active, onClick, currentStep }: {
  tab: TabDef; active: boolean; onClick: () => void; currentStep: number;
}) {
  const Icon        = tab.icon;
  const isCompleted = tab.step !== undefined && tab.step < currentStep;
  const isCurrent   = tab.step !== undefined && tab.step === currentStep;

  return (
    <button
      onClick={onClick}
      className={cn(
        "mx-2 flex w-[calc(100%-16px)] cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-all duration-150",
        active
          ? "bg-teal-600 text-white shadow-sm shadow-teal-200"
          : isCompleted
            ? "text-emerald-600 hover:bg-emerald-50"
            : "text-slate-500 hover:bg-teal-50 hover:text-teal-700",
      )}
    >
      <Icon size={13} className="shrink-0" />
      <span className="flex-1 truncate">{tab.label}</span>

      {tab.step && (
        <span className={cn(
          "ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
          active      ? "bg-white/20 text-white"          :
          isCompleted ? "bg-emerald-100 text-emerald-700" :
          isCurrent   ? "bg-teal-100 text-teal-700"       :
          "bg-slate-100 text-slate-400",
        )}>
          {isCompleted ? "✓" : tab.step}
        </span>
      )}
      {active && !tab.step && (
        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />
      )}
    </button>
  );
}

function NavDivider({ label }: { label: string }) {
  return (
    <div className="mx-3 my-2 flex items-center gap-2">
      <div className="h-px flex-1 bg-slate-100" />
      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">{label}</span>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RadOrderTabs({ order, onRefresh }: { order: RadOrder; onRefresh: () => void }) {
  const [active, setActive] = useState<TabId>("verifikasi");

  const currentStep = RAD_STATUS_CFG[order.status].step;
  const refresh = onRefresh;

  const WORKFLOW = TABS.filter((t) => t.group === "workflow");
  const KLINIS   = TABS.filter((t) => t.group === "klinis");
  const DOKUMEN  = TABS.filter((t) => t.group === "dokumen");

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">

      {/* Mobile: horizontal scroll */}
      <nav
        className="flex shrink-0 overflow-x-auto border-b border-slate-200 bg-white px-2 md:hidden"
        aria-label="Navigasi rad order"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "my-1.5 flex shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-2 text-[10px] font-semibold transition-all",
                active === tab.id
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-teal-50 hover:text-teal-600",
              )}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Desktop: vertical left nav */}
      <nav
        className="hidden w-56 shrink-0 overflow-y-auto border-r border-slate-200 bg-white py-3 md:flex md:flex-col"
        aria-label="Navigasi rad order"
      >
        {/* Branded header */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-teal-600 px-3 py-2.5 shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <Radiation size={13} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-teal-200">Radiologi</p>
              <p className="text-xs font-bold leading-none text-white">Proses Order</p>
            </div>
          </div>
        </div>

        {/* Status chip */}
        <div className="mb-2 px-3">
          <div className={cn(
            "flex items-center gap-2 rounded-lg px-2.5 py-1.5",
            RAD_STATUS_CFG[order.status].badge,
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", RAD_STATUS_CFG[order.status].dot)} />
            <span className="text-[11px] font-semibold">{RAD_STATUS_CFG[order.status].label}</span>
          </div>
        </div>

        {/* Workflow group */}
        <div className="mb-1">
          <p className="mb-1 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-400">Proses Radiologi</p>
          {WORKFLOW.map((tab) => (
            <NavItem
              key={tab.id} tab={tab}
              active={active === tab.id}
              onClick={() => setActive(tab.id)}
              currentStep={currentStep}
            />
          ))}
        </div>

        <NavDivider label="Klinis" />

        <div className="mb-1">
          {KLINIS.map((tab) => (
            <NavItem
              key={tab.id} tab={tab}
              active={active === tab.id}
              onClick={() => setActive(tab.id)}
              currentStep={currentStep}
            />
          ))}
        </div>

        <NavDivider label="Dokumen" />

        <div>
          {DOKUMEN.map((tab) => (
            <NavItem
              key={tab.id} tab={tab}
              active={active === tab.id}
              onClick={() => setActive(tab.id)}
              currentStep={currentStep}
            />
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${active}-${order.status}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {active === "verifikasi"  && <VerifikasiPane  order={order} onStatusChange={refresh} />}
            {active === "akuisisi"    && <AkuisisiPane    order={order} onStatusChange={refresh} />}
            {active === "ekspertasi"  && <EkspertasiPane  order={order} onStatusChange={refresh} />}
            {active === "validasi"    && <ValidasiPane    order={order} onStatusChange={refresh} />}
            {active === "viewer"      && <ViewerPane      order={order} />}
            {active === "kontras"     && <KontrasPane     order={order} />}
            {active === "riwayat"     && <RiwayatRadPane  order={order} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
