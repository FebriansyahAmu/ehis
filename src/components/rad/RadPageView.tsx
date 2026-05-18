"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutList, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import RadBoard from "./RadBoard";

type View = "worklist" | "manajemen";

export default function RadPageView() {
  const [view, setView] = useState<View>("worklist");

  return (
    <div className="flex flex-col gap-4">
      {/* View switcher */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 self-start">
        {([
          { id: "worklist",  label: "Worklist",      icon: LayoutList },
          { id: "manajemen", label: "QC & Manajemen", icon: Settings2  },
        ] as { id: View; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold transition-all",
              view === id
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {view === "worklist" && <RadBoard />}
          {view === "manajemen" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-20 text-slate-400">
              <Settings2 size={28} className="text-slate-300" />
              <p className="text-sm font-medium">QC & Manajemen Radiologi</p>
              <p className="text-[12px] text-slate-400">Tersedia pada Tier 3</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
