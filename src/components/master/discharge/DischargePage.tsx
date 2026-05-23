"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HeartPulse, Wrench, ListChecks, Workflow, ShieldAlert,
} from "lucide-react";
import {
  MasterPageLayout, StatCard, useSkeletonDelay,
} from "@/components/master/shared";
import {
  DISCHARGE_INITIAL_STATE, DISCHARGE_SUBS,
  type DischargeSubKey, type DischargeState,
} from "@/lib/master/dischargeKlasifikasiMock";
import DischargeSidebar from "./DischargeSidebar";
import ListCollectionPane from "./panes/ListCollectionPane";
import PhasePlanningPane from "./panes/PhasePlanningPane";
import RisikoReadmisiPane from "./panes/RisikoReadmisiPane";

export default function DischargePage() {
  const loaded = useSkeletonDelay();
  const [activeKey, setActiveKey] = useState<DischargeSubKey>("homecare");
  const [state, setState] = useState<DischargeState>(DISCHARGE_INITIAL_STATE);

  const stats = useMemo(() => {
    const homecare  = state.homecare.length;
    const alatBantu = state.alatBantu.length;
    const checklist = state.checklist.length;
    const phases    = state.phases.length;
    const targets   = state.phases.reduce((sum, p) => sum + p.targets.length, 0);
    const rules     = state.risikoRules.length;
    return { homecare, alatBantu, checklist, phases, targets, rules };
  }, [state]);

  return (
    <MasterPageLayout
      loaded={loaded}
      accent="emerald"
      eyebrow="EHIS Master · Workflow & Operasional"
      title="Discharge Klasifikasi"
      description="Katalog komponen workflow discharge planning Rawat Inap — homecare, alat bantu, checklist, fase planning, dan rule engine risiko readmisi. Single source untuk DischargePlanTab & PasienPulangTab."
      stats={
        <>
          <StatCard icon={HeartPulse}  label="Homecare"      value={stats.homecare}   tone="emerald" />
          <StatCard icon={Wrench}      label="Alat Bantu"    value={stats.alatBantu}  tone="teal"    />
          <StatCard icon={ListChecks}  label="Checklist"     value={stats.checklist}  tone="sky"     />
          <StatCard icon={Workflow}    label="Fase / Target" value={`${stats.phases}/${stats.targets}`} tone="amber" />
        </>
      }
      list={<DischargeSidebar subs={DISCHARGE_SUBS} activeKey={activeKey} onSelect={setActiveKey} state={state} />}
      detail={
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeKey}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              {renderPane(activeKey, state, setState)}
            </motion.div>
          </AnimatePresence>
        </div>
      }
    />
  );
}

// ── Pane router ─────────────────────────────────────────

function renderPane(
  key: DischargeSubKey,
  state: DischargeState,
  setState: React.Dispatch<React.SetStateAction<DischargeState>>,
) {
  switch (key) {
    case "homecare":
      return (
        <ListCollectionPane
          subKey="homecare"
          entries={state.homecare}
          onChange={(homecare) => setState((p) => ({ ...p, homecare }))}
        />
      );
    case "alat-bantu":
      return (
        <ListCollectionPane
          subKey="alat-bantu"
          entries={state.alatBantu}
          onChange={(alatBantu) => setState((p) => ({ ...p, alatBantu }))}
        />
      );
    case "checklist":
      return (
        <ListCollectionPane
          subKey="checklist"
          entries={state.checklist}
          onChange={(checklist) => setState((p) => ({ ...p, checklist }))}
          hasRequired
          hasSublabel
        />
      );
    case "phase-planning":
      return (
        <PhasePlanningPane
          phases={state.phases}
          onChange={(phases) => setState((p) => ({ ...p, phases }))}
        />
      );
    case "risiko-readmisi":
      return (
        <RisikoReadmisiPane
          parameters={state.risikoParameters}
          rules={state.risikoRules}
          onRulesChange={(risikoRules) => setState((p) => ({ ...p, risikoRules }))}
        />
      );
  }
}
