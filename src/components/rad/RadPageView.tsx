"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutList, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import RadInbox          from "./RadInbox";
import RadBoard          from "./RadBoard";
import RadManajemenTabs  from "./RadManajemenTabs";

type View = "worklist" | "manajemen";

export default function RadPageView() {
  const [view, setView] = useState<View>("worklist");
  const [pending, setPending] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      {/* View switcher */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 self-start">
        {([
          { id: "worklist",  label: "Worklist",      icon: LayoutList },
          { id: "manajemen", label: "QC & Manajemen", icon: Settings2  },
        ] as { id: View; label: string; icon: IconComponent }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold transition-all",
              view === id
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
            )}
          >
            <Icon size={13} />
            {label}
            {/* Badge order baru belum diterima (DB) */}
            <AnimatePresence>
              {id === "worklist" && pending > 0 ? (
                <motion.span
                  key={pending}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 16 }}
                  className={cn(
                    "ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums",
                    view === id ? "bg-white text-teal-700" : "bg-rose-500 text-white",
                  )}
                >
                  {pending}
                </motion.span>
              ) : null}
            </AnimatePresence>
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
          className="flex flex-col gap-4"
        >
          {view === "worklist" && (
            <>
              <RadInbox onPendingChange={setPending} />
              <RadBoard />
            </>
          )}
          {view === "manajemen" && <RadManajemenTabs />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
