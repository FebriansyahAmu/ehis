"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  SUBPAGE_REGISTRY, type SubpageKey, getSubpage,
} from "./mappingShared";
import MappingHubSidebar from "./MappingHubSidebar";
import SDMAssignmentPane from "./sdm/SDMAssignmentPane";
import ComingSoonPane from "./ComingSoonPane";
import DensityToggle, { useDensity } from "./DensityToggle";

// ── Skeleton ───────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Bone className="h-4 w-44" />
          <Bone className="h-3 w-72" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-4">
        <Bone className="h-full w-[260px]" />
        <Bone className="h-full flex-1" />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function MappingHubPage() {
  const [activeKey, setActiveKey] = useState<SubpageKey>("sdm");
  const [loaded, setLoaded] = useState(false);
  const { density, setDensity, mounted } = useDensity();

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(t);
  }, []);

  // Hindari flash dengan default density saat server-side / sebelum mount
  const dataDensity = mounted ? density : "comfortable";

  return (
    <div data-density={dataDensity} className="flex h-full flex-col">
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <PageSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex h-full flex-col gap-4 p-6"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex shrink-0 items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="m-mini font-semibold uppercase tracking-widest text-teal-600">
                  EHIS Master
                </p>
                <h1 className="mt-0.5 m-lg font-bold text-slate-900">Mapping Hub</h1>
                <p className="mt-0.5 m-xs text-slate-500">
                  Satu pintu untuk mengelola semua relasi antar entitas master — penugasan SDM,
                  kewenangan klinis, tarif, formularium, dan distribusi.
                </p>
              </div>
              <DensityToggle density={density} onChange={setDensity} />
            </motion.div>

            {/* Body: Sidebar + Content */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
              <MappingHubSidebar activeKey={activeKey} onSelect={setActiveKey} />

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeKey}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="flex min-h-0 flex-1 flex-col"
                  >
                    {renderPane(activeKey)}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function renderPane(key: SubpageKey) {
  if (key === "sdm") return <SDMAssignmentPane />;

  // Untuk 6 sub-page lain → ComingSoonPane
  const config = getSubpage(key);
  return (
    <div className="flex min-h-0 flex-1 items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ComingSoonPane config={config} />
    </div>
  );
}

// Silence unused warning if registry shifts later
void SUBPAGE_REGISTRY;
