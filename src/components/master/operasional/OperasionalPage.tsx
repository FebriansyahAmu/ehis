"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Droplets, UtensilsCrossed, ShieldCheck, ShieldAlert,
} from "lucide-react";
import {
  MasterPageLayout, StatCard, useSkeletonDelay,
} from "@/components/master/shared";
import {
  OPERASIONAL_INITIAL_STATE,
  type OperasionalSubKey, type OperasionalState,
} from "@/lib/master/operasionalKlinisMock";
import OperasionalSidebar from "./OperasionalSidebar";
import SumberCairanPane from "./panes/SumberCairanPane";
import DietTeksturPane from "./panes/DietTeksturPane";
import BundleHAIPane from "./panes/BundleHAIPane";
import PenyakitIsolasiPane from "./panes/PenyakitIsolasiPane";

export default function OperasionalPage() {
  const loaded = useSkeletonDelay();
  const [activeKey, setActiveKey] = useState<OperasionalSubKey>("sumber-cairan");
  const [state, setState] = useState<OperasionalState>(OPERASIONAL_INITIAL_STATE);

  const stats = useMemo(() => ({
    cairan:  state.cairan.length,
    diet:    state.dietTekstur.filter((e) => e.jenis === "Diet").length,
    tekstur: state.dietTekstur.filter((e) => e.jenis === "Tekstur").length,
    bundle:  state.bundleHAI.length,
    isolasi: state.penyakitIsolasi.length,
  }), [state]);

  return (
    <MasterPageLayout
      loaded={loaded}
      accent="slate"
      eyebrow="EHIS Master · Workflow & Operasional"
      title="Operasional Klinis"
      description="Katalog parameter operasional Rawat Inap & IGD — sumber cairan I/O, tipe diet & tekstur, bundle HAI (VAP/CAUTI/CLABSI), serta penyakit wajib isolasi. Single source untuk pencatatan klinis."
      stats={
        <>
          <StatCard icon={Droplets}        label="Cairan I/O"      value={stats.cairan}                            tone="sky"     />
          <StatCard icon={UtensilsCrossed} label="Diet / Tekstur"  value={`${stats.diet}/${stats.tekstur}`}        tone="emerald" />
          <StatCard icon={ShieldCheck}     label="Bundle HAI"      value={stats.bundle}                            tone="rose"    />
          <StatCard icon={ShieldAlert}     label="Wajib Isolasi"   value={stats.isolasi}                           tone="amber"   />
        </>
      }
      list={<OperasionalSidebar activeKey={activeKey} onSelect={setActiveKey} state={state} />}
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

function renderPane(
  key: OperasionalSubKey,
  state: OperasionalState,
  setState: React.Dispatch<React.SetStateAction<OperasionalState>>,
) {
  switch (key) {
    case "sumber-cairan":
      return (
        <SumberCairanPane
          entries={state.cairan}
          onChange={(cairan) => setState((p) => ({ ...p, cairan }))}
        />
      );
    case "diet-tekstur":
      return (
        <DietTeksturPane
          entries={state.dietTekstur}
          onChange={(dietTekstur) => setState((p) => ({ ...p, dietTekstur }))}
        />
      );
    case "bundle-hai":
      return (
        <BundleHAIPane
          entries={state.bundleHAI}
          onChange={(bundleHAI) => setState((p) => ({ ...p, bundleHAI }))}
        />
      );
    case "penyakit-isolasi":
      return (
        <PenyakitIsolasiPane
          entries={state.penyakitIsolasi}
          onChange={(penyakitIsolasi) => setState((p) => ({ ...p, penyakitIsolasi }))}
        />
      );
  }
}
