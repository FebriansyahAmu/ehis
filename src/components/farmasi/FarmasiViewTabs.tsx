"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, ShieldAlert, BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import FarmasiBoard       from "./FarmasiBoard";
import FarmasiQueueBoard  from "./antrean/FarmasiQueueBoard";
import RegisterNarPsiPane from "./narPsi/RegisterNarPsiPane";
import PIOPane            from "./pio/PIOPane";

type FarmasiMainTab = "antrean" | "worklist" | "narpsi" | "pio";

const TABS: { id: FarmasiMainTab; label: string; icon: React.ElementType; sub: string }[] = [
  { id: "antrean",  label: "Antrean Farmasi",                   icon: Users,       sub: "Panggil · Siapkan (T6) · Serah (T7)" },
  { id: "worklist", label: "Worklist Order",                    icon: LayoutGrid,  sub: "Telaah · Dispensasi · Serah Terima" },
  { id: "narpsi",   label: "Register Narkotika / Psikotropika", icon: ShieldAlert, sub: "UU 35/2009 · PMK 3/2015"            },
  { id: "pio",      label: "Pelayanan Informasi Obat",          icon: BookOpen,    sub: "PMK 72/2016 Ps. 27-29"              },
];

export default function FarmasiViewTabs() {
  const [active, setActive] = useState<FarmasiMainTab>("antrean");

  return (
    <div className="flex flex-col gap-5">
      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left transition-all duration-150",
                isActive
                  ? "border-sky-200 bg-sky-50 text-sky-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
              )}
            >
              <Icon size={15} className={isActive ? "text-sky-600" : "text-slate-400"} aria-hidden />
              <div>
                <p className={cn("text-xs font-bold leading-none", isActive ? "text-sky-700" : "text-slate-600")}>
                  {tab.label}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">{tab.sub}</p>
              </div>
              {isActive && (
                <span className="ml-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {active === "antrean"  && <FarmasiQueueBoard />}
          {active === "worklist" && <FarmasiBoard />}
          {active === "narpsi"   && <RegisterNarPsiPane />}
          {active === "pio"      && <PIOPane />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
