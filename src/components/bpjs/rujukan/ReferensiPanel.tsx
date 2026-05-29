"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookMarked, Layers, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { KhususContent } from "./ListRujukanKhususPanel";
import ListSpesialistikPanel from "./ListSpesialistikPanel";
import ListSaranaPanel from "./ListSaranaPanel";

// ── Types ──────────────────────────────────────────────

type TabKey = "khusus" | "spesialistik" | "sarana";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "khusus",       label: "Khusus Kronik", icon: BookMarked },
  { key: "spesialistik", label: "Spesialistik",  icon: Layers     },
  { key: "sarana",       label: "Sarana Faskes", icon: Building2  },
];

// ── Slide direction per tab ───────────────────────────

const TAB_ORDER: Record<TabKey, number> = { khusus: 0, spesialistik: 1, sarana: 2 };

function slideX(prev: TabKey, next: TabKey): number {
  return TAB_ORDER[next] > TAB_ORDER[prev] ? 10 : -10;
}

// ── Component ──────────────────────────────────────────

export default function ReferensiPanel() {
  const [tab, setTab] = useState<TabKey>("khusus");
  const [prev, setPrev] = useState<TabKey>("khusus");

  function switchTab(next: TabKey) {
    if (next === tab) return;
    setPrev(tab);
    setTab(next);
  }

  const dir = slideX(prev, tab);

  return (
    <div className="flex h-full flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Panel header */}
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <p className="text-xs font-bold text-slate-800">Referensi Data</p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          Rujukan khusus kronik · Spesialistik V-Claim · Sarana faskes
        </p>
      </div>

      {/* Tab bar */}
      <div className="shrink-0 flex gap-1 border-b border-slate-100 bg-slate-50/50 px-3 py-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => switchTab(key)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all",
              tab === key
                ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
            )}
          >
            <Icon size={10} strokeWidth={2.5} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {tab === "khusus" && (
            <motion.div
              key="khusus"
              initial={{ opacity: 0, x: dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col"
            >
              <KhususContent />
            </motion.div>
          )}
          {tab === "spesialistik" && (
            <motion.div
              key="spesialistik"
              initial={{ opacity: 0, x: dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col"
            >
              <ListSpesialistikPanel />
            </motion.div>
          )}
          {tab === "sarana" && (
            <motion.div
              key="sarana"
              initial={{ opacity: 0, x: dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col"
            >
              <ListSaranaPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
